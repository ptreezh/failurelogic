#!/usr/bin/env python3
"""
认知陷阱平台 - 综合测试套件
验证整个平台的功能完整性
"""

import asyncio
import aiohttp
import time
import sys
from typing import Dict, List, Tuple, Any
import json

class ComprehensivePlatformTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = None
        self.results = []
        self.start_time = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        self.start_time = time.time()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        total_time = time.time() - self.start_time
        print(f"\n⏱️  总测试时间: {total_time:.2f}秒")
        
    async def test_health_endpoint(self) -> Tuple[bool, str]:
        """测试健康检查端点"""
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    if "status" in data and data["status"] == "healthy":
                        return True, "健康检查正常"
                    else:
                        return False, f"健康检查响应格式异常: {data}"
                else:
                    return False, f"健康检查返回状态码: {response.status}"
        except Exception as e:
            return False, f"健康检查异常: {str(e)}"
    
    async def test_scenarios_endpoint(self) -> Tuple[bool, str]:
        """测试场景端点"""
        try:
            async with self.session.get(f"{self.base_url}/scenarios/") as response:
                if response.status == 200:
                    data = await response.json()
                    if "scenarios" in data and isinstance(data["scenarios"], list):
                        count = len(data["scenarios"])
                        return True, f"获取到 {count} 个场景"
                    else:
                        return False, "场景响应格式异常"
                else:
                    return False, f"场景端点返回状态码: {response.status}"
        except Exception as e:
            return False, f"场景端点异常: {str(e)}"
    
    async def test_create_game_session(self) -> Tuple[bool, str]:
        """测试创建游戏会话"""
        try:
            # 首先获取一个场景ID
            async with self.session.get(f"{self.base_url}/scenarios/") as response:
                if response.status != 200:
                    return False, "无法获取场景列表"
                
                data = await response.json()
                if not data.get("scenarios"):
                    return False, "没有可用的场景"
                
                scenario_id = data["scenarios"][0]["id"]
            
            # 创建游戏会话
            params = {
                "scenario_id": scenario_id,
                "difficulty": "beginner"
            }
            
            async with self.session.post(f"{self.base_url}/scenarios/create_game_session", params=params) as response:
                if response.status in [200, 201]:
                    data = await response.json()
                    if data.get("success"):
                        game_id = data.get("game_id")
                        if game_id:
                            return True, f"游戏会话创建成功: {game_id}"
                        else:
                            return False, "游戏会话创建成功但缺少ID"
                    else:
                        return False, f"游戏会话创建失败: {data}"
                else:
                    return False, f"游戏会话端点返回状态码: {response.status}"
        except Exception as e:
            return False, f"创建游戏会话异常: {str(e)}"
    
    async def test_api_endpoints(self) -> List[Tuple[str, bool, str]]:
        """测试多个API端点"""
        endpoints_tests = [
            ("/api/exponential/questions", "GET", {}),
            ("/api/compound/questions", "GET", {}),
            ("/api/historical/scenarios", "GET", {}),
            ("/api/game/scenarios", "GET", {}),
        ]
        
        results = []
        for endpoint, method, payload in endpoints_tests:
            try:
                if method == "GET":
                    async with self.session.get(f"{self.base_url}{endpoint}") as response:
                        success = response.status in [200, 201]
                        msg = f"HTTP {response.status}" if success else f"HTTP {response.status}"
                elif method == "POST":
                    async with self.session.post(f"{self.base_url}{endpoint}", json=payload) as response:
                        success = response.status in [200, 201]
                        msg = f"HTTP {response.status}" if success else f"HTTP {response.status}"
                
                results.append((endpoint, success, msg))
            except Exception as e:
                results.append((endpoint, False, str(e)))
        
        return results
    
    async def test_interactive_features(self) -> Tuple[bool, str]:
        """测试互动功能"""
        try:
            # 测试互动聊天功能
            payload = {
                "user_input": "你好，我想了解指数增长",
                "test_type": "exponential"
            }
            
            async with self.session.post(f"{self.base_url}/api/interactive/chat", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if "response" in data:
                        return True, "互动功能正常"
                    else:
                        return False, "互动功能响应格式异常"
                else:
                    return False, f"互动功能返回状态码: {response.status}"
        except Exception as e:
            return False, f"互动功能异常: {str(e)}"
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("🧪 开始运行认知陷阱平台综合测试套件")
        print("="*60)
        
        # 运行基本功能测试
        tests = [
            ("健康检查", self.test_health_endpoint),
            ("场景端点", self.test_scenarios_endpoint),
            ("创建游戏会话", self.test_create_game_session),
            ("互动功能", self.test_interactive_features),
        ]
        
        for test_name, test_func in tests:
            print(f"🔍 测试 {test_name}...", end="", flush=True)
            success, message = await test_func()
            status = "✅" if success else "❌"
            print(f" {status} {message}")
            self.results.append((test_name, success, message))
        
        # 运行API端点测试
        print("\n🔍 测试多个API端点...")
        api_results = await self.test_api_endpoints()
        for endpoint, success, message in api_results:
            status = "✅" if success else "❌"
            print(f"  {status} {endpoint}: {message}")
            self.results.append((endpoint, success, message))
    
    def generate_report(self) -> str:
        """生成测试报告"""
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r[1]])
        failed_tests = total_tests - passed_tests
        
        report = []
        report.append("\n" + "="*60)
        report.append("📊 综合测试报告")
        report.append("="*60)
        report.append(f"总测试数: {total_tests}")
        report.append(f"通过: {passed_tests}")
        report.append(f"失败: {failed_tests}")
        report.append(f"成功率: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "成功率: 0%")
        
        if failed_tests > 0:
            report.append(f"\n❌ 失败的测试:")
            for name, success, message in self.results:
                if not success:
                    report.append(f"  - {name}: {message}")
        
        report.append(f"\n🌐 测试目标: {self.base_url}")
        report.append("="*60)
        
        return "\n".join(report)
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """获取摘要统计"""
        total = len(self.results)
        passed = len([r for r in self.results if r[1]])
        failed = total - passed
        
        return {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": (passed/total)*100 if total > 0 else 0,
            "target_url": self.base_url,
            "test_results": self.results
        }

async def main():
    # 从命令行参数获取URL，否则使用默认值
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    print(f"🚀 启动认知陷阱平台综合测试")
    print(f"🌐 测试目标: {base_url}")
    
    async with ComprehensivePlatformTester(base_url) as tester:
        await tester.run_all_tests()
        report = tester.generate_report()
        stats = tester.get_summary_stats()
        
        print(report)
        
        # 保存详细报告到文件
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"comprehensive_test_report_{timestamp}.json"
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(stats, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 详细报告已保存至: {filename}")
        
        # 根据测试结果返回适当的退出码
        return 1 if stats["failed"] > 0 else 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
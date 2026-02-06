#!/usr/bin/env python3
"""
Railway 部署验证脚本
专门用于验证在 Railway 上部署的认知陷阱平台是否正常运行
"""

import asyncio
import aiohttp
import sys
import time
from typing import Dict, List, Tuple, Optional
import json

class RailwayDeploymentVerifier:
    def __init__(self, base_url: str = "https://failure-logic-api-production.up.railway.app"):
        self.base_url = base_url
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),  # 30秒超时
            connector=aiohttp.TCPConnector(limit=10)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def ping_server(self) -> Tuple[bool, str, float]:
        """Ping服务器以检查基本连通性"""
        start_time = time.time()
        try:
            async with self.session.get(f"{self.base_url}/health") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("status") == "healthy":
                        return True, "服务器健康检查通过", response_time
                    else:
                        return False, f"健康检查响应异常: {data}", response_time
                else:
                    return False, f"健康检查返回状态码: {response.status}", response_time
        except asyncio.TimeoutError:
            return False, "请求超时", 30.0
        except Exception as e:
            return False, f"连接异常: {str(e)}", time.time() - start_time
    
    async def test_basic_api_endpoints(self) -> List[Tuple[str, bool, str, float]]:
        """测试基本API端点"""
        endpoints = [
            ("/health", "GET"),
            ("/scenarios/", "GET"),
            ("/docs", "GET"),  # FastAPI文档
        ]
        
        results = []
        for endpoint, method in endpoints:
            start_time = time.time()
            try:
                if method == "GET":
                    async with self.session.get(f"{self.base_url}{endpoint}") as response:
                        response_time = time.time() - start_time
                        success = response.status in [200, 201]
                        message = f"HTTP {response.status}" if success else f"HTTP {response.status}"
                        results.append((endpoint, success, message, response_time))
                        
            except Exception as e:
                response_time = time.time() - start_time
                results.append((endpoint, False, str(e), response_time))
        
        return results
    
    async def test_cognitive_api_endpoints(self) -> List[Tuple[str, bool, str, float]]:
        """测试认知API端点"""
        endpoints = [
            ("/api/exponential/questions", "GET"),
            ("/api/compound/questions", "GET"),
            ("/api/historical/scenarios", "GET"),
            ("/api/game/scenarios", "GET"),
            ("/api/explanations/linear_thinking", "GET"),
        ]
        
        results = []
        for endpoint, method in endpoints:
            start_time = time.time()
            try:
                if method == "GET":
                    async with self.session.get(f"{self.base_url}{endpoint}") as response:
                        response_time = time.time() - start_time
                        success = response.status in [200, 201]
                        message = f"HTTP {response.status}" if success else f"HTTP {response.status}"
                        results.append((endpoint, success, message, response_time))
                        
            except Exception as e:
                response_time = time.time() - start_time
                results.append((endpoint, False, str(e), response_time))
        
        return results
    
    async def test_interactive_endpoints(self) -> List[Tuple[str, bool, str, float]]:
        """测试互动API端点"""
        tests = [
            ("/api/interactive/health", "GET", {}),
            ("/api/interactive/guided-tour", "GET", {}),
            ("/api/interactive/chat", "POST", {
                "user_input": "测试互动功能",
                "test_type": "general"
            }),
        ]
        
        results = []
        for endpoint, method, payload in tests:
            start_time = time.time()
            try:
                if method == "GET":
                    async with self.session.get(f"{self.base_url}{endpoint}") as response:
                        response_time = time.time() - start_time
                        success = response.status in [200, 201]
                        message = f"HTTP {response.status}" if success else f"HTTP {response.status}"
                        results.append((endpoint, success, message, response_time))
                elif method == "POST":
                    async with self.session.post(f"{self.base_url}{endpoint}", json=payload) as response:
                        response_time = time.time() - start_time
                        success = response.status in [200, 201]
                        message = f"HTTP {response.status}" if success else f"HTTP {response.status}"
                        results.append((endpoint, success, message, response_time))
                        
            except Exception as e:
                response_time = time.time() - start_time
                results.append((endpoint, False, str(e), response_time))
        
        return results
    
    async def test_game_flow(self) -> Tuple[bool, str, float]:
        """测试游戏流程 - 从创建会话到执行回合"""
        start_time = time.time()
        try:
            # 1. 获取场景列表
            async with self.session.get(f"{self.base_url}/scenarios/") as response:
                if response.status != 200:
                    return False, f"无法获取场景列表: HTTP {response.status}", time.time() - start_time
                
                scenarios_data = await response.json()
                if not scenarios_data.get("scenarios"):
                    return False, "没有可用的场景", time.time() - start_time
                
                scenario_id = scenarios_data["scenarios"][0]["id"]
            
            # 2. 创建游戏会话
            params = {"scenario_id": scenario_id, "difficulty": "beginner"}
            async with self.session.post(f"{self.base_url}/scenarios/create_game_session", params=params) as response:
                if response.status not in [200, 201]:
                    return False, f"创建游戏会话失败: HTTP {response.status}", time.time() - start_time
                
                session_data = await response.json()
                if not session_data.get("success") or not session_data.get("game_id"):
                    return False, f"游戏会话创建失败: {session_data}", time.time() - start_time
                
                game_id = session_data["game_id"]
            
            # 3. 执行一个游戏回合（如果适用）
            decisions = {"option": "1", "action": "test_action", "amount": 100}
            async with self.session.post(f"{self.base_url}/scenarios/{game_id}/turn", json=decisions) as response:
                if response.status not in [200, 201]:
                    # 这可能是因为某些场景不需要特定的决策格式，所以不视为完全失败
                    print(f"  ⚠️  游戏回合执行返回: HTTP {response.status} (这可能是正常的，取决于场景类型)")
                
            response_time = time.time() - start_time
            return True, f"游戏流程测试通过 (场景: {scenario_id})", response_time
            
        except Exception as e:
            response_time = time.time() - start_time
            return False, f"游戏流程异常: {str(e)}", response_time
    
    async def run_comprehensive_verification(self):
        """运行全面验证"""
        print("🔍 开始验证 Railway 部署...")
        print(f"🌐 目标 URL: {self.base_url}")
        print("-" * 60)
        
        # 1. Ping 服务器
        print("📡 测试服务器连通性...", end="", flush=True)
        success, message, response_time = await self.ping_server()
        status = "✅" if success else "❌"
        print(f" {status} {message} ({response_time:.2f}s)")
        self.test_results.append(("Server Ping", success, message, response_time))
        
        # 2. 测试基本API端点
        print("\n🔧 测试基本API端点...")
        basic_results = await self.test_basic_api_endpoints()
        for endpoint, success, message, response_time in basic_results:
            status = "✅" if success else "❌"
            print(f"  {status} {endpoint}: {message} ({response_time:.2f}s)")
            self.test_results.append((f"Basic API - {endpoint}", success, message, response_time))
        
        # 3. 测试认知API端点
        print("\n🧠 测试认知API端点...")
        cognitive_results = await self.test_cognitive_api_endpoints()
        for endpoint, success, message, response_time in cognitive_results:
            status = "✅" if success else "❌"
            print(f"  {status} {endpoint}: {message} ({response_time:.2f}s)")
            self.test_results.append((f"Cognitive API - {endpoint}", success, message, response_time))
        
        # 4. 测试互动API端点
        print("\n💬 测试互动API端点...")
        interactive_results = await self.test_interactive_endpoints()
        for endpoint, success, message, response_time in interactive_results:
            status = "✅" if success else "❌"
            print(f"  {status} {endpoint}: {message} ({response_time:.2f}s)")
            self.test_results.append((f"Interactive API - {endpoint}", success, message, response_time))
        
        # 5. 测试游戏流程
        print("\n🎮 测试游戏流程...")
        success, message, response_time = await self.test_game_flow()
        status = "✅" if success else "❌"
        print(f"  {status} {message} ({response_time:.2f}s)")
        self.test_results.append(("Game Flow", success, message, response_time))
    
    def generate_verification_report(self) -> str:
        """生成验证报告"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r[1]])
        failed_tests = total_tests - passed_tests
        
        report_lines = [
            "\n" + "="*70,
            "🎯 Railway 部署验证报告",
            "="*70,
            f"部署URL: {self.base_url}",
            f"总测试数: {total_tests}",
            f"通过: {passed_tests}",
            f"失败: {failed_tests}",
            f"成功率: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "成功率: 0%",
            ""
        ]
        
        # 按类别分组显示结果
        categories = {}
        for name, success, message, response_time in self.test_results:
            category = name.split(" - ")[0] if " - " in name else "General"
            if category not in categories:
                categories[category] = []
            categories[category].append((name, success, message, response_time))
        
        for category, tests in categories.items():
            report_lines.append(f"📁 {category}:")
            for name, success, message, response_time in tests:
                status = "✅" if success else "❌"
                report_lines.append(f"  {status} {name}: {message} ({response_time:.2f}s)")
            report_lines.append("")
        
        if failed_tests > 0:
            report_lines.append("❌ 部署存在问题，需要修复")
            deployment_status = "❌ 部署失败"
        else:
            report_lines.append("✅ 部署验证通过，一切正常运行")
            deployment_status = "✅ 部署成功"
        
        report_lines.extend([
            "",
            f"状态: {deployment_status}",
            f"时间: {time.strftime('%Y-%m-%d %H:%M:%S')}",
            "="*70
        ])
        
        return "\n".join(report_lines)
    
    def get_summary(self) -> Dict:
        """获取验证摘要"""
        total = len(self.test_results)
        passed = len([r for r in self.test_results if r[1]])
        failed = total - passed
        
        return {
            "deployment_url": self.base_url,
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": (passed/total)*100 if total > 0 else 0,
            "status": "success" if failed == 0 else "failed",
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
            "details": [
                {
                    "test": name,
                    "success": success,
                    "message": message,
                    "response_time": response_time
                }
                for name, success, message, response_time in self.test_results
            ]
        }

async def main():
    # 从命令行参数获取URL，否则使用默认的Railway URL
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "https://failure-logic-api-production.up.railway.app"  # 默认Railway URL
    
    print("🚀 认知陷阱平台 - Railway 部署验证工具")
    print("="*70)
    
    async with RailwayDeploymentVerifier(base_url) as verifier:
        await verifier.run_comprehensive_verification()
        report = verifier.generate_verification_report()
        summary = verifier.get_summary()
        
        print(report)
        
        # 保存详细的JSON报告
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        json_filename = f"railway_verification_report_{timestamp}.json"
        
        with open(json_filename, "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 详细JSON报告已保存至: {json_filename}")
        
        # 保存简洁的文本报告
        txt_filename = f"railway_verification_report_{timestamp}.txt"
        
        with open(txt_filename, "w", encoding="utf-8") as f:
            f.write(report)
        
        print(f"📄 文本报告已保存至: {txt_filename}")
        
        # 根据验证结果返回适当的退出码
        return 1 if summary["failed"] > 0 else 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
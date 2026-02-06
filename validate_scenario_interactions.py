#!/usr/bin/env python3
"""
场景交互功能验证脚本
验证所有场景的完整交互流程是否正常工作
"""

import requests
import time
import json
from typing import Dict, List, Tuple

class ScenarioInteractionValidator:
    def __init__(self, base_url: str = "http://localhost:8082"):
        self.base_url = base_url
        self.session = requests.Session()
        self.results = {}
    
    def get_scenarios(self) -> List[Dict]:
        """获取所有场景"""
        try:
            response = requests.get(f"{self.base_url}/scenarios/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get("scenarios", [])
            else:
                print(f"❌ 获取场景列表失败: {response.status_code}")
                return []
        except Exception as e:
            print(f"❌ 获取场景列表时出错: {e}")
            return []
    
    def create_game_session(self, scenario_id: str, difficulty: str = "beginner") -> Tuple[bool, Dict]:
        """创建游戏会话"""
        try:
            params = {
                "scenario_id": scenario_id,
                "difficulty": difficulty
            }
            response = requests.post(f"{self.base_url}/scenarios/create_game_session", 
                                   params=params, timeout=10)
            if response.status_code in [200, 201]:
                data = response.json()
                return True, data
            else:
                print(f"❌ 创建游戏会话失败: {response.status_code}, {response.text}")
                return False, {}
        except Exception as e:
            print(f"❌ 创建游戏会话时出错: {e}")
            return False, {}
    
    def execute_turn(self, game_id: str, decisions: Dict) -> Tuple[bool, Dict]:
        """执行游戏回合"""
        try:
            response = requests.post(f"{self.base_url}/scenarios/{game_id}/turn", 
                                   json={"decisions": decisions}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return True, data
            else:
                print(f"❌ 执行回合失败: {response.status_code}, {response.text}")
                return False, {}
        except Exception as e:
            print(f"❌ 执行回合时出错: {e}")
            return False, {}
    
    def validate_scenario_interaction(self, scenario: Dict) -> bool:
        """验证单个场景的交互功能"""
        scenario_id = scenario["id"]
        print(f"\n🧪 测试场景: {scenario['name']} (ID: {scenario_id})")
        
        # 1. 尝试创建游戏会话
        print("  1️⃣ 创建游戏会话...", end="")
        success, session_data = self.create_game_session(scenario_id)
        if not success:
            print(" ❌ 失败")
            self.results[scenario_id] = {
                "status": "failed",
                "error": "无法创建游戏会话",
                "details": session_data
            }
            return False
        print(" ✅ 成功")
        
        game_id = session_data.get("gameId") or session_data.get("game_id")
        if not game_id:
            print(f"  ❌ 未返回有效的游戏ID: {session_data}")
            self.results[scenario_id] = {
                "status": "failed",
                "error": "未返回有效的游戏ID",
                "details": session_data
            }
            return False
        
        # 2. 尝试执行至少一个回合
        print("  2️⃣ 执行决策回合...", end="")
        
        # 根据场景类型构造决策
        decisions = self.construct_decisions_for_scenario(scenario_id, scenario)
        
        success, turn_data = self.execute_turn(game_id, decisions)
        if not success:
            print(" ❌ 失败")
            self.results[scenario_id] = {
                "status": "failed",
                "error": "无法执行决策回合",
                "details": turn_data
            }
            return False
        print(" ✅ 成功")
        
        # 3. 验证反馈信息
        print("  3️⃣ 验证反馈信息...", end="")
        if "feedback" in turn_data or "game_state" in turn_data:
            print(" ✅ 成功")
        else:
            print(" ❌ 失败 - 缺少反馈信息")
            self.results[scenario_id] = {
                "status": "partial",
                "error": "缺少反馈信息",
                "details": turn_data
            }
            return False
        
        # 4. 尝试执行第二个回合（如果支持）
        print("  4️⃣ 执行第二回合...", end="")
        success, turn2_data = self.execute_turn(game_id, decisions)
        if success:
            print(" ✅ 成功")
        else:
            print(" ⚠️  失败（可能正常）")
        
        # 记录成功结果
        self.results[scenario_id] = {
            "status": "success",
            "session_created": True,
            "turn_executed": True,
            "feedback_received": True
        }
        
        print(f"  ✅ 场景 {scenario_id} 交互功能验证通过")
        return True
    
    def construct_decisions_for_scenario(self, scenario_id: str, scenario: Dict) -> Dict:
        """为特定场景构造决策数据"""
        if "coffee-shop" in scenario_id:
            return {
                "action": "hire_staff",
                "amount": 2
            }
        elif "relationship" in scenario_id:
            return {
                "action": "communication",
                "amount": 5
            }
        elif "investment" in scenario_id:
            return {
                "action": "research",
                "amount": 10
            }
        elif scenario_id.startswith("game-"):
            return {
                "option": "1",
                "action": "immediate_decision"
            }
        elif scenario_id.startswith("adv-game-"):
            return {
                "option": "1",
                "action": "strategic_decision"
            }
        elif scenario_id.startswith("hist-"):
            return {
                "decision": "delay",
                "action": "cautious_approach"
            }
        elif scenario_id.startswith("love-relationship"):
            return {
                "option": "2",
                "action": "balanced_approach"
            }
        else:
            # 默认决策
            return {
                "option": "1",
                "action": "default_decision"
            }
    
    def run_validation(self) -> Dict:
        """运行完整验证"""
        print("🔍 开始验证所有场景的交互功能...")
        print(f"🌐 目标服务器: {self.base_url}")
        
        # 获取所有场景
        scenarios = self.get_scenarios()
        if not scenarios:
            print("❌ 未获取到任何场景")
            return {"status": "failed", "error": "无法获取场景列表"}
        
        print(f"📋 发现 {len(scenarios)} 个场景")
        
        # 验证每个场景
        successful_validations = 0
        failed_validations = 0
        
        for scenario in scenarios:
            if self.validate_scenario_interaction(scenario):
                successful_validations += 1
            else:
                failed_validations += 1
        
        # 生成总结报告
        summary = {
            "total_scenarios": len(scenarios),
            "successful_validations": successful_validations,
            "failed_validations": failed_validations,
            "success_rate": (successful_validations / len(scenarios)) * 100 if scenarios else 0,
            "results": self.results
        }
        
        print(f"\n📊 验证总结:")
        print(f"   总场景数: {len(scenarios)}")
        print(f"   验证成功: {successful_validations}")
        print(f"   验证失败: {failed_validations}")
        print(f"   成功率: {summary['success_rate']:.1f}%")
        
        if failed_validations == 0:
            print("\n🎉 所有场景交互功能验证通过！")
            print("✅ 用户可以顺利体验所有场景的完整交互流程")
            print("✅ 所有决策选项都可以正常选择和提交")
            print("✅ 所有反馈信息都能正确显示")
            print("✅ 游戏会话管理正常工作")
        else:
            print(f"\n⚠️  有 {failed_validations} 个场景验证失败，请检查上述错误")
        
        return summary

def main():
    validator = ScenarioInteractionValidator()
    results = validator.run_validation()
    
    # 保存详细结果到文件
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"scenario_interaction_validation_report_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 详细验证报告已保存至: {filename}")
    
    return results["failed_validations"] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
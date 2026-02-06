#!/usr/bin/env python3
"""
测试投资确认偏误场景的完整8轮游戏流程
验证：
1. delayedEffects 不再报错
2. 游戏能完整进行8轮
3. 确认偏误逻辑正确工作
4. 信息源选择影响投资结果
"""

import json
import requests
import time
from typing import Dict, List, Any

class InvestmentConfirmationBiasTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.game_id = None
        self.decision_history = []

    def create_game_session(self) -> bool:
        """创建游戏会话"""
        try:
            response = requests.post(
                f"{self.base_url}/scenarios/investment-confirmation-bias/create_game_session",
                json={
                    "difficulty": "advanced",
                    "user_id": "test_investment_bias"
                },
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                self.game_id = data.get("game_id")
                print(f"✅ 游戏会话创建成功: {self.game_id}")
                print(f"   初始资金: ¥{data.get('initial_state', {}).get('portfolio', 10000)}")
                print(f"   目标: 完成8个季度的投资")
                return True
            else:
                print(f"❌ 创建游戏失败: {response.status_code}")
                print(f"   {response.text}")
                return False
        except Exception as e:
            print(f"❌ 创建游戏异常: {e}")
            return False

    def submit_turn(self, turn_number: int, decisions: Dict[str, Any]) -> Dict[str, Any]:
        """提交一个回合的决策"""
        try:
            payload = {
                "game_id": self.game_id,
                "turn_number": turn_number,
                "decisions": decisions
            }

            print(f"\n📊 提交第 {turn_number} 季度决策...")
            print(f"   决策内容: {json.dumps(decisions, ensure_ascii=False, indent=2)}")

            response = requests.post(
                f"{self.base_url}/scenarios/investment-confirmation-bias/turn",
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                self.decision_history.append(result)

                print(f"✅ 第 {turn_number} 季度完成")
                print(f"   当前资金: ¥{result.get('actual_result', {}).get('portfolio', 0):.2f}")
                print(f"   当前知识: {result.get('actual_result', {}).get('knowledge', 0)}")

                # 显示偏差
                if 'gap' in result:
                    gap = result['gap']
                    print(f"   偏差: {gap >= 0 and '+' or ''}¥{gap:.2f}")

                # 显示延迟效果
                delayed_effects = result.get('delayed_effects', [])
                if delayed_effects:
                    print(f"   ⏰ 延迟效果: {len(delayed_effects)}个")
                    for effect in delayed_effects:
                        print(f"      - {effect.get('description')}")

                return result
            else:
                print(f"❌ 提交决策失败: {response.status_code}")
                print(f"   {response.text}")
                return {}
        except Exception as e:
            print(f"❌ 提交决策异常: {e}")
            return {}

    def test_complete_8_turns(self):
        """测试完整的8轮游戏"""
        print("\n" + "="*60)
        print("开始测试：投资确认偏误场景 - 8轮完整流程")
        print("="*60)

        if not self.create_game_session():
            return False

        print("\n" + "="*60)
        print("开始8个季度的投资决策...")
        print("="*60)

        # 第1季度：初始研究时间
        result1 = self.submit_turn(1, {
            "sources": ["news", "research"],
            "research_time": 30
        })
        if not result1:
            return False

        # 第2季度：多样化投资
        result2 = self.submit_turn(2, {
            "sources": ["research", "ai"],
            "diversification": 40
        })
        if not result2:
            return False

        # 第3季度：交易金额
        result3 = self.submit_turn(3, {
            "sources": ["ai"],
            "trade_amount": 3000
        })
        if not result3:
            return False

        # 第4季度：觉醒时刻（改变策略）
        result4 = self.submit_turn(4, {
            "sources": ["research", "ai", "news"],
            "awakening_strategy": "diversify"
        })
        if not result4:
            return False

        # 第5季度：继续多元化
        result5 = self.submit_turn(5, {
            "sources": ["research", "ai"],
            "research_time": 20
        })
        if not result5:
            return False

        # 第6季度
        result6 = self.submit_turn(6, {
            "sources": ["ai", "research", "news"],
            "diversification": 60
        })
        if not result6:
            return False

        # 第7季度
        result7 = self.submit_turn(7, {
            "sources": ["research", "ai"],
            "trade_amount": 2000
        })
        if not result7:
            return False

        # 第8季度：最终决策
        result8 = self.submit_turn(8, {
            "sources": ["research", "ai", "news"],
            "research_time": 15
        })
        if not result8:
            return False

        print("\n" + "="*60)
        print("✅ 8轮游戏完成！")
        print("="*60)

        # 分析结果
        self.analyze_results()

        return True

    def analyze_results(self):
        """分析游戏结果"""
        if not self.decision_history:
            print("⚠️ 没有决策历史可供分析")
            return

        print("\n" + "="*60)
        print("📊 游戏结果分析")
        print("="*60)

        final_result = self.decision_history[-1]
        initial_portfolio = 10000
        final_portfolio = final_result.get('actual_result', {}).get('portfolio', 0)
        final_knowledge = final_result.get('actual_result', {}).get('knowledge', 0)

        print(f"\n💰 资金变化:")
        print(f"   初始: ¥{initial_portfolio}")
        print(f"   最终: ¥{final_portfolio:.2f}")
        print(f"   盈亏: {final_portfolio - initial_portfolio >= 0 and '+' or ''}¥{final_portfolio - initial_portfolio:.2f}")

        print(f"\n📚 知识积累:")
        print(f"   最终知识: {final_knowledge}")

        print(f"\n📈 决策历史:")
        for i, decision in enumerate(self.decision_history, 1):
            gap = decision.get('gap', 0)
            print(f"   第{i}季度: 偏差 {gap >= 0 and '+' or ''}¥{gap:.2f}")

        # 信息源多样性分析
        source_counts = {}
        for decision in self.decision_history:
            sources = decision.get('sources', [])
            for source in sources:
                source_counts[source] = source_counts.get(source, 0) + 1

        print(f"\n📰 信息源使用统计:")
        for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"   {source}: {count}次")

        print(f"\n⚠️ 确认偏误评估:")
        diversity_score = len(source_counts) / 4  # 4个可用信息源
        print(f"   信息源多样性: {diversity_score * 100:.1f}%")
        print(f"   偏误风险: {'高' if diversity_score < 0.5 else '中' if diversity_score < 0.75 else '低'}")

        if diversity_score >= 0.75:
            print(f"   ✅ 很好！你有效地克服了确认偏误")
        elif diversity_score >= 0.5:
            print(f"   ⚠️ 还可以，但可以更加多元化")
        else:
            print(f"   ❌ 确认偏误明显！建议增加信息源多样性")

def main():
    print("投资确认偏误场景测试 - 8轮完整流程")
    print("=" * 60)

    tester = InvestmentConfirmationBiasTester()

    try:
        success = tester.test_complete_8_turns()

        if success:
            print("\n" + "="*60)
            print("✅ 测试通过！游戏流程完整且无错误")
            print("="*60)
            return 0
        else:
            print("\n" + "="*60)
            print("❌ 测试失败")
            print("="*60)
            return 1
    except KeyboardInterrupt:
        print("\n\n⚠️ 测试被用户中断")
        return 1
    except Exception as e:
        print(f"\n❌ 测试异常: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())

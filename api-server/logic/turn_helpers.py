"""
Turn execution helpers (R5.4 split from start.py).

Functions moved from api-server/start.py to reduce its size.
Pure utility functions with no side effects on global state.
"""

from typing import Dict, List, Optional


def detect_decision_pattern(scenario_id: str, decision_history: List[Dict]) -> Optional[Dict]:
    """检测用户在决策历史中的模式"""
    if len(decision_history) < 2:
        return None

    # 分析决策模式
    options_chosen = [d.get("decisions", {}).get("option", "") for d in decision_history if "decisions" in d]
    actions_chosen = [d.get("decisions", {}).get("action", "") for d in decision_history if "decisions" in d]

    # 检测连续选择相同类型的激进选项
    if len(options_chosen) >= 2:
        aggressive_count = sum(1 for opt in options_chosen if opt == "1")  # option 1 通常是激进/立即
        if aggressive_count >= 2:
            return {
                "pattern_type": "激进/立即决策模式",
                "evidence": f"连续{aggressive_count}次选择激进/立即选项",
                "significance": "高"
            }

    # 检测连续选择保守选项
    if len(options_chosen) >= 2:
        conservative_count = sum(1 for opt in options_chosen if opt in ["2", "4"])  # option 2/4 通常是稳健/合作
        if conservative_count >= 2:
            return {
                "pattern_type": "保守/稳健决策模式",
                "evidence": f"连续{conservative_count}次选择保守选项",
                "significance": "中"
            }

    # 针对特定场景的模式检测
    if "coffee-shop" in scenario_id:
        amounts = [d.get("decisions", {}).get("amount", 0) for d in decision_history if "decisions" in d]
        if amounts and max(amounts) > 6:
            return {
                "pattern_type": "高投入决策模式",
                "evidence": f"投入了{max(amounts)}个单位，远超常规规模",
                "significance": "高"
            }

    return None


def generate_confusion_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    turn_number: int
) -> str:
    """生成困惑时刻反馈（第1-2回合）- 只展示结果，不揭示偏误"""

    # 计算变化
    satisfaction_change = new_state["satisfaction"] - old_state["satisfaction"]
    resources_change = new_state["resources"] - old_state["resources"]

    # 咖啡店场景的困惑反馈
    if scenario_id == "coffee-shop-nonlinear-effects":
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if action == "hire_staff":
            if turn_number == 1 and amount <= 3:
                return f"""
你雇了{amount}人，满意度从{old_state['satisfaction']}提升到{new_state['satisfaction']}。

投入{amount}人 → +{satisfaction_change}点满意度
效果：每人带来{satisfaction_change // amount}点提升

这个结果符合你的预期吗？
            """
            elif turn_number == 2 and amount > 3:
                expected_gain = amount * 8  # 用户可能预期的增长
                actual_gain = satisfaction_change
                return f"""
你雇了{amount}人，期望满意度大幅提升。
但实际只提升了{actual_gain}点（从{old_state['satisfaction']}到{new_state['satisfaction']}）。

投入{amount}人 → +{actual_gain}点满意度
效果：每人只带来{actual_gain // amount}点提升

🤔 你是否感到意外？
投入翻倍（{amount // 2}→{amount}），但效果没有翻倍。

在复杂系统中，效果往往不是简单的线性关系。
            """

    # game-001的困惑反馈
    elif scenario_id == "game-001":
        option = decisions.get("option", "")
        if option == "1":  # 立即投放市场
            return f"""
你选择了立即投放市场抢占先机。

结果：
- 销量: 超出预期 ✓
- 质量: 出现问题 ✗
- 满意度: {old_state['satisfaction']} → {new_state['satisfaction']} ({satisfaction_change:+d})
- 声誉: {old_state['reputation']} → {new_state['reputation']} ({new_state['reputation'] - old_state['reputation']:+d})

市场反应混合。这个结果符合你的预期吗？
            """

    # 默认困惑反馈
    return f"""
你的决策已执行。

状态变化：
- 满意度: {old_state['satisfaction']} → {new_state['satisfaction']} ({satisfaction_change:+d})
- 资源: {old_state['resources']} → {new_state['resources']} ({resources_change:+d})

继续观察后续效果...
    """





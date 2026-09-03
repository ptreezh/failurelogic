"""
决策模式追踪器
从 api-server/start.py 提取 (R2.1 部分拆分)

- DecisionPatternTracker: 追踪用户单场景决策模式
- CrossScenarioAnalyzer: 跨场景模式聚合
"""

from collections import defaultdict
from typing import Dict, List, Optional


class DecisionPatternTracker:
    """追踪用户的决策模式，识别决策倾向"""

    def __init__(self):
        self.patterns = {
            "risk_preference": [],      # 风险偏好: 保守/中性/激进
            "pace_preference": [],      # 节奏偏好: 立即/谨慎/延迟
            "information_style": [],    # 信息风格: 选择性/全面
            "decision_consistency": [], # 决策一致性
            "overconfidence_signals": [] # 自信度过高信号
        }

    def track_decision(self, scenario_id: str, decision: Dict, context: Dict):
        """记录单次决策并更新模式"""
        option = decision.get("option", "")
        action = decision.get("action", "")

        if option in ["1", "2", "3", "4"]:
            if option == "1":
                self.patterns["risk_preference"].append("激进")
                self.patterns["pace_preference"].append("立即")
            elif option == "2":
                self.patterns["risk_preference"].append("稳健")
                self.patterns["pace_preference"].append("谨慎")
            elif option == "3":
                self.patterns["risk_preference"].append("中等")
                self.patterns["pace_preference"].append("平衡")
            else:
                self.patterns["risk_preference"].append("保守")
                self.patterns["pace_preference"].append("合作")

        if len(self.patterns["risk_preference"]) >= 3:
            last_3 = self.patterns["risk_preference"][-3:]
            if len(set(last_3)) == 1:
                self.patterns["decision_consistency"].append("高度一致")
            elif len(set(last_3)) == 2:
                self.patterns["decision_consistency"].append("中度一致")
            else:
                self.patterns["decision_consistency"].append("多样化")

    def generate_personalized_insight(self) -> str:
        """生成个性化洞察反馈"""
        if not self.patterns["risk_preference"]:
            return ""

        insights = []
        if len(self.patterns["risk_preference"]) >= 3:
            recent_risks = self.patterns["risk_preference"][-3:]
            aggressive_count = sum(1 for r in recent_risks if r == "激进")
            conservative_count = sum(1 for r in recent_risks if r == "保守")
            if aggressive_count >= 2:
                insights.append("📊 你的决策模式分析：\n你最近倾向于选择高风险选项。这显示了你的风险偏好。")
            elif conservative_count >= 2:
                insights.append("📊 你的决策模式分析：\n你最近倾向于选择保守选项。这显示了你的风险偏好。")

        if len(self.patterns["decision_consistency"]) >= 2:
            recent_consistency = self.patterns["decision_consistency"][-1]
            if recent_consistency == "高度一致":
                insights.append("⚠️ 你连续多次选择了相似的策略，可能陷入了思维定势。")

        return "\n\n".join(insights) if insights else ""


class CrossScenarioAnalyzer:
    """分析用户在多个场景中的决策模式"""

    def __init__(self):
        self.scenario_patterns = {}  # scenario_id -> detected_pattern
        self.pattern_frequency = defaultdict(list)  # pattern_type -> [scenario_ids]

    def record_pattern(self, scenario_id: str, pattern_type: str):
        """记录场景中检测到的决策模式"""
        self.scenario_patterns[scenario_id] = pattern_type
        self.pattern_frequency[pattern_type].append(scenario_id)

    def generate_cross_scenario_insight(self, user_scenarios: List[str]) -> str:
        """生成跨场景洞察"""
        if not user_scenarios:
            return ""
        user_patterns = {}
        for scenario_id in user_scenarios:
            if scenario_id in self.scenario_patterns:
                pattern = self.scenario_patterns[scenario_id]
                user_patterns.setdefault(pattern, []).append(scenario_id)

        insights = []
        for pattern, scenarios in user_patterns.items():
            if len(scenarios) >= 2:
                scenario_names = [
                    s.split("-")[0].replace("game", "游戏").replace("adv", "高级").replace("hist", "历史")
                    for s in scenarios
                ]
                insights.append(f"""
🔗 跨场景模式发现：
你在{len(scenarios)}个不同场景中都表现出**{pattern}**：
- {", ".join(scenario_names)}

这说明：{pattern}是你决策中的系统性模式。

💡 系统性建议：在未来的决策中，刻意问自己："我是否又在采用{pattern}？"
""")
        return "\n".join(insights) if insights else ""

"""
Real feedback generation (R6.3 split from start.py).

3 functions moved from api-server/start.py:
- generate_real_feedback: per-scenario feedback text
- generate_pattern_analysis_feedback: layer 2 (turn 3) reveal biases
- generate_advanced_feedback: layer 3 (turn 4+) personalized

All functions are pure: take inputs, return string.
"""

from typing import Dict, List, Optional

from logic.pattern_tracker import DecisionPatternTracker


def generate_pattern_analysis_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    pattern_detected: Optional[Dict]
) -> str:
    """生成决策模式分析反馈（第3回合）"""

    if not pattern_detected:
        # 如果没有检测到明显模式，提供一般性反馈
        return generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    base_feedback = generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    # 添加模式分析
    pattern_analysis = f"""

🔍 **决策模式分析**

经过{len(decision_history)}回合的观察，系统识别到：

🎯 **识别的决策模式**: {pattern_detected['pattern_type']}

📊 **证据**: {pattern_detected['evidence']}

⚠️ **重要性**: {pattern_detected['significance']}

这是你在当前场景中的决策特点。这种模式不仅在这个场景中出现，
在你的其他决策中也可能存在类似情况。

继续下一个回合，系统将提供更深入的个性化分析。
"""

    return base_feedback + bias_reveal




def generate_advanced_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    decision_history: List[Dict],
    pattern_tracker: Optional[DecisionPatternTracker],
    turn_number: int
) -> str:
    """生成高级个性化反馈（第4+回合）"""

    # 基础反馈
    base_feedback = generate_real_feedback(scenario_id, decisions, old_state, new_state, "beginner")

    # 添加模式分析
    additional_insight = ""

    if pattern_tracker:
        pattern_insight = pattern_tracker.generate_personalized_insight()
        if pattern_insight:
            additional_insight += f"\n\n{pattern_insight}"

    # 添加跨场景洞察（如果用户玩过多个场景）
    if turn_number >= 4:
        cross_scenario_insight = cross_scenario_analyzer.generate_cross_scenario_insight(
            [scenario_id]  # 这里应该传入用户玩过的所有场景ID
        )
        if cross_scenario_insight:
            additional_insight += f"\n\n{cross_scenario_insight}"

    # 添加持续性建议
    if additional_insight:
        additional_insight += """

✨ **下一步建议**
继续尝试不同的决策选项，观察结果如何变化。
系统将持续追踪你的决策模式，提供更深入的洞察。
"""

    return base_feedback + additional_insight if additional_insight else base_feedback





def generate_real_feedback(
    scenario_id: str,
    decisions: Dict,
    old_state: Dict,
    new_state: Dict,
    difficulty: str = "beginner",
) -> str:
    """生成基于真实逻辑的反馈，支持不同难度级别"""
    action = decisions.get("action", "default")
    amount = decisions.get("amount", 0)

    # 计算变化值
    satisfaction_change = new_state["satisfaction"] - old_state["satisfaction"]
    resources_change = new_state["resources"] - old_state["resources"]
    knowledge_change = new_state["knowledge"] - old_state["knowledge"]

    if scenario_id == "coffee-shop-nonlinear-effects":
        if action == "hire_staff":
            if difficulty == "beginner":
                if amount > 6:
                    return "您雇佣了过多员工，导致效率下降。在复杂系统中，增加投入并不总是带来同比例回报。"
                elif amount > 3:
                    return "您增加了员工数量，但要注意边际效应递减的规律。"
                else:
                    return "合理的员工配置提升了客户满意度。"
            else:  # intermediate/advanced
                if amount > 6:
                    basic_feedback = "您雇佣了过多员工，导致效率下降。"
                    if difficulty == "intermediate":
                        additional_feedback = (
                            "在商业管理中，人员配置需要考虑非线性效应。"
                        )
                    else:  # advanced
                        additional_feedback = "复杂系统中，过多人力资源可能引发协调成本指数增长，这是连锁故障的常见原因。"
                    return basic_feedback + " " + additional_feedback
                elif amount > 3:
                    return "您增加了员工数量，但要注意边际效应递减的规律。在高级管理中，协调成本会随人员增加而快速上升。"
                else:
                    return "合理的员工配置提升了客户满意度。在复杂系统中，适度的人力配置能带来最优效果。"
        elif action == "marketing":
            if difficulty == "beginner":
                if amount > 500:
                    return "大量营销投入带来了饱和效应，收益递减明显。"
                else:
                    return "适度的营销投入有效提升了客户满意度。"
            else:  # intermediate/advanced
                if amount > 500:
                    basic_feedback = "大量营销投入带来了饱和效应，收益递减明显。"
                    if difficulty == "intermediate":
                        additional_feedback = (
                            "此外，营销投资需要考虑通胀调整后的实际价值。"
                        )
                    else:  # advanced
                        additional_feedback = "在网络效应下，营销影响力可能呈指数增长，但过度营销可能导致品牌稀释。"
                    return basic_feedback + " " + additional_feedback
                else:
                    return "适度的营销投入有效提升了客户满意度。在高难度下，营销效果可能因网络效应而放大。"
        elif action == "supply_chain" and difficulty in ["intermediate", "advanced"]:
            # 供应链管理的反馈
            supply_investment = amount
            if supply_investment > 100 and difficulty == "advanced":
                return "庞大的供应链投资可能触发网络效应，带来指数级收益，但也增加系统性风险。复杂系统中的网络效应体现了指数增长思维。"
            else:
                return "供应链管理体现了复杂系统思维。在中级难度下，协调成本随网络规模平方增长；在高级难度下，可能存在网络效应的指数收益。"

    elif scenario_id == "relationship-time-delay":
        if action == "communication":
            if difficulty == "beginner":
                return "沟通是关系维护的基础，但要注意效果的延迟性。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "沟通是关系维护的基础，但要注意效果的延迟性。长期关系投资具有复利效应，早期投入会在后期产生更大回报。"
                else:  # advanced
                    return "沟通不仅影响直接关系，还会在网络中产生级联效应。复杂关系网络中的投资具有复利和网络双重效应。"
        elif action == "gift":
            if difficulty == "beginner":
                return "礼物能带来即时的好感，但长期关系需要更多投入。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "礼物能带来即时的好感，但长期关系需要更多投入。关系投资具有复利效应，今天的投入会影响未来的回报。"
                else:  # advanced
                    return "礼物不仅影响直接关系，还会在社交网络中产生涟漪效应。复杂关系网络中，初始投入可能引发指数级的网络效应。"

    elif scenario_id == "investment-confirmation-bias":
        if action == "research":
            if difficulty == "beginner":
                return "研究增加了您的知识储备，但需要注意信息的全面性。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "研究增加了您的知识储备，但需要注意信息的全面性。同时，投资的实际价值需要考虑通胀调整。"
                else:  # advanced
                    return "研究增加了您的知识储备，但需要注意信息的全面性。金融系统具有复杂性，市场波动和系统性风险需要特别关注。"
        elif action == "diversify":
            if difficulty == "beginner":
                return "分散投资降低了风险，但也限制了潜在收益。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "分散投资降低了风险，但也限制了潜在收益。长期投资要考虑复利的时间价值。"
                else:  # advanced
                    return "分散投资降低了风险，但需警惕相关性幻觉。在系统性风险下，看似无关的资产可能高度相关。这是投资中的系统性风险。"

    # ===== 新增：为game-001（商业战略推理游戏）添加反馈 =====
    elif scenario_id == "game-001":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择了立即投放市场抢占先机。销量超出预期，但出现了少量质量问题报告。\n\n结果：快速上市带来了早期收益，但也暴露了产品质量问题。在商业决策中，'快'与'好'往往需要平衡，过度追求速度可能影响长期声誉。"
        elif option == "2":
            return "你选择完善产品后再上市。虽然延迟了上市时间，但产品质量更有保证。\n\n结果：产品质量得到了保障，但错失了早期市场机会。这是一种平衡质量与速度的策略。"
        elif option == "3":
            return "你选择收购竞争对手减少竞争。虽然减少了竞争压力，但成本大幅增加。\n\n结果：市场竞争减少，但高额成本可能影响盈利能力。收购整合的复杂性也需要考虑。"
        else:
            return "你选择与其他公司合作开发。虽然需要分享利润，但风险共担。\n\n结果：通过合作分散了风险并获得了互补资源，但利润需要分享。这是一种风险分担的策略。"

    # ===== 新增：为game-002（公共政策制定模拟）添加反馈 =====
    elif scenario_id == "game-002":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择了建设新地铁线路。虽然成本高，但长期效益显著。\n\n结果：基础设施投资需要平衡短期成本与长期收益。施工期间可能面临公众对扰民的不满，需要做好沟通工作。"
        elif option == "2":
            return "你选择扩大公交网络。成本适中，覆盖面广。\n\n结果：渐进式改进可能更适合当前预算和需求，通过多次小步骤优化系统。"
        elif option == "3":
            return "你选择征收拥堵费。虽然增加了收入，但引起了公众强烈不满。\n\n结果：政策制定需要平衡经济效益与公众接受度，忽视民众情绪可能影响政策实施效果。"
        else:
            return "你选择提供自行车道项目。低成本，环保健康。\n\n结果：低成本方案容易实施，但可能只能解决部分交通问题，需要与其他措施配合。"

    # ===== 新增：为game-003（个人理财决策模拟）添加反馈 =====
    elif scenario_id == "game-003":
        option = decisions.get("option", "1")
        if option == "1":
            return "你选择立即购买新车提升形象。\n\n结果：即时消费满足了当前需求，但消耗了应急资金，可能让你在意外情况下处于不利地位。"
        elif option == "2":
            return "你选择把钱全部存入银行。\n\n结果：资金安全性高，但可能面临通胀侵蚀购买力的风险。保守策略有其优势，但也可能错失增值机会。"
        elif option == "3":
            return f"你选择投入股票市场寻求高回报。当前资源：{new_state['resources']}。\n\n结果：高风险高回报，市场波动可能带来较大收益或损失。投资需要考虑风险承受能力。"
        else:
            return f"你选择投资低成本指数基金并保留应急资金。当前资源：{new_state['resources']}。\n\n结果：平衡了风险与收益，既保留了应急资金，又参与了市场增值。这是一种稳健的投资策略。"

    # ===== 新增：为hist-001（挑战者号）添加反馈 =====
    elif scenario_id == "hist-001":
        decision = decisions.get("decision", "launch")
        if decision == "delay":
            return "你选择推迟发射以评估低温风险。\n\n✅ 成功避免灾难！你的决策拯救了7名宇航员的生命。\n\n历史教训：在面对工程警告时，选择谨慎而非进度压力，可以避免悲剧。"
        else:
            return "你选择按计划发射。\n\n❌ 灾难发生了！O型环在低温下失效，航天飞机爆炸，7名宇航员遇难。\n\n历史复盘：工程师们警告了O型环在低温下的问题，但管理层选择了忽视警告，坚持发射。"

    # ===== 新增：为hist-002（泰坦尼克号）添加反馈 =====
    elif scenario_id == "hist-002":
        decision = decisions.get("decision", "fast_route")
        if decision == "safe_route":
            return "你选择传统安全航线，避开冰山区域。\n\n✅ 航行更慢但安全到达，无事故发生。\n\n历史教训：商业考量与安全考量之间的平衡至关重要。"
        else:
            return "你选择更快的航线追求速度记录。\n\n❌ 撞上冰山，船只沉没，1500多人丧生。\n\n历史复盘：'永不沉没'的称号让人们对风险估计不足，成功记录可能让人低估失败概率。"

    # ===== 新增：为hist-003（猪湾事件）添加反馈 =====
    elif scenario_id == "hist-003":
        decision = decisions.get("decision", "covert")
        if decision == "full_support":
            return "你选择提供全面军事支持和空中掩护。\n\n⚠️ 行动成功了，但美国的直接参与暴露无遗，造成外交尴尬。\n\n这是一个两难境地：要么失败（有限支持），要么尴尬（暴露参与）。在复杂决策中，有时候没有完美选项，只有不同类型的代价。"
        else:
            return "你选择秘密行动，避免显示美国直接参与。\n\n❌ 行动迅速失败，因为大幅减少了军事支持。\n\n历史复盘：政治考量可能压倒了军事判断，决策过程中可能存在不同意见但未被充分考虑。"

    # ===== 新增：为adv-game-001（全球气候变化政策制定博弈）添加反馈 =====
    elif scenario_id == "adv-game-001":
        option = decisions.get("option", "1")
        if option == "1":
            return "你制定统一的减排目标对所有国家一视同仁。\n\n结果：发展中国家强烈反对，认为这不公平。在复杂的多方博弈中，看似'公平'的统一标准可能因为各国实际情况不同而变得不公平。"
        elif option == "2":
            return "你根据历史累计排放量制定差异化目标。\n\n结果：更符合'共同但有区别的责任'原则。但执行和监督难度大，需要考虑各国实际情况。"
        elif option == "3":
            return "你建立碳排放交易市场，允许排放权买卖。\n\n结果：市场化手段提高了效率，但可能成为富国'购买排放权'的工具。需要平衡效率与公平。"
        else:
            return "你设定技术转移机制，发达国家支持发展中国家减排。\n\n结果：促进了技术扩散和全球合作，但技术转移的速度和质量需要有效保障。"

    # ===== 新增：为adv-game-002（AI治理与监管决策模拟）添加反馈 =====
    elif scenario_id == "adv-game-002":
        option = decisions.get("option", "1")
        if option == "1":
            return "你基于任务能力制定AI分级标准。\n\n结果：实用性强，易于理解和执行。但可能忽视安全和可控性维度。需要平衡效率与安全。"
        elif option == "2":
            return "你引入安全和可控性作为核心评估维度。\n\n结果：更注重风险防控。但可能抑制创新速度。监管的力度与创新的速度之间存在张力。"
        elif option == "3":
            return "你将伦理合规性作为核心评估维度。\n\n结果：符合人类价值观。但'伦理'标准难以统一和量化。不同文化对'伦理'的理解不同，需要考虑多样性。"
        else:
            return "你建立AI能力与风险的综合评估框架。\n\n结果：平衡了多个维度。但复杂度高，执行难度大。需要在理论完整性与实践可行性之间找到平衡。"

    # ===== 新增：为adv-game-003（复杂金融市场危机应对模拟）添加反馈 =====
    elif scenario_id == "adv-game-003":
        option = decisions.get("option", "1")
        if option == "1":
            return "你立即加强金融衍生品监管。\n\n结果：预防性措施，可能在危机前遏制风险。但市场信心可能受影响，需要平衡监管与市场活力。"
        elif option == "2":
            return "你提高银行资本充足率要求。\n\n结果：增强银行抗风险能力。但可能限制信贷，影响经济活力。更高的资本要求意味着银行放贷能力下降。"
        elif option == "3":
            return "你进行秘密的系统性风险压力测试。\n\n结果：了解真实风险暴露情况。但测试结果可能引发市场恐慌。需要平衡透明度与市场稳定性。"
        else:
            return "你加强市场监控，但不采取实质措施。\n\n结果：被动等待，可能错失最佳干预时机。在危机管理中，需要在及时行动与充分信息之间找到平衡。"

    # 默认反馈
    if satisfaction_change > 10:
        base_feedback = "您的决策取得了显著成效！"
    elif satisfaction_change > 0:
        base_feedback = "您的决策产生了积极影响。"
    elif satisfaction_change < -10:
        base_feedback = "这个决策可能需要重新考虑。"
    else:
        base_feedback = "决策已执行，正在观察效果。"

    # 根据难度添加深度反馈
    if difficulty == "intermediate":
        depth_feedback = " 在中级挑战中，您开始接触时间价值和复利思维的概念。"
    elif difficulty == "advanced":
        depth_feedback = (
            " 在高级挑战中，您面临复杂系统、网络效应和指数增长等高级认知偏差。"
        )
    else:
        depth_feedback = ""

    return base_feedback + depth_feedback


# 为前端提供静态文件服务（在所有API端点之后定义）
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

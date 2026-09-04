"""
Turn executor (R7.1 moved from start.py, R9.2 documented but not refactored).

Implements execute_real_logic — the main scenario state mutation
function handling 12 scenario_id branches:
  - coffee-shop-linear-thinking (咖啡店线性思维)
  - relationship-time-delay (关系时间延迟)
  - investment-confirmation-bias (投资确认偏误)
  - game-001 / game-002 / game-003 (商业/政策/理财)
  - hist-001 / hist-002 / hist-003 (挑战者/泰坦尼克/猪湾)
  - adv-game-001 / adv-game-002 / adv-game-003 (气候/AI/金融危机)

R9.2 attempted to split into 12 helper functions but reverted due to
indentation refactoring risk. Current monolithic form is 493 lines;
see research/ROADMAP.md for planned R10+ decomposition.

Returns: mutated new_state dict with values clamped to valid ranges.
"""

from typing import Dict, Any
import random


def execute_real_logic(
    scenario_id: str, current_state: Dict, decisions: Dict, difficulty: str = "beginner"
) -> Dict:
    """执行真实的业务逻辑，支持不同难度级别。

    Dispatches to one of 12 inline branches based on scenario_id.
    Each branch mutates new_state (copy of current_state) based on
    decisions.get("action") or decisions.get("option") etc.
    """
    new_state = current_state.copy()

    # 根据不同场景和难度执行逻辑
    if scenario_id == "coffee-shop-linear-thinking":
        # 咖啡店场景：线性思维陷阱
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            # 基础难度：简单的非线性效应
            if action == "hire_staff":
                # 非线性效应：员工增加不等于满意度线性提升
                cost = amount * 200
                new_state["resources"] -= cost

                # 非线性效果：员工过多反而效率下降
                if amount <= 3:
                    satisfaction_gain = amount * 8  # 每个员工增加8点满意度
                elif amount <= 6:
                    satisfaction_gain = amount * 5  # 效率下降
                else:
                    satisfaction_gain = amount * 2  # 严重效率下降

                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_gain
                )
                new_state["reputation"] = min(
                    100, new_state["reputation"] + satisfaction_gain // 2
                )

            elif action == "marketing":
                # 营销投入的递减效应
                new_state["resources"] -= amount

                if amount <= 200:
                    effect = amount // 10  # 1:10的效果
                elif amount <= 500:
                    effect = 20 + (amount - 200) // 20  # 递减效果
                else:
                    effect = 35  # 饱和效应

                new_state["satisfaction"] = min(100, new_state["satisfaction"] + effect)
                new_state["reputation"] = min(
                    100, new_state["reputation"] + effect // 2
                )

        elif difficulty in ["intermediate", "advanced"]:
            # 高级难度：包含指数增长和复杂系统效应
            if action == "hire_staff":
                cost = amount * 200
                new_state["resources"] -= cost

                # 引入更复杂的非线性效应
                base_satisfaction = amount * 8
                # 添加效率衰减因子：更多员工导致效率下降
                efficiency_factor = 1 / (1 + 0.1 * amount)  # 随员工数增加效率下降
                satisfaction_gain = base_satisfaction * efficiency_factor

                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_gain
                )

                # 在高级难度中引入复杂系统效应
                if difficulty == "advanced":
                    # 可能引发连锁效应
                    reputation_change = satisfaction_gain // 2
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + reputation_change
                    )

                    # 添加供应商网络复杂性
                    if amount > 4:
                        # 过多员工可能导致内部协调成本增加
                        coordination_cost = min(20, (amount - 4) * 3)
                        new_state["satisfaction"] -= coordination_cost

            elif action == "marketing":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：添加通胀和时间价值的因素
                    effect = amount // 10
                    # 一段时间后营销效果会衰减
                    effect *= (1 + 0.05) ** (
                        new_state["turn_number"] // 5
                    )  # 每5回合增加5%效果
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + effect
                    )
                elif difficulty == "advanced":
                    # 高级难度：复杂网络效应和指数增长
                    effect = amount // 10
                    # 添加社交网络效应，营销效果呈指数增长
                    network_multiplier = min(
                        3, 1 + (new_state["reputation"] / 50)
                    )  # 声誉越好网络效应越强
                    effect *= network_multiplier
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + effect
                    )

            elif action == "supply_chain":
                # 供应链管理 - 高级难度特有的挑战
                if difficulty in ["intermediate", "advanced"]:
                    # 供应链中的指数增长效应
                    supply_investment = amount
                    new_state["resources"] -= supply_investment

                    # 供应商网络的复杂性
                    # 初始效益是线性的，但随着网络扩大，协调成本呈指数增长
                    supply_benefit = min(supply_investment * 0.8, 50)  # 最大50点效益
                    coordination_cost = min(
                        30, (supply_investment / 50) ** 2 * 100
                    )  # 协调成本随投资平方增长

                    net_effect = supply_benefit - coordination_cost
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + max(0, net_effect)
                    )

                    # 在高级难度中，网络效应可能带来指数收益
                    if difficulty == "advanced" and supply_investment > 100:
                        # 巨大投资可能触发网络效应，带来指数增长收益
                        network_effect = (
                            supply_investment / 100
                        ) ** 1.5 * 10  # 1.5次方增长
                        new_state["satisfaction"] = min(
                            100, new_state["satisfaction"] + network_effect
                        )

    elif scenario_id == "relationship-time-delay":
        # 关系场景：时间延迟效应
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            if action == "communication":
                # 沟通的时间成本和延迟效果
                time_cost = amount * 10
                new_state["resources"] -= time_cost

                # 即时效果较小
                immediate_effect = amount * 2
                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + immediate_effect
                )

            elif action == "gift":
                new_state["resources"] -= amount

                # 礼物的即时效果和延迟效果
                immediate_effect = amount // 20
                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + immediate_effect
                )

        elif difficulty in ["intermediate", "advanced"]:
            if action == "communication":
                time_cost = amount * 10
                new_state["resources"] -= time_cost

                if difficulty == "intermediate":
                    # 中级难度：加入关系投资的复利效应
                    immediate_effect = amount * 1.5  # 立即满意度提升
                    # 为未来回合存储长期收益
                    long_term_value = amount * 0.5  # 关系投资的长期价值
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )
                    if "relationship_investment" not in new_state:
                        new_state["relationship_investment"] = 0
                    new_state["relationship_investment"] += long_term_value

                elif difficulty == "advanced":
                    # 高级难度：复杂关系网络和级联效应
                    # 通信投资也会在社交网络中产生连锁反应
                    immediate_effect = amount * 1.2
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )

                    # 长期关系复利效应
                    if "relationship_investment" not in new_state:
                        new_state["relationship_investment"] = 0
                    # 复利效应：之前的投资现在开始产生收益
                    previous_investments_return = (
                        new_state["relationship_investment"] * 0.1
                    )
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + previous_investments_return
                    )

            elif action == "gift":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：礼物的长期复利效应
                    immediate_effect = amount // 25
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )

                    # 为未来回合存储长期效应
                    if "gift_investment" not in new_state:
                        new_state["gift_investment"] = 0
                    new_state["gift_investment"] += amount * 0.05  # 礼物投资的长期价值

                elif difficulty == "advanced":
                    # 高级难度：复杂关系网络效应
                    immediate_effect = amount // 30
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + immediate_effect
                    )

                    # 网络效应：礼物可能影响更广泛的社交圈
                    network_effect = (amount / 100) ** 1.2  # 网络效应呈指数增长
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + network_effect
                    )

    elif scenario_id == "investment-confirmation-bias":
        # 投资场景：确认偏误
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            if action == "research":
                # 研究投入增加知识但存在确认偏误
                cost = amount * 20
                new_state["resources"] -= cost

                knowledge_gain = amount * 8
                new_state["knowledge"] = min(
                    100, new_state["knowledge"] + knowledge_gain
                )

            elif action == "diversify":
                # 分散投资降低风险
                new_state["resources"] -= amount

                # 分散投资的效果（较低风险，较低回报）
                satisfaction_change = amount // 20
                new_state["satisfaction"] = min(
                    100, new_state["satisfaction"] + satisfaction_change
                )
                new_state["reputation"] = min(
                    100, new_state["reputation"] + satisfaction_change // 2
                )

        elif difficulty in ["intermediate", "advanced"]:
            if action == "research":
                cost = amount * 20
                new_state["resources"] -= cost

                if difficulty == "intermediate":
                    # 中级难度：引入通胀调整
                    knowledge_gain = amount * 8
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + knowledge_gain
                    )

                    # 研究投资的长期通胀调整效应
                    inflation_adjustment = 1 - (
                        new_state["turn_number"] * 0.01
                    )  # 每回合通胀率1%
                    real_knowledge = knowledge_gain * inflation_adjustment
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + real_knowledge
                    )

                elif difficulty == "advanced":
                    # 高级难度：复杂金融系统和系统性风险
                    knowledge_gain = amount * 8
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + knowledge_gain
                    )

                    # 考虑市场波动和系统性风险
                    market_volatility = 0.1  # 市场波动率
                    risk_factor = (
                        amount / 1000
                    ) * market_volatility  # 风险与投资金额相关
                    adjusted_knowledge = knowledge_gain * (1 - risk_factor)
                    new_state["knowledge"] = min(
                        100, new_state["knowledge"] + adjusted_knowledge
                    )

            elif action == "diversify":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：加入复利考虑
                    satisfaction_change = amount // 20
                    # 考虑长期复利效应
                    compound_factor = (1 + 0.05) ** (
                        new_state["turn_number"] // 3
                    )  # 每3回合复利增长
                    real_satisfaction = satisfaction_change * compound_factor
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + real_satisfaction
                    )
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + real_satisfaction // 2
                    )

                elif difficulty == "advanced":
                    # 高级难度：复杂金融系统和相关性误判
                    satisfaction_change = amount // 20

                    # 模拟真实金融中的相关性幻觉
                    # 短期内资产看似不相关，长期内高度相关
                    correlation_factor = 1 - (
                        0.7 * (1 - 1 / (1 + new_state["turn_number"] * 0.1))
                    )  # 随时间增加相关性
                    real_satisfaction = satisfaction_change * correlation_factor
                    new_state["satisfaction"] = min(
                        100, new_state["satisfaction"] + real_satisfaction
                    )

                    # 在高级难度中添加通胀考虑
                    inflation_rate = 0.03  # 3%通胀率
                    real_reputation = (amount // 20) / (1 + inflation_rate) ** (
                        new_state["turn_number"] // 5
                    )
                    new_state["reputation"] = min(
                        100, new_state["reputation"] + real_reputation
                    )

    # ===== 新增：为game-001（商业战略推理游戏）添加逻辑 =====
    elif scenario_id == "game-001":
        option = decisions.get("option", "1")

        if option == "1":  # 立即投放市场
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 30)
            new_state["reputation"] = max(0, new_state["reputation"] - 20)

        elif option == "2":  # 完善产品后上市
            new_state["resources"] -= 50
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 30)

        elif option == "3":  # 收购竞争对手
            new_state["resources"] -= 100
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 20)
            new_state["reputation"] = max(0, new_state["reputation"] - 10)

        else:  # 合作开发
            new_state["resources"] -= 30
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)
            new_state["reputation"] = min(100, new_state["reputation"] + 20)

    # ===== 新增：为game-002（公共政策制定模拟）添加逻辑 =====
    elif scenario_id == "game-002":
        option = decisions.get("option", "1")

        if option == "1":  # 建设地铁
            new_state["resources"] -= 200
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 60)
            new_state["reputation"] = min(100, new_state["reputation"] + 40)

        elif option == "2":  # 扩大公交网络
            new_state["resources"] -= 100
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)

        elif option == "3":  # 征收拥堵费
            new_state["satisfaction"] = max(0, new_state["satisfaction"] - 30)
            new_state["resources"] += 50  # 收入

        else:  # 自行车道
            new_state["resources"] -= 50
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 30)

    # ===== 新增：为game-003（个人理财决策模拟）添加逻辑 =====
    elif scenario_id == "game-003":
        option = decisions.get("option", "1")

        if option == "1":  # 买车
            new_state["resources"] -= 50000
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 20)

        elif option == "2":  # 全部存银行
            new_state["resources"] += 50000
            new_state["satisfaction"] = max(0, new_state["satisfaction"] - 10)

        elif option == "3":  # 投资股票
            import random
            new_state["resources"] = int(new_state["resources"] * (1 + random.uniform(-0.3, 0.5)))

        else:  # 指数基金
            new_state["resources"] = int(new_state["resources"] * 1.07)
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 10)

    # ===== 新增：为hist-001（挑战者号）添加逻辑 =====
    elif scenario_id == "hist-001":
        decision = decisions.get("decision", "launch")

        if decision == "delay":  # 推迟发射
            new_state["satisfaction"] = 100
            new_state["reputation"] = min(100, new_state["reputation"] + 50)
        else:  # 按计划发射
            new_state["satisfaction"] = 0
            new_state["reputation"] = max(0, new_state["reputation"] - 80)

    # ===== 新增：为hist-002（泰坦尼克号）添加逻辑 =====
    elif scenario_id == "hist-002":
        decision = decisions.get("decision", "fast_route")

        if decision == "safe_route":  # 安全航线
            new_state["satisfaction"] = 100
            new_state["reputation"] = min(100, new_state["reputation"] + 30)
        else:  # 快速航线
            new_state["satisfaction"] = 0
            new_state["reputation"] = max(0, new_state["reputation"] - 90)

    # ===== 新增：为hist-003（猪湾事件）添加逻辑 =====
    elif scenario_id == "hist-003":
        decision = decisions.get("decision", "covert")

        if decision == "full_support":  # 全面军事支持
            new_state["satisfaction"] = 70
            new_state["reputation"] = max(0, new_state["reputation"] - 20)
        else:  # 秘密行动
            new_state["satisfaction"] = 10
            new_state["reputation"] = max(0, new_state["reputation"] - 60)

    # ===== 新增：为adv-game-001（全球气候变化政策制定博弈）添加逻辑 =====
    elif scenario_id == "adv-game-001":
        option = decisions.get("option", "1")

        if option == "1":  # 统一目标
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 30)
            new_state["reputation"] = max(0, new_state["reputation"] - 10)
        elif option == "2":  # 差异化目标
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 20)
        elif option == "3":  # 碳交易市场
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 60)
            new_state["resources"] += 100
        else:  # 技术转移
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 55)
            new_state["resources"] -= 50

    # ===== 新增：为adv-game-002（AI治理与监管决策模拟）添加逻辑 =====
    elif scenario_id == "adv-game-002":
        option = decisions.get("option", "1")

        if option == "1":  # 基于任务能力
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)
            new_state["knowledge"] = min(100, new_state["knowledge"] + 30)
        elif option == "2":  # 安全和可控性优先
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 40)
        elif option == "3":  # 伦理合规
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 45)
            new_state["reputation"] = min(100, new_state["reputation"] + 50)
        else:  # 综合框架
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 55)
            new_state["knowledge"] = min(100, new_state["knowledge"] + 40)
            new_state["reputation"] = min(100, new_state["reputation"] + 30)

    # ===== 新增：为adv-game-003（复杂金融市场危机应对模拟）添加逻辑 =====
    elif scenario_id == "adv-game-003":
        option = decisions.get("option", "1")

        if option == "1":  # 立即加强监管
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 50)
            new_state["reputation"] = min(100, new_state["reputation"] + 40)
        elif option == "2":  # 提高资本充足率
            new_state["resources"] -= 200
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 45)
            new_state["reputation"] = min(100, new_state["reputation"] + 35)
        elif option == "3":  # 压力测试
            new_state["knowledge"] = min(100, new_state["knowledge"] + 60)
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + 40)
        else:  # 加强监控
            new_state["knowledge"] = min(100, new_state["knowledge"] + 20)
            new_state["satisfaction"] = max(0, new_state["satisfaction"] - 10)

    # 确保数值在合理范围内
    new_state["resources"] = max(0, new_state["resources"])
    new_state["satisfaction"] = max(0, min(100, new_state["satisfaction"]))
    new_state["reputation"] = max(0, min(100, new_state["reputation"]))
    new_state["knowledge"] = max(0, min(100, new_state["knowledge"]))

    return new_state


# ===== 增强反馈生成系统 =====


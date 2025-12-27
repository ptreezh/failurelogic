from typing import Dict, Any


def execute_real_logic(scenario_id: str, current_state: Dict, decisions: Dict) -> Dict:
    """执行真实的业务逻辑"""
    new_state = current_state.copy()
    
    if scenario_id == "coffee-shop-linear-thinking":
        # 咖啡店场景：线性思维陷阱
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)
        
        if action == "hire_staff":
            # 线性思维陷阱：员工增加不等于满意度线性提升
            cost = amount * 200
            new_state["resources"] -= cost
            
            # 非线性效果：员工过多反而效率下降
            if amount <= 3:
                satisfaction_gain = amount * 8  # 每个员工增加8点满意度
            elif amount <= 6:
                satisfaction_gain = amount * 5  # 效率下降
            else:
                satisfaction_gain = amount * 2  # 严重效率下降
                
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + satisfaction_gain)
            new_state["reputation"] = min(100, new_state["reputation"] + satisfaction_gain // 2)
            
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
            new_state["reputation"] = min(100, new_state["reputation"] + effect // 2)
            
    elif scenario_id == "relationship-time-delay":
        # 关系场景：时间延迟效应
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)
        
        if action == "communication":
            # 沟通的时间成本和延迟效果
            time_cost = amount * 10
            new_state["resources"] -= time_cost
            
            # 即时效果较小
            immediate_effect = amount * 2
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)
            
            # 延迟效果（在后续回合体现）
            # 这里我们模拟延迟效果的存储
            
        elif action == "gift":
            new_state["resources"] -= amount
            
            # 礼物的即时效果和延迟效果
            immediate_effect = amount // 20
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)
            
    elif scenario_id == "investment-confirmation-bias":
        # 投资场景：确认偏误
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)
        
        if action == "research":
            # 研究投入增加知识但存在确认偏误
            cost = amount * 20
            new_state["resources"] -= cost
            
            knowledge_gain = amount * 8
            new_state["knowledge"] = min(100, new_state["knowledge"] + knowledge_gain)
            
        elif action == "diversify":
            # 分散投资降低风险
            new_state["resources"] -= amount
            
            # 分散投资的效果（较低风险，较低回报）
            satisfaction_change = amount // 20
            new_state["satisfaction"] = min(100, new_state["satisfaction"] + satisfaction_change)
            new_state["reputation"] = min(100, new_state["reputation"] + satisfaction_change // 2)
            
    # 确保数值在合理范围内
    new_state["resources"] = max(0, new_state["resources"])
    new_state["satisfaction"] = max(0, min(100, new_state["satisfaction"]))
    new_state["reputation"] = max(0, min(100, new_state["reputation"]))
    new_state["knowledge"] = max(0, min(100, new_state["knowledge"]))
    
    return new_state


def generate_real_feedback(scenario_id: str, decisions: Dict, old_state: Dict, new_state: Dict) -> str:
    """生成基于真实逻辑的反馈"""
    action = decisions.get("action", "default")
    amount = decisions.get("amount", 0)
    
    # 计算变化值
    satisfaction_change = new_state["satisfaction"] - old_state["satisfaction"]
    resources_change = new_state["resources"] - old_state["resources"]
    
    if scenario_id == "coffee-shop-linear-thinking":
        if action == "hire_staff":
            if amount > 6:
                return "您雇佣了过多员工，导致效率下降。在复杂系统中，增加投入并不总是带来线性回报。"
            elif amount > 3:
                return "您增加了员工数量，但要注意边际效应递减的规律。"
            else:
                return "合理的员工配置提升了客户满意度。"
        elif action == "marketing":
            if amount > 500:
                return "大量营销投入带来了饱和效应，收益递减明显。"
            else:
                return "适度的营销投入有效提升了客户满意度。"
                
    elif scenario_id == "relationship-time-delay":
        if action == "communication":
            return "沟通是关系维护的基础，但要注意效果的延迟性。"
        elif action == "gift":
            return "礼物能带来即时的好感，但长期关系需要更多投入。"
            
    elif scenario_id == "investment-confirmation-bias":
        if action == "research":
            return "研究增加了您的知识储备，但要注意避免确认偏误。"
        elif action == "diversify":
            return "分散投资降低了风险，但也限制了潜在收益。"
            
    # 默认反馈
    if satisfaction_change > 10:
        return "您的决策取得了显著成效！"
    elif satisfaction_change > 0:
        return "您的决策产生了积极影响。"
    elif satisfaction_change < -10:
        return "这个决策可能需要重新考虑。"
    else:
        return "决策已执行，正在观察效果。"
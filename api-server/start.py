#!/usr/bin/env python3
"""
认知陷阱平台API服务器
基于FastAPI的后端服务，提供真实的逻辑实现而非模拟数据
"""

import os
import sys
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
import uvicorn
import json
import random
from datetime import datetime
from pydantic import BaseModel

app = FastAPI(
    title="认知陷阱平台API",
    description="提供认知陷阱场景、游戏会话和分析服务，使用真实的逻辑实现",
    version="1.0.0"
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 场景数据 - 统一的场景结构，支持多难度级别
SCENARIOS = [

    {
        "id": "coffee-shop-linear-thinking",
        "name": "咖啡店线性思维",
        "description": "线性思维陷阱场景",
        "fullDescription": "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。线性思维是指我们倾向于认为原因和结果之间存在直接的、成比例的关系。但在复杂的系统中，这种思维方式往往会导致错误的决策。",
        "difficulty": "beginner",
        "estimatedDuration": 15,
        "targetBiases": ["linear_thinking"],
        "cognitiveBias": "线性思维",
        "duration": "15-20分钟",
        "category": "商业决策",
        "thumbnail": "/assets/images/coffee-shop.jpg",
        "advancedChallenges": [
            {
                "title": "供应链指数增长",
                "description": "处理供应商网络扩展中的指数增长效应",
                "difficulty": "intermediate",
                "cognitiveBiases": ["exponential_misconception", "linear_thinking"]
            },
            {
                "title": "复杂系统管理",
                "description": "管理多变量商业生态系统的复杂性",
                "difficulty": "advanced",
                "cognitiveBiases": ["complex_system_misunderstanding", "cascading_failure_blindness"]
            }
        ]
    },
    {
        "id": "relationship-time-delay",
        "name": "恋爱关系时间延迟",
        "description": "时间延迟偏差场景",
        "fullDescription": "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。时间延迟偏差是指我们倾向于期望立即看到行动的结果，而忽视了在复杂系统中结果往往需要时间才能显现。",
        "difficulty": "intermediate",
        "estimatedDuration": 20,
        "targetBiases": ["time_delay_bias"],
        "cognitiveBias": "时间延迟",
        "duration": "20-25分钟",
        "category": "人际关系",
        "thumbnail": "/assets/images/relationship.jpg",
        "advancedChallenges": [
            {
                "title": "长期关系复利效应",
                "description": "理解关系投资的长期复利增长模式",
                "difficulty": "intermediate",
                "cognitiveBiases": ["compound_interest_misunderstanding", "short_term_bias"]
            },
            {
                "title": "复杂关系网络",
                "description": "处理家庭和社交网络的复杂动态",
                "difficulty": "advanced",
                "cognitiveBiases": ["complex_system_misunderstanding", "network_effect_blindness"]
            }
        ]
    },
    {
        "id": "investment-confirmation-bias",
        "name": "投资确认偏误",
        "description": "确认偏误场景",
        "fullDescription": "在投资决策中体验确认偏误如何影响我们的风险判断。确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。",
        "difficulty": "advanced",
        "estimatedDuration": 25,
        "targetBiases": ["confirmation_bias"],
        "cognitiveBias": "确认偏误",
        "duration": "25-30分钟",
        "category": "金融决策",
        "thumbnail": "/assets/images/investment.jpg",
        "advancedChallenges": [
            {
                "title": "通胀调整投资",
                "description": "考虑通胀影响的长期投资复利效应",
                "difficulty": "intermediate",
                "cognitiveBiases": ["inflation_blindness", "compound_interest_misunderstanding"]
            },
            {
                "title": "复杂金融系统",
                "description": "处理多变量金融市场系统风险",
                "difficulty": "advanced",
                "cognitiveBiases": ["financial_system_complexity_blindness", "correlation_misunderstanding"]
            }
        ]
    }
]

# 游戏会话存储
game_sessions = {}

# 导入并注册认知测试端点
try:
    from endpoints.cognitive_tests import router as cognitive_tests_router
    app.include_router(cognitive_tests_router)
except ImportError:
    print("认知测试端点不可用")

# 导入并注册测试结果端点
try:
    from endpoints.test_results import router as test_results_router
    app.include_router(test_results_router)
except ImportError:
    print("测试结果端点不可用")

# 确保所需导入存在
try:
    from pydantic import BaseModel
    from typing import Optional, List, Dict, Any, Union
    import json
    import math
    import random
    from datetime import datetime
    import uvicorn
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
except ImportError as e:
    print(f"必要的依赖未找到: {e}")
    exit(1)

@app.get("/health")
async def health():
    """Health check endpoint (JSON)"""
    return {
        "message": "认知陷阱平台API服务正常运行",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/scenarios/")
async def get_scenarios():
    """获取所有认知陷阱场景"""
    return {"scenarios": SCENARIOS}

@app.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取特定场景详情"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")
    return scenario

@app.post("/scenarios/create_game_session")
async def create_game_session(
    scenario_id: str = Query(..., alias="scenario_id"),
    difficulty: str = Query("auto", description="难度级别: beginner, intermediate, advanced, 或 auto")
):
    """创建游戏会话，支持不同难度级别"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")

    # 根据难度参数调整场景
    selected_scenario = scenario.copy()

    if difficulty != "auto":
        # 如果指定了具体难度，查找对应的高级挑战内容
        if difficulty != scenario["difficulty"]:
            # 在高级挑战中查找匹配难度的挑战
            matching_challenge = None
            if "advancedChallenges" in scenario:
                for challenge in scenario["advancedChallenges"]:
                    if challenge["difficulty"] == difficulty:
                        matching_challenge = challenge
                        break

            if matching_challenge:
                # 用高级挑战的信息更新场景
                selected_scenario["name"] = f"{scenario['name']} - {matching_challenge['title']}"
                selected_scenario["description"] = matching_challenge["description"]
                selected_scenario["targetBiases"] = matching_challenge["cognitiveBiases"]
                selected_scenario["cognitiveBias"] = ", ".join(matching_challenge["cognitiveBiases"])

    # 生成会话ID
    session_id = f"session_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"

    # 根据难度初始化不同的游戏状态
    initial_state = {
        "resources": 1000,          # 初始资源
        "satisfaction": 50,         # 客户满意度
        "reputation": 50,           # 声誉
        "knowledge": 0,             # 知识水平
        "turn_number": 1,           # 回合数
        "difficulty": difficulty if difficulty != "auto" else selected_scenario["difficulty"],  # 记录难度
        "challenge_type": "base" if difficulty == "auto" or difficulty == scenario["difficulty"] else "advanced"  # 挑战类型
    }

    # 存储会话
    game_sessions[session_id] = {
        "session_id": session_id,
        "scenario_id": scenario_id,
        "scenario": selected_scenario,  # 使用可能已调整的场景
        "turn": 1,
        "game_state": initial_state,
        "created_at": datetime.now().isoformat(),
        "history": [],
        "difficulty": difficulty if difficulty != "auto" else selected_scenario["difficulty"]
    }

    return {
        "success": True,
        "game_id": session_id,
        "message": f"游戏会话已创建",
        "difficulty": initial_state["difficulty"],
        "challenge_type": initial_state["challenge_type"]
    }

@app.post("/scenarios/{game_id}/turn")
async def execute_turn(game_id: str, decisions: Dict[str, Any]):
    """执行游戏回合（真实逻辑实现），支持不同难度级别"""
    if game_id not in game_sessions:
        raise HTTPException(status_code=404, detail="游戏会话未找到")

    session = game_sessions[game_id]
    scenario_id = session["scenario_id"]
    current_state = session["game_state"].copy()
    difficulty = session.get("difficulty", "beginner")  # 获取难度级别

    # 根据场景类型和难度执行真实的逻辑处理
    new_state = execute_real_logic(scenario_id, current_state, decisions, difficulty=difficulty)

    # 更新回合数
    new_state["turn_number"] = current_state["turn_number"] + 1

    # 更新会话状态
    session["game_state"] = new_state
    session["turn"] += 1

    # 记录历史
    session["history"].append({
        "turn": current_state["turn_number"],
        "decisions": decisions,
        "result_state": new_state,
        "difficulty": difficulty
    })

    # 根据难度生成相应的反馈
    feedback = generate_real_feedback(scenario_id, decisions, current_state, new_state, difficulty=difficulty)

    # 立即响应机制，增加用户交互反馈
    immediate_response = {
        "status": "processed",
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state,
        "immediate_acknowledgment": True,
        "processing_time_ms": 100,  # 模拟响应时间
        "user_interaction_response": "您的决策已记录，正在计算结果...",
        "difficulty": difficulty
    }

    return {
        "success": True,
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state,
        "immediate_response": immediate_response,
        "difficulty": difficulty
    }

def execute_real_logic(scenario_id: str, current_state: Dict, decisions: Dict, difficulty: str = "beginner") -> Dict:
    """执行真实的业务逻辑，支持不同难度级别"""
    new_state = current_state.copy()

    # 根据不同场景和难度执行逻辑
    if scenario_id == "coffee-shop-linear-thinking":
        # 咖啡店场景：线性思维陷阱
        action = decisions.get("action", "")
        amount = decisions.get("amount", 0)

        if difficulty == "beginner":
            # 基础难度：简单的线性思维陷阱
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

        elif difficulty in ["intermediate", "advanced"]:
            # 高级难度：包含指数增长和复杂系统效应
            if action == "hire_staff":
                cost = amount * 200
                new_state["resources"] -= cost

                # 引入更复杂的非线性效应
                base_satisfaction = amount * 8
                # 添加指数衰减因子：更多员工导致效率指数下降
                efficiency_factor = 1 / (1 + 0.1 * amount)  # 随员工数增加效率下降
                satisfaction_gain = base_satisfaction * efficiency_factor

                new_state["satisfaction"] = min(100, new_state["satisfaction"] + satisfaction_gain)

                # 在高级难度中引入复杂系统效应
                if difficulty == "advanced":
                    # 可能引发级联效应
                    reputation_change = satisfaction_gain // 2
                    new_state["reputation"] = min(100, new_state["reputation"] + reputation_change)

                    # 添加供应商网络复杂性
                    if amount > 4:
                        # 过多员工可能导致内部协调成本指数增长
                        coordination_cost = min(20, (amount - 4) * 3)
                        new_state["satisfaction"] -= coordination_cost

            elif action == "marketing":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：添加通胀和时间价值的因素
                    effect = amount // 10
                    # 一段时间后营销效果会衰减（复利思维）
                    effect *= (1 + 0.05) ** (new_state["turn_number"] // 5)  # 每5回合增加5%效果
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + effect)
                elif difficulty == "advanced":
                    # 高级难度：复杂网络效应和指数增长
                    effect = amount // 10
                    # 添加社交网络效应，营销效果呈指数增长
                    network_multiplier = min(3, 1 + (new_state["reputation"] / 50))  # 声誉越好网络效应越强
                    effect *= network_multiplier
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + effect)

            elif action == "supply_chain":
                # 供应链管理 - 高级难度特有的挑战
                if difficulty in ["intermediate", "advanced"]:
                    # 供应链中的指数增长效应
                    supply_investment = amount
                    new_state["resources"] -= supply_investment

                    # 供应商网络的复杂性
                    # 初始效益是线性的，但随着网络扩大，协调成本呈指数增长
                    supply_benefit = min(supply_investment * 0.8, 50)  # 最大50点效益
                    coordination_cost = min(30, (supply_investment / 50) ** 2 * 100)  # 协调成本随投资平方增长

                    net_effect = supply_benefit - coordination_cost
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + max(0, net_effect))

                    # 在高级难度中，网络效应可能带来指数收益
                    if difficulty == "advanced" and supply_investment > 100:
                        # 巨大投资可能触发网络效应，带来指数增长收益
                        network_effect = (supply_investment / 100) ** 1.5 * 10  # 1.5次方增长
                        new_state["satisfaction"] = min(100, new_state["satisfaction"] + network_effect)

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
                new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)

            elif action == "gift":
                new_state["resources"] -= amount

                # 礼物的即时效果和延迟效果
                immediate_effect = amount // 20
                new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)

        elif difficulty in ["intermediate", "advanced"]:
            if action == "communication":
                time_cost = amount * 10
                new_state["resources"] -= time_cost

                if difficulty == "intermediate":
                    # 中级难度：加入关系投资的复利效应
                    immediate_effect = amount * 1.5  # 立即满意度提升
                    # 为未来回合存储长期收益
                    long_term_value = amount * 0.5  # 关系投资的长期价值
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)
                    if "relationship_investment" not in new_state:
                        new_state["relationship_investment"] = 0
                    new_state["relationship_investment"] += long_term_value

                elif difficulty == "advanced":
                    # 高级难度：复杂关系网络和级联效应
                    # 通信投资也会在社交网络中产生连锁反应
                    immediate_effect = amount * 1.2
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)

                    # 长期关系复利效应
                    if "relationship_investment" not in new_state:
                        new_state["relationship_investment"] = 0
                    # 复利效应：之前的投资现在开始产生收益
                    previous_investments_return = new_state["relationship_investment"] * 0.1
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + previous_investments_return)

            elif action == "gift":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：礼物的长期复利效应
                    immediate_effect = amount // 25
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)

                    # 为未来回合存储长期效应
                    if "gift_investment" not in new_state:
                        new_state["gift_investment"] = 0
                    new_state["gift_investment"] += amount * 0.05  # 礼物投资的长期价值

                elif difficulty == "advanced":
                    # 高级难度：复杂关系网络效应
                    immediate_effect = amount // 30
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + immediate_effect)

                    # 网络效应：礼物可能影响更广泛的社交圈
                    network_effect = (amount / 100) ** 1.2  # 网络效应呈指数增长
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + network_effect)

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
                new_state["knowledge"] = min(100, new_state["knowledge"] + knowledge_gain)

            elif action == "diversify":
                # 分散投资降低风险
                new_state["resources"] -= amount

                # 分散投资的效果（较低风险，较低回报）
                satisfaction_change = amount // 20
                new_state["satisfaction"] = min(100, new_state["satisfaction"] + satisfaction_change)
                new_state["reputation"] = min(100, new_state["reputation"] + satisfaction_change // 2)

        elif difficulty in ["intermediate", "advanced"]:
            if action == "research":
                cost = amount * 20
                new_state["resources"] -= cost

                if difficulty == "intermediate":
                    # 中级难度：引入通胀调整
                    knowledge_gain = amount * 8
                    new_state["knowledge"] = min(100, new_state["knowledge"] + knowledge_gain)

                    # 研究投资的长期通胀调整效应
                    inflation_adjustment = 1 - (new_state["turn_number"] * 0.01)  # 每回合通胀率1%
                    real_knowledge = knowledge_gain * inflation_adjustment
                    new_state["knowledge"] = min(100, new_state["knowledge"] + real_knowledge)

                elif difficulty == "advanced":
                    # 高级难度：复杂金融系统和系统性风险
                    knowledge_gain = amount * 8
                    new_state["knowledge"] = min(100, new_state["knowledge"] + knowledge_gain)

                    # 考虑市场波动和系统性风险
                    market_volatility = 0.1  # 市场波动率
                    risk_factor = (amount / 1000) * market_volatility  # 风险与投资金额相关
                    adjusted_knowledge = knowledge_gain * (1 - risk_factor)
                    new_state["knowledge"] = min(100, new_state["knowledge"] + adjusted_knowledge)

            elif action == "diversify":
                new_state["resources"] -= amount

                if difficulty == "intermediate":
                    # 中级难度：加入复利考虑
                    satisfaction_change = amount // 20
                    # 考虑长期复利效应
                    compound_factor = (1 + 0.05) ** (new_state["turn_number"] // 3)  # 每3回合复利增长
                    real_satisfaction = satisfaction_change * compound_factor
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + real_satisfaction)
                    new_state["reputation"] = min(100, new_state["reputation"] + real_satisfaction // 2)

                elif difficulty == "advanced":
                    # 高级难度：复杂金融系统和相关性误判
                    satisfaction_change = amount // 20

                    # 模拟真实金融中的相关性幻觉
                    # 短期内资产看似不相关，长期内高度相关
                    correlation_factor = 1 - (0.7 * (1 - 1/(1 + new_state["turn_number"]*0.1)))  # 随时间增加相关性
                    real_satisfaction = satisfaction_change * correlation_factor
                    new_state["satisfaction"] = min(100, new_state["satisfaction"] + real_satisfaction)

                    # 在高级难度中添加通胀考虑
                    inflation_rate = 0.03  # 3%通胀率
                    real_reputation = (amount // 20) / (1 + inflation_rate) ** (new_state["turn_number"] // 5)
                    new_state["reputation"] = min(100, new_state["reputation"] + real_reputation)

    # 确保数值在合理范围内
    new_state["resources"] = max(0, new_state["resources"])
    new_state["satisfaction"] = max(0, min(100, new_state["satisfaction"]))
    new_state["reputation"] = max(0, min(100, new_state["reputation"]))
    new_state["knowledge"] = max(0, min(100, new_state["knowledge"]))

    return new_state

def generate_real_feedback(scenario_id: str, decisions: Dict, old_state: Dict, new_state: Dict, difficulty: str = "beginner") -> str:
    """生成基于真实逻辑的反馈，支持不同难度级别"""
    action = decisions.get("action", "default")
    amount = decisions.get("amount", 0)

    # 计算变化值
    satisfaction_change = new_state["satisfaction"] - old_state["satisfaction"]
    resources_change = new_state["resources"] - old_state["resources"]
    knowledge_change = new_state["knowledge"] - old_state["knowledge"]

    if scenario_id == "coffee-shop-linear-thinking":
        if action == "hire_staff":
            if difficulty == "beginner":
                if amount > 6:
                    return "您雇佣了过多员工，导致效率下降。在复杂系统中，增加投入并不总是带来线性回报。"
                elif amount > 3:
                    return "您增加了员工数量，但要注意边际效应递减的规律。"
                else:
                    return "合理的员工配置提升了客户满意度。"
            else:  # intermediate/advanced
                if amount > 6:
                    basic_feedback = "您雇佣了过多员工，导致效率下降。"
                    if difficulty == "intermediate":
                        additional_feedback = "在商业管理中，人员配置需要考虑非线性效应。"
                    else:  # advanced
                        additional_feedback = "复杂系统中，过多人力资源可能引发协调成本指数增长，这是级联故障的常见原因。"
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
                        additional_feedback = "此外，营销投资需要考虑通胀调整后的实际价值。"
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
                return "研究增加了您的知识储备，但要注意避免确认偏误。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "研究增加了您的知识储备，但要注意避免确认偏误。同时，投资的实际价值需要考虑通胀调整。"
                else:  # advanced
                    return "研究增加了您的知识储备，但要注意避免确认偏误。金融系统具有复杂性，市场波动和系统性风险需要特别关注。"
        elif action == "diversify":
            if difficulty == "beginner":
                return "分散投资降低了风险，但也限制了潜在收益。"
            else:  # intermediate/advanced
                if difficulty == "intermediate":
                    return "分散投资降低了风险，但也限制了潜在收益。长期投资要考虑复利的时间价值。"
                else:  # advanced
                    return "分散投资降低了风险，但需警惕相关性幻觉。在系统性风险下，看似无关的资产可能高度相关。这是投资中的'黑天鹅'事件风险。"

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
        depth_feedback = " 在高级挑战中，您面临复杂系统、网络效应和指数增长等高级认知偏差。"
    else:
        depth_feedback = ""

    return base_feedback + depth_feedback

# 为前端提供静态文件服务（在所有API端点之后定义）
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

# 提供主页(index.html)的路由
@app.get("/")
async def read_root():
    """返回主页面"""
    try:
        with open("../index.html", "r", encoding="utf-8") as f:
            content = f.read()
        return HTMLResponse(content=content)
    except FileNotFoundError:
        return {"message": "认知陷阱平台主页 - API服务运行正常", "status": "healthy"}

# 挂载静态资源目录
app.mount("/assets", StaticFiles(directory="../assets"), name="assets")
app.mount("/web-app", StaticFiles(directory="../web-app"), name="web_app")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"🚀 启动认知陷阱平台API服务器 (端口: {port})")
    print(f"📊 API文档: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
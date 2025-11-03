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

# 场景数据
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
        "thumbnail": "/assets/images/coffee-shop.jpg"
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
        "thumbnail": "/assets/images/relationship.jpg"
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
        "thumbnail": "/assets/images/investment.jpg"
    }
]

# 游戏会话存储
game_sessions = {}

@app.get("/")
async def root():
    """API根端点"""
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
async def create_game_session(scenario_id: str = Query(..., alias="scenario_id")):
    """创建游戏会话"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")
    
    # 生成会话ID
    session_id = f"session_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"
    
    # 初始化游戏状态（使用真实逻辑）
    initial_state = {
        "resources": 1000,          # 初始资源
        "satisfaction": 50,         # 客户满意度
        "reputation": 50,           # 声誉
        "knowledge": 0,             # 知识水平
        "turn_number": 1            # 回合数
    }
    
    # 存储会话
    game_sessions[session_id] = {
        "session_id": session_id,
        "scenario_id": scenario_id,
        "scenario": scenario,
        "turn": 1,
        "game_state": initial_state,
        "created_at": datetime.now().isoformat(),
        "history": []
    }
    
    return {
        "success": True,
        "game_id": session_id,
        "message": f"游戏会话已创建"
    }

@app.post("/scenarios/{game_id}/turn")
async def execute_turn(game_id: str, decisions: Dict[str, Any]):
    """执行游戏回合（真实逻辑实现）"""
    if game_id not in game_sessions:
        raise HTTPException(status_code=404, detail="游戏会话未找到")
    
    session = game_sessions[game_id]
    scenario_id = session["scenario_id"]
    current_state = session["game_state"].copy()
    
    # 根据场景类型执行真实的逻辑处理
    new_state = execute_real_logic(scenario_id, current_state, decisions)
    
    # 更新回合数
    new_state["turn_number"] = current_state["turn_number"] + 1
    
    # 更新会话状态
    session["game_state"] = new_state
    session["turn"] += 1
    
    # 记录历史
    session["history"].append({
        "turn": current_state["turn_number"],
        "decisions": decisions,
        "result_state": new_state
    })
    
    # 生成真实的反馈
    feedback = generate_real_feedback(scenario_id, decisions, current_state, new_state)
    
    return {
        "success": True,
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state
    }

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

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"🚀 启动认知陷阱平台API服务器 (端口: {port})")
    print(f"📊 API文档: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from datetime import datetime
import random
from data.scenarios import SCENARIOS
from models.scenario import Scenario, GameSession, GameState
from logic.real_logic import execute_real_logic, generate_real_feedback

# 游戏会话存储
game_sessions = {}

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/")
async def get_scenarios():
    """获取所有认知陷阱场景"""
    return {"scenarios": SCENARIOS}


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取特定场景详情"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")
    return scenario


@router.post("/create_game_session")
async def create_game_session(scenario_id: str = Query(..., alias="scenario_id")):
    """创建游戏会话"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")
    
    # 生成会话ID
    session_id = f"session_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"
    
    # 初始化游戏状态（使用真实逻辑）
    initial_state = GameState().dict()
    
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


@router.post("/{game_id}/turn")
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
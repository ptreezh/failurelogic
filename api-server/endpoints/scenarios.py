from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from datetime import datetime
import random
import os
import sys
import json
import logging

# Add parent directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from data.scenarios import SCENARIOS
from models.scenario import Scenario, GameSession, GameState
from logic.real_logic import execute_real_logic, generate_real_feedback

# Set up logging
logging.basicConfig(
    filename='scenario_loading.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 游戏会话存储
game_sessions = {}

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _load_additional_scenarios() -> List[Dict[str, Any]]:
    """从 data 目录加载 game/advanced/historical 场景并标准化字段"""
    logger.info("=" * 60)
    logger.info("开始加载额外场景...")
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
    logger.info(f"数据目录: {data_dir}")
    logger.info(f"目录存在: {os.path.exists(data_dir)}")
    logger.info(f"目录内容: {os.listdir(data_dir) if os.path.exists(data_dir) else 'N/A'}")
    combined: List[Dict[str, Any]] = []

    # Helper to normalize entries
    def normalize(entry: Dict[str, Any], scenario_type: str, default_difficulty: str, est_duration: int = 30):
        return {
            "id": entry.get("scenarioId") or entry.get("id"),
            "name": entry.get("title") or entry.get("name"),
            "description": entry.get("description") or entry.get("fullDescription") or "",
            "fullDescription": entry.get("fullDescription") or entry.get("description") or "",
            "difficulty": entry.get("difficulty") or default_difficulty,
            "estimatedDuration": entry.get("estimatedDuration") or est_duration,
            "targetBiases": entry.get("targetBiases") or entry.get("cognitiveBiases") or [],
            "cognitiveBias": entry.get("cognitiveBias") or ",".join(entry.get("cognitiveBiases", [])) or "",
            "duration": entry.get("duration") or f"{est_duration}分钟",
            "category": entry.get("category") or entry.get("gameType") or scenario_type,
            "thumbnail": entry.get("thumbnail") or "",
            "advancedChallenges": entry.get("advancedChallenges") or [] ,
            "scenarioType": scenario_type
        }

    # Load game_scenarios.json
    try:
        game_file = os.path.join(data_dir, 'game_scenarios.json')
        logger.info(f"游戏场景文件路径: {game_file}")
        logger.info(f"文件存在: {os.path.exists(game_file)}")
        if os.path.exists(game_file):
            with open(game_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                scenarios = data.get('game_scenarios', [])
                logger.info(f"找到 {len(scenarios)} 个游戏场景")
                for e in scenarios:
                    normalized = normalize(e, 'game', 'intermediate', 30)
                    combined.append(normalized)
                    logger.info(f"  加载游戏场景: {normalized.get('id')}")
            logger.info(f"✓ 加载了 {len(scenarios)} 个游戏场景")
        else:
            logger.error(f"⚠ 游戏场景文件不存在: {game_file}")
    except Exception as e:
        logger.error(f"✗ 加载游戏场景失败: {e}", exc_info=True)

    # Load advanced_game_scenarios.json
    try:
        advanced_file = os.path.join(data_dir, 'advanced_game_scenarios.json')
        logger.info(f"高级游戏场景文件路径: {advanced_file}")
        logger.info(f"文件存在: {os.path.exists(advanced_file)}")
        if os.path.exists(advanced_file):
            with open(advanced_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                scenarios = data.get('game_scenarios', [])
                logger.info(f"找到 {len(scenarios)} 个高级游戏场景")
                for e in scenarios:
                    normalized = normalize(e, 'game', 'advanced', 60)
                    combined.append(normalized)
                    logger.info(f"  加载高级游戏场景: {normalized.get('id')}")
            logger.info(f"✓ 加载了 {len(scenarios)} 个高级游戏场景")
        else:
            logger.error(f"⚠ 高级游戏场景文件不存在: {advanced_file}")
    except Exception as e:
        logger.error(f"✗ 加载高级游戏场景失败: {e}", exc_info=True)

    # Load historical_cases.json
    try:
        historical_file = os.path.join(data_dir, 'historical_cases.json')
        logger.info(f"历史案例文件路径: {historical_file}")
        logger.info(f"文件存在: {os.path.exists(historical_file)}")
        if os.path.exists(historical_file):
            with open(historical_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                cases = data.get('historical_cases', [])
                logger.info(f"找到 {len(cases)} 个历史案例")
                for e in cases:
                    normalized = normalize(e, 'historical', 'historical', 20)
                    combined.append(normalized)
                    logger.info(f"  加载历史案例: {normalized.get('id')}")
            logger.info(f"✓ 加载了 {len(cases)} 个历史案例")
        else:
            logger.error(f"⚠ 历史案例文件不存在: {historical_file}")
    except Exception as e:
        logger.error(f"✗ 加载历史案例失败: {e}", exc_info=True)

    logger.info(f"总计加载了 {len(combined)} 个额外场景")
    logger.info("=" * 60)
    return combined


@router.get("/")
async def get_scenarios():
    """获取所有认知陷阱场景（合并静态与数据目录内容）"""
    logger.info("[API] 调用 get_scenarios...")
    logger.info(f"[API] 基础场景数量: {len(SCENARIOS)}")
    additional = _load_additional_scenarios()
    logger.info(f"[API] 额外场景数量: {len(additional)}")
    # Merge SCENARIOS (core) with additional loaded scenarios
    merged = list(SCENARIOS) + additional
    logger.info(f"[API] 合并后场景总数: {len(merged)}")
    logger.info(f"[API] 场景列表: {[s.get('id') for s in merged]}")
    return {"scenarios": merged}


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str):
    """获取特定场景详情"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")
    return scenario


def get_initial_state_for_scenario(scenario_id: str) -> Dict[str, Any]:
    """
    根据场景ID返回正确的初始状态
    ✅ FIXED: 每个场景有自己的状态变量
    """
    scenario_states = {
        'coffee-shop-linear-thinking': {
            'satisfaction': 50,
            'resources': 1000,
            'reputation': 50,
            'turn_number': 1
        },
        'investment-confirmation-bias': {
            'portfolio': 10000,
            'knowledge': 0,
            'turn_number': 1
        },
        'relationship-time-delay': {
            'satisfaction': 50,
            'trust': 50,
            'turn_number': 1
        }
    }

    return scenario_states.get(scenario_id, {
        'satisfaction': 50,
        'resources': 1000,
        'reputation': 50,
        'turn_number': 1
    })


@router.post("/create_game_session")
async def create_game_session(scenario_id: str = Query(..., alias="scenario_id"),
                             difficulty: str = Query(default="beginner", alias="difficulty")):
    """创建游戏会话"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")

    # 生成会话ID
    session_id = f"session_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"

    # ✅ FIXED: 根据场景ID获取正确的初始状态
    initial_state = get_initial_state_for_scenario(scenario_id)

    # 存储会话
    game_sessions[session_id] = {
        "session_id": session_id,
        "scenario_id": scenario_id,
        "scenario": scenario,
        "difficulty": difficulty,
        "turn": 1,
        "game_state": initial_state,
        "created_at": datetime.now().isoformat(),
        "history": [],
        "decision_history": [],
        "delayed_effects": [],
        "patterns": []
    }

    return {
        "success": True,
        "gameId": session_id,
        "game_id": session_id,  # 兼容两种命名
        "scenarioId": scenario_id,
        "scenario_id": scenario_id,  # 兼容两种命名
        "difficulty": difficulty,
        "gameState": initial_state,
        "game_state": initial_state,  # 兼容两种命名
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
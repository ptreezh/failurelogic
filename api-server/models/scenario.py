from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class Scenario(BaseModel):
    """认知场景模型"""
    id: str
    name: str
    description: str
    fullDescription: str
    difficulty: str
    estimatedDuration: int
    targetBiases: List[str]
    cognitiveBias: str
    duration: str
    category: str
    thumbnail: str


class GameState(BaseModel):
    """游戏状态模型"""
    resources: int = 1000
    satisfaction: int = 50
    reputation: int = 50
    knowledge: int = 0
    turn_number: int = 1


class GameSession(BaseModel):
    """游戏会话模型"""
    session_id: str
    scenario_id: str
    scenario: Dict[str, Any]
    turn: int
    game_state: GameState
    created_at: str
    history: List[Dict[str, Any]]
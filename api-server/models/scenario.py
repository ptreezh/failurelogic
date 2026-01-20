"""
统一场景数据模型
根据TDD原则，实现功能以通过测试
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal, Dict, Any
from enum import Enum
from datetime import datetime


# ========== 枚举定义 ==========


class ScenarioType(str, Enum):
    """场景类型枚举"""

    BASIC = "basic"
    GAME = "game"
    HISTORICAL = "historical"


class DifficultyLevel(str, Enum):
    """难度级别枚举"""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    MEDIUM = "medium"
    HIGH = "high"


# ========== 辅助模型 ==========


class AdvancedChallenge(BaseModel):
    """高级挑战"""

    title: str
    description: str
    difficulty: DifficultyLevel
    cognitiveBiases: List[str]


class GameRules(BaseModel):
    """游戏规则"""

    players: int
    duration: str
    complexity: str = Field(default="medium")
    skillsTested: List[str]


class GameStep(BaseModel):
    """游戏步骤"""

    step: int
    situation: str
    options: List[str]
    explanation: Optional[str] = None


class GameAnalysis(BaseModel):
    """游戏分析"""

    purpose: str
    cognitiveBiasesTested: List[str]
    learningObjectives: List[str]


class DecisionPoint(BaseModel):
    """决策点（历史案例）"""

    step: int
    situation: str
    options: List[str]


class PyramidAnalysis(BaseModel):
    """金字塔分析"""

    coreConclusion: str
    supportingArguments: List[str]
    examples: List[str]
    actionableAdvice: List[str]


# ========== 场景模型 ==========


class BaseScenario(BaseModel):
    """基础场景模型"""

    id: str
    scenarioType: ScenarioType
    title: str
    description: str
    difficulty: DifficultyLevel
    estimatedDuration: int = Field(..., gt=0, description="预计时长（分钟），必须大于0")
    category: Optional[str] = None
    thumbnail: Optional[str] = None

    @field_validator("id")
    def validate_scenario_id_format(cls, v):
        """验证场景ID格式"""
        if not v:
            raise ValueError("Scenario ID cannot be empty")
        # 验证常见的ID格式
        valid_patterns = [
            "coffee-shop-",  # basic
            "relationship-",  # basic
            "investment-",  # basic
            "game-",  # game
            "adv-game-",  # advanced game
            "hist-",  # historical
        ]
        if not any(v.startswith(pattern) for pattern in valid_patterns):
            # 这里我们允许任何有效的ID格式，只是发出警告
            pass
        return v


class BasicScenario(BaseModel):
    """基础场景模型"""

    id: str
    scenarioType: Literal[ScenarioType.BASIC] = ScenarioType.BASIC
    title: str
    description: str
    difficulty: DifficultyLevel
    estimatedDuration: int = Field(..., gt=0)
    category: Optional[str] = None
    thumbnail: Optional[str] = None
    fullDescription: Optional[str] = None
    targetBiases: List[str] = []
    cognitiveBias: Optional[str] = None
    duration: Optional[str] = None
    advancedChallenges: List[AdvancedChallenge] = []


class GameScenario(BaseModel):
    """高级游戏场景模型"""

    scenarioId: str  # game scenarios use scenarioId instead of id
    scenarioType: Literal[ScenarioType.GAME] = ScenarioType.GAME
    title: str
    description: str
    gameType: str
    rules: GameRules
    steps: List[GameStep]
    analysis: GameAnalysis
    difficulty: DifficultyLevel
    estimatedDuration: int = Field(..., gt=0)
    category: Optional[str] = None

    # 添加 id 字段以保持一致性（从 scenarioId 映射）
    @property
    def id(self) -> str:
        """返回 scenarioId 以保持 API 一致性"""
        return self.scenarioId


class HistoricalCase(BaseModel):
    """历史案例模型"""

    scenarioId: str  # historical cases use scenarioId
    scenarioType: Literal[ScenarioType.HISTORICAL] = ScenarioType.HISTORICAL
    title: str
    description: str
    category: Optional[str] = None
    estimatedDuration: int = Field(..., gt=0)
    decisionPoints: List[DecisionPoint]
    actualOutcomes: List[str]
    alternativeOptions: List[str]
    lessons: List[str]
    pyramidAnalysis: PyramidAnalysis

    # 添加 id 字段以保持一致性（从 scenarioId 映射）
    @property
    def id(self) -> str:
        """返回 scenarioId 以保持 API 一致性"""
        return self.scenarioId


# ========== 游戏会话和状态模型 ==========


class GameState(BaseModel):
    """游戏状态模型 - 根据场景类型有不同的字段"""

    # 咖啡店场景字段
    satisfaction: Optional[int] = Field(default=50, description="满意度")
    resources: Optional[int] = Field(default=1000, description="资源")
    reputation: Optional[int] = Field(default=50, description="声誉")

    # 投资场景字段
    portfolio: Optional[int] = Field(default=10000, description="投资组合")
    knowledge: Optional[int] = Field(default=0, description="知识水平")

    # 关系场景字段
    trust: Optional[int] = Field(default=50, description="信任度")

    # 通用字段
    turn_number: int = Field(default=1, description="当前回合数")


class GameSession(BaseModel):
    """游戏会话模型"""

    gameId: str
    scenarioId: str
    difficulty: DifficultyLevel
    status: str = Field(default="active")
    gameState: Optional[GameState] = None
    decision_history: List[Dict[str, Any]] = Field(default_factory=list)
    delayed_effects: List[Dict[str, Any]] = Field(default_factory=list)
    patterns: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


# ========== __init__.py 导出 ==========

__all__ = [
    "ScenarioType",
    "DifficultyLevel",
    "AdvancedChallenge",
    "GameRules",
    "GameStep",
    "GameAnalysis",
    "DecisionPoint",
    "PyramidAnalysis",
    "BaseScenario",
    "BasicScenario",
    "GameScenario",
    "HistoricalCase",
    "GameState",
    "GameSession",
]

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class QuestionType(str, Enum):
    exponential = "exponential"
    compound = "compound"
    historical = "historical"
    game = "game"


class TopicType(str, Enum):
    exponential_growth = "exponential-growth"
    compound_interest = "compound-interest"
    historical_decision = "historical-decision"
    reasoning_game = "reasoning-game"


class CognitiveTestQuestion(BaseModel):
    """认知测试问题模型"""
    testId: str
    questionType: QuestionType
    topic: TopicType
    questionText: str
    options: List[str]
    correctAnswer: int
    explanation: str
    difficulty: str = "medium"
    relatedConcepts: List[str] = []


class HistoricalScenario(BaseModel):
    """历史场景模型"""
    scenarioId: str
    title: str
    description: str
    decisionPoints: List[Dict[str, Any]]
    actualOutcomes: List[str]
    alternativeOptions: List[str]
    lessons: List[str]
    pyramidAnalysis: Dict[str, Any]


class GameScenario(BaseModel):
    """游戏场景模型"""
    scenarioId: str
    title: str
    description: str
    gameType: str
    steps: List[Dict[str, Any]]
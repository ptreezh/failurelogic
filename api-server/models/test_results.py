from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChallengeResultSummary(BaseModel):
    """
    挑战结果汇总模型
    对应数据模型中的 ChallengeResultSummary 实体
    """
    userId: str
    sessionId: str
    testType: str  # 'exponential', 'compound', 'historical', 'game'
    score: float = 0.0  # 得分在0-100之间
    biasScores: Optional[Dict[str, float]] = {}  # 按不同认知偏见类型划分的得分
    estimationErrors: List[float] = []  # 用户估算值与实际值之间的差异
    improvementAreas: List[str] = []  # 需要改进的领域
    pyramidExplanations: List[str] = []  # 使用金字塔原理的解释
    completionTime: Optional[datetime] = None  # 完成时间
    totalTimeSpent: Optional[float] = None  # 总共花费时间（秒）

    def calculate_score(self) -> float:
        """计算分数，确保在0-100范围内"""
        self.score = max(0.0, min(100.0, self.score))
        return self.score


class ExplanationFramework(BaseModel):
    """
    解释框架模型
    对应数据模型中的 ExplanationFramework 实体
    """
    explanationId: str
    coreConclusion: str  # 主要结论
    supportingArguments: List[str]  # 支持论点
    examples: List[str]  # 实际例子
    actionableAdvice: List[str]  # 实用建议
    biasType: str  # 解释的认知偏差类型
    relatedTests: List[str] = []  # 相关的测试
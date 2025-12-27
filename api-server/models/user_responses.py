from pydantic import BaseModel
from typing import List, Optional, Union
from enum import Enum
from datetime import datetime


class ConfidenceLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class UserResponseRecord(BaseModel):
    """
    用户响应记录模型
    对应数据模型中的 UserResponseRecord 实体
    """
    userId: str
    sessionId: str
    questionId: str
    userChoice: Union[str, int, float]
    userEstimation: Optional[float] = None
    actualValue: Optional[float] = None
    responseTime: datetime = datetime.now()
    confidence: Optional[ConfidenceLevel] = ConfidenceLevel.medium
    deviation: Optional[float] = None  # 通过计算得出 (abs(userEstimation - actualValue) / actualValue) * 100

    def calculate_deviation(self) -> float:
        if self.userEstimation is not None and self.actualValue is not None and self.actualValue != 0:
            self.deviation = abs(self.userEstimation - self.actualValue) / abs(self.actualValue) * 100
        return self.deviation or 0.0


class UserSession(BaseModel):
    """
    用户会话模型
    """
    sessionId: str
    userId: str
    testType: str
    startTime: datetime = datetime.now()
    endTime: Optional[datetime] = None
    status: str = "NEW"  # NEW, IN_PROGRESS, COMPLETED, RESULTS_SHOWN
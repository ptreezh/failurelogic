"""
统一响应格式模块
定义API的标准响应格式
"""
from typing import Generic, TypeVar, Optional, Dict, Any
from pydantic import BaseModel
from enum import Enum


T = TypeVar('T')


class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class APIResponse(BaseModel, Generic[T]):
    """标准API响应格式"""
    success: bool
    status: ResponseStatus
    data: Optional[T] = None
    message: Optional[str] = None
    error: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

    @classmethod
    def success_response(cls, data: T = None, message: str = "操作成功", metadata: Dict[str, Any] = None):
        """创建成功响应"""
        return cls(
            success=True,
            status=ResponseStatus.SUCCESS,
            data=data,
            message=message,
            metadata=metadata
        )

    @classmethod
    def error_response(cls, message: str = "操作失败", error_code: str = "GENERIC_ERROR", 
                      error_details: Dict[str, Any] = None, metadata: Dict[str, Any] = None):
        """创建错误响应"""
        error_info = {
            "error_code": error_code,
            "message": message
        }
        if error_details:
            error_info.update(error_details)
            
        return cls(
            success=False,
            status=ResponseStatus.ERROR,
            message=message,
            error=error_info,
            metadata=metadata
        )


class CalculationResult(BaseModel):
    """计算结果格式"""
    result: float
    scientific_notation: str
    comparison: str
    calculation_details: Optional[Dict[str, Any]] = None


class BiasAnalysisResult(BaseModel):
    """偏差分析结果格式"""
    user_estimation: float
    actual_value: float
    error_ratio: float
    bias_direction: str
    severity: str
    explanation: str
    pyramid_explanation: Optional[Dict[str, Any]] = None
"""
统一错误处理模块
提供全局错误处理和异常捕获机制
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any
import logging
import traceback


# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CustomException(Exception):
    """自定义异常类"""
    def __init__(self, message: str, error_code: str = "GENERIC_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    # 记录错误详情
    error_id = _generate_error_id()
    logger.error(f"Error ID: {error_id} | Path: {request.url.path} | Method: {request.method}")
    logger.error(f"Exception: {exc}")
    logger.error(f"Traceback: {traceback.format_exc()}")

    # 根据异常类型返回不同的错误信息
    if isinstance(exc, CustomException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "error_id": error_id,
                    "error_code": exc.error_code,
                    "message": exc.message,
                    "details": str(exc)
                }
            }
        )
    elif isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "error_id": error_id,
                    "error_code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                    "details": str(exc)
                }
            }
        )
    else:
        # 未预期的错误
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": {
                    "error_id": error_id,
                    "error_code": "INTERNAL_ERROR",
                    "message": "内部服务器错误",
                    "details": "发生了一个意外错误，请稍后重试"
                }
            }
        )


def _generate_error_id() -> str:
    """生成错误ID"""
    import uuid
    return str(uuid.uuid4())


def handle_calculation_errors(func):
    """计算函数错误处理装饰器"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except OverflowError:
            logger.error(f"Overflow error in {func.__name__}")
            raise CustomException(
                message="计算结果超出允许范围，请调整输入参数",
                error_code="CALCULATION_OVERFLOW",
                status_code=400
            )
        except ZeroDivisionError:
            logger.error(f"Division by zero error in {func.__name__}")
            raise CustomException(
                message="计算中出现除零错误，请检查输入参数",
                error_code="DIVISION_BY_ZERO",
                status_code=400
            )
        except ValueError as e:
            logger.error(f"Value error in {func.__name__}: {str(e)}")
            raise CustomException(
                message=f"输入参数无效: {str(e)}",
                error_code="INVALID_INPUT_VALUE",
                status_code=400
            )
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}")
            raise CustomException(
                message="计算过程中发生未知错误",
                error_code="CALCULATION_ERROR",
                status_code=500
            )
    return wrapper


def validate_input_range(value: float, min_val: float = None, max_val: float = None, param_name: str = "value"):
    """输入范围验证"""
    if min_val is not None and value < min_val:
        raise CustomException(
            message=f"{param_name}不能小于{min_val}",
            error_code="INPUT_BELOW_MINIMUM",
            status_code=400
        )
    
    if max_val is not None and value > max_val:
        raise CustomException(
            message=f"{param_name}不能大于{max_val}",
            error_code="INPUT_ABOVE_MAXIMUM",
            status_code=400
        )
    
    return value


def safe_numeric_operation(operation_func, *args, **kwargs):
    """安全的数值运算包装器"""
    try:
        result = operation_func(*args, **kwargs)
        
        # 检查结果是否为无穷大或NaN
        if isinstance(result, (int, float)):
            if result == float('inf') or result == float('-inf'):
                raise OverflowError("Operation resulted in infinity")
            if str(result).lower() == 'nan':
                raise ValueError("Operation resulted in NaN")
        
        return result
    except OverflowError:
        raise CustomException(
            message="计算结果超出允许范围，请调整输入参数",
            error_code="CALCULATION_OVERFLOW",
            status_code=400
        )
    except ValueError as e:
        raise CustomException(
            message=f"数值计算错误: {str(e)}",
            error_code="NUMERIC_CALCULATION_ERROR",
            status_code=400
        )
    except Exception as e:
        raise CustomException(
            message=f"计算过程中发生错误: {str(e)}",
            error_code="CALCULATION_ERROR",
            status_code=500
        )
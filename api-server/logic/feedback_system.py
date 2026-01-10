"""
反馈系统模块
处理答案并提供即时反馈
"""

from typing import Dict, Any
from .cognitive_bias_analysis import generate_improved_feedback


def process_answer_with_instant_feedback(answer_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    处理用户答案并提供即时反馈
    """
    # 使用改进的反馈生成
    feedback_result = generate_improved_feedback(answer_data)

    return {
        "status": "processed",
        "is_correct": feedback_result.get("is_correct", False),
        "feedback": feedback_result.get("explanation", ""),
        "result_explanation": feedback_result.get("explanation", ""),
        "immediate_feedback": {
            "message": "您的答案已收到",
            "type": "success" if feedback_result.get("is_correct", False) else "info",
        },
        "bias_analysis": feedback_result,
        "response_time_ms": 50,  # 模拟处理时间
        "time_taken_ms": 50,  # 时间信息
    }

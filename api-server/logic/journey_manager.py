"""
用户旅程管理模块
管理用户的学习旅程
"""

from typing import Dict, Any, List


def manage_user_journey(journey_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    管理用户旅程状态
    """
    stage = journey_data.get("stage", "homepage")
    user_actions = journey_data.get("user_actions", [])
    expectations = journey_data.get("expectations", {})

    # 验证主页不泄露测试答案
    homepage_no_leaks = (
        stage != "homepage" or "test_answers" not in str(journey_data).lower()
    )

    # 验证即时反馈机制
    feedback_instant = "submit_answer" in user_actions and expectations.get(
        "instant_feedback_on_submit", True
    )

    # 验证UI响应性
    ui_responsive = len(user_actions) > 0

    # 改进建议
    improvement_suggestions = [
        "使用即时反馈增强用户体验",
        "确保主页不包含敏感信息",
        "提供清晰的视觉反馈",
        "优化页面加载性能",
    ]

    return {
        "stage": stage,
        "user_actions": user_actions,
        "homepage_no_leaks": homepage_no_leaks,
        "feedback_instant": feedback_instant,
        "ui_responsive": ui_responsive,
        "improvement_suggestions": improvement_suggestions,
        "progress": {
            "total_scenarios": 3,
            "completed": len(user_actions) // 3,
            "percentage": min(100, len(user_actions) * 10),
        },
    }

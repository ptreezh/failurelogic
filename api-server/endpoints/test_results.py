from fastapi import APIRouter
from typing import Dict, Any, List
import json
from datetime import datetime

from ..models.test_results import ChallengeResultSummary
from ..models.user_responses import UserResponseRecord

# 创建路由器
router = APIRouter(prefix="/api", tags=["test_results"])

@router.get("/test-results/aggregate/{user_id}")
async def get_user_aggregate_results(user_id: str):
    """获取用户的聚合测试结果"""
    # 这拟返回用户聚合结果
    return {
        "userId": user_id,
        "total_tests_completed": 5,
        "average_score": 76.5,
        "improvement_areas": ["指数增长理解", "复利效应认识"],
        "trend_analysis": {
            "recent_scores": [70, 72, 75, 78, 80],
            "improvement_rate": 2.5
        },
        "next_recommendations": [
            "继续练习指数增长相关测试",
            "关注复利思维陷阱测试",
            "尝试历史决策重现挑战"
        ]
    }

@router.get("/test-results/export/{user_id}")
async def export_user_results(user_id: str, format: str = "json"):
    """导出用户测试结果"""
    # 基于format参数返回不同格式的结果
    if format.lower() == "json":
        return {
            "userId": user_id,
            "export_date": datetime.now().isoformat(),
            "results_format": "json",
            "data": {
                "test_history": [
                    {
                        "sessionId": "session_001",
                        "testType": "exponential",
                        "score": 85,
                        "completed_at": "2025-11-09T10:30:00Z",
                        "improvement_areas": ["exponential_misconception"]
                    },
                    {
                        "sessionId": "session_002", 
                        "testType": "compound",
                        "score": 68,
                        "completed_at": "2025-11-09T11:15:00Z",
                        "improvement_areas": ["compound_interest_misunderstanding"]
                    }
                ],
                "aggregate_stats": {
                    "total_tests": 2,
                    "average_score": 76.5,
                    "most_common_biases": ["linear_thinking", "compound_interest_misunderstanding"]
                }
            }
        }
    elif format.lower() == "csv":
        # 返回CSV格式的模拟数据
        return {
            "userId": user_id,
            "export_date": datetime.now().isoformat(),
            "results_format": "csv",
            "download_url": f"/api/test-results/download/{user_id}?format=csv"
        }
    else:
        return {"error": f"不支持的格式: {format}", "supported_formats": ["json", "csv"]}

@router.get("/test-results/dashboard/{user_id}")
async def get_user_dashboard(user_id: str):
    """获取用户测试仪表板"""
    return {
        "userId": user_id,
        "dashboard_data": {
            "current_streak": 3,
            "badges_earned": [
                "指数增长新手", 
                "复利探索者",
                "线性思维挑战者"
            ],
            "weekly_progress": {
                "this_week": 85,
                "last_week": 72,
                "trend": "up"
            },
            "top_improvement_areas": [
                {
                    "area": "指数增长误区",
                    "improvement": 15,
                    "current_level": "Developing"
                },
                {
                    "area": "复利思维陷阱", 
                    "improvement": 5,
                    "current_level": "Beginning"
                }
            ],
            "recommended_next_steps": [
                "完成兔子繁殖挑战",
                "尝试历史决策重现",
                "练习更多复利计算"
            ]
        }
    }

@router.put("/test-results/settings/{user_id}")
async def update_user_settings(user_id: str, settings: Dict[str, Any]):
    """更新用户的测试设置"""
    # 在实际应用中，这里会将设置保存到数据库
    # 现在返回成功消息
    return {
        "userId": user_id,
        "settings_updated": True,
        "updated_settings": settings,
        "message": "用户设置已成功更新"
    }

@router.get("/test-results/statistics/global")
async def get_global_statistics():
    """获取全局统计数据"""
    return {
        "total_users": 1250,
        "total_tests_taken": 5420,
        "average_score": 68.2,
        "most_common_biases": [
            {"bias": "linear_thinking", "frequency": 0.42},
            {"bias": "exponential_misconception", "frequency": 0.38},
            {"bias": "compound_interest_misunderstanding", "frequency": 0.35}
        ],
        "top_improved_areas": [
            {"area": "指数增长理解", "improvement_rate": 0.65},
            {"area": "复利效应认识", "improvement_rate": 0.58}
        ]
    }

@router.delete("/test-results/session/{session_id}")
async def delete_session(session_id: str):
    """删除特定会话的测试结果"""
    # 在实际应用中，这里会从数据库删除会话数据
    # 现在返回成功消息
    return {
        "session_id": session_id,
        "deleted": True,
        "message": f"会话 {session_id} 的测试结果已删除"
    }
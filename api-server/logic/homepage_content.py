"""
主页内容模块
提供主页内容和结构
"""

from typing import Dict, Any


def get_homepage_content() -> Dict[str, Any]:
    """
    获取主页内容
    """
    return {
        "title": "认知陷阱教育平台",
        "description": "通过互动游戏学习认知偏差",
        "book_intro": {
            "title": "欢迎来到认知陷阱平台",
            "content": "通过互动式学习体验理解人类认知偏差",
        },
        "cognitive_concepts": [
            {
                "id": "linear_thinking",
                "name": "线性思维偏差",
                "description": "倾向于用线性关系理解非线性现象",
            },
            {
                "id": "exponential_misconception",
                "name": "指数增长误解",
                "description": "低估指数增长的长期效应",
            },
            {
                "id": "time_delay_bias",
                "name": "时间延迟偏差",
                "description": "忽视行动与结果之间的延迟效应",
            },
        ],
        "failure_logic_principles": [
            {
                "id": "tdd_approach",
                "name": "测试驱动开发",
                "description": "先写测试，再实现功能",
            },
            {
                "id": "user_feedback",
                "name": "即时反馈",
                "description": "提供快速、准确的行为反馈",
            },
            {
                "id": "pyramid_principle",
                "name": "金字塔原理",
                "description": "结构化呈现信息和论据",
            },
        ],
        "sections": [
            {
                "id": "introduction",
                "title": "什么是认知偏差？",
                "content": "认知偏差是人类大脑在处理信息时产生的系统性错误模式。",
            }
        ],
        "features": {
            "interactive_scenarios": True,
            "real_time_feedback": True,
            "personalized_learning": True,
        },
    }

"""
教育内容模块
提供认知科学知识内容
"""

from typing import Dict, Any, List


def get_cognitive_science_knowledge(topic: str = "general") -> Dict[str, Any]:
    """
    获取认知科学知识内容
    """
    knowledge_base = {
        "general": {
            "core_concept": "人类认知存在系统性偏差",
            "key_insights": [
                "线性思维偏差：难以理解指数增长",
                "确认偏误：倾向于支持现有信念的信息",
                "时间延迟偏差：忽视行动与结果之间的延迟",
                "复利思维误解：低估长期复合效应",
            ],
        },
        "exponential_growth": {
            "core_concept": "指数增长的威力远超线性增长",
            "examples": [
                "2的10次方是1024，而2的20次方是1,048,576",
                "纸张对折42次可以到达月球",
                "复利投资在长期内产生巨大效应",
            ],
            "takeaways": ["使用计算器验证直觉", "理解对数思维", "重视长期规划"],
        },
    }

    return {
        "topic": topic,
        "content": knowledge_base.get(topic, knowledge_base["general"]),
        "last_updated": "2024-01-01",
        "sections": [
            {
                "id": "introduction",
                "title": "认知科学基础",
                "content": "理解人类认知偏差的根源",
            },
            {
                "id": "biases",
                "title": "常见认知偏差类型",
                "content": "线性思维、确认偏误、时间延迟偏差等",
            },
        ],
        "bias_types": [
            "linear_thinking",
            "exponential_misconception",
            "time_delay_bias",
            "confirmation_bias",
        ],
        "failure_logic_concepts": [
            {
                "id": "tdd",
                "name": "测试驱动开发",
                "description": "先编写测试再实现功能",
            },
            {"id": "feedback", "name": "即时反馈", "description": "提供快速的行为反馈"},
            {
                "id": "pyramid",
                "name": "金字塔原理",
                "description": "结构化呈现论据和信息",
            },
        ],
        "thinking_fallacies": [
            {
                "id": "sunk_cost",
                "name": "沉没成本谬误",
                "description": "因为已经投入而继续错误的决定",
            },
            {
                "id": "availability",
                "name": "可得性启发法",
                "description": "过度依赖容易想起的信息",
            },
            {
                "id": "anchoring",
                "name": "锚定效应",
                "description": "过度依赖初次获得的信息",
            },
        ],
        "interactive_elements": {
            "calculators": True,
            "simulations": True,
            "quiz": True,
        },
    }

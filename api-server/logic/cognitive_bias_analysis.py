"""
认知偏差分析模块
分析用户的认知偏差模式
"""
from typing import Dict, Any, List
import math


def analyze_linear_thinking_bias(user_estimation: float, actual_value: float) -> Dict[str, Any]:
    """
    分析线性思维偏差
    """
    if actual_value == 0:
        error_ratio = float('inf') if user_estimation != 0 else 0
    else:
        error_ratio = abs(user_estimation - actual_value) / actual_value
    
    # 确定偏差方向
    if user_estimation < actual_value * 0.5:
        bias_direction = "严重低估"
    elif user_estimation < actual_value * 0.9:
        bias_direction = "低估"
    elif user_estimation > actual_value * 2:
        bias_direction = "严重高估"
    elif user_estimation > actual_value * 1.1:
        bias_direction = "高估"
    else:
        bias_direction = "相对准确"
    
    return {
        "user_estimation": user_estimation,
        "actual_value": actual_value,
        "error_ratio": error_ratio,
        "bias_direction": bias_direction,
        "bias_type": "linear_thinking_bias",
        "explanation": f"您的估算值为{user_estimation}，实际值为{actual_value}，偏差率为{error_ratio:.2%}，属于{bias_direction}。这反映了人类倾向于使用线性思维来理解非线性现象的认知偏差。"
    }


def analyze_exponential_misconception(user_estimation: float, exponential_base: int, exponential_power: int) -> Dict[str, Any]:
    """
    分析指数增长误解
    """
    actual_value = exponential_base ** exponential_power
    
    if actual_value == 0:
        error_ratio = float('inf') if user_estimation != 0 else 0
    else:
        error_ratio = abs(user_estimation - actual_value) / actual_value
    
    # 确定偏差方向
    if user_estimation < actual_value * 1e-10:  # 显著低估
        bias_direction = "极度低估"
    elif user_estimation < actual_value * 0.01:
        bias_direction = "严重低估"
    elif user_estimation < actual_value * 0.5:
        bias_direction = "低估"
    elif user_estimation > actual_value * 1e10:  # 显著高估
        bias_direction = "极度高估"
    elif user_estimation > actual_value * 100:
        bias_direction = "严重高估"
    else:
        bias_direction = "相对准确"
    
    return {
        "user_estimation": user_estimation,
        "actual_value": actual_value,
        "exponential_expression": f"{exponential_base}^{exponential_power}",
        "error_ratio": error_ratio,
        "bias_direction": bias_direction,
        "bias_type": "exponential_misconception",
        "explanation": f"对于{exponential_base}^{exponential_power}的问题，您的估算值为{user_estimation}，实际值为{'%.2e' % actual_value}，属于{bias_direction}。这体现了人类大脑难以直观理解指数增长威力的认知局限。",
        "pyramid_explanation": {
            "core_conclusion": "人类对指数增长的直觉严重不足",
            "supporting_arguments": [
                "指数增长在初期表现平缓，但后期出现爆炸性增长",
                "人类大脑习惯于线性思维模式",
                "对天文数字缺乏直观感受"
            ],
            "examples": [
                f"2^200的结果{'%.2e' % (2**200)}远超可观测宇宙的原子总数",
                "纸张连续对折的厚度增长",
                "病毒传播的指数模型"
            ],
            "actionable_advice": [
                "使用计算器验证指数计算的直觉",
                "学习对数思维以理解指数现象",
                "重视复利效应在长期决策中的作用"
            ]
        }
    }


def analyze_compound_interest_misunderstanding(
    user_estimation: float, 
    principal: float, 
    rate: float, 
    time: int
) -> Dict[str, Any]:
    """
    分析复利思维误解
    """
    # 计算实际复利结果
    actual_value = principal * (1 + rate/100) ** time
    
    # 计算线性增长结果（用户可能的思维）
    linear_result = principal * (1 + (rate/100) * time)
    
    if actual_value == 0:
        error_ratio = float('inf') if user_estimation != 0 else 0
    else:
        error_ratio = abs(user_estimation - actual_value) / actual_value
    
    # 确定用户思维模式
    if abs(user_estimation - linear_result) < abs(user_estimation - actual_value):
        likely_thinking_pattern = "线性思维"
        explanation_addition = "您可能使用了线性思维来估算复利结果，而忽略了利息再生利息的复合效应。"
    else:
        likely_thinking_pattern = "其他思维模式"
        explanation_addition = ""
    
    return {
        "user_estimation": user_estimation,
        "actual_compound_value": actual_value,
        "linear_approximation": linear_result,
        "error_ratio": error_ratio,
        "likely_thinking_pattern": likely_thinking_pattern,
        "bias_type": "compound_interest_misunderstanding",
        "explanation": f"在本金{principal}元、年利率{rate}%、{time}年的复利计算中，您的估算值为{user_estimation:,.2f}，实际复利结果为{actual_value:,.2f}。{explanation_addition}复利的威力在于'利滚利'，长期效应远超线性增长预测。",
        "pyramid_explanation": {
            "core_conclusion": "人类倾向于低估复利的长期效应",
            "supporting_arguments": [
                "复利效应在早期增长缓慢，容易被忽视",
                "利息再生利息的雪球效应难以直观理解",
                "人类对复合增长的非线性特性缺乏直觉"
            ],
            "examples": [
                "爱因斯坦曾说'复利是世界第八大奇迹'",
                "长期投资中复利效应显著超越简单利息",
                "贷款中的复利可能使债务快速增长"
            ],
            "actionable_advice": [
                "充分考虑复利在投资决策中的重要性",
                "使用复利计算器验证直觉估算",
                "理解复利公式，避免仅凭直觉估算",
                "在借贷时注意复利对债务增长的影响"
            ]
        }
    }


def analyze_complex_system_thinking(user_responses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    分析复杂系统思维中的认知偏差
    """
    bias_types = []
    common_patterns = []
    
    for response in user_responses:
        if 'bias_type' in response:
            bias_types.append(response['bias_type'])
        
        if 'error_ratio' in response and response.get('error_ratio', 0) > 1:
            common_patterns.append("严重低估复杂系统中的非线性效应")
    
    return {
        "analyzed_responses_count": len(user_responses),
        "identified_bias_types": list(set(bias_types)),
        "common_patterns": list(set(common_patterns)),
        "overall_assessment": "复杂系统思维评估",
        "explanation": f"在{len(user_responses)}个复杂系统问题中，识别出{len(set(bias_types))}种认知偏差类型，主要表现为低估复杂系统中的级联效应、非线性反馈和延迟影响。",
        "pyramid_explanation": {
            "core_conclusion": "用户在处理复杂系统问题时常低估非线性效应",
            "supporting_arguments": [
                "复杂系统中各要素相互关联，产生非线性结果",
                "级联故障和反馈循环难以通过简单因果关系理解",
                "时间延迟效应使因果关系更加隐蔽"
            ],
            "examples": [
                "金融危机中的系统性风险传播",
                "生态系统中的连锁反应",
                "技术系统中的级联故障"
            ],
            "actionable_advice": [
                "在分析复杂问题时考虑多因素相互作用",
                "注意延迟效应和反馈循环",
                "建立系统思维模型理解复杂性"
            ]
        }
    }


def create_pyramid_explanation(core_topic: str, supporting_points: List[str], examples: List[str], actionable_advice: List[str]) -> Dict[str, Any]:
    """
    创建金字塔原理结构的解释
    """
    return {
        "core_conclusion": core_topic,
        "supporting_arguments": supporting_points,
        "examples": examples,
        "actionable_advice": actionable_advice
    }


def generate_bias_feedback(bias_type: str, user_response: Dict[str, Any]) -> Dict[str, Any]:
    """
    生成针对特定认知偏差的反馈
    """
    if bias_type == "exponential_misconception":
        return analyze_exponential_misconception(
            user_response.get("userEstimation", 0),
            user_response.get("exponentialBase", 2),
            user_response.get("exponentialPower", 10)
        )
    elif bias_type == "compound_interest_misunderstanding":
        return analyze_compound_interest_misunderstanding(
            user_response.get("userEstimation", 0),
            user_response.get("principal", 100000),
            user_response.get("rate", 8),
            user_response.get("time", 30)
        )
    elif bias_type == "linear_thinking_bias":
        return analyze_linear_thinking_bias(
            user_response.get("userEstimation", 0),
            user_response.get("actualValue", 1000)
        )
    else:
        return {
            "bias_type": bias_type,
            "explanation": "未知的认知偏差类型",
            "pyramid_explanation": {
                "core_conclusion": "需要进一步分析",
                "supporting_arguments": [],
                "examples": [],
                "actionable_advice": []
            }
        }
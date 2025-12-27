"""
增强的反馈生成机制
为认知陷阱测试提供即时改进反馈
"""

from typing import Dict, Any, List
from datetime import datetime


def generate_improved_feedback(response_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    生成改进的反馈，包含即时响应和认知偏差分析
    """
    user_choice = response_data.get('userChoice')
    user_estimation = response_data.get('userEstimation', 0)
    actual_value = response_data.get('actualValue', 0)
    question_type = response_data.get('questionType', 'general')
    
    # 计算偏差百分比
    deviation_percentage = 0
    is_correct = False
    
    if actual_value != 0:
        deviation_percentage = abs(user_estimation - actual_value) / abs(actual_value) * 100
        tolerance = 5  # 容差5%
        is_correct = deviation_percentage <= tolerance
    elif user_choice is not None:  # 对于选择题
        correct_answer = response_data.get('correctAnswer')
        is_correct = user_choice == correct_answer
    
    # 准备认知偏差分析
    bias_analysis = analyze_cognitive_bias(response_data)
    
    # 生成金字塔原理解释
    pyramid_explanation = create_enhanced_pyramid_explanation(
        question_type, 
        user_estimation, 
        actual_value, 
        bias_analysis
    )
    
    return {
        'is_correct': is_correct,
        'user_choice': user_choice,
        'user_estimation': user_estimation,
        'actual_value': actual_value,
        'deviation_percentage': deviation_percentage,
        'result_explanation': generate_result_explanation(response_data),
        'cognitive_bias_analysis': bias_analysis,
        'pyramid_explanation': pyramid_explanation,
        'timestamp': datetime.now().isoformat(),
        'response_time_ms': 150  # 模拟响应时间
    }


def analyze_cognitive_bias(response_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    分析用户可能的认知偏差
    """
    question_type = response_data.get('questionType', 'general')
    user_estimation = response_data.get('userEstimation', 0)
    user_choice = response_data.get('userChoice')
    actual_value = response_data.get('actualValue', 0)
    
    bias_types = []
    
    # 根据题目类型分析不同类型的认知偏差
    if question_type == 'exponential':
        if user_estimation < actual_value * 0.1:  # 严重低估
            bias_types.append({
                'type': 'exponential_misconception',
                'name': '指数增长误区',
                'description': '严重低估指数增长的真实规模和威力',
                'severity': 'high',
                'examples': ['2^200规模误解', '病毒传播速度误判']
            })
        elif user_estimation > actual_value * 10:  # 严重高估
            bias_types.append({
                'type': 'linear_thinking_overcorrection',
                'name': '线性思维过度校正',
                'description': '过度校正线性思维，导致高估指数增长',
                'severity': 'medium',
                'examples': ['在明确提示指数增长后过度反应']
            })
        else:
            bias_types.append({
                'type': 'normal_variation',
                'name': '正常估算差异',
                'description': '估算值在合理范围内，显示对指数增长的良好理解',
                'severity': 'low',
                'examples': ['适度的指数增长认知']
            })
    
    elif question_type == 'compound':
        # 复利思维分析
        if user_estimation < actual_value * 0.5:  # 低估复利效应
            bias_types.append({
                'type': 'compound_interest_underestimation',
                'name': '复利效应低估',
                'description': '低估复利在长期的惊人威力',
                'severity': 'high',
                'examples': ['银行利息、投资复利等场景']
            })
        elif user_estimation > actual_value * 2:  # 过度高估
            bias_types.append({
                'type': 'compound_interest_overestimation',
                'name': '复利效应过度高估',
                'description': '过度高估复利效应',
                'severity': 'medium',
                'examples': ['对复利增长的非理性预期']
            })
    
    elif question_type == 'historical':
        # 历史决策偏差分析
        correct_answer = response_data.get('correctAnswer')
        if user_choice != correct_answer:
            bias_types.append({
                'type': 'confirmation_bias',
                'name': '确认偏误',
                'description': '倾向于选择支持既有观点的决策选项',
                'severity': 'high',
                'examples': ['挑战者号发射决策案例', '群体思维压制不同意见']
            })
    
    return {
        'detected_biases': bias_types,
        'analysis_timestamp': datetime.now().isoformat(),
        'confidence_level': 'high' if len(bias_types) > 0 else 'low'
    }


def create_enhaced_pyramid_explanation(
    question_type: str, 
    user_estimation: float, 
    actual_value: float, 
    bias_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    创建增强的金字塔原理解释
    """
    core_conclusions = {
        'exponential': '人类大脑难以直观理解指数增长的真实规模',
        'compound': '复利效应远超线性思维的预期',
        'historical': '历史决策中的系统性认知偏差导致灾难性结果',
        'game': '推理游戏暴露了思维模式的局限性'
    }
    
    supporting_arguments = {
        'exponential': [
            '指数增长在初期表现平缓，但后期呈爆炸式增长',
            '人类大脑习惯线性思维，难以处理指数级变化',
            '2^200这样的数字超出了日常经验范围'
        ],
        'compound': [
            '复利是"利息再生利息"的雪球效应',
            '长期（30年）复利优势极其显著',
            '人们倾向于用线性思维预测复利结果'
        ],
        'historical': [
            '确认偏误让决策者寻找支持既有选择的信息',
            '群体思维压制了不同意见，形成虚假共识',
            '时间压力影响了客观风险评估'
        ],
        'game': [
            '复杂决策环境下思维模式的局限性',
            '短期思维对长期影响的忽视',
            '信息处理能力的限制'
        ]
    }
    
    examples = {
        'exponential': [
            '2^200粒米的数量比宇宙所有原子总数还多',
            '病毒传播、技术发展的指数模式',
            '2只兔子每年翻5倍约11年达100亿只'
        ],
        'compound': [
            '10万本金8%年利率30年复利增长近10倍',
            '技能积累、知识增长的复利效应',
            '债务复利的负面威力'
        ],
        'historical': [
            '挑战者号发射决策导致7名宇航员遇难',
            '泰坦尼克号速度优先导致安全疏忽',
            '猪湾事件中的情报误判'
        ],
        'game': [
            '商业战略中的短视决策',
            '政策制定中的复杂系统忽视',
            '个人理财中的非理性选择'
        ]
    }
    
    actionable_advice = {
        'exponential': [
            '遇到大规模增长问题时使用数学计算验证直觉',
            '学习对数思维理解指数现象',
            '重视复利和指数增长的力量'
        ],
        'compound': [
            '在长期财务规划中充分利用复利效应',
            '投资时优先考虑复利而非简单利息',
            '理解复利公式，避免仅凭直觉估算'
        ],
        'historical': [
            '建立多元化决策机制，鼓励不同意见',
            '设立独立的安全评估委员会',
            '在重要决策中主动寻求相反证据'
        ],
        'game': [
            '提高复杂系统思考能力',
            '培养长期思维模式',
            '加强批判性思维训练'
        ]
    }
    
    return {
        'question_type': question_type,
        'core_conclusion': core_conclusions.get(question_type, '一般性认知偏差总结'),
        'supporting_arguments': supporting_arguments.get(question_type, []),
        'examples': examples.get(question_type, []),
        'actionable_advice': actionable_advice.get(question_type, []),
        'structure': 'pyramid_principle',
        'user_data': {
            'estimation': user_estimation,
            'actual_value': actual_value,
            'bias_detected': bias_analysis['detected_biases']
        },
        'timestamp': datetime.now().isoformat()
    }


def generate_result_explanation(response_data: Dict[str, Any]) -> str:
    """
    生成结果解释
    """
    question_type = response_data.get('questionType', 'general')
    user_estimation = response_data.get('userEstimation', 0)
    actual_value = response_data.get('actualValue', 0)
    
    if question_type == 'exponential':
        if actual_value > 1e50:  # 2^200级别
            return f"2^{response_data.get('exponent', 200)}的结果是天文数字{actual_value:.2e}，远超我们的日常认知范围。这展示了指数增长的惊人威力及线性思维的局限性。"
        else:
            return f"您的估算值{user_estimation}与实际值{actual_value}存在显著差异，这体现了在面对指数增长时人类直觉的局限性。"
    elif question_type == 'compound':
        principal = response_data.get('principal', 100000)
        rate = response_data.get('rate', 8)
        time_years = response_data.get('time_years', 30)
        return f"在本金{principal}元，年利率{rate}%，时间{time_years}年的情况下，复利结果{actual_value:,.2f}元远超线性增长预期，展示了复利的惊人威力。"
    else:
        return f"您的估算{user_estimation}与实际值{actual_value}的对比揭示了特定的认知模式。"
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
import json
import random
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from models.cognitive_tests import (
    CognitiveTestQuestion, HistoricalScenario, GameScenario,
    QuestionType, TopicType
)
from models.user_responses import UserResponseRecord
from models.test_results import ChallengeResultSummary, ExplanationFramework
from logic.exponential_calculations import (
    calculate_exponential, calculate_exponential_granary_problem,
    calculate_rabbit_growth_simulation, compare_linear_vs_exponential,
    calculate_complex_system_failure, calculate_nano_replication,
    calculate_social_network_growth
)
from logic.compound_interest import calculate_compound_interest
from logic.cognitive_bias_analysis import (
    analyze_linear_thinking_bias,
    analyze_exponential_misconception,
    analyze_compound_interest_misunderstanding,
    create_pyramid_explanation,
    generate_bias_feedback,
    generate_improved_feedback
)
from utils.response_format import APIResponse, CalculationResult, BiasAnalysisResult
from utils.error_handlers import CustomException

# 创建路由器
router = APIRouter(prefix="/api", tags=["cognitive_tests"])

# 加载测试问题数据
def load_questions_from_json(file_path: str) -> List[Dict]:
    """从JSON文件加载问题数据"""
    import os
    full_path = os.path.join(os.path.dirname(__file__), '..', '..', file_path)
    full_path = os.path.normpath(full_path)  # 规范化路径

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            questions_list = []

            # 获取不同类型的题目
            if 'exponential_questions' in data:
                questions_list.extend(data['exponential_questions'])
            if 'compound_questions' in data:
                questions_list.extend(data['compound_questions'])
            if 'historical_cases' in data:
                questions_list.extend(data['historical_cases'])
            if 'game_scenarios' in data:
                questions_list.extend(data['game_scenarios'])

            # 也可能数据结构是直接的列表
            if 'questions' in data:
                questions_list.extend(data['questions'])

            return questions_list
    except FileNotFoundError:
        print(f"Warning: {full_path} not found, using default data")
        return []
    except json.JSONDecodeError:
        print(f"Warning: {full_path} is not valid JSON, using default data")
        return []
    except Exception as e:
        print(f"Warning: Error loading {full_path}: {e}, using default data")
        return []


def load_advanced_questions_from_json(file_path: str) -> List[Dict]:
    """从JSON文件加载高级问题数据"""
    import os

    # Resolve relative paths from repo root.
    # endpoints/ -> api-server/ -> repo root
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

    full_path = file_path
    if not os.path.isabs(full_path):
        full_path = os.path.join(repo_root, file_path)
    full_path = os.path.normpath(full_path)

    try:
        with open(full_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            questions_list = []

            # 获取不同类型的高级题目
            if 'exponential_questions' in data:
                questions_list.extend(data['exponential_questions'])
            if 'compound_questions' in data:
                questions_list.extend(data['compound_questions'])
            if 'historical_cases' in data:
                questions_list.extend(data['historical_cases'])
            if 'game_scenarios' in data:
                questions_list.extend(data['game_scenarios'])

            return questions_list
    except FileNotFoundError:
        print(f"Warning: Advanced questions file {full_path} not found")
        print(f"Current working directory: {os.getcwd()}")
        return []
    except json.JSONDecodeError:
        print(f"Warning: {full_path} is not valid JSON")
        return []
    except Exception as e:
        print(f"Warning: Error loading {full_path}: {e}")
        import traceback
        traceback.print_exc()
        return []

def load_historical_scenarios() -> List[Dict]:
    """从JSON文件加载历史场景数据"""
    import os
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'historical_cases.json')
    file_path = os.path.normpath(file_path)  # 规范化路径
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # 检查数据结构并提取正确的数组
            if 'historical_cases' in data and isinstance(data['historical_cases'], list):
                return data['historical_cases']
            elif 'scenarios' in data and isinstance(data['scenarios'], list):
                return data['scenarios']
            else:
                print(f"Warning: Unexpected data structure in {file_path}")
                return []
    except FileNotFoundError:
        print(f"Warning: {file_path} not found, using default data")
        return []
    except json.JSONDecodeError:
        print(f"Warning: {file_path} is not valid JSON, using default data")
        return []


def load_advanced_historical_scenarios() -> List[Dict]:
    """从JSON文件加载高级历史场景数据"""
    import os
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'advanced_historical_cases.json')
    file_path = os.path.normpath(file_path)  # 规范化路径
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # 检查数据结构并提取正确的数组
            if 'historical_cases' in data and isinstance(data['historical_cases'], list):
                return data['historical_cases']
            elif 'scenarios' in data and isinstance(data['scenarios'], list):
                return data['scenarios']
            else:
                print(f"Warning: Unexpected data structure in {file_path}")
                return []
    except FileNotFoundError:
        print(f"Warning: {file_path} not found, using advanced default data")
        return []
    except json.JSONDecodeError:
        print(f"Warning: {file_path} is not valid JSON, using advanced default data")
        return []

def load_game_scenarios() -> List[Dict]:
    """从JSON文件加载游戏场景数据"""
    import os
    file_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'game_scenarios.json')
    file_path = os.path.normpath(file_path)  # 规范化路径
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # 检查数据结构并提取正确的数组
            if 'game_scenarios' in data and isinstance(data['game_scenarios'], list):
                return data['game_scenarios']
            elif 'scenarios' in data and isinstance(data['scenarios'], list):
                return data['scenarios']
            elif 'games' in data and isinstance(data['games'], list):
                return data['games']
            else:
                print(f"Warning: Unexpected data structure in {file_path}")
                return []
    except FileNotFoundError:
        print(f"Warning: {file_path} not found, using default data")
        return []
    except json.JSONDecodeError:
        print(f"Warning: {file_path} is not valid JSON, using default data")
        return []

# 指数增长相关端点
@router.get("/exponential/questions")
async def get_exponential_questions(include_advanced: bool = Query(default=False, description="是否包含高级难度问题")):
    """获取指数增长相关的测试问题"""
    questions_data = load_questions_from_json('api-server/data/exponential_questions.json')

    if include_advanced:
        advanced_questions = load_advanced_questions_from_json('api-server/data/advanced_exponential_questions.json')
        questions_data.extend(advanced_questions)

    questions = [CognitiveTestQuestion(**q) for q in questions_data]

    return {
        "questions": [q.dict() for q in questions if q.questionType == QuestionType.exponential],
        "total_count": len([q for q in questions if q.questionType == QuestionType.exponential]),
        "title": "指数增长误区专项测试" + ("（含高级挑战）" if include_advanced else ""),
        "difficulty_levels": ["basic", "advanced"] if include_advanced else ["basic"]
    }


@router.get("/exponential/advanced-questions")
async def get_advanced_exponential_questions():
    """获取高级指数增长相关的测试问题"""
    import os
    # 使用相对于api-server目录的路径
    current_dir = os.path.dirname(__file__)  # endpoints目录
    data_path = os.path.join(current_dir, '..', 'data', 'advanced_exponential_questions.json')
    data_path = os.path.normpath(data_path)

    questions_data = load_advanced_questions_from_json(data_path)
    questions = [CognitiveTestQuestion(**q) for q in questions_data]

    return {
        "questions": [q.dict() for q in questions if q.questionType == QuestionType.exponential],
        "total_count": len([q for q in questions if q.questionType == QuestionType.exponential]),
        "title": "高级指数增长挑战",
        "difficulty_level": "advanced"
    }

from pydantic import BaseModel

# 创建请求模型
class ExponentialRequest(BaseModel):
    base: float
    exponent: int

class CompoundRequest(BaseModel):
    principal: float
    annual_rate: float
    time_years: int
    compounding_frequency: int = 1

@router.post("/exponential/calculate/exponential")
async def calculate_exponential_endpoint(request: ExponentialRequest):
    """计算指数增长结果"""
    try:
        result = calculate_exponential(request.base, request.exponent)
        response_data = CalculationResult(
            result=result,
            scientific_notation=f"{result:.2e}" if result > 1e10 else str(result),
            comparison="这是一个天文数字，远超日常生活中的数量级。",
            calculation_details={
                "base": request.base,
                "exponent": request.exponent
            }
        )
        return APIResponse.success_response(
            data=response_data.dict(),
            message="指数计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )

@router.post("/exponential/calculate/granary")
async def calculate_granary_problem(
    grains_per_unit: int = Query(default=1, description="每单位的米粒数"),
    rice_weight_per_grain_g: float = Query(default=0.02, description="每粒米的重量(克)")
):
    """计算米粒问题（2^200粒米的重量和体积）"""
    try:
        # 使用2^200作为默认单位数
        result = calculate_exponential_granary_problem(
            grains_per_unit=grains_per_unit,
            units=2**200,  # 2的200次方
            rice_weight_per_grain_g=rice_weight_per_grain_g
        )
        return APIResponse.success_response(
            data=result,
            message="米粒问题计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )

@router.post("/exponential/calculate/rabbit-growth")
async def calculate_rabbit_growth(
    starting_rabbits: int = Query(default=10, description="起始兔子数量"),
    years: int = Query(default=11, description="年数"),
    growth_multiplier: int = Query(default=5, description="每年增长倍数")
):
    """模拟兔子增长 - 从10只兔子，每年翻5倍，11年后会有多少只"""
    try:
        result = calculate_rabbit_growth_simulation(
            starting_rabbits=starting_rabbits,
            years=years,
            growth_multiplier=growth_multiplier
        )
        return APIResponse.success_response(
            data=result,
            message="兔子增长模拟计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )


@router.post("/exponential/calculate/complex-system-failure")
async def calculate_complex_system_failure(
    initial_failure: int = Query(default=1, description="初始故障数量"),
    cascade_multiplier: float = Query(default=2.0, description="级联倍数"),
    time_periods: int = Query(default=20, description="时间周期数"),
    recovery_rate: float = Query(default=0.1, description="恢复率")
):
    """计算复杂系统中的级联故障"""
    try:
        result = calculate_complex_system_failure(
            initial_failure=initial_failure,
            cascade_multiplier=cascade_multiplier,
            time_periods=time_periods,
            recovery_rate=recovery_rate
        )
        return APIResponse.success_response(
            data=result,
            message="复杂系统故障计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )


@router.post("/exponential/calculate/nano-replication")
async def calculate_nano_replication(
    initial_units: int = Query(default=1, description="初始单位数"),
    replication_cycles: int = Query(default=60, description="复制周期数"),
    unit_volume_m3: float = Query(default=1e-27, description="单个单位体积（立方米）")
):
    """计算自我复制纳米机器人的体积增长"""
    try:
        result = calculate_nano_replication(
            initial_units=initial_units,
            replication_cycles=replication_cycles,
            unit_volume_m3=unit_volume_m3
        )
        return APIResponse.success_response(
            data=result,
            message="纳米复制计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )


@router.post("/exponential/calculate/social-network-growth")
async def calculate_social_network_growth(
    initial_users: int = Query(default=10, description="初始用户数"),
    invite_rate: float = Query(default=2.0, description="邀请率"),
    retention_rate: float = Query(default=0.8, description="留存率"),
    time_periods: int = Query(default=30, description="时间周期数")
):
    """计算社交网络增长 - 考虑邀请和留存率"""
    try:
        result = calculate_social_network_growth(
            initial_users=initial_users,
            invite_rate=invite_rate,
            retention_rate=retention_rate,
            time_periods=time_periods
        )
        return APIResponse.success_response(
            data=result,
            message="社交网络增长计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )

@router.post("/exponential/calculate/compare-linear-exponential")
async def compare_linear_exponential(
    initial_amount: float = Query(..., description="初始金额"),
    rate_percent: float = Query(..., description="增长率百分比"),
    time_periods: int = Query(..., description="时间周期数")
):
    """比较线性增长与指数增长的差异"""
    try:
        result = compare_linear_vs_exponential(
            initial_amount=initial_amount,
            rate_percent=rate_percent,
            time_periods=time_periods
        )
        return APIResponse.success_response(
            data=result,
            message="线性与指数增长对比计算成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message="计算过程中发生未知错误",
            error_code="UNKNOWN_ERROR"
        )

# 复利思维相关端点
@router.get("/compound/questions")
async def get_compound_questions(include_advanced: bool = Query(default=False, description="是否包含高级难度问题")):
    """获取复利相关的测试问题"""
    questions_data = load_questions_from_json('api-server/data/compound_questions.json')

    if include_advanced:
        advanced_questions = load_advanced_questions_from_json('api-server/data/advanced_compound_questions.json')
        questions_data.extend(advanced_questions)

    questions = [CognitiveTestQuestion(**q) for q in questions_data]

    return {
        "questions": [q.dict() for q in questions if q.questionType == QuestionType.compound],
        "total_count": len([q for q in questions if q.questionType == QuestionType.compound]),
        "title": "复利思维陷阱专项测试" + ("（含高级挑战）" if include_advanced else ""),
        "difficulty_levels": ["basic", "advanced"] if include_advanced else ["basic"]
    }


@router.get("/compound/advanced-questions")
async def get_advanced_compound_questions():
    """获取高级复利相关的测试问题"""
    questions_data = load_advanced_questions_from_json('api-server/data/advanced_compound_questions.json')
    questions = [CognitiveTestQuestion(**q) for q in questions_data]

    return {
        "questions": [q.dict() for q in questions if q.questionType == QuestionType.compound],
        "total_count": len([q for q in questions if q.questionType == QuestionType.compound]),
        "title": "高级复利思维挑战",
        "difficulty_level": "advanced"
    }

@router.post("/compound/calculate/interest")
async def calculate_compound_interest_endpoint(
    principal: float = Query(..., description="本金"),
    annual_rate: float = Query(..., description="年利率（%）"),
    time_years: int = Query(..., description="年数"),
    compounding_frequency: int = Query(default=1, description="复利频率（次/年）")
):
    """计算复利结果"""
    try:
        result = calculate_compound_interest(
            principal=principal,
            annual_rate=annual_rate,
            time_years=time_years,
            compounding_frequency=compounding_frequency
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/compound/calculate/with-contributions")
async def calculate_compound_with_contributions_endpoint(
    initial_amount: float = Query(default=10000, description="初始金额"),
    monthly_contribution: float = Query(default=1000, description="每月定投金额"),
    annual_rate: float = Query(default=8, description="年化收益率（%）"),
    time_years: int = Query(default=30, description="投资年数")
):
    """计算定期投资复利增长"""
    try:
        result = calculate_compound_with_contributions(
            initial_amount=initial_amount,
            monthly_contribution=monthly_contribution,
            annual_rate=annual_rate,
            time_years=time_years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/compound/calculate/with-inflation")
async def calculate_real_return_with_inflation_endpoint(
    principal: float = Query(default=100000, description="本金"),
    annual_rate: float = Query(default=8, description="年化收益率（%）"),
    inflation_rate: float = Query(default=3, description="通胀率（%）"),
    time_years: int = Query(default=30, description="投资年数")
):
    """计算考虑通胀的复利增长"""
    try:
        result = calculate_real_return_with_inflation(
            principal=principal,
            annual_rate=annual_rate,
            inflation_rate=inflation_rate,
            time_years=time_years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/compound/calculate/tax-affected")
async def calculate_tax_affected_compound_endpoint(
    principal: float = Query(default=100000, description="本金"),
    annual_rate: float = Query(default=8, description="年化收益率（%）"),
    tax_rate: float = Query(default=20, description="税率（%）"),
    time_years: int = Query(default=30, description="投资年数")
):
    """计算考虑税收影响的复利增长"""
    try:
        result = calculate_tax_affected_compound(
            principal=principal,
            annual_rate=annual_rate,
            tax_rate=tax_rate,
            time_years=time_years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/compound/calculate/variable-rates")
async def calculate_compound_with_variable_rates_endpoint(
    principal: float = Query(default=100000, description="本金"),
    rates_schedule: str = Query(..., description="每年利率列表，用逗号分隔，例如: '5,6,7,8,9'"),
    fees_rate: float = Query(default=0.5, description="每年费用率（%）")
):
    """计算不同年份不同利率下的复利增长"""
    try:
        # 解析利率列表
        rates_list = [float(rate.strip()) for rate in rates_schedule.split(',')]

        result = calculate_compound_with_variable_rates(
            principal=principal,
            rates_schedule=rates_list,
            fees_rate=fees_rate
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"计算失败: {str(e)}")


@router.post("/compound/calculate/double-compound")
async def calculate_double_compound_endpoint(
    principal: float = Query(default=100000, description="投资本金"),
    investment_rate: float = Query(default=10, description="投资收益率（%）"),
    loan_rate: float = Query(default=5, description="贷款利率（%）"),
    time_years: int = Query(default=10, description="投资年数")
):
    """计算投资复利和贷款复利的双重影响"""
    try:
        result = calculate_double_compound(
            principal=principal,
            investment_rate=investment_rate,
            loan_rate=loan_rate,
            time_years=time_years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 历史案例相关端点
@router.get("/historical/scenarios")
async def get_historical_scenarios(include_advanced: bool = Query(default=False, description="是否包含高级难度案例")):
    """获取历史决策案例"""
    scenarios_data = load_historical_scenarios()

    if include_advanced:
        advanced_scenarios = load_advanced_historical_scenarios()
        scenarios_data.extend(advanced_scenarios)

    scenarios = [HistoricalScenario(**s) for s in scenarios_data]

    return {
        "scenarios": [s.dict() for s in scenarios],
        "total_count": len(scenarios),
        "title": "历史决策失败案例重现" + ("（含高级挑战）" if include_advanced else ""),
        "difficulty_levels": ["basic", "advanced"] if include_advanced else ["basic"]
    }


@router.get("/historical/advanced-scenarios")
async def get_advanced_historical_scenarios():
    """获取高级历史决策案例"""
    scenarios_data = load_advanced_historical_scenarios()
    scenarios = [HistoricalScenario(**s) for s in scenarios_data]

    return {
        "scenarios": [s.dict() for s in scenarios],
        "total_count": len(scenarios),
        "title": "高级历史决策挑战",
        "difficulty_level": "advanced"
    }

# 推理游戏相关端点
@router.get("/game/scenarios")
async def get_game_scenarios(include_advanced: bool = Query(default=False, description="是否包含高级难度场景")):
    """获取推理游戏场景"""
    scenarios_data = load_game_scenarios()

    if include_advanced:
        advanced_scenarios = load_advanced_questions_from_json('api-server/data/advanced_game_scenarios.json')
        scenarios_data.extend(advanced_scenarios)

    scenarios = [GameScenario(**s) for s in scenarios_data]

    return {
        "scenarios": [s.dict() for s in scenarios],
        "total_count": len(scenarios),
        "title": "互动式思维陷阱游戏" + ("（含高级挑战）" if include_advanced else ""),
        "difficulty_levels": ["basic", "advanced"] if include_advanced else ["basic"]
    }


@router.get("/game/advanced-scenarios")
async def get_advanced_game_scenarios():
    """获取高级推理游戏场景"""
    scenarios_data = load_advanced_questions_from_json('api-server/data/advanced_game_scenarios.json')
    scenarios = [GameScenario(**s) for s in scenarios_data]

    return {
        "scenarios": [s.dict() for s in scenarios],
        "total_count": len(scenarios),
        "title": "高级推理游戏挑战",
        "difficulty_level": "advanced"
    }

# 用户响应和结果相关端点
@router.post("/results/submit")
async def submit_user_response(response_data: Dict[str, Any]):
    """提交用户响应结果"""
    try:
        # 验证用户响应
        user_response = UserResponseRecord(**response_data)

        # 进行偏差分析
        question_id = response_data.get('questionId', '')
        user_estimation = response_data.get('userEstimation', 0)
        question_type = response_data.get('questionType', 'unknown')

        # 进行偏差分析
        analysis_result = None
        if question_type == 'exponential' and user_estimation:
            # 进行指数增长误区分析
            exponential_base = response_data.get('exponentialBase', 2)
            exponential_power = response_data.get('exponentialPower', 200)
            analysis_result = analyze_exponential_misconception(
                user_estimation=user_estimation,
                exponential_base=exponential_base,
                exponential_power=exponential_power
            )
        elif question_type == 'compound' and user_estimation:
            # 进行复利误区分析
            principal = response_data.get('principal', 100000)

            # Accept both "rate" and "annual_rate" (percent)
            rate = response_data.get('annual_rate', response_data.get('rate', 8))

            # Accept both "time_years" and "time_period"
            time_years = response_data.get('time_years', response_data.get('time_period', 30))

            compound_result = calculate_compound_interest(
                principal=principal,
                annual_rate=rate,
                time_years=time_years,
                compounding_frequency=response_data.get('compounding_frequency', 1),
            )

            # 进行复利思维偏差分析
            analysis_result = analyze_compound_interest_misunderstanding(
                user_estimation=user_estimation,
                principal=principal,
                rate=rate,
                time=time_years,
            )
            analysis_result['calculation_details'] = compound_result
        elif question_type == 'complex_system' and user_estimation:
            # 针对复杂系统问题的分析
            target_value = response_data.get('actualValue', 1e10)
            analysis_result = analyze_linear_thinking_bias(user_estimation, target_value)
            analysis_result['bias_type'] = 'complex_system_misunderstanding'
            analysis_result['explanation'] = f"对于复杂系统问题，您的估算值为{user_estimation}，实际值为{target_value}。复杂系统中的非线性效应和级联故障往往被严重低估。"
        elif question_type == 'advanced' and user_estimation:
            # 高级问题的通用分析
            actual_value = response_data.get('actualValue', user_estimation)
            analysis_result = analyze_linear_thinking_bias(user_estimation, actual_value)
            analysis_result['bias_type'] = 'advanced_cognitive_bias'
            analysis_result['explanation'] = f"在高级认知挑战中，您的估算值为{user_estimation}，实际值为{actual_value}。这可能反映了对复杂现象的线性思维偏差。"

        # 生成结果汇总
        result_summary = ChallengeResultSummary(
            userId=response_data.get('userId', 'anonymous'),
            sessionId=response_data.get('sessionId', 'session'),
            testType=question_type,
            estimationErrors=[abs(user_estimation - response_data.get('actualValue', user_estimation))],
            pyramidExplanations=[analysis_result.get('explanation', '') if analysis_result else '']
        )

        response_data = {
            "sessionId": response_data.get('sessionId', 'session'),
            "analysis": analysis_result,
            "summary": result_summary.dict()
        }

        return APIResponse.success_response(
            data=response_data,
            message="用户响应提交成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message=f"提交结果失败: {str(e)}",
            error_code="SUBMISSION_ERROR"
        )

@router.post("/exponential/check-answer/{question_id}")
async def check_exponential_answer(question_id: str, answer_data: Dict[str, Any]):
    """检查指数增长问题答案"""
    try:
        from logic.cognitive_bias_analysis import analyze_linear_thinking_bias, analyze_exponential_misconception

        user_choice = answer_data.get("userChoice")
        user_estimation = answer_data.get("userEstimation", 0)

        # 根据问题ID确定实际值
        actual_value = 0
        if question_id == "exp-001":  # 2^200问题
            actual_value = 2**200
        elif question_id == "exp-002":  # 兔子繁殖问题
            actual_value = 10 * (5**11)  # 从10只兔子开始，11年后翻5倍
        elif question_id == "exp-003":  # 纸张折叠问题
            actual_value = 0.1 * (2**200)  # 0.1毫米纸张对折200次后的厚度(mm)
        else:
            # 如果是其他ID，尝试从参数中获取actualValue
            actual_value = answer_data.get("actualValue", 0)

        # 进行认知偏差分析
        bias_analysis = analyze_exponential_misconception(user_estimation, 2, 200)  # 对于2^200问题

        response_data = {
            "question_id": question_id,
            "user_choice": user_choice,
            "user_estimation": user_estimation,
            "actual_value": actual_value,
            "is_correct": abs(user_estimation - actual_value) / actual_value * 100 < 5 if actual_value != 0 else False,  # 5%以内算正确
            "analysis": bias_analysis,
            "explanation": f"您的估算值为{user_estimation:,.2f}，实际值为{'%.2e' % actual_value if actual_value > 1e10 else f'{actual_value:,.2f}'}，展现了指数增长思维的局限性。"
        }

        return APIResponse.success_response(
            data=response_data,
            message="答案检查成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message=f"检查答案失败: {str(e)}",
            error_code="ANSWER_CHECK_ERROR"
        )


@router.get("/results/{user_id}/{session_id}")
async def get_session_results(user_id: str, session_id: str):
    """获取特定用户的会话结果"""
    try:
        # 在实际实现中，这里会从数据库或内存中获取用户结果
        # 现在返回一个模拟结果
        response_data = {
            "userId": user_id,
            "sessionId": session_id,
            "testType": "sample",
            "responses": [],
            "summary": {
                "score": 75.0,
                "estimationAccuracy": 0.6,
                "biasIdentification": ["linear_thinking"]
            }
        }

        return APIResponse.success_response(
            data=response_data,
            message="获取会话结果成功"
        )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message=f"获取会话结果失败: {str(e)}",
            error_code="SESSION_RESULT_FETCH_ERROR"
        )

# 认知偏差解释相关端点
@router.get("/explanations/{bias_type}")
async def get_bias_explanation(bias_type: str):
    """获取特定认知偏差的详细解释"""
    try:
        explanations = {
            "linear_thinking": {
                "explanationId": "bias-exp-001",
                "biasType": "linear_thinking",
                "coreConclusion": "人类倾向于认为原因和结果之间存在直接的、成比例的关系",
                "supportingArguments": [
                    "在复杂系统中，这种思维方式往往会导致错误的决策",
                    "线性思维无法捕捉到非线性反馈和延迟效应"
                ],
                "examples": [
                    "2^200规模的误解",
                    "技术发展速度的误判",
                    "流行病传播的误判"
                ],
                "actionableAdvice": [
                    "考虑非线性效应",
                    "关注系统中的反馈循环",
                    "避免简单的线性外推"
                ],
                "relatedTests": ["exponential-growth", "compound-interest"]
            },
            "exponential_misconception": {
                "explanationId": "bias-exp-002",
                "biasType": "exponential_misconception",
                "coreConclusion": "人们难以直观理解指数增长的真实含义和威力",
                "supportingArguments": [
                    "指数增长在初期表现平缓，但后期会出现爆发式增长",
                    "人类大脑习惯于线性思维，难以处理指数级变化"
                ],
                "examples": [
                    "2^200远超宇宙原子总数的例子",
                    "病毒传播曲线的陡增阶段",
                    "复利效应的长期影响"
                ],
                "actionableAdvice": [
                    "使用计算器验证直觉估算",
                    "学习对数思维理解指数现象",
                    "重视复利效应在长期决策中的作用"
                ],
                "relatedTests": ["exponential-growth"]
            },
            "compound_interest_misunderstanding": {
                "explanationId": "bias-comp-001",
                "biasType": "compound_interest_misunderstanding",
                "coreConclusion": "人们往往低估复利的长期效应",
                "supportingArguments": [
                    "复利效应在早期增长缓慢，容易被忽视",
                    "利息再生利息的雪球效应被低估"
                ],
                "examples": [
                    "投资中的长期复利增长",
                    "贷款中的复利增长（负债）",
                    "人口增长的复利效应"
                ],
                "actionableAdvice": [
                    "充分考虑复利在投资决策中的重要性",
                    "理解复利公式，避免仅凭直觉估算",
                    "在借贷时注意复利对债务增长的影响"
                ],
                "relatedTests": ["compound-interest"]
            }
        }

        if bias_type in explanations:
            explanation = ExplanationFramework(**explanations[bias_type])
            return APIResponse.success_response(
                data=explanation.dict(),
                message="获取认知偏差解释成功"
            )
        else:
            return APIResponse.error_response(
                message=f"找不到类型为 {bias_type} 的认知偏差解释",
                error_code="BIAS_EXPLANATION_NOT_FOUND"
            )
    except CustomException as e:
        return APIResponse.error_response(
            message=e.message,
            error_code=e.error_code
        )
    except Exception as e:
        return APIResponse.error_response(
            message=f"获取认知偏差解释失败: {str(e)}",
            error_code="BIAS_EXPLANATION_FETCH_ERROR"
        )
"""
测试重构后的逻辑模块
验证错误处理、输入验证和计算准确性
"""
import sys
import os

# 添加项目根目录到模块搜索路径
current_dir = os.path.dirname(__file__)
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)
sys.path.insert(0, current_dir)

import pytest
from utils.error_handlers import CustomException, handle_calculation_errors, validate_input_range
from logic.exponential_calculations import (
    calculate_exponential,
    calculate_exponential_granary_problem,
    calculate_rabbit_growth_simulation,
    compare_linear_vs_exponential,
    calculate_complex_system_failure,
    calculate_nano_replication,
    calculate_social_network_growth
)
from logic.cognitive_bias_analysis import (
    analyze_linear_thinking_bias,
    analyze_exponential_misconception,
    analyze_compound_interest_misunderstanding
)


def test_calculate_exponential_valid_inputs():
    """测试指数计算正常输入"""
    result = calculate_exponential(2, 10)
    assert result == 1024.0


def test_calculate_exponential_invalid_inputs():
    """测试指数计算无效输入"""
    # 测试过小的输入值（超出范围）
    try:
        calculate_exponential(-1001, 5)
        raised = False
    except CustomException:
        raised = True
    assert raised, "Expected CustomException for negative inputs"


def test_calculate_exponential_edge_cases():
    """测试指数计算边界情况"""
    # 测试0的幂
    result = calculate_exponential(0, 5)
    assert result == 0.0
    
    # 测试负底数
    result = calculate_exponential(-2, 3)
    assert result == -8.0
    
    # 测试分数指数
    result = calculate_exponential(4, 0.5)
    assert abs(result - 2.0) < 0.001


def test_calculate_exponential_overflow():
    """测试指数计算溢出情况"""
    # 测试非常大的指数，会导致计算溢出
    try:
        calculate_exponential(100, 150)  # 100^150 会导致溢出
        raised = False
    except CustomException:
        raised = True
    assert raised, "Expected CustomException for overflow condition"


def test_calculate_exponential_granary_problem():
    """测试米粒问题计算"""
    result = calculate_exponential_granary_problem(
        grains_per_unit=1,
        rice_weight_per_grain_g=0.02
    )
    assert 'total_grains' in result
    assert 'weight_kg' in result
    assert 'weight_tonnes' in result


def test_calculate_rabbit_growth_simulation():
    """测试兔子增长模拟"""
    result = calculate_rabbit_growth_simulation(
        starting_rabbits=10,
        years=3,
        growth_multiplier=2
    )
    assert result['final_population'] == 80  # 10 * 2^3 = 80
    assert len(result['population_history']) == 4  # 包括第0年


def test_compare_linear_vs_exponential():
    """测试线性与指数增长对比"""
    result = compare_linear_vs_exponential(
        initial_amount=100,
        rate_percent=10,
        time_periods=5
    )
    assert result['linear_result'] == 150  # 100 * (1 + 0.1 * 5)
    # 使用近似相等来处理浮点数精度问题
    assert abs(result['exponential_result'] - 161.051) < 0.001  # 100 * (1.1)^5


def test_calculate_complex_system_failure():
    """测试复杂系统故障计算"""
    result = calculate_complex_system_failure(
        initial_failure=1,
        cascade_multiplier=2.0,
        time_periods=3,
        recovery_rate=0.1
    )
    assert result['initial_failures'] == 1
    assert result['time_periods'] == 3
    assert len(result['failures_over_time']) == 3


def test_calculate_nano_replication():
    """测试纳米复制计算"""
    result = calculate_nano_replication(
        initial_units=1,
        replication_cycles=3,
        unit_volume_m3=1e-27
    )
    assert result['final_count'] == 8  # 1 * 2^3
    assert result['total_volume_m3'] == 8e-27


def test_calculate_social_network_growth():
    """测试社交网络增长计算"""
    result = calculate_social_network_growth(
        initial_users=10,
        invite_rate=2.0,
        retention_rate=0.8,
        time_periods=2
    )
    assert result['initial_users'] == 10
    assert result['time_periods'] == 2
    assert len(result['users_over_time']) == 2


def test_analyze_linear_thinking_bias():
    """测试线性思维偏差分析"""
    result = analyze_linear_thinking_bias(
        user_estimation=100,
        actual_value=1000
    )
    assert result['user_estimation'] == 100
    assert result['actual_value'] == 1000
    # 由于100 < 1000 * 0.5，所以应该是"严重低估"
    assert result['bias_direction'] in ['低估', '严重低估']  # 根据实际阈值判断


def test_analyze_exponential_misconception():
    """测试指数增长误解分析"""
    result = analyze_exponential_misconception(
        user_estimation=100,
        exponential_base=2,
        exponential_power=10
    )
    assert result['user_estimation'] == 100
    assert result['actual_value'] == 1024  # 2^10
    assert result['exponential_expression'] == '2^10'


def test_analyze_compound_interest_misunderstanding():
    """测试复利思维误解分析"""
    result = analyze_compound_interest_misunderstanding(
        user_estimation=150000,
        principal=100000,
        rate=10,
        time=5
    )
    assert result['user_estimation'] == 150000
    # 实际复利值: 100000 * (1.1)^5 = 161051
    assert abs(result['actual_compound_value'] - 161051) < 1


def test_validate_input_range():
    """测试输入范围验证"""
    # 正常情况
    result = validate_input_range(5, min_val=0, max_val=10, param_name="test_param")
    assert result == 5
    
    # 边界情况
    result = validate_input_range(0, min_val=0, max_val=10, param_name="test_param")
    assert result == 0
    
    result = validate_input_range(10, min_val=0, max_val=10, param_name="test_param")
    assert result == 10
    
    # 异常情况
    with pytest.raises(CustomException):
        validate_input_range(-1, min_val=0, max_val=10, param_name="test_param")
    
    with pytest.raises(CustomException):
        validate_input_range(11, min_val=0, max_val=10, param_name="test_param")


if __name__ == "__main__":
    pytest.main([__file__])
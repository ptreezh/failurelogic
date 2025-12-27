"""
单元测试：指数增长计算逻辑
根据TDD原则，先编写测试然后实现功能
"""
import sys
import os
import math

# 添加项目根目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from api_server.logic.exponential_calculations import (
    calculate_exponential,
    calculate_exponential_granary_problem,
    calculate_rabbit_growth_simulation,
    compare_linear_vs_exponential,
    estimate_exponential_growth_time,
    get_exponential_impact_examples
)


class TestExponentialCalculations:
    """测试指数增长计算逻辑"""
    
    def test_calculate_exponential_basic(self):
        """测试基本指数计算功能"""
        # Given
        base = 2
        exponent = 10
        
        # When
        result = calculate_exponential(base, exponent)
        
        # Then
        assert result == 1024  # 2^10 = 1024
    
    def test_calculate_exponential_large_numbers(self):
        """测试大数指数计算"""
        # Given
        base = 2
        exponent = 20  # 便于手工验证
        
        # When
        result = calculate_exponential(base, exponent)
        
        # Then
        assert result == 1048576  # 2^20 = 1,048,576
    
    def test_calculate_exponential_edge_cases(self):
        """测试边界情况"""
        # Given
        test_cases = [
            (1, 100, 1),      # 1的任何次方都是1
            (10, 0, 1),       # 任何数的0次方都是1
            (0, 5, 0),        # 0的正数次方是0
            (5, 1, 5),        # 任何数的1次方是自身
        ]
        
        # When & Then
        for base, exp, expected in test_cases:
            result = calculate_exponential(base, exp)
            assert result == expected, f"Failed for {base}^{exp}, expected {expected}, got {result}"
    
    def test_calculate_exponential_overflow_handling(self):
        """测试溢出处理"""
        # Given
        base = 2
        exponent = 1000  # 会导致溢出的大数
        
        # When
        result = calculate_exponential(base, exponent)
        
        # Then
        # 应该返回科学计数法表示而非抛出异常
        assert isinstance(result, (float, int))  # 应该返回一个数值
    
    def test_calculate_exponential_granary_problem_basic(self):
        """测试米粒问题基本计算"""
        # Given
        result = calculate_exponential_granary_problem(
            grains_per_unit=1,
            units=2**10,  # 1024单位
            rice_weight_per_grain_g=0.02
        )
        
        # Then
        assert 'total_grains' in result
        assert 'weight_kg' in result
        assert result['total_grains'] == 1024  # 2^10
    
    def test_calculate_rabbit_growth_simulation_basic(self):
        """测试兔子增长模拟基本功能"""
        # Given
        starting_rabbits = 2
        years = 3
        growth_multiplier = 2  # 每年翻倍
        
        # When
        result = calculate_rabbit_growth_simulation(
            starting_rabbits=starting_rabbits,
            years=years,
            growth_multiplier=growth_multiplier
        )
        
        # Then
        assert 'starting_population' in result
        assert 'final_population' in result
        assert result['starting_population'] == starting_rabbits
        # 第1年: 2*2=4, 第2年: 4*2=8, 第3年: 8*2=16, 所以最终应为16
        assert result['final_population'] == starting_rabbits * (growth_multiplier ** years)
    
    def test_calculate_rabbit_growth_realistic_case(self):
        """测试实际兔子增长案例（10只兔子，11年，每年翻5倍）"""
        # Given
        starting_rabbits = 10
        years = 11
        growth_multiplier = 5
        
        # When
        result = calculate_rabbit_growth_simulation(
            starting_rabbits=starting_rabbits,
            years=years,
            growth_multiplier=growth_multiplier
        )
        
        # Then
        expected_final_pop = starting_rabbits * (growth_multiplier ** years)
        assert result['final_population'] == expected_final_pop
        assert result['total_growth_factor'] == growth_multiplier ** years
        assert len(result['population_history']) == years + 1
    
    def test_compare_linear_vs_exponential_basic(self):
        """测试线性与指数增长比较"""
        # Given
        initial_amount = 1000
        rate_percent = 10  # 10%
        time_periods = 5  # 5期
        
        # When
        result = compare_linear_vs_exponential(
            initial_amount=initial_amount,
            rate_percent=rate_percent,
            time_periods=time_periods
        )
        
        # Then
        assert 'initial_amount' in result
        assert 'linear_result' in result
        assert 'exponential_result' in result
        assert 'difference' in result
        assert 'advantage_ratio' in result
        
        # 验证计算
        expected_linear = initial_amount * (1 + (rate_percent/100) * time_periods)
        expected_exponential = initial_amount * ((1 + rate_percent/100) ** time_periods)
        
        assert abs(result['linear_result'] - expected_linear) < 0.01
        assert abs(result['exponential_result'] - expected_exponential) < 0.01
        
        # 指数增长应该大于线性增长
        assert result['exponential_result'] >= result['linear_result']


if __name__ == '__main__':
    # 直接运行此测试文件
    test_instance = TestExponentialCalculations()
    
    print("运行指数增长计算逻辑单元测试...")
    
    try:
        test_instance.test_calculate_exponential_basic()
        print("✓ test_calculate_exponential_basic 通过")
    except Exception as e:
        print(f"✗ test_calculate_exponential_basic 失败: {e}")
    
    try:
        test_instance.test_calculate_exponential_large_numbers()
        print("✓ test_calculate_exponential_large_numbers 通过")
    except Exception as e:
        print(f"✗ test_calculate_exponential_large_numbers 失败: {e}")
    
    try:
        test_instance.test_calculate_exponential_edge_cases()
        print("✓ test_calculate_exponential_edge_cases 通过")
    except Exception as e:
        print(f"✗ test_calculate_exponential_edge_cases 失败: {e}")
    
    try:
        test_instance.test_calculate_exponential_overflow_handling()
        print("✓ test_calculate_exponential_overflow_handling 通过")
    except Exception as e:
        print(f"✗ test_calculate_exponential_overflow_handling 失败: {e}")
    
    try:
        test_instance.test_calculate_exponential_granary_problem_basic()
        print("✓ test_calculate_exponential_granary_problem_basic 通过")
    except Exception as e:
        print(f"✗ test_calculate_exponential_granary_problem_basic 失败: {e}")
    
    try:
        test_instance.test_calculate_rabbit_growth_simulation_basic()
        print("✓ test_calculate_rabbit_growth_simulation_basic 通过")
    except Exception as e:
        print(f"✗ test_calculate_rabbit_growth_simulation_basic 失败: {e}")
    
    try:
        test_instance.test_calculate_rabbit_growth_realistic_case()
        print("✓ test_calculate_rabbit_growth_realistic_case 通过")
    except Exception as e:
        print(f"✗ test_calculate_rabbit_growth_realistic_case 失败: {e}")
    
    try:
        test_instance.test_compare_linear_vs_exponential_basic()
        print("✓ test_compare_linear_vs_exponential_basic 通过")
    except Exception as e:
        print(f"✗ test_compare_linear_vs_exponential_basic 失败: {e}")
    
    print("\n所有测试完成!")
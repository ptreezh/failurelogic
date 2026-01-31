"""
性能测试：验证重构后的逻辑性能表现
"""
import time
import cProfile
import pstats
from io import StringIO
from logic.exponential_calculations import (
    calculate_exponential,
    calculate_exponential_granary_problem,
    calculate_rabbit_growth_simulation,
    compare_linear_vs_exponential,
    calculate_complex_system_failure
)
from logic.cognitive_bias_analysis import (
    analyze_linear_thinking_bias,
    analyze_exponential_misconception,
    analyze_compound_interest_misunderstanding
)


def performance_test_calculate_exponential():
    """测试指数计算性能"""
    print("测试指数计算性能...")
    start_time = time.time()
    
    # 执行多次计算
    for i in range(1000):
        result = calculate_exponential(2, 10)  # 2^10 = 1024
    
    end_time = time.time()
    elapsed = end_time - start_time
    print(f"  1000次指数计算耗时: {elapsed:.4f}秒")
    print(f"  平均每次计算耗时: {elapsed/1000*1000:.4f}毫秒")


def performance_test_complex_calculations():
    """测试复杂计算性能"""
    print("测试复杂计算性能...")
    start_time = time.time()
    
    # 执行复杂计算
    result = calculate_complex_system_failure(
        initial_failure=1,
        cascade_multiplier=2.0,
        time_periods=50,
        recovery_rate=0.1
    )
    
    end_time = time.time()
    elapsed = end_time - start_time
    print(f"  复杂系统故障计算耗时: {elapsed:.4f}秒")
    print(f"  计算周期数: {len(result['failures_over_time'])}")


def performance_test_bias_analysis():
    """测试偏差分析性能"""
    print("测试偏差分析性能...")
    start_time = time.time()
    
    # 执行多次偏差分析
    for i in range(1000):
        result = analyze_linear_thinking_bias(100, 1000)
    
    end_time = time.time()
    elapsed = end_time - start_time
    print(f"  1000次偏差分析耗时: {elapsed:.4f}秒")
    print(f"  平均每次分析耗时: {elapsed/1000*1000:.4f}毫秒")


def profile_performance():
    """性能分析"""
    print("执行性能分析...")
    
    # 创建StringIO对象来捕获分析结果
    pr = cProfile.Profile()
    
    # 开始性能分析
    pr.enable()
    
    # 执行一些典型操作
    for i in range(500):
        calculate_exponential(2, 10)
        analyze_exponential_misconception(1000, 2, 10)
        analyze_compound_interest_misunderstanding(150000, 100000, 10, 5)
    
    # 停止性能分析
    pr.disable()
    
    # 打印性能分析结果
    s = StringIO()
    ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
    ps.print_stats(10)  # 打印前10个最耗时的函数
    
    print("性能分析结果（前10个最耗时的函数）:")
    print(s.getvalue())


def run_all_performance_tests():
    """运行所有性能测试"""
    print("="*50)
    print("开始性能测试")
    print("="*50)
    
    performance_test_calculate_exponential()
    print()
    
    performance_test_complex_calculations()
    print()
    
    performance_test_bias_analysis()
    print()
    
    profile_performance()
    
    print("="*50)
    print("性能测试完成")
    print("="*50)


if __name__ == "__main__":
    run_all_performance_tests()
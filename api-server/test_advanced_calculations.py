#!/usr/bin/env python3
"""
验证高级计算功能
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

def test_advanced_calculations():
    print("开始测试高级计算功能...")
    
    # 测试纳米复制
    try:
        from logic.exponential_calculations import calculate_nano_replication
        result1 = calculate_nano_replication(initial_units=1, replication_cycles=10, unit_volume_m3=1e-27)
        print(f'✅ 纳米复制计算成功: {result1["final_count"]} 个纳米机器人')
    except Exception as e:
        print(f'❌ 纳米复制计算失败: {e}')
    
    # 测试复杂系统故障
    try:
        from logic.exponential_calculations import calculate_complex_system_failure
        result2 = calculate_complex_system_failure(initial_failure=1, cascade_multiplier=2.0, time_periods=5, recovery_rate=0.1)
        print(f'✅ 复杂系统故障计算成功: {result2["final_failures"]} 个故障单位')
    except Exception as e:
        print(f'❌ 复杂系统故障计算失败: {e}')
    
    # 测试社交网络增长
    try:
        from logic.exponential_calculations import calculate_social_network_growth
        result3 = calculate_social_network_growth(initial_users=10, invite_rate=2.0, retention_rate=0.8, time_periods=5)
        print(f'✅ 社交网络增长计算成功: {result3["final_users"]} 个用户')
    except Exception as e:
        print(f'❌ 社交网络增长计算失败: {e}')
    
    # 测试复合复利计算
    try:
        from logic.compound_interest import calculate_compound_with_contributions
        result4 = calculate_compound_with_contributions(initial_amount=10000, monthly_contribution=1000, annual_rate=8, time_years=30)
        print(f'✅ 定期投资复利计算成功: {result4["future_value"]:,.2f} 元')
    except Exception as e:
        print(f'❌ 定期投资复利计算失败: {e}')
    
    # 测试通胀调整复利
    try:
        from logic.compound_interest import calculate_real_return_with_inflation
        result5 = calculate_real_return_with_inflation(principal=100000, annual_rate=8, inflation_rate=3, time_years=30)
        print(f'✅ 通胀调整复利计算成功: {result5["real_amount"]:,.2f} 元')
    except Exception as e:
        print(f'❌ 通胀调整复利计算失败: {e}')
    
    # 测试变利率复利计算
    try:
        from logic.compound_interest import calculate_compound_with_variable_rates
        result6 = calculate_compound_with_variable_rates(principal=100000, rates_schedule=[5, 6, 7, 8, 9], fees_rate=0.5)
        print(f'✅ 变利率复利计算成功: {result6["final_amount"]:,.2f} 元')
    except Exception as e:
        print(f'❌ 变利率复利计算失败: {e}')

if __name__ == "__main__":
    test_advanced_calculations()
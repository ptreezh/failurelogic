"""
单元测试：复利计算逻辑
根据TDD原则，先编写测试然后实现功能
"""

import sys
import os

# 添加api-server到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "api-server"))

from logic.compound_interest import (
    calculate_compound_interest,
    calculate_loan_payments,
    analyze_compound_interest_misunderstanding,
    calculate_time_to_double,
)


def test_calculate_compound_interest_basic():
    """测试基本复利计算功能"""
    # Given
    principal = 100000  # 10万本金
    annual_rate = 8  # 8%年利率
    time_years = 30  # 30年

    # When
    result = calculate_compound_interest(principal, annual_rate, time_years)

    # Then
    assert "principal" in result
    assert "compound_amount" in result
    assert "linear_amount" in result
    assert result["principal"] == principal
    assert result["annual_rate"] == annual_rate
    assert result["time_years"] == time_years

    # 复利结果应该大于线性增长结果
    assert result["compound_amount"] > result["linear_amount"]

    # 30年8%复利，本金10万大约应该变成101万左右
    assert result["compound_amount"] > principal * 2  # 至少翻倍

    print("✓ test_calculate_compound_interest_basic 通过")


def test_calculate_compound_interest_zero_rate():
    """测试零利率情况"""
    # Given
    principal = 100000
    annual_rate = 0  # 0%年利率
    time_years = 10  # 10年

    # When
    result = calculate_compound_interest(principal, annual_rate, time_years)

    # Then
    assert result["compound_amount"] == principal  # 0利率，金额不变
    assert result["linear_amount"] == principal

    print("✓ test_calculate_compound_interest_zero_rate 通过")


def test_calculate_loan_payments_basic():
    """测试贷款还款计算"""
    # Given
    principal = 1000000  # 100万贷款
    annual_rate = 5  # 5%年利率
    loan_term_years = 30  # 30年期

    # When
    result = calculate_loan_payments(principal, annual_rate, loan_term_years)

    # Then
    assert "principal" in result
    assert "monthly_payment" in result
    assert "total_payment" in result
    assert "total_interest" in result

    # 总支付额应该大于本金（因为有利息）
    assert result["total_payment"] > result["principal"]

    # 总利息应该为正数
    assert result["total_interest"] > 0

    print("✓ test_calculate_loan_payments_basic 通过")


def test_analyze_compound_interest_misunderstanding_basic():
    """测试复利误解分析功能"""
    # Given
    principal = 100000
    rate = 8
    time = 30
    user_estimation = 340000  # 用户的估算值（线性估算大概是34万）

    # When
    result = analyze_compound_interest_misunderstanding(
        user_estimation, principal, rate, time
    )

    # Then
    assert "user_estimation" in result
    assert "calculation_details" in result
    assert "deviation_percentage" in result

    # 复利结果应该远大于线性估算
    actual_compound = result["calculation_details"]["actual_compound_amount"]
    assert actual_compound > user_estimation * 2  # 复利结果应该远大于估算值

    print("✓ test_analyze_compound_interest_misunderstanding_basic 通过")


def test_calculate_time_to_double():
    """测试计算翻倍时间"""
    # Given
    principal = 10000
    annual_rate = 7  # 使用7%利率，根据72法则大约10.29年翻倍

    # When
    result = calculate_time_to_double(principal, annual_rate)

    # Then
    assert "estimated_time_rule_of_72" in result
    assert "actual_time_log_calc" in result

    # 72法则估算值与实际值应该比较接近
    assert abs(result["estimated_time_rule_of_72"] - 72 / annual_rate) < 0.1

    print("✓ test_calculate_time_to_double 通过")


if __name__ == "__main__":
    # 直接运行此测试文件
    print("运行复利计算逻辑单元测试...")

    try:
        test_calculate_compound_interest_basic()
    except Exception as e:
        print(f"✗ test_calculate_compound_interest_basic 失败: {e}")

    try:
        test_calculate_compound_interest_zero_rate()
    except Exception as e:
        print(f"✗ test_calculate_compound_interest_zero_rate 失败: {e}")

    try:
        test_calculate_loan_payments_basic()
    except Exception as e:
        print(f"✗ test_calculate_loan_payments_basic 失败: {e}")

    try:
        test_analyze_compound_interest_misunderstanding_basic()
    except Exception as e:
        print(f"✗ test_analyze_compound_interest_misunderstanding_basic 失败: {e}")

    try:
        test_calculate_time_to_double()
    except Exception as e:
        print(f"✗ test_calculate_time_to_double 失败: {e}")

    print("\n复利计算测试完成!")

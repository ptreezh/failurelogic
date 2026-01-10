"""
单元测试：认知偏差分析逻辑 - 简化版
根据TDD原则，先编写测试然后实现功能
"""

import sys
import os

# 添加api-server到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "api-server"))

from logic.cognitive_bias_analysis import (
    analyze_linear_thinking_bias,
    analyze_exponential_misconception,
    create_pyramid_explanation,
)


def test_analyze_linear_thinking_bias_basic():
    """测试基本线性思维偏差分析"""
    # Given
    user_estimation = 1000
    actual_value = 1000000  # 实际值远大于估算值

    # When
    result = analyze_linear_thinking_bias(user_estimation, actual_value)

    # Then
    assert "user_estimation" in result
    assert "actual_value" in result
    assert "deviation_percentage" in result
    assert "severity" in result
    assert result["user_estimation"] == user_estimation
    assert result["actual_value"] == actual_value
    assert result["deviation_percentage"] > 90  # 偏差很大
    print("✓ test_analyze_linear_thinking_bias_basic 通过")


def test_analyze_exponential_misconception_basic():
    """测试指数增长误区分析"""
    # Given
    user_estimation = 1000000  # 一百万
    exponential_base = 2
    exponential_power = 20  # 2^20 = 1,048,576

    # When
    result = analyze_exponential_misconception(
        user_estimation, exponential_base, exponential_power
    )

    # Then
    assert "user_estimation" in result
    assert "actual_value" in result
    assert "calculation_details" in result
    assert result["calculation_details"]["base"] == exponential_base
    assert result["calculation_details"]["power"] == exponential_power
    assert result["calculation_details"]["actual_result"] == 2**20
    print("✓ test_analyze_exponential_misconception_basic 通过")


def test_create_pyramid_explanation_basic():
    """测试金字塔原理解释创建函数"""
    # Given
    core_conclusion = "核心结论"
    supporting_args = ["支撑论点1", "支撑论点2"]
    examples = ["例子1", "例子2"]
    actionable_advice = ["建议1", "建议2"]

    # When
    result = create_pyramid_explanation(
        core_conclusion, supporting_args, examples, actionable_advice
    )

    # Then
    assert result["core_conclusion"] == core_conclusion
    assert result["supporting_arguments"] == supporting_args
    assert result["examples"] == examples
    assert result["actionable_advice"] == actionable_advice
    assert result["structure"] == "pyramid_principle"
    assert core_conclusion in result["explanation_summary"]
    print("✓ test_create_pyramid_explanation_basic 通过")


if __name__ == "__main__":
    # 直接运行此测试文件
    print("运行认知偏差分析逻辑单元测试...")

    try:
        test_analyze_linear_thinking_bias_basic()
    except Exception as e:
        print(f"✗ test_analyze_linear_thinking_bias_basic 失败: {e}")

    try:
        test_analyze_exponential_misconception_basic()
    except Exception as e:
        print(f"✗ test_analyze_exponential_misconception_basic 失败: {e}")

    try:
        test_create_pyramid_explanation_basic()
    except Exception as e:
        print(f"✗ test_create_pyramid_explanation_basic 失败: {e}")

    print("\n认知偏差分析测试完成!")

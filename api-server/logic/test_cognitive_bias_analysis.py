"""
单元测试：认知偏差分析逻辑
根据TDD原则，先编写测试然后实现功能
"""
import sys
import os

# 添加api-server到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from api_server.logic.cognitive_bias_analysis import (
    analyze_linear_thinking_bias,
    analyze_exponential_misconception,
    analyze_compound_interest_misunderstanding,
    create_pyramid_explanation,
    generate_bias_feedback
)


class TestCognitiveBiasAnalysis:
    """测试认知偏差分析逻辑"""
    
    def test_analyze_linear_thinking_bias_basic(self):
        """测试基本线性思维偏差分析"""
        # Given
        user_estimation = 1000
        actual_value = 1000000  # 实际值远大于估算值
        
        # When
        result = analyze_linear_thinking_bias(user_estimation, actual_value)
        
        # Then
        assert 'user_estimation' in result
        assert 'actual_value' in result
        assert 'deviation_percentage' in result
        assert 'severity' in result
        assert result['user_estimation'] == user_estimation
        assert result['actual_value'] == actual_value
        assert result['deviation_percentage'] > 90  # 偏差很大
    
    def test_analyze_exponential_misconception_basic(self):
        """测试指数增长误区分析"""
        # Given
        user_estimation = 1000000  # 一百万
        exponential_base = 2
        exponential_power = 20  # 2^20 = 1,048,576
        
        # When
        result = analyze_exponential_misconception(user_estimation, exponential_base, exponential_power)
        
        # Then
        assert 'user_estimation' in result
        assert 'actual_value' in result
        assert 'calculation_details' in result
        assert result['calculation_details']['base'] == exponential_base
        assert result['calculation_details']['power'] == exponential_power
        assert result['calculation_details']['actual_result'] == 2**20
    
    def test_analyze_exponential_misconception_large_numbers(self):
        """测试大数指数增长误区分析"""
        # Given
        user_estimation = 1000000000  # 10亿
        exponential_base = 2
        exponential_power = 30  # 2^30 = 1,073,741,824
        
        # When
        result = analyze_exponential_misconception(user_estimation, exponential_base, exponential_power)
        
        # Then
        assert result['calculation_details']['actual_result'] == 2**30
        assert result['bias_identified'] == 'exponential_misconception'
    
    def test_analyze_compound_interest_misunderstanding_basic(self):
        """测试复利增长理解不足分析"""
        # Given
        principal = 100000  # 10万
        rate = 8  # 8%
        time = 30  # 30年
        user_estimation = 340000  # 仅考虑线性增长（10万*3.4）
        
        # When
        result = analyze_compound_interest_misunderstanding(principal, rate, time, user_estimation)
        
        # Then
        assert 'user_estimation' in result
        assert 'calculation_details' in result
        assert result['user_estimation'] == user_estimation
        assert result['bias_identified'] == 'compound_interest_misunderstanding'
        # 复利计算结果应远大于线性估算值
        actual_compound = result['calculation_details']['compound_amount']
        assert actual_compound > user_estimation
    
    def test_create_pyramid_explanation_basic(self):
        """测试金字塔原理解释创建函数"""
        # Given
        core_conclusion = "核心结论"
        supporting_args = ["支撑论点1", "支撑论点2"]
        examples = ["例子1", "例子2"]
        actionable_advice = ["建议1", "建议2"]
        
        # When
        result = create_pyramid_explanation(core_conclusion, supporting_args, examples, actionable_advice)
        
        # Then
        assert result['core_conclusion'] == core_conclusion
        assert result['supporting_arguments'] == supporting_args
        assert result['examples'] == examples
        assert result['actionable_advice'] == actionable_advice
        assert result['structure'] == 'pyramid_principle'
        assert core_conclusion in result['explanation_summary']
    
    def test_generate_bias_feedback_exponential_type(self):
        """测试指数类型问题的偏差反馈生成"""
        # Given
        user_response = {
            'userChoice': 2,
            'userEstimation': 1000000
        }
        question_context = {
            'testId': 'exp-001',
            'questionType': 'exponential',
            'base': 2,
            'power': 20
        }
        
        # When
        result = generate_bias_feedback(user_response, 'exponential', question_context)
        
        # Then
        assert result['question_id'] == 'exp-001'
        assert result['question_type'] == 'exponential'
        assert result['user_response'] == 2
        assert 'pyramid_explanation' in result
        assert result['deviation_analysis']['bias_identified'] == 'exponential_misconception'
    
    def test_generate_bias_feedback_compound_type(self):
        """测试复利类型问题的偏差反馈生成"""
        # Given
        user_response = {
            'userChoice': 1,
            'userEstimation': 500000
        }
        question_context = {
            'testId': 'comp-001',
            'questionType': 'compound',
            'principal': 100000,
            'rate': 8,
            'time': 30
        }
        
        # When
        result = generate_bias_feedback(user_response, 'compound', question_context)
        
        # Then
        assert result['question_id'] == 'comp-001'
        assert result['question_type'] == 'compound'
        assert result['user_response'] == 1
        assert 'pyramid_explanation' in result
        if 'deviation_analysis' in result:
            assert result['deviation_analysis']['bias_identified'] in ['compound_interest_misunderstanding', 'linear_thinking_bias']


if __name__ == '__main__':
    # 直接运行此测试文件
    test_instance = TestCognitiveBiasAnalysis()
    
    print("运行认知偏差分析逻辑单元测试...")
    
    try:
        test_instance.test_analyze_linear_thinking_bias_basic()
        print("✓ test_analyze_linear_thinking_bias_basic 通过")
    except Exception as e:
        print(f"✗ test_analyze_linear_thinking_bias_basic 失败: {e}")
    
    try:
        test_instance.test_analyze_exponential_misconception_basic()
        print("✓ test_analyze_exponential_misconception_basic 通过")
    except Exception as e:
        print(f"✗ test_analyze_exponential_misconception_basic 失败: {e}")
    
    try:
        test_instance.test_analyze_exponential_misconception_large_numbers()
        print("✓ test_analyze_exponential_misconception_large_numbers 通过")
    except Exception as e:
        print(f"✗ test_analyze_exponential_misconception_large_numbers 失败: {e}")
    
    try:
        test_instance.test_analyze_compound_interest_misunderstanding_basic()
        print("✓ test_analyze_compound_interest_misunderstanding_basic 通过")
    except Exception as e:
        print(f"✗ test_analyze_compound_interest_misunderstanding_basic 失败: {e}")
    
    try:
        test_instance.test_create_pyramid_explanation_basic()
        print("✓ test_create_pyramid_explanation_basic 通过")
    except Exception as e:
        print(f"✗ test_create_pyramid_explanation_basic 失败: {e}")
    
    try:
        test_instance.test_generate_bias_feedback_exponential_type()
        print("✓ test_generate_bias_feedback_exponential_type 通过")
    except Exception as e:
        print(f"✗ test_generate_bias_feedback_exponential_type 失败: {e}")
    
    try:
        test_instance.test_generate_bias_feedback_compound_type()
        print("✓ test_generate_bias_feedback_compound_type 通过")
    except Exception as e:
        print(f"✗ test_generate_bias_feedback_compound_type 失败: {e}")
    
    print("\n所有认知偏差分析测试完成!")
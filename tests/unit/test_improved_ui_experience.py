"""
UI体验优化功能单元测试
遵循TDD原则，在实现前编写测试
"""

import sys
import os
import unittest
from unittest.mock import patch, MagicMock

# 添加项目路径
sys.path.insert(0, os.path.join(os.getcwd(), 'api-server'))

class TestImprovedUIExperience(unittest.TestCase):
    """测试改进的UI体验功能"""

    def test_improved_feedback_generation(self):
        """测试改进的反馈生成机制"""
        # Given
        from logic.cognitive_bias_analysis import generate_improved_feedback
        
        user_response = {
            'userChoice': 2,
            'userEstimation': 1000000,
            'actualValue': 1606938044258990275541962092341162602522202993782792835301376,  # 2^200
            'questionType': 'exponential'
        }
        
        # When
        feedback = generate_improved_feedback(user_response)
        
        # Then
        self.assertIn('is_correct', feedback)
        self.assertIn('result_explanation', feedback)
        self.assertIn('cognitive_bias_analysis', feedback)
        self.assertIn('pyramid_explanation', feedback)
        print("✅ 改进反馈生成机制测试通过")

    def test_button_response_mechanism(self):
        """测试按钮响应机制"""
        # Given
        from logic.interaction_response import handle_button_click
        
        # When
        response = handle_button_click('exponential', 'submit_answer')
        
        # Then
        self.assertIn('status', response)
        self.assertIn('message', response)
        self.assertEqual(response['status'], 'success')
        print("✅ 按钮响应机制测试通过")

    def test_homepage_content_structure(self):
        """测试主页内容结构，确保不泄露测试答案"""
        # Given
        from logic.homepage_content import get_homepage_content
        
        # When
        content = get_homepage_content()
        
        # Then
        self.assertIn('book_intro', content)
        self.assertIn('cognitive_concepts', content)
        self.assertNotIn('test_answers', content)  # 确保不包含测试答案
        self.assertIn('failure_logic_principles', content)
        print("✅ 主页内容结构测试通过")

    def test_pyramid_explanation_generation(self):
        """测试金字塔原理解释生成"""
        # Given
        from logic.cognitive_bias_analysis import create_pyramid_explanation
        
        # When
        explanation = create_pyramid_explanation(
            "认知偏差核心结论",
            ["支撑论据1", "支撑论据2"],
            ["实例1", "实例2"],
            ["建议1", "建议2"]
        )
        
        # Then
        self.assertIn('core_conclusion', explanation)
        self.assertIn('supporting_arguments', explanation)
        self.assertIn('examples', explanation)
        self.assertIn('actionable_advice', explanation)
        self.assertEqual(explanation['structure'], 'pyramid_principle')
        print("✅ 金字塔原理解释生成测试通过")

    def test_instant_feedback_mechanism(self):
        """测试即时反馈机制"""
        # Given
        from logic.feedback_system import process_answer_with_instant_feedback
        
        answer_data = {
            'userId': 'test-user',
            'questionId': 'exp-001',
            'userChoice': 3,
            'userEstimation': 50000000
        }
        
        # When
        result = process_answer_with_instant_feedback(answer_data)
        
        # Then
        self.assertIn('immediate_feedback', result)
        self.assertIn('bias_analysis', result)
        self.assertIn('is_correct', result)
        self.assertIn('time_taken_ms', result)  # 响应时间信息
        print("✅ 即时反馈机制测试通过")

    def test_cognitive_science_knowledge_content(self):
        """测试认知科学知识内容"""
        # Given
        from logic.educational_content import get_cognitive_science_knowledge
        
        # When
        knowledge = get_cognitive_science_knowledge()
        
        # Then
        self.assertIn('bias_types', knowledge)
        self.assertIn('failure_logic_concepts', knowledge)
        self.assertIn('thinking_fallacies', knowledge)
        self.assertGreater(len(knowledge['bias_types']), 0)
        print("✅ 认知科学知识内容测试通过")


class TestImprovedUserJourney(unittest.TestCase):
    """测试改进的用户旅程"""

    def test_complete_user_flow(self):
        """测试完整用户旅程"""
        # Given
        from logic.journey_manager import manage_user_journey
        
        journey_data = {
            'stage': 'homepage',
            'user_actions': ['click_scenario', 'select_exponential', 'submit_answer'],
            'expectations': {
                'no_answers_on_homepage': True,
                'instant_feedback_on_submit': True,
                'pyramid_explanation_present': True
            }
        }
        
        # When
        journey_result = manage_user_journey(journey_data)
        
        # Then
        self.assertTrue(journey_result['homepage_no_leaks'])
        self.assertTrue(journey_result['feedback_instant'])
        self.assertTrue(journey_result['ui_responsive'])
        self.assertIn('improvement_suggestions', journey_result)
        print("✅ 完整用户旅程测试通过")

    def test_button_click_visual_feedback(self):
        """测试按钮点击视觉反馈"""
        # Given
        from logic.ui_interaction import process_button_click_with_feedback
        
        # When
        response = process_button_click_with_feedback({
            'element': 'submit_button',
            'user_id': 'test_user',
            'action': 'click'
        })
        
        # Then
        self.assertEqual(response['status'], 'processed')
        self.assertIn('visual_feedback', response)
        self.assertIn('element_state', response)  # 元素状态变化
        print("✅ 按钮点击视觉反馈测试通过")


if __name__ == '__main__':
    print("🧪 开始UI体验优化单元测试...")
    print("="*50)
    
    unittest.main(verbosity=2)
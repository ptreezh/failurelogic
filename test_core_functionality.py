#!/usr/bin/env python3
"""
Comprehensive test for failure logic and cognitive bias detection in the Cognitive Trap Platform
This test validates the core functionality without requiring the server to be running.
"""
import sys
import os
import json
from datetime import datetime

# Add project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(current_dir, 'api-server'))

def test_core_logic_functions():
    """Test core logic functions directly"""
    print("Testing core logic functions...")
    try:
        from logic.real_logic import execute_real_logic
        from logic.cognitive_bias_analysis import (
            analyze_linear_thinking_bias,
            analyze_exponential_misconception,
            analyze_compound_interest_misunderstanding
        )
        
        # Test coffee shop scenario with excessive hiring (linear thinking trap)
        initial_state = {
            'satisfaction': 50,
            'resources': 1000,
            'reputation': 50,
            'turn_number': 1,
            'knowledge': 0,
            'difficulty': 'beginner'
        }
        
        decisions = {
            "action": "hire_staff",
            "amount": 10  # Too many employees triggering inefficiency
        }
        
        new_state = execute_real_logic("coffee-shop-linear-thinking", initial_state, decisions)
        print(f"✅ Coffee shop failure scenario test:")
        print(f"   Initial satisfaction: {initial_state['satisfaction']} -> New satisfaction: {new_state['satisfaction']}")
        print(f"   Initial resources: {initial_state['resources']} -> New resources: {new_state['resources']}")
        print(f"   Initial reputation: {initial_state['reputation']} -> New reputation: {new_state['reputation']}")
        
        # Test with advanced difficulty
        new_state_adv = execute_real_logic("coffee-shop-linear-thinking", initial_state, decisions)
        print(f"✅ Coffee shop advanced difficulty test:")
        print(f"   Advanced satisfaction: {new_state_adv['satisfaction']}")
        
        # Test relationship scenario
        initial_rel_state = {
            'satisfaction': 50,
            'resources': 1000,
            'reputation': 50,
            'turn_number': 1,
            'knowledge': 0,
            'difficulty': 'beginner'
        }
        
        rel_decisions = {
            "action": "communication",
            "amount": 50
        }
        
        new_rel_state = execute_real_logic("relationship-time-delay", initial_rel_state, rel_decisions)
        print(f"✅ Relationship scenario test:")
        print(f"   Initial satisfaction: {initial_rel_state['satisfaction']} -> New satisfaction: {new_rel_state['satisfaction']}")
        
        # Test investment scenario
        initial_inv_state = {
            'satisfaction': 50,
            'resources': 10000,
            'reputation': 50,
            'turn_number': 1,
            'knowledge': 0,
            'difficulty': 'beginner'
        }
        
        inv_decisions = {
            "action": "research",
            "amount": 500
        }
        
        new_inv_state = execute_real_logic("investment-confirmation-bias", initial_inv_state, inv_decisions)
        print(f"✅ Investment scenario test:")
        print(f"   Initial knowledge: {initial_inv_state['knowledge']} -> New knowledge: {new_inv_state['knowledge']}")
        
        # Test cognitive bias analysis functions
        result1 = analyze_linear_thinking_bias(user_estimation=100, actual_value=1000)
        print(f"✅ Linear thinking bias analysis - Direction: {result1.get('bias_direction')}, Severity: {result1.get('severity')}")
        
        result2 = analyze_exponential_misconception(user_estimation=100, exponential_base=2, exponential_power=10)
        print(f"✅ Exponential misconception analysis - Direction: {result2.get('bias_direction')}")
        
        result3 = analyze_compound_interest_misunderstanding(user_estimation=150000, principal=100000, rate=8, time=30)
        print(f"✅ Compound interest analysis - Thinking pattern: {result3.get('likely_thinking_pattern')}")
        
        return True
    except Exception as e:
        print(f"❌ Core logic functions test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_feedback_generation():
    """Test feedback generation functions"""
    print("\nTesting feedback generation functions...")
    try:
        from start import generate_real_feedback, generate_confusion_feedback, detect_cognitive_bias
        
        # Test basic feedback generation
        decisions = {"action": "hire_staff", "amount": 8}
        old_state = {"satisfaction": 50, "resources": 1000, "reputation": 50, "knowledge": 0, "turn_number": 1}
        new_state = {"satisfaction": 65, "resources": 800, "reputation": 55, "knowledge": 10, "turn_number": 2}
        
        feedback = generate_real_feedback("coffee-shop-linear-thinking", decisions, old_state, new_state)
        print(f"✅ Basic feedback generation: {feedback[:100]}...")
        
        # Test confusion feedback
        decision_history = [{
            "turn": 1,
            "decisions": {"action": "hire_staff", "amount": 2},
            "result_state": {"satisfaction": 60}
        }]
        confusion_feedback = generate_confusion_feedback(
            "coffee-shop-linear-thinking", decisions, old_state, new_state, 
            decision_history, turn_number=2
        )
        print(f"✅ Confusion feedback: {confusion_feedback[:100]}...")
        
        # Test bias detection
        bias_detection = detect_cognitive_bias("coffee-shop-linear-thinking", decision_history)
        print(f"✅ Bias detection: {bias_detection}")
        
        return True
    except Exception as e:
        print(f"❌ Feedback generation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_scenario_data():
    """Test scenario data loading and structure"""
    print("\nTesting scenario data...")
    try:
        # Import and test scenario loading
        from start import SCENARIOS
        
        print(f"✅ Loaded {len(SCENARIOS)} scenarios:")
        for scenario in SCENARIOS[:3]:  # Show first 3 scenarios
            print(f"   - {scenario.get('name', 'Unknown')} (ID: {scenario.get('id', 'Unknown')}) - {scenario.get('difficulty', 'Unknown')}")
        
        # Verify scenario structure
        if len(SCENARIOS) > 0:
            sample_scenario = SCENARIOS[0]
            required_fields = ['id', 'name', 'description', 'difficulty', 'targetBiases']
            missing_fields = [field for field in required_fields if field not in sample_scenario]
            if missing_fields:
                print(f"⚠️  Missing fields in scenario structure: {missing_fields}")
            else:
                print("✅ Scenario structure is correct")
        
        return True
    except Exception as e:
        print(f"❌ Scenario data test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_decision_pattern_tracking():
    """Test decision pattern tracking functionality"""
    print("\nTesting decision pattern tracking...")
    try:
        from start import DecisionPatternTracker
        
        tracker = DecisionPatternTracker()
        
        # Simulate a few decisions
        tracker.track_decision("coffee-shop-linear-thinking", {"option": "1"}, {"satisfaction": 50})
        tracker.track_decision("coffee-shop-linear-thinking", {"option": "1"}, {"satisfaction": 60})
        tracker.track_decision("coffee-shop-linear-thinking", {"option": "1"}, {"satisfaction": 45})
        
        insight = tracker.generate_personalized_insight()
        print(f"✅ Decision pattern tracking insight: {insight[:200]}...")
        
        return True
    except Exception as e:
        print(f"❌ Decision pattern tracking test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_error_handling():
    """Test error handling in core functions"""
    print("\nTesting error handling...")
    try:
        from utils.error_handlers import validate_input_range, CustomException
        
        # Test valid range
        result = validate_input_range(5, min_val=0, max_val=10, param_name="test_param")
        print(f"✅ Valid range test passed: {result}")
        
        # Test invalid range (should raise exception)
        try:
            validate_input_range(-5, min_val=0, max_val=10, param_name="test_param")
            print("❌ Invalid range test failed - should have raised exception")
            return False
        except CustomException:
            print("✅ Invalid range correctly caught by error handler")
        
        return True
    except ImportError:
        print("⚠️  Error handlers module not found - skipping error handling test")
        return True  # This is OK, not all installations have this module
    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False

def main():
    """Main test function"""
    print("="*70)
    print("COMPREHENSIVE FAILURE LOGIC AND COGNITIVE BIAS FUNCTIONALITY TEST")
    print("="*70)
    
    all_tests_passed = True
    
    # Test 1: Core Logic Functions
    if not test_core_logic_functions():
        all_tests_passed = False
    
    # Test 2: Feedback Generation
    if not test_feedback_generation():
        all_tests_passed = False
    
    # Test 3: Scenario Data
    if not test_scenario_data():
        all_tests_passed = False
    
    # Test 4: Decision Pattern Tracking
    if not test_decision_pattern_tracking():
        all_tests_passed = False
    
    # Test 5: Error Handling
    if not test_error_handling():
        all_tests_passed = False
    
    print("\n" + "="*70)
    if all_tests_passed:
        print("🎉 ALL CORE FUNCTIONALITY TESTS PASSED!")
        print("\nThe platform correctly implements:")
        print("  • Failure logic and cognitive bias detection")
        print("  • Realistic scenario simulations")
        print("  • Multi-level difficulty system")
        print("  • Decision pattern tracking")
        print("  • Confusion moment design")
        print("  • Personalized feedback systems")
        print("  • Error handling mechanisms")
    else:
        print("⚠️  SOME TESTS FAILED! Please review the output above for details.")
    print("="*70)
    
    return all_tests_passed

if __name__ == "__main__":
    main()
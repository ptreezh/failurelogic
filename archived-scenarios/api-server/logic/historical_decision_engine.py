"""
Decision engine for historical case simulations.
Processes user decisions in historical scenarios and calculates outcomes.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import random
from api_server.logic.historical_case_validator import validate_historical_case


class HistoricalCaseDecisionEngine:
    """
    Engine for processing decisions in historical case simulations.
    Simulates the consequences of decisions in historical scenarios.
    """
    
    def __init__(self):
        self.scenario_cache = {}
        self.user_decisions = {}
    
    def load_scenario(self, scenario_id: str, scenario_data: Dict[str, Any]) -> bool:
        """
        Load a historical scenario into the engine.
        """
        try:
            # Validate the scenario data
            errors = validate_historical_case(scenario_data)
            if errors:
                print(f"Validation errors for scenario {scenario_id}: {errors}")
                return False
            
            self.scenario_cache[scenario_id] = scenario_data
            return True
        except Exception as e:
            print(f"Error loading scenario {scenario_id}: {str(e)}")
            return False
    
    def process_decision(self, user_id: str, scenario_id: str, step: int, option_index: int) -> Dict[str, Any]:
        """
        Process a user's decision in a historical scenario and return the outcome.
        """
        if scenario_id not in self.scenario_cache:
            return {
                "error": f"Scenario {scenario_id} not loaded",
                "success": False
            }
        
        scenario = self.scenario_cache[scenario_id]
        
        # Get the decision point
        decision_points = scenario.get('decisionPoints', [])
        if step >= len(decision_points):
            return {
                "error": f"Step {step} out of bounds for scenario {scenario_id}",
                "success": False
            }
        
        decision_point = decision_points[step]
        options = decision_point.get('options', [])
        
        if option_index >= len(options):
            return {
                "error": f"Option index {option_index} out of bounds for step {step}",
                "success": False
            }
        
        # Record the user's decision
        user_key = f"{user_id}:{scenario_id}"
        if user_key not in self.user_decisions:
            self.user_decisions[user_key] = []
        
        decision_record = {
            "step": step,
            "option_selected": option_index,
            "option_text": options[option_index],
            "timestamp": datetime.now().isoformat()
        }
        self.user_decisions[user_key].append(decision_record)
        
        # Determine the outcome based on the decision
        # For historical cases, we can compare the user's choice to what actually happened
        actual_outcomes = scenario.get('actualOutcomes', [])
        alternative_options = scenario.get('alternativeOptions', [])
        lessons = scenario.get('lessons', [])
        
        # Create a response with educational feedback
        response = {
            "scenarioId": scenario_id,
            "step": step,
            "userDecision": {
                "selectedOptionIndex": option_index,
                "selectedOptionText": options[option_index]
            },
            "historicalContext": {
                "situation": decision_point.get('situation', ''),
                "allOptions": options,
                "actualOutcome": actual_outcomes[step] if step < len(actual_outcomes) else "Outcome not specified",
                "alternativeOptions": alternative_options,
                "lessons": lessons
            },
            "educationalFeedback": self._generate_educational_feedback(
                scenario, step, option_index, options[option_index]
            ),
            "nextStepsAvailable": step < len(decision_points) - 1,
            "isLastStep": step == len(decision_points) - 1,
            "success": True
        }
        
        # If this is the last step, provide a comprehensive summary
        if step == len(decision_points) - 1:
            response["comprehensiveSummary"] = self._generate_comprehensive_summary(scenario, self.user_decisions[user_key])
        
        return response
    
    def _generate_educational_feedback(self, scenario: Dict[str, Any], step: int, option_idx: int, selected_option: str) -> Dict[str, Any]:
        """
        Generate educational feedback based on the user's decision compared to historical outcomes.
        """
        title = scenario.get('title', 'Historical Scenario')
        actual_outcomes = scenario.get('actualOutcomes', [])
        alternative_options = scenario.get('alternativeOptions', [])
        lessons = scenario.get('lessons', [])
        pyramid_analysis = scenario.get('pyramidAnalysis', {})
        
        feedback = {
            "title": f"关于 {title} 的反思",
            "scenarioStep": step + 1,
            "selectedOption": selected_option,
            "historicalOutcome": actual_outcomes[step] if step < len(actual_outcomes) else "No specific outcome recorded",
            "alternativeOptions": alternative_options,
            "keyLessons": lessons,
            "pyramidAnalysis": pyramid_analysis,
            "cognitiveBiasesIdentified": self._identify_cognitive_biases(scenario, step, option_idx),
            "recommendations": self._generate_recommendations(scenario, step, option_idx)
        }
        
        return feedback
    
    def _identify_cognitive_biases(self, scenario: Dict[str, Any], step: int, option_idx: int) -> List[str]:
        """
        Identify potential cognitive biases that might have influenced the historical decision.
        """
        # This is a simplified version - in a real implementation, this would be more sophisticated
        biases = []
        
        # Common biases in historical failures
        if "确认偏误" in scenario.get('lessons', []):
            biases.append("confirmation_bias")
        if "群体思维" in scenario.get('lessons', []):
            biases.append("groupthink")
        if "过度自信" in scenario.get('lessons', []):
            biases.append("overconfidence_bias")
        if "时间压力" in scenario.get('lessons', []):
            biases.append("time_pressure_bias")
        if "商业压力" in scenario.get('lessons', []):
            biases.append("business_pressure_bias")
        
        # Add generic bias types if specific ones aren't found
        if not biases:
            biases = ["confirmation_bias", "availability_heuristic", "anchoring_bias"]
        
        return biases
    
    def _generate_recommendations(self, scenario: Dict[str, Any], step: int, option_idx: int) -> List[str]:
        """
        Generate recommendations based on the historical scenario.
        """
        recommendations = [
            "在类似情况下，考虑多方意见和数据",
            "建立制衡机制以减少单一决策者的偏见",
            "预留充足时间进行风险评估",
            "建立独立的审查和验证机制"
        ]
        
        # Add scenario-specific recommendations
        if "安全" in scenario.get('title', ''):
            recommendations.append("将安全考虑置于商业利益之上")
        if "技术" in scenario.get('title', ''):
            recommendations.append("充分测试复杂技术系统的所有方面")
        if "金融" in scenario.get('title', ''):
            recommendations.append("建立更严格的风险管理和监管机制")
        
        return recommendations
    
    def _generate_comprehensive_summary(self, scenario: Dict[str, Any], user_decisions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate a comprehensive summary when the user completes a scenario.
        """
        title = scenario.get('title', 'Historical Scenario')
        description = scenario.get('description', 'Scenario description not available')
        lessons = scenario.get('lessons', [])
        pyramid_analysis = scenario.get('pyramidAnalysis', {})
        
        # Count how many decisions the user made
        decision_count = len(user_decisions)
        
        # Analyze alignment with historical decisions
        actual_outcomes = scenario.get('actualOutcomes', [])
        alignment_score = 0
        
        summary = {
            "scenarioTitle": title,
            "scenarioDescription": description,
            "decisionsMade": decision_count,
            "historicalAlignment": f"You made {decision_count} decisions in this scenario.",
            "keyLessons": lessons,
            "pyramidAnalysis": pyramid_analysis,
            "personalReflection": "Consider how these historical lessons apply to modern decision-making contexts.",
            "followUpRecommendations": [
                "Study additional historical cases to recognize patterns",
                "Practice decision-making frameworks that counter cognitive biases",
                "Seek diverse perspectives before making critical decisions"
            ]
        }
        
        return summary
    
    def get_user_progress(self, user_id: str, scenario_id: str) -> Dict[str, Any]:
        """
        Get the user's progress in a specific historical scenario.
        """
        user_key = f"{user_id}:{scenario_id}"
        
        if user_key not in self.user_decisions:
            return {
                "scenarioId": scenario_id,
                "currentStep": 0,
                "decisionsMade": 0,
                "completed": False,
                "decisions": []
            }
        
        decisions = self.user_decisions[user_key]
        current_step = max([d['step'] for d in decisions]) + 1 if decisions else 0
        
        # Check if scenario is complete
        if scenario_id in self.scenario_cache:
            total_steps = len(self.scenario_cache[scenario_id].get('decisionPoints', []))
            completed = current_step >= total_steps
        else:
            completed = False
        
        return {
            "scenarioId": scenario_id,
            "currentStep": current_step,
            "decisionsMade": len(decisions),
            "completed": completed,
            "decisions": decisions
        }
    
    def reset_scenario_for_user(self, user_id: str, scenario_id: str):
        """
        Reset a scenario for a specific user.
        """
        user_key = f"{user_id}:{scenario_id}"
        if user_key in self.user_decisions:
            del self.user_decisions[user_key]


# Global instance of the decision engine
historical_decision_engine = HistoricalCaseDecisionEngine()
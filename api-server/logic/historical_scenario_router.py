"""
Scenario router for historical cases in backend.
Routes and manages historical scenario execution.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import uuid
from api_server.logic.historical_decision_engine import historical_decision_engine


class HistoricalScenarioRouter:
    """
    Router for managing historical scenario execution.
    Handles scenario selection, state management, and routing.
    """
    
    def __init__(self):
        self.active_sessions = {}  # Maps session_id to scenario state
        self.user_scenario_states = {}  # Maps user_id:scenario_id to state
        self.available_scenarios = {}  # Cache of available scenarios
    
    def register_scenario(self, scenario_id: str, scenario_data: Dict[str, Any]) -> bool:
        """
        Register a historical scenario with the router.
        """
        try:
            # Load the scenario into the decision engine
            success = historical_decision_engine.load_scenario(scenario_id, scenario_data)
            if success:
                self.available_scenarios[scenario_id] = scenario_data
                return True
            return False
        except Exception as e:
            print(f"Error registering scenario {scenario_id}: {str(e)}")
            return False
    
    def start_scenario_session(self, user_id: str, scenario_id: str) -> Dict[str, Any]:
        """
        Start a new session for a historical scenario.
        """
        if scenario_id not in self.available_scenarios:
            return {
                "error": f"Scenario {scenario_id} not available",
                "success": False
            }
        
        # Create a new session ID
        session_id = str(uuid.uuid4())
        
        # Reset any existing state for this user-scenario combination
        historical_decision_engine.reset_scenario_for_user(user_id, scenario_id)
        
        # Initialize session state
        session_state = {
            "sessionId": session_id,
            "userId": user_id,
            "scenarioId": scenario_id,
            "startTime": datetime.now().isoformat(),
            "currentStep": 0,
            "completed": False,
            "decisions": [],
            "scenarioData": self.available_scenarios[scenario_id]
        }
        
        self.active_sessions[session_id] = session_state
        self.user_scenario_states[f"{user_id}:{scenario_id}"] = session_state
        
        # Return the first decision point
        scenario_data = self.available_scenarios[scenario_id]
        decision_points = scenario_data.get('decisionPoints', [])
        
        if decision_points:
            first_decision = decision_points[0]
            return {
                "sessionId": session_id,
                "scenarioId": scenario_id,
                "step": 0,
                "situation": first_decision.get('situation', ''),
                "options": first_decision.get('options', []),
                "scenarioTitle": scenario_data.get('title', 'Historical Scenario'),
                "scenarioDescription": scenario_data.get('description', ''),
                "totalSteps": len(decision_points),
                "currentStep": 0,
                "success": True
            }
        else:
            return {
                "error": f"No decision points found in scenario {scenario_id}",
                "success": False
            }
    
    def process_user_decision(self, session_id: str, option_index: int) -> Dict[str, Any]:
        """
        Process a user's decision in the current scenario step.
        """
        if session_id not in self.active_sessions:
            return {
                "error": f"Session {session_id} not found",
                "success": False
            }
        
        session_state = self.active_sessions[session_id]
        user_id = session_state["userId"]
        scenario_id = session_state["scenarioId"]
        current_step = session_state["currentStep"]
        
        # Process the decision using the decision engine
        result = historical_decision_engine.process_decision(
            user_id, scenario_id, current_step, option_index
        )
        
        if not result.get("success", False):
            return result
        
        # Update session state
        session_state["currentStep"] = current_step + 1
        session_state["decisions"].append({
            "step": current_step,
            "optionIndex": option_index,
            "timestamp": datetime.now().isoformat()
        })
        
        # Check if scenario is completed
        scenario_data = self.available_scenarios[scenario_id]
        decision_points = scenario_data.get('decisionPoints', [])
        is_completed = current_step + 1 >= len(decision_points)
        
        session_state["completed"] = is_completed
        
        # If not completed, prepare the next decision point
        response = {
            "sessionId": session_id,
            "scenarioId": scenario_id,
            "currentStep": current_step,
            "selectedOption": option_index,
            "feedback": result.get("educationalFeedback", {}),
            "completed": is_completed,
            "totalSteps": len(decision_points),
            "success": True
        }
        
        if not is_completed and current_step + 1 < len(decision_points):
            next_decision = decision_points[current_step + 1]
            response.update({
                "nextStep": current_step + 1,
                "nextSituation": next_decision.get('situation', ''),
                "nextOptions": next_decision.get('options', [])
            })
        elif is_completed:
            # Add comprehensive summary if available
            if "comprehensiveSummary" in result:
                response["comprehensiveSummary"] = result["comprehensiveSummary"]
        
        return response
    
    def get_scenario_state(self, session_id: str) -> Dict[str, Any]:
        """
        Get the current state of a scenario session.
        """
        if session_id not in self.active_sessions:
            return {
                "error": f"Session {session_id} not found",
                "success": False
            }
        
        session_state = self.active_sessions[session_id]
        scenario_data = self.available_scenarios[session_state["scenarioId"]]
        decision_points = scenario_data.get('decisionPoints', [])
        
        return {
            "sessionId": session_id,
            "userId": session_state["userId"],
            "scenarioId": session_state["scenarioId"],
            "currentStep": session_state["currentStep"],
            "completed": session_state["completed"],
            "decisions": session_state["decisions"],
            "totalSteps": len(decision_points),
            "scenarioTitle": scenario_data.get('title', ''),
            "success": True
        }
    
    def get_available_scenarios(self, difficulty_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get list of available historical scenarios.
        """
        scenarios = []
        
        for scenario_id, scenario_data in self.available_scenarios.items():
            # Apply difficulty filter if specified
            if difficulty_filter:
                # This would need to be implemented based on how difficulty is stored
                # For now, we'll include all scenarios
                pass
            
            scenario_info = {
                "id": scenario_id,
                "title": scenario_data.get('title', 'Untitled Scenario'),
                "description": scenario_data.get('description', ''),
                "decisionPointsCount": len(scenario_data.get('decisionPoints', [])),
                "estimatedTimeMinutes": len(scenario_data.get('decisionPoints', [])) * 3,  # Estimate 3 min per decision
                "difficulty": self._estimate_difficulty(scenario_data)
            }
            scenarios.append(scenario_info)
        
        return scenarios
    
    def _estimate_difficulty(self, scenario_data: Dict[str, Any]) -> str:
        """
        Estimate difficulty level of a scenario based on its characteristics.
        """
        decision_points = scenario_data.get('decisionPoints', [])
        lessons = scenario_data.get('lessons', [])
        
        if len(decision_points) <= 2:
            return "beginner"
        elif len(decision_points) <= 4:
            return "intermediate"
        else:
            return "advanced"
    
    def get_user_progress(self, user_id: str, scenario_id: str) -> Dict[str, Any]:
        """
        Get user progress for a specific scenario.
        """
        return historical_decision_engine.get_user_progress(user_id, scenario_id)
    
    def load_all_scenarios_from_files(self, basic_file_path: str, advanced_file_path: str = None) -> int:
        """
        Load all scenarios from JSON files.
        """
        import json
        import os
        
        loaded_count = 0
        
        # Load basic scenarios
        try:
            with open(basic_file_path, 'r', encoding='utf-8') as f:
                basic_data = json.load(f)
                
            if 'historical_cases' in basic_data:
                for scenario in basic_data['historical_cases']:
                    scenario_id = scenario.get('scenarioId')
                    if scenario_id:
                        if self.register_scenario(scenario_id, scenario):
                            loaded_count += 1
        except Exception as e:
            print(f"Error loading basic scenarios from {basic_file_path}: {str(e)}")
        
        # Load advanced scenarios if path provided
        if advanced_file_path:
            try:
                with open(advanced_file_path, 'r', encoding='utf-8') as f:
                    advanced_data = json.load(f)
                    
                if 'historical_cases' in advanced_data:
                    for scenario in advanced_data['historical_cases']:
                        scenario_id = scenario.get('scenarioId')
                        if scenario_id:
                            if self.register_scenario(scenario_id, scenario):
                                loaded_count += 1
            except Exception as e:
                print(f"Error loading advanced scenarios from {advanced_file_path}: {str(e)}")
        
        return loaded_count


# Global instance of the scenario router
historical_scenario_router = HistoricalScenarioRouter()
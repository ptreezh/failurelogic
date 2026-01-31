import requests
import json

def test_failure_logic_objectives():
    """Test that the platform meets failure logic objectives"""
    base_url = "http://localhost:8081"
    
    print("Testing Failure Logic Objectives...")
    
    # Get scenarios
    response = requests.get(base_url + "/scenarios/")
    scenarios_data = response.json()
    
    # Select coffee shop scenario
    scenario = next((s for s in scenarios_data['scenarios'] if s['id'] == 'coffee-shop-linear-thinking'), 
                   scenarios_data['scenarios'][0])
    
    print(f"Selected scenario: {scenario['name']} ({scenario['id']})")
    
    # Create a game session
    response = requests.post(base_url + "/scenarios/create_game_session", 
                           params={"scenario_id": scenario['id']})
    session_data = response.json()
    game_id = session_data['game_id']
    
    print(f"Game session created: {game_id}")
    
    # Test the 4+ stage process more systematically
    print("\n=== STAGE 1: CONFUSION (Initial Unexpected Outcome) ===")
    # Make a decision that should lead to confusion
    decisions_turn1 = {"action": "hire_staff", "amount": 1}
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn1)
    turn1_data = response.json()
    
    print(f"Turn {turn1_data['turnNumber']}: Made initial decision")
    print(f"Feedback contains '继续观察': {'继续观察' in turn1_data['feedback']}")
    
    print("\n=== STAGE 2: BIAS DETECTION (Pattern Recognition) ===")
    # Make another decision to trigger pattern recognition
    decisions_turn2 = {"action": "hire_staff", "amount": 8}  # High number to trigger bias detection
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn2)
    turn2_data = response.json()
    
    print(f"Turn {turn2_data['turnNumber']}: Triggered bias detection")
    has_bias_detection = '检测到的认知偏误' in turn2_data['feedback']
    has_evidence = '证据' in turn2_data['feedback']
    has_severity = '严重程度' in turn2_data['feedback']
    
    print(f"  Has bias detection: {has_bias_detection}")
    print(f"  Has evidence section: {has_evidence}")
    print(f"  Has severity rating: {has_severity}")
    print(f"  Full feedback preview: {turn2_data['feedback'][:150]}...")
    
    print("\n=== STAGE 3: DEEP INSIGHT (Personalized Analysis) ===")
    # Third decision should trigger deeper analysis
    decisions_turn3 = {"action": "marketing", "amount": 300}  # High marketing spend
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn3)
    turn3_data = response.json()
    
    print(f"Turn {turn3_data['turnNumber']}: Triggered deep insight")
    has_pattern_insight = 'pattern' in turn3_data['feedback'].lower() or '模式' in turn3_data['feedback']
    has_personalized = '个性化' in turn3_data['feedback'] or 'personalized' in turn3_data['feedback']
    
    print(f"  Has pattern insight: {has_pattern_insight}")
    print(f"  Has personalized feedback: {has_personalized}")
    print(f"  Feedback preview: {turn3_data['feedback'][:150]}...")
    
    print("\n=== STAGE 4: APPLICATION (Learning Transfer) ===")
    # Fourth decision should show application of learning
    decisions_turn4 = {"action": "hire_staff", "amount": 3}  # Moderate decision after learning
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn4)
    turn4_data = response.json()
    
    print(f"Turn {turn4_data['turnNumber']}: Applied learning")
    print(f"  Feedback preview: {turn4_data['feedback'][:150]}...")
    
    print("\n=== FAILURE LOGIC VALIDATION ===")
    # Validate that failure logic objectives are met
    confusion_present = '继续观察' in turn1_data['feedback']
    bias_detected = has_bias_detection and has_evidence and has_severity
    insight_provided = has_pattern_insight or has_personalized
    multi_stage_process = turn4_data['turnNumber'] >= 4
    
    print(f"✓ Confusion stage working: {confusion_present}")
    print(f"✓ Bias detection working: {bias_detected}")
    print(f"✓ Deep insight provided: {insight_provided}")
    print(f"✓ Multi-stage process: {multi_stage_process}")
    print(f"✓ At least 4+ turns completed: {turn4_data['turnNumber'] >= 4}")
    
    all_objectives_met = confusion_present and bias_detected and insight_provided and multi_stage_process
    
    print(f"\n{'✓' if all_objectives_met else '✗'} FAILURE LOGIC OBJECTIVES {'MET' if all_objectives_met else 'NOT MET'}")
    
    if all_objectives_met:
        print("\nPlatform successfully demonstrates:")
        print("  - Confusion moments that challenge assumptions")
        print("  - Cognitive bias detection and pattern recognition")
        print("  - Personalized insights based on decision history")
        print("  - 4+ stage learning process")
        print("  - Failure as learning opportunity")
    
    return all_objectives_met

if __name__ == "__main__":
    success = test_failure_logic_objectives()
    if success:
        print("\n✓ FAILURE LOGIC TEST PASSED!")
    else:
        print("\n✗ FAILURE LOGIC TEST FAILED!")
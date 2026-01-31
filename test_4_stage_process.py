import requests
import json

def test_4_stage_decision_process():
    """Test the 4+ stage decision process in the cognitive trap platform"""
    base_url = "http://localhost:8081"
    
    print("Testing 4+ stage decision process...")
    
    # Get scenarios
    response = requests.get(base_url + "/scenarios/")
    scenarios_data = response.json()
    
    # Select a scenario (using coffee shop as it's well-defined)
    scenario = next((s for s in scenarios_data['scenarios'] if s['id'] == 'coffee-shop-linear-thinking'), 
                   scenarios_data['scenarios'][0])
    
    print(f"Selected scenario: {scenario['name']} ({scenario['id']})")
    
    # Create a game session
    response = requests.post(base_url + "/scenarios/create_game_session", 
                           params={"scenario_id": scenario['id']})
    session_data = response.json()
    game_id = session_data['game_id']
    
    print(f"Game session created: {game_id}")
    print(f"Turn 1: Confusion Stage")
    
    # Turn 1: Confusion stage - make a decision that leads to unexpected outcome
    decisions_turn1 = {"action": "hire_staff", "amount": 2}
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn1)
    turn1_data = response.json()
    
    print(f"  Decision: Hire {decisions_turn1['amount']} staff members")
    print(f"  Feedback length: {len(turn1_data['feedback'])} chars")
    print(f"  Has confusion element: {'confusion' in turn1_data['feedback'].lower() or 'unexpected' in turn1_data['feedback'].lower()}")
    
    print(f"\nTurn 2: Continued Confusion")
    
    # Turn 2: Continue with similar decision to deepen confusion
    decisions_turn2 = {"action": "marketing", "amount": 150}
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn2)
    turn2_data = response.json()
    
    print(f"  Decision: Marketing spend of {decisions_turn2['amount']}")
    print(f"  Feedback length: {len(turn2_data['feedback'])} chars")
    print(f"  Turn number: {turn2_data['turnNumber']}")
    
    print(f"\nTurn 3: Bias Detection Stage")
    
    # Turn 3: Bias detection occurs
    decisions_turn3 = {"action": "hire_staff", "amount": 5}  # Higher amount to trigger bias detection
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn3)
    turn3_data = response.json()
    
    print(f"  Decision: Hire {decisions_turn3['amount']} staff members")
    print(f"  Feedback length: {len(turn3_data['feedback'])} chars")
    print(f"  Turn number: {turn3_data['turnNumber']}")
    has_bias_detection = 'bias' in turn3_data['feedback'].lower() or '认知偏误' in turn3_data['feedback']
    print(f"  Has bias detection: {has_bias_detection}")
    
    print(f"\nTurn 4: Deep Insight Stage")
    
    # Turn 4: Deep insight and personalized feedback
    decisions_turn4 = {"action": "supply_chain", "amount": 75}
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn4)
    turn4_data = response.json()
    
    print(f"  Decision: Supply chain investment of {decisions_turn4['amount']}")
    print(f"  Feedback length: {len(turn4_data['feedback'])} chars")
    print(f"  Turn number: {turn4_data['turnNumber']}")
    has_deep_insight = 'insight' in turn4_data['feedback'].lower() or '洞察' in turn4_data['feedback']
    print(f"  Has deep insight: {has_deep_insight}")
    
    print(f"\nTurn 5: Application Stage")
    
    # Turn 5: Application of learning
    decisions_turn5 = {"action": "hire_staff", "amount": 3}  # Moderate amount after learning
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn5)
    turn5_data = response.json()
    
    print(f"  Decision: Hire {decisions_turn5['amount']} staff members (moderate after learning)")
    print(f"  Feedback length: {len(turn5_data['feedback'])} chars")
    print(f"  Turn number: {turn5_data['turnNumber']}")
    
    # Overall assessment
    stages_completed = 0
    if turn1_data['turnNumber'] >= 1: stages_completed += 1
    if turn2_data['turnNumber'] >= 2: stages_completed += 1
    if turn3_data['turnNumber'] >= 3 and has_bias_detection: stages_completed += 1
    if turn4_data['turnNumber'] >= 4 and has_deep_insight: stages_completed += 1
    if turn5_data['turnNumber'] >= 5: stages_completed += 1
    
    print(f"\n✓ 4+ Stage Decision Process Test Results:")
    print(f"  - Stages completed: {stages_completed}/5")
    print(f"  - Bias detection triggered: {has_bias_detection}")
    print(f"  - Deep insight provided: {has_deep_insight}")
    print(f"  - Process successfully demonstrated: {stages_completed >= 4}")
    
    return stages_completed >= 4

if __name__ == "__main__":
    success = test_4_stage_decision_process()
    if success:
        print("\n✓ 4+ Stage Decision Process test PASSED!")
    else:
        print("\n✗ 4+ Stage Decision Process test FAILED!")
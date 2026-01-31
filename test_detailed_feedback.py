import requests
import json

def test_detailed_feedback_process():
    """Test the detailed feedback process to understand the 4+ stage mechanism"""
    base_url = "http://localhost:8081"
    
    print("Testing detailed feedback process...")
    
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
    
    # Execute multiple turns to observe the feedback evolution
    for turn_num in range(1, 7):
        print(f"\n--- TURN {turn_num} ---")
        
        if turn_num == 1:
            decisions = {"action": "hire_staff", "amount": 2}
        elif turn_num == 2:
            decisions = {"action": "marketing", "amount": 100}
        elif turn_num == 3:
            decisions = {"action": "hire_staff", "amount": 8}  # High amount to trigger bias
        elif turn_num == 4:
            decisions = {"action": "marketing", "amount": 200}  # High amount for advanced feedback
        elif turn_num == 5:
            decisions = {"action": "supply_chain", "amount": 150}
        else:
            decisions = {"action": "hire_staff", "amount": 3}
        
        response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions)
        turn_data = response.json()
        
        print(f"Decision: {decisions}")
        print(f"Turn number: {turn_data['turnNumber']}")
        print(f"Feedback preview: {turn_data['feedback'][:200]}...")
        print(f"Full feedback length: {len(turn_data['feedback'])}")
        
        # Look for specific indicators in the feedback
        feedback_lower = turn_data['feedback'].lower()
        
        # Check for confusion elements (early turns)
        if turn_num <= 2:
            confusion_elements = ['困惑', 'unexpected', 'surprising', '奇怪', 'mistake', 'error']
            has_confusion = any(element in feedback_lower for element in confusion_elements)
            print(f"Has confusion elements: {has_confusion}")
        
        # Check for bias detection (turn 3)
        if turn_num == 3:
            bias_elements = ['bias', '偏误', 'cognitive', '思维定势', '认知', 'pattern', 'tendency']
            has_bias = any(element in feedback_lower for element in bias_elements)
            print(f"Has bias detection: {has_bias}")
        
        # Check for deeper insights (turns 4+)
        if turn_num >= 4:
            insight_elements = ['insight', '洞察', 'deep', '深入', 'analysis', '分析', 'pattern', '模式', 'understanding', '理解']
            has_insight = any(element in feedback_lower for element in insight_elements)
            print(f"Has deep insight: {has_insight}")
    
    print(f"\n✓ Detailed feedback process test completed!")

if __name__ == "__main__":
    test_detailed_feedback_process()
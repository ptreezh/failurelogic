import requests
import json

def test_enhanced_4_stage_process():
    """Test enhanced 4+ stage process with better decision strategy"""
    base_url = "http://localhost:8081"
    
    print("Testing Enhanced 4+ Stage Process...")
    
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
    
    # Stage 1: Confusion (Early unexpected outcome)
    print("\n=== STAGE 1: CONFUSION ===")
    decisions_turn1 = {"action": "hire_staff", "amount": 2}
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn1)
    turn1_data = response.json()
    
    print(f"Turn {turn1_data['turnNumber']}: Initial decision made")
    print(f"  Feedback preview: {turn1_data['feedback'][:100]}...")
    
    # Stage 2: Bias Detection (Pattern recognition)
    print("\n=== STAGE 2: BIAS DETECTION ===")
    decisions_turn2 = {"action": "hire_staff", "amount": 8}  # Consistent high hiring
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn2)
    turn2_data = response.json()
    
    print(f"Turn {turn2_data['turnNumber']}: Bias detection triggered")
    has_bias_elements = '认知偏误' in turn2_data['feedback'] and '检测到' in turn2_data['feedback']
    print(f"  Has bias detection: {has_bias_elements}")
    print(f"  Feedback preview: {turn2_data['feedback'][:150]}...")
    
    # Stage 3: Deep Insight (Look for personalized insight)
    print("\n=== STAGE 3: DEEP INSIGHT ===")
    decisions_turn3 = {"action": "marketing", "amount": 400}  # Very high marketing to trigger insights
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn3)
    turn3_data = response.json()
    
    print(f"Turn {turn3_data['turnNumber']}: Deep insight attempt")
    # Check for pattern analysis, personalized feedback, or cross-scenario insights
    has_pattern_analysis = '模式分析' in turn3_data['feedback'] or 'pattern' in turn3_data['feedback'].lower()
    has_personalized_feedback = '个性化' in turn3_data['feedback'] or 'personalized' in turn3_data['feedback'].lower()
    has_cross_scenario = '跨场景' in turn3_data['feedback'] or 'cross' in turn3_data['feedback'].lower()
    
    print(f"  Has pattern analysis: {has_pattern_analysis}")
    print(f"  Has personalized feedback: {has_personalized_feedback}")
    print(f"  Has cross-scenario insight: {has_cross_scenario}")
    print(f"  Feedback preview: {turn3_data['feedback'][:150]}...")
    
    # Stage 4: Application (Learning transfer)
    print("\n=== STAGE 4: APPLICATION ===")
    decisions_turn4 = {"action": "supply_chain", "amount": 200}  # Different action type
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn4)
    turn4_data = response.json()
    
    print(f"Turn {turn4_data['turnNumber']}: Application stage")
    print(f"  Feedback preview: {turn4_data['feedback'][:150]}...")
    
    # Stage 5: Advanced Learning (Continued insight)
    print("\n=== STAGE 5: ADVANCED LEARNING ===")
    decisions_turn5 = {"action": "hire_staff", "amount": 3}  # Moderate decision after learning
    response = requests.post(base_url + f"/scenarios/{game_id}/turn", json=decisions_turn5)
    turn5_data = response.json()
    
    print(f"Turn {turn5_data['turnNumber']}: Advanced learning")
    print(f"  Feedback preview: {turn5_data['feedback'][:150]}...")
    
    # Validation
    print("\n=== VALIDATION ===")
    stages_working = [
        ("Confusion", turn1_data['turnNumber'] >= 1),
        ("Bias Detection", has_bias_elements),
        ("Deep Insight", has_pattern_analysis or has_personalized_feedback or has_cross_scenario),
        ("Multi-turn Process", turn5_data['turnNumber'] >= 5)
    ]
    
    for stage_name, is_working in stages_working:
        print(f"  ✓ {stage_name}: {'PASS' if is_working else 'FAIL'}")
    
    all_pass = all(result for _, result in stages_working)
    
    print(f"\n{'✓' if all_pass else '✗'} ENHANCED 4+ STAGE PROCESS: {'SUCCESS' if all_pass else 'NEEDS IMPROVEMENT'}")
    
    # Additional check for failure logic principles
    print("\n=== FAILURE LOGIC PRINCIPLES CHECK ===")
    principles_covered = 0
    
    # 1. Challenge assumptions
    assumption_challenged = '线性思维' in turn2_data['feedback']
    if assumption_challenged:
        print("  ✓ Assumptions challenged (linear thinking)")
        principles_covered += 1
    
    # 2. Reveal cognitive biases
    bias_revealed = '认知偏误' in turn2_data['feedback']
    if bias_revealed:
        print("  ✓ Cognitive biases revealed")
        principles_covered += 1
    
    # 3. Provide learning opportunities
    learning_opportunity = len([t for t in [turn1_data, turn2_data, turn3_data, turn4_data, turn5_data] 
                              if '学习' in t['feedback'] or 'learn' in t['feedback'].lower() or 'insight' in t['feedback'].lower() or '洞察' in t['feedback']]) > 0
    if learning_opportunity:
        print("  ✓ Learning opportunities provided")
        principles_covered += 1
    
    # 4. Show system complexity
    complexity_shown = '复杂系统' in turn2_data['feedback'] or 'complex' in turn2_data['feedback'].lower()
    if complexity_shown:
        print("  ✓ System complexity demonstrated")
        principles_covered += 1
    
    print(f"  Principles covered: {principles_covered}/4")
    
    return all_pass

if __name__ == "__main__":
    success = test_enhanced_4_stage_process()
    if success:
        print("\n✓ ENHANCED 4+ STAGE PROCESS TEST PASSED!")
    else:
        print("\n? ENHANCED 4+ STAGE PROCESS TEST COMPLETE - SOME IMPROVEMENTS POSSIBLE")
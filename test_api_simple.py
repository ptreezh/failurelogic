import requests
import json

def test_api_endpoints():
    """Test the cognitive trap platform API endpoints"""
    base_url = "http://localhost:8081"
    
    print("Testing cognitive trap platform API...")
    
    # Test health endpoint
    try:
        response = requests.get(base_url + "/health")
        if response.status_code == 200:
            health_data = response.json()
            print("✓ Health check:", health_data['message'])
        else:
            print("✗ Health check failed:", response.status_code)
            return False
    except Exception as e:
        print("✗ Health check error:", e)
        return False
    
    # Test scenarios endpoint
    try:
        response = requests.get(base_url + "/scenarios/")
        if response.status_code == 200:
            scenarios_data = response.json()
            print("✓ Scenarios endpoint: Found", len(scenarios_data['scenarios']), "scenarios")
        else:
            print("✗ Scenarios endpoint failed:", response.status_code)
            return False
    except Exception as e:
        print("✗ Scenarios endpoint error:", e)
        return False
    
    # Test creating a game session
    try:
        scenario_id = scenarios_data['scenarios'][0]['id']  # Get first scenario
        response = requests.post(base_url + "/scenarios/create_game_session", 
                               params={"scenario_id": scenario_id})
        if response.status_code == 200:
            session_data = response.json()
            game_id = session_data.get('game_id')
            print("✓ Game session created:", game_id)
        else:
            print("✗ Game session creation failed:", response.status_code)
            return False
    except Exception as e:
        print("✗ Game session creation error:", e)
        return False
    
    # Test executing a turn
    try:
        if game_id:
            decisions = {"action": "hire_staff", "amount": 3}
            response = requests.post(base_url + "/scenarios/" + game_id + "/turn", 
                                   json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                print("✓ Turn executed successfully")
                print("  Turn number:", turn_data['turnNumber'])
                print("  Feedback preview:", turn_data['feedback'][:100], "...")
            else:
                print("✗ Turn execution failed:", response.status_code)
                return False
    except Exception as e:
        print("✗ Turn execution error:", e)
        return False
    
    print("\n✓ All API tests passed!")
    return True

if __name__ == "__main__":
    test_api_endpoints()
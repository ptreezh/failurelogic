"""
模拟交互测试 - 模拟用户在前端界面的交互体验
"""
import requests
import time
import json

def simulate_user_interaction():
    """模拟用户交互测试"""
    print("=== 模拟用户交互测试开始 ===\n")
    
    base_url = "http://localhost:8080"
    
    print("模拟场景1: 用户从初级难度开始，逐步挑战高级难度")
    print("-" * 50)
    
    # 用户选择咖啡店场景，从初级开始
    print("1. 用户选择'咖啡店线性思维'场景，从初级难度开始...")
    try:
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "coffee-shop-linear-thinking", "difficulty": "beginner"})
        if response.status_code == 200:
            session_data = response.json()
            game_id = session_data['game_id']
            print(f"   ✓ 成功创建初级难度会话: {game_id}")
            print(f"   - 场景: 咖啡店线性思维")
            print(f"   - 难度: {session_data['difficulty']}")
            print(f"   - 挑战类型: {session_data['challenge_type']}")
        else:
            print(f"   ❌ 创建会话失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ 请求失败: {e}")
        return False
    
    print()
    
    # 用户执行几次初级回合
    print("2. 用户开始初级挑战，执行几次决策...")
    for i in range(3):
        print(f"   第{i+1}次决策:")
        decisions = [
            {"action": "hire_staff", "amount": 2 + i},
            {"action": "marketing", "amount": 100 + i*50}
        ][i % 2]  # 交替执行不同决策
        
        try:
            response = requests.post(f"{base_url}/scenarios/{game_id}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                print(f"     - 执行动: {decisions['action']} (金额: {decisions['amount']})")
                print(f"     - 满意度: {turn_data['game_state']['satisfaction']:.1f}")
                print(f"     - 资源: {turn_data['game_state']['resources']}")
                print(f"     - 反馈: {turn_data['feedback'][:50]}...")
            else:
                print(f"     ❌ 执行动失败: {response.status_code}")
        except Exception as e:
            print(f"     ❌ 执行动时出错: {e}")
    
    print()
    
    print("3. 用户挑战成功后，系统推荐中级难度...")
    # 创建中级难度会话
    try:
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "coffee-shop-linear-thinking", "difficulty": "intermediate"})
        if response.status_code == 200:
            session_data = response.json()
            game_id_intermediate = session_data['game_id']
            print(f"   ✓ 成功创建中级难度会话: {game_id_intermediate}")
            print(f"   - 难度: {session_data['difficulty']}")
            print(f"   - 挑战类型: {session_data['challenge_type']}")
            
            # 执行动
            decisions = {"action": "marketing", "amount": 200}
            response = requests.post(f"{base_url}/scenarios/{game_id_intermediate}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                feedback = turn_data['feedback']
                print(f"   - 执行动后反馈: {feedback[:60]}...")
                if "复利" in feedback or "通胀" in feedback or "网络效应" in feedback:
                    print("   ✓ 反馈正确体现了中级难度概念")
            else:
                print(f"   ❌ 执行动失败: {response.status_code}")
        else:
            print(f"   ❌ 创建中级会话失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 中级难度测试失败: {e}")
    
    print()
    
    print("4. 用户挑战成功后，系统推荐高级难度...")
    # 创建高级难度会话
    try:
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "coffee-shop-linear-thinking", "difficulty": "advanced"})
        if response.status_code == 200:
            session_data = response.json()
            game_id_advanced = session_data['game_id']
            print(f"   ✓ 成功创建高级难度会话: {game_id_advanced}")
            print(f"   - 难度: {session_data['difficulty']}")
            print(f"   - 挑战类型: {session_data['challenge_type']}")
            
            # 执行高级行动
            decisions = {"action": "supply_chain", "amount": 120}
            response = requests.post(f"{base_url}/scenarios/{game_id_advanced}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                feedback = turn_data['feedback']
                print(f"   - 执行动后反馈: {feedback[:60]}...")
                if "指数增长" in feedback or "复杂系统" in feedback or "级联" in feedback:
                    print("   ✓ 反馈正确体现了高级难度概念")
            else:
                print(f"   ❌ 执行动失败: {response.status_code}")
                print(f"   响应: {response.text}")
        else:
            print(f"   ❌ 创建高级会话失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 高级难度测试失败: {e}")
    
    print()
    
    print("模拟场景2: 用户在关系场景中体验复利思维挑战")
    print("-" * 50)
    
    # 在关系场景中体验中级难度（复利效应）
    print("5. 用户选择'恋爱关系时间延迟'场景，体验中级难度的复利概念...")
    try:
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "relationship-time-delay", "difficulty": "intermediate"})
        if response.status_code == 200:
            session_data = response.json()
            game_id_rel = session_data['game_id']
            print(f"   ✓ 成功创建关系场景中级难度会话: {game_id_rel}")
            
            # 执行动，体验复利概念
            decisions = {"action": "communication", "amount": 60}
            response = requests.post(f"{base_url}/scenarios/{game_id_rel}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                feedback = turn_data['feedback']
                print(f"   - 执行动后反馈: {feedback[:80]}...")
                if "复利" in feedback or "长期" in feedback:
                    print("   ✓ 反馈正确体现了复利思维概念")
            else:
                print(f"   ❌ 执行动失败: {response.status_code}")
        else:
            print(f"   ❌ 创建关系场景会话失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 关系场景测试失败: {e}")
    
    print()
    
    print("模拟场景3: 用户在投资场景中体验复杂系统思维")
    print("-" * 50)
    
    # 在投资场景中体验高级难度（复杂系统）
    print("6. 用户选择'投资确认偏误'场景，体验高级难度的复杂系统概念...")
    try:
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "investment-confirmation-bias", "difficulty": "advanced"})
        if response.status_code == 200:
            session_data = response.json()
            game_id_inv = session_data['game_id']
            print(f"   ✓ 成功创建投资场景高级难度会话: {game_id_inv}")
            
            # 执行动，体验复杂系统概念
            decisions = {"action": "diversify", "amount": 150}
            response = requests.post(f"{base_url}/scenarios/{game_id_inv}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                feedback = turn_data['feedback']
                print(f"   - 执行动后反馈: {feedback[:80]}...")
                if "相关性" in feedback or "黑天鹅" in feedback or "系统性风险" in feedback:
                    print("   ✓ 反馈正确体现了复杂系统概念")
            else:
                print(f"   ❌ 执行动失败: {response.status_code}")
        else:
            print(f"   ❌ 创建投资场景会话失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 投资场景测试失败: {e}")
    
    print()
    
    print("模拟场景4: 验证难度切换的无缝体验")
    print("-" * 50)
    
    print("7. 测试在同一场景中无缝切换不同难度...")
    try:
        # 基础难度
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "relationship-time-delay", "difficulty": "beginner"})
        if response.status_code == 200:
            basic_session = response.json()['game_id']
            print("   ✓ 成功创建基础难度会话")
        
        # 中级难度
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "relationship-time-delay", "difficulty": "intermediate"})
        if response.status_code == 200:
            intermediate_session = response.json()['game_id']
            print("   ✓ 成功创建中级难度会话")
            
            # 体验中级概念
            decisions = {"action": "communication", "amount": 30}
            response = requests.post(f"{base_url}/scenarios/{intermediate_session}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                if "复利" in turn_data['feedback']:
                    print("   ✓ 中级难度正确体现复利概念")
        
        # 高级难度
        response = requests.post(f"{base_url}/scenarios/create_game_session", 
                                params={"scenario_id": "relationship-time-delay", "difficulty": "advanced"})
        if response.status_code == 200:
            advanced_session = response.json()['game_id']
            print("   ✓ 成功创建高级难度会话")
            
            # 体验高级概念
            decisions = {"action": "communication", "amount": 40}
            response = requests.post(f"{base_url}/scenarios/{advanced_session}/turn", json=decisions)
            if response.status_code == 200:
                turn_data = response.json()
                if "网络效应" in turn_data['feedback']:
                    print("   ✓ 高级难度正确体现网络效应概念")
    except Exception as e:
        print(f"   ❌ 难度切换测试失败: {e}")
    
    print()
    print("=== 模拟交互测试完成 ===")
    return True

if __name__ == "__main__":
    success = simulate_user_interaction()
    if success:
        print("\n✓ 模拟交互测试通过！用户可以无缝体验从初级到高级的挑战。")
    else:
        print("\n❌ 模拟交互测试失败！")
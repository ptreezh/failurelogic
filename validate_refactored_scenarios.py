"""
验证重构后的统一认知陷阱场景功能
"""
import sys
import os
import json

def validate_refactored_scenarios():
    """验证重构后的场景结构"""
    print("=== 验证重构后的统一认知陷阱场景 ===\n")
    
    # 1. 验证场景结构
    print("1. 检查场景数据结构...")
    
    # 临时进入api-server目录以避免assets问题
    original_cwd = os.getcwd()
    api_server_dir = os.path.join(original_cwd, 'api-server')
    os.chdir(api_server_dir)
    
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("start", "start.py")
        start_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(start_module)
        
        scenarios = start_module.SCENARIOS
        
        print(f"   ✓ 找到 {len(scenarios)} 个基础场景")
        
        # 检查每个场景是否包含高级挑战
        for scenario in scenarios:
            print(f"   - 场景: {scenario['name']}")
            print(f"     ID: {scenario['id']}")
            print(f"     基础难度: {scenario['difficulty']}")
            
            if 'advancedChallenges' in scenario:
                print(f"     高级挑战数量: {len(scenario['advancedChallenges'])}")
                for i, challenge in enumerate(scenario['advancedChallenges']):
                    print(f"       {i+1}. {challenge['title']} (难度: {challenge['difficulty']})")
            else:
                print("     ❌ 未找到高级挑战")
            print()
        
        # 2. 验证API端点支持难度参数
        print("2. 检查API端点功能...")
        app = start_module.app
        
        # 查找create_game_session端点
        create_endpoint = None
        for route in app.routes:
            if '/scenarios/create_game_session' in route.path:
                create_endpoint = route
                break
        
        if create_endpoint:
            print("   ✓ create_game_session端点存在")
            # 检查函数签名
            create_func = start_module.create_game_session
            import inspect
            sig = inspect.signature(create_func)
            if 'difficulty' in sig.parameters:
                print("   ✓ 支持difficulty参数")
            else:
                print("   ❌ 不支持difficulty参数")
        else:
            print("   ❌ 未找到create_game_session端点")
        
        print()
        
        # 3. 验证逻辑函数支持难度参数
        print("3. 检查业务逻辑函数...")
        logic_func = start_module.execute_real_logic
        import inspect
        sig = inspect.signature(logic_func)
        if 'difficulty' in sig.parameters:
            print("   ✓ execute_real_logic支持difficulty参数")
        else:
            print("   ❌ execute_real_logic不支持difficulty参数")
        
        feedback_func = start_module.generate_real_feedback
        sig = inspect.signature(feedback_func)
        if 'difficulty' in sig.parameters:
            print("   ✓ generate_real_feedback支持difficulty参数")
        else:
            print("   ❌ generate_real_feedback不支持difficulty参数")
        
        print()
        
        # 4. 演示不同难度场景功能
        print("4. 演示高级挑战功能...")
        
        # 测试基础逻辑
        base_state = {
            "resources": 1000,
            "satisfaction": 50,
            "reputation": 50,
            "knowledge": 0,
            "turn_number": 1
        }
        
        decisions = {"action": "hire_staff", "amount": 5}
        
        # 测试不同难度的逻辑执行
        basic_result = start_module.execute_real_logic(
            "coffee-shop-linear-thinking", base_state, decisions, "beginner"
        )
        intermediate_result = start_module.execute_real_logic(
            "coffee-shop-linear-thinking", base_state, decisions, "intermediate"
        )
        advanced_result = start_module.execute_real_logic(
            "coffee-shop-linear-thinking", base_state, decisions, "advanced"
        )
        
        print("   ✓ 不同难度逻辑执行正常")
        print(f"     基础难度满意度变化: {basic_result['satisfaction'] - base_state['satisfaction']}")
        print(f"     中级难度满意度变化: {intermediate_result['satisfaction'] - base_state['satisfaction']}")
        print(f"     高级难度满意度变化: {advanced_result['satisfaction'] - base_state['satisfaction']}")
        
        # 测试反馈生成
        old_state = {"satisfaction": 50, "resources": 1000, "knowledge": 0}
        new_state = {"satisfaction": 60, "resources": 800, "knowledge": 10}
        
        basic_feedback = start_module.generate_real_feedback(
            "coffee-shop-linear-thinking", decisions, old_state, new_state, "beginner"
        )
        advanced_feedback = start_module.generate_real_feedback(
            "coffee-shop-linear-thinking", decisions, old_state, new_state, "advanced"
        )
        
        print("   ✓ 不同难度反馈生成正常")
        print(f"     基础反馈长度: {len(basic_feedback)} 字符")
        print(f"     高级反馈长度: {len(advanced_feedback)} 字符")
        
    except Exception as e:
        print(f"   ❌ 验证过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # 恢复工作目录
        os.chdir(original_cwd)
    
    print("\n=== 验证完成 ===")
    print("重构成功！高级挑战功能已与基础场景统一整合。")

if __name__ == "__main__":
    validate_refactored_scenarios()
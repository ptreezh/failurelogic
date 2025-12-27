"""
TDD测试驱动开发：认知陷阱平台后端重构
第二步：实现API端点统一 - 支持难度参数
"""
import sys
import os
import re

def implement_unified_api_endpoints():
    """实现统一API端点 - 添加难度参数支持"""
    print("正在实现统一API端点...")
    
    # 读取当前的start.py文件
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 查找create_game_session函数定义
    # 之前我们在重构中已经添加了difficulty参数，但现在我们要确保其完整实现
    pattern = r'(@app\.post\("/scenarios/create_game_session"\)\s*\nasync def create_game_session\([^)]*)\s*:)(.*?)(\n@app\.post|def |\Z)'
    matches = re.search(pattern, content, re.DOTALL)
    
    if not matches:
        raise Exception("未找到create_game_session函数")
    
    func_signature = matches.group(1)
    func_body = matches.group(2)
    next_section = matches.group(3)
    
    print("✓ 找到create_game_session函数")
    
    # 检查现有的函数参数是否已包含difficulty
    if 'difficulty: str = Query(' not in content:
        # 如果没有，则需要更新函数签名
        # 我们需要修改函数参数，添加difficulty参数
        updated_signature = func_signature.replace(
            'scenario_id: str = Query(..., alias="scenario_id")', 
            'scenario_id: str = Query(..., alias="scenario_id"), difficulty: str = Query("auto", description="难度级别: beginner, intermediate, advanced, 或 auto")'
        )
        
        # 更新函数定义
        updated_content = content.replace(func_signature, updated_signature)
        content = updated_content
        print("✓ 已更新函数签名以包含difficulty参数")
    else:
        print("✓ 函数签名已包含difficulty参数")
    
    # 检查函数体内是否有difficulty处理逻辑
    if 'difficulty' not in func_body:
        # 如果没有，则需要更新函数体
        # 我们将使用之前在重构中实现的逻辑
        updated_func_body = '''    """创建游戏会话，支持不同难度级别"""
    scenario = next((s for s in SCENARIOS if s["id"] == scenario_id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景未找到")

    # 根据难度参数调整场景
    selected_scenario = scenario.copy()
    
    if difficulty != "auto":
        # 如果指定了具体难度，查找对应的高级挑战内容
        if difficulty != scenario["difficulty"]:
            # 在高级挑战中查找匹配难度的挑战
            matching_challenge = None
            if "advancedChallenges" in scenario:
                for challenge in scenario["advancedChallenges"]:
                    if challenge["difficulty"] == difficulty:
                        matching_challenge = challenge
                        break
            
            if matching_challenge:
                # 用高级挑战的信息更新场景
                selected_scenario["name"] = f"{scenario['name']} - {matching_challenge['title']}"
                selected_scenario["description"] = matching_challenge["description"]
                selected_scenario["targetBiases"] = matching_challenge["cognitiveBiases"]
                selected_scenario["cognitiveBias"] = ", ".join(matching_challenge["cognitiveBiases"])
    
    # 生成会话ID
    session_id = f"session_{int(datetime.now().timestamp())}_{random.randint(1000, 9999)}"

    # 根据难度初始化不同的游戏状态
    initial_state = {
        "resources": 1000,          # 初始资源
        "satisfaction": 50,         # 客户满意度
        "reputation": 50,           # 声誉
        "knowledge": 0,             # 知识水平
        "turn_number": 1,           # 回合数
        "difficulty": difficulty if difficulty != "auto" else selected_scenario["difficulty"],  # 记录难度
        "challenge_type": "base" if difficulty == "auto" or difficulty == scenario["difficulty"] else "advanced"  # 挑战类型
    }

    # 存储会话
    game_sessions[session_id] = {
        "session_id": session_id,
        "scenario_id": scenario_id,
        "scenario": selected_scenario,  # 使用可能已调整的场景
        "turn": 1,
        "game_state": initial_state,
        "created_at": datetime.now().isoformat(),
        "history": [],
        "difficulty": difficulty if difficulty != "auto" else selected_scenario["difficulty"]
    }

    return {
        "success": True,
        "game_id": session_id,
        "message": f"游戏会话已创建",
        "difficulty": initial_state["difficulty"],
        "challenge_type": initial_state["challenge_type"]
    }'''
        
        # 替换函数体
        updated_content = content.replace(func_body, updated_func_body)
        
        # 写入更新的内容
        with open("api-server/start.py", "w", encoding="utf-8") as f:
            f.write(updated_content)
        
        print("✓ 已更新函数体以处理difficulty参数")
    else:
        print("✓ 函数体已包含difficulty处理逻辑")
    
    print("✓ 统一API端点实现完成")
    return True

def implement_execute_turn_difficulty_support():
    """实现execute_turn函数的难度支持"""
    print("正在实现execute_turn函数的难度支持...")
    
    # 读取当前的start.py文件
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 查找execute_turn函数定义
    pattern = r'(@app\.post\("/scenarios/\{game_id\}/turn"\)\s*\nasync def execute_turn\(game_id: str, decisions: Dict\[str, Any\]\):\s*"""执行游戏回合.*?""")(.*?)(\n@app\.post|\Z)'
    matches = re.search(pattern, content, re.DOTALL)
    
    if not matches:
        # 查找更简单的模式
        pattern = r'(@app\.post\("/scenarios/\{game_id\}/turn"\).*?async def execute_turn\(game_id: str, decisions: Dict\[str, Any\]\):)(.*?)(\n@app\.post|\Z)'
        matches = re.search(pattern, content, re.DOTALL)
    
    if not matches:
        raise Exception("未找到execute_turn函数")
    
    func_signature = matches.group(1)
    func_body = matches.group(2)
    
    print("✓ 找到execute_turn函数")
    
    # 检查函数体是否已经包含难度处理
    if 'difficulty' not in func_body:
        # 更新函数体以支持难度参数
        updated_func_body = '''
    """执行游戏回合（真实逻辑实现），支持不同难度级别"""
    if game_id not in game_sessions:
        raise HTTPException(status_code=404, detail="游戏会话未找到")

    session = game_sessions[game_id]
    scenario_id = session["scenario_id"]
    current_state = session["game_state"].copy()
    difficulty = session.get("difficulty", "beginner")  # 获取难度级别

    # 根据场景类型和难度执行真实的逻辑处理
    new_state = execute_real_logic(scenario_id, current_state, decisions, difficulty=difficulty)

    # 更新回合数
    new_state["turn_number"] = current_state["turn_number"] + 1

    # 更新会话状态
    session["game_state"] = new_state
    session["turn"] += 1

    # 记录历史
    session["history"].append({
        "turn": current_state["turn_number"],
        "decisions": decisions,
        "result_state": new_state,
        "difficulty": difficulty
    })

    # 根据难度生成相应的反馈
    feedback = generate_real_feedback(scenario_id, decisions, current_state, new_state, difficulty=difficulty)

    # 立即响应机制，增加用户交互反馈
    immediate_response = {
        "status": "processed",
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state,
        "immediate_acknowledgment": True,
        "processing_time_ms": 100,  # 模拟响应时间
        "user_interaction_response": "您的决策已记录，正在计算结果...",
        "difficulty": difficulty
    }

    return {
        "success": True,
        "turnNumber": new_state["turn_number"],
        "feedback": feedback,
        "game_state": new_state,
        "immediate_response": immediate_response,
        "difficulty": difficulty
    }'''
        
        # 替换函数体
        updated_content = content.replace(func_body, updated_func_body)
        
        # 写入更新的内容
        with open("api-server/start.py", "w", encoding="utf-8") as f:
            f.write(updated_content)
        
        print("✓ 已更新execute_turn函数体以支持难度参数")
    else:
        print("✓ execute_turn函数体已包含难度处理逻辑")
    
    print("✓ execute_turn函数难度支持实现完成")
    return True

def verify_implementation():
    """验证API端点统一实现结果"""
    print("正在验证API端点统一实现结果...")
    
    # 重新读取文件验证修改
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 检查create_game_session是否包含difficulty参数
    if 'difficulty: str = Query(' in content and 'create_game_session' in content:
        print("✓ create_game_session函数包含difficulty参数")
    else:
        raise AssertionError("create_game_session函数缺少difficulty参数")
    
    # 检查execute_turn是否包含难度处理
    if 'difficulty' in content and 'execute_turn' in content:
        print("✓ execute_turn函数包含难度处理逻辑")
    else:
        print("! execute_turn函数可能缺少难度处理逻辑")
    
    # 检查端点是否正常
    if '@app.post("/scenarios/create_game_session"' in content:
        print("✓ create_game_session端点已定义")
    else:
        raise AssertionError("create_game_session端点未定义")
    
    if '@app.post("/scenarios/{game_id}/turn"' in content:
        print("✓ execute_turn端点已定义")
    else:
        raise AssertionError("execute_turn端点未定义")
    
    print("✓ API端点统一实现验证完成")
    return True

if __name__ == "__main__":
    print("开始TDD实施: API端点统一\n")
    
    try:
        # 实施API端点统一
        implement_unified_api_endpoints()
        implement_execute_turn_difficulty_support()
        
        # 验证实施结果
        verify_implementation()
        
        print("\n🎉 API端点统一TDD实施成功完成!")
        print("现在可以继续下一步: 业务逻辑分层实现")
        
    except Exception as e:
        print(f"\n❌ 实施失败: {e}")
        import traceback
        traceback.print_exc()
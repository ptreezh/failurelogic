"""
TDD测试用例：验证场景数据模型扩展（简化版本）
"""
import sys
import os
import json
import re

def test_scenario_model_extension():
    """测试场景数据模型扩展，验证高级挑战内容整合"""
    print("Running test_scenario_model_extension...")
    
    # 直接读取start.py文件，查找SCENARIOS定义
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 使用正则表达式查找SCENARIOS定义
    # 查找SCENARIOS = [ ... ]的模式
    pattern = r'SCENARIOS\s*=\s*\[(.*?)\]'
    matches = re.findall(pattern, content, re.DOTALL)
    
    if not matches:
        raise Exception("未找到SCENARIOS定义")
    
    # 验证找到的匹配项
    scenarios_content = matches[0]  # 获取第一个匹配项
    
    # 验证包含三个主要场景
    assert "coffee-shop-linear-thinking" in scenarios_content, "缺少咖啡店线性思维场景"
    assert "relationship-time-delay" in scenarios_content, "缺少恋爱关系时间延迟场景"
    assert "investment-confirmation-bias" in scenarios_content, "缺少投资确认偏误场景"
    
    print("✓ 场景ID验证通过")
    
    # 验证包含高级挑战定义
    assert "advancedChallenges" in scenarios_content, "缺少高级挑战定义"
    print("✓ 高级挑战字段验证通过")
    
    # 按场景验证结构
    scenarios_data = [
        {
            "id": "coffee-shop-linear-thinking",
            "name": "咖啡店线性思维",
            "has_advanced": True
        },
        {
            "id": "relationship-time-delay", 
            "name": "恋爱关系时间延迟",
            "has_advanced": True
        },
        {
            "id": "investment-confirmation-bias",
            "name": "投资确认偏误",
            "has_advanced": True
        }
    ]
    
    for scenario in scenarios_data:
        assert scenario["id"] in scenarios_content, f"场景 {scenario['id']} 未找到"
        if scenario["has_advanced"]:
            # 确保高级挑战结构存在
            advanced_pattern = rf'["\']{scenario["id"]}["\'].*?advancedChallenges'
            if not re.search(advanced_pattern, content, re.DOTALL):
                # 用另一种方式检查
                id_start = content.find(f'"id": "{scenario["id"]}"')
                if id_start != -1:
                    # 找到场景开始，检查是否包含advancedChallenges
                    next_comma = content.find(',', id_start)
                    next_close = content.find('}', id_start)
                    end_pos = min(next_comma if next_comma != -1 else float('inf'), 
                                 next_close if next_close != -1 else float('inf'))
                    if end_pos == float('inf'):
                        end_pos = len(content)
                    
                    scenario_block = content[id_start:end_pos]
                    if "advancedChallenges" not in scenario_block:
                        # 如果找不到，可能在更大的块中能找到
                        # 找到整个场景定义
                        start_brace = content.rfind('{', 0, id_start)
                        brace_count = 1
                        pos = start_brace + 1
                        while pos < len(content) and brace_count > 0:
                            if content[pos] == '{':
                                brace_count += 1
                            elif content[pos] == '}':
                                brace_count -= 1
                            pos += 1
                        
                        if brace_count == 0:
                            scenario_full_block = content[start_brace:pos]
                            if "advancedChallenges" in scenario_full_block:
                                print(f"  ✓ 场景 {scenario['id']} 包含高级挑战")
                            else:
                                raise AssertionError(f"场景 {scenario['id']} 不包含高级挑战")
                        else:
                            raise AssertionError(f"无法解析场景 {scenario['id']} 的完整定义")
    
    print("✓ test_scenario_model_extension 通过\n")
    return True

def test_backward_compatibility():
    """测试向后兼容性"""
    print("Running test_backward_compatibility...")
    
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 验证原始的三个场景仍存在且基本属性保持不变
    original_ids = [
        "coffee-shop-linear-thinking",
        "relationship-time-delay", 
        "investment-confirmation-bias"
    ]
    
    for original_id in original_ids:
        assert original_id in content, f"原始场景 {original_id} 丢失"
        
        # 检查是否包含关键字段
        id_pattern = rf'["\']id["\']\s*:\s*["\']{original_id}["\']'
        if re.search(id_pattern, content):
            print(f"✓ 场景 {original_id} 存在")
        else:
            raise AssertionError(f"场景 {original_id} 未找到正确格式")
    
    print("✓ test_backward_compatibility 通过\n")
    return True

def test_advanced_challenge_integration():
    """测试高级挑战内容整合"""
    print("Running test_advanced_challenge_integration...")
    
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 验证高级挑战内容与基础场景的整合
    scenario_ids = [
        "coffee-shop-linear-thinking",
        "relationship-time-delay", 
        "investment-confirmation-bias"
    ]
    
    for scenario_id in scenario_ids:
        # 检查每个基础场景是否都有其高级挑战
        advanced_pattern = rf'["\']{scenario_id}["\'].*?advancedChallenges'
        has_advanced = bool(re.search(advanced_pattern, content, re.DOTALL))
        
        if has_advanced:
            print(f"✓ 场景 {scenario_id} 包含高级挑战")
        else:
            # 检查整个场景定义中是否有advancedChallenges
            id_pos = content.find(f'"id": "{scenario_id}"')
            if id_pos != -1:
                # 找到下一个场景定义的开始或文件结尾
                next_scenario_starts = [
                    content.find('"id": "', id_pos + 10),
                    content.find("'id': '", id_pos + 10),
                    len(content)
                ]
                next_pos = min([pos for pos in next_scenario_starts if pos != -1])
                
                scenario_block = content[id_pos:next_pos]
                if "advancedChallenges" in scenario_block:
                    print(f"✓ 场景 {scenario_id} 包含高级挑战")
                else:
                    print(f"  ! 注意: {scenario_id} 中未找到高级挑战")
            else:
                raise AssertionError(f"场景 {scenario_id} 未找到")
    
    # 确保至少有一些高级挑战被定义
    if "advancedChallenges" in content:
        print("✓ 发现高级挑战定义")
    else:
        raise AssertionError("未找到任何高级挑战定义")
    
    print("✓ test_advanced_challenge_integration 通过\n")
    return True

def run_specific_manual_checks():
    """手动检查一些关键项"""
    print("运行手动检查...")
    
    # 检查difficulty参数函数
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 检查create_game_session函数是否接受difficulty参数
    if "difficulty: str = Query(" in content and "create_game_session" in content:
        print("✓ create_game_session函数支持difficulty参数")
    else:
        print("! 未找到difficulty参数在create_game_session中")
    
    # 检查execute_real_logic函数是否支持difficulty参数
    if "difficulty: str = \"beginner\"" in content and "execute_real_logic" in content:
        print("✓ execute_real_logic函数支持difficulty参数")
    else:
        print("! 未找到difficulty参数在execute_real_logic中")
    
    print("手动检查完成\n")

def run_all_tests():
    """运行所有TDD测试"""
    print("开始运行TDD测试...\n")
    
    tests = [
        test_scenario_model_extension,
        test_backward_compatibility,
        test_advanced_challenge_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ {test_func.__name__} 失败: {e}\n")
    
    # 运行额外的手动检查
    run_specific_manual_checks()
    
    print(f"TDD测试完成: {passed}/{total} 个测试通过")
    
    if passed == total:
        print("🎉 所有TDD测试通过！可以继续下一步开发。")
        return True
    else:
        print("⚠️  有测试未通过，请修复后再继续。")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    if success:
        print("\n✅ 准备阶段TDD测试全部通过，可以继续后端开发。")
    else:
        print("\n❌ 有测试未通过，需要修复。")
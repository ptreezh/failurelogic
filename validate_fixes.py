#!/usr/bin/env python3
"""
验证认知陷阱平台的修复
检查是否所有API反馈都不再提及认知偏差术语
"""

import re
import os

def check_api_feedback():
    """检查API反馈中是否包含认知偏差术语"""
    api_file = "D:/AIDevelop/failureLogic/api-server/start.py"
    
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否包含认知偏差相关术语
    bias_terms = [
        r'认知偏误',
        r'确认偏误', 
        r'线性思维',
        r'线性期望',
        r'线性思维陷阱',
        r'时间延迟偏误',
        r'群体思维',
        r'损失厌恶',
        r'过度自信',
        r'锚定效应',
        r'可得性启发',
        r'现状偏见',
        r'即时满足偏误',
        r'指数增长误区',
        r'复利思维陷阱',
        r'复杂系统思维',
        r'认知陷阱',
        r'思维陷阱',
        r'偏误',
        r'认知偏差',
        r'线性增长偏见',
        r'损失厌恶',
        r'过度自信',
        r'规划偏误',
        r'赢家诅咒',
        r'替代方案谬误',
        r'即时满足',
        r'线性思维期待',
        r'线性思维警告',
        r'线性思维陷阱',
        r'线性思维局限',
        r'线性关系',
        r'线性效应',
        r'线性增长',
        r'线性模式'
    ]
    
    found_terms = []
    for term in bias_terms:
        matches = re.findall(term, content)
        if matches:
            found_terms.append((term, len(matches)))
    
    print("🔍 检查API反馈中的认知偏差术语...")
    if found_terms:
        print("❌ 发现以下认知偏差术语:")
        for term, count in found_terms:
            print(f"  - {term}: {count} 次")
        return False
    else:
        print("✅ 未发现认知偏差术语")
        return True

def check_functions():
    """检查函数名称是否已更新"""
    api_file = "D:/AIDevelop/failureLogic/api-server/start.py"
    
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否还存在旧的函数名
    old_functions = [
        "detect_cognitive_bias",
        "generate_bias_reveal_feedback"
    ]
    
    found_old = []
    for func in old_functions:
        if func in content:
            found_old.append(func)
    
    print("\n🔍 检查函数名称更新...")
    if found_old:
        print("❌ 发现以下旧函数名:")
        for func in found_old:
            print(f"  - {func}")
        return False
    else:
        print("✅ 所有函数名已更新")
        return True

def check_new_functions():
    """检查新函数是否已添加"""
    api_file = "D:/AIDevelop/failureLogic/api-server/start.py"
    
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查新函数是否存在
    new_functions = [
        "detect_decision_pattern",
        "generate_pattern_analysis_feedback",
        "analyze_thinking_traps"
    ]
    
    missing = []
    for func in new_functions:
        if func not in content:
            missing.append(func)
    
    print("\n🔍 检查新函数添加...")
    if missing:
        print("❌ 缺少以下新函数:")
        for func in missing:
            print(f"  - {func}")
        return False
    else:
        print("✅ 所有新函数已添加")
        return True

def main():
    print("🧪 开始验证认知陷阱平台修复...")
    
    checks = [
        check_api_feedback(),
        check_functions(),
        check_new_functions()
    ]
    
    if all(checks):
        print("\n🎉 所有修复验证通过！")
        print("✅ API反馈中无认知偏差术语")
        print("✅ 函数名已正确更新")
        print("✅ 新函数已正确添加")
        print("\n平台现在可以在过程中隐藏认知偏差术语，")
        print("只在游戏结束后提供思维陷阱分析。")
    else:
        print("\n❌ 部分验证失败，请检查上述问题")
        return False
    
    return True

if __name__ == "__main__":
    main()
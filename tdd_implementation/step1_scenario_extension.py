"""
TDD测试驱动开发：认知陷阱平台后端重构
第一步：实现场景数据模型扩展
"""
import sys
import os
import json
import re

def implement_scenario_data_model_extension():
    """实现场景数据模型扩展 - 添加高级挑战内容"""
    print("正在实现场景数据模型扩展...")
    
    # 读取当前的start.py文件
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 检查当前的SCENARIOS定义
    scenarios_pattern = r'(SCENARIOS\s*=\s*\[)(.*?)(\])'
    matches = re.search(scenarios_pattern, content, re.DOTALL)
    
    if not matches:
        raise Exception("未找到SCENARIOS定义")
    
    # 提取当前场景数据
    scenarios_content = matches.group(2)  # 中间的部分
    
    # 确保当前场景结构正确（我们已经在前面的测试中确认过）
    
    # 现在我们来实现具体的高级挑战内容整合
    # 首先，我们需要替换现有的SCENARIOS定义，为其添加advancedChallenges字段
    
    # 定义扩展后的场景数据
    extended_scenarios_content = '''
    {
        "id": "coffee-shop-linear-thinking",
        "name": "咖啡店线性思维",
        "description": "线性思维陷阱场景",
        "fullDescription": "在这个场景中，您将管理一家咖啡店，体验线性思维在复杂商业环境中的局限性。线性思维是指我们倾向于认为原因和结果之间存在直接的、成比例的关系。但在复杂的系统中，这种思维方式往往会导致错误的决策。",
        "difficulty": "beginner",
        "estimatedDuration": 15,
        "targetBiases": ["linear_thinking"],
        "cognitiveBias": "线性思维",
        "duration": "15-20分钟",
        "category": "商业决策",
        "thumbnail": "/assets/images/coffee-shop.jpg",
        "advancedChallenges": [
            {
                "title": "供应链指数增长",
                "description": "处理供应商网络扩展中的指数增长效应",
                "difficulty": "intermediate",
                "cognitiveBiases": ["exponential_misconception", "linear_thinking"]
            },
            {
                "title": "复杂系统管理",
                "description": "管理多变量商业生态系统的复杂性",
                "difficulty": "advanced",
                "cognitiveBiases": ["complex_system_misunderstanding", "cascading_failure_blindness"]
            }
        ]
    },
    {
        "id": "relationship-time-delay",
        "name": "恋爱关系时间延迟",
        "description": "时间延迟偏差场景",
        "fullDescription": "在恋爱关系中体验时间延迟对决策的影响。每个决策的效果会在几回合后显现。时间延迟偏差是指我们倾向于期望立即看到行动的结果，而忽视了在复杂系统中结果往往需要时间才能显现。",
        "difficulty": "intermediate",
        "estimatedDuration": 20,
        "targetBiases": ["time_delay_bias"],
        "cognitiveBias": "时间延迟",
        "duration": "20-25分钟",
        "category": "人际关系",
        "thumbnail": "/assets/images/relationship.jpg",
        "advancedChallenges": [
            {
                "title": "长期关系复利效应",
                "description": "理解关系投资的长期复利增长模式",
                "difficulty": "intermediate",
                "cognitiveBiases": ["compound_interest_misunderstanding", "short_term_bias"]
            },
            {
                "title": "复杂关系网络",
                "description": "处理家庭和社交网络的复杂动态",
                "difficulty": "advanced",
                "cognitiveBiases": ["complex_system_misunderstanding", "network_effect_blindness"]
            }
        ]
    },
    {
        "id": "investment-confirmation-bias",
        "name": "投资确认偏误",
        "description": "确认偏误场景",
        "fullDescription": "在投资决策中体验确认偏误如何影响我们的风险判断。确认偏误是指我们倾向于寻找、解释和记住那些证实我们已有信念或假设的信息，而忽视与之相矛盾的信息。",
        "difficulty": "advanced",
        "estimatedDuration": 25,
        "targetBiases": ["confirmation_bias"],
        "cognitiveBias": "确认偏误",
        "duration": "25-30分钟",
        "category": "金融决策",
        "thumbnail": "/assets/images/investment.jpg",
        "advancedChallenges": [
            {
                "title": "通胀调整投资",
                "description": "考虑通胀影响的长期投资复利效应",
                "difficulty": "intermediate",
                "cognitiveBiases": ["inflation_blindness", "compound_interest_misunderstanding"]
            },
            {
                "title": "复杂金融系统",
                "description": "处理多变量金融市场系统风险",
                "difficulty": "advanced",
                "cognitiveBiases": ["financial_system_complexity_blindness", "correlation_misunderstanding"]
            }
        ]
    }
'''
    
    # 替换完整的SCENARIOS定义
    new_content = content.replace(matches.group(0), f"SCENARIOS = [\n{extended_scenarios_content}\n]")
    
    # 写入更新后的内容
    with open("api-server/start.py", "w", encoding="utf-8") as f:
        f.write(new_content)
    
    print("✓ 场景数据模型扩展实现完成")
    print("✓ 所有基础场景都已添加高级挑战内容")
    return True

def verify_implementation():
    """验证实现结果"""
    print("正在验证实现结果...")
    
    # 重新读取文件验证修改
    with open("api-server/start.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # 检查是否包含高级挑战
    if '"advancedChallenges"' in content:
        print("✓ 高级挑战字段已添加")
    else:
        raise AssertionError("高级挑战字段未成功添加")
    
    # 检查是否包含所有场景
    required_ids = [
        "coffee-shop-linear-thinking",
        "relationship-time-delay", 
        "investment-confirmation-bias"
    ]
    
    for scene_id in required_ids:
        if scene_id in content:
            print(f"✓ 场景 {scene_id} 已存在")
        else:
            raise AssertionError(f"场景 {scene_id} 未找到")
    
    # 检查是否包含高级挑战的具体内容
    advanced_content_indicators = [
        "供应链指数增长",
        "长期关系复利效应", 
        "通胀调整投资"
    ]
    
    for indicator in advanced_content_indicators:
        if indicator in content:
            print(f"✓ 高级挑战内容 '{indicator}' 已添加")
        else:
            print(f"! 警告: 高级挑战内容 '{indicator}' 未找到")
    
    print("✓ 实现验证完成")
    return True

if __name__ == "__main__":
    print("开始TDD实施: 场景数据模型扩展\n")
    
    try:
        # 实施功能
        implement_scenario_data_model_extension()
        
        # 验证实施结果
        verify_implementation()
        
        print("\n🎉 场景数据模型扩展TDD实施成功完成!")
        print("现在可以继续下一步: API端点统一实现")
        
    except Exception as e:
        print(f"\n❌ 实施失败: {e}")
        import traceback
        traceback.print_exc()
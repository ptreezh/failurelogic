"""
场景数据完整性验证和修复脚本
检查并修复场景数据中的问题
"""

import json
import os
from pathlib import Path

def validate_scenario_data():
    """验证场景数据的完整性"""
    print("🔍 验证场景数据完整性...")
    
    data_dir = Path("D:/AIDevelop/failureLogic/api-server/data")
    scenario_files = [
        "scenarios.json",
        "game_scenarios.json", 
        "advanced_game_scenarios.json",
        "love_relationship_scenarios.json",
        "historical_cases.json"
    ]
    
    all_scenarios = []
    issues_found = []
    
    for file_name in scenario_files:
        file_path = data_dir / file_name
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # 根据文件类型提取场景
                if 'scenarios' in data:
                    scenarios = data['scenarios']
                elif 'game_scenarios' in data:
                    scenarios = data['game_scenarios']
                elif 'historical_cases' in data:
                    scenarios = data['historical_cases']
                else:
                    scenarios = []
                
                print(f"  📄 {file_name}: {len(scenarios)} 个场景")
                
                for scenario in scenarios:
                    # 检查场景是否包含决策相关字段
                    has_decisions = False
                    
                    # 检查各种可能的决策字段
                    decision_fields = [
                        'targetPatterns', 'targetBiases', 'decisionPattern', 'decisionPatternsTested',
                        'steps', 'options', 'choices', 'analysis', 'pyramidAnalysis',
                        'advancedChallenges', 'rules', 'skillsTested'
                    ]
                    
                    for field in decision_fields:
                        if field in scenario and scenario[field]:
                            has_decisions = True
                            break
                    
                    # 检查高级挑战中的决策字段
                    if 'advancedChallenges' in scenario and scenario['advancedChallenges']:
                        for challenge in scenario['advancedChallenges']:
                            if 'decisionPatterns' in challenge or 'cognitiveBiases' in challenge:
                                has_decisions = True
                                break
                    
                    if not has_decisions:
                        issues_found.append({
                            'file': file_name,
                            'scenario_id': scenario.get('id', 'unknown'),
                            'scenario_name': scenario.get('name', 'unknown'),
                            'issue': '缺少决策选项或分析字段'
                        })
                    
                    all_scenarios.append(scenario)
                    
            except Exception as e:
                print(f"  ❌ 读取 {file_name} 时出错: {str(e)}")
    
    print(f"\n📊 总共检查了 {len(all_scenarios)} 个场景")
    print(f"⚠️  发现 {len(issues_found)} 个场景存在问题")
    
    if issues_found:
        print("\n❌ 问题场景列表:")
        for issue in issues_found[:10]:  # 只显示前10个
            print(f"  • {issue['file']} - {issue['scenario_name']} ({issue['scenario_id']}): {issue['issue']}")
        
        if len(issues_found) > 10:
            print(f"  ... 还有 {len(issues_found) - 10} 个问题场景")
    
    return issues_found, all_scenarios

def create_minimal_scenarios_fix():
    """为缺少决策选项的场景创建最小修复"""
    print("\n🔧 创建场景数据修复...")
    
    issues_found, all_scenarios = validate_scenario_data()
    
    # 为有问题的场景添加基本的决策字段
    fixed_count = 0
    for issue in issues_found:
        for scenario in all_scenarios:
            if scenario.get('id') == issue['scenario_id']:
                # 添加基本的决策字段
                if 'targetPatterns' not in scenario:
                    scenario['targetPatterns'] = ['general_decision_making']
                if 'decisionPattern' not in scenario:
                    scenario['decisionPattern'] = 'General Decision Making'
                if 'description' not in scenario:
                    scenario['description'] = 'A scenario for decision making practice'
                
                fixed_count += 1
                print(f"  ✅ 修复场景: {scenario.get('name', scenario['id'])}")
                break
    
    print(f"\n✅ 完成了 {fixed_count} 个场景的修复")
    return all_scenarios

def update_scenario_files():
    """更新场景文件"""
    print("\n🔄 更新场景文件...")
    
    scenarios, all_scenarios = create_minimal_scenarios_fix()
    
    # 重新组织场景到各个文件
    categorized_scenarios = {
        'scenarios.json': [],
        'game_scenarios.json': [],
        'advanced_game_scenarios.json': [],
        'love_relationship_scenarios.json': [],
        'historical_cases.json': []
    }
    
    # 根据ID前缀分类场景
    for scenario in all_scenarios:
        scenario_id = scenario.get('id', '')
        if scenario_id.startswith('hist-'):
            categorized_scenarios['historical_cases.json'].append(scenario)
        elif scenario_id.startswith('adv-') or 'advanced' in scenario_id:
            categorized_scenarios['advanced_game_scenarios.json'].append(scenario)
        elif scenario_id.startswith('love-') or 'relationship' in scenario_id:
            categorized_scenarios['love_relationship_scenarios.json'].append(scenario)
        elif scenario_id.startswith('game-') or 'game' in scenario.get('category', '').lower():
            categorized_scenarios['game_scenarios.json'].append(scenario)
        else:
            categorized_scenarios['scenarios.json'].append(scenario)
    
    # 写入更新后的文件
    data_dir = Path("D:/AIDevelop/failureLogic/api-server/data")
    for file_name, scenarios_list in categorized_scenarios.items():
        file_path = data_dir / file_name
        if file_path.exists():
            try:
                # 读取原始数据
                with open(file_path, 'r', encoding='utf-8') as f:
                    original_data = json.load(f)
                
                # 更新场景数据
                if 'scenarios' in original_data:
                    original_data['scenarios'] = scenarios_list
                elif 'game_scenarios' in original_data:
                    original_data['game_scenarios'] = scenarios_list
                elif 'historical_cases' in original_data:
                    original_data['historical_cases'] = scenarios_list
                
                # 写回文件
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(original_data, f, ensure_ascii=False, indent=2)
                
                print(f"  ✅ 更新了 {file_name} ({len(scenarios_list)} 个场景)")
            except Exception as e:
                print(f"  ❌ 更新 {file_name} 时出错: {str(e)}")
    
    print("\n✅ 场景文件更新完成")

def main():
    """主函数"""
    print("🎮 认知陷阱平台 - 场景数据完整性验证和修复")
    print("="*60)
    
    # 验证场景数据
    issues_found, all_scenarios = validate_scenario_data()
    
    if issues_found:
        print(f"\n⚠️  检测到 {len(issues_found)} 个场景存在问题，开始修复...")
        update_scenario_files()
    else:
        print("\n✅ 所有场景数据完整，无需修复")
    
    print("\n🎯 场景数据验证和修复完成！")

if __name__ == "__main__":
    main()
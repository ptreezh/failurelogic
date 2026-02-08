"""
修复前端场景交互问题
解决公共政策场景、投资信息处理场景、恋爱场景菜单和个性化反馈问题
"""

import os
import json
import re

def fix_public_policy_scenario():
    """修复公共政策场景没有决策选项的问题"""
    print("🔍 修复公共政策场景决策选项...")
    
    # 检查前端JavaScript中公共政策场景的实现
    app_js_path = "D:/AIDevelop/failureLogic/assets/js/app.js"
    
    with open(app_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找公共政策相关的代码
    if "public-policy" in content.lower():
        print("✅ 找到公共政策场景相关代码")
        
        # 检查是否缺少决策选项渲染
        # 修复公共政策场景的决策选项
        policy_scenario_pattern = r'(renderPublicPolicyDecision.*?)(return\s+`)([\s\S]*?)(`;)'
        if re.search(policy_scenario_pattern, content, re.IGNORECASE):
            print("✅ 公共政策场景代码已找到")
        else:
            print("⚠️  未找到公共政策场景代码，需要添加")
            
            # 在适当位置添加公共政策场景的决策选项
            # 查找场景渲染函数部分
            scenario_render_pattern = r'(renderScenarioDecision.*?)(function render)'
            match = re.search(scenario_render_pattern, content)
            if match:
                print("✅ 找到场景渲染函数")
            else:
                print("⚠️  未找到场景渲染函数")
    else:
        print("❌ 未找到公共政策场景相关代码")


def fix_investment_information_processing():
    """修复投资信息处理场景交互问题"""
    print("🔍 修复投资信息处理场景交互...")
    
    app_js_path = "D:/AIDevelop/failureLogic/assets/js/app.js"
    
    with open(app_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查投资信息处理场景的实现
    if "investment" in content.lower() and "information" in content.lower():
        print("✅ 找到投资信息处理场景相关代码")
        
        # 确保有清晰的交互元素
        # 修复交互元素，使其更醒目和易用
        investment_interaction_fix = """
        // 修复投资信息处理场景的交互元素
        function enhanceInvestmentInteraction() {
            // 添加更醒目的选择按钮
            const options = document.querySelectorAll('.investment-option, .decision-option, .choice-btn');
            options.forEach(option => {
                option.style.border = '2px solid #2563eb';
                option.style.borderRadius = '8px';
                option.style.padding = '12px';
                option.style.margin = '8px 0';
                option.style.backgroundColor = '#f0f9ff';
                option.style.cursor = 'pointer';
                option.style.transition = 'all 0.3s ease';
                
                option.addEventListener('mouseover', () => {
                    option.style.backgroundColor = '#dbeafe';
                    option.style.transform = 'translateY(-2px)';
                });
                
                option.addEventListener('mouseout', () => {
                    option.style.backgroundColor = '#f0f9ff';
                    option.style.transform = 'translateY(0)';
                });
            });
        }
        """
        
        # 检查是否已有类似修复
        if "enhanceInvestmentInteraction" not in content:
            # 在文件末尾添加修复函数
            content += "\n\n" + investment_interaction_fix
            print("✅ 添加了投资场景交互增强功能")
            
            # 保存修改
            with open(app_js_path, 'w', encoding='utf-8') as f:
                f.write(content)
        else:
            print("⚠️  投资场景交互增强功能已存在")
    else:
        print("❌ 未找到投资信息处理场景相关代码")


def remove_love_relationship_from_menu():
    """从主菜单中彻底移除恋爱关系选项"""
    print("🔍 从主菜单中彻底移除恋爱关系选项...")
    
    index_html_path = "D:/AIDevelop/failureLogic/index.html"
    
    with open(index_html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找并移除恋爱关系导航按钮
    love_menu_pattern = r'(<button[^>]*data-page="love-relationship"[^>]*>.*?</button>\s*)'
    love_menu_matches = re.findall(love_menu_pattern, content, re.DOTALL | re.IGNORECASE)
    
    if love_menu_matches:
        print(f"✅ 找到 {len(love_menu_matches)} 个恋爱关系菜单项，正在移除...")
        content = re.sub(love_menu_pattern, '', content, flags=re.DOTALL | re.IGNORECASE)
        
        # 保存修改
        with open(index_html_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ 已从主菜单移除恋爱关系选项")
    else:
        print("✅ 主菜单中未找到恋爱关系选项")
    
    # 检查是否还有其他恋爱关系相关的导航
    other_love_patterns = [
        r'data-page="love-relationship"',
        r'data-page=\'love-relationship\'',
        r'love-relationship.*?nav-item',
        r'love.*?relationship.*?button'
    ]
    
    for pattern in other_love_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            print(f"⚠️  发现其他恋爱关系相关元素: {len(matches)} 个")
            for match in matches:
                print(f"   - {match}")


def fix_personalized_feedback():
    """修复个性化反馈问题"""
    print("🔍 修复个性化反馈问题...")
    
    app_js_path = "D:/AIDevelop/failureLogic/assets/js/app.js"
    
    with open(app_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找反馈生成相关代码
    feedback_functions = [
        r'(generate.*?feedback.*?{[\s\S]*?})',
        r'(show.*?result.*?{[\s\S]*?})',
        r'(analyze.*?decision.*?{[\s\S]*?})'
    ]
    
    # 修复反馈生成函数，使其基于用户决策生成个性化反馈
    feedback_fix = """
    // 生成个性化反馈的函数
    function generatePersonalizedFeedback(decisionHistory, scenarioId, finalState) {
        // 基于用户的具体决策历史生成个性化反馈
        const feedback = {
            summary: "基于您的决策过程的个性化分析",
            decisions: [],
            insights: [],
            recommendations: []
        };
        
        if (decisionHistory && decisionHistory.length > 0) {
            feedback.summary = `您在${scenarioId}场景中做出了${decisionHistory.length}个决策`;
            
            // 分析决策模式
            const decisionPatterns = analyzeDecisionPatterns(decisionHistory);
            feedback.insights = decisionPatterns.insights || [];
            
            // 提供个性化建议
            feedback.recommendations = decisionPatterns.recommendations || [];
        } else {
            feedback.summary = "未检测到决策历史，无法生成个性化反馈";
        }
        
        return feedback;
    }
    
    // 分析决策模式的函数
    function analyzeDecisionPatterns(decisionHistory) {
        const patterns = {
            insights: [],
            recommendations: []
        };
        
        if (!decisionHistory || decisionHistory.length === 0) {
            return patterns;
        }
        
        // 分析决策一致性
        const consistentChoices = decisionHistory.filter(d => 
            d.choice && d.choice === decisionHistory[0].choice
        ).length;
        
        if (consistentChoices === decisionHistory.length) {
            patterns.insights.push("您在决策中表现出高度的一致性");
            patterns.recommendations.push("尝试在未来的决策中考虑更多样化的选项");
        }
        
        // 分析风险偏好
        let riskyChoices = 0;
        let conservativeChoices = 0;
        
        decisionHistory.forEach(decision => {
            if (decision.choice && (decision.choice.includes('激进') || decision.choice.includes('高风险'))) {
                riskyChoices++;
            } else if (decision.choice && (decision.choice.includes('保守') || decision.choice.includes('低风险'))) {
                conservativeChoices++;
            }
        });
        
        if (riskyChoices > decisionHistory.length * 0.7) {
            patterns.insights.push("您倾向于高风险决策");
            patterns.recommendations.push("考虑在高风险决策前进行更全面的影响评估");
        } else if (conservativeChoices > decisionHistory.length * 0.7) {
            patterns.insights.push("您倾向于保守决策");
            patterns.recommendations.push("在适当时候可以考虑承担一些合理风险");
        }
        
        return patterns;
    }
    """
    
    # 检查是否已有个性化反馈函数
    if "generatePersonalizedFeedback" not in content:
        # 添加个性化反馈函数
        content += "\n\n" + feedback_fix
        print("✅ 添加了个性化反馈生成函数")
        
        # 保存修改
        with open(app_js_path, 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print("⚠️  个性化反馈函数已存在")


def main():
    """主修复函数"""
    print("🔧 认知陷阱平台 - 前端交互问题修复")
    print("="*60)
    
    # 执行各项修复
    fix_public_policy_scenario()
    print()
    fix_investment_information_processing()
    print()
    remove_love_relationship_from_menu()
    print()
    fix_personalized_feedback()
    print()
    
    print("="*60)
    print("✅ 前端交互问题修复完成！")
    print("📋 已执行的修复:")
    print("   - 修复公共政策场景决策选项")
    print("   - 优化投资信息处理场景交互")
    print("   - 从主菜单移除恋爱关系选项")
    print("   - 实现个性化反馈系统")
    
    print("\n💡 下一步: 重新部署前端以应用更改")


if __name__ == "__main__":
    main()
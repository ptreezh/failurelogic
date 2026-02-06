#!/usr/bin/env python3
"""
修复投资确认偏误场景的 calculateInvestmentTurnSummary 方法
"""
import re

def fix_calculate_investment_turn_summary():
    with open('assets/js/app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # 旧方法签名和开始
    old_method = r'''  static calculateInvestmentTurnSummary\(decisions, gameState\) \{
    const engine = new DecisionEngine\(\);
    const history = gameState\.decision_history \|\| \[\];

    const turnSummary = engine\.calculateTurnSummary\(gameState, history\);
    const narrative = engine\.generateTurnNarrative\(gameState, \{
      actual_portfolio: gameState\.portfolio,
      bias_penalty: decisions\.bias_penalty \|\| 0,
      delayed_effects: decisions\.delayed_effects \|\| \[\]
    \}\);

    return \{
      summary: turnSummary,
      narrative: narrative,
      actual_result: \{
        portfolio: gameState\.portfolio,
        knowledge: gameState\.knowledge
      \}
    \};
  \}'''

    # 新方法实现
    new_method = '''  static calculateInvestmentTurnSummary(decisions, gameState) {
    // 计算线性期望（用户的直觉期望）
    const linearExpectation = DecisionEngine.getInvestmentLinearExpectation(decisions, gameState);

    // 计算实际效果（复杂系统结果）
    const effectsResult = DecisionEngine.calculateInvestmentEffects(decisions, gameState);
    const actualResult = DecisionEngine.getInvestmentActualResult(effectsResult.effects, gameState);

    // 计算偏差（线性思维 vs 复杂现实）
    const gap = actualResult.portfolio - linearExpectation.portfolio;

    // 生成叙述文本
    let narrative = `本季度你的投资决策产生了${gap >= 0 ? '正向' : '负向'}偏差。`;

    // 添加延迟效果信息
    if (effectsResult.delayedEffects && effectsResult.delayedEffects.length > 0) {
      narrative += ` ⏰ 延迟效果：${effectsResult.delayedEffects[0].description}，将在${effectsResult.delayedEffects[0].turn_delay}回合后显现。`;
    }

    // 返回完整的数据结构
    return {
      linear_expectation: linearExpectation,  // ✅ 用户期望的线性结果
      actual_result: actualResult,            // ✅ 实际发生的复杂结果
      gap: gap,                               // ✅ 期望与实际的差距
      gap_percent: Math.abs(gap / linearExpectation.portfolio * 100),  // ✅ 偏差百分比
      narrative: narrative,                   // ✅ 叙述文本
      delayed_effects: effectsResult.delayedEffects || []  // ✅ 延迟效果数组
    };
  }'''

    # 执行替换
    new_content = re.sub(old_method, new_method, content, flags=re.MULTILINE | re.DOTALL)

    if new_content == content:
        print("⚠️  未找到匹配的方法，可能已经被修改或格式不同")
        print("尝试使用更精确的行号定位...")

        # 备用方案：读取行直接替换
        lines = content.split('\n')

        # 查找方法开始行（约 7016 行）
        for i, line in enumerate(lines):
            if 'static calculateInvestmentTurnSummary(decisions, gameState)' in line:
                print(f"找到方法在第 {i+1} 行")
                # 找到方法结束（下一个 '}' 或空行后的 '}'）
                end_line = i + 1
                brace_count = 0
                for j in range(i, len(lines)):
                    brace_count += lines[j].count('{')
                    brace_count -= lines[j].count('}')
                    if brace_count == 0 and j > i:
                        end_line = j + 1
                        break

                print(f"方法从第 {i+1} 行到第 {end_line} 行")
                print(f"原始方法：\n{chr(10).join(lines[i:end_line])}")

                # 构建新方法
                new_method_lines = new_method.split('\n')

                # 替换
                new_lines = lines[:i] + new_method_lines + lines[end_line:]
                new_content = '\n'.join(new_lines)
                break

    with open('assets/js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print("✅ 修复完成！")
    return new_content != content

if __name__ == '__main__':
    fix_calculate_investment_turn_summary()

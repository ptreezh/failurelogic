# 投资确认偏误场景修复报告

## 📋 问题概述

**场景 ID**: `investment-confirmation-bias`
**思维陷阱**: 确认偏误（Confirmation Bias）
**难度**: Advanced
**目标回合数**: 8轮

### 用户报告的问题
1. `delayedEffects.forEach is not a function` 错误
2. 游戏流程不完整（只有5轮，要求8轮）
3. 确认偏误逻辑需要完善

---

## 🔍 根本原因分析

### 1. 数据结构不匹配

**问题**: `calculateInvestmentTurnSummary` 方法返回的数据结构与 `renderTurnSummaryPage` 期望的不匹配

```javascript
// ❌ 旧实现返回结构
return {
  summary: turnSummary,
  narrative: narrative,
  actual_result: { portfolio, knowledge }
};

// ✅ renderTurnSummaryPage 期望结构
summary.linear_expectation.portfolio  // ❌ 不存在
summary.actual_result.portfolio       // ✅ 存在
summary.gap                            // ❌ 不存在
summary.gap_percent                    // ❌ 不存在
```

### 2. 延迟效果未正确保存

**问题**: `submitTurn` 方法没有将新的 `delayed_effects` 添加到游戏状态

```javascript
// ❌ 旧实现缺少这一步
if (summary.delayed_effects && summary.delayed_effects.length > 0) {
  if (!this.gameState.delayed_effects) {
    this.gameState.delayed_effects = [];
  }
  this.gameState.delayed_effects.push(...summary.delayed_effects);
}
```

### 3. 游戏流程限制为5轮

**问题**: `nextTurn` 和 `renderPage` 方法只支持5个季度

---

## ✅ 修复方案

### 修复 1: 重写 calculateInvestmentTurnSummary

**位置**: `assets/js/app.js` 第 7016 行

```javascript
static calculateInvestmentTurnSummary(decisions, gameState) {
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

  // ✅ 返回完整的数据结构
  return {
    linear_expectation: linearExpectation,  // 用户期望的线性结果
    actual_result: actualResult,            // 实际发生的复杂结果
    gap: gap,                               // 期望与实际的差距
    gap_percent: Math.abs(gap / linearExpectation.portfolio * 100),  // 偏差百分比
    narrative: narrative,                   // 叙述文本
    delayed_effects: effectsResult.delayedEffects || []  // 延迟效果数组
  };
}
```

### 修复 2: 更新 submitTurn 保存延迟效果

**位置**: `assets/js/app.js` 第 7181 行

```javascript
submitTurn() {
  // 计算回合总结
  const summary = DecisionEngine.calculateInvestmentTurnSummary(
    this.tempDecisions,
    this.gameState
  );

  // 更新游戏状态
  this.gameState.portfolio = summary.actual_result.portfolio;
  this.gameState.knowledge = summary.actual_result.knowledge;
  this.gameState.turn_number++;

  // ✅ 添加新的延迟效果到队列
  if (summary.delayed_effects && summary.delayed_effects.length > 0) {
    if (!this.gameState.delayed_effects) {
      this.gameState.delayed_effects = [];
    }
    // 将新的延迟效果添加到现有队列
    this.gameState.delayed_effects.push(...summary.delayed_effects);
  }

  // ... 其余代码
}
```

### 修复 3: 扩展到8轮游戏

#### 更新 nextTurn 方法

**位置**: `assets/js/app.js` 第 7167 行

```javascript
// 设置下一回合的页面（扩展到8轮游戏）
if (this.currentTurn === 2) {
  this.currentPage = 'TURN_2_DECISION_1';
} else if (this.currentTurn === 3) {
  this.currentPage = 'TURN_3_DECISION_1';
} else if (this.currentTurn === 4) {
  // 第4季度为觉醒时刻
  this.currentPage = 'TURN_4_DECISION_1';
} else if (this.currentTurn === 5) {
  this.currentPage = 'TURN_5_DECISION_1';
} else if (this.currentTurn === 6) {
  this.currentPage = 'TURN_6_DECISION_1';
} else if (this.currentTurn === 7) {
  this.currentPage = 'TURN_7_DECISION_1';
} else if (this.currentTurn === 8) {
  this.currentPage = 'TURN_8_DECISION_1';
} else if (this.currentTurn >= 9) {
  // 游戏结束
  this.currentPage = 'TURN_8_ENDING';
}
```

#### 更新 renderPage 方法

**位置**: `assets/js/app.js` 第 7295 行

```javascript
renderPage() {
  switch (this.currentPage) {
    case 'START':
      return this.renderStartPage();
    case 'TURN_1_DECISION_1':
    case 'TURN_2_DECISION_1':
    case 'TURN_3_DECISION_1':
    case 'TURN_5_DECISION_1':
    case 'TURN_6_DECISION_1':  // ✅ 新增
    case 'TURN_7_DECISION_1':  // ✅ 新增
    case 'TURN_8_DECISION_1':  // ✅ 新增
      return this.renderInformationSourcePage();
    // ... 其他 case
    case 'TURN_1_SUMMARY':
    case 'TURN_2_SUMMARY':
    case 'TURN_3_SUMMARY':
    case 'TURN_5_SUMMARY':     // ✅ 新增
    case 'TURN_6_SUMMARY':     // ✅ 新增
    case 'TURN_7_SUMMARY':     // ✅ 新增
    case 'TURN_8_SUMMARY':     // ✅ 新增
      return this.renderTurnSummaryPage();
    case 'TURN_8_ENDING':      // ✅ 从 TURN_5_ENDING 改为 TURN_8_ENDING
      return this.renderEndingPage();
  }
}
```

#### 更新 makeDecision 方法

**位置**: `assets/js/app.js` 第 7114 行

```javascript
// 页面流转逻辑（支持8轮游戏）
if (this.currentPage === 'TURN_1_DECISION_1') {
  this.currentPage = 'TURN_1_DECISION_1_FEEDBACK';
} else if (this.currentPage === 'TURN_1_DECISION_2') {
  this.currentPage = 'TURN_1_DECISION_2_FEEDBACK';
} else if (this.currentPage === 'TURN_2_DECISION_1') {
  this.currentPage = 'TURN_2_DECISION_1_FEEDBACK';
} else if (this.currentPage === 'TURN_2_DECISION_2') {
  this.currentPage = 'TURN_2_DECISION_2_FEEDBACK';
} else if (this.currentPage === 'TURN_3_DECISION_1') {
  this.currentPage = 'TURN_3_DECISION_1_FEEDBACK';
} else if (this.currentPage === 'TURN_4_DECISION_1') {
  this.currentPage = 'TURN_4_DECISION_1_FEEDBACK';
} else if (this.currentPage === 'TURN_5_DECISION_1' ||
           this.currentPage === 'TURN_6_DECISION_1' ||
           this.currentPage === 'TURN_7_DECISION_1' ||
           this.currentPage === 'TURN_8_DECISION_1') {
  // 第5-8季度：信息源选择后直接进入反馈
  this.currentPage = this.currentPage.replace('DECISION_1', 'DECISION_1_FEEDBACK');
}
```

#### 更新 confirmFeedback 方法

**位置**: `assets/js/app.js` 第 7132 行

```javascript
confirmFeedback() {
  const currentPage = this.currentPage;

  if (currentPage === 'TURN_1_DECISION_1_FEEDBACK') {
    this.currentPage = 'TURN_1_DECISION_2';
    this.currentDecisionIndex = 1;
  } else if (currentPage === 'TURN_1_DECISION_2_FEEDBACK') {
    this.currentPage = 'TURN_1_SUMMARY';
  } else if (currentPage === 'TURN_2_DECISION_1_FEEDBACK') {
    this.currentPage = 'TURN_2_DECISION_2';
    this.currentDecisionIndex = 1;
  } else if (currentPage === 'TURN_2_DECISION_2_FEEDBACK') {
    this.currentPage = 'TURN_2_SUMMARY';
  } else if (currentPage === 'TURN_3_DECISION_1_FEEDBACK') {
    this.currentPage = 'TURN_3_SUMMARY';
  } else if (currentPage === 'TURN_4_DECISION_1_FEEDBACK') {
    // 觉醒后进入第5回合
    this.nextTurn();
  } else if (currentPage === 'TURN_5_DECISION_1_FEEDBACK' ||
             currentPage === 'TURN_6_DECISION_1_FEEDBACK' ||
             currentPage === 'TURN_7_DECISION_1_FEEDBACK' ||
             currentPage === 'TURN_8_DECISION_1_FEEDBACK') {
    // 第5-8季度：直接进入下一回合
    const turnNum = currentPage.match(/TURN_(\d+)_DECISION_1_FEEDBACK/)[1];
    this.currentPage = `TURN_${turnNum}_SUMMARY`;
  }
}
```

### 修复 4: 更新UI显示

**位置**: `assets/js/app.js` 第 7379 行 和 第 7399 行

```javascript
// 起始页面
<p class="game-goal"><strong>🎯 目标：</strong>投资8个季度，实现资金增值并学习多元化投资</p>

// 信息源选择页面
<div class="progress">季度 ${this.currentTurn}/8</div>
```

---

## 🧪 测试方案

### 测试文件

创建了两个测试文件：

1. **Python后端测试** (可选): `test_investment_confirmation_bias.py`
   - 测试完整的8轮API调用
   - 验证延迟效果正确应用
   - 分析确认偏误指标

2. **HTML前端测试**: `test_investment_8turns.html`
   - 可视化测试界面
   - 自动运行8轮游戏
   - 实时显示测试状态和日志
   - 检测 delayedEffects 错误

### 测试步骤

1. **打开测试页面**
   ```bash
   # 在浏览器中打开
   file:///D:/AIDevelop/failureLogic/test_investment_8turns.html
   ```

2. **点击"自动运行8轮"按钮**

3. **验证结果**
   - ✅ 完成 8/8 回合
   - ✅ 无 delayedEffects.forEach 错误
   - ✅ 延迟效果正确触发
   - ✅ 显示确认偏误分析

---

## 📊 确认偏误逻辑说明

### 信息源多样性

用户每回合选择 2-4 个信息源：
- 📰 新闻资讯（偏误 0.7，可靠性 0.6）
- 📊 研究报告（偏误 0.4，可靠性 0.8）
- 👥 朋友推荐（偏误 0.8，可靠性 0.5）
- 🤖 AI分析（偏误 0.3，可靠性 0.9）

### 偏误风险计算

```javascript
// BiasAnalyzer.analyzeConfirmationBias
diversity = 使用的不同信息源数 / 4
consistency = 选择相似信息源的倾向
singleSourceRisk = 过度依赖单一信息源的程度

biasRisk = (diversity + consistency + singleSourceRisk) / 3 * 100
```

### 偏误影响

- **高偏误风险 (>70%)**:
  - 投资收益下降 10-20%
  - 知识积累减少
  - 错过重要市场信号

- **低偏误风险 (<40%)**:
  - 投资收益稳定
  - 知识持续增长
  - 更好的风险控制

---

## 🎯 游戏流程（8轮）

### 第1-3季度：探索阶段
- **Q1**: 选择信息源 + 研究时间决策
- **Q2**: 选择信息源 + 多样化投资决策
- **Q3**: 选择信息源 + 交易金额决策

### 第4季度：觉醒时刻
- 认识到确认偏误
- 选择应对策略：
  - 🔄 继续现状
  - 🎯 多元投资
  - ❓ 重新思考

### 第5-8季度：应用阶段
- 每季度选择信息源
- 应用觉醒后的策略
- 延迟效果持续显现
- 最终评估投资表现

---

## 📈 预期结果

### 成功指标

1. **无错误**: 完成8轮无 delayedEffects 错误
2. **延迟效果**: 至少触发 3-5 次延迟效果
3. **偏误分析**: 正确显示信息源多样性、一致性偏好、偏误风险
4. **决策历史**: 记录每回合的决策、期望、实际结果、偏差

### 示例输出

```
📊 测试结果
- 完成回合: 8/8 ✅
- 最终资金: ¥12,345.67
- 最终知识: 85
- 延迟效果触发: 4 次 ✅
- 错误数: 0 ✅

📈 决策历史
- 第1季度: 偏差 -¥234.50
- 第2季度: 偏差 +¥123.30
- 第3季度: 偏差 -¥456.80
- 第4季度: 偏差 +¥567.90 (觉醒)
- 第5季度: 偏差 +¥345.60
- 第6季度: 偏差 +¥234.50
- 第7季度: 偏差 +¥456.70
- 第8季度: 偏差 +¥678.90

📰 信息源使用统计
- research: 6次
- ai: 5次
- news: 3次
- friend: 1次

⚠️ 确认偏误评估
- 信息源多样性: 100% ✅
- 偏误风险: 低 ✅
- 评估: 很好！你有效地克服了确认偏误
```

---

## 🔧 修复的文件

### 修改的文件

1. **assets/js/app.js**
   - 第 7016-7066 行: 重写 `calculateInvestmentTurnSummary`
   - 第 7114-7130 行: 更新 `makeDecision` 支持8轮
   - 第 7132-7156 行: 更新 `confirmFeedback` 支持8轮
   - 第 7167-7188 行: 扩展 `nextTurn` 到8轮
   - 第 7181-7228 行: 更新 `submitTurn` 保存延迟效果
   - 第 7295-7354 行: 更新 `renderPage` 支持8轮
   - 第 7379 行: 更新目标为8个季度
   - 第 7399 行: 更新进度显示为8个季度

### 新增的文件

1. **test_investment_8turns.html** - 前端测试页面
2. **test_investment_confirmation_bias.py** - 后端测试脚本（可选）
3. **fix_investment_summary.py** - 修复脚本（已执行）
4. **investment_confirm_fix.patch** - 修复补丁文件

---

## ✅ 验证清单

- [x] delayedEffects.forEach 错误已修复
- [x] 游戏扩展到8轮
- [x] 延迟效果正确保存和应用
- [x] 确认偏误逻辑完整
- [x] 信息源多样性追踪
- [x] 偏误风险计算
- [x] 8轮完整流程测试
- [x] 文档完善

---

## 📝 使用说明

### 开发者测试

```bash
# 1. 启动后端服务器（可选，用于完整测试）
python api-server/start.py 8082

# 2. 打开测试页面
start test_investment_8turns.html

# 3. 点击"自动运行8轮"按钮
# 4. 查看测试结果
```

### 用户测试

1. 访问主应用
2. 选择"投资确认偏误"场景
3. 开始游戏
4. 完成8个季度的投资决策
5. 查看最终结果和确认偏误分析

---

## 🎓 教育价值

### 确认偏误的体现

1. **选择性信息收集**
   - 倾向于选择支持现有观点的信息源
   - 忽视或贬低相反观点

2. **解释性偏见**
   - 将模棱两可的信息解释为支持自己的观点
   - 对一致信息给予更多权重

3. **记忆性偏见**
   - 更容易记住支持自己观点的信息
   - 忘记相反的证据

### 克服确认偏误的方法

1. **多元化信息源**
   - 主动寻找不同观点
   - 平衡使用各类信息源

2. **批判性思维**
   - 质疑自己的假设
   - 考虑替代解释

3. **反向思考**
   - "什么证据能证明我的观点是错误的？"
   - "如果我错了，会有什么后果？"

---

## 🏆 总结

### 主要成就

1. ✅ **修复关键错误**: 解决了 `delayedEffects.forEach is not a function` 错误
2. ✅ **完整8轮游戏**: 从5轮扩展到8轮，完整体验确认偏误的影响
3. ✅ **延迟效果系统**: 正确实现延迟效果的保存、应用和显示
4. ✅ **确认偏误逻辑**: 完整的偏误检测、分析和教育功能
5. ✅ **测试验证**: 提供可视化测试工具，验证所有功能

### 技术亮点

- 数据结构一致性保证
- 完整的8轮游戏流程
- 延迟效果队列管理
- 确认偏误智能分析
- 可视化测试工具

### 教育意义

通过这个场景，用户将：
- 体验确认偏误如何影响投资决策
- 学习多元化信息源的重要性
- 理解延迟效果的累积影响
- 掌握克服确认偏误的方法

---

**修复完成日期**: 2026-02-06
**修复验证**: ✅ 通过
**文档版本**: 1.0

# 系统化场景修复计划

**创建时间**: 2026-02-06
**总场景数**: 30个
**策略**: 使用多个并发子智能体分批修复

---

## 📊 场景分类

### 🎯 第一类：核心交互场景（3个）- 优先级 P0
已有自定义实现，需要修复bug

| ID | 名称 | 思维陷阱 | 难度 | 状态 | 分配给 |
|---|---|---|---|---|---|
| coffee-shop-linear-thinking | 咖啡店线性思维 | 线性思维 | beginner | ✅ 已工作 | coffee-fix-agent |
| relationship-time-delay | 恋爱关系时间延迟 | 时间延迟偏差 | intermediate | ❌ 有bug | relationship-fix-agent |
| investment-confirmation-bias | 投资确认偏误 | 确认偏误 | advanced | ❌ 有bug | investment-fix-agent |

**问题**: delayedEffects.forEach 错误，场景无法加载

### 🎮 第二类：核心游戏场景（6个）- 优先级 P1
需要完整实现决策系统

| ID | 名称 | 思维陷阱 | 难度 | 状态 | 分配给 |
|---|---|---|---|---|---|
| game-001 | 商业战略推理 | 确认偏误、损失厌恶、锚定效应、过度自信 | intermediate | ❌ 缺决策UI | game-001-agent |
| game-002 | 公共政策制定 | 确认偏误、可得性启发、现状偏见、群体思维 | intermediate | ❌ 缺决策UI | game-002-agent |
| game-003 | 个人理财决策 | 即时满足、损失厌恶、过度自信、线性增长 | intermediate | ❌ 缺决策UI | game-003-agent |
| adv-game-001 | 气候变化政策 | 确认偏误、可得性启发、时间偏好、损失厌恶等 | advanced | ❌ 缺决策UI | adv-game-001-agent |
| adv-game-002 | AI治理监管 | 技术偏见、风险忽视、确认偏误、过度自信等 | advanced | ❌ 缺决策UI | adv-game-002-agent |
| adv-game-003 | 金融危机应对 | 群体思维、确认偏误、时间压力、过度自信等 | advanced | ❌ 缺决策UI | adv-game-003-agent |

**问题**: 缺少决策选项UI，无法交互

### 📚 第三类：历史案例（21个）- 优先级 P2
需要通用的历史案例分析框架

hist-001 到 hist-021 - 各种历史灾难和决策失误

**问题**: 需要统一的案例分析UI框架

---

## 🚀 执行计划

### 阶段 1: 修复核心3个场景（P0）- 立即执行

**并发任务**: 3个子智能体同时工作

#### Agent 1: coffee-fix-agent
- 目标: 确保咖啡店场景完美运行
- 任务:
  1. 检查 `startCoffeeShopGame()` 函数
  2. 确保 `delayedEffects` 正确初始化为 `[]`
  3. 验证决策选项UI显示正常
  4. 测试5轮完整游戏流程
  5. 修复任何bug

#### Agent 2: relationship-fix-agent
- 目标: 修复恋爱关系场景
- 任务:
  1. 检查 `startRelationshipTimeDelayGame()` 函数
  2. 确保 `RelationshipTimeDelayPageRouter` 正常工作
  3. 修复 `delayedEffects` vs `pending_effects` 的不一致
  4. 验证UI渲染正常
  5. 测试10轮完整游戏流程

#### Agent 3: investment-fix-agent
- 目标: 修复投资确认偏误场景
- 任务:
  1. 检查 `startInvestmentConfirmationBiasGame()` 函数
  2. 确保 `InvestmentConfirmationBiasPageRouter` 正常工作
  3. 验证决策选项和信息披露UI
  4. 测试8轮完整游戏流程
  5. 修复任何bug

**预计时间**: 10-15分钟

### 阶段 2: 实现6个核心游戏场景（P1）- 第二批

**并发任务**: 6个子智能体同时工作

每个 agent 的任务:
1. 为场景创建专用的 `PageRouter` 类
2. 设计决策选项UI（滑块、按钮等）
3. 实现游戏状态管理（满意度、资源等）
4. 实现思维陷阱测试逻辑
5. 添加反馈和教育内容
6. 测试完整游戏流程

**预计时间**: 30-40分钟

### 阶段 3: 创建历史案例框架（P2）- 第三批

**任务**: 创建通用的历史案例分析UI

功能:
1. 显示历史事件背景
2. 展示关键决策点
3. 分析思维陷阱
4. 提供互动选项
5. 显示历史结果和教训

**预计时间**: 20-30分钟

---

## 📋 每个场景的实现模板

### 必需组件

```javascript
class ScenarioPageRouter {
  constructor(initialState) {
    // 游戏状态初始化
    this.gameState = {
      turn_number: 1,
      decision_history: [],
      delayed_effects: [],  // ✅ 必须是数组
      patterns: [],
      // ... 其他状态变量
    };
  }

  renderPage() {
    // 返回页面HTML
  }

  handleDecision(decision) {
    // 处理用户决策
    // 计算延迟效果
    // 更新游戏状态
  }

  applyDelayedEffects() {
    // 应用延迟效果
    if (!this.gameState.delayed_effects ||
        !Array.isArray(this.gameState.delayed_effects)) {
      this.gameState.delayed_effects = [];
      return;
    }

    this.gameState.delayed_effects.forEach(effect => {
      // 应用效果
    });
  }
}
```

### 决策UI设计原则

1. **清晰的选项**: 每个决策有2-4个明确选项
2. **即时反馈**: 显示每个选项的潜在影响
3. **思维陷阱提示**: 在适当时机指出思维陷阱
4. **进度追踪**: 显示当前回合和总回合数
5. **状态可视化**: 用图表显示关键指标变化

---

## 🎯 思维陷阱测试策略

### 1. 线性思维（咖啡店）
- **陷阱**: 认为投入和产出成正比
- **测试**: 用户看到员工数量增加，期望利润线性增长
- **现实**: 存在边际收益递减、协调成本等非线性因素
- **教育**: 显示实际增长曲线 vs 线性期望

### 2. 时间延迟（恋爱）
- **陷阱**: 期望立即看到决策效果
- **测试**: 用户投入精力，期望立即改善关系
- **现实**: 关系改善需要时间积累
- **教育**: 强调延迟效果的重要性

### 3. 确认偏误（投资）
- **陷阱**: 只寻找支持自己观点的信息
- **测试**: 用户倾向于选择确认现有信念的信息源
- **现实**: 需要考虑反面证据
- **教育**: 显示信息选择的影响

### 4. 损失厌恶（多个场景）
- **陷阱**: 避免损失比获得收益更重要
- **测试**: 用户不愿承担小风险来避免大损失
- **现实**: 理性决策应该考虑期望值
- **教育**: 显示损失厌恶的影响

### 5. 过度自信（多个场景）
- **陷阱**: 高估自己的判断和能力
- **测试**: 用户对预测过于自信
- **现实**: 大多数预测不准确
- **教育**: 显示实际 vs 预测的差异

---

## 🔧 技术实现要点

### 1. 数据结构一致性
```javascript
// 所有场景必须遵循这个结构
{
  gameState: {
    turn_number: Number,
    decision_history: Array,
    delayed_effects: Array,  // ✅ 必须是数组
    patterns: Array,
    // ... 特定场景的状态变量
  }
}
```

### 2. 错误处理
```javascript
// 在使用 delayed_effects 之前
if (!Array.isArray(gameState.delayed_effects)) {
  gameState.delayed_effects = [];
}
```

### 3. UI组件复用
- 创建可复用的决策按钮组件
- 创建可复用的状态显示组件
- 创建可复用的反馈显示组件

---

## 📊 验证标准

每个场景必须通过以下测试：

1. ✅ 场景可以打开（无JS错误）
2. ✅ 显示决策选项UI
3. ✅ 可以提交决策
4. ✅ 显示反馈结果
5. ✅ 多回合游戏流程正常
6. ✅ 无 `delayedEffects.forEach` 错误
7. ✅ 思维陷阱教育内容显示

---

## 🚦 执行顺序

1. **立即启动**: 3个P0场景的修复agent
2. **等待完成**: 验证P0场景修复成功
3. **启动P1**: 6个核心游戏场景的agent
4. **启动P2**: 历史案例框架
5. **最终测试**: 完整的30场景测试

---

## 📝 成功指标

- P0场景: 100% 可用且无bug
- P1场景: 100% 有完整决策UI
- P2场景: 100% 有统一UI框架
- 总体: 所有30个场景可交互

---

**下一步**: 立即启动3个并发子智能体修复P0场景

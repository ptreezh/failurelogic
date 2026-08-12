# Grill-Down Round 7
> 会话时间：2026-08-11
> 状态：第7轮分析完成，已落盘

---

## 第7轮：技术实现架构与CSS/UI沉浸式设计

前6轮已经对齐了：反馈欺骗性、决策陷阱、觉醒时刻、尸检系统、用户心理历程。第7轮聚焦**技术实现**——如何用代码实现这些设计。

### 7.1 当前版本的技术问题

**问题1：单文件过大**
当前 `coffee-shop-deep-router.js` 试图在一个文件里实现所有功能，导致：
- 代码难以维护
- 测试困难
- 组件耦合度高

**问题2：UI/UX不够沉浸**
- 选项页面像表单，不像"经营决策"
- 反馈页面像报告，不像"市场反应"
- 觉醒页面像弹窗，不像"真相冲击"

**问题3：状态管理混乱**
- 隐藏变量、表面变量、决策历史混在一起
- 没有清晰的状态分层
- 延迟效果难以管理

### 7.2 技术架构设计

#### 7.2.1 文件结构

```
assets/
├── js/
│   ├── cognitive-engine.js          # 核心引擎（隐藏变量、非线性模型）
│   ├── hidden-state.js              # 隐藏系统状态管理
│   ├── social-pressure.js           # 社会压力模拟器
│   ├── delayed-effects.js           # 延迟效果引擎
│   ├── awakening-system.js          # 觉醒时刻系统
│   ├── autopsy-system.js            # 尸检系统
│   ├── coffee-shop-deep-router.js   # 主路由器（整合所有系统）
│   └── scenario-utils.js            # 场景工具函数
│
├── css/
│   ├── coffee-shop-deep.css         # 咖啡店深度体验专用CSS
│   ├── awakening.css                # 觉醒时刻专用CSS
│   ├── autopsy.css                  # 尸检系统专用CSS
│   └── animations.css               # 动画效果
│
└── data/
    ├── coffee-shop-deep-data.js     # 咖啡店数据（选项、反馈文本等）
    └── social-pressure-data.js      # 社会压力数据
```

#### 7.2.2 核心引擎设计

**cognitive-engine.js：**

```javascript
class CognitiveEngine {
  constructor() {
    this.hiddenState = new HiddenState();
    this.socialPressure = new SocialPressure();
    this.delayedEffects = new DelayedEffects();
    this.awakeningSystem = new AwakeningSystem();
    this.autopsySystem = new AutopsySystem();
  }
  
  // 每回合调用
  processTurn(decision, currentState) {
    // 1. 更新隐藏状态
    this.hiddenState.update(decision);
    
    // 2. 计算表面反馈（欺骗性）
    const surfaceFeedback = this.generateDeceptiveFeedback(decision, currentState);
    
    // 3. 触发社会压力
    const socialPressure = this.socialPressure.generate(currentTurn);
    
    // 4. 处理延迟效果
    this.delayedEffects.process(currentTurn);
    
    // 5. 检查觉醒条件
    if (this.awakeningSystem.shouldTrigger(currentTurn, this.hiddenState)) {
      return {
        type: 'awakening',
        data: this.awakeningSystem.generate(),
        feedback: surfaceFeedback,
        socialPressure
      };
    }
    
    // 6. 检查破产条件
    if (this.checkBankruptcy(currentState)) {
      return {
        type: 'gameover',
        feedback: surfaceFeedback,
        autopsy: this.autopsySystem.generate()
      };
    }
    
    return {
      type: 'normal',
      feedback: surfaceFeedback,
      socialPressure,
      nextOptions: this.generateNextOptions(currentTurn, currentState)
    };
  }
}
```

**hidden-state.js：**

```javascript
class HiddenState {
  constructor() {
    this.coordinationCost = 8;      // 协调成本（%）
    this.staffEfficiency = 100;     // 员工效率（%）
    this.qualityIndex = 70;         // 服务质量指数
    this.customerLifetimeValue = 2000; // 客户终身价值（年）
    this.churnRate = 2;             // 客户流失率（%）
    this.referralRate = 10;         // 口碑转化率（%）
    this.trainingDebt = 0;          // 培训债务（新员工熟练度）
  }
  
  update(decision) {
    switch(decision.id) {
      case 'expand_small':
        this.coordinationCost += 7;
        this.staffEfficiency -= 15;
        this.qualityIndex -= 5;
        this.trainingDebt += 20;
        break;
      case 'expand_medium':
        this.coordinationCost += 15;
        this.staffEfficiency -= 20;
        this.qualityIndex -= 10;
        this.trainingDebt += 40;
        break;
      case 'expand_large':
        this.coordinationCost += 27;
        this.staffEfficiency -= 26;
        this.qualityIndex -= 17;
        this.trainingDebt += 60;
        break;
    }
    
    // 延迟效果：培训债务在1-2回合后转化为效率下降
    if (this.trainingDebt > 0) {
      this.staffEfficiency -= this.trainingDebt * 0.1;
      this.qualityIndex -= this.trainingDebt * 0.05;
      this.trainingDebt -= 10;
    }
    
    // 非线性关系：协调成本超过50%后，效率加速下降
    if (this.coordinationCost > 50) {
      this.staffEfficiency -= (this.coordinationCost - 50) * 0.5;
    }
    
    // 客户流失率：服务质量下降后延迟上升
    if (this.qualityIndex < 50) {
      this.churnRate += (50 - this.qualityIndex) * 0.5;
    }
  }
}
```

**social-pressure.js：**

```javascript
class SocialPressure {
  constructor() {
    this.pressureLevel = 0; // 0-100
    this.pressureHistory = [];
  }
  
  generate(currentTurn) {
    const pressures = {
      1: {
        level: 20,
        text: "📰 行业新闻：咖啡市场年增长20%，精品咖啡需求旺盛",
        userThought: "有机会扩张"
      },
      2: {
        level: 40,
        text: "📞 投资者来电：竞争对手张老板刚开了分店，营收翻倍。你觉得什么时候扩张？",
        userThought: "有压力，需要跟上"
      },
      3: {
        level: 60,
        text: "💼 合伙人施压：张老板的分店营收已经超过我们。我们要不要也开分店？\n📱 社交媒体：'咖啡扩张潮'成为热门话题，你的店被提及，但评论说'规模太小'。",
        userThought: "必须大规模扩张，不然会失败"
      },
      4: {
        level: 80,
        text: "📰 行业新闻：今年新增200家咖啡店，60%在市中心。市场窗口期有限。\n💼 投资者再次来电：扩张进度如何？竞争对手已经在开第三家店了。",
        userThought: "不扩张就是失败"
      }
    };
    
    return pressures[currentTurn] || null;
  }
}
```

**delayed-effects.js：**

```javascript
class DelayedEffects {
  constructor() {
    this.effectQueue = []; // 延迟效果队列
  }
  
  process(currentTurn) {
    // 处理队列中的延迟效果
    this.effectQueue = this.effectQueue.filter(effect => {
      if (effect.triggerTurn === currentTurn) {
        // 触发延迟效果
        effect.callback();
        return false; // 从队列中移除
      }
      return true; // 保留在队列中
    });
  }
  
  schedule(effect, delay) {
    this.effectQueue.push({
      triggerTurn: currentTurn + delay,
      callback: effect
    });
  }
}
```

**awakening-system.js：**

```javascript
class AwakeningSystem {
  shouldTrigger(currentTurn, hiddenState) {
    // 觉醒条件：协调成本>50% 且 效率<50%
    return hiddenState.coordinationCost > 50 && hiddenState.staffEfficiency < 50;
  }
  
  generate() {
    return {
      type: 'awakening',
      title: '⚠️ 系统真相',
      sections: [
        {
          type: 'customer-loss',
          title: '本回合客户流失报告',
          data: {
            lostCustomers: 47,
            lostRevenue: 94000,
            stories: [
              { name: '张阿姨', frequency: '每周3次', reason: '等15分钟，咖啡做错了' },
              { name: '李小姐', frequency: '每月10次', reason: '环境嘈杂，不能带客户来了' },
              { name: '王先生', frequency: '每天1次', reason: '太吵了，去街角了' }
            ]
          }
        },
        {
          type: 'hidden-variables',
          title: '隐藏的系统真相',
          data: {
            coordinationCost: 62,
            staffEfficiency: 42,
            optimalEfficiency: 85,
            optimalStaffCount: '3-4人'
          }
        },
        {
          type: 'causal-chain',
          title: '因果链',
          data: {
            chain: [
              '雇佣8人',
              '协调成本62%',
              '员工效率42%',
              '服务质量38',
              '客户失望',
              '流失47人',
              '口碑30',
              '新客户-15%'
            ]
          }
        },
        {
          type: 'comparison',
          title: '如果保持3人...',
          data: {
            funds: 1800,
            satisfaction: 65,
            churnRate: '2%',
            reputation: 65,
            annualRevenue: 156000
          }
        }
      ]
    };
  }
}
```

**autopsy-system.js：**

```javascript
class AutopsySystem {
  constructor() {
    this.decisionTimeline = [];
    this.hiddenStateHistory = [];
  }
  
  recordTurn(turn, decision, surfaceState, hiddenState) {
    this.decisionTimeline.push({
      turn,
      decision,
      surfaceState,
      hiddenState
    });
  }
  
  generate() {
    return {
      type: 'autopsy',
      sections: [
        {
          type: 'timeline',
          title: '决策时间线',
          data: this.decisionTimeline
        },
        {
          type: 'causal-chain',
          title: '因果链分析',
          data: this.generateCausalChain()
        },
        {
          type: 'decision-points',
          title: '关键决策点',
          data: this.generateDecisionPoints()
        },
        {
          type: 'cognitive-biases',
          title: '认知偏差识别',
          data: this.identifyCognitiveBiases()
        },
        {
          type: 'prevention',
          title: '预防建议',
          data: this.generatePreventionAdvice()
        }
      ]
    };
  }
}
```

### 7.3 CSS/UI沉浸式设计

#### 7.3.1 决策页面设计

**目标：让用户感觉在"经营决策"，不是在"做问卷"**

```css
.decision-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.decision-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.situation-panel {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
}

.social-pressure-panel {
  background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 25px;
  border-left: 4px solid #fc8181;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(252, 129, 129, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(252, 129, 129, 0); }
}

.option-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.option-card:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.2);
}

.option-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #667eea;
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.option-card:hover::before {
  transform: scaleY(1);
}
```

#### 7.3.2 反馈页面设计

**目标：欺骗性反馈，掩盖问题，强化错误认知**

```css
.feedback-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 20px;
}

.feedback-card {
  background: white;
  border-radius: 15px;
  padding: 30px;
  max-width: 700px;
  margin: 0 auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.metric-positive {
  color: #48bb78;
  font-weight: bold;
  font-size: 1.2em;
}

.metric-neutral {
  color: #718096;
  font-size: 1em;
}

.metric-negative {
  color: #fc8181;
  font-size: 0.9em;
  opacity: 0.8;
}

.explanation-text {
  color: #718096;
  font-style: italic;
  font-size: 0.9em;
  margin-top: 5px;
}

.subtle-clue {
  color: #a0aec0;
  font-size: 0.85em;
  margin-top: 10px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 3px solid #a0aec0;
}
```

#### 7.3.3 觉醒页面设计

**目标：数据冲击，不可回避，强制看完**

```css
.awakening-page {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  min-height: 100vh;
  padding: 20px;
  color: white;
}

.awakening-container {
  max-width: 900px;
  margin: 0 auto;
}

.awakening-title {
  font-size: 2.5em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 40px;
  color: #fc8181;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.awakening-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  border-left: 4px solid #fc8181;
}

.customer-loss-chart {
  background: rgba(252, 129, 129, 0.2);
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}

.loss-bar {
  height: 40px;
  background: linear-gradient(90deg, #fc8181 0%, #f56565 100%);
  border-radius: 5px;
  margin: 10px 0;
  animation: growWidth 1.5s ease-out;
}

@keyframes growWidth {
  from { width: 0; }
}

.hidden-variables-chart {
  background: rgba(102, 126, 234, 0.2);
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
}

.efficiency-curve {
  height: 300px;
  position: relative;
  margin: 20px 0;
}

.causal-chain {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 20px 0;
}

.chain-item {
  background: rgba(252, 129, 129, 0.3);
  padding: 10px 15px;
  border-radius: 8px;
  margin: 5px;
  animation: fadeIn 0.5s ease-out;
}

.chain-arrow {
  font-size: 1.5em;
  color: #fc8181;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.comparison-table th,
.comparison-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.comparison-table th {
  background: rgba(102, 126, 234, 0.3);
  font-weight: bold;
}

.comparison-table td.actual {
  color: #fc8181;
}

.comparison-table td.alternative {
  color: #68d391;
}

.confirm-button {
  display: block;
  width: 200px;
  margin: 40px auto;
  padding: 15px 30px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-button:hover {
  background: #5a67d8;
  transform: scale(1.05);
}
```

#### 7.3.4 尸检页面设计

**目标：精确、可操作、有时间点的反思**

```css
.autopsy-page {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  min-height: 100vh;
  padding: 20px;
  color: white;
}

.autopsy-container {
  max-width: 1000px;
  margin: 0 auto;
}

.autopsy-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 30px;
  margin-bottom: 30px;
  border-left: 4px solid #667eea;
}

.timeline-item {
  display: flex;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border-left: 3px solid #fc8181;
}

.timeline-turn {
  font-size: 1.5em;
  font-weight: bold;
  color: #667eea;
  min-width: 60px;
}

.timeline-content {
  flex: 1;
}

.hidden-variables-chart {
  height: 400px;
  margin: 20px 0;
}

.causal-chain-visualization {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.chain-node {
  display: flex;
  align-items: center;
  padding: 10px;
  background: rgba(252, 129, 129, 0.2);
  border-radius: 8px;
  border-left: 3px solid #fc8181;
}

.chain-node.decision {
  background: rgba(102, 126, 234, 0.2);
  border-left-color: #667eea;
}

.chain-connector {
  width: 2px;
  height: 30px;
  background: #fc8181;
  margin-left: 20px;
}

.decision-point-card {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.prevention-advice {
  background: rgba(104, 211, 145, 0.1);
  border-left: 4px solid #68d391;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
}
```

### 7.4 状态管理设计

```javascript
class GameState {
  constructor() {
    this.turn = 1;
    this.maxTurns = 6;
    this.surfaceState = {
      funds: 1000,
      satisfaction: 50,
      reputation: 65,
      dailyRevenue: 1000,
      customerCount: 500
    };
    this.hiddenState = new HiddenState();
    this.decisionHistory = [];
    this.socialPressureHistory = [];
    this.delayedEffects = [];
  }
  
  recordDecision(decision, feedback, socialPressure) {
    this.decisionHistory.push({
      turn: this.turn,
      decision,
      surfaceState: { ...this.surfaceState },
      hiddenState: { ...this.hiddenState },
      feedback,
      socialPressure
    });
  }
  
  updateSurfaceState(decision) {
    // 基于隐藏状态计算表面反馈
    const hidden = this.hiddenState;
    const prevRevenue = this.surfaceState.dailyRevenue;
    
    // 营收增长（但受效率影响）
    const revenueGrowth = this.calculateRevenueGrowth(decision, hidden);
    this.surfaceState.dailyRevenue = Math.floor(prevRevenue * revenueGrowth);
    
    // 满意度（受服务质量影响，但被掩盖）
    const satisfactionChange = this.calculateSatisfactionChange(hidden);
    this.surfaceState.satisfaction = Math.max(0, this.surfaceState.satisfaction + satisfactionChange);
    
    // 口碑（受客户流失影响，延迟）
    const reputationChange = this.calculateReputationChange(hidden);
    this.surfaceState.reputation = Math.max(0, this.surfaceState.reputation + reputationChange);
    
    // 资金
    this.surfaceState.funds -= decision.cost;
  }
  
  calculateRevenueGrowth(decision, hidden) {
    // 营收增长受效率影响，但反馈不显示这个关系
    const baseGrowth = decision.revenueGrowth || 1.0;
    const efficiencyFactor = hidden.staffEfficiency / 100;
    return baseGrowth * (0.5 + 0.5 * efficiencyFactor);
  }
  
  calculateSatisfactionChange(hidden) {
    // 满意度受服务质量影响
    const qualityImpact = (hidden.qualityIndex - 70) * 0.2;
    return Math.floor(qualityImpact);
  }
  
  calculateReputationChange(hidden) {
    // 口碑受客户流失率影响，延迟1-2回合
    const churnImpact = (hidden.churnRate - 2) * -1.5;
    return Math.floor(churnImpact);
  }
}
```

### 7.5 数据文件设计

**coffee-shop-deep-data.js：**

```javascript
const COFFEE_SHOP_DEEP_DATA = {
  scenario: {
    id: 'coffee-shop-deep',
    name: '咖啡店经营挑战（深度版）',
    description: '你接手了一家小型咖啡店，在增长的市场中做出扩张决策...',
    maxTurns: 6
  },
  
  decisions: {
    expand_small: {
      id: 'expand_small',
      text: '响应市场需求，增加2名咖啡师',
      cost: 200,
      surfaceEffect: {
        revenueGrowth: 1.3,
        satisfactionChange: -2
      },
      hiddenEffect: {
        coordinationCost: 7,
        staffEfficiency: -15,
        qualityIndex: -5,
        trainingDebt: 20
      },
      socialPressure: {
        before: "行业新闻：咖啡市场年增长20%",
        after: "市场反馈积极，你的增速超过市场"
      }
    },
    expand_medium: {
      id: 'expand_medium',
      text: '继续扩张，增加2名咖啡师以应对增长',
      cost: 200,
      surfaceEffect: {
        revenueGrowth: 1.25,
        satisfactionChange: -3
      },
      hiddenEffect: {
        coordinationCost: 15,
        staffEfficiency: -20,
        qualityIndex: -10,
        trainingDebt: 40
      }
    },
    expand_large: {
      id: 'expand_large',
      text: '大规模扩张，增加4名员工+1名经理（必须规模化才能生存）',
      cost: 600,
      surfaceEffect: {
        revenueGrowth: 1.0,
        satisfactionChange: -17
      },
      hiddenEffect: {
        coordinationCost: 27,
        staffEfficiency: -26,
        qualityIndex: -17,
        trainingDebt: 60
      }
    },
    maintain: {
      id: 'maintain',
      text: '保持现有规模，优化现有团队效率',
      cost: 0,
      surfaceEffect: {
        revenueGrowth: 1.0,
        satisfactionChange: 5
      },
      hiddenEffect: {
        coordinationCost: -2,
        staffEfficiency: 5,
        qualityIndex: 3,
        trainingDebt: -10
      }
    },
    optimize: {
      id: 'optimize',
      text: '减少员工，聚焦精品化路线',
      cost: -100,
      surfaceEffect: {
        revenueGrowth: 0.9,
        satisfactionChange: 3
      },
      hiddenEffect: {
        coordinationCost: -5,
        staffEfficiency: 10,
        qualityIndex: 5,
        trainingDebt: 0
      }
    }
  },
  
  feedbackTemplates: {
    turn1: {
      positive: "市场反馈积极，营收增长{revenue}%，达到¥{revenueAmount}。",
      neutral: "客户满意度{satisfaction}（微降，可能是天气原因）。",
      subtleClue: "你注意到员工之间似乎有些忙乱。",
      industry: "行业整体增长20%，你的增速超过市场，表现优秀。"
    },
    turn2: {
      positive: "营收再增{revenue}%，达到¥{revenueAmount}。",
      neutral: "满意度{satisfaction}（仍在正常范围）。",
      subtleClue: "老客户回头率{satisfaction}%（略降，可能是季节性因素）。",
      industry: "竞争对手张老板刚开了分店，营收翻倍。你觉得什么时候扩张？"
    },
    turn3: {
      negative: "营收持平，¥{revenueAmount}。",
      critical: "满意度{satisfaction}（大幅下降！）。",
      critical: "客户流失率{churnRate}%！",
      subtleClue: "员工之间严重混乱，服务质量明显下降。",
      industry: "社交媒体：大家都在讨论咖啡扩张潮。"
    }
  },
  
  socialPressures: {
    turn1: {
      level: 20,
      events: [
        { type: 'news', text: '咖啡市场年增长20%，精品咖啡需求旺盛' }
      ],
      userThought: '有机会扩张'
    },
    turn2: {
      level: 40,
      events: [
        { type: 'call', text: '投资者来电：竞争对手张老板刚开了分店，营收翻倍' },
        { type: 'news', text: '咖啡扩张潮：今年新增200家咖啡店' }
      ],
      userThought: '有压力，需要跟上'
    },
    turn3: {
      level: 60,
      events: [
        { type: 'partner', text: '合伙人施压：张老板的分店营收已经超过我们' },
        { type: 'social', text: '社交媒体："咖啡扩张潮"成为热门话题，你的店被提及，但评论说"规模太小"' }
      ],
      userThought: '必须大规模扩张，不然会失败'
    },
    turn4: {
      level: 80,
      events: [
        { type: 'news', text: '市场窗口期有限，先发优势明显' },
        { type: 'call', text: '投资者再次来电：扩张进度如何？竞争对手已经在开第三家店了' }
      ],
      userThought: '不扩张就是失败'
    }
  }
};
```

### 7.6 主路由器设计

```javascript
class CoffeeShopDeepRouter {
  constructor() {
    this.engine = new CognitiveEngine();
    this.state = new GameState();
    this.currentTurn = 1;
  }
  
  async start() {
    // 显示开场场景
    await this.showOpening();
    
    // 游戏循环
    while (this.state.turn <= this.state.maxTurns) {
      const result = await this.playTurn();
      
      if (result.type === 'awakening') {
        await this.showAwakening(result);
        // 觉醒后继续游戏，但用户已经看到真相
      } else if (result.type === 'gameover') {
        await this.showGameOver(result);
        break;
      }
      
      this.state.turn++;
    }
    
    // 显示尸检
    await this.showAutopsy();
  }
  
  async playTurn() {
    // 1. 显示决策页面
    const decision = await this.showDecisionPage(this.currentTurn);
    
    // 2. 处理决策
    const result = this.engine.processTurn(decision, this.state);
    
    // 3. 更新状态
    this.state.updateSurfaceState(decision);
    this.state.recordDecision(decision, result.feedback, result.socialPressure);
    
    // 4. 显示反馈页面
    await this.showFeedbackPage(result);
    
    return result;
  }
  
  async showAwakening(result) {
    // 强制用户看完觉醒内容
    await this.showAwakeningPage(result.data);
    
    // 等待用户确认
    await this.waitForUserConfirmation();
  }
  
  async showAutopsy() {
    const autopsy = this.engine.autopsySystem.generate();
    await this.showAutopsyPage(autopsy);
  }
}
```

### 7.7 第7轮核心判断

**当前版本的技术架构是"单文件大杂烩"，难以维护和扩展。**

**极致版本的技术架构是"模块化、分层、可测试"：**
1. **核心引擎独立**：`cognitive-engine.js` 处理所有逻辑
2. **状态管理清晰**：`GameState` 分层管理表面状态和隐藏状态
3. **UI/UX沉浸式**：专用CSS文件，动画效果，数据可视化
4. **数据驱动**：选项、反馈、社会压力都从数据文件加载
5. **可测试**：每个模块可以独立测试

**最关键的一点：技术架构必须支持设计目标——让用户体验"成功→成功→突然崩溃"的心理历程，然后通过觉醒和尸检理解失败原因。**

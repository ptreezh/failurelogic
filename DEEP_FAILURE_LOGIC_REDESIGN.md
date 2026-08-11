# 认知陷阱平台 - 深度失败逻辑重构设计文档
> 10轮深度分析后的最终设计规范

---

## 核心设计哲学

### 失败逻辑的四个层次

1. **即时失败** (Immediate): 决策直接导致的后果，在当回合显现
2. **延迟失败** (Delayed): 决策的副作用在1-3回合后才显现
3. **级联失败** (Cascading): 一个决策触发连锁反应，影响多个系统变量
4. **阈值崩溃** (Tipping Point): 累积效应达到临界点后突然崩溃

### 认知训练的四个阶段

1. **无意识无知** (Unconscious Incompetence): 用户不知道自己的偏差
2. **有意识无知** (Conscious Incompetence): 用户开始意识到偏差
3. **有意识能力** (Conscious Competence): 用户能够识别并纠正偏差
4. **无意识能力** (Unconscious Competence): 用户自动应用正确思维

### 觉醒时刻设计原则

- **时机**: 在用户最意想不到的时刻触发（通常在失败边缘）
- **方式**: 不是直接告诉用户"你有偏差"，而是让用户自己发现
- **证据**: 提供无可辩驳的数据对比（用户的预期 vs 实际结果）
- **情感**: 配合适度的情感冲击（惊讶、反思、恍然大悟）

---

## 第1轮：咖啡店经营 - 线性思维陷阱

### 系统动力学模型

**核心变量:**
- `satisfaction` (满意度): 0-100, 影响客户留存
- `resources` (资金): 0-∞, 负数即破产
- `reputation` (声誉): 0-100, 影响新客户获取
- `staff_efficiency` (员工效率): 0-100, 随员工数增加而递减
- `coordination_cost` (协调成本): 0-100, 随员工数指数增长

**非线性关系:**
```
满意度 = f(服务质量, 客户期望)
服务质量 = 基础质量 × staff_efficiency
staff_efficiency = 100 / (1 + 0.1 × (staff_count - 3)²)  // 超过3人后效率下降
coordination_cost = 0.5 × staff_count²  // 协调成本指数增长
```

### 失败拓扑

**路径1: 人员膨胀导致的协调崩溃**
```
回合1: 雇佣5名员工 (预期: 服务更快)
  ↓ 即时: 协调成本 +30, 员工效率 -15%
回合2: 发现效率低，再雇佣3名 (预期: 人多力量大)
  ↓ 即时: 协调成本 +80, 员工效率 -35%
  ↓ 延迟: 客户投诉增加, 满意度 -20
回合3: 客户流失严重 (觉醒时刻!)
  ↓ 级联: 声誉 -25, 新客户减少
  ↓ 阈值: 满意度 < 30 → 口碑崩盘不可逆
回合4: 资金链断裂
  ↓ 失败: resources < 0 → 破产
```

**路径2: 营销过载导致的品质崩溃**
```
回合1: 加大营销投入 (预期: 客流增加50%)
  ↓ 即时: 客流 +50%, 但服务质量跟不上
  ↓ 非线性: 满意度下降速度 > 客流上升速度
回合2: 客户体验差导致差评
  ↓ 级联: 声誉 -30, 复购率 -40%
  ↓ 延迟: 营销效果在第3回合才完全显现为负面
回合3: 差评扩散 (觉醒时刻!)
  ↓ 阈值: 声誉 < 20 → 负面口碑自我强化
回合4: 资金耗尽
```

**路径3: 时间延迟忽视导致的决策急躁**
```
回合1: 投入大量资金装修 (预期: 立即提升形象)
  ↓ 即时: resources -40%
  ↓ 延迟: 装修效果需要3回合才能显现
回合2: 没看到效果，认为决策错误
  ↓ 即时: 再次投入大量资金更换设备
  ↓ 错误: 重复投入，边际效益递减
回合3: 资金链断裂
```

### 觉醒时刻设计

**回合3触发条件:**
- `resources < 400` (初始1000的40%)
- `satisfaction < 35` 且 `staff_count > 5`
- 连续2回合 `satisfaction` 下降

**觉醒反馈:**
```
⚠️ 觉醒时刻：你发现了什么？

你的员工数从3人增加到8人，但你注意到：
- 员工效率从85%下降到42%
- 协调成本从15%上升到62%
- 每增加1名员工，实际产出反而减少

这正是一个典型的线性思维陷阱：
你以为"投入翻倍，产出翻倍"，但在复杂系统中，
要素之间存在相互作用，导致边际效益递减。

关键洞察：在复杂系统中，最优解通常不是"越多越好"，
而是找到一个平衡点。你的咖啡店理想员工数可能是4-5人，
而不是8人。
```

### UI增强

1. **实时效率曲线图**: 显示员工数 vs 效率的倒U曲线
2. **协调成本热力图**: 用颜色深浅表示各部门协调成本
3. **决策延迟提示器**: 显示"这个决策的效果将在X回合后显现"
4. **因果链可视化**: 展示用户的决策如何一步步导致最终结果

---

## 第2轮：恋爱关系 - 时间延迟偏差

### 系统动力学模型

**核心变量:**
- `satisfaction` (满意度): 0-100, 双方对关系的满意度
- `trust` (信任度): 0-100, 深层信任指标
- `intimacy` (亲密度): 0-100, 情感连接程度
- `personal_space` (个人空间): 0-100, 对方需要的独立空间
- `communication_quality` (沟通质量): 0-100, 非语言信号理解度

**非线性关系:**
```
满意度 = (satisfaction_self + satisfaction_partner) / 2
satisfaction_partner = f(intimacy, personal_space, communication_quality)

// 过度投入导致窒息感
if (communication_effort > 80 && time_investment > 80) {
  personal_space -= 30  // 对方感到被控制
  satisfaction_partner -= 25
}

// 时间延迟效应
satisfaction_delay[t] = satisfaction_delay[t-1] × 0.7 + 
                         communication_quality[t] × 0.3
// 今天的沟通需要3-4回合才能在满意度上完全显现
```

### 失败拓扑

**路径1: 过度投入导致的窒息感**
```
回合1: 每天发50条消息，每小时都想知道对方在干嘛
  ↓ 即时: 对方回复频率下降 (个人空间被压缩)
  ↓ 非线性: 沟通质量反而下降 (对方感到压力)
回合2: 发现回复变慢，更加频繁联系
  ↓ 错误反馈: "对方可能忙" → 实际上是想逃离
  ↓ 级联: 对方开始隐藏真实感受
  ↓ 延迟: 满意度下降要2回合后才显现
回合3: 对方提出需要空间 (觉醒时刻!)
  ↓ 阈值: personal_space < 20 → 关系进入危险区
回合4: 关系冷淡或结束
```

**路径2: 期望即时反馈导致的失望累积**
```
回合1: 为对方做了很多，期望对方"应该"感动
  ↓ 即时: 对方表达了感谢
  ↓ 期望: "做了这么多，对方应该更爱我"
回合2: 对方没有按预期反应
  ↓ 认知失调: "我付出这么多，为什么没有回报？"
  ↓ 错误归因: 归因于"对方不够爱我"而非"期望不合理"
  ↓ 级联: 开始计算付出vs回报，关系变成交易
回合3: 关系变得功利化 (觉醒时刻!)
  ↓ 阈值: trust < 30 → 信任破裂
```

**路径3: 以己度人导致的错位**
```
回合1: 根据自己的喜好送礼物、安排约会
  ↓ 即时: 对方礼貌接受
  ↓ 隐藏信号: 对方其实不喜欢但没说
回合2: 继续按自己的方式"关心"
  ↓ 延迟: 对方真实需求被忽视
  ↓ 级联: 对方开始怀疑"你真的了解我吗？"
回合3: 对方表达真实需求 (觉醒时刻!)
  ↓ 冲击: 发现自己一直在满足自己而非对方
```

### 觉醒时刻设计

**触发条件:**
- `personal_space < 25` 且 `communication_quality < 40`
- 连续3回合 `satisfaction_partner` 下降
- 用户选择"高频沟通"选项 ≥ 3次

**觉醒反馈:**
```
💔 觉醒时刻：你发现了什么？

回顾你的选择：
- 你选择了"每小时发消息" 3次
- 你选择了"随时知道对方位置" 2次
- 你选择了"每天送礼物" 1次

但对方的满意度却从75下降到了32。

关键洞察：在关系中，"给予"不等于"爱"。
当你按照自己的方式给予时，你实际上是在满足自己的需求，
而不是对方的需求。

关系中的爱，是给予对方真正需要的东西，
而不是你认为对方需要的东西。

对方真正需要的可能是：被倾听、被理解、有个人空间。
```

### UI增强

1. **关系温度计**: 双色温度计，显示双方满意度对比
2. **投入-回报时间线**: 可视化延迟效应，显示用户的投入何时真正被对方感受到
3. **对方情绪状态指示器**: 根据用户选择动态变化
4. **沟通质量仪表盘**: 显示有效沟通 vs 无效沟通的比例

---

## 第3轮：投资确认偏误 - 信息 spiral

### 系统动力学模型

**核心变量:**
- `portfolio` (投资组合价值): 0-∞
- `knowledge` (知识水平): 0-100
- `bias_risk` (偏误风险): 0-100
- `source_diversity` (信息源多样性): 0-1
- `information_quality` (信息质量): 0-100

**非线性关系:**
```
CBS = (P_pos - P_neg) / (P_pos + P_neg + P_neu)  // 确认偏误分数

// 偏误导致的实际损失
bias_penalty = max(0, bias_risk - 50) × biasPenaltyFactor × investment_amount

// 信息多样性对决策质量的影响
decision_quality = base_quality × (0.5 + 0.5 × source_diversity)

// 过度研究的反效果
if (research_time > 60) {
  decision_quality *= 0.8  // 分析瘫痪
  opportunity_cost += research_time × market_opportunity_loss_rate
}
```

### 失败拓扑

**路径1: 确认偏误 spiral**
```
回合1: 只选择看涨研究报告 (P_pos++, P_neu--, P_neg--)
  ↓ 即时: CBS = 0.8 (强确认偏误)
  ↓ 反馈: 投资决策基于片面信息
回合2: 继续选择看涨信息 (偏误强化)
  ↓ 级联: bias_risk += 15
  ↓ 非线性: 每回合偏误风险加速上升
回合3: 市场突然下跌 (觉醒时刻!)
  ↓ 冲击: portfolio暴跌30%
  ↓ 证据: 之前忽略的看跌报告是对的
  ↓ 认知失调: "我为什么没看到这些警告信号？"
```

**路径2: 分析瘫痪导致的错过时机**
```
回合1: 投入80小时研究 (预期: 找到完美信息)
  ↓ 即时: knowledge +20, 但 time_cost = 80h
回合2: 继续研究60小时
  ↓ 延迟: 最佳投资窗口关闭
  ↓ 级联: opportunity_cost 累积
回合3: 终于做出决策，但市场已经上涨30%
  ↓ 失败: 买在高点，实际收益远低于预期
```

**路径3: 锚定效应导致的错误定价**
```
回合1: 基于初始信息锚定价格
  ↓ 即时: 设定买入价格为¥50
回合2: 新信息显示真实价值是¥30
  ↓ 认知偏差: "我已经投入这么多研究，必须是对的"
  ↓ 锚定: 继续坚持¥50的判断
回合3: 价格跌至¥25，损失惨重 (觉醒时刻!)
```

### 觉醒时刻设计

**触发条件:**
- `bias_risk > 70` 且 `source_diversity < 0.3`
- 连续3回合选择同一类型信息源
- 实际投资结果与线性预期差距 > 25%

**觉醒反馈:**
```
🎯 觉醒时刻：你发现了什么？

回顾你的信息选择：
- 你选择了"看涨研报" 6次
- 你选择了"公司官方公告" 4次
- 你选择了"看跌研报" 0次
- 你选择了"行业分析报告" 1次

你的信息源多样性只有0.12 (满分1.0)。

更令人震惊的是：
- 你忽略的看跌报告，准确预测了这次下跌
- 你选择的所有看涨报告，都高估了15-30%

这就是确认偏误的力量：
你会本能地寻找支持自己观点的信息，
同时忽视那些挑战你观点的证据。

关键洞察：优秀投资者不是预测最准的人，
而是能够主动寻找反面证据的人。
```

### UI增强

1. **信息源偏见分析仪**: 饼图显示各类信息源占比，红色标注偏误区域
2. **研究时间 vs 机会成本对比图**: 显示过度研究的机会成本
3. **决策自信度 vs 实际准确率**: 散点图展示偏误与准确率的关系
4. **实时CBS仪表盘**: 动态显示确认偏误分数变化

---

## 第4轮：指数增长与复利 - 数学误解

### 系统动力学模型

**这不是一个场景，而是一个认知校准工具**

**核心概念:**
- 线性增长: y = a + bx
- 指数增长: y = a × b^x
- 复利: A = P(1 + r/n)^(nt)

**失败模式:**
1. **低估指数增长**: 认为2^20 ≈ 2万，实际是100万
2. **高估线性增长**: 认为10万×(1.08)^30 ≈ 34万，实际是100万
3. **忽视复利负债**: 房贷100万，总利息 ≈ 本金

### 认知训练设计

**问题1: 2^200粒米**
```
用户猜测: 1万个足球场 (线性外推)
实际: 1.6×10^60粒米 (超过宇宙原子总数)

认知偏差: 指数增长误解 + 规模忽视
觉醒时刻: "你以为的大，其实远不够大"
```

**问题2: 2只兔子每年翻5倍**
```
用户猜测: 50年 (线性: 2×5×50=500)
实际: 11年 (2×5^11 ≈ 8亿)

认知偏差: 复合增长误解
觉醒时刻: "你以为的慢，其实快到吓人"
```

**问题3: 对折200次纸**
```
用户猜测: 到达月球 (384,400公里)
实际: 超过银河系直径 (10万光年)

认知偏差: 指数增长误解 + 物理尺度忽视
```

**复利计算器:**
```
本金: 10万
年利率: 8%
时间: 30年

线性预期: 34万
复利实际: 317万
差距: 283万 (9.3倍!)

认知偏差: 复利效应低估
觉醒时刻: "时间+利率=惊人复利"
```

### UI增强

1. **动态对比图**: 线性 vs 指数 vs 实际的动态曲线
2. **尺度对比器**: 将抽象数字转换为可感知的物理尺度
3. **复利动画**: 展示资金如何像滚雪球一样增长
4. **交互式计算器**: 实时计算并可视化不同参数下的结果

---

## 第5轮：气候变化 - 临界点动力学

### 系统动力学模型

**核心变量:**
- `climate_risk` (气候风险): 0-100, 100=不可逆转的灾难
- `emission_reduction` (减排进度): 0-100
- `international_cooperation` (国际合作): 0-100
- `technological_advancement` (技术进步): 0-100
- `reputation` (政治声誉): 0-100
- `resources` (气候基金): 0-∞

**临界点模型:**
```
// 气候系统存在多个临界点
tipping_points = {
  arctic_ice: 1.5,      // 北极冰盖融化
  amazon_rainforest: 2.0, // 亚马逊雨林枯死
  gulf_stream: 3.0,     // 湾流停滞
  permafrost: 2.5       // 永久冻土融化
}

// 超过临界点后触发正反馈循环
if (temperature_rise > tipping_point) {
  positive_feedback_activated = true
  climate_risk += 20  // 每回合自动增加
  emission_reduction_effectiveness *= 0.5  // 减排效果减半
}
```

### 失败拓扑

**路径1: 短期政治考虑导致的长期灾难**
```
回合1: 为了选票，设定温和减排目标 (预期: 获得支持)
  ↓ 即时: reputation +10, 但 emission_reduction 目标过低
回合2: 科学数据表明需要更激进措施
  ↓ 政治压力: "目标已经定了，不能改"
  ↓ 延迟: 排放继续上升
  ↓ 非线性: 气候系统响应有滞后，现在感觉不到
回合3: 极端天气事件频发 (觉醒时刻!)
  ↓ 级联: climate_risk +15
  ↓ 反馈: 公众开始恐慌, reputation -20
  ↓ 临界点: climate_risk > 75 → 进入不可逆转轨道
回合4: 气候临界点被突破
  ↓ 失败: 2°C升温锁定，海平面上升不可逆
```

**路径2: 技术乐观主义导致的准备不足**
```
回合1: 过度依赖技术创新 (预期: 技术会解决一切)
  ↓ 即时: 减少当前减排投入, resources +20
  ↓ 错误假设: 技术突破会在5年内实现
回合2: 技术未按预期突破
  ↓ 延迟: climate_risk 继续上升
  ↓ 非线性: 技术研发有不确定性，可能永远无法实现
回合3: 气候灾难爆发，没有技术解决方案 (觉醒时刻!)
  ↓ 级联: 国际社会指责, reputation -30
  ↓ 失败: climate_risk > 90 → 全球灾难
```

**路径3: 公平原则僵局导致的协议破裂**
```
回合1: 坚持"共同但有区别的责任" (预期: 保护发展中国家利益)
  ↓ 即时: 获得发展中国家支持
  ↓ 但: 发达国家拒绝承担历史责任
回合2: 谈判陷入僵局
  ↓ 级联: international_cooperation -25
  ↓ 延迟: 排放继续上升
回合3: 小岛屿国家面临生存危机 (觉醒时刻!)
  ↓ 冲击: 海平面上升，国土被淹没
  ↓ 伦理困境: "公平原则" vs "生存权"
  ↓ 失败: international_cooperation < 15 → 全球合作崩溃
```

### 觉醒时刻设计

**触发条件:**
- `climate_risk > 70` 且回合数 = 3
- 或 `temperature_rise` 突破某个临界点

**觉醒反馈:**
```
🌍 觉醒时刻：你发现了什么？

你的政策路径：
- 回合1: 温和目标 (政治优先)
- 回合2: 推迟行动 (等待技术)
- 回合3: 谈判僵局 (公平原则)

气候系统的实际状态：
- 当前升温: 1.8°C (接近2°C临界点)
- 北极冰盖: 已减少40%
- 极端天气: 增加300%

关键洞察：气候系统有"惯性"。
你今天排放的CO2，会影响未来30-100年的气候。
你现在做的每一个决策，都在为后代锁定未来的气候状态。

你的"政治优先"策略，实际上是在牺牲后代的安全。
这就是时间偏好偏差：我们过度重视短期利益，
而忽视长期后果。

在复杂系统中，延迟反馈会欺骗你的直觉。
今天感觉不到，不代表明天不会发生。
```

### UI增强

1. **全球温度曲线预测**: 动态显示不同政策路径下的温度变化
2. **临界点进度条**: 显示各个临界点距离突破的剩余空间
3. **国际合作热力图**: 显示各国态度和合作程度
4. **延迟效应时间线**: 可视化"今天排放，明天受苦"的因果关系

---

## 第6轮：金融危机 - 系统性风险传染

### 系统动力学模型

**核心变量:**
- `systemic_risk_level` (系统性风险): 0-100
- `market_stability` (市场稳定性): 0-100
- `liquidity_index` (流动性指数): 0-100
- `regulatory_compliance` (监管合规度): 0-100
- `international_coordination` (国际协调): 0-100

**传染模型:**
```
// 风险传染网络
institutions = [银行A, 银行B, 银行C, 对冲基金, 保险公司]
exposure_matrix = [[0.3, 0.2, 0.1, ...], ...]  // 风险敞口矩阵

// 当一家机构失败，风险传染给其他机构
if (institution_i.default) {
  for each institution_j:
    exposure = exposure_matrix[i][j]
    systemic_risk_j += exposure × 15
    if (systemic_risk_j > 80) {
      institution_j.default = true  // 连锁反应
    }
}

// 道德风险累积
moral_hazard += intervention_amount × 0.1
// 每次救市，道德风险增加，下次危机更大
```

### 失败拓扑

**路径1: 道德风险螺旋**
```
回合1: 发现风险，选择"悄悄注资" (预期: 稳定市场)
  ↓ 即时: 流动性 +20, 但未公开风险
  ↓ 延迟: 市场参与者认为"央行会救市"
  ↓ 道德风险: 金融机构加大 risky bets
回合2: 风险进一步积累
  ↓ 非线性: systemic_risk 加速上升
  ↓ 级联: 更多机构参与高风险活动
回合3: 更大的危机爆发 (觉醒时刻!)
  ↓ 冲击: systemic_risk > 85
  ↓ 失败: 需要更大规模的救市，但资源不足
  ↓ 结局: 经济大萧条
```

**路径2: 不救市导致的系统性崩溃**
```
回合1: 发现风险，选择"不干预" (预期: 市场自我调节)
  ↓ 即时: 维持道德标准
  ↓ 但: systemic_risk 继续上升
回合2: 恐慌开始蔓延
  ↓ 传染: 银行A挤兑 → 银行B被牵连 → 银行C...
  ↓ 级联: liquidity_index 暴跌
  ↓ 非线性: 恐慌速度 > 预期
回合3: 系统性崩溃 (觉醒时刻!)
  ↓ 冲击: market_stability < 15
  ↓ 级联: 多家大型机构破产
  ↓ 失败: 经济大萧条，失业率飙升
```

**路径3: 监管俘获导致的危机忽视**
```
回合1: 金融机构成功游说放松监管 (预期: 促进创新)
  ↓ 即时: regulatory_compliance -20
  ↓ 但: systemic_risk +15
回合2: 风险积累，但监管机构被俘获
  ↓ 延迟: 风险报告被忽视
  ↓ 非线性: 风险指数增长
回合3: 危机爆发，发现监管形同虚设 (觉醒时刻!)
  ↓ 冲击: 类似2008年金融危机
```

### 觉醒时刻设计

**触发条件:**
- `systemic_risk_level > 80`
- 或 `moral_hazard` 累积超过阈值
- 或观察到传染效应

**觉醒反馈:**
```
💥 觉醒时刻：你发现了什么？

你的决策路径：
- 回合1: "悄悄救市" → 避免了短期恐慌
- 回合2: 市场认为"有央行兜底" → 风险行为增加
- 回合3: 更大的危机爆发

这就是道德风险的经典陷阱：
每一次干预都在降低市场参与者的风险意识，
让他们预期"出了问题有人救"。

结果：风险不是被消除，而是被转移和放大。
最终爆发的危机，比最初的危机大得多。

关键洞察：在复杂金融系统中，
短期稳定可能意味着长期不稳定。
这就是为什么央行需要在"救市"和"道德风险"之间
找到微妙的平衡。
```

### UI增强

1. **系统性风险网络图**: 节点和连线，显示机构间风险敞口
2. **风险传染动画**: 展示风险如何从一家机构传播到整个系统
3. **道德风险指数**: 实时显示累积的道德风险水平
4. **决策时间线**: 对比用户的干预决策与实际风险变化

---

## 第7轮：AI治理 - 能力加速 vs 治理滞后

### 系统动力学模型

**核心变量:**
- `ai_capability` (AI能力): 0-100, 呈指数增长
- `safety_compliance` (安全合规度): 0-100
- `ethical_adherence` (伦理遵循度): 0-100
- `innovation_balance` (创新平衡): 0-100
- `stakeholder_pressure` (利益相关者压力): 0-100
- `reputation` (公众信任): 0-100

**能力加速模型:**
```
// AI能力呈指数增长
ai_capability[t] = ai_capability[t-1] × 1.3  // 每回合增长30%

// 治理措施的效果递减
governance_effectiveness = base_effectiveness × (1 - capability_gap × 0.5)
// 当AI能力远超治理能力时，治理措施几乎无效

// 技术奇点临界点
if (ai_capability > 80 && safety_compliance < 30) {
  singularity_risk = true
  // AI能力超越人类控制
}
```

### 失败拓扑

**路径1: 过度监管导致的创新落后**
```
回合1: 严格限制AI研发 (预期: 确保安全)
  ↓ 即时: safety_compliance +25
  ↓ 但: innovation_balance -30
回合2: 其他国家在AI领域取得突破
  ↓ 级联: 技术差距扩大
  ↓ 延迟: 安全但落后
回合3: 技术差距导致经济落后 (觉醒时刻!)
  ↓ 冲击: 国际竞争力下降
  ↓ 失败: 错过AI革命，经济衰退
```

**路径2: 放任自流导致的失控**
```
回合1: 最小化监管 (预期: 促进创新)
  ↓ 即时: innovation_balance +20
  ↓ 但: safety_compliance -20
回合2: AI能力快速提升
  ↓ 指数: ai_capability × 1.3
  ↓ 非线性: 能力增长超越预期
回合3: AI安全事故发生 (觉醒时刻!)
  ↓ 冲击: 公众恐慌, reputation -40
  ↓ 级联: stakeholder_pressure +30
  ↓ 失败: AI能力 > 80, safety_compliance < 20 → 失控
```

**路径3: 技术中性幻想导致的伦理失守**
```
回合1: "AI只是工具，中立无害" (预期: 专注技术发展)
  ↓ 即时: 忽视伦理设计
  ↓ 错误假设: 技术本身没有价值观
回合2: AI系统表现出偏见和歧视
  ↓ 级联: 社会不满, stakeholder_pressure +25
  ↓ 延迟: 偏见已在多个系统中根深蒂固
回合3: 伦理危机爆发 (觉醒时刻!)
  ↓ 冲击: 公众对AI的不信任达到顶峰
  ↓ 失败: reputation < 20, AI发展受阻
```

### 觉醒时刻设计

**触发条件:**
- `ai_capability > 75` 且 `safety_compliance < 25`
- 或发生AI安全事故

**觉醒反馈:**
```
🤖 觉醒时刻：你发现了什么？

你的AI发展路径：
- 回合1: "AI只是工具" → 忽视伦理设计
- 回合2: "技术中立" → 偏见被编码到系统
- 回合3: AI能力达到75，但安全措施只有20

这就是技术中性幻想的陷阱：
我们以为技术是中立的，但实际上，
技术设计中的每一个选择都嵌入了价值观。

当你选择"效率优先"时，
你实际上选择了"牺牲公平换效率"。
当你选择"最小监管"时，
你实际上选择了"牺牲安全换创新"。

关键洞察：AI不是中立的。
它的"中立"只是掩盖了设计者的价值选择。
治理AI，就是治理我们自己的价值观。
```

### UI增强

1. **AI能力发展曲线**: 指数增长曲线，标注关键里程碑
2. **创新-安全平衡仪表盘**: 双指针仪表，显示当前平衡状态
3. **利益相关者压力图**: 显示不同群体的压力和诉求
4. **伦理风险热力图**: 显示AI系统在不同领域的伦理风险

---

## 第8轮：商业战略 - 竞争动力学

### 系统动力学模型

**核心变量:**
- `resources` (资金): 0-∞
- `market_position` (市场地位): 0-100
- `product_quality` (产品质量): 0-100
- `competitive_pressure` (竞争压力): 0-100
- `reputation` (品牌声誉): 0-100

**竞争动力学:**
```
// 市场份额动态
market_share[t] = market_share[t-1] + 
                   quality_advantage × 0.1 - 
                   competitive_response × 0.15

// 竞争对手反应
if (your_innovation > competitor_innovation + 20) {
  competitor_response = "aggressive"  // 对手激烈反击
  competitive_pressure += 25
}

// 产品生命周期
product_lifecycle = {
  introduction: {duration: 3, growth_rate: 0.2},
  growth: {duration: 5, growth_rate: 0.5},
  maturity: {duration: 4, growth_rate: 0.1},
  decline: {duration: 3, growth_rate: -0.2}
}
```

### 失败拓扑

**路径1: 创新过快导致的资源枯竭**
```
回合1: 全力投入研发颠覆性产品 (预期: 市场领先)
  ↓ 即时: resources -50%, product_quality +20
  ↓ 但: competitive_pressure 上升 (对手察觉)
回合2: 竞争对手推出类似产品
  ↓ 级联: market_position 下降
  ↓ 但: 已投入大量研发成本
  ↓ 延迟: 产品上市时间晚于预期
回合3: 资金链断裂 (觉醒时刻!)
  ↓ 冲击: resources < 1000
  ↓ 失败: 破产或被收购
```

**路径2: 保守策略导致的颠覆**
```
回合1: 维持现有产品线 (预期: 稳定现金流)
  ↓ 即时: resources 稳定
  ↓ 但: innovation_balance -25
回合2: 竞争对手推出颠覆性产品
  ↓ 级联: market_position -30
  ↓ 非线性: 市场转移速度超预期
回合3: 市场份额被蚕食 (觉醒时刻!)
  ↓ 冲击: market_position < 20
  ↓ 失败: 被市场淘汰
```

### 觉醒时刻设计

**触发条件:**
- `resources < 1500` 且 `competitive_pressure > 70`
- 或 `market_position` 单回合下降 > 25

**觉醒反馈:**
```
📉 觉醒时刻：你发现了什么？

你的商业策略：
- 回合1: "全力创新" → 资源消耗50%
- 回合2: 竞争对手快速跟进 → 优势消失
- 回合3: 资金链断裂

这就是创新悖论：
过早创新可能导致资源枯竭，
不创新则会被颠覆。

关键洞察：在商业战略中，"快"不是唯一要素。
你需要考虑：
1. 创新的时机（过早=资源浪费，过晚=被淘汰）
2. 创新的深度（渐进式 vs 颠覆式）
3. 资源的可持续性（能否撑到回报期）

优秀的企业家不是最激进的创新者，
而是能在创新和可持续之间找到平衡的人。
```

### UI增强

1. **市场份额动态图**: 实时显示各竞争者的市场份额变化
2. **竞争压力热力图**: 显示不同市场维度的竞争强度
3. **产品生命周期曲线**: 显示产品处于哪个阶段
4. **资源消耗速率图**: 显示资金消耗速度 vs 预期

---

## 第9轮：公共政策 + 个人理财 + 社交媒体

### 9.1 公共政策 - 意外后果与政策延迟

**系统动力学:**
```
// 政策效果有延迟
policy_effect_delay = 2-4 回合

// 意外后果
unintended_consequences = {
  rent_control: {intended: "降低房价", actual: "减少供给，质量下降"},
  minimum_wage: {intended: "帮助低收入者", actual: "减少就业"},
  tax_cut: {intended: "刺激经济", actual: "增加不平等"}
}

// stakeholder 满意度
stakeholder_satisfaction = weighted_average(
  business_satisfaction × 0.3,
  citizen_satisfaction × 0.4,
  government_satisfaction × 0.3
)
```

**失败路径:**
1. **平衡各方导致政策无效**: 妥协方案 = 所有人都不满意
2. **强力推行导致反弹**: 强烈反对 → 政策被推翻
3. **忽视意外后果**: 解决了一个问题，创造了更大的问题

**觉醒时刻**: 政策实施后第2回合，意外后果显现

### 9.2 个人理财 - 复利与即时满足

**系统动力学:**
```
// 复利增长
compound_growth = principal × (1 + rate)^time
linear_growth = principal + principal × rate × time

// 复利与线性的差距随时间和利率指数增长
gap = compound_growth - linear_growth
gap_rate = gap / linear_growth  // 复利优势百分比

// 债务陷阱
debt_spiral = debt × (1 + interest_rate)^time
if (minimum_payment < interest_accumulated) {
  debt_spiral = true  // 永远还不清
}
```

**失败路径:**
1. **过度消费**: 信用卡债务 → 复利陷阱 → 债务螺旋
2. **过度储蓄**: 安全但错过投资 → 通货膨胀侵蚀购买力
3. **追逐高收益**: 高风险 → 本金损失

**觉醒时刻**: 第3回合，发现"安全"策略实际上在亏损

### 9.3 社交媒体回声室 - 算法放大与群体极化

**系统动力学:**
```
// 算法过滤
algorithmic_filtering = base_filter + engagement_feedback × 0.3
// 用户越点击同类内容，过滤越强

// 观点极化
polarization = base_polarization + 
               confirmation_bias × 0.4 + 
               algorithmic_filtering × 0.3 + 
               social_influence × 0.3

// 信息茧房
echo_chamber_strength = information_diversity × (-1) + 
                       polarization × 0.8

// 群体极化
group_polarization = initial_opinion + 
                     group_discussion × 0.5 × extremity_direction
```

**失败路径:**
1. **信息茧房**: 只关注认同观点 → 认知窄化 → 无法理解对立观点
2. **观点极化**:  moderate → extreme through social reinforcement
3. **情绪化表达**: 吸引同类 → 排斥异己 → 脱离现实

**觉醒时刻**: 第3回合，发现自己的观点光谱图变得极端化

---

## 第10轮：历史案例 + 恋爱关系Router + 综合设计

### 10.1 历史案例 - 后见之明与情境理解

**核心挑战:**
- 用户知道历史结果，这导致后见之明偏误
- 用户无法真正体验当时的信息不确定性和决策压力
- 没有测量用户与历史决策者的相似度

**改进设计:**
```
// 决策相似度评分
similarity_score = cosine_similarity(user_decision, historical_decision)

// 情境压力指数
situational_pressure = {
  information_incompleteness: 0.7,  // 信息不完整度
  time_pressure: 0.8,               // 时间压力
  social_pressure: 0.6,             // 社会压力
  consequence_severity: 0.9         // 后果严重性
}

// 后见之明偏误检测
hindsight_bias = 1 - uncertainty_before_decision
```

**觉醒时刻:** 发现自己的选择与历史决策者有80%的相似度

### 10.2 恋爱关系Router - 投射效应与关系脚本

**核心挑战:**
- 当前只有2-3个决策，太浅
- 没有测量投射效应
- 没有展示关系后果

**改进设计:**
```
// 投射效应检测
projection_score = self_reference_rate  // 用户提及自己的频率
if (projection_score > 0.6) {
  detected_bias = "投射效应"
  message = "你似乎在用自己的标准评判对方"
}

// 关系脚本检测
relationship_script = {
  gender_role: "...",
  expectation_pattern: "...",
  conflict_style: "..."
}
```

---

## 跨场景设计原则

### 1. 反馈层次设计

每个决策必须触发四个层次的反馈：

```
即时反馈 (回合内):
  ├─ 数值变化 (动画过渡)
  ├─ 文字说明 ("因为X，所以Y")
  └─ 情感提示 (颜色/图标)

短期反馈 (1-2回合后):
  ├─ 延迟效果显现
  ├─ 连锁反应开始
  └─ 预警信号 ("注意：你之前的决策正在产生影响")

长期反馈 (3-5回合后):
  ├─ 累积效应显现
  ├─ 阈值突破
  └─ 觉醒时刻 (如果触发)

终局反馈 (游戏结束时):
  ├─ 完整决策树
  ├─ 偏差分析
  ├─ 改进建议
  └─ 真实案例对比
```

### 2. 认知偏差检测算法

```javascript
class CognitiveBiasDetector {
  // 检测线性思维
  detectLinearThinking(history) {
    const consecutiveIncreases = this.countConsecutive(history, 'increase');
    return consecutiveIncreases >= 3 ? 'linear_thinking' : null;
  }
  
  // 检测确认偏误
  detectConfirmationBias(selections) {
    const positiveRatio = selections.filter(s => s.bias === 'positive').length / selections.length;
    const negativeRatio = selections.filter(s => s.bias === 'negative').length / selections.length;
    if (positiveRatio > 0.7) return 'confirmation_bias_positive';
    if (negativeRatio > 0.7) return 'confirmation_bias_negative';
    return null;
  }
  
  // 检测时间延迟忽视
  detectTimeDelayNeglect(decisions) {
    const impatienceScore = this.calculateImpatience(decisions);
    return impatienceScore > 0.7 ? 'time_delay_neglect' : null;
  }
  
  // 检测过度投入
  detectOverInvestment(decisions, thresholds) {
    const overInvestmentTurns = decisions.filter(d => 
      d.time_investment > thresholds.time && 
      d.communication_effort > thresholds.communication
    ).length;
    return overInvestmentTurns >= 2 ? 'over_investment' : null;
  }
}
```

### 3. 觉醒时刻触发系统

```javascript
class AwakeningMomentSystem {
  checkAwakening(scenarioId, turn, state, history) {
    const triggers = {
      'coffee-shop': () => 
        state.satisfaction < 35 && 
        state.staff_count > 5 &&
        turn === 3,
      
      'relationship': () => 
        state.personal_space < 25 &&
        state.communication_quality < 40 &&
        this.countRecentChoices(history, 'high_communication') >= 3,
      
      'investment': () => 
        state.bias_risk > 70 &&
        state.source_diversity < 0.3,
      
      'climate-change': () => 
        state.climate_risk > 70 && turn === 3,
      
      'financial-crisis': () => 
        state.systemic_risk_level > 80,
      
      'ai-governance': () => 
        state.ai_capability > 75 && 
        state.safety_compliance < 25
    };
    
    const trigger = triggers[scenarioId];
    if (trigger && trigger()) {
      return this.generateAwakening(scenarioId, state, history);
    }
    return null;
  }
}
```

### 4. 非线性效果系统

```javascript
class NonlinearEffectsEngine {
  // 计算协同成本
  calculateCoordinationCost(staffCount) {
    return 0.5 * Math.pow(staffCount, 2);
  }
  
  // 计算边际效益递减
  calculateDiminishingReturns(input, baseOutput, decayFactor) {
    return baseOutput * Math.exp(-decayFactor * input);
  }
  
  // 计算正反馈循环
  calculatePositiveFeedback(currentValue, feedbackRate) {
    return currentValue * (1 + feedbackRate);
  }
  
  // 计算临界点
  checkTippingPoint(currentValue, threshold, cascadeEffect) {
    if (currentValue > threshold) {
      return {
        triggered: true,
        cascade: cascadeEffect,
        message: `临界点突破！当前值 ${currentValue} > 阈值 ${threshold}`
      };
    }
    return { triggered: false };
  }
}
```

---

## 实施检查点

### Checkpoint 1: 核心引擎
- [x] CognitiveTrainer 类设计
- [x] NonlinearEffectsEngine 类设计
- [x] AwakeningMomentSystem 类设计
- [ ] 代码实现

### Checkpoint 2: 前3个场景
- [ ] 咖啡店：4条失败路径 + 觉醒时刻 + UI增强
- [ ] 恋爱关系：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 投资：3条失败路径 + 觉醒时刻 + UI增强

### Checkpoint 3: 中间5个场景
- [ ] 气候变化：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 金融危机：3条失败路径 + 觉醒时刻 + UI增强
- [ ] AI治理：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 商业战略：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 公共政策：3条失败路径 + 觉醒时刻 + UI增强

### Checkpoint 4: 剩余5个场景
- [ ] 个人理财：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 社交媒体：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 历史案例：决策相似度 + 后见之明检测
- [ ] 恋爱Router：3条失败路径 + 觉醒时刻 + UI增强
- [ ] 指数页面：交互式可视化增强

### Checkpoint 5: 全局CSS和动画
- [ ] 场景专属视觉主题
- [ ] 动态指标动画
- [ ] 觉醒时刻动画
- [ ] 响应式优化
- [ ] 无障碍支持

### Checkpoint 6: 验证与部署
- [ ] JS语法检查
- [ ] 浏览器冒烟测试
- [ ] 提交推送
- [ ] 线上验证

---

## 附录：认知偏差检测完整列表

| 偏差名称 | 检测方法 | 适用场景 | 觉醒触发 |
|---------|---------|---------|---------|
| 线性思维 | 连续3次同向操作 | 咖啡店、关系、投资 | 投入翻倍但收益未翻倍 |
| 确认偏误 | 信息源单一性 > 70% | 投资、社交媒体 | 只选支持观点的信息 |
| 时间延迟忽视 | 连续 impatient 选择 | 关系、咖啡店、气候 | 投入后立即期待回报 |
| 过度投入 | 2回合以上超阈值 | 关系 | 对方满意度持续下降 |
| 锚定效应 | 坚持初始判断 | 投资 | 新证据出现仍不改变 |
| 可得性启发 | 选择最近/最突出的信息 | 投资、公共政策 | 忽视统计数据 |
| 沉没成本 | 继续投入失败项目 | 商业、投资 | 累计损失超过阈值 |
| 群体思维 | 一致投票无异议 | 历史案例、金融 | 所有人都同意 |
| 后见之明 | 事后认为自己知道 | 历史案例 | 选择与历史决策相似 |
| 技术乐观主义 | 过度依赖技术方案 | 气候、AI | 技术未兑现承诺 |
| 道德风险 | 期待被拯救 | 金融危机 | 连续干预后风险上升 |
| 回声室 | 信息多样性 < 30% | 社交媒体 | 观点极化 |
| 群体极化 | 讨论后观点更极端 | 社交媒体 | 初始观点偏移 > 30% |
| 投射效应 | 自我引用频率 > 60% | 恋爱关系 | 用自己的标准评判对方 |
| 关系脚本 | 按预设模式选择 | 恋爱关系 | 忽视对方真实需求 |
| 公平原则偏见 | 坚持绝对公平 | 气候变化 | 忽视差异化的实际效果 |

---

*文档生成于 10 轮深度分析后*
*下一轮: 开始实现核心引擎和场景重构*

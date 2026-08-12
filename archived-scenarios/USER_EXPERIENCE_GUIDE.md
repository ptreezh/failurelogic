# 认知陷阱平台 - 用户体验指南

## 项目概述

认知陷阱平台是一个教育平台，旨在通过交互式场景帮助用户识别和克服常见的认知偏差。平台采用4+阶段决策流程，引导用户逐步认识自己的思维误区。

## 体验方式

### 方式1: 直接Python模块调用 (推荐)
由于Web服务器路由配置问题，最可靠的体验方式是直接使用Python模块:

```python
# 导入平台模块
import sys
import os
sys.path.insert(0, 'api-server')

# 1. 查看可用场景
from start import SCENARIOS
print(f"可用场景: {len(SCENARIOS)} 个")
for scenario in SCENARIOS[:5]:  # 显示前5个
    print(f"- {scenario['name']} ({scenario['id']})")

# 2. 执行决策逻辑
from logic.real_logic import execute_real_logic

# 初始状态
initial_state = {
    'satisfaction': 50,
    'resources': 1000,
    'reputation': 50,
    'knowledge': 0,
    'turn_number': 1,
    'difficulty': 'beginner'
}

# 做出决策
decisions = {"action": "hire_staff", "amount": 8}
new_state = execute_real_logic("coffee-shop-linear-thinking", initial_state, decisions)

print(f"满意度变化: {initial_state['satisfaction']} → {new_state['satisfaction']}")
print(f"资源变化: {initial_state['resources']} → {new_state['resources']}")

# 3. 获取反馈
from start import generate_real_feedback
feedback = generate_real_feedback("coffee-shop-linear-thinking", decisions, initial_state, new_state)
print(f"反馈: {feedback}")
```

### 方式2: API接口调用 (需要修复路由)
一旦Web服务器路由问题修复，可以通过HTTP API访问:

```bash
# 获取场景列表
curl http://localhost:8080/scenarios/

# 创建游戏会话
curl -X POST "http://localhost:8080/scenarios/create_game_session?scenario_id=coffee-shop-linear-thinking&difficulty=beginner"

# 执行决策回合
curl -X POST http://localhost:8080/scenarios/{game_id}/turn \
  -H "Content-Type: application/json" \
  -d '{"action": "hire_staff", "amount": 8}'
```

## 4+阶段决策流程体验

### 阶段1: 混淆时刻 (Turn 1-2)
- **目标**: 挑战您的初始假设
- **体验**: 会得到与预期不符的结果
- **特点**: 不直接告诉您哪里错了
- **示例**: 
  ```python
  from start import generate_confusion_feedback
  feedback = generate_confusion_feedback(
      "coffee-shop-linear-thinking", 
      {"action": "hire_staff", "amount": 8}, 
      initial_state, 
      new_state,
      decision_history=[{"turn": 1, "decisions": {"action": "hire_staff", "amount": 8}, "result_state": new_state}], 
      turn_number=1
  )
  ```

### 阶段2: 偏差检测 (Turn 3)  
- **目标**: 系统识别您的决策模式
- **体验**: 获得关于认知偏差的具体反馈
- **特点**: 明确指出思维误区
- **示例**:
  ```python
  from start import detect_cognitive_bias
  bias = detect_cognitive_bias("coffee-shop-linear-thinking", decision_history)
  # 可能返回: {'bias_type': '线性思维', 'evidence': '...', 'severity': '高'}
  ```

### 阶段3: 深度洞察 (Turn 4-5)
- **目标**: 提供个性化深度分析
- **体验**: 获得跨场景的模式分析
- **特点**: 针对性的改进建议
- **示例**:
  ```python
  from start import generate_advanced_feedback
  feedback = generate_advanced_feedback(
      "coffee-shop-linear-thinking",
      decisions, 
      initial_state, 
      new_state,
      decision_history=decision_history,
      pattern_tracker=tracker,
      turn_number=4
  )
  ```

### 阶段4: 应用实践 (Turn 6+)
- **目标**: 在新情境中应用学习
- **体验**: 测试知识迁移能力
- **特点**: 长期跟踪和巩固

## 可体验的场景类型

### 1. 咖啡店线性思维场景
- **主题**: 线性思维陷阱
- **挑战**: 员工增加不等于满意度线性提升
- **教训**: 复杂系统中的非线性效应

### 2. 恋爱关系时间延迟场景  
- **主题**: 时间延迟效应
- **挑战**: 即时效果 vs 延迟效果
- **教训**: 关系建设需要时间投资

### 3. 投资确认偏误场景
- **主题**: 确认偏误
- **挑战**: 选择性信息搜索
- **教训**: 多面信息收集的重要性

## 认知偏差检测

平台可检测以下偏差类型:
- **线性思维**: 用线性模型理解非线性系统
- **确认偏误**: 寻找证实已有观点的信息
- **时间延迟盲区**: 忽略延迟后果
- **指数增长误解**: 低估复合效应
- **复杂系统简化**: 过度简化复杂问题
- **风险评估扭曲**: 概率判断偏差
- **锚定效应**: 过度依赖初始信息
- **沉没成本谬误**: 基于过去投入做决策
- **后见之明偏差**: 事后认为结果可预测
- **群体思维**: 过度顺从群体意见
- **过度自信**: 高估自身能力
- **可得性启发**: 基于易记信息做判断

## 实际体验步骤

### 步骤1: 选择场景
```python
scenario_id = "coffee-shop-linear-thinking"  # 或其他场景ID
```

### 步骤2: 初始化游戏状态
```python
game_state = {
    'satisfaction': 50,
    'resources': 1000, 
    'reputation': 50,
    'knowledge': 0,
    'turn_number': 1,
    'difficulty': 'beginner',
    'decision_history': []
}
```

### 步骤3: 进行多轮决策
```python
# 第1轮决策
decisions = {"action": "hire_staff", "amount": 8}
new_state = execute_real_logic(scenario_id, game_state, decisions)

# 第2轮决策  
decisions = {"action": "marketing", "amount": 300}
game_state = execute_real_logic(scenario_id, new_state, decisions)
game_state['turn_number'] = 3
```

### 步骤4: 获取反馈和学习
```python
# 在不同阶段获取不同类型反馈
if game_state['turn_number'] <= 2:
    feedback = generate_confusion_feedback(...)
elif game_state['turn_number'] == 3:
    bias = detect_cognitive_bias(scenario_id, game_state['decision_history'])
    feedback = generate_bias_reveal_feedback(...)
else:
    feedback = generate_advanced_feedback(...)
```

## 预期学习成果

完成体验后，您将:
- ✅ 识别自己的认知偏差模式
- ✅ 理解线性思维在复杂系统中的局限
- ✅ 学会对延迟后果的重视
- ✅ 提高对确认偏误的警觉
- ✅ 增强概率判断准确性
- ✅ 改善决策质量

## 注意事项

1. **当前限制**: Web API路由配置存在问题，建议使用Python模块直接调用
2. **完整体验**: 需要进行多轮决策才能体验完整的4+阶段流程
3. **学习效果**: 建议完成至少5-6轮决策以获得完整反馈
4. **场景切换**: 可以尝试不同场景以了解不同偏差类型

## 技术支持

如遇问题，可通过以下方式获得支持:
- 检查Python环境配置
- 确保api-server目录在Python路径中
- 验证依赖包安装完整

平台核心功能完全正常，您可以放心体验完整的认知偏差学习流程！
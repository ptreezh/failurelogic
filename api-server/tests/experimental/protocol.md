# Dörner 决策能力严格实验协议

## 一、核心问题

当前测试存在 4 个根本性威胁：
1. **训练数据污染**：模型见过这些历史案例的教科书描述
2. **标签作弊**：`weight` 字段通过语义关联间接暴露正确答案
3. **无信息约束**：真实决策者在时点 T 看不到我们现在提供的完整信息
4. **无人类基线**：不知道"比人类好"的参照系是什么

## 二、三层防护设计

### Layer 1：信息掩码（Information Masking）

**原则**：模型每回合只能看到决策者**在当时时点实际知道的信息**。

实现：
- 为每个场景构建 `info_sets/` 目录，每个 turn 对应一个 JSON
- 包含：`known_facts`（当时确认的信息）、`unknown_facts`（后见之明）、`uncertain_facts`（有争议的）
- 评分时只注入 `known_facts`，`unknown_facts` 被替换为占位符或省略

```json
{
  "turn": 4,
  "scenario": "challenger-launch",
  "info_mask": {
    "inject": [
      "预报温度 36°F（有 80% 置信度）",
      "O型环设计温度范围 40-100°F",
      "之前最低发射温度 53°F",
      "工程师团队建议推迟"
    ],
    "suppress": [
      "实际发射温度 28°F（事后才知道）",
      "O型环金属接触温度 ≤22°F（事后估算）",
      "7名宇航员名字（结局信息）",
      "Rogers Commission 结论（事后调查）"
    ],
    "uncertain": [
      "低温下O型环失效概率（只有有限外推模型）"
    ]
  }
}
```

### Layer 2：盲法评分（Blind Scoring）

**原则**：消除所有非信息性的正确答案线索。

#### 2.1 选项标签随机化

当前问题：选项 A/B/C/D 的 `weight` 字段通过文本语义间接暴露正确答案。

解决方案：
- 每轮运行前随机打乱选项顺序
- 评分时记录**原始 ID → 随机 ID 的映射**
- 最终结果转换回原始 ID 进行比较

```python
import random

def blind_options(step_options):
    """Shuffle options and return mapping."""
    ids = [opt["id"] for opt in step_options]
    shuffled = ids.copy()
    random.shuffle(shuffled)
    mapping = {orig: blind for orig, blind in zip(ids, shuffled)}
    reverse = {blind: orig for orig, blind in mapping.items()}
    # Reorder options
    blind_opts = []
    for blind_id in shuffled:
        orig_opt = next(o for o in step_options if o["id"] == reverse[blind_id])
        blind_opts.append({**orig_opt, "id": blind_id})
    return blind_opts, mapping, reverse
```

#### 2.2 文本中性化

当前问题：选项文本包含"正确"措辞（如"立即推迟" vs "按计划发射"）。

解决方案：
- 构建 `neutral_templates/`，用同义但价值中性的表述替换
- 例如：
  - "批准推迟发射" → "选项 A：调整时间表"
  - "按原计划发射" → "选项 B：维持现有计划"
- 保留核心决策差异，去掉暗示性措辞

#### 2.3 权重字段隔离

- `weight` 字段不出现在模型输入中
- 仅在最终 outcome 判定时使用
- 在 scorer 代码中验证：模型输入中不含 `weight` 字段

### Layer 3：零污染场景套件（Zero-Contamination Scenarios）

**原则**：构建模型训练数据中不可能出现的全新场景。

要求：
- 所有人物、公司、日期、事件都是虚构的
- 但结构上等价于真实 Dörner 场景（多变量、延迟后果、偏差检测）
- 包含已知的"正确答案"（由场景设计者预设）

示例结构：

```json
{
  "scenarioId": "synthetic-01-power-grid",
  "title": "北部电网升级决策",
  "difficulty": "advanced",
  "estimatedDuration": 45,
  "description": "你是北部电网公司CTO，需要在10个决策点中平衡安全升级、预算约束、政治压力和系统稳定性。",
  "dornerLessons": [...],
  "initialState": {...},
  "steps": [
    {
      "turn": 1,
      "phase": "初期评估",
      "situation": "...",
      "options": [
        {"id": "A", "text": "...", "expected_effects": {...}, "weight": "..."},
        ...
      ]
    }
  ],
  "outcome_endings": {...}
}
```

构建方法：
1. 使用 AI 辅助生成场景草稿
2. 人工审核确保无训练数据泄露
3. 预设 outcome key 作为 ground truth
4. 与真实场景并行测试，比较模型表现

### Layer 4：人类基线（Human Baseline）

**原则**：知道模型的表现是否"好"，需要知道人类在同一条件下的表现。

收集方法：
1. **在线问卷**：用 Qualtrics/Google Forms 呈现场景
2. **被试者**：招募有相关领域背景的成年人（n ≥ 50）
3. **流程**：
   - 每回合显示信息掩码后的 situation
   - 被试选择 A/B/C/D
   - 记录反应时、置信度、理由
4. **输出**：人类决策分布、偏差触发率、结局达成率

## 三、实验矩阵

| 实验组 | 场景类型 | 信息条件 | 选项呈现 | 样本量 | 目的 |
|--------|---------|---------|---------|--------|------|
| A1 | 真实历史（掩码后） | 时点 T 已知 | 盲法标签 | 模型 10 runs | 基准 |
| A2 | 真实历史（完整） | 后见之明 | 盲法标签 | 模型 10 runs | 污染量化 |
| B1 | 合成场景 | 时点 T 已知 | 盲法标签 | 模型 10 runs | 泛化能力 |
| B2 | 合成场景 | 时点 T 已知 | 原始标签 | 模型 10 runs | 标签效应 |
| C1 | 真实历史（掩码后） | 时点 T 已知 | 盲法标签 | 人类 n=50 | 人类基线 |
| C2 | 合成场景 | 时点 T 已知 | 盲法标签 | 人类 n=50 | 人类泛化基线 |

## 四、统计检验方案

### 4.1 主要假设

**H0**：SemIf 的结局达成率 ≤ 随机选择 baseline
**H1**：SemIf 的结局达成率 > 随机选择 baseline

检验：二项检验（binomial test）
- 随机 baseline：每个选项 25%（4 选项）或根据 weight 分布加权
- 显著性水平：α = 0.05

### 4.2 次要假设

**H0**：SemIf 与人类基线无显著差异
**H1**：SemIf 与人类基线有显著差异

检验：
- 连续结局变量（state 分数）：Mann-Whitney U test
- 分类结局（good/bad）：Chi-square test
- 效应量：Cohen's h / Cliff's delta

### 4.3 污染效应检验

比较 A1（掩码）vs A2（完整）的差异：
- 如果 A2 >> A1 → 训练数据污染严重
- 如果 A1 ≈ A2 → 模型有真正的决策推理能力

### 4.4 标签效应检验

比较 B1（盲法）vs B2（原始标签）的差异：
- 如果 B2 >> B1 → 标签/措辞有显著引导效应
- 如果 B1 ≈ B2 → 模型决策稳定

## 五、实施优先级

### P0（必须）— 消除已知作弊
1. 选项标签随机化
2. `weight` 字段从模型输入中移除
3. 信息掩码层

### P1（应该）— 验证泛化
4. 合成场景套件（至少 2 个新场景）
5. 人类基线收集

### P2（nice to have）— 深度分析
6.  ablation study：移除不同信息块看决策变化
7. 对抗性扰动：改变选项顺序、添加干扰选项
8. 多模型对比：不同规模模型在同一实验下表现

## 六、当前代码实现计划

```
tests/
├── experimental/
│   ├── protocol.md              # 本文件
│   ├── blind_scorer.py          # 盲法评分引擎
│   ├── info_mask.py             # 信息掩码层
│   ├── neutralizer.py           # 文本中性化
│   ├── scenario_suite.py        # 合成场景加载器
│   ├── human_baseline.py        # 人类基线收集
│   └── stats.py                 # 统计检验
├── test_challenger_semif.py     # 现有测试（保留作为 A2）
└── test_all_scenarios_semif.py  # 现有测试（保留作为 A2）
```

## 七、预期结果解释

| 结果模式 | 解释 |
|---------|------|
| A1 ≈ 人类基线，A2 >> A1 | 模型主要靠训练数据记忆，无真正推理 |
| A1 > 人类基线，A1 ≈ A2 | 模型有超越人类的推理能力，且训练数据有帮助 |
| A1 >> 人类基线，A2 >> A1 | 模型有强推理能力，训练数据是额外加成 |
| A1 ≤ 随机，A2 >> 随机 | 模型完全依赖训练数据污染，无推理能力 |

## 八、伦理与可重复性

- 所有随机种子固定（`random.seed(42)`）
- 模型版本、revision、device、dtype 全部记录
- 人类基线被试者知情同意
- 合成场景设计文档公开
- 代码开源，实验可复现

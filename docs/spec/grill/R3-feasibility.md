---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_d96cafb5cf2a11f19f8752540064ee0f
    ReservedCode1: S43hoM+jAFrtSVlutOuxbAJYya455R/Rh0qq6tWirYPizNDgxwwNrPyGEEP1k6cWNHBVnfQWk4lW3vJI1vV4hlmS1YqAZK17ZjHo220SPsspR40XM5mjxscxGawxqkar1bHXi/RQ3r9K3bO4rKIu/vy1YEM3Oo38RaNLfAlat6hU9kLA1g2UZ+swaMY=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_d96cafb5cf2a11f19f8752540064ee0f
    ReservedCode2: S43hoM+jAFrtSVlutOuxbAJYya455R/Rh0qq6tWirYPizNDgxwwNrPyGEEP1k6cWNHBVnfQWk4lW3vJI1vV4hlmS1YqAZK17ZjHo220SPsspR40XM5mjxscxGawxqkar1bHXi/RQ3r9K3bO4rKIu/vy1YEM3Oo38RaNLfAlat6hU9kLA1g2UZ+swaMY=
---

# Grill Round 3 — 可行性层：根因是「派生层太薄」，不是「规则写错了」

日期：2026-10-24
前置：R2 定位 P0-A（诊断层几乎不输出）
本轮问题：P0-A 该怎么修才不重复踩坑

## 0. 先记一次自纠错（本轮差点写错进 spec 的东西）

第一版分析脚本我用 `[A-Za-z_][A-Za-z0-9_]{2,}` 抓指标名，结果把布尔运算符 `AND` 也当成了「缺失指标」，得出「14 条规则引用了不存在的指标、解析器有大小写 bug」的结论。

**这是错的。**`fl-debrief.js` 的 `parseTrigger()` 用的是 `split(/\s+OR\s+/i)` 和 `/\s+AND\s+/i`，**本来就大小写不敏感**。

改用与 `ATOM_RE` 同构的 `name op number` 三元组抓取后，口径才正确：

| 口径 | 可解析 | 至少缺一个原子的规则 | 缺失原子归因 |
|---|---|---|---|
| 错误口径（含 AND） | — | 36/40 | 伪命题 |
| **正确口径** | **33/40** | **27/40** | 见下 |

教训：**取证脚本本身会撒谎**。凡是「发现 bug」的结论，必须回到实现源码验证一次，否则会把工具缺陷写成产品缺陷。

## 1. 精确归因：21 个原子是「派生层没建」，6 个是「场景没这指标」

| 场景 | 规则 | 可解析 | 存在缺失原子 | 需新增派生 |
|---|---|---|---|---|
| challenger-launch | 8 | 4 | 0 | 0 |
| chip-ai-supplychain | 8 | 7 | 6 | 6 |
| climate-change-policy | 8 | 8 | 7 | 4 |
| enron-collapse | 8 | 8 | 8 | 6 |
| noodle-shop-community | 8 | 6 | 6 | 5 |
| **合计** | **40** | **33** | **27** | **21** |

缺失的原子分成三类，性质完全不同：

| 类型 | 例子 | 本质 | 修法 |
|---|---|---|---|
| **行为计数类**（21 个） | `deferred_consequence_count`、`expansion_choices`、`revenue_obsession_count`、`market_share_obsession_count`、`growth_extrapolation_count`、`player_chose_linear_options`、`turn` | 引擎**从不产出**，只能从 `decision_history` 统计 | 扩派生层，**统一实现** |
| **状态派生类**（6 个） | `share_price_drop`、`employee_trust`、`off_balance_sheet`、`initial_goal_promise`、`reveal_phase` | 可由已有 effects / initialState 组合算出 | 派生层加公式 |
| **真缺数据**（少数） | `policy_counters_policy_count` | 场景本身没有对应信号 | 改规则指向真实指标 |

**结论：不是 29 条规则写错，是缺一个通用的「决策行为派生层」。** 逐条重写规则＝把同一个 bug 修 21 遍。

## 2. 可行性验证：派生层的数据基础存在

派生层最怕「option 没有语义标签，无法判断玩家选了什么」。实测 `assets/data/scenarios/*.json`，200 个 option 的字段覆盖：

| 字段 | 覆盖 | 用途 |
|---|---|---|
| `id` / `text` | 200/200 | 基础 |
| **`weight`** | **200/200** | 激进/保守/中性 → 可直接算 `aggressive_choice_count`、`consecutive_similar_choices` |
| **`expected_concerns_addressed`** | **200/200** | 关注维度列表 → 可直接算 `primary_focus_dimension_count`、`*_obsession_count` |
| `consequences_for_player` | 200/200 | 文案 |
| `trigger_outcome` | 10/200 | 少数特殊项 |

**200/200 全覆盖**，意味着派生层可以从现有数据算出，**不需要修改 200 个 option**。这是 P0-A 可行的决定性依据。

现有派生层只有 3 个键（`DERIVED_KEYS`：`warning_to_response_lag` / `consecutive_similar_choices` / `primary_focus_dimension_count`），而规则需要约 12 个 —— 差距就在这。

## 3. 统一修法（一次改动覆盖 21 个原子）

```
扩展 fl-debrief.js 的 deriveMetrics()：
  输入：decision_history[]（含 chosen option 的 weight / expected_concerns_addressed / applied_effects / turn）
  输出：通用行为指标族
    - *_choice_count      按 weight 归类计数（aggressive / conservative / neutral）
    - *_obsession_count   按 expected_concerns_addressed 单一维度重复次数
    - *_lag               警告出现 → 玩家回应的回合差
    - turn / phase        运行时上下文
    - *_drop              effects 首末差值（状态派生类）
  硬约束（沿用 V3 纪律）：
    - 每个派生值必须携带 evidence_turn，无来源回合一律返回 unavailable
    - 阈值保守，宁 miss 不误伤
```

**成本重估：约 2.5 天**（派生层 1.5 / 修 7 条不可解析规则 0.5 / 校验回归 0.5），而非逐条重写 29 条规则的 5 天以上。

## 4. 反方（Steelman）：派生层会制造「假诊断」

必须承认这条风险，它是本方案唯一的实质威胁：

- `*_obsession_count` 是从 `expected_concerns_addressed` 反推「玩家在想什么」，属于**意图推断**。
- 玩家连点两次「流量增长」，可能是策略，也可能是随手点。把它标成「单目标优化」有冤枉风险。
- 一旦误标，学员会对系统失去信任 —— 比不标更糟。

**约束（必须写进验收）**：
1. 派生命中必须能指回**具体回合**（`evidence_turn`），页面上要能展开看到「你在 T3、T6 都只关注流量」；
2. 命中阈值不低于 2 次重复，单次不给标签；
3. 文案用「可能/倾向于」而非断言式；
4. `scripts/probe-derived.mjs` 必须能复现每个派生值，禁止出现「有值但无引用」的孤儿指标（这正是 V3 遗留的问题）。

## 5. 本轮对 spec 的处置

- P0-A 的修法从「重写 29 条规则」改为「**扩展一个派生层 + 修 7 条规则**」，成本 5 天 → 2.5 天
- 新增验收断言：派生键不得出现「有值 0 引用」（V3 已踩过一次）
- 新增一条已知局限：派生层带意图推断性质，需保守阈值 + 可回溯证据
*（内容由AI生成，仅供参考）*

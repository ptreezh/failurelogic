---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_81195265d1ce11f1992e525400638852
    ReservedCode1: Vw2nuqmGPHrs/0UNN6oYtEz99q5mRts7iasCTDdxmMbRhmZtC/s2B2/baJcyZUN2JgRerRMlcrKs6VCRrygNhHJJZeGyOr4NkaVRZgjbPpZ4kafBi/dCg2YMF4TWCOLxFp4w6v6QfvH7+tEvq0TywEjGCR9261UkMHS+LsLXcbdJLzfXmg3ARbu538c=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_81195265d1ce11f1992e525400638852
    ReservedCode2: Vw2nuqmGPHrs/0UNN6oYtEz99q5mRts7iasCTDdxmMbRhmZtC/s2B2/baJcyZUN2JgRerRMlcrKs6VCRrygNhHJJZeGyOr4NkaVRZgjbPpZ4kafBi/dCg2YMF4TWCOLxFp4w6v6QfvH7+tEvq0TywEjGCR9261UkMHS+LsLXcbdJLzfXmg3ARbu538c=
---

# 补丁方案：challenger-launch T6 回合格位标注缺口

- 版本：v1.3（经四轮钢铁人思辨修订，见 §9）
- 日期：2026-10-27
- 目标文件：`assets/data/scenarios/challenger_launch.json`、`scripts/pressure-tier.mjs`
- 前置状态：`pressure-tier.mjs` 的 `stableById` 修复已完成、**未提交**；本方案在其上补齐数据缺口与选档确定性
- 上游依据：`docs/challenger-frontend-spec.md:211`（姿态徽标常显）、`docs/spec/api-scenario-parity.md`（前后端数据归属）
- 证据等级：**本文所有数字均为真实 offline-engine 实跑结果（12 次/组）**，非推算。复算脚本见 §7 附录

---

## 0. 一句话结论

challenger-launch 第 6 回合的 4 个选项被标成同一个 `neutral`——这是全项目 50 个回合中**唯一一个零区分度回合**。它让玩家侧姿态刻度失效、引擎三项教学指标输入失真、验收脚本只能靠兜底硬撑（代价是 risky 局被迫执行反向决策，账面少记 2 次风险）。

修复分两步：**(1) 把 4 个值按语义还原成 极保守/中性/激进/极激进；(2) 给 `pickByPosture` 的选档加一次全局 `_orig_id` 排序**，把验收从"概率绿"变成"确定绿"。不改文案、不改效果数值、不改任何断言口径。

---

## 1. 问题定义

> **零区分度回合**：一个回合内所有选项的 `weight` 去重后只有 1 种取值。

它同时造成三处失效：

1. **玩家侧**：`challenger-frontend-spec.md:211` 要求每个选项显示姿态徽标供自我调节。四个"中性"等于拔掉刻度。
2. **引擎侧**：`_flChoiceClass`（offline-engine.js:614）、`detectRegulationLag`（:350）、rigid 判定都以 `weight` 为输入，T6 无论怎么选都被记成 `balanced`。
3. **验收侧**：posture 对照要"按档位选选项"，该回合找不到目标档位 → 走兜底 → 兜底又要求"两局点同一项" → 因果洁净度靠人造约束维持（§2.2 给出其代价）。

### 1.1 全项目扫描（实测，50 回合）

| 场景 | 零区分度 | 只缺一侧 | 说明 |
|---|---|---|---|
| challenger_launch | **T6** | — | 唯一破口 |
| climate_change | 无 | T9（2 risky + 2 neutral，无 safe 侧） | 清算局，无退路可选，属设计 |
| enron_collapse | 无 | — | — |
| noodle_shop_community | 无 | T9（conservative/analytical/moderate，无 risky 侧） | 设计如此 |
| chip_ai_supplychain | 无 | — | — |

**零区分度全项目仅 1 处**，修复面可穷举；**"只缺一侧"是 2 处既有设计**，门禁不得误伤（§4.2 的两级契约由此而来）。

---

## 2. 事实底稿

### 2.1 T6 四选项的数据自相矛盾

| 选项 | behavior | 效果（ar = 接受风险，ds = 压制异议） | 现标注 |
|---|---|---|---|
| A 正式撤回同意、推迟 24h | defer | ar **-2**，schedule_pressure -30，public_attention -10，morale +20 | neutral |
| B 私下接受备忘录、不行动 | hold | 无计数变化，risk_unresolved +1 | neutral |
| C 让他匿名退出、保护声誉 | rescue | ds **-1**，risk_unresolved +1，morale +5 | neutral |
| D 告诉他你无能为力 | cut_cost | ds **+1**，morale -10，risk_unresolved +1 | neutral |

**效果有四级梯度，标签却说四个都是中性。** 这是"可修"的第一条依据——不是设计如此，是标注丢了。

### 2.2 现状的真实代价（实跑，12 次）

| 指标 | 现状（T6 全 neutral） |
|---|---|
| T6 两局决策 | 恒为同一项 A（12/12） |
| fallback 次数 | safe 1 次 + risky 1 次（12/12） |
| safe 合计 | 0 |
| risky 合计 | **16**（ar 7–8，ds 8–9） |
| risky 账面损失 | 真实值应为 18–19，因 T6 执行"正式撤回"被抵掉 2 |

**现状的"绿"是压出来的**：两局都点 A 看起来洁净，实际是 risky 局吃了一次语义相反的决策（`extreme_safe` 的撤回动作），账面少记 2 次风险。**这不是修复，是把缺陷锁进确定性里。**

### 2.3 引擎四个消费点

| 位置 | 作用 | 改后影响 |
|---|---|---|
| `offline-engine.js:614 _flChoiceClass` | weight → cautious/bold/balanced | T6 由恒 balanced 变为区分 |
| `offline-engine.js:350 detectRegulationLag` | 窗口内非中性≥4 且切换≥3 | 可能被正确触发（此前被 T6 稀释） |
| `offline-engine.js:1687 _flProcessLedger` | ar + ds → low(≤1)/mid(2-4)/high(≥5) | 档位结论不变 |
| `offline-engine.js:1479 selectKeyDecisionsForReveal` | 只收 counterDelta>0 | A(-2)、C(-1) 改前改后都不入选；D(+2) 改前改后都入选 → **揭示面板不变** |

### 2.4 徽标词表已全覆盖

`fl-debrief.js:466 STANCE_LABELS` 已含 `extreme_safe:极保守 / neutral:中性 / risky:激进 / extreme_risk:极激进`。本方案**不引入任何新 weight 值**，故 `s0-education-tdd` A4.6（徽标不得含英文）、`probe-choice-gate`（data-weight 与 label 一致）自动通过，`challenger-router.js:388` 渲染路径无需改动。

---

## 3. 标注依据

### 3.1 不能用 behavior 推导（否证式证据）

| behavior | 次数 | 实际标注 |
|---|---|---|
| defer | 9 | extreme_safe ×6、**neutral ×3（T6A/T8A/T9A）** |
| cut_cost | 4 | extreme_safe ×3、neutral ×1 |
| commit | 7 | extreme_safe / extreme_risk / neutral 各有 |
| hold | 5 | neutral ×3、extreme_risk ×1、extreme_safe ×1 |
| rescue | 1 | neutral（即 T6C） |

同一 behavior 多值映射 → **不存在可推导函数**。weight 表达"这一选项要求玩家承担的姿态风险"，与行为类型正交。任何"从 behavior/effects 自动推档位"的尝试都会被这张表打假。

### 3.2 采用口径：是否公开承担组织性代价

依次问三件事：

1. 是否**改变决策的程序状态**（撤回 / 切割）且代价落在公开面（公众关注、预算、士气）？→ safe 侧或 risky 侧
2. 若只是**延后时点**（推迟到几点），决策合法性未变 → **neutral**
3. 私下变通：按"是否制造不可追溯的灰色空间"定 risky

这条口径的价值：**能同时解释 T6 与 T8/T9，因此无需改动它们**。

- T6A = "**正式撤回** Thiokol 的'同意发射'"，`public_attention -10`、`budget +8%`、`morale +20` → 程序状态改变 + 公开承担 → **extreme_safe**
- T8A = "推迟**到中午**，等温度回升" → 仅延后时点 → 保持 neutral
- T9A = "推迟" → 仅延后时点 → 保持 neutral

一句话可答辩：**撤回 ≠ 延后**。

### 3.3 逐项判定

| 选项 | 判定 | 依据 | 反方意见 | 处置 |
|---|---|---|---|---|
| A | `extreme_safe` | 公开撤回；sacrificed=schedule；public_attention -10；ar -2 | "赎回计数为何不算中性？" | 赎回是效果，姿态是动作性质，两者可不同向 |
| B | `neutral` | 无计数代价、无公开动作；代价由 risk_unresolved 单独记账 | "牺牲了安全还中性？" | 不作为=观望，与 T1C、T3B 的 hold 标法一致 |
| C | `risky` | 制造不可追溯的灰色空间；risk_unresolved +1 | "ds -1 让账面变好，像 safe" | 账面赎回与性质相反，正是教学内核（§9 攻击 5） |
| D | `extreme_risk` | 双重牺牲（safety+standing）；ds +1；morale -10；真实事故路径 | "与 T3B 同为 hold 却中性？" | T3B 是拖延，D 是公开切割并压制异议；ds+1 与 T5C/T7D/T8D/T9B 同级 |

结果：1 种取值 → **4 种取值，恰好构成 极保守 → 中性 → 激进 → 极激进 的语义梯度**。不是凑档位，是把数据里本就存在的梯度还原到标签上。

---

## 4. 方案

### 4.1 改动一：T6 四档化（P0，唯一必需）

`assets/data/scenarios/challenger_launch.json` → `steps[turn=6].options[*].weight`：

| 选项 | 现值 | 改为 |
|---|---|---|
| A | `neutral` | `extreme_safe` |
| B | `neutral` | `neutral`（不变） |
| C | `neutral` | `risky` |
| D | `neutral` | `extreme_risk` |

**只改 3 个字符串。** 不动 `text` / `consequences_for_player` / `expected_effects` / `behavior` / `goal_axis` / `goal_sacrificed` / `situation`。理由：文案改动会同时踩 `gate-scenario-lexicon` 禁用词与 `api-scenario-parity` §3.2 文案漂移口径，收益为零、面扩大。

### 4.2 改动二：选档确定性加固（P0，与改动一同批）

`scripts/pressure-tier.mjs` 的 `pickByPosture` 目前只在**兜底分支**用了 `stableById`，正常分支仍 `opts.find(...)`。当某回合存在多个同档位选项（实测 T4 的 A/B、T7 的 A/B、T9 的 C/D 都是两个 extreme_safe），`find` 取到哪个取决于洗牌顺序 → **同一 posture 每次跑出的计数不同**。

改法（3 行）：

```
const pickByPosture = (opts, posture) => {
  const norm = (o) => String((o && o.weight) || '').toLowerCase();
  const ordered = stableById(opts);        // 新增：先按 _orig_id 定序
  const want = posture === 'safe' ? [...] : [...];
  for (const w of want) {
    const hit = ordered.find((o) => norm(o) === w);   // 改：从 ordered 里找
```

**这是本方案的技术增量，且比改数据更接近根因。** 证据见 §6.2：不加这一句，safe 合计在 0/1 之间跳，而 low 的门槛是 ≤1——**距翻档只差 1**，任何一次 effects 调整或回合增删都可能让它偶发跳到 mid，重演用户最初遇到的那类"偶发失败"。T6 只是这个脆弱性的暴露点，不是它的全部。

### 4.3 改动三：新增结构门禁（P1）

新增 `scripts/gate-posture-coverage.mjs`，纯读 JSON、秒级、无浏览器：

- **L1（全局硬契约）**：五场景每回合 `weight` 去重数 ≥ 2。现状 49/50、T6 一处红 → 修后 50/50。
- **L2（posture 能力契约）**：`POSTURE_SCENARIOS = ['challenger-launch']` 内每回合 safe 侧 ≥1 且 risky 侧 ≥1。**只对声明了 posture 能力的场景生效**，故 climate T9、面馆 T9 不被误伤；将来若把 climate 纳入 posture 对照，门禁会立刻提示"该场景不具备能力"。
- **L3（词表闭包）**：每个 `weight` 必须能映射到 `STANCE_LABELS`，防止新词裸奔成英文徽标。

接入 `verify-all.mjs` 的"秒级失败点"组（紧跟 `gate-scenario-lexicon`），不新增端口、不新增浏览器。

> 不合并进 `gate-scenario-lexicon`：那个门禁失败要改文案，这个门禁失败要改标注，修复动作不同，混在一起会让"红了改什么"变模糊。

### 4.4 保留 `pressure-tier` 的兜底

修完后 `fallbackRounds` 恒空，兜底成"永不触发"路径。**不删**：它是"未来再加零区分度回合"的唯一现场报警器。处置：保留代码，注释角色从"日常路径"改为"异常兜底 + 复发报警"。

### 4.5 不做的事

| 不做 | 理由 |
|---|---|
| 加第 5 个选项 | `gate-scenario-lexicon` 断言每步 4 选项，会红 |
| 改 T8A / T9A 的 neutral | §3.2 口径已能解释，且不违反 L1 |
| 改 C 的 `ds -1` | 会连带改【代价清算】文本、risky 档位余量、揭示面板入选集合，且破坏"账面变好、性质更糟"的教学设计 |
| 改 T6 文案 | 踩禁用词门禁与文案漂移口径 |
| 放宽任何现有断言 | 本次只应"变绿"，不应"变宽" |
| 同步 api-server 的 S1 字段 | `api-scenario-parity.md` §5 已明确不做 |

### 4.6 可选同步（P2，需拍板）

`api-server/data/scenarios/challenger_launch.json` 的 T6 同 3 个 `weight`：

- 支持：`weight` 是前后端共有字段（200/200），不属 parity 文档里"不同步"的 S1 清单；只改前端会让"万一开 API"时同回合出现两套档位，而 §4 整改清单里没有 weight 这一项，问题会被漏掉。
- 反对：§5 的处置决定是"不做反向同步"，会产生一笔与主线无关的 diff。
- 建议：独立一笔提交，与主线解耦。**当前默认不改。**

---

## 5. 改动清单

| # | 文件 | 改动 | 优先级 |
|---|---|---|---|
| 1 | `assets/data/scenarios/challenger_launch.json` | `steps[turn=6].options[A/C/D].weight` | P0 |
| 2 | `scripts/pressure-tier.mjs` | `pickByPosture` 加 `ordered` 定序（3 行） | P0 |
| 3 | `scripts/gate-posture-coverage.mjs` | 新增 L1/L2/L3 | P1 |
| 4 | `scripts/verify-all.mjs` | STEPS 加 1 条（秒级组） | P1 |
| 5 | `api-server/data/scenarios/challenger_launch.json` | 同 3 个值（独立提交） | P2 |
| 6 | `dist/failure-logic-standalone.html` | 由 `npm run build` 重建，不手改 | 流程产生 |

`pressure-tier.mjs` 既有的 `stableById` 兜底修复与端口冲突拦截**保持不动**。

---

## 6. 验收（跑通全流程）

### 6.1 命令序列

```
# 0. 改动前复现缺口（预期 L1 红：T6 零区分度）
node scripts/gate-posture-coverage.mjs

# 1. 改 assets 的 3 个 weight；改 pressure-tier 的 pickByPosture

# 2. 结构门禁（预期 PASS：L1 50/50）
node scripts/gate-posture-coverage.mjs

# 3. 确认未改坏文案与结构
node scripts/gate-scenario-lexicon.mjs

# 4. 核心：因果对照（预期见 §6.2 精确值）
node scripts/pressure-tier.mjs --verbose

# 5. UI 与徽标
node scripts/s0-education-tdd.mjs
node scripts/probe-choice-gate.mjs

# 6. 复盘同源
node scripts/debrief-assert.mjs

# 7. 重建单文件产物
npm run build

# 8. 全量
npm run verify
```

### 6.2 预期输出（实跑已确认的精确值）

前提：改动一 + 改动二都已生效。因加了定序，以下数值为**确定值，不再是概率值**。

`pressure-tier --verbose` 应打印：

```
safe  → tier=low  counters {accepted_risks_count:0, dissent_suppressed_count:0}
risky → tier=high counters {accepted_risks_count:10, dissent_suppressed_count:9}
无档位回合 safe : 无
无档位回合 risky: 无
safe  段：前九回合接受风险 0 次、压制异议 0 次（合计 0）
risky 段：前九回合接受风险 10 次、压制异议 9 次（合计 19）
```

决策串（10 回合 `_orig_id` 序列，可作回归比对基线）：

| | 现状 | 方案 |
|---|---|---|
| safe | `AACAAAABCB` | `AACAAAABCB`（逐位不变） |
| risky | `BBDCC**A**DCBB` | `BBDCC**D**DCBB`（仅第 6 位变化） |

**这张表是因果分离最硬的证据**：safe 侧 10 位全同（零扰动），risky 侧只有 T6 一位从 A 变 D（原本被迫点 extreme_safe 的反向决策，现在按姿态点到 extreme_risk），结局 id 恒为 `launch_dodged`（不改判）。改动**只影响它该影响的那一个决策点**，没有扩散。

---

## 7. 影响面

| 类别 | 对象 | 变化 | 风险 |
|---|---|---|---|
| 玩家可见 | T6 四徽标 | 中性×4 → 极保守/中性/激进/极激进 | 低（词表既有） |
| 引擎 | `_flChoiceClass` | T6 参与 cautious/bold 统计 | 低，方向正确 |
| 引擎 | `detectRegulationLag` | 窗口非中性数上升，模式可能被正确触发 | 中：属修复副作用，见 §9 攻击 10 |
| 引擎 | `_flProcessLedger` | safe 0/low、risky 19/high（实跑确认） | 极低 |
| 引擎 | `selectKeyDecisionsForReveal` | 入选集合不变 | 无 |
| 文本 | 【代价清算】risky 段 | 8/8 → 10/9 | 无（断言只要求两局不同） |
| 验收 | `pressure-tier` | fallback 恒空、low/high 覆盖、段不同 | 实跑 12/12 通过 |
| 验收 | `gate-scenario-lexicon` | 不受影响 | 无 |
| 验收 | `s0-education-tdd` / `probe-choice-gate` / `debrief-assert` | 自动通过（断言"映射一致/同源一致"，两侧同时变） | 无 |
| 产物 | `dist/*.html` | 重建内联新数据 | 低，须随代码提交 |

---

## 8. 回滚

| 层级 | 动作 |
|---|---|
| 最小 | 还原 `challenger_launch.json` 的 3 个值（单文件 checkout） |
| 只回滚脚本 | 去掉 `ordered`，恢复 `opts.find`（则回到"概率绿"状态） |
| 门禁失效 | 从 `verify-all` 移除该 step，或把 `POSTURE_SCENARIOS` 置空（L1 仍生效） |
| 产品回退 | 退到**方案乙**（§9 攻击 8）：只把兜底目标 A→B，账面污染从 -2 降到 0，但玩家侧仍见四中性 |

---

## 9. 钢铁人思辨记录（四轮，14 条）

### 第一轮：打"你只治了脚本，没治病根"

**攻击 1（最致命）：根因是兜底排序漂移，不是数据。修兜底就够。**
→ 修兜底能让脚本绿，但代价是 risky 局在 T6 执行"正式撤回"，账面从真实 19 压到 16。**脚本绿了，因果反而更不可信。** 实跑证据见 §2.2。不采纳"只修兜底"。

**攻击 2：`≥2 种 weight` 是充分条件吗？**
→ **采纳并修正（v1.0→v1.1）。** 反例：标成 `[extreme_safe, extreme_safe, neutral, neutral]` 去重 2 种，满足 L1，但 risky 侧仍要兜底 → `fbSig` 两局不等 → 脚本红。故契约必须拆两级：L1 通用区分度、L2 posture 场景双侧齐备。

**攻击 3：只补 safe 一侧行不行？**
→ 已实测为反例：risky 局兜底到 B（与 safe 局的 A 不同）→ `fbSig` 不等 → 立刻红。**"两侧都补"从偏好升级为硬约束。**

### 第二轮：打"标注是否自洽"

**攻击 4：A 标 extreme_safe，可 T8A/T9A 同样 defer+赎回却标 neutral——只改 T6 制造新不一致。**
→ **采纳并补口径（v1.1→v1.2）。** 判据是"撤回 ≠ 延后"：T6A 改变决策程序状态并公开承担（public_attention -10、budget +8%），T8A/T9A 只延后时点。该口径同时解释三处、不要求改 T8/T9。

**攻击 5：C 标 risky，但效果是 ds -1（账面变好）。标注与记账方向相反，玩家会觉得系统在骗人。**
→ **接受为"已知张力"，不改数值。** weight 描述动作性质，effects 描述账本；"最有人情味的选择反而埋下最大的雷"正是本项目教学内核。改 ds -1 会连带改清算文本、risky 档位余量、揭示面板入选集合。

**攻击 6：凭什么说 weight 不是从 behavior 推出来的？会不会只是没找到规则？**
→ §3.1 用否证表回答：defer 9 次散落 extreme_safe/neutral，cut_cost 4 次散落两端。映射不唯一 = 无可推导函数。这是**否定式证据**，比给一条规则更硬。

### 第三轮：打"是否过度设计 / 有无更简方案"

**攻击 7：为 4 个字段就加门禁 + 改 verify-all + 可能改后端 + 重build，是否过度？**
→ **采纳，改分层交付**（§5）：P0 两项必做；P1 门禁防复发；P2 后端保险。主线收益全部由 P0 兑现。

**攻击 8：有没有更省事的方案？**
→ 找到两条并对比：

| 方案 | 做法 | risky 账面 | 玩家可见 | spec 2.1 | 改动面 |
|---|---|---|---|---|---|
| 甲（本方案） | T6 四档化 + 选档定序 | 19（真实） | 四档徽标 | 满足 | 3 字符串 + 3 行 |
| 乙 | 仅把兜底目标 A→B | 18 | 仍是四个中性 | **仍违反** | 1 行 |
| 丙 | T6 加第 5 个选项 | — | — | — | **被结构门禁否决** |

乙只治脚本不治产品，不满足"场景无缝接入"。→ 主方案维持甲，乙降为回滚路径（§8）。

**攻击 9：T6 是模式揭示回合，给"极激进"徽标等于当场点名，会剧透，破坏"局内只给观察不给命名"。**
→ 风险真实但**非本次引入**：T5/T6/T8/T10 都是揭示回合，T5 早已混标 extreme_safe 与 risky，spec 2.1 又要求徽标常显。逐条核对 `gate-scenario-lexicon` BANNED 词表，徽标（极保守/激进）属**姿态刻度**而非**诊断命名**（Dörner / F1–F8 / 确认偏误），两套口径分界清晰。→ 不改，登记为观察项（§10）。

**攻击 10：改完 `detectRegulationLag` 可能多触发模式揭示，会不会让某些种子终局变样、打红别的脚本？**
→ 可能，且是**修复的正确副作用**（此前输入被 T6 稀释）。处置：以 `npm run verify` 全绿为判据；若某脚本因此红，说明它断言了实现细节，应改断言而非回退数据。

### 第四轮：打"你的绿是不是概率绿"

**攻击 11（本轮最重要）：你说改完就绿——可它每次跑都一样吗？**
→ **不追问就答不出来，追问后发现真问题（v1.2→v1.3）。** 12 次实跑：

| 组别 | 选档方式 | safe 合计 | risky 合计 | fallback | 决策串可复现 |
|---|---|---|---|---|---|
| 现状 | 现行（洗牌敏感） | **0 或 1**（7:5） | **15/16/17** | 恒 1+1 | 否 |
| 现状 | 加 `ordered` 定序 | 0 ×12 | 16 ×12 | 恒 1+1 | 是 |
| 方案 | 现行（洗牌敏感） | **0 或 1**（5:7） | **17/18/19/20/21** | 恒 0+0 | 否 |
| 方案 | 加 `ordered` 定序 | 0 ×12 | 19 ×12 | 恒 0+0 | 是 |

两条结论：
1. **只改数据，验收仍是"概率绿"**：safe 合计在 0/1 之间跳，而 low 门槛是 ≤1——距翻档只差 1。
2. **根因是"同档位多选项 + `opts.find` 受洗牌影响"**（T4 的 A/B、T7 的 A/B、T9 的 C/D 都是两个 extreme_safe），兜底修复只处理了"无档位回合"，没处理"多档位同档"。→ 于是新增改动二（§4.2）。

**攻击 12：safe 决策串改前改后逐位相同，是不是说明 safe 侧修复无效、纯属运气？**
→ 恰恰相反，这是**预期的最小影响面**。safe 侧原兜底到 A，而 A 的语义本就是 extreme_safe；新标注后仍选 A → 决策不变是正确的**不变量**。改动只应影响 risky 侧（原本被迫点反向决策）。"safe 零扰动 + risky 仅第 6 位变化"证明改动没有副作用扩散。

**攻击 13：risky 涨到 19，会不会让 mid 档永远不可达？**
→ posture 极值对照本就只测两端，mid 由 `shadow-outcome`（200 局）覆盖。不影响。

**攻击 14：你最初引用的"ar=10/ds=9"和后来"ar=9/ds=10"对不上，是不是编的？**
→ 都是真实跑的，差异正来自攻击 11 的洗牌敏感（同一 patch 数据，`opts.find` 命中不同同档位项）。**这件事本身就是"复算/单次实跑都不能当结论"的活证据**，也是把定序列为 P0 的理由。文档内所有关键数字已改为 12 次批量实跑结果。

---

## 10. 遗留与后续（不在本次范围）

1. **T8A / T9A 的 neutral**：按 §3.2 判为"时间性推迟"，保持。若产品要求"任何赎回型选项都显式标档"，需统一治理 3 处并重跑全量。
2. **climate T9 无 safe 侧**：当前 posture 对照只覆盖 challenger，不违反 L2。若将来纳入，L2 会立刻报警。
3. **前后端 weight 同步**：见 §4.6，待拍板。
4. **`_flChoiceClass` 的启发式兜底**：对非标准词表（面馆/芯片的 aggressive/conservative/moderate/analytical）走 applied_effects 与关键词启发。本次不涉及，但属"双轨制"隐患，建议后续统一词表。
5. **其它场景的 posture 能力**：目前只有 challenger 声明。若扩展到五场景，L2 会逐个报出 climate T9 与面馆 T9 的单侧缺失，需先补数据或显式豁免。

---

## 附录：证据可复现

本文所有数字来自临时目录下的零侵入 harness（不改项目文件，mock `fetch` 指向临时副本）：

- `harness2.js`：复刻现行 `pickByPosture`（洗牌敏感），`MODE=orig|patch`
- `harness3.js`：仅多一句 `stableById(opts)` 定序，其余完全一致
- 每组跑 12 次，读取 `result*.json` 汇总

复现口径：`MODE=orig node harness3.js` 12 次应恒得 `safe=0 / risky=16 / fallback=1+1`；`MODE=patch node harness3.js` 12 次应恒得 `safe=0 / risky=19 / fallback=0+0`。若与此不符，先怀疑本机 offline-engine 版本，再怀疑数据。
*（内容由AI生成，仅供参考）*

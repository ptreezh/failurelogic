---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_da4d846acf2a11f19f8752540064ee0f
    ReservedCode1: AqXqJpKjaJnnvJD3UIrAD4nMRA3804VwDyzvLK8WZOSGdooGNts8rnxglngL/IUzhYmUZrriJaL5iMcEgnDKwGWq9t1C7UyJvJUF4Yc3sfxYYq5ZlpXyqPywmbH098I5Mt68R5UBLqrgj0XmX9hpmjO68H13jeL4LQJSH/IVOzxfn4XZprEk+YeOOsg=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_da4d846acf2a11f19f8752540064ee0f
    ReservedCode2: AqXqJpKjaJnnvJD3UIrAD4nMRA3804VwDyzvLK8WZOSGdooGNts8rnxglngL/IUzhYmUZrriJaL5iMcEgnDKwGWq9t1C7UyJvJUF4Yc3sfxYYq5ZlpXyqPywmbH098I5Mt68R5UBLqrgj0XmX9hpmjO68H13jeL4LQJSH/IVOzxfn4XZprEk+YeOOsg=
---

# Grill Round 4 — 独立红队评审与裁定

日期：2026-10-24
执行方式：由独立上下文（无本次对话历史）以红队身份评审 spec v1 + R1/R2/R3，共提 10 条挑战
本文件记录：红队挑战 → 我的验证 → 裁定
权威数据：`docs/spec/grill/pattern-ledger.json`（40 条规则逐条台账）

## 一、最重要的一条：R3 的基数错了，R2 才是对的

红队指我 R3 §0 的"纠正"本身犯了同类错误：我用 `ATOM.findall` 逐原子匹配，**漏掉了 `LITERAL_SYNTAX_RE` 与整串锚定**。

回源码验证（`fl-debrief.js`）：

```js
var ATOM_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*(>=|<=|==|=|>|<)\s*(-?[\d.]+)$/;   // ^...$ 整串锚定
var LITERAL_SYNTAX_RE = /[()\[\]{}"'`（）【】“”‘’]|%|大于|小于|等于|并且|而且|或者|时候|以上|以下/;
if (LITERAL_SYNTAX_RE.test(text)) return null;                                // 命中即判死
```

按这三个正则逐字复算 40 条（结果见 `pattern-ledger.json`）：

| 口径 | 可解析 | 不可解析 |
|---|---|---|
| R2（disposition 表） | 25 | 15（rewrite 15）|
| R3（我的"纠正"） | 33 ❌ | 7 ❌ |
| **权威复算（严格照正则）** | **25 ✅** | **15（atom_shape 8 + literal_syntax 7）** |

**裁定：R3 §0/§1 的 33/40 作废，R3 的 2.5 天成本作废，R2 的 25/15 成立。**
红队判断正确：上一轮我嘲笑"取证脚本会撒谎"，结果自己的纠正脚本反向撒了同样的谎 —— 只验证了语法的一半。

## 二、重构后的真实结构（四层，不是两层）

40 条规则的真实分布（台账逐条可查）：

| 层 | 条数 | 状态 | 修法 |
|---|---|---|---|
| ① 可上屏 | **8** | 可解析且原子齐备（与 disposition 的 derive 4 + derive_runtime 4 吻合） | 无需改动 |
| ② 语法不可解析 | **15** | 8 条 `atom_shape`（表达式不是 `name op number`）+ 7 条 `literal_syntax`（含 `%`/引号/中文比较词） | **改写表达式写法**（文本工作） |
| ③ 可解析但缺原子 | **17** | 引用引擎从不产出的行为计数键（`*_count`、`*_lag`、`chose_*`） | **扩派生层**（代码工作） |
| ④ 场景真缺数据 | 少数（`employee_trust`、`initial_goal_promise` 全库无源） | 需补 effects 或重新标定阈值 | 内容+数据工作 |

**所以不是"一件事"，是三件不同工种的事并行**：改写写、建派生层、补数据。R3 把它们压成"扩派生层"一件事，是错的。

按场景看更刺眼（可解析数/8）：

| 场景 | 可解析 | 其中原子齐备（已可上屏） |
|---|---|---|
| challenger-launch | 2 | 2 |
| chip-ai-supplychain | 6 | 1 |
| climate-change-policy | 7 | 3 |
| enron-collapse | 7 | 2 |
| noodle-shop-community | 3 | 2 |

**challenger 只有 2 条能解析** —— 红队指出的"每场景 ≥3 条可上屏"对它结构性不可达，成立。验收口径必须改。

## 三、被接受的核心缺陷（比"命中少"更严重）

### 3.1 命中与行为时序脱钩（红队第 5 条，最重要）

`build(input)` 取 `input.state`（**终局** game_state），`buildConcepts` 的 `evalState` = 终局 state + 3 个派生键。因此非派生原子全部在**终局一次性求值**：

- 语义上「命中」= 终局数值过了阈值，**不是**「第 N 回合做了符合该规则的事」。
- 伪命中示例：`turn >= 7` 类规则可能被 T8 数值点亮，而相关行为发生在 T3。
- 对教育产品这是硬伤：学员需要「你在 T3 无视了工程师警告」，而不是「终局 ignored_warnings_count=3」。

**裁定采纳，并精确化**：
- **状态类原子**（`share_price_usd`、`co2_ppm`）终局求值**语义正确**，保留，但 UI 需标明"终局状态"而非"你的行为"；
- **行为类原子**（`*_count`、`*_lag`、`chose_*`）**必须回合级求值并带 evidence_turn**，否则派生层做得越厚，伪叙事越多。

这一条把 R3 的派生层设计从"算个数"升级为"算个数 + 记回合"，成本相应上调。

### 3.2 现有验收证据是单策略采样（红队第 4 条）

`scripts/debrief-assert.mjs:63` 明确写着「10 回合，一律选最靠后的一项（最激进）」：

```js
await opts[opts.length - 1].click();
```

所以「5 场景合计命中 1 次」只测了一条确定性策略 —— 可能规则废，也可能这条策略本就没踩坑，**不可分辨**。
更危险：若验收写成"每场景 ≥1 命中"，后续只要写一条"末项连选即触发"的规则就能刷绿，诊断质量为零。

**裁定采纳，且优先级高于修规则**：M0 必须先做**多策略探针**（首项 / 末项 / 中间项 / 随机种子 ×N），输出「场景 × 策略 × 命中」矩阵 + 随机基线对照。没有对照组，任何命中率都不能当验收。

### 3.3 跨局数据其实已经在盘上（红队第 10 条）

`offline-engine.js` 有 5 处 `offline_sessions` 读写（L3220/3223/3244/3351/3354），按 gameId 累积保存完整 `game_state`（含 `decision_history`、`final_outcome`），**无清理与裁剪逻辑**。

**裁定采纳**：P0-B 不新建 `fl.learning.journal.v1` 第二套日志，改为在 `offline_sessions` 上做**聚合视图**（单一真相源），避免双写不一致。

## 四、其余裁定的逐条处置

| # | 红队攻击 | 裁定 |
|---|---|---|
| 1 | R3 基数错 | **采纳**，见 §一 |
| 2 | 6 个"状态派生原子"中 `employee_trust`/`initial_goal_promise` 全库无源，属改写重标定 | **采纳**，归入第 ④ 层，不混入派生层 |
| 3 | 每场景 ≥3 对 challenger 不可达 | **采纳**，验收改为「全局可上屏 ≥15」+「每场景 ≥1」 |
| 4 | 单策略采样，指标可被刷 | **采纳**，M0 前置多策略矩阵 |
| 5 | 终局求值、时序脱钩 | **采纳并升级为核心缺陷**，见 §3.1 |
| 6 | 处置数口径混乱、spec 未同步作废 | **采纳**，以 `pattern-ledger.json` 为唯一台账；v1 的 §2/§3 显式标注作废 |
| 7 | 成本估算无基准、同一任务 0.5–5 天跨十倍 | **采纳**，取消单点估值，改为「档位 + 基准任务校准」，基准取 git 历史同类改动实测 |
| 8 | 玩家侧主指标分母近零、n=3 无统计功效 | **采纳**，降级为描述性统计，不作质量门槛；另立可证伪指标（见 spec v2 §B） |
| 9 | 强制前测门禁制造选择偏差 | **采纳**，改为非阻断 + 缺失记 missing |
| 10 | P1-5 与 E3 自相矛盾；journal 重复建 | **采纳**，门禁改为"可执行依赖中"检查；journal 改为聚合视图 |

**10 条全部采纳，无驳回。** 红队没有提出我无法验证的论断，也没有一条经核查后站不住。

## 五、四轮累计净结论

| 轮次 | 被推翻的旧判断 | 确立的新事实 |
|---|---|---|
| R1 | P0-1「主干无复盘」全错 | 5/5 场景有复盘，`debrief-assert` PASS |
| R2 | 「教育效果未达成」是范畴错误 | 正确表述是「教育效果不可知」；诊断层实测几乎不输出 |
| R3 | 「根因是派生层太薄」基数错、成本低 | 方向对，但需拆成三件工种；成本重估 |
| R4 | 我自己的 R3 数字、以及现有验收证据 | 真实结构是 8/15/17/少数 四层；时序脱钩；单策略采样不可验收 |

**经过四轮，v1 里 P0-1～P0-4 四条 P0 只剩 0 条原样成立。** 这不是筛得松，是 v1 的取证方法（grep 计数 + 单路径推测）系统性失效。spec v2 必须建立在「运行时证据 + 权威台账 + 多策略对照」三条之上。
*（内容由AI生成，仅供参考）*

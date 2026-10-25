---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_464b309fce9911f1a22e52540064ee0f
    ReservedCode1: uNkOAPFXqkey558Mrs5zlVPqTW+r7A0TtRwLUNq/+0sX6J/S2szD0cvYH1yxgrP292fhDm5EthsxL9duiHl1dAvmRimRYHCrs21PeEzY+0rnMWPZW4K+AbQdPRNMzzARbio9PmXLmTn10ui/hESF+WQm9bJjsx9fithofWGOjVPBpwDNoBr0qekmORA=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_464b309fce9911f1a22e52540064ee0f
    ReservedCode2: uNkOAPFXqkey558Mrs5zlVPqTW+r7A0TtRwLUNq/+0sX6J/S2szD0cvYH1yxgrP292fhDm5EthsxL9duiHl1dAvmRimRYHCrs21PeEzY+0rnMWPZW4K+AbQdPRNMzzARbio9PmXLmTn10ui/hESF+WQm9bJjsx9fithofWGOjVPBpwDNoBr0qekmORA=
---

# failureLogic 交互 / 视觉 / 因果可视化迭代规格（草案 v0.1）

> 状态：待审阅，尚未落地实现
> 依据：对 `index.html` + `assets/js/app.js` + `assets/js/offline-engine.js` 的代码走查，以及对 `noodle-shop-community` 场景一局 10 回合的 Playwright 实测截图与 DOM 采样
> 约束：延续"单文件离线、可下载、少而深"的产品形态；不引入构建工具链、不引入外部图表库（纯 SVG/CSS 内联）

---

## 1. 实测诊断（不是推测）

| 观察点 | 实测结果 |
|---|---|
| 单回合状态区 | 11 个 `.state-chip`，只显示当前值（如 `现金流 12,000`），无 delta、无趋势、无历史 |
| 决策反馈 | 文本块 `【数字上的变化】` 用 `↑/↓` + 文字描述（`月营收 68000元 → 88000元（+20000，改善）`），信息完整但**没有视觉编码** |
| 延迟后果 | 只给一句 `你有 1 个延迟后果尚未显现`，**不告知来源回合与触发条件**，玩家无法建立因果感 |
| 越线提示 | `⭐ 平台评分跌破 4.2` 仅一行文字，无阈值可视化 |
| 终局 | 全文仅 555 字符：终局标题 + 4 行结局 + 反思段 + 3 个教学问题；**无决策轨迹、无根因结构、无指标走势** |
| 可视化程度（视觉评估 1–5） | 第 1 回合 1 分 / 反馈页 2 分 / 终局 1 分 |
| 交互成本 | 每回合需鼠标点击 + 滚动（情境卡 + 理由框 + 4 选项纵向排布）；无键盘快捷键；无进度保存 |

结论：内容层已经很强（Dörner 概念、延迟后果、改写结局检测都在），**缺的是"把已有数据翻译成视觉结构"**。因此这一轮迭代的边际收益主要在表现层，而不是再加剧情。

---

## 2. 数据充足性核查（决定可视化能做到多深）

| 需要的数据 | 现状 | 缺口 |
|---|---|---|
| 每回合决策 + 效果 | `state.decision_history[]` 已有 `turn / option_id / option_orig_id / option_text / option_weight / applied_effects / justification` | 无 |
| 延迟后果来源 | `expected_effects[*].consequence_deferred_queue` 入队，结算后仅改计数器（`ignored_warnings_count` 等） | **结算时未记录来源回合**，无法连线 |
| 状态走势 | 无 `state_history` | **需新增每回合快照** |
| 利益相关者 | JSON 已有 `stakeholders[]`（id/name/concern/stance） | UI 未使用 |
| 概念映射 | JSON 已有 `dornerLessons[8]`、`dorner_quotes[]`、`feedback_patterns` | 终局未做"决策 → F1–F8"的归因 |
| 结局分支 | `outcome_endings` + 改写结局检测已有 | 终局未展示"本应属于哪个结局"的路径对比 |

结论：**三处引擎小改（快照 / 延迟后果台账 / 概念命中）即可支撑全部可视化**，无需重构。

---

## 3. 分档方案

### V1 · 看得见变化（表现层，不改引擎）

| 项 | 设计 |
|---|---|
| 指标 delta 徽标 | 每回合状态 chip 追加 `+20,000 / -2,200` 徽标，涨绿跌红（沿用 `data-* + CSS ::after` 做法，**不污染 innerText**，保护 V2 文本指纹断言） |
| 指标走势 | chip 下方加宽 40px 的 `<svg>` sparkline，画该指标**全部已走回合**的折线；悬浮显示数值 |
| 阈值可视化 | 有安全线的指标（平台评分 4.2、现金流 0、疲劳 80）chip 内加细进度条 + 红区刻度，越线时 chip 变红并给 `⚠` 图标 |
| 变化归因 | 反馈区 `【数字上的变化】` 从纯文本改为 3 列小卡：指标 / 箭头徽标 / 变化量 + 一句原因；保留原文供复制 |
| 选项卡信息 | 选项 `weight`（aggressive/moderate/conservative/analytical）用 ::after 徽标直显，减少"读全文才能判断倾向" |
| 交互 | 键盘 `A/B/C/D` 选择、`Enter` 提交、`←/→` 翻看历史回合；理由框 `Ctrl+Enter` 提交 |
| 移动端 | 状态区横向滑动 + 选项单列全宽，首屏一屏内完成"读情境 → 点选项" |

预期视觉效果：3.5/5；改动集中在 `app.js` 渲染函数 + `main.css`，引擎零改动。

### V2 · 看得见因果（引擎 + 表现层）

| 项 | 设计 |
|---|---|
| 单回合因果链 | 反馈区画一条横向 SVG 链：`T1 决策B` → `直接效应(月营收+1万)` → `延迟后果(平台抽成挤压)` → `T5 显现`；已触发节点实线，未触发节点虚线 + "待显现" |
| 延迟后果台账 | 引擎结算延迟后果时补记 `deferred_ledger.push({ source_turn, key, effect, resolved_turn })`，作为连线数据源 |
| 因果时间轴 | 右侧固定面板（可折叠）纵向时间轴，每回合一个节点：决策缩写 + 净效应 + 触发的延迟后果箭头；点击节点回看该回合完整信息 |
| 揭示升级 | T5/T6/T8/T10 的揭示面板改为"证据 → 偏差"配对卡：左边是玩家当时的原话/选择，右边是 Dörner 概念名与定义，中间一个箭头与命中理由 |
| 未实现后果提示 | 结束时列出"还在队列里没来得及显现的后果"，强化时间延迟感 |

预期视觉效果：4/5；需改 `offline-engine.js` 约 30 行 + 新增 1 个渲染模块。

### V3 · 看得见根因（终局重构）

| 项 | 设计 |
|---|---|
| 根因树 | 终局 SVG 三层树：`结局(招牌摘了)` ← 3–4 条主因链 ← 每条链挂 2–3 个"具体决策节点"(T1/T4/T8)`；节点可点击跳回该回合 |
| 概念命中统计 | 由 `decision_history` 的 weight/concerns 聚合出 F1–F8 命中次数，横条图 + 命中最高两项高亮 |
| 路径对比 | 与 `outcome_endings` 中"本应属于"与"实际"两个结局并排：指标终值对照表 + 分叉发生在第几回合 |
| 利益相关者 | 4 个 stakeholder 的 `concern` 满足度雷达（由状态变量映射），显示"谁被牺牲了" |
| 反事实 | 列出"本局最致命的 3 个决策"：按该决策对终局负债/口碑的边际贡献排序，给"如果当时选 X"的一句话对照 |
| 复盘导出 | 生成一页可保存的复盘长图（Canvas/SVG → PNG dataURL，离线可用），便于课堂使用 |

预期视觉效果：5/5；新增 1 个终局渲染模块（约 400 行），引擎补 `dorner_hits` 聚合。

---

## 4. 建议节奏

1. **V1 一次做完**（纯表现层，风险最低，收益最直观，可独立回滚）。
2. **V2 分两步**：先补引擎台账 + 单回合因果链，再做时间轴面板。
3. **V3 作为独立 milestone**，先只做根因树 + 概念命中，路径对比与复盘导出留到下一轮。

每档都以"可独立回滚 + 探针可量化"为前提。

---

## 5. 验收标准（新增探针 `viz-assert.mjs`）

| 断言 | 判据 |
|---|---|
| delta 徽标 | `.state-chip` 带 `data-delta` 的数量 == 本回合 `applied_effects` 中被显示的指标数 |
| sparkline | 每 chip 内 `polyline` 的点数 == 已走回合数 |
| 阈值条 | 越线指标 chip 含 `is-breach` 类，且与 `applied_effects` 判定一致 |
| 因果链 | 反馈区 `.causal-chain` 节点数 == 1（决策）+ 直接效应数 + 该决策入队的延迟后果数 |
| 延迟台账 | 走满 10 回合后 `state.deferred_ledger.length` ≥ 1，且每条 `source_turn < resolved_turn` |
| 终局根因树 | `.root-cause-tree` 主因链节点 == 3~4，叶子决策节点全部能在 `decision_history` 中找到对应 turn |
| 文案回归 | 既有 V2 指纹（首选项 innerText）逐字节不变；`verify-all` 保持 14/14 |
| 单文件产物 | 重建后 `dist/failure-logic-standalone.html` 内不再有任何外部 `http(s)` 引用 |

---

## 6. 风险清单

| 风险 | 应对 |
|---|---|
| `app.js` 594KB 单文件，改动易连带破坏渲染断言 | 新增样式一律走 `data-*` + `::after`，不动 `innerText`；每次改动后跑 `ui-render-assert.mjs` |
| 工作区当前不干净（`.gitignore`、若干 md 删除、climate JSON 改动未提交） | 开工前先 `git stash` 或单独 commit，保证本迭代可独立回滚 |
| SVG 在单文件内联体积增长 | 图表复用同一套 `<svg>` 生成函数，路径数据由 JS 运行时计算，不预生成 |
| 视觉加密后首屏变长 | 状态区默认 compact（仅当前值 + 迷你条），sparkline 仅在悬浮/展开时显示完整版 |
| 移动端性能 | sparkline 点数上限 10，无动画依赖 `requestAnimationFrame` 批量绘制 |

---

## 7. 待你确认的选择

- 是否按 `V1 → V2 → V3` 顺序推进，还是先只做 V1 看效果再定后续？
- 视觉基调：沿用现有深色卡片风，还是为"因果/根因"新增一套强调色（建议新增 1 个强调色，不推翻现有主题）？
- 终局复盘是否需要"导出 PNG"（课堂/分享场景有用，但会增加约 80 行代码）？
*（内容由AI生成，仅供参考）*

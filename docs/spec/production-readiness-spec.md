# failureLogic 生产就绪规格（Spec v1）

> ⚠️ **本文档已被 `production-readiness-spec-v2.md` 取代（2026-10-24）。**
> 经四轮钢铁人思辨核验（`docs/spec/grill/R1–R4`），本文件的 §2 全部 P0 条目、§3 根因结论、§7 成本估算**均已作废**：
> - P0-1「主干无复盘」**证伪**：5/5 场景均已挂载 debrief，`debrief-assert.mjs` PASS
> - P0-3 降为待查、P0-4 与 P1-1 降为 P2
> - §1 的量化盘点（18 个零引用 JS / 394 KB / 无障碍为 0）经复算**成立**，予以保留
>
> 仅作历史留档，请勿据此执行。

| 项 | 值 |
|---|---|
| 文档性质 | 收敛规格（不是功能设计稿），用于拍板后落地 |
| 基线 | 仓库 `D:\AIDevelop\failureLogic`，`dist/failure-logic-standalone.html` 单文件交付 |
| 取证日期 | 2026-10-24 |
| 取证方式 | 代码级 grep + Node/Python 脚本断言，不采信 `docs/`、`.qwen/` 中的自述报告 |
| 上游输入 | 本会话《整体状态盘点报告》P0–P2 15 条（**本 spec 已修正其中 4 条错报**） |
| 结论可信度 | 每条差距附「可复现命令 + 验收断言」；未取证项显式标注「待核」 |

---

## 0. 上游报告的自我纠错（本轮核验推翻了 4 条）

写 spec 前先打自己脸。上一轮盘点有 4 条结论经代码核验不成立或表述失真，若不修正，规格会把工程资源投到假问题上。

| # | 上游原结论 | 核验实测 | 处置 |
|---|---|---|---|
| E1 | 移动端 0 适配 | `assets/css` 共 **35 个 `@media` 块 / 21 个 max-width 断点**（240–1200px）；JS 侧有 `matchMedia`×3、`innerWidth`×2、`orientationchange`×1、`visualViewport`×3、`touchstart`×3 | **降级**：不是零适配，是「适配分散无统一策略 + 专门模块 `mobile-adaptation.js` 未接」。移入 P2 |
| E2 | 无前测/后测（依据：全库搜不到 pretest） | `assessment` 在 `app.js` 命中 100 次，**全部是游戏内数值字段 `ai_capability_assessment`**，非教育测评；`前测/后测` 仅出现在 `.qwen/` 报告与 `archive/` 中 | **成立但改写**：项目无「测量学意义上的前后测」，而非「搜不到关键词」 |
| E3 | dist 含 localhost/onrender 僵尸地址（运行时隐患） | 命中处均为**已注释的候选地址**，且 `api-config-manager` 内已有 `P0 #9` 注释说明「单文件离线版不探后端，曾产生 CORS」 | **降级**：是死分支/注释残留，P2 清理项，不是运行时故障 |
| E4 | debrief 未接线 | `index.html` **已加载** `fl-debrief.js?v=20261023-v3`；`challenger-router.js` 有 7 处 `FLDebrief` 调用并 `mount`；但 `app.js` 中 `debrief` 出现 **0 次**，主干 3 处 `renderEndingPage()` 均无 debrief 宿主 | **升级并精确化**：复盘只覆盖挑战者支线，主干玩家看不到 → P0-1 |

**教训**：上一轮把「文件存在但未被引用」直接等价于「能力为零」，方向对但粒度太粗，导致高估了移动端缺口、误判了 dist 故障。本 spec 所有条目重做三分类。

---

## 1. 死代码三分类（决定优先级，决定动不动手）

全库零引用 JS 共 **18 个 / 394KB**（统计口径：`assets/js/*.js` 文件名 stem 在其他 `.js/.html/.mjs` 中零出现；已排除 `.git/node_modules/SemIf/archive/dist/tmp`。**局限**：不支持动态拼接 import 的识别，本项目 `page-router-base.js` 仅 1.7KB 无动态加载，故该口径当前有效）。

| 类 | 定义 | 条目 | 体量 | 处置 |
|---|---|---|---|---|
| **B 类：写好了但没接线** | 有完整实现、有设计意图、对应产品核心主张，生产路径零调用 | `time-delay-model.js`(25KB, 2026-03)<br>`cognitive-bias-diagnosis-core.js`(26KB)<br>`awakening-moment-system.js`(23KB)<br>`mobile-adaptation.js`(35KB)<br>主干 debrief 缺失（模块已接，路径未接） | 109KB + 主干路径 | **P0/P1，必须处理**：这是产品承诺未兑现，不是垃圾 |
| **A 类：旧架构脚手架** | 依赖 `/api/*` 后端或多页路由，与「离线单页」定位冲突 | 9 个 `*-router.js`：historical-cases(66KB)/financial-crisis/investment-information-processing/climate-change/personal-finance/public-policy/business-strategy/love-relationship/exponential-page(20KB)<br>+ performance-monitoring/api-fallback-manager/error-toast/loading-manager/user-storage 等 | ~285KB | **P2，归档清理**：不恢复 |
| **C 类：新模块已接但覆盖不全** | 已接线，覆盖范围小于宣称 | `fl-debrief.js` 仅接 challenger 支线 | — | **P0-1** |

**关键证据**：`historical-cases-router.js` 内 `SCENARIO_DATA_URL = '/api/historical/scenarios'`，后端已降级为可选，该类模块在当前架构下**天生不可运行**。

---

## 2. 差距清单（重排后）

### P0 — 阻断「认知偏见教育」这一核心主张成立

#### P0-1 主干终局无复盘：玩家走完一局什么都得不到

**证据**
- `index.html` 加载 `fl-debrief.js`（43KB，1189 行，V3 完整实现）
- `challenger-router.js:1253` `_mountDebrief()`：找 `[data-fl-debrief-host]` → `window.FLDebrief.build({state, scenarioConfig, scenarioData})` → `buildConcepts` → `mount`
- `app.js` 中 `debrief` 字符串 **0 次**；`gameOver` 80 次（仅用于判定 `resources<1000` 等终止条件与 `gameOverReason`）
- `app.js` 存在 **3 处 `renderEndingPage()` 定义**：L2330、L3263、L8301

**影响**：V3 已交付的「看得见根因」能力，对主干场景玩家 100% 不可见。这是「教育闭环未接通」最锐利的一刀——不是缺功能，是功能被落在门外。

**可复现命令**
```bash
# 应为 0，现状 0（证明主干没接）
grep -c -i debrief assets/js/app.js
# 应为 3，现状 3（证明接线点歧义）
grep -n "renderEndingPage()" assets/js/app.js
```

**修复要点**（低成本，因契约已现成）
1. 先统一 3 处 `renderEndingPage()`（见 P1-1），再在其中输出 `<div data-fl-debrief-host></div>`
2. 确保 `window.OfflineEngine._flScenarioData[scenarioId]` 在主干场景下可用（当前仅 challenger 侧填充，**待核**）
3. 终局后调用 `_mountDebrief` 等价逻辑

**验收断言**
- A1.1 `app.js` 中 `FLDebrief` 出现次数 ≥ 3（build / buildConcepts / mount 各一）
- A1.2 headless 跑完 3 个主干场景至 `gameOver=true`，终局 DOM 存在 `[data-fl-debrief-host][data-mounted="1"]`
- A1.3 `[data-fl-db-export]` 按钮存在且点击后产出 `image/png`（Canvas 导出，不依赖网络）
- A1.4 断网状态下上述 A1.2/A1.3 仍通过（离线是硬约束）

---

#### P0-2 无学习测量：教育效果无法被证明

**证据**
- 全库无 pretest/posttest；无跨局纵向记录结构；`user-storage.js`(6KB) 零引用
- `cognitive-bias-diagnosis-core.js` 内含「学习效果追踪」设计意图，但文件零引用

**影响**：这是「教育效果达成」缺口的总根。没有基线测量，"偏见改善"只是叙事，不是事实。

**修复要点（最小闭环）**
1. 首局前：5–8 题偏误觉察量表（自建），存入 `localStorage` 单一命名空间
2. 每局终局：后测同构题组
3. 跨局：记录 `{scenarioId, round, pre, post, conceptHits, date}` 序列
4. 一页「我的偏见画像」：只展示有数据支撑的维度，无数据处留空不编

**验收断言**
- A2.1 首局进入前必须先出前测；跳过则终局页不出现（强制）
- A2.2 终局后测题组 ≥3 题，且与 pre 维度一一对应
- A2.3 `localStorage` 键 `fl.learning.journal.v1` 存在且为合法 JSON 数组，长度随局数线性增长
- A2.4 画像页渲染的每个数值都能在 journal 中找到来源索引（禁止编造统计）

---

#### P0-3 延迟代价在主干不成立

**证据**：`time-delay-model.js`(25KB) 仅被 `tests/unit/master-test-runner.js` 引用；`app.js` 内延迟逻辑走的是自有 `delayed_effects` / `applyPendingDelayedEffects()`（L1418/L1425/L1971），与模型无耦合。

**影响**：《失败的逻辑》核心命题是「错误决策的代价延迟出现」。若主干用简化版 `delayed_effects` 而模型另有 25KB 实现，则产品的理论主张与代码事实两张皮。

**修复要点**：判定二选一（决策点 D3）——(a) 把 `time-delay-model` 收敛进主干结算；(b) 删模型、承认 `delayed_effects` 为唯一实现并补文档。**禁止**长期并存。

**验收断言**
- A3.1 二选一后：`time-delay-model.js` 要么被 `app.js` 引用（≥2 处），要么文件不存在
- A3.2 主干任一场景至少 1 次「延迟代价在终局才显现」可被 debrief 的代价清算段列出

---

#### P0-4 偏见诊断与觉醒系统：两个 20KB+ 模块零引用

**证据**：`cognitive-bias-diagnosis-core.js`(26KB)、`awakening-moment-system.js`(23KB) 全库引用 0（**连测试都不引用**，比 `time-delay-model` 更彻底）。

**影响**：二者正对应 P0-2 的测量与反馈环节。它们不是重复建设，是 P0-2 的现成零件。

**修复要点**：P0-2 落地时优先复用，禁止从零重写；复用后若仍有死区，再决定删除。

**验收断言**
- A4.1 P0-2 完成后，`cognitive-bias-diagnosis-core.js` 引用数 ≥1，或文件已删除且 `docs/` 有删除决策记录
- A4.2 同类：`awakening-moment-system.js`

---

### P1 — 结构性风险与工程门禁

| 编号 | 问题 | 证据 | 验收断言 |
|---|---|---|---|
| P1-1 | `renderEndingPage()` 三处重复定义 | `app.js` L2330 / L3263 / L8301 | 定义数 = 1，且由场景类型分支而非重复实现 |
| P1-2 | 无死代码门禁 | 18 个零引用模块已存在数月无人发现 | CI 增加 `scripts/audit-references.mjs`，零引用数不得增加（基线 18，只降不升） |
| P1-3 | 缓存版本号人工维护 | `?v=20261023-v3`、`?v=20260927-2112` 等手写串，7 个 script 标签各自为政 | 构建时由内容 hash 自动注入，禁止手写 |
| P1-4 | 无障碍近乎为零 | `index.html`：`aria-` × 0、`role=` × 0、`alt=` × 0、`tabindex` × 0；全库 JS 仅 41 处 `aria-` | 主流程可纯键盘完成；交互元素有可读名称 |
| P1-5 | 无失效域名/未引用检查 | dist 注释中 Vercel/Railway/Codespaces 全部已死 | 构建产物不得含 `localhost:8000`、`onrender.com` 等字符串 |

### P2 — 债务清理（不阻断目标）

| 编号 | 问题 | 证据 |
|---|---|---|
| P2-1 | A 类脚手架死代码 | 9 个 router 等，~285KB |
| P2-2 | `app.js` 巨石 | 542KB / 15225 行 |
| P2-3 | 移动端适配分散 | 35 个 @media 散落多文件，无统一断点策略；专用模块未接 |
| P2-4 | 概念可见度折叠 | 40 条 pattern 仅 8 条可上屏（`docs/debrief-pattern-disposition.md`） |
| P2-5 | 调试残留 / `.bak` / dist 死分支 | 待列清单 |

---

## 3. 根因（一句话）

**产出模式病，不是单点遗漏**：`Soul Auto-Evolution` 循环 14 起持续「写模块 + 写测试 + 不接线」，2026-03 产出 4 个模块（109KB）至今零引用，V3 的 debrief 复刻了同一模式（模块接了、主干没接）。

**推论**：只修 P0-1 会再次复发。**P1-2（门禁）必须与 P0 同期上线**，否则下一轮进化继续产生死代码。这是本 spec 与「列个待办清单」的根本区别。

---

## 4. 里程碑（按依赖排序，非按重要度）

| 里程碑 | 内容 | 预估 | 前置 | 出口条件 |
|---|---|---|---|---|
| M0 | 统一 `renderEndingPage` + 主干接 debrief | 1–1.5 天 | 无 | A1.1–A1.4 全绿 |
| M0' | CI 门禁：零引用计数 + 失效域名 | 0.5 天 | 无（可与 M0 并行） | 基线 18 锁定，构建产物无僵尸域名 |
| M1 | 前后测最小闭环 + 偏见画像页 | 2–3 天 | M0（复用 debrief 出口） | A2.1–A2.4 全绿 |
| M2 | 延迟模型二选一收敛 | 1–2 天 | 决策点 D3 | A3.1–A3.2 全绿 |
| M3 | 偏见诊断/觉醒系统复用或删除 | 1 天 | M1 | A4.1–A4.2 全绿 |
| M4 | P1-4 无障碍 + P2 清理 | 2–3 天 | M1–M3 | 键盘可通关；零引用 ≤ 基线 |

**关键路径**：M0 → M1。M0 是小工程大收益（契约现成），M1 才真正补齐教育闭环。

---

## 5. 待你拍板的决策点

| # | 决策 | 选项 | 建议 |
|---|---|---|---|
| D1 | 9 个 `*-router` 场景（历史案例/金融危机/气候/理财/公共政策/商业战略/亲密关系/投资信息/指数页） | (a) 归档删除 (b) 改造为离线数据接入 | **(a)**：依赖 `/api/*`，与离线单页定位冲突；内容多不等于可交付 |
| D2 | 前测量表来源 | (a) 自建 5–8 题（快、可控、可信度自证）(b) 引成熟量表（可信度高、需授权/翻译） | **(a) 起步**，但必须写明「非标准化量表，仅用于个体内纵向对比」，避免过度宣称 |
| D3 | `time-delay-model` 去留 | (a) 收敛进主干 (b) 删除 | 取决于 (a) 的实现质量——**需你允许我读该文件做质量判定**后再定 |
| D4 | 「教育效果达成」验收口径 | 需要你给一个可证伪的标准 | 建议：同一用户 ≥3 局后，其「重复同类偏见决策」比例下降，且该结论能在画像页由数据直接读出 |

---

## 6. 明确不做（Non-Goals）

- 不恢复任何依赖后端 `/api/*` 的能力（B 类一律归档）
- 不重构 `app.js` 巨石（P2-2，本 spec 不碰，避免与 P0 抢工期）
- 不为 32/40 折叠的 pattern 补信息密度（P2-4，先解决「有没有」再谈「多不多」）
- 不引入新框架、不做视觉改版

---

## 7. 本 spec 的已知局限（等待 grill 轮次打击）

1. `OfflineEngine._flScenarioData` 在主干场景下是否已填充 —— **未取证**，若为空则 M0 需额外补数据通道，工期 +0.5 天
2. 「隐蔽宿主」风险：若 `_mountDebrief` 在 challenger 之外还有别的调用路径（动态字符串），全库 grep 会漏
3. M1 工期 2–3 天为估算，未做任务拆解下的自下而上估算
4. D4 的「偏见决策重复率下降」需要概念命中数据在跨局可对齐，依赖 `option_weight` 等字段是否稳定写入 —— **待核**

---

*文档路径：`D:\AIDevelop\failureLogic\docs\spec\production-readiness-spec.md`*

---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_bb8cdb73cabc11f18e0e52540064ee0f
    ReservedCode1: fAtjB6jpbuS19fUYijt0N0nv36Xb4VYnnDnqgT54jtsIJaLv635iEOXXUWHdnzQFOkl+1mMuoQh65yt+xmkl3agn5ge1Ukh/PpzbyvBZAbhv5WeSkvuKA33vJbHJIh5NcJOhYjljwPT+9rH1qQGYj57Iau+knDOBe4mtm2wMDCs4Eb89lU6fbWrF0xo=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_bb8cdb73cabc11f18e0e52540064ee0f
    ReservedCode2: fAtjB6jpbuS19fUYijt0N0nv36Xb4VYnnDnqgT54jtsIJaLv635iEOXXUWHdnzQFOkl+1mMuoQh65yt+xmkl3agn5ge1Ukh/PpzbyvBZAbhv5WeSkvuKA33vJbHJIh5NcJOhYjljwPT+9rH1qQGYj57Iau+knDOBe4mtm2wMDCs4Eb89lU6fbWrF0xo=
---

# FailureLogic 架构收敛方案（v1）

- 日期：2026-10-18
- 输入：`research/architecture-audit-2026-10-18.md`（真实代码级审计）+ 全网检索（静态托管对比 / 单文件离线 / PWA / local-first 实践）
- 目标：**单用户 / 可离线 / 单网页可下载 / 聚焦失败逻辑教育**，消除 GitHub Pages 上架脆弱环节

---

## 1. 目标与约束（重述）

1. 教育目标：用户在交互中**完整领会失败逻辑要义**（目标漂移、局部优化、延迟效应、非线性、线性外推、确认偏误等），核心载体 = 3 个深度场景（挑战者号 + 老周家牛肉面馆 + 华芯突围/小林的选择 二选一演进）。
2. 使用形态：单用户、可离线、最好"下载一个网页就能用"。
3. 部署形态：简洁、可信、健壮；GitHub Pages 上架曾多次踩坑（CORS、多平台配置、SW 缓存脱节、缩略图 404、后端休眠）。

## 2. 关键判断（来自真实审计）

| 事实 | 含义 |
|---|---|
| 主站运行面仅 14 JS + 3 场景 JSON，其余约 12GB（SemIf 11.6G / tests 98.7M / archived 46.8M）不在运行链路 | 名义仓库与交付物严重脱节，必须收敛 |
| OfflineEngine 已实现纯前端回合推进（会话/回合/状态） | "单网页离线"的技术底座已经存在 |
| app.js 已内置觉醒时刻、认知偏差反馈（detectCognitiveBiases 6 类） | 核心教育链路可完全前端化 |
| SW 缓存清单漏 6 个核心 JS + 全部场景 JSON；缩略图 404；指数页死页 | 现有多文件离线名存实亡，需重构或移除 |
| 后端 FastAPI 提供 12 类偏差分析 / SemIf LLM 增强 | 属"增强"，非"必需"；可降级为可选 |

## 3. 方案选型（头脑风暴）

候选：
- A. 单文件 all-in-one HTML（内联 JS/CSS/场景数据，双击即用）
- B. 多文件静态站 + 修复版 PWA（HTTPS 托管 + 正确 SW）
- C. 本地 FastAPI 单机应用（保留全部后端能力）
- D. 云端全栈（后端 + 前端分离）——当前状态，脆弱

权衡：
- A 最贴合"单网页可下载"，零部署零依赖；代价是打包体积与"开发态可维护性"（590KB app.js 内联后难维护）。
- B 保留模块化开发体验，修复 SW 后离线可用；但 file:// 双击不可用（SW 仅 HTTPS/localhost），需托管。
- C 功能最全（12 类偏差 + LLM），但要求用户有 Python 环境，违背"零门槛"。
- D 是踩坑源头（CORS 白名单、免费后端休眠、多平台并存），必须放弃。

**结论：A 为主交付物，B 为开发态与在线托管，C 降级为可选增强模式。** 即"Local-First 双模架构"：
- 开发/在线：多文件目录（index.html + 模块 JS + 场景 JSON + 修正后 SW），托管于单一静态平台。
- 交付/离线：构建脚本将核心 JS + CSS + 3 个场景 JSON 内联生成 `failure-logic-standalone.html`，双击即玩（全部数据内联，规避 file:// 的 fetch 限制；localStorage 保存进度）。
- 后端：默认不依赖；部署为可选增强（本地 python 启动），前端 API 请求失败即静默走 OfflineEngine（现状已有此回退，改为"离线优先"而非"失败回退"）。

## 4. 目标架构（收敛后）

```
failureLogic/
├─ index.html                     # 开发态入口（多文件）
├─ assets/
│  ├─ css/                        # 9 个（本地，移除 Google Fonts CDN → 系统字体）
│  ├─ js/                         # 仅保留 14 个主站挂载模块 + 前端化偏差检测
│  ├─ data/scenarios/             # 3 个场景 JSON（challenger/climate/enron）
│  └─ images/                     # 补齐缩略图（或移除引用）
├─ sw.js                          # 重写缓存清单：14 JS + 3 JSON + CSS 全量
├─ api-server/                    # 可选增强（保留场景引擎 + 认知偏差 + 反馈）
│  └─ (移除 SemIf 默认模型加载 → 显式 env 开启)
├─ scripts/build-standalone.mjs   # 构建单文件交付物
├─ dist/failure-logic-standalone.html
├─ docs/                          # 收敛后文档集
├─ research/                      # 审计报告 + 本收敛方案
└─ archive/                       # 历史轮次归档（非删除，防误删脉络）
```

## 5. 清理执行清单（分三级）

### 5.1 立即删除（无运行/开发价值，delete 工具确认卡片已列出）
- `archived-scenarios/`（46.8 MB 旧场景杂物）
- `cloudflare-worker/`（无源码）
- `auto-deploy-system/`（废弃部署辅助）
- `assets/js/` 孤儿 27 个（审计 §3.2 全清单）
- `test_coffee_shop_deep.html`、`test_coffee_shop_manual.html`
- `minimal-styles.css`、`test-output*.txt`（4 个）
- `docs/` 历史审计与执行记录（audit-2026-09-07、audit-scenario-depth-2026-09-08、audit-challenger-deep-dive/、challenger-v2.1-execution-plan、challenger-retrospective、climate-change-plan、climate-change-grilldown、enron-grilldown）
- 根目录历史文档（DEEP_FAILURE_LOGIC_REDESIGN.md、ULTIMATE_REDESIGN.md、tasks.md、task_plan.md、findings.md、QWEN.md、WARP.md）

> **明确保留**：3 份新场景设计文档（scenario-design-new-china/chip-ai-supplychain/ai-skill-investment）——它们是"做深 3 个场景"的落地蓝图，不是废弃文档。审计报告将其列为可删，主 Agent 判断否决。

### 5.2 移入 archive/（保留审计脉络，不删除）
- `research/round-01..10`、`remediation-round-01..03`、`ROADMAP.md`、`REMEDIATION_SPEC.md`

### 5.3 待用户决策（B 级）
- `SemIf/`（11.6 GB）：采用纯单网页方案后整目录可删；若保留可选增强则移出仓库（external/）
- `tests/`（98.7 MB）：裁剪为轻量核心集或移出仓库
- `workbuddy-package/` + `WORKBUDDY_PUBLISH_PLAN.md`：是否放弃 workbuddy 上架
- `scripts/`（8 个发布脚本）、`vercel.json`、`render.yaml`、`nixpacks.toml`、`Dockerfile`、`static-server.js`、`package.json`、`Makefile`、`.devcontainer.json`：部署收敛为单一平台后删除冗余

## 6. 部署收敛（解决 GitHub Pages 踩坑）

- **在线**：单一 GitHub Pages（Actions workflow 已有，保留），内容为开发态目录（含修正后 SW）。要点：CORS 白名单移除（无后端即无 CORS）；移除 index.html 中 localhost 预连与 Google Fonts CDN。
- **离线交付**：`dist/failure-logic-standalone.html` 单文件，用户下载即用。
- **可选后端**：仅本地运行文档保留（python 启动），不再参与线上部署，避免免费层休眠/冷启动/CORS 问题。
- **README 重写**：一条命令本地玩 / 一个文件离线玩 / 一个链接在线玩。

## 7. 教育功能聚焦（3 场景闭环）

1. 3 个深度场景接入主站：挑战者号（已有）+ 按设计文档落地 2 个新场景（老周家牛肉面馆 + 华芯突围 或 小林的选择，待用户定）。
2. 前端化认知反馈：app.js 已内置 6 类偏差检测 + 觉醒时刻，回合反馈 UI 在 challenger-router 中补齐"体验→偏差揭示→概念归因"闭环。
3. 移除或修复死页：指数页二选一；缩略图补齐或改图标。

## 8. 实施步骤与验收

| 步骤 | 动作 | 验收 |
|---|---|---|
| 1 | 执行 §5.1 删除 | 无孤儿 JS/测试页/废弃文档，仓库 ≤ 运行面 |
| 2 | §5.2 归档 | research 仅存审计报告 + 收敛方案 |
| 3 | 修 SW 缓存清单 / 移 CDN / 补缩略图 | 断网刷新全站可玩 |
| 4 | scripts/build-standalone.mjs 产出单文件 | 双击 dist 单文件可完整通关 1 场景 |
| 5 | 落地 2 个新场景（设计 → JSON → router） | 3 场景主站可玩 + 单文件可玩 |
| 6 | README/deployment 重写；§5.3 用户决策后清理 | 文档与现状一致 |
| 7 | 回归：断网 / 单文件 / 在线三态验收 | 三态一致，教育链路完整 |

## 9. 待办决策（阻塞项）

1. 2 个新场景最终名单（老周家 + 华芯突围？小林的选择？）
2. SemIf / tests / workbuddy 去留
3. 指数页修复 or 删除
4. 部署平台：GitHub Pages 单轨（推荐）还是 Cloudflare Pages

---

## 10. v2 更新（清理执行结果 2026-10-18）

### 10.1 已删除（用户勾选确认，8 项）
- `archived-scenarios/`（46.8 MB 旧场景杂物）
- `cloudflare-worker/`（无源码）
- `auto-deploy-system/`（废弃部署辅助）
- `test_coffee_shop_deep.html`、`test_coffee_shop_manual.html`
- `minimal-styles.css`
- `test-output.txt`、`test-output2.txt`

### 10.2 用户明确决定保留（29 项，不再列入删除建议）
- `assets/js/` 孤儿模块 27 个（business-strategy-router / climate-change-router / coffee-shop-deep-router / coffee-shop-competition-integration / financial-crisis-router / historical-cases-router / investment-information-processing-router / love-relationship-router / personal-finance-router / public-policy-router / user-storage / logger / error-toast / loading-manager / mobile-adaptation / performance-monitoring / cognitive-engine / market-environment / ai-competitor / competition-system / leaderboard / time-delay-model / exponential-page-router / awakening-moment-system / cognitive-bias-diagnosis-core / api-fallback-manager / historical-cases-data）
- `test-refresh.txt`、`test-refresh2.txt`

> 结论：孤儿 JS 虽不在主站运行链路，但用户选择保留——它们可能是后续开发素材（exponential 页、觉醒系统、历史案例）。后续若接入新场景可复用，若长期闲置则不再主动提议删除。

### 10.3 尚未处理（等用户指示）
- `docs/` 历史审计与执行记录（audit-2026-09-07 / audit-scenario-depth-2026-09-08 / audit-challenger-deep-dive/ / challenger-v2.1-execution-plan / challenger-retrospective / climate-change-plan / climate-change-grilldown / enron-grilldown）
- 根目录历史文档（DEEP_FAILURE_LOGIC_REDESIGN.md / ULTIMATE_REDESIGN.md / tasks.md / task_plan.md / findings.md / QWEN.md / WARP.md）
- `research/` 历史轮次（round-01..10 / remediation-01..03 / ROADMAP / REMEDIATION_SPEC）→ 建议归档至 archive/
- §5.3 B 级：SemIf / tests / workbuddy / 部署冗余配置

### 10.4 下一步迭代重点（不涉及删除的重构）
1. **SW 修复**：sw.js 缓存清单补齐 6 个核心 JS + 3 场景 JSON，移除孤儿 historical-cases-data.js
2. **CDN 移除**：index.html 移除 Google Fonts 与 localhost 预连（离线完整性）
3. **缩略图补齐**：assets/images/ 不存在导致的 404（app.js/offline-engine.js 引用）
4. **单文件构建**：scripts/build-standalone.mjs 将 14 JS + 3 JSON + CSS 内联为 dist/failure-logic-standalone.html
5. **新场景落地**：按 3 份设计文档将 2 个新场景 JSON + router 接入（待用户定最终名单）

---
*v2 状态：清理部分收敛；重构落地待用户选择推进顺序。*
*（内容由AI生成，仅供参考）*

---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_ba2f3ddccabc11f18e0e52540064ee0f
    ReservedCode1: Q3JStHwVYSndudMTEFc79fZ46iDmYZI3wVuCR7CMPDhhVkDI7wdUlNS+Vx1VLVbCZ4UK7s28U4ou7BM6dZ+U/2WW/J0BTrvsYzcJJArcUGT/Qvo1ZOlEVLHLI4kMI0R0uXkXrtJSvvJmlkGQVJiR/0Hkr+Un4CTUZqOTY2wBLpc5kSvORBHYVGhx8xE=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_ba2f3ddccabc11f18e0e52540064ee0f
    ReservedCode2: Q3JStHwVYSndudMTEFc79fZ46iDmYZI3wVuCR7CMPDhhVkDI7wdUlNS+Vx1VLVbCZ4UK7s28U4ou7BM6dZ+U/2WW/J0BTrvsYzcJJArcUGT/Qvo1ZOlEVLHLI4kMI0R0uXkXrtJSvvJmlkGQVJiR/0Hkr+Un4CTUZqOTY2wBLpc5kSvORBHYVGhx8xE=
---

# FailureLogic 真实代码级架构审计报告

- 审计日期：2026-10-18
- 审计范围：`D:\AIDevelop\failureLogic`（全仓库，只读）
- 审计方法：以真实代码引用为准——`index.html` 的 script/link 标签、JS 内 `fetch/import`、`sw.js` 离线缓存清单、`api-server/start.py` 路由挂载、全项目 grep 引用关系。文件"存在"不等于"被使用"，凡未在主站入口（index.html 及其加载链）可达的模块一律视为孤儿/未挂载。
- 状态：**只读审计，未删除、未修改任何文件**。删除动作待主 Agent 确认后另行执行。

---

## 1. 结论摘要（TL;DR）

1. **主站真实运行面很小**：`index.html` 直接挂载 14 个 JS + 3 个场景 JSON + 9 个 CSS + 3 个图标；全站可用深度场景仅 **3 个**（challenger-launch / climate-change-policy / enron-collapse），前后端链路真实可用。
2. **仓库名义体积与运行面严重脱节**：`SemIf` 约 **11.6 GB**、`tests` 约 **98.7 MB**、`archived-scenarios` 约 **46.8 MB**，三者合计约 12 GB，全部不在主站运行链路内。
3. **存在线上可见缺陷（必须修复）**：
   - 场景卡片缩略图 **404**：`assets/images/` 目录不存在，但 `app.js`(L287/312/337) 与 `offline-engine.js`(L707/722/737) 均引用 `assets/images/*.jpg`。
   - **指数测试页是死页**：`exponential-page-router.js` 未被 `index.html` 引用，`app.js` 仅在 `window.ExponentialPageRouter` 存在时才初始化，DOM 存在但逻辑永远不加载；`app.js` 内亦无指数计算器事件绑定。
   - **Service Worker 离线缓存清单与实际依赖脱节**：`sw.js`（v1.0.6）缓存了 20 项资源，却**漏掉** `challenger-router.js`、`offline-engine.js`、`safe-render.js`、`scenario-illustrations.js`、`illustration-prompts.js`、`ai-illustration-generator.js` 及全部场景 JSON；反而缓存了主站从不加载的孤儿文件 `historical-cases-data.js`。离线模式核心路由与场景数据拿不到，离线能力名存实亡。
4. **三份新场景设计文档（noodle-shop / chip-ai-supplychain / ai-skill-investment）为纸面设计**：前端 `SCENARIOS` 注册表与 `DEEP_SCENARIOS` 均只有 3 个场景，新场景 JSON 与 router 注册零引用。
5. **SemIf 本地 LLM 是"可选增强链路"**：主流程（场景回合推进）不依赖它；前端会尝试调用 `/api/interactive/score-decision`（SemIf 评分）与 `/api/interactive/*`（LLM 反馈），失败即降级为本地逻辑。但 `SemIf` 目录 11.6 GB 的模型缓存与"单网页离线"目标直接冲突。
6. **部署链路多平台并存且文档过时**：GitHub Pages（`.github/workflows/deploy.yml`）、Render（`render.yaml` + `Dockerfile`）、Vercel（`vercel.json`）、Cloudflare Worker（`cloudflare-worker/`）、本地发布脚本（`scripts/` 8 个）共存；`docs/deployment.md` 标注 `apiBaseUrl` 仍指向已废弃的 railway legacy URL，并注明 dev 端口 8082 broken。

---

## 2. 当前架构全链路盘点（真实代码级）

### 2.1 前端入口与资源依赖

| 维度 | 实际情况 | 证据 |
|---|---|---|
| 入口 | 单页 SPA `index.html`（76.6 KB），无构建步骤 | 根目录 |
| JS 挂载 | 14 个 script 标签：`scenario-illustrations.js`、`illustration-prompts.js`、`ai-illustration-generator.js`、`api-config-manager.js`、`offline-engine.js`、`event-bus.js`、`app-core.js`、`html-sanitizer.js`、`safe-render.js`、`console-wrapper.js`、`page-router-base.js`、`challenger-router.js`、`app.js`、`training-stage-tracker.js` | index.html 尾部（L1008-1188） |
| CSS | 本地 `assets/css/` 9 个文件；另含 **Google Fonts CDN**（Inter，`fonts.googleapis.com` preload） | index.html L39；`assets/css/` 共 9 文件 |
| 网络预连 | `http://localhost:8000`、`http://localhost:8082`（本地后端） | index.html L32-34 |
| 外链 | `agentpsy.com` 品牌跳转（非功能依赖） | index.html L387/521/586/680 |
| PWA | `manifest.json` + `sw.js`（v1.0.6）；`start_url: "/"` | manifest.json、sw.js |
| 图片 | **`assets/images/` 目录不存在**，但多处引用其下 jpg（见 §2.7） | Test-Path 为 False；app.js/offline-engine.js 引用 |

### 2.2 前端模块挂载矩阵（assets/js 共 41 个）

| 分组 | 文件 | 引用来源 | 状态 |
|---|---|---|---|
| 主站已挂载（14） | 见 2.1 清单 | index.html script 标签 | ✅ 运行中 |
| 旧场景路由族（10） | `business-strategy-router.js`、`climate-change-router.js`、`coffee-shop-deep-router.js`、`coffee-shop-competition-integration.js`、`financial-crisis-router.js`、`historical-cases-router.js`、`investment-information-processing-router.js`、`love-relationship-router.js`、`personal-finance-router.js`、`public-policy-router.js` | 无主站引用；仅 `test_coffee_shop_deep.html`（coffee-shop 系 3 个）与 `auto-deploy-system/auto-verifier.js`（coffee-shop-deep-router.js）引用 | ❌ 孤儿（对应已归档旧场景） |
| 死功能模块（5） | `exponential-page-router.js`（指数页唯一初始化入口，未挂载）、`awakening-moment-system.js`（觉醒系统独立实现，主站已内置）、`cognitive-bias-diagnosis-core.js`（偏差诊断独立实现，主站已内置）、`api-fallback-manager.js`、`historical-cases-data.js`（仅被 sw.js 白缓存，index.html 不加载） | 无有效引用 | ❌ 孤儿/死页 |
| 通用工具（6） | `user-storage.js`、`logger.js`、`error-toast.js`、`loading-manager.js`、`mobile-adaptation.js`、`performance-monitoring.js` | 全局无引用 | ❌ 孤儿 |
| 仅测试页引用（6） | `cognitive-engine.js`、`market-environment.js`、`ai-competitor.js`、`competition-system.js`、`leaderboard.js`、`time-delay-model.js` | 仅 `test_coffee_shop_deep.html` 引用（前 5 个），time-delay-model 无引用 | ❌ 孤儿 |

> 注：`test_coffee_shop_deep.html` 是咖啡店旧场景的调试测试页，不属于主站入口；其引用不构成"主站接入"。

### 2.3 场景数据链路（深度场景全链路可用）

- **场景 JSON**（仅 3 个）：`assets/data/scenarios/challenger_launch.json`、`climate_change.json`、`enron_collapse.json`；同时存在于 `api-server/data/scenarios/`（后端数据源）。
- **前端入口**：`challenger-router.js` 内置 `SCENARIOS` 注册表（3 场景，各 10 回合、4 选项、9-10 个状态字段，`defaultState` 供离线兜底）；`app.js` 的 `DEEP_SCENARIOS` 数组同为 3 场景。
- **回合获取**：`fetch('/scenarios/{id}/step/{n}')` 走后端 → 失败回退 `OfflineEngine.getScenarioStep`（`ApiService._withOfflineFallback`）。
- **离线引擎**：`offline-engine.js` 通过 `fetch('assets/data/scenarios/*.json')` 加载同一批 JSON 实现纯前端回退（会话、回合、状态演进均前端可算）。
- **新场景设计文档**：`docs/scenario-design-new-china.md`（noodle-shop-community）、`docs/scenario-design-chip-ai-supplychain.md`、`docs/scenario-design-ai-skill-investment.md` → 全前端 grep **零引用**，SCENARIOS 注册表无对应 id → **纸面设计，未接入**。

### 2.4 后端 FastAPI（api-server/，131 文件 1.7 MB）

- **启动**：`start.py` 挂载 `/assets` 静态目录、可选挂载 `/web-app`；CORS 白名单（GitHub Pages 域名 + localhost）；slowapi 速率限制（session 5/min、turn 30/min）；`/health` 健康检查。
- **端点**：
  - 场景引擎：`/scenarios/`、`/scenarios/{id}`、`/scenarios/{id}/step/{turn}`、`/scenarios/create_game_session`、`/scenarios/{game_id}/turn`（真实数据驱动，逻辑在 `logic/challenger_scenario|climate_scenario|enron_scenario/`）。
  - 认知偏差：`cognitive_tests.py` router（接入 `enhanced_cognitive_bias_detection.py`，实现 **12 类偏差分析**）；`/analysis/thinking-traps`；`test_results.py` router。
  - LLM 互动增强：`interactive.py` router（`/api/interactive/chat|analyze-decision|guided-tour|personalized-feedback|score-decision`），start.py 动态加载（文件存在即挂载）。
- **测试文件散布**：`api-server/logic/`、`utils/` 内含大量 `test_*.py` 与源码混放（开发卫生问题）。
- **启动脚本**：`launch_server.py`、`server_runner.py`、`debug_server.py`（调试用）。

### 2.5 本地 LLM / SemIf 接入链路

- **后端**：`logic/semif_client.py` 默认加载 `D:\AIDevelop\failureLogic\SemIf\models\Qwen3.5-4B-v2`（cuda / bfloat16 / 4096 tokens），供 `interactive.py` 的 `score-decision`、`analyze-decision` 使用；加载失败/推理失败时 logger warning 并降级。
- **前端**：`challenger-router.js` 调用 `/api/interactive/score-decision`（SemIf 评分），失败显示 "SemIf 不可用"；`app.js` 调用 `/api/interactive/chat|analyze-decision|guided-tour|personalized-feedback`（依赖 `OPENROUTER_API_KEY` 或本地逻辑回退）。
- **结论**：SemIf 是**可选增强**（决策评分 + LLM 反馈），主流程（回合推进、偏差揭示、觉醒时刻）不依赖它；无模型/无 Key 时降级可玩。但前端确实发起这些请求，后端缺失/模型不存在时会产生失败请求噪声。

### 2.6 部署链路盘点

| 平台 | 配置 | 状态 |
|---|---|---|
| GitHub Pages | `.github/workflows/deploy.yml`（actions/configure-pages@v5 + upload-pages-artifact@v3 + deploy-pages@v4）；`scripts/prepare-pages.sh` 排除 secrets/api-server/tests；`.nojekyll` | 主路径，workflow 结构完整 |
| Render | `render.yaml` + `Dockerfile`（Python 3.12-slim + uvicorn）；免费层 15min 休眠 | 配置存在 |
| Vercel | `vercel.json` | 配置存在 |
| Cloudflare Worker | `cloudflare-worker/`（wrangler.toml + package.json，2 文件） | 仅 2 个配置文件，无 worker 源码/入口 |
| 本地发布脚本 | `scripts/` 8 个（git-platform-ops / prepare-pages / publish-ops / release-ops / with-token，ps1+sh） | 与 GitHub Pages 上架相关；依赖 git-token 流程，脆弱 |
| 其他 | `static-server.js`、`package.json`、`Makefile`、`nixpacks.toml` | 冗余并存 |

**脆弱环节**：① CORS 白名单需与前端域名强一致（换域名即断）；② 免费后端休眠导致首请求 30-60s 延迟；③ 前端回合推进默认依赖后端，后端不可达才走离线回退（离线只是兜底，不是主设计）；④ `docs/deployment.md`（2026-09-13）已过时：`apiBaseUrl` 指向 legacy railway URL 并自注 "NEEDS UPDATE"、dev 8082 broken；⑤ 多平台配置并存，缺少单一权威部署说明。

### 2.7 已知线上缺陷

1. **场景缩略图 404**：`assets/images/` 不存在；`app.js` L287/312/337（challenger/climate/enron.jpg）、`offline-engine.js` L707/722/737 引用 → 卡片缩略图全部加载失败。
2. **指数测试页死页**：`exponential-page-router.js` 未挂载，`app.js` exponential 分支仅当 `window.ExponentialPageRouter` 存在才初始化（实际永远不存在），且 `app.js` 无 calculate-btn/calculate-exp-btn 事件绑定 → 导航入口存在但功能不可用（后端虽有 `exponential_calculations`，前端未接）。
3. **SW 离线缓存脱节**：缓存 20 项，缺 6 个运行必需 JS 与全部场景 JSON，多缓存 1 个孤儿 JS → 离线模式不可靠。
4. **README 空壳**：仅 "init / feat 1 / feat 2" 三行。

---

## 3. 孤儿 / 废弃 / 无用文件清单（逐项证据）

### 3.1 目录级废弃物

| 目录 | 规模 | 证据 | 建议 |
|---|---|---|---|
| `SemIf/` | 300 文件，**11,857 MB**（含 hf-cache、models/Qwen3.5-4B 多格式、SemIf-master 子项目） | 仅 `api-server/logic/semif_client.py` 通过环境变量/默认路径加载其 models（可选链路）；主站前端不直接依赖 | 见 §5 决策 |
| `tests/` | 1,138 文件，**98.7 MB**（backend/challenger/climate/enron/e2e + 大量 frames 截图/录屏、test-results-deep） | 未在主站入口引用；开发资产 | 保留最小集或移出仓库 |
| `archived-scenarios/` | 1,054 文件，**46.8 MB**（日志、旧 html、规划插件副本、测试脚本等数百个历史杂物） | 无任何主站引用；`deploy.yml` 注释证实其子目录 `planning-with-files` 的 gitmodules url 丢失曾导致 recursive submodules 失败 | **确认可删** |
| `workbuddy-package/` | 73 文件，0.5 MB（10 个 zip + skill 源码） | 主站零引用；独立 workbuddy 上架包 | 若放弃 workbuddy 上架则删 |
| `auto-deploy-system/` | 7 文件（auto-test-runner / auto-verifier / index.js / progress / task_plan / setup-scheduled-task / verification.log） | 未在主站入口；仅引用孤儿 `coffee-shop-deep-router.js` 作校验样本，属于部署辅助 | 可归档/删除 |
| `cloudflare-worker/` | 2 文件（package.json + wrangler.toml） | 无 worker 源码，未接入 | **确认可删**（无实质内容） |

### 3.2 孤儿 JS（assets/js 27 个，见 §2.2 矩阵）

**确认可删**（无任何引用或仅被废弃测试页/部署校验脚本引用）：
- 旧场景路由族 10 个：business-strategy-router、climate-change-router、coffee-shop-deep-router、coffee-shop-competition-integration、financial-crisis-router、historical-cases-router、investment-information-processing-router、love-relationship-router、personal-finance-router、public-policy-router
- 通用工具 6 个：user-storage、logger、error-toast、loading-manager、mobile-adaptation、performance-monitoring
- 仅测试页引用 6 个：cognitive-engine、market-environment、ai-competitor、competition-system、leaderboard、time-delay-model
- 死功能 4 个：exponential-page-router、awakening-moment-system、cognitive-bias-diagnosis-core、api-fallback-manager
- 白缓存 1 个：historical-cases-data（仅 sw.js 缓存清单，index.html 不加载）

> 注：`awakening-moment-system.js` 与 `cognitive-bias-diagnosis-core.js` 的功能已由 `app.js` 内置（`detectAwakeningMoment`/`renderAwakeningMoment`、`detectCognitiveBiases`）取代；`exponential-page-router.js` 删除前需先决策指数页去留（见 §7）。

### 3.3 废弃 / 过时文档

**docs/（28 文件）**：

| 文件 | 判定 |
|---|---|
| `scenario-design-new-china.md`、`scenario-design-chip-ai-supplychain.md`、`scenario-design-ai-skill-investment.md` | 纸面设计未接入 → 确认可删（或仅保留为 backlog） |
| `audit-2026-09-07.md`、`audit-scenario-depth-2026-09-08.md` | 历史审计已完成使命 → 可归档 |
| `audit-challenger-deep-dive/`（14 文件） | 历史深度审计（dorner 对齐/grilldown 多轮/最终验证）已完成使命 → 可归档 |
| `challenger-v2.1-execution-plan.md`、`challenger-retrospective.md` | 历史执行计划与复盘 → 可归档 |
| `climate-change-plan.md`、`climate-change-grilldown.md`、`enron-grilldown.md` | 场景开发过程记录 → 可归档 |
| `workbuddy-publish-plan-grilled.md` | workbuddy 上架计划 → 若放弃上架则删 |
| `deployment.md` | **过时**（railway legacy URL、NEEDS UPDATE）→ 待重写或删除 |
| `agent-skill-git-platform-ops.md` | git 平台操作技能文档（部署辅助）→ 保留待确认 |
| `challenger-frontend-spec.md` | 前端规格（仍与现状相关）→ **建议保留** |

**research/（15 文件，0.2 MB）**：`round-01..10`、`remediation-round-01..03`、`ROADMAP.md`、`REMEDIATION_SPEC.md` 均为历史轮次审计/治理记录，已完成使命 → 可归档（本次审计报告建议放同目录以便查阅）。

**根目录**：
- 重构设计：`DEEP_FAILURE_LOGIC_REDESIGN.md`、`ULTIMATE_REDESIGN.md` → 历史设计文档，已被现状部分实现/取代 → 可归档。
- 任务文档：`tasks.md`（Frontend Extension Tasks）、`task_plan.md`（全面测试修复计划）、`findings.md`（测试发现）→ 历史任务记录 → 可归档。
- 上架计划：`WORKBUDDY_PUBLISH_PLAN.md` → 同 workbuddy 决策。
- 工具记忆：`QWEN.md`、`WARP.md` → 生成式工具记忆，若工具不再使用可删。
- 项目灵魂：`soul.md`、`AGENTS.md`、`CLAUDE.md`、`progress.md` → **建议保留**（身份/指引/演进日志）。
- 测试输出垃圾：`test-output.txt`、`test-output2.txt`、`test-refresh.txt`、`test-refresh2.txt` → **确认可删**。
- 测试页：`test_coffee_shop_deep.html`、`test_coffee_shop_manual.html` → 旧场景调试页 → **确认可删**（连同其引用的 6 个孤儿 js）。
- 根目录孤儿 css：`minimal-styles.css` → 仅被 archived-scenarios 内旧 html 引用 → **确认可删**。

### 3.4 部署与开发冗余资产

- `scripts/`（8 个发布脚本）：GitHub Pages 上架辅助，与 workflow 重叠；若 GH Pages 走 Actions 则冗余 → 待选型后删。
- `vercel.json`、`render.yaml`、`nixpacks.toml`、`Dockerfile`、`static-server.js`、`package.json`、`Makefile`、`.devcontainer.json`：多平台并存 → 待部署选型收敛。
- `conftest.py`、`pytest.ini`、`pyproject.toml`、`requirements.txt`、`.coverage`：开发/测试资产 → 保留开发所需，`.coverage` 可删。
- `.git-token.example`、`.env.example`、`.kode-config.example.json`：配置模板 → 保留（安全规范）。
- `findings.md` 等见 3.3。

---

## 4. 架构与目标匹配度评估

目标定义：**单用户 / 可离线 / 单网页可下载 / 聚焦失败逻辑教育**。

### 4.1 匹配良好的部分

| 目标 | 现状 | 评估 |
|---|---|---|
| 单用户 | 无登录体系，本地会话（前端 localStorage/后端文件 session） | ✅ 完全匹配 |
| 教育核心 | 3 个深度场景真实数据驱动（10 回合×4 选项、T5/T6/T8/T10 渐进揭示、延迟后果、状态网格）；app.js 内置觉醒时刻（detectAwakeningMoment 4 类）与认知偏差反馈（detectCognitiveBiases / generateCognitiveFeedback）；12 类偏差分析器真实存在（后端 cognitive_tests 接入） | ✅ 核心教育链路达标 |
| 离线可行性 | `offline-engine.js` 纯前端回退可完整推进场景 | 🟡 能力存在，但受 SW 缓存清单缺陷拖累 |

### 4.2 不匹配 / 拖累项

| 问题 | 与目标冲突点 |
|---|---|
| 前端回合推进默认走后端 FastAPI，离线只是兜底 | 单网页下载后，若用户不跑后端，每次请求都失败一次再回退，体验差；真正离线必须把回合引擎前端化（OfflineEngine 已有基础） |
| `SemIf` 11.6 GB 本地模型（默认 cuda） | 与"单网页可下载/离线"完全背道而驰；属可选项但体积灾难 |
| Google Fonts CDN | 离线时字体回退，破坏单网页完整性 |
| SW 缓存清单缺 6 个核心 JS + 全部场景 JSON | 离线模式实际不可用 |
| 场景缩略图 404、指数测试页死页 | 功能完整性与教育体验受损 |
| 27 个孤儿 JS + archived 46.8MB + tests 98.7MB + 多平台部署配置 | 仓库臃肿，审计/维护成本高，与"简洁健壮"目标冲突 |
| 12 类偏差分析器仅后端/测试端接入 | 主流程主要用前端内置轻量偏差检测；12 类全量分析需后端，单网页离线时不可用 |

---

## 5. 建议删除清单（两级）

> 本报告只读，**未执行任何删除**。以下清单供主 Agent 确认后执行。

### A. 确认可删（无运行/开发价值引用，纯垃圾或已被替代）

1. `archived-scenarios/`（1,054 文件 / 46.8 MB）
2. `cloudflare-worker/`（2 文件，无 worker 源码）
3. `auto-deploy-system/`（7 文件，部署辅助已废弃）
4. `assets/js/` 孤儿模块 27 个（§3.2 全清单）
5. `test_coffee_shop_deep.html`、`test_coffee_shop_manual.html`
6. `minimal-styles.css`
7. `test-output.txt`、`test-output2.txt`、`test-refresh.txt`、`test-refresh2.txt`
8. docs：`scenario-design-*.md` ×3、`audit-2026-09-07.md`、`audit-scenario-depth-2026-09-08.md`、`audit-challenger-deep-dive/` ×14、`challenger-v2.1-execution-plan.md`、`challenger-retrospective.md`、`climate-change-plan.md`、`climate-change-grilldown.md`、`enron-grilldown.md`
9. 根目录历史文档：`DEEP_FAILURE_LOGIC_REDESIGN.md`、`ULTIMATE_REDESIGN.md`、`tasks.md`、`task_plan.md`、`findings.md`、`QWEN.md`、`WARP.md`（如工具不再使用）
10. research 历史轮次（`round-01..10`、`remediation-round-01..03`、`ROADMAP.md`、`REMEDIATION_SPEC.md`）→ 可归档至独立历史目录而非删除

### B. 建议保留待确认（依赖方案选型）

| 项 | 保留条件 | 删除条件 |
|---|---|---|
| `SemIf/`（11.6 GB） | 保留后端 LLM 增强方案 | 采用纯单网页离线方案 → 整目录可删（删前确认 `api-server/logic/semif_client.py` 对应降级路径） |
| `tests/`（98.7 MB） | 保留开发测试资产（建议裁剪至轻量集） | 若仓库不再承载开发测试 |
| `workbuddy-package/` + `WORKBUDDY_PUBLISH_PLAN.md` + `docs/workbuddy-publish-plan-grilled.md` | 仍计划 workbuddy 上架 | 放弃上架 → 全删 |
| `scripts/`、`vercel.json`、`render.yaml`、`nixpacks.toml`、`Dockerfile`、`static-server.js`、`Makefile`、`package.json` | 部署选型确定后按单一方案保留 | 冗余平台配置删除 |
| `docs/deployment.md` | 重写为当前真实部署说明 | 若删除则以 README 承载 |
| `docs/agent-skill-git-platform-ops.md` | 保留 git 平台操作技能 | 不再手动上架可删 |
| `exponential-page-router.js` | 修复指数页（补挂载 + 前端计算逻辑） | 砍掉指数功能 → 连同导航入口一起删 |
| `research/` 历史轮次 | 归档保留审计脉络 | 不保留历史 |

---

## 6. 架构简化方向（建议）

### 方向一：单网页可下载（推荐主方向）
1. **前端化回合引擎**：以 `OfflineEngine`（已实现会话/回合/状态演进）为基座，将场景推进完全前端化，后端降级为可选增强。
2. **场景数据内嵌**：将 3 个场景 JSON 内联进 `offline-engine.js` 或构建单 HTML（内联 JS/CSS/场景数据），实现"下载一个文件即可玩"。
3. **资源本地化**：Google Fonts 本地化或移除；删除/补齐 `assets/images/` 缩略图（二选一）。
4. **修复 SW 或移除 SW**：若单网页方案，直接移除 SW 与 manifest 的离线缓存依赖；若保留多文件，重写缓存清单（含 6 个核心 JS + 场景 JSON）。
5. **修复死页**：指数页二选一（补实现或删入口）；README 重写。

### 方向二：前端瘦身
- 删除 §5A 全部条目；`app.js`（566 KB）拆分或至少清理旧场景残留（如 `coffeeShopRouter` 引用、`BASE_SCENARIOS` 旧场景数据）。

### 方向三：后端与部署收敛
- 若保留后端：只保留 `api-server` 核心（endpoints 场景/认知偏差 + logic + start.py），移除散布 `test_*.py` 与 SemIf 默认模型加载（改为显式 env 开启）。
- 部署单轨：GH Pages Actions（已有完整 workflow）+ 可选 Render 后端；删除 vercel/CF/scripts 冗余；更新 `docs/deployment.md` 或并入 README。

### 方向四：文档收敛
- 保留：`AGENTS.md`、`CLAUDE.md`、`soul.md`、`progress.md`、`docs/challenger-frontend-spec.md`、本审计报告。
- 归档：docs/research 历史轮次移入独立 `archive/`（或删除）。
- 重写：`README.md`（当前空壳）。

---

## 7. 待主 Agent 决策事项

1. **删除清单确认**：按 §5A 执行删除（预计释放约 50 MB + 27 个孤儿 JS + 30+ 文档）；§5B 各项按选型决定。
2. **部署方案选型**：单网页离线 vs 静态站 + 可选后端；据此删并 `SemIf/`（11.6 GB）与多平台配置。
3. **教育功能取舍**：指数测试页（修复/删除）、历史案例页（historical-cases 系列）、12 类偏差分析器前端化（当前仅后端/测试端）。
4. **线上缺陷修复顺序**：缩略图 404 → SW 缓存清单 → 死页/入口清理。
*（内容由AI生成，仅供参考）*

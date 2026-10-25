---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_0b4f62cdcac711f18e0e52540064ee0f
    ReservedCode1: UR/iPkzkqk2xBD5G4+otV9XAU8lfJYXy7d0v7Z7I6/iPmNpiyrTFXTQsmbom30bUEkhEO8BF2sLRSlRNp7UrR81Id+HcqIsIkqaoWDtsEVRUELFo8PPLOClCP71U6nQPQgSvNvjStU5ZZDxBWLq9sCAAjs70hOHXoS76hiRazRf7AraV814VRxVc4HQ=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_0b4f62cdcac711f18e0e52540064ee0f
    ReservedCode2: UR/iPkzkqk2xBD5G4+otV9XAU8lfJYXy7d0v7Z7I6/iPmNpiyrTFXTQsmbom30bUEkhEO8BF2sLRSlRNp7UrR81Id+HcqIsIkqaoWDtsEVRUELFo8PPLOClCP71U6nQPQgSvNvjStU5ZZDxBWLq9sCAAjs70hOHXoS76hiRazRf7AraV814VRxVc4HQ=
---

# FailureLogic — 失败逻辑教育沙盘

单用户 / 可离线 / 聚焦失败逻辑教育的深度场景模拟器。以真实商业与历史案例为底，通过「10 回合 × 4 选项」的渐进式决策推演，揭示认知偏差、延迟后果与系统性失败路径。

> 文档收敛日期：2026-10-18。历史审计、轮次记录与废弃文档已归档至 [`archive/`](<D:\AIDevelop\failureLogic\archive>)（详见文末「文档索引」）。

## 三种玩法

| 玩法 | 方式 | 说明 |
|---|---|---|
| **在线访问** | 部署于 GitHub Pages（`.github/workflows/deploy.yml` 自动发布） | 支持 Service Worker（v1.0.10）离线缓存，首次访问后可离线使用 |
| **单文件离线** | 打开 [`dist/failure-logic-standalone.html`](<D:\AIDevelop\failureLogic\dist\failure-logic-standalone.html>)（约 1.2 MB） | 双击浏览器即可玩，无需任何服务端；重新构建：`npm run build` |
| **本地后端** | `python api-server/start.py`，访问 `http://localhost:8000` | 完整后端能力：场景引擎、12 类认知偏差分析、LLM 互动增强（SemIf / OpenRouter 可选） |

## 发布前必跑（`dist` 与源码同版本）

改了 `assets/js/**` 或 `index.html` 之后，**必须**依次执行，否则单文件版会停在旧代码上：

```powershell
npm run build      # 重新内联 css/js + 5 个场景 JSON，并跑自检（任一检查失败会直接报错退出）
```

确保：
1. `npm run build` 自检全绿（`climateBudgetLine` / `homeStats` / `noLocalScenarioJsonFetch` / `noPreload` / `scenarioDataInScript`）；
2. `sw.js` 的 `CACHE_NAME` 版本号 +1（cache-first 会继续喂旧 JS，不改版本等于没改）；
3. `dist/failure-logic-standalone.html` 双击打开后控制台 0 error。

## 场景清单

| 场景 ID | 名称 | 主题 |
|---|---|---|
| `challenger-launch` | 挑战者号发射决策 | 群体思维、压力下的决策偏误 |
| `climate-change-policy` | 气候政策制定 | 长周期后果与延迟反馈 |
| `enron-collapse` | 安然公司崩盘 | 财务造假与组织伦理滑坡 |
| `noodle-shop-community` | 老周家牛肉面馆 | 社区经营：流量爆红下的目标漂移与过度调节 |
| `chip-ai-supplychain` | 华芯突围：AI芯片供应链 | 产业战略：制裁下供应链中断与线性外推 |

> 5 个深度场景均已接入主站（router 注册 + 离线引擎 + PWA 缓存），场景设计文档归档至 [`archive/scenarios-archive/`](<D:\AIDevelop\failureLogic\archive\scenarios-archive>)。

## 目录结构

```
failureLogic/
├── index.html                # 单页应用入口（14 JS + 场景 JSON + CSS）
├── assets/
│   ├── css/                  # 样式
│   ├── js/                   # 前端模块（含场景 router、离线引擎）
│   └── data/scenarios/       # 5 个场景 JSON（前端离线数据源）
├── api-server/               # FastAPI 后端（场景引擎 / 认知偏差 / LLM 增强）
├── dist/                     # 单文件离线版构建产物
├── scripts/                  # 构建与 GitHub Pages 发布脚本
├── docs/                     # 保留规格与场景设计文档
├── research/                 # 架构审计报告与收敛计划（2026-10-18）
├── archive/                  # 历史文档归档（按主题分子目录）
├── sw.js / manifest.json     # PWA 离线缓存与清单
└── AGENTS.md / CLAUDE.md / soul.md / progress.md
```

## 部署说明

- **GitHub Pages（主路径）**：推送 `main` 后由 `.github/workflows/deploy.yml` 自动构建发布；CORS 白名单已覆盖 GitHub Pages 域名与 `localhost`。
- **Render / Vercel（可选后端）**：`render.yaml` + `Dockerfile` / `vercel.json` 供后端托管；免费层存在休眠延迟（首请求 30-60s）。
- **本地后端**：`python api-server/start.py`，默认端口 `8000`（可用 `PORT` 环境变量覆盖）。
- **离线单文件**：无需部署，见「三种玩法」。

## 文档索引

- **保留文档**：`AGENTS.md`（协作指引）、`CLAUDE.md`、`soul.md`（项目灵魂）、`progress.md`（演进日志）、`docs/challenger-frontend-spec.md`（前端规格）、`research/architecture-audit-2026-10-18.md`（架构审计）、`research/architecture-convergence-plan.md`（收敛计划）。
- **归档文档**：`archive/` 下按 `audits / execution-plans / scenario-dev / scenarios-archive / redesign / tasks / tool-memory / workbuddy / research-history` 分子目录存放历史审计、执行记录、场景设计、重构设计与轮次档案，各目录附 `README.md` 索引。
*（内容由AI生成，仅供参考）*

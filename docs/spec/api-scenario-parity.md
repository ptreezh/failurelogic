---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_b788d4d9d02a11f19f8752540064ee0f
    ReservedCode1: gFC+Ey1qnY1N5JYhtWQJVCxyaZ4In6e6WMEluQ2rgE13l6AsH7kWNtrzd+06sO5NEzZnPcGIAIeLbuYPs5Crvcaj3zO2AF9de1AszO91QV5NsSIjJA7iDSjR8QJSf+iwXltMmcwwswn8RtUKF195qrvKJu6cFEo/deODq79lBla/VusAWi55f7PYRnw=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_b788d4d9d02a11f19f8752540064ee0f
    ReservedCode2: gFC+Ey1qnY1N5JYhtWQJVCxyaZ4In6e6WMEluQ2rgE13l6AsH7kWNtrzd+06sO5NEzZnPcGIAIeLbuYPs5Crvcaj3zO2AF9de1AszO91QV5NsSIjJA7iDSjR8QJSf+iwXltMmcwwswn8RtUKF195qrvKJu6cFEo/deODq79lBla/VusAWi55f7PYRnw=
---

# 前后端场景数据一致性说明（api-scenario-parity）

- 状态：结论已定稿，暂不反向同步
- 适用范围：`assets/data/scenarios/*.json`（前端离线真源）与 `api-server/data/scenarios/*.json`（后端 API 数据）
- 关联关卡：S0（离线优先）、S1（brief / behavior / goal_axis / goal_sacrificed / real_world_anchor）
- 编写日期：2026-10-25

---

## 1. 结论（先看这一段）

**后端不需要同步 S1 字段，也不建议反向补齐。**

理由不是"差异无关紧要"，而是三条硬事实：

1. 前端默认离线，API 是显式 opt-in：`app.js:86-92` 的 `_apiDisabled()` 在 `file:` / `localhost` / `127.0.0.1` / `0.0.0.0` 下一律返回 `true`，除非 `window.__FL_ENABLE_API__ === true`。
2. 复盘页不读 API，读的是离线引擎内存表：`challenger-router.js:1314-1329` 取 `OfflineEngine._flScenarioData[scenarioId]` 作为 `scenarioData` 传给 `FLDebrief.build`。
3. 后端引擎不消费 S1 字段：`api-server/logic/` 三个引擎只吃 `steps / effects / outcome_endings`，`brief`、`behavior`、`goal_axis`、`goal_sacrificed`、`real_world_anchor` 在 Python 侧零引用。

因此：**`assets/data/scenarios/` 是唯一真源，`api-server/data/scenarios/` 是历史遗留的结算数据副本。** 当前差异属于设计性冗余，不是缺陷。

**但有前置条件**：一旦有人打开 API 模式（`window.__FL_ENABLE_API__ = true`），下列问题会立刻暴露，届时必须先补齐本文件 §4 的三项，才允许开启。

---

## 2. 数据通路证据

| 环节 | 实际数据来源 | 代码位置 | 说明 |
|---|---|---|---|
| 场景列表 / 详情 | 优先 API，1.2s 超时回落离线 | `app.js:95-134`（`_withOfflineFallback`）、`app.js:136-137` | 默认 `_apiDisabled()` 命中即直接走 `OfflineEngine` |
| 单回合 step | 优先 API `/scenarios/{id}/step/{turn}`，回落 `OfflineEngine.getScenarioStep` | `challenger-router.js:248-256` | `console.log` 会打印 `from api` / `from offline`，可用于现场确认 |
| 提交回合 | 优先 API `/scenarios/{game_id}/turn`，回落 `OfflineEngine.executeTurn` | `app.js:150-157`、`challenger-router.js:274` | 离线分支会写 `decision_history`（含 behavior / goal_axis） |
| 终局复盘 | **只用** `OfflineEngine._flScenarioData` | `challenger-router.js:1314-1329` | 与 API 开关无关，永远读 `assets/` 数据 |
| 场景静态数据加载 | `offline-engine.js:25-29` 显式映射到 `assets/data/scenarios/*.json` | `offline-engine.js:25-29` | 场景 id 用连字符，文件名用下划线 |

结论推导：只要 `__FL_ENABLE_API__` 不为 `true`，后端 JSON 的字段缺失与文案漂移对玩家**零影响**。

---

## 3. 差异清单（实测）

### 3.1 字段覆盖

| 字段 | 前端 assets（5 场景） | 后端 api-server | 影响面 |
|---|---|---|---|
| `brief`（role / horizon / objectives / method_concerns / impossible / ends_when / how_judged） | 5/5 有 | 0/5 有 | 简报页、S0 断言、目标张力探针 |
| `options[].behavior` | 200/200 | 0/200 | 行为标注、仪表归因 |
| `options[].goal_axis` | 194/200（面馆缺 5、芯片缺 1） | 0/200 | 目标轴三格 |
| `options[].goal_sacrificed` | 194/200（面馆缺 5、芯片缺 1） | 0/200 | 目标代价提示 |
| `feedback_patterns[].real_world_anchor` | 40/40（每场景 8 条） | 0/40 | 终局现实锚定、`ANCHOR_REQUIRED` |
| 顶层键集合 | 仅比后端多 `brief` | 无额外键 | — |
| `steps` 数量 | 10 / 场景 | 10 / 场景 | 一致 |
| `feedback_patterns` 键集合 | 8 键 | 8 键，同名 | 一致 |
| `outcome_endings` 键集合 | 同名 | 同名 | 一致 |

### 3.2 选项文案漂移（共 25 处）

差异集中在 3 个场景：climate 16 处、enron 7 处、chip 2 处；challenger 与面馆为 0。

**类型 A：后端文案尾部多挂偏差标签（23 处，属历史调试残留）**

| 场景 | 回合/选项 | 前端文案 | 后端文案 |
|---|---|---|---|
| climate | T4/C | 聚焦本国应对，国际援助力度有限 | 同前 + `（F6国内偏误）` |
| climate | T4/D | 提议暂停所有气候谈判6个月，等待局势稳定 | 同前 + `（F2时间延迟）` |
| climate | T5/B | 强调'我们这一代已经在努力了' | 同前 + `（F7自我批评缺失）` |
| climate | T6/A | 公开企业资助来源 + 要求媒体核实 | 同前 + `（F6反制）` |
| climate | T6/B | 给企业'绿色转型'路径，避免硬碰 | 同前 + `（F3自反）` |
| climate | T6/C | 起诉企业虚假宣传 | 同前 + `（F4副作用）` |
| climate | T6/D | 与企业合作，换取他们支持碳定价 | 同前 + `（F7风险）` |
| climate | T7/C | 维持现状路线，等下一次选举后再调整 | 同前 + `（F8强化）` |
| climate | T8/A | 支持5000亿赔偿要求 | 同前 + `（F4副作用分配）` |
| climate | T8/B | 设立'绿色发展基金'替代赔偿 | 同前 + `（F7自我批评）` |
| climate | T8/C | 拒绝，坚持'共同但有区别的责任' | 同前 + `（F6/F8强化）` |
| climate | T8/D | 提议'债务换气候'——免除穷国债务换减排承诺 | 同前 + `（F3+F4）` |
| climate | T9/A | 接受中国提议 + 推动全球碳关税 | 同前 + `（F3自反）` |
| climate | T9/B | 拒绝，主张国家主权 | 同前 + `（F6+F8强化）` |
| climate | T9/C | 有条件接受，要求中国承担更多技术转让 | 同前 + `（F7自我批评）` |
| climate | T9/D | 联合美国（将重返）施压中国让步 | 同前 + `（F6确认偏误风险）` |
| enron | T1/D | 向 SEC 匿名举报关联交易结构 | 同前 + `（F7 自我批评的反面：承认问题）` |
| enron | T5/C | 压下此备忘录，希望问题自然消失 | 同前 + `（F2 强化）` |
| enron | T6/C | 用 Raptor 交易创造 Q3 '利润'，给市场信心 | 同前 + `（F5+F7 强化）` |
| enron | T7/A | 立即申请破产保护，主动重组 | 同前 + `（F8 补救：终于快响应）` |
| enron | T7/C | 让 Lay 继续公开辩护，希望反转 | 同前 + `（F8 强化：仍太慢）` |
| enron | T8/C | 拖延 SEC 调查，让 Lay 个人承担 | 同前 + `（F4 副作用：转嫁责任）` |
| enron | T9/A | 全部承认 + 公开道歉 | 同前 + `（F7 自我批评：终于认错）` |

**类型 B：语义不同（2 处，必须人工裁决，不能机械对齐）**

| 场景 | 回合/选项 | 前端文案 | 后端文案 | 说明 |
|---|---|---|---|---|
| chip | T7/D | 砍掉低毛利订单，只留能赚钱的客户，把现金攥住 | 先做客户价值分析，定向保战略客户 | 选项语义完全不同，后端疑似旧版内容；前端为 S1 标注后的现行版本 |
| chip | T10/A | 接受结局，完整复盘全决策链 | 接受终局评分，完整复盘全决策链 | 措辞差异，影响小 |

### 3.3 场景注册面（额外发现）

`api-server/start.py` 的 `BASE_SCENARIOS` 只注册 3 个场景：`challenger-launch`、`climate-change-policy`、`enron-collapse`。

- `noodle-shop-community`、`chip-ai-supplychain` 在 `api-server/data/scenarios/` 下虽有 JSON（且均为 **untracked**），但**没有注册进路由，也没有对应 Python 引擎**。
- 因此开启 API 模式时，场景列表会从 5 个降到 3 个；缺失场景只能靠 1.2s 超时后的离线回落兜底，体验表现为先卡顿再出现。

---

## 4. 若将来必须开启 API 模式，开启前的最小整改清单

按优先级排列，三项缺一不可：

1. **补齐场景注册与引擎**：`start.py` 的 `BASE_SCENARIOS` 增加 `noodle-shop-community`、`chip-ai-supplychain`，并补对应 `logic/*_scenario.py`；否则列表缺项。
2. **同步 S1 字段**：`api-server/data/scenarios/*.json` 补齐 `brief`、`options[].behavior / goal_axis / goal_sacrificed`、`feedback_patterns[].real_world_anchor`。
3. **清理文案漂移**：先处理 §3.2 类型 A 的 23 处尾部标签（属调试残留，直接剔除后缀）；类型 B 的 2 处需人工确认后取前端版本为准。

补充约束：整改后必须新增一条门禁，比对两侧 `steps[].options[].text` 与 S1 字段覆盖率，避免再次静默漂移（历史上 `consequence_deferred` 与 `consequence_deferred_queue` 键名不一致，导致延迟后果从未触发，就是同类问题）。

---

## 5. 当前处置决定

| 项 | 决定 | 理由 |
|---|---|---|
| S1 字段同步到后端 | **不做** | 后端不消费，且离线为默认运行态 |
| 文案漂移清理 | **不做** | 同上；且清理会产生无收益的大 diff |
| `api-server/data/scenarios/climate_change.json` 未提交改动 | **单独一笔提交** | 内容为 `outcome_endings` 定档分支（`transition_unfinished`、`execution_collapse`）与初始值微调，与 S1 无关，可独立回滚 |
| `chip_ai_supplychain.json` / `noodle_shop_community.json`（untracked） | **暂不入库** | 无注册、无引擎，属死数据；若确认要留档，需与 §4 第 1 项一并处理 |
| 本文件 | 入库，作为"为什么不同步"的书面依据 | 避免后续重复审计同一问题 |

---

## 6. 复现方式

字段与文案差异可用下列逻辑一次性核对（结果应与 §3 一致）：

```python
import json, os
FE = r"assets\data\scenarios"
BE = r"api-server\data\scenarios"

for f in sorted(os.listdir(FE)):
    if not f.endswith(".json"):
        continue
    fe = json.load(open(os.path.join(FE, f), encoding="utf-8"))
    bp = os.path.join(BE, f)
    if not os.path.exists(bp):
        print(f, "后端缺失该文件")
        continue
    be = json.load(open(bp, encoding="utf-8"))

    fe_opts = [o for s in fe["steps"] for o in s["options"]]
    be_opts = [o for s in be["steps"] for o in s["options"]]
    drift = [(x.get("id"), y.get("id")) for x, y in zip(fe_opts, be_opts) if x.get("text") != y.get("text")]

    print(f)
    print("  顶层键差集:", sorted(set(fe) - set(be)))
    print("  选项数:", len(fe_opts), "/", len(be_opts), "文案漂移:", len(drift), drift)
    print("  后端 behavior/axis/sac/anchor 覆盖:",
          sum(1 for o in be_opts if o.get("behavior")),
          sum(1 for o in be_opts if o.get("goal_axis")),
          sum(1 for o in be_opts if o.get("goal_sacrificed")),
          sum(1 for v in (be.get("feedback_patterns") or {}).values() if v.get("real_world_anchor")))
```

现场确认运行态属于哪一种，只需在浏览器控制台看两处：

```js
window.__FL_ENABLE_API__     // undefined / false => 离线真源；true => 走 API
// 或看 challenger-router 的日志：loaded step N from offline|api
```

---

## 7. 变更记录

| 日期 | 变更 | 说明 |
|---|---|---|
| 2026-10-25 | 初版 | S1 四场景铺开后核对前后端，确认差异属预期，记录最小整改清单 |
*（内容由AI生成，仅供参考）*

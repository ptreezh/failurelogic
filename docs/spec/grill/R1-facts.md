---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: efa44597985f490407413e4566231f49_d790398ecf2a11f19f8752540064ee0f
    ReservedCode1: 5mZG0HacjWqP+ATnWiJ9tXYjrhMd60+LpJyomZ8aFeFnGPNO3R3ccKdDvhiv1XW1su+0cNUOYhwlB/O+pZSa498fIh95bhyewOEAoM9mglA6F1qW3nKvwnIX2iPSiz71Ywj5x1kf+oRm28VGxAQL2EXXggWC5vHQuGfzvwD18o7Guqir3J1Sk9J2VXo=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: efa44597985f490407413e4566231f49_d790398ecf2a11f19f8752540064ee0f
    ReservedCode2: 5mZG0HacjWqP+ATnWiJ9tXYjrhMd60+LpJyomZ8aFeFnGPNO3R3ccKdDvhiv1XW1su+0cNUOYhwlB/O+pZSa498fIh95bhyewOEAoM9mglA6F1qW3nKvwnIX2iPSiz71Ywj5x1kf+oRm28VGxAQL2EXXggWC5vHQuGfzvwD18o7Guqir3J1Sk9J2VXo=
---

# Grill Round 1 — 事实层：把 spec v1 的 P0-1 打死

日期：2026-10-24
对象：《production-readiness-spec.md》v1
方法：不做文字论证，只用代码路径逐跳追证「玩家可见路径」

## 裁定

**P0-1「主干终局无复盘」——证伪，整条作废。**

## 追证链（每一跳都有文件行号）

| 跳 | 证据 |
|---|---|
| 1. 玩家可见场景清单 | `app.js:304` `getMockScenarios()` 只返回 **5 个** 场景，全 `difficulty: advanced`：`challenger-launch`(挑战者号)、`climate-change-policy`(气候政策)、`enron-collapse`(安然)、`noodle-shop-community`(牛肉面馆)、`chip-ai-supplychain`(AI芯片) |
| 2. 点击场景后进哪 | `app.js:11921` `startChallengerGame()` / `app.js:12064` `_startDeepScenario(scenarioId)`，后者被 `startClimateChangeGame`/`startEnronGame`/`startNoodleShopGame`/`startChipSupplyChainGame` 四个入口复用 |
| 3. 实例化谁 | `app.js:12115` `new window.ChallengerRouter(initialState, {gameId, scenarioId})` |
| 4. 终局挂复盘 | `challenger-router.js:1223` 终局 `setTimeout(() => this._mountDebrief(), 0)`；`_mountDebrief` 内含 `data-retry` 700ms 重试 + `data-mounted` 幂等 |
| 5. 复盘数据从哪 | `offline-engine.js:3465` `OfflineEngine._flScenarioData = _loaded`（全部已加载场景，非仅 challenger），`FLDebrief.build({state, scenarioConfig, scenarioData})` 三件套齐备 |

**结论：5/5 场景有终局复盘，覆盖率 100%。**

## 连带证伪

- **P1-1「renderEndingPage 三处重复定义」性质误判**：L2331/L3264/L8301 分别属咖啡店(TURN_5)、关系(TURN_5)、投资(TURN_8) 三套**旧版场景**，不在 `getMockScenarios()` 清单内，玩家不可达。它们不是「重复实现」，是「已下架版本的残留」。定性应为 P2 清理，不是 P1 结构风险。
- **P0-4「awakening 系统缺失」部分证伪**：`app.js:2197` 存在自有 `detectAwakeningMoment()` 并在 L2131/L2338 被调用；`TrainingStageTracker` 也已接（L2337-2350）。23KB 的 `awakening-moment-system.js` 是**平行冗余实现**，不是能力缺失。
- **P0-3「延迟代价不成立」存疑**：challenger-router 是 10 回合 Dörner 深潜，自带状态与回合结算；`app.js` 的 `delayed_effects` 属旧 router。challenger 侧是否已有延迟机制，**本轮未查证**，不能沿用原判断。

## 方法论错误（比单条结论错更严重）

v1 的 P0 排序建立在「grep 文件名字符串的出现次数」上。该口径对**直接 script 引用**有效，对**注册表/工厂/动态分发**系统性失效：

- `challenger-router.js` 内部有 `SCENARIOS` 注册表（L23），5 个场景全在表内，但文件名 `challenger-router.js` 在 `app.js` 中以 `window.ChallengerRouter` 形式出现，我用的是 `FLDebrief`/`debrief` 关键词 —— 恰好漏掉。
- 于是把「1 个文件承载 5 个场景」误读为「1 个支线」。

**修订后的取证铁律**：判断某能力是否可达，必须走完 `玩家入口 → 入口函数 → 实例化 → 渲染函数 → 子模块` 全路径，禁止以单点 grep 计数定论。

## 反向的自我警惕

R1 也可能过度纠正：我证明了「5 个场景有 debrief 挂载代码」，但**没有证明**它运行时不静默失败。`_mountDebrief` 有三处提前 return：
```js
if (!root || root.getAttribute('data-mounted') === '1') return;   // 宿主 DOM 不存在 → 静默
if (!window.FLDebrief) return;                                     // 模块未加载 → 静默
if (!data) { ...retry once... return; }                            // 场景数据缺 → 静默
```
「代码上接了」≠「用户真看到了」。要判定用户是否真看到，唯一硬证据是**跑一次终局、断言 `[data-fl-debrief-host][data-mounted="1"]` 存在** —— 这是 M0 唯一该做的事，且成本极低（不是 1.5 天，是 0.5 天以内）。

## 对 spec 的动作

| 原条目 | 新处置 |
|---|---|
| P0-1 | 删除。替换为 **P0-1'：复盘可达性未验证**（代码已接，运行时静默失败风险未排除），验收＝headless 跑 5 场景终局断言 `data-mounted=1` |
| P0-3 | 降级为「待查」，需先读 challenger-router 的延迟机制 |
| P0-4 | 改为「平行实现冗余」，P2 |
| P1-1 | 降为 P2（旧版残留） |
| P0-2 | **保留，且升为唯一 P0** |
*（内容由AI生成，仅供参考）*

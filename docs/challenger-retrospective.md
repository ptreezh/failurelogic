# Challenger 经验教训总结 (2026-09-13)

> 来源:challenger-launch v1.0 → v2.0 → v2.1 → 前端集成 → E2E 验证全流程
> 目的:为下一个深度场景(climate-change)提供可复用的设计模式 + 必须避免的陷阱

---

## 1. 成功要素(可复用模式)

### 1.1 数据驱动引擎分离 (engine ↔ data)

**做法**:`api-server/logic/challenger_scenario.py` 是纯函数式引擎(无 IO),所有回合内容来自 `api-server/data/scenarios/challenger_launch.json`(711 行)。

**好处**:
- 修改剧本不动代码(迭代速度: 半天调一遍内容 vs 调一遍代码)
- 单元测试只测引擎 38 个 assertions,内容变更不影响测试
- 同一份引擎可服务多个剧本(只需改 `scenario_file` 字段)

**复用模板**:
```python
# 每个回合:
{"turn": N, "phase": "X", "situation": "...",
 "options": [{"id": "A", "text": "...", "weight": "extreme_safe", "consequences_for_player": "...", "expected_concerns_addressed": ["engineering"]}],
 "expected_effects": {"A": {...}, "B": {...}, ...},
 "character_reactions": {...}}
```

### 1.2 Dörner 模式显式检测 (8 个 detector 函数)

**做法**:`challenger_scenario.py` 写7 个独立的 `detect_xxx()` 函数(F2-F8),每个返回 `Optional[Dict]` 含 `pattern_type`/`dorner_concept`/`evidence`/`reflection_questions`。

**好处**:
- 反馈文本可显式标注 "Dörner 称为'非线性 + 复杂性'叠加"(用户学到模式名)
- 检测器可单测、可独立调参
- 玩家在 T6/T8 看到自己哪几个模式被激活,自我反思深度高

**复用清单** (每场景必须):
- F2 时间延迟
- F3 自反性(self-reference)
- F4 副作用忽视
- F5 单目标优化
- F6 确认偏误
- F7 自我批评缺失
- F8 调节滞后(regulation lag)

### 1.3 渐进式偏差揭示 (T3 → T6 → T8 → T10)

**做法**:前 2 回合只给结果不揭示模式,T3 第一次轻推、T5/T6 第一次重揭示、T8 第二次揭示、T10 总结 + 结局。

**好处**:
- "创造困惑时刻"是 Dörner 原书核心(认知冲击 > 平铺直叙)
- 用户在 T3 看到 "你在前 N 回合重复了某模式"时会有顿悟感
- T10 结局揭示完整模式报告,触发最强反思

**复用节奏**:5 步阶梯 (T1 困惑 → T3 提示 → T5/6 主揭示 → T8 深化 → T10 总结)

### 1.4 多结局分支(>=3)

**做法**:`challenger_launch.json` T10 每个选项带 `trigger_outcome`,服务端按玩家最后选项路由到 `_render_launch_disaster` / `_render_launch_dodged` / `_render_last_minute_evaluation` / `_render_infinite_delay`。

**好处**:
- 同一剧本给不同玩家不同叙事
- 玩家看到自己的选择真的影响了结局(因果显式)
- 灾难结局 ≠ 唯一结局:玩家可学到"还有另一种可能"(教育性)

**复用最低要求**:灾难结局 + 至少一个替代结局(否则只是"演示失败",不是"教如何避免失败")

### 1.5 真实历史档案 + 原始资料引用

**做法**:
- Boisjoly 1985-07-31 备忘录原文(英文引文)
- Feynman O 型环冰水实验
- Rogers Commission 调查结论
- 7 名宇航员姓名

**好处**:
- "1986年1月28日 11:38:73" 这种时间戳让玩家感受到真实发生的重量
- 比 "想象一个抽象场景" 的认知冲击大 10x
- 玩家可独立验证(Dörner 原书 + Wikipedia + NASA 档案)

**复用原则**:每个场景至少3 个可外部验证的真实引用(人名/日期/机构/原始文件)

### 1.6 13 状态变量网格 + 变化闪烁

**做法**:每个状态变量在状态网格里有自己的 `<span>`,服务器返回新值时前端 `applyStateChangeFlash()` 比较 prev vs next,减小的加红 flash、增大的加绿 flash(700ms)。

**好处**:
- 玩家视觉上立刻看到"工程师信心下降""进度压力上升"
- 13 个变量覆盖了决策的多个维度(经济、工程、政治、心理)
- 比单一资源条传达的信息密度高 N 倍

**复用建议**:每个场景 >=8 个独立状态变量

### 1.7 决策理由 textarea (200 字)

**做法**:每回合选项下面有可选 textarea,200 字上限,带计数器。玩家的理由被存入 `decision_justifications[turn]`,T10 反馈中引用。

**好处**:
- 强制玩家思考 "为什么选这个"(即使写得很短)
- T10 反馈可对比 "你说的" vs "实际发生",揭示认知偏差
- 留作日后个性化学习引擎的输入

**复用**:每个决策点都应提供理由输入(必填可关闭,但默认可见)

---

## 2. 失败教训(必须避免的陷阱)

### 2.1 ❌ 浅场景套模板 (30 个废弃场景)

**症状**:`coffee-shop-linear-thinking` 等20 个场景只有 `description` + `targetPatterns` 字段,无 `scenario_file`,无 Dörner 模式检测,无结局分支。

**原因**:量产心态——觉得有场景列表就显得丰富,忽略 Dörner 教育目标。

**修正**:宁可只留1 个深场景,不要30 个浅场景。

### 2.2 ❌ 路由逻辑硬编码在 JS 里 (climate-change/financial-crisis)

**症状**:`assets/js/climate-change-router.js` 27K 字符硬编码 17 个 `render*Page()` 函数,无数据文件、无测试、无 Dörner 标注。

**原因**:开发者把"前端 SPA 模式"误用为"业务逻辑容器"——结果无法迭代、无法测试、无法走统一反馈引擎。

**修正**:任何场景数据(回合/选项/反馈/结局)必须放在 JSON 里,JS 只渲染。

### 2.3 ❌ ApiService payload 包装未对齐服务端

**症状**:`ApiService.games.executeTurn()` 把 `{option, justification}` 包成 `{user_id, decisions: {option, justification}}`,但服务端 `turn_executor.py:271` 读 `decisions.get("option")`—— 永远是空。结果:T10 永远返回灾难结局(因为 `last_chosen_option=""`,默认 fallback 到 `launch_disaster`)。

**修正**:服务端加 unwrap 兜底 (`if "decisions" in decisions and isinstance(...): decisions = decisions["decisions"]`)。E2E 必须走完整 wrapper 路径,不能裸 curl。

**给 climate-change 的警告**:不要新写 wrapper,前端直接用 `ApiService.games.executeTurn()`,后端加同样的 unwrap。

### 2.4 ❌ getMockScenarios 漏写新场景 ID

**症状**:`loadScenariosPage()` fetch API 失败 → fallback `NavigationManager.getMockScenarios()` → 找不到新场景 → 玩家根本看不到卡片。

**修正**:每次新增场景,必须同步加入 mock fallback (即使前端不会真的 fallback,生产环境 API 偶尔故障)。

### 2.5 ❌ service worker 缓存旧脚本

**症状**:改了 `assets/js/challenger-router.js` 后浏览器仍跑旧版,因为 SW 缓存。提版本号才能让 SW 失效。

**修正**:每次改 JS,顺手改 `sw.js` 的 `CACHE_NAME`(v1.0.1 → v1.0.2)。

### 2.6 ❌ Playwright config 默认依赖 ffmpeg

**症状**:repo 默认 `playwright.config.js` 有 `video: 'retain-on-failure'`,需要 ffmpeg。本机 ffmpeg-1011 缺可执行文件。

**修正**:写 no-ffmpeg standalone config,显式关 video/trace/screenshot。

### 2.7 ❌ python 脚本修改 JS 文件字符串拼接错误

**症状**:我用 python 替换 `getMockScenarios` 内容时把 `return [` 错留了一个,生成 `return [return [` 语法错误,导致整个 app.js 加载失败。

**修正**:用 Edit 工具而非 python 脚本做代码替换;或者修改后用 `node --check` 验证。

### 2.8 ❌ T10→final page 死循环

**症状**:`continueToNextTurn()` 算 `nextTurn = min(lastTurnNumber + 1, TOTAL_TURNS)` → T10 后 nextTurn=10,无限重读 T10 步骤,从未进入 final 页。

**修正**:`if (this.lastTurnNumber >= TOTAL_TURNS) { renderFinalPage(); clearSnapshot(); return; }`

---

## 3. 数据格式约定 (climate-change 必须遵守)

### 3.1 scenario_file 结构

```
api-server/data/scenarios/<scenario_id_with_underscores>.json:
{
  "scenario_id": "...",
  "title": "...",
  "version": "v1.0-<date>",
  "steps": [
    {"turn": 1, "phase": "...", "situation": "...",
     "options": [{"id": "A", "text": "...", "weight": "...",
                  "consequences_for_player": "...",
                  "expected_concerns_addressed": ["..."]}],
     "expected_effects": {"A": {...}, "B": {...}, ...},
     "character_reactions": {...},
     "is_pattern_reveal": false,
     "is_final_outcome": false},
    ...
  ],
  "outcome_endings": {
    "<outcome_name>": {"narrative": "..."}
  },
  "pattern_reveal_template": {
    "round": N, "biases_revealed": [...], "narrative": "..."
  }
}
```

### 3.2 引擎接口 (climate-change 不需重写)

`challenger_scenario.py` 的纯函数 + 模式检测器是通用的,只需:
1. 改 `_load_scenario()` 加载 `climate_change.json`
2. 改 `get_initial_state()` 返回新场景的 13 个状态变量初值
3. 加场景专属的检测器(`detect_policy_whistleblower_silenced()` 等)
4. 结局渲染器可复用 `_render_launch_disaster` 模板,改文本即可

### 3.3 前端零修改 (climate-change 复用 ChallengerRouter)

`ChallengerRouter` 类接受 `scenarioId` 参数(目前硬编码 `'challenger-launch'`)。改一处即可:
```js
// challenger-router.js:11
const SCENARIO_ID = 'climate-change-policy';
```
其余 UI/UX 完全复用。

---

## 4. 验证标准 (climate-change 必须满足才出货)

### 4.1 数据深度 (8 项必填)

- [ ] JSON 文件 >=500 行
- [ ] >=10 回合,每回合4 选项
- [ ] >=8 个独立状态变量
- [ ] >=3 种结局分支(含默认失败 + 至少1 个成功)
- [ ] >=5 个 Dörner 模式显式检测(F2/F3/F4/F5/F6/F7/F8 中至少 5 个)
- [ ] >=3 个可外部验证的真实引用(人名/日期/机构/原始文件)
- [ ] T6/T8 渐进式偏差揭示(>=2 个揭示节点)
- [ ] 决策理由字段(`expected_concerns_addressed` >=2 维)

### 4.2 测试深度 (4 项必填)

- [ ] 单元测试 >=30 个 assertions
- [ ] 至少 1 个测试覆盖每个 Dörner 模式检测器
- [ ] E2E 5 测试(T1 加载 / T1→T2 提交 / 10 回合通关 / 模式揭示可见 / localStorage 持久化)
- [ ] Backend pytest 全绿,前端 E2E 全绿

### 4.3 UX 标准 (3 项必填)

- [ ] 真实档案引用可在反馈文本中直接读到
- [ ] 状态网格在每回合提交后有视觉变化反馈(flash)
- [ ] T10 结局页有清晰的 "再来一次" / "返回" 按钮

---

## 5. 时间预估 (climate-change)

基于 Challenger 的实际工时数据(2026-09-08 → 2026-09-13 = 5 天):

| 阶段 | Challenger 工时 | climate-change 预估 |
|---|---|---|
| Dörner 对齐研究 + 真实档案收集 | 1.5 天 | 1 天 (Dörner 第7章已有素材) |
| 数据 JSON 编写 | 2 天 | 1.5 天 |
| 引擎适配 + 模式检测器 | 1.5 天 | 1 天 |
| 前端集成 | 0.5 天 | 0.25 天 (ChallengerRouter 复用) |
| 测试 + E2E | 1 天 | 0.5 天 (模板复用) |
| 总计 | 6.5 天 | **4.25 天** |

模板复用率 60%,所以比 Challenger 快 35%。

---

## 6. 复用 vs 重做的判据

| 元素 | 复用 | 重做 |
|---|---|---|
| 引擎框架 (apply_turn / detect_patterns / generate_feedback) | ✅ 复用 | |
| ChallengerRouter (前端) | ✅ 复用(改 SCENARIO_ID) | |
| session_store.py / step endpoint / localStorage 持久化 | ✅ 复用 | |
| pattern_tracker (跨回合模式累计) | ✅ 复用 | |
| 8 个 detector 函数 (F2-F8) | ✅ 复用 + 改 prompt | |
| 13 状态变量集 | | ❌ 重做 (climate 有自己的维度) |
| 数据 JSON | | ❌ 重做 (不同故事) |
| 真实档案引用 | | ❌ 重做 (气候政治案例) |
| CSS 类名 (state-increased/decreased/pattern-reveal/outcome) | ✅ 复用 | |
| Outcome renderers | 部分复用 (文本重写) | |
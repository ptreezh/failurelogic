# Enron 场景 Grill-down 审计 (2026-09-13)

钢铁人审计第一轮:检测器可达性 + 根因分析。方法论同 [deep-dive-methodology]。

## 结论:P0 级缺陷 — 8 检测器仅 5 个可达

策略扫描(全 extreme_risk / 全 risky / 全 neutral / 全 safe / 全 extreme_safe / 前5激进后5诚实)结果:

| 策略 | 触发模式 |
|------|----------|
| all extreme_risk | F2, F4, F7 |
| all risky | F2, F6 |
| all neutral | F2, F8 |
| all safe / extreme_safe | (无) |
| early_risk_late_safe | F2 |

**从未触发: F1_nonlinear, F3_self_reference, F5_single_target**

这与 Challenger 修订前"5 偏差只 1 被检测"同类问题(检测器阈值与数据脱节)。

## 根因分析

### F1 非线性 — 股价数据撑不起 50% 跌幅阈值
- 检测条件:`drop_pct >= 50 且 choices >= 7`
- 最坏路径股价轨迹:`[90, 90, 100, 100, 100, 100, 100, 70, 70, 70, 70]`
- 掩盖路径初期股价反而**上涨**(T2-A +15, T6-C +10 — 史实正确:泡沫期确实涨),T7-C -30 是唯一大跌效果
- 最终跌幅 22% < 50% 阈值。崩盘只发生在结局叙事文字里,状态变量没有走完崩塌轨迹
- **修复方向**: T8-T10 的 extreme_risk 选项需要 -20/-30 级别的股价效果(史实: 2001-10 从 $33 跌到 $0.26);或结局路由前强制应用结局状态

### F3 自反性 — board_oversight_strength 在掩盖路径永远不动
- 检测条件:`silenced >= 2 且 board < 50`
- 掩盖路径 board 轨迹:`[60]*10` — 全程 60,从未下降
- 数据缺陷:JSON 中所有触碰 board 的效果都是**正向**(+10/+15/+20,全是 safe 选项的奖励);掩盖/欺骗选项从不降低董事会监督
- **修复方向**: T5(Watkins 备忘录被压下)、T7(攻击分析师)的 risky/extreme_risk 选项应加 `board_oversight_strength: -10~-15`(史实:董事会 1999 年豁免了 Fastow 的利益冲突政策)

### F5 单目标 — 启发式匹配率过低
- 检测条件:`profit_focused >= choices*0.5 且 cashflow < 0`,其中 profit_focused 依赖 `consequences_for_player` 文本包含 "share_price" 与 "+"
- 全数据集仅 7/40 选项匹配;最贪婪路径 T2-A/T6-C 匹配,但 T1-A/T4-A 等关键掩盖选项的后果文本不含 "share_price +"
- **修复方向**: 改用 weight 信号(`risky/extreme_risk` 选择占比 + cashflow < 0),与 Challenger 引擎对齐,不依赖脆弱的文本匹配

### 附带发现(非阻断)
- F3 evidence 字符串是字面 `{silenced}`/`{delta}` 未插值(缺 f 前缀)— 触发时会露出花括号
- F4 evidence 含英文变量名 `off_balance_sheet` 露出到玩家反馈
- T3-B effects 含 `whistleblower_silenced_count: 0`(加零,无意义)
- outcome 模板占位符 `{time_delay_count}` 等已正确插值

## 历史保真抽查(通过)

- Watkins 备忘录 2001-08-14 ✓(T5 时间线正确)
- LJM Partnerships 表外实体 ✓(T1-T2)
- $49.8B 破产 2001-12-02 ✓(结局叙事)
- Arthur Andersen 销毁文件 ✓(T9)
- 加州能源危机 2000-2001 ✓(T4)
- 唯一瑕疵:T3-B year 标 2001 但 Watkins 警告在 T5(2000-12 的 McMahon 警告被归并到 T3,可接受)

## 修复计划(P0 → 下个迭代)

1. **数据修复**: enron_collapse.json T8-T10 掩盖选项加股价崩塌效果;T5/T7 掩盖选项加 board 惩罚
2. **引擎修复**: F5 改用 weight 信号;F3 evidence 补 f-string;F4 evidence 汉化变量名
3. **回归**: 重跑策略扫描,8/8 检测器必须全部可达;239 后端 + 11 E2E 必须全过

## 修复验证 (2026-09-13 同日完成)

数据补丁:T5-C/T7-C/T8-C/T8-D/T9-C/T10-C/T10-D 加 board -10~-15 与股价 -20~-30;
引擎:F5 改 weight 信号(risky/extreme_risk ≥3 且 cashflow<0),F3 补 f-string,F4 汉化。

策略扫描复测:

| 策略 | 修复前 | 修复后 |
|------|--------|--------|
| all extreme_risk | F2,F4,F7 | **F1-F8 全部 8 个** |
| all risky | F2,F6 | F1,F2,F3,F5,F6,F7,F8 |
| early_risk_late_safe | F2 | F2,F4,F5,F7 |
| 可达检测器 | 5/8 | **8/8** |

结局路由不变:honest→orderly_resolution(股价$50,board 100),coverup→total_collapse(股价$0,board 5),mixed→partial_collapse。
掩盖路径终态股价 $0、董事会监督 5——与史实(2001-10 $33→$0.26)一致。

回归:239 后端 + 11 Playwright 全过。

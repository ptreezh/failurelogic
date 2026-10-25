/**
 * V3 · 概念命中可信化 —— TDD 规格测试（先红后绿）
 *
 * 本文件先于实现编写，断言的是「规格」不是「当前输出」：
 *   T1 parseTrigger 全或无：出现括号 / 引号 / 非数字右值 / 丢弃 token → 整条 unparsed
 *   T2 零行动基线：initialState 跑一遍，命中数必须为 0（恒真即缺陷）
 *   T3 派生层：三个白名单指标的正例 + 三个反例（不得把「没数据」报成 0）
 *   T4 状态口径：不得再有 missing；每条 atom 必须可分类；恒真必须单列
 *   T5 契约一致：decision_history 两种写入路径字段必须齐平
 *   T6 玩家层门禁：可见概念必须能指到回合；无法判定必须折叠且文案不撒谎
 *   T7 覆盖不撒谎：派生指标必须真被规则引用，不能"实现了但没人用"还报已覆盖
 *
 * 运行：node scripts/debrief-v3-tdd.mjs
 * 退出码 0 = 全绿，1 = 有红。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'D:/AIDevelop/failureLogic';
const fails = [];
const passes = [];

function ok(name, cond, detail) {
  if (cond) passes.push(name);
  else fails.push({ name, detail: detail == null ? '' : String(detail) });
}
function eq(name, actual, expected) {
  ok(name, actual === expected, `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
}

// ── 加载被测模块（无 DOM、无浏览器）─────────────────────────────────────
const src = fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf8')
  .replace(/\}\)\(window\);\s*$/, '})(globalThis);');
vm.runInThisContext(src, { filename: 'fl-debrief.js' });
const FL = globalThis.FLDebrief;
ok('模块导出 FLDebrief', !!FL && typeof FL.parseTrigger === 'function', '解析器未导出');
if (!FL) { report(); process.exit(1); }

const SCN_DIR = path.join(ROOT, 'assets/data/scenarios');
const scenarios = fs.readdirSync(SCN_DIR).filter((f) => f.endsWith('.json')).map((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(SCN_DIR, f), 'utf8'));
  return { id: d.scenarioId || f.replace(/\.json$/, ''), data: d };
});
eq('场景数', scenarios.length, 5);

// ── T1 解析全或无 ────────────────────────────────────────────────────────
const BAD = [
  ['括号原子', 'accepted_risks_count >= 3 AND (ignored_warnings_count >= 2 OR turn >= 8)'],
  ['单侧括号', '(accepted_risks_count >= 3)'],
  ['引号右值', 'last_choice == "加注"'],
  ['中文自然语言', '连续三次拒绝所有安全建议'],
  ['非数字右值', 'phase == reveal'],
  ['部分可解析', 'accepted_risks_count >= 3 AND 连续三次拒绝'],
  ['中文运算符', 'accepted_risks_count 大于等于 3'],
  ['空表达式', '   ']
];
const GOOD = [
  ['单原子', 'accepted_risks_count >= 3'],
  ['AND', 'a >= 1 AND b <= 2'],
  ['OR', 'a > 1 OR b < 2'],
  ['AND+OR', 'a >= 1 AND b >= 2 OR c == 0'],
  ['负数', 'a >= -1.5']
];
for (const [label, expr] of BAD) {
  const p = FL.parseTrigger(expr);
  ok(`T1 不可解析:${label}`, p === null, `返回了非 null（会被当作部分命中）: ${JSON.stringify(p)}`);
}
for (const [label, expr] of GOOD) {
  ok(`T1 可解析:${label}`, FL.parseTrigger(expr) !== null, '合法表达式被拒');
}

// 全库回扫：任何一条 trigger 只要 token 数少于片段数就算静默降级
let silentDrop = 0;
const guard = [];
for (const s of scenarios) {
  const pats = s.data.feedback_patterns || {};
  for (const k of Object.keys(pats)) {
    const p = FL.parseTrigger(pats[k].trigger);
    if (!p) continue;
    const frags = String(pats[k].trigger).split(/\s+OR\s+/i)
      .reduce((a, x) => a.concat(x.split(/\s+AND\s+/i)), []).filter((x) => x.trim());
    const atoms = p.or.reduce((a, g) => a + g.length, 0);
    if (atoms < frags.length) { silentDrop++; guard.push(`${s.id}/${k}`); }
  }
}
eq('T1 全库静默降级条数', silentDrop, 0);

// ── T2 零行动基线 ────────────────────────────────────────────────────────
let zeroHits = [];
for (const s of scenarios) {
  const list = FL.buildConcepts({ concepts: [], turns: 0 }, s.data, Object.assign({}, s.data.initialState || {}));
  list.filter((c) => c.status === 'hit').forEach((c) => zeroHits.push(`${s.id}/${c.key}`));
}
eq('T2 零行动即命中条数', zeroHits.length, 0);

// ── T3 派生层 ────────────────────────────────────────────────────────────
ok('T3 派生层导出 deriveMetrics', typeof FL.deriveMetrics === 'function', '缺少 deriveMetrics');

function mkHist(rows) {
  return rows.map((r, i) => ({
    turn: i + 1,
    option_id: 'ABCD'[i % 4],
    option_text: r.text || '',
    option_weight: r.weight,
    expected_concerns_addressed: r.concerns || [],
    applied_effects: r.eff || {},
    justification: ''
  }));
}

if (typeof FL.deriveMetrics === 'function') {
  // 正例 1：第 2 回合挨警告、第 5 回合才转向 safe → lag = 3
  const h1 = mkHist([
    { weight: 'risky', eff: {} },
    { weight: 'extreme_risk', eff: { ignored_warnings_count: 1 } },
    { weight: 'risky', eff: {} },
    { weight: 'risky', eff: {} },
    { weight: 'safe', eff: {} }
  ]);
  const d1 = FL.deriveMetrics({ decision_history: h1 }, { steps: [] });
  ok('T3 滞后:可用', d1.warning_to_response_lag.available === true, JSON.stringify(d1.warning_to_response_lag));
  eq('T3 滞后:值', d1.warning_to_response_lag.value, 3);
  eq('T3 滞后:证据回合', JSON.stringify(d1.warning_to_response_lag.evidenceTurns), JSON.stringify([2, 5]));

  // 反例 1：警告出现在最后一回合，之后没有回合可响应 → 不可用，绝不算 0
  const h2 = mkHist([
    { weight: 'safe', eff: {} },
    { weight: 'risky', eff: {} },
    { weight: 'extreme_risk', eff: { ignored_warnings_count: 1 } }
  ]);
  const d2 = FL.deriveMetrics({ decision_history: h2 }, { steps: [] });
  ok('T3 滞后反例:末回合警告不可用', d2.warning_to_response_lag.available === false,
    JSON.stringify(d2.warning_to_response_lag));
  ok('T3 滞后反例:不得报0', d2.warning_to_response_lag.value !== 0, '把「没有后续」算成了 0');

  // 正例 2：连续 4 次 risky
  const h3 = mkHist([
    { weight: 'safe' }, { weight: 'risky' }, { weight: 'risky' }, { weight: 'risky' }, { weight: 'risky' }
  ]);
  const d3 = FL.deriveMetrics({ decision_history: h3 }, { steps: [] });
  eq('T3 跟风:值', d3.consecutive_similar_choices.value, 4);

  // 反例 2：连续 5 次 neutral（没立场）不算跟风 —— 没立场不等于跟风，
  // 更不能报 0（0 会被阈值当成"确实没跟风"的真实结论）。
  const h4 = mkHist([{ weight: 'neutral' }, { weight: 'neutral' }, { weight: 'neutral' }, { weight: 'neutral' }, { weight: 'neutral' }]);
  const d4 = FL.deriveMetrics({ decision_history: h4 }, { steps: [] });
  ok('T3 跟风反例:neutral 不可用', d4.consecutive_similar_choices.available === false,
    JSON.stringify(d4.consecutive_similar_choices));
  ok('T3 跟风反例:不得报0', d4.consecutive_similar_choices.value !== 0, '把「没表态」算成了「0 次跟风」');

  // 正例 3：5 回合里 4 回合盯 revenue
  const h5 = mkHist([
    { weight: 'risky', concerns: ['revenue', 'staff'] },
    { weight: 'risky', concerns: ['revenue'] },
    { weight: 'neutral', concerns: ['revenue'] },
    { weight: 'safe', concerns: ['revenue', 'quality'] },
    { weight: 'risky', concerns: ['staff'] }
  ]);
  const d5 = FL.deriveMetrics({ decision_history: h5 }, { steps: [] });
  eq('T3 单目标:值', d5.primary_focus_dimension_count.value, 4);
  eq('T3 单目标:主导维度', d5.primary_focus_dimension_count.dimension, 'revenue');

  // 反例 3：concerns 全空 → 不可用，不得报 0
  const h6 = mkHist([{ weight: 'risky' }, { weight: 'safe' }, { weight: 'risky' }]);
  const d6 = FL.deriveMetrics({ decision_history: h6 }, { steps: [] });
  ok('T3 单目标反例:稀疏不可用', d6.primary_focus_dimension_count.available === false,
    JSON.stringify(d6.primary_focus_dimension_count));
  ok('T3 单目标反例:不得报0', d6.primary_focus_dimension_count.value !== 0, '把「没记录关注面」算成了 0');

  // 正例 4：concerns 一半有值 → 可用
  const h7 = mkHist([{ weight: 'risky', concerns: ['x'] }, { weight: 'safe', concerns: ['x'] }, { weight: 'risky', concerns: ['x'] }]);
  const d7 = FL.deriveMetrics({ decision_history: h7 }, { steps: [] });
  ok('T3 单目标:覆盖率达标可用', d7.primary_focus_dimension_count.available === true);
}

// ── T4 状态口径 ──────────────────────────────────────────────────────────
const ALLOWED_STATUS = new Set(['hit', 'miss', 'unparsed', 'no_source', 'unreached', 'constant']);
const ALLOWED_VERDICT = new Set(['derive', 'derive_runtime', 'split', 'constant', 'deprecate', 'rewrite']);
const dispos = [];
let statusBad = [];
let verdictBad = [];
let atomBad = [];
let constCount = 0;
for (const s of scenarios) {
  const list = FL.buildConcepts({ concepts: [], turns: 0 }, s.data, Object.assign({}, s.data.initialState || {}));
  eq(`T4 条数:${s.id}`, list.length, 8);
  for (const c of list) {
    dispos.push({ scenario: s.id, key: c.key, verdict: c.verdict, status: c.status });
    if (!ALLOWED_STATUS.has(c.status)) statusBad.push(`${s.id}/${c.key}=${c.status}`);
    if (!ALLOWED_VERDICT.has(c.verdict)) verdictBad.push(`${s.id}/${c.key}=${c.verdict}`);
    if (c.verdict === 'constant') constCount++;
    for (const a of c.atoms || []) {
      if (!['attr', 'init', 'derived', 'nowhere', 'unknown'].includes(a.source)) {
        atomBad.push(`${s.id}/${c.key}:${a.name}=${a.source}`);
      }
    }
  }
}
eq('T4 非法状态残留', statusBad.length, 0);
eq('T4 非法判定残留', verdictBad.length, 0);
eq('T4 未分类 atom', atomBad.length, 0);
ok('T4 恒真必须单列', constCount >= 1, `constant 判定数 = ${constCount}（climate F4 应被识别）`);
ok('T4 恒真不得混进命中', dispos.filter((d) => d.verdict === 'constant' && d.status === 'hit').length === 0,
  '仍有恒真规则以 hit 上屏');

// ── T5 契约一致：所有写入路径字段齐平 ────────────────────────────────────
// 派生层只读 decision_history。四条 push 路径里少记一个字段，
// 复盘就少一个能归因的维度——而页面不会报错，只会安静地判"不可用"。
const eng = fs.readFileSync(path.join(ROOT, 'assets/js/offline-engine.js'), 'utf8');
// 不靠固定缩进猜闭合：按出现位置切片，切到下一个 push 或块尾。
// recordDecision 用的是局部别名 hist.push，专用分支用的是 decision_history.push，
// 两者都是 history 写入路径，必须一视同仁。
const pushAt = [...eng.matchAll(/(?:decision_history|hist)\.push\(\{/g)].map((m) => m.index);
const pushBlocks = pushAt.map((at, i) => {
  const seg = eng.slice(at, i + 1 < pushAt.length ? pushAt[i + 1] : at + 4000);
  const close = seg.search(/\n\s*\}\)\s*;/);
  return close > 0 ? seg.slice(0, close) : seg.slice(0, 1500);
});
ok('T5 找到写入路径', pushBlocks.length >= 4, `只找到 ${pushBlocks.length} 处 decision_history.push`);
for (let i = 0; i < pushBlocks.length; i++) {
  const b = pushBlocks[i];
  ok(`T5 路径${i + 1} 记 turn`, /\bturn\s*:/.test(b), '缺 turn');
  ok(`T5 路径${i + 1} 记 option_orig_id`, /option_orig_id\s*:/.test(b), '缺 option_orig_id');
  ok(`T5 路径${i + 1} 记 option_weight`, /option_weight\s*:/.test(b), '缺失 → 派生层拿不到权重');
  ok(`T5 路径${i + 1} 记 expected_concerns_addressed`, /expected_concerns_addressed\s*:/.test(b),
    '缺失 → 单目标指标恒不可用，页面却显示"无法判定"');
}

// ── T7 覆盖不撒谎：派生指标必须真被规则引用 ──────────────────────────────
// 「指标有值」不等于「指标被用」。只实现不引用 = 覆盖率 0，却很容易被写成"已覆盖"。
const refBy = {};
for (const s2 of scenarios) {
  const pats = (s2.data && s2.data.feedback_patterns) || {};
  for (const k of Object.keys(pats)) {
    const tg = String(pats[k].trigger || '');
    FL.DERIVED_KEYS.forEach((dk) => {
      if (tg.indexOf(dk) >= 0) (refBy[dk] = refBy[dk] || []).push(s2.id + '/' + k);
    });
  }
}
const usedKeys = Object.keys(refBy);
ok('T7 派生指标被引用', usedKeys.length >= 2, `仅 ${usedKeys.join(',') || '无'} 被规则引用`);
ok('T7 引用条数', Object.values(refBy).reduce((a, v) => a + v.length, 0) >= 4,
  JSON.stringify(Object.fromEntries(Object.entries(refBy).map(([k, v]) => [k, v.length]))));

// ── T6 玩家层门禁 ────────────────────────────────────────────────────────
for (const s of scenarios) {
  const list = FL.buildConcepts({ concepts: [], turns: 0 }, s.data, Object.assign({}, s.data.initialState || {}));
  const visible = list.filter((c) => c.visible);
  ok(`T6 可见数受限:${s.id}`, visible.length <= 6, `可见 ${visible.length} 条，超出教学带宽`);
  for (const c of visible) {
    ok(`T6 可见必须可归因:${s.id}/${c.key}`, (c.evidenceTurns || []).length > 0,
      '可见概念指不到任何回合 = 编的');
  }
  const html = FL.renderConcepts(list, { turns: 0, concepts: list });
  ok(`T6 文案不得撒谎:${s.id}`, html.indexOf('这一局没被记录') < 0,
    '「引擎从未产出」被说成「这一局没被记录」');
  const unfixed = list.filter((c) => !c.visible).length;
  if (unfixed > 0) {
    ok(`T6 折叠必须交代:${s.id}`, /无法判定|未接入|未触发/.test(html), `折叠了 ${unfixed} 条但页面没说`);
  }
}

// ── 报告 ─────────────────────────────────────────────────────────────────
function report() {
  console.log(`\nTDD · debrief v3  通过 ${passes.length} / 失败 ${fails.length}`);
  if (fails.length) {
    console.log('\n红：');
    fails.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}${f.detail ? '\n     ' + f.detail : ''}`));
  }
  if (process.env.TDD_VERBOSE) {
    console.log('\n绿：');
    passes.forEach((p) => console.log('  ✓ ' + p));
  }
  const dist = dispos.reduce((a, d) => { a[d.verdict] = (a[d.verdict] || 0) + 1; return a; }, {});
  const st = dispos.reduce((a, d) => { a[d.status] = (a[d.status] || 0) + 1; return a; }, {});
  console.log('\n判定分布', JSON.stringify(dist));
  console.log('状态分布', JSON.stringify(st));
}
report();
process.exit(fails.length ? 1 : 0);

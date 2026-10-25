/**
 * SPEC-v2 · 验收对账（A0.x / A1.x 的机器判定）
 *
 * 为什么单独一个脚本：验收条款写在 spec 里是散文，散文不会自己报警。
 * 每条断言必须能跑出「通过 / 不通过 + 实测数值」，否则下次改规则时
 * 没人知道自己是把哪条弄坏的。
 *
 * 用法：node scripts/acceptance-m1.mjs
 * 依赖：docs/spec/grill/pattern-ledger.json、m0-matrix.json（先跑build与probe）
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'D:/AIDevelop/failureLogic';
const LEDGER = path.join(ROOT, 'docs/spec/grill/pattern-ledger.json');
const MATRIX = path.join(ROOT, 'docs/spec/grill/m0-matrix.json');
const SCEN_DIR = path.join(ROOT, 'assets/data/scenarios');

let pass = 0;
const fails = [];
const info = [];
function check(id, title, ok, detail) {
  if (ok) { pass += 1; console.log(`  PASS ${id}  ${title}${detail ? '  — ' + detail : ''}`); }
  else { fails.push(id); console.log(`  FAIL ${id}  ${title}  — ${detail}`); }
}

// ── 无头加载 fl-debrief.js ────────────────────────────────────────
const ctx = {
  window: {}, document: { createElement: () => ({ style: {}, appendChild() {} }) },
  console, setTimeout: () => 0,
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf8'), ctx);
const FL = ctx.FLDebrief || ctx.window.FLDebrief;
if (!FL) { console.log('无法加载 FLDebrief'); process.exit(1); }

const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const rows = Array.isArray(ledger) ? ledger : ledger.rows;
const scenFiles = fs.readdirSync(SCEN_DIR).filter((f) => f.endsWith('.json'));
const scenarios = {};
for (const f of scenFiles) {
  const j = JSON.parse(fs.readFileSync(path.join(SCEN_DIR, f), 'utf8'));
  scenarios[j.id || f.replace('.json', '')] = j;
}

console.log('\n═══ A0 建尺子 ═══');

// A0.1 20 组矩阵：按 (场景, 策略) 去重取最后一次结果。
// 矩阵是追加式文件，历史记录会越滚越多；直接计数会把"同一组跑过三次"
// 当成三组证据，这正是单策略采样刷绿的老毛病换了个地方复发。
let mxRuns = [];
if (!fs.existsSync(MATRIX)) {
  check('A0.1', '多策略矩阵 20 组全部产出', false, 'm0-matrix.json 不存在，先跑 probe-multistrategy --all');
} else {
  const mx = JSON.parse(fs.readFileSync(MATRIX, 'utf8'));
  mxRuns = Array.isArray(mx) ? mx : (mx.runs || []);
  const latest = new Map();
  mxRuns.forEach((r) => { latest.set(`${r.scenario}|${r.strategy}`, r); });
  const cur = [...latest.values()];
  const strats = [...new Set(cur.map((r) => r.strategy))].sort();
  const sids = [...new Set(cur.map((r) => r.scenario))];
  const combos = cur.length;
  const noTrace = cur.filter((r) => !r.trace && r.trace !== '');
  const noHitField = cur.filter((r) => !r.coverage || typeof r.coverage.hit !== 'number');
  check('A0.1', `${strats.length} 策略 × ${sids.length} 场景 = ${combos} 组矩阵`,
    combos >= 20 && noTrace.length === 0 && noHitField.length === 0,
    `去重后 ${combos} 组（策略 ${strats.join('/')}）；缺轨迹 ${noTrace.length}；缺命中字段 ${noHitField.length}`);
  info.push(`矩阵累计 ${mxRuns.length} 条，去重后有效 ${combos} 组`);

  // A0.2 随机基线：均值 + 区间，作为"命中数是否可解释"的对照
  const randRows = cur.filter((r) => String(r.strategy).startsWith('rand'));
  if (!randRows.length) {
    check('A0.2', '随机策略基线给出均值与区间', false, '无 rand 策略记录');
  } else {
    const v = randRows.map((r) => Number(r.coverage.hit) || 0);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    check('A0.2', '随机策略基线给出均值与区间', v.length >= 5 && Number.isFinite(mean),
      `n=${v.length} 均值 ${mean.toFixed(2)} 区间 [${Math.min(...v)}, ${Math.max(...v)}]`);
  }
}

// A0.3 台账五列
const cols = ['expr', 'ok', 'why', 'disposition'];
const lack = [];
rows.forEach((r) => {
  cols.forEach((c) => { if (!(c in r) && !lack.includes(c)) lack.push(c); });
  if (r.ok === false && (!r.miss || !r.miss.length) && !lack.includes('miss')) lack.push('miss');
});
check('A0.3', '台账 40 条五列齐备', rows.length === 40 && lack.length === 0,
  lack.length ? `缺列 ${lack.join(',')}` : `${rows.length} 条，改写 ${rows.filter((r) => String(r.disposition).startsWith('rewrite')).length} 待改 ${rows.filter((r) => r.disposition === 'pending_rewrite').length}`);

console.log('\n═══ A1 诊断层 ═══');

// A1.1 可上屏 ≥ 15/40
const okRows = rows.filter((r) => r.ok === true);
check('A1.1', '可上屏规则 ≥ 15/40', okRows.length >= 15, `实测 ${okRows.length}/40`);

// A1.2 每场景 ≥ 1 条可上屏
const bySid = {};
rows.forEach((r) => { bySid[r.sid] = bySid[r.sid] || { ok: 0, all: 0 }; bySid[r.sid].all += 1; if (r.ok) bySid[r.sid].ok += 1; });
const zero = Object.keys(bySid).filter((k) => bySid[k].ok === 0);
check('A1.2', '每场景 ≥ 1 条可上屏', zero.length === 0,
  zero.length ? `0 条场景：${zero.join(',')}` : Object.keys(bySid).map((k) => `${k}=${bySid[k].ok}`).join(' '));

// A1.3 每条行为类命中必须带 evidence_turn，且不得把终局值伪装成回合行为。
// 用真实跑局的 scope 统计判定，而不是构造一条顺手的假 history——
// 假数据永远能过，只有真局里的 badTurn/fakedTurn 才能证明"没伪造时序"。
const scoped = mxRuns.filter((r) => r.scope);
const badTurn = scoped.filter((r) => Number(r.scope.badTurn) > 0);
const fakedTurn = scoped.filter((r) => Number(r.scope.fakedTurn) > 0);
const behaviorAtoms = scoped.reduce((a2, r) => a2 + (Number(r.scope.behavior) || 0), 0);
check('A1.3', '行为类原子带 evidence_turn 且不得伪造回合', scoped.length > 0 && badTurn.length === 0 && fakedTurn.length === 0,
  `实跑 ${scoped.length} 局：越界回合 ${badTurn.length} 局、伪造回合 ${fakedTurn.length} 局、行为类原子 ${behaviorAtoms} 个`);

// A1.4 无孤儿派生键（有值但 0 条规则引用）
const derived = FL.DERIVED_KEYS || [];
const ruleText = rows.map((r) => String(r.expr || '')).join(' | ');
const orphans = derived.filter((k) => ruleText.indexOf(k) < 0);
check('A1.4', '无孤儿派生键（有值而 0 引用）', orphans.length === 0,
  orphans.length ? `孤儿：${orphans.join(',')}` : `${derived.length} 个派生键全部被引用`);

// A1.5 状态类原子必须标注为「终局状态」而不是「你的行为」
// 判据两层：① 概念级输出存在 scope/terminal 标记；② UI 文本不得把终局值说成回合行为。
const src = fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf8');
const hasScope = /terminal/.test(src) && /scope/.test(src);
const misleading = /(?:第\s*\d+\s*回合)[^。]{0,12}(?:股价|现金|指标)/.test(src);
check('A1.5', '状态类原子标注为终局状态', hasScope && !misleading,
  `scope 标记=${hasScope} 误读措辞=${misleading}`);

console.log('\n' + '='.repeat(60));
console.log(fails.length ? `验收 FAIL ${fails.length} 项：${fails.join(', ')}   （PASS ${pass}）`
  : `验收全部通过（${pass} 项）`);
info.forEach((s) => console.log('  · ' + s));
process.exit(fails.length ? 1 : 0);

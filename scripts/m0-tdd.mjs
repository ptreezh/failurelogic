/**
 * SPEC-v2 · M0 建尺：纯函数 + 基线双轨断言
 *
 * 轨一（A 层，静态）：解析器全或无、台账与解析器不许漂移、atoms 必须齐备。
 * 轨二（B 层，基线）：拿 probe-multistrategy.mjs 产出的 m0-baseline.json
 *                    校验分桶齐平、可见语义、策略敏感性、场景可用性。
 * 轨三（C 层，门禁）：把 spec v2 里 P0-A / M1 的目标写成红灯阈值。
 *                    这些红灯就是后续改动的验收对象，不允许先改代码再补断言。
 *
 * 跑法：node scripts/m0-tdd.mjs            （只跑 A/C 静态轨）
 *      node scripts/m0-tdd.mjs --with-baseline  （额外跑 B 层，需要基线文件）
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';
const LEDGER = path.join(ROOT, 'docs/spec/grill/pattern-ledger.json');
const BASELINE = path.join(ROOT, 'docs/spec/grill/m0-baseline.json');
const withBaseline = process.argv.includes('--with-baseline');

// ── 门禁阈值：这些数字来自 spec v2 的验收目标，改动必须同步改 spec ──
const GATE = {
  minParsableRatio: 0.8,      // M1 规则改写目标：≥80% 可被解析器吃掉（现状 62.5%）
  minVisibleRatio: 0.5,       // P0-A 目标：≥50% 规则能上屏（现状 12.5%~25%）
  minStableScenarios: 5,      // 每个场景至少要在 2 种策略下都命中 ≥1 条
  unusableScenarioRatio: 0.9, // nosrc+unparsed 占比超过此值 → 该场景不可用于验收
  minStableStrategies: 2
};

const results = [];
function check(id, title, ok, detail, level) {
  results.push({ id, title, ok: !!ok, detail: detail || '', level: level || 'hard' });
}

// ── 无头加载 fl-debrief.js（无 DOM，只取纯函数出口）──
const win = {};
const sandbox = {
  window: win,
  console,
  document: { querySelector: () => null, createElement: () => ({ style: {} }) },
  setTimeout, clearTimeout, Date, Math, JSON, Object, Array, String, Number, Boolean, RegExp
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf-8'), sandbox);
const FL = win.FLDebrief;
if (!FL) {
  console.error('FATAL: fl-debrief.js 没有导出 window.FLDebrief');
  process.exit(2);
}

const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf-8'));

// ═══ A 层：解析器与台账 ═══
const parseResults = ledger.map((r) => ({ ...r, parsed: FL.parseTrigger(r.expr) }));

const shapeBad = parseResults.filter((r) => {
  if (!r.parsed) return false;
  if (!Array.isArray(r.parsed.or) || !r.parsed.or.length) return true;
  return r.parsed.or.some(
    (g) => !Array.isArray(g) || !g.length ||
      g.some((a) => !a || !a.name || !a.op || !Number.isFinite(a.threshold))
  );
});
check('A1', '解析全或无：成功即结构完整', shapeBad.length === 0,
  shapeBad.length ? shapeBad.map((r) => r.rid).join('、') : '40 条无残缺原子');

const okButNull = parseResults.filter((r) => r.ok && !r.parsed);
const failButParsed = parseResults.filter((r) => !r.ok && r.parsed);
check('A2', '台账与解析器不漂移', okButNull.length === 0 && failButParsed.length === 0,
  `台账说可通过但解析失败 ${okButNull.length} 条；台账说失败但解析通过 ${failButParsed.length} 条`);

const atomMismatch = parseResults.filter((r) => {
  if (!r.parsed) return false;
  const names = new Set();
  r.parsed.or.forEach((g) => g.forEach((a) => names.add(a.name)));
  const declared = new Set(r.atoms || []);
  if (names.size !== declared.size) return true;
  for (const n of names) if (!declared.has(n)) return true;
  return false;
});
check('A3', '台账 atoms 与解析器抽出的原子一致', atomMismatch.length === 0,
  atomMismatch.map((r) => `${r.sid}/${r.rid}`).join('、') || '逐条集合相等');

// 防回退：早期实现用 filter(Boolean) 丢弃失败原子，导致 "A AND (B OR C)" 退化成 "A" 仍算通过。
const degenerate = FL.parseTrigger('a_count >= 1 AND b_pressure < 50 OR 这一条不是原子');
check('A4', '拒绝残缺原子（防退化）', degenerate === null,
  degenerate ? '仍把含非法原子的表达式判为可解析' : '含非法原子的复合表达式正确返回 null');

const parsable = parseResults.filter((r) => r.parsed).length;
const dotRatio = parsable / parseResults.length;
check('A5', `可解析率 ≥ ${(GATE.minParsableRatio * 100).toFixed(0)}%`, dotRatio >= GATE.minParsableRatio,
  `${parsable}/${parseResults.length} = ${(dotRatio * 100).toFixed(1)}%`, 'goal');

const whyDist = {};
ledger.forEach((r) => { if (!r.ok) whyDist[r.why] = (whyDist[r.why] || 0) + 1; });
check('A6', '失败原因必须归类（不许只报"失败"）',
  Object.keys(whyDist).every((k) => k && k !== 'unknown'), JSON.stringify(whyDist));

// ═══ C 层：门禁红灯（这些是后续改动的验收对象）═══
if (withBaseline && fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf-8'));
  const runs = base.runs || [];
  const byScenario = {};
  runs.forEach((r) => { (byScenario[r.scenario] = byScenario[r.scenario] || []).push(r); });

  // B1 分桶齐平：六桶之和必须等于 total，多一桶少一桶都说明有概念被静默丢掉
  const bucketBad = [];
  runs.forEach((r) => {
    const cv = r.coverage || r;
    const sum = ['hit', 'miss', 'unparsed', 'unreached', 'no_source', 'constant']
      .reduce((s, k) => s + (cv[k] || 0), 0);
    if (cv.total == null || sum !== cv.total) {
      bucketBad.push(`${r.scenario}/${r.strategy}: ${sum} vs total ${cv.total}`);
    }
  });
  check('B1', '五态分桶之和 == total', bucketBad.length === 0, bucketBad.join('；') || `${runs.length} 局全部齐平`);

  // B2 可见语义：能上屏的必须能指回回合，且 hit 标记与模型一致
  const visBad = [];
  runs.forEach((r) => {
    const cv = r.coverage || r;
    const domHit = (r.concepts || []).filter((c) => c.hit).length;
    if ((r.concepts || []).length !== cv.visible) visBad.push(`${r.scenario}/${r.strategy}: DOM≠visible`);
    if (domHit !== cv.hit) visBad.push(`${r.scenario}/${r.strategy}: 命中标记 ${domHit}≠模型 ${cv.hit}`);
    (r.concepts || []).forEach((c) => { if (!c.where) visBad.push(`${r.scenario}/${r.strategy}: ${c.name} 指不回回合`); });
  });
  check('B2', '可见概念必须指回回合且与模型一致', visBad.length === 0, visBad.join('；') || '逐局一致');

  // B3 策略敏感性：若换策略结论不变，说明规则对路径无感，多策略基线就是摆设
  const sensitive = Object.keys(byScenario).filter((sid) => {
    const hits = byScenario[sid].map((r) => (r.coverage || r).hit || 0);
    return new Set(hits).size > 1;
  });
  check('B3', '至少一个场景的命中随策略变化（证明单策略采样不可信）',
    sensitive.length >= 1, `敏感场景 ${sensitive.length}/${Object.keys(byScenario).length}：${sensitive.join('、')}`);

  // B4 单策略门禁反例：存在场景只在某一种策略下命中，说明"只跑一种策略"会偶发绿
  const singleGreen = Object.keys(byScenario).filter((sid) => {
    const hits = byScenario[sid].map((r) => (r.coverage || r).hit || 0);
    return hits.some((h) => h > 0) && hits.some((h) => h === 0);
  });
  check('B4', '存在"换策略就由绿转红"的场景（CI 不能只跑单策略）',
    singleGreen.length >= 1, `${singleGreen.length} 个场景：${singleGreen.join('、')}`);

  // B5 场景可用性：解析不了/接不进来的规则占绝大多数时，该场景不能充当验收样本
  const unusable = [];
  Object.keys(byScenario).forEach((sid) => {
    const r = byScenario[sid][0];
    const cv = r.coverage || r;
    const bad = ((cv.no_source || 0) + (cv.unparsed || 0)) / (cv.total || 1);
    if (bad > GATE.unusableScenarioRatio) unusable.push(`${sid}(${(bad * 100).toFixed(0)}%)`);
  });
  check('B5', '废场景必须被标记为不可用于验收', true,
    unusable.length ? `不可用：${unusable.join('、')}` : '无');

  // ── D 层：spec v2 §6 的 A0.1 / A0.2 原文断言 ──────────────────────
  const pol = base.policies || {};
  const nGroups = pol.groups || runs.length;
  const nStrats = (pol.strategies || []).length;
  check('D1', 'A0.1 多策略矩阵 ≥4 策略 × 5 场景（≥20 组）', nStrats >= 4 && nGroups >= 20,
    `${nStrats} 策略 × ${(pol.scenarios || []).length} 场景 = ${nGroups} 组`);

  // A0.1 后半：每组都要有命中数与 evidence_turn。type/attr 原子的回合来自场景声明，
  // 所以这里校验的是"每条可见概念都带 where"，而不是要求所有规则都有回合。
  const noTurn = [];
  runs.forEach((r) => {
    (r.concepts || []).forEach((c) => { if (!c.where) noTurn.push(`${r.scenario}/${r.strategy}:${c.name}`); });
  });
  check('D2', 'A0.1 每组可见概念都带证据回合', noTurn.length === 0,
    noTurn.length ? `${noTurn.length} 条缺回合：${noTurn.slice(0, 3).join(', ')}` : `${runs.length} 组齐备`);

  const rb = base.randomBaseline || {};
  const randOk = rb.hit && rb.hit.n >= 4 && rb.hit.mean != null && rb.hit.min != null && rb.hit.max != null;
  check('D3', 'A0.2 随机策略基线给出均值与区间', randOk,
    randOk ? `命中均值 ${rb.hit.mean}，区间 ${rb.hit.min}–${rb.hit.max}（n=${rb.hit.n}）`
      : '随机基线缺失或样本不足');

  // C1 每个场景都要在 ≥2 种策略下稳定命中 ≥1 条（P0-A 收敛目标）
  const unstable = [];
  Object.keys(byScenario).forEach((sid) => {
    const okStrats = byScenario[sid].filter((r) => ((r.coverage || r).hit || 0) >= 1).length;
    if (okStrats < GATE.minStableStrategies) unstable.push(`${sid}(${okStrats}种)`);
  });
  check('C1', `每场景须在 ≥${GATE.minStableStrategies} 种策略下命中 ≥1 条`,
    unstable.length === 0, unstable.join('、') || '全部达标', 'goal');

  // C2 可见率门禁（P0-A）
  const lowVis = Object.keys(byScenario).map((sid) => {
    const r = byScenario[sid][0];
    const cv = r.coverage || r;
    return { sid, ratio: (cv.visible || 0) / (cv.total || 1) };
  }).filter((x) => x.ratio < GATE.minVisibleRatio);
  check('C2', `可见率 ≥ ${(GATE.minVisibleRatio * 100).toFixed(0)}%`, lowVis.length === 0,
    lowVis.map((x) => `${x.sid} ${(x.ratio * 100).toFixed(0)}%`).join('、') || '全部达标', 'goal');
} else if (withBaseline) {
  // 基线是离线产物，缺失时不阻塞 CI（否则换机器/清缓存就红），由棘轮负责提醒回落。
  check('B0', '需要 m0-baseline.json 才能跑基线轨', false, `未找到 ${BASELINE}`, 'goal');
}

// ── 棘轮：只许前进。目标未达时记录当前水位，任何一项倒退立即硬失败 ──
const RATCHET = path.join(ROOT, 'docs/spec/grill/m0-ratchet.json');
const metrics = { parsableRatio: Number(dotRatio.toFixed(4)) };
if (withBaseline && fs.existsSync(BASELINE)) {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf-8'));
  const runs = base.runs || [];
  const byS = {};
  runs.forEach((r) => { (byS[r.scenario] = byS[r.scenario] || []).push(r); });
  const sids = Object.keys(byS);
  metrics.stableScenarios = sids.filter((sid) =>
    byS[sid].filter((r) => ((r.coverage || r).hit || 0) >= 1).length >= GATE.minStableStrategies).length;
  metrics.worstVisibleRatio = Number(Math.min(...sids.map((sid) => {
    const cv = byS[sid][0].coverage || byS[sid][0];
    return (cv.visible || 0) / (cv.total || 1);
  })).toFixed(4));
}
let prevRatchet = null;
if (fs.existsSync(RATCHET)) {
  try { prevRatchet = JSON.parse(fs.readFileSync(RATCHET, 'utf-8')); } catch { /* ignore */ }
}
if (prevRatchet) {
  const worse = ['parsableRatio', 'worstVisibleRatio', 'stableScenarios']
    .filter((k) => metrics[k] != null && prevRatchet[k] != null && metrics[k] < prevRatchet[k]);
  check('R1', '指标不得倒退（棘轮）', worse.length === 0,
    worse.length
      ? worse.map((k) => `${k} ${prevRatchet[k]} -> ${metrics[k]}`).join('; ')
      : `parsable=${metrics.parsableRatio} visible=${metrics.worstVisibleRatio ?? '-'} stable=${metrics.stableScenarios ?? '-'}`);
}
fs.writeFileSync(RATCHET, JSON.stringify({ ...prevRatchet, ...metrics, updated: new Date().toISOString() }, null, 1), 'utf-8');

// ── 报表 ──
const hardFail = results.filter((r) => !r.ok && r.level === 'hard');
const goalFail = results.filter((r) => !r.ok && r.level === 'goal');
console.log('\nM0 TDD 断言');
for (const r of results) {
  const tag = r.ok ? 'PASS' : (r.level === 'goal' ? 'TODO' : 'FAIL');
  console.log(`  ${tag.padEnd(4)} ${r.id.padEnd(3)} ${r.title}${r.detail ? '  · ' + r.detail : ''}`);
}
console.log(`\n合计 ${results.filter((r) => r.ok).length} PASS / ${hardFail.length} FAIL / ${goalFail.length} TODO`);
if (goalFail.length) {
  console.log('TODO（spec 目标，当前未达；不阻塞 CI，但棘轮禁止倒退）：');
  goalFail.forEach((r) => console.log(`  - ${r.id} ${r.title} · ${r.detail}`));
}
if (hardFail.length) {
  console.log('FAIL（回归/撒谎类，必须修）：');
  hardFail.forEach((r) => console.log(`  - ${r.id} ${r.title} · ${r.detail}`));
  process.exit(1);
}

/**
 * 把 probe-multistrategy.mjs 的原始矩阵（可能累积多轮）压成 m0-baseline.json。
 *
 * 为什么要单列一个脚本：矩阵是 append 的，同一个 (场景, 策略) 会有多条历史记录；
 * 直接拿全量跑断言会把"上一版代码的成绩"和"这一版"混算，水位就永远说不清。
 * 这里只取每个 (场景, 策略) 的最后一条，并额外算出随机策略的均值与区间
 * （spec A0.2 要求）。
 *
 * 跑法：node scripts/build-m0-baseline.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';
const MATRIX = path.join(ROOT, 'docs/spec/grill/m0-matrix.json');
const OUT = path.join(ROOT, 'docs/spec/grill/m0-baseline.json');

const raw = JSON.parse(fs.readFileSync(MATRIX, 'utf-8'));
const all = Array.isArray(raw) ? raw : (raw.runs || []);

// 同一个 (场景, 策略) 只保留最后一条：矩阵是累积写入的
const latest = new Map();
all.forEach((r) => latest.set(`${r.scenario}|${r.strategy}`, r));
const runs = [...latest.values()].map((r) => {
  const cv = r.coverage || {};
  return {
    scenario: r.scenario,
    strategy: r.strategy,
    ok: !!r.ok,
    trace: r.trace || r.strategy,
    total: cv.total,
    visible: cv.visible,
    coverage: cv,
    // concepts 只留断言需要的三列，避免基线文件膨胀
    concepts: (r.concepts || []).map((c) => ({ name: c.name, hit: c.hit, where: c.where }))
  };
});

const pick = (r) => r.coverage || r;
const scenarios = [...new Set(runs.map((r) => r.scenario))];
const strategies = [...new Set(runs.map((r) => r.strategy))];

// ── 随机策略基线（A0.2）：只看 rand:* 的策略，给出均值与 min–max 区间 ──
const randRuns = runs.filter((r) => /^rand/.test(r.strategy));
const randHits = randRuns.map((r) => pick(r).hit || 0);
const randVisible = randRuns.map((r) => pick(r).visible || 0);
const stat = (arr) => {
  if (!arr.length) return { n: 0, mean: null, min: null, max: null };
  const sum = arr.reduce((a, b) => a + b, 0);
  return {
    n: arr.length,
    mean: +(sum / arr.length).toFixed(2),
    min: Math.min(...arr),
    max: Math.max(...arr)
  };
};

// 每个场景单独给一份随机基线：全局均值会掩盖"某场景随机永远 0 命中"
const perScenario = {};
scenarios.forEach((sid) => {
  const rs = randRuns.filter((r) => r.scenario === sid);
  perScenario[sid] = {
    hit: stat(rs.map((r) => pick(r).hit || 0)),
    visible: stat(rs.map((r) => pick(r).visible || 0))
  };
});

const out = {
  updated: new Date().toISOString(),
  source: 'docs/spec/grill/m0-matrix.json',
  policies: { scenarios, strategies, groups: runs.length },
  randomBaseline: {
    hit: stat(randHits),
    visible: stat(randVisible),
    perScenario
  },
  runs
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf-8');
console.log(`基线已写入 ${OUT}`);
console.log(`  分组 ${runs.length}（${scenarios.length} 场景 × ${strategies.length} 策略：${strategies.join(', ')}）`);
console.log(`  随机命中均值 ${out.randomBaseline.hit.mean}，区间 ${out.randomBaseline.hit.min}–${out.randomBaseline.hit.max}（n=${out.randomBaseline.hit.n}）`);
console.log(`  随机可见均值 ${out.randomBaseline.visible.mean}，区间 ${out.randomBaseline.visible.min}–${out.randomBaseline.visible.max}`);

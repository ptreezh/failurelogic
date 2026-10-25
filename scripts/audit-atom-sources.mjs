/**
 * 给台账里的每个原子判定"数据来源等级"，产出 atom-sources.json。
 *
 * 为什么必须做这件事：把可解析率从 62.5% 刷到 80% 有两条路——
 *   ① 让解析器认识更多写法（真修）；
 *   ② 把解析不了的表达式换成引擎里根本不存在的键（假修，看起来绿）。
 * ② 的后果很严重：规则能解析、能参与求值，但它求的那个值是 undefined，
 * 于是永不命中，或者被兜底成 0 而误命中。玩家看到的归因就变成纯噪声。
 *
 * 所以先把"这个原子到底从哪来"钉死成四档，后续改写只允许落在有源档位：
 *   state      —— 场景 initialState / expected_effects 里真实存在
 *   derived    —— 由 decision_history 逐回合算出来的（定义在 fl-debrief.js）
 *   attr       —— 场景 steps 顶层声明（如 temperature_forecast_f）
 *   unsupported—— 全仓找不到来源，引用它的规则要么改语义、要么下线
 *
 * 跑法：node scripts/audit-atom-sources.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';
const LEDGER = path.join(ROOT, 'docs/spec/grill/pattern-ledger.json');
const OUT = path.join(ROOT, 'docs/spec/grill/atom-sources.json');
const SCEN_DIR = path.join(ROOT, 'assets/data/scenarios');

const FILES = ['challenger_launch', 'climate_change', 'enron_collapse', 'noodle_shop_community', 'chip_ai_supplychain'];

// 派生层现有出口（与 fl-debrief.js 的 DERIVED_KEYS 对齐，由脚本末尾交叉校验）
const DERIVED = ['warning_to_response_lag', 'consecutive_similar_choices', 'primary_focus_dimension_count'];

const initKeys = new Set();
const effKeys = new Set();
const stepKeys = new Set();
const HITS = {}; // atom -> {state: [...场景], effects: [...场景], attr: [...]}
// 逐场景的键集合：全局有源不等于某场景有源。
// ignored_warnings_count 在 challenger 有、在 noodle-shop 没有，
// 只按全局判会把 noodle 那条规则误判成"可求值"，而它其实永远 undefined。
const perScenarioKeys = {};

FILES.forEach((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(SCEN_DIR, `${f}.json`), 'utf-8'));
  const keys = new Set(Object.keys(d.initialState || {}));
  Object.keys(d.initialState || {}).forEach((k) => { initKeys.add(k); (HITS[k] = HITS[k] || {}).state = ((HITS[k] || {}).state || []).concat(f); });
  (d.steps || []).forEach((st) => {
    Object.keys(st).forEach((k) => { stepKeys.add(k); keys.add(k); });
    Object.values(st.expected_effects || {}).forEach((ef) => {
      Object.keys(ef || {}).forEach((k) => { effKeys.add(k); keys.add(k); (HITS[k] = HITS[k] || {}).effects = ((HITS[k] || {}).effects || []).concat(f); });
    });
  });
  perScenarioKeys[f] = keys;
});

// 台账里的 sid 是连字符写法，文件名是下划线，统一一下
const sidToFile = {};
FILES.forEach((f) => { sidToFile[f.replace(/_/g, '-')] = f; });

const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf-8'));
const used = new Map(); // atom -> [{sid, rid}]
ledger.forEach((r) => (r.atoms || []).forEach((a) => {
  if (!used.has(a)) used.set(a, []);
  used.get(a).push({ sid: r.sid, rid: r.rid });
}));

const atoms = {};
const tally = { state: 0, derived: 0, attr: 0, unsupported: 0 };

// 场景 json 里出现过、但引擎不写进 state 的键：出现 ≠ 可读，
// 这一档单独列出来，避免"文案里提过"被当成"状态里有"。
[...used.keys()].sort().forEach((a) => {
  const h = HITS[a] || {};
  let source;
  let why;
  if (DERIVED.includes(a)) {
    source = 'derived';
    why = '由 decision_history 逐回合派生';
  } else if (h.effects || h.state) {
    source = 'state';
    const inScen = [...new Set((h.effects || []).concat(h.state || []))];
    why = `initialState/expected_effects 命中：${inScen.join('、')}`;
  } else if (stepKeys.has(a)) {
    source = 'attr';
    why = '场景 steps 顶层声明';
  } else {
    source = 'unsupported';
    why = '5 个场景的 initialState 与 expected_effects 中均无此键，引擎不会写入';
  }
  tally[source] += 1;
  atoms[a] = { source, why, usedBy: used.get(a) };
});

// 附带：台账中被引用但"根本没有来源"的原子，究竟卡住哪些规则
// 规则级可得性：只按"这条规则所在场景"判断，全局有源不算数
const ruleAvailability = [];
ledger.forEach((r) => {
  const file = sidToFile[r.sid];
  const keys = file ? perScenarioKeys[file] : new Set();
  const missing = (r.atoms || []).filter((a) => {
    if (DERIVED.includes(a)) return false;
    return !keys.has(a);
  });
  if (missing.length) {
    ruleAvailability.push({
      sid: r.sid,
      rid: r.rid,
      expr: r.expr,
      missing,
      // 全局有源、只是本场景没写 → 补场景数据即可（工种③）
      // 全 5 场景都没有 → 引擎根本不产这个量（工种②/下线）
      kind: missing.every((a) => (atoms[a] || {}).source === 'unsupported') ? 'no_source_anywhere' : 'missing_in_scenario'
    });
  }
});
const blocked = ruleAvailability.filter((x) => x.kind === 'no_source_anywhere');
const patchable = ruleAvailability.filter((x) => x.kind === 'missing_in_scenario');

const out = {
  updated: new Date().toISOString(),
  legend: {
    state: '场景 initialState / expected_effects 真实键',
    derived: 'fl-debrief.js 从 decision_history 派生',
    attr: '场景 steps 顶层声明',
    unsupported: '全仓无来源；引用即噪声，必须改写或下线'
  },
  tally,
  derivedKeys: DERIVED,
  sourceSets: {
    initialStateKeys: initKeys.size,
    expectedEffectsKeys: effKeys.size
  },
  atoms,
  ruleAvailability,
  blockedRules: blocked,
  patchableRules: patchable
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf-8');
console.log(`原子来源台账已写入 ${OUT}`);
console.log(`  共 ${used.size} 个被引用原子：state ${tally.state} / derived ${tally.derived} / attr ${tally.attr} / unsupported ${tally.unsupported}`);
console.log(`  规则级缺口 ${ruleAvailability.length} 条：`);
ruleAvailability.forEach((b) => console.log(`    [${b.kind === 'no_source_anywhere' ? '无源' : '本场景缺键'}] ${b.sid}/${b.rid} ← ${b.missing.join(', ')}`));

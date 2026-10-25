/**
 * SPEC-v2 · M1 诊断层（P0-A / A-2 时序脱钩）— 纯函数 TDD
 *
 * 为什么先写这个再改代码：
 *   A-2 的病灶是「命中 = 终局数值过阈值」，而玩家读到的却是「你在第 N 回合犯了
 *   这个错」。只要 atoms 上没有回合，任何"命中"都无法证明它指回了哪一回合，
 *   于是改得越多、伪叙事越多。所以 G 层断言只做一件事：
 *   强制每个原子交代「这是行为（带回合）还是终局状态（无回合）」。
 *
 * 断言分两类：
 *   硬断言（hard）：必须是绿的，红了不许合入。
 *   目标断言（goal）：spec 的达标线，未达不算崩，但必须打出来。
 *
 * 跑法：node scripts/m1-tdd.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';

const results = [];
function check(id, title, ok, detail, level) {
  results.push({ id, title, ok: !!ok, detail: detail || '', level: level || 'hard' });
}

// ── 无头加载（与 m0-tdd 同一套接缝，不碰 DOM）──
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

// ═══ 夹具 ═══════════════════════════════════════════════════════════
// 合成数据，不用真实场景：断言只关心「元数据是否交代清楚回合」，
// 用真实场景会把"规则文案对不对"和"回合有没有标"混在一起，红了也说不清是哪一类。
const SC = {
  scenarioId: 'fixture',
  initialState: { cash_flow: 100 },
  steps: [
    { turn: 1, expected_effects: { o1: { cash_flow: -5 } } },
    { turn: 2, expected_effects: { o1: { cash_flow: -5 } } }
  ],
  feedback_patterns: {
    P_BEHAVIOR: {
      trigger: 'consecutive_similar_choices > 2',
      dorner_concept: '跟风连选',
      evidence_template: '连续同立场'
    },
    P_LAG: {
      trigger: 'warning_to_response_lag > 2',
      dorner_concept: '警告滞后',
      evidence_template: '警告后迟迟不响应'
    },
    P_STATE: {
      // 阈值故意高于 initialState(100)，否则零行动即命中，会被正确地判成 constant
      trigger: 'cash_flow > 150',
      dorner_concept: '终局状态类',
      evidence_template: '现金仍充足'
    }
  }
};

// 四回合同立场 → consecutive_similar_choices = 4（可上屏），
// 其中第 2、4 回合带 concerns，关注面不稀疏 → primary_focus 也可用。
function histSame(n, withWarn) {
  const w = ['safe', 'safe', 'safe', 'safe', 'safe'].slice(0, n);
  return w.map((weight, i) => ({
    turn: i + 1,
    weight,
    expected_concerns_addressed: i % 2 === 0 ? ['cost'] : ['speed'],
    applied_effects: withWarn && i === 1 ? { ignored_warnings_count: 1 } : {}
  }));
}

function runConcepts(hist) {
  const state = { cash_flow: 60, decision_history: hist };
  // 注意真实签名是 buildConcepts(model, scenarioData, state)，参数顺序写反会让
  // deriveMetrics 读到空 state，全部原子变 null —— 这类错位必须靠断言暴露。
  return FL.buildConcepts({}, SC, state);
}

// 场景 steps 里声明过的状态键 → 回合。这是 attr 原子的合法回合来源。
const ATTR_TURNS = (() => {
  const m = {};
  (SC.steps || []).forEach((st) => {
    Object.keys(st.expected_effects || {}).forEach((oid) => {
      Object.keys(st.expected_effects[oid] || {}).forEach((k) => {
        (m[k] = m[k] || []).push(Number(st.turn));
      });
    });
  });
  return m;
})();

const byKey = (arr) => arr.reduce((m, c) => (m[c.key] = c, m), {});
const allAtoms = (concepts) => concepts.reduce((acc, c) => acc.concat(c.atoms.map((a) => ({ ...a, concept: c.key }))), []);

// ═══ G1/G2 每个原子必须交代 scope 与 evidenceTurn ═══════════════
{
  const cs = runConcepts(histSame(4, true));
  const atoms = allAtoms(cs);
  const missingScope = atoms.filter((a) => a.scope !== 'behavior' && a.scope !== 'terminal');
  const missingTurnKey = atoms.filter((a) => !Object.prototype.hasOwnProperty.call(a, 'evidenceTurn'));

  check('G1', '每个原子都声明 scope(behavior|terminal)', missingScope.length === 0,
    `${missingScope.length}/${atoms.length} 个原子无合法 scope` +
    (missingScope.length ? `：${missingScope.slice(0, 3).map((a) => `${a.concept}.${a.name}`).join(', ')}` : ''));

  check('G2', '每个原子都有 evidenceTurn 键（允许 null）', missingTurnKey.length === 0,
    `${missingTurnKey.length}/${atoms.length} 个原子缺 evidenceTurn 键`);
}

// ═══ G3 behavior 原子必须给得出合法回合 ══════════════════════════
{
  const hist = histSame(4, true);
  const cs = runConcepts(hist);
  const total = hist.length;
  const behavior = allAtoms(cs).filter((a) => a.scope === 'behavior');
  const bad = behavior.filter((a) => {
    const ts = a.evidenceTurns || [];
    if (!ts.length) return true;
    if (!Number.isInteger(a.evidenceTurn) || a.evidenceTurn !== ts[0]) return true;
    return ts.some((t) => !Number.isInteger(t) || t < 1 || t > total);
  });

  check('G3', 'behavior 原子的 evidenceTurn 落在 1..总回合', behavior.length > 0 && bad.length === 0,
    behavior.length === 0
      ? '一个 behavior 原子都没有：回合级派生层未生效'
      : `${bad.length}/${behavior.length} 个越界：${bad.slice(0, 3).map((a) => `${a.concept}.${a.name}=${a.evidenceTurn}`).join(', ')}`);
}

// ═══ G4 状态类原子不得伪装成回合行为（spec A1.5）═════════════════
{
  const cs = runConcepts(histSame(4, true));
  const terminal = allAtoms(cs).filter((a) => a.scope === 'terminal');
  const faked = terminal.filter((a) => a.evidenceTurn != null);

  check('G4', 'terminal 原子的 evidenceTurn 必须为 null', faked.length === 0,
    faked.length ? `${faked.length} 个状态类原子挂了回合：${faked.map((a) => `${a.concept}.${a.name}=${a.evidenceTurn}`).join(', ')}`
      : `${terminal.length} 个 terminal 原子，回合均为 null`);
}

// ═══ G5 concept 级回合不许凭空造（溯源）═════════════════════════
{
  const cs = runConcepts(histSame(4, true));
  const orphan = [];
  cs.forEach((c) => {
    const own = new Set();
    c.atoms.filter((a) => a.scope === 'behavior').forEach((a) => (a.evidenceTurns || []).forEach((t) => own.add(t)));
    // attr 原子的回合来自场景 steps 的声明，属合法来源，不算凭空造。
    c.atoms.forEach((a) => {
      if (a.source === 'attr') (ATTR_TURNS[a.name] || []).forEach((t) => own.add(t));
    });
    (c.evidenceTurns || []).forEach((t) => { if (!own.has(t)) orphan.push(`${c.key}@${t}`); });
  });

  // attr 类回合来自场景声明（idx.turns），属合法来源，这里只校验 derived 回合。
  check('G5', 'concept 级回合可溯源到某个 behavior 原子', orphan.length === 0,
    orphan.length ? `${orphan.length} 个无来源回合：${orphan.slice(0, 4).join(', ')}` : `全部可溯源`);
}

// ═══ G6 回合序列升序去重（保住既有行为，不许倒退）════════════════
{
  const cs = runConcepts(histSame(4, true));
  const bad = cs.filter((c) => {
    const t = c.evidenceTurns || [];
    const sorted = [...new Set(t)].sort((a, b) => a - b);
    return JSON.stringify(t) !== JSON.stringify(sorted);
  });

  check('G6', 'concept.evidenceTurns 升序且去重', bad.length === 0,
    bad.length ? `${bad.map((c) => c.key).join(', ')} 未排序` : `${cs.length} 条规则全部有序`);
}

// ═══ G7 零历史：不许造回合、不许编数值 ═══════════════════════════
{
  const cs = runConcepts([]);
  const atoms = allAtoms(cs);
  const invented = atoms.filter((a) => a.scope === 'behavior' && a.evidenceTurn != null);
  const conceptsWithTurn = cs.filter((c) => (c.evidenceTurns || []).length > 0);

  check('G7', '零行动局不得产出任何行为回合', invented.length === 0,
    invented.length ? `${invented.length} 个原子在零行动局挂了回合：${invented.slice(0, 3).map((a) => a.name).join(', ')}`
      : `0 个行为回合；${conceptsWithTurn.length} 条规则仍带回合（应来自场景声明 attr）`);
}

// ═══ G8 不可用的派生值不许变成 0（V3 纪律：unavailable 不是 false）══
{
  const cs = runConcepts([]);
  const zeroed = allAtoms(cs).filter(
    (a) => FL.DERIVED_KEYS.indexOf(a.name) >= 0 && a.value === 0
  );

  check('G8', '不可用的派生原子不得降级为 0', zeroed.length === 0,
    zeroed.length ? `${zeroed.length} 个派生原子被写成 0：${zeroed.map((a) => a.name).join(', ')}`
      : `无派生原子被 0 填充`);
}

// ═══ G9 行为类命中必须能指回回合（spec A1.3 的产品侧口径）════════
{
  const cs = runConcepts(histSame(4, true));
  const hitConcepts = cs.filter((c) => c.status === 'hit');
  const unlocatable = hitConcepts.filter((c) => {
    const hasBehavior = c.atoms.some((a) => a.scope === 'behavior');
    return hasBehavior && !(c.evidenceTurns || []).length;
  });

  check('G9', '含行为原子的命中规则必须能指回回合', hitConcepts.length > 0 && unlocatable.length === 0,
    hitConcepts.length === 0 ? '夹具未命中任何规则，断言无效' :
      `${unlocatable.length}/${hitConcepts.length} 条命中无法定位回合`);
}

// ═══ I 层：新增派生键（把"引擎没记的计数器"从 history 算出来）════════
// 每个键都必须满足三条：① 有结构化数据源（不看中文关键词猜）② 不可用时 null
// ③ 可用时必须能指回具体回合。少一条，它就是给玩家看的假归因。
{
  const need = ['deferred_consequence_count', 'single_concern_choices',
    'analyst_confidence_drop_count', 'no_change_after_reveal'];
  const missing = need.filter((k) => FL.DERIVED_KEYS.indexOf(k) < 0);
  check('I1', '新增派生键已注册到 DERIVED_KEYS', missing.length === 0,
    missing.length ? `未注册：${missing.join(', ')}` : `已注册 ${need.length} 个`);

  // 构造一局：第1回合单维关注+推迟后果+分析师下调，第2-3回合相同行为
  const h = [
    { turn: 1, option_weight: 'risky', expected_concerns_addressed: ['share_price_usd'],
      applied_effects: { consequence_deferred_queue: 2, analyst_confidence_index: -10 } },
    { turn: 2, option_weight: 'risky', expected_concerns_addressed: ['share_price_usd'],
      applied_effects: { consequence_deferred_queue: 1, analyst_confidence_index: -5 } },
    { turn: 3, option_weight: 'safe', expected_concerns_addressed: ['board_oversight_strength', 'credit_rating'],
      applied_effects: { analyst_confidence_index: 3 } },
    { turn: 4, option_weight: 'safe', expected_concerns_addressed: ['credit_rating'],
      applied_effects: {} }
  ];
  // concerns 必须是多选题，"单维"才成立；否则引擎会以 concerns_not_multidim 拒绝计算。
  const opts = [];
  for (let i = 0; i < 9; i++) {
    opts.push({ id: 'O' + i, expected_concerns_addressed: i % 2 ? ['a', 'b'] : ['a', 'c'] });
  }
  const m = FL.deriveMetrics({ decision_history: h }, { steps: [{ turn: 1, options: opts }] });

  const exp = {
    deferred_consequence_count: 2,
    single_concern_choices: 3,
    analyst_confidence_drop_count: 2
  };
  const wrong = Object.keys(exp).filter((k) => !m[k] || m[k].value !== exp[k]);
  check('I2', '新派生键在构造局上算出正确值', wrong.length === 0,
    wrong.length ? wrong.map((k) => `${k}: 得到 ${m[k] && m[k].value}，期望 ${exp[k]}`).join('；')
      : Object.keys(exp).map((k) => `${k}=${m[k].value}`).join('，'));

  // value 为 0 且 available=true 是合法结论（他确实一次也没这么做），此时无回合可指；
  // 只有 value>0 才必须能指回回合。
  const noTurn = Object.keys(exp).filter((k) => m[k] && m[k].available && m[k].value > 0 && !(m[k].evidenceTurns || []).length);
  check('I3', '正计数的派生键必须带证据回合', noTurn.length === 0,
    noTurn.length ? `缺回合：${noTurn.join(', ')}` : '全部带回合');

  // 零行动：没打过任何回合，所有键都不可用，不许给出 0
  const zero = FL.deriveMetrics({ decision_history: [] }, { steps: [] });
  const fakedZero = need.filter((k) => zero[k] && zero[k].available === true);
  const notRegistered = need.filter((k) => !zero[k]);
  check('I4', '零行动局所有新派生键 available=false',
    notRegistered.length === 0 && fakedZero.length === 0,
    notRegistered.length ? `键未注册：${notRegistered.join(', ')} 导致断言空转`
      : (fakedZero.length ? `${fakedZero.join(', ')} 在零行动局被报成可用` : '全部标记不可用'));

  // no_change_after_reveal 需要知道 reveal 回合：没有 reveal 结构时必须不可用
  const noReveal = FL.deriveMetrics({ decision_history: h }, { steps: [{ turn: 1, options: [] }] });
  check('I5', '没有 reveal 结构时 no_change_after_reveal 不可用',
    !!noReveal.no_change_after_reveal && noReveal.no_change_after_reveal.available === false,
    !noReveal.no_change_after_reveal ? '键未注册，断言空转'
      : (noReveal.no_change_after_reveal.available
        ? `被报成可用：value=${noReveal.no_change_after_reveal.value}` : '正确标记不可用'));
}

// ═══ J 层：把"只写在叙事里的判断"变成可从 history 复算的计数器 ══════
// climate/enron 的自反性、chip 的局部优化与乐观叙事，原本引用的是三个
// 引擎从不产出的键。补数据源有两条路：
//   ① 给 200 个选项逐个打语义 tag —— 语义最准，但 tag 本身也是人写的判断，
//      错了没人能发现；
//   ② 从 applied_effects 的**实际后果**反推行为性质 —— 每一条都能指回回合，
//      玩家可以自己核对"我第几回合干的"。
// 这里选 ②：不可复核的标注不如可复核的推断。三个键都必须过下面四关。
{
  const need = ['strategy_backfire_count', 'cost_cut_local_count', 'optimism_claim_count'];
  const missing = need.filter((k) => FL.DERIVED_KEYS.indexOf(k) < 0);
  check('J1', 'J 层三个派生键已注册', missing.length === 0,
    missing.length ? `未注册：${missing.join(', ')}` : `已注册 ${need.length} 个`);

  // 自反性：同一套打法，前两回合有效（指标涨），后两回合同一打法指标转负。
  // 这不是"选错了"，是"他一直用同一招，而那招改变了他人的反应"。
  const backfire = [
    { turn: 1, option_weight: 'aggressive', applied_effects: { international_trust: 6 } },
    { turn: 2, option_weight: 'aggressive', applied_effects: { international_trust: 4 } },
    { turn: 3, option_weight: 'aggressive', applied_effects: { international_trust: -5 } },
    { turn: 4, option_weight: 'aggressive', applied_effects: { international_trust: -8 } }
  ];
  const mB = FL.deriveMetrics({ decision_history: backfire }, { steps: [] });
  const bf = mB.strategy_backfire_count;
  check('J2', '自反性：同姿态由好转变为坏记为反噬', !!bf && bf.available && bf.value === 1
    && (bf.evidenceTurns || []).length === 1,
    !bf ? '键未注册' : `value=${bf.value} available=${bf.available} 回合=${JSON.stringify(bf.evidenceTurns || [])}`);

  // 局部优化：省下研发钱、当期现金变好，但良率/士气在掉 = 只优化了一个局部量
  const localCut = [
    { turn: 1, option_weight: 'conservative', applied_effects: { rnd_budget: -8, cash_flow: 12, yield_rate: -2 } },
    { turn: 2, option_weight: 'conservative', applied_effects: { cash_flow: 5 } },
    { turn: 3, option_weight: 'conservative', applied_effects: { rnd_budget: -6, cash_flow: 9, yield_rate: -3 } }
  ];
  const mL = FL.deriveMetrics({ decision_history: localCut }, { steps: [] });
  const lc = mL.cost_cut_local_count;
  check('J3', '局部优化：省钱同时伤长期能力才计数', !!lc && lc.available && lc.value === 2
    && (lc.evidenceTurns || []).join(',') === '1,3',
    !lc ? '键未注册' : `value=${lc.value} 回合=${JSON.stringify(lc.evidenceTurns || [])}`);

  // 乐观叙事：自我感觉变好（perception_bias 上升）但风险没降（supply_chain_risk 不降）
  const optimistic = [
    { turn: 1, option_weight: 'aggressive', applied_effects: { perception_bias: 6, supply_chain_risk: 2 } },
    { turn: 2, option_weight: 'aggressive', applied_effects: { perception_bias: 4, supply_chain_risk: -3 } },
    { turn: 3, option_weight: 'aggressive', applied_effects: { supply_chain_risk: -2 } }
  ];
  const mO = FL.deriveMetrics({ decision_history: optimistic }, { steps: [] });
  const oc = mO.optimism_claim_count;
  check('J4', '乐观叙事：只抬自我认知不降风险才计数', !!oc && oc.available && oc.value === 1
    && (oc.evidenceTurns || []).join(',') === '1',
    !oc ? '键未注册' : `value=${oc.value} 回合=${JSON.stringify(oc.evidenceTurns || [])}`);

  // 零行动基线：三个键都不许把"没打过"报成 0
  const zero2 = FL.deriveMetrics({ decision_history: [] }, { steps: [] });
  const faked = need.filter((k) => !zero2[k] || zero2[k].available === true);
  check('J5', '零行动局 J 层三键全部不可用', faked.length === 0,
    faked.length ? `被报成可用或未注册：${faked.join(', ')}` : '全部标记不可用');

  // 反例守卫：全程同姿态但一路变好，不许算成反噬（否则"坚持"会被误判成"自反"）
  const steady = [
    { turn: 1, option_weight: 'aggressive', applied_effects: { international_trust: 3 } },
    { turn: 2, option_weight: 'aggressive', applied_effects: { international_trust: 2 } },
    { turn: 3, option_weight: 'aggressive', applied_effects: { international_trust: 4 } }
  ];
  const mS = FL.deriveMetrics({ decision_history: steady }, { steps: [] });
  const sc = mS.strategy_backfire_count;
  check('J6', '一路向好的同姿态不得判为反噬', !!sc && sc.available && sc.value === 0,
    !sc ? '键未注册' : `value=${sc.value}`);
}

// ═══ H 层：数据源诚实性（防"为了刷可解析率而编造原子"）════════════
// 这一层不看指标好不好看，只看一件事：规则求值的那个量，引擎到底会不会产出来。
{
  const SCEN = path.join(ROOT, 'assets/data/scenarios');
  const FILES = ['challenger_launch', 'climate_change', 'enron_collapse', 'noodle_shop_community', 'chip_ai_supplychain'];
  // 场景 id 与文件名不是简单替换关系（climate-change-policy → climate_change.json），
  // 用引擎里的权威映射，别靠字符串猜。
  const SID2FILE = {
    'challenger-launch': 'challenger_launch',
    'climate-change-policy': 'climate_change',
    'enron-collapse': 'enron_collapse',
    'noodle-shop-community': 'noodle_shop_community',
    'chip-ai-supplychain': 'chip_ai_supplychain'
  };
  let ledger = [];
  try {
    ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/spec/grill/pattern-ledger.json'), 'utf-8'));
  } catch (e) { ledger = []; }

  const perScen = {};
  const retired = {}; // sid -> {rid: reason}
  FILES.forEach((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(SCEN, `${f}.json`), 'utf-8'));
    const keys = new Set(Object.keys(d.initialState || {}));
    (d.steps || []).forEach((st) => {
      Object.values(st.expected_effects || {}).forEach((ef) => Object.keys(ef || {}).forEach((k) => keys.add(k)));
    });
    perScen[f] = keys;
    // 记录本场景声明下线的概念，H1/H2 对它们豁免——但 H3 会反过来检查"下线必须有理由"
    const fp = d.feedback_patterns || {};
    Object.keys(fp).forEach((rid) => {
      if (fp[rid] && fp[rid].retired) {
        retired[f] = retired[f] || {};
        retired[f][rid] = String(fp[rid].retired === true ? '' : fp[rid].retired);
      }
    });
  });

  // H1 首回合可得性：规则引用的原子必须在场景 initialState 里显式初始化。
  // 只在 expected_effects 中途出现的键，前几个回合求值拿到的是 undefined，
  // 规则既不命中也不报错——静默失效比报错更难查。
  const noInit = [];
  const isRetired = (r) => {
    const file = SID2FILE[r.sid];
    return !!(retired[file] && retired[file][r.rid]);
  };
  ledger.forEach((r) => {
    if (!r.ok) return; // 解析不了的规则由 A 层负责，这里只管能跑的
    if (isRetired(r)) return;
    const file = SID2FILE[r.sid];
    if (!file) return;
    const d = JSON.parse(fs.readFileSync(path.join(SCEN, `${file}.json`), 'utf-8'));
    const init = new Set(Object.keys(d.initialState || {}));
    // attr 类键由引擎在回合中产出，首回合没有是正常的（"这事还没发生"，
    // 不等于"永远不会有"）。H1 只该管那些既不在初值、也没人产出的真空键。
    const attrKeys = new Set();
    (d.steps || []).forEach((st) => {
      Object.values(st.expected_effects || {}).forEach((ef) => {
        Object.keys(ef || {}).forEach((k) => attrKeys.add(k));
      });
    });
    (r.atoms || []).forEach((a) => {
      if (FL.DERIVED_KEYS.indexOf(a) >= 0) return;
      if (attrKeys.has(a)) return;
      if (!init.has(a)) noInit.push(`${r.sid}/${r.rid}:${a}`);
    });
  });
  check('H1', '规则引用的原子必须在场景 initialState 显式初始化', noInit.length === 0,
    noInit.length ? `${noInit.length} 处缺初值：${noInit.slice(0, 5).join(', ')}` : '全部显式初始化');

  // H2 无源原子不得存活：全 5 个场景都没有的键，规则要么改写要么下线，
  // 不许留在"能解析、能求值、永远拿 undefined"的状态里冒充诊断能力。
  const allKeys = new Set();
  Object.values(perScen).forEach((k) => k.forEach((x) => allKeys.add(x)));
  const dead = [];
  ledger.forEach((r) => {
    if (!r.ok) return;
    if (isRetired(r)) return;
    (r.atoms || []).forEach((a) => {
      if (FL.DERIVED_KEYS.indexOf(a) >= 0) return;
      if (!allKeys.has(a)) dead.push(`${r.sid}/${r.rid}:${a}`);
    });
  });
  check('H2', '无源原子不得存活在规则里（改写或下线）', dead.length === 0,
    dead.length ? `${dead.length} 处引用无源原子：${[...new Set(dead)].slice(0, 5).join(', ')}` : '无死引用');

  // H3 下线必须留理由：把概念删掉很容易，"为什么删"没人记得，
  // 三个月后有人重新接数据源也复活不了它。理由为空即视为违规。
  const noReason = [];
  Object.keys(retired).forEach((f) => {
    Object.keys(retired[f]).forEach((rid) => {
      if (!retired[f][rid].trim()) noReason.push(`${f}/${rid}`);
    });
  });
  check('H3', 'retired 规则必须写明下线理由', noReason.length === 0,
    noReason.length ? `${noReason.length} 条无理由：${noReason.slice(0, 4).join(', ')}` : '均有理由');
}

// ═══ 输出 ═══════════════════════════════════════════════════════
const hardFails = results.filter((r) => r.level === 'hard' && !r.ok);
const goalFails = results.filter((r) => r.level === 'goal' && !r.ok);

console.log('\nM1 TDD — 诊断层回合级（P0-A / A-2）\n');
for (const r of results) {
  const tag = r.ok ? 'PASS' : (r.level === 'goal' ? 'TODO' : 'FAIL');
  console.log(`  ${tag} ${r.id}  ${r.title}  — ${r.detail}`);
}
console.log(`\n合计 ${results.filter((r) => r.ok).length} PASS / ${hardFails.length} FAIL / ${goalFails.length} TODO\n`);

if (hardFails.length) {
  console.log('FAIL 项（硬断言，必须转绿才能进入下一里程碑）');
  hardFails.forEach((r) => console.log(`  - ${r.id} ${r.title} — ${r.detail}`));
  process.exit(1);
}
process.exit(0);

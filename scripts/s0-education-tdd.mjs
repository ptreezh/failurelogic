/**
 * S0 · 教育目标对齐 —— A4.1–A4.13 机器断言（先红后绿）
 *
 * 依据：docs/spec/education-aligned-refactor-spec-v3.md §7 A 类
 * 范围：S0 = noodle-shop-community 单场景试点；其余 4 场景标 S1，只报不计红。
 *
 * 设计原则（与 debrief-v3-tdd.mjs 一致）：
 *   1. 断言的是「规格」，不是「当前输出」。实现没跟上就该红。
 *   2. 每条断言必须能在无 DOM、无浏览器的环境里跑，否则进不了 CI。
 *   3. 缺数据 ≠ 通过。缺字段一律 fail，不许静默跳过。
 *
 * 运行：node scripts/s0-education-tdd.mjs
 * 退出码 0 = S0 与全局门禁全绿，1 = 有红。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT = 'D:/AIDevelop/failureLogic';
const S0 = new Set(['noodle-shop-community']);

const rows = [];
function ok(id, name, cond, detail, scope) {
  rows.push({
    id,
    name,
    ok: !!cond,
    detail: detail == null ? '' : String(detail),
    scope: scope || 'S0'
  });
}

// ── 加载被测模块（无 DOM）──────────────────────────────────────────────
const src = fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf8')
  .replace(/\}\)\(window\);\s*$/, '})(globalThis);');
vm.runInThisContext(src, { filename: 'fl-debrief.js' });
const FL = globalThis.FLDebrief;
ok('PRE', '模块导出 FLDebrief', !!FL && typeof FL.build === 'function', '构建器未导出', 'GLOBAL');
if (!FL) { report(); process.exit(1); }

const SCN_DIR = path.join(ROOT, 'assets/data/scenarios');
const scenarios = fs.readdirSync(SCN_DIR).filter((f) => f.endsWith('.json')).map((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(SCN_DIR, f), 'utf8'));
  return { id: d.scenarioId || f.replace(/\.json$/, ''), data: d };
});
ok('PRE', '场景数 = 5', scenarios.length === 5, `实际 ${scenarios.length}`, 'GLOBAL');

function inS0(id) { return S0.has(id); }
function scopeOf(id) { return inS0(id) ? 'S0' : 'S1'; }

// 造一局有行动的 state：用场景真实选项跑满回合（走 A 选项，制造命中与未命中并存）
function mkState(d) {
  const hist = [];
  (d.steps || []).forEach((st, i) => {
    const opt = (st.options || [])[0] || {};
    const eff = (st.expected_effects || {})[opt.id] || {};
    hist.push({
      turn: i + 1,
      option_id: opt.id,
      option_orig_id: opt.id,
      option_text: opt.text || '',
      option_weight: opt.weight,
      expected_concerns_addressed: opt.expected_concerns_addressed || [],
      applied_effects: eff,
      justification: ''
    });
  });
  const ends = Object.keys(d.outcome_endings || {});
  return Object.assign({}, d.initialState || {}, {
    decision_history: hist,
    final_outcome: { id: ends[0] || 'unknown', tier: 'teaching' }
  });
}

// ── A4.1 brief 存在且结构完整 ───────────────────────────────────────────
for (const s of scenarios) {
  const b = s.data.brief;
  ok('A4.1', `brief 存在:${s.id}`, !!b && typeof b === 'object',
    '缺少 brief 对象 —— 玩家只能从散文里猜目标', scopeOf(s.id));
  if (!b) continue;
  const objs = Array.isArray(b.objectives) ? b.objectives : [];
  ok('A4.1', `objectives ≥3:${s.id}`, objs.length >= 3, `实际 ${objs.length}`, scopeOf(s.id));
  ok('A4.1', `impossible 非空:${s.id}`,
    typeof b.impossible === 'string' && b.impossible.trim().length >= 8,
    '缺 impossible 句 —— 多目标冲突这一课就没了', scopeOf(s.id));
  ok('A4.1', `how_judged 非空:${s.id}`,
    typeof b.how_judged === 'string' && b.how_judged.trim().length >= 8,
    '缺 how_judged —— 玩家会把决策练习当解谜', scopeOf(s.id));
}

// ── A4.1 卡片简报必须与数据同源 ────────────────────────────────────
// brief 同时存在两处：场景 JSON（权威）与 app.js 内联 SCENARIOS（卡片渲染取用）。
// 两处文案一旦漂移，玩家看到的就不是被断言的版本——所以这里做文本级同源检查。
const appSrcBrief = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
for (const s of scenarios) {
  const b = s.data.brief;
  if (!b) continue;
  const miss = [];
  for (const o of b.objectives || []) {
    if (!appSrcBrief.includes(o.text)) miss.push(`目标「${o.text}」`);
  }
  if (b.impossible && !appSrcBrief.includes(b.impossible)) miss.push('impossible 那句');
  ok('A4.1', `卡片简报与数据同源:${s.id}`, miss.length === 0,
    `app.js 内联简报缺：${miss.join('、')}`, scopeOf(s.id));
}

// ── A4.2 objective 必须映射到 initialState 实有指标 ─────────────────────
for (const s of scenarios) {
  const b = s.data.brief;
  if (!b || !Array.isArray(b.objectives)) continue;
  const keys = new Set(Object.keys(s.data.initialState || {}));
  for (const o of b.objectives) {
    // 必须有 metrics，且每个指标都是 initialState 里真实存在、会被引擎推动的键。
    // 早前放过「o.id 本身是 initialState 键」这条捷径，等于允许把 id 写成指标名蒙混过关，
    // 目标与指标的绑定关系就查不出来了。已收掉。
    const ms = Array.isArray(o.metrics) ? o.metrics : [];
    if (ms.length === 0) {
      ok('A4.2', `objective 可映射:${s.id}/${o.id}`, false,
        '缺 metrics 数组 —— 目标没有落到任何会被推动的数字上', scopeOf(s.id));
      continue;
    }
    const bad = ms.filter((m) => !keys.has(m));
    ok('A4.2', `objective 可映射:${s.id}/${o.id}`, bad.length === 0,
      `metrics 中的 ${bad.join('、')} 不在 initialState（现有 ${keys.size} 个键）`,
      scopeOf(s.id));
  }
}

// ── A4.3 终局概念条数 = 8，玩家视图状态二元 ─────────────────────────────
ok('A4.3', '导出 buildConceptCards', typeof FL.buildConceptCards === 'function',
  '静态/动态解耦后的卡片构造器未导出，无法在 CI 校验', 'S0');

for (const s of scenarios) {
  if (!inS0(s.id)) continue;
  const state = mkState(s.data);
  const model = FL.build({ state, scenarioData: s.data, scenarioConfig: {} });
  const cards = Array.isArray(model && model.conceptCards) ? model.conceptCards : null;
  if (!cards) {
    ok('A4.3', `终局卡片存在:${s.id}`, false, 'model.conceptCards 未生成', 'S0');
    continue;
  }
  ok('A4.3', `卡片条数=8:${s.id}`, cards.length === 8, `实际 ${cards.length}`, 'S0');
  const allowed = new Set(['hit', 'not_triggered']);
  const badStatus = cards.filter((c) => !allowed.has(c.status)).map((c) => `${c.key}=${c.status}`);
  ok('A4.3', `状态二元:${s.id}`, badStatus.length === 0, badStatus.join('、'), 'S0');
  const undef = cards.filter((c) => c.concept == null || c.status == null).map((c) => c.key);
  ok('A4.3', `无 undefined:${s.id}`, undef.length === 0, undef.join('、'), 'S0');
}

// ── A4.4 静态层不依赖 trigger 求值（本轮最重要一条）──────────────────────
// 把全部 trigger 强制改成永不成立的表达式，终局仍必须列出 8 个概念。
// 只要有人把静态层的显示条件重新绑回 trigger，这条立刻红。
for (const s of scenarios) {
  if (!inS0(s.id)) continue;
  const clone = JSON.parse(JSON.stringify(s.data));
  Object.keys(clone.feedback_patterns || {}).forEach((k) => {
    clone.feedback_patterns[k].trigger = 'zzz_never_produced_atom >= 999999';
  });
  const model = FL.build({ state: mkState(clone), scenarioData: clone, scenarioConfig: {} });
  const html = FL.renderHtml(model) || '';
  const names = Object.keys(clone.feedback_patterns || {})
    .map((k) => clone.feedback_patterns[k].dorner_concept || k);
  const missing = names.filter((n) => html.indexOf(n) < 0);
  ok('A4.4', `trigger 全假仍全显:${s.id}`, missing.length === 0,
    `渲染里少了 ${missing.length} 个概念：${missing.join('、')}`, 'S0');
  const cards = model.conceptCards || [];
  const wrong = cards.filter((c) => c.status !== 'not_triggered').map((c) => `${c.key}=${c.status}`);
  ok('A4.4', `全假时状态一致:${s.id}`, wrong.length === 0, wrong.join('、'), 'S0');
}

// ── A4.5 40 条概念均有现实锚定，且 ≤30 字 ───────────────────────────────
for (const s of scenarios) {
  const pats = s.data.feedback_patterns || {};
  for (const k of Object.keys(pats)) {
    const a = pats[k].real_world_anchor;
    const len = typeof a === 'string' ? a.replace(/\s/g, '').length : -1;
    ok('A4.5', `现实锚定:${s.id}/${k}`,
      typeof a === 'string' && len > 0 && len <= 30,
      a == null ? '缺失' : `长度 ${len}（上限 30）`, scopeOf(s.id));
  }
}

// ── A4.6 weight 徽标不得出现英文单词 ────────────────────────────────────
ok('A4.6', '导出 stanceLabel', typeof FL.stanceLabel === 'function',
  '没有 weight→中文徽标的唯一出口，徽标文案散在页面里无法校验', 'GLOBAL');
if (typeof FL.stanceLabel === 'function') {
  const weights = new Set();
  for (const s of scenarios) {
    for (const st of s.data.steps || []) {
      for (const o of st.options || []) if (o.weight) weights.add(String(o.weight));
    }
  }
  const bad = [];
  for (const w of weights) {
    const label = String(FL.stanceLabel(w) || '');
    if (!label) bad.push(`${w}=空`);
    else if (/[a-z]{6,}/.test(label)) bad.push(`${w}→${label}`);
  }
  ok('A4.6', '徽标无英文长词', bad.length === 0, bad.join('、'), 'GLOBAL');
}

// ── A4.7 提交到生效之间必须有可撤销窗口或二次确认 ───────────────────────
const engSrc = fs.readFileSync(path.join(ROOT, 'assets/js/offline-engine.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(ROOT, 'assets/js/app.js'), 'utf8');
const undoRe = /(undoWindow|fl-undo|撤销|二次确认|confirmSubmit|pendingChoice|revertChoice)/;
ok('A4.7', '存在撤销窗口/二次确认', undoRe.test(appSrc) || undoRe.test(engSrc),
  '单选即提交 —— 教人谨慎决策的游戏却不允许撤回一次手滑', 'GLOBAL');

// ── A4.8 「写一句」可跳过且不影响计分 ───────────────────────────────────
const noteRe = /(reflect_note|reflection_note|写一句|remember_this)/;
ok('A4.8', '存在写一句入口', noteRe.test(appSrc) || noteRe.test(engSrc),
  '终局没有元认知写入口', 'GLOBAL');
if (noteRe.test(appSrc) || noteRe.test(engSrc)) {
  ok('A4.8', '写一句可跳过', /跳过|skip/.test(appSrc) || /跳过|skip/.test(engSrc),
    '有入口但无跳过路径，会阻断流程', 'GLOBAL');
}

// ── A4.9 单局时长净增 ≤5 分钟 ───────────────────────────────────────────
const timingFile = path.join(ROOT, 'docs/spec/s0-timing.json');
if (fs.existsSync(timingFile)) {
  try {
    const t = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
    ok('A4.9', '时长净增 ≤5 分钟', Number(t.netGainMinutes) <= 5,
      `实测净增 ${t.netGainMinutes} 分钟（基线 ${t.baselineMinutes}，新 ${t.newMinutes}）`, 'GLOBAL');
  } catch (e) {
    ok('A4.9', '时长净增 ≤5 分钟', false, 's0-timing.json 解析失败：' + e.message, 'GLOBAL');
  }
} else {
  rows.push({
    id: 'A4.9', name: '时长净增 ≤5 分钟', ok: true, skip: true,
    detail: '未采集（需 docs/spec/s0-timing.json，S0 第 1 步计时后回填）', scope: 'PENDING'
  });
}

// ── A4.10 behavior 不得 ≥90% 集中单一值（防偷懒标注）────────────────────
// 8 个枚举是闭集：写错一个词（expandd / cutting）若无人拦，A4.10 的集中度
// 与 A4.11 的台账都会照样绿——标注等于没有约束。所以取值必须校验。
const BEHAVIORS = new Set(['expand', 'hold', 'analyze', 'defer',
  'rescue', 'cut_cost', 'ignore_warning', 'commit']);
for (const s of scenarios) {
  if (!inS0(s.id)) continue;
  const opts = [];
  for (const st of s.data.steps || []) for (const o of st.options || []) opts.push(o);
  const missing = opts.filter((o) => !o.behavior).map((o) => o.id);
  ok('A4.10', `behavior 全覆盖:${s.id}`, missing.length === 0,
    `${missing.length}/${opts.length} 个选项缺 behavior`, 'S0');
  const illegal = opts.filter((o) => o.behavior && !BEHAVIORS.has(o.behavior))
    .map((o) => `${o.id}=${o.behavior}`);
  ok('A4.10', `behavior 取值合法:${s.id}`, illegal.length === 0,
    illegal.join('、'), 'S0');
  // goal_axis / goal_sacrificed 必须指回 brief 里真实存在的目标，且二者不交集：
  // 「为了做大牺牲做大」这种自相矛盾的标注必须当场拦下，否则冲突课讲不通。
  const objIds = new Set(((s.data.brief || {}).objectives || []).map((o) => o.id));
  const badAxis = [];
  for (const o of opts) {
    const ax = o.goal_axis || [];
    const sc = o.goal_sacrificed || [];
    const ghosts = [...ax, ...sc].filter((x) => !objIds.has(x));
    if (ghosts.length) badAxis.push(`${o.id} 目标不存在(${ghosts.join(',')})`);
    else if (ax.some((x) => sc.includes(x))) badAxis.push(`${o.id} 同一目标既轴又牺牲`);
  }
  ok('A4.10', `目标轴合法:${s.id}`, badAxis.length === 0, badAxis.join('、'), 'S0');
  if (missing.length === 0 && opts.length) {
    const dist = {};
    opts.forEach((o) => { dist[o.behavior] = (dist[o.behavior] || 0) + 1; });
    const top = Object.keys(dist).sort((a, b) => dist[b] - dist[a])[0];
    const ratio = dist[top] / opts.length;
    ok('A4.10', `behavior 不集中:${s.id}`, ratio < 0.9,
      `${top} 占 ${(ratio * 100).toFixed(0)}%（${dist[top]}/${opts.length}）`, 'S0');
  }
}

// ── A4.11 behavior 必填 + 文本变更必须同步（哈希台账）────────────────────
const lockFile = path.join(ROOT, 'docs/spec/grill/option-behavior-lock.json');
ok('A4.11', '存在 behavior 哈希台账', fs.existsSync(lockFile),
  '缺 docs/spec/grill/option-behavior-lock.json —— 改选项文本不改 behavior 无人能发现', 'GLOBAL');
if (fs.existsSync(lockFile)) {
  const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
  const stale = [];
  for (const s of scenarios) {
    if (!inS0(s.id)) continue;
    const rec = lock[s.id] || {};
    for (const st of s.data.steps || []) {
      for (const o of st.options || []) {
        const h = crypto.createHash('sha1').update(String(o.text || '')).digest('hex').slice(0, 12);
        // 选项 id 在场景内按回合重复（A-D × 10 轮），台账 key 为「回合:选项」
        const key = `${st.turn}:${o.id}`;
        const r = rec[key];
        if (!r) stale.push(`${s.id}/${key} 未入账`);
        else if (r.text_hash !== h) stale.push(`${s.id}/${key} 文本已变(${r.text_hash}→${h})`);
        else if (r.behavior !== o.behavior) stale.push(`${s.id}/${key} behavior ${r.behavior}→${o.behavior}`);
      }
    }
  }
  ok('A4.11', '台账与数据一致', stale.length === 0, stale.join('、'), 'S0');
}

// ── A4.12 concerns 短语不得有孤儿（必须映射到已声明目标）─────────────────
// 玩家在选项上看到的是「你回应了流量焦虑」这类短语。若它不指向任何目标，
// 玩家就没法把「我照顾了什么」和「我牺牲了什么」对上——目标冲突这一课落不下来。
//
// 允许一类例外：method（认清局面 / 先试一点）不是目标，是决策方式。
// 但它是垃圾桶风险最高的一栏，所以卡死占比 ≤25%。
for (const s of scenarios) {
  const b = s.data.brief;
  if (!b || !Array.isArray(b.objectives)) continue;
  const sc = scopeOf(s.id);
  const objIds = new Set(b.objectives.map((o) => o.id));
  const byConcern = new Map();
  (b.objectives || []).forEach((o) => {
    if (!Array.isArray(o.concerns) || o.concerns.length === 0) {
      ok('A4.12', `目标有对应关切:${s.id}/${o.id}`, false,
        '该目标没声明 concerns —— 数据里的选项短语指不到它', sc);
    }
    (o.concerns || []).forEach((p) => byConcern.set(String(p), o.id));
  });
  (b.method_concerns || []).forEach((p) => byConcern.set(String(p), 'method'));
  const extra = s.data.concern_objective_map || {};
  Object.keys(extra).forEach((p) => byConcern.set(String(p), String(extra[p])));

  const used = new Set();
  for (const st of s.data.steps || []) {
    for (const o of st.options || []) {
      for (const p of o.expected_concerns_addressed || []) used.add(String(p));
    }
  }
  const orphans = [...used].filter((p) => !byConcern.has(p));
  ok('A4.12', `无孤儿 concerns:${s.id}`, orphans.length === 0,
    `${orphans.length} 个短语无归属：${orphans.slice(0, 8).join('、')}${orphans.length > 8 ? '…' : ''}`,
    sc);

  const ghost = [...byConcern.keys()].filter((p) => !used.has(p));
  ok('A4.12', `映射表无空挂:${s.id}`, ghost.length === 0,
    `映射表里 ${ghost.length} 条数据中不存在：${ghost.slice(0, 8).join('、')}`, sc);

  const badTarget = [...byConcern.entries()]
    .filter(([, v]) => v !== 'method' && !objIds.has(v)).map(([p, v]) => `${p}→${v}`);
  ok('A4.12', `归属目标真实存在:${s.id}`, badTarget.length === 0, badTarget.slice(0, 8).join('、'), sc);

  const methodCount = [...byConcern.values()].filter((v) => v === 'method').length;
  const ratio = used.size ? methodCount / used.size : 1;
  ok('A4.12', `method 不超 25%:${s.id}`, ratio <= 0.25,
    `method 占 ${(ratio * 100).toFixed(0)}%（${methodCount}/${used.size}）—— 这一栏是给「认清局面」留的，不是垃圾桶`,
    sc);
}

// ── A4.13 目标冲突仪表必须"事后可见、事前不可见" ─────────────────────────
// A4.12 只保证数据齐（短语指得回目标），渲染丢了一样过。而这条断言真正守的
// 是 L0-2 的教学边界：仪表只能读已提交的 decision_history。
// 若它读挂起态（选中但未确认），玩家点下去之前就知道自己在牺牲什么，
// F5「单目标优化」这道题就被提前演示了答案 —— 于是没有人会在这道题上犯错，
// 也就没人在复盘里认出自己犯过错（T3/T4 断链）。
{
  const read = (f) => {
    try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { return ''; }
  };
  const router = read('assets/js/challenger-router.js');
  const engine = read('assets/js/offline-engine.js');
  const css = read('assets/css/challenger.css');

  ok('A4.13', '仪表渲染入口存在',
    /_renderGoalTension\(/.test(router) && router.includes('challenger-goal-tension'), '', 'S0');

  // 位置：模板里 "${this._renderGoalTension()}" 必须出现在 state-grid 之前。
  const iPaint = router.indexOf('_renderGoalTension()}');
  const iGrid = router.indexOf('id="challenger-state-grid"');
  ok('A4.13', '仪表排在指标芯片上方', iPaint > -1 && iGrid > -1 && iPaint < iGrid,
    `模板顺序 ${iPaint} / 指标 ${iGrid} —— 玩家先看数字、后看目标关系，等于没讲冲突`, 'S0');

  // 只读口径：抽出方法体，必须见到 decision_history，且不得见到挂起态字段。
  // 注意别用 indexOf('_renderGoalTension()')：模板里的调用点比方法定义更早，
  // 会截到一段纯模板字符串，于是"没读 decision_history"这种假红。
  const body = (() => {
    const m = router.match(/_renderGoalTension\(\)\s*\{/);
    if (!m) return '';
    const i = m.index;
    const j = router.indexOf('\n    _', i + 10);
    return router.slice(i, j > i ? j : i + 4000);
  })();
  ok('A4.13', '仪表只读已提交决策', /decision_history/.test(body),
    '仪表没读 decision_history —— 它读的是别的什么东西', 'S0');
  const preLeak = ['pendingChoice', 'pending_choice', 'confirm-bar', 'is-selected', 'selectedOption']
    .filter((k) => body.includes(k));
  ok('A4.13', '仪表不预告未提交代价', preLeak.length === 0,
    `方法体引用了挂起态字段：${preLeak.join('、')} —— 这会把选择代价提前泄给玩家`, 'S0');

  // 引擎侧：四条 history 写入路径都要带标注字段，缺一条就有一条路径永远显示"未涉及"。
  const pushes = engine.split('expected_concerns_addressed:').length - 1;
  const withAxis = engine.split('goal_axis:').length - 1;
  const withSac = engine.split('goal_sacrificed:').length - 1;
  ok('A4.13', 'history 全路径携带目标标注', pushes > 0 && withAxis >= pushes && withSac >= pushes,
    `history 写入 ${pushes} 处，带 goal_axis ${withAxis} 处、goal_sacrificed ${withSac} 处`, 'S0');

  ok('A4.13', '仪表样式存在（含牺牲态）',
    /\.fl-goal-tension\b/.test(css) && /\.is-sacrificed\b/.test(css), '', 'S0');
}

// ── 报告 ───────────────────────────────────────────────────────────────
function report() {
  // 待采集项不参与绿/红统计：没量过就说没量过，不能算通过。
  const s0 = rows.filter((r) => r.scope === 'S0' && !r.skip);
  const global = rows.filter((r) => r.scope === 'GLOBAL' && !r.skip);
  const s1 = rows.filter((r) => r.scope === 'S1' && !r.skip);
  const s0Red = s0.filter((r) => !r.ok);
  const gRed = global.filter((r) => !r.ok);
  const s0Green = s0.length - s0Red.length;

  const blocks = rows.reduce((a, r) => {
    if (r.skip) return a;
    a[r.id] = a[r.id] || { ok: 0, red: 0 };
    a[r.id].ok += r.ok ? 1 : 0;
    a[r.id].red += r.ok ? 0 : 1;
    return a;
  }, {});
  console.log('\nS0 · 教育目标对齐 A4.1–A4.13');
  console.log('S0 门禁   绿 ' + s0Green + ' / 红 ' + s0Red.length);
  console.log('全局门禁  绿 ' + (global.length - gRed.length) + ' / 红 ' + gRed.length);
  console.log('S1 待铺开 绿 ' + s1.filter((r) => r.ok).length + ' / 红 ' + s1.filter((r) => !r.ok).length + '（只报不计红）');
  console.log('\n按断言分布：');
  Object.keys(blocks).sort().forEach((id) => {
    const b = blocks[id];
    console.log(`  ${id}  ${b.red === 0 ? 'GREEN' : 'RED  '}  绿 ${b.ok} 红 ${b.red}`);
  });

  if (s0Red.length || gRed.length) {
    console.log('\n红（阻断）：');
    [...s0Red, ...gRed].forEach((r, i) => console.log(`  ${i + 1}. [${r.id}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`));
  }
  const pending = rows.filter((r) => r.skip);
  if (pending.length) {
    console.log('\n待采集：');
    pending.forEach((r) => console.log(`  [${r.id}] ${r.name} — ${r.detail}`));
  }
  if (s1.some((r) => !r.ok)) {
    console.log('\nS1 未铺开（信息项，非本轮阻断）：');
    s1.filter((r) => !r.ok).slice(0, 12).forEach((r) => console.log(`  [${r.id}] ${r.name} — ${r.detail}`));
  }
  console.log('');
}

report();
process.exit((rows.filter((r) => r.scope !== 'S1' && r.scope !== 'PENDING' && !r.ok).length) ? 1 : 0);

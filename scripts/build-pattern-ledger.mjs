/**
 * 重建 pattern-ledger.json：40 条反馈规则的解析台账。
 *
 * 台账是 M0/M1 两级断言的共同事实源，必须可复现——手写一份 json 放仓库里，
 * 几周后没人知道它对应哪个版本的场景数据，断言就会拿旧事实判新代码。
 *
 * 解析口径直接调 fl-debrief.js 导出的 parseTrigger，不在这里二次实现，
 * 否则脚本和引擎对同一条表达式给出不同答案，台账就失去意义。
 *
 * 跑法：node scripts/build-pattern-ledger.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';

// fl-debrief.js 是浏览器 UMD，直接 require 会找不到 window；
// 与 m0-tdd / m1-tdd 用同一套无头沙箱，保证三处看到的是同一份实现。
const win = {};
const sandbox = {
  window: win,
  console,
  document: { querySelector: () => null, createElement: () => ({ style: {} }) },
  setTimeout: (fn) => 0,
  clearTimeout: () => {}
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf-8'), sandbox, { filename: 'fl-debrief.js' });
const FL = win.FLDebrief || sandbox.FLDebrief;

const SCEN = [
  ['challenger-launch', 'challenger_launch'],
  ['climate-change-policy', 'climate_change'],
  ['enron-collapse', 'enron_collapse'],
  ['noodle-shop-community', 'noodle_shop_community'],
  ['chip-ai-supplychain', 'chip_ai_supplychain']
];

// A0.3 要求台账有五列：表达式 / 可解析 / 拦截原因 / 缺失原子 / 处置。
// 「处置」不能靠事后回忆补写，否则半年后没人说得清某条规则为什么改了源。
// 这里把已发生的改写显式登记：sid/rid -> 说明。没登记的按现状归类。
const DISPOSITION = {
  'enron-collapse/F6_confirmation': 'rewrite: analyst_attack_count（无源）-> analyst_confidence_drop_count（派生）',
  'enron-collapse/F4_side_effects': 'rewrite: off_balance_sheet/employee_trust（无源）-> off_balance_sheet_exposure_usd_m + whistleblower_silenced_count',
  'enron-collapse/F7_self_criticism': 'rewrite: no_response_to_watkins（无源）-> whistleblower_silenced_count（1:1 同义）',
  'enron-collapse/F8_regulation_lag': 'rewrite: warning_to_action_lag（无源）-> warning_to_response_lag（并扩展吹哨人信号）',
  'enron-collapse/F3_self_reference': 'rewrite: policy_counters_policy_count（无源）-> strategy_backfire_count（派生）',
  'climate-change-policy/F1_nonlinear': 'rewrite: player_chose_linear_options（无源）-> consecutive_similar_choices（派生）',
  'climate-change-policy/F3_self_reference': 'rewrite: policy_counters_policy_count（无源）-> strategy_backfire_count（派生）',
  'climate-change-policy/F5_single_target': 'rewrite: primary_focus_dimension_count + other_dimensions_neglected -> single_concern_choices',
  'noodle-shop-community/single_target_optimization': 'rewrite: revenue_obsession_count（无源）-> consecutive_similar_choices（派生）',
  'chip-ai-supplychain/single_target_optimization': 'rewrite: market_share_obsession_count（无源）-> consecutive_similar_choices（派生）',
  'chip-ai-supplychain/local_optimization': 'rewrite: chip_cost_optimization_count（无源）-> cost_cut_local_count（派生）',
  'chip-ai-supplychain/self_reference': 'rewrite: optimism_statement_count（无源）-> optimism_claim_count（派生）',
  'chip-ai-supplychain/problem_delay_exposure': 'rewrite: bad_news_hidden_count（无源）-> deferred_consequence_count（派生）'
};

const ledger = [];
const stat = { ok: 0, atom_shape: 0, literal_syntax: 0 };

for (const [sid, file] of SCEN) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/data/scenarios', `${file}.json`), 'utf-8'));
  const patterns = d.feedback_patterns || {};
  for (const rid of Object.keys(patterns)) {
    const expr = String((patterns[rid] || {}).trigger || '');
    const parsed = FL.parseTrigger(expr);
    if (parsed) {
      stat.ok += 1;
      ledger.push({
        sid, rid, expr, ok: true, why: 'ok',
        disposition: DISPOSITION[`${sid}/${rid}`] || 'kept',
        // 解析器同时给出原子名与"不可解析片段"，命中两者都记下来，
        // 便于后面追问"到底卡在语法还是卡在数据源"。
        // parseTrigger 返回 { or: [[{name,op,threshold}...]] }，原子在 or 分组里
        atoms: parsed.or.reduce((acc, g) => acc.concat(g.map((a) => a.name)), []),
        miss: []
      });
    } else {
      const why = /[()\[\]{}"'`（）【】“”‘’]|%|大于|小于|等于|并且|而且|或者|时候|以上|以下/.test(expr)
        ? 'literal_syntax' : 'atom_shape';
      stat[why] += 1;
      ledger.push({
        sid, rid, expr, ok: false, why, atoms: [], miss: [expr],
        disposition: DISPOSITION[`${sid}/${rid}`] || 'pending_rewrite'
      });
    }
  }
}

const OUT = path.join(ROOT, 'docs/spec/grill/pattern-ledger.json');
fs.writeFileSync(OUT, JSON.stringify(ledger, null, 1), 'utf-8');

console.log(`台账已重建：${OUT}`);
console.log(`  共 ${ledger.length} 条：可解析 ${stat.ok} / 语法不可解析 ${stat.literal_syntax} / 结构不匹配 ${stat.atom_shape}`);
console.log(`  可解析率 ${(stat.ok / ledger.length * 100).toFixed(1)}%`);
const cols = ['sid', 'rid', 'expr', 'ok', 'why', 'miss', 'disposition'];
const missingCol = cols.filter((c) => ledger.some((r) => !(c in r)));
console.log(missingCol.length ? `  A0.3 缺列：${missingCol.join(', ')}` : '  A0.3 五列齐备');
const acted = ledger.filter((r) => String(r.disposition).startsWith('rewrite')).length;
console.log(`  已改写 ${acted} 条 / 待改写 ${ledger.filter((r) => r.disposition === 'pending_rewrite').length} 条 / 原样保留 ${ledger.filter((r) => r.disposition === 'kept').length} 条`);

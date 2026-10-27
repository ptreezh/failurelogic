#!/usr/bin/env node
/**
 * gate-posture-coverage.mjs — 姿态可分辨性门禁（防"零区分度回合"复发）。
 *
 * 背景：选项的 weight 是三重输入 ——
 *   - 玩家侧：挑战者视图按 weight 渲染姿态徽标（challenger-frontend-spec §2.1），
 *     玩家靠它自我调节力度；
 *   - 引擎侧：_flChoiceClass / detectRegulationLag / rigid 判定都以 weight 为输入；
 *   - 验收侧：pressure-tier 的 posture 对照要"按档位选选项"。
 * 一个回合若所有选项的 weight 只有一种取值，上面三条同时失效：徽标退化成同一个词、
 * 引擎无论怎么选都记成同一类、验收只能靠兜底硬撑（而兜底会让 risky 局执行反向决策，
 * 账面少记风险）。
 *
 * challenger_launch 的 T6 曾是全项目唯一的零区分度回合（四选项全 neutral，但效果
 * 已含 ar -2 ~ ds +1 的四级梯度）。本门禁把它钉住，防止后续文案/数据回填再次把
 * 档位抹平 —— 这类漂移肉眼看 JSON 看不出来，只有逐回合做集合去重才露头。
 *
 * 三条契约（任一条红即 FAIL）：
 *   L1 全局硬契约：五个场景每个回合 weight 去重数 >= 2。
 *      —— 只要求"有区分度"，不要求"双侧齐备"。
 *   L2 posture 能力契约：POSTURE_SCENARIOS 内每个回合 safe 侧 >=1 且 risky 侧 >=1。
 *      —— 只对声明了 posture 对照能力的场景生效。climate T9（清算局，无退路可选）
 *         与 noodle T9（无冒进选项）是既有设计，不该被 L1/L2 误伤；但一旦把某场景
 *         纳入 POSTURE_SCENARIOS，它就必须双侧齐备，否则 posture 对照拿不到对照物。
 *   L3 词表闭包：weight 必须是 KNOWN_WEIGHTS 之一。
 *      —— 守"新词裸奔"：多一个没见过的档位词，前端徽标表（STANCE_LABELS）里没有
 *         对应项，玩家就看到英文原词从 UI 里漏出来。
 *
 * 纯读 JSON，不起浏览器、不起服务、不写文件，几百毫秒。
 * 用法：node scripts/gate-posture-coverage.mjs [--verbose]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCN_DIR = path.join(ROOT, 'assets', 'data', 'scenarios');
const VERBOSE = process.argv.includes('--verbose');

const SCENARIOS = [
  'challenger_launch.json',
  'climate_change.json',
  'enron_collapse.json',
  'noodle_shop_community.json',
  'chip_ai_supplychain.json',
];

// 只有这些场景被 pressure-tier 用来做姿态因果对照。纳入即承诺"每回合双侧齐备"。
const POSTURE_SCENARIOS = ['challenger_launch.json'];

const SAFE_SIDE = ['extreme_safe', 'safe'];
const RISKY_SIDE = ['extreme_risk', 'risky'];

// 词表闭包：全场景现行使用的档位词。新增档位必须同步 fl-debrief.js 的 STANCE_LABELS
// （否则徽标显示英文原词），再往这里加一条。
const KNOWN_WEIGHTS = [
  'extreme_safe',
  'safe',
  'neutral',
  'risky',
  'extreme_risk',
  'conservative',
  'moderate',
  'aggressive',
  'analytical',
  'passive',
];

const fails = [];
const notes = [];
const ok = (m) => console.log('  PASS ' + m);
const bad = (m) => { fails.push(m); console.log('  FAIL ' + m); };

let totalSteps = 0;
let minDistinct = Infinity;
let minWhere = '';

for (const file of SCENARIOS) {
  const p = path.join(SCN_DIR, file);
  if (!fs.existsSync(p)) { bad(`${file}: 文件不存在`); continue; }
  let data;
  try { data = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { bad(`${file}: JSON 解析失败 — ${e.message}`); continue; }

  const steps = Array.isArray(data.steps) ? data.steps : [];
  if (!steps.length) { bad(`${file}: 无 steps`); continue; }

  const isPosture = POSTURE_SCENARIOS.includes(file);
  const l1Bad = [];
  const l2Bad = [];
  const l3Bad = [];
  let distinctSum = 0;

  for (const st of steps) {
    const turn = st.turn;
    const opts = Array.isArray(st.options) ? st.options : [];
    const ws = opts.map((o) => String((o && o.weight) || '').toLowerCase());
    const distinct = new Set(ws);
    totalSteps += 1;
    distinctSum += distinct.size;
    if (distinct.size < minDistinct) { minDistinct = distinct.size; minWhere = `${file} T${turn}`; }

    // L1
    if (distinct.size < 2) l1Bad.push(`T${turn} 四选项同档位 [${ws.join(', ')}]（零区分度）`);

    // L2
    if (isPosture) {
      const hasSafe = ws.some((w) => SAFE_SIDE.includes(w));
      const hasRisky = ws.some((w) => RISKY_SIDE.includes(w));
      if (!hasSafe) l2Bad.push(`T${turn} 无 safe 侧（posture 对照的 safe 局拿不到选项）`);
      if (!hasRisky) l2Bad.push(`T${turn} 无 risky 侧（posture 对照的 risky 局拿不到选项）`);
    }

    // L3
    for (const w of distinct) {
      if (w && !KNOWN_WEIGHTS.includes(w)) l3Bad.push(`T${turn} 出现未登记档位 "${w}"`);
      if (!w) l3Bad.push(`T${turn} 存在空 weight（徽标会渲染成空白）`);
    }
  }

  if (VERBOSE) notes.push(`${file}: ${steps.length} 回合，平均档位数 ${(distinctSum / steps.length).toFixed(2)}${isPosture ? '（posture 场景）' : ''}`);

  // 每条契约单独成行，红了能一眼定位是哪一层坏的。
  if (l1Bad.length) { bad(`${file} · L1 区分度 — ${l1Bad.length} 处`); l1Bad.forEach((x) => console.log('        ' + x)); }
  if (l2Bad.length) { bad(`${file} · L2 posture 双侧 — ${l2Bad.length} 处`); l2Bad.forEach((x) => console.log('        ' + x)); }
  if (l3Bad.length) { bad(`${file} · L3 词表闭包 — ${l3Bad.length} 处`); l3Bad.forEach((x) => console.log('        ' + x)); }
  if (!l1Bad.length && !l2Bad.length && !l3Bad.length) {
    ok(`${file} · L1+L3${isPosture ? '+L2' : ''}（${steps.length} 回合）`);
  }
}

// 全量汇总：即使在 --verbose 之外也给一行总账，便于翻日志时快速判读。
console.log('\n' + '-'.repeat(72));
console.log(`  [覆盖] ${SCENARIOS.length} 场景 / ${totalSteps} 回合；最小档位数 ${minDistinct}（${minWhere}）`);
if (notes.length && VERBOSE) notes.forEach((n) => console.log('  NOTE ' + n));
if (fails.length) {
  console.log(`RESULT: FAIL（${fails.length} 项）`);
  process.exit(1);
}
console.log('RESULT: PASS — 每个回合的姿态都能被玩家与引擎分辨');
process.exit(0);

#!/usr/bin/env node
/**
 * gate-scenario-lexicon.mjs — 局内术语门禁（P0 术语清洗的防漂移断言）。
 *
 * 口径（产品决定）：局内只给"观察"，不给"命名"。
 *   - 该出现的：你做了什么、系统怎么变、代价落在哪一维度（可数、可复核）。
 *   - 不该出现的：Dörner、《失败的逻辑》、F1–F8 标签、确认偏误/复杂性失明/
 *     单目标优化/调节滞后/自我批评缺失/线性外推 等诊断命名，以及 turn / hint /
 *     "系统在…揭示…" 这类引擎内部语汇。
 *   诊断命名只在 debrief（dornerLessons / dorner_quotes）出现，那是玩家读完
 *   十回合之后的教材页；局内提前点名等于把结论剧透给玩家，教学价值反转。
 *
 * 因此本门禁守四件事（任一条红即 FAIL）：
 *   A. steps 全域（situation / narrative / options[].* / pattern_reveal_template.*）
 *      禁用词零命中 —— 防止后续文案回填把命名又写回局内。
 *   B. 结构基线不漂：每场景 10 步、每步 4 个选项（清洗只该改字，不该动骨）。
 *   C. 非 steps 域仍保留诊断命名 —— 反向守护：防止有人"为了让 A 变绿"把
 *      debrief 教材一起删了。
 *   D. pattern_reveal_template.biases_revealed 的每一项都能被 feedback_patterns
 *      解析（复刻 offline-engine.js 的 _flPatternKey：先直查键名，再退 F<数字>_ 前缀）。
 *      这一条守的是"清洗文案时顺手改坏了机器键"——键一断，揭示面板就丢掉
 *      evidence_template / reflection_questions，退化成一句泛化兜底话术。
 *
 * 纯读 JSON，不起浏览器、不起服务、不写文件，秒级。
 * 用法：node scripts/gate-scenario-lexicon.mjs [--verbose]
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

// A. 禁用词。注意 \bF[1-8]\b 不会命中 F5_single_target（下划线是词字符，
// 5 后面没有词边界），所以机器键可以安全保留在 biases_revealed 里。
const BANNED = [
  [/Dörner/i, 'Dörner（人名）'],
  [/失败的逻辑/, '书名'],
  [/确认偏误/, '诊断命名'],
  [/单目标优化/, '诊断命名'],
  [/调节滞后/, '诊断命名'],
  [/复杂性失明/, '诊断命名'],
  [/自我批评缺失/, '诊断命名'],
  [/线性外推/, '诊断命名'],
  [/\bF[1-8]\b/, 'F 编号标签'],
  [/\bhint\b/i, '引擎内部语汇'],
  [/\bturns?\b/i, '引擎内部语汇'],
  [/玩家未/, '第三人称旁观口吻（局内应说"你"）'],
];

// C. 教材侧必须还在的命名锚点
const TEACHING_ANCHORS = [/Dörner/i, /失败的逻辑/];

const STEP_COUNT = 10;
const OPTION_COUNT = 4;

const fails = [];
const notes = [];
const ok = (msg) => console.log('  PASS ' + msg);
const bad = (msg) => {
  fails.push(msg);
  console.log('  FAIL ' + msg);
};

function walkStrings(node, trail, sink) {
  if (typeof node === 'string') {
    sink.push([trail, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkStrings(v, `${trail}[${i}]`, sink));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walkStrings(v, trail ? `${trail}.${k}` : k, sink);
  }
}

/** 复刻 offline-engine.js:_flPatternKey */
function patternKey(label, patterns) {
  if (patterns[label]) return label;
  const m = String(label).match(/^F(\d)/i);
  if (m) {
    const prefix = 'F' + m[1] + '_';
    const hit = Object.keys(patterns).find((k) => k.startsWith(prefix));
    if (hit) return hit;
  }
  return null;
}

console.log('gate-scenario-lexicon — 局内术语门禁（观察可留，命名回 debrief）');

for (const file of SCENARIOS) {
  const abs = path.join(SCN_DIR, file);
  if (!fs.existsSync(abs)) {
    bad(`${file} 不存在`);
    continue;
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    bad(`${file} JSON 解析失败：${e.message}`);
    continue;
  }

  console.log(`\n${file}`);

  // ---- A. 局内禁用词 ----
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const strings = [];
  walkStrings(steps, 'steps', strings);
  const hits = [];
  for (const [trail, text] of strings) {
    for (const [re, why] of BANNED) {
      const m = text.match(re);
      if (m) {
        const at = Math.max(0, m.index - 20);
        hits.push(`${trail} → 「${m[0]}」(${why}) …${text.slice(at, at + 60).replace(/\s+/g, ' ')}…`);
      }
    }
  }
  if (hits.length) {
    bad(`局内残留禁用词 ${hits.length} 处`);
    hits.forEach((h) => console.log('        ' + h));
  } else {
    ok(`局内禁用词 0 处（${strings.length} 个字符串）`);
  }

  // ---- B. 结构基线 ----
  const structOk =
    steps.length === STEP_COUNT && steps.every((s) => (s.options || []).length === OPTION_COUNT);
  if (structOk) {
    ok(`结构基线 ${STEP_COUNT} 步 × ${OPTION_COUNT} 选项`);
  } else {
    bad(
      `结构基线被改动：steps=${steps.length}，options=${JSON.stringify(
        steps.map((s) => (s.options || []).length)
      )}`
    );
  }

  // ---- C. 教材侧命名保留 ----
  // 只要至少一处命名锚点还在就算过：书名并非每个场景都引（challenger /
  // climate / enron 只引 Dörner 的观点，不点书名），这里防的是"整页教材被删"。
  const outsideSteps = { ...data };
  delete outsideSteps.steps;
  const teachingText = JSON.stringify(outsideSteps, null, 0);
  if (!TEACHING_ANCHORS.some((re) => re.test(teachingText))) {
    bad('非 steps 域已无任何诊断命名锚点（Dörner / 书名 都没了，教材被误删？）');
  } else {
    const kept = TEACHING_ANCHORS.filter((re) => re.test(teachingText)).map(String);
    ok(`非 steps 域保留教材命名锚点：${kept.join(' / ')}`);
  }

  // ---- D. 揭示面板的机器键仍可解析 ----
  const patterns = data.feedback_patterns || {};
  const revealSteps = steps
    .map((s, i) => [i, s.pattern_reveal_template])
    .filter(([, t]) => t && Array.isArray(t.biases_revealed));
  if (!revealSteps.length) {
    notes.push(`${file}: 无 pattern_reveal_template，跳过键解析检查`);
  } else {
    const broken = [];
    for (const [i, t] of revealSteps) {
      t.biases_revealed.forEach((label, j) => {
        if (!patternKey(label, patterns)) broken.push(`steps[${i}].biases_revealed[${j}] = "${label}"`);
      });
    }
    if (broken.length) {
      bad(`揭示键无法映射到 feedback_patterns ${broken.length} 处（揭示面板将丢 evidence/reflection）`);
      broken.forEach((b) => console.log('        ' + b));
    } else {
      ok(`揭示键全部可解析（${revealSteps.length} 个揭示节点，${Object.keys(patterns).length} 个 pattern）`);
    }
  }
}

console.log('\n' + '-'.repeat(72));
if (notes.length && VERBOSE) notes.forEach((n) => console.log('  NOTE ' + n));
if (fails.length) {
  console.log(`RESULT: FAIL（${fails.length} 项）`);
  process.exit(1);
}
console.log('RESULT: PASS — 局内只留观察，命名归 debrief');
process.exit(0);

#!/usr/bin/env node
/**
 * shadow-outcome.mjs — P0-1a 影子对照（spec §10 风险缓解 / T-3a）。
 *
 * 目的不是"再测一遍结局"，是回答一个问题：
 *   新加的统一解析器 `_flResolveOutcome` 与**旧代码实际吐出来的结局**是否同一件事？
 * 一致率必须 100% 才允许 T-3b 把 final_outcome 接到生产路径上。
 *
 * 对照口径（避免自欺，先说清哪里是强断言、哪里是构造等价）：
 *   noodle / chip  —— 强断言。旧路径把 `ending.title` 打进 feedback 的【终局】行，
 *                     新解析器给出的 ending.title 必须逐字相同。
 *   challenger     —— 强断言。旧路径的标题是 4 条写死的文案，测试里带一张
 *                     文案→id 的显式映射表，新 id 必须映射回旧标题原文。
 *   climate / enron—— 构造等价，不做字符串对照。新解析器直接调用旧路径同一个
 *                     `inferClimateOutcome` / `inferEnronOutcome`，中间没有第二套
 *                     判定逻辑可以漂移。报告里如实标 EQ，不冒充"验证过"。
 *
 * 用法：
 *   node scripts/shadow-outcome.mjs                  # 5 场景 × 4 姿态 × 10 局 = 200 局
 *   node scripts/shadow-outcome.mjs --runs=3         # 冒烟
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8261;
const runsArg = process.argv.find((a) => a.startsWith('--runs='));
const RUNS = runsArg ? Math.max(1, parseInt(runsArg.split('=')[1], 10) || 1) : 10;
const POSTURES = ['safe', 'risky', 'neutral', 'extreme_risk'];

// 旧路径的标题文案 → id。写死在这里是有意的：它同时充当"旧实现的口径快照"，
// 一旦有人改了那 4 条标题而没改映射，本脚本会红。
const CHALLENGER_TITLE_TO_ID = {
  挑战者号发射决定已执行: 'launch_disaster',
  挑战者号发射决定已被推迟: 'launch_dodged',
  挑战者号发射倒计时已暂停: 'last_minute_evaluation',
  挑战者号发射计划已无限期推迟: 'infinite_delay',
};

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const pageErrors = [];

// 200 局是纯引擎计算（每局 10 回合，全程不碰 DOM），单 page 只能一局一局算。
// 局与局之间不共享状态（每次 createGameSession 新建会话），所以按 (场景 × 姿态)
// 切开分给多个 page 并行，聚合口径不变。
async function openWorkerPage() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.OfflineEngine);
  return page;
}

async function runProbe(page, combos) {
  return page.evaluate(
  async ({ combos, runs, titleMap }) => {
    const rows = [];
    const hasResolver = typeof window.OfflineEngine._flResolveOutcome === 'function';
    if (!hasResolver) return { hasResolver: false, rows };

    for (const { scn, posture } of combos) {
        for (let i = 0; i < runs; i++) {
          const sess = await window.OfflineEngine.createGameSession(scn, 'auto');
          let last = null;
          for (let t = 1; t <= 10; t++) {
            const st = await window.OfflineEngine.getScenarioStep(scn, t);
            const opts = (st && st.options) || [];
            const hit = opts.find((o) => String(o.weight || '').toLowerCase() === posture);
            const pick = hit || opts[Math.floor(Math.random() * opts.length)];
            last = await window.OfflineEngine.executeTurn(
              sess.game_id,
              { option: pick.id, justification: '' },
              scn
            );
          }
          const state = last && last.game_state ? last.game_state : {};
          const fb = String((last && last.feedback) || '');
          let resolved = null;
          let err = '';
          try {
            resolved = window.OfflineEngine._flResolveOutcome(state, scn);
          } catch (e) {
            err = String(e).slice(0, 140);
          }
          // 旧路径实际吐出的结局标识
          // challenger 的标题行带 emoji 前缀（✅/❌/⚠️），不能整行全等，
          // 用"行内包含已知文案"定位，再把命中文案本身作为 oldTitle。
          let oldTitle = '';
          if (scn === 'challenger-launch') {
            const keys = Object.keys(titleMap);
            const line =
              fb
                .split('\n')
                .map((l) => l.trim())
                .find((l) => keys.some((k) => l.includes(k))) || '';
            oldTitle = keys.find((k) => line.includes(k)) || '';
          } else {
            oldTitle = (fb.match(/【终局】\s*([^\n]+)/) || [])[1] || '';
          }
          const inferredTitle =
            resolved && resolved.inferred_id
              ? window.OfflineEngine._flOutcomeTitle(scn, resolved.inferred_id)
              : '';
          rows.push({
            scenario: scn,
            posture,
            err,
            newId: resolved ? resolved.id : null,
            newTitle: resolved ? resolved.title : null,
            newSource: resolved ? resolved.source : null,
            newInferred: resolved ? resolved.inferred_id : null,
            inferredTitle,
            oldTitle: oldTitle.trim(),
            fbLen: fb.length,
          });
        }
    }
    return { hasResolver: true, rows, whitelist: window.OfflineEngine._flOutcomeWhitelist || {} };
  },
  { combos, runs: RUNS, titleMap: CHALLENGER_TITLE_TO_ID }
  );
}

// 场景 × 姿态切开，交给多个 page 并行；rows 合并后与原串行聚合口径一致。
const SCN_ALL = [
  'challenger-launch',
  'climate-change-policy',
  'enron-collapse',
  'noodle-shop-community',
  'chip-ai-supplychain',
];
const combos = [];
for (const scn of SCN_ALL) for (const posture of POSTURES) combos.push({ scn, posture });

const WORKERS = Math.max(1, Math.min(combos.length, Number(process.env.FL_SHADOW_WORKERS) || 8));
const slices = Array.from({ length: WORKERS }, () => []);
combos.forEach((c, i) => slices[i % WORKERS].push(c));

const parts = await Promise.all(slices.filter((s) => s.length).map(async (slice) => {
  const page = await openWorkerPage();
  try {
    return await runProbe(page, slice);
  } finally {
    await page.close().catch(() => {});
  }
}));

const probe = {
  hasResolver: parts.every((p) => p.hasResolver),
  rows: parts.flatMap((p) => p.rows),
  whitelist: (parts.find((p) => p.whitelist && Object.keys(p.whitelist).length) || {}).whitelist,
};

const fails = [];
if (!probe.hasResolver) {
  console.log('FAIL window.OfflineEngine._flResolveOutcome 不存在（T-3a 待实现）');
  await browser.close();
  srv.kill();
  process.exit(1);
}

const WHITELIST = probe.whitelist;
if (!WHITELIST || !Object.keys(WHITELIST).length) {
  fails.push('页面未暴露 _flOutcomeWhitelist');
}

const per = {};
for (const r of probe.rows) {
  const st = (per[r.scenario] = per[r.scenario] || {
    total: 0,
    strong: 0,
    match: 0,
    ids: {},
    bad: [],
  });
  st.total++;
  if (r.err) {
    st.bad.push(`${r.posture} 抛错: ${r.err}`);
    fails.push(`${r.scenario} 抛错: ${r.err}`);
    continue;
  }
  if (!WHITELIST[r.scenario].includes(r.newId)) {
    st.bad.push(`${r.posture} 越界 id=${r.newId}`);
    fails.push(`${r.scenario} 越界 id=${r.newId}`);
    continue;
  }
  st.ids[r.newId] = (st.ids[r.newId] || 0) + 1;

  if (r.scenario === 'challenger-launch') {
    st.strong++;
    const expectTitle = Object.keys(CHALLENGER_TITLE_TO_ID).find(
      (k) => CHALLENGER_TITLE_TO_ID[k] === r.newId
    );
    if (r.oldTitle === expectTitle) st.match++;
    else {
      st.bad.push(`${r.posture} 新=${r.newId} 旧标题=「${r.oldTitle}」`);
      fails.push(`${r.scenario} 影子不一致：新=${r.newId} 旧标题=「${r.oldTitle}」`);
    }
  } else if (r.scenario === 'noodle-shop-community' || r.scenario === 'chip-ai-supplychain') {
    st.strong++;
    // T-5 之后，旧路径自己也吃 declared 了（这正是本轮要的那处行为变更），
    // 所以不能再拿 inferred 当基准——那会把"已生效的改写"误判成"影子漂移"。
    // 现在对照的是更有意义的一件事：**契约说的这个结局，是不是用户屏幕上看到的那个**。
    // 只要两套说法始终同源，改写多少局都不算不一致。
    if (r.newTitle && r.oldTitle && r.newTitle === r.oldTitle) st.match++;
    else {
      st.bad.push(`${r.posture} 契约标题=「${r.newTitle}」屏幕标题=「${r.oldTitle}」`);
      fails.push(
        `${r.scenario} 契约/文本不同源：契约=「${r.newTitle}」屏幕=「${r.oldTitle}」`
      );
    }
    if (r.newId !== r.newInferred) st.rewrites = (st.rewrites || 0) + 1;
  }
}

const total = probe.rows.length;
console.log(`\n影子对照：${total} 局（5 场景 × ${POSTURES.length} 姿态 × ${RUNS} 局）`);
console.log('-'.repeat(78));
for (const [scn, s] of Object.entries(per)) {
  const strongRate = s.strong ? `${s.match}/${s.strong}` : 'EQ（构造等价）';
  const ids = Object.entries(s.ids)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  const rw = s.rewrites ? `  最后一步改写结局 ${s.rewrites} 局` : '';
  console.log(
    `${scn.padEnd(24)} 强断言 ${String(strongRate).padEnd(14)} 命中 ${Object.keys(s.ids).length} 种  ${ids}${rw}`
  );
  if (s.bad.length) s.bad.slice(0, 3).forEach((b) => console.log('    ! ' + b));
}

if (pageErrors.length) {
  fails.push('pageerror: ' + pageErrors[0]);
  console.log('\nFAIL pageerror:\n  - ' + pageErrors.slice(0, 5).join('\n  - '));
}

const strongTotal = Object.values(per).reduce((n, s) => n + s.strong, 0);
const strongMatch = Object.values(per).reduce((n, s) => n + s.match, 0);
console.log('-'.repeat(78));
console.log(
  fails.length
    ? `FAILED: ${fails.length} 处不一致`
    : `PASS 影子一致率 100%（强断言 ${strongMatch}/${strongTotal}，其余构造等价）`
);

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

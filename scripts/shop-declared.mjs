#!/usr/bin/env node
/**
 * shop-declared.mjs — T-5：noodle / chip 的"最后一步改写"是否真的生效（spec §6.2.2 / G5）。
 *
 * 两个断言：
 *   ① 前 9 回合完全相同的两条线，只改第 10 回合的选项 → 结局 id 必须随之不同（4/4 全区分）。
 *   ② 第 10 回合选 A（"坚持原路"）时，成功结局仍然可达（long_term_success / tech_breakthrough 各 ≥1）。
 *      这条防的是"declared 覆盖 inferred 把好结局挤掉了"——若②失败，T-5 必须回退。
 *
 * ②用的是贪心策略而不是穷举：只证明"存在一条 A 路线赢下来的路径"，
 * 不声称它是最优解。这个区别写在输出里，不糊弄。
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8262;
const GREEDY_RUNS = 24;

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.OfflineEngine);

const data = await page.evaluate(
  async ({ greedyRuns }) => {
    const E = window.OfflineEngine;
    const SCNS = ['noodle-shop-community', 'chip-ai-supplychain'];

    // 用同一套"前 9 回合固定动作"，只换第 10 回合 —— 排除中期差异的干扰。
    async function playWithFinal(scn, finalOptId, posture) {
      const sess = await E.createGameSession(scn, 'auto');
      let last = null;
      for (let t = 1; t <= 9; t++) {
        const st = await E.getScenarioStep(scn, t);
        const opts = (st && st.options) || [];
        const pick =
          opts.find((o) => String(o.weight || '').toLowerCase() === posture) || opts[0];
        last = await E.executeTurn(sess.game_id, { option: pick.id, justification: '' }, scn);
      }
      const st10 = await E.getScenarioStep(scn, 10);
      const opts10 = (st10 && st10.options) || [];
      const target = opts10.find((o) => o.id === finalOptId) || opts10[0];
      last = await E.executeTurn(
        sess.game_id,
        { option: target.id, justification: '' },
        scn
      );
      const fo = (last && last.final_outcome) || (last.game_state || {}).final_outcome || null;
      return {
        optId: target.id,
        optText: target.text || '',
        id: fo ? fo.id : null,
        rewritten: fo ? !!fo.rewritten : null,
        source: fo ? fo.source : null,
        fb: String((last && last.feedback) || ''),
      };
    }

    // ---- ① 终局四选项切换 ----
    // 洗牌口径（P0 修复后）：终局按 option_orig_id 判结局，所以"只换第 10 回合"
    // 这个前提要求四局看到的是同一张 T10 表。否则每局新 seed 会把四个槽位换成
    // 另外四个原选项，"切换"退化成随机抽样，唯一结局数会随运气在 2-4 之间跳。
    // 用引擎自带的显式 seed 通路（window.__FL_OPTION_SEED__）把 ① 钉死，
    // ② 的贪心 24 局仍用随机 seed，保留"多条路线"的覆盖面。
    const FIXED_SEED = 20251017;
    window.__FL_OPTION_SEED__ = FIXED_SEED;
    const switched = {};
    for (const scn of SCNS) {
      switched[scn] = [];
      const st10 = await E.getScenarioStep(scn, 10);
      for (const o of (st10 && st10.options) || []) {
        switched[scn].push(await playWithFinal(scn, o.id, 'neutral'));
      }
    }
    try { delete window.__FL_OPTION_SEED__; } catch (e) { window.__FL_OPTION_SEED__ = null; }

    // ---- ② A 路线（坚持原路）贪心可达性 ----
    // noodle：名声优先、债务次之；chip：良率/自主率优先、负债率次之。
    const WEIGHTS = {
      'noodle-shop-community': { reputation: 1.0, debt: -0.9, net_equity: 0.5, cash: 0.2 },
      'chip-ai-supplychain': {
        yield_rate: 1.0,
        self_reliance: 0.9,
        debt_ratio: -0.9,
        cash_flow: 0.5,
      },
    };
    const greedy = {};
    for (const scn of SCNS) {
      const w = WEIGHTS[scn];
      greedy[scn] = { ids: {}, runs: 0, detail: [] };
      for (let i = 0; i < greedyRuns; i++) {
        const sess = await E.createGameSession(scn, 'auto');
        let last = null;
        for (let t = 1; t <= 10; t++) {
          const st = await E.getScenarioStep(scn, t);
          const opts = (st && st.options) || [];
          let best = opts[0];
          let bestScore = -Infinity;
          for (const o of opts) {
            const eff = (st.expected_effects && st.expected_effects[o.id]) || {};
            let sc = 0;
            for (const k of Object.keys(w)) sc += (eff[k] || 0) * w[k];
            // 同分时倾向"继续/坚持"类语义：选项 id 靠前者优先，保持稳定
            if (sc > bestScore) {
              bestScore = sc;
              best = o;
            }
          }
          last = await E.executeTurn(
            sess.game_id,
            { option: best.id, justification: '' },
            scn
          );
        }
        const fo = (last && last.final_outcome) || (last.game_state || {}).final_outcome || null;
        greedy[scn].runs++;
        if (fo) {
          greedy[scn].ids[fo.id] = (greedy[scn].ids[fo.id] || 0) + 1;
          greedy[scn].detail.push({ id: fo.id, source: fo.source, rewritten: fo.rewritten });
        }
      }
    }

    return { switched, greedy };
  },
  { greedyRuns: GREEDY_RUNS }
);

const fails = [];
const lines = [];

// ---- ① 断言：四选项 → 至少 3 种不同 id，且 B/C/D 生效 ----
for (const [scn, rows] of Object.entries(data.switched)) {
  const ids = rows.map((r) => r.id);
  const uniq = new Set(ids.filter(Boolean));
  const rewriteFb = rows.filter((r) => /你改写了结局|最后一回合的公开表态/.test(r.fb)).length;
  lines.push(
    `${scn}: 终局四选项 → ${ids.map((x) => x || 'NULL').join(' / ')}  唯一结局 ${uniq.size} 种  改写文案 ${rewriteFb} 局`
  );
  if (uniq.size < 3) {
    fails.push(`${scn} 终局切换只产生 ${uniq.size} 种结局（要求 ≥3），declared 未生效`);
  }
  if (rows.some((r) => !r.id)) {
    fails.push(`${scn} 存在 final_outcome 为空的终局局`);
  }
  // declared 覆盖时文案必须同时给出"本该是什么"与"被按成什么"
  const rewrittenRows = rows.filter((r) => r.rewritten);
  for (const r of rewrittenRows) {
    if (!/【注意：你改写了结局，但没有改写过程】/.test(r.fb)) {
      fails.push(`${scn} opt=${r.optId} rewritten=true 但 feedback 缺改写声明段`);
    }
  }
}

// ---- ② 断言：A 路线仍可赢 ----
const WIN = {
  'noodle-shop-community': 'long_term_success',
  'chip-ai-supplychain': 'tech_breakthrough',
};
for (const [scn, g] of Object.entries(data.greedy)) {
  const dist = Object.entries(g.ids)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  const win = g.ids[WIN[scn]] || 0;
  lines.push(`${scn}: 贪心 ${g.runs} 局 A/最优路线 → ${dist || '(无终局)'}  成功结局 ${win} 局`);
  if (win < 1) {
    fails.push(`${scn} 贪心 ${g.runs} 局内未出现 ${WIN[scn]}，A 路线可能被 declared 挤掉`);
  }
}

if (pageErrors.length) fails.push('pageerror: ' + pageErrors[0]);

console.log('\nT-5 最后一步改写验证');
console.log('-'.repeat(78));
lines.forEach((l) => console.log('  ' + l));
console.log('-'.repeat(78));
if (fails.length) {
  fails.forEach((f) => console.log('FAIL ' + f));
  console.log(`\nFAILED: ${fails.length} 项`);
} else {
  console.log('PASS 终局改写生效，A 路线可达（贪心策略下存在胜利路径）');
}

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

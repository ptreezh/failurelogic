#!/usr/bin/env node
/**
 * option-slot-map.mjs — G7 契约：屏幕上第 N 个槽位 = 结算与反馈用的那个选项。
 *
 * 背景（真实 P0 缺陷，不是理论风险）：
 *   getScenarioStep() 会把 options 洗牌（_flShuffleStepOptions，seed 决定排列），
 *   把打乱后的副本按 A/B/C/D 重贴标签给玩家看；而 applyChallengerTurn /
 *   applyEnronTurn / generic fallback / recordDecision 原先各自去 findStep()
 *   拿**未洗牌**的原始 step，再按同一个字母取效果。
 *   结果：玩家点"A"（屏幕上写的是"建议每次交易单独审计"），实际结算的是
 *   原始 A（"支持扩大 LJM 规模"）的 +200 敞口。屏幕与账本不同源，
 *   教学可信度直接归零，而且探针里表现成"两个 posture 算出来的数一样"。
 *
 * 断言口径（只读、不改任何断言口径）：
 *   对每个场景、每个回合同一时间点，
 *   decision_history 最后一条的 option_text 必须逐字等于
 *   该回合 getScenarioStep 里被点中槽位的 text，且 applied_effects 非空。
 *
 * 用法：node scripts/option-slot-map.mjs [--verbose]
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8295;
const SEED = 4242;
const TURNS = 3;
const SCENARIOS = [
  'challenger-launch',
  'enron-collapse',
  'noodle-shop-community',
  'chip-ai-supplychain',
  'climate-change-policy',
];
const VERBOSE = process.argv.includes('--verbose');

const results = [];
const ok = (name, extra = '') => results.push({ name, pass: true, extra });
const no = (name, extra = '') => results.push({ name, pass: false, extra });

const server = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1200));

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.OfflineEngine, null, { timeout: 20000 });

  const report = await page.evaluate(
    async ({ scenarios, turns, seed }) => {
      window.__FL_OPTION_SEED__ = seed;
      const out = [];
      for (const scn of scenarios) {
        const sess = await window.OfflineEngine.createGameSession(scn, 'auto');
        const rows = [];
        let last = null;
        for (let t = 1; t <= turns; t++) {
          const st = await window.OfflineEngine.getScenarioStep(scn, t);
          const slots = (st.options || []).map((o) => ({ id: o.id, text: o.text || '' }));
          if (!slots.length) break;
          // 轮转取槽位：固定取第 0 个会让"洗牌恰好恒等"的回合掩盖问题。
          const pick = slots[(t - 1) % slots.length];
          last = await window.OfflineEngine.executeTurn(
            sess.game_id,
            { option: pick.id, justification: '' },
            scn
          );
          const hist = ((last.game_state || {}).decision_history) || [];
          const entry = hist[hist.length - 1] || {};
          rows.push({
            turn: t,
            slot: pick.id,
            slotText: pick.text,
            gotText: entry.option_text || '',
            gotEffects: Object.keys(entry.applied_effects || {}).length,
            otherSlots: slots.filter((s) => s.text !== pick.text).map((s) => s.text),
          });
        }
        out.push({ scenario: scn, rows });
      }
      return out;
    },
    { scenarios: SCENARIOS, turns: TURNS, seed: SEED }
  );

  for (const scn of report) {
    let bad = 0;
    for (const r of scn.rows) {
      // 文本兜底：个别场景 option.text 可能带空白差异，用归一比较。
      const same = norm(r.slotText) === norm(r.gotText);
      const distinct = new Set([r.slotText, ...r.otherSlots].map(norm)).size > 1;
      if (same && r.gotEffects > 0) {
        if (VERBOSE) console.log(`  ok  ${scn.scenario} T${r.turn} ${r.slot} -> ${r.gotText.slice(0, 18)} (${r.gotEffects} effects)`);
      } else if (!distinct) {
        // 该回合四个槽位文本相同，无从判定，跳过不算失败。
        if (VERBOSE) console.log(`  --  ${scn.scenario} T${r.turn} 四槽同文，跳过`);
      } else {
        bad += 1;
        console.log(`  FAIL ${scn.scenario} T${r.turn} slot=${r.slot}`);
        console.log(`       屏幕上写：${r.slotText}`);
        console.log(`       账本记成：${r.gotText}（effects=${r.gotEffects}）`);
      }
    }
    const checked = scn.rows.length;
    if (!checked) {
      no(`G7 ${scn.scenario} 有回合可比对`, '0 回合');
    } else if (bad) {
      no(`G7 ${scn.scenario} 槽位与结算同源`, `${bad}/${checked} 回合错位`);
    } else {
      ok(`G7 ${scn.scenario} 槽位与结算同源`, `${checked} 回合`);
    }
  }

  if (pageErrors.length) no('PERR pageerror=0', `${pageErrors.length} 条`);
  else ok('PERR pageerror=0', '');
} catch (e) {
  no('运行探针', String(e && e.message ? e.message : e));
} finally {
  if (browser) await browser.close();
  server.kill();
}

function norm(s) {
  return String(s || '').replace(/\s+/g, '').replace(/[·•]/g, '');
}

let fails = 0;
for (const r of results) {
  if (!r.pass) fails += 1;
  console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.extra ? '  ' + r.extra : ''}`);
}
console.log(fails ? `\n${fails} 项失败` : '\nPASS all slot-map assertions');
process.exit(fails ? 1 : 0);

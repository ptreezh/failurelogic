#!/usr/bin/env node
/**
 * contract-outcome.mjs — 终局契约断言（spec §6.1 / G2 / G3 / G5）。
 *
 * TDD 步骤：T-2（当前）→ T-3b（19 白名单）→ T-5（declared 改写）。
 * T-2 的断言只有一条：跑到终局时，`executeTurn` 的返回值里必须有
 * `final_outcome`，且 `final_outcome.id` 非空。此断言当前**必然为红**——
 * 引擎还没有这个字段。红是本步骤的交付物；实现留给 T-3。
 *
 * 明早之后这里会继续扩：
 *   - G2 5 场景 × 6 策略 × 12 局 = 360 局，id 必须落在 19 白名单
 *   - G3 每 id 可达，或登记 known_unreachable
 *   - G5 noodle/chip T10 切 B/C/D → id 变化；T10 A → 成功结局仍可达
 *
 * 用法：
 *   node scripts/contract-outcome.mjs            # 默认 5 场景各 1 局
 *   node scripts/contract-outcome.mjs --runs=12  # 每场景每策略局数（后续 G2 用）
 *   node scripts/contract-outcome.mjs --dist     # 对 dist 单文件跑同一组
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8247;
const DIST = process.argv.includes('--dist');
const runsArg = process.argv.find((a) => a.startsWith('--runs='));
const RUNS = runsArg ? Math.max(1, parseInt(runsArg.split('=')[1], 10) || 1) : 1;

const SCENARIOS = [
  'challenger-launch',
  'climate-change-policy',
  'enron-collapse',
  'noodle-shop-community',
  'chip-ai-supplychain',
];

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
page.on('console', (m) => {
  if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 200));
});

const url = DIST
  ? 'file:///' + ROOT.replace(/\\/g, '/') + '/dist/failure-logic-standalone.html'
  : `http://127.0.0.1:${PORT}/index.html`;

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.OfflineEngine);

const results = await page.evaluate(
  async ({ scenarios, runs }) => {
    const out = [];
    const POSTURES = [
      'safe',
      'risky',
      'neutral',
      'aggressive',
      'extreme_safe',
      'extreme_risk',
    ];
    // T-2 阶段每场景只跑 1 局：posture 轮转，避免只测到一条路径。
    for (const scn of scenarios) {
      for (let i = 0; i < runs; i++) {
        const wanted = POSTURES[i % POSTURES.length];
        const session = await window.OfflineEngine.createGameSession(scn, 'auto');
        let last = null;
        let stepErr = '';
        for (let turn = 1; turn <= 10; turn++) {
          let step;
          try {
            step = await window.OfflineEngine.getScenarioStep(scn, turn);
          } catch (e) {
            stepErr = 'T' + turn + ' getScenarioStep: ' + String(e).slice(0, 120);
            break;
          }
          const opts = (step && step.options) || [];
          if (!opts.length) {
            stepErr = 'T' + turn + ' 无选项';
            break;
          }
          const hit = opts.find(
            (o) => String(o.weight || '').toLowerCase() === wanted
          );
          const pick = hit || opts[0];
          finalPick = pick;
          try {
            last = await window.OfflineEngine.executeTurn(
              session.game_id,
              { option: pick.id, justification: '' },
              scn
            );
          } catch (e) {
            stepErr = 'T' + turn + ' executeTurn: ' + String(e).slice(0, 120);
            break;
          }
        }
        out.push({
          scenario: scn,
          posture: wanted,
          stepErr,
          // 契约的唯一读数点：顶层字段与 game_state 内副本必须同时存在。
          top: last ? last.final_outcome || null : null,
          inState:
            last && last.game_state ? last.game_state.final_outcome || null : null,
          turnNumber: last ? last.turnNumber : null,
          feedbackLen: last ? String(last.feedback || '').length : 0,
          // P0 同源证据：玩家点的是洗牌后槽位（id），它原先是谁（_orig_id）才是
          // 结算与判结局该用的身份。history 里存的必须是 _orig_id，不是槽位字母。
          pickedSlot: finalPick ? finalPick.id : '',
          pickedOrigId: finalPick ? finalPick._orig_id || '' : '',
          pickedTrigger: finalPick ? finalPick.trigger_outcome || '' : '',
          finalHistoryEntry:
            last && last.game_state && last.game_state.decision_history
              ? last.game_state.decision_history[last.game_state.decision_history.length - 1] || null
              : null,
        });
      }
    }
    return out;
  },
  { scenarios: SCENARIOS, runs: RUNS }
);

const fails = [];
for (const r of results) {
  const tag = `${r.scenario}/${r.posture}`;
  if (r.stepErr) {
    fails.push(`${tag} 运行中断：${r.stepErr}`);
    console.log(`FAIL ${tag} 运行中断：${r.stepErr}`);
    continue;
  }
  const id = r.top && r.top.id;
  const idInState = r.inState && r.inState.id;
  if (!id) {
    fails.push(`${tag} 缺 result.final_outcome.id`);
    console.log(`FAIL ${tag} 缺 result.final_outcome（turn=${r.turnNumber} fb=${r.feedbackLen}）`);
    continue;
  }
  if (!idInState) {
    fails.push(`${tag} 缺 game_state.final_outcome.id`);
    console.log(`FAIL ${tag} 顶层有 id=${id}，但 game_state 内没有`);
    continue;
  }
  // —— P0 同源断言（G7 扩展）——
  // 屏幕上点的是洗牌后的槽位字母，结算与判结局必须用它的原始身份。
  // 这条断言直接钉住 P0：challenger 的结局 id 由 T10 选项显式声明，
  // 一旦判定拿洗牌字母去查未洗牌 step，id 就会与所点选项的 trigger_outcome 分岔。
  const entry = r.finalHistoryEntry;
  if (!entry) {
    fails.push(`${tag} 终局无 decision_history 条目`);
  } else {
    if (String(entry.turn) !== '10') {
      fails.push(`${tag} 终局 decision_history 落在 turn=${entry.turn}，应为 10`);
    }
    if (String(entry.option_id) !== String(r.pickedSlot)) {
      fails.push(`${tag} history 记录槽位 ${entry.option_id} ≠ 实际所点 ${r.pickedSlot}`);
    }
    if (r.pickedOrigId) {
      if (!entry.option_orig_id) {
        fails.push(`${tag} history 缺 option_orig_id（洗牌槽位未落库原始身份）`);
      } else if (String(entry.option_orig_id) !== String(r.pickedOrigId)) {
        fails.push(
          `${tag} option_orig_id=${entry.option_orig_id} ≠ 所点槽位原始身份 ${r.pickedOrigId}`
        );
      }
    }
    if (r.scenario === 'challenger-launch' && r.pickedTrigger) {
      if (String(id) !== String(r.pickedTrigger)) {
        fails.push(
          `${tag} 结局 id=${id} ≠ 所点选项 trigger_outcome=${r.pickedTrigger}（终局判定与所选槽位错位）`
        );
      }
    }
  }

  console.log(`PASS ${tag} id=${id} inState=${idInState} turn=${r.turnNumber}`);
}

if (pageErrors.length) {
  fails.push('pageerror: ' + pageErrors[0]);
  console.log('FAIL pageerror:\n  - ' + pageErrors.slice(0, 5).join('\n  - '));
}

if (fails.length) {
  console.log('\n失败明细：');
  fails.slice(0, 20).forEach((f) => console.log('  - ' + f));
}

console.log(
  fails.length
    ? `\nFAILED: ${fails.length} / ${results.length} 局`
    : `\nPASS 全部 ${results.length} 局持有 final_outcome`
);

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

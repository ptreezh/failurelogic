// Loop 4 · climate 场景的可执行验收口径（承接 Loop 3 的六条，改了三条口径）。
//
// 为什么要有这个脚本：Loop 2 的验收数字是"当场跑一次、写在报告里"，口径散在
// 文档里，下一次改动没人知道哪条线不能再退。这里把口径写成断言，跑一次就有
// 退出码，CI 或本地都能拦回退。
//
// 教学契约（断言）：
//   A. 随机 100 局：1.5°C 档命中率 <= 5%          —— 瞎点不能赢
//   B. 预算化高投入（PLANNED, 按预测上界留余量）70%~95% —— 第二条通关路径存在
//   B2. 计划外账单真实存在（PLANNED 局：交付缺口转成的赤字 局均 >= 0.4）
//       —— 计划谬误是被测量出来的，不是被写进文档的
//   C. 纯激进无补偿（RISKY）<= 5%                 —— 高风险必须靠补偿兑现
//   D. 纯保守（SAFE）<= 10%                       —— 一味求稳也过不了
//   E. 温和持续（NEUTRAL）12%~55%                 —— 折中路线可行但不是唯一；
//      Loop 4 把上限从 70% 收到 55%：交付缺口的赤字成本落地后，温和路线不再
//      接近"稳赢"，只是"押对年份才有机会"。
//   F. 傻瓜策略"永远选第一个"<= 20%               —— 不能靠选项位置通关
//   G. 每局都有【档位判定】、无未填模板槽位、0 pageerror
//
// Loop 4 增补：
//   H. --seeds=real 时随机源换成真随机种子再跑一遍 A/random —— 固定 LCG 覆盖有限，
//      不能只在一条种子族上证明"瞎点不能赢"。
//   B 的上界、B2 的"计划外赤字"也是 Loop 4 加的：计划路线原本 100% 通关，
//   等于告诉玩家"算准了就没有风险"，而真实失败逻辑里预测正确不代表交付正确。
//
// Loop 5 改造（不改任何口径，只改跑法）：
//   原来 300 局塞进一个 page.evaluate，中途 renderer 直接崩掉，报错却是
//   "page.evaluate: Target page ... has been closed" —— 看起来像断言代码写错，
//   实际上是一次调用太长。现在先注入 play 函数，再由 Node 侧逐局调用：
//   崩溃点立刻落回具体的 seed/strategy，单局失败也不会带走整轮验收。
//
// 用法：node scripts/acceptance-climate.mjs [randomRuns] [--dist] [--seeds=real]
// 退出码 0 = 全部通过，1 = 有断言失败（明细见 FAIL 行）。

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const RANDOM_RUNS = Number(process.argv[2] || 100);
const DIST = process.argv.indexOf('--dist') >= 0;
const REAL_SEEDS = process.argv.indexOf('--seeds=real') >= 0;
// Port is randomised: an aborted previous run can leave the listener in
// TIME_WAIT and the next server silently loses the race, which then looks
// exactly like a code bug. Cost of this line: zero.
const PORT = 8481 + Math.floor(Math.random() * 400);
const SCN = 'climate-change-policy';
const ROOT = 'D:/AIDevelop/failureLogic';
const BASE = DIST ? 'file:///' + ROOT + '/dist/failure-logic-standalone.html'
                  : 'http://127.0.0.1:' + PORT + '/index.html';

// dist 是单文件，直接 file:// 打开（内联数据 + 内联引擎），连服务器都不用起。
const srv = DIST ? null : spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' });
if (!DIST) await new Promise(r => setTimeout(r, 1400));

const browser = await chromium.launch();
const pageErrors = [];

// 200 局是纯引擎计算（每局 10 回合，全程不碰 DOM），单 page 只能一条一条算。
// 局与局之间没有任何共享状态（种子走 window.__FL_OPTION_SEED__，会话走 createGameSession），
// 所以切开分给多个 page 并行，逐局结果与串行完全一致——只是把墙钟除以并行度。
async function openWorkerPage() {
  const page = await browser.newPage();
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)));
  // A renderer crash used to surface as a naked "Target page closed". Name it.
  page.on('crash', () => pageErrors.push('renderer crash'));
  page.on('console', m => { if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 120)); });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.OfflineEngine);

// ---- inject once, call per run ----
await page.evaluate((scn) => {
  // 预算化高投入：读区间上界（知道自己不知道），留余量。
  const plannedPick = (gs, opts) => {
    const plan = window.OfflineEngine.planClimateOption;
    let best = null;
    for (const x of opts) {
      const p = plan(gs || {}, x.eff || {});
      const value = x.renew + 0.15 * x.sup + 0.10 * x.trust;
      const debtEst = typeof p.projectedDebtHigh === 'number' ? p.projectedDebtHigh : p.projectedDebt + 2;
      if (debtEst <= 16 && (!best || value > best.value)) best = { id: x.o.id, value };
    }
    return best ? best.id : opts[0].o.id;
  };

  window.__flAccept = {
    async play(seed, kind) {
      window.__FL_OPTION_SEED__ = seed;
      const c = await window.OfflineEngine.createGameSession(scn, 'auto');
      let gs = null;
      let last = '';
      let optimism = 0;
      for (let t = 1; t <= 10; t++) {
        const st = await window.OfflineEngine.getScenarioStep(scn, t);
        const opts = st.options.map(o => {
          const e = (st.expected_effects || {})[o.id] || {};
          return { o, eff: e, renew: e.renewable_share_pct || 0, sup: e.public_support_pct || 0, trust: e.international_trust || 0 };
        });
        let id;
        if (kind === 'random') {
          id = st.options[((seed * 1103515245 + t * 12345) >>> 0) % st.options.length].id;
        } else if (kind === 'planned') {
          id = plannedPick(gs, opts);
        } else if (kind === 'first') {
          id = st.options[0].id;
        } else {
          const want = kind === 'safe' ? ['safe', 'extreme_safe']
            : kind === 'risky' ? ['risky', 'extreme_risk'] : ['neutral'];
          const hit = opts.filter(x => want.indexOf(String(x.o.weight)) >= 0)[0];
          id = (hit || opts[0]).o.id;
        }
        const r = await window.OfflineEngine.executeTurn(c.game_id, { option: id, justification: '' }, scn);
        gs = r.game_state;
        last = r.feedback || '';
        // 预测之外的那部分账单：承诺了却没兑现、按承诺转成赤字的份额。
        optimism += (gs.last_shortfall_debt || 0);
      }
      const at = last.lastIndexOf('\u2192 \u5b9a\u6863\uff1a');
      let band = '?';
      if (at >= 0) band = last.slice(at + 5).split('\n')[0].split('\uff08')[0].trim();
      return {
        band,
        unfilled: (last.match(/\{[a-zA-Z_][0-9a-zA-Z]*\}/g) || []).length,
        hasBand: last.indexOf('\u3010\u6863\u4f4d\u5224\u5b9a\u3011') >= 0,
        temp: gs.global_avg_temp_c,
        debt: gs.implementation_debt,
        renew: gs.renewable_share_pct,
        optimism: Math.round(optimism * 100) / 100
      };
    }
  };
}, SCN);
  return page;
}

const realSeed = () => 1 + Math.floor(Math.random() * 2147483645);

// 任务表与串行时的产出顺序逐条对应：结果按同一 index 回填，
// 聚合口径（runs[kind] 的条数与顺序）不受并行影响。
const jobs = [];
for (let i = 0; i < RANDOM_RUNS; i++) jobs.push({ bucket: 'random', kind: 'random', seed: 1000 + i * 7 });
for (const kind of ['planned', 'neutral', 'safe', 'risky', 'first']) {
  for (let i = 0; i < 20; i++) jobs.push({ bucket: kind, kind, seed: 2000 + i * 13 });
}
if (REAL_SEEDS) {
  for (let i = 0; i < RANDOM_RUNS; i++) jobs.push({ bucket: 'realRandom', kind: 'random', seed: realSeed() });
}

const one = async (page, seed, kind) => {
  try {
    return await page.evaluate(([s, k]) => window.__flAccept.play(s, k), [seed, kind]);
  } catch (e) {
    return { error: kind + '/' + seed + ': ' + String(e.message || e).slice(0, 120) };
  }
};

// 并行度默认 8：一局约 0.55s，8 路已把 111s 压到十几秒；
// 再往上加就是单核吞吐互抢，收益递减。调试可用 FL_CLIMATE_WORKERS 覆盖。
const WORKERS = Math.max(1, Math.min(jobs.length, Number(process.env.FL_CLIMATE_WORKERS) || 8));

const results = new Array(jobs.length);
let cursor = 0;
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, async () => {
  const page = await openWorkerPage();
  try {
    for (;;) {
      const i = cursor++;
      if (i >= jobs.length) break;
      const job = jobs[i];
      results[i] = await one(page, job.seed, job.kind);
    }
  } finally {
    await page.close().catch(() => {});
  }
}));

const runs = { random: [], planned: [], neutral: [], safe: [], risky: [], first: [] };
if (REAL_SEEDS) runs.realRandom = [];
jobs.forEach((job, i) => runs[job.bucket].push(results[i]));

// A crashed run must fail loudly instead of skewing a percentage.
const crashed = [];
Object.keys(runs).forEach(k => runs[k].forEach(r => { if (r && r.error) crashed.push(r.error); }));
if (crashed.length) {
  console.log('RUN ERRORS ' + crashed.length + '\n  ' + crashed.slice(0, 5).join('\n  '));
}

const summary = {};
let unfilled = 0;
let missingBand = 0;
Object.keys(runs).forEach(k => {
  const arr = runs[k].filter(r => r && !r.error);
  if (!arr.length) return;
  Object.keys(runs[k]).forEach(() => {});
  runs[k].forEach(r => {
    if (!r || r.error) return;
    unfilled += r.unfilled;
    if (!r.hasBand) missingBand += 1;
  });
  const pc = (n) => Math.round(n / arr.length * 1000) / 10;
  summary[k] = {
    n: arr.length,
    win: pc(arr.filter(r => r.band === '1.5\u00b0C \u6863').length),
    two: pc(arr.filter(r => r.band === '2.0\u00b0C \u6863').length),
    three: pc(arr.filter(r => r.band === '3\u00b0C \u6863').length),
    meanPeak: Math.round(arr.reduce((s, r) => s + (r.temp || 0), 0) / arr.length * 100) / 100,
    meanDebt: Math.round(arr.reduce((s, r) => s + (r.debt || 0), 0) / arr.length * 10) / 10,
    meanRenew: Math.round(arr.reduce((s, r) => s + (r.renew || 0), 0) / arr.length * 10) / 10,
    optimism: Math.round(arr.reduce((s, r) => s + (r.optimism || 0), 0) / arr.length * 100) / 100,
    optimismPositive: pc(arr.filter(r => (r.optimism || 0) > 0).length)
  };
});

const S = summary;
const fails = [];
if (crashed.length) fails.push('G ' + crashed.length + ' 局运行中断：' + crashed[0]);
if (S.random && S.random.win > 5) fails.push('A 随机 1.5\u00b0C 命中率 ' + S.random.win + '% > 5%');
if (S.planned && S.planned.win < 70) fails.push('B 预算化高投入（上界）通关率 ' + S.planned.win + '% < 70%（路线二被削）');
if (S.planned && S.planned.win > 95) fails.push('B 预算化高投入通关率 ' + S.planned.win + '% > 95%（又变成一条必胜线）');
if (S.planned && S.planned.optimism < 0.4) fails.push('B2 预算路线局均计划外赤字 ' + S.planned.optimism + ' < 0.4（预测又变成算术了）');
if (S.planned && S.planned.optimismPositive < 60) fails.push('B2 出现计划外赤字的局只占 ' + S.planned.optimismPositive + '% < 60%');
if (S.risky && S.risky.win > 5) fails.push('C 纯激进通关率 ' + S.risky.win + '% > 5%');
if (S.safe && S.safe.win > 10) fails.push('D 纯保守通关率 ' + S.safe.win + '% > 10%');
if (S.neutral && (S.neutral.win < 12 || S.neutral.win > 55)) fails.push('E 温和持续通关率 ' + S.neutral.win + '% 越出 12%~55%');
if (S.first && S.first.win > 20) fails.push('F 永远选第一个通关率 ' + S.first.win + '% > 20%');
if (unfilled > 0) fails.push('G 未填模板槽位 ' + unfilled + ' 处');
if (missingBand > 0) fails.push('G 缺【档位判定】的局 ' + missingBand + ' 局');
if (S.realRandom && S.realRandom.win > 5) fails.push('H 真随机种子下 1.5\u00b0C 命中率 ' + S.realRandom.win + '% > 5%');
if (pageErrors.length) fails.push('G pageerror ' + pageErrors.length + ' 条：' + pageErrors[0]);

console.log('策略              局数  1.5\u00b0C   2.0\u00b0C   3\u00b0C    均峰值  均赤字  均可再生');
['random', 'realRandom', 'planned', 'neutral', 'safe', 'risky', 'first'].filter(k => S[k]).forEach(k => {
  const r = S[k];
  console.log(
    k.padEnd(18) + String(r.n).padEnd(6) +
    (r.win + '%').padEnd(8) + (r.two + '%').padEnd(8) + (r.three + '%').padEnd(7) +
    String(r.meanPeak).padEnd(8) + String(r.meanDebt).padEnd(8) + r.meanRenew + '%'
  );
});
console.log('计划外赤字（交付缺口折算，逐局累加）' + Object.keys(S)
  .map(k => k + ' ' + S[k].optimism + '(' + S[k].optimismPositive + '%局出现)').join(' | '));
console.log('未填槽位 ' + unfilled + ' | pageerror ' + pageErrors.length);
console.log(fails.length ? 'FAIL\n  - ' + fails.join('\n  - ') : 'PASS 全部验收口径');

await browser.close();
if (srv) srv.kill();
process.exit(fails.length ? 1 : 0);

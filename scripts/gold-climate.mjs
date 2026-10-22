// Loop 2/3 gold-standard regression（诊断标签 6 条，稳定后一直跑这个）。
// Six runs, one fixed seed, each defined by a POSTURE rule (the posture tag the
// scenario authors put on each option), not by screen slot: slot letters are
// shuffled per run, so a letter-keyed sequence no longer means anything.
//   G1 ALL_SAFE     1-10 safe/extreme_safe      expect 策略僵硬
//   G2 ALL_RISK     1-10 risky/extreme_risk     expect 策略僵硬
//   G3 ALL_NEUTRAL  1-10 neutral                expect 策略僵硬
//   G4 SAFE_6       1-6 safe,  7-10 risky       expect 策略一致 · 会修正
//   G5 RISK_6       1-6 risky, 7-10 safe        expect 策略一致 · 会修正
//   G6 ALT          alternate safe/risky        expect 策略分散
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8163;
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: 'D:/AIDevelop/failureLogic', stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.error('PAGEERROR', String(e).slice(0, 300)));
await p.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => !!window.OfflineEngine);
// must be re-applied after reload: createGameSession reads it synchronously
await p.evaluate(() => { localStorage.setItem('fl_option_seed_climate-change-policy', '4242'); window.__FL_OPTION_SEED__ = 4242; });

const SAFE = ['safe', 'extreme_safe'], RISK = ['risky', 'extreme_risk'], NEU = ['neutral'];
// posture target per turn, resolved inside the page
const GOLD = {
  G1_ALL_SAFE: { expect: '策略僵硬', turns: Array(10).fill(SAFE) },
  G2_ALL_RISK: { expect: '策略僵硬', turns: Array(10).fill(RISK) },
  G3_ALL_NEUTRAL: { expect: '策略僵硬', turns: Array(10).fill(NEU) },
  G4_SAFE_THEN_RISK: { expect: '策略一致 · 会修正', turns: [SAFE, SAFE, SAFE, SAFE, SAFE, SAFE, RISK, RISK, RISK, RISK] },
  G5_RISK_THEN_SAFE: { expect: '策略一致 · 会修正', turns: [RISK, RISK, RISK, RISK, RISK, RISK, SAFE, SAFE, SAFE, SAFE] },
  G6_ALTERNATE: { expect: '策略分散', turns: [SAFE, RISK, SAFE, RISK, SAFE, RISK, SAFE, RISK, SAFE, RISK] },
};

const out = await p.evaluate(async (GOLD) => {
  const SCN = 'climate-change-policy';
  const res = {};
  for (const key of Object.keys(GOLD)) {
    const rule = GOLD[key];
    const c = await window.OfflineEngine.createGameSession(SCN, 'auto');
    let gs = null, labels = [], band = null, last = '', picked = [];
    for (let t = 1; t <= 10; t++) {
      const st = await window.OfflineEngine.getScenarioStep(SCN, t);
      const want = rule.turns[t - 1];
      let opt = st.options.filter(o => want.indexOf(String(o.weight || '').toLowerCase()) >= 0)[0];
      if (!opt) opt = st.options[0];
      picked.push((opt._orig_id || opt.id) + ':' + opt.weight);
      const r = await window.OfflineEngine.executeTurn(c.game_id, { option: opt.id, justification: '' }, SCN);
      gs = r.game_state;
      last = r.feedback || '';
      const m = last.match(/【行为诊断 · 一致性 vs 僵硬】\s*\n\s*([^\n]+)/);
      if (m) labels.push({ turn: t, label: m[1].trim() });
      const bm = last.match(/定档：([^\n（]+)/);
      if (bm) band = bm[1].trim();
    }
    res[key] = {
      expect: rule.expect,
      finalLabel: labels.length ? labels[labels.length - 1].label : null,
      labels, band, temp: gs.global_avg_temp_c, debt: gs.implementation_debt || 0,
      renew: Math.round((gs.renewable_share_pct || 0) * 10) / 10,
      support: Math.round(gs.public_support_pct), trust: Math.round(gs.international_trust),
      hasFiscal: /⑤ 隐性赤字已在/.test(last),
      // V10: the epilogue title is the loudest sentence in the game. If it says
      // "3°C" while the report below says 1.77, the player is told two
      // different things and the lesson collapses into noise.
      title: (last.split('\n').find(l => /^[❌⚠️✅💥]/.test(l.trim())) || '').trim(),
      picked,
      head: last.split('\n').slice(0, 6).join(' | ')
    };
  }
  return res;
}, GOLD);

let pass = 0;
let v10fail = 0;
for (const [k, v] of Object.entries(out)) {
  const okSet = { G1_ALL_SAFE: ['策略僵硬'], G2_ALL_RISK: ['策略僵硬'], G3_ALL_NEUTRAL: ['策略僵硬'], G4_SAFE_THEN_RISK: ['策略一致 · 会修正'], G5_RISK_THEN_SAFE: ['策略一致 · 会修正'], G6_ALTERNATE: ['策略分散', '策略一致 · 会修正'] }[k];
  const ok = okSet.indexOf(v.finalLabel) >= 0;
  if (ok) pass++;
  // V10: any temperature threshold printed in the title must match the real peak.
  const t = v.title || '';
  let v10 = true, why = '';
  if (t.indexOf('3°C') >= 0 && !(v.temp > 2.30)) { v10 = false; why = t + ' 但 temp=' + v.temp; }
  else if (t.indexOf('1.5°C') >= 0 && !(v.temp < 1.85)) { v10 = false; why = t + ' 但 temp=' + v.temp; }
  else if (t.indexOf('2°C') >= 0 && t.indexOf('1.5°C') < 0 && !(v.temp >= 1.85 && v.temp <= 2.30)) { v10 = false; why = t + ' 但 temp=' + v.temp; }
  if (!v10) v10fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${k} expect=${v.expect} got=${v.finalLabel} | band=${v.band} temp=${v.temp} debt=${v.debt} renew=${v.renew}`);
  console.log('   title:', t || '(none)', v10 ? 'V10-OK' : 'V10-FAIL ' + why);
  console.log('   picked:', v.picked.join(' '));
  console.log('   labels:', v.labels.map(x => x.turn + ':' + x.label).join(' / '));
}
console.log(`GOLD ${pass}/6 | V10 叙事/温度一致 ${6 - v10fail}/6`);
await b.close(); srv.kill();
process.exit(pass === 6 && v10fail === 0 ? 0 : 1);

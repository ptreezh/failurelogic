import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8496;
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
const browser = await chromium.launch();
const fails = [];

// --- 1. 移动端徽标占位：看它压到谁 ---
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await mobile.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
await mobile.waitForFunction(() => !!window.OfflineEngine);
const mob = await mobile.evaluate(async () => {
  window.__FL_OPTION_SEED__ = 777;
  await window.OfflineEngine.createGameSession('climate-change-policy', 'auto');
  await new Promise(r => setTimeout(r, 300));
  const badge = document.getElementById('fl-run-seed-badge');
  if (!badge) return { badge: false };
  const b = badge.getBoundingClientRect();
  const hits = [];
  document.querySelectorAll('body *').forEach(n => {
    if (n === badge || badge.contains(n) || n.contains(badge)) return;
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return;
    if (!/fixed|sticky/.test(cs.position)) return;
    const r = n.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const ov = Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left)) *
               Math.max(0, Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top));
    if (ov > 0) hits.push({ tag: n.tagName + (n.id ? '#' + n.id : '') + (n.className ? '.' + String(n.className).split(' ')[0] : ''), ov: Math.round(ov), text: (n.textContent || '').trim().slice(0, 24) });
  });
  return { badge: true, rect: { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) }, text: badge.textContent, scenario: badge.getAttribute('data-scenario'), hits: hits, inViewport: b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight };
});
console.log('MOBILE ' + JSON.stringify(mob));

// --- 2. 非 climate 场景也要挂标 ---
const desk = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desk.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
await desk.waitForFunction(() => !!window.OfflineEngine);
const other = await desk.evaluate(async () => {
  window.__FL_OPTION_SEED__ = 4242;
  await window.OfflineEngine.createGameSession('enron-collapse', 'auto');
  await new Promise(r => setTimeout(r, 300));
  const badge = document.getElementById('fl-run-seed-badge');
  const first = badge ? { text: badge.textContent, scenario: badge.getAttribute('data-scenario') } : null;
  window.__FL_OPTION_SEED__ = 991;
  await window.OfflineEngine.createGameSession('climate-change-policy', 'auto');
  await new Promise(r => setTimeout(r, 200));
  const second = badge ? { text: badge.textContent, scenario: badge.getAttribute('data-scenario') } : null;
  return { first, second };
});
console.log('SCENARIOS ' + JSON.stringify(other));
if (!other.first) fails.push('非 climate 场景没有 seed 徽标');
if (other.second && other.second.text.indexOf('991') < 0) fails.push('换场景后徽标没切到新编号');

// --- 2b. 连续不推进产能 → 制度锈蚀必须显形 ---
const erode = await desk.evaluate(async () => {
  const SCN = 'climate-change-policy';
  window.__FL_OPTION_SEED__ = 555;
  const c = await window.OfflineEngine.createGameSession(SCN, 'auto');
  let seen = false, detail = '';
  for (let t = 1; t <= 10; t++) {
    const st = await window.OfflineEngine.getScenarioStep(SCN, t);
    const defer = st.options.filter(o => !(((st.expected_effects || {})[o.id] || {}).renewable_share_pct > 0));
    const id = (defer[0] || st.options[0]).id;
    const r = await window.OfflineEngine.executeTurn(c.game_id, { option: id, justification: '' }, SCN);
    if ((r.feedback || '').indexOf('制度锈蚀') >= 0) { seen = true; detail = (r.feedback.match(/制度锈蚀[^\n]*/) || [''])[0]; break; }
  }
  return { seen: seen, detail: detail };
});
console.log('ERODE ' + JSON.stringify(erode));
if (!erode.seen) fails.push('连年不推进产能时没有“制度锈蚀”提示');

// --- 3. dist 单文件：反馈非空 + Loop4 三行 ---
const dist = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await dist.goto(pathToFileURL(ROOT + '/dist/failure-logic-standalone.html').href, { waitUntil: 'domcontentloaded' });
await dist.waitForFunction(() => !!window.OfflineEngine);
const d = await dist.evaluate(async () => {
  const SCN = 'climate-change-policy';
  window.__FL_OPTION_SEED__ = 2000;
  const c = await window.OfflineEngine.createGameSession(SCN, 'auto');
  let last = '', gs = null; const marks = { band: false, erode: false, shock: false, proj: false, short: false };
  for (let t = 1; t <= 10; t++) {
    const st = await window.OfflineEngine.getScenarioStep(SCN, t);
    const withRenew = st.options.filter(o => ((st.expected_effects || {})[o.id] || {}).renewable_share_pct > 0);
    const id = (withRenew[0] || st.options[0]).id;
    const r = await window.OfflineEngine.executeTurn(c.game_id, { option: id, justification: '' }, SCN);
    last = r.feedback || ''; gs = r.game_state;
    if (last.indexOf('【档位判定】') >= 0) marks.band = true;
    if (last.indexOf('锈蚀') >= 0) marks.erode = true;
    if (last.indexOf('冲击') >= 0) marks.shock = true;
    if (last.indexOf('赤字预测') >= 0) marks.proj = true;
    if (last.indexOf('交付缺口') >= 0) marks.short = true;
  }
  return { len: last.length, marks, tail: last.slice(-420) };
});
console.log('DIST ' + JSON.stringify({ len: d.len, marks: d.marks }));
if (!d.len) fails.push('dist 反馈为空');
if (!d.marks.band) fails.push('dist 反馈缺档位判定');
if (!d.marks.proj) fails.push('dist 反馈缺预测区间行');

console.log(fails.length ? 'FAIL\n  - ' + fails.join('\n  - ') : 'PASS quant-ui 探针');
await browser.close(); srv.kill();
process.exit(fails.length ? 1 : 0);

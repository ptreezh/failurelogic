#!/usr/bin/env node
/**
 * probe-derived.mjs — 验证派生层（C1 白名单三指标）在真实跑局里到底有没有值。
 *
 * 不是断言脚本，不挂 CI。用途：回答"derive_runtime 的 4 条规则是真能上屏，
 * 还是永远 unreached"。策略固定为"每回合选最后一个选项"（最激进），
 * 与 debrief-assert 的走法一致，便于对照。
 *
 * 用法：node scripts/probe-derived.mjs [场景id...]
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8767;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const fp = path.join(ROOT, rel);
  if (!fp.startsWith(path.resolve(ROOT)) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404); res.end('404'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const ALL = [
  { id: 'challenger-launch', src: '挑战者' },
  { id: 'chip-ai-supplychain', src: '芯片' },
  { id: 'climate-change-policy', src: '气候' },
  { id: 'enron-collapse', src: '安然' },
  { id: 'noodle-shop-community', src: '面馆' }
];
const want = process.argv.slice(2);
const list = want.length ? ALL.filter((s) => want.includes(s.id)) : ALL;

const browser = await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
const rows = [];

for (const scn of list) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', () => {});
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.OfflineEngine, null, { timeout: 30000 });
  await page.click('#start-journey');
  await page.waitForTimeout(1000);
  const ok = await page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const card = [...document.querySelectorAll('.scenario-card')].find((n) => re.test(n.innerText));
    if (!card) return false;
    card.querySelector('.btn-primary,button').click();
    return true;
  }, scn.src);
  await page.waitForTimeout(2600);
  if (!ok) { console.log(`SKIP ${scn.id} 找不到卡片`); await page.close(); continue; }

  for (let t = 0; t < 10; t++) {
    const opts = await page.$$('.challenger-option');
    if (!opts.length) break;
    await opts[opts.length - 1].click();
    await page.waitForTimeout(900);
    const nx = await page.$('#challenger-next-turn');
    if (nx) { await nx.click(); await page.waitForTimeout(900); }
  }
  try {
    await page.waitForFunction(
      () => !!(document.querySelector('[data-fl-debrief-host]') || {}).getAttribute?.('data-mounted'),
      null, { timeout: 15000 });
  } catch (_) {}

  const got = await page.evaluate(() => {
    const m = (window.FLDebrief && window.FLDebrief.lastModel) || null;
    if (!m) return null;
    const st = (window.challengerRouter && window.challengerRouter.gameState) || {};
    const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
    const dm = window.FLDebrief.deriveMetrics ? window.FLDebrief.deriveMetrics(st, null) : {};
    return {
      diag: {
        turns: hist.length,
        sampleKeys: Object.keys(hist[0] || {}),
        weights: hist.map((d) => (d.option_weight || d.weight || '∅')),
        warnInc: hist.map((d) => ((d.applied_effects || {}).ignored_warnings_count)),
        concerns: hist.map((d) => ((d.expected_concerns_addressed || []).length)),
        derived: dm
      },
      coverage: m.conceptCoverage,
      derived: (m.concepts || []).filter((c) => (c.atoms || []).some((a) => a.source === 'derived'))
        .map((c) => ({
          concept: c.concept, verdict: c.verdict, status: c.status, visible: c.visible,
          atoms: c.atoms.filter((a) => a.source === 'derived')
            .map((a) => `${a.name}=${a.value}${a.pass ? '✓' : '✗'}`)
        }))
    };
  });

  rows.push({ id: scn.id, got });
  console.log(`\n=== ${scn.id} ===`);
  if (!got) { console.log('  没拿到 lastModel'); await page.close(); continue; }
  console.log('  coverage', JSON.stringify(got.coverage));
  const d = got.diag;
  console.log(`  历史 ${d.turns} 回合｜字段 ${d.sampleKeys.join(',')}`);
  console.log(`  weights ${d.weights.join('/')}`);
  console.log(`  warnInc ${JSON.stringify(d.warnInc)}｜concerns ${JSON.stringify(d.concerns)}`);
  for (const k of Object.keys(d.derived || {})) {
    const v = d.derived[k];
    console.log(`  -> ${k}: ${v.available ? 'value=' + v.value : 'UNAVAILABLE(' + v.reason + ')'} @${v.evidenceTurns.join(',')}`);
  }
  if (!got.derived.length) console.log('  ! 没有任何规则引用派生指标');
  for (const d of got.derived) {
    console.log(`  · ${d.concept} [${d.verdict}/${d.status}${d.visible ? '/可见' : '/折叠'}] ${d.atoms.join(', ')}`);
  }
  await page.close();
}

await browser.close();
server.close();

const usable = rows.filter((r) => r.got && r.got.derived.some((d) => d.visible)).map((r) => r.id);
console.log(`\n派生指标可见的场景：${usable.length}/${rows.length} → ${usable.join(', ') || '无'}`);
process.exit(0);

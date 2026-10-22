/**
 * V23: the single-file build must carry the layered feedback too. Inlined CSS
 * order differs from the dev build, so this is checked on file:// rather than
 * assumed.
 */
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));

await p.goto('file:///D:/AIDevelop/failureLogic/dist/failure-logic-standalone.html', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1500);
await p.click('#start-journey');
await p.waitForTimeout(900);
await p.evaluate(() => {
  const card = [...document.querySelectorAll('.scenario-card')].find((n) => /气候/.test(n.innerText));
  card.querySelector('.btn-primary,button').click();
});
await p.waitForTimeout(2600);
await p.evaluate(() => document.querySelector('.challenger-option').click());
await p.waitForTimeout(1200);

const r = await p.evaluate(() => {
  const disp = document.getElementById('challenger-feedback-display');
  const body = disp && disp.querySelector('.fb-body');
  if (!body) return { ok: false };
  const det = [...body.querySelectorAll('details.fb-more')];
  const clone = body.cloneNode(true);
  clone.querySelectorAll('details').forEach((d) => d.remove());
  const sum = det[0] ? det[0].querySelector('summary') : null;
  const cs = sum ? getComputedStyle(sum) : null;
  const rt = window.challengerRouter;
  const all = (() => { const c = body.cloneNode(true); c.querySelectorAll('summary').forEach((s) => s.remove()); return c.textContent.replace(/\s+/g, ''); })();
  const src = rt._normalizeNumbers(String(rt.lastFeedback || ''))
    .replace(/^#{1,4}\s+/gm, '').replace(/^[=\-]{5,}$/gm, '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, '');
  return {
    ok: true,
    details: det.length,
    open: det.filter((d) => d.open).length,
    visible: clone.textContent.replace(/\s+/g, '').length,
    summaryH: sum ? Math.round(sum.getBoundingClientRect().height) : null,
    cursor: cs ? cs.cursor : null,
    markerHidden: cs ? cs.listStyleType : null,
    same: all === src,
    lsWorks: (() => { try { localStorage.setItem('x', '1'); localStorage.removeItem('x'); return true; } catch (e) { return false; } })(),
  };
});

console.log('DIST ' + JSON.stringify(r));
console.log('ERRORS ' + JSON.stringify(errs));
await b.close();
process.exit(!r.ok || r.details < 1 || !r.same || r.open !== 0 || errs.length ? 1 : 0);

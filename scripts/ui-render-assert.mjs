/**
 * Loop 5 · UI render assertions (V1–V10)
 *
 * Why this file exists: every acceptance run so far drove OfflineEngine
 * directly and never touched the DOM. That is how a "the page never advances"
 * bug survived four loops of green tests - and how a *false* version of that
 * bug was nearly written into a spec (the selector `button:has-text("继续")`
 * matched an option reading "邀请各国继续履约").
 *
 * Rules baked in here, so the next person cannot repeat either mistake:
 *   1. never locate a control by its text; use id / class / data-* only.
 *   2. after every click, assert the header turn AND step.turn AND
 *      lastTurnNumber moved together - asserting one of three is asserting
 *      nothing.
 *   3. distinguish "page did not repaint" from "engine did not move".
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8531;
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1600));

const fails = [];
const notes = [];
const fbLog = [];
const browser = await chromium.launch();

const hash = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

const snap = (page) => page.evaluate(() => {
  const r = window.challengerRouter;
  const opts = [...document.querySelectorAll('.challenger-option')];
  const fb = document.getElementById('challenger-feedback-display');
  const nx = document.getElementById('challenger-next-turn');
  const g = document.querySelectorAll('.climate-gauges .gauge');
  return {
    headerTurn: ((document.querySelector('.challenger-decision-page .page-header h2') || {}).textContent || '').match(/第\s*(\d+)\s*回合/)?.[1] || null,
    progress: (document.querySelector('.challenger-decision-page .progress') || {}).textContent || '',
    last: r ? r.lastTurnNumber : null,
    step: r && r.currentStep ? r.currentStep.turn : null,
    locked: r ? r.locked : null,
    firstText: opts.length ? opts[0].innerText.replace(/\s+/g, '').slice(0, 24) : '',
    optionCount: opts.length,
    disabledCount: opts.filter((o) => o.hasAttribute('disabled')).length,
    fbVisible: !!fb && getComputedStyle(fb).display !== 'none',
    fbTop: fb && fb.getBoundingClientRect().height > 0 ? fb.getBoundingClientRect().top : null,
    firstOptTop: opts.length ? opts[0].getBoundingClientRect().top : null,
    nextLabel: nx ? nx.innerText.trim() : null,
    nextH: nx ? Math.round(nx.getBoundingClientRect().height) : null,
    submitH: (() => {
      const b = document.getElementById('challenger-submit');
      if (!b || getComputedStyle(b).display === 'none') return null;
      return Math.round(b.getBoundingClientRect().height);
    })(),
    nextData: nx ? nx.getAttribute('data-next-turn') : null,
    gauges: g.length,
    tempFill: (document.querySelector('.gauge[data-gauge="temp"]') || {}).getAttribute
      ? document.querySelector('.gauge[data-gauge="temp"]').getAttribute('data-fill') : null,
    renewFill: document.querySelector('.gauge[data-gauge="renew"]') ? document.querySelector('.gauge[data-gauge="renew"]').getAttribute('data-fill') : null,
    labelFont: (() => {
      const el = document.querySelector('.challenger-state-grid .state-chip-label');
      return el ? parseFloat(getComputedStyle(el).fontSize) : null;
    })(),
    optionHeight: opts.length ? Math.round(opts[0].getBoundingClientRect().height) : null
  };
});

// Loop 6: feedback layering. `visible` counts only what is on screen before any
// click; `same` proves that expanding the <details> restores the engine's text
// character for character (V17). Measuring the DOM, not the intent.
const fbSnap = (page) => page.evaluate(() => {
  const disp = document.getElementById('challenger-feedback-display');
  const body = disp && disp.querySelector('.fb-body');
  const r = window.challengerRouter;
  if (!body) return null;
  const det = [...body.querySelectorAll('details.fb-more')];
  const clean = (el) => el.textContent.replace(/\s+/g, '');
  const visClone = body.cloneNode(true);
  visClone.querySelectorAll('details').forEach((d) => d.remove());
  const allClone = body.cloneNode(true);
  allClone.querySelectorAll('summary').forEach((s) => s.remove());
  const all = clean(allClone);
  // markdown markers are syntax, not content: the renderer turns ### into <h4>
  // and --- into <hr>, so they are stripped from the source before comparing.
  const src = r
    ? r._normalizeNumbers(String(r.lastFeedback || ''))
      .replace(/^#{1,4}\s+/gm, '')
      .replace(/^[=\-]{5,}$/gm, '')
      .replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, '')
    : '';
  let diffAt = -1;
  if (all !== src) {
    for (let i = 0; i < Math.max(all.length, src.length); i++) {
      if (all[i] !== src[i]) { diffAt = i; break; }
    }
  }
  const echo = disp.querySelector('.feedback-echo');
  return {
    visible: clean(visClone),
    same: all === src,
    diffAt,
    shownTail: all.slice(Math.max(0, diffAt - 18), diffAt + 18),
    srcTail: src.slice(Math.max(0, diffAt - 18), diffAt + 18),
    allLen: all.length,
    srcLen: src.length,
    details: det.length,
    open: det.filter((d) => d.open).length,
    summaries: det.map((d) => (d.querySelector('summary') || {}).textContent || ''),
    echo: echo ? echo.innerText.replace(/\s+/g, '') : '',
    reveal: /【模式揭示/.test(String((r && r.lastFeedback) || '')),
  };
});

async function enterClimate(page) {
  // V16 must observe a first-time visitor, so the preference is cleared before
  // the very first load (it is only written once a player expands something).
  await page.addInitScript(() => {
    try { localStorage.removeItem('fl_fb_details_open'); } catch (e) { /* ignore */ }
  });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.click('#start-journey');
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('.scenario-card')].find((n) => /气候/.test(n.innerText));
    card.querySelector('.btn-primary,button').click();
  });
  await page.waitForTimeout(2600);
}

// ===== Desktop pass: V1–V7, V9 =====
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 160)));
await enterClimate(page);

const turns = [];
const hashes = [];
const btnLog = [];
for (let t = 1; t <= 10; t++) {
  const before = await snap(page);
  turns.push(before);
  hashes.push(hash(before.firstText));
  if (before.headerTurn && String(before.headerTurn) !== String(before.step)) {
    fails.push(`V1/T${t} header=${before.headerTurn} step=${before.step} 不一致`);
  }
  if (before.last !== before.step - 1) {
    fails.push(`V1/T${t} lastTurnNumber=${before.last} 与 step=${before.step} 不匹配`);
  }
  if (before.gauges !== 2) fails.push(`V9/T${t} gauges=${before.gauges}`);
  if (before.labelFont != null && before.labelFont < 12) fails.push(`V8/T${t} 标签字号=${before.labelFont}px < 12`);

  // submit（L1-2 起：「选中」只挂起，还要一步显式确认）
  await page.evaluate(() => document.querySelector('.challenger-option').click());
  await page.evaluate(() => window.challengerRouter && window.challengerRouter.confirmChoice());
  await page.waitForTimeout(1100);
  const after = await snap(page);
  btnLog.push({ t, next: after.nextH, submit: before.submitH });
  const fbs = await fbSnap(page);
  if (fbs) {
    fbLog.push({ t, visible: fbs.visible.length, details: fbs.details, src: fbs.srcLen, reveal: fbs.reveal });
    const cap = fbs.reveal ? 980 : 420;
    if (fbs.visible.length > cap) {
      fails.push(`V14/T${t} 常显 ${fbs.visible.length} 字 > ${cap}${fbs.reveal ? '(揭示回合)' : ''}`);
    }
    if (fbs.details < 1) fails.push(`V18/T${t} 无折叠块`);
    if (fbs.summaries.some((s) => !/约\s*\d+\s*字/.test(s))) {
      fails.push(`V18/T${t} summary 缺字数 ${JSON.stringify(fbs.summaries)}`);
    }
    if (!fbs.same) {
      fails.push(`V17/T${t} 展开后不一致 ${fbs.allLen}/${fbs.srcLen} @${fbs.diffAt}「${fbs.shownTail}」vs「${fbs.srcTail}」`);
    }
    if (/你的选择|实际发生/.test(fbs.echo)) fails.push(`V19/T${t} echo 仍有重复行`);
    if (t === 1 && fbs.open !== 0) fails.push(`V16 首次进入 details 已展开 ${fbs.open}`);
    if (t === 2 && !globalThis.__v20) {
      globalThis.__v20 = true;
      if (fbs.open < 1) fails.push('V20 展开偏好未被记忆');
      else notes.push('V20 展开偏好已记忆（T1 展开 → T2 默认展开）');
      await page.evaluate(() => {
        localStorage.setItem('fl_fb_details_open', '0');
        [...document.querySelectorAll('.fb-body details.fb-more')].forEach((d) => { d.open = false; });
      });
    }
    if (t === 1 && fbs.details > 0) {
      await page.evaluate(() => {
        const d = document.querySelector('.fb-body details.fb-more');
        if (d) d.open = true;
      });
      await page.waitForTimeout(200);
    }
  }

  // V3/V4: a spent turn must reject input
  if (after.last >= 10) {
    const finalText = await page.evaluate(() => document.getElementById('game-container').innerText);
    turns.push({ final: true });
    notes.push('T10 直接进入终局，跳过 V3/V5 检查');
    globalThis.__finalText = finalText;
    break;
  }
  if (after.disabledCount !== after.optionCount) {
    fails.push(`V4/T${t} disabled ${after.disabledCount}/${after.optionCount}`);
  }
  if (!after.locked) fails.push(`V3/T${t} locked 未置位`);

  const lastBefore = after.last;
  await page.evaluate(() => {
    const opts = [...document.querySelectorAll('.challenger-option')];
    opts[1] && opts[1].click();
    if (window.challengerRouter) window.challengerRouter.selectOption('B'); // bypass the disabled attribute
  });
  await page.waitForTimeout(700);
  const afterStray = await snap(page);
  if (afterStray.last !== lastBefore) {
    fails.push(`V3/T${t} 误点后 lastTurnNumber ${lastBefore}→${afterStray.last}`);
  }

  // V5: feedback above the options
  if (after.fbTop != null && after.firstOptTop != null && after.fbTop > after.firstOptTop) {
    fails.push(`V5/T${t} 反馈 top=${Math.round(after.fbTop)} 低于选项 top=${Math.round(after.firstOptTop)}`);
  }
  // V6: button names its destination
  const expectNext = String(after.last + 1);
  if (after.nextData !== expectNext) fails.push(`V6/T${t} data-next-turn=${after.nextData} 期望 ${expectNext}`);
  if (after.nextLabel && after.nextLabel.indexOf(`第 ${expectNext} 回合`) < 0) {
    fails.push(`V6/T${t} 按钮文案="${after.nextLabel}"`);
  }
  // V24: the button you must hit to continue is a touch target too
  if (after.nextH != null && after.nextH < 44) fails.push(`V24/T${t} 下一回合按钮高=${after.nextH}px < 44`);
  if (before.submitH != null && before.submitH < 44) fails.push(`V24/T${t} 提交按钮高=${before.submitH}px < 44`);
  // V7 (desktop part): 44px touch target
  if (before.optionHeight != null && before.optionHeight < 44) {
    fails.push(`V7/T${t} 选项高度=${before.optionHeight}px < 44`);
  }

  await page.evaluate(() => document.getElementById('challenger-next-turn').click());
  await page.waitForTimeout(1200);
}

// V2: option set must change between turns (guards against a frozen render)
const dup = hashes.filter((h, i) => i > 0 && h === hashes[i - 1]).length;
if (dup > 1) fails.push(`V2 连续相同首选项 ${dup} 次`);

// V10: the ending headline must not claim a temperature the run never reached
const finalText = globalThis.__finalText || (await page.evaluate(() => document.getElementById('game-container').innerText));
const tempMatch = finalText.match(/([0-9]\.[0-9]{2})\s*°C/);
const finalTemp = tempMatch ? parseFloat(tempMatch[1]) : null;
if (finalTemp != null && finalTemp < 2.30 && /突破\s*3\s*°C|升温突破3/.test(finalText)) {
  fails.push(`V10 终局 ${finalTemp}°C 却出现「突破3°C」叙事`);
}

// ===== Mobile pass: V7 =====
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
mobile.on('pageerror', (e) => pageErrors.push('[mobile] ' + String(e).slice(0, 160)));
await enterClimate(mobile);
const mob = await snap(mobile);
if (mob.firstOptTop != null && mob.firstOptTop > 844) {
  fails.push(`V7/mobile 首选项 top=${Math.round(mob.firstOptTop)} 超出首屏`);
}
if (mob.optionHeight != null && mob.optionHeight < 48) {
  fails.push(`V7/mobile 选项高度=${mob.optionHeight}px < 48`);
}
if (mob.gauges !== 2) fails.push(`V9/mobile gauges=${mob.gauges}`);

// V25: scenario-list 开始挑战 on mobile must also clear 44px
const cards = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await cards.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await cards.waitForTimeout(1100);
await cards.click('#start-journey');
await cards.waitForTimeout(900);
const cardH = await cards.evaluate(() => [...document.querySelectorAll('.scenario-card')]
  .map((c) => Math.round(c.querySelector('button').getBoundingClientRect().height)));
if (cardH.some((h) => h < 44)) fails.push(`V25/mobile 场景卡按钮高=${cardH.join(',')} < 44`);
console.log('CARDH ' + JSON.stringify(cardH));
await cards.close();

if (pageErrors.length) fails.push(`pageerror: ${pageErrors.slice(0, 3).join(' | ')}`);

console.log('TURNS ' + JSON.stringify(turns.map((t) => t.final ? t : {
  hd: t.headerTurn, step: t.step, last: t.last, h: hash(t.firstText), gauges: t.gauges,
  temp: t.tempFill, renew: t.renewFill, optH: t.optionHeight, label: t.labelFont
}), null, 1));
console.log('BTN ' + JSON.stringify(btnLog));
console.log('FB ' + JSON.stringify(fbLog));
console.log('MOBILE ' + JSON.stringify({ top: Math.round(mob.firstOptTop), h: mob.optionHeight, gauges: mob.gauges }));
console.log('FINAL_TEMP ' + finalTemp);
console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'PASS all render assertions');

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

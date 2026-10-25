/**
 * V1 · "看得见变化" acceptance assertions
 *
 * The rules this file refuses to break:
 *   1. never locate a control by its text — id / class / data-* only.
 *   2. every number the UI shows is re-derived here from OfflineEngine's own
 *      tables (metrics + thresholds). If the UI ever grows a second copy of a
 *      threshold, this run goes red instead of quietly drifting.
 *   3. the chip's innerText must stay exactly "label + value". Delta badges and
 *      the breach dot are pseudo-elements; anything that leaks into innerText
 *      breaks the copy fingerprint the earlier loops rely on.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8533;
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1600));

const fails = [];
const notes = [];
const browser = await chromium.launch();

const chipSnap = (page) => page.evaluate(() => {
  const r = window.challengerRouter;
  const clean = (s) => String(s || '').replace(/\s+/g, '');
  const chips = [...document.querySelectorAll('.challenger-state-grid .state-chip')];
  const eng = window.OfflineEngine || {};
  return {
    turn: r.lastTurnNumber,
    scenarioId: r.scenarioId,
    seriesLen: (r.stateSeries || []).length,
    seriesValues: (r.stateSeries || []).map((x) => x.values || {}),
    state: r.gameState || {},
    thresholds: (eng._flScenarioThresholds || {})[r.scenarioId] || [],
    metrics: (eng._flScenarioMetrics || {})[r.scenarioId] || {},
    chips: chips.map((c) => {
      const bar = c.querySelector('.chip-bar');
      const poly = c.querySelector('.chip-spark polyline');
      const fill = bar ? bar.querySelector('b') : null;
      return {
        id: c.id,
        metric: c.getAttribute('data-metric'),
        delta: c.getAttribute('data-delta'),
        tone: c.getAttribute('data-tone'),
        trend: c.getAttribute('data-trend'),
        breach: c.classList.contains('is-breach'),
        text: clean(c.innerText),
        label: clean((c.querySelector('.state-chip-label') || {}).textContent),
        value: clean((c.querySelector('.state-chip-value') || {}).textContent),
        points: poly ? poly.getAttribute('points').trim().split(/\s+/).filter(Boolean).length : 0,
        barW: bar ? Math.round(bar.getBoundingClientRect().width) : 0,
        barFill: fill ? fill.style.width : null,
        zoneStart: bar ? bar.style.getPropertyValue('--zone-start').trim() : ''
      };
    }),
    deltaCards: [...document.querySelectorAll('.delta-card')].map((n) => ({
      tone: n.getAttribute('data-tone'),
      name: clean((n.querySelector('.delta-name') || {}).textContent),
      num: clean((n.querySelector('.delta-num') || {}).textContent),
      verdict: clean((n.querySelector('.delta-verdict') || {}).textContent)
    })),
    engineDeltaLines: (r._extractDeltaSection(r.lastFeedback || '').deltas || [])
  };
});

async function enterClimate(page) {
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

// ===== Pass 1: desktop, 4 turns, chip / delta / sparkline correctness =====
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 160)));
await enterClimate(page);

// Z9: the keyboard hint must actually reach desktop users on the *answer*
// screen, and must not eat mobile screen space (there the keys don't exist).
const deskHint = await page.evaluate(() => {
  const el = document.querySelector('.challenger-keyhint');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { shown: r.height > 0 && r.width > 0, text: el.innerText.trim() };
});
if (!deskHint) fails.push('Z9 桌面作答页缺键盘提示条');
else if (!deskHint.shown) fails.push('Z9 桌面键盘提示条不可见');
else if (!/A.?D/.test(deskHint.text)) fails.push(`Z9 键盘提示未说明 A–D：${deskHint.text}`);
else notes.push(`Z9 键盘提示：${deskHint.text}`);

const checkChips = (s, tag, opts = {}) => {
  if (s.chips.length < 2) fails.push(`${tag} 状态 chip 只有 ${s.chips.length} 个`);
  const prevSnap = s.seriesValues.length >= 2 ? s.seriesValues[s.seriesValues.length - 2] : {};
  s.chips.forEach((c) => {
    const cur = s.state[c.metric];
    const numeric = typeof cur === 'number';
    // A metric that simply didn't move gets no delta badge — that is correct
    // behaviour, not a missing render. Only genuinely changed numbers must show one.
    const prev = prevSnap[c.metric];
    const unchanged = numeric && typeof prev === 'number' && Math.abs(cur - prev) < 1e-9;

    if (!numeric && c.delta) fails.push(`${tag} chip#${c.id} 非数值指标却带 data-delta「${c.delta}」`);
    if (opts.requireDelta && numeric && !unchanged && !c.delta) {
      fails.push(`${tag} chip#${c.id} 数值已变化（${prev}→${cur}）却无 data-delta`);
    }
    if (unchanged && c.delta) fails.push(`${tag} chip#${c.id} 数值未变（${cur}）却显示 delta「${c.delta}」`);
    // Z3: the copy fingerprint — "label + value", nothing else
    if (c.text !== c.label + c.value) {
      fails.push(`${tag} chip#${c.id} innerText 被污染「${c.text}」≠「${c.label + c.value}」`);
    }
    if (c.delta && c.text.indexOf(c.delta) >= 0) {
      fails.push(`${tag} chip#${c.id} delta「${c.delta}」混进了 innerText`);
    }
    if (opts.spark) {
      if (c.points !== s.seriesLen) {
        fails.push(`${tag} chip#${c.id} sparkline ${c.points} 点 ≠ 序列 ${s.seriesLen} 点`);
      }
      if (c.barW < 20) fails.push(`${tag} chip#${c.id} 阈值条宽度 ${c.barW}px 过窄（可能未渲染）`);
      if (!c.barFill) fails.push(`${tag} chip#${c.id} 阈值条无填充`);
      const hasTh = s.thresholds.some((t) => t.key === c.metric);
      if (hasTh && c.zoneStart === '') fails.push(`${tag} chip#${c.id} 有阈值却缺红区刻度`);
    }
  });
  // Z4: breach flag vs an independent ladder check (a key can own several lines)
  [...new Set(s.thresholds.map((t) => t.key))].forEach((key) => {
    const v = s.state[key];
    if (typeof v !== 'number') return;
    const expect = s.thresholds
      .filter((t) => t.key === key)
      .some((t) => (t.dir === 'above' ? v > t.at : v < t.at));
    const chip = s.chips.find((c) => c.metric === key);
    if (!chip) return;
    if (expect !== chip.breach) {
      fails.push(`${tag} ${key}=${v} 阶梯阈值期望 breach=${expect}，实际 ${chip.breach}`);
    }
  });
};

const checkDeltaCards = (s, tag) => {
  if (s.engineDeltaLines.length > 0 && s.deltaCards.length === 0) {
    fails.push(`${tag} 引擎有 ${s.engineDeltaLines.length} 行数字变化，UI 一张卡都没有`);
  }
  s.deltaCards.forEach((c) => {
    // The card prints "+7%" (delta + unit); the engine line prints "(+7，改善)".
    // Compare the name and the bare number, not the decorated strings.
    const bare = c.num.replace(/[^\d.]/g, '');
    const nameKey = c.name.replace(/\s+/g, '');
    const hit = s.engineDeltaLines.find((l) => {
      const flat = l.replace(/\s+/g, '');
      return flat.indexOf(nameKey) >= 0 && (bare === '' || l.indexOf(bare) >= 0);
    });
    if (!hit) fails.push(`${tag} 变化卡「${c.name} ${c.num}」在引擎原文中找不到对应行`);
    const wantTone = /恶化/.test(c.verdict) ? 'bad' : 'good';
    if (c.tone !== wantTone) fails.push(`${tag} 变化卡「${c.name}」verdict=${c.verdict} 但 tone=${c.tone}`);
  });
};

for (let t = 0; t <= 4; t++) {
  const s = await chipSnap(page);
  if (s.seriesLen !== Math.min(t + 1, 11)) {
    fails.push(`Z2/T${t} stateSeries=${s.seriesLen}，期望 ${Math.min(t + 1, 11)}`);
  }
  checkChips(s, `Z/T${t}`, { requireDelta: t >= 1, spark: t >= 1 });

  if (t < 4) {
    await page.evaluate(() => document.querySelector('.challenger-option').click());
    await page.evaluate(() => window.challengerRouter && window.challengerRouter.confirmChoice());
    await page.waitForTimeout(1000);

    // Snapshot while the feedback panel is still on screen: the delta cards
    // only exist there, and the chips must already show this turn's numbers.
    const after = await chipSnap(page);
    if (after.seriesLen !== s.seriesLen + 1) {
      fails.push(`Z2/T${t + 1} 提交后序列 ${after.seriesLen} ≠ ${s.seriesLen}+1（chip 未刷新？）`);
    }
    if (after.chips.filter((c) => c.delta).length === 0) {
      fails.push(`Z1/T${t + 1} 提交后没有任何 chip 带 delta`);
    }
    checkChips(after, `Z-after/T${t + 1}`, { requireDelta: false, spark: true });
    checkDeltaCards(after, `Z5/T${t + 1}`);
    if (t === 3) {
      notes.push(`T4 反馈态：cards=${after.deltaCards.length} 引擎行=${after.engineDeltaLines.length} series=${after.seriesLen}`);
    }

    // 每回合提交后要显式点"继续"，否则下一轮点击落在锁定页上，回合根本不动
    await page.evaluate(() => {
      const nx = document.getElementById('challenger-next-turn');
      if (nx && nx.offsetParent !== null && getComputedStyle(nx).display !== 'none') nx.click();
    });
    await page.waitForTimeout(1200);
  }
}

// ===== Pass 2: keyboard =====
const kb = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const kbErrors = [];
kb.on('pageerror', (e) => kbErrors.push(String(e).slice(0, 160)));
await enterClimate(kb);

await kb.evaluate(() => document.body.focus());
await kb.keyboard.press('b');
// L1-2 之后键盘也走同一条闸门：B 只选中，Enter 才提交（与 Z9 提示文案一致）。
await kb.keyboard.press('Enter');
await kb.waitForTimeout(1200);
const kbAfter = await kb.evaluate(() => ({
  turn: window.challengerRouter.lastTurnNumber,
  locked: window.challengerRouter.locked
}));
if (kbAfter.turn !== 1) fails.push(`Z6 键盘 B 未推进回合（lastTurnNumber=${kbAfter.turn}）`);

await kb.keyboard.press('ArrowLeft');
await kb.waitForTimeout(500);
const hist = await kb.evaluate(() => {
  const panel = document.getElementById('challenger-history');
  const rows = document.querySelectorAll('.turn-history-item');
  const hist = (window.challengerRouter.gameState || {}).decision_history || [];
  return { open: !!panel, rows: rows.length, hist: hist.length, active: document.querySelectorAll('.turn-history-item.is-active').length };
});
if (!hist.open) fails.push('Z7 按 ← 未打开历史抽屉');
else {
  if (hist.rows !== hist.hist) fails.push(`Z7 历史抽屉 ${hist.rows} 条 ≠ decision_history ${hist.hist} 条`);
  if (hist.active !== 1) fails.push(`Z7 历史抽屉高亮项 ${hist.active} 个（应恰好 1）`);
  notes.push(`Z7 历史抽屉 ${hist.rows}/${hist.hist} 条，高亮正常`);
}
await kb.keyboard.press('Escape');
await kb.waitForTimeout(300);
const closed = await kb.evaluate(() => !document.getElementById('challenger-history'));
if (!closed) fails.push('Z7 按 Esc 未关闭历史抽屉');

// ===== Pass 3: mobile =====
const mob = await browser.newPage({ viewport: { width: 375, height: 780 }, isMobile: true, hasTouch: true });
const mobErrors = [];
mob.on('pageerror', (e) => mobErrors.push(String(e).slice(0, 160)));
await enterClimate(mob);
for (let i = 0; i < 2; i++) {
  await mob.evaluate(() => document.querySelector('.challenger-option').click());
  await mob.evaluate(() => window.challengerRouter && window.challengerRouter.confirmChoice());
  await mob.waitForTimeout(1100);
}
const mobSnap = await mob.evaluate(() => {
  const doc = document.documentElement;
  const grid = document.querySelector('.challenger-state-grid');
  const chips = [...document.querySelectorAll('.challenger-state-grid .state-chip')];
  const cards = [...document.querySelectorAll('.delta-card')];
  return {
    overflowX: doc.scrollWidth - doc.clientWidth,
    gridOverflow: grid ? grid.scrollWidth - grid.clientWidth : 0,
    chipW: chips.map((c) => Math.round(c.getBoundingClientRect().width)),
    chipOut: chips.filter((c) => c.getBoundingClientRect().right > window.innerWidth + 1).length,
    cardCols: cards.length ? new Set(cards.map((c) => Math.round(c.getBoundingClientRect().left))).size : 0,
    hintShown: (() => {
      const el = document.querySelector('.challenger-keyhint');
      if (!el) return false;
      return el.getBoundingClientRect().height > 0;
    })(),
    // Z10: on a breached chip the red zone must start at or before the fill —
    // a bar that reads "completely safe" while already over the line is a lie.
    breach: chips.filter((c) => c.classList.contains('is-breach')).map((c) => {
      const bar = c.querySelector('.chip-bar');
      const fill = bar ? bar.querySelector('b') : null;
      const cs = bar ? getComputedStyle(bar) : null;
      const bw = bar ? bar.getBoundingClientRect().width : 0;
      return {
        zoneStart: cs ? parseFloat(cs.getPropertyValue('--zone-start')) || 0 : 0,
        fillPct: bw && fill ? (fill.getBoundingClientRect().width / bw) * 100 : 0
      };
    })
  };
});
if (mobSnap.overflowX > 2) fails.push(`Z8 移动端横向溢出 ${mobSnap.overflowX}px`);
if (mobSnap.gridOverflow > 2) fails.push(`Z8 移动端状态网格横向溢出 ${mobSnap.gridOverflow}px`);
if (mobSnap.chipOut > 0) fails.push(`Z8 移动端 ${mobSnap.chipOut} 个 chip 超出视口`);
notes.push(`Z8 移动端溢出 ${mobSnap.overflowX}px，chip 宽 ${JSON.stringify(mobSnap.chipW)}，卡片列数 ${mobSnap.cardCols}`);
if (mobSnap.hintShown) fails.push('Z8 移动端仍显示键盘提示条（应隐藏）');
if (mobSnap.breach.length) {
  const bad = mobSnap.breach.filter((b) => b.zoneStart > b.fillPct + 1);
  if (bad.length) {
    fails.push(`Z10 ${bad.length} 个越线 chip 的红区起点(${bad.map((b) => b.zoneStart.toFixed(1)).join('/')}%) 落在填充(${bad.map((b) => b.fillPct.toFixed(1)).join('/')}%) 右侧`);
  } else {
    notes.push(`Z10 越线 chip ${mobSnap.breach.length} 个，红区起点均未晚于填充`);
  }
} else {
  notes.push('Z10 本局 2 回合内无越线 chip，跳过红区同源检查');
}

// ===== Errors =====
[...pageErrors, ...kbErrors, ...mobErrors].forEach((e) => fails.push(`页内异常：${e}`));

await browser.close();
srv.kill();

notes.forEach((n) => console.log('  · ' + n));
if (fails.length) {
  console.log(`\nFAIL (${fails.length})`);
  [...new Set(fails)].forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log(`\nPASS viz-assert (V1)`);
process.exit(0);

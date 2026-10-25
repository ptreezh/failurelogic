#!/usr/bin/env node
/**
 * probe-choice-gate.mjs — L1-2「选中 ≠ 落地」的行为探针。
 *
 * A4.7 只能静态证明"源码里出现过 promptChoice/撤回字样"，抓不到真实交互：
 * 一个把 confirmChoice 写成空函数的实现也能骗过正则。这里进真浏览器按一次，
 * 量四件事：
 *   1. 点一下：确认条在、回合没推进、历史没多一条；
 *   2. 撤回：确认条收起、选中态清空、回合仍没推进（"真的没发生过"）；
 *   3. 再点 + 确认：回合推进 1、确认条收起；
 *   4. 徽标：每个选项都有中文 stance 徽标，且 order=99 排在行尾不挤压正文。
 *
 * 另外守一条容易失守的：确认条在下一回合不能残留。
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8497;

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1500));

const browser = await chromium.launch();
const fails = [];
const notes = [];

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 160)));

await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.click('#start-journey');
await page.waitForTimeout(900);
await page.evaluate(() => {
  const card = [...document.querySelectorAll('.scenario-card')].find((n) => /气候/.test(n.innerText));
  card.querySelector('.btn-primary,button').click();
});
await page.waitForTimeout(2600);

const barState = () =>
  page.evaluate(() => {
    const bar = document.querySelector('.challenger-confirm-bar');
    const r = bar ? bar.getBoundingClientRect() : null;
    return {
      exists: !!bar,
      hidden: bar ? bar.hasAttribute('hidden') || (r && r.height < 2) : true,
      text: bar ? (bar.textContent || '').replace(/\s+/g, ' ').trim() : '',
      opts: document.querySelectorAll('.challenger-option').length,
      selected: document.querySelectorAll('.challenger-option.selected').length,
      turn: window.challengerRouter.lastTurnNumber,
      hist: ((window.challengerRouter.gameState || {}).decision_history || []).length,
      locked: !!window.challengerRouter.locked,
    };
  });

// ── 0. 初始：确认条不该先亮着 ─────────────────────────────────────────────
const s0 = await barState();
if (!s0.hidden) fails.push('开局确认条就是可见的');
if (s0.opts < 2) fails.push(`选项数异常（${s0.opts}）`);

// ── 1. 点一下：只挂起 ────────────────────────────────────────────────────
await page.evaluate(() => document.querySelector('.challenger-option').click());
await page.waitForTimeout(400);
const s1 = await barState();
if (s1.hidden) fails.push('点选后没有出现确认条 —— 仍是单选即提交');
if (s1.turn !== 0) fails.push(`点选就推进了回合（turn=${s1.turn}）`);
if (s1.hist !== 0) fails.push(`点选就写进了 decision_history（${s1.hist} 条）`);
if (s1.selected !== 1) fails.push(`选中态 ${s1.selected} 个（应恰好 1）`);
if (!/确认|提交/.test(s1.text)) fails.push(`确认条文案不含「确认/提交」：${s1.text.slice(0, 40)}`);
notes.push(`挂起态：${s1.text.slice(0, 46)}`);

// ── 2. 撤回：真的没发生过 ────────────────────────────────────────────────
const didRevert = await page.evaluate(() => {
  const r = window.challengerRouter;
  if (typeof r.revertChoice === 'function') { r.revertChoice(); return 'method'; }
  const btn = document.querySelector('.challenger-confirm-bar .cfb-revert');
  if (btn) { btn.click(); return 'button'; }
  return '';
});
await page.waitForTimeout(350);
const s2 = await barState();
if (!didRevert) fails.push('没有可调用的撤回入口（revertChoice / .cfb-revert）');
if (!s2.hidden) fails.push('撤回后确认条没收起');
if (s2.selected !== 0) fails.push(`撤回后仍有 ${s2.selected} 个选项保持选中`);
if (s2.turn !== 0 || s2.hist !== 0) fails.push(`撤回后状态脏了（turn=${s2.turn}, hist=${s2.hist}）`);
notes.push('撤回：确认条收起、选中清空、回合未推进');

// ── 3. 再点 + 确认：这一次真的落地 ───────────────────────────────────────
await page.evaluate(() => document.querySelector('.challenger-option').click());
await page.waitForTimeout(300);
await page.evaluate(() => {
  const r = window.challengerRouter;
  if (typeof r.confirmChoice === 'function') return r.confirmChoice();
  const btn = document.querySelector('.challenger-confirm-bar .cfb-confirm');
  if (btn) btn.click();
});
await page.waitForTimeout(1500);
const s3 = await barState();
if (s3.turn !== 1) fails.push(`确认后回合没推进（turn=${s3.turn}）`);
if (s3.hist !== 1) fails.push(`确认后 decision_history ${s3.hist} 条（应 1）`);
if (!s3.hidden) fails.push('确认后确认条没收起');
notes.push(`确认：turn=${s3.turn}, hist=${s3.hist}`);

// ── 4. 下一回合：确认条不得残留 ──────────────────────────────────────────
const nx = await page.$('#challenger-next-turn');
if (nx) {
  await nx.click();
  await page.waitForTimeout(1200);
  const s4 = await barState();
  if (!s4.hidden) fails.push('进入下一回合后上一回合的确认条还挂着');
  if (s4.selected !== 0) fails.push(`下一回合开局就有 ${s4.selected} 个选项是选中态`);
  notes.push(`下一回合：opts=${s4.opts}, 确认条干净`);
} else {
  notes.push('第 1 回合后无 next-turn 按钮，跳过残留检查');
}

// ── 5. L1-1 徽标：每个选项都有中文姿态，排在本行末尾 ─────────────────────
const badge = await page.evaluate(() => {
  const opts = [...document.querySelectorAll('.challenger-option')];
  const rows = opts.map((el) => {
    const cs = getComputedStyle(el, '::before');
    const raw = cs.content || '';
    const text = raw.replace(/^["']|["']$/g, '').trim();
    const r = el.getBoundingClientRect();
    const label = el.querySelector('.option-label') || el.lastElementChild;
    const lr = label ? label.getBoundingClientRect() : null;
    return {
      weight: el.getAttribute('data-weight'),
      label: el.getAttribute('data-weight-label'),
      before: text,
      order: cs.order,
      english: /[a-z]{6,}/.test(text),
      empty: !text || text === 'none' || text === 'normal',
      // 徽标（伪元素在最右）不该压到正文：正文右边界应早于按钮右内边界太多不会发生，
      // 这里只量"正文没有被挤出按钮"
      textOut: lr ? Math.round(lr.right - r.right) : 0,
    };
  });
  return { rows };
});
const badBadge = badge.rows.filter((r) => r.empty || r.english);
if (badBadge.length) {
  fails.push(
    '徽标异常：' + badBadge.map((r) => `${r.weight}=「${r.before}」`).join('、')
  );
}
const notTail = badge.rows.filter((r) => String(r.order) !== '99');
if (notTail.length) fails.push(`徽标未排在行尾（order=${notTail.map((r) => r.order).join('/')}）`);
const pushed = badge.rows.filter((r) => r.textOut > 0);
if (pushed.length) fails.push(`正文被挤出了按钮边界：${pushed.length} 个选项`);
notes.push(`徽标：${badge.rows.map((r) => r.before).join(' / ')}`);

// ── 6. 键盘同源：B 只选中、Enter 才落地 ──────────────────────────────────
await page.evaluate(() => document.body.focus());
await page.keyboard.press('b');
await page.waitForTimeout(300);
const k1 = await barState();
if (k1.hidden) fails.push('键盘 B 没有走同一道闸门（确认条未出现）');
if (k1.turn !== s3.turn) fails.push('键盘 B 直接提交了');
await page.keyboard.press('Enter');
await page.waitForTimeout(1400);
const k2 = await barState();
if (k2.turn <= s3.turn) fails.push('键盘 Enter 没有提交（或未走 confirmChoice）');
notes.push(`键盘：B 挂起 → Enter 提交（turn=${k2.turn}）`);

if (pageErrors.length) fails.push('页面报错：' + pageErrors.join(' | '));

console.log(notes.map((n) => '  · ' + n).join('\n'));
console.log(fails.length ? 'FAIL\n  - ' + fails.join('\n  - ') : 'PASS choice-gate (L1-2 / L1-1)');

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

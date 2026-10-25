#!/usr/bin/env node
/**
 * probe-goal-tension.mjs — L0-2「目标冲突仪表」的行为探针（S0 = noodle）。
 *
 * 为什么必须有这一条：A4.12 只能证明"每个 concerns 短语都指得回某个目标"，
 * 那是数据层。仪表真正的价值在于玩家看得见"我这一手付了什么代价"，
 * 而数据齐、渲染丢，A4.12 照样绿。所以这里进真浏览器，量六件事：
 *
 *   1. 开局：仪表在、三格齐全、状态全为「未涉及」、明说还没做选择；
 *   2. 位置：仪表挂在指标芯片上方（DOM 顺序），不是埋在下半屏；
 *   3. 挂起态：只选中不确认 → 仪表一动不动（不做事前预警，见下方红线段）；
 *   4. 确认后：牺牲格 / 押注格 / 未涉及格 与所选选项的标注逐一对上；
 *   5. 换一回合：仪表跟着上一手刷新，不留上一回合的牺牲项；
 *   6. S1 场景真出三格且与自身 brief 对齐；brief 缺失时不出现空壳三格；手机上不横向溢出。
 *
 * 设计红线（量在 3 号检查里）：仪表只读已提交的 decision_history。
 * 若哪天有人改成"选中就预告代价"，玩家会在点下去之前就知道自己在牺牲什么，
 * F5（单目标优化）这道题就被提前演示了答案 —— 那正是本方案要玩家犯的错。
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8498;
const SID = 'noodle-shop-community';

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
const entered = await page.evaluate(() => {
  const card = [...document.querySelectorAll('.scenario-card')].find((n) => /老周|牛肉面/.test(n.innerText));
  if (!card) return false;
  card.querySelector('.btn-primary,button').click();
  return true;
});
if (!entered) fails.push('没在场景列表里找到 noodle 场景卡');
await page.waitForTimeout(2600);

/** 读仪表快照：顺序、位置、每格状态、以及指标芯片的相对位置。 */
const snap = () =>
  page.evaluate(() => {
    const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const box = document.getElementById('challenger-goal-tension');
    const chips = document.querySelector('.state-chips');
    const cells = [...document.querySelectorAll('#challenger-goal-tension .fgt-cell')].map((n) => ({
      id: n.getAttribute('data-objective'),
      name: clean((n.querySelector('.fgt-name') || {}).textContent),
      state: clean((n.querySelector('.fgt-state') || {}).textContent),
      cls: [...n.classList].filter((c) => c.indexOf('is-') === 0).join(','),
    }));
    return {
      exists: !!box,
      lead: clean(((box || {}).querySelector ? box.querySelector('.fgt-lead').textContent : '')),
      cells,
      count: cells.length,
      // DOM 顺序：仪表是否在指标芯片之前
      beforeChips: !!(box && chips && (box.compareDocumentPosition(chips) & Node.DOCUMENT_POSITION_FOLLOWING)),
      overflowX: box ? Math.round(box.scrollWidth - box.clientWidth) : 0,
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      turn: window.challengerRouter.lastTurnNumber,
      hist: ((window.challengerRouter.gameState || {}).decision_history || []).length,
    };
  });

/** 取当前回合某个 option 在数据里的标注（按选项文本匹配，避开 A–D 重排）。 */
const optMeta = (idx) =>
  page.evaluate((i) => {
    const r = window.challengerRouter;
    const data = (window.OfflineEngine._flScenarioData || {})[r.scenarioId] || {};
    const step = (data.steps || [])[r.lastTurnNumber];
    const btn = document.querySelectorAll('.challenger-option')[i];
    if (!step || !btn) return null;
    const txt = (btn.textContent || '').replace(/\s+/g, ' ').trim();
    const hit = (step.options || []).find((o) => txt.indexOf(String(o.text || '').slice(0, 12)) >= 0);
    return hit ? { id: hit.id, axis: hit.goal_axis || [], sac: hit.goal_sacrificed || [], text: hit.text } : null;
  }, idx);

const objIds = await page.evaluate(
  (sid) => {
    const data = (window.OfflineEngine._flScenarioData || {})[sid] || {};
    return ((data.brief || {}).objectives || []).map((o) => o.id);
  },
  SID
);
if (objIds.length !== 3) fails.push(`noodle brief 目标数 ${objIds.length}（仪表是"一行三格"，应为 3）`);

// ── 1. 开局 ───────────────────────────────────────────────────────────────
const s0 = await snap();
if (!s0.exists) fails.push('开局没有目标冲突仪表（#challenger-goal-tension 缺失）');
if (s0.count !== 3) fails.push(`仪表格数 ${s0.count}（应 3）`);
const s0ids = s0.cells.map((c) => c.id);
if (s0ids.join(',') !== objIds.join(',')) {
  fails.push(`仪表目标顺序 ${s0ids.join('/')} 与 brief 声明 ${objIds.join('/')} 不一致`);
}
const s0bad = s0.cells.filter((c) => c.state !== '未涉及');
if (s0bad.length) fails.push(`开局就有格子被判成代价/押注：${s0bad.map((c) => c.name + '=' + c.state).join('、')}`);
if (!/还没做选择/.test(s0.lead)) fails.push(`开局引导语没说明还没决策：「${s0.lead}」`);
const noName = s0.cells.filter((c) => !c.name);
if (noName.length) fails.push(`${noName.length} 格没显示目标名`);
notes.push(`开局：${s0.cells.map((c) => c.name + '·' + c.state).join(' / ')}`);

// ── 2. 位置：必须在指标芯片上方 ───────────────────────────────────────────
if (!s0.beforeChips) fails.push('仪表没有排在指标芯片之前（玩家先看数字，看不到目标关系）');
const above = await page.evaluate(() => {
  const box = document.getElementById('challenger-goal-tension');
  const chips = document.querySelector('.state-chips');
  if (!box || !chips) return null;
  return {
    gtTop: Math.round(box.getBoundingClientRect().top),
    chipTop: Math.round(chips.getBoundingClientRect().top),
  };
});
if (above && !(above.gtTop <= above.chipTop)) {
  fails.push(`仪表纵坐标 ${above.gtTop} 低于指标芯片 ${above.chipTop}`);
}
if (s0.overflowX > 0) fails.push(`仪表自身横向溢出 ${s0.overflowX}px`);

// ── 3. 挂起态：只选中，不许预告代价 ───────────────────────────────────────
// 选一个 goal_sacrificed 非空的选项，这样"预告"如果真的存在，一定会露出来。
const sacIdx = await page.evaluate(() => {
  const r = window.challengerRouter;
  const data = (window.OfflineEngine._flScenarioData || {})[r.scenarioId] || {};
  const step = (data.steps || [])[r.lastTurnNumber] || {};
  const btns = [...document.querySelectorAll('.challenger-option')];
  for (let i = 0; i < btns.length; i++) {
    const txt = (btns[i].textContent || '').replace(/\s+/g, ' ').trim();
    const hit = (step.options || []).find((o) => txt.indexOf(String(o.text || '').slice(0, 12)) >= 0);
    if (hit && (hit.goal_sacrificed || []).length) return i;
  }
  return 0;
});
const meta = await optMeta(sacIdx);
if (!meta) fails.push('取不到所选选项的标注（数据侧 goal_axis/goal_sacrificed 缺失）');
await page.evaluate((i) => document.querySelectorAll('.challenger-option')[i].click(), sacIdx);
await page.waitForTimeout(400);
const sp = await snap();
if (sp.hist !== 0) fails.push('点选就写进了 history —— 仪表口径下的"已提交"被污染');
const leaked = sp.cells.filter((c) => c.state !== '未涉及');
if (leaked.length) {
  fails.push(
    '挂起态仪表提前预告了代价（' + leaked.map((c) => c.name + '=' + c.state).join('、') +
      '）—— 选择前公开代价等于替玩家做完了单目标优化这道题'
  );
}
notes.push('挂起态：仪表未变（不做事前预警）');

// ── 4. 确认后：逐格对标注 ─────────────────────────────────────────────────
await page.evaluate(() => {
  const r = window.challengerRouter;
  if (typeof r.confirmChoice === 'function') return r.confirmChoice();
  const b = document.querySelector('.challenger-confirm-bar .cfb-confirm');
  if (b) b.click();
});
await page.waitForTimeout(1600);
const s1 = await snap();
if (s1.hist !== 1) fails.push(`确认后 history ${s1.hist} 条（应 1）`);
const want = {};
objIds.forEach((id) => {
  want[id] = (meta.sac || []).indexOf(id) >= 0 ? '牺牲'
    : ((meta.axis || []).indexOf(id) >= 0 ? '押注' : '未涉及');
});
const mismatch = s1.cells.filter((c) => c.state !== want[c.id]).map((c) => `${c.name}: 显示${c.state} 应为${want[c.id]}`);
if (mismatch.length) fails.push('牺牲/押注格与所选选项标注不一致：' + mismatch.join('；'));
const wantCls = (id) => want[id] === '牺牲' ? 'is-sacrificed' : (want[id] === '押注' ? 'is-pushed' : 'is-untouched');
const clsBad = s1.cells.filter((c) => c.cls !== wantCls(c.id)).map((c) => `${c.name}: ${c.cls || '(无)'}`);
if (clsBad.length) fails.push('格子状态类名不对：' + clsBad.join('、'));
if (!/第\s*1\s*手/.test(s1.lead)) fails.push(`确认后引导语没指第几手：「${s1.lead}」`);
notes.push(`确认后：${s1.cells.map((c) => c.name + '·' + c.state).join(' / ')}`);

// ── 5. 下一回合：仪表跟着刷新，不留残影 ───────────────────────────────────
const nx = await page.$('#challenger-next-turn');
if (nx) {
  await nx.click();
  await page.waitForTimeout(1400);
  const s2 = await snap();
  if (s2.count !== 3) fails.push(`换回合后格数变成 ${s2.count}`);
  // 翻到 T2 时最近一次已提交决策仍是 T1，所以仪表应该继续显示 T1 的代价。
  // 清空才是 bug：代价不能翻页就消失。
  if (!/第\s*1\s*手/.test(s2.lead)) fails.push(`翻到下一回合后引导语应仍指向第 1 手：「${s2.lead}」`);
  const lost = s2.cells.filter((c) => c.state !== want[c.id]).map((c) => `${c.name}: ${c.state}`);
  if (lost.length) fails.push('翻页后上一手的代价被清掉了：' + lost.join('、'));
  if (s2.overflowX > 0) fails.push(`换回合后仪表溢出 ${s2.overflowX}px`);
  notes.push(`T2：${s2.cells.map((c) => c.name + '·' + c.state).join(' / ')}（lead=${s2.lead}）`);
} else {
  notes.push('无下一回合按钮，跳过刷新检查');
}

// ── 6. S1 场景仪表真出三格 + 无 brief 场景不出空壳 + 手机端不溢出 ────────
// 这里原本拿「气候场景没写 brief」当空壳样本用；S1 铺开后五场景都有 brief，
// 于是拆成两件事：气候必须真出三格（且 id 与它自己的 brief 对齐），
// 空壳红线改用合成数据直接量渲染函数 —— 不依赖哪个场景恰好缺数据。
const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
await mobile.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await mobile.waitForTimeout(1000);
await mobile.click('#start-journey');
await mobile.waitForTimeout(800);
const climate = await mobile.evaluate(() => {
  const card = [...document.querySelectorAll('.scenario-card')].find((n) => /气候/.test(n.innerText));
  if (!card) return null;
  card.querySelector('.btn-primary,button').click();
  return true;
});
if (!climate) {
  notes.push('未找到气候场景卡，跳过空壳检查');
} else {
  await mobile.waitForTimeout(2600);
  const c = await mobile.evaluate(() => {
    const box = document.querySelector('.fl-goal-tension');
    const want = (((window.OfflineEngine._flScenarioData['climate-change-policy'] || {}).brief || {}).objectives || [])
      .map((o) => o.id);
    return {
      box: !!box,
      ids: box ? [...box.querySelectorAll('.fgt-cell')].map((n) => n.dataset.objective) : [],
      states: box ? [...box.querySelectorAll('.fgt-cell .fgt-state')].map((n) => n.textContent.trim()) : [],
      want,
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  if (!c.box) fails.push('气候场景有 brief 却没出目标冲突仪表');
  else {
    if (c.ids.join(',') !== c.want.join(',')) {
      fails.push(`气候仪表目标 ${c.ids.join('/')} 与 brief 声明 ${c.want.join('/')} 不一致`);
    }
    if (c.states.some((t) => t !== '未涉及')) {
      fails.push(`气候开局仪表不是全「未涉及」：${c.states.join('/')}`);
    }
  }
  if (c.docOverflow !== 0) fails.push(`气候场景 375px 横向溢出 ${c.docOverflow}px`);
  notes.push(`S1 场景仪表：${c.ids.length} 格 · 开局状态 ${c.states.join('/')}`);
}
// 空壳红线：brief 缺失 / objectives 为空时渲染函数必须返回空串。
const shell = await mobile.evaluate(() => {
  const table = window.OfflineEngine._flScenarioData;
  const sid = '__probe-no-brief';
  table[sid] = {};
  const r = Object.create(window.ChallengerRouter.prototype);
  r.scenarioId = sid;
  r.gameState = { decision_history: [] };
  const a = r._renderGoalTension();
  table[sid] = { brief: { objectives: [] } };
  const b = r._renderGoalTension();
  table[sid] = { brief: { objectives: [{ id: '', text: '缺 id' }] } };
  const c = r._renderGoalTension();
  delete table[sid];
  return [a, b, c];
});
if (shell.some((x) => x !== '')) {
  fails.push('brief 缺失/objectives 为空时仪表仍渲染出空壳三格');
}
notes.push('无 brief 场景：仪表不出空壳');

// ── 7. 角色锚：brief.role · brief.horizon 必须落在局内回合标题下 ──────────
// 这两句原本只出现在场景卡上（玩家点进来就再也看不见"我是谁、跨多久"），
// 而悲剧前提恰恰长在这里：challenger 的"没有最终签字权"、enron 的"副手"。
// 断言三件事：出现、与 brief 逐字对齐、排在"第 N 手 · 代价"之上。
const ra = await page.evaluate((sid) => {
  const brief = (((window.OfflineEngine._flScenarioData || {})[sid] || {}).brief) || {};
  const el = document.querySelector('.fgt-role');
  const lead = document.querySelector('#challenger-goal-tension .fgt-lead');
  const norm = (x) => String(x || '').replace(/\s+/g, '');
  return {
    exists: !!el,
    text: norm(el ? el.textContent : ''),
    want: norm((brief.role || '') + (brief.role && brief.horizon ? '·' : '') + (brief.horizon || '')),
    beforeLead: !!(el && lead && (el.compareDocumentPosition(lead) & Node.DOCUMENT_POSITION_FOLLOWING)),
    overflow: el ? Math.round(el.scrollWidth - el.clientWidth) : -1,
    inTable: !!(el && el.closest('#challenger-goal-tension')),
  };
}, SID);
if (!ra.exists) fails.push('局内没有角色锚（.fgt-role 缺失）—— brief.role/horizon 仍只活在场景卡上');
else {
  if (ra.text !== ra.want) fails.push(`角色锚文本「${ra.text}」与 brief 声明「${ra.want}」不一致`);
  if (!ra.beforeLead) fails.push('角色锚没排在"第 N 手 · 代价"之上（玩家读完代价才看到自己是谁）');
  if (!ra.inTable) fails.push('角色锚跑出了目标冲突仪表，成了孤立浮层');
  if (ra.overflow > 0) fails.push(`角色锚横向溢出 ${ra.overflow}px`);
}
notes.push(`角色锚：${ra.text || '(缺失)'}`);

// 空壳红线：brief 没写 role/horizon 时，不许吐一行空的"·"。
const roleShell = await page.evaluate(() => {
  const table = window.OfflineEngine._flScenarioData;
  const sid = '__probe-no-role';
  const r = Object.create(window.ChallengerRouter.prototype);
  r.scenarioId = sid;
  r.gameState = { decision_history: [] };
  const objs = [{ id: 'a', text: '甲' }, { id: 'b', text: '乙' }, { id: 'c', text: '丙' }];
  table[sid] = { brief: { objectives: objs } };
  const a = r._renderGoalTension();
  table[sid] = { brief: { objectives: objs, role: '只有角色' } };
  const b = r._renderGoalTension();
  table[sid] = { brief: { objectives: objs, horizon: '只有视野' } };
  const c = r._renderGoalTension();
  delete table[sid];
  return { a: a.indexOf('fgt-role') < 0, b: /只有角色/.test(b) && b.indexOf('fgt-role-sep') < 0, c: /只有视野/.test(c) && c.indexOf('fgt-role-sep') < 0 };
});
if (!roleShell.a) fails.push('brief 无 role/horizon 时角色锚仍渲染出空行');
if (!roleShell.b || !roleShell.c) fails.push('只填 role 或只填 horizon 时角色锚拼接出错（多余的 · 分隔符）');
notes.push('角色锚空壳：缺字段不吐空行，半字段不留孤立分隔符');

// noodle 在 375px 下的溢出与文字截断
const mob = await browser.newPage({ viewport: { width: 375, height: 812 } });
await mob.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await mob.waitForTimeout(1000);
await mob.click('#start-journey');
await mob.waitForTimeout(800);
await mob.evaluate(() => {
  const card = [...document.querySelectorAll('.scenario-card')].find((n) => /老周|牛肉面/.test(n.innerText));
  card.querySelector('.btn-primary,button').click();
});
await mob.waitForTimeout(2600);
const m = await mob.evaluate(() => {
  const box = document.getElementById('challenger-goal-tension');
  return {
    exists: !!box,
    docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    boxOverflow: box ? Math.round(box.scrollWidth - box.clientWidth) : -1,
    rows: document.querySelectorAll('#challenger-goal-tension .fgt-cell').length,
  };
});
if (!m.exists) fails.push('手机端仪表没渲染');
if (m.boxOverflow > 0) fails.push(`手机端仪表横向溢出 ${m.boxOverflow}px`);
if (m.docOverflow > 0) fails.push(`手机端整页横向溢出 ${m.docOverflow}px`);
notes.push(`手机 375px：${m.rows} 格，页面溢出 ${m.docOverflow}px`);

if (pageErrors.length) fails.push('页面报错：' + pageErrors.join(' | '));
if (s0.docOverflow > 0) fails.push(`桌面端整页横向溢出 ${s0.docOverflow}px`);

console.log(notes.map((n) => '  · ' + n).join('\n'));
console.log(fails.length ? 'FAIL\n  - ' + fails.join('\n  - ') : 'PASS goal-tension (L0-2)');

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

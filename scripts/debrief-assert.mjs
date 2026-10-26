/**
 * V3 · "看得见根因" acceptance assertions
 *
 * 规则：
 *   1. 根因树上的每一个 Tn 叶子，必须在 decision_history 里真实存在该回合；
 *      找不到就是编的，直接红。
 *   2. 主因只在 1..4 之间：0 说明没算出根因，>4 说明主次没分。
 *   3. 导出的 PNG 必须是真文件（PNG magic + 有体积），不能只是按钮可点。
 *   4. 五个注册场景都要过 —— 复盘不是挑战者号专属。
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8544;
const OUT = process.argv[2] || path.join(os.tmpdir(), 'fl-debrief');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SCENARIOS = [
  { id: 'challenger-launch', card: /挑战者/ },
  { id: 'climate-change-policy', card: /气候/ },
  { id: 'enron-collapse', card: /安然/ },
  { id: 'noodle-shop-community', card: /面馆/ },
  { id: 'chip-ai-supplychain', card: /芯片/ }
];

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1600));

const fails = [];
const notes = [];
const browser = await chromium.launch();

// 固定 waitForTimeout 是"猜时间"：猜短了会读到中间态（误报），猜长了每一回合都在
// 白等。这里改成等页面自己给出的就绪信号 —— 状态机是确定的：
//   回合渲染 → 选项挂起(#challenger-confirm-bar 非 hidden) → 提交出反馈(#challenger-next-turn)
//   → 下一回合选项(#challenger-options[data-turn=N]) → 终局(#challenger-options 被替换)
// 条件比固定等待严格：不是"大概稳了"，而是"这一步真的完成了"，且满足即刻放行。
// 每步之后再走两帧，让 class/布局的同步副作用落地，避免点击落在未稳定的元素上。
const settle = (page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))));

async function waitTurnReady(page, turn) {
  await page.waitForFunction(
    (t) => {
      const box = document.getElementById('challenger-options');
      if (!box) return false;
      // data-turn 必须正好是目标回合：否则会在上一回合的残留 DOM 上误判就绪。
      if (Number(box.getAttribute('data-turn')) !== t) return false;
      return box.querySelectorAll('.challenger-option').length > 0;
    },
    turn,
    { timeout: 30000 }
  );
  await settle(page);
}

// FL_DEBRIEF_TIMING=1 时打印分阶段耗时；默认静默，保证常规日志仍与串行时逐字一致。
// 没有度量就只能靠猜，而"猜时间"正是这个脚本上一版最大的浪费来源。
const TIMING = process.env.FL_DEBRIEF_TIMING === '1';
const now = () => Number(process.hrtime.bigint()) / 1e6;

async function runScenario(scn, ctx) {
  const tag = scn.id;
  const t0 = now();
  const mark = {};
  const tick = (k) => { mark[k] = Math.round(now() - t0); };
  const turnMs = [];
  const phaseSum = { select: 0, pending: 0, submit: 0, next: 0 };
// S0 先对 noodle 强制现实锚定，S1 四场景铺开后五场景全部强制。
const ANCHOR_REQUIRED = new Set(['noodle-shop-community', 'challenger-launch', 'climate-change', 'enron-collapse', 'chip-ai-supplychain']);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));

  await page.addInitScript(() => {
    // 平滑滚动会把"元素已就绪"变成"元素还在移动"：Playwright 的真实点击必须等元素停稳，
    // 每回合在「点选项」「进入下一回合」两处各付几百毫秒到一秒，而验收目标是复盘 DOM 与
    // 导出 PNG，不是滚动动画。这里只把 scrollIntoView 的 behavior:smooth 降为 auto，
    // 点击仍是真元素、真事件、真冒泡，交互语义不变。
    const orig = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (arg) {
      if (arg && typeof arg === 'object' && arg.behavior === 'smooth') {
        return orig.call(this, Object.assign({}, arg, { behavior: 'auto' }));
      }
      return orig.call(this, arg);
    };
  });
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.OfflineEngine, null, { timeout: 30000 });
  // Playwright 点击前要确认元素"稳定"（连续两帧位置不变）。页面里的入场/反馈动画会让
  // 这个判定一直等到动画播完，每回合在「点选项」「进下一回合」两处白等几百毫秒。
  // 被验收的是复盘终态 DOM 与导出的 PNG，动画不在验收范围内，这里统一压到 1ms。
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation-duration:1ms!important;animation-delay:0s!important;' +
      'transition-duration:1ms!important;transition-delay:0s!important}'
  });
  tick('boot');
  await page.click('#start-journey');
  // 等场景列表真的渲染出目标卡片，而不是等 1 秒后去赌它已经在了。
  const cardSrc = scn.card.source.replace(/^\/|\/$/g, '');
  const cardsReady = await page
    .waitForFunction(
      (src) => {
        const re = new RegExp(src, 'i');
        return [...document.querySelectorAll('.scenario-card')].some((n) => re.test(n.innerText));
      },
      cardSrc,
      { timeout: 25000 }
    )
    .then(() => true)
    .catch(() => false);
  if (!cardsReady) {
    fails.push(`${tag} 找不到场景卡片`);
    await page.close();
    return;
  }
  tick('cards');
  const entered = await page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    const card = [...document.querySelectorAll('.scenario-card')].find((n) => re.test(n.innerText));
    if (!card) return false;
    card.querySelector('.btn-primary,button').click();
    return true;
  }, cardSrc);
  // 等第 1 回合的选项就位，而不是干等 2.6 秒。
  if (entered) await waitTurnReady(page, 1);
  tick('turn1');
  if (!entered) {
    fails.push(`${tag} 找不到场景卡片`);
    await page.close();
    return;
  }

  // 10 回合，一律选最靠后的一项（最激进）——为了让主因有东西可追。
  for (let t = 1; t <= 10; t++) {
    const tTurn = now();
    const phase = {};
    const p0 = now();
    const opts = await page.$$('.challenger-option');
    if (!opts.length) {
      fails.push(`${tag} T${t} 没有可点的选项`);
      break;
    }
    await opts[opts.length - 1].click();
    phase.select = Math.round(now() - p0);
    const p1 = now();
    // L1-2 之后「选中」不再等于「提交」：点一下只挂起，必须显式确认。
    // 先把「挂起」这一步等实（确认条出现且确认按钮可点），再确认。
    await page.waitForFunction(
      () => {
        const bar = document.getElementById('challenger-confirm-bar');
        return !!(bar && !bar.hidden && document.getElementById('challenger-confirm'));
      },
      null,
      { timeout: 20000 }
    );
    await page.evaluate(() => window.challengerRouter && window.challengerRouter.confirmChoice());
    phase.pending = Math.round(now() - p1);
    const p2 = now();
    // 提交是异步的（executeTurn → 写回 gameState → 渲染反馈）。等它真的落地：
    // 要么出现「进入第 N+1 回合」按钮，要么整块选项被终局页替换。
    await page.waitForFunction(
      () => {
        if (document.getElementById('challenger-next-turn')) return true;
        return !document.getElementById('challenger-options');
      },
      null,
      { timeout: 40000 }
    );
    await settle(page);
    phase.submit = Math.round(now() - p2);
    const p3 = now();
    const nx = await page.$('#challenger-next-turn');
    if (nx) {
      await nx.click();
      // 下一回合的选项带着 data-turn=N+1 出现，才是真的翻页成功。
      await waitTurnReady(page, t + 1);
    }
    phase.next = Math.round(now() - p3);
    Object.keys(phaseSum).forEach((k) => { phaseSum[k] += phase[k] || 0; });
    turnMs.push(Math.round(now() - tTurn));
  }
  tick('turnsEnd');

  const mounted = await page
    .waitForFunction(() => {
      const el = document.querySelector('[data-fl-debrief-host]');
      return !!(el && el.getAttribute('data-mounted') === '1');
    }, null, { timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!mounted) {
    fails.push(`${tag} 终局页没有挂载复盘（[data-fl-debrief-host][data-mounted=1] 缺失）`);
    pageErrors.forEach((e) => fails.push(`${tag} 页内异常：${e}`));
    await page.close();
    return;
  }

  tick('mount');

  const snap = await page.evaluate(() => {
    const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const root = document.querySelector('.fl-debrief');
    const svg = document.querySelector('.fl-db-svg');
    const decs = [...document.querySelectorAll('.fl-db-n-decision')].map((n) => clean(n.textContent));
    const hist = ((window.challengerRouter || {}).gameState || {}).decision_history || [];
    return {
      hasRoot: !!root,
      sections: document.querySelectorAll('.fl-debrief .fl-db-sec').length,
      svgRects: svg ? svg.querySelectorAll('rect').length : 0,
      svgLines: svg ? svg.querySelectorAll('path').length : 0,
      decTurns: decs.map((t) => {
        const m = t.match(/^T(\d+)/);
        return m ? Number(m[1]) : null;
      }),
      causes: [...document.querySelectorAll('.fl-db-n-cause')].map((n) => clean(n.textContent)),
      histTurns: hist.map((d) => Number(d && d.turn)).filter(Boolean),
      // L2-1 之后概念区只有一种卡：静态教材 + 动态证据，选择器随之收口。
      concepts: [...document.querySelectorAll('.fl-db-ccard')].map((n) => ({
        name: clean((n.querySelector('.fl-db-cname') || {}).textContent),
        tag: clean((n.querySelector('.fl-db-ctag') || {}).textContent),
        hit: n.classList.contains('hit'),
        lesson: clean((n.querySelector('.fl-db-clesson') || {}).textContent),
        anchor: clean((n.querySelector('.fl-db-canchor') || {}).textContent),
        none: clean((n.querySelector('.fl-db-cnone') || {}).textContent),
        where: clean((n.querySelector('.fl-db-cwhere') || {}).textContent)
      })),
      coverage: clean(((document.querySelector('.fl-db-ccover') || {}).textContent)),
      coverageInDeck: (function () {
        const m = (window.FLDebrief && window.FLDebrief.lastModel) || null;
        const cv = m && m.conceptCoverage;
        return cv ? {
          total: cv.total, hit: cv.hit, miss: cv.miss, unparsed: cv.unparsed,
          visible: cv.visible, constant: cv.constant, unreached: cv.unreached, no_source: cv.no_source
        } : null;
      })(),
      // L2-2 三层：DOM 顺序即教学顺序，必须排在 <details> 细节块之前。
      layers: (function () {
        const wrap = document.querySelector('.fl-debrief [data-fl-db-layers]');
        if (!wrap) return null;
        const secs = [...wrap.querySelectorAll('[data-fl-db-layer]')];
        const model = (window.FLDebrief && window.FLDebrief.lastModel) || null;
        const ml = (model && model.layers) || null;
        const details = document.querySelector('.fl-debrief .fl-db-details');
        const didItems = [...wrap.querySelectorAll('.fl-db-did > li')].map((n) => clean(n.textContent));
        const namedItems = [...wrap.querySelectorAll('.fl-db-named')].map((n) => ({
          name: clean((n.querySelector('.fl-db-named-name') || {}).textContent),
          quote: clean((n.querySelector('.fl-db-named-quote') || {}).textContent),
          evi: clean((n.querySelector('.fl-db-named-evi') || {}).textContent)
        }));
        const emptyNamed = clean((wrap.querySelector('[data-fl-db-layer="named"] .fl-db-empty') || {}).textContent);
        return {
          order: secs.map((n) => n.getAttribute('data-fl-db-layer')),
          beforeDetails: !!(details && (wrap.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING)),
          detailsOpen: !!(details && details.open),
          didCount: didItems.length,
          didHasTurn: didItems.every((t) => /^T\d+/.test(t)),
          didTurns: didItems.map((t) => Number((t.match(/^T(\d+)/) || [])[1])),
          namedCount: namedItems.length,
          namedItems: namedItems,
          emptyNamed: emptyNamed,
          nextQ: wrap.querySelectorAll('[data-fl-db-layer="next"] .fl-db-next-q > li').length,
          nextCf: clean((wrap.querySelector('[data-fl-db-layer="next"] .fl-db-next-cf') || {}).textContent),
          nextAnchor: clean((wrap.querySelector('[data-fl-db-layer="next"] .fl-db-next-anchor') || {}).textContent),
          modelDid: ml ? ml.did.length : -1,
          modelNamed: ml ? ml.named.length : -1,
          modelHit: (function () {
            const cards = (model && model.conceptCards) || [];
            return cards.filter((c) => c && c.status === 'hit').length;
          })(),
          modelCf: ml ? !!ml.next.counterfactual : null
        };
      })(),
      pendingRows: document.querySelectorAll('.fl-db-pending li').length,
      pendingEmpty: !!document.querySelector('.fl-db-pending') === false && !!document.querySelector('.fl-db-empty'),
      hasLedger: !!document.querySelector('.fl-db-ledger'),
      cfRows: document.querySelectorAll('.fl-db-cf li').length,
      endingTitle: clean(((root && root.querySelector('h3')) || {}).textContent).slice(0, 60),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });

  tick('snap');

  if (!snap.hasRoot) fails.push(`${tag} 终局页没有 .fl-debrief 容器`);
  if (snap.sections !== 5) fails.push(`${tag} 复盘分节 ${snap.sections} 个（应为 5）`);
  if (snap.svgRects < 4 || snap.svgLines < 1) {
    fails.push(`${tag} 根因树未成形（rect=${snap.svgRects} path=${snap.svgLines}）`);
  }
  if (snap.causes.length < 1) fails.push(`${tag} 根因树没有主因（0 个）`);
  if (snap.causes.length > 4) fails.push(`${tag} 根因树主因 ${snap.causes.length} 个（>4，主次未分）`);

  const orphans = snap.decTurns.filter((t) => t != null && snap.histTurns.indexOf(t) < 0);
  if (orphans.length) fails.push(`${tag} 根因链叶子 T${orphans.join(',T')} 不在 decision_history 中`);
  if (!snap.decTurns.some((t) => t != null)) fails.push(`${tag} 根因链没有可追溯到回合的叶子`);

  // L2-1（education-aligned-refactor-spec-v3 A4.3/A4.4）：
  // 静态教材层永久展示全部概念，动态证据只在命中时展开。
  // 所以 DOM 条数必须等于 total，而不是旧口径的 visible；
  // 「条数少」不再是合规形态——那正是 26 条教训永远不出现的原因。
  if (!snap.concepts.length) {
    fails.push(`${tag} 概念区块为空`);
  }
  const cv = snap.coverageInDeck;
  if (cv) {
    if (snap.concepts.length !== cv.total) {
      fails.push(`${tag} 概念条数不一致（模型 ${cv.total} / DOM ${snap.concepts.length}）`);
    }
    if (cv.hit !== snap.concepts.filter((c) => c.hit).length) {
      fails.push(`${tag} 命中条数与模型不一致`);
    }
    // 玩家视图只允许二元：命中 / 本局未触发。
    const badTag = snap.concepts
      .filter((c) => !/^(命中|本局未触发)/.test(String(c.tag || '')))
      .map((c) => `${c.name}=${c.tag}`);
    if (badTag.length) fails.push(`${tag} 状态不是二元：${badTag.join('、')}`);
    // 命中的必须指得出回合，未触发的必须说得出成因。
    const noTurn = snap.concepts.filter((c) => c.hit && !c.where).map((c) => c.name);
    if (noTurn.length) fails.push(`${tag} 命中概念指不到回合：${noTurn.join('、')}`);
    const noWhy = snap.concepts.filter((c) => !c.hit && !c.none).map((c) => c.name);
    if (noWhy.length) fails.push(`${tag} 未触发概念没说成因：${noWhy.join('、')}`);
    // 静态层不能空：概念名 + 教材句是最低要求。
    const noLesson = snap.concepts.filter((c) => !c.lesson).map((c) => c.name);
    if (noLesson.length) fails.push(`${tag} 概念缺教材句：${noLesson.join('、')}`);
    // L2-3 现实锚定：数据里写了不等于玩家看得见。锚定是 T4「这说的是我」的唯一落点，
    // 缺了它终局就退回「1986 年 NASA 犯过错」，玩家学不到自己。数据齐但渲染丢了，
    // A4.5 照样绿——所以这一条必须在 DOM 上验。
    // 五个场景均已铺锚定：任一场景缺锚定或超 30 字都计红，
    // 「全绿」只代表玩家真的能在复盘里看到自己。
    if (ANCHOR_REQUIRED.has(tag)) {
      const noAnchor = snap.concepts.filter((c) => !c.anchor).map((c) => c.name);
      if (noAnchor.length) fails.push(`${tag} 概念卡缺现实锚定：${noAnchor.join('、')}`);
      const badAnchor = snap.concepts
        .filter((c) => c.anchor && c.anchor.replace(/^现实里长这样[:：]\s*/, '').replace(/\s/g, '').length > 30)
        .map((c) => c.name);
      if (badAnchor.length) fails.push(`${tag} 现实锚定超 30 字：${badAnchor.join('、')}`);
    }
    if (snap.concepts.some((c) => String(c.tag || '').indexOf('指标未上报') >= 0)) {
      fails.push(`${tag} 仍残留旧口径「指标未上报」`);
    }
    if (!snap.coverage) fails.push(`${tag} 缺少概念覆盖说明行`);
    // D8 硬约束：未触发不许写成「你避开了」——那会把"我们没测到"算成玩家成绩。
    // 只禁"把未触发说成躲过了"的断言式表述；「没触发不等于你躲过了」这类
    // 否定句是正确口径，不能被误判。
    const ducked = /你避开了/.test(String(snap.coverage))
      || snap.concepts.some((c) => /你避开了|成功避开/.test(c.tag + c.none));
    if (ducked) fails.push(`${tag} 用「你避开了」掩盖未触发（D8 硬约束）`);
  } else if (!snap.coverage) {
    fails.push(`${tag} 概念命中缺少覆盖率信息`);
  }
  // L2-2（spec §8 / A4.8）：复盘必须先回答三件事——你做了什么、这叫什么、
  // 下次怎么办——而不是先甩一张根因树。这里验的是"三层真的存在且在最前面"，
  // 不是"某段文案写得好"：顺序、条数、与模型一致、D8 空态口径。
  const ly = snap.layers;
  if (!ly) {
    fails.push(`${tag} 复盘缺三层结构（[data-fl-db-layers] 缺失）`);
  } else {
    const want = ['did', 'named', 'next'];
    if (ly.order.join(',') !== want.join(',')) {
      fails.push(`${tag} 三层顺序为 ${ly.order.join('/')}（应为 did/named/next）`);
    }
    if (!ly.beforeDetails) fails.push(`${tag} 三层没有排在细节块之前`);
    if (ly.detailsOpen) fails.push(`${tag} 细节块默认展开 — 第一屏被旧五块占满`);
    if (ly.didCount < 1) fails.push(`${tag} 第一层「你做了什么」为空`);
    if (ly.didCount > 5) fails.push(`${tag} 第一层列了 ${ly.didCount} 条（>5，变成流水账）`);
    if (ly.didCount !== ly.modelDid) {
      fails.push(`${tag} 第一层条数与模型不一致（模型 ${ly.modelDid} / DOM ${ly.didCount}）`);
    }
    if (!ly.didHasTurn) fails.push(`${tag} 第一层有决策指不回回合号`);
    const orphanDid = ly.didTurns.filter((t) => !snap.histTurns.includes(t));
    if (orphanDid.length) fails.push(`${tag} 第一层出现不在 decision_history 的回合 T${orphanDid.join(',T')}`);
    if (ly.namedCount !== ly.modelNamed) {
      fails.push(`${tag} 第二层条数与模型不一致（模型 ${ly.modelNamed} / DOM ${ly.namedCount}）`);
    }
    if (ly.modelNamed !== ly.modelHit) {
      fails.push(`${tag} 第二层只列了 ${ly.modelNamed} 条，命中却有 ${ly.modelHit} 条`);
    }
    const namedBad = ly.namedItems.filter((n) => !n.name).map((n) => n.name || '(无概念名)');
    if (namedBad.length) fails.push(`${tag} 第二层概念缺名：${namedBad.join('、')}`);
    // 第二层不能退化成"一串概念名"：每条命中至少要有教材引文或本局证据之一。
    // 场景 JSON 目前没有任何 quote_index（Dörner 原话一条都还没显式映射），
    // 所以这里只要求"有话可说"，不强行要求名人名言 —— 用序号硬对一句错的
    // 引文比不显示更糟（见 buildConceptCards 的注释）。
    const bareNamed = ly.namedItems.filter((n) => !n.quote && !n.evi).map((n) => n.name);
    if (bareNamed.length) fails.push(`${tag} 第二层有概念既无引文也无本局证据：${bareNamed.join('、')}`);
    if (ly.nextQ !== 3) fails.push(`${tag} 第三层三问为 ${ly.nextQ} 条（应为 3）`);
    if (ly.modelCf && !ly.nextCf) fails.push(`${tag} 第三层缺反事实句（模型有 counterfactual）`);
    if (!ly.modelNamed && !/这不代表你避开了/.test(ly.emptyNamed)) {
      fails.push(`${tag} 未命中时第二层没有 D8 口径（「这不代表你避开了」）`);
    }
    const anc = ly.nextAnchor ? ly.nextAnchor.replace(/^现实里长这样[:：]\s*/, '').replace(/\s/g, '') : '';
    if (anc && anc.length > 30) fails.push(`${tag} 第三层现实锚定超 30 字`);
    notes.push(`${tag} 三层 ${ly.didCount}/${ly.namedCount}/3｜反事实 ${ly.nextCf ? '1' : '0'}`);
  }
  if (!snap.hasLedger) fails.push(`${tag} 代价清算区块缺失`);
  if (snap.cfRows < 1) fails.push(`${tag} 反事实为空 — 主因链没有落到具体回合`);

  // 导出 PNG
  try {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 25000 }),
      page.click('[data-fl-db-export]')
    ]);
    const pngPath = path.join(OUT, `debrief-${tag}-${Date.now()}.png`);
    await download.saveAs(pngPath);
    const buf = fs.readFileSync(pngPath);
    const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    if (!isPng) fails.push(`${tag} 导出的不是 PNG`);
    if (buf.length < 20000) fails.push(`${tag} 导出的 PNG 只有 ${buf.length} 字节（疑似空白）`);
    else notes.push(`${tag} PNG ${(buf.length / 1024).toFixed(0)} KB`);
  } catch (e) {
    fails.push(`${tag} 导出 PNG 失败：${String(e).slice(0, 120)}`);
  }
  tick('png');

  [...new Set(pageErrors)].forEach((e) => fails.push(`${tag} 页内异常：${e}`));
  if (snap.overflowX > 2) fails.push(`${tag} 终局页横向溢出 ${snap.overflowX}px`);

  notes.push(
    `${tag} 主因 ${snap.causes.length}｜叶子 ${snap.decTurns.filter((t) => t != null).length}｜` +
    `概念 ${snap.concepts.length}(命中 ${snap.concepts.filter((c) => c.hit).length}/缺指标 ${snap.concepts.filter((c) => c.missing).length})｜` +
    `未结清 ${snap.pendingRows}｜反事实 ${snap.cfRows}｜${snap.endingTitle}`
  );

  tick('total');
  if (TIMING) {
    const span = (a, b) => Math.max(0, mark[b] - mark[a]);
    const avg = turnMs.length ? Math.round(turnMs.reduce((x, y) => x + y, 0) / turnMs.length) : 0;
    console.log(
      `[timing] ${tag} boot=${mark.boot} cards=${span('boot', 'cards')} turn1=${span('cards', 'turn1')} ` +
      `turns=${span('turn1', 'turnsEnd')}(${turnMs.length} 回合 avg ${avg} max ${Math.max(0, ...turnMs)}) ` +
      `mount=${span('turnsEnd', 'mount')} snap=${span('mount', 'snap')} png=${span('snap', 'png')} ` +
      `total=${mark.total} | 每回合 avg: select=${Math.round(phaseSum.select / (turnMs.length || 1))} ` +
      `pending=${Math.round(phaseSum.pending / (turnMs.length || 1))} submit=${Math.round(phaseSum.submit / (turnMs.length || 1))} ` +
      `next=${Math.round(phaseSum.next / (turnMs.length || 1))}`
    );
  }

  await page.close();
}

// 五场景互不共享状态（各自独立 context + page + 独立 temp 目录外的 PNG 文件），
// 本就是一个天然可并行的只读验收：串行只是历史写法，单轮 10 回合的硬等待占了绝大部分墙钟。
// 并发度此前压到 3，是因为固定等待一旦被 CPU 争用拖慢就会静默误报。回合内改为条件等待后，
// 争用只会让就绪信号晚到（每步都有 20~40s 上限兜底，超时即报红，不会变成假绿），
// 于是并发度可以按核数放开：32 核实测 5 并发 34~37s（并发 3 为 62.7s，全固定等待时 74.8s）。
const CPU = (os.cpus() || []).length || 4;
const DEFAULT_CONCURRENCY = Math.min(SCENARIOS.length, Math.max(3, Math.floor(CPU / 4)));
const CONCURRENCY = Math.max(
  1,
  Math.min(SCENARIOS.length, Number(process.env.DEBRIEF_CONCURRENCY) || DEFAULT_CONCURRENCY)
);

async function runOne(scn) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  try {
    await runScenario(scn, ctx);
  } catch (e) {
    fails.push(`${scn.id} 运行异常：${String(e).slice(0, 160)}`);
  } finally {
    await ctx.close().catch(() => {});
  }
}

let cursor = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < SCENARIOS.length) {
      const scn = SCENARIOS[cursor++];
      await runOne(scn);
    }
  })
);

await browser.close();
srv.kill();

// 并发跑完后 notes/fails 是按完成先后交错的；按 SCENARIOS 原始顺序重排，
// 让日志与串行时逐字一致（断言口径不变，只是稳定输出顺序）。
const scnRank = (line) => {
  const i = SCENARIOS.findIndex((s) => String(line).startsWith(s.id + ' '));
  return i < 0 ? SCENARIOS.length : i;
};
const stable = (arr) => arr.map((v, i) => [v, i]).sort((a, b) => scnRank(a[0]) - scnRank(b[0]) || a[1] - b[1]).map((p) => p[0]);

const orderedNotes = stable(notes);
const orderedFails = stable(fails);
notes.length = 0;
notes.push(...orderedNotes);
fails.length = 0;
fails.push(...orderedFails);

notes.forEach((n) => console.log('  · ' + n));
if (fails.length) {
  console.log(`\nFAIL (${fails.length})`);
  [...new Set(fails)].forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
console.log('\nPASS debrief-assert (V3)');
process.exit(0);

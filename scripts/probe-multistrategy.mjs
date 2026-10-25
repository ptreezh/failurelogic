/**
 * SPEC-v2 · M0 多策略探针
 *
 * 为什么要有它：现有 debrief-assert.mjs 十回合一律点最后一项（最激进），
 * 只覆盖一条确定性策略。"命中 1 次"既可能是规则废了，也可能是这条策略
 * 本来就没踩坑 —— 两者不可分辨。没有对照基线，任何命中率都不能当验收。
 *
 * 用法：
 *   node scripts/probe-multistrategy.mjs --scenario=challenger-launch --strategies=first,last,mid,rand:1
 *   node scripts/probe-multistrategy.mjs --all --strategies=first,last,mid
 * 输出：docs/spec/grill/m0-matrix.json（追加式），控制台打印矩阵
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8547;
const OUT_JSON = path.join(ROOT, 'docs', 'spec', 'grill', 'm0-matrix.json');

const SCENARIOS = {
  'challenger-launch': /挑战者/,
  'climate-change-policy': /气候/,
  'enron-collapse': /安然/,
  'noodle-shop-community': /面馆/,
  'chip-ai-supplychain': /芯片/,
};

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const hit = argv.find((s) => s.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const wantAll = argv.includes('--all');
const scenarioIds = wantAll ? Object.keys(SCENARIOS) : [arg('scenario', 'challenger-launch')];
const stratSpecs = arg('strategies', 'first,last,mid').split(',').map((s) => s.trim()).filter(Boolean);

function picker(spec) {
  if (spec.startsWith('rand:')) {
    let seed = Number(spec.split(':')[1]) || 1;
    return (len) => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % len;
    };
  }
  if (spec === 'first') return () => 0;
  if (spec === 'last') return (len) => len - 1;
  if (spec === 'mid') return (len) => Math.floor(len / 2);
  throw new Error(`未知策略: ${spec}`);
}

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT, stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1600));

const browser = await chromium.launch();
const runs = [];

async function runOne(scenarioId, stratSpec) {
  const rec = { scenario: scenarioId, strategy: stratSpec, ok: false, error: null };
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  try {
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.OfflineEngine, null, { timeout: 30000 });
    await page.click('#start-journey');
    await page.waitForTimeout(1000);
    const entered = await page.evaluate((src) => {
      const re = new RegExp(src, 'i');
      const card = [...document.querySelectorAll('.scenario-card')].find((n) => re.test(n.innerText));
      if (!card) return false;
      card.querySelector('.btn-primary,button').click();
      return true;
    }, SCENARIOS[scenarioId].source.replace(/^\/|\/$/g, ''));
    if (!entered) throw new Error('找不到场景卡片');
    await page.waitForTimeout(2400);

    const choose = picker(stratSpec);
    const trace = [];
    for (let t = 1; t <= 10; t++) {
      const n = await page.$$eval('.challenger-option', (els) => els.length);
      if (!n) { trace.push(`T${t}:no-option`); break; }
      const idx = Math.max(0, Math.min(n - 1, choose(n)));
      await page.locator('.challenger-option').nth(idx).click();
      trace.push(idx);
      await page.waitForTimeout(900);
      const nx = await page.$('#challenger-next-turn');
      if (nx) { await nx.click(); await page.waitForTimeout(900); }
    }

    const mounted = await page.waitForFunction(() => {
      const el = document.querySelector('[data-fl-debrief-host]');
      return !!(el && el.getAttribute('data-mounted') === '1');
    }, null, { timeout: 20000 }).then(() => true).catch(() => false);
    rec.mounted = mounted;
    rec.trace = trace.join('');

    const snap = await page.evaluate(() => {
      const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
      const m = (window.FLDebrief && window.FLDebrief.lastModel) || null;
      const cv = m && m.conceptCoverage;
      const hist = ((window.challengerRouter || {}).gameState || {}).decision_history || [];
      return {
        hasDebrief: !!document.querySelector('.fl-debrief'),
        endingTitle: clean((document.querySelector('.fl-debrief h3') || {}).textContent).slice(0, 50),
        causes: document.querySelectorAll('.fl-db-n-cause').length,
        leaves: document.querySelectorAll('.fl-db-n-decision').length,
        cfRows: document.querySelectorAll('.fl-db-cf li').length,
        coverage: cv ? {
          total: cv.total, hit: cv.hit, miss: cv.miss, unparsed: cv.unparsed,
          visible: cv.visible, constant: cv.constant, unreached: cv.unreached, no_source: cv.no_source,
        } : null,
        concepts: [...document.querySelectorAll('.fl-db-concept')].map((n) => ({
          name: clean((n.querySelector('.fl-db-cname') || {}).textContent),
          hit: n.classList.contains('hit'),
          where: clean((n.querySelector('.fl-db-cwhere') || {}).textContent),
        })),
        histTurns: hist.map((d) => Number(d && d.turn)).filter(Boolean),
        // M1 回合级：直接从模型取，不经 DOM 文本反解析。
        // 目的是证明"回合级原子层在生产路径上真的走到了"，
        // 而不是只在纯函数单测的夹具里成立（历史上踩过这种假绿）。
        scope: (() => {
          const cs = (m && m.concepts) || [];
          const atoms = [];
          cs.forEach((c) => (c.atoms || []).forEach((a) => atoms.push({
            concept: c.key, name: a.name, scope: a.scope,
            turn: a.evidenceTurn, status: c.status,
          })));
          const beh = atoms.filter((a) => a.scope === 'behavior');
          const term = atoms.filter((a) => a.scope === 'terminal');
          const badTurn = beh.filter((a) => !Number.isInteger(a.turn) || a.turn < 1);
          const fakedTurn = term.filter((a) => a.turn != null);
          return {
            atoms: atoms.length,
            behavior: beh.length,
            terminal: term.length,
            unscoped: atoms.filter((a) => a.scope !== 'behavior' && a.scope !== 'terminal').length,
            badTurn: badTurn.length,
            fakedTurn: fakedTurn.length,
            earliest: beh.length ? Math.min(...beh.map((a) => a.turn)) : null,
            samples: beh.slice(0, 3).map((a) => `${a.concept}.${a.name}@${a.turn}`),
          };
        })(),
      };
    });

    Object.assign(rec, {
      ok: !!(mounted && snap.hasDebrief), ...snap, errors: errs,
    });
  } catch (e) {
    rec.error = String(e && e.message ? e.message : e).slice(0, 200);
    rec.errors = errs;
  } finally {
    await page.close();
  }
  return rec;
}

function flush() {
  let prev = { runs: [] };
  if (fs.existsSync(OUT_JSON)) {
    try { prev = JSON.parse(fs.readFileSync(OUT_JSON, 'utf-8')); } catch { /* ignore */ }
  }
  const merged = { updated: new Date().toISOString(), runs: [...(prev.runs || []), ...runs] };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(merged, null, 1), 'utf-8');
  return merged;
}

for (const sid of scenarioIds) {
  for (const st of stratSpecs) {
    console.error(`· ${sid} / ${st} ... `);
    const r = await runOne(sid, st);
    runs.push(r);
    flush();
    const cv = r.coverage || {};
    console.error(
      r.ok
        ? `  ok vis=${cv.visible} hit=${cv.hit} miss=${cv.miss} unr=${cv.unreached} nosrc=${cv.no_source} unp=${cv.unparsed} trace=${r.trace}`
        : `  FAIL ${r.error || '未挂载'}`
    );
  }
}

await browser.close();
srv.kill();
const merged = flush();

console.log('\n场景 × 策略 命中矩阵');
console.log('scenario'.padEnd(26), 'strategy'.padEnd(9), 'vis', 'hit', 'miss', 'unr', 'nosrc', 'unp');
for (const r of runs) {
  const cv = r.coverage || {};
  console.log(
    r.scenario.padEnd(26), r.strategy.padEnd(9),
    String(cv.visible ?? '-').padStart(3), String(cv.hit ?? '-').padStart(3),
    String(cv.miss ?? '-').padStart(4), String(cv.unreached ?? '-').padStart(3),
    String(cv.no_source ?? '-').padStart(5), String(cv.unparsed ?? '-').padStart(3)
  );
}
console.log(`\n写入 ${OUT_JSON}（累计 ${merged.runs.length} 条）`);

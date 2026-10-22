// Loop 8 · 终局结语的可执行口径（V31–V33）。
//
// 为什么要有这个脚本：Loop 8 实测发现 seed 3363 的终局写着
//   「平均承诺 6.4 单位，行政体系平均只能消化 20.0 单位——重表态、轻落地」
// 一句话把保守局说成冒进局。数值是真的，结论是反的，而模板层没有任何断言
// 能拦住它。这类错误在别处看不出来（温度、赤字、档位全对），只有把结语和
// 结语引用的数字放在一起读才会露馅，所以口径必须写成断言。
//
//   V31 结语与数据同向：avgCommit <= avgCapacity 时不得出现「重表态」
//       「差额不会消失」；avgCommit > avgCapacity 时不得出现「压在能力线以下」。
//   V32 终局无未填槽位（{commit_verdict} / {delivery_gap_line} 等必须被替换）。
//   V33 终局常显区 <= 1500 字（行分段口径，与 ui-render-assert 的 DOM 口径
//       同规则；实测最坏 1405，留一点余量给措辞微调）。
//   V35 执行赤字局必须把「均值」和「越线年数」分开说（Loop 9）。这个结局
//       原来通篇按「超额承诺」写，而实测超额贡献为 0、赤字由固定延期与
//       震荡堆出来，于是保守局也读到「差额没有消失」这种反向判词。现在
//       要求：①出现「均值看不出你在哪一年踩过了线」②出现判词
//       ③判词与越线年数同向。
//
// 用法：node scripts/acceptance-climate-epilogue.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8481 + Math.floor(Math.random() * 400);
const ROOT = 'D:/AIDevelop/failureLogic';
const SCN = 'climate-change-policy';
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1400));

const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e).slice(0, 160)));
await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !! window.OfflineEngine);

await page.evaluate((scn) => {
  const COLL = /^【(?:执行力折价|实施能力|档位判定|附加|行为诊断)/;
  const clean = (t) => t.replace(/\*\*/g, '').replace(/`/g, '')
    .replace(/^#{1,4}\s+/gm, '').replace(/^[=\-]{5,}$/gm, '').replace(/\s+/g, '');
  const visibleLen = (fb) => {
    let sum = 0, cur = null;
    String(fb || '').split(/\r?\n/).forEach((line) => {
      const tr = line.trim();
      const isHead = /^(【|📌)/.test(tr);
      const coll = isHead ? COLL.test(tr) : (cur ? cur.collapsed : false);
      if (!cur || (isHead && cur.collapsed !== coll)) cur = { collapsed: coll };
      if (!coll) sum += clean(line).length;
    });
    return sum;
  };
  window.__flEpi = async (seed, kind) => {
    window.__FL_OPTION_SEED__ = seed;
    const c = await window.OfflineEngine.createGameSession(scn, 'auto');
    const gid = c.game_id;
    let gs = null, last = '';
    for (let t = 1; t <= 10; t++) {
      const st = await window.OfflineEngine.getScenarioStep(scn, t);
      const opts = st.options;
      let pick;
      if (kind === 'random') pick = opts[((seed * 1103515245 + t * 12345) >>> 0) % opts.length];
      else if (kind === 'first') pick = opts[0];
      else {
        const want = kind === 'safe' ? ['safe', 'extreme_safe']
          : kind === 'risky' ? ['risky', 'extreme_risk'] : ['neutral'];
        pick = opts.filter(o => want.indexOf(String(o.o ? o.o.weight : o.weight)) >= 0)[0] || opts[0];
      }
      const r = await window.OfflineEngine.executeTurn(gid, { option: pick.id, justification: '' }, scn);
      gs = r.game_state;
      last = r.feedback || '';
    }
    const turns = gs._commit_turns || 0;
    return {
      fb: last,
      vis: visibleLen(last),
      avgCommit: turns ? (gs._commit_sum || 0) / turns : 0,
      avgCapacity: turns ? (gs._capacity_sum || 0) / turns : 0,
      overYears: gs._over_years || 0,
      turns
    };
  };
}, SCN);

const fails = [];
const rows = [];
const branches = { over: 0, under: 0, mixed: 0 };
let execRuns = 0;
let skipped = 0;
const cases = [];
for (let i = 0; i < 6; i++) cases.push([4000 + i * 17, 'random']);
for (const k of ['neutral', 'safe', 'risky', 'first']) {
  for (let i = 0; i < 4; i++) cases.push([5000 + i * 23, k]);
}
for (const [seed, kind] of cases) {
  let r;
  try { r = await page.evaluate(([s, k]) => window.__flEpi(s, k), [seed, kind]); }
  catch (e) { fails.push('RUN ' + kind + '/' + seed + ': ' + String(e).slice(0, 90)); continue; }
  const fb = r.fb || '';
  rows.push({ seed, kind, vis: r.vis, avgCommit: Math.round(r.avgCommit * 100) / 100, avgCapacity: Math.round(r.avgCapacity * 100) / 100 });

  // V31 · 同向。口径是"越线年数"，不是均值：均值相同的一次冒进和一次留力
  // 会被抹平，而结语说的是"你有没有把系统压过头"这件事本身。
  const over = r.overYears >= 3;
  const under = r.overYears === 0;
  // 只有用了 {commit_verdict} 的结语才受 V31 约束；3°C 灾难、协调崩溃等
  // narrative 里那句「平均承诺 X vs 平均消化 Y」是中性陈述，不判方向。
  const hasVerdict = /十年里有|压在能力以下/.test(fb);
  if (!hasVerdict) { skipped++; if (under && fb.indexOf('重表态') >= 0) fails.push(`V31 ${kind}/${seed} 中性句却写成重表态`); }
  else {
  branches[over ? 'over' : under ? 'under' : 'mixed']++;
  }
  if (hasVerdict && under && (fb.indexOf('重表态') >= 0 || fb.indexOf('差额不会消失') >= 0)) {
    fails.push(`V31 ${kind}/${seed} 越线 0 年（承诺 ${r.avgCommit} / 能力 ${r.avgCapacity}）却判成冒进`);
  }
  if (hasVerdict && over && (fb.indexOf('压在能力以下') >= 0 || fb.indexOf('账面没有透支') >= 0)) {
    fails.push(`V31 ${kind}/${seed} 越线 ${r.overYears}/${r.turns} 年却判成保守`);
  }
  if (hasVerdict && !over && !under && fb.indexOf('不连贯') < 0) {
    fails.push(`V31 ${kind}/${seed} 越线 ${r.overYears}/${r.turns} 年，结语未给混合判定`);
  }
  // V32 · 无未填槽位
  const slots = fb.match(/\{[a-zA-Z_][\w]*\}/g) || [];
  if (slots.length) fails.push(`V32 ${kind}/${seed} 未填槽位 ${Array.from(new Set(slots)).join('、')}`);
  // V33 · 常显长度
  if (r.vis > 1500) fails.push(`V33 ${kind}/${seed} 终局常显 ${r.vis} 字 > 1500`);
  // V35 · 执行赤字局的口径分层
  if (fb.indexOf('账面达标，交付没跟上') >= 0) {
    execRuns++;
    if (fb.indexOf('均值看不出你在哪一年踩过了线') < 0) {
      fails.push(`V35 ${kind}/${seed} 执行赤字局没把均值与越线年数分开说`);
    }
    if (!hasVerdict) {
      fails.push(`V35 ${kind}/${seed} 执行赤字局缺判词`);
    } else if (over && fb.indexOf('重表态') < 0) {
      fails.push(`V35 ${kind}/${seed} 执行赤字局越线 ${r.overYears} 年却未判重表态`);
    } else if (under && fb.indexOf('压在能力以下') < 0) {
      fails.push(`V35 ${kind}/${seed} 执行赤字局越线 0 年却未判保守`);
    } else if (!over && !under && fb.indexOf('不连贯') < 0) {
      fails.push(`V35 ${kind}/${seed} 执行赤字局越线 ${r.overYears} 年却未判不连贯`);
    }
  }
}

const maxVis = rows.reduce((a, b) => Math.max(a, b.vis), 0);
const maxCommit = rows.reduce((a, b) => Math.max(a, b.avgCommit), 0);
const minCommit = rows.reduce((a, b) => Math.min(a, b.avgCommit), 0);
console.log('分支覆盖 over/under/mixed =', branches.over + '/' + branches.under + '/' + branches.mixed, '| 中性结语跳过', skipped);
if (!branches.mixed || !branches.over) console.log('WARN verdict 分支覆盖不足');
if (!branches.over || !branches.under) console.log('WARN 分支样本不足，判词覆盖面待补');
console.log('runs', rows.length, '| 执行赤字局', execRuns, '| 终局常显 max', maxVis, '| 平均承诺区间', minCommit, '~', maxCommit);
if (pageErrors.length) fails.push('PERR ' + pageErrors.slice(0, 3).join(' | '));
if (fails.length) {
  fails.forEach(f => console.log('FAIL ' + f));
  console.log('\nFAIL epilogue assertions (' + fails.length + ')');
} else {
  console.log('PASS V31 结语与数据同向（' + rows.length + ' 局）');
  console.log('PASS V32 终局无未填槽位');
  console.log('PASS V33 终局常显 <= 1500（实测最坏 ' + maxVis + '）');
  console.log('PASS V35 执行赤字局口径分层（' + execRuns + ' 局）');
  console.log('\nPASS all epilogue assertions');
}
await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

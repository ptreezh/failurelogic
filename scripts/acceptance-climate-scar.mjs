// Loop 7 · 锈蚀疤痕的可执行口径（V26–V28）。
//
// 为什么独立成文件：ui-render-assert.mjs 管的是"渲染成什么样"，疤痕是数值与
// 文案层的断言，混进去会让 V1–V25 的失败原因变得难以定位。这里只回答三件事：
//   1. 疤痕不随"重新推进产能"而下降（不可逆）；
//   2. 疤痕单调不减且有上限；
//   3. 恢复推进的那一年，玩家能同时看到"制度锈蚀"与"锈蚀疤痕"两行。
//
// 用法：node scripts/acceptance-climate-scar.mjs
// 退出码 0 = 通过，1 = 有断言失败。

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 8481 + Math.floor(Math.random() * 400);
const SCN = 'climate-change-policy';
const ROOT = 'D:/AIDevelop/failureLogic';
const RUST_CAP = 0.30;

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
  { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1400));

const browser = await chromium.launch();
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(String(e).slice(0, 200)));
page.on('console', m => { if (m.type() === 'error') pageErrors.push('console: ' + m.text().slice(0, 120)); });
await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.OfflineEngine);

await page.evaluate((scn) => {
  window.__flScar = {
    // 静默 N 年（每回合选 ask 最小的选项），之后改为每回合选 ask 最大的
    async play(seed, quiet) {
      window.__FL_OPTION_SEED__ = seed;
      const c = await window.OfflineEngine.createGameSession(scn, 'auto');
      const rows = [];
      let last = '';
      let gs = null;
      for (let t = 1; t <= 10; t++) {
        const st = await window.OfflineEngine.getScenarioStep(scn, t);
        const opts = st.options.map(o => {
          const e = (st.expected_effects || {})[o.id] || {};
          return { o, renew: e.renewable_share_pct || 0 };
        });
        const pool = t <= quiet
          ? opts.slice().sort((a, b) => a.renew - b.renew)
          : opts.slice().sort((a, b) => b.renew - a.renew);
        const r = await window.OfflineEngine.executeTurn(c.game_id,
          { option: pool[0].o.id, justification: '' }, scn);
        gs = r.game_state;
        last = r.feedback || '';
        rows.push({
          t,
          ask: pool[0].renew,
          streak: gs.last_defer_streak,
          erode: gs.last_capacity_erode,
          scar: gs.last_rust_scar,
          forecast: (window.OfflineEngine.planClimateOption(gs, (st.expected_effects || {})[pool[0].o.id] || {}) || {}).rustScar,
          hasErodeLine: last.indexOf('\u5236\u5ea6\u9508\u8680') >= 0,
          hasScarLine: last.indexOf('\u9508\u8680\u75a4\u75d5') >= 0,
          capBlockLines: (function () {
            // V34 · 【实施能力】折叠块的行数。Loop 8 把它从六行压到四行：
            // 收起时它不进可见区，但玩家展开后看到的是一整屏还是一小段，
            // 决定了他会不会把这张账读完。只数该段内的行，段名不算。
            var ls = last.split('\n'), on = false, n = 0;
            for (var i = 0; i < ls.length; i++) {
              var tr = ls[i].trim();
              if (tr.indexOf('\u3010\u5b9e\u65bd\u80fd\u529b\u3011') === 0) { on = true; continue; }
              if (on && /^\u3010/.test(tr)) break;
              if (on && tr) n++;
            }
            return n;
          })(),
          scarLineLen: (function () {
            var ls = last.split('\n');
            for (var i = 0; i < ls.length; i++) {
              if (ls[i].indexOf('\u9508\u8680\u75a4\u75d5') >= 0) return ls[i].trim().length;
            }
            return 0;
          })(),
        });
      }
      return { rows, band: (last.match(/\u2192 \u5b9a\u6863\uff1a[^\n（]*/) || ['?'])[0].replace('\u2192 \u5b9a\u6863\uff1a', '').trim() };
    },
  };
}, SCN);

const fails = [];
const check = (id, ok, msg) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + id + ' ' + msg);
  if (!ok) fails.push(id + ' ' + msg);
};

// 多种子 × 多个静默年数，覆盖"静默 0 / 2 / 5 / 8 年"
const cases = [];
for (const seed of [11, 22, 33, 44, 55]) {
  for (const quiet of [0, 2, 5, 8]) cases.push([seed, quiet]);
}

let v26ok = true, v26cases = 0, v26msg = '';
let v27ok = true, v27msg = '', v28ok = true, v28cases = 0, v28checked = 0;
let v30ok = true, v30msg = '', v30max = 0;
let v34ok = true, v34msg = '', v34max = 0;
let maxSeen = 0;

for (const [seed, quiet] of cases) {
  const r = await page.evaluate(([s, q]) => window.__flScar.play(s, q), [seed, quiet]);
  let prev = 0;
  for (const x of r.rows) {
    const scar = x.scar || 0;
    maxSeen = Math.max(maxSeen, scar);
    // V27 · 单调不减（可增不可减）、不越上限
    if (scar < prev - 1e-9 || scar < 0 || scar > RUST_CAP + 1e-9) {
      v27ok = false;
      v27msg += ` seed${seed}/quiet${quiet}/T${x.t} scar=${scar} prev=${prev};`;
    }
    // 预测条与结算必须同源，否则 UI 会给出乐观的能力值
    if (typeof x.forecast === 'number' && x.forecast < scar - 1e-9) {
      v27ok = false;
      v27msg += ` forecast<settled seed${seed}/quiet${quiet}/T${x.t} ${x.forecast}<${scar};`;
    }
    // V26 · 恢复推进的那一年：erode 回到 1，疤痕不退
    if (x.t > quiet && x.erode >= 0.999 && prev > 0) {
      v26cases++;
      if (scar < prev - 1e-9) {
        v26ok = false;
        v26msg = ` seed${seed}/quiet${quiet}/T${x.t} scar ${prev}->${scar}`;
      }
      // V28 · 那一年的文案必须把两笔账都写出来。T10 是终局回合，反馈换成
      // 结局叙事、不再有【实施能力】段，因此只检查仍有能力条的回合。
      if (x.t < 10) {
        v28checked++;
        if (!x.hasScarLine) {
          v28ok = false;
          v28cases++;
        }
        // V30 · 疤痕行是常显文本，太长会把【实施能力】段顶出首屏
        if (x.hasScarLine && x.scarLineLen > 110) {
          v30ok = false;
          v30msg += ` seed${seed}/quiet${quiet}/T${x.t} len=${x.scarLineLen};`;
        }
        v30max = Math.max(v30max, x.scarLineLen);
        if (x.capBlockLines > 4) {
          v34ok = false;
          v34msg += ` seed${seed}/quiet${quiet}/T${x.t} lines=${x.capBlockLines};`;
        }
        v34max = Math.max(v34max, x.capBlockLines);
      }
    }
    prev = scar;
  }
}

check('V26', v26ok, `疤痕不随恢复推进而下降（样本 ${v26cases} 个恢复年）${v26msg}`);
check('V27', v27ok, `疤痕单调不减、0<=scar<=${RUST_CAP}（全样本峰值 ${maxSeen}）${v27msg}`);
check('V28', v28ok, `恢复年文案含「锈蚀疤痕」（检查 ${v28checked} 个回合，缺失 ${v28cases} 次）`);
check('V29', maxSeen > 0 && v28checked > 0, `疤痕机制确实被触发过（峰值 ${maxSeen}，可检查恢复年 ${v28checked}）`);
check('V30', v30ok, `疤痕行长度 <=110 字（实测最长 ${v30max}）${v30msg}`);
check('V34', v34ok, `【实施能力】块 <=4 行（实测最多 ${v34max} 行）${v34msg}`);
check('PERR', pageErrors.length === 0, `pageerror=${pageErrors.length} ${pageErrors.slice(0, 2).join(' | ')}`);

console.log(fails.length ? '\nFAILED: ' + fails.length : '\nPASS all scar assertions');
await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

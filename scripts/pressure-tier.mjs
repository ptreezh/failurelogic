#!/usr/bin/env node
/**
 * pressure-tier.mjs — 过程记账的对外契约（spec §6.2 / §6.2.1 / G4，T-6）。
 *
 * 这个脚本存在的原因，是 spec 里最容易被做假的一条：
 *   "前 9 回合对结局有影响"。
 * 在一个「结局由第 10 回合决定」的场景里，这句话可以靠三行漂亮文案糊过去。
 * 所以这里不测文案好不好看，只测三件能被反推的事：
 *
 *   1. 结构：五个场景的 final_outcome 都带 process_ledger，
 *      且 pressure_tier 只能是 low / mid / high —— 不允许出现第四种"内部档位"。
 *   2. 透明：档位必须能用 key_counters 的数值 + spec §6.2.1 的公开阈值表**独立算出来**。
 *      算不出来就说明档位是黑箱，玩家没法复核，教学价值为零。
 *   3. 因果：challenger 固定第 10 回合选项，只把前 9 回合从"全避险"切到"全冒进"，
 *      结局 id 必须不变（不推翻 4 个结局命名），pressure_tier 必须变（至少覆盖 low 与 high），
 *      结局文本末尾必须追加【代价清算】段，且两局的段文本不同。
 *
 * 反推用的阈值表是**测试自己写的一份**，不从实现里 import —— 抄一遍是有意的：
 * 如果实现偷偷改了阈值，这里会红，而不是跟着一起错。
 *
 * 用法：
 *   node scripts/pressure-tier.mjs            # 全量
 *   node scripts/pressure-tier.mjs --verbose  # 打印每局档位与计数
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8262;
const VERBOSE = process.argv.includes('--verbose');

const SCN = [
  'challenger-launch',
  'climate-change-policy',
  'enron-collapse',
  'noodle-shop-community',
  'chip-ai-supplychain',
];

// —— 测试侧的独立阈值表（spec §6.2.1，公开可见，不做黑箱）——
const TABLE = {
  'challenger-launch': {
    metric: '风险接受 + 异议压制 合计次数',
    pick: (c) => c.accepted_risks_count + c.dissent_suppressed_count,
    low: (v) => v <= 1,
    mid: (v) => v >= 2 && v <= 4,
    high: (v) => v >= 5,
  },
  'climate-change-policy': {
    // 口径换算：spec §6.2.1 的 0.5 / 1.5 是 0–1 归一尺度，
    // 而 implementation_debt 在本引擎里是 0–100 尺度，其 grace line = 6、
    // band worst = 32（CLIMATE_DEBT.fiscalGrace / bandDebtWorst）。等价取 6 / 32。
    metric: '执行赤字（0–100）+ 隐性结算次数',
    pick: (c) => c.implementation_debt,
    low: (v) => v <= 6,
    mid: (v) => v > 6 && v <= 32,
    high: (v) => v > 32,
  },
  'enron-collapse': {
    metric: '表外敞口 相对初值倍数',
    pick: (c) => c.exposure_multiple,
    low: (v) => v <= 1.2,
    mid: (v) => v > 1.2 && v <= 1.8,
    high: (v) => v > 1.8,
  },
  'noodle-shop-community': {
    metric: '负债 相对初值倍数',
    pick: (c) => c.debt_multiple,
    low: (v) => v <= 1.3,
    mid: (v) => v > 1.3 && v <= 2.0,
    high: (v) => v > 2.0,
  },
  'chip-ai-supplychain': {
    metric: '现金消耗 相对初值倍数',
    pick: (c) => c.cash_burn_multiple,
    low: (v) => v <= 1.3,
    mid: (v) => v > 1.3 && v <= 2.0,
    high: (v) => v > 2.0,
  },
};

function tierOf(scn, counters) {
  const t = TABLE[scn];
  if (!t) return '?';
  const v = t.pick(counters);
  if (t.high(v, counters)) return 'high';
  if (t.low(v, counters)) return 'low';
  return 'mid';
}

const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  cwd: ROOT,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => !!window.OfflineEngine);

const fails = [];
const rows = [];

// —— 第一段：五场景各跑一局，验结构与可反推 ——
const shape = await page.evaluate(async (scns) => {
  const out = {};
  for (const scn of scns) {
    const sess = await window.OfflineEngine.createGameSession(scn, 'auto');
    let last = null;
    for (let t = 1; t <= 10; t++) {
      const st = await window.OfflineEngine.getScenarioStep(scn, t);
      const opts = (st && st.options) || [];
      const pick =
        opts.find((o) => String(o.weight || '').toLowerCase() === 'extreme_safe') || opts[0];
      last = await window.OfflineEngine.executeTurn(
        sess.game_id,
        { option: pick.id, justification: '' },
        scn
      );
    }
    const fo = (last && (last.final_outcome || (last.game_state || {}).final_outcome)) || null;
    out[scn] = { fo, feedback: String((last && last.feedback) || '') };
  }
  return out;
}, SCN);

for (const scn of SCN) {
  const { fo, feedback } = shape[scn];
  if (!fo) {
    fails.push(`${scn}: 终局无 final_outcome`);
    continue;
  }
  const pl = fo.process_ledger;
  if (!pl || typeof pl !== 'object') {
    fails.push(`${scn}: final_outcome 缺 process_ledger（T-6 待实现）`);
    continue;
  }
  if (!['low', 'mid', 'high'].includes(pl.pressure_tier)) {
    fails.push(`${scn}: pressure_tier 非法值「${pl.pressure_tier}」`);
  }
  const counters = {};
  (pl.key_counters || []).forEach((c) => {
    if (c && c.name) counters[c.name] = Number(c.value);
  });
  if (Object.keys(counters).length !== 2) {
    fails.push(`${scn}: key_counters 应恰好 2 项，实际 ${Object.keys(counters).length}`);
  }
  const expect = tierOf(scn, counters);
  if (expect !== pl.pressure_tier) {
    fails.push(
      `${scn}: 档位不可反推 —— 计数 ${JSON.stringify(counters)} 按公开阈值应判 ${expect}，实现给了 ${pl.pressure_tier}`
    );
  }
  const verdict = String(pl.verdict || '');
  if (!verdict) fails.push(`${scn}: process_ledger.verdict 为空`);
  else if (verdict.length > 40) fails.push(`${scn}: verdict ${verdict.length} 字，超过 40`);
  else {
    const nums = Object.values(counters).filter((n) => Number.isFinite(n));
    const quoted = nums.some((n) => verdict.includes(String(n)) || verdict.includes(String(Math.round(n))));
    if (!quoted) fails.push(`${scn}: verdict 未引用任何实际计数「${verdict}」`);
  }
  if (!feedback.includes('【代价清算】')) {
    fails.push(`${scn}: 结局文本缺【代价清算】追加段`);
  }
  rows.push({ scn, tier: pl.pressure_tier, counters, verdict, id: fo.id });
}

// —— 第二段：challenger 因果分离（固定 T10，只切前 9 回合）——
const causal = await page.evaluate(async () => {
  const SCNID = 'challenger-launch';
  const FINAL_OPTION = 'B'; // launch_dodged
  const run = async (posture) => {
    const sess = await window.OfflineEngine.createGameSession(SCNID, 'auto');
    let last = null;
    for (let t = 1; t <= 10; t++) {
      const st = await window.OfflineEngine.getScenarioStep(SCNID, t);
      const opts = (st && st.options) || [];
      let pick;
      if (t === 10) {
        pick = opts.find((o) => o.id === FINAL_OPTION) || opts[0];
      } else if (posture === 'safe') {
        pick =
          opts.find((o) => String(o.weight || '').toLowerCase() === 'extreme_safe') ||
          opts.find((o) => String(o.weight || '').toLowerCase() === 'safe') ||
          opts[0];
      } else {
        pick =
          opts.find((o) => String(o.weight || '').toLowerCase() === 'extreme_risk') ||
          opts.find((o) => String(o.weight || '').toLowerCase() === 'risky') ||
          opts[0];
      }
      last = await window.OfflineEngine.executeTurn(
        sess.game_id,
        { option: pick.id, justification: '' },
        SCNID
      );
    }
    const fo = (last && (last.final_outcome || (last.game_state || {}).final_outcome)) || null;
    const tail = String((last && last.feedback) || '');
    const idx = tail.indexOf('【代价清算】');
    return {
      id: fo && fo.id,
      tier: fo && fo.process_ledger && fo.process_ledger.pressure_tier,
      counters: fo && fo.process_ledger && fo.process_ledger.key_counters,
      ledgerSegment: idx >= 0 ? tail.slice(idx).trim() : '',
    };
  };
  return { safe: await run('safe'), risky: await run('risky') };
});

if (!causal.safe.id || !causal.risky.id) {
  fails.push('challenger 因果段：终局 final_outcome 缺失，无法判定');
} else {
  if (causal.safe.id !== causal.risky.id) {
    fails.push(
      `challenger：前 9 回合改变了结局 id（${causal.safe.id} vs ${causal.risky.id}）——违反 §6.2「不改判」`
    );
  }
  if (causal.safe.tier === causal.risky.tier) {
    fails.push(
      `challenger：前 9 回合全 safe 与全 risky 的 pressure_tier 同为「${causal.safe.tier}」——过程记账未生效`
    );
  }
  const tiers = new Set([causal.safe.tier, causal.risky.tier]);
  if (!(tiers.has('low') && tiers.has('high'))) {
    fails.push(`challenger：两档未覆盖 low 与 high（实际 ${[...tiers].join(' / ')}）`);
  }
  if (!causal.safe.ledgerSegment || !causal.risky.ledgerSegment) {
    fails.push('challenger：结局文本缺【代价清算】段');
  } else if (causal.safe.ledgerSegment === causal.risky.ledgerSegment) {
    fails.push('challenger：safe 与 risky 的【代价清算】段逐字相同——数值未进文本');
  }
  if (VERBOSE) {
    console.log('\nchallenger 因果对照：');
    console.log('  safe  → id=' + causal.safe.id + ' tier=' + causal.safe.tier + ' ' + JSON.stringify(causal.safe.counters));
    console.log('  risky → id=' + causal.risky.id + ' tier=' + causal.risky.tier + ' ' + JSON.stringify(causal.risky.counters));
    console.log('  safe  段：' + causal.safe.ledgerSegment.replace(/\n/g, ' '));
    console.log('  risky 段：' + causal.risky.ledgerSegment.replace(/\n/g, ' '));
  }
}

if (VERBOSE) {
  console.log('\n五场景过程记账：');
  rows.forEach((r) =>
    console.log(`  ${r.scn.padEnd(24)} ${String(r.tier).padEnd(5)} ${JSON.stringify(r.counters)}  「${r.verdict}」`)
  );
}

if (pageErrors.length) { fails.push('pageerror: ' + pageErrors[0]); console.log('\nFAIL pageerror:\n  - ' + pageErrors.slice(0, 5).join('\n  - ')); }

console.log('\npressure-tier：5 场景过程记账 + challenger 因果分离');
console.log('-'.repeat(78));
if (fails.length) {
  fails.slice(0, 12).forEach((f) => console.log('  ! ' + f));
  if (fails.length > 12) console.log(`  ... 另有 ${fails.length - 12} 条`);
  console.log(`\nFAILED: ${fails.length} 处`);
} else {
  console.log(`PASS 五场景档位均可由公开阈值反推；challenger 结局 id 未变、档位 ${causal.safe.tier}/${causal.risky.tier}`);
}

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

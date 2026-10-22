#!/usr/bin/env node
/**
 * adapter-ending.mjs — T-4：结局文本的三套 schema 是否被归一（spec §6.3 / E4）。
 *
 * 现实是三套：
 *   A 套 challenger：narrative_intro + timeline + dorner_reflection + teaching_questions
 *                   （个别结局把"后来怎样"塞在 what_happens_next / consequences / teaching_point 里）
 *   B 套 climate/enron：narrative + scientific_sources（没有 timeline，没有 title）
 *   C 套 noodle/chip：title + narrative_intro + timeline + ... + hidden_costs + luck_note
 *
 * 断言只有一条：**逐个**（不是抽样）走一遍全部结局，归一后五个字段都在，
 * 且 title 非空、narrative 非空、三个数组字段是数组。
 * 额外要求：B 套的来源必须带出来——把文献引用丢掉，等于把气候场景的
 * 「这不是编剧写的，是 IPCC 写的」这个可信度来源删掉。
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8263;

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

const data = await page.evaluate(async () => {
  const E = window.OfflineEngine;
  const out = { hasNormalizer: typeof E._flNormalizeEnding === 'function', cases: [] };
  if (!out.hasNormalizer) return out;

  const WL = E._flOutcomeWhitelist || {};
  for (const scn of Object.keys(WL)) {
    // 场景是懒加载的：不先建一次会话，_loaded 里没有数据，结局原文自然取不到。
    await E.createGameSession(scn, 'auto');
    // 从已加载的场景数据里取原文，而不是自己造 raw —— 归一器必须能吃真实数据。
    const endings = E._flRawEndings(scn) || {};
    for (const id of WL[scn]) {
      const e = endings && endings[id] ? endings[id] : {};
      let n = null;
      let err = '';
      try {
        n = E._flNormalizeEnding(scn, e);
      } catch (ex) {
        err = String(ex).slice(0, 140);
      }
      out.cases.push({
        scenario: scn,
        id,
        hasRaw: !!(endings && endings[id]),
        err,
        title: n ? n.title : null,
        narrativeLen: n ? String(n.narrative || '').length : 0,
        timeline: n ? (Array.isArray(n.timeline) ? n.timeline.length : 'not-array') : null,
        reflection: n
          ? Array.isArray(n.reflection)
            ? n.reflection.length
            : 'not-array'
          : null,
        sources: n ? (Array.isArray(n.sources) ? n.sources.length : 'not-array') : null,
      });
    }
  }
  return out;
});

const fails = [];
console.log('\nT-4 结局归一（Adapter）');
console.log('-'.repeat(78));

if (!data.hasNormalizer) {
  console.log('FAIL window.OfflineEngine._flNormalizeEnding 不存在（T-4 待实现）');
  fails.push('no normalizer');
} else {
  for (const c of data.cases) {
    const tag = `${c.scenario}/${c.id}`;
    if (c.err) {
      fails.push(`${tag} 抛错 ${c.err}`);
      console.log(`FAIL ${tag} 抛错 ${c.err}`);
      continue;
    }
    if (!c.hasRaw) {
      fails.push(`${tag} 取不到结局原文`);
      console.log(`FAIL ${tag} 取不到结局原文`);
      continue;
    }
    if (!c.title) fails.push(`${tag} title 为空`);
    if (c.title && c.title.length > 26) fails.push(`${tag} title 过长 ${c.title.length} 字`);
    if (!c.narrativeLen) fails.push(`${tag} narrative 为空`);
    if (c.timeline === 'not-array') fails.push(`${tag} timeline 非数组`);
    if (c.reflection === 'not-array') fails.push(`${tag} reflection 非数组`);
    if (c.sources === 'not-array') fails.push(`${tag} sources 非数组`);
    // B 套（climate/enron）原文带科学来源，归一后不能丢
    if (c.scenario === 'climate-change-policy' || c.scenario === 'enron-collapse') {
      if (!c.sources) fails.push(`${tag} 丢失 scientific_sources`);
    }
  }
  console.log(
    `  覆盖 ${data.cases.length} 个结局 × 五字段；sources 存活 ${
      data.cases.filter((c) => c.sources > 0).length
    } 个`
  );
}

if (pageErrors.length) fails.push('pageerror: ' + pageErrors[0]);
if (fails.length) {
  fails.slice(0, 12).forEach((f) => console.log('FAIL ' + f));
  console.log(`\nFAILED: ${fails.length} 项`);
} else {
  console.log('-' .repeat(78));
  console.log(`PASS ${data.cases.length}/${data.cases.length} 结局归一完整`);
}

await browser.close();
srv.kill();
process.exit(fails.length ? 1 : 0);

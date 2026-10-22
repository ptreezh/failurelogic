#!/usr/bin/env node
/**
 * build-standalone.mjs — FailureLogic 单文件构建脚本
 *
 * 将 index.html 挂载的 8 个 CSS、14 个 JS、3 个场景 JSON 全部内联，
 * 生成 dist/failure-logic-standalone.html，双击即可离线完整运行：
 *   - 场景数据内联为 window.__FL_SCENARIO_DATA__，offline-engine 优先读取，
 *     规避 file:// 下 fetch 相对路径失败；
 *   - 进度保存沿用原应用 localStorage 逻辑，不受影响；
 *   - 移除 manifest / apple-touch-icon / preconnect / preload / SW 注册，
 *     单文件不依赖外部资源；
 *   - 幂等：每次直接覆盖输出，可重复执行。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_HTML = path.join(ROOT, 'index.html');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, 'failure-logic-standalone.html');

// 场景注册表：offline-engine.js 中 SCENARIO_FILES 的 key -> 相对路径
const SCENARIO_FILES = {
  'challenger-launch': 'assets/data/scenarios/challenger_launch.json',
  'climate-change-policy': 'assets/data/scenarios/climate_change.json',
  'enron-collapse': 'assets/data/scenarios/enron_collapse.json',
  'noodle-shop-community': 'assets/data/scenarios/noodle_shop_community.json',
  'chip-ai-supplychain': 'assets/data/scenarios/chip_ai_supplychain.json',
};

function readRel(rel) {
  return fs.readFileSync(path.join(ROOT, rel.split('?')[0]), 'utf8');
}

function escapeScriptClose(text) {
  // 防止内联 JS/JSON 中出现裸 </script> 提前闭合 <script> 标签；
  // 已转义的 <\/script（正则字面量）不再二次处理。
  return text.replace(/(?<!\\)<\/script/gi, '<\\/script');
}

let html = fs.readFileSync(INDEX_HTML, 'utf8');
let cssCount = 0;
let jsCount = 0;

// 1) 内联 CSS（保持原有 link 顺序）
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => {
  let css = escapeScriptClose(readRel(href));
  css = css.replace(/<\/style/gi, '<\\/style');
  cssCount += 1;
  return `<style>\n${css}\n</style>`;
});

// 2) 移除单文件场景下的外部引用：manifest、apple-touch-icon、preconnect、preload
html = html.replace(/\s*<!-- PWA Manifest -->\s*<link rel="manifest"[^>]*>/g, '');
html = html.replace(/\s*<!-- Apple Touch Icon -->\s*<link rel="apple-touch-icon"[^>]*>/g, '');
html = html.replace(/\s*<link rel="preconnect"[^>]*>/g, '');
html = html.replace(/\s*<link rel="preload"[^>]*>/g, '');

// 3) 移除 Service Worker 注册（file:// 下无意义且产生 404 噪音）
html = html.replace(/\s*\/\/ Service Worker Registration[\s\S]*?\r?\n    \}\r?\n/, '\n');

// 4) 构建内联场景数据
const scenarioData = {};
for (const [key, rel] of Object.entries(SCENARIO_FILES)) {
  scenarioData[key] = JSON.parse(readRel(rel));
}
const dataScript = 'window.__FL_SCENARIO_DATA__=' + escapeScriptClose(JSON.stringify(scenarioData));
const dataBlock = `<script>${dataScript}</script>`;

// 5) 内联 JS（普通 script 与 type="module" 均支持，保持原有顺序）
html = html.replace(/<script([^>]*)\ssrc="([^"]+)"([^>]*)><\/script>/g, (m, attrs1, src, attrs2) => {
  let js = readRel(src);
  if (/\bimport\s[^;]*\bfrom\s/.test(js) || /\bexport\s+/.test(js)) {
    throw new Error(`ES module 语法出现在 ${src}，当前单文件打包不支持模块图，请先消除 import/export。`);
  }
  // offline-engine：优先从内联数据读取场景 JSON，规避 file:// fetch 失败
  if (src.includes('offline-engine.js')) {
    // 原代码：
    //     const promise = fetch(url)
    //       .then(r => { ... })
    // 注入后必须把 .then 接到 fetch(url) 上，否则 .then 会挂在整个三元表达式
    // 上，把内联的普通对象当 Response 处理（r.json 不存在）。
    const injection = [
      '    const promise = (window.__FL_SCENARIO_DATA__ && window.__FL_SCENARIO_DATA__[id])',
      '        ? Promise.resolve(window.__FL_SCENARIO_DATA__[id])',
      '        : fetch(url).then(r => {',
    ].join('\n');
    const fetchChain = /const promise = fetch\(url\)\s*\r?\n\s*\.then\(r => \{/;
    if (!fetchChain.test(js)) {
      throw new Error('offline-engine.js 中未找到预期 fetch 注入点，构建中止。');
    }
    js = js.replace(fetchChain, injection);
  }
  js = escapeScriptClose(js);
  jsCount += 1;
  const attrs = (attrs1 || '') + (attrs2 || '');
  return `<script${attrs}>\n${js}\n</script>`;
});

// 6) 注入场景数据（放在 </head> 之前，保证先于所有业务 JS 生效）
// 不能用 indexOf('<script')：HTML 注释里出现 <script> 字样时会把数据块
// 塞进注释里，脚本静默不执行，offline-engine 就退回 fetch 并在 file:// 下失败。
const headEnd = html.lastIndexOf('</head>');
if (headEnd === -1) throw new Error('index.html 中未找到 </head>，构建中止。');
html = html.slice(0, headEnd) + dataBlock + '\n' + html.slice(headEnd);

// 6.5) P0 自检：单文件必须带上 Loop 1 的修复，否则构建等于白跑
const checks = {
  climateBudgetLine: html.includes('_flClimateBudgetLine'),
  // Loop 3: the capacity readout is the only in-game cue that teaches the
  // prepare-then-strike line; if it is dropped from the bundle the lesson is
  // silently unreachable again.
  climateCapacityLine: html.includes('_flClimateCapacityLine') && html.includes('【实施能力】'),
  homeStats: html.includes('window.HomeStats'),
  // 只认真正的 fetch 调用，注释里提到文件名不算违规
  noLocalScenarioJsonFetch: !/fetch\(\s*['"`][^'"`]*scenarios\.json/.test(html),
  noPreload: !/<link rel="preload"/.test(html),
  serviceWorkerStripped: !/serviceWorker\s*\.\s*register/.test(html),
  // 数据块必须落在真实 <script> 里：若最近的注释开始符比 <script 更近，
  // 说明被塞进了 HTML 注释，file:// 下会退回 fetch 并失败。
  scenarioDataInScript: (() => {
    const at = html.indexOf('window.__FL_SCENARIO_DATA__=');
    if (at === -1) return false;
    const tag = html.lastIndexOf('<script', at);
    const comment = html.lastIndexOf('<!--', at);
    return tag !== -1 && tag > comment;
  })(),
};
const failed = ['climateBudgetLine', 'homeStats', 'noLocalScenarioJsonFetch', 'noPreload', 'scenarioDataInScript']
  .filter((k) => !checks[k]);
if (failed.length) throw new Error('单文件自检失败: ' + failed.join(', '));

// 7) 输出（幂等覆盖）
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, html, 'utf8');
const bytes = Buffer.byteLength(html, 'utf8');

console.log(JSON.stringify({
  output: OUT_FILE,
  sizeBytes: bytes,
  sizeKB: Number((bytes / 1024).toFixed(1)),
  sizeMB: Number((bytes / 1024 / 1024).toFixed(2)),
  cssInlined: cssCount,
  jsInlined: jsCount,
  scenariosInlined: Object.keys(scenarioData),
  checks,
  status: 'OK',
}, null, 2));

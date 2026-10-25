/**
 * SPEC-v2 · M3 卫生门禁
 *
 * 为什么不能按子串查：上一次的结论是「dist 里 4 个 localhost、2 个 onrender
 * 全是注释里的死字符串，运行时无害」。若门禁直接 grep，会把它们判红，
 * 然后为了让它变绿，人会去删注释——门禁一旦逼人做无意义的改动，
 * 下一次它报警就没人信了。
 *
 * 所以门禁必须做两件事：先把**注释**剥掉，再只在**可执行依赖**里查。
 *
 * 用法：
 *   node scripts/gate-hygiene.mjs           # 真实仓库检查
 *   node scripts/gate-hygiene.mjs --selftest # 用正负样本自证判得准
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'D:/AIDevelop/failureLogic';

// ── 去掉注释但保留字符串内容 ──────────────────────────────────────
// 不能用正则一次替换：'http://x' 里的 // 会被当成行注释，然后整行被吃掉，
// 真正的违规字符串反而检测不到（假绿）。所以按字符走状态机。
function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let state = 'code'; // code | line | block | single | double | template
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (state === 'code') {
      if (c === '/' && c2 === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && c2 === '*') { state = 'block'; i += 2; continue; }
      if (c === "'") { state = 'single'; out += c; i += 1; continue; }
      if (c === '"') { state = 'double'; out += c; i += 1; continue; }
      if (c === '`') { state = 'template'; out += c; i += 1; continue; }
      out += c; i += 1; continue;
    }
    if (state === 'line') { if (c === '\n') { state = 'code'; out += c; } i += 1; continue; }
    if (state === 'block') {
      if (c === '*' && c2 === '/') { state = 'code'; i += 2; continue; }
      if (c === '\n') out += c; // 保留行号对齐
      i += 1; continue;
    }
    // 字符串内：原样保留（违规字符串必须能被查出来），处理转义
    if (c === '\\') { out += c + (c2 || ''); i += 2; continue; }
    if ((state === 'single' && c === "'") || (state === 'double' && c === '"') || (state === 'template' && c === '`')) {
      state = 'code'; out += c; i += 1; continue;
    }
    out += c; i += 1; continue;
  }
  return out;
}

const BANNED = ['localhost', 'onrender.com'];

// 判定一处命中是否被"离线早退"守卫保护。
// 为什么要这一步：app.js:18-24 的 localhost/onrender 都在
// `if (protocol === 'file:' || hostname === '') return '';` 之后，
// 离线打开时根本走不到。把它们判红，唯一后果是人去删掉这段合法分支，
// 然后真实的 P0 #9 修复（不发明后端）反而被拆掉。
const GUARD_RE = /\b\w*protocol\w*\s*===\s*['"]file:|\b\w*host(name)?\w*\s*===\s*['"]{2}|isOffline|OFFLINE_MODE|\bproto\w*\s*===\s*['"]file:/;

// 只有"能被请求的端点"才算违规。`hostname === 'localhost'` 这类比较语句
// 本身发不出任何请求，判它红等于要求删掉环境判断——那才是真正会出事的改动。
const ENDPOINT_RE = /https?:\/\/[^\s'"]*localhost|https?:\/\/[^\s'"]*onrender\.com|localhost:\d{2,5}|\/\/localhost:\d{2,5}/;

function blockRange(codeLines, lineIdx) {
  // 向上找最近的函数起点，向下按括号平衡找结束
  let start = 0;
  for (let i = lineIdx; i >= 0; i -= 1) {
    if (/\bfunction\b|=>\s*\{/.test(codeLines[i])) { start = i; break; }
  }
  let depth = 0, seen = false, end = codeLines.length - 1;
  for (let i = start; i < codeLines.length; i += 1) {
    for (const ch of codeLines[i]) {
      if (ch === '{') { depth += 1; seen = true; }
      else if (ch === '}') { depth -= 1; if (seen && depth === 0) { end = i; i = codeLines.length; break; } }
    }
  }
  return [start, end];
}

function scanSource(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const code = stripComments(raw);
  const hits = [];
  const lines = code.split('\n');
  lines.forEach((ln, idx) => {
    BANNED.forEach((b) => {
      if (ln.indexOf(b) < 0) return;
      const [bs, be] = blockRange(lines, idx);
      let guarded = false;
      for (let i = bs; i <= be && i < lines.length; i += 1) {
        if (GUARD_RE.test(lines[i])) { guarded = true; break; }
      }
      const isEndpoint = ENDPOINT_RE.test(ln);
      hits.push({ file, line: idx + 1, token: b, text: ln.trim().slice(0, 120), guarded, isEndpoint });
    });
  });
  return hits;
}

// index.html 里真正会被浏览器加载的脚本 = 可执行依赖
function executableDeps(htmlPath) {
  const html = stripComments(fs.readFileSync(htmlPath, 'utf8'));
  const out = [];
  const re = /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const src = m[1].split('?')[0];
    if (/^https?:/i.test(src)) { out.push({ src, external: true, abs: null }); continue; }
    out.push({ src, external: false, abs: path.resolve(path.dirname(htmlPath), src.replace(/^\.\//, '')) });
  }
  return out;
}

// ── 自测：正负样本 ────────────────────────────────────────────────
if (process.argv.includes('--selftest')) {
  let p = 0; const f = [];
  const ok = (id, title, cond, d) => { if (cond) { p += 1; console.log(`  PASS ${id}  ${title}${d ? '  — ' + d : ''}`); } else { f.push(id); console.log(`  FAIL ${id}  ${title}  — ${d}`); } };
  const t = (s) => stripComments(s);

  ok('G1', '行注释内的 localhost 被剥掉', t("// http://localhost:8000\nvar a = 1;").indexOf('localhost') < 0, '');
  ok('G2', '块注释内的 onrender 被剥掉', t("/* api.onrender.com */ var a=1;").indexOf('onrender') < 0, '');
  ok('G3', '字符串内的 URL 原样保留（不得被 // 吃掉）',
    t("var u = 'http://localhost:8000';").indexOf('localhost') > 0, '字符串必须留下');
  ok('G4', '双引号字符串内的 URL 保留', t('var u = "api.onrender.com";').indexOf('onrender') > 0, '');
  ok('G5', '代码中残留 localhost 会被检出', t("fetch('http://localhost:9/x');").indexOf('localhost') > 0, '');
  ok('G6', '注释剥离不吞掉后面的真实代码',
    t("/* c */ fetch('x');").indexOf('fetch') > 0, '');

  // G7/G8：守卫识别。用临时文件走真实 scanSource 路径，而不是复刻逻辑。
  const tmp = path.join(ROOT, 'temp-gate-sample.js');
  fs.writeFileSync(tmp, [
    '(function () {',
    "  if (window.location.protocol === 'file:') { return ''; }",
    "  if (host === 'localhost') { return 'http://localhost:8000'; }",
    '})();',
    '(function () {',
    "  var u = 'http://localhost:9000/api';",
    '  fetch(u);',
    '})();',
    '(function () {',
    "  var isLocal = location.hostname === 'localhost';",
    '  return isLocal;',
    '})();',
  ].join('\n'));
  const sample = scanSource(tmp);
  const g7 = sample.filter((h) => h.line <= 3 && h.guarded).length;
  const g8 = sample.filter((h) => h.line >= 6 && !h.guarded).length;
  fs.unlinkSync(tmp);
  ok('G7', '有 file:// 早退守卫的端点判为合规', g7 > 0, `命中 ${g7} 处且均标 guarded`);
  ok('G8', '无守卫的端点仍判为违规', g8 > 0, `命中 ${g8} 处未标 guarded`);
  const pureCmp = sample.filter((h) => /hostname\s*===/.test(h.text) && h.text.indexOf('http') < 0);
  ok('G9', '纯 hostname 比较不算端点违规',
    pureCmp.length > 0 && pureCmp.every((h) => h.isEndpoint === false),
    `纯比较行 ${pureCmp.length} 处，均未判为端点`);
  console.log('\n' + (f.length ? `门禁自测 ${p} PASS / ${f.length} FAIL：${f.join(',')}` : `门禁自测全绿 ${p} 项`));
  process.exit(f.length ? 1 : 0);
}

// ── 真实检查 ──────────────────────────────────────────────────────
const indexHtml = path.join(ROOT, 'index.html');
const deps = executableDeps(indexHtml);
const local = deps.filter((d) => !d.external && d.abs && fs.existsSync(d.abs));
const allHits = [];
local.forEach((d) => { scanSource(d.abs).forEach((h) => allHits.push(h)); });
const endpoints = allHits.filter((h) => h.isEndpoint);
const violations = endpoints.filter((h) => !h.guarded);
const guardedHits = endpoints.filter((h) => h.guarded);
const references = allHits.filter((h) => !h.isEndpoint);
const missingDep = deps.filter((d) => !d.external && (!d.abs || !fs.existsSync(d.abs)));

// 未引用模块：只告警，不 FAIL。理由：18 个零引用 JS 里有 9 个依赖 /api，
// 单文件离线定位下天生跑不起来，清不清是产品决策（D3），不是构建错误。
const allJs = fs.readdirSync(path.join(ROOT, 'assets/js')).filter((f) => f.endsWith('.js'));
const loadedNames = new Set(local.map((d) => path.basename(d.abs)));
const unused = allJs.filter((f) => !loadedNames.has(f));

console.log('\n═══ M3 卫生门禁 ═══');
console.log(`  index.html 可执行脚本 ${deps.length} 个（本地 ${local.length}，外链 ${deps.length - local.length}）`);
console.log(`  可执行依赖内 localhost/onrender：违规端点 ${violations.length} 处 / 已守卫端点 ${guardedHits.length} 处 / 纯环境判断 ${references.length} 处（不计）`);
violations.slice(0, 10).forEach((v) => console.log(`    ✗ ${path.basename(v.file)}:${v.line} [${v.token}] ${v.text}`));
console.log(`  加载失败/不存在的本地脚本：${missingDep.length} 个${missingDep.length ? ' -> ' + missingDep.map((d) => d.src).join(', ') : ''}`);
console.log(`  未引用 JS（告警，不阻断，见 D3）：${unused.length} 个`);

const hardFail = violations.length > 0 || missingDep.length > 0;
console.log('\n' + (hardFail ? '门禁 FAIL' : '门禁 PASS（注释内字符串不计）'));
process.exit(hardFail ? 1 : 0);

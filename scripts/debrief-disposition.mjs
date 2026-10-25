#!/usr/bin/env node
/**
 * debrief-disposition.mjs — 把 40 条 feedback_patterns 的处置结论落成表格。
 *
 * 依据：docs/SPEC-V3（§2 口径 / §6 关账）。输出 docs/debrief-pattern-disposition.md。
 * 只读：不改任何场景 JSON。判定口径完全来自 FLDebrief.buildConcepts，
 * 不在这里二次实现，避免"文档说一套、页面判一套"。
 *
 * 用法：node scripts/debrief-disposition.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'D:/AIDevelop/failureLogic';
const src = fs.readFileSync(path.join(ROOT, 'assets/js/fl-debrief.js'), 'utf8')
  .replace(/\}\)\(window\);\s*$/, '})(globalThis);');
vm.runInThisContext(src, { filename: 'fl-debrief.js' });
const FL = globalThis.FLDebrief;

const SCN_DIR = path.join(ROOT, 'assets/data/scenarios');
const scenarios = fs.readdirSync(SCN_DIR).filter((f) => f.endsWith('.json')).map((f) => {
  const d = JSON.parse(fs.readFileSync(path.join(SCN_DIR, f), 'utf8'));
  return { id: d.scenarioId || f.replace(/\.json$/, ''), data: d };
}).sort((a, b) => a.id.localeCompare(b.id));

const ACTION = {
  derive: '保留，走可见门禁（命中/未命中且能指回回合才上屏）',
  derive_runtime: '保留，由 decision_history 派生（附证据回合）',
  split: '拆子句：只保留可归因部分，其余降级为叙事',
  constant: '停用：零行动即命中，判定与决策无关',
  deprecate: '标 status=deprecated + revive_when，不删 JSON',
  rewrite: '先修解析器；仍不可解析则改写表达式或 deprecate',
};

const rows = [];
let total = 0;
for (const s of scenarios) {
  const list = FL.buildConcepts({ concepts: [], turns: 0 }, s.data, Object.assign({}, s.data.initialState || {}));
  for (const c of list) {
    total++;
    const sources = (c.atoms || []).map((a) => `${a.name}:${a.source}`).join('<br>');
    rows.push([
      s.id,
      c.concept,
      c.key,
      c.verdict,
      c.status,
      String((c.atoms || []).length),
      sources || (c.parsed ? '—' : `原式: ${c.trigger}`),
      c.evidenceTurns.length ? c.evidenceTurns.join(',') : '—',
      ACTION[c.verdict] || '—'
    ]);
  }
}

const head = '| # | 场景 | 概念 | key | 判定 | 零行动状态 | 原子 | 数据源 | 证据回合 | 处置 |\n'
  + '|---|---|---|---|---|---|---|---|---|---|';
const body = rows.map((r, i) => '| ' + [i + 1, ...r].join(' | ') + ' |').join('\n');

const dist = rows.reduce((a, r) => { a[r[3]] = (a[r[3]] || 0) + 1; return a; }, {});
const stat = rows.reduce((a, r) => { a[r[4]] = (a[r[4]] || 0) + 1; return a; }, {});

const out = `# debrief 概念规则处置表（自动生成）

> 由 \`scripts/debrief-disposition.mjs\` 生成，请勿手改。
> 依据：\`output/debrief-v3-spec.md\`（SPEC-V3）§2 口径、§6 关账。
> 数据基线：五场景 \`initialState\`（零行动），\`decision_history\` 为空。

## 汇总

- 规则总数：${total}
- 判定分布：${Object.entries(dist).map(([k, v]) => `\`${k}\` ${v}`).join('、')}
- 零行动状态分布：${Object.entries(stat).map(([k, v]) => `\`${k}\` ${v}`).join('、')}

上屏口径（两张表要分开读，混在一起就会把覆盖率算高）：

- **derive**：${rows.filter((r) => r[3] === 'derive').length} 条可上屏。零行动下均为「未触发」，但每一条都能指回具体回合。
- **derive_runtime**：${rows.filter((r) => r[3] === 'derive_runtime').length} 条在零行动下不可用（派生层需要真实决策历史），对局中才有值。
- **其余** ${rows.filter((r) => r[3] !== 'derive' && r[3] !== 'derive_runtime').length} 条本局不上屏，页面统一折叠为「无法判定 N 条」。

判定说明：

| 判定 | 含义 | 上屏 |
|---|---|---|
| derive | 全部原子来自引擎 effects，可归因 | 是（命中/未命中且有回合） |
| derive_runtime | 来自派生层，附证据回合 | 是 |
| split | 部分原子无源，需拆子句 | 否 |
| constant | 零行动即命中，与决策无关 | 否 |
| deprecate | 全部原子无任何数据源 | 否 |
| rewrite | 解析器判不了（写法问题） | 否 |

## 逐条

${head}
${body}

## 维护约定

1. \`deprecate\` 条目**不删**，加 \`"status":"deprecated"\` 与 \`"revive_when"\`（例：\`"补 willingness_to_pay 计数器后恢复"\`）。
2. \`rewrite\` 条目修完解析器后重跑本脚本；仍为 \`rewrite\` 才改写表达式。
3. 任何阈值/权重枚举改动视为回归，必须过 \`scripts/debrief-v3-tdd.mjs\`。
`;

const OUT = path.join(ROOT, 'docs/debrief-pattern-disposition.md');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log(`PASS debrief-disposition: ${total} 条 → ${OUT}`);
console.log(`     ${Object.entries(dist).map(([k, v]) => k + '=' + v).join(' ')}`);
process.exit(total === 40 ? 0 : 1);

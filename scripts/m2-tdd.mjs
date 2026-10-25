/**
 * SPEC-v2 · M2 TDD（跨局聚合视图）
 *
 * 为什么先写断言：M2 的失败模式不是崩溃，而是**悄悄填补**。
 * 一局没打完、没有结局、没有命中记录，最省事的做法就是填 0 或者
 * 拿别局的均值顶上——界面会显得很饱满，但它展示的是推断值。
 * 所以这层的第一条断言必须是"缺就是 missing"，第二条才是"点够不够"。
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = 'D:/AIDevelop/failureLogic';
let pass = 0;
const fail = [];
function check(id, title, ok, detail) {
  if (ok) { pass += 1; console.log(`  PASS ${id}  ${title}${detail ? '  — ' + detail : ''}`); }
  else { fail.push(id); console.log(`  FAIL ${id}  ${title}  — ${detail}`); }
}

// 无头加载：这层不许碰 DOM / localStorage（只吃传入的 sessions 对象），
// 否则"不写第二套日志"这条约束会在实现里被悄悄破坏。
const ctx = { console, window: {}, localStorage: undefined };
ctx.window = ctx;
vm.createContext(ctx);
const src = path.join(ROOT, 'assets/js/fl-profile.js');
if (!fs.existsSync(src)) {
  console.log('FLProfile 尚未实现（fl-profile.js 不存在）——以下断言预期全红');
} else {
  vm.runInContext(fs.readFileSync(src, 'utf8'), ctx);
}
const FP = ctx.FLProfile;

const full = {
  s1: {
    session_id: 's1', scenario_id: 'enron-collapse', difficulty: 'auto',
    decision_count: 10, turn: 11, created_at: '2026-10-20T10:00:00Z',
    game_state: { turn_number: 11, decision_history: [{ turn: 1 }, { turn: 2 }] },
    final_outcome: { id: 'collapse', title: '崩塌' },
  },
  s2: {
    session_id: 's2', scenario_id: 'chip-ai-supplychain', difficulty: 'auto',
    decision_count: 10, turn: 11, created_at: '2026-10-21T10:00:00Z',
    game_state: { turn_number: 11, decision_history: [{ turn: 1 }] },
    final_outcome: { id: 'delayed', title: '延迟' },
  },
};

// K0 模块存在且暴露聚合入口
check('K0', 'fl-profile.js 导出 FLProfile.aggregate', !!FP && typeof FP.aggregate === 'function',
  FP ? '已加载' : '模块缺失');

if (FP && typeof FP.aggregate === 'function') {
  // K1 系数必须显式冻结并导出——A2.1 拿它算点数，藏起来就无法对账
  check('K1', '每局固定字段系数已冻结并导出',
    Array.isArray(FP.PER_SESSION_FIELDS) && FP.PER_SESSION_FIELDS.length > 0,
    Array.isArray(FP.PER_SESSION_FIELDS) ? `系数=${FP.PER_SESSION_FIELDS.length}（${FP.PER_SESSION_FIELDS.join(',')}）` : '未导出');

  // K2 空集合不崩、不产出点
  let empty;
  try { empty = FP.aggregate({}); } catch (e) { empty = null; }
  check('K2', '零局聚合返回空视图而非抛错',
    !!empty && empty.sessionCount === 0 && empty.points.length === 0,
    empty ? `sessionCount=${empty.sessionCount} points=${empty.points.length}` : '抛错');

  // K3 A2.1：数据点数 = 局数 × 系数
  const r = FP.aggregate(full);
  const coef = FP.PER_SESSION_FIELDS.length;
  check('K3', 'A2.1 数据点数 = 局数 × 冻结系数',
    r.points.length === 2 * coef,
    `局数 2 × 系数 ${coef} = ${r.points.length}`);

  // K4 A2.2：缺结局的那局必须记 missing，不得填 0 或拿别局补
  const broken = JSON.parse(JSON.stringify(full));
  delete broken.s2.final_outcome;
  const rb = FP.aggregate(broken);
  const oc = rb.points.filter((p) => p.field === 'final_outcome_code' && p.session_id === 's2');
  const okMissing = oc.length === 1 && oc[0].status === 'missing' && oc[0].value === null;
  check('K4', 'A2.2 缺失记为 missing 且 value 为 null', okMissing,
    oc.length ? `status=${oc[0].status} value=${JSON.stringify(oc[0].value)}` : '未产出该点');

  // K5 不得插值：同一字段，s1 有值、s2 缺失，s2 的值不允许等于 s1 的值
  const s1v = rb.points.find((p) => p.field === 'final_outcome_code' && p.session_id === 's1');
  check('K5', 'A2.2 缺失值不得被别局值顶替（无插值）',
    !!s1v && s1v.status === 'ok' && s1v.value !== oc[0].value && oc[0].value === null,
    s1v ? `s1=${JSON.stringify(s1v.value)} s2=${JSON.stringify(oc[0].value)}` : 's1 未产出');

  // K6 不写第二套日志：聚合不得触碰 storage
  let touched = 0;
  ctx.localStorage = { getItem() { touched += 1; }, setItem() { touched += 1; } };
  try { FP.aggregate(full); } catch (e) { /* ignore */ }
  check('K6', '聚合为纯读，不读写 storage', touched === 0, `storage 调用 ${touched} 次`);
  ctx.localStorage = undefined;

  // K7 脏数据不阻断：非对象 / 空值混入时跳过而不是整页崩
  let dirty;
  try { dirty = FP.aggregate({ a: null, b: 'x', c: 42, ...full }); } catch (e) { dirty = null; }
  check('K7', '脏数据被跳过而非抛错', !!dirty && dirty.sessionCount === 2,
    dirty ? `sessionCount=${dirty.sessionCount}（忽略 3 条脏记录）` : '抛错');

  // K8 覆盖率自报：有值的点 / 全部点，用于界面说明"这页有多少是真数据"
  check('K8', '视图自报真实覆盖率', typeof r.coverage === 'number' && r.coverage > 0 && r.coverage <= 1,
    r.coverage != null ? `coverage=${r.coverage}` : '无 coverage');
}

console.log('\n' + '='.repeat(60));
console.log(fail.length ? `M2 TDD ${pass} PASS / ${fail.length} FAIL：${fail.join(',')}` : `M2 TDD 全绿 ${pass} 项`);
process.exit(fail.length ? 1 : 0);

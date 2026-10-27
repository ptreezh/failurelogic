#!/usr/bin/env node
/**
 * verify-all.mjs — 一条命令跑完全部验收脚本并给出统一红/绿。
 *
 * FailureLogic-Spec v1.2 · P0-5 / T-1（8 个既有）+ T-2/T-4/T-5/T-6/G7（6 个契约）。
 *
 * 14 个脚本 = 8 个既有回归（一行未改）+ 6 个本 Sprint 新增的契约测试：
 *   contract-outcome（G2 终局字段）、adapter-ending（G4 文本归一）、
 *   shop-declared（G5 最后一步改写）、shadow-outcome（G3 影子对照 200 局）、
 *   pressure-tier（G6 前九回合档位可反推 + challenger 因果分离）、
 *   option-slot-map（G7 屏幕槽位 = 结算/反馈同源，五场景）。
 * 前四个是秒级失败点，放最前面：让"契约坏了"先响，不必等 150 秒的 UI 回归。
 *
 * 设计约束（不是偏好，是 spec 要求）：
 *  1. 不合并、不改写任何既有脚本的断言口径 —— 本文件只做"调度 + 汇总"，
 *     既有脚本一行不动，失败明细仍由各脚本自己打印。
 *  2. 依赖显式声明：跨脚本的前后关系写成 deps（build-standalone → dist-render-check，
 *     gold-climate → acceptance-climate），共用端口的脚本写成 lock（8481 三兄弟、8262 两个），
 *     调度器按 deps + lock 并行，不再靠数组顺序串成一条线。
 *  3. 以退出码为唯一硬判据（8 个脚本末尾都是 process.exit(fails.length ? 1 : 0)），
 *     输出里的 PASS 标记只作为附加信息，不参与判定、也不做正则猜测。
 *  4. 全绿目标 ≤ 120 s（spec G 门槛）。超时记为 WARN 而非 FAIL：
 *     脚本本身没问题，只是本机慢，写进验收记录即可。
 *  5. 不写仓库临时文件、不碰 localStorage、不起额外端口。
 *
 * 用法：
 *   npm run verify
 *   node scripts/verify-all.mjs --only=gold-climate,dist-render-check
 *   node scripts/verify-all.mjs --skip=acceptance-climate     # 调试用，验收不许跳过
 *   node scripts/verify-all.mjs --verbose
 *   node scripts/verify-all.mjs --jobs=4      # 默认并发 4；锁/依赖自动串行
 *   node scripts/verify-all.mjs --order=fifo  # 退回按声明顺序起跑（对照实验用）
 *   node scripts/verify-all.mjs --heavy=2     # 限制同时跑的重脚本数（核少时才考虑）
 *   node scripts/verify-all.mjs --serial      # 退回逐条串行，排查竞态用
 */

import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// spec 原定 120 s 预算是针对"8 个既有脚本"写的。接入 4 个契约脚本后
// 基准下移到 ~215 s（shadow-outcome 独占 200 局 ≈ 47 s，acceptance-climate ≈ 73 s），
// 再加上 pressure-tier 的 7 局 ≈ 5 s，
// 这里同步放宽到 300 s，仍只是软门槛：超了报 WARN，不改变红绿。
const BUDGET_MS = 300000;

const STEPS = [
  // —— SPEC-v2 · M0 建尺（纯无头 + 基线两条轨；秒级）——
  // 静态轨：解析器全或无 / 台账不漂移 / 棘轮不倒退
  { name: 'm0-tdd', script: 'scripts/m0-tdd.mjs', timeout: 120000 },
  // 基线轨：读 m0-baseline.json 校验五态齐平、可见语义、策略敏感性。
  // 基线由 probe-multistrategy.mjs 离线产出（15 局 ≈ 8 min），不进 CI 同步路径。
  { name: 'm0-tdd:baseline', script: 'scripts/m0-tdd.mjs', args: ['--with-baseline'], timeout: 120000 },
  // —— SPEC-v2 · M1 诊断层回合级（纯无头，秒级）——
  // 强制每个规则原子交代"行为(带回合)/终局状态"，A-2 时序脱钩的守门断言。
  { name: 'm1-tdd', script: 'scripts/m1-tdd.mjs', timeout: 120000 },
  // ── SPEC-v2 · M1 验收对账（读台账+矩阵，秒级）──
  // 单独一条而不是塞进 m1-tdd：m1-tdd 断言的是实现细节，这条断言的是
  // spec §6 的验收条款本身。两者一起坏的时候，要知道是哪一层坏的。
  { name: 'acceptance-m1', script: 'scripts/acceptance-m1.mjs', timeout: 120000 },
  // ── SPEC-v2 · M2 跨局聚合（纯函数，不碰 storage）──
  { name: 'm2-tdd', script: 'scripts/m2-tdd.mjs', timeout: 120000 },
  // ── SPEC-v2 · M3 卫生门禁（先自证判得准，再查仓库）──
  { name: 'gate-hygiene:selftest', script: 'scripts/gate-hygiene.mjs', args: ['--selftest'], timeout: 120000 },
  { name: 'gate-hygiene', script: 'scripts/gate-hygiene.mjs', timeout: 120000 },
  // —— V3 概念命中可信化（纯无头，秒级；坏了先响，不必等浏览器回归）——
  { name: 'debrief-v3-tdd', script: 'scripts/debrief-v3-tdd.mjs', timeout: 120000 },
  { name: 'debrief-disposition', script: 'scripts/debrief-disposition.mjs', timeout: 120000 },
  // S0 教育目标对齐（scripts/s0-education-tdd.mjs）暂不并入本守门器：
  // S0 未完成期间它必然是红的，混进来会让「当前基线是否全绿」失去信号价值。
  // S0 验收通过后再并入。
  // —— 契约层（秒级，最先跑）——
  // P0 术语门禁：局内只留观察、命名归 debrief。纯读 JSON，几百毫秒，
  // 放在契约层最前面 —— 文案回填是最高频的一类漂移，坏了要第一个响。
  { name: 'gate-scenario-lexicon', script: 'scripts/gate-scenario-lexicon.mjs', timeout: 60000 },
  // 姿态可分辨性门禁：一个回合若四选项同档位，玩家侧徽标刻度失效、引擎三项指标
  // 输入失真、posture 对照只能靠兜底硬撑。纯读 JSON，几百毫秒 —— 紧跟术语门禁，
  // 两者都是"数据回填把人写坏"这一类的第一道警报。
  { name: 'gate-posture-coverage', script: 'scripts/gate-posture-coverage.mjs', timeout: 60000 },
  { name: 'contract-outcome', script: 'scripts/contract-outcome.mjs', timeout: 120000 },
  { name: 'adapter-ending', script: 'scripts/adapter-ending.mjs', timeout: 120000 },
  // 与 pressure-tier 共用 8262 端口：调度层用同一把锁，二者不同时跑。
  { name: 'shop-declared', script: 'scripts/shop-declared.mjs', timeout: 300000, lock: 'port-8262' },
  { name: 'shadow-outcome', script: 'scripts/shadow-outcome.mjs', timeout: 300000 },
  { name: 'pressure-tier', script: 'scripts/pressure-tier.mjs', timeout: 300000, lock: 'port-8262' },
  { name: 'option-slot-map', script: 'scripts/option-slot-map.mjs', timeout: 300000 },
  // —— 既有回归（一行未改）——
  { name: 'gold-climate', script: 'scripts/gold-climate.mjs', timeout: 180000 },
  // 8481 端口三兄弟：各自起 http.server(8481)，同一时刻只允许一个。
  { name: 'acceptance-climate-scar', script: 'scripts/acceptance-climate-scar.mjs', timeout: 120000, lock: 'port-8481' },
  { name: 'acceptance-climate-epilogue', script: 'scripts/acceptance-climate-epilogue.mjs', timeout: 120000, lock: 'port-8481' },
  // 复用 gold-climate 产出的基线预期：显式声明依赖，不再靠数组顺序。
  { name: 'acceptance-climate', script: 'scripts/acceptance-climate.mjs', timeout: 420000, deps: ['gold-climate'], lock: 'port-8481' },
  { name: 'build-standalone', script: 'scripts/build-standalone.mjs', timeout: 120000 },
  { name: 'dist-render-check', script: 'scripts/dist-render-check.mjs', timeout: 180000, deps: ['build-standalone'] },
  { name: 'probe-loop4-ui', script: 'scripts/probe-loop4-ui.mjs', timeout: 180000 },
  // L1-2 的行为探针：A4.7 只能静态证明"源码里出现过撤回字样"，
  // 这里进真浏览器按一次，量"点选不推进 / 撤回留不下痕迹 / 确认才落地"。
  { name: 'probe-choice-gate', script: 'scripts/probe-choice-gate.mjs', timeout: 180000 },
  // L0-2 的行为探针：A4.12 只证明"concerns 指得回目标"（数据层），
  // 这里量仪表真的渲染、真的跟着已提交决策走、且不在选择前预告代价。
  { name: 'probe-goal-tension', script: 'scripts/probe-goal-tension.mjs', timeout: 180000 },
  { name: 'ui-render-assert', script: 'scripts/ui-render-assert.mjs', timeout: 300000 },
  { name: 'viz-assert', script: 'scripts/viz-assert.mjs', timeout: 300000 },
  // debrief-assert 要跑 5 场景 × 10 回合的真实点击 + 5 张 PNG 导出。
  // 空机 148 s，但在 acceptance-climate(76 s)+ui-render(47 s) 之后满负载时可翻倍，
  // 300 s 会误判 timeout。这是"兜住挂死"的阈值，不是性能断言，故放宽到 600 s。
  { name: 'debrief-assert', script: 'scripts/debrief-assert.mjs', timeout: 600000 },
];

const argv = process.argv.slice(2);
const flag = (name) => argv.includes('--' + name);
const opt = (name, fallback = '') => {
  const hit = argv.find((a) => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const VERBOSE = flag('verbose');
const only = opt('only').split(',').filter(Boolean);
const skip = opt('skip').split(',').filter(Boolean);
// 并发度：默认随核数走 —— 每个 Chromium 实例要 2~3 个线程，按"线程数 / 4"
// 给并发，再夹在 [2, 4]：本机（i9-14900HX / 32 线程）= 4，2 核小 CI = 2。
// 实测本机 28 个脚本从 525 s 压到 195 s，且全绿；单脚本耗时与串行持平
// （acceptance-climate 65.8 s vs 串行 126.9 s：串行时前序 Playwright 残留
// 进程压着后序脚本，并发反而更快）。
// --serial 或 --jobs=1 回到"一条一条跑"的旧行为，用于排查竞态。
const SERIAL_MODE = flag('serial');
const AUTO_JOBS = Math.min(4, Math.max(2, Math.floor(os.cpus().length / 4)));
const JOBS = SERIAL_MODE ? 1 : Math.max(1, parseInt(opt('jobs', String(AUTO_JOBS)), 10) || AUTO_JOBS);

/**
 * —— 调度策略：长脚本优先（LPT）+ 重脚本并发上限 ——
 *
 * 并发跑 28 个脚本时，总耗时不是"耗时之和 / jobs"，而是**关键路径**。
 * 起跑顺序若是声明顺序，长脚本往往排在后面：等前面一批短脚本把槽位腾出来，
 * 最长的那条才开始跑，尾部就形成一条没人陪跑的长尾。
 * 反过来先把最长的压上去（longest processing time first），尾部只剩零碎短脚本，
 * makespan 才接近下界。
 *
 * 另一半曾试过"重脚本并发上限"（只放 N 个浏览器同时跑），本机实测是**反效果**：
 * 限制到 2 时 4 个槽位有两格只能塞几秒就完的轻脚本，重脚本却在门口排队，
 * 关键路径反而拉到 85.5s；不限时 44~53s。32 核机器上 4 路 Playwright 并不过载，
 * 所以默认不限制（--heavy=N 保留给核数少的机器，实测后再定）。
 *
 * 排序只决定"谁先跑"，不改变任何断言口径、不改汇总顺序；--order=fifo 退回旧行为。
 */
const ORDER = opt('order', 'lpt') === 'fifo' ? 'fifo' : 'lpt';
// 重脚本判定阈值（秒，经验耗时）。低于它的是纯无头脚本，占不满一个核。
const HEAVY_MIN = Math.max(1, parseFloat(opt('heavy-min', '8')) || 8);
// 默认 = JOBS，即"不额外限制"；设小才会真正卡住重脚本的并发。
const HEAVY_SLOTS = SERIAL_MODE
  ? 1
  : Math.max(1, Math.min(JOBS, parseInt(opt('heavy', String(JOBS)), 10) || JOBS));

/**
 * 经验耗时（秒，本机 jobs=4 实测，随机器浮动）。只用于排序与重轻分级，
 * 不参与红绿判定；量级对就够 —— LPT 只关心相对大小。
 * 改了某个脚本的等待方式后，这里同步改一下即可，忘了也不影响正确性。
 */
const WEIGHT = {
  'debrief-assert': 45,
  'viz-assert': 32,
  'probe-goal-tension': 22,
  'acceptance-climate': 15,
  'probe-choice-gate': 14,
  'ui-render-assert': 13,
  'shadow-outcome': 13,
  'shop-declared': 9,
  'dist-render-check': 7,
  'contract-outcome': 5,
  'adapter-ending': 4.5,
  'gold-climate': 4.5,
  'option-slot-map': 4.3,
  'probe-loop4-ui': 4,
  'acceptance-climate-scar': 3.6,
  'acceptance-climate-epilogue': 2.8,
  'pressure-tier': 2.6,
  'build-standalone': 0.2,
};
for (const s of STEPS) {
  s.weight = WEIGHT[s.name] || 1;
  s.heavy = s.weight >= HEAVY_MIN;
}

/**
 * 串行独占阶段：卫生门禁 + 纯无头秒级断言（合计 ≈ 1.5 s）。
 * 让它们先串行跑完再放并发，是为了让 gate-hygiene 看到的工作区与改造前
 * 完全一致 —— 并发阶段会写 dist/ 等产物，不能让它撞上卫生检查。
 */
const SERIAL_PHASE = new Set([
  'm0-tdd',
  'm0-tdd:baseline',
  'm1-tdd',
  'acceptance-m1',
  'm2-tdd',
  'gate-hygiene:selftest',
  'gate-hygiene',
  'debrief-v3-tdd',
  'debrief-disposition',
  'gate-scenario-lexicon',
]);

const selected = STEPS.filter(
  (s) => (!only.length || only.includes(s.name)) && !skip.includes(s.name)
);

if (!selected.length) {
  console.error('没有匹配到任何脚本，请检查 --only / --skip');
  process.exit(2);
}

if (only.length || skip.length) {
  console.log(`[verify-all] 非完整运行：只跑 ${selected.length}/${STEPS.length} 个脚本（验收不得使用）`);
}
if (JOBS > 1) {
  console.log(`[verify-all] 并发调度：jobs=${JOBS}（串行独占阶段 ${selected.filter((s) => SERIAL_PHASE.has(s.name)).length} 个，其余按依赖/端口锁并行）`);
  console.log(
    `[verify-all] 起跑顺序：${ORDER === 'lpt' ? '长脚本优先 LPT' : '声明顺序 FIFO'}；` +
      `重脚本（≥${HEAVY_MIN}s）并发上限 ${HEAVY_SLOTS}`
  );
}

const pad = (s, n) => String(s).padEnd(n, ' ');
const orderOf = new Map(selected.map((s, i) => [s.name, i + 1]));
const results = [];
const t0 = Date.now();

/**
 * 起一个子进程跑单个脚本，收集输出与耗时。
 * 判定口径与改造前完全一致：退出码为唯一硬判据，超时记为 TIMEOUT。
 */
function execStep(step) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [path.join(ROOT, step.script), ...(step.args || [])], {
      cwd: ROOT,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    // 只留尾部：并行时多个脚本的输出同时回流，全量缓存没有价值还会吃内存。
    const keep = (buf, chunk) => (buf + String(chunk)).slice(-400 * 1024);
    child.stdout.on('data', (d) => (stdout = keep(stdout, d)));
    child.stderr.on('data', (d) => (stderr = keep(stderr, d)));
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {
        /* 进程可能已退出 */
      }
    }, step.timeout);
    child.on('close', (code) => {
      clearTimeout(timer);
      const rc = typeof code === 'number' ? code : -1;
      resolve({
        step,
        ok: !timedOut && rc === 0,
        rc,
        timedOut,
        ms: Date.now() - started,
        stdout,
        stderr,
        tail: lastLines(stdout + (stderr ? '\n[stderr]\n' + stderr : ''), 24),
      });
    });
  });
}

function report(r) {
  const idx = orderOf.get(r.step.name);
  const head = `[${idx}/${selected.length}] ${pad(r.step.name, 26)}`;
  const status = r.timedOut
    ? `TIMEOUT >${Math.round(r.step.timeout / 1000)}s`
    : r.ok
      ? 'PASS'
      : `FAIL rc=${r.rc}`;
  results.push(r);
  // 并行时各脚本的启动/完成顺序是乱序的，所以整行一次性落盘，避免行内交错。
  process.stdout.write(`${head} ... ${status}  ${(r.ms / 1000).toFixed(1)}s\n`);
  if (!r.ok) {
    console.log(indent(r.tail, '      '));
  } else if (VERBOSE) {
    console.log(indent(r.tail, '      '));
  }
}

async function main() {
  const serial = selected.filter((s) => SERIAL_PHASE.has(s.name));
  const parallel = selected.filter((s) => !SERIAL_PHASE.has(s.name));
  const done = new Set();
  const locks = new Set();
  const pending = parallel.slice();
  let active = 0;

  // —— 阶段 1：串行独占 ——
  for (const step of serial) {
    report(await execStep(step));
    done.add(step.name);
  }

  // —— 阶段 2：按依赖 + 端口锁并发 ——
  // deps 里出现但没被本次选中的脚本（--only 场景）视为已满足。
  await new Promise((resolve) => {
    let heavyActive = 0;
    const pump = () => {
      while (active < JOBS) {
        // 先把"现在真的能起跑"的都找出来（依赖满足、端口锁空闲），再谈顺序。
        const runnable = [];
        for (let i = 0; i < pending.length; i++) {
          const s = pending[i];
          const depsOk = (s.deps || []).every(
            (d) => done.has(d) || !STEPS.some((x) => x.name === d)
          );
          const lockOk = !s.lock || !locks.has(s.lock);
          if (depsOk && lockOk) runnable.push(i);
        }
        if (!runnable.length) break;

        // 重脚本槽位已满：先拿轻脚本填空，一个浏览器都不多起。
        // 若此刻只剩重脚本可跑，就停在这里等某条跑完回调再泵 —— 不是死锁，
        // 因为 heavyActive >= HEAVY_SLOTS >= 1 意味着 active > 0。
        let pool = runnable;
        if (heavyActive >= HEAVY_SLOTS) {
          const light = runnable.filter((i) => !pending[i].heavy);
          if (!light.length) break;
          pool = light;
        }

        // LPT：同为可跑时先上最长的；耗时相同按声明顺序，保证可复现。
        let pick = pool[0];
        if (ORDER !== 'fifo') {
          for (const i of pool) {
            if (pending[i].weight > pending[pick].weight) pick = i;
          }
        }

        const step = pending.splice(pick, 1)[0];
        active += 1;
        if (step.heavy) heavyActive += 1;
        if (step.lock) locks.add(step.lock);
        execStep(step).then((r) => {
          active -= 1;
          if (step.heavy) heavyActive -= 1;
          done.add(step.name);
          if (step.lock) locks.delete(step.lock);
          report(r);
          pump();
        });
      }
      if (active === 0 && pending.length) {
        // 调度死锁（依赖写错 / 锁写错）：直接点名，别静默挂住。
        console.error(`\n[verify-all] 调度死锁：以下脚本的依赖无法满足 —— ${pending.map((s) => s.name).join(', ')}`);
        process.exit(2);
      }
      if (active === 0 && !pending.length) resolve();
    };
    pump();
  });

  summary();
}

function summary() {
  const totalMs = Date.now() - t0;
  const byName = new Map(results.map((r) => [r.step.name, r]));
  console.log('\n' + '='.repeat(72));
  console.log('verify-all 汇总');
  console.log('='.repeat(72));
  // 按 STEPS 声明顺序输出，不按完成顺序：读表的人关心的是"哪个环节红了"。
  for (const s of selected) {
    const r = byName.get(s.name);
    if (!r) continue;
    const status = r.timedOut ? 'TIMEOUT' : r.ok ? 'PASS   ' : 'FAIL   ';
    const passMarks = (r.stdout.match(/^\s*PASS\b/gm) || []).length;
    const failMarks = (r.stdout.match(/^\s*FAIL\b/gm) || []).length;
    console.log(
      `  ${status} ${pad(r.step.name, 28)} ${pad((r.ms / 1000).toFixed(1) + 's', 9)} ${passMarks}P/${failMarks}F`
    );
  }
  const failed = results.filter((r) => !r.ok);
  console.log('-'.repeat(72));
  console.log(
    `  脚本 ${results.length - failed.length}/${results.length} 通过，总耗时 ${(totalMs / 1000).toFixed(1)}s（jobs=${JOBS}）`
  );
  if (totalMs > BUDGET_MS) {
    console.log(`  WARN 超出 spec 的 ${Math.round(BUDGET_MS / 1000)} s 预算（软门槛，非 FAIL）：${(totalMs / 1000).toFixed(1)}s`);
  }
  console.log('='.repeat(72));

  if (failed.length) {
    console.log('\n失败脚本：');
    failed.forEach((r) => console.log(`  - ${r.step.name}（${r.timedOut ? 'timeout' : 'rc=' + r.rc}）`));
    process.exit(1);
  }

  console.log('\nALL GREEN');
  process.exit(0);
}

main();


function lastLines(text, n) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter((l) => l.trim().length);
  return lines.slice(-n).join('\n');
}

function indent(text, prefix) {
  if (!text) return '';
  return text.split('\n').map((l) => prefix + l).join('\n');
}

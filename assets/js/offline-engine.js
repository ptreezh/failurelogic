/* offline-engine.js — pure frontend fallback for the Cognitive Trap Platform API.
 *
 * When the FastAPI backend is unreachable, this module replicates the core
 * endpoints in-browser so the experience does not degrade to "mock" data.
 *
 * Surface area parity (minimum viable subset):
 *   GET  /scenarios/
 *   GET  /scenarios/{scenario_id}
 *   GET  /scenarios/{scenario_id}/step/{turn_number}
 *   POST /scenarios/create_game_session
 *   POST /scenarios/{game_id}/turn
 *   POST /analysis/thinking-traps
 *
 * All deep scenarios are data-driven from the same JSON files used by the
  * backend, loaded via fetch from assets/data/scenarios/*.json.
 */

(function () {
  'use strict';

  // =========================================================================
  // Data loader
  // =========================================================================
  const SCENARIO_FILES = {
    'challenger-launch': 'assets/data/scenarios/challenger_launch.json',
    'climate-change-policy': 'assets/data/scenarios/climate_change.json',
    'enron-collapse': 'assets/data/scenarios/enron_collapse.json',
    'noodle-shop-community': 'assets/data/scenarios/noodle_shop_community.json',
    'chip-ai-supplychain': 'assets/data/scenarios/chip_ai_supplychain.json',
  };

  const _loaded = {};
  const _loading = {};

  async function loadScenario(id) {
    if (_loaded[id]) return _loaded[id];
    // Single-file build (dist/) inlines every scenario into window.__FL_SCENARIO_DATA__.
    // Opened from file:// or from a dist-only static server, the relative fetch below
    // cannot resolve, which used to leave _loaded empty and made every turn return an
    // empty feedback string with no error in the console. Read the inlined copy first.
    const inlined = (typeof window !== 'undefined' && window.__FL_SCENARIO_DATA__)
      ? window.__FL_SCENARIO_DATA__[id]
      : null;
    if (inlined) {
      _loaded[id] = inlined;
      return inlined;
    }
    if (_loading[id]) return _loading[id];
    const url = SCENARIO_FILES[id];
    if (!url) throw new Error('Unknown scenario: ' + id);
        const promise = fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load scenario data: ' + r.status);
        return r.json();
      })
      .then(data => {
        _loaded[id] = data;
        return data;
      });
    _loading[id] = promise;
    return promise;
  }

  // =========================================================================
  // Escaping / sanitizing
  // =========================================================================
  function escapeJustification(text, maxLength) {
    maxLength = maxLength || 200;
    if (text == null) return null;
    text = String(text).trim().slice(0, maxLength);
    if (!text) return null;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // =========================================================================
  // Generic helpers
  // =========================================================================
  function clamp(val, min, max) {
    if (val == null) return min;
    return Math.max(min, Math.min(max, val));
  }

  function findStep(data, turnNumber) {
    const steps = data.steps || [];
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].turn === turnNumber) return steps[i];
    }
    return null;
  }

  function findOption(step, optionId) {
    if (!step || !step.options) return null;
    for (let i = 0; i < step.options.length; i++) {
      if (step.options[i].id === optionId) return step.options[i];
    }
    return null;
  }

  function applyEffects(state, effects) {
    if (!effects) return;
    for (const key in effects) {
      if (!effects.hasOwnProperty(key)) continue;
      const value = effects[key];
      if (key === 'outcome') {
        state.outcome = value;
        continue;
      }
      // The scenario files disagree on spelling: four of them queue a delay as
      // `consequence_deferred_queue`, the launch scenario writes
      // `consequence_deferred`. Only the first spelling was ever consumed, so
      // the launch scenario's delayed consequences were dead data — planted in
      // the JSON, never fired, never shown. Funnel both into the queue.
      if (key === 'consequence_deferred') {
        const list = Array.isArray(value) ? value : [value];
        state.consequence_deferred_queue = state.consequence_deferred_queue || [];
        state.deferred_ledger = state.deferred_ledger || [];
        list.forEach((v) => {
          if (!v) return;
          state.consequence_deferred_queue.push(v);
          state.deferred_ledger.push({
            key: String(v),
            source_turn: state.turn_number || 1,
            resolved_turn: null
          });
        });
        continue;
      }
      if (!(key in state)) {
        state[key] = value;
        // First-ever deferred consequence: the field doesn't exist yet, so the
        // array branch below never runs. Record provenance here too.
        if (key === 'consequence_deferred_queue') {
          state.deferred_ledger = state.deferred_ledger || [];
          const seeded = Array.isArray(value) ? value : [value];
          seeded.forEach((v) => {
            if (v) {
              state.deferred_ledger.push({
                key: String(v),
                source_turn: state.turn_number || 1,
                resolved_turn: null
              });
            }
          });
        }
        continue;
      }
      const current = state[key];
      if (typeof current === 'number') {
        state[key] = current + value;
      } else if (Array.isArray(current) && key === 'consequence_deferred_queue') {
        current.push(value);
        // V2: a deferred consequence is only instructive if the player can see
        // *when it was planted*. The queue itself stays a plain string array
        // (old saves keep working); the provenance lives in a side ledger that
        // the UI reads to draw the causal chain.
        state.deferred_ledger = state.deferred_ledger || [];
        if (value) {
          state.deferred_ledger.push({
            key: String(value),
            source_turn: state.turn_number || 1,
            resolved_turn: null
          });
        }
      } else if (typeof current === 'string' && key === 'credit_rating') {
        // leave string ratings alone
      } else {
        state[key] = value;
      }
    }
  }

  // =========================================================================
  // Bias detection (ported from challenger_scenario.py)
  // =========================================================================
  function detectPatterns(state) {
    const patterns = [];
    patterns.push(detectConfirmationBias(state));
    patterns.push(detectSingleTargetOptimization(state));
    patterns.push(detectTimeDelayBlindness(state));
    patterns.push(detectSideEffectNeglect(state));
    patterns.push(detectLackOfSelfCriticism(state));
    patterns.push(detectSelfReference(state));
    patterns.push(detectRegulationLag(state));
    patterns.push(detectNonlinearThreshold(state));
    return patterns.filter(Boolean);
  }

  function detectConfirmationBias(state) {
    const accepted = state.accepted_risks_count || 0;
    const ignored = state.ignored_warnings_count || 0;
    if (accepted >= 3 && ignored >= 2) {
      return {
        pattern_type: 'confirmation_bias',
        dorner_concept: '自我确认循环',
        evidence: '你接受了 ' + accepted + ' 次风险评估结论，忽视了 ' + ignored + ' 次具体警告。Dörner 称为“自我确认循环”。',
        reflection_questions: [
          '对每一份工程警告，你给予了同等权重吗？',
          '当数据与你的假设冲突时，你修改了假设还是修改了数据？',
        ],
      };
    }
    return null;
  }

  function detectSingleTargetOptimization(state) {
    const scheduleCurrent = state.schedule_pressure != null ? state.schedule_pressure : 100;
    const engineerCurrent = state.engineer_confidence != null ? state.engineer_confidence : 100;
    const unresolved = state.risk_acknowledged_unresolved || 0;
    const initialSchedule = state._initial_schedule_pressure != null ? state._initial_schedule_pressure : 60;
    const initialEngineer = state._initial_engineer_confidence != null ? state._initial_engineer_confidence : 75;
    const scheduleOptimized = (initialSchedule - scheduleCurrent) >= 10;
    const engineerDamaged = (initialEngineer - engineerCurrent) >= 10;
    if (scheduleOptimized && (engineerDamaged || unresolved >= 2)) {
      return {
        pattern_type: 'single_target_optimization',
        dorner_concept: '单目标优化',
        evidence: '你将进度压力从 ' + initialSchedule + ' 优化到 ' + scheduleCurrent + '，但工程师信心从 ' + initialEngineer + ' 降到 ' + engineerCurrent + '。',
        reflection_questions: [
          '进度降低真的让你“赢”了吗？',
          '你牺牲的工程师信心，未来还能恢复吗？',
        ],
      };
    }
    return null;
  }

  function detectTimeDelayBlindness(state) {
    const decisionHistory = state.decision_history || [];
    const earlyDecisions = decisionHistory.filter(d => (d.turn || 99) <= 4);
    if (earlyDecisions.length < 3) return null;
    const choseDelay = earlyDecisions.some(d => {
      const text = String(d.option_text || d.decisions && d.decisions.option || '');
      return /推迟|测试|数据/.test(text);
    });
    if (!choseDelay) {
      return {
        pattern_type: 'time_delay_blindness',
        dorner_concept: '时间延迟误判',
        evidence: '你在前 4 个回合中没有一次选择“延期测试”或“要求更多数据”。',
        reflection_questions: [
          '你为什么这么着急做出“按时发射”的决定？',
          '哪些“紧急情况”其实是 6 个月前决定的延迟后果？',
        ],
      };
    }
    return null;
  }

  function detectSideEffectNeglect(state) {
    const decisionHistory = state.decision_history || [];
    const justifications = {};
    decisionHistory.forEach(d => {
      const j = d.justification;
      if (j) justifications[String(d.turn || '')] = j;
    });
    const stateJustifications = state.decision_justifications || {};
    Object.keys(stateJustifications).forEach(k => { justifications[k] = stateJustifications[k]; });
    const total = Object.keys(justifications).length;
    if (total < 5) return null;
    const sideEffectKeywords = ['影响', '另一方', '团队', '未来', '后续', '副作用', 'Boisjoly', 'Thiokol', '工程师', '管理层'];
    const acknowledged = Object.values(justifications).filter(j => sideEffectKeywords.some(kw => String(j).indexOf(kw) !== -1)).length;
    if (acknowledged <= Math.max(1, Math.floor(total / 4))) {
      return {
        pattern_type: 'side_effect_neglect',
        dorner_concept: '副作用忽视',
        evidence: '你在 ' + total + ' 个决策中写了理由，但只有 ' + acknowledged + ' 个提到了副作用或多方影响。',
        reflection_questions: [
          '在你最近的决策中，你考虑了哪些“非主要”影响？',
          '你的决策可能改变了哪些你没想到的群体？',
        ],
      };
    }
    return null;
  }

  function detectLackOfSelfCriticism(state) {
    const decisionHistory = state.decision_history || [];
    if (decisionHistory.length < 6) return null;
    let firstRevealTurn = null;
    [5, 6, 8, 10].forEach(t => {
      if (decisionHistory.some(d => d.turn === t) && firstRevealTurn == null) firstRevealTurn = t;
    });
    if (firstRevealTurn == null) return null;
    const postReveal = decisionHistory.filter(d => (d.turn || 0) > firstRevealTurn);
    if (postReveal.length < 2) return null;
    const postRevealRiskAccepts = postReveal.reduce((sum, d) => {
      const effects = d.applied_effects || {};
      return sum + (effects.accepted_risks_count || 0);
    }, 0);
    if (postRevealRiskAccepts >= 1) {
      return {
        pattern_type: 'lack_of_self_criticism',
        dorner_concept: '自我批评缺失',
        evidence: '系统在第 ' + firstRevealTurn + ' 回合揭示了你的偏差模式，但你在接下来的 ' + postReveal.length + ' 个决策中仍在接受风险。',
        reflection_questions: [
          '知道偏差后，你为什么还是这样选？',
          '如果你不能让自己的行为改变，知道这些有什么用？',
        ],
      };
    }
    return null;
  }

  function detectSelfReference(state) {
    const decisionHistory = state.decision_history || [];
    if (decisionHistory.length < 2) return null;
    const managementSuppressions = decisionHistory.filter(d =>
      (d.expected_concerns_addressed || []).indexOf('management') !== -1 &&
      (d.expected_concerns_addressed || []).indexOf('engineering') === -1
    );
    const recentEngineering = decisionHistory.slice(-4).filter(d =>
      (d.expected_concerns_addressed || []).indexOf('engineering') !== -1
    );
    if (managementSuppressions.length >= 2 && recentEngineering.length > 0) {
      return {
        pattern_type: 'self_reference',
        dorner_concept: '自指循环',
        evidence: '你在 ' + managementSuppressions.length + ' 个决策中站在管理层一边，同时绕过了 ' + recentEngineering.length + ' 个最近的工程担忧。',
        reflection_questions: [
          '你的“接受管理层”决策是否影响了工程师的发言权？',
          '如果你的决策让管理层“更有信心”，下次工程师的警告会被如何对待？',
        ],
      };
    }
    return null;
  }

  function detectRegulationLag(state) {
    const decisionHistory = state.decision_history || [];
    if (decisionHistory.length < 4) return null;
    const safeWeights = new Set(['extreme_safe', 'safe']);
    const riskWeights = new Set(['extreme_risk', 'risky']);
    const recent = decisionHistory.slice(-5);
    const directions = recent.map(d => {
      const w = d.weight || d.option_weight || '';
      if (safeWeights.has(w)) return 'safe';
      if (riskWeights.has(w)) return 'risk';
      return 'neutral';
    });
    let changes = 0;
    for (let i = 1; i < directions.length; i++) {
      if (directions[i] !== directions[i - 1] && directions[i] !== 'neutral' && directions[i - 1] !== 'neutral') {
        changes++;
      }
    }
    const nonNeutral = directions.filter(d => d !== 'neutral').length;
    if (changes >= 3 && nonNeutral >= 4) {
      return {
        pattern_type: 'regulation_lag',
        dorner_concept: '调节滞后',
        evidence: '你在最近 ' + directions.length + ' 个决策中有 ' + changes + ' 次方向切换。Dörner 称为“调节滞后”。',
        reflection_questions: [
          '你的最近几个决策是在“修正”前一个，还是在“回应”新信息？',
          '你的控制是“前瞻”的，还是“追着系统跑”的？',
        ],
      };
    }
    return null;
  }

  function detectNonlinearThreshold(state) {
    const temp = state.temperature_forecast_f;
    if (temp == null || temp > 32) return null;
    const ignored = state.ignored_warnings_count || 0;
    if (ignored < 1) return null;
    return {
      pattern_type: 'nonlinear_threshold',
      dorner_concept: '非线性阈值',
      evidence: '预报温度 ' + temp + '°F 已进入 O 型环临界区(≤32°F)。Boisjoly 1985 备忘录警告:温度每下降 10°F,失效概率不是×2,而是指数级放大。',
      reflection_questions: [
        '如果风险不是线性增长,而是临界点之后指数级爆发,你的模型对吗?',
        '在临界点附近做“安全边际”评估,1°F 的差距代表多少额外风险?',
      ],
    };
  }

  // =========================================================================
  // Shared reveal core: interpolate every placeholder or refuse to print it.
  // A reveal that says "{primary_focus}" teaches nothing; a reveal that says
  // "你 2 次选择了等待/暂停（Turn 4、Turn 7）" cannot be argued with.
  // =========================================================================
  const _FL_KW = {
    linear: ['线性', '渐进', '逐步', '按计划', '旧斜率', '维持现状', '按原路线'],
    delay: ['等待', '暂停', '暂缓', '观察', '暂不', '之后再', '选举后', '推迟', '缓一缓', '拖到'],
    avoid_reflect: ['暂不回应', '维持', '不改', '继续推进', '拒绝反思', '先不管'],
    lag: ['等', '之后', '再调整', '公开后', '稳定后'],
    aggressive: ['全面', '立即', '紧急', '全力', '强行', '一刀切', '加杠杆'],
    honest: ['承认', '反思', '修正', '审计', '披露', '公开', '承担责任', '配合调查'],
  };

  function _flHistory(state, upToTurn) {
    return (state.decision_history || []).filter(function (d) {
      return (d && typeof d.turn === 'number') ? (upToTurn == null || d.turn <= upToTurn) : true;
    });
  }

  function _flHit(history, kws) {
    return history.filter(function (d) {
      const t = String(d.option_text || '');
      return kws.some(function (k) { return t.indexOf(k) >= 0; });
    });
  }

  // Turn a raw applied_effects object into a plain reading of the numbers.
  // Never reuse the designers' shorthand (hints / F-codes) inside player-facing text.
  function _flEffectLine(effects, scenarioId) {
    if (!effects || typeof effects !== 'object') return '';
    const meta = SCENARIO_METRICS[scenarioId] || {};
    const rows = [];
    Object.keys(effects).forEach(function (k) {
      const v = effects[k];
      if (typeof v !== 'number' || !isFinite(v) || Math.abs(v) < 1e-9) return;
      const m = meta[k];
      const label = m ? m.label : k;
      const unit = m && m.unit ? m.unit : '';
      rows.push(label + ' ' + (v > 0 ? '+' : '') + _flFmt(v, m ? m.dec : 2) + unit);
    });
    return rows.join('，');
  }

  function _flDeteriorated(state, scenarioId) {
    const meta = SCENARIO_METRICS[scenarioId] || {};
    const init = (_loaded[scenarioId] || {}).initialState || {};
    const names = [];
    Object.keys(meta).forEach(function (k) {
      const cur = _flMetric(state, k), iv = init[k];
      if (cur == null || typeof iv !== 'number') return;
      const m = meta[k];
      const worse = (m.good > 0) ? (cur < iv - 1e-9) : (cur > iv + 1e-9);
      if (worse) names.push(m.label);
    });
    return names;
  }

  // The metric the player actually pushed hardest on, by absolute effect size,
  // plus an honest count of everything that got worse than the opening state.
  function _flFocusInfo(state, scenarioId) {
    const meta = SCENARIO_METRICS[scenarioId] || {};
    const init = (_loaded[scenarioId] || {}).initialState || {};
    const accum = {};
    (state.decision_history || []).forEach(function (d) {
      const e = d.applied_effects || {};
      Object.keys(e).forEach(function (k) {
        if (typeof e[k] === 'number') accum[k] = (accum[k] || 0) + e[k];
      });
    });
    let top = null;
    Object.keys(accum).forEach(function (k) {
      const a = Math.abs(accum[k]);
      if (!top || a > top.abs) top = { key: k, abs: a, sum: accum[k] };
    });
    const label = (top && meta[top.key]) ? meta[top.key].label : (top ? top.key : '少数几个指标');
    const dec = (top && meta[top.key]) ? meta[top.key].dec : 0;
    const unit = (top && meta[top.key]) ? meta[top.key].unit : '';
    let live = 0;
    Object.keys(meta).forEach(function (k) {
      if (_flMetric(state, k) != null && typeof init[k] === 'number') live++;
    });
    const worse = _flDeteriorated(state, scenarioId);
    return {
      primary: { label: label, delta: top ? top.sum : 0, dec: dec, unit: unit },
      neglected: Math.max(1, live - 1),
      worseCount: worse.length,
      worseNames: worse,
    };
  }

  function _flBuildCtx(state, data, step, turnNumber, scenarioId) {
    const history = _flHistory(state, turnNumber - 1);
    const delayHits = _flHit(history, _FL_KW.delay);
    const linearHits = _flHit(history, _FL_KW.linear);
    const avoidHits = _flHit(history, _FL_KW.avoid_reflect);
    const lagHits = _flHit(history, _FL_KW.lag);
    const honestHits = _flHit(history, _FL_KW.honest);
    const focus = _flFocusInfo(state, scenarioId);
    const init = (_loaded[scenarioId] || {}).initialState || {};
    const revealCount = (data.steps || []).filter(function (s) { return s.is_pattern_reveal && s.turn <= turnNumber; }).length;
    // longest streak of identical option letters
    let streak = 0, cur = null, best = 0;
    history.forEach(function (d) {
      if (d.option_id === cur) { streak++; } else { cur = d.option_id; streak = 1; }
      if (streak > best) best = streak;
    });
    const offBalance = state.off_balance_sheet_exposure_usd_m;
    return {
      turns: history.length,
      linear_count: linearHits.length,
      delay_count: delayHits.length,
      time_delay_count: delayHits.length,
      self_criticism_count: avoidHits.length,
      f1_count: linearHits.length,
      f8_count: lagHits.length,
      warning_count: revealCount,
      reveals: revealCount,
      count: delayHits.length,
      n: Math.max(delayHits.length, linearHits.length, avoidHits.length, best),
      lag: lagHits.length,
      avg_lag: lagHits.length,
      cj_score: (state.climate_justice_index != null ? state.climate_justice_index : '—'),
      gdp: (state.gdp_growth_pct != null ? state.gdp_growth_pct : '—'),
      x: (offBalance != null ? Math.round(offBalance / 100) : '—'),
      p: (state.perception_bias != null ? state.perception_bias : '—'),
      focus: focus.primary.label,
      focus_change: (focus.primary.delta > 0 ? '+' : '') + _flFmt(focus.primary.delta, focus.primary.dec),
      neglected: focus.neglected,
      worse_count: focus.worseCount,
      worse_names: focus.worseNames.slice(0, 3).join('、') || '暂未出现',
      reveal_turn: turnNumber,
      turn: turnNumber,
      delay_turns: delayHits.map(function (d) { return 'Turn ' + d.turn; }).join('、') || '（无）',
      honest_count: honestHits.length,
    };
  }

  // Templates that assert a causal reading ("you optimised X while ignoring 8
  // dimensions") cannot be number-filled safely: the slot values are guesses,
  // so the sentence would be a fabricated fact. Only pure counting slots are
  // trusted; everything else is replaced by a measurable statement.
  const _FL_UNTRUSTED_SLOTS = ['focus', 'focus_change', 'neglected', 'cj_score', 'gdp', 'x', 'p', 'lag', 'avg_lag'];
  function _flTemplateTrusted(text) {
    const slots = String(text || '').match(/\{([a-zA-Z_][\w]*)\}/g) || [];
    for (let i = 0; i < slots.length; i++) {
      const k = slots[i].replace(/[{}]/g, '');
      if (_FL_UNTRUSTED_SLOTS.indexOf(k) >= 0) return false;
    }
    return true;
  }

  function _flFillTemplate(text, ctx) {
    if (!text) return { text: '', ok: false };
    let missing = false;
    const out = String(text).replace(/\{([a-zA-Z_][\w]*)\}/g, function (_, k) {
      if (ctx[k] === undefined || ctx[k] === null || ctx[k] === '') { missing = true; return '{' + k + '}'; }
      return String(ctx[k]);
    });
    return { text: out, ok: !missing };
  }

  function _flPatternKey(label, patterns) {
    if (patterns[label]) return label;
    const m = String(label).match(/^F(\d)/i);
    if (m) {
      const prefix = 'F' + m[1] + '_';
      const keys = Object.keys(patterns);
      for (let i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(prefix) === 0) return keys[i];
      }
    }
    return null;
  }

  // Real, countable statement used when a template cannot be filled.
  function _flFallbackEvidence(key, ctx, pattern) {
    if (key === 'F2_time_delay' || key === 'time_delay_blindness') {
      return '在你已做的 ' + ctx.turns + ' 个决策里，有 ' + ctx.delay_count + ' 个选择了等待/暂停/延后（' + ctx.delay_turns + '）。' +
             '这些选择的代价不会在本回合出现，但会出现在后面某一回合。';
    }
    if (key === 'F8_regulation_lag') {
      return '在你已做的 ' + ctx.turns + ' 个决策里，有 ' + ctx.f8_count + ' 个把改变推到"之后/公开后/稳定后"。' +
             '调节滞后不是不行动，而是在系统已经开始变化之后才行动。';
    }
    if (key === 'F1_nonlinear') {
      return '在你已做的 ' + ctx.turns + ' 个决策里，有 ' + ctx.linear_count + ' 个默认了"变化是渐进的"。' +
             'Dörner 的要点是：在临界点附近，同样的努力换不回同样的结果。';
    }
    if (key === 'F5_single_target' || key === 'single_target_optimization') {
      return '你的决策累计推动最大的维度是' + ctx.focus + '（合计 ' + ctx.focus_change + '）。' +
             '到目前，比开局变差的维度有 ' + ctx.worse_count + ' 个' +
             (ctx.worse_count ? '：' + ctx.worse_names : '') + '。' +
             '单目标优化不是"选错了目标"，而是你没有给其他 ' + ctx.neglected + ' 个维度分配过任何一次决策。';
    }
    if (key === 'F4_side_effects') {
      return '你现在比开局更差的维度是 ' + ctx.worse_count + ' 个（' + ctx.worse_names + '）。' +
             '你的每一个"中性"选择都在这几个维度上留下了痕迹——只是它们不在你的汇报材料第一页。';
    }
    if (key === 'F7_self_criticism') {
      return '你在 ' + ctx.reveals + ' 个揭示节点中，有 ' + ctx.self_criticism_count + ' 次选择维持原策略、暂不回应。' +
             '（明确的自我修正次数：' + ctx.honest_count + ' 次。）';
    }
    return '本局你共做了 ' + ctx.turns + ' 个决策，可复核的原始记录见上方"你的决策回顾"。';
  }


  // ---------------------------------------------------------------
  // Loop 2 · "you did the same thing every turn" was being printed as
  // a diagnosis no matter what the player actually did, and it was
  // printed even when the player had every right to be consistent.
  // Consistency and rigidity are different claims:
  //   - consistency: the direction of your choices barely changed;
  //   - rigidity:    after the game told you what pattern you were in,
  //                  the next two turns still moved in the same direction.
  // Only the second one is a Dörner failure. A player who heard the
  // reveal and then turned is consistent *and* self-correcting.
  // ---------------------------------------------------------------
  var _FL_BOLD_KW = ['全面禁煤', '立即归零', '紧急', '全面禁止', '1.5°C抢救', '激进', '强制', '一次性', '立刻'];
  var _FL_CAUTIOUS_KW = ['推迟', '等待', '观察', '暂缓', '延后', '分阶段', '试点', '审慎', '维持', '再评估'];

  // Consistency has to be read off what a decision *did*, not off how it was
  // worded. The old classifier matched vocabulary ("立即", "暂缓"), which meant
  // three different decrees that all poured money into the same build-out
  // could be filed as three different strategies - and the diagnosis then
  // blamed the player for being inconsistent when they had been perfectly
  // steady. Classification is now effect-based, with the wording only as a
  // fallback for scenarios that do not expose applied_effects.
  function _flNum(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return (typeof n === 'number' && !isNaN(n)) ? n : 0;
  }

  function _flChoiceClass(entry) {
    // The authoring layer already tags each option with the posture it asks of
    // the player (safe / extreme_safe / neutral / risky / extreme_risk). That
    // tag is stable across turns, unlike the effect keywords: turn 4 might be a
    // renewables turn and turn 5 a trust turn, so two decisions that came from
    // the same posture can still move completely different meters. Reading the
    // tag first is what makes "consistency" mean consistency of behaviour.
    var w = String((entry && entry.option_weight) || '').toLowerCase();
    if (w === 'safe' || w === 'extreme_safe') return 'cautious';
    if (w === 'risky' || w === 'extreme_risk') return 'bold';
    if (w === 'neutral') return 'balanced';
    var eff = entry && entry.applied_effects;
    if (eff && typeof eff === 'object') {
      var renew = _flNum(eff.renewable_share_pct);
      var gdp = _flNum(eff.gdp_growth_pct);
      var tp = _flNum(eff.tipping_point_proximity);
      // 推进型：真把资源压到转型上 —— 可再生推进、让出增长、或压低 tipping 水位
      if (renew >= 8 || gdp <= -2.5 || tp <= -4) return 'bold';
      // 回避型：没有结构性投入，也没有付出，只靠维持换短期指标
      if (renew <= 0.5 && gdp >= 0 && tp >= 0) return 'cautious';
      return 'balanced';
    }
    var t = String((entry && entry.option_text) || '');
    var bold = _FL_BOLD_KW.some(function (k) { return t.indexOf(k) >= 0; });
    var caut = _FL_CAUTIOUS_KW.some(function (k) { return t.indexOf(k) >= 0; });
    if (bold && !caut) return 'bold';
    if (caut && !bold) return 'cautious';
    return 'balanced';
  }

  function _flDiagnoseBehavior(state, data, turnNumber) {
    var history = (state.decision_history || []).slice();
    var n = history.length;
    if (!n) {
      return { consistency: 0, main_class: 'none', switches: 0, rigid: false,
               label: '无策略', detail: '本局还没有可诊断的决策。' };
    }
    var counts = { bold: 0, cautious: 0, balanced: 0 };
    history.forEach(function (h) { counts[_flChoiceClass(h)]++; });
    var main = 'balanced';
    Object.keys(counts).forEach(function (k) { if (counts[k] > counts[main]) main = k; });
    var consistency = counts[main] / n;

    // 揭示回合：游戏第一次把模式告诉你之后，你接下来两回合有没有转向
    var revealTurns = (data.steps || [])
      .filter(function (x) { return x.is_pattern_reveal && x.turn <= turnNumber; })
      .map(function (x) { return x.turn; });
    // A turn only counts as evidence of self-correction if the player actually
    // had the option to stay on course. Some turns simply do not offer a
    // same-posture option; turning there is the scenario forcing the hand, not
    // the player refusing to re-examine. Counting those as "switches" made a
    // steady player look corrected (or a corrected player look steady) purely
    // because of which turn the reveal happened to land on.
    var _classHasOption = function (turn, cls) {
      var st = (data.steps || []).filter(function (x) { return x.turn === turn; })[0];
      if (!st || !Array.isArray(st.options)) return true;
      return st.options.some(function (o) { return _flChoiceClass({ option_weight: o.weight }) === cls; });
    };
    var switches = 0, checked = 0;
    revealTurns.forEach(function (rt) {
      var before = history.filter(function (h) { return h.turn === rt; })[0];
      if (!before) return;
      var baseClass = _flChoiceClass(before);
      [rt + 1, rt + 2].forEach(function (t) {
        var after = history.filter(function (h) { return h.turn === t; })[0];
        if (!after) return;
        if (!_classHasOption(t, baseClass)) return;   // no same-posture option: forced, not a switch
        checked++;
        if (_flChoiceClass(after) !== baseClass) switches++;
      });
    });

    var rigid = consistency >= 0.6 && checked > 0 && switches === 0;
    var label, detail;
    var pct = Math.round(consistency * 100);
    if (rigid) {
      label = '策略僵硬';
      detail = '你的 ' + n + ' 个决策里 ' + counts[main] + ' 个同属一类（一致性 ' + pct + '%）。' +
        '关键不在一致，而在于：游戏在 Turn ' + revealTurns.join('/') + ' 把模式告诉你之后，' +
        '你在接下来的 ' + checked + ' 次仍有同类选项的选择里一次都没有转向。' +
        '——这是 F7 自我批评缺失的判据：不是"你坚持了"，是"你被告知之后仍然没有重新检查"。';
    } else if (consistency >= 0.6 && switches > 0) {
      label = '策略一致 · 会修正';
      detail = '你的 ' + n + ' 个决策里 ' + counts[main] + ' 个同属一类（一致性 ' + pct + '%），' +
        '但在揭示之后你改变了 ' + switches + '/' + checked + ' 次选择方向。' +
        '这是健康的一致：方向稳定，收到新信息会调整。不要把它读成"僵硬"。';
    } else {
      label = '策略分散';
      detail = '你的选择没有形成主线（最高一类只占 ' + pct + '%）：' +
        '长期在 ' + Object.keys(counts).filter(function (k) { return counts[k]; })
          .map(function (k) { return k + ' ' + counts[k]; }).join('、') + ' 之间摆动。' +
        '这谈不上僵硬——但每次改方向都是换目标，而不是修正做法，代价一样会累积。';
    }
    return { consistency: consistency, main_class: main, switches: switches,
             checked: checked, rigid: rigid, label: label, detail: detail };
  }

  function _flDiagnosisBlock(state, data, turnNumber) {
    var d = _flDiagnoseBehavior(state, data, turnNumber);
    var lines = ['【行为诊断 · 一致性 vs 僵硬】', '  ' + d.label];
    lines.push('  ' + d.detail);
    return lines.join('\n');
  }

  function buildRevealFeedback(state, step, turnNumber, data, scenarioId) {
    const tmpl = step.pattern_reveal_template || {};
    const patterns = data.feedback_patterns || {};
    const ctx = _flBuildCtx(state, data, step, turnNumber, scenarioId);
    const phase = tmpl.round || step.reveal_phase || 1;
    const parts = [];

    parts.push('【模式揭示 · 第 ' + phase + ' 阶段 · 你已完成 ' + ctx.turns + ' 个决策】');
    parts.push('');

    const history = _flHistory(state, turnNumber - 1);
    if (history.length) {
      parts.push('📌 先看你实际做过的选择（不是你以为你做过的）：');
      history.slice(-4).forEach(function (d) {
        parts.push('  Turn ' + d.turn + ' (' + d.option_id + ')：' + _flClamp(d.option_text, 44));
        const eff = _flEffectLine(d.applied_effects, scenarioId);
        if (eff) parts.push('      → ' + eff);
      });
      parts.push('');
    }

    const nar = _flFillTemplate(tmpl.narrative, ctx);
    if (nar.ok) {
      parts.push(nar.text);
    } else {
      parts.push('你前面 ' + ctx.turns + ' 个决策已经形成一种可识别的模式。下面逐条对照你的原始记录。');
    }
    parts.push('');

    (tmpl.biases_revealed || []).forEach(function (label, idx) {
      const key = _flPatternKey(label, patterns);
      const p = key ? patterns[key] : null;
      const concept = p ? (p.dorner_concept || label) : label;
      parts.push('### ' + (idx + 1) + '. ' + concept);
      let ev = '';
      if (p && p.evidence_template && _flTemplateTrusted(p.evidence_template)) {
        const filled = _flFillTemplate(p.evidence_template, ctx);
        if (filled.ok) ev = filled.text;
      }
      if (!ev) ev = _flFallbackEvidence(key || String(label), ctx, p);
      parts.push(ev);
      const qs = (p && p.reflection_questions) || [];
      if (qs.length) {
        parts.push('  问自己：' + qs[0]);
      }
      parts.push('');
    });

    // A reveal turn used to be pure talk: the player was told which bias they
    // had, but not what it cost. Print the numbers here too, so the pattern and
    // the bill arrive together.
    const deltas = _flDeltaLines(state, scenarioId, 4);
    if (deltas.length) {
      parts.push('【这几回合的数字变化】');
      deltas.forEach(function (l) { parts.push('  ' + l); });
      parts.push('');
    }
    const pendingReveal = _flPendingCost(state, scenarioId);
    if (pendingReveal) {
      parts.push('【还没发生的】' + pendingReveal);
      parts.push('');
    }
    // The reveal turn is where a threshold is usually crossed (leverage, cash,
    // temperature). If it happened here and stayed silent, the player only
    // learns about the wall after hitting it.
    const crossedReveal = _flNewThresholds(state, scenarioId);
    if (crossedReveal.length) {
      parts.push('【越线】');
      crossedReveal.forEach(function (l) { parts.push('  ' + l); });
      parts.push('');
    }

    if (scenarioId === 'climate-change-policy') {
      const capacityReveal = _flClimateCapacityLine(state);
      if (capacityReveal) {
        parts.push(capacityReveal);
        parts.push('');
      }
      const budgetReveal = _flClimateBudgetLine(state);
      if (budgetReveal) {
        parts.push(budgetReveal);
        parts.push('');
      }
    }
    if (scenarioId === 'chip-ai-supplychain') {
      const interestReveal = _flChipInterestLine(state);
      if (interestReveal) {
        parts.push(interestReveal);
        parts.push('');
      }
    }

    parts.push('【这一阶段的唯一要求】不要急着解释你为什么是对的。先回答上面那个问题——写下来，下一回合的反馈会拿它和你的下一个选择对照。');
    return parts.join('\n');
  }

  // =========================================================================
  // Shared educational feedback core (climate / enron / noodle / chip)
  //   Principle: every turn the player must see (1) what they did,
  //   (2) how the world answered, (3) which numbers moved and in which
  //   direction, (4) what has NOT shown up yet. No decorative filler.
  // =========================================================================
  const SCENARIO_METRICS = {
    'climate-change-policy': {
      global_avg_temp_c: { label: '全球升温', unit: '°C', good: -1, dec: 2 },
      co2_ppm: { label: 'CO2 浓度', unit: 'ppm', good: -1, dec: 0 },
      gdp_growth_pct: { label: 'GDP 增长', unit: '%', good: 1, dec: 1 },
      renewable_share_pct: { label: '可再生能源占比', unit: '%', good: 1, dec: 0 },
      climate_justice_index: { label: '气候正义指数', unit: '', good: 1, dec: 0 },
      public_support_pct: { label: '公众支持率', unit: '%', good: 1, dec: 0 },
      whistleblower_silenced_count: { label: '被压制的科学家', unit: '人', good: -1, dec: 0 },
      international_trust: { label: '国际信任度', unit: '', good: 1, dec: 0 },
      tipping_point_proximity: { label: '临界点逼近度', unit: '', good: -1, dec: 0 },
    },
    'enron-collapse': {
      share_price_usd: { label: '股价', unit: '美元', good: 1, dec: 1 },
      reported_earnings_usd_m: { label: '账面利润', unit: '百万美元', good: 1, dec: 0 },
      actual_cashflow_usd_m: { label: '真实现金流', unit: '百万美元', good: 1, dec: 0 },
      off_balance_sheet_exposure_usd_m: { label: '表外敞口', unit: '百万美元', good: -1, dec: 0 },
      analyst_confidence_index: { label: '分析师信心', unit: '', good: 1, dec: 0 },
      whistleblower_silenced_count: { label: '被压制的内部举报人', unit: '人', good: -1, dec: 0 },
      board_oversight_strength: { label: '董事会监督强度', unit: '', good: 1, dec: 0 },
      media_skepticism_index: { label: '媒体质疑指数', unit: '', good: -1, dec: 0 },
    },
    'noodle-shop-community': {
      cash_flow: { label: '现金流', unit: '元', good: 1, dec: 0 },
      monthly_revenue: { label: '月营收', unit: '元', good: 1, dec: 0 },
      reputation: { label: '口碑', unit: '', good: 1, dec: 0 },
      platform_score: { label: '平台评分', unit: '', good: 1, dec: 1 },
      waste_rate: { label: '损耗率', unit: '%', good: -1, dec: 1 },
      inventory_turnover: { label: '库存周转', unit: '', good: 1, dec: 2 },
      staff_fatigue: { label: '员工疲劳度', unit: '', good: -1, dec: 0 },
      service_speed: { label: '出餐速度', unit: '', good: 1, dec: 0 },
      menu_scope: { label: '菜单宽度', unit: '项', good: -1, dec: 0 },
      family_trust: { label: '家人信任', unit: '', good: 1, dec: 0 },
      expansion_pressure: { label: '扩张压力', unit: '', good: -1, dec: 0 },
      debt: { label: '负债', unit: '元', good: -1, dec: 0 },
      net_equity: { label: '净资产', unit: '元', good: 1, dec: 0 },
    },
    'chip-ai-supplychain': {
      cash_flow: { label: '现金流', unit: '百万', good: 1, dec: 0 },
      capacity_utilization: { label: '产能利用率', unit: '%', good: 1, dec: 0 },
      yield_rate: { label: '良率', unit: '%', good: 1, dec: 1 },
      inventory_buffer: { label: '库存缓冲', unit: '天', good: 1, dec: 0 },
      self_reliance: { label: '自主化程度', unit: '', good: 1, dec: 0 },
      supply_chain_risk: { label: '供应链风险', unit: '', good: -1, dec: 0 },
      order_backlog: { label: '订单积压', unit: '', good: 1, dec: 0 },
      debt_ratio: { label: '负债率', unit: '%', good: -1, dec: 1 },
      rnd_budget: { label: '研发预算', unit: '', good: 1, dec: 0 },
      engineer_morale: { label: '工程师士气', unit: '', good: 1, dec: 0 },
      market_share: { label: '市场份额', unit: '%', good: 1, dec: 1 },
      policy_standing: { label: '政策关系', unit: '', good: 1, dec: 0 },
    },
  };

  // "1.5C" is a budget, not a slogan. The run starts at 1.55C and the band
  // closes at 1.85C; without both numbers the player cannot see how much of
  // the budget a decision just spent until the ending grades them on it.
  const CLIMATE_START_TEMP_C = 1.55;
  const CLIMATE_ONE_FIVE_CEILING_C = 1.85;

  // Thresholds fire only once per game (first crossing), so the message
  // keeps its informational value instead of repeating as background noise.
  const SCENARIO_THRESHOLDS = {
    'climate-change-policy': [
      { key: 'global_avg_temp_c', at: 1.5, dir: 'above', msg: '🌡️ 全球升温越过 1.5°C——IPCC 定义的"安全边界"已经失守。' },
      { key: 'global_avg_temp_c', at: 2.0, dir: 'above', msg: '🔥 全球升温越过 2.0°C——小岛国进入"生存倒计时"。' },
      { key: 'co2_ppm', at: 450, dir: 'above', msg: '💨 CO2 越过 450 ppm——1.5°C 路径在物理上被关闭。' },
      { key: 'public_support_pct', at: 40, dir: 'below', msg: '⚠️ 公众支持跌破 40%——政策窗口正在关闭。' },
      { key: 'international_trust', at: 30, dir: 'below', msg: '🌍 国际信任跌破 30——减排联盟开始瓦解。' },
      { key: 'tipping_point_proximity', at: 60, dir: 'above', msg: '🌀 临界点逼近度超过 60——不可逆反馈循环已启动。' },
      { key: 'climate_justice_index', at: 30, dir: 'below', msg: '⚖️ 气候正义指数跌破 30——最脆弱的国家被放弃。' },
      { key: 'whistleblower_silenced_count', at: 2, dir: 'above', msg: '🔇 已压制 2 位以上科学家的警告——你开始为"平稳"付信誉代价。' },
    ],
    'enron-collapse': [
      { key: 'share_price_usd', at: 30, dir: 'below', msg: '💵 股价跌破 30 美元——市场开始用脚投票。' },
      { key: 'share_price_usd', at: 5, dir: 'below', msg: '📉 股价跌破 5 美元——投资级信用已经保不住。' },
      { key: 'actual_cashflow_usd_m', at: -300, dir: 'below', msg: '💰 真实现金流转负超 3 亿美元——流动性危机爆发。' },
      { key: 'off_balance_sheet_exposure_usd_m', at: 20000, dir: 'above', msg: '🕳️ 表外敞口超过 200 亿美元——会计结构已无法自洽。' },
      { key: 'whistleblower_silenced_count', at: 1, dir: 'above', msg: '🔇 第 1 位举报人被压制——沉默开始有价格。' },
      { key: 'board_oversight_strength', at: 30, dir: 'below', msg: '🪑 董事会监督跌破 30——治理机制形同虚设。' },
      { key: 'media_skepticism_index', at: 60, dir: 'above', msg: '📰 媒体质疑指数超过 60——外部审视已经无法回避。' },
    ],
    'noodle-shop-community': [
      { key: 'cash_flow', at: 0, dir: 'below', msg: '💸 现金流跌破 0——你开始用明天的钱付今天的账。' },
      { key: 'waste_rate', at: 12, dir: 'above', msg: '🗑️ 损耗率超过 12%——菜单每多一项，后厨就多一份浪费。' },
      { key: 'staff_fatigue', at: 70, dir: 'above', msg: '😮‍💨 员工疲劳度超过 70——服务质量将先于利润崩塌。' },
      { key: 'platform_score', at: 4.2, dir: 'below', msg: '⭐ 平台评分跌破 4.2——流量排名开始下滑。' },
      { key: 'family_trust', at: 40, dir: 'below', msg: '👨‍👩‍👦 家人信任跌破 40——家里的支持正在被消耗。' },
      { key: 'debt', at: 300000, dir: 'above', msg: '🏦 负债超过 30 万——一次淡季就足以击穿现金流。' },
    ],
    'chip-ai-supplychain': [
      { key: 'cash_flow', at: 0, dir: 'below', msg: '💸 现金流跌破 0——扩张开始靠借来的钱支撑。' },
      { key: 'yield_rate', at: 70, dir: 'below', msg: '🔬 良率跌破 70%——每片晶圆都在亏钱。' },
      { key: 'supply_chain_risk', at: 70, dir: 'above', msg: '⛓️ 供应链风险超过 70——一个环节断供就全线停摆。' },
      { key: 'debt_ratio', at: 60, dir: 'above', msg: '🏦 负债率超过 60%——融资窗口一旦关闭就是死局。' },
      { key: 'engineer_morale', at: 40, dir: 'below', msg: '🧑‍💻 工程师士气跌破 40——核心团队开始流失。' },
      { key: 'inventory_buffer', at: 30, dir: 'below', msg: '📦 库存缓冲低于 30 天——任何物流波动都会传导到产线。' },
    ],
  };

  function _flMetric(state, key) {
    const v = state[key];
    return (typeof v === 'number' && isFinite(v)) ? v : null;
  }

  function _flFmt(v, dec) {
    const d = (dec == null) ? 0 : dec;
    return Number(v).toFixed(d).replace(/\.0+$/, '');
  }

  function _flClamp(s, n) {
    const t = String(s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  }

  function _flRecordPrevMetrics(state, scenarioId) {
    const meta = SCENARIO_METRICS[scenarioId] || {};
    const prev = {};
    Object.keys(meta).forEach(function (k) {
      const v = _flMetric(state, k);
      if (v != null) prev[k] = v;
    });
    state._prev_metrics = prev;
  }

  // Returns human-readable delta lines, biggest absolute change first.
  function _flDeltaLines(state, scenarioId, limit) {
    const meta = SCENARIO_METRICS[scenarioId] || {};
    const prev = state._prev_metrics || null;
    if (!prev) return [];
    const rows = [];
    Object.keys(meta).forEach(function (k) {
      const cur = _flMetric(state, k);
      const old = prev[k];
      if (cur == null || old == null) return;
      const d = cur - old;
      if (Math.abs(d) < 1e-9) return;
      const m = meta[k];
      const better = (m.good > 0) ? d > 0 : d < 0;
      rows.push({
        k: k,
        abs: Math.abs(d),
        text: (better ? '↑ ' : '↓ ') + m.label + ' ' + _flFmt(old, m.dec) + (m.unit ? m.unit : '') +
              ' → ' + _flFmt(cur, m.dec) + (m.unit ? m.unit : '') +
              '（' + (d > 0 ? '+' : '') + _flFmt(d, m.dec) + '，' + (better ? '改善' : '恶化') + '）',
      });
    });
    rows.sort(function (a, b) { return b.abs - a.abs; });
    return rows.slice(0, limit || 4).map(function (r) { return r.text; });
  }

  function _flNewThresholds(state, scenarioId) {
    const list = SCENARIO_THRESHOLDS[scenarioId] || [];
    const prev = state._prev_metrics || {};
    const fired = state._threshold_fired = state._threshold_fired || {};
    const out = [];
    list.forEach(function (t) {
      const cur = _flMetric(state, t.key);
      if (cur == null) return;
      const old = (typeof prev[t.key] === 'number') ? prev[t.key] : null;
      const crossedNow = (t.dir === 'above') ? (cur > t.at && (old == null || old <= t.at))
                                             : (cur < t.at && (old == null || old >= t.at));
      const tag = t.key + '@' + t.at;
      if (crossedNow && !fired[tag]) {
        fired[tag] = true;
        out.push(t.msg);
      }
    });
    return out;
  }

  // Loop 2 cleanup: the earlier "升温预算" version of _flClimateBudgetLine used to
  // live here. Two functions with the same name in one scope meant the dead one
  // was silently overridden by the 【档位判定】 version at the bottom of the file -
  // and its 1.45°C-style hardcoded numbers leaked into the ending check. Removed.

  // Interest used to be invisible: the cash line simply dropped. Name the
  // charge, the rate it was charged at, and the roll-over it caused.
  function _flChipInterestLine(state) {
    const info = state._last_interest;
    if (!info) return '';
    const dr = info.debt_ratio;
    const drTxt = (dr == null) ? '未知' : dr.toFixed(1) + '%';
    if (!(info.interest > 0)) {
      return '【利息】本回合利息支出 0（负债率 ' + drTxt + '，仍在 55% 计息线以下）。';
    }
    let line = '【利息】本回合利息支出 -' + info.interest.toFixed(2) + ' 百万（按决策后的负债率 ' +
               drTxt + ' 计息），滚存再把负债率推高 +' + info.rolled.toFixed(2) + ' 个百分点。';
    if (dr > 70) {
      line += '\n  负债率已过 70%：利息和滚存每回合都在吃现金流，靠砍单补来的现金只是把断点往后挪一个季度。';
    }
    return line;
  }

  function _flPendingCost(state, scenarioId) {
    const meta = SCENARIO_METRICS[scenarioId] || {};
    const init = (_loaded[scenarioId] || {}).initialState || {};
    let worst = null;
    Object.keys(meta).forEach(function (k) {
      const cur = _flMetric(state, k), iv = init[k];
      if (cur == null || typeof iv !== 'number') return;
      const m = meta[k];
      const bad = (m.good > 0) ? (iv - cur) : (cur - iv); // >0 means worse than start
      if (bad > 0 && (!worst || bad > worst.bad)) worst = { k: k, bad: bad, cur: cur, init: iv, m: m };
    });
    if (!worst) return '';
    return worst.m.label + '已经比开局更差（' + _flFmt(worst.init, worst.m.dec) + ' → ' + _flFmt(worst.cur, worst.m.dec) + '），' +
           '而这只是本回合能看见的部分。';
  }

  function buildActionFeedback(state, data, step, turnNumber, scenarioId) {
    const history = state.decision_history || [];
    const last = history[history.length - 1];
    if (!last) return '';
    const parts = [];

    parts.push('【你的选择】' + _flClamp(last.option_text, 60));

    const cr = (step && step.character_reactions) ? step.character_reactions[last.option_id] : '';
    if (cr) parts.push('【立刻发生的反应】' + cr);

    // A delayed decree is not only late, it is weaker. Say the discount out loud
    // so the player can feel that today's political capital is tomorrow's ceiling.
    if (scenarioId === 'climate-change-policy' && typeof state.last_effectiveness === 'number' && state.last_effectiveness < 0.95) {
      const pct = Math.round(state.last_effectiveness * 100);
      parts.push('【执行力折价】公众支持与国际信任只剩这个水平，同样一份法令这次只兑现了 ' + pct +
                 '% 的减排力度。想按同样的幅度推进，代价会比前几年更高。');
    }

    const deltas = _flDeltaLines(state, scenarioId, 4);
    if (deltas.length) {
      parts.push('【数字上的变化】');
      deltas.forEach(function (l) { parts.push('  ' + l); });
      // A yuan figure means nothing to someone running a noodle shop. Convert
      // it into bowls: at roughly 15 yuan of margin a bowl, this is how much
      // extra trade the decision has to earn back.
      if (scenarioId === 'noodle-shop-community') {
        // Use the change the player can see in the line right above, not the
        // raw option delta: rent still ran during the turn, and quoting a bowl
        // count that does not match the yuan figure reads as a bug.
        const prevCf = (state._prev_metrics || {}).cash_flow;
        const curCf = state.cash_flow;
        const cf = (typeof prevCf === 'number' && typeof curCf === 'number')
          ? curCf - prevCf
          : (last.applied_effects || {}).cash_flow;
        if (typeof cf === 'number' && Math.abs(cf) >= 500) {
          const bowls = Math.round(Math.abs(cf) / 15);
          parts.push('  （' + (cf < 0 ? '这笔支出' : '这笔进账') + '约等于 ' + bowls + ' 碗面的净利' +
                     (cf < 0 ? '——要在后面几周多卖这么多碗才补得回来。' : '——相当于白捡了几天的营业额。') + '）');
        }
      }
    }

    if (scenarioId === 'climate-change-policy') {
      const capacity = _flClimateCapacityLine(state);
      if (capacity) parts.push(capacity);
      const budget = _flClimateBudgetLine(state);
      if (budget) parts.push(budget);
    }
    if (scenarioId === 'chip-ai-supplychain') {
      const interest = _flChipInterestLine(state);
      if (interest) parts.push(interest);
    }

    const cons = String(last.option_consequences_for_player || '');
    const m = cons.match(/(但[^；;。]*|后续[^；;。]*|将在[^；;。]*|代价是[^；;。]*)/);
    if (m) {
      parts.push('【还没发生的】' + m[1]);
    } else {
      const deferred = state.consequence_deferred_queue || [];
      if (deferred.length) {
        parts.push('【还没发生的】你有 ' + deferred.length + ' 个延迟后果尚未显现——它们会在后面几回合以"意外"的方式回来。');
      } else {
        const pending = _flPendingCost(state, scenarioId);
        if (pending) parts.push('【还没发生的】' + pending);
      }
    }

    const fired = _flNewThresholds(state, scenarioId);
    if (fired.length) {
      parts.push('【越线】');
      fired.forEach(function (l) { parts.push('  ' + l); });
    }

    if (last.justification) {
      parts.push('【你写的理由】"' + _flClamp(last.justification, 60) + '"');
      parts.push('→ 对照上面的后果：你当时预见到这些了吗？如果没预见到，你漏掉的是哪一环？');
    }

    return parts.join('\n');
  }

  // =========================================================================
  // Feedback generators (ported from challenger_scenario.py / feedback_real.py)
  // =========================================================================
  // ---------------------------------------------------------------------
  // Physical / structural inertia.
  // A model where "doing nothing" is free is not a model of a complex system:
  // every one of these scenarios runs downhill unless the player props it up.
  // The decay is deliberately small per turn (so it is felt, not noticed) and
  // it is included in the numbers the feedback block already prints.
  // ---------------------------------------------------------------------
  // ---------------------------------------------------------------------
  // Loop 2 · climate: implementation debt.
  // A decree is not an outcome. What the state promises in one turn has to be
  // absorbed by an administration of finite capacity; whatever exceeds that
  // capacity does not disappear, it is deferred - and deferred work comes back
  // as a bill (slower build-out, later warming, thinner public patience).
  // Crucially the bill is charged to the *plan*, not to any single choice, so
  // "always pick the greenest option" is not a free lunch.
  // ---------------------------------------------------------------------
  var CLIMATE_DEBT = {
    commitRenew: 1.6,      // per +1pp renewables promised
    commitPublic: 0.5,     // per +1pp public support promised
    commitGdpLoss: 1.2,    // per -1pp GDP given up
    commitTrust: 0.4,      // per +1 international trust promised
    capBase: 4,
    capPerCapacity: 0.30,  // capacity = (support+trust)/2 * this + base
    overGain: 1.2,         // how much over-promise becomes real debt
    prepGain: 0.45,        // share of unused capacity banked for a later push
    prepCap: 14,           // a state can only hold so much headroom
    prepAbsorb: 0.70,      // how much of an over-promise the banked headroom covers
    swingCushion: 0.80,    // banked headroom also cushions the ramp-up itself
    mandateCap: 0.22,      // capacity multiplier at full public mandate
    coordBonus: 0.10,      // delivery bonus at full international coordination
    deliveryLo: 0.78,      // worst realised share of a decreed build-out
    deliveryHi: 1.12,      // best realised share of a decreed build-out
    monoCap: 0.40,         // worst delivery tax for a perfectly uniform line
    monoKnee: 0.70,        // posture share where the tax starts
    monoSlope: 0.10,       // tax per 0.30 of posture share above the knee
    jumpDeadzone: 18,      // ambition swings smaller than this are just noise
    jumpGain: 0.6,        // bigger swings cost (a programme cannot lurch)
    repay: 1.5,            // capacity that becomes free each turn
    renewDrag: 0.55,       // max share of a renewables promise eaten by debt
    renewDragScale: 160,
    tempRegular: 0.0008,   // deferred work => extra warming per turn of debt
    tempLate: 0.0028,      // ... and the bill lands harder in turns 8-10
    supportCost: 0.03,
    fiscalGdp: 0.15,       // T8+ fiscal crowd-out per unit of debt above the grace line
    fiscalSupport: 0.15,   // ... and the same bill in public patience
    fiscalGrace: 6,        // small overhangs are absorbed; a real overhang is not
    // Even a modest decree loses a slice to procurement, permits and local
    // resistance. Without this baseline the capacity formula alone lets a
    // "sensible" run finish with zero deferred work, and the late settlement
    // in T8-T10 never fires for anybody - a hidden cost that never lands is
    // not a hidden cost.
    baseDefer: 0.14,
    driftBase: 0.018,      // fossil-stock inertia per turn at 0% renewables
    driftCoupling: 50,     // debt makes the fossil stock decay slower
    driftFlip: 0.22,       // every unresolved reversal of direction locks in inertia
    bandDebtWorst: 32,     // above this the outcome is an execution collapse
    slackStep: 0.07,       // each turn of headroom raises delivery
    slackCap: 1.55,
    // =====================================================================
    // Loop 4 · the two bills a plan never budgets for
    // =====================================================================
    // 1. The price of not deciding. Doerner's central point: inaction *is* a
    //    decision, but its bill is anonymous and it arrives late. A year of
    //    consultation does not pause the machine - the planning staff is
    //    reassigned, the grid queue is taken by someone else, the contractor
    //    signs elsewhere - so the identical decree buys less next year. The
    //    first quiet year is legitimate preparation; from the second on the
    //    erosion compounds until a cap.
    deferAskFloor: 1.0,    // renewable pp a turn must ask for to not count as delay
    deferSlope: 0.05,      // capacity lost per extra quiet year
    deferCap: 0.22,        // erosion ceiling
    deferGrace: 1,         // quiet years tolerated before erosion starts
    // Loop 7 · the part that does not come back. Erosion above is a discount
    // on this year's decree: resume building and it is 1.0 again. That is not
    // how a planning team works - once it is reassigned and the grid queue is
    // taken, a new budget buys less than the same money would have bought
    // before. The scar is the share of the capacity base that is gone for
    // good, and it only grows; no turn ever gives it back.
    rustGain: 0.24,        // scar deposited per 1.0 of that year's erosion depth
    rustCap: 0.30,         // scar ceiling: never more than 30% of the base
    // 2. Shocks the projection cannot see. Every number the player reads is
    //    computed from *today's* state; the year itself is not today. On these
    //    turns capacity is knocked out after the decree was already announced,
    //    which is precisely why a line needs margin rather than an exact plan.
    shockTurns: [4, 7],
    shockCap: 0.12,        // capacity knocked out on a shock year
    shockDelivery: 0.92,   // ... and the build-out that slips with it
    projectionBand: 2.0,   // honest uncertainty of the debt projection (± debt pts)
    // 3. The promise that was not kept. A decree is a promise of pp of
    //    build-out; what the year delivers is less whenever a crew, a permit or
    //    a shipment slips. The gap does not vanish - it is precisely the
    //    deferred work the debt meter is supposed to count. Without this link
    //    the projection is arithmetic dressed up as a forecast: exact to the
    //    decimal, and wrong every year.
    shortfallGain: 0.55,   // debt per pp of promised-but-undelivered build-out
    slackThreshold: 15,
  };

  function climateCommitment(eff) {
    var C = CLIMATE_DEBT;
    var renew = Math.max(0, eff.renewable_share_pct || 0);
    var support = Math.max(0, eff.public_support_pct || 0);
    var gdp = Math.max(0, -(eff.gdp_growth_pct || 0));
    var trust = Math.max(0, eff.international_trust || 0);
    return renew * C.commitRenew + support * C.commitPublic + gdp * C.commitGdpLoss + trust * C.commitTrust;
  }

  function applyBaselineDrift(state, scenarioId) {
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const add = (k, d) => { if (state[k] != null) state[k] = state[k] + d; };

    if (scenarioId === 'climate-change-policy') {
      const share = clamp(state.renewable_share_pct == null ? 30 : state.renewable_share_pct, 0, 100);
      // Warming is driven by the fossil stock still in the system, not by
      // this year's policy. At 30% renewables the inertia term is ~+0.05C/turn;
      // at 85% it is ~+0.01C/turn.
      // Tipping points do not un-tip. Whatever a decree promises, a threshold
      // that has been crossed stays crossed - so this meter is read off a
      // high-water mark, not the current value.
      const tpRaw = state.tipping_point_proximity == null ? 27 : state.tipping_point_proximity;
      const tpPeak = Math.max(tpRaw, state.tipping_point_peak == null ? tpRaw : state.tipping_point_peak);
      state.tipping_point_proximity = tpPeak;
      const tpPrev = tpPeak;
      const tp0 = clamp(tpPrev, 0, 100);
      // Debt slows the physical turnover too: money owed to contractors is
      // money not spent on the grid this year.
      const debtNow = typeof state.implementation_debt === 'number' ? state.implementation_debt : 0;
      const flips = Math.min(6, state._flip_streak || 0);
      const amp = (1 + 0.022 * tp0) * (1 + debtNow / CLIMATE_DEBT.driftCoupling) *
                  (1 + CLIMATE_DEBT.driftFlip * flips);
      add('global_avg_temp_c', CLIMATE_DEBT.driftBase * (1 - share / 100) * amp);
      add('co2_ppm', 1.6 * (1 - share / 100) + 0.4);
      add('renewable_share_pct', -1.2);   // asset depreciation + demand growth
      add('public_support_pct', -1.2);    // attention decay
      add('international_trust', -0.8);   // treaty fatigue
      let tpGrowth = 2.2 * (1 - share / 100) + 0.35;
      if (tp0 >= 45) tpGrowth *= 1.8;     // past the threshold the system runs itself
      state.tipping_point_proximity = Math.max(tpPrev, tp0 + tpGrowth);
      state.tipping_point_peak = state.tipping_point_proximity;
      if (tp0 >= 45) state.cascade_triggered = true;
      // The unpaid bill: deferred delivery converts into warming, and it lands
      // hardest in the last three turns - which is exactly when the player is
      // no longer able to do anything about it.
      const turnNow = state.turn_number || 1;
      const debtBill = debtNow * (turnNow >= 8 ? CLIMATE_DEBT.tempLate : CLIMATE_DEBT.tempRegular);
      add('global_avg_temp_c', debtBill);
      add('public_support_pct', -debtNow * CLIMATE_DEBT.supportCost);
      // The hidden deficit is settled late. Until T7 an overhang still looks
      // like paperwork; from T8 the same overhang is money that has already
      // been spent, so the budget it was going to buy growth with is gone and
      // the public stops paying for a programme it cannot see finished. This
      // is the turn where "always the greenest decree" stops being free.
      if (turnNow >= 8) {
        const overhang = Math.max(0, debtNow - CLIMATE_DEBT.fiscalGrace);
        if (overhang > 0) {
          const gdpHit = overhang * CLIMATE_DEBT.fiscalGdp;
          const supportHit = overhang * CLIMATE_DEBT.fiscalSupport;
          add('gdp_growth_pct', -gdpHit);
          add('public_support_pct', -supportHit);
          const acc = state._fiscal_settlement || { gdp: 0, support: 0, turns: 0, debt: 0 };
          acc.gdp = Math.round((acc.gdp + gdpHit) * 100) / 100;
          acc.support = Math.round((acc.support + supportHit) * 100) / 100;
          acc.turns = acc.turns + 1;
          acc.debt = Math.round(debtNow * 10) / 10;
          state._fiscal_settlement = acc;
        }
      }
      state.implementation_debt = Math.min(100, Math.max(0, debtNow - CLIMATE_DEBT.repay));
      state.implementation_debt = Math.round(state.implementation_debt * 10) / 10;
      state.global_avg_temp_c = Math.round(state.global_avg_temp_c * 100) / 100;
      state.renewable_share_pct = clamp(state.renewable_share_pct, 0, 100);
      state.public_support_pct = clamp(state.public_support_pct, 0, 100);
      state.international_trust = clamp(state.international_trust, 0, 100);
      state.tipping_point_proximity = clamp(state.tipping_point_proximity, 0, 100);
      return;
    }

    if (scenarioId === 'enron-collapse') {
      add('media_skepticism_index', 1.5);        // the story does not stay buried
      add('analyst_confidence_index', -1.0);
      add('share_price_usd', -1.5);
      const exp = state.off_balance_sheet_exposure_usd_m;
      if (typeof exp === 'number') {
        if (state.unwind_started) {
          // The vehicles unwind on their own once someone actually opens the
          // books - but a residual layer cannot be dissolved inside one cycle.
          const next = Math.max(2500, exp - Math.max(150, exp * 0.08));
          state.off_balance_sheet_exposure_usd_m = Math.round(next);
        } else if (exp > 7000) {
          state.off_balance_sheet_exposure_usd_m = Math.round(exp + 120);
        }
      }
      state.media_skepticism_index = clamp(state.media_skepticism_index, 0, 100);
      state.analyst_confidence_index = clamp(state.analyst_confidence_index, 0, 100);
      state.share_price_usd = Math.max(0, state.share_price_usd);
      return;
    }

    if (scenarioId === 'noodle-shop-community') {
      add('cash_flow', -1200);   // rent, wages, utilities keep running
      add('reputation', -1.0);   // a quiet street forgets you slowly
      add('staff_fatigue', 1.5);
      add('waste_rate', 0.3);
      state.reputation = clamp(state.reputation, 0, 100);
      state.staff_fatigue = clamp(state.staff_fatigue, 0, 100);
      state.waste_rate = clamp(state.waste_rate, 0, 40);
      return;
    }

    if (scenarioId === 'chip-ai-supplychain') {
      add('cash_flow', -0.6);         // fab and payroll burn, in 亿
      add('engineer_morale', -1.2);
      add('yield_rate', -0.2);        // process drift, no learning without push
      add('supply_chain_risk', 0.8);
      // Debt does not stand still, and it does not charge the same price at
      // every level. Past ~55% the interest line starts eating the cash line,
      // and rolling it over quietly raises the ratio - the mechanism that turns
      // "we can always refinance" into a cash trap two turns later.
      const dr = state.debt_ratio == null ? 40 : state.debt_ratio;
      let interest = 0;
      let rolled = 0;
      if (dr > 55) {
        const strain = (dr - 55) / 100;
        interest = strain * 5.5;
        rolled = 0.5 + strain * 3;
        add('cash_flow', -interest);
        add('debt_ratio', rolled);
      }
      state._last_interest = { debt_ratio: dr, interest: interest, rolled: rolled };
      state.engineer_morale = clamp(state.engineer_morale, 0, 100);
      state.yield_rate = clamp(state.yield_rate, 0, 100);
      state.supply_chain_risk = clamp(state.supply_chain_risk, 0, 100);
      state.debt_ratio = clamp(state.debt_ratio == null ? 40 : state.debt_ratio, 0, 160);
      return;
    }
  }

  function generateFeedbackForTurn(state, turnNumber, scenarioId) {
    if (scenarioId === 'challenger-launch') {
      return generateChallengerFeedback(state, turnNumber);
    }
    if (scenarioId === 'climate-change-policy') {
      return generateClimateFeedback(state, turnNumber);
    }
    if (scenarioId === 'enron-collapse') {
      return generateEnronFeedback(state, turnNumber);
    }
    if (scenarioId === 'noodle-shop-community') {
      return generateNoodleFeedback(state, turnNumber);
    }
    if (scenarioId === 'chip-ai-supplychain') {
      return generateChipFeedback(state, turnNumber);
    }
    return generateGenericFeedback(state, turnNumber);
  }

  function generateChallengerFeedback(state, turnNumber) {
    const data = _loaded['challenger-launch'] || {};
    const lastStep = (data.steps || []).slice(-1)[0];
    if (!lastStep) return '';
    const targetTurn = Math.min(turnNumber - 1, lastStep.turn);
    if (targetTurn < 1) return '';
    const step = findStep(data, targetTurn);
    if (!step) return '';

    if (step.is_final_outcome) {
      const outcomeText = generateChallengerOutcome(state, step);
      if (step.is_pattern_reveal) {
        const revealText = generateChallengerReveal(state, step, turnNumber);
        return outcomeText + '\n\n' + revealText;
      }
      return outcomeText;
    }
    if (step.is_pattern_reveal) {
      return generateChallengerReveal(state, step, turnNumber);
    }
    return generateChallengerActionFeedback(state, step, turnNumber);
  }

  function generateChallengerActionFeedback(state, step, turnNumber) {
    const parts = [];
    const accepted = state.accepted_risks_count || 0;
    const ignored = state.ignored_warnings_count || 0;
    if (accepted || ignored) {
      parts.push('📊 到 turn ' + turnNumber + '：接受风险 ' + accepted + ' 次，忽视警告 ' + ignored + ' 次。');
    }
    const ec = state.engineer_confidence != null ? state.engineer_confidence : 100;
    if (ec < 50) {
      parts.push('⚠️ 工程师团队信心跌至 ' + ec + '/100——他们正在犹豫是否继续提出担忧。');
    } else if (ec < 70) {
      parts.push('工程师团队信心 ' + ec + '/100——他们仍在战斗，但体力正在消耗。');
    }
    const temp = state.temperature_forecast_f;
    if (temp != null && temp < 53) {
      const gap = 53 - temp;
      parts.push('🌡️ 预报温度 ' + temp + '°F，比历史最低纪录低 ' + gap + '°F——Dörner 称为“非线性 + 复杂性”叠加。');
    }
    const deferred = state.consequence_deferred_queue || [];
    if (deferred.length) {
      parts.push('⏳ 你之前的“拖延”决策产生了一个延迟后果（' + deferred.length + ' 个）——将在后续回合显现。');
    }
    if (turnNumber === 4) {
      parts.push('\n【Dörner 视角】温度的非线性意味着：你过去的经验范围(53°F)不能线性外推到 22°F。');
    } else if (turnNumber === 7) {
      parts.push('\n【Dörner 视角】复杂性失明的特征是：你以为在处理一个问题，但其实是多个问题在叠加。');
    }
    if (!parts.length) parts.push('已记录。');
    return parts.join('\n');
  }

  function generateChallengerReveal(state, step, turnNumber) {
    const revealPhase = step.reveal_phase || 1;
    const patterns = detectPatterns(state);
    const phaseToBiases = {
      1: new Set(['confirmation_bias', 'single_target_optimization']),
      2: new Set(['time_delay_blindness', 'side_effect_neglect']),
      3: new Set(['side_effect_neglect', 'lack_of_self_criticism']),
      4: new Set(),
    };
    const biasesToReveal = phaseToBiases[revealPhase] || new Set();
    const patternsToShow = patterns.filter(p => biasesToReveal.has(p.pattern_type));
    const parts = [];
    parts.push('【Dörner 模式揭示 · 第 ' + revealPhase + ' 阶段 · turn ' + turnNumber + '】\n');
    const priorDecisions = selectKeyDecisionsForReveal(state.decision_history || [], revealPhase);
    if (priorDecisions.length) {
      parts.push('📌 你的具体决策回顾：');
      priorDecisions.forEach(d => {
        const text = String(d.option_text || d.decisions && d.decisions.option || '?').slice(0, 60);
        const conseq = String(d.option_consequences_for_player || '').slice(0, 70);
        let line = '  • Turn ' + (d.turn || '?') + ' (' + (d.option_id || '?') + '): "' + text + '..."';
        if (conseq) line += '\n      → ' + conseq + '...';
        parts.push(line);
      });
      parts.push('');
    }
    if (patternsToShow.length) {
      patternsToShow.forEach((p, i) => {
        parts.push('### 模式 ' + (i + 1) + '：' + p.dorner_concept);
        parts.push(p.evidence);
        parts.push('\n反思问题：');
        (p.reflection_questions || []).forEach((q, j) => {
          parts.push('  ' + (j + 1) + '. ' + q);
        });
        parts.push('');
      });
    } else {
      if (revealPhase === 1) {
        parts.push('目前你的决策尚未表现出强烈的确认偏误或单目标优化。但 Dörner 提醒：“在动态系统中，行动的延迟效应比即时效应更重要。”——你今天感觉不到的代价，可能在 6 个月后显现。');
      }
    }
    if (revealPhase === 1) {
      parts.push('\n接下来：Boisjoly 将在 12 小时后私下找你谈话（turn 6）。');
    } else if (revealPhase === 2) {
      parts.push('\n接下来：发射日早晨将带来新的复杂性（turn 7+）。');
    } else if (revealPhase === 3) {
      parts.push('\n接下来：T-30 分钟是你最后的机会（turn 9）。');
    }
    return parts.join('\n');
  }

  function selectKeyDecisionsForReveal(decisionHistory, revealPhase) {
    if (!decisionHistory.length) return [];
    const scored = [];
    decisionHistory.forEach(d => {
      const effects = d.applied_effects || {};
      const counterDelta = (effects.accepted_risks_count || 0) + (effects.ignored_warnings_count || 0) + (effects.dissent_suppressed_count || 0) + (effects.risk_acknowledged_unresolved || 0);
      if (counterDelta <= 0) return;
      const score = (effects.accepted_risks_count || 0) * 10 + (effects.ignored_warnings_count || 0) * 8 + (effects.dissent_suppressed_count || 0) * 12 + (effects.risk_acknowledged_unresolved || 0) * 6 + (d.turn || 0) * 0.1;
      scored.push({ score, d });
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.d);
  }

  // ==== 终局契约 · FinalOutcome（Spec v1.2 §6.1 · P0-1a 影子层）==========
  // 这一层只读：不写 state、不改 feedback、不被任何生产路径调用。
  // 它的全部意义是把散落在 5 个 generate*Outcome 里的"结局是什么"收敛成
  // 一个可断言的对象，先在影子模式下和旧路径对照，一致率 100% 才接线（T-3b）。

  // 白名单不是"每场景 4 个"这种结构性假设，而是 outcome_endings 的真实 key 全集。
  // 2026-10 核对 assets/data/scenarios/*.json 的结果：climate 实际有 6 个结局，
  // spec v1.2 的表格只列了 4 个（漏 transition_unfinished / execution_collapse）。
  // 规格表与数据不一致时以数据为准，偏差登记在 scripts/contract-outcome.mjs 的报告里。
  var FL_OUTCOME_WHITELIST = {
    'challenger-launch': ['launch_disaster', 'launch_dodged', 'last_minute_evaluation', 'infinite_delay'],
    'climate-change-policy': [
      'one_point_five', 'two_degrees', 'three_degrees',
      'transition_unfinished', 'execution_collapse', 'coordination_collapse',
    ],
    'enron-collapse': ['orderly_resolution', 'partial_collapse', 'total_collapse'],
    'noodle-shop-community': ['long_term_success', 'expansion_bankruptcy', 'warm_water_frog', 'sold_shop'],
    'chip-ai-supplychain': ['tech_breakthrough', 'cash_trap', 'exit', 'bailout'],
  };

  // 结局数据里存在、但现有推断/声明路径都走不到的 id。
  // 这不是"留着以后做"，是必须写进验收报告的诚实缺口（spec §8 G3）。
  var FL_KNOWN_UNREACHABLE = {
    'climate-change-policy': {
      coordination_collapse: 'data_gap：inferClimateOutcome 的 band 只派生 5 个值，此 id 无任何路径产出',
    },
  };

  // 中性型 = 拖延 / 主动退出，这类结局不指向某一条具体认知偏差，
  // 教学上不能和"灾难型"用同一句判词。其余一律 teaching。
  var FL_NEUTRAL_TIER = ['infinite_delay', 'sold_shop', 'exit', 'bailout'];

  function _flFinalStepOf(scenarioId) {
    var data = _loaded[scenarioId] || {};
    var steps = data.steps || [];
    for (var i = 0; i < steps.length; i++) {
      if (steps[i] && steps[i].is_final_outcome) return steps[i];
    }
    return null;
  }

  // 终局选项从 decision_history 取而不是只看 last_chosen_option：
  // noodle / chip 的 generic 分支从来没有写过 last_chosen_option（这正是 E2 死代码），
  // 但 recordDecision 是统一的，history 里一定有第 10 回合的真实选项。
  // 影子层据此拿到 declared 值，又不需要改动任何生产行为。
  function _flFinalOptionId(state, finalTurn) {
    var hist = (state && state.decision_history) || [];
    for (var i = hist.length - 1; i >= 0; i--) {
      var h = hist[i];
      if (h && h.turn === finalTurn && h.option_id) return String(h.option_id);
    }
    return (state && state.last_chosen_option) || '';
  }

  // 终局条目可能是洗牌过的槽位。decision_history 里 option_id 记的是"玩家按下的
  // 那个字母"，option_orig_id 记的是"这个字母原先是哪个选项"——判结局必须用后者，
  // 否则洗牌后 T10 的 A/B/C/D 会按未洗牌原始 step 的字母解释，结局与所点选项错位。
  function _flFinalHistoryEntry(state, finalTurn) {
    var hist = (state && state.decision_history) || [];
    var fallback = null;
    for (var i = hist.length - 1; i >= 0; i--) {
      var h = hist[i];
      if (!h) continue;
      if (!fallback) fallback = h;
      if (finalTurn != null && h.turn === finalTurn) return h;
    }
    return fallback;
  }

  function _flFinalOrigOptionId(state, finalTurn) {
    var entry = _flFinalHistoryEntry(state, finalTurn);
    if (entry) {
      // 旧存档降级：P0 修复前落库的 history 没有 option_orig_id，
      // 只能按当时记下的槽位字母解释——与修复前行为一致，不臆造新结论。
      if (entry.option_orig_id) return String(entry.option_orig_id);
      if (entry.option_id) return String(entry.option_id);
    }
    return (state && state.last_chosen_option) || '';
  }

  function _flDeclaredOutcomeId(state, scenarioId) {
    var step = _flFinalStepOf(scenarioId);
    if (!step) return '';
    var optId = _flFinalOrigOptionId(state, step.turn);
    if (!optId) return '';
    var op = findOption(step, optId);
    return op && op.trigger_outcome ? String(op.trigger_outcome) : '';
  }

  // challenger 没有"指标推断"这条路径：它的 4 个结局由 T10 选项显式声明，
  // 九年回合改的是代价（process_ledger），不是结局。这里如实返回空串。
  function _flInferredOutcomeId(state, scenarioId) {
    if (scenarioId === 'climate-change-policy') return inferClimateOutcome(state);
    if (scenarioId === 'enron-collapse') return inferEnronOutcome(state);
    if (scenarioId === 'noodle-shop-community' || scenarioId === 'chip-ai-supplychain') {
      return inferShopOutcome(state, scenarioId);
    }
    return '';
  }

  function _flFirstClause(text, maxLen) {
    var s = String(text || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    var cut = s.split(/[。！？；\n]/)[0] || s;
    cut = cut.trim();
    return cut.length > maxLen ? cut.slice(0, maxLen) + '…' : cut;
  }

  function _flOutcomeTitle(scenarioId, id) {
    var endings = ((_loaded[scenarioId] || {}).outcome_endings) || {};
    var e = endings[id] || {};
    if (e.title) return String(e.title);
    var fromNarrative = _flFirstClause(e.narrative_intro, 24);
    return fromNarrative || String(id);
  }

  /**
   * 结局文本三套 schema 的归一器（Spec v1.2 §6.3 · T-4）。
   * 只读，不改 JSON 原文：原文是内容资产，格式不统一是历史问题，
   * 但"渲染层每次都自己猜这段有没有 timeline"才是真正的债。
   *
   * A 套 challenger：narrative_intro + timeline + dorner_reflection + teaching_questions，
   *                个别结局把后续塞在 what_happens_next / consequences / teaching_point 里。
   * B 套 climate/enron：narrative + scientific_sources（无 timeline、无 title）。
   * C 套 noodle/chip：title + narrative_intro + timeline + hidden_costs + luck_note。
   *
   * 缺字段一律给空数组，不给 undefined —— 渲染层可以放心 forEach。
   */
  function _flNormalizeEnding(scenarioId, endingRaw) {
    var e = endingRaw || {};
    var narrationText = String(e.narrative || e.narrative_intro || '');
    var timeline = [];
    (e.timeline || []).forEach(function (l) {
      if (l) timeline.push(String(l));
    });
    if (e.what_happens_next && timeline.indexOf(String(e.what_happens_next)) < 0) {
      timeline.push(String(e.what_happens_next));
    }

    var reflection = [];
    if (e.dorner_reflection) reflection.push(String(e.dorner_reflection));
    if (e.teaching_point) reflection.push(String(e.teaching_point));
    if (e.consequences) reflection.push(String(e.consequences));

    var sources = [];
    (e.scientific_sources || []).forEach(function (x) {
      if (x) sources.push(x);
    });

    var title = e.title ? String(e.title) : _flFirstClause(narrationText, 24);

    return {
      id: '',
      title: title,
      narrative: narrationText,
      timeline: timeline,
      reflection: reflection,
      sources: sources,
      teaching_questions: (e.teaching_questions || []).slice(),
      hidden_costs: (e.hidden_costs || []).slice(),
      luck_note: e.luck_note ? String(e.luck_note) : '',
      raw: e,
    };
  }

  // 供测试与 Debrief 取原文；生产 UI 不得直接吃 raw。
  function _flRawEndings(scenarioId) {
    var data = _loaded[scenarioId] || {};
    return data.outcome_endings || {};
  }

  // ===== 过程记账（Spec v1.2 §6.2 / §6.2.1 · T-6）=====
  //
  // 要解决的是最容易被糊过去的一句话：「前 9 回合对结局有影响」。
  // 一个只看第 10 回合的引擎，靠三行漂亮文案也能声称自己有影响，
  // 所以这里坚持三件事：
  //   1. 记账不改判 —— 结局 id 仍由第 10 回合决定（challenger 的四条命名与
  //      全部既有断言因此原样成立）；
  //   2. 档位可反推 —— 阈值全部用引擎里已有的门槛，玩家拿着两个计数就能自己算；
  //   3. 数值进文本 —— verdict 与追加段里出现的是实际计数，不是形容词。
  //
  // 口径换算（诚实登记，不做黑箱）：spec §6.2.1 把 climate 的档位写成
  // 「0.5 / 1.5」，那是 0–1 归一尺度；本引擎的 implementation_debt 是 0–100 尺度，
  // 其 grace line 为 CLIMATE_DEBT.fiscalGrace（6）、band worst 为
  // CLIMATE_DEBT.bandDebtWorst（32）。两处等价，故本实现取 6 / 32。
  // noodle 的 debt 开局为 0，直接算「倍数」会退化成 0/0；
  // 改用「1 + 负债/月营收」，开局即 1.00 倍，1.30 倍 = 债务达到一个月营收的 30%。
  function _flLedgerNum(v) {
    return typeof v === 'number' && !isNaN(v) ? v : 0;
  }

  function _flProcessLedger(state, scenarioId) {
    var s = state || {};
    var init = (_loaded[scenarioId] || {}).initialState || {};
    var counters = [];
    var tier = 'mid';
    var verdict = '';

    if (scenarioId === 'challenger-launch') {
      var ar = Math.round(_flLedgerNum(s.accepted_risks_count) || 0);
      var ds = Math.round(_flLedgerNum(s.dissent_suppressed_count) || 0);
      var sum = ar + ds;
      tier = sum <= 1 ? 'low' : (sum >= 5 ? 'high' : 'mid');
      counters = [
        { name: 'accepted_risks_count', value: ar },
        { name: 'dissent_suppressed_count', value: ds },
      ];
      verdict = '前九回合接受风险 ' + ar + ' 次、压制异议 ' + ds + ' 次（合计 ' + sum + '）。';
    } else if (scenarioId === 'climate-change-policy') {
      var debt = typeof s.implementation_debt === 'number' ? s.implementation_debt : 0;
      debt = Math.round(debt * 10) / 10;
      var settle = (s._fiscal_settlement && s._fiscal_settlement.turns) || 0;
      var grace = (CLIMATE_DEBT && CLIMATE_DEBT.fiscalGrace) || 6;
      var worst = CLIMATE_DEBT_BAND_LIMIT || 32;
      tier = debt <= grace ? 'low' : (debt > worst ? 'high' : 'mid');
      counters = [
        { name: 'implementation_debt', value: debt },
        { name: 'settlement_turns', value: settle },
      ];
      verdict = '执行赤字累计 ' + debt.toFixed(1) + '/100，隐性结算 ' + settle + ' 次。';
    } else if (scenarioId === 'enron-collapse') {
      var exp = Math.round(_flLedgerNum(s.off_balance_sheet_exposure_usd_m) || 0);
      var baseExp = _flLedgerNum(init.off_balance_sheet_exposure_usd_m) || 0;
      var mult = baseExp > 0 ? Math.round((exp / baseExp) * 100) / 100 : 1;
      tier = mult <= 1.2 ? 'low' : (mult > 1.8 ? 'high' : 'mid');
      counters = [
        { name: 'exposure_multiple', value: mult },
        { name: 'off_balance_sheet_exposure_usd_m', value: exp },
      ];
      verdict = '表外敞口 ' + mult.toFixed(2) + ' 倍初值（' + exp + ' 百万美元）。';
    } else if (scenarioId === 'noodle-shop-community') {
      var debtN = Math.round(_flLedgerNum(s.debt) || 0);
      var rev = _flLedgerNum(init.monthly_revenue) || 0;
      var multN = rev > 0 ? Math.round((1 + debtN / rev) * 100) / 100 : 1;
      tier = multN <= 1.3 ? 'low' : (multN > 2.0 ? 'high' : 'mid');
      counters = [
        { name: 'debt_multiple', value: multN },
        { name: 'debt', value: debtN },
      ];
      verdict = '负债 ' + debtN + ' 元，相当于开局营收的 ' + multN.toFixed(2) + ' 倍。';
    } else if (scenarioId === 'chip-ai-supplychain') {
      var dr = Math.round(_flLedgerNum(s.debt_ratio) || 0);
      var baseDr = _flLedgerNum(init.debt_ratio) || 0;
      var multC = baseDr > 0 ? Math.round((dr / baseDr) * 100) / 100 : 1;
      tier = multC <= 1.3 ? 'low' : (multC > 2.0 ? 'high' : 'mid');
      counters = [
        { name: 'cash_burn_multiple', value: multC },
        { name: 'debt_ratio', value: dr },
      ];
      verdict = '资产负债率 ' + dr + '%，为开局的 ' + multC.toFixed(2) + ' 倍。';
    } else {
      counters = [{ name: 'turn_number', value: _flLedgerNum(s.turn_number) || 0 }];
      verdict = '本场景未登记过程记账项。';
    }

    return {
      pressure_tier: tier,
      key_counters: counters,
      verdict: verdict,
    };
  }

  // 追加在结局文本末尾的一段。它不做总结，只把账摆出来：
  // 同一个结局，走到它面前的姿态可以完全不同。
  function _flLedgerSegment(scenarioId, ledger) {
    if (!ledger) return '';
    var closer =
      ledger.pressure_tier === 'low'
        ? '前九回合把余量留住了，最后这一步才可能只是一次失手。'
        : ledger.pressure_tier === 'high'
          ? '同样是这一步，这一次是积重难返，不是一时失手。'
          : '余量是一点点让出去的，最后这一步只是签字。';
    return '【代价清算】' + ledger.verdict + '\n  ' + closer;
  }

  /**
   * 统一的终局解析入口。
   * @returns {{id:string,title:string,tier:string,source:string,rewritten:boolean,inferred_id:string,scenario_id:string,process_ledger:object}}
   */
  function _flResolveOutcome(state, scenarioId) {
    var s = state || {};
    var wl = FL_OUTCOME_WHITELIST[scenarioId] || [];
    var declared = _flDeclaredOutcomeId(s, scenarioId);
    var inferred = _flInferredOutcomeId(s, scenarioId) || '';

    var declaredOk = !!declared && wl.indexOf(declared) >= 0;
    var inferredOk = !!inferred && wl.indexOf(inferred) >= 0;

    var id;
    var source;
    if (declaredOk) {
      // declared 与 inferred 一致时记 hybrid：两个独立路径说出同一句话，
      // 这是可信度最高的情形，Debrief 的 one_liner 会据此换模板。
      id = declared;
      source = inferredOk && inferred === declared ? 'hybrid' : 'declared';
    } else if (inferredOk) {
      id = inferred;
      source = 'inferred';
    } else {
      // 不在白名单的 id 不偷偷映射到某个"近似结局"——那会让数据缺口消失。
      // 用显式的 unclassified_ending 暴露出来，验收脚本自然红。
      id = 'unclassified_ending';
      source = 'inferred';
    }

    return {
      id: id,
      title: id === 'unclassified_ending' ? '未归类的结局' : _flOutcomeTitle(scenarioId, id),
      tier: FL_NEUTRAL_TIER.indexOf(id) >= 0 ? 'neutral' : 'teaching',
      source: source,
      rewritten: declaredOk && inferredOk && declared !== inferred,
      inferred_id: inferred,
      scenario_id: scenarioId,
      // 结局之外的第二份账：前 9 回合留下的代价。它不参与定 id，
      // 只负责让「同一个结局」在文本上不再等价（§6.2 的整条理由就在这里）。
      process_ledger: _flProcessLedger(s, scenarioId),
    };
  }

  function generateChallengerOutcome(state, step) {
    // step 是未洗牌的原始末步，所以这里也必须用原始选项 id（option_orig_id），
    // 不能拿玩家看到的洗牌槽位字母去查——那是同一字母的另一个选项。
    const chosenOptionId = _flFinalOrigOptionId(state, step.turn) || 'A';
    const option = findOption(step, chosenOptionId);
    const outcomeType = option ? (option.trigger_outcome || 'launch_disaster') : 'launch_disaster';
    const data = _loaded['challenger-launch'] || {};
    const endings = data.outcome_endings || {};
    const ending = endings[outcomeType] || endings.launch_disaster || {};
    const parts = [];
    parts.push('='.repeat(60));
    if (outcomeType === 'launch_disaster') {
      parts.push('❌  挑战者号发射决定已执行');
    } else if (outcomeType === 'launch_dodged') {
      parts.push('✅  挑战者号发射决定已被推迟');
    } else if (outcomeType === 'last_minute_evaluation') {
      parts.push('⏸  挑战者号发射倒计时已暂停');
    } else {
      parts.push('⏸  挑战者号发射计划已无限期推迟');
    }
    parts.push('='.repeat(60));
    parts.push('');
    if (ending.narrative_intro) parts.push(ending.narrative_intro);
    parts.push('');
    if (outcomeType === 'launch_disaster') {
      parts.push('【时间线 — 73 秒的真相】');
      (ending.timeline || []).forEach(line => parts.push('  ' + line));
      parts.push('');
      parts.push('【7 名宇航员 — 他们的名字必须被记住】');
      (ending.astronauts_lost || []).forEach(name => parts.push('  • ' + name));
      parts.push('');
      if (ending.rogers_commission_quote) parts.push('【Rogers Commission 调查结论】\n  "' + ending.rogers_commission_quote + '"');
      parts.push('');
      if (ending.feynman_experiment) parts.push('【Feynman 实验 — 冰水中的 O 型环】\n  "' + ending.feynman_experiment + '"');
      parts.push('');
      if (ending.boisjoly_senate_quote) parts.push('【Boisjoly 1990 年参议院证词】\n  "' + ending.boisjoly_senate_quote + '"');
      parts.push('');
      if (ending.dorner_reflection) parts.push('【Dörner 在《失败的逻辑》中写道】\n  "' + ending.dorner_reflection + '"');
      parts.push('');
      parts.push('【最后的反思问题】');
      (ending.teaching_questions || []).forEach((q, i) => parts.push('  ' + (i + 1) + '. ' + q));
      parts.push('');
    } else {
      if (ending.what_happens_next) {
        parts.push('【接下来发生的事】');
        (ending.what_happens_next || []).forEach(line => parts.push('  • ' + line));
        parts.push('');
      }
      if (ending.dorner_reflection) parts.push('【Dörner 反思】\n  "' + ending.dorner_reflection + '"');
      parts.push('');
      if (ending.teaching_point) parts.push('【教学要点】' + ending.teaching_point);
      parts.push('');
    }
    parts.push('='.repeat(60));
    parts.push('【个人偏差报告】');
    parts.push('='.repeat(60));
    const patterns = detectPatterns(state);
    if (patterns.length) {
      patterns.forEach(p => parts.push('  • ' + p.dorner_concept + ': ' + (p.evidence || '').slice(0, 80) + '...'));
    } else {
      parts.push('  你未表现出强烈偏差——但你选择了' + (outcomeType === 'launch_disaster' ? '发射本身' : '推迟') + '。');
    }
    parts.push('');
    parts.push('你的决策理由记录（如果写了）：');
    const justifications = state.decision_justifications || {};
    Object.keys(justifications).sort((a, b) => parseInt(a) - parseInt(b)).forEach(turn => {
      parts.push('  Turn ' + turn + ': ' + justifications[turn]);
    });
    // P0 #1: 理由框是可选输入，没写就不该在终局留下"（未填写）"这种像是
    // 用户漏填的痕迹——改成一句教学提示，说明写了才有前后对照。
    if (!Object.keys(justifications).length) {
      parts.push('  【提示】本局没有记录决策理由（理由框为可选项）。');
      parts.push('  下一局若在选项上方写一句理由，下一回合就会看到「你上回合写的是…」与自己实际选择的对照。');
    }
    return parts.join('\n');
  }

  function generateClimateFeedback(state, turnNumber) {
    const data = _loaded['climate-change-policy'] || {};
    const lastStep = (data.steps || []).slice(-1)[0];
    if (!lastStep) return '';
    const targetTurn = Math.min(Math.max(1, turnNumber - 1), lastStep.turn);
    const step = findStep(data, targetTurn);
    if (!step) return '';
    if (step.is_final_outcome) {
      return generateClimateOutcome(state, data);
    }
    if (step.is_pattern_reveal) {
      return generateClimateReveal(state, step, turnNumber, data) + '\n\n' +
        _flDiagnosisBlock(state, data, turnNumber - 1);
    }
    const base = buildActionFeedback(state, data, step, turnNumber, 'climate-change-policy');
    // Loop 5 · B1: the shock years are a fact of this world, not a surprise.
    // Announced once, on the first turn, because "leave margin" is only a
    // teachable rule if the player knows margin was needed before losing.
    if (turnNumber <= 1) return base + '\n\n' + _flClimateShockDisclosure();
    return base;
  }

  function generateClimateReveal(state, step, turnNumber, data) {
    return buildRevealFeedback(state, step, turnNumber, data, 'climate-change-policy');
  }
  
  function interpolateOutcomeTemplate(text, state, data) {
    if (!text || text.indexOf('{') < 0) return text;
    const history = state.decision_history || [];
    const count = history.length;
    const silent = state.whistleblower_silenced_count || 0;
    // 决策理由记录
    let just = '（本局没有留下决策理由记录）';
    const reasons = history.filter(h => h && h.justification && String(h.justification).trim())
      .map(h => '  • Turn ' + h.turn + ': ' + h.justification);
    if (reasons.length) just = reasons.join('\n');
    // 激进 / 诚实选项计数（关键词近似，教育场景可接受）
    const radicalKw = ['全面禁煤', '碳预算立即归零', '1.5°C抢救计划', '激进减排路径', '紧急发布1万亿', '全面禁止', '立即归零', '紧急启动', '坚持激进'];
    const honestKw = ['承认', '审计', '透明度', '配合调查', '披露', '坦承', '举报', '作证', '接受调查', '公开', '承认错误', '承担责任'];
    let radicalCount = 0, honestCount = 0;
    history.forEach(h => {
      const t = String(h.option_text || '');
      if (radicalKw.some(k => t.includes(k))) radicalCount++;
      if (honestKw.some(k => t.includes(k))) honestCount++;
    });
    let responseSpeed = '1-2';
    if (silent >= 4) responseSpeed = '5+';
    else if (silent >= 2) responseSpeed = '3-4';
    // 维度最弱化 / 最关注（climate 9 维度，对比初始值变化幅度）
    const dims = [
      ['global_avg_temp_c', '升温控制'],
      ['co2_ppm', '碳排放削减'],
      ['gdp_growth_pct', '经济增长'],
      ['renewable_share_pct', '可再生能源转型'],
      ['climate_justice_index', '气候正义'],
      ['public_support_pct', '公众支持'],
      ['international_trust', '国际信任'],
      ['tipping_point_proximity', '临界点风险控制'],
      ['whistleblower_silenced_count', '科学言论自由'],
    ];
    const init = data.initialState || {};
    let minDim = '多个维度', best = Infinity;
    let maxDim = '经济增长', best2 = -1;
    dims.forEach(([k, label]) => {
      const cur = state[k], iv = init[k];
      if (cur == null || iv == null) return;
      const diff = Math.abs(cur - iv);
      if (diff < best) { best = diff; minDim = label; }
      if (diff > best2) { best2 = diff; maxDim = label; }
    });
    const neglected = dims.filter(([k, label]) => {
      const cur = state[k], iv = init[k];
      if (cur == null || iv == null) return false;
      return Math.abs(cur - iv) < best2 * 0.35 && label !== maxDim;
    }).slice(0, 3).map(x => x[1]).join('、') || '部分深层维度';
    // Loop 2 · data-driven epilogue: the story quotes this run's own state
    // instead of a hard-coded target. Without this the ending could claim
    // 1.45C while the run actually peaked somewhere else.
    const num = (v, dec) => (typeof v === 'number' && !isNaN(v))
      ? (dec === 0 ? String(Math.round(v)) : v.toFixed(dec)) : '—';
    const finalTemp = state.global_avg_temp_c;
    const seaLevel = (typeof finalTemp === 'number')
      ? Math.round(Math.max(0, (finalTemp - 1.0) * 18)) : null;
    const debt = typeof state.implementation_debt === 'number' ? state.implementation_debt : 0;
    const settle = state._fiscal_settlement || null;
    const turnsTracked = state._commit_turns || 0;
    const avgCommit = turnsTracked ? (state._commit_sum || 0) / turnsTracked : 0;
    const avgCapacity = turnsTracked ? (state._capacity_sum || 0) / turnsTracked : 0;
    // Loop 8 · 结语必须与数据同向
    // 实测（seed 3363，transition_unfinished）：平均承诺 6.4、平均可消化 20.0，
    // 而模板断言「重表态、轻落地」「真正的建成量是 20.0，差额不会消失」——
    // 一句话把保守局说成了冒进局。保守玩家的真实失败不是承诺过头，是十年
    // 都没敢给系统压任务，转型压根没启动；把这句话说反，等于告诉他"我批评
    // 的是另一个人"。这里按两个均值的大小关系选词，模板只留槽位。
    const overYears = state._over_years || 0;
    // 三档阈值：一次越线是踩空，三次以上是习惯。十年里越线 >=3 年才配叫
    // 「重表态」，0 年叫「没敢压任务」，中间那几年叫「不连贯」——三者指的是
    // 三种不同的失败，不能合并成一句。
    const commitOverCap = overYears >= 3;
    const commitUnderCap = overYears === 0;
    const commitVerdict = commitOverCap
      ? '十年里有 ' + overYears + ' 年把承诺压过了能力线——重表态、轻落地'
      : commitUnderCap
        ? '十年里没有一年压过能力线——问题不在表态过头，而在宣布的量一直压在能力以下：系统闲着，转型也就没有启动'
        : '十年里有 ' + overYears + ' 年压过能力线，其余年份又留着力——不连贯，比单纯冒进更伤';
    const deliveryGapLine = commitOverCap
      ? '你平均宣布 ' + num(avgCommit, 1) + ' 单位的工程量，真正能建成的是 ' +
        num(avgCapacity, 1) + ' 单位——差额不会消失，它记在下一任的账上。'
      : commitUnderCap
        ? '你平均宣布 ' + num(avgCommit, 1) + ' 单位，行政体系能消化 ' + num(avgCapacity, 1) +
          ' 单位：账面上没有透支，力气全留在手里——省下来的产能没有变成更快的转型，只变成了更少的行动。'
        : '你平均宣布 ' + num(avgCommit, 1) + ' 单位，能力 ' + num(avgCapacity, 1) +
          ' 单位：越线的那几年挤掉了维护，留力的那几年又没补上装机——掉队的是那 5–7 年的建设周期。';
    // Loop 9 · 执行赤字局的缺口跟「有没有敢承诺」是两件事。实测（60 局）
    // 越线年数最多 3 年、且只出现在赤字局里，而赤字局里多数年份根本没越线
    // ——赤字是「每年固定延期 + 震荡/单调惩罚」一点点结出来的，不是某一次
    // 冒进的后果。所以这里不能直接复述 deliveryGapLine（它在 under 档会说
    // 「力气全留在手里」，与「赤字超阈」自相矛盾），要另给一条只说账、不说
    // 态度的口径，态度交给 {commit_verdict}。
    const execGapLine = commitOverCap
      ? '超出的那部分再加上每年被流程吃掉的固定延期，一年一结转成了这笔账'
      : commitUnderCap
        ? '每年被流程吃掉的那一小截看着不多，十年结下来就是这笔账'
        : '挤掉维护的那几年没补回来，留力的那几年也没抢回来，账照样记上了';
    return text
      .replace(/\{decision_count\}/g, String(count))
      .replace(/\{radical_count\}/g, String(radicalCount))
      .replace(/\{honest_count\}/g, String(honestCount))
      .replace(/\{justifications\}/g, just)
      .replace(/\{response_speed\}/g, responseSpeed)
      .replace(/\{min_dimension\}/g, minDim)
      .replace(/\{primary_focus\}/g, maxDim)
      .replace(/\{neglected_dimensions\}/g, neglected)
      .replace(/\{final_temp\}/g, num(finalTemp, 2))
      .replace(/\{co2_ppm\}/g, num(state.co2_ppm, 0))
      .replace(/\{sea_level_cm\}/g, num(seaLevel, 0))
      .replace(/\{renewable_share\}/g, num(state.renewable_share_pct, 0))
      .replace(/\{intl_trust\}/g, num(state.international_trust, 0))
      .replace(/\{justice\}/g, num(state.climate_justice_index, 0))
      .replace(/\{support\}/g, num(state.public_support_pct, 0))
      .replace(/\{debt\}/g, num(debt, 0))
      .replace(/\{avg_commitment\}/g, num(avgCommit, 1))
      .replace(/\{avg_capacity\}/g, num(avgCapacity, 1))
      .replace(/\{commit_verdict\}/g, commitVerdict)
      .replace(/\{delivery_gap_line\}/g, deliveryGapLine)
      .replace(/\{exec_gap_line\}/g, execGapLine)
      .replace(/\{debt_limit\}/g, String(CLIMATE_DEBT_BAND_LIMIT))
      // Loop 2 · the late settlement is now quotable inside the story: the
      // ending of a 1.5C run has to be able to say what the last three turns
      // actually cost, in this run's own numbers.
      .replace(/\{fiscal_gdp\}/g, num(settle ? settle.gdp : 0, 1))
      .replace(/\{fiscal_support\}/g, num(settle ? settle.support : 0, 1))
      .replace(/\{fiscal_turns\}/g, String(settle ? settle.turns : 0))
      .replace(/\{fiscal_debt\}/g, num(settle ? settle.debt : debt, 0))
      .replace(/\{band_name\}/g, (function () {
        var lb = climateBandOf(finalTemp, debt, state.renewable_share_pct).label;
        return lb;
      })());
  }

  const ENDING_COST_STYLE = true;

  function generateClimateOutcome(state, data) {
    const outcomeType = inferClimateOutcome(state);
    const endings = data.outcome_endings || {};
    const ending = endings[outcomeType] || {};
    const parts = [];
    // P0 #4: print the whole decision path, then check the story against it.
    const peak = state.global_avg_temp_c;
    if (typeof peak === 'number' && !isNaN(peak)) {
      parts.push(_flClimateBudgetLine(state));
      // Loop 2 · the epilogue is data-driven now: every number in the story is
      // a slot filled from this run's state. What still needs checking is the
      // one thing that would betray a silent mismatch - a slot that never got
      // filled and would otherwise print as "{co2_ppm}" to the player.
      const narrativeText = [ending.narrative, ending.narrative_intro]
        .filter(Boolean).map(t => interpolateOutcomeTemplate(t, state, data)).join('\n');
      const unfilled = narrativeText.match(/\{[a-zA-Z_][\w]*\}/g);
      if (unfilled && unfilled.length) {
        parts.push('【叙事数据】本局有 ' + unfilled.length + ' 个模板槽位没有取到值（' +
                   Array.from(new Set(unfilled)).join('、') + '），对应位置显示为占位符；' +
                   '档位与预算以上面的【档位判定】为准。');
      }
      parts.push('');
    }
    if (ending.narrative) {
      parts.push(interpolateOutcomeTemplate(ending.narrative, state, data));
    } else {
      parts.push('【终局】');
      if (ending.narrative_intro) parts.push(interpolateOutcomeTemplate(ending.narrative_intro, state, data));
      (ending.timeline || []).forEach(l => parts.push('  • ' + interpolateOutcomeTemplate(l, state, data)));
      parts.push('');
      if (ending.dorner_reflection) parts.push('【Dörner 反思】\n' + interpolateOutcomeTemplate(ending.dorner_reflection, state, data));
      if (ending.teaching_questions && ending.teaching_questions.length) {
        parts.push('\n【教学问题】');
        ending.teaching_questions.forEach((q, i) => parts.push('  ' + (i + 1) + '. ' + interpolateOutcomeTemplate(q, state, data)));
      }
    }
    // Loop 2: the deferred bill has to be visible whichever band you land in.
    // T8-T10 settlement used to show up only in the 1.5C epilogue and in the
    // per-turn band block, so a player who lost the game to fiscal crowd-out
    // read a 3C story with no mention of it. Printed here once, for every
    // ending, and skipped when the epilogue already carries the same numbers.
    const settleEnd = state && state._fiscal_settlement;
    const alreadyPrinted = ending && ending.narrative && /本局结算/.test(ending.narrative);
    if (settleEnd && settleEnd.turns > 0 && !alreadyPrinted) {
      parts.push('');
      parts.push('【财政结算 —— 你没看到的那笔账】');
      parts.push('  • T8 之后前期承诺集中到期，本局结算 ' + settleEnd.turns + ' 次：GDP 累计 -' +
                 settleEnd.gdp.toFixed(1) + 'pp、公众支持累计 -' + settleEnd.support.toFixed(1) + 'pp。');
      parts.push('  • 结账时执行赤字 ' + settleEnd.debt + '/100。这笔支出在前 7 回合的账面里看不到——' +
                 '"已承诺"和"已交付"之间的差额，最后是用增长和民意付的。');
    }

    // Crossing a tipping point is the one thing this model will not let you buy
    // back. Whatever the temperature ends at, the loss is printed as its own
    // block - the point of a delayed transition is not the final number.
    if (state && state.cascade_triggered) {
      const tp = state.tipping_point_proximity == null ? 0 : Math.round(state.tipping_point_proximity);
      const temp = state.global_avg_temp_c == null ? 0 : state.global_avg_temp_c;
      parts.push('');
      parts.push('【不可逆的账】临界点逼近度已到 ' + tp + '/100，越过了 45 的自我强化阈值。');
      parts.push('  • 这几回合之后，即使每年都追加最激进的减排，升温也只能停在 ' + temp.toFixed(2) +
                 '°C 附近，而回不到你错过的那个窗口；');
      parts.push('  • 冻土释放、珊瑚白化、冰盖后退这些损失不会因为政策转向而复原，账已经记在系统里；');
      parts.push('  • 你晚行动的那几年，没有被"补上"，只是被"追认"了。');
    }

    // Final word before the report: consistent, rigid, or just switching
    // targets? Decided from the decision log, not from a template.
    const diagTurn = (data.steps && data.steps.length) ? data.steps[data.steps.length - 1].turn : 10;
    parts.push('');
    parts.push(_flDiagnosisBlock(state, data, diagTurn));

    if (!parts.length) parts.push('已记录。');
    return parts.join('\n');
  }

  // P0 #4: one axis, printed out loud.
  // The old inference returned "coordination_collapse" before it ever looked at
  // temperature, so a run peaking at 1.7C could be stamped with the worst band
  // while a 2.2C run with intact trust got a milder one — the verdicts were not
  // comparable. Temperature decides the band; collapsed coordination is
  // reported as an add-on that changes the epilogue, not the band.
  // ---------------------------------------------------------------
  // Loop 2 · option order is a per-run shuffle, not a fixed key.
  // The old build had a dominant strategy: whichever rule you read
  // ("always pick the one that sounds boldest", "always pick A"),
  // the same physical choice sat in the same slot every turn, so a
  // player could win without reading. Slot letters are now assigned
  // by position after a seeded shuffle, and the letter-keyed effect
  // tables are permuted with them - so "A" always means "the first
  // option on your screen", and never the same policy twice.
  // ---------------------------------------------------------------
  function _flRng(seed) {
    var t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function _flOptionSeed(scenarioId) {
    try {
      var raw = localStorage.getItem('fl_option_seed_' + scenarioId);
      if (raw) return parseInt(raw, 10) || 0;
    } catch (e) { /* storage blocked: fall through to fixed order */ }
    return 0;
  }

  // Loop11 候选②：稳 ≠ 躺。作者给的 weight 说的是"姿态"，ask（renewable_share_pct）
  // 说的是"这一年到底投不投装机"。两者不一致时，玩家以为自己在求稳，模型却按
  // 延期计（defer streak → 容量锈蚀 → 后面只能突击，突击又撞锈）。这里把 ask
  // 派生出来交给 UI 打标签：safe 但 ask < 1pp 的标"躺"，safe 且真投装机的标"稳"。
  // 纯派生，不改任何结算数值；返回拷贝，避免污染 scenario 缓存。
  function _flDecorateClimateStance(step, scenarioId) {
    if (!step || !Array.isArray(step.options)) return step;
    if (String(scenarioId).indexOf('climate') !== 0) return step;
    var _stanceFloor = 1.0; // 与 CLIMATE_DEBT.deferAskFloor 同值
    var _effMap = step.expected_effects || {};
    var out = JSON.parse(JSON.stringify(step));
    out.options.forEach(function (o) {
      var e = _effMap[o.id] || {};
      var ask = typeof e.renewable_share_pct === 'number' ? e.renewable_share_pct : 0;
      var isSafe = o.weight === 'safe' || o.weight === 'extreme_safe';
      var num = String(Math.round(ask * 10) / 10);
      o.renew_ask = ask;
      // 四种姿态：装机（真投产能）/ 躺（safe 但没投）/ 空转（非 safe 也没投）
      // / 回退（拆掉的比建的多）。同回合内一定同时看得到对照，玩家才不会把
      // 「躺」误读成「稳」，也不会把「这一格没动」误读成「温和推进」。
      o.stance = ask < 0 ? 'rollback'
        : ask >= _stanceFloor ? 'build'
        : (isSafe ? 'idle' : 'drift');
      o.stance_label = ask < 0 ? '回退 ' + num + 'pp'
        : ask >= _stanceFloor ? (isSafe ? '稳 · 装机 +' + num : '装机 +' + num)
        : (isSafe ? '躺 · 无装机' : '空转');
    });
    return out;
  }

  function _flShuffleStepOptions(step, scenarioId, turnNumber) {
    if (!step || !Array.isArray(step.options) || step.options.length < 2) return step;
    var seed = _flOptionSeed(scenarioId);
    if (!seed) return _flDecorateClimateStance(step, scenarioId);
    var rnd = _flRng(Math.imul(seed, 2654435761) ^ Math.imul(turnNumber, 40503));
    var idx = step.options.map(function (_, i) { return i; });
    for (var i = idx.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
    }
    var letters = 'ABCDEFGH';
    var oldLetters = step.options.map(function (o, i) { return o.id || letters[i]; });
    var remap = {};
    var opts = idx.map(function (src, pos) {
      var copy = JSON.parse(JSON.stringify(step.options[src]));
      var from = oldLetters[src];
      copy._orig_id = from;
      copy.id = letters[pos];
      remap[from] = letters[pos];
      return copy;
    });
    var out = JSON.parse(JSON.stringify(step));
    out.options = opts;
    if (step.expected_effects) {
      out.expected_effects = {};
      Object.keys(step.expected_effects).forEach(function (k) {
        out.expected_effects[remap[k] || k] = step.expected_effects[k];
      });
    }
    if (step.character_reactions) {
      out.character_reactions = {};
      Object.keys(step.character_reactions).forEach(function (k) {
        out.character_reactions[remap[k] || k] = step.character_reactions[k];
      });
    }
    return _flDecorateClimateStance(out, scenarioId);
  }

  const CLIMATE_BAND_RULES = [
    { band: 'three_degrees', label: '3°C 档', min: 2.30, rule: '峰值 > 2.30°C，或执行赤字 ≥ 32，或可再生占比 < 47%（转型没落地）' },
    { band: 'two_degrees', label: '2.0°C 档', min: 1.85, rule: '1.85–2.30°C，执行赤字 < 32，可再生占比 47–58%' },
    { band: 'one_point_five', label: '1.5°C 档', min: -Infinity, rule: '峰值 < 1.85°C，执行赤字 < 32，且可再生占比 ≥ 58%' },
  ];

  // Loop 2: the headline number is "what was announced", not "what was built".
  // A run that promised far more than the state could absorb gets a deferred
  // bill, and that bill is not allowed to improve the band - otherwise
  // promising the maximum every single turn would still be the winning line.
  var CLIMATE_DEBT_BAND_LIMIT = CLIMATE_DEBT ? CLIMATE_DEBT.bandDebtWorst : 32;

  // Loop 2: the 1.5C band was being handed out on the peak number alone, so a
  // run that never converted its promises into a power system could still be
  // filed as "1.5C kept". Transition finished is part of the outcome, not a
  // side note - 1.5C without the build-out is the same lie as 1.5C with debt.
  var CLIMATE_RENEW_FLOOR = { oneFive: 58, twoC: 47 };

  function climateBandOf(temp, debt, renew) {
    var d = typeof debt === 'number' && !isNaN(debt) ? debt : 0;
    var r = typeof renew === 'number' && !isNaN(renew) ? renew : null;
    if (temp > 2.30) return CLIMATE_BAND_RULES[0];
    if (d >= CLIMATE_DEBT_BAND_LIMIT) return CLIMATE_BAND_RULES[0];
    if (r != null && r < CLIMATE_RENEW_FLOOR.twoC) return CLIMATE_BAND_RULES[0];
    if (temp >= 1.85) return CLIMATE_BAND_RULES[1];
    if (r != null && r < CLIMATE_RENEW_FLOOR.oneFive) return CLIMATE_BAND_RULES[1];
    return CLIMATE_BAND_RULES[2];
  }

  // Loop 3 · the other half of the lesson. The band line tells the player what
  // happened to the climate; this one tells them what the administration could
  // actually absorb, and what next year's envelope looks like. Without it the
  // prepare-then-strike line is unreachable by reading - the player would have
  // to reverse-engineer the capacity formula from a lost run.
  function _flClimateCapacityLine(state) {
    if (!state) return '';
    const support = state.public_support_pct == null ? 58 : state.public_support_pct;
    const trust = state.international_trust == null ? 55 : state.international_trust;
    const num = function (v) { return typeof v === 'number' ? v : null; };
    const commit = num(state.last_commitment);
    const cap = num(state.last_commitment_capacity);
    const over = num(state.last_commitment_over) || 0;
    const absorbed = num(state.last_prep_absorbed) || 0;
    const baseDefer = num(state.last_commit_base_defer) || 0;
    const prep = num(state.last_prep_credit) || 0;
    const debt = num(state.implementation_debt) || 0;
    const mandate = Math.min(1, Math.max(0, (support - 55) / 35));
    const nextCap = (CLIMATE_DEBT.capBase + ((support + trust) / 2) * CLIMATE_DEBT.capPerCapacity) *
                    (1 + CLIMATE_DEBT.mandateCap * mandate);
    // Loop 8 · 分层错位修复
    // Loop 6 把【实施能力】整段折进 <details>，本意是「机制账按需展开」。实测
    // （probe_l8_visible.mjs）：折叠块默认一个字都不可见，于是玩家读到的只有
    // 「信任 -3、CO2 +2」，看不到「这纸政令要求 27.6，行政系统只能消化 23.1」
    // ——计划谬误的核心因果恰好被藏进了第二层。这里把因果的第一句上移成独立
    // 段：段名不进 _flFbCollapsedHead 白名单，因此自动常显。句子是移位不是
    // 复制，全文仍只有一份，V17（展开后与引擎原文逐字一致）不受影响。
    const lines = [];
    if (commit != null && cap != null) {
      const gap = commit - cap;
      const rawOver = over + absorbed;
      const settled = num(state.last_commit_settled);
      // 算式按引擎真实执行顺序左到右印出来，玩家可以自己复核。单位不能标
      // 「个百分点」：承诺是加权指数（可再生能源承诺 + 花的政治资本 + 认下
      // 的 GDP 损失 + 押上的国际信任），标任何单位都是假的，所以用
      // 「要求 / 能消化」让两个数落在同一把尺子上。
      let eq = gap > 0
        ? '超出 ' + gap.toFixed(1) + ' + 固定延期 ' + baseDefer.toFixed(1) + ' = ' + rawOver.toFixed(1)
        : '没超出，但每年都有一小部分承诺被流程吃掉：固定延期 ' + baseDefer.toFixed(1) + ' = ' + rawOver.toFixed(1);
      if (absorbed > 0) eq += ' − 结余抵扣 ' + absorbed.toFixed(1) + ' → ' + over.toFixed(1);
      lines.push('【本年账目】');
      lines.push('  本年这纸政令要求 ' + commit.toFixed(1) + ' / 行政系统能消化 ' + cap.toFixed(1) +
        '（由公众支持 ' + Math.round(support) + ' 与国际信任 ' + Math.round(trust) + ' 决定）｜' +
        eq + '，× ' + CLIMATE_DEBT.overGain + ' 倍 → 本年度入账赤字 ' +
        (settled != null ? settled.toFixed(1) : (over * CLIMATE_DEBT.overGain).toFixed(1)));
    }
    lines.push('【实施能力】');
    lines.push('  下一年可承受约 ' + nextCap.toFixed(1) + '｜能力结余 ' + prep.toFixed(1) +
      ' / 上限 ' + CLIMATE_DEBT.prepCap + '｜当前执行赤字 ' + Math.round(debt) + '/100');
    // Loop 8 · 折叠块六行压到四行。
    // 合并的是行，不是信息：锈蚀与疤痕是同一件事的两个阶段（先掉能力，再永久
    // 掉基础），冲击与缺口都是"计划外的账"（一个来自外部，一个来自交付），
    // 合并后每行仍是一句完整因果，只是不再各占一行把段顶长。行数上限由
    // ui-render-assert 的 V34 盯着，长度上限由 acceptance-climate-scar 的 V30 盯着。
    var erode = num(state.last_capacity_erode);
    var streak = num(state.last_defer_streak) || 0;
    var scar = num(state.last_rust_scar) || 0;
    var erodeBits = [];
    if (erode != null && erode < 0.999) {
      erodeBits.push('制度锈蚀：连续 ' + streak + ' 年没推进产能，可承受能力只剩 ' +
        Math.round(erode * 100) + '%（队伍被调走、并网排队被占）');
    }
    if (scar > 0) {
      erodeBits.push('锈蚀疤痕：产能基础里 ' + Math.round(scar * 100) +
        '% 回不来了（补钱追不回人和并网位）');
    }
    if (erodeBits.length) lines.push('  ' + erodeBits.join('；'));
    var shock = num(state.last_shock) || 0;
    var shortfall = num(state.last_shortfall) || 0;
    var lossBits = [];
    if (shock > 0) {
      lossBits.push('外部冲击：本年可承受能力再降 ' + Math.round(shock) + '%（供应链与交付出岔子，预测里没有）');
    }
    if (shortfall > 0) {
      lossBits.push('交付缺口：少建 ' + shortfall.toFixed(1) + ' 个单位 → 转成 ' +
        (num(state.last_shortfall_debt) || 0).toFixed(2) + ' 执行赤字');
    }
    if (lossBits.length) lines.push('  ' + lossBits.join('；'));
    var proj = num(state.last_projection);
    if (proj != null) {
      lines.push('  本年度赤字预测 ' + proj.toFixed(1) + '，实际落在 ' +
        Math.max(0, proj - CLIMATE_DEBT.projectionBand).toFixed(1) + '–' +
        (proj + CLIMATE_DEBT.projectionBand).toFixed(1) +
        ' 之间（按预测下界做计划的人才有余量；区间不含交付缺口，缺口逐轮累加）');
    }
    return lines.join('\n');
  }

  // The single line a player can replay by hand: peak -> thresholds -> band.
  // Named per the P0 spec so the build script can assert it survived bundling.
  function _flClimateBudgetLine(state) {
    const peak = state && state.global_avg_temp_c;
    if (typeof peak !== 'number' || isNaN(peak)) return '【档位判定】本局峰值缺失，按最低档处理。';
    const debt = state && typeof state.implementation_debt === 'number' ? state.implementation_debt : 0;
    const band = climateBandOf(peak, debt, state && state.renewable_share_pct);
    const left = CLIMATE_ONE_FIVE_CEILING_C - peak;
    const steps = [
      '① 是否 > 2.30°C（3°C 档）：' + (peak > 2.30 ? '是' : '否'),
      '② 执行赤字是否 ≥ ' + CLIMATE_DEBT_BAND_LIMIT + '（承诺超出消化能力，3°C 档）：' +
        (debt >= CLIMATE_DEBT_BAND_LIMIT ? '是（' + Math.round(debt) + '/100）' : '否（' + Math.round(debt) + '/100）'),
      '③ 是否 ≥ 1.85°C（2.0°C 档）：' + (peak >= 1.85 ? '是' : '否'),
      '④ 本局可再生能源占比 ' + (state && typeof state.renewable_share_pct === 'number'
        ? state.renewable_share_pct.toFixed(1) + '%' : '—') +
        '（1.5°C 档要求 ≥ ' + CLIMATE_RENEW_FLOOR.oneFive + '%，2.0°C 档要求 ≥ ' + CLIMATE_RENEW_FLOOR.twoC + '%）',
    ];
    const settle = state && state._fiscal_settlement;
    if (settle && settle.turns > 0) {
      steps.push('⑤ 隐性赤字已在 T8–T10 结算 ' + settle.turns + ' 次：财政被前期承诺挤占，' +
        'GDP 累计 -' + settle.gdp.toFixed(1) + 'pp、公众支持累计 -' + settle.support.toFixed(1) +
        'pp（结算时赤字 ' + settle.debt + '/100）。这笔账在 T7 之前看不出来。');
    }
    const lines = ['【档位判定】本局峰值 ' + peak.toFixed(2) + '°C'];
    steps.forEach(s => lines.push('  ' + s));
    lines.push('  → 定档：' + band.label + '（' + band.rule + '）｜' +
      (left >= 0 ? '距 1.85°C 超调上限还剩 ' + left.toFixed(2) + '°C'
                 : '已超出 1.85°C 超调上限 ' + Math.abs(left).toFixed(2) + '°C'));
    // Coordination failure is real, but it is not a temperature band.
    const coord = state.international_trust;
    const support = state.public_support_pct;
    if ((coord != null && coord < 40) || (support != null && support < 30)) {
      lines.push('  【附加】国际信任 ' + (coord == null ? '—' : Math.round(coord)) +
        ' / 公众支持 ' + (support == null ? '—' : Math.round(support)) +
        '：跨国协调已失效，同样的减排令要多付代价。它不改变温度档位，只改写终局叙事。');
    }
    return lines.join('\n');
  }

  function inferClimateOutcome(state) {
    const temp = state && state.global_avg_temp_c;
    if (typeof temp !== 'number' || isNaN(temp)) return 'one_point_five';
    const debt = state && typeof state.implementation_debt === 'number' ? state.implementation_debt : 0;
    const renew = state && typeof state.renewable_share_pct === 'number' ? state.renewable_share_pct : null;
    // Loop 5 · A3: the verdict and the story are two different questions.
    // The band still says "this run failed"; the story must not claim a
    // temperature the run never reached. A 1.77C run that lost on build-out
    // used to be handed the 3C epilogue - the headline said "broke 3C" while
    // the data block two lines above said 1.77C. The player reads that as a
    // broken model, and stops trusting the numbers that are correct.
    const band = climateBandOf(temp, debt, renew);
    if (temp > 2.30) return 'three_degrees';
    if (band.band === 'three_degrees') {
      // Deferred work and an unfinished build-out are different failures.
      // They get different endings, and neither may borrow the other's title.
      if (debt >= CLIMATE_DEBT_BAND_LIMIT) return 'execution_collapse';
      return 'transition_unfinished';
    }
    // Under 1.85C but filed as 2C: the ceiling was met, the transition was not.
    if (band.band === 'two_degrees' && temp < 1.85) return 'transition_unfinished';
    return band.band;
  }

  // Loop 5 · B1: the projection is honest about its own blind spot only if the
  // player is told the blind spot exists. Derived from shockTurns, never typed
  // in by hand: if the model moves a shock year, this line moves with it.
  function _flClimateShockDisclosure() {
    var turns = (CLIMATE_DEBT && Array.isArray(CLIMATE_DEBT.shockTurns)) ? CLIMATE_DEBT.shockTurns : [];
    var cap = CLIMATE_DEBT && typeof CLIMATE_DEBT.shockCap === 'number'
      ? Math.round(CLIMATE_DEBT.shockCap * 100) : null;
    if (!turns.length) return '';
    var when = turns.map(function (t) { return 'T' + t; }).join('、');
    return '【历史事实 · 写给要做计划的人】\n' +
      '  过去十年里，这类计划外冲击出现在 10 年中的 ' + turns.length + ' 年（' + when + '）' +
      (cap != null ? '，每一次都让当年的可承受能力下降 ' + cap + '%' : '') + '。\n' +
      '  它没有出现在任何一年的预测里——预测算的是"今天的状态能办多少事"，而明年不是今天。\n' +
      '  所以照预测的平均值做计划的人一定会短；把下界当预算、把上界当宣传的人才有余量。';
  }


  function generateEnronFeedback(state, turnNumber) {
    const data = _loaded['enron-collapse'] || {};
    const lastStep = (data.steps || []).slice(-1)[0];
    if (!lastStep) return '';
    const targetTurn = Math.min(Math.max(1, turnNumber - 1), lastStep.turn);
    const step = findStep(data, targetTurn);
    if (!step) return '';
    if (step.is_final_outcome) {
      return generateEnronOutcome(state, data);
    }
    if (step.is_pattern_reveal) {
      return generateEnronReveal(state, step, turnNumber, data);
    }
    return buildActionFeedback(state, data, step, turnNumber, 'enron-collapse');
  }

  function generateEnronReveal(state, step, turnNumber, data) {
    return buildRevealFeedback(state, step, turnNumber, data, 'enron-collapse');
  }

  function generateEnronOutcome(state, data) {
    const outcomeType = inferEnronOutcome(state);
    const endings = data.outcome_endings || {};
    const ending = endings[outcomeType] || {};
    const parts = [];
    if (ending.narrative) {
      parts.push(interpolateOutcomeTemplate(ending.narrative, state, data));
    } else {
      parts.push('【终局】');
      if (ending.narrative_intro) parts.push(interpolateOutcomeTemplate(ending.narrative_intro, state, data));
      (ending.timeline || []).forEach(l => parts.push('  • ' + interpolateOutcomeTemplate(l, state, data)));
      parts.push('');
      if (ending.dorner_reflection) parts.push('【Dörner 反思】\n' + interpolateOutcomeTemplate(ending.dorner_reflection, state, data));
      if (ending.teaching_questions && ending.teaching_questions.length) {
        parts.push('\n【教学问题】');
        ending.teaching_questions.forEach((q, i) => parts.push('  ' + (i + 1) + '. ' + interpolateOutcomeTemplate(q, state, data)));
      }
    }
    if (!parts.length) parts.push('已记录。');
    return parts.join('\n');
  }

  function inferEnronOutcome(state) {
    const cashflow = state.actual_cashflow_usd_m;
    const price = state.share_price_usd;
    const exposure = state.off_balance_sheet_exposure_usd_m;
    const legal = state.legal_exposure_level || 0;
    // A real cash-flow turnaround inside ten turns is arithmetically
    // impossible here (the starting hole is -150M), so "orderly resolution"
    // has to mean what it actually means: the board took control and the
    // scepticism died down because the numbers were finally shown.
    if (legal >= 3 || (price != null && price < 1) || (cashflow != null && cashflow < -800)) return 'total_collapse';
    // A veil of paper that keeps growing is itself the failure: once the
    // structures are too big to unwind inside the window, even a competent
    // board is only left cleaning up.
    if (exposure != null && exposure >= 9000 && cashflow != null && cashflow < -400) return 'total_collapse';
    const oversight = state.board_oversight_strength == null ? 60 : state.board_oversight_strength;
    const skepticism = state.media_skepticism_index == null ? 20 : state.media_skepticism_index;
    // Order does not come from good intentions at the microphone. It comes from
    // the off-balance-sheet book actually coming back inside - disclosure that
    // does not shrink the number is just better public relations.
    const unwound = exposure != null && exposure <= 4000;
        // Thresholds a real board can actually reach. At 80/15 the "tear it down"
    // path was formally possible but statistically invisible: the player who
    // disclosed for four turns still got the same epilogue as the one who hid,
    // which teaches that doing the right thing changes nothing.
    if (oversight >= 70 && skepticism <= 22 && unwound) return 'orderly_resolution';
    return 'partial_collapse';
  }

  function generateGenericFeedback(state, turnNumber) {
    const parts = [];
    parts.push('Turn ' + turnNumber + ' 已完成。');
    return parts.join('\n');
  }

  // =========================================================================
  // Noodle shop / Chip supply-chain shared feedback generators
  // =========================================================================
  function generateNoodleFeedback(state, turnNumber) {
    return generateShopFeedback(state, turnNumber, 'noodle-shop-community');
  }

  function generateChipFeedback(state, turnNumber) {
    return generateShopFeedback(state, turnNumber, 'chip-ai-supplychain');
  }

  function generateShopFeedback(state, turnNumber, id) {
    const data = _loaded[id] || {};
    const steps = data.steps || [];
    if (!steps.length) return '';
    const lastStep = steps[steps.length - 1];
    const targetTurn = Math.min(Math.max(1, turnNumber - 1), lastStep.turn);
    const step = findStep(data, targetTurn);
    if (!step) return '';
    if (step.is_final_outcome) {
      const ending = generateShopOutcome(state, step, data);
      // The closing turn is still charged interest; print that last bill above
      // the ending so it is not the only one the player never sees.
      if (id === 'chip-ai-supplychain') {
        const lastInterest = _flChipInterestLine(state);
        if (lastInterest) return lastInterest + '\n\n' + ending;
      }
      return ending;
    }
    if (step.is_pattern_reveal) {
      return generateShopReveal(state, step, turnNumber, data);
    }
    return generateShopActionFeedback(state, step, turnNumber, id);
  }

  function generateShopActionFeedback(state, step, turnNumber, scenarioId) {
    const id = scenarioId || 'noodle-shop-community';
    return buildActionFeedback(state, _loaded[id] || {}, step, turnNumber, id);
  }

  function generateShopReveal(state, step, turnNumber, data) {
    return buildRevealFeedback(state, step, turnNumber, data, data.scenarioId || 'noodle-shop-community');
  }

  function generateShopOutcome(state, step, data) {
    // 同 challenger：step 是未洗牌的终局步，last_chosen_option 记的是洗牌槽位，
    // 拿它查原始 step 会读到另一个选项的 trigger_outcome（P0 同源问题）。
    const chosenOptionId = _flFinalOrigOptionId(state, step.turn) || 'A';
    const option = findOption(step, chosenOptionId);
    // The ten turns decide the ending. A single final click may overwrite it,
    // but that rewrite is exactly the failure mode Dorner warns about, so it
    // gets named out loud instead of silently replacing the record.
    const inferred = inferShopOutcome(state, data.scenarioId);
    const declared = option ? (option.trigger_outcome || '') : '';
    const outcomeType = declared || inferred;
    const rewritten = !!declared && declared !== inferred;
    const endings = data.outcome_endings || {};
    const ending = endings[outcomeType] || {};
    const parts = [];
    parts.push('='.repeat(60));
    parts.push('【终局】' + (ending.title ? ' ' + ending.title : ''));
    parts.push('='.repeat(60));
    parts.push('');
    if (ending.narrative_intro) parts.push(interpolateOutcomeTemplate(ending.narrative_intro, state, data));
    (ending.timeline || []).forEach(l => parts.push('  • ' + interpolateOutcomeTemplate(l, state, data)));
    parts.push('');
    if (rewritten) {
      parts.push('【注意：你改写了结局，但没有改写过程】');
      parts.push('  按前十回合的实际指标，这本该是「' + ((endings[inferred] || {}).title || inferred) + '」。');
      parts.push('  最后一回合的公开表态把叙事扭向了「' + (ending.title || outcomeType) + '」——');
      parts.push('  但数字没有变，那些代价仍然记在账上。Dörner 把这叫「用最后一个动作改写记忆」。');
      parts.push('');
    }
    if (ending.dorner_reflection) parts.push('【Dörner 反思】\n' + interpolateOutcomeTemplate(ending.dorner_reflection, state, data));
    parts.push('');
    // A "good" ending without its bill is just a reward screen. Show what the
    // win cost, and how much of it was luck rather than skill.
    if (ENDING_COST_STYLE && ending.hidden_costs && ending.hidden_costs.length) {
      parts.push('【代价确认 —— 好结局也要付账】');
      ending.hidden_costs.forEach(l => parts.push('  • ' + interpolateOutcomeTemplate(l, state, data)));
      parts.push('');
    }
    if (ENDING_COST_STYLE && ending.luck_note) {
      parts.push('【不可归因于你的部分】');
      parts.push('  ' + interpolateOutcomeTemplate(ending.luck_note, state, data));
      parts.push('');
    }
    if (ending.teaching_questions && ending.teaching_questions.length) {
      parts.push('【教学问题】');
      ending.teaching_questions.forEach((q, i) => parts.push('  ' + (i + 1) + '. ' + interpolateOutcomeTemplate(q, state, data)));
    }
    if (!parts.length) parts.push('已记录。');
    return parts.join('\n');
  }

  function inferShopOutcome(state, id) {
    if (id === 'noodle-shop-community') {
      const reputation = state.reputation || 0;
      const debt = state.debt || 0;
      const netEquity = state.net_equity || 1;
      if (debt > netEquity) return 'expansion_bankruptcy';
      if (reputation >= 65 && debt <= 0) return 'long_term_success';
      return 'warm_water_frog';
    }
    // chip-ai-supplychain
    // Four distinct states need four distinct exits, otherwise wildly
    // different ten-turn trajectories collapse into one epilogue and the
    // player learns nothing from the difference.
    const cf = state.cash_flow || 0;
    const debtRatio = state.debt_ratio || 0;
    const sr = state.self_reliance || 0;
    const yld = state.yield_rate == null ? 78 : state.yield_rate;
    if (debtRatio > 90) return 'cash_trap';          // leverage ate the company
    // Breakthrough is a process question, not a cash question. Three things
    // matter: the process yields, half the stack is domestic, the leverage is
    // survivable. Two of three - with cash not blown through - is a real
    // breakthrough; requiring all three makes the ending unreachable and the
    // lesson becomes "nothing you do matters".
    const checks = [yld >= 80, sr >= 50, debtRatio <= 60].filter(Boolean).length;
    if (checks >= 2 && cf >= -8) return 'tech_breakthrough';
    if (cf > 0 && sr < 45) return 'exit';             // alive but hollow: sold off
    if (cf <= 0 && sr < 40) return 'exit';            // neither money nor tech
    return 'bailout';                                // tech survives, state pays
  }

  // =========================================================================
  // Scenario-specific apply_turn implementations
  // =========================================================================
  async function applyChallengerTurn(state, optionId, justification) {
    const data = await loadScenario('challenger-launch');
    const currentTurn = state.turn_number || 1;
    // 与 applyClimateTurn 同一口径：getScenarioStep 交给玩家的 A/B/C/D 是本次 run
    // 洗牌后的槽位，结算必须解同一份排列。少了这一步，屏幕上「接受风险并推进」
    // 的按钮会按原槽位的 effects 结算——T-6 要记的两个计数会记成别人的账。
    const step = _flShuffleStepOptions(findStep(data, currentTurn), 'challenger-launch', currentTurn);
    if (!step) return state;

    const option = findOption(step, optionId);
    if (!option) return state;

    const effects = step.expected_effects && step.expected_effects[optionId] || {};
    applyEffects(state, effects);

    const sanitized = escapeJustification(justification);
    if (sanitized) {
      state.decision_justifications = state.decision_justifications || {};
      state.decision_justifications[String(currentTurn)] = sanitized;
    }
    const lastCtx = state._last_option_context;
    if (lastCtx != null) lastCtx.justification = sanitized;
    state.last_chosen_option = optionId;

    // Deferred consequences
    const queue = state.consequence_deferred_queue || [];
    if (queue.length) {
      const newQueue = [];
      queue.forEach(entry => {
        let resolved = false;
        if (entry === 'data_review_meeting' && currentTurn >= 3) {
          state.risk_acknowledged_unresolved = (state.risk_acknowledged_unresolved || 0) + 1;
          resolved = true;
        } else if (entry === 'cross_dept_meeting' && currentTurn >= 3) {
          state.dissent_suppressed_count = (state.dissent_suppressed_count || 0) + 1;
          resolved = true;
        } else {
          newQueue.push(entry);
        }
        if (resolved) {
          // V2: stamp the ledger so the timeline can say "planted at T2, fired
          // at T5" instead of a vague "something is still pending".
          const led = (state.deferred_ledger || []).filter(
            (d) => d && d.key === entry && d.resolved_turn == null
          );
          if (led.length) led[0].resolved_turn = currentTurn;
        }
      });
      state.consequence_deferred_queue = newQueue;
    }

    // Clamp
    ['engineer_confidence', 'schedule_pressure', 'public_attention', 'team_morale', 'temperature_forecast_f'].forEach(key => {
      if (state[key] != null && typeof state[key] === 'number') {
        state[key] = key === 'temperature_forecast_f' ? clamp(state[key], -30, 120) : clamp(state[key], 0, 100);
      }
    });
    if (state.budget_used_pct != null) state.budget_used_pct = clamp(state.budget_used_pct, 0, 200);
    ['accepted_risks_count', 'ignored_warnings_count', 'risk_acknowledged_unresolved', 'dissent_suppressed_count'].forEach(key => {
      if (state[key] != null) state[key] = Math.max(0, state[key]);
    });

    // Record decision history
    state.decision_history = state.decision_history || [];
    state.decision_history.push({
      turn: currentTurn,
      option_id: optionId,
      option_text: option.text || '',
      option_consequences_for_player: option.consequences_for_player || '',
      option_orig_id: option._orig_id || optionId,
      option_weight: option.weight || 'neutral',
      expected_concerns_addressed: option.expected_concerns_addressed || [],
      // L0-2 · 目标冲突仪表只认已提交的决策。这三个字段是标注层（L1-0）的
      // 设计意图，engine 不拿它们算数，只负责把它们带进 history —— 否则渲染层
      // 只能拿 concerns 短语反推"牺牲了哪个目标"，而反推必错：短语说的是
      // 「照顾了什么」，照顾 A 不等于牺牲 B（可同时照顾 A 和 B）。
      behavior: option.behavior || '',
      goal_axis: Array.isArray(option.goal_axis) ? option.goal_axis.slice() : [],
      goal_sacrificed: Array.isArray(option.goal_sacrificed) ? option.goal_sacrificed.slice() : [],
      applied_effects: effects,
      justification: sanitized,
    });

    return state;
  }

  async function applyClimateTurn(state, optionId, justification) {
    const data = await loadScenario('climate-change-policy');
    const currentTurn = state.turn_number || 1;
    // Resolve through the same seeded permutation the player was looking at,
    // otherwise slot A on screen would apply the effects of the old slot A.
    const step = _flShuffleStepOptions(findStep(data, currentTurn), 'climate-change-policy', currentTurn);
    if (!step) return state;
    const option = findOption(step, optionId);
    if (!option) return state;
    const effects = step.expected_effects && step.expected_effects[optionId] || {};
    // Political capital gate. The same decree costs more to pass once the
    // public has stopped listening and the treaty partners have walked: a
    // delayed intervention is not just late, it is weaker. This is the only
    // path-dependency a ten-turn climate model can honestly model.
    const support = state.public_support_pct == null ? 58 : state.public_support_pct;
    const trust = state.international_trust == null ? 55 : state.international_trust;
    const capital = Math.min(1, Math.max(0, ((support + trust) / 2) / 75));
    const factor = 0.35 + 0.65 * capital;
    const eff = Object.assign({}, effects);

    // --- implementation debt: what this decree asks vs what can be absorbed ---
    // Tuning hook: allows an offline harness to sweep parameters without
    // editing the file. In normal play window.__FL_CDEBT__ is undefined.
    var _C = (typeof window !== 'undefined' && window.__FL_CDEBT__)
      ? Object.assign({}, CLIMATE_DEBT, window.__FL_CDEBT__)
      : CLIMATE_DEBT;
    var _commit = climateCommitment(eff);
    var _capacity = _C.capBase + ((support + trust) / 2) * _C.capPerCapacity;
    // Loop 4 · the price of not deciding. A turn that asks for no build-out is
    // not a neutral pause: the queue moves on without you, the planning team is
    // reassigned, the contractor signs elsewhere - so next year the identical
    // decree buys less. The streak resets on any turn that actually asks for
    // capacity, and the first quiet year is tolerated as preparation.
    var _renewAsk = typeof eff.renewable_share_pct === 'number' ? eff.renewable_share_pct : 0;
    var _deferStreak = typeof state._defer_streak === 'number' ? state._defer_streak : 0;
    if (_renewAsk >= _C.deferAskFloor) {
      _deferStreak = 0;
    } else {
      _deferStreak += 1;
    }
    state._defer_streak = _deferStreak;
    var _erode = 1 - Math.min(_C.deferCap, _C.deferSlope * Math.max(0, _deferStreak - _C.deferGrace));
    // Loop 7 · the scar. Erosion is this year's discount; the scar is what the
    // quiet years took away for good. It is deposited from the depth of this
    // year's erosion and never paid back - resuming the build-out restores
    // _erode to 1.0, which is exactly why the player needs a second figure to
    // look at in that turn.
    var _scar = typeof state._rust_scar === 'number' ? state._rust_scar : 0;
    if (1 - _erode > 0) {
      _scar = Math.min(_C.rustCap, _scar + _C.rustGain * (1 - _erode));
    }
    state._rust_scar = _scar;
    // Loop 4 · shocks the projection cannot see. Every figure the player reads
    // is computed from today's state; the year is not today. Capacity is
    // knocked out *after* the decree is announced, which is exactly why a line
    // needs margin instead of an exact plan.
    var _isShock = (_C.shockTurns || []).indexOf(currentTurn) >= 0;
    var _shockFactor = _isShock ? (1 - _C.shockCap) : 1;
    // Loop 3 · route 2. Two levers make a big decree affordable, and both are
    // things the player has to have built *before* the decree:
    //   1. a mandate - a government the public still backs can push a promise
    //      through its own administration instead of deferring it;
    //   2. a coalition - a promise made with partners is implemented once and
    //      shared, so the same tonne costs less friction.
    var _mandate = Math.min(1, Math.max(0, (support - 55) / 35));
    _capacity = _capacity * (1 + _C.mandateCap * _mandate) * _erode * (1 - _scar) * _shockFactor;
    state.last_capacity_erode = Math.round(_erode * 100) / 100;
    state.last_rust_scar = Math.round(_scar * 100) / 100;
    state.last_shock = _isShock ? Math.round((1 - _shockFactor) * 100) : 0;
    state.last_defer_streak = _deferStreak;
    var _coord = Math.min(1, Math.max(0, (trust - 45) / 35));
    var _coordBonus = 1 + _C.coordBonus * _coord;
    var _rawOver = Math.max(0, _commit - _capacity) + _commit * _C.baseDefer;
    var _over = _rawOver;
    // Stored capacity: turns spent inside the envelope (consolidation, repair,
    // small steps) leave the administration with real headroom. That headroom
    // is what a big push spends later, and it is the only reason sequencing
    // - prepare, then strike - beats promising the maximum every single turn.
    var _prep = typeof state._prep_credit === 'number' ? state._prep_credit : 0;
    var _absorbed = Math.min(_prep, _over * _C.prepAbsorb);
    _over -= _absorbed;
    _prep -= _absorbed;
    // Loop 8 · the one figure a player can check by hand. last_commitment_over
    // is the amount *before* overGain is applied, so quoting it as
    // 「本年度计入赤字」made the only visible arithmetic wrong by a factor of 1.2.
    // Keep the settled value beside it; the feedback then prints
    // 超出 + 固定延期 − 结余抵扣 → ×overGain.
    state.last_commit_raw_over = Math.round(_rawOver * 10) / 10;
    state.last_commit_settled = Math.round(_over * _C.overGain * 10) / 10;
    // Headroom is banked against the decree itself, not against the deferral
    // overhead: a turn whose promise fits inside capacity leaves room to build,
    // and that room is what lets a later big push land without a deferred bill.
    var _headroom = Math.max(0, _capacity - _commit);
    if (_headroom > 0) {
      // A state that has lost its mandate cannot bank much: the same headroom
      // is eaten by consultations, reviews and re-announcements.
      _prep = Math.min(_C.prepCap, _prep + _headroom * _C.prepGain * (0.55 + 0.45 * _mandate));
    }
    state._prep_credit = Math.round(_prep * 10) / 10;
    state.last_prep_credit = state._prep_credit;
    state.last_prep_absorbed = Math.round(_absorbed * 10) / 10;
    var _debt = typeof state.implementation_debt === 'number' ? state.implementation_debt : 0;
    var _debtBefore = _debt;
    _debt = _debt + _over * _C.overGain;
    // Lurching between ambitions never gets built. Smooth ramp-downs are free.
    var _prevCommit = typeof state._last_commitment === 'number' ? state._last_commitment : _commit;
    // A ramp-up that was paid for out of banked headroom is not a lurch: the
    // capacity to absorb it was planned, not improvised.
    var _swing = Math.max(0, Math.abs(_commit - _prevCommit) - _C.jumpDeadzone - _absorbed * _C.swingCushion);
    _debt = _debt + _swing * _C.jumpGain;
    state.implementation_debt = Math.min(100, Math.max(0, _debt));
    // What the player was told last turn, kept for the honest comparison: the
    // projection is arithmetic, the settlement is the year.
    state.last_projection = Math.round((_debtBefore + _over * _C.overGain + _swing * _C.jumpGain) * 10) / 10;
    state._last_commitment = _commit;
    // Direction reversals are not free even when they are cheap on paper: a
    // programme that turns around every year never finishes the plant it
    // started, so the fossil stock it was meant to retire stays in service.
    // Only real moves count - a turn with no build-out is silence, not a flip.
    var _dirNow = typeof eff.renewable_share_pct === 'number' ? Math.sign(eff.renewable_share_pct) : 0;
    if (_dirNow !== 0) {
      if (typeof state._renew_dir === 'number' && state._renew_dir !== 0 && state._renew_dir !== _dirNow) {
        state._flip_streak = Math.min(6, (state._flip_streak || 0) + 1);
      } else {
        state._flip_streak = Math.max(0, (state._flip_streak || 0) - 0.5);
      }
      state._renew_dir = _dirNow;
    }
    // ---------------------------------------------------------------
    // Loop 2 · monotony. Reading every turn and then picking the same
    // *kind* of answer anyway is the failure this scenario teaches: the
    // player stops checking. Eight of ten turns on one posture is not
    // consistency, it is a rule of thumb - so the administration stops
    // improvising, deliveries slip, and the public notices the absence
    // of judgement. A mixed but coherent line pays no such tax.
    // ---------------------------------------------------------------
    var _posture = option.weight || 'neutral';
    state._posture_counts = state._posture_counts || { safe: 0, risky: 0, neutral: 0 };
    state._posture_counts[_posture] = (state._posture_counts[_posture] || 0) + 1;
    var _seen = (state._posture_counts.safe || 0) + (state._posture_counts.risky || 0) + (state._posture_counts.neutral || 0);
    var _mono = _seen ? Math.max(state._posture_counts.safe || 0, state._posture_counts.risky || 0, state._posture_counts.neutral || 0) / _seen : 0;
    state._monotony = Math.round(_mono * 100) / 100;
    // Loop 3 bugfix: the ramp was unclamped, so on the first turns of a run
    // (_mono*_seen < 6) the expression went negative and monotony became a
    // *bonus* (+6% delivery for one-posture play). It must only ever subtract.
    // The tax is on the *habit*, not on the label: any single posture held
    // past 70% of the turns starts costing delivery, ramping to -40% at a
    // perfectly uniform line, and it starts biting at T4 rather than T5 so a
    // ten-turn run cannot be won on autopilot before the tax exists.
    var _monoPenalty = currentTurn >= 4
      ? 1 - Math.min(_C.monoCap, Math.max(0, _C.monoSlope * (_mono - _C.monoKnee) / 0.30))
      : 1;
    state.last_commitment = Math.round(_commit * 10) / 10;
    state.last_commitment_over = Math.round(_over * 10) / 10;
    state.last_commitment_capacity = Math.round(_capacity * 10) / 10;
    state.last_commit_base_defer = Math.round(_commit * _C.baseDefer * 10) / 10;
    state._commit_sum = (state._commit_sum || 0) + _commit;
    // Loop 8 · 「说得多还是做得少」不能靠两个均值比出来。
    // 均值会被"前几年试探、后几年猛冲"抹平，而失败逻辑要抓的正是那几年的
    // 越线。这里数的是：十年里有几年，这一年的承诺指数压过了行政系统当年
    // 能消化的量。结语用它定性，均值只用来展示。
    state._over_years = (state._over_years || 0) + (_commit > _capacity ? 1 : 0);
    state._capacity_sum = (state._capacity_sum || 0) + _capacity;
    state._commit_turns = (state._commit_turns || 0) + 1;

    // Debt eats the build-out first: the same decree delivers less. The flip
    // side is the whole lesson: a state that kept headroom last turn can
    // actually spend it - slack is stored capacity, not wasted ambition.
    var _drag = Math.min(_C.renewDrag, state.implementation_debt / _C.renewDragScale);
    // Stored capacity compounds: each turn spent under the threshold adds to
    // what the administration can actually deliver next turn.
    var _streak = state.implementation_debt <= _C.slackThreshold ? (state._slack_streak || 0) + 1 : 0;
    state._slack_streak = _streak;
    var _slack = Math.min(_C.slackCap, 1 + _C.slackStep * _streak);
    // Delivery is never exactly what was decreed: a grid connection slips, the
    // contractor loses a crew, a mild winter moves demand. The draw is seeded
    // off the run seed, so a replay is identical while two administrations on
    // the same policy still land differently - which is why a line needs a
    // margin, not just a plan.
    var _dseed = _flOptionSeed('climate-change-policy');
    var _drnd = _flRng(Math.imul(_dseed + 7, 2246822519) ^ Math.imul(currentTurn + 1, 2654435761));
    var _delivery = (_C.deliveryLo + (_C.deliveryHi - _C.deliveryLo) * _drnd()) *
      (_isShock ? _C.shockDelivery : 1);
    var _promisedPp = 0;
    // Cleared every turn: a stale gap from last year must not be re-counted as
    // if it happened again (the debt it produced is already on the meter).
    state.last_shortfall = 0;
    state.last_shortfall_debt = 0;
    if (typeof eff.renewable_share_pct === 'number' && eff.renewable_share_pct > 0) {
      // What the administration set out to deliver, before the year had its say.
      _promisedPp = eff.renewable_share_pct * factor * (1 - _drag) * _slack * _coordBonus;
      eff.renewable_share_pct = Math.round(eff.renewable_share_pct * factor * (1 - _drag) * _slack * _monoPenalty * _coordBonus * _delivery * 10) / 10;
      // Loop 4 - the promise that was not kept. A decree is a promise of pp of
      // build-out; a slipped crew, a late permit or a missed shipment means
      // less was delivered - and less delivered is exactly the deferred work
      // the debt meter exists to count. This is what turns the projection from
      // arithmetic into a forecast: right about the paperwork, wrong about the
      // year.
      var _shortfall = Math.max(0, Math.round((_promisedPp - eff.renewable_share_pct) * 10) / 10);
      state.last_shortfall = _shortfall;
      if (_shortfall > 0) {
        state.implementation_debt = Math.min(100, Math.round(
          (state.implementation_debt + _shortfall * _C.shortfallGain) * 10) / 10);
        state.last_shortfall_debt = Math.round(_shortfall * _C.shortfallGain * 100) / 100;
      } else {
        state.last_shortfall_debt = 0;
      }
    }
    state.last_slack_bonus = _slack;
    // Headroom also shows up in the things this decree buys outright, not just
    // in the build-out rate.
    if (typeof eff.global_avg_temp_c === 'number' && eff.global_avg_temp_c < 0) {
      eff.global_avg_temp_c = Math.round(eff.global_avg_temp_c * _slack * 100) / 100;
    }
    if (typeof eff.tipping_point_proximity === 'number' && eff.tipping_point_proximity < 0) {
      eff.tipping_point_proximity = Math.round(eff.tipping_point_proximity * _slack * 10) / 10;
    }
    state.last_delivery_drag = Math.round(_drag * 100) / 100;
    state.last_delivery = Math.round(_delivery * 100) / 100;
    state.last_effectiveness = Math.round(factor * (1 - _drag) * 100) / 100;
    state.last_mandate = Math.round(_mandate * 100) / 100;
    state.last_coordination = Math.round(_coord * 100) / 100;
    applyEffects(state, eff);
    const sanitized = escapeJustification(justification);
    if (sanitized) {
      state.decision_justifications = state.decision_justifications || {};
      state.decision_justifications[String(currentTurn)] = sanitized;
    }
    state.last_chosen_option = optionId;
    state.decision_history = state.decision_history || [];
    state.decision_history.push({
      turn: currentTurn,
      option_id: optionId,
      option_text: option.text || '',
      option_consequences_for_player: option.consequences_for_player || '',
      option_orig_id: option._orig_id || optionId,
      option_weight: option.weight || 'neutral',
      // 派生层（primary_focus_dimension_count）只读 history，不看选项对象；
      // 这里少记一个字段，复盘就少一个能归因的维度。
      expected_concerns_addressed: option.expected_concerns_addressed || [],
      // L0-2 · 目标冲突仪表只认已提交的决策。这三个字段是标注层（L1-0）的
      // 设计意图，engine 不拿它们算数，只负责把它们带进 history —— 否则渲染层
      // 只能拿 concerns 短语反推"牺牲了哪个目标"，而反推必错：短语说的是
      // 「照顾了什么」，照顾 A 不等于牺牲 B（可同时照顾 A 和 B）。
      behavior: option.behavior || '',
      goal_axis: Array.isArray(option.goal_axis) ? option.goal_axis.slice() : [],
      goal_sacrificed: Array.isArray(option.goal_sacrificed) ? option.goal_sacrificed.slice() : [],
      applied_effects: eff,
      effectiveness: state.last_effectiveness,
      justification: sanitized,
    });
    return state;
  }

  async function applyEnronTurn(state, optionId, justification) {
    const data = await loadScenario('enron-collapse');
    const currentTurn = state.turn_number || 1;
    // 必须与 getScenarioStep 同排列（见 _flShuffleStepOptions）：
    // 未洗牌的 step 里 A/B/C/D 与玩家屏幕上的槽位不是同一套，直接结算会错位。
    const step = _flShuffleStepOptions(findStep(data, currentTurn), 'enron-collapse', currentTurn);
    if (!step) return state;
    const option = findOption(step, optionId);
    if (!option) return state;
    const effects = step.expected_effects && step.expected_effects[optionId] || {};
    applyEffects(state, effects);
    // Unwinding a special-purpose entity is not a one-off line item. Once the
    // structure is opened up, the vehicles keep shrinking every turn on their
    // own; if it is never opened, it keeps growing. That asymmetry is the whole
    // lesson, and it was missing while exposure could only move via a single
    // click's delta.
    if ((effects.off_balance_sheet_exposure_usd_m || 0) < 0) state.unwind_started = true;
    const sanitized = escapeJustification(justification);
    if (sanitized) {
      state.decision_justifications = state.decision_justifications || {};
      state.decision_justifications[String(currentTurn)] = sanitized;
    }
    state.last_chosen_option = optionId;
    state.decision_history = state.decision_history || [];
    state.decision_history.push({
      turn: currentTurn,
      option_id: optionId,
      option_text: option.text || '',
      option_consequences_for_player: option.consequences_for_player || '',
      option_orig_id: option._orig_id || optionId,
      option_weight: option.weight || 'neutral',
      expected_concerns_addressed: option.expected_concerns_addressed || [],
      // L0-2 · 目标冲突仪表只认已提交的决策。这三个字段是标注层（L1-0）的
      // 设计意图，engine 不拿它们算数，只负责把它们带进 history —— 否则渲染层
      // 只能拿 concerns 短语反推"牺牲了哪个目标"，而反推必错：短语说的是
      // 「照顾了什么」，照顾 A 不等于牺牲 B（可同时照顾 A 和 B）。
      behavior: option.behavior || '',
      goal_axis: Array.isArray(option.goal_axis) ? option.goal_axis.slice() : [],
      goal_sacrificed: Array.isArray(option.goal_sacrificed) ? option.goal_sacrificed.slice() : [],
      applied_effects: effects,
      justification: sanitized,
    });
    return state;
  }

  // =========================================================================
  // Public API — mirrors backend endpoints
  // =========================================================================
  const OfflineEngine = {
    // P0 #10: synchronous, always-available list of playable scenario ids.
    // HomeStats needs a number at paint time and getScenarios() is async.
    get scenarioIds() {
      return Object.keys(SCENARIO_FILES);
    },

    async getScenarios() {
      const data = await loadScenario('challenger-launch');
      const scenarioList = [
        {
          id: 'challenger-launch',
          name: data.title || '挑战者号发射决策',
          description: data.description || '',
          fullDescription: data.description || '',
          difficulty: data.difficulty || 'advanced',
          estimatedDuration: data.estimatedDuration || 45,
          targetPatterns: (data.dornerLessons || []).slice(0, 3),
          decisionPattern: 'Dörner 8 模式·航天决策',
          duration: '30-45分钟',
          category: data.category || '重大工程决策',
          thumbnail: 'assets/images/challenger.svg',
          advancedChallenges: [],
          scenario_file: 'scenarios/challenger_launch.json',
        },
        {
          id: 'climate-change-policy',
          name: (await loadScenario('climate-change-policy')).title || '全球气候政策十年',
          description: (await loadScenario('climate-change-policy')).description || '',
          fullDescription: (await loadScenario('climate-change-policy')).description || '',
          difficulty: 'advanced',
          estimatedDuration: 45,
          targetPatterns: ['F1_nonlinear', 'F2_time_delay', 'F3_self_reference', 'F4_side_effects'],
          decisionPattern: 'Dörner 8 模式·气候治理',
          duration: '30-45分钟',
          category: '重大公共决策',
          thumbnail: 'assets/images/climate.svg',
          advancedChallenges: [],
          scenario_file: 'scenarios/climate_change.json',
        },
        {
          id: 'enron-collapse',
          name: (await loadScenario('enron-collapse')).title || '安然帝国崩塌',
          description: (await loadScenario('enron-collapse')).description || '',
          fullDescription: (await loadScenario('enron-collapse')).description || '',
          difficulty: 'advanced',
          estimatedDuration: 45,
          targetPatterns: ['F1_nonlinear', 'F2_time_delay', 'F3_self_reference', 'F4_side_effects'],
          decisionPattern: 'Dörner 8 模式·企业崩塌',
          duration: '30-45分钟',
          category: '企业决策失败·深度',
          thumbnail: 'assets/images/enron.svg',
          advancedChallenges: [],
          scenario_file: 'scenarios/enron_collapse.json',
        },
        {
          id: 'noodle-shop-community',
          name: (await loadScenario('noodle-shop-community')).title || '老周家牛肉面馆',
          description: (await loadScenario('noodle-shop-community')).description || '',
          fullDescription: (await loadScenario('noodle-shop-community')).description || '',
          difficulty: 'advanced',
          estimatedDuration: 40,
          targetPatterns: ['goal_drift', 'single_target_optimization', 'time_delay_blindness', 'nonlinearity', 'linear_extrapolation', 'negative_trend', 'confirmation_bias', 'overcorrection'],
          decisionPattern: 'Dörner 8 模式·社区经营',
          duration: '40分钟',
          category: '社区经营决策·深度',
          thumbnail: 'assets/images/noodle-shop.svg',
          advancedChallenges: [],
          scenario_file: 'scenarios/noodle_shop_community.json',
        },
        {
          id: 'chip-ai-supplychain',
          name: (await loadScenario('chip-ai-supplychain')).title || '华芯突围：AI芯片供应链',
          description: (await loadScenario('chip-ai-supplychain')).description || '',
          fullDescription: (await loadScenario('chip-ai-supplychain')).description || '',
          difficulty: 'advanced',
          estimatedDuration: 45,
          targetPatterns: ['linear_extrapolation', 'confirmation_bias', 'single_target_optimization', 'local_optimization', 'time_delay_blindness', 'problem_delay_exposure', 'overcorrection', 'self_reference'],
          decisionPattern: 'Dörner 8 模式·产业战略',
          duration: '45分钟',
          category: '产业战略决策·深度',
          thumbnail: 'assets/images/chip-ai.svg',
          advancedChallenges: [],
          scenario_file: 'scenarios/chip_ai_supplychain.json',
        },
      ];
      return { scenarios: scenarioList };
    },

    async getScenario(scenarioId) {
      const data = await loadScenario(scenarioId);
      return {
        id: data.scenarioId || scenarioId,
        name: data.title || scenarioId,
        description: data.description || '',
        fullDescription: data.description || '',
        difficulty: data.difficulty || 'advanced',
        estimatedDuration: data.estimatedDuration || 45,
        category: data.category || '',
        thumbnail: data.thumbnail || '',
        advancedChallenges: [],
        scenario_file: data.scenarioId ? 'scenarios/' + data.scenarioId + '.json' : '',
      };
    },


    async getScenarioStep(scenarioId, turnNumber) {
      const data = await loadScenario(scenarioId);
      const step = findStep(data, turnNumber);
      if (!step) {
        return { error: 'step data not available for ' + scenarioId + ' turn ' + turnNumber, status: 404 };
      }
      return _flShuffleStepOptions(step, scenarioId, turnNumber);
    },

    // Public projection of a climate decree: how much of this promise can the
    // state absorb this year, and what would it cost in deferred delivery?
    // The UI shows it as the capacity bar; the player uses it to decide whether
    // to strike now or bank one more turn of headroom. Same arithmetic as the
    // settlement path, so the bar never lies about the bill.
    planClimateOption(state, effects) {
      const s = state || {};
      const support = s.public_support_pct == null ? 58 : s.public_support_pct;
      const trust = s.international_trust == null ? 55 : s.international_trust;
      const C = (typeof window !== 'undefined' && window.__FL_CDEBT__)
        ? Object.assign({}, CLIMATE_DEBT, window.__FL_CDEBT__)
        : CLIMATE_DEBT;
      const eff = effects || {};
      const commit = climateCommitment(eff);
      const mandate = Math.min(1, Math.max(0, (support - 55) / 35));
      const coordination = Math.min(1, Math.max(0, (trust - 45) / 35));
      const capacityRaw = (C.capBase + ((support + trust) / 2) * C.capPerCapacity) *
                       (1 + C.mandateCap * mandate);
      // Loop 4: the bar must also show the price of not deciding, otherwise a
      // quiet turn looks free until two years later. Erosion is mirrored here
      // exactly as the settlement path computes it (shocks are deliberately
      // *not* mirrored - they are the part no projection can know).
      const ask = typeof eff.renewable_share_pct === 'number' ? eff.renewable_share_pct : 0;
      const prevStreak = typeof s._defer_streak === 'number' ? s._defer_streak : 0;
      const streak = ask >= C.deferAskFloor ? 0 : prevStreak + 1;
      const erode = 1 - Math.min(C.deferCap, C.deferSlope * Math.max(0, streak - C.deferGrace));
      // Loop 7: the bar must carry the scar too. Otherwise a player who already
      // burned three quiet years would be shown the same capacity as one who
      // never did, and the projection would be optimistic in exactly the turn
      // the lesson lands.
      const prevScar = typeof s._rust_scar === 'number' ? s._rust_scar : 0;
      const scar = Math.min(C.rustCap, prevScar + Math.max(0, C.rustGain * (1 - erode)));
      const capacity = capacityRaw * erode * (1 - scar);
      const rawOver = Math.max(0, commit - capacity) + commit * C.baseDefer;
      const prep = typeof s._prep_credit === 'number' ? s._prep_credit : 0;
      const absorbs = Math.min(prep, rawOver * C.prepAbsorb);
      const over = rawOver - absorbs;
      const prevCommit = typeof s._last_commitment === 'number' ? s._last_commitment : commit;
      const swing = Math.max(0, Math.abs(commit - prevCommit) - C.jumpDeadzone - absorbs * C.swingCushion);
      const debt = typeof s.implementation_debt === 'number' ? s.implementation_debt : 0;
      const proj = Math.round((debt + over * C.overGain + swing * C.jumpGain) * 10) / 10;
      const band = C.projectionBand;
      return {
        commit: Math.round(commit * 10) / 10,
        capacity: Math.round(capacity * 10) / 10,
        mandate: Math.round(mandate * 100) / 100,
        coordination: Math.round(coordination * 100) / 100,
        headroom: Math.round(prep * 10) / 10,
        absorbs: Math.round(absorbs * 10) / 10,
        over: Math.round(over * 10) / 10,
        deferStreak: streak,
        capacityErode: Math.round(erode * 100) / 100,
        rustScar: Math.round(scar * 100) / 100,
        projectedDebt: proj,
        // A single number invites a single plan. The honest answer is a band:
        // delivery slips, capacity moves, and the year does not read the file.
        projectionBand: band,
        projectedDebtLow: Math.max(0, Math.round((proj - band) * 10) / 10),
        projectedDebtHigh: Math.round((proj + band) * 10) / 10
      };
    },

    async createGameSession(scenarioId, difficulty) {
      console.log('[debug] OfflineEngine.createGameSession begin', scenarioId, difficulty);
      const data = await loadScenario(scenarioId);
      const initialState = JSON.parse(JSON.stringify(data.initialState || {}));
      initialState.turn_number = 1;
      initialState.difficulty = difficulty || 'auto';
      initialState.challenge_type = 'base';
      initialState.decision_history = [];
      initialState.detected_biases = [];
      initialState.user_patterns = { risk_preference: null, pace_preference: null, decision_style: null };
      // Preserve initial values for pattern detection
      initialState._initial_schedule_pressure = initialState.schedule_pressure;
      initialState._initial_engineer_confidence = initialState.engineer_confidence;
      const sessionId = 'session_' + Date.now() + '_' + Math.floor(Math.random() * 9000 + 1000);
      // New run, new option order. Stored per scenario so every step of this
      // run shuffles on the same seed and the table is reproducible.
      // Loop 2: the seed used to be Math.random() only, which made the gold
      // standard runs irreproducible (same script, ±0.05°C and debt swings of
      // 10pp between passes) - a regression suite cannot assert on that.
      // An explicit seed now wins: window.__FL_OPTION_SEED__, then ?seed= in the
      // URL, then a fresh random one for real players.
      let optionSeed = null;
      try {
        if (typeof window !== 'undefined' && window.__FL_OPTION_SEED__) {
          optionSeed = parseInt(window.__FL_OPTION_SEED__, 10);
        }
        if (!optionSeed && typeof window !== 'undefined' && window.location) {
          const q = new URLSearchParams(window.location.search || '').get('seed');
          if (q) optionSeed = parseInt(q, 10);
        }
      } catch (e) { /* no window / bad param */ }
      if (!optionSeed || optionSeed < 1) {
        optionSeed = 1 + Math.floor(Math.random() * 2147483645);
      }
      try {
        localStorage.setItem('fl_option_seed_' + scenarioId, String(optionSeed));
      } catch (e) { /* storage blocked */ }
      const session = {
        session_id: sessionId,
        scenario_id: scenarioId,
        scenario: await this.getScenario(scenarioId),
        turn: 1,
        game_state: initialState,
        created_at: new Date().toISOString(),
        history: [],
        difficulty: difficulty || 'auto',
        decision_count: 0,
      };

      // Persist session to localStorage for offline play
      try {
        const raw = localStorage.getItem('offline_sessions');
        const sessions = raw ? JSON.parse(raw) : {};
        sessions[sessionId] = session;
        localStorage.setItem('offline_sessions', JSON.stringify(sessions));
      } catch (e) {
        // ignore storage errors
      }

      const result = {
        success: true,
        game_id: sessionId,
        message: '游戏会话已创建（离线模式）',
        difficulty: initialState.difficulty,
        challenge_type: initialState.challenge_type,
      };
      console.log('[debug] OfflineEngine.createGameSession done', result);
      return result;
    },

  async executeTurn(gameId, decisions, scenarioId) {
    console.log('[offline] executeTurn start', gameId, decisions.option);
    // Lookup session from localStorage
    let session = null;
    try {
      const raw = localStorage.getItem('offline_sessions');
      if (raw) {
        const sessions = JSON.parse(raw);
        session = sessions[gameId];
      }
    } catch (e) {
      // ignore
    }
    if (!session) {
      throw new Error('游戏会话未找到: ' + gameId);
    }
    console.log('[offline] executeTurn scenarioId=', scenarioId, 'session.scenario_id=', session.scenario_id, 'gameId', gameId);
    console.log('[offline] executeTurn session turn before', session.turn, 'state turn', session.game_state && session.game_state.turn_number, 'gameId', gameId);

    const resolvedScenarioId = scenarioId || session.scenario_id;
    const currentState = JSON.parse(JSON.stringify(session.game_state));
    const currentTurn = currentState.turn_number || 1;
    console.log('[offline] executeTurn currentTurn', currentTurn, 'gameId', gameId);
    _flRecordPrevMetrics(currentState, resolvedScenarioId);
    let newState = currentState;

    if (resolvedScenarioId === 'challenger-launch') {
      newState = await applyChallengerTurn(newState, decisions.option, decisions.justification);
    } else if (resolvedScenarioId === 'climate-change-policy') {
      newState = await applyClimateTurn(newState, decisions.option, decisions.justification);
    } else if (resolvedScenarioId === 'enron-collapse') {
      newState = await applyEnronTurn(newState, decisions.option, decisions.justification);
    } else {
      // Generic fallback
      const data = await loadScenario(resolvedScenarioId);
      // 与 getScenarioStep 同排列：玩家点的是洗牌后槽位上的字母，
      // 拿原始 step 去结算等于让"屏幕上的 A"和"记账的 A"是两个选项。
      const step = _flShuffleStepOptions(findStep(data, currentTurn), resolvedScenarioId, currentTurn);
      if (step) {
        const option = findOption(step, decisions.option);
        if (option) {
          const effects = step.expected_effects && step.expected_effects[decisions.option] || {};
          applyEffects(newState, effects);
        }
      }
    }

      // Feedback builders read the *last* history entry to echo the choice,
      // the character reaction and the deferred cost. Without recording it here
      // every ordinary turn returns an empty string and the player sees nothing.
      (function recordDecision() {
        const hist = newState.decision_history || (newState.decision_history = []);
        const lastEntry = hist[hist.length - 1];
        if (lastEntry && lastEntry.turn === currentTurn) return;
        const scnData = _loaded[resolvedScenarioId] || {};
        // 同上：反馈里要复述的是"玩家看到的那个选项"，不是原始槽位的同名字母。
        const st = _flShuffleStepOptions(findStep(scnData, currentTurn), resolvedScenarioId, currentTurn);
        const op = st ? findOption(st, decisions.option) : null;
        // Keep the applied effects on the record even when the scenario's own
        // turn handler does not log them: downstream feedback needs the numbers,
        // and "已记录" with no figures is exactly the hollow loop we are fixing.
        const eff = (st && st.expected_effects && st.expected_effects[decisions.option]) || {};
        hist.push({
          turn: currentTurn,
          option_id: decisions.option,
          option_text: op ? op.text : '',
          option_consequences_for_player: op ? (op.consequences_for_player || '') : '',
          option_orig_id: (op && op._orig_id) || decisions.option,
          // 与三条专用分支保持字段齐平：派生层（warning_to_response_lag /
          // consecutive_similar_choices / primary_focus_dimension_count）只认
          // 这两个键，缺一个就会把"有数据"误判成"没数据"。
          weight: op ? op.weight : '',
          option_weight: (op && op.weight) || 'neutral',
          expected_concerns_addressed: (op && op.expected_concerns_addressed) || [],
          // 与三条专用分支对齐：L0-2 仪表在回放路径上也要能读到目标轴。
          behavior: (op && op.behavior) || '',
          goal_axis: (op && Array.isArray(op.goal_axis)) ? op.goal_axis.slice() : [],
          goal_sacrificed: (op && Array.isArray(op.goal_sacrificed)) ? op.goal_sacrificed.slice() : [],
          applied_effects: eff,
          justification: decisions.justification || '',
        });
        newState.decision_count = hist.length;
      })();

      // T-5：把"玩家最后一步按了什么"写进 state，且只写这一处。
      // 原先 challenger / climate / enron 三个 apply*Turn 各自写一遍，
      // 而 noodle / chip 走的 generic 分支从来没写 —— 于是
      // generateShopOutcome 里那整段「你改写了结局，但没有改写过程」成了死代码，
      // 连 option 都只能回退到 'A'。统一到决策记录之后，
      // 谁都不必再记得自己写，也就不会再有人忘记写。
      newState.last_chosen_option = decisions.option;

      applyBaselineDrift(newState, resolvedScenarioId);

      newState.turn_number = currentTurn + 1;
      session.game_state = newState;
      session.turn = newState.turn_number;
      session.decision_count = (session.decision_count || 0) + 1;
      console.log('[offline] executeTurn newTurn', newState.turn_number, 'gameId', gameId);

      // 终局契约接线（Spec v1.2 §6.1 · T-3b）。
      // 挂钩点选在 executeTurn 的统一出口，而不是往 5 个 generate*Outcome 里各插一行：
      // 结局**文本**由 5 条路径各自生成没问题，但"这一局叫什么结局"必须只有一个答案，
      // 挂 5 次等于制造 5 个可能漂移的判定点。这里一次判定，文本路径保持原样。
      // 放在 persist 之前，是为了让 fallback 存档里的 game_state 也带上契约字段。
      (function attachFinalOutcome() {
        var fin = _flFinalStepOf(resolvedScenarioId);
        if (!fin) return;
        // newState.turn_number 是"下一回合号"，终局判定时它已经是 fin.turn + 1。
        if (newState.turn_number - 1 < fin.turn) return;
        var resolved = _flResolveOutcome(newState, resolvedScenarioId);
        newState.final_outcome = resolved;
      })();

      // Persist
      try {
        const raw = localStorage.getItem('offline_sessions');
        const sessions = raw ? JSON.parse(raw) : {};
        sessions[gameId] = session;
        localStorage.setItem('offline_sessions', JSON.stringify(sessions));
        console.log('[offline] executeTurn persisted turn', session.turn, 'gameId', gameId);
      } catch (e) {
        // ignore storage errors
      }

      // T-6：终局文本末尾补【代价清算】。挂在这里而不是五个 generate*Outcome 里，
      // 理由和 attachFinalOutcome 一样：文本可以由五条路径各自生成，
      // 但「代价怎么写」只该有一份规则，否则五处迟早写出五种口径。
      let feedback = generateFeedbackForTurn(newState, newState.turn_number, resolvedScenarioId);
      if (newState.final_outcome && newState.final_outcome.process_ledger) {
        const ledgerSeg = _flLedgerSegment(resolvedScenarioId, newState.final_outcome.process_ledger);
        if (ledgerSeg && feedback.indexOf('【代价清算】') < 0) {
          feedback = feedback + '\n\n' + ledgerSeg;
        }
      }
      const immediateResponse = {
        status: 'processed',
        turnNumber: newState.turn_number,
        feedback: feedback,
        game_state: newState,
        immediate_acknowledgment: true,
        processing_time_ms: 100,
        user_interaction_response: '您的决策已记录（离线模式）',
        difficulty: session.difficulty,
        decision_count: session.decision_count,
        has_personalized_insight: newState.turn_number >= 3,
      };

      const result = {
        success: true,
        turnNumber: newState.turn_number,
        feedback: feedback,
        game_state: newState,
        // 非终局回合为此场景的 null：契约只说"终局必须有两个字段"，
        // 没有要求每个中间回合都造一个假结局出来。
        final_outcome: newState.final_outcome || null,
        immediate_response: immediateResponse,
        difficulty: session.difficulty,
      };
      console.log('[offline] executeTurn done', result.turnNumber, 'gameId', gameId);
      return result;
    },

    async analyzeThinkingTraps(requestData) {
      const gameHistory = requestData.game_history || [];
      const scenarioId = requestData.scenario_id || '';
      const analysis = {
        total_decisions: gameHistory.length,
        scenario_id: scenarioId,
        identified_patterns: [],
        thinking_trap_warnings: [],
        improvement_suggestions: [],
      };
      const optionsChosen = gameHistory.map(d => (d.decisions || {}).option || '').filter(Boolean);
      if (optionsChosen.length >= 3 && new Set(optionsChosen).size === 1) {
        analysis.identified_patterns.push({
          type: '重复性决策模式',
          description: '在 ' + optionsChosen.length + ' 次决策中，您总是选择相同的选项 "' + optionsChosen[0] + '"',
          potential_issue: '可能反映出缺乏灵活性或对其他选项的探索不足',
        });
      }
      const aggressiveCount = optionsChosen.filter(o => o === '1').length;
      if (optionsChosen.length >= 3 && aggressiveCount >= optionsChosen.length * 0.7) {
        analysis.thinking_trap_warnings.push({
          trap_type: '激进决策倾向',
          description: '倾向于选择最激进或最立即的选项',
          impact: '可能导致高风险或短期导向的决策',
        });
      }
      const conservativeCount = optionsChosen.filter(o => o === '2' || o === '4').length;
      if (optionsChosen.length >= 3 && conservativeCount >= optionsChosen.length * 0.7) {
        analysis.thinking_trap_warnings.push({
          trap_type: '保守决策倾向',
          description: '倾向于选择最保守或最安全的选项',
          impact: '可能导致错失机会或过度规避风险',
        });
      }
      if (analysis.thinking_trap_warnings.length) {
        analysis.improvement_suggestions.push({
          suggestion: '尝试更多样化的选项，避免过度依赖单一决策模式',
          rationale: '多样化决策有助于识别和克服潜在的思维局限',
        });
      } else {
        analysis.improvement_suggestions.push({
          suggestion: '您的决策模式显示出灵活性，继续保持开放思维',
          rationale: '灵活的决策方法有助于在复杂情况下找到最优方案',
        });
      }
      return { message: '思维陷阱分析完成（离线模式）', analysis, status: 'success' };
    },
  };

  // Export
  if (typeof window !== 'undefined') {
    window.OfflineEngine = OfflineEngine;
  OfflineEngine.climateConstants = CLIMATE_DEBT;
  }
  // P0-1a 影子层：仅供 scripts/shadow-outcome.mjs 与后续契约脚本调用，
  // 生产路径（UI / router）不得引用它，直到影子对照 100% 通过（T-3b）。
  OfflineEngine._flResolveOutcome = _flResolveOutcome;
  OfflineEngine._flOutcomeTitle = _flOutcomeTitle;
  OfflineEngine._flNormalizeEnding = _flNormalizeEnding;
  OfflineEngine._flRawEndings = _flRawEndings;
  // V1 · 看得见变化：UI 需要指标的 label/unit/dec/good 与阈值表才能画
  // delta 徽标、迷你走势和阈值条。这两张表是只读常量，暴露出来是为了让
  // UI 不再复制一份配置——复制的那份一定会在某次平衡性调整后和引擎说谎。
  OfflineEngine._flScenarioMetrics = SCENARIO_METRICS;
  OfflineEngine._flScenarioThresholds = SCENARIO_THRESHOLDS;
  // V3 根因复盘模块需要整份场景 JSON（steps 原文做反事实、feedback_patterns
  // 做概念命中）。只暴露已加载的只读引用，不为它新开一次 fetch。
  OfflineEngine._flScenarioData = _loaded;
  OfflineEngine._flOutcomeWhitelist = FL_OUTCOME_WHITELIST;
  OfflineEngine._flKnownUnreachable = FL_KNOWN_UNREACHABLE;

  // ── L1-2 · 提交前的可撤回窗口 ──────────────────────────────────────────
  // 按一下就把这一手落地的产品，教不了"谨慎决策"：手快点错的人和想清楚的人
  // 得到同一个反馈，代价没有任何一处被记住。闸门只做一件最小的事——把"选中的
  // 那一手"先挂起，等玩家显式确认才允许推进回合；确认前随时可以撤回重选。
  // 它不推进状态、不写 history，真正落地仍由 API/引擎的 executeTurn 完成，
  // 因此撤回是纯粹的"没发生过"，而不是"事后反悔"。
  var _flGate = { turn: null, option_id: null, label: '' };

  function _flGatePeek() {
    return {
      turn: _flGate.turn,
      option_id: _flGate.option_id,
      label: _flGate.label,
      open: !!_flGate.option_id
    };
  }

  function pendingChoice(turn, optionId, label) {
    _flGate = {
      turn: turn == null || turn === '' ? null : Number(turn),
      option_id: optionId == null || optionId === '' ? null : String(optionId),
      label: label == null ? '' : String(label)
    };
    return _flGatePeek();
  }

  function confirmSubmit(optionId) {
    var peek = _flGatePeek();
    if (!peek.open) return null;
    // 传了 optionId 就要求一致：防止"看着 A 却提交了 B"这种最坏的错配。
    if (optionId != null && String(optionId) !== peek.option_id) return null;
    _flGate = { turn: null, option_id: null, label: '' };
    return peek;
  }

  function revertChoice() {
    var peek = _flGatePeek();
    _flGate = { turn: null, option_id: null, label: '' };
    return peek;
  }

  OfflineEngine._flChoiceGate = {
    pendingChoice: pendingChoice,
    peek: _flGatePeek,
    confirmSubmit: confirmSubmit,
    revertChoice: revertChoice
  };
  if (typeof globalThis !== 'undefined') {
    globalThis.OfflineEngine = OfflineEngine;
  }
})();

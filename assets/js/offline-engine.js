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
 * backend, loaded via fetch from /assets/data/scenarios/*.json.
 */

(function () {
  'use strict';

  // =========================================================================
  // Data loader
  // =========================================================================
  const SCENARIO_FILES = {
    'challenger-launch': '/assets/data/scenarios/challenger_launch.json',
    'climate-change-policy': '/assets/data/scenarios/climate_change.json',
    'enron-collapse': '/assets/data/scenarios/enron_collapse.json',
  };

  const _loaded = {};
  const _loading = {};

  async function loadScenario(id) {
    if (_loaded[id]) return _loaded[id];
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
      if (!(key in state)) {
        state[key] = value;
        continue;
      }
      const current = state[key];
      if (typeof current === 'number') {
        state[key] = current + value;
      } else if (Array.isArray(current) && key === 'consequence_deferred_queue') {
        current.push(value);
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
  // Feedback generators (ported from challenger_scenario.py / feedback_real.py)
  // =========================================================================
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
      return generateChallengerOutcome(state, step);
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

  function generateChallengerOutcome(state, step) {
    const chosenOptionId = state.last_chosen_option || 'A';
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
    if (!Object.keys(justifications).length) parts.push('  （未填写决策理由）');
    return parts.join('\n');
  }

  function generateClimateFeedback(state, turnNumber) {
    const parts = [];
    const temp = state.global_avg_temp_c;
    if (temp != null && temp > 1.5) {
      parts.push('🌡️ 全球升温已超过 1.5°C 阈值。');
    }
    const co2 = state.co2_ppm;
    if (co2 != null && co2 > 420) {
      parts.push('💨 CO2 浓度 ' + co2 + ' ppm，持续上升。');
    }
    const support = state.public_support_pct;
    if (support != null && support < 40) {
      parts.push('⚠️ 公众支持跌至 ' + support + '%——政策窗口正在关闭。');
    }
    const silenced = state.whistleblower_silenced_count || 0;
    if (silenced > 0) {
      parts.push('🔇 已压制 ' + silenced + ' 位科学家的警告。');
    }
    if (!parts.length) parts.push('已记录。');
    return parts.join('\n');
  }

  function generateEnronFeedback(state, turnNumber) {
    const parts = [];
    const price = state.share_price_usd;
    if (price != null && price < 30) {
      parts.push('💵 股价跌至 $' + price + ' — 市场正在失去信心。');
    }
    const cashflow = state.actual_cashflow_usd_m;
    if (cashflow != null && cashflow < -300) {
      parts.push('💰 实际现金流 ' + cashflow + 'M — 流动性危机加剧。');
    }
    const silenced = state.whistleblower_silenced_count || 0;
    if (silenced > 0) {
      parts.push('🔇 已压制 ' + silenced + ' 位内部举报人。');
    }
    if (!parts.length) parts.push('已记录。');
    return parts.join('\n');
  }

  function generateGenericFeedback(state, turnNumber) {
    const parts = [];
    parts.push('Turn ' + turnNumber + ' 已完成。');
    return parts.join('\n');
  }

  // =========================================================================
  // Scenario-specific apply_turn implementations
  // =========================================================================
  async function applyChallengerTurn(state, optionId, justification) {
    const data = await loadScenario('challenger-launch');
    const currentTurn = state.turn_number || 1;
    const step = findStep(data, currentTurn);
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
        if (entry === 'data_review_meeting' && currentTurn >= 3) {
          state.risk_acknowledged_unresolved = (state.risk_acknowledged_unresolved || 0) + 1;
        } else if (entry === 'cross_dept_meeting' && currentTurn >= 3) {
          state.dissent_suppressed_count = (state.dissent_suppressed_count || 0) + 1;
        } else {
          newQueue.push(entry);
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
      option_weight: option.weight || 'neutral',
      expected_concerns_addressed: option.expected_concerns_addressed || [],
      applied_effects: effects,
      justification: sanitized,
    });

    return state;
  }

  async function applyClimateTurn(state, optionId, justification) {
    const data = await loadScenario('climate-change-policy');
    const currentTurn = state.turn_number || 1;
    const step = findStep(data, currentTurn);
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
    state.last_chosen_option = optionId;
    state.decision_history = state.decision_history || [];
    state.decision_history.push({
      turn: currentTurn,
      option_id: optionId,
      option_text: option.text || '',
      option_consequences_for_player: option.consequences_for_player || '',
      option_weight: option.weight || 'neutral',
      applied_effects: effects,
      justification: sanitized,
    });
    return state;
  }

  async function applyEnronTurn(state, optionId, justification) {
    const data = await loadScenario('enron-collapse');
    const currentTurn = state.turn_number || 1;
    const step = findStep(data, currentTurn);
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
    state.last_chosen_option = optionId;
    state.decision_history = state.decision_history || [];
    state.decision_history.push({
      turn: currentTurn,
      option_id: optionId,
      option_text: option.text || '',
      option_consequences_for_player: option.consequences_for_player || '',
      option_weight: option.weight || 'neutral',
      applied_effects: effects,
      justification: sanitized,
    });
    return state;
  }

  // =========================================================================
  // Public API — mirrors backend endpoints
  // =========================================================================
  const OfflineEngine = {
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
          thumbnail: '/assets/images/challenger.jpg',
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
          thumbnail: '/assets/images/climate.jpg',
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
          thumbnail: '/assets/images/enron.jpg',
          advancedChallenges: [],
          scenario_file: 'scenarios/enron_collapse.json',
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
      return step;
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
      const step = findStep(data, currentTurn);
      if (step) {
        const option = findOption(step, decisions.option);
        if (option) {
          const effects = step.expected_effects && step.expected_effects[decisions.option] || {};
          applyEffects(newState, effects);
        }
      }
    }

      newState.turn_number = currentTurn + 1;
      session.game_state = newState;
      session.turn = newState.turn_number;
      session.decision_count = (session.decision_count || 0) + 1;
      console.log('[offline] executeTurn newTurn', newState.turn_number, 'gameId', gameId);

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

      const feedback = generateFeedbackForTurn(newState, newState.turn_number, scenarioId);
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
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.OfflineEngine = OfflineEngine;
  }
})();

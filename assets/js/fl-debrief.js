/* =============================================================================
 * fl-debrief.js — V3「看得见根因」终局复盘模块
 *
 * 只读 game_state + 场景 JSON，产出结构化复盘（根因树、概念命中、代价清算、
 * 未结清的账、反事实），并把同一份模型绘成一张离线可存的 PNG。
 *
 * 三条纪律：
 *  1. 不猜：根因链起点是 decision_history 里该决策真实的 applied_effects，
 *     终点是终局 state 里真实的指标变化。
 *  2. 不编：反事实只引用场景 JSON 里真实存在的另一个选项原文，不虚构它的效果。
 *  3. 不引外链：PNG 用 Canvas 2D 手绘，单文件构建后仍可用。
 * ========================================================================== */
(function (global) {
  'use strict';

  var GOOD_DOWN = [
    'pressure', 'fatigue', 'debt', 'risk', 'exposure', 'waste', 'silenced',
    'ignored', 'unresolved', 'tipping', 'co2', 'global_avg_temp', 'budget_used',
    'cost', 'drag', 'lag', 'stress', 'loss', 'delay', 'temperature_forecast'
  ];
  var GOOD_UP = [
    'renewable_share', 'support', 'trust', 'justice', 'confidence', 'morale',
    'reputation', 'revenue', 'cash_flow', 'equity', 'share_price', 'market_share',
    'yield', 'self_reliance', 'oversight', 'service_speed', 'inventory_turnover',
    'family_trust', 'growth', 'standing', 'retention', 'quality', 'buffer'
  ];

  function isGoodUp(key) {
    var k = String(key || '').toLowerCase();
    if (GOOD_UP.some(function (s) { return k.indexOf(s) >= 0; })) return true;
    if (GOOD_DOWN.some(function (s) { return k.indexOf(s) >= 0; })) return false;
    return null;
  }

  function num(v) {
    return typeof v === 'number' && isFinite(v) ? v : null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmt(v) {
    if (v == null) return '—';
    return String(Math.round(v * 100) / 100);
  }

  function signed(v) {
    if (v == null) return '—';
    var r = Math.round(v * 100) / 100;
    return (r > 0 ? '+' : '') + r;
  }

  function metricLabel(stateFields, key) {
    var hit = (stateFields || []).filter(function (f) { return f && f.key === key; })[0];
    if (hit && hit.label) return String(hit.label).replace(/^[^\w\u4e00-\u9fa5]+/, '');
    return key;
  }

  // ── L2-2 第一层素材：关键决策（3–5 条）──────────────────────────────────
  // 玩家第一眼要的是"我干了什么"，不是"根因树有四个节点"。但清单不能凑数：
  // 先取根因链上的回合（那是真的把指标推坏的那几手），不够再用"本局改动幅度
  // 最大的回合"补齐，最多 5 条；少于回合数就老实少列，排序回时间轴
  // —— 复盘是重放，不是排行榜。
  function buildKeyDecisions(hist, model, data) {
    var byTurn = {};
    var score = {};
    hist.forEach(function (d) {
      var t = Number(d && d.turn);
      if (!t) return;
      byTurn[t] = d;
      var eff = (d && d.applied_effects) || {};
      var s = 0;
      Object.keys(eff).forEach(function (k) { s += Math.abs(num(eff[k]) || 0); });
      score[t] = s;
    });
    var picked = [];
    function take(t) {
      t = Number(t);
      if (t && byTurn[t] && picked.indexOf(t) < 0) picked.push(t);
    }
    (model.rootCauses || []).forEach(function (rc) {
      (rc.chain || []).forEach(function (c) { take(c && c.turn); });
    });
    Object.keys(byTurn).map(Number)
      .sort(function (a, b) { return (score[b] || 0) - (score[a] || 0); })
      .forEach(function (t) { if (picked.length < 5) take(t); });
    picked = picked.slice(0, 5).sort(function (a, b) { return a - b; });

    var objectives = ((data && data.brief && data.brief.objectives) || []);
    function objectiveLabel(id) {
      var hit = objectives.filter(function (o) { return o && (o.id === id); })[0];
      return hit ? String(hit.label || hit.text || hit.id || '') : String(id || '');
    }
    // 引擎的 decision_history 不落 goal_axis / goal_sacrificed（那不是结算输入，
    // 是标注），所以牺牲项要回场景 JSON 里按 turn + option_id 取。靠
    // "历史里没有就是没牺牲"来推断，会把每一次取舍都读成零代价。
    function findOption(turn, optionId) {
      var steps = (data && data.steps) || [];
      for (var i = 0; i < steps.length; i++) {
        if (Number(steps[i] && steps[i].turn) !== Number(turn)) continue;
        var os = (steps[i] && steps[i].options) || [];
        for (var j = 0; j < os.length; j++) {
          if (String(os[j] && os[j].id) === String(optionId)) return os[j];
        }
      }
      return null;
    }

    return picked.map(function (t) {
      var d = byTurn[t];
      var eff = (d && d.applied_effects) || {};
      var worstKey = null;
      var worstVal = null;
      Object.keys(eff).forEach(function (k) {
        var v = num(eff[k]);
        if (v == null) return;
        if (worstKey == null || Math.abs(v) > Math.abs(worstVal)) { worstKey = k; worstVal = v; }
      });
      var sacrificed = Array.isArray(d && d.goal_sacrificed) ? d.goal_sacrificed : [];
      if (!sacrificed.length) {
        var opt = findOption(t, (d && d.option_id) || '');
        sacrificed = (opt && Array.isArray(opt.goal_sacrificed)) ? opt.goal_sacrificed : [];
      }
      return {
        turn: t,
        optionId: String((d && d.option_id) || ''),
        text: String((d && d.option_text) || '').trim(),
        metric: worstKey ? metricLabel(model.stateFields, worstKey) : '',
        delta: worstVal,
        sacrificed: sacrificed.map(objectiveLabel).filter(Boolean)
      };
    });
  }

  // ── L2-2 三层：你做了什么 / 这叫什么 / 下次怎么办 ────────────────────────
  // 三层顺序是教学顺序，不是排版偏好：先承认玩家做过的事（不自证清白），
  // 再给它名字和出处（概念 + Dörner 原话），最后给能带走的东西
  // （反事实 + 三问 + 一句现实锚定）。纯函数，断言可直喂一份模型验结构。
  function buildLayers(model) {
    model = model || {};
    var did = (model.keyDecisions || []).map(function (k) {
      return {
        turn: k.turn,
        text: k.text,
        effect: k.metric ? (k.metric + ' ' + signed(k.delta)) : '',
        sacrificed: k.sacrificed || []
      };
    });

    var cards = (model.conceptCards || []).filter(function (c) { return c && c.status === 'hit'; });
    var named = cards.map(function (c) {
      var q = c.quote || null;
      return {
        concept: String(c.concept || ''),
        quote: q ? String(q.text || '') : '',
        source: q ? String(q.source || '') : '',
        evidence: String((c.dynamic && c.dynamic.text) || ''),
        turns: ((c.dynamic && c.dynamic.evidenceTurns) || []).slice(0, 4)
      };
    });

    var cf = (model.counterfactuals || [])[0] || null;
    var questions = [];
    if (cf) questions.push('重来一次，第 ' + cf.turn + ' 回合你会换成哪一项？');
    var sac = null;
    for (var i = 0; i < did.length; i++) {
      if (did[i].sacrificed.length) { sac = did[i].sacrificed[0]; break; }
    }
    if (sac) questions.push('这一局你牺牲了「' + sac + '」，你打算在第几回合把它补回来？');
    questions.push('下一次同样的取舍出现时，你打算先看哪三个数？');
    if (questions.length < 3) questions.push('你当时写下的理由，和实际发生的结果对得上吗？');
    questions = questions.slice(0, 3);

    // 现实锚定跟着"命中的概念"走：没命中就没有可锚的东西，绝不拿未触发
    // 概念的教材句充数 —— 那会把"我们没测到"说成"你会这样"。
    var anchor = '';
    for (var j = 0; j < cards.length; j++) {
      if (cards[j].anchor) {
        anchor = String(cards[j].anchor).replace(/^现实里长这样[:：]\s*/, '');
        break;
      }
    }

    return {
      did: did,
      named: named,
      next: {
        counterfactual: cf ? {
          turn: cf.turn,
          chosen: String(cf.chosen || ''),
          alternative: cf.alternative ? String(cf.alternative) : '',
          metric: String(cf.metric || ''),
          delta: cf.delta == null ? null : cf.delta
        } : null,
        questions: questions,
        anchor: anchor
      }
    };
  }

  // ── trigger 表达式求值 ──────────────────────────────────────────────────
  // feedback_patterns[*].trigger 形如：
  //   "accepted_risks_count >= 3 AND ignored_warnings_count >= 2"
  // 不是 JS，不 eval（也不该 eval 来自 JSON 的字符串）。只认 NAME OP NUMBER
  // 与 AND/OR；解析失败即视为未命中，原始表达式仍原样展示给读者。
  // 全或无。旧实现逐段解析后 filter(Boolean) 丢弃失败原子，使
  // "A AND (B OR C)" 退化成 "A" 仍返回可解析结果 —— 页面上看起来判过了，
  // 实际条件已被截断。宁可报"不可解析"，也不允许残缺原子参与判定。
  var ATOM_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*(>=|<=|==|=|>|<)\s*(-?[\d.]+)$/;
  var LITERAL_SYNTAX_RE = /[()\[\]{}"'`（）【】“”‘’]|%|大于|小于|等于|并且|而且|或者|时候|以上|以下/;

  function parseTrigger(expr) {
    var text = String(expr || '').trim();
    if (!text) return null;
    if (LITERAL_SYNTAX_RE.test(text)) return null;
    var orParts = text.split(/\s+OR\s+/i);
    var groups = [];
    for (var i = 0; i < orParts.length; i++) {
      var andParts = orParts[i].split(/\s+AND\s+/i);
      var group = [];
      for (var j = 0; j < andParts.length; j++) {
        var m = String(andParts[j]).trim().match(ATOM_RE);
        if (!m) return null;
        group.push({ name: m[1], op: m[2] === '=' ? '==' : m[2], threshold: Number(m[3]) });
      }
      if (!group.length) return null;
      groups.push(group);
    }
    if (!groups.length) return null;
    return { or: groups };
  }

  function evalAtom(atom, state) {
    var v = num(state[atom.name]);
    if (v == null) return { pass: false, value: null, atom: atom };
    var pass = false;
    if (atom.op === '>=') pass = v >= atom.threshold;
    else if (atom.op === '<=') pass = v <= atom.threshold;
    else if (atom.op === '>') pass = v > atom.threshold;
    else if (atom.op === '<') pass = v < atom.threshold;
    else if (atom.op === '==') pass = v === atom.threshold;
    return { pass: pass, value: v, atom: atom };
  }

  function evalTrigger(parsed, state) {
    if (!parsed) return { hit: false, atoms: [] };
    var atoms = [];
    var hit = parsed.or.some(function (group) {
      var results = group.map(function (a) { return evalAtom(a, state); });
      results.forEach(function (r) { atoms.push(r); });
      return results.length > 0 && results.every(function (r) { return r.pass; });
    });
    return { hit: hit, atoms: atoms };
  }

  // ── 主构建 ─────────────────────────────────────────────────────────────
  function build(input) {
    var state = (input && input.state) || {};
    var config = (input && input.scenarioConfig) || {};
    var data = (input && input.scenarioData) || {};
    var start = config.defaultState || data.initialState || {};
    var hist = Array.isArray(state.decision_history) ? state.decision_history : [];
    var fin = state.final_outcome || null;

    // 结局标题：三套 schema 把"标题"放在不同位置 —— noodle/chip 用
    // outcome_endings[id].title；climate/enron 只有长 narrative，标题是其中
    // 第一行（跳过 ==== 分隔线）；challenger 只有 narrative_intro 叙事首句，
    // 引擎给的 fin.title 是被截断的同一句。按"结构化程度从高到低"取，
    // 全都取不到就退回 id —— 绝不自己编一个名字。
    var endingRec = ((data.outcome_endings || {})[fin && fin.id]) || {};
    function pickEndingTitle() {
      if (!fin) return '';
      if (endingRec.title) return String(endingRec.title);
      var line = String(endingRec.narrative || '')
        .split('\n').map(function (s) { return s.trim(); })
        .filter(function (s) { return s && !/^[=\-*_]{6,}$/.test(s); })[0];
      if (line && line.length <= 40 && !/[。.]$/.test(line)) return line;
      var intro = String(endingRec.narrative_intro || '').trim();
      if (intro) {
        var cut = intro.split(/——|。|\.\s/)[0];
        return (cut || intro).slice(0, 32);
      }
      if (fin.title && fin.title !== fin.id) return String(fin.title);
      return String(fin.id || '').replace(/_/g, ' ');
    }

    var model = {
      scenarioId: config.id || data.scenarioId || '',
      scenarioLabel: config.label || data.title || '',
      turns: hist.length,
      ending: fin ? {
        id: fin.id,
        title: pickEndingTitle(),
        rawTitle: fin.title || '',
        tier: fin.tier || 'teaching',
        source: fin.source || '',
        rewritten: !!fin.rewritten,
        inferredId: fin.inferred_id || ''
      } : null,
      stateFields: config.stateFields || [],
      metrics: [],
      rootCauses: [],
      concepts: [],
      conceptSource: '',
      ledger: (fin && fin.process_ledger) || null,
      pendingDelays: [],
      counterfactuals: []
    };

    var keys = Object.keys(start).filter(function (k) { return num(start[k]) != null; });
    (model.stateFields || []).forEach(function (f) {
      if (f && f.key && keys.indexOf(f.key) < 0 && num(start[f.key]) != null) keys.push(f.key);
    });

    keys.forEach(function (k) {
      var from = num(start[k]);
      var to = num(state[k]);
      if (from == null || to == null) return;
      var delta = Math.round((to - from) * 100) / 100;
      if (!delta) return;
      model.metrics.push({
        key: k,
        label: metricLabel(model.stateFields, k),
        from: from, to: to, delta: delta, goodUp: isGoodUp(k)
      });
    });

    // 根因候选：只有「玩家真的动过」且「方向明确」的指标才有资格当主因。
    var touched = {};
    hist.forEach(function (d) {
      var eff = (d && d.applied_effects) || {};
      Object.keys(eff).forEach(function (k) {
        if (num(eff[k]) != null) touched[k] = true;
      });
    });

    var scored = model.metrics.filter(function (m) {
      return touched[m.key] && m.goodUp !== null;
    }).map(function (m) {
      var bad = m.goodUp ? -m.delta : m.delta;
      var scale = Math.max(Math.abs(num(start[m.key]) || 0), 1);
      return { m: m, bad: bad, weight: bad / scale };
    }).filter(function (x) { return x.bad > 0; })
      .sort(function (a, b) { return b.weight - a.weight; })
      .slice(0, 4);

    model.rootCauses = scored.map(function (x) {
      var m = x.m;
      var chain = hist.map(function (d) {
        var eff = (d && d.applied_effects) || {};
        var v = num(eff[m.key]);
        if (v == null || v === 0) return null;
        var harmful = m.goodUp ? v < 0 : v > 0;
        if (!harmful) return null;
        return {
          turn: Number(d.turn) || 0,
          text: String(d.option_text || ''),
          delta: v,
          applied: eff
        };
      }).filter(Boolean);
      chain.sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
      return {
        key: m.key,
        label: m.label,
        from: m.from,
        to: m.to,
        delta: m.delta,
        goodUp: m.goodUp,
        chain: chain.slice(0, 3)
      };
    });

    // 未结清的账：已经埋下、还没到显现回合的延迟后果
    var ledgerRows = Array.isArray(state.deferred_ledger) ? state.deferred_ledger : [];
    model.pendingDelays = ledgerRows.filter(function (r) {
      return r && r.resolved_turn == null;
    }).map(function (r) {
      return { key: String(r.key || ''), sourceTurn: Number(r.source_turn) || 0 };
    });

    // 反事实：主因链里最重的三个决策，回原场景找「当时另一个选项」的原文。
    var steps = Array.isArray(data.steps) ? data.steps : [];
    var seenTurn = {};
    var picks = [];
    model.rootCauses.forEach(function (rc) {
      rc.chain.forEach(function (c) {
        if (picks.length >= 3 || seenTurn[c.turn]) return;
        seenTurn[c.turn] = true;
        picks.push({ turn: c.turn, rcKey: rc.key, rcLabel: rc.label, delta: c.delta, chosen: c.text });
      });
    });
    model.counterfactuals = picks.map(function (p) {
      var step = steps.filter(function (s) { return Number(s.turn) === Number(p.turn); })[0];
      var chosenText = String(p.chosen || '');
      var alt = null;
      if (step && Array.isArray(step.options)) {
        var others = step.options.filter(function (o) {
          return String(o.text || '').trim() !== chosenText.trim();
        });
        // 优先取「权重方向相反」的选项：那才是真正的另一条路。
        var chosenOpt = step.options.filter(function (o) {
          return String(o.text || '').trim() === chosenText.trim();
        })[0];
        if (chosenOpt && others.length) {
          var rank = { extreme_safe: 0, safe: 1, neutral: 2, risky: 3, extreme_risk: 4 };
          var base = rank[chosenOpt.weight] == null ? 2 : rank[chosenOpt.weight];
          others.sort(function (a, b) {
            var ra = rank[a.weight] == null ? 2 : rank[a.weight];
            var rb = rank[b.weight] == null ? 2 : rank[b.weight];
            return Math.abs(rb - base) - Math.abs(ra - base);
          });
        }
        alt = others.length ? String(others[0].text || '') : null;
      }
      return {
        turn: p.turn,
        metric: p.rcLabel,
        metricKey: p.rcKey,
        delta: p.delta,
        chosen: chosenText,
        alternative: alt
      };
    });

    // 概念区不再依赖调用方"记得再调一次 buildConcepts"——那种隐性依赖的
    // 后果是忘记调用时复盘静默少一整块，且没人报错。带场景数据就自己补齐。
    if (!model.conceptCards && data.feedback_patterns) {
      buildConcepts(model, data, state);
    }

    // L2-2 三层在模型里算完，视图只负责排版：页面与 PNG 才能共用同一份文案。
    model.keyDecisions = buildKeyDecisions(hist, model, data);
    model.layers = buildLayers(model);

    return model;
  }

  // 概念命中：需要场景 JSON 的 feedback_patterns，单独一步，便于异步补。
  // ── 派生层：只读 decision_history，把"引擎没记的计数器"算出来 ──────────
  // 铁律：不可用时 value = null，绝不把"没记录"报成 0 —— 0 是一个能被
  // 阈值命中的真实数值，用它冒充"没有数据"就会凭空造出命中。
  var DERIVED_KEYS = [
    'warning_to_response_lag', 'consecutive_similar_choices', 'primary_focus_dimension_count',
    // 下列四项是为了把"引擎没记的计数器"从 history 算出来，而不是任由规则去引用
    // 一个永远 undefined 的键（那会静默失效，比报错更难查）。
    'deferred_consequence_count', 'single_concern_choices',
    'analyst_confidence_drop_count', 'no_change_after_reveal',
    // J 层三项：从 applied_effects 反推"自反性 / 局部优化 / 乐观叙事"
    'strategy_backfire_count', 'cost_cut_local_count', 'optimism_claim_count'
  ];
  var SAFE_WEIGHTS = { safe: 1, conservative: 1, neutral: 1, passive: 1 };
  var NO_STANCE = { neutral: 1, '': 1 };

  function pickWeight(d) {
    return String((d && (d.option_weight || d.weight)) || '').toLowerCase();
  }

  // ── L1-1 · weight → 中文姿态徽标的唯一出口 ──────────────────────────────
  // 徽标文案一旦散落在页面里，就会出现"同一只手、两个叫法"，而且没有人能
  // 断言页面上到底写了什么。这里收成一张表加两个纯函数：stanceLabel 给字，
  // stanceTone 给色档。视图层只许调用，不许自己再抄一份映射。
  var STANCE_LABELS = {
    extreme_safe: '极保守',
    safe: '保守',
    conservative: '稳健',
    passive: '观望',
    neutral: '中性',
    moderate: '平衡',
    analytical: '分析型',
    aggressive: '进取',
    risky: '激进',
    extreme_risk: '极激进'
  };
  var STANCE_TONES = {
    extreme_safe: 'safe',
    safe: 'safe',
    conservative: 'safe',
    passive: 'safe',
    neutral: 'neutral',
    moderate: 'neutral',
    analytical: 'neutral',
    aggressive: 'risky',
    risky: 'risky',
    extreme_risk: 'risky'
  };

  function stanceLabel(weight) {
    var w = String(weight == null ? '' : weight).trim().toLowerCase();
    // 缺省不返回空串：空徽标等于没标，玩家会当成"这一项没有姿态"。
    return STANCE_LABELS[w] || STANCE_LABELS.neutral;
  }

  function stanceTone(weight) {
    var w = String(weight == null ? '' : weight).trim().toLowerCase();
    return STANCE_TONES[w] || 'neutral';
  }

  function warningToResponseLag(hist) {
    var warns = [];
    var replies = [];
    hist.forEach(function (d) {
      var ae = d.applied_effects || {};
      // 两种"警告被无视"的记账方式：场景明写 ignored_warnings_count，
      // 或把吹哨人压下去（whistleblower_silenced_count）。后者不是另一种病，
      // 是同一种"听见了但选择不回应"，只是叙事上更具体。
      var ign = num(ae.ignored_warnings_count);
      var sil = num(ae.whistleblower_silenced_count);
      if ((ign != null && ign > 0) || (sil != null && sil > 0)) warns.push(Number(d.turn));
      if (SAFE_WEIGHTS[pickWeight(d)]) replies.push(Number(d.turn));
    });
    if (!warns.length) return { value: null, available: false, reason: 'no_warning', evidenceTurns: [] };
    replies.sort(function (a, b) { return a - b; });
    var best = null;
    warns.forEach(function (w) {
      for (var i = 0; i < replies.length; i++) {
        if (replies[i] > w) {
          var lag = replies[i] - w;
          if (!best || lag > best.lag) best = { lag: lag, w: w, r: replies[i] };
          break;
        }
      }
    });
    // 警告发生在最后一回合 = 后面根本没有回合可选，不叫"0 回合就响应了"
    if (!best) return { value: null, available: false, reason: 'no_followup', evidenceTurns: [] };
    return { value: best.lag, available: true, reason: '', evidenceTurns: [best.w, best.r] };
  }

  function consecutiveSimilarChoices(hist) {
    var seq = [];
    hist.forEach(function (d) {
      var w = pickWeight(d);
      if (NO_STANCE[w]) return; // 没立场不算跟风
      seq.push({ turn: Number(d.turn), w: w });
    });
    if (seq.length < 3) return { value: null, available: false, reason: 'too_few_turns', evidenceTurns: [] };
    var best = { len: 1, from: 0, to: 0 };
    var cur = 1;
    var start = 0;
    for (var i = 1; i < seq.length; i++) {
      if (seq[i].w === seq[i - 1].w) { cur++; } else { cur = 1; start = i; }
      if (cur > best.len) best = { len: cur, from: start, to: i };
    }
    var turns = [];
    for (var k = best.from; k <= best.to; k++) turns.push(seq[k].turn);
    return { value: best.len, available: true, reason: '', evidenceTurns: turns };
  }

  function primaryFocusDimensionCount(hist) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    var withConcerns = 0;
    var tally = {};
    var turnsByDim = {};
    hist.forEach(function (d) {
      var cs = d.expected_concerns_addressed || [];
      var turn = Number(d.turn);
      if (cs.length) withConcerns++;
      cs.forEach(function (dim) {
        var key = String(dim);
        tally[key] = (tally[key] || 0) + 1;
        (turnsByDim[key] = turnsByDim[key] || []).push(turn);
      });
    });
    // 关注面记录稀疏时，任何"单一目标"结论都是猜的
    if (withConcerns / hist.length < 0.5) {
      return { value: null, available: false, reason: 'concerns_sparse', evidenceTurns: [] };
    }
    var top = null;
    Object.keys(tally).forEach(function (k) { if (top == null || tally[k] > tally[top]) top = k; });
    if (top == null) return { value: null, available: false, reason: 'concerns_sparse', evidenceTurns: [] };
    var count = turnsByDim[top].length;
    return {
      value: (count / hist.length < 0.5) ? 0 : count,
      available: true,
      reason: '',
      dimension: top,
      evidenceTurns: turnsByDim[top]
    };
  }

  // 把后果推迟：consequence_deferred_queue 每回合在涨，就说明"这事以后再处理"
  function deferredConsequenceCount(hist) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    var turns = [];
    hist.forEach(function (d) {
      var inc = num(((d.applied_effects || {}).consequence_deferred_queue));
      if (inc != null && inc > 0) turns.push(Number(d.turn));
    });
    // 0 次是真实结论（他从没推迟过），可以报 0；但没有"推迟回合"可指，
    // 所以 evidenceTurns 为空——这与"算不出来"是两件事，用 available 区分。
    return { value: turns.length, available: true, reason: '', evidenceTurns: turns };
  }

  // 只看一个维度：expected_concerns_addressed 恰好一项。
  // 这是"单目标优化"最忠实的结构化表达，不用去猜中文里有没有"份额"二字。
  // 场景适用性：concerns 必须是"多选题"才有"单维"可言。
  // chip/noodle 的每个选项只标 1 个中文短语（去重后平均长度 1.0），
  // 在这种数据上算 single_concern_choices 会恒等于回合数——照样能过阈值，
  // 但那不是"他只盯一个目标"，而是"数据只写得下一个目标"。
  function concernsAreMultiDimensional(scenarioData) {
    var seen = {};
    var n = 0;
    var total = 0;
    ((scenarioData && scenarioData.steps) || []).forEach(function (st) {
      (st.options || []).forEach(function (o) {
        var cs = o && o.expected_concerns_addressed;
        if (!Array.isArray(cs) || !cs.length) return;
        n += 1;
        total += cs.length;
        cs.forEach(function (d) { seen[String(d)] = true; });
      });
    });
    if (n < 8) return false;
    return Object.keys(seen).length >= 3 && (total / n) >= 1.5;
  }

  function singleConcernChoices(hist, scenarioData) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    if (!concernsAreMultiDimensional(scenarioData)) {
      return { value: null, available: false, reason: 'concerns_not_multidim', evidenceTurns: [] };
    }
    var recorded = 0;
    var turns = [];
    hist.forEach(function (d) {
      var cs = d.expected_concerns_addressed;
      if (!Array.isArray(cs)) return;
      recorded += 1;
      if (cs.length === 1) turns.push(Number(d.turn));
    });
    if (recorded / hist.length < 0.5) {
      return { value: null, available: false, reason: 'concerns_sparse', evidenceTurns: [] };
    }
    return { value: turns.length, available: true, reason: '', evidenceTurns: turns };
  }

  // 分析师信心被下调：analyst_confidence_index 的负增量。
  // 规则里原本写的 analyst_attack_count 引擎从不产出，这个才是真实信号。
  function analystConfidenceDropCount(hist) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    var seen = 0;
    var turns = [];
    hist.forEach(function (d) {
      var inc = num(((d.applied_effects || {}).analyst_confidence_index));
      if (inc == null) return;
      seen += 1;
      if (inc < 0) turns.push(Number(d.turn));
    });
    if (!seen) return { value: null, available: false, reason: 'no_analyst_signal', evidenceTurns: [] };
    return { value: turns.length, available: true, reason: '', evidenceTurns: turns };
  }

  // 揭示之后照旧：把 reveal 之前出现过的立场，在 reveal 之后又用了一遍。
  function noChangeAfterReveal(hist, scenarioData) {
    var steps = (scenarioData && scenarioData.steps) || [];
    var reveal = null;
    steps.forEach(function (st) {
      if (!st) return;
      var t = Number(st.turn) || 0;
      if (!t) return;
      var flag = st.is_pattern_reveal === true || st.reveal_phase === true || st.is_pattern_reveal;
      if (flag && (reveal == null || t < reveal)) reveal = t;
    });
    if (reveal == null) return { value: null, available: false, reason: 'no_reveal', evidenceTurns: [] };
    var before = {};
    var after = [];
    hist.forEach(function (d) {
      var t = Number(d.turn);
      var w = pickWeight(d);
      if (!w) return;
      if (t < reveal) before[w] = true;
      else after.push({ turn: t, w: w });
    });
    if (!after.length) return { value: null, available: false, reason: 'no_post_reveal_turns', evidenceTurns: [] };
    if (!Object.keys(before).length) return { value: null, available: false, reason: 'no_pre_reveal_turns', evidenceTurns: [] };
    var same = after.filter(function (x) { return before[x.w]; });
    return { value: same.length, available: true, reason: '', evidenceTurns: same.map(function (x) { return x.turn; }) };
  }

  // ── J 层：从"实际后果"反推行为性质（不依赖人写的 tag）──────────────
  // 为什么不用选项 tag：200 个选项逐个打标，标错了没有任何机制能发现；
  // 而 applied_effects 是引擎每回合真实写入的，反推出来的每一条都能指回回合，
  // 玩家能自己核对"我确实是在第 3 回合这么干的"。
  function effectNet(eff) {
    var sum = 0;
    var any = false;
    Object.keys(eff || {}).forEach(function (k) {
      var v = num(eff[k]);
      if (v != null) { sum += v; any = true; }
    });
    return any ? sum : null;
  }

  // 自反性陷阱：同一套打法连续用，先见效、后反噬。
  // 关键区分"坚持"与"自反"——一路向好不算反噬（J6 守着这条）。
  function strategyBackfireCount(hist) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    var segs = [];
    var cur = null;
    hist.forEach(function (d) {
      var w = pickWeight(d);
      var net = effectNet(d.applied_effects);
      var item = { turn: Number(d.turn), w: w, net: net };
      if (cur && cur.w === w && !NO_STANCE[w]) cur.items.push(item);
      else { cur = { w: w, items: [item] }; segs.push(cur); }
    });
    var turns = [];
    segs.forEach(function (seg) {
      if (seg.items.length < 3) return; // 少于 3 回合谈不上"同一招用到底"
      var seenPositive = false;
      seg.items.forEach(function (it) {
        if (it.net == null) return;
        if (it.net > 0) { seenPositive = true; return; }
        if (seenPositive && it.net < 0) {
          if (turns.indexOf(it.turn) < 0) turns.push(it.turn);
          seenPositive = false; // 一次反噬只记一次，避免连跌被重复计数
        }
      });
    });
    return { value: turns.length, available: true, reason: '', evidenceTurns: turns.sort(function (a, b) { return a - b; }) };
  }

  // 局部优化：当期现金变好，代价是研发/良率/士气这些"长期能力"在掉。
  // 只看一回合无法区分"精打细算"与"拆东补西"，所以要求同一回合同时出现
  // 现金流改善 + 长期能力恶化，两者缺一不算。
  function costCutLocalCount(hist) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    var turns = [];
    hist.forEach(function (d) {
      var e = d.applied_effects || {};
      var cash = num(e.cash_flow);
      var rnd = num(e.rnd_budget);
      var morale = num(e.engineer_morale);
      var yld = num(e.yield_rate);
      var cashUp = cash != null && cash > 0;
      var longHurt = (rnd != null && rnd < 0) || (morale != null && morale < 0);
      var qualityDown = (yld != null && yld < 0) || (morale != null && morale < 0);
      if (cashUp && longHurt && qualityDown) turns.push(Number(d.turn));
    });
    return { value: turns.length, available: true, reason: '', evidenceTurns: turns };
  }

  // 乐观叙事：把自己这边的认知往上抬（perception_bias 升），但客观风险没降
  // （supply_chain_risk 没下降）。抬认知本身不是错，错在抬完就不看风险了。
  function optimismClaimCount(hist) {
    if (!hist.length) return { value: null, available: false, reason: 'no_history', evidenceTurns: [] };
    var turns = [];
    hist.forEach(function (d) {
      var e = d.applied_effects || {};
      var per = num(e.perception_bias);
      var risk = num(e.supply_chain_risk);
      if (per != null && per > 0 && (risk == null || risk >= 0)) turns.push(Number(d.turn));
    });
    return { value: turns.length, available: true, reason: '', evidenceTurns: turns };
  }

  function deriveMetrics(state, scenarioData) {
    var hist = (state && Array.isArray(state.decision_history)) ? state.decision_history : [];
    return {
      warning_to_response_lag: warningToResponseLag(hist),
      consecutive_similar_choices: consecutiveSimilarChoices(hist),
      primary_focus_dimension_count: primaryFocusDimensionCount(hist),
      deferred_consequence_count: deferredConsequenceCount(hist),
      single_concern_choices: singleConcernChoices(hist, scenarioData),
      analyst_confidence_drop_count: analystConfidenceDropCount(hist),
      no_change_after_reveal: noChangeAfterReveal(hist, scenarioData),
      strategy_backfire_count: strategyBackfireCount(hist),
      cost_cut_local_count: costCutLocalCount(hist),
      optimism_claim_count: optimismClaimCount(hist)
    };
  }

  // 引擎 effects 的键 → 出现在哪些回合。用于回答"这条概念凭什么算命中"。
  function effectIndex(scenarioData) {
    var keys = {};
    var turns = {};
    var steps = (scenarioData && scenarioData.steps) || [];
    steps.forEach(function (st, i) {
      var turn = Number(st && st.turn) || (i + 1);
      var ee = (st && st.expected_effects) || {};
      var inStep = {};
      Object.keys(ee).forEach(function (oid) {
        Object.keys(ee[oid] || {}).forEach(function (k) { inStep[k] = true; });
      });
      Object.keys(inStep).forEach(function (k) {
        keys[k] = true;
        (turns[k] = turns[k] || []).push(turn);
      });
    });
    return { keys: keys, turns: turns };
  }

  function buildConcepts(model, scenarioData, state) {
    var patterns = (scenarioData && scenarioData.feedback_patterns) || {};
    var initState = (scenarioData && scenarioData.initialState) || {};
    var idx = effectIndex(scenarioData);
    var derived = deriveMetrics(state, scenarioData);
    var evalState = {};
    Object.keys(state || {}).forEach(function (k) { evalState[k] = state[k]; });
    DERIVED_KEYS.forEach(function (k) {
      if (derived[k] && derived[k].available) evalState[k] = derived[k].value;
    });

    function classify(name) {
      if (idx.keys[name]) return 'attr';
      if (DERIVED_KEYS.indexOf(name) >= 0) return 'derived';
      if (Object.prototype.hasOwnProperty.call(initState, name)) return 'init';
      return 'nowhere';
    }

    // ── A-2 回合级：每个原子必须自己交代"是行为还是终局状态" ──────────
    // concept 级 evidenceTurns 是所有原子的并集，混着状态值与行为计数时，
    // 玩家会把"第 3 回合"错记到那个其实只在终局才求得出的状态值上。
    // 所以 scope 与回合必须下沉到原子粒度：
    //   behavior = 由 decision_history 逐回合算出来的（能指回具体回合）
    //   terminal = 终局状态值 / 场景静态声明（无法回溯时序，spec 局限 4）
    function derivedFor(name) {
      var d = derived[name];
      return (d && d.available) ? d : null;
    }
    function atomTurns(name) {
      var d = derivedFor(name);
      if (!d) return [];
      var out = [];
      (d.evidenceTurns || []).forEach(function (t) {
        var n = Number(t);
        if (isFinite(n) && n >= 1 && out.indexOf(n) < 0) out.push(n);
      });
      return out.sort(function (x, y) { return x - y; });
    }

    var out = Object.keys(patterns).map(function (k) {
      var p = patterns[k] || {};
      // retired：这条概念所依赖的数据引擎从不产出，宁可让它不出现在复盘里，
      // 也不能用一条永远拿 undefined 的规则冒充"诊断到了"。
      // 标记而非删除，是为了保留概念定义与下线理由，日后补了数据源可以复活。
      if (p.retired) return null;
      var parsed = parseTrigger(p.trigger);
      var res = evalTrigger(parsed, evalState);
      var atoms = res.atoms.map(function (a) {
        var src = classify(a.atom.name);
        var turns = (src === 'derived') ? atomTurns(a.atom.name) : [];
        return {
          name: a.atom.name,
          op: a.atom.op,
          threshold: a.atom.threshold,
          value: a.value,
          pass: a.pass,
          source: src,
          // 有回合 = 行为；没有回合 = 终局状态（不许把状态值伪装成回合行为）
          scope: turns.length ? 'behavior' : 'terminal',
          evidenceTurns: turns,
          evidenceTurn: turns.length ? turns[0] : null
        };
      });
      var behaviorTurns = [];
      atoms.forEach(function (a) {
        a.evidenceTurns.forEach(function (t) { if (behaviorTurns.indexOf(t) < 0) behaviorTurns.push(t); });
      });
      behaviorTurns.sort(function (x, y) { return x - y; });
      var srcs = atoms.map(function (a) { return a.source; });
      function all(s) { return atoms.length > 0 && srcs.every(function (x) { return x === s; }); }
      var hasDerived = srcs.indexOf('derived') >= 0;
      var hasNowhere = srcs.indexOf('nowhere') >= 0;
      var hasInit = srcs.indexOf('init') >= 0;
      // 零行动基线：一步都不走就能命中，说明这条判定与决策无关
      var baseHit = parsed ? evalTrigger(parsed, initState).hit : false;

      var verdict;
      if (!parsed) verdict = 'rewrite';
      else if (all('nowhere')) verdict = 'deprecate';
      else if (baseHit) verdict = 'constant';
      else if (hasDerived && !hasNowhere && !hasInit) verdict = 'derive_runtime';
      else if (all('attr')) verdict = 'derive';
      else if (all('init')) verdict = 'constant';
      else verdict = 'split';

      // 五态。原 missing 把"引擎从未产出"和"本局没走到"混成一句，
      // 前者是我们的缺口，后者是玩家的路径，必须分开。
      var knownCount = atoms.filter(function (a) { return a.value != null; }).length;
      var status;
      if (!parsed) status = 'unparsed';
      else if (all('nowhere')) status = 'no_source';
      // 恒真规则单列：它必然命中，与玩家做了什么无关，混进"命中"就是谎报。
      else if (verdict === 'constant') status = 'constant';
      else if (knownCount === 0) status = 'unreached';
      else status = res.hit ? 'hit' : 'miss';

      var evidence = [];
      atoms.forEach(function (a) {
        var t = [];
        if (a.source === 'attr') t = idx.turns[a.name] || [];
        else if (a.source === 'derived') t = (derived[a.name] && derived[a.name].evidenceTurns) || [];
        t.forEach(function (x) { if (evidence.indexOf(x) < 0) evidence.push(x); });
      });
      evidence.sort(function (a, b) { return a - b; });

      var visible = (verdict === 'derive' || verdict === 'derive_runtime')
        && (status === 'hit' || status === 'miss')
        && evidence.length > 0;

      return {
        key: k,
        concept: p.dorner_concept || k,
        trigger: String(p.trigger || ''),
        hit: res.hit,
        status: status,
        verdict: verdict,
        visible: visible,
        evidenceTurns: evidence,
        // 回合级摘要：UI 说"从第 N 回合起"就取这个，不必自己去翻原子。
        behaviorTurns: behaviorTurns,
        earliestBehaviorTurn: behaviorTurns.length ? behaviorTurns[0] : null,
        hasBehaviorAtom: behaviorTurns.length > 0,
        terminalOnly: atoms.length > 0 && behaviorTurns.length === 0,
        parsed: !!parsed,
        atoms: atoms,
        reading: p.evidence_template ? String(p.evidence_template) : ''
      };
    });

    // retired 规则返回 null，必须在这里滤掉；否则下游 out.filter 会踩空。
    out = out.filter(function (c) { return !!c; });
    var rank = { hit: 0, miss: 1, unreached: 2, unparsed: 3, no_source: 4, constant: 5 };
    out.sort(function (a, b) { return rank[a.status] - rank[b.status]; });
    model.concepts = out;
    function count(st) { return out.filter(function (c) { return c.status === st; }).length; }
    model.conceptCoverage = {
      total: out.length,
      hit: count('hit'),
      miss: count('miss'),
      unparsed: count('unparsed'),
      unreached: count('unreached'),
      no_source: count('no_source'),
      constant: count('constant'),
      visible: out.filter(function (c) { return c.visible; }).length,
      deprecated: out.filter(function (c) { return c.verdict === 'deprecate'; }).length
    };
    model.conceptSource = (scenarioData && scenarioData.scenarioId) || model.scenarioId;
    // 静态/动态分层的唯一产物：终局渲染只读这个数组，不再自己判 visible。
    model.conceptCards = buildConceptCards(model, scenarioData, state);
    return out;
  }

  // ── L2-1 静态层解耦 ─────────────────────────────────────────────────────
  // 教材是静态的：概念名、Dörner 一课、原话、现实锚定——这些不需要任何求值。
  // 证据是动态的：只有真的命中，才有本局第几回合的证据可讲。
  // 旧实现把两者绑在同一个 visible 条件上，于是"规则判不出来"直接等于
  // "这一课不出现在复盘里"，26 条教训因此永久不出现。
  // 现在：静态永远显示（8 条全列），动态只在命中时展开。
  function buildConceptCards(model, scenarioData, state) {
    var data = scenarioData || {};
    var patterns = data.feedback_patterns || {};
    var keys = Object.keys(patterns);
    var lessons = Array.isArray(data.dornerLessons) ? data.dornerLessons : [];
    var quotes = Array.isArray(data.dorner_quotes) ? data.dorner_quotes : [];
    var byKey = {};
    ((model && model.concepts) || []).forEach(function (c) { byKey[c.key] = c; });

    // 未命中要能说清是哪一种"没触发"。玩家视图只有二元状态，
    // 但"你没走到"和"我们没接数据"是两回事，不能混成一句糊弄过去。
    function reasonOf(c) {
      if (!c) return 'no_rule';
      if (c.status === 'hit') return '';
      if (c.status === 'no_source') return 'no_source';
      if (c.status === 'unparsed') return 'unparsed';
      if (c.status === 'constant') return 'constant';
      if (c.status === 'unreached') return 'unreached';
      return 'miss';
    }

    return keys.map(function (k, idx) {
      var p = patterns[k] || {};
      var c = byKey[k] || null;
      var hit = !!(c && c.status === 'hit');
      // 教材句：显式 lesson_index 优先，缺省按 pattern 键序对齐 dornerLessons。
      // 两条都拿不到就留空，绝不自己编一句"教材"。
      var li = (typeof p.lesson_index === 'number') ? p.lesson_index : idx;
      var lesson = (li >= 0 && li < lessons.length) ? String(lessons[li] || '') : '';
      // 原话只认显式映射：错配一句名人名言，比不显示更糟。
      var qi = (typeof p.quote_index === 'number') ? p.quote_index : -1;
      var q = (qi >= 0 && qi < quotes.length) ? quotes[qi] : null;
      var dynamicText = hit && p.evidence_template ? fillTemplate(p.evidence_template, model) : '';
      return {
        key: k,
        index: idx + 1,
        concept: p.dorner_concept || (c && c.concept) || k,
        status: hit ? 'hit' : 'not_triggered',
        reason: reasonOf(c),
        lesson: lesson,
        quote: q ? { text: String(q.quote || ''), source: String(q.source || '') } : null,
        anchor: p.real_world_anchor ? String(p.real_world_anchor) : '',
        dynamic: {
          text: dynamicText,
          evidenceTurns: (c && c.evidenceTurns) ? c.evidenceTurns.slice() : []
        },
        // 诊断信息只给开发/验收看，不进玩家正文
        diagnostic: c ? { status: c.status, verdict: c.verdict, trigger: c.trigger } : null
      };
    });
  }

  // ── 根因树布局：SVG 与 Canvas 共用同一套坐标，屏幕和 PNG 才长得一样 ────
  var TREE = {
    width: 1000,
    padX: 16,
    padY: 14,
    c1: { x: 16, w: 208, h: 96 },
    c2: { x: 288, w: 334, h: 78 },
    c3: { x: 674, w: 310, h: 68 },
    rowGap: 18,
    nodeGap: 12
  };

  function wrap(text, perLine, maxLines) {
    var s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    var limit = maxLines || 3;
    var lines = [];
    while (s.length > perLine && lines.length < limit) {
      lines.push(s.slice(0, perLine));
      s = s.slice(perLine);
    }
    if (s) {
      if (lines.length >= limit) {
        var last = lines[limit - 1];
        lines[limit - 1] = (last.length >= perLine ? last.slice(0, perLine - 1) : last) + '…';
      } else {
        lines.push(s);
      }
    }
    return lines.length ? lines : [''];
  }

  function treeLayout(model) {
    var rc = (model.rootCauses || []).slice(0, 4);
    var nodes = [];
    var edges = [];
    var cursor = TREE.padY;
    var causeNodes = [];

    rc.forEach(function (c, i) {
      var chain = (c.chain || []).slice(0, 3);
      var synthetic = !chain.length;
      if (synthetic) {
        chain = [{ turn: 0, text: '由多次小幅选择累积，没有单回合主刀', delta: c.delta }];
      }
      var top = cursor;
      var chainYs = [];
      chain.forEach(function (d, j) {
        var y = top + j * (TREE.c3.h + TREE.nodeGap);
        chainYs.push(y);
        nodes.push({
          kind: 'decision',
          x: TREE.c3.x, y: y, w: TREE.c3.w, h: TREE.c3.h,
          turn: d.turn,
          synthetic: synthetic,
          head: d.turn > 0 ? 'T' + d.turn : '累计',
          lines: wrap(d.text, 16, 2),
          delta: d.delta,
          metric: c.label
        });
      });
      cursor = top + chain.length * (TREE.c3.h + TREE.nodeGap) + TREE.rowGap;

      var mid = (chainYs[0] + chainYs[chainYs.length - 1] + TREE.c3.h) / 2;
      var cy = Math.max(TREE.padY, mid - TREE.c2.h / 2);
      var rn = {
        kind: 'cause',
        x: TREE.c2.x, y: cy, w: TREE.c2.w, h: TREE.c2.h,
        idx: i + 1,
        title: c.label,
        lines: wrap(c.label, 13, 2),
        value: fmt(c.from) + ' → ' + fmt(c.to),
        delta: c.delta,
        goodUp: c.goodUp
      };
      nodes.push(rn);
      causeNodes.push(rn);
      chainYs.forEach(function (y) {
        edges.push({ x1: rn.x, y1: rn.y + rn.h / 2, x2: TREE.c3.x, y2: y + TREE.c3.h / 2 });
      });
    });

    var height = Math.max(cursor + TREE.padY, TREE.padY * 2 + TREE.c1.h + 24);
    var ending = {
      kind: 'ending',
      x: TREE.c1.x,
      y: Math.max(TREE.padY, height / 2 - TREE.c1.h / 2),
      w: TREE.c1.w, h: TREE.c1.h,
      head: '结局',
      lines: wrap(model.ending ? model.ending.title : '结局未判定', 13, 3)
    };
    nodes.push(ending);
    causeNodes.forEach(function (rn) {
      edges.push({
        x1: ending.x + ending.w, y1: ending.y + ending.h / 2,
        x2: rn.x, y2: rn.y + rn.h / 2
      });
    });

    return { width: TREE.width, height: height, nodes: nodes, edges: edges, ending: ending };
  }

  function edgePath(e) {
    var mx = (e.x1 + e.x2) / 2;
    return 'M' + e.x1 + ',' + e.y1 + ' C' + mx + ',' + e.y1 + ' ' + mx + ',' + e.y2 + ' ' + e.x2 + ',' + e.y2;
  }

  function renderTreeSvg(L) {
    var out = [];
    out.push('<svg class="fl-db-svg" viewBox="0 0 ' + L.width + ' ' + L.height + '" '
      + 'width="100%" preserveAspectRatio="xMidYMin meet" role="img" '
      + 'aria-label="根因树：结局、主因与决策回合">');
    out.push('<g class="fl-db-edges">');
    L.edges.forEach(function (e) {
      out.push('<path d="' + edgePath(e) + '" fill="none" stroke="#c6cbd4" stroke-width="1.5"/>');
    });
    out.push('</g>');

    L.nodes.forEach(function (n) {
      var cls = n.kind === 'ending' ? 'fl-db-n-ending'
        : n.kind === 'cause' ? 'fl-db-n-cause' : 'fl-db-n-decision';
      out.push('<g class="' + cls + '">');
      out.push('<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h
        + '" rx="10" ry="10"/>');

      if (n.kind === 'ending') {
        out.push('<text class="fl-db-t-head" x="' + (n.x + 12) + '" y="' + (n.y + 22) + '">'
          + esc(n.head) + '</text>');
        n.lines.forEach(function (ln, i) {
          out.push('<text class="fl-db-t-title" x="' + (n.x + 12) + '" y="' + (n.y + 46 + i * 19) + '">'
            + esc(ln) + '</text>');
        });
      } else if (n.kind === 'cause') {
        out.push('<text class="fl-db-t-head" x="' + (n.x + 12) + '" y="' + (n.y + 20) + '">主因 '
          + n.idx + '</text>');
        n.lines.forEach(function (ln, i) {
          out.push('<text class="fl-db-t-title" x="' + (n.x + 12) + '" y="' + (n.y + 42 + i * 18) + '">'
            + esc(ln) + '</text>');
        });
        out.push('<text class="fl-db-t-meta" x="' + (n.x + 12) + '" y="' + (n.y + n.h - 12) + '">'
          + esc(n.value) + '（' + esc(signed(n.delta)) + '）</text>');
      } else {
        out.push('<text class="fl-db-t-head" x="' + (n.x + 12) + '" y="' + (n.y + 21) + '">'
          + esc(n.head) + '</text>');
        if (num(n.delta) != null) {
          out.push('<text class="fl-db-t-delta" x="' + (n.x + n.w - 12) + '" y="' + (n.y + 21)
            + '" text-anchor="end">' + esc(n.metric + ' ' + signed(n.delta)) + '</text>');
        }
        n.lines.forEach(function (ln, i) {
          out.push('<text class="fl-db-t-body" x="' + (n.x + 12) + '" y="' + (n.y + 44 + i * 18) + '">'
            + esc(ln) + '</text>');
        });
      }
      out.push('</g>');
    });
    out.push('</svg>');
    return out.join('');
  }

  // ── 复盘正文 ───────────────────────────────────────────────────────────
  function pressureBadge(tier) {
    if (tier === 'low') return { text: '余量尚存', cls: 'low' };
    if (tier === 'high') return { text: '积重难返', cls: 'high' };
    return { text: '余量渐失', cls: 'mid' };
  }

  function fillTemplate(tpl, model) {
    var text = String(tpl || '');
    if (!text) return '';
    var values = { turns: model.turns };
    (model.concepts || []).forEach(function (c) {
      (c.atoms || []).forEach(function (a) {
        if (a.value != null) values[a.name] = a.value;
      });
    });
    return text.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, function (m, k) {
      return values[k] != null ? String(values[k]) : '—';
    });
  }

  function renderLedger(ledger) {
    if (!ledger) return '<p class="fl-db-empty">本局没有留下代价清算数据。</p>';
    var badge = pressureBadge(ledger.pressure_tier);
    var counters = Array.isArray(ledger.key_counters) ? ledger.key_counters : [];
    var rows = counters.map(function (c) {
      return '<li><span>' + esc(c.name) + '</span><b>' + esc(fmt(num(c.value))) + '</b></li>';
    }).join('');
    return '<div class="fl-db-ledger fl-db-tier-' + badge.cls + '">'
      + '<div class="fl-db-tier">' + esc(badge.text) + ' · ' + esc(ledger.pressure_tier || 'mid') + '</div>'
      + '<p class="fl-db-verdict">' + esc(ledger.verdict || '') + '</p>'
      + (rows ? '<ul class="fl-db-counters">' + rows + '</ul>' : '')
      + '</div>';
  }

  function renderPending(list) {
    if (!list || !list.length) {
      return '<p class="fl-db-empty">没有未结清的账 — 你埋下的延迟后果都已经在局内显现。</p>';
    }
    var items = list.map(function (p) {
      return '<li><b>' + esc(p.key) + '</b><span>埋下于 T' + esc(p.sourceTurn)
        + '，到终局仍未显现</span></li>';
    }).join('');
    return '<ul class="fl-db-pending">' + items + '</ul>'
      + '<p class="fl-db-hint">这些后果不在本局结算 — 它们属于下一局。</p>';
  }

  // 概念命中标签的唯一出口：屏幕、PNG 共用一套措辞。
  function conceptTag(c) {
    if (c.status === 'hit') return { text: '命中', cls: 'hit' };
    if (c.status === 'unparsed' || !c.parsed) return { text: '规则不可解析', cls: 'unparsed' };
    // 原「指标未上报」把两件事混成一句，已按口径拆开：
    // 前者是我们没接数据，后者是玩家没走到，责任主体不同。
    if (c.status === 'no_source') return { text: '本场景未接入', cls: 'nosource' };
    if (c.status === 'unreached') return { text: '本局未触发', cls: 'unreached' };
    if (c.status === 'constant') return { text: '判定与决策无关', cls: 'constant' };
    return { text: '未达到阈值', cls: 'miss' };
  }

  function coverageNote(model) {
    var cv = model.conceptCoverage;
    if (!cv || !cv.total) return '';
    var visible = cv.visible || 0;
    var folded = cv.total - visible;
    var head = visible
      ? '本局可判定的失败逻辑 ' + visible + ' 条，其中命中 ' + cv.hit + ' 条'
      : '本局没有可判定的失败逻辑';
    var tail = '';
    if (folded > 0) {
      var bits = [];
      if (cv.no_source) bits.push(cv.no_source + ' 条本场景未接入统计');
      if (cv.unreached) bits.push(cv.unreached + ' 条本局未触发');
      if (cv.constant) bits.push(cv.constant + ' 条判定与决策无关（恒真，已停用）');
      if (cv.unparsed) bits.push(cv.unparsed + ' 条写法无法解析');
      tail = '另有 ' + folded + ' 条规则本局无法判定'
        + (bits.length ? '（' + bits.join('，') + '）' : '') + '，不计入评价。';
    }
    var honest = visible ? '' : '这不等于你没踩坑，只等于我们还没测到。';
    return '<p class="fl-db-ccover">' + esc(head + '。' + tail + honest) + '</p>';
  }

  function renderConcepts(list, model) {
    if (!list || !list.length) return '<p class="fl-db-empty">本场景没有配置概念命中规则。</p>';
    var shown = list.filter(function (c) { return c.visible; });
    var folded = list.filter(function (c) { return !c.visible; });
    var body = shown.map(function (c) {
      var atom = (c.atoms || [])[0];
      var ratio = 0;
      if (atom && atom.threshold) {
        var scale = Math.max(Math.abs(atom.value || 0), Math.abs(atom.threshold), 1) * 1.15;
        ratio = Math.min(1, Math.abs(atom.value || 0) / scale);
      }
      var mark = Math.min(100, Math.max(0, ratio * 100));
      var thresholdMark = atom && atom.threshold
        ? Math.min(100, Math.abs(atom.threshold) / (Math.max(Math.abs(atom.value || 0), Math.abs(atom.threshold), 1) * 1.15) * 100)
        : 0;
      var reading = fillTemplate(c.reading, model || { turns: 0, concepts: [c] });
      var tg = conceptTag(c);
      // 回合引用是这条概念的"出处"。指不到回合一概不进这个列表（见 visible）。
      var where = (c.evidenceTurns || []).length
        ? '<span class="fl-db-cwhere">第 ' + c.evidenceTurns.join('、') + ' 回合</span>'
        : '';
      return '<div class="fl-db-concept ' + tg.cls + '">'
        + '<div class="fl-db-crow">'
        + '<span class="fl-db-cname">' + esc(c.concept) + '</span>'
        + where
        + '<span class="fl-db-ctag">' + tg.text + '</span>'
        + '</div>'
        + '<div class="fl-db-cbar"><i style="width:' + mark.toFixed(1) + '%"></i>'
        + '<u style="left:' + thresholdMark.toFixed(1) + '%"></u></div>'
        + '<div class="fl-db-cmeta">' + esc(c.trigger || '—') + '</div>'
        + (reading ? '<div class="fl-db-creading">' + esc(reading) + '</div>' : '')
        + '</div>';
    }).join('');
    var fold = folded.length
      ? '<p class="fl-db-folded">另有 ' + folded.length + ' 条规则本局无法判定，已折叠：'
        + esc(folded.map(function (c) { return c.concept + '（' + conceptTag(c).text + '）'; }).join('、'))
        + '。它们不计入评价，也不代表你躲过了。</p>'
      : '';
    return '<div class="fl-db-concepts">' + coverageNote(model) + body + fold + '</div>';
  }

  // 未触发的成因：玩家路径 / 我们没接数据 / 规则写坏了，三件事必须分开说。
  var NOT_TRIGGERED_REASON = {
    miss: '阈值没到',
    unreached: '本局没走到这条判定',
    no_source: '本场景未接入这项统计',
    unparsed: '规则写法待修',
    constant: '这条判定与决策无关（恒真）',
    no_rule: '规则缺失'
  };

  // 终局概念区的唯一渲染入口：静态永远在，动态只在命中时展开。
  // 措辞硬约束：未触发一律写「本局未触发」，禁止写成「你避开了」——
  // 没触发可能是我们没测到，把它算成玩家的成绩就是撒谎。
  function renderConceptCards(cards) {
    if (!cards || !cards.length) return '<p class="fl-db-empty">本场景没有配置概念命中规则。</p>';
    var hitCount = cards.filter(function (c) { return c.status === 'hit'; }).length;
    var body = cards.map(function (c) {
      var isHit = c.status === 'hit';
      var why = isHit ? '' : (NOT_TRIGGERED_REASON[c.reason] || '');
      var evid = '';
      if (isHit && c.dynamic && c.dynamic.text) {
        var where = (c.dynamic.evidenceTurns || []).length
          ? '<span class="fl-db-cwhere">第 ' + c.dynamic.evidenceTurns.join('、') + ' 回合</span>'
          : '';
        evid = '<div class="fl-db-cevidence">' + where + '<p>' + esc(c.dynamic.text) + '</p></div>';
      }
      var idx = c.index < 10 ? '0' + c.index : String(c.index);
      return '<article class="fl-db-ccard ' + (isHit ? 'hit' : 'off') + '">'
        + '<div class="fl-db-cchead">'
        + '<span class="fl-db-cidx">' + idx + '</span>'
        + '<span class="fl-db-cname">' + esc(c.concept) + '</span>'
        + '<span class="fl-db-ctag fl-db-ctag-' + (isHit ? 'hit' : 'off') + '">'
        + (isHit ? '命中' : '本局未触发') + '</span>'
        + '</div>'
        + (c.lesson ? '<p class="fl-db-clesson">' + esc(c.lesson) + '</p>' : '')
        + (c.quote && c.quote.text
          ? '<blockquote class="fl-db-cquote">' + esc(c.quote.text)
            + (c.quote.source ? '<cite>—— ' + esc(c.quote.source) + '</cite>' : '') + '</blockquote>'
          : '')
        + (c.anchor ? '<p class="fl-db-canchor">现实里长这样：' + esc(c.anchor) + '</p>' : '')
        + evid
        + (isHit ? '' : '<p class="fl-db-cnone">本局未触发' + (why ? '（' + esc(why) + '）' : '') + '</p>')
        + '</article>';
    }).join('');
    var head = '<p class="fl-db-ccover">本局共 ' + cards.length + ' 条失败逻辑，命中 ' + hitCount
      + ' 条。八条都在下面：没触发不等于你躲过了，也可能只是这局没走到。</p>';
    return '<div class="fl-db-cards">' + head + body + '</div>';
  }

  function renderCounterfactuals(list) {
    if (!list || !list.length) {
      return '<p class="fl-db-empty">没有可追溯的反事实 — 本局的主因链没有落到具体回合。</p>';
    }
    var items = list.map(function (c) {
      var alt = c.alternative
        ? '另一条路是「' + esc(c.alternative) + '」'
        : '这一步在原始场景里没有可对照的另一个选项';
      return '<li>'
        + '<div class="fl-db-cfhead">T' + esc(c.turn) + ' · ' + esc(c.metric)
        + (num(c.delta) != null ? ' ' + esc(signed(c.delta)) : '') + '</div>'
        + '<div class="fl-db-cfbody">你选了「' + esc(c.chosen) + '」，' + alt + '。</div>'
        + '</li>';
    }).join('');
    return '<ul class="fl-db-cf">' + items + '</ul>';
  }

  // ── L2-2 渲染：三层必须排在前面，细节五块折叠在后面 ────────────────────
  // 屏上第一屏只给三层：玩家先看懂"我做了什么 / 这叫什么 / 下次怎么办"，
  // 想深挖再展开根因树与代价账。五块本身一字不改，只是不再抢第一屏。
  function renderLayers(layers, model) {
    var L = layers || null;
    if (!L) return '';
    var out = '<div class="fl-db-layers" data-fl-db-layers="1">';

    out += '<section class="fl-db-layer fl-db-layer-did" data-fl-db-layer="did">'
      + '<h4>一、你做了什么</h4>';
    if (L.did && L.did.length) {
      out += '<ol class="fl-db-did">';
      L.did.forEach(function (k) {
        out += '<li><span class="fl-db-did-turn">T' + esc(k.turn) + '</span>'
          + '<span class="fl-db-did-text">' + esc(k.text) + '</span>'
          + (k.effect ? '<span class="fl-db-did-eff">' + esc(k.effect) + '</span>' : '')
          + (k.sacrificed && k.sacrificed.length
            ? '<span class="fl-db-did-sac">牺牲 ' + esc(k.sacrificed.join('、')) + '</span>' : '')
          + '</li>';
      });
      out += '</ol>';
    } else {
      out += '<p class="fl-db-empty">本局没有可追溯的决策记录。</p>';
    }
    out += '</section>';

    out += '<section class="fl-db-layer fl-db-layer-named" data-fl-db-layer="named">'
      + '<h4>二、这叫什么</h4>';
    if (L.named && L.named.length) {
      L.named.forEach(function (n) {
        out += '<div class="fl-db-named">'
          + '<p class="fl-db-named-name">' + esc(n.concept) + '</p>';
        if (n.quote) {
          out += '<blockquote class="fl-db-named-quote">' + esc(n.quote)
            + (n.source ? '<cite>' + esc(n.source) + '</cite>' : '') + '</blockquote>';
        }
        if (n.evidence) {
          out += '<p class="fl-db-named-evi">' + esc(n.evidence) + '</p>';
        }
        out += '</div>';
      });
    } else {
      // D8：没命中不等于避开了。这句话必须留在页面上，不能悄悄不渲染。
      out += '<p class="fl-db-empty">本局没有命中任何一条失败逻辑 — 这不代表你避开了它们。</p>';
    }
    out += '</section>';

    out += '<section class="fl-db-layer fl-db-layer-next" data-fl-db-layer="next">'
      + '<h4>三、下次怎么办</h4>';
    var cf = L.next && L.next.counterfactual;
    if (cf) {
      out += '<p class="fl-db-next-cf">第 ' + esc(cf.turn) + ' 回合你选了「' + esc(cf.chosen)
        + '」，这一手把「' + esc(cf.metric) + '」推了 ' + esc(signed(cf.delta)) + '。'
        + (cf.alternative ? '另一条路是「' + esc(cf.alternative) + '」。' : '') + '</p>';
    }
    if (L.next && L.next.questions && L.next.questions.length) {
      out += '<ol class="fl-db-next-q">';
      L.next.questions.forEach(function (q) { out += '<li>' + esc(q) + '</li>'; });
      out += '</ol>';
    }
    if (L.next && L.next.anchor) {
      out += '<p class="fl-db-next-anchor">现实里长这样：' + esc(L.next.anchor) + '</p>';
    }
    out += '</section>';

    out += '</div>';
    return out;
  }

  function renderHtml(model) {
    var L = treeLayout(model);
    var endingTitle = model.ending ? model.ending.title : '结局未判定';
    var srcNote = model.ending
      ? '结局来源 ' + (model.ending.source || '—')
        + (model.ending.rewritten ? '（声明与推演不一致，已重写）' : '')
      : '';
    return '<section class="fl-debrief" data-fl-debrief="1">'
      + '<header class="fl-db-head">'
      + '<h3>复盘 · ' + esc(endingTitle) + '</h3>'
      + '<p class="fl-db-sub">' + esc(model.scenarioLabel || model.scenarioId)
      + ' · ' + esc(model.turns) + ' 回合' + (srcNote ? ' · ' + esc(srcNote) : '') + '</p>'
      + '</header>'

      + renderLayers(model.layers || buildLayers(model), model)

      + '<details class="fl-db-details">'
      + '<summary>展开细节：根因链 / 代价清算 / 未结清的账 / 八条失败逻辑 / 如果当时</summary>'

      + '<section class="fl-db-sec"><h4>一、根因链</h4>'
      + (model.rootCauses && model.rootCauses.length
        ? '<div class="fl-db-tree">' + renderTreeSvg(L) + '</div>'
          + '<p class="fl-db-hint">从结局往左追：主因只取「你真的动过、且方向明确」的指标；'
          + '每个主因下挂最多 3 个真实动过它的回合。</p>'
        : '<p class="fl-db-empty">本局没有任何指标朝坏方向被真实改动过 — 没有可追溯的根因。</p>')
      + '</section>'

      + '<section class="fl-db-sec"><h4>二、代价清算</h4>' + renderLedger(model.ledger) + '</section>'

      + '<section class="fl-db-sec"><h4>三、未结清的账</h4>' + renderPending(model.pendingDelays) + '</section>'

      + '<section class="fl-db-sec"><h4>四、八条失败逻辑</h4>' + renderConceptCards(model.conceptCards) + '</section>'

      + '<section class="fl-db-sec"><h4>五、如果当时</h4>' + renderCounterfactuals(model.counterfactuals) + '</section>'

      + '</details>'

      + '<div class="fl-db-actions">'
      + '<button type="button" class="btn btn-secondary" data-fl-db-export="1">导出复盘 PNG</button>'
      + '</div>'
      + '</section>';
  }

  // ── 导出 PNG：Canvas 2D 手绘，和屏幕上的 SVG 用同一套坐标 ───────────────
  var _lastModel = null;

  function roundRect(ctx, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  var PNG_W = 1000;
  var PNG_M = 36;

  function drawDebrief(ctx, model) {
    var W = PNG_W;
    var M = PNG_M;
    var maxW = W - M * 2;
    var y = M;
    var SANS = '"Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif';
    var F = {
      h1: '700 25px ' + SANS,
      h2: '700 16px ' + SANS,
      body: '400 14px ' + SANS,
      small: '400 12.5px ' + SANS,
      tiny: '400 11.5px ' + SANS
    };
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    function wrapText(text, font, width) {
      ctx.font = font;
      var s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
      if (!s) return [''];
      var lines = [];
      var cur = '';
      for (var i = 0; i < s.length; i++) {
        var t = cur + s.charAt(i);
        if (ctx.measureText(t).width > width && cur) {
          lines.push(cur);
          cur = s.charAt(i);
        } else {
          cur = t;
        }
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : [''];
    }

    function para(text, font, color, lineH, gapAfter, indent) {
      var x = M + (indent || 0);
      var lines = wrapText(text, font, maxW - (indent || 0));
      ctx.font = font;
      ctx.fillStyle = color;
      lines.forEach(function (ln) {
        ctx.fillText(ln, x, y);
        y += lineH || 20;
      });
      y += gapAfter || 0;
    }

    function section(txt) {
      y += 12;
      ctx.font = F.h2;
      ctx.fillStyle = '#1b2431';
      ctx.fillText(txt, M, y);
      y += 24;
      ctx.strokeStyle = '#e2e7ef';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(W - M, y);
      ctx.stroke();
      y += 10;
    }

    function drawTree(L) {
      var s = maxW / L.width;
      ctx.save();
      ctx.translate(M, y);
      ctx.scale(s, s);

      ctx.strokeStyle = '#c6cbd4';
      ctx.lineWidth = 1.7;
      L.edges.forEach(function (e) {
        var mx = (e.x1 + e.x2) / 2;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.bezierCurveTo(mx, e.y1, mx, e.y2, e.x2, e.y2);
        ctx.stroke();
      });

      L.nodes.forEach(function (n) {
        var fill = '#ffffff';
        var stroke = '#cfd6e0';
        if (n.kind === 'ending') { fill = '#f2f5fa'; stroke = '#9aa6b8'; }
        else if (n.kind === 'cause') { fill = '#fdf3f1'; stroke = '#d9887c'; }
        roundRect(ctx, n.x, n.y, n.w, n.h, 10);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.3;
        ctx.stroke();

        ctx.textAlign = 'left';
        if (n.kind === 'ending') {
          ctx.font = '600 12px ' + SANS;
          ctx.fillStyle = '#6b7684';
          ctx.fillText(n.head, n.x + 12, n.y + 10);
          ctx.font = '700 15px ' + SANS;
          ctx.fillStyle = '#1b2431';
          n.lines.forEach(function (ln, i) { ctx.fillText(ln, n.x + 12, n.y + 34 + i * 20); });
        } else if (n.kind === 'cause') {
          ctx.font = '600 12px ' + SANS;
          ctx.fillStyle = '#a3543f';
          ctx.fillText('主因 ' + n.idx, n.x + 12, n.y + 10);
          ctx.font = '700 14px ' + SANS;
          ctx.fillStyle = '#1b2431';
          n.lines.forEach(function (ln, i) { ctx.fillText(ln, n.x + 12, n.y + 30 + i * 19); });
          ctx.font = '400 12.5px ' + SANS;
          ctx.fillStyle = '#7c8798';
          ctx.fillText(n.value + '（' + signed(n.delta) + '）', n.x + 12, n.y + n.h - 22);
        } else {
          ctx.font = '600 12px ' + SANS;
          ctx.fillStyle = '#5b6676';
          ctx.fillText(n.head, n.x + 12, n.y + 9);
          if (num(n.delta) != null) {
            ctx.textAlign = 'right';
            ctx.font = '600 12px ' + SANS;
            ctx.fillStyle = '#c0392b';
            ctx.fillText(n.metric + ' ' + signed(n.delta), n.x + n.w - 12, n.y + 9);
            ctx.textAlign = 'left';
          }
          ctx.font = '400 12.5px ' + SANS;
          ctx.fillStyle = '#2b3542';
          n.lines.forEach(function (ln, i) { ctx.fillText(ln, n.x + 12, n.y + 32 + i * 18); });
        }
      });

      ctx.restore();
      y += L.height * s;
    }

    // 标题
    ctx.font = F.h1;
    ctx.fillStyle = '#141b24';
    ctx.fillText('复盘 · ' + (model.ending ? model.ending.title : '结局未判定'), M, y);
    y += 34;
    var sub = (model.scenarioLabel || model.scenarioId) + ' · ' + model.turns + ' 回合'
      + (model.ending && model.ending.source ? ' · 结局来源 ' + model.ending.source : '');
    para(sub, F.small, '#6b7684', 18, 2);

    // L2-2 · 三层先画：导出的 PNG 是玩家会存下来、会发出去的那一份。
    // 屏上是三层、PNG 只有五块，等于"导出即失真"。
    var LYR = model.layers || buildLayers(model);
    section('一、你做了什么');
    if (LYR.did.length) {
      LYR.did.forEach(function (k) {
        para('T' + k.turn + ' · ' + k.text
          + (k.effect ? '（' + k.effect + '）' : '')
          + (k.sacrificed.length ? '［牺牲 ' + k.sacrificed.join('、') + '］' : ''),
          F.small, '#2b3542', 18, 8);
      });
    } else {
      para('本局没有可追溯的决策记录。', F.body, '#6b7684', 20, 0);
    }

    section('二、这叫什么');
    if (LYR.named.length) {
      LYR.named.forEach(function (n) {
        para('· ' + n.concept + (n.quote ? '：' + n.quote : ''), F.small, '#2b3542', 18, 6);
        if (n.evidence) para('本局证据：' + n.evidence, F.tiny, '#6b7684', 16, 12, 10);
      });
    } else {
      para('本局没有命中任何一条失败逻辑 — 这不代表你避开了它们。', F.body, '#6b7684', 20, 0);
    }

    section('三、下次怎么办');
    if (LYR.next.counterfactual) {
      var cf0 = LYR.next.counterfactual;
      para('第 ' + cf0.turn + ' 回合你选了「' + cf0.chosen + '」，这一手把「' + cf0.metric
        + '」推了 ' + signed(cf0.delta) + '。'
        + (cf0.alternative ? '另一条路是「' + cf0.alternative + '」。' : ''),
        F.small, '#2b3542', 18, 8);
    }
    LYR.next.questions.forEach(function (q, i) {
      para((i + 1) + '. ' + q, F.small, '#4a5563', 18, 6);
    });
    if (LYR.next.anchor) {
      para('现实里长这样：' + LYR.next.anchor, F.tiny, '#8b5a3c', 16, 2, 8);
    }

    // ── 细节五块（与屏上 <details> 同内容）──
    section('四、根因链');
    if (model.rootCauses && model.rootCauses.length) {
      drawTree(treeLayout(model));
      y += 8;
      para('从结局往左追：主因只取「真的动过、且方向明确」的指标；每个主因下挂最多 3 个真实动过它的回合。',
        F.tiny, '#8b95a3', 16, 0);
    } else {
      para('本局没有任何指标朝坏方向被真实改动过 — 没有可追溯的根因。', F.body, '#6b7684', 20, 0);
    }

    // 二、代价清算
    section('五、代价清算');
    if (model.ledger) {
      var badge = pressureBadge(model.ledger.pressure_tier);
      para(badge.text + ' · ' + (model.ledger.pressure_tier || 'mid'), F.small, '#a3543f', 18, 4);
      para(model.ledger.verdict || '', F.body, '#2b3542', 20, 4);
      (model.ledger.key_counters || []).forEach(function (c) {
        para('· ' + c.name + '：' + fmt(num(c.value)), F.small, '#5b6676', 17, 0);
      });
    } else {
      para('本局没有留下代价清算数据。', F.body, '#6b7684', 20, 0);
    }

    // 三、未结清的账
    section('六、未结清的账');
    if (model.pendingDelays && model.pendingDelays.length) {
      model.pendingDelays.forEach(function (p) {
        para('· ' + p.key + ' — 埋下于 T' + p.sourceTurn + '，到终局仍未显现', F.body, '#2b3542', 20, 0);
      });
      y += 4;
      para('这些后果不在本局结算 — 它们属于下一局。', F.tiny, '#8b95a3', 16, 0);
    } else {
      para('没有未结清的账 — 你埋下的延迟后果都已经在局内显现。', F.body, '#6b7684', 20, 0);
    }

    // 四、概念命中
    section('七、概念命中');
    if (model.concepts && model.concepts.length) {
      var cv = model.conceptCoverage;
      if (cv && cv.total) {
        var bits = ['共 ' + cv.total + ' 条规则：' + cv.hit + ' 条命中'];
        if (cv.miss) bits.push(cv.miss + ' 条未达到阈值');
        if (cv.missing) bits.push(cv.missing + ' 条因指标未上报无法判定');
        if (cv.unparsed) bits.push(cv.unparsed + ' 条写法无法解析');
        para(bits.join('，') + '。', F.small, '#6b7684', 18, 0, 10);
      }
      model.concepts.forEach(function (c) {
        var tg = conceptTag(c);
        var tag = tg.text;
        ctx.font = '700 13.5px ' + SANS;
        ctx.fillStyle = '#1b2431';
        ctx.fillText(c.concept, M, y);
        ctx.font = F.small;
        ctx.fillStyle = tg.cls === 'hit' ? '#c0392b' : (tg.cls === 'missing' ? '#a2a9b4' : '#7c8798');
        var nameW = ctx.measureText(c.concept).width;
        ctx.fillText('  ' + tag, M + nameW + 10, y + 1);
        y += 19;
        para(c.trigger || '—', F.tiny, '#8b95a3', 15, 0, 8);
        var reading = fillTemplate(c.reading, model);
        if (reading) para(reading, F.small, '#4a5563', 18, 0, 8);
        y += 6;
      });
    } else {
      para('本场景没有配置概念命中规则。', F.body, '#6b7684', 20, 0);
    }

    // 五、如果当时
    section('八、如果当时');
    if (model.counterfactuals && model.counterfactuals.length) {
      model.counterfactuals.forEach(function (c) {
        ctx.font = '700 13px ' + SANS;
        ctx.fillStyle = '#1b2431';
        ctx.fillText('T' + c.turn + ' · ' + c.metric + (num(c.delta) != null ? ' ' + signed(c.delta) : ''), M, y);
        y += 19;
        var alt = c.alternative ? '另一条路是「' + c.alternative + '」' : '在原始场景里没有可对照的另一个选项';
        para('你选了「' + c.chosen + '」，' + alt + '。', F.small, '#4a5563', 18, 0, 8);
        y += 6;
      });
    } else {
      para('没有可追溯的反事实 — 本局的主因链没有落到具体回合。', F.body, '#6b7684', 20, 0);
    }

    // 页脚
    y += 14;
    ctx.strokeStyle = '#e2e7ef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    y += 10;
    para('FailureLogic · 看得见根因 ' + new Date().toLocaleString('zh-CN'), F.tiny, '#9aa3b0', 16, 0);

    return y;
  }

  function exportPng(model) {
    var m = model || _lastModel;
    if (!m) {
      if (global.console) global.console.warn('[FLDebrief] 没有可导出的复盘数据');
      return false;
    }
    var dpr = 2;
    var HMAX = 4200;
    var tmp = global.document.createElement('canvas');
    tmp.width = PNG_W * dpr;
    tmp.height = HMAX * dpr;
    var ctx = tmp.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, PNG_W, HMAX);
    var endY = drawDebrief(ctx, m);
    var h = Math.min(HMAX, Math.ceil(endY + PNG_M));

    var out = global.document.createElement('canvas');
    out.width = PNG_W * dpr;
    out.height = h * dpr;
    var octx = out.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(tmp, 0, 0, PNG_W * dpr, h * dpr, 0, 0, PNG_W * dpr, h * dpr);

    var name = 'failurelogic-debrief-' + (m.scenarioId || 'scenario') + '.png';
    if (out.toBlob) {
      out.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = global.document.createElement('a');
        a.href = url;
        a.download = name;
        global.document.body.appendChild(a);
        a.click();
        global.document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      }, 'image/png');
    } else {
      var a2 = global.document.createElement('a');
      a2.href = out.toDataURL('image/png');
      a2.download = name;
      global.document.body.appendChild(a2);
      a2.click();
      global.document.body.removeChild(a2);
    }
    return true;
  }

  function mount(host, model) {
    if (!host) return null;
    _lastModel = model;
    host.innerHTML = renderHtml(model);
    var btn = host.querySelector('[data-fl-db-export]');
    if (btn) {
      btn.addEventListener('click', function () {
        try {
          exportPng(model);
        } catch (e) {
          if (global.console) global.console.error('[FLDebrief] 导出失败', e);
        }
      });
    }
    return host;
  }

  global.FLDebrief = {
    // 只读出口，供验收脚本对齐"模型算出的"与"页面上显示的"，不参与渲染。
    get lastModel() { return _lastModel; },
    // TDD 接缝：解析器与判定口径必须可被无头测试直接调用，
    // 否则"静默降级"只能靠人眼看页面发现。
    parseTrigger: parseTrigger,
    evalTrigger: evalTrigger,
    deriveMetrics: deriveMetrics,
    // 白名单必须可被测试枚举：否则"覆盖了几个场景"只能靠人工数表达式。
    DERIVED_KEYS: DERIVED_KEYS,
    renderConcepts: renderConcepts,
    // S0 接缝：静态/动态分层必须可被无头断言直接调用。
    buildConceptCards: buildConceptCards,
    renderConceptCards: renderConceptCards,
    // L2-2 接缝：三层是纯函数，断言可以喂一份模型直接验结构 + 文案，
    // 不必先打完一局再读页面（也就不会因为"这一局恰好没命中"而漏测）。
    buildLayers: buildLayers,
    buildKeyDecisions: buildKeyDecisions,
    renderLayers: renderLayers,
    build: build,
    buildConcepts: buildConcepts,
    // L1-1 接缝：姿态徽标必须只有一个出口，否则页面文案无法被断言。
    stanceLabel: stanceLabel,
    stanceTone: stanceTone,
    isGoodUp: isGoodUp,
    treeLayout: treeLayout,
    renderHtml: renderHtml,
    mount: mount,
    exportPng: exportPng
  };
})(window);

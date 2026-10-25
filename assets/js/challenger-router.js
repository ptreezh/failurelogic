/* challenger-router.js — Dörner-style scenario UI (10-turn deep dive).
 *
 * Single router handles BOTH deep-aligned scenarios:
 *   - challenger-launch  (challenger-router.js handles via SCENARIO_ID)
 *   - climate-change-policy  (also routed here via startChallengerGame)
 *
 * State variable mapping is parameterized per-scenario so the same UI
 * renders different fields:
 *   - challenger: engineer_confidence, schedule_pressure, ...
 *   - climate:   global_avg_temp_c, co2_ppm, renewable_share_pct, ...
 *
 * Per docs/challenger-retrospective.md §3.3: ChallengerRouter is reused;
 * only the SCENARIO_ID and state-field mapping vary. So we use a small
 * registry instead of two separate router classes.
 */

(function () {
  'use strict';

  // Registry of supported scenarios — add new deep scenarios here.
  // defaultState seeds the state grid when the backend API is unreachable,
  // so the player still sees initial values (not "—") even offline.
  const SCENARIOS = {
    'challenger-launch': {
      id: 'challenger-launch',
      label: '挑战者号发射决策',
      totalTurns: 10,
      defaultState: {
        temperature_forecast_f: 36,
        engineer_confidence: 75,
        schedule_pressure: 60,
        budget_used_pct: 87,
        public_attention: 85,
        team_morale: 50,
        accepted_risks_count: 0,
        ignored_warnings_count: 0,
        risk_acknowledged_unresolved: 0,
        turn: 1,
      },
      stateFields: [
        { id: 'state-temperature', key: 'temperature_forecast_f', label: '🌡️ 预报温度 (°F)' },
        { id: 'state-engineer-confidence', key: 'engineer_confidence', label: '👷 工程师信心' },
        { id: 'state-schedule-pressure', key: 'schedule_pressure', label: '📅 进度压力' },
        { id: 'state-budget', key: 'budget_used_pct', label: '💰 预算占比 %' },
        { id: 'state-attention', key: 'public_attention', label: '📺 公众关注' },
        { id: 'state-morale', key: 'team_morale', label: '🤝 团队士气' },
        { id: 'state-accepted-risks', key: 'accepted_risks_count', label: '⚠️ 接受风险' },
        { id: 'state-ignored-warnings', key: 'ignored_warnings_count', label: '🔇 忽视警告' },
        { id: 'state-unresolved', key: 'risk_acknowledged_unresolved', label: '❓ 未解决风险' },
      ],
    },
    'climate-change-policy': {
      id: 'climate-change-policy',
      label: '全球气候政策十年',
      totalTurns: 10,
      defaultState: {
        global_avg_temp_c: 1.55,
        co2_ppm: 424,
        gdp_growth_pct: 3.2,
        renewable_share_pct: 30,
        climate_justice_index: 45,
        public_support_pct: 62,
        whistleblower_silenced_count: 0,
        international_trust: 55,
        tipping_point_proximity: 27,
        turn: 1,
      },
      stateFields: [
        { id: 'state-temperature', key: 'global_avg_temp_c', label: '🌡️ 全球升温 (°C)' },
        { id: 'state-co2', key: 'co2_ppm', label: '💨 CO2浓度 (ppm)' },
        { id: 'state-gdp', key: 'gdp_growth_pct', label: '📈 GDP增长 (%)' },
        { id: 'state-renewable', key: 'renewable_share_pct', label: '⚡ 可再生 (%)' },
        { id: 'state-justice', key: 'climate_justice_index', label: '⚖️ 气候正义' },
        { id: 'state-support', key: 'public_support_pct', label: '👥 公众支持 (%)' },
        { id: 'state-silenced', key: 'whistleblower_silenced_count', label: '🔇 被压制科学家' },
        { id: 'state-trust', key: 'international_trust', label: '🤝 国际信任' },
        { id: 'state-tipping', key: 'tipping_point_proximity', label: '⏰ 临界点逼近度 (%)' },
      ],
    },
    'enron-collapse': {
      id: 'enron-collapse',
      label: '安然帝国崩塌',
      totalTurns: 10,
      defaultState: {
        share_price_usd: 90,
        credit_rating: 'BBB+',
        reported_earnings_usd_m: 979,
        actual_cashflow_usd_m: -150,
        off_balance_sheet_exposure_usd_m: 7000,
        analyst_confidence_index: 85,
        whistleblower_silenced_count: 0,
        board_oversight_strength: 60,
        media_skepticism_index: 20,
        turn: 1,
      },
      stateFields: [
        { id: 'state-share-price', key: 'share_price_usd', label: '💵 股价 ($)' },
        { id: 'state-credit', key: 'credit_rating', label: '🏦 信用评级' },
        { id: 'state-earnings', key: 'reported_earnings_usd_m', label: '📊 报告利润 ($M)' },
        { id: 'state-cashflow', key: 'actual_cashflow_usd_m', label: '💰 实际现金流 ($M)' },
        { id: 'state-offbalance', key: 'off_balance_sheet_exposure_usd_m', label: '⚠️ 隐性负债 ($M)' },
        { id: 'state-analyst', key: 'analyst_confidence_index', label: '📈 分析师信心' },
        { id: 'state-silenced', key: 'whistleblower_silenced_count', label: '🔇 被压制举报人' },
        { id: 'state-board', key: 'board_oversight_strength', label: '👁️ 董事会监督' },
        { id: 'state-media', key: 'media_skepticism_index', label: '📺 媒体怀疑度' },
      ],
    },
    'noodle-shop-community': {
      id: 'noodle-shop-community',
      label: '老周家牛肉面馆',
      totalTurns: 10,
      defaultState: {
        cash_flow: 12000,
        monthly_revenue: 68000,
        reputation: 70,
        platform_score: 4.6,
        waste_rate: 8,
        inventory_turnover: 7,
        staff_fatigue: 30,
        service_speed: 12,
        menu_scope: 8,
        family_trust: 80,
        expansion_pressure: 50,
        debt: 0,
        net_equity: 150000,
        turn: 1,
      },
      stateFields: [
        { id: 'state-cash-flow', key: 'cash_flow', label: '💰 现金流 (元/月)' },
        { id: 'state-revenue', key: 'monthly_revenue', label: '📈 月流水 (元)' },
        { id: 'state-reputation', key: 'reputation', label: '⭐ 口碑' },
        { id: 'state-platform', key: 'platform_score', label: '🛵 平台评分' },
        { id: 'state-waste', key: 'waste_rate', label: '🗑️ 损耗率 (%)' },
        { id: 'state-inventory', key: 'inventory_turnover', label: '📦 存货周转 (天)' },
        { id: 'state-fatigue', key: 'staff_fatigue', label: '😮‍💨 人力疲劳' },
        { id: 'state-speed', key: 'service_speed', label: '⏱️ 出餐效率 (min)' },
        { id: 'state-menu', key: 'menu_scope', label: '📋 品类数' },
        { id: 'state-trust', key: 'family_trust', label: '🏡 家庭信任' },
        { id: 'state-expansion', key: 'expansion_pressure', label: '🚀 扩张压力' },
        { id: 'state-debt', key: 'debt', label: '🏦 负债 (元)' },
      ],
    },
    'chip-ai-supplychain': {
      id: 'chip-ai-supplychain',
      label: '华芯突围：AI芯片供应链',
      totalTurns: 10,
      defaultState: {
        cash_flow: 8,
        capacity_utilization: 72,
        yield_rate: 78,
        inventory_buffer: 30,
        self_reliance: 35,
        supply_chain_risk: 60,
        order_backlog: 5,
        debt_ratio: 40,
        rnd_budget: 15,
        engineer_morale: 70,
        market_share: 12,
        policy_standing: 55,
        perception_bias: 0,
        turn: 1,
      },
      stateFields: [
        { id: 'state-cash', key: 'cash_flow', label: '💰 现金流 (亿元)' },
        { id: 'state-capacity', key: 'capacity_utilization', label: '🏭 产能利用率 (%)' },
        { id: 'state-yield', key: 'yield_rate', label: '🔬 良率 (%)' },
        { id: 'state-inventory', key: 'inventory_buffer', label: '📦 存货缓冲 (月)' },
        { id: 'state-reliance', key: 'self_reliance', label: '🛡️ 自主化程度' },
        { id: 'state-risk', key: 'supply_chain_risk', label: '⚠️ 供应链风险' },
        { id: 'state-backlog', key: 'order_backlog', label: '📋 订单积压 (月)' },
        { id: 'state-debt', key: 'debt_ratio', label: '🏦 负债率 (%)' },
        { id: 'state-rnd', key: 'rnd_budget', label: '🧪 研发投入 (亿)' },
        { id: 'state-morale', key: 'engineer_morale', label: '👷 工程师士气' },
        { id: 'state-share', key: 'market_share', label: '📈 市占率 (%)' },
        { id: 'state-policy', key: 'policy_standing', label: '🏛️ 政策支持度' },
      ],
    },
  };

  const DEFAULT_SCENARIO_ID = 'challenger-launch';
  const SNAPSHOT_PREFIX = 'challenge-snapshot-';
  const JUSTIFICATION_MAX = 200;

  class ChallengerRouter {
    constructor(gameState, options) {
      // Allow override via options.scenarioId; default to challenger.
      this.scenarioId = (options && options.scenarioId) || DEFAULT_SCENARIO_ID;
      if (!SCENARIOS[this.scenarioId]) {
        console.warn(`Unknown scenario "${this.scenarioId}", falling back to default`);
        this.scenarioId = DEFAULT_SCENARIO_ID;
      }
      this.scenarioConfig = SCENARIOS[this.scenarioId];
      this.totalTurns = this.scenarioConfig.totalTurns;
      // Seed gameState from defaultState so the grid never shows "—" for a
      // fresh offline session; API response (if any) overrides defaults.
      const defaults = this.scenarioConfig.defaultState || {};
      this.gameState = Object.assign({}, defaults, gameState || {});
      this.gameId = (options && options.gameId) || null;
      this.currentStep = null;          // latest fetched step (next turn to play)
      this.previousState = null;        // for change-detection flash
      this.selectedOption = null;       // 'A'|'B'|'C'|'D'
      this.submitting = false;          // debounce double-submit
      // Loop 5 · P0-1: `submitting` only covers the window of one request. Once
      // it returned, the previous turn's buttons were live again, so a stray
      // second click answered the *next* turn with the last turn's option and
      // the engine settled it without the player noticing. This is a turn-level
      // lock: set on submit, cleared only when a new step renders.
      this.locked = false;
      this.lastFeedback = null;         // last turn's feedback text
      this.lastTurnNumber = 0;          // monotonically increasing
      this._completionRecorded = false; // P0 #10: 每局只记一次完成
      // V1 · 看得见变化：每回合一份数值快照，delta 徽标 / 迷你走势 / 阈值条
      // 全部只读这份序列。第 0 点是开局，所以第 1 回合就已经有一条能看的线。
      this.stateSeries = [];
      this._pushSeries(0);
      this._bindKeyboardOnce();
    }

    // ===== Page entry points =====
    async renderStartPage() {
      this._completionRecorded = false;  // 新的一局，允许再次计数
      await this._loadStep(1);
      return this._renderDecisionView(1);
    }

    async renderAfterTurn() {
      // After a turn submission, load the next step and render decision view.
      const nextTurn = Math.min(this.lastTurnNumber + 1, this.totalTurns);
      if (nextTurn > this.totalTurns) {
        return this._renderFinalPage();
      }
      await this._loadStep(nextTurn);
      return this._renderDecisionView(nextTurn);
    }

    renderFeedbackPage() {
      return this._renderFeedbackView();
    }

    renderFinalPage() {
      return this._renderFinalPage();
    }

    // ===== Step / turn I/O =====
    async _loadStep(turnNumber) {
      const url = `/scenarios/${this.scenarioId}/step/${turnNumber}`;
      try {
        const step = await ApiService._withOfflineFallback(
          url,
          {},
          () => OfflineEngine.getScenarioStep(this.scenarioId, turnNumber)
        );
        if (step && !step.error) {
          this.currentStep = step;
          this._lastLoadError = null;
          console.log('[challenger] loaded step', turnNumber, 'from', ApiService.offline ? 'offline' : 'api');
        } else {
          this.currentStep = null;
          this._lastLoadError = (step && step.error) ? step.error : 'Failed to load step';
        }
      } catch (err) {
        console.error('[challenger] failed to load step', turnNumber, err);
        this.currentStep = null;
        this._lastLoadError = err && err.message ? err.message : String(err);
      }
    }

    async _submitTurn(optionId, justification) {
      if (this.submitting) {
        return null;
      }
      this.submitting = true;
      try {
        const resp = await ApiService.games.executeTurn(this.gameId, {
          option: optionId,
          justification: justification || ''
        });
        this.previousState = this.gameState ? Object.assign({}, this.gameState) : null;
        this.gameState = resp.game_state || resp.gameState || this.gameState;
        this.lastFeedback = resp.feedback || '';
        this.lastTurnNumber = (resp.turnNumber || resp.turn_number || (this.lastTurnNumber + 1)) - 1;
        this._pushSeries(this.lastTurnNumber);
        this._saveSnapshot();
        return resp;
      } catch (err) {
        console.error('[challenger] submit failed', err);
        const btn = document.getElementById('challenger-submit');
        if (btn) {
          btn.disabled = false;
          btn.textContent = '提交决定';
        }
      } finally {
        this.submitting = false;
      }
    }

    // ===== localStorage snapshot =====
    _saveSnapshot() {
      if (!this.gameId) return;
      try {
        const snap = {
          gameId: this.gameId,
          scenarioId: this.scenarioId,
          turn: this.lastTurnNumber,
          gameState: this.gameState,
          selectedOption: this.selectedOption,
          lastFeedback: this.lastFeedback,
          ts: Date.now()
        };
        const key = SNAPSHOT_PREFIX + this.gameId;
        localStorage.setItem(key, JSON.stringify(snap));
      } catch (e) {
        console.warn('[challenger] snapshot save failed', e);
      }
    }

    static loadSnapshot(gameId) {
      try {
        const raw = localStorage.getItem(SNAPSHOT_PREFIX + gameId);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }

    static clearSnapshot(gameId) {
      try { localStorage.removeItem(SNAPSHOT_PREFIX + gameId); } catch (e) {}
    }

    static findResumableSnapshots(scenarioId) {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SNAPSHOT_PREFIX)) {
          try {
            const snap = JSON.parse(localStorage.getItem(key));
            if (snap && snap.scenarioId === scenarioId && snap.turn > 0) {
              out.push(snap);
            }
          } catch (e) {}
        }
      }
      return out;
    }

    // ===== Rendering =====
    _stateKeyMap() {
      // Built from this.scenarioConfig.stateFields (parameterized per scenario).
      const map = {};
      this.scenarioConfig.stateFields.forEach((f) => { map[f.id] = f.key; });
      return map;
    }

    _applyStateChangeFlash(prev, next) {
      if (!prev || !next) return;
      const map = this._stateKeyMap();
      Object.keys(map).forEach((id) => {
        const key = map[id];
        if (prev[key] === undefined || next[key] === undefined) return;
        if (prev[key] === next[key]) return;
        const el = document.getElementById(id);
        if (!el) return;
        const cls = next[key] > prev[key] ? 'state-increased' : 'state-decreased';
        el.classList.remove('state-increased', 'state-decreased');
        // force reflow so animation re-triggers
        void el.offsetWidth;
        el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), 700);
      });
    }

    _renderDecisionView(turnNumber) {
      const step = this.currentStep || {};
      const options = step.options || [];
      const situation = step.situation || '正在加载情境...';
      const phase = step.phase || '';
      const isReveal = !!step.is_pattern_reveal;
      const isFinal = !!step.is_final_outcome;

      const optionHtml = options.map((o) => {
        // Loop11 候选②：姿态标签走 data-* + CSS ::after，不写进 innerText，
        // 免得搅乱"连续相同首选项"的文本指纹（那条断言读按钮文本）。
        const stanceAttrs = o && o.stance_label
          ? ` data-stance="${o.stance}" data-stance-label="${this._escape(o.stance_label)}"`
          : '';
        // V1: 倾向徽标（保守/中性/激进）直显在按钮上，不必读完四项才能判断
        const weightAttrs = o && o.weight
          ? ` data-weight="${this._escape(this._weightClass(o.weight))}" data-weight-label="${this._escape(this._weightLabel(o.weight))}"`
          : '';
        return `
        <button class="challenger-option"${stanceAttrs}${weightAttrs}
                data-option="${o.id}"
                onclick="window.challengerRouter.selectOption('${o.id}')">
          <span class="option-letter">${o.id}</span>
          <span class="option-text">${this._escape(o.text)}</span>
        </button>
      `;
      }).join('');

      const offlineBanner = this._lastLoadError
        ? `<div class="offline-banner">离线模式：${this._escape(this._lastLoadError)}</div>`
        : '';

      return `
        <div class="game-page challenger-decision-page">
          <div class="page-header">
            <h2>${this._escape(this.scenarioConfig.label)} · 第 ${turnNumber} 回合</h2>
            <div class="progress">回合 ${turnNumber} / ${this.totalTurns} · ${this._escape(phase)}</div>
          </div>

          ${this._renderGoalTension()}

          <div class="challenger-state-grid" id="challenger-state-grid">
            ${this._renderStateChips()}
          </div>

          ${this._renderDeferredLedger()}

          ${this._renderClimateGauges()}

          ${offlineBanner}

          <div class="situation-card">
            <div class="situation-text">${this._formatSituation(situation)}</div>
          </div>

          <!-- Loop 5 · P0-2: feedback sits ABOVE the options. It used to render
               671px below the last button, outside the viewport on mobile, so
               the player clicked and saw "nothing happened". -->
          <div id="challenger-feedback-display" class="feedback-section" style="display:none;"></div>

          <div class="decision-card">
            <details class="justification-box" id="challenger-justification-box">
              <summary>先在这里写一句理由，再点下面的选项（可选 · 约 20 秒）</summary>
              <textarea id="challenger-justification" class="justification-input"
                        maxlength="${JUSTIFICATION_MAX}" rows="2"
                        placeholder="一句话：你为什么选它？"
                        oninput="window.challengerRouter.updateCharCount()"></textarea>
              <div class="justification-meta">
                <span id="challenger-char-count">0</span>/${JUSTIFICATION_MAX}
                · 下一回合反馈会把你写的和实际发生的对照给你看
              </div>
            </details>
            <div class="challenger-options" id="challenger-options" data-turn="${turnNumber}">
              ${optionHtml}
            </div>
            <div id="challenger-confirm-bar" class="challenger-confirm-bar" hidden></div>
            <div class="challenger-keyhint">按 A–D 选中 · Enter 确认 · ← / → 回看本局已走过的回合 · Esc 收起</div>
          </div>
        </div>
      `;
    }

    // Loop 5 · B2: two rulers instead of nine chips. Nobody can read "距 1.5°C
    // 还有 0.22°C" out of a number grid, but everyone can read a tick mark.
    // Climate only: the other scenarios have no single axis worth drawing.
    _renderClimateGauges() {
      if (this.scenarioId !== 'climate-change-policy') return '';
      const st = this.gameState || {};
      const temp = typeof st.global_avg_temp_c === 'number' ? st.global_avg_temp_c : null;
      const renew = typeof st.renewable_share_pct === 'number' ? st.renewable_share_pct : null;
      if (temp == null && renew == null) return '';
      const clamp = (v) => Math.max(0, Math.min(100, v));
      const tempPct = temp == null ? null : clamp((temp - 1.0) / 2.0 * 100);
      const tempTone = temp == null ? 'muted'
        : (temp > 2.30 ? 'bad' : (temp >= 1.85 ? 'warn' : 'good'));
      const renewPct = renew == null ? null : clamp(renew);
      const renewTone = renew == null ? 'muted'
        : (renew < 47 ? 'bad' : (renew < 54 ? 'warn' : 'good'));
      const tick = (pctLeft, label) =>
        `<i class="gauge-tick" data-value="${label}" style="left:${clamp(pctLeft).toFixed(1)}%"><span>${label}</span></i>`;
      return `
        <div class="climate-gauges" id="climate-gauges">
          <div class="gauge" data-gauge="temp" data-fill="${tempPct == null ? '' : tempPct.toFixed(1)}">
            <div class="gauge-head">
              <span class="gauge-name">全球升温</span>
              <b class="gauge-value">${temp == null ? '—' : temp.toFixed(2) + '°C'}</b>
              <span class="gauge-hint">1.5 达标 · 1.85 超调上限 · 2.30 失控</span>
            </div>
            <div class="gauge-track ${tempTone}">
              <div class="gauge-fill" style="width:${tempPct == null ? 0 : tempPct.toFixed(1)}%"></div>
              ${tick(25, '1.5')}${tick(42.5, '1.85')}${tick(65, '2.30')}
            </div>
          </div>
          <div class="gauge" data-gauge="renew" data-fill="${renewPct == null ? '' : renewPct.toFixed(1)}">
            <div class="gauge-head">
              <span class="gauge-name">可再生占比</span>
              <b class="gauge-value">${renew == null ? '—' : renew.toFixed(0) + '%'}</b>
              <span class="gauge-hint">47 只够 2°C · 54 才算做完转型</span>
            </div>
            <div class="gauge-track ${renewTone}">
              <div class="gauge-fill" style="width:${renewPct == null ? 0 : renewPct.toFixed(1)}%"></div>
              ${tick(47, '47')}${tick(54, '54')}
            </div>
          </div>
        </div>
      `;
    }

    // ===== Formatting helpers (P0 #2 / #3) =====
    // A chip that prints "50.099999999999994" tells the player the model is
    // noise, not a model. Round every metric to at most two decimals and group
    // the thousands so 150000 reads as 150,000.
    _formatMetricValue(key, raw) {
      if (raw === undefined || raw === null || raw === '') return '—';
      if (typeof raw !== 'number' || !isFinite(raw)) return String(raw);
      if (Math.abs(raw) >= 1000) return Math.round(raw).toLocaleString('en-US');
      return String(Math.round(raw * 100) / 100);
    }

    _fmtDelta(v, dec) {
      const n = Number(v);
      if (!isFinite(n)) return String(v);
      const d = (dec == null) ? 2 : dec;
      const s = n.toFixed(d).replace(/\.0+$/, '');
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // ===== V1 · 看得见变化 ===============================================
    // Everything below is presentation. No number is recomputed here: label,
    // unit, decimals, direction-of-good and every threshold come straight from
    // the engine tables exposed as OfflineEngine._flScenarioMetrics /
    // _flScenarioThresholds. A second copy of those tables in the UI would
    // start lying the first time a scenario is rebalanced.

    // One numeric snapshot per turn. Index 0 is the opening state, so turn 1
    // already has a line worth drawing instead of a single dot.
    _pushSeries(turn) {
      const state = this.gameState || {};
      const values = {};
      this.scenarioConfig.stateFields.forEach((f) => {
        const v = state[f.key];
        if (typeof v === 'number' && isFinite(v)) values[f.key] = v;
      });
      const t = (turn === undefined || turn === null) ? this.lastTurnNumber : turn;
      const last = this.stateSeries[this.stateSeries.length - 1];
      if (last && last.turn === t) { last.values = values; return; }
      this.stateSeries.push({ turn: t, values: values });
      // 11 points max (opening + 10 turns); a longer line inside 40px is noise
      if (this.stateSeries.length > 11) this.stateSeries.shift();
    }

    _metricMeta() {
      const eng = (typeof window !== 'undefined' && window.OfflineEngine) || null;
      const all = (eng && eng._flScenarioMetrics) || {};
      return all[this.scenarioId] || {};
    }

    _thresholdList() {
      const eng = (typeof window !== 'undefined' && window.OfflineEngine) || null;
      const all = (eng && eng._flScenarioThresholds) || {};
      return all[this.scenarioId] || [];
    }

    _thresholdFor(key) {
      const hits = this._thresholdList().filter((t) => t && t.key === key);
      return hits.length ? hits[0] : null;
    }

    // A metric may own several thresholds — 1.5°C and 2.0°C are the same key.
    // Reading only the first one made a chip look "safe" the moment it crossed
    // the first line, so every check below walks the whole ladder.
    _thresholdHits(key) {
      return this._thresholdList().filter((t) => t && t.key === key);
    }

    _valueSeries(key) {
      const out = [];
      (this.stateSeries || []).forEach((s) => {
        const v = s.values ? s.values[key] : undefined;
        if (typeof v === 'number' && isFinite(v)) out.push(v);
      });
      return out;
    }

    // Last step of the series, expressed the way the chip prints it: direction,
    // size, and whether that direction is good news for this metric.
    _deltaFor(key) {
      const series = this._valueSeries(key);
      if (series.length < 2) return null;
      const cur = series[series.length - 1];
      const prev = series[series.length - 2];
      const d = cur - prev;
      if (!isFinite(d) || Math.abs(d) < 1e-9) return null;
      const meta = this._metricMeta()[key] || {};
      const good = (typeof meta.good === 'number') ? meta.good : 1;
      const dec = (typeof meta.dec === 'number') ? meta.dec : 2;
      return {
        raw: d,
        text: (d > 0 ? '+' : '') + this._fmtDelta(d, dec),
        unit: meta.unit || '',
        better: (d > 0) === (good > 0)
      };
    }

    _sparklineSvg(key) {
      const vals = this._valueSeries(key);
      if (vals.length < 2) return '';
      const w = 40, h = 12;
      const min = Math.min.apply(null, vals);
      const max = Math.max.apply(null, vals);
      const span = (max - min) || 1;
      const pts = vals.map((v, i) => {
        const x = vals.length === 1 ? 0 : (i / (vals.length - 1)) * (w - 1.5) + 0.75;
        const y = h - 1.5 - ((v - min) / span) * (h - 3);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      // No text nodes inside the svg: .state-chip innerText must not change.
      return '<svg class="chip-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h +
        '" aria-hidden="true" focusable="false"><polyline points="' + pts + '"></polyline></svg>';
    }

    // The bar's range covers the metric's own history plus its threshold, so the
    // red zone is always visible instead of living off the right edge.
    _chipScale(key, val) {
      const series = this._valueSeries(key);
      const hits = this._thresholdHits(key);
      let lo = Math.min.apply(null, series.concat([val]));
      let hi = Math.max.apply(null, series.concat([val]));
      hits.forEach((t) => { lo = Math.min(lo, t.at); hi = Math.max(hi, t.at); });
      if (!isFinite(lo) || !isFinite(hi)) return null;
      if (hi - lo < 1e-9) {
        const pad = Math.abs(hi) > 1 ? Math.abs(hi) * 0.1 : 1;
        lo -= pad; hi += pad;
      }
      return {
        lo: lo,
        hi: hi,
        pct: (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))
      };
    }

    // The red zone starts at the *next* threshold the player hasn't crossed yet
    // — that is the edge they are walking toward. Once the whole ladder is
    // behind them the bar reads solid red.
    _thresholdBar(key, val) {
      if (typeof val !== 'number' || !isFinite(val)) return '';
      const scale = this._chipScale(key, val);
      if (!scale) return '';
      const pos = scale.pct(val);
      const fill = '<b style="width:' + pos.toFixed(1) + '%"></b>';
      const hits = this._thresholdHits(key);
      if (!hits.length) return '<i class="chip-bar" aria-hidden="true">' + fill + '</i>';
      const dir = hits[0].dir;
      // Once a line is behind the player, the red zone has to *start where they
      // stand* — otherwise a breached chip shows a bar that looks perfectly safe,
      // with the only red sliver parked off the right edge.
      const crossed = hits.some((t) => (t.dir === 'above' ? val > t.at : val < t.at));
      let zStart;
      let zEnd;
      if (dir === 'above') {
        const ups = hits.map((t) => t.at).filter((a) => a >= val).sort((a, b) => a - b);
        zStart = crossed ? scale.pct(val) : (ups.length ? scale.pct(ups[0]) : 0);
        zEnd = 100;
      } else {
        const downs = hits.map((t) => t.at).filter((a) => a <= val).sort((a, b) => b - a);
        zStart = 0;
        zEnd = crossed ? scale.pct(val) : (downs.length ? scale.pct(downs[0]) : 100);
      }
      const zone = ' style="--zone-start:' + zStart.toFixed(1) + '%;--zone-end:' + zEnd.toFixed(1) + '%"';
      return '<i class="chip-bar" aria-hidden="true"' + zone + '>' + fill + '</i>';
    }

    _isBreaching(key, val) {
      if (typeof val !== 'number' || !isFinite(val)) return false;
      return this._thresholdHits(key).some((t) => (t.dir === 'above' ? val > t.at : val < t.at));
    }

    // After a turn the chips used to keep showing yesterday's numbers until the
    // next turn was fetched — the player answered, got feedback, and the grid
    // above still described the world before their decision.
    _refreshStateChips() {
      const grid = document.getElementById('challenger-state-grid');
      if (!grid) return;
      const html = this._renderStateChips();
      const holder = grid.querySelector('.state-chips');
      if (holder) holder.outerHTML = html; else grid.innerHTML = html;
      // 仪表读的是刚写进去的 history —— 不跟着这一拍重画，玩家会看到
      // 上一回合的"牺牲项"挂在新数字上面。
      const gt = document.getElementById('challenger-goal-tension');
      const gtHtml = this._renderGoalTension();
      if (gt && gtHtml) gt.outerHTML = gtHtml;
      // The ledger lives right below the grid; it has to be redrawn in the same
      // beat or it would still claim "still pending" after a consequence fired.
      const led = document.getElementById('challenger-deferred-ledger');
      const ledHtml = this._renderDeferredLedger();
      if (led) {
        if (ledHtml) led.outerHTML = ledHtml;
        else led.parentNode.removeChild(led);
      } else if (ledHtml && grid.parentNode) {
        grid.insertAdjacentHTML('afterend', ledHtml);
      }
    }

    // ===== V1 · 键盘 =====================================================
    // A/B/C/D to answer, Enter to submit, ←/→ to walk the recap, Esc to close.
    // Bound once on document and scoped by the presence of the decision page,
    // because the page body is re-rendered wholesale on every turn.
    _bindKeyboardOnce() {
      if (this._kbBound) return;
      if (typeof document === 'undefined' || !document.addEventListener) return;
      this._kbBound = true;
      this._onKeyDown = (e) => this._handleKeyDown(e);
      document.addEventListener('keydown', this._onKeyDown);
    }

    _handleKeyDown(e) {
      if (!e || e.defaultPrevented) return;
      const tag = ((e.target && e.target.tagName) || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable);
      if (typing) {
        // Ctrl/Cmd+Enter submits while the caret is still in the reason box
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !this.locked && !this.submitting) {
          e.preventDefault();
          if (this.selectedOption) this.submit();
        }
        return;
      }
      if (!document.querySelector('.challenger-decision-page')) return;
      if (e.key === 'Escape') { this.closeHistory(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') {
        if (this.selectedOption && !this.locked && !this.submitting) { e.preventDefault(); this.submit(); }
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.stepHistory(e.key === 'ArrowLeft' ? -1 : 1);
        return;
      }
      const k = String(e.key || '').toUpperCase();
      if (k.length === 1 && k >= 'A' && k <= 'D' && !this.locked && !this.submitting) {
        const btn = document.querySelector('.challenger-option[data-option="' + k + '"]');
        if (btn && !btn.disabled) { e.preventDefault(); this.selectOption(k); }
      }
    }

    // ===== V1 · 历史回合回看 =============================================
    _historyRows() {
      const st = this.gameState || {};
      const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
      return hist.map((d, i) => {
        const eff = d.applied_effects || {};
        const keys = Object.keys(eff).filter((k) => typeof eff[k] === 'number' && Math.abs(eff[k]) > 1e-9);
        const meta = this._metricMeta();
        keys.sort((a, b) => Math.abs(eff[b]) - Math.abs(eff[a]));
        const top = keys.slice(0, 2).map((k) => {
          const m = meta[k] || {};
          const v = eff[k];
          return (m.label || k) + ' ' + (v > 0 ? '+' : '') + this._fmtDelta(v, m.dec == null ? 0 : m.dec) + (m.unit || '');
        }).join(' · ');
        return {
          turn: d.turn_number || d.turn || (i + 1),
          option: d.option_id || '',
          text: this._escape(d.option_text || ''),
          effect: top || '—',
          reason: d.justification ? this._escape(d.justification) : ''
        };
      });
    }

    _renderHistoryPanel() {
      const rows = this._historyRows();
      if (!rows.length) return '';
      const idx = (this._historyIndex == null) ? rows.length - 1
        : Math.max(0, Math.min(rows.length - 1, this._historyIndex));
      this._historyIndex = idx;
      const list = rows.map((r, i) => `
          <li class="turn-history-item${i === idx ? ' is-active' : ''}" data-index="${i}">
            <span class="th-turn">T${this._escape(r.turn)}</span>
            <span class="th-opt">${this._escape(r.option)}</span>
            <span class="th-text">${r.text}</span>
            <span class="th-effect">${this._escape(r.effect)}</span>
            ${r.reason ? '<span class="th-reason">理由：' + r.reason + '</span>' : ''}
          </li>`).join('');
      return `
        <aside class="turn-history" id="challenger-history" aria-label="历史回合">
          <div class="turn-history-head">
            <b>历史回合</b>
            <span class="th-count">${idx + 1} / ${rows.length}</span>
            <button type="button" class="th-close" onclick="window.challengerRouter.closeHistory()" aria-label="关闭">×</button>
          </div>
          <ol class="turn-history-list">${list}</ol>
          <div class="turn-history-hint">← / → 切换回合 · Esc 关闭</div>
        </aside>`;
    }

    stepHistory(dir) {
      const rows = this._historyRows();
      if (!rows.length) return;
      if (!document.getElementById('challenger-history')) {
        this._historyIndex = rows.length - 1;
        const page = document.querySelector('.challenger-decision-page');
        if (!page) return;
        page.insertAdjacentHTML('beforeend', this._renderHistoryPanel());
      } else {
        const base = (this._historyIndex == null) ? rows.length - 1 : this._historyIndex;
        const next = Math.max(0, Math.min(rows.length - 1, base + dir));
        this._historyIndex = next;
        const panel = document.getElementById('challenger-history');
        if (panel) panel.outerHTML = this._renderHistoryPanel();
      }
      const active = document.querySelector('.turn-history-item.is-active');
      if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest' });
    }

    closeHistory() {
      const panel = document.getElementById('challenger-history');
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    }

    // ===== V1 · 变化归因卡 ===============================================
    // The engine prints 【数字上的变化】 as indented lines. They answer "what
    // moved" but not "which number is bad news" — reading them costs a mental
    // subtraction per line. Same data, three-column cards, raw text kept below
    // so the copy-paste habit still works.
    _extractDeltaSection(fb) {
      const lines = String(fb || '').split(/\r?\n/);
      const deltas = [];
      const kept = [];
      let inSection = false;
      lines.forEach((line) => {
        const t = line.trim();
        if (t === '【数字上的变化】') { inSection = true; return; }
        if (inSection) {
          if (!t) { inSection = false; kept.push(line); return; }
          if (line !== t) { deltas.push(t); return; }
          inSection = false;
          kept.push(line);
          return;
        }
        kept.push(line);
      });
      return { deltas: deltas, cleaned: kept.join('\n') };
    }

    _parseDeltaLine(line) {
      const m = String(line || '').match(
        /^(↑|↓)\s*(.+?)\s+(-?[\d,.]+)([^\s\d]*)\s*→\s*(-?[\d,.]+)([^\s（(]*)\s*[（(]([+-]?[\d,.]+)[，,]\s*(改善|恶化)[）)]/
      );
      if (!m) return null;
      return {
        dir: m[1],
        name: m[2].trim(),
        from: m[3] + (m[4] || ''),
        to: m[5] + (m[6] || ''),
        delta: m[7],
        verdict: m[8],
        unit: m[6] || m[4] || ''
      };
    }

    _renderDeltaCards(fb) {
      const section = this._extractDeltaSection(fb);
      const cards = [];
      const notes = [];
      section.deltas.forEach((l) => {
        const d = this._parseDeltaLine(l);
        if (d) cards.push(d); else notes.push(l);
      });
      if (!cards.length) return { html: '', cleaned: fb };
      const st = this.gameState || {};
      const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
      const last = hist.length ? hist[hist.length - 1] : null;
      const cause = (last && last.option_text)
        ? '来自你的选择「' + this._escape(String(last.option_text).slice(0, 28)) +
          (String(last.option_text).length > 28 ? '…' : '') + '」'
        : '';
      const items = cards.map((c) => {
        const good = c.verdict === '改善';
        return `
            <li class="delta-card" data-tone="${good ? 'good' : 'bad'}">
              <span class="delta-name">${this._escape(c.name)}</span>
              <span class="delta-arrow" aria-hidden="true">${c.dir}</span>
              <span class="delta-num">${this._escape(c.delta)}${this._escape(c.unit)}</span>
              <span class="delta-range">${this._escape(c.from)} → ${this._escape(c.to)}</span>
              <span class="delta-verdict">${this._escape(c.verdict)}</span>
            </li>`;
      }).join('');
      const html = `
        <div class="delta-cards-wrap">
          <div class="delta-cards-head">这一回合，哪些数字动了${cause ? '<span class="delta-cause">' + cause + '</span>' : ''}</div>
          <ul class="delta-cards">${items}</ul>
        </div>`;
      return { html: html, cleaned: section.cleaned };
    }

    // Anything the engine interpolates into prose goes through here: 1.8499999
    // becomes 1.85, while 1.85 / 429 / 1.5 are left untouched.
    _normalizeNumbers(text) {
      if (text === undefined || text === null) return '';
      return String(text).replace(/(\d+\.\d{3,})/g, (m) => String(Math.round(parseFloat(m) * 100) / 100));
    }

    // Lightweight Markdown: "### x" -> h4, "**x**" -> strong, "- x" -> li,
    // "=====" -> hr. The engine's templates are written with these markers, so
    // printing them raw inside <pre> made the feedback look like source code.
    _renderRichText(text) {
      const raw = this._normalizeNumbers(text);
      if (!raw.trim()) return '';
      const inline = (s) => s
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      const out = [];
      let list = [];
      const flush = () => {
        if (!list.length) return;
        out.push('<ul>' + list.map((li) => '<li>' + inline(li) + '</li>').join('') + '</ul>');
        list = [];
      };
      this._escape(raw).split(/\r?\n/).forEach((line) => {
        const l = line.trim();
        if (!l) { flush(); return; }
        if (/^[=\-]{5,}$/.test(l)) { flush(); out.push('<hr>'); return; }
        if (/^(?:[-*]|[•·])\s+/.test(l)) { list.push(l.replace(/^(?:[-*]|[•·])\s+/, '')); return; }
        flush();
        if (/^#{1,4}\s+/.test(l)) { out.push('<h4>' + inline(l.replace(/^#{1,4}\s+/, '')) + '</h4>'); return; }
        if (/^【[^】]+】/.test(l)) { out.push('<p class="fb-head">' + inline(l) + '</p>'); return; }
        out.push('<p>' + inline(l) + '</p>');
      });
      flush();
      return out.join('');
    }

    // P0 #1: the reason only teaches something if the next turn hands it back
    // next to what actually happened.
    _renderLastTurnEcho() {
      const st = this.gameState || {};
      const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
      if (!hist.length) return '';
      const last = hist[hist.length - 1] || {};
      const just = last.justification ? String(last.justification).trim() : '';
      // Loop 6: 「你的选择」and「实际发生」used to be echoed here *and* printed in
      // the body (【你的选择】/【数字上的变化】). Same 50-78 characters twice per
      // turn. Only the justification exists nowhere else, so only it survives.
      if (!just) return '';
      return '<div class="feedback-echo"><p class="echo-line"><strong>你上回合写的是</strong>：「'
        + this._escape(just) + '」</p></div>';
    }

    // Loop 6 · 反馈分层
    // The body is split into "read now" and "read only if you want the
    // mechanism". Splitting happens at line level on 【heading】/📌, and the
    // collapsed lines go through the *same* renderer: nothing is rewritten,
    // only hidden. V17 asserts the expanded text is identical to the engine's
    // feedback, which is what makes that claim testable instead of polite.
    _flFbCollapsedHead(line) {
      return /^【(?:执行力折价|实施能力|档位判定|附加|行为诊断)/.test(String(line).trim());
    }

    _flFbDetailsOpen() {
      try { return localStorage.getItem('fl_fb_details_open') === '1'; } catch (e) { return false; }
    }

    _rememberFbOpen(el) {
      try {
        localStorage.setItem('fl_fb_details_open', el && el.open ? '1' : '0');
      } catch (e) { /* private mode: remembering preference is optional */ }
    }

    _feedbackBodyHtml(fb) {
      const raw = this._normalizeNumbers(String(fb || ''));
      if (!raw.trim()) return '';
      const blocks = [];
      let cur = null;
      raw.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        const isHead = /^(【|📌)/.test(trimmed);
        const coll = isHead ? this._flFbCollapsedHead(trimmed) : (cur ? cur.collapsed : false);
        // a run of collapsed paragraphs merges into one <details>, in place
        if (!cur || (isHead && cur.collapsed !== coll)) {
          cur = { collapsed: coll, titles: [], lines: [] };
          blocks.push(cur);
        }
        if (isHead && coll) {
          const label = (trimmed.match(/^【([^】]+)】/) || [])[1];
          if (label && cur.titles.indexOf(label) === -1) cur.titles.push(label);
        }
        cur.lines.push(line);
      });

      const open = this._flFbDetailsOpen();
      return blocks.map((b) => {
        const html = this._renderRichText(b.lines.join('\n'));
        if (!b.collapsed) return html;
        const chars = b.lines.join('').replace(/\s+/g, '').length;
        const label = b.titles.length ? b.titles.join(' · ') : '机制细节';
        return '<details class="fb-more"' + (open ? ' open' : '')
          + ' ontoggle="window.challengerRouter && window.challengerRouter._rememberFbOpen(this)">'
          + '<summary><span class="fb-more-label">' + this._escape(label) + '</span>'
          + '<span class="fb-more-meta">约 ' + chars + ' 字</span></summary>'
          + '<div class="fb-more-body">' + html + '</div></details>';
      }).join('');
    }

    _feedbackHtml(fb) {
      // V1: 数字变化先换成三列卡（指标 / 箭头 / 变化量），醒目、不用心算正负。
      // 正文一个字不动地留在下面 —— V17 的折叠指纹要求 fb-body 展开后与引擎
      // 原文逐字相等，所以这里只能"加一层读法"，不能"替掉原文"。
      const delta = this._renderDeltaCards(fb || '');
      return this._renderLastTurnEcho()
        + delta.html
        + this._renderCausalChain()
        + '<div class="fb-body">' + this._feedbackBodyHtml(fb || '') + '</div>';
    }

    // ===== V2 · 单回合因果链 =============================================
    // 引擎把"这一回合发生了什么"写成三段互不相连的话：选了什么、数字怎么动、
    // 什么被推到了以后。玩家读到的是三个事实，不是一条因果。这里把它们接成
    // 一条链：决定 → 直接效应 → 被埋下的延迟后果（未显现的用虚线）。
    _renderCausalChain() {
      const st = this.gameState || {};
      const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
      if (!hist.length) return '';
      const d = hist[hist.length - 1];
      if (!d) return '';
      const turn = Number(d.turn) || hist.length;
      const meta = this._metricMeta();
      const eff = d.applied_effects || {};
      const keys = Object.keys(eff).filter((k) => typeof eff[k] === 'number' && Math.abs(eff[k]) > 1e-9);
      keys.sort((a, b) => Math.abs(eff[b]) - Math.abs(eff[a]));

      const effects = keys.slice(0, 3).map((k) => {
        const m = meta[k] || {};
        const v = eff[k];
        const dec = m.dec == null ? 0 : m.dec;
        return {
          name: m.label || k,
          num: (v > 0 ? '+' : '') + this._fmtDelta(v, dec) + (m.unit || '')
        };
      });

      const ledger = (st.deferred_ledger || []).filter((x) => x && Number(x.source_turn) === turn);
      const hint = String(d.option_consequences_for_player || '').trim();
      const hintShort = hint.length > 34 ? hint.slice(0, 34) + '…' : hint;

      const decisionText = String(d.option_text || '').trim();
      const decisionShort = decisionText.length > 30 ? decisionText.slice(0, 30) + '…' : decisionText;

      const node = (cls, tag, text, sub, title) =>
        '<div class="causal-node ' + cls + '">'
        + '<span class="cn-tag">' + this._escape(tag) + '</span>'
        + '<span class="cn-text"' + (title ? ' title="' + this._escape(title) + '"' : '') + '>'
        + this._escape(text) + '</span>'
        + (sub ? '<span class="cn-sub">' + this._escape(sub) + '</span>' : '')
        + '</div>';

      let html = '<div class="causal-chain" data-turn="' + turn + '">'
        + '<div class="causal-head">因果链<span class="causal-head-note">这一回合做的事，和它以后会收的账</span></div>'
        + '<div class="causal-row">';

      html += node('is-decision', 'T' + turn + ' 你决定', decisionShort || '（未记录）', '', decisionText);

      if (effects.length) {
        html += '<span class="causal-link" aria-hidden="true"></span>';
        html += '<div class="causal-node is-effect">'
          + '<span class="cn-tag">直接影响</span>'
          + '<span class="causal-effects">'
          + effects.map((e) => '<span class="causal-effect"><b>' + this._escape(e.name) + '</b>'
              + '<i>' + this._escape(e.num) + '</i></span>').join('')
          + '</span></div>';
      }

      if (ledger.length) {
        html += '<span class="causal-link' + (ledger.some((x) => x.resolved_turn == null) ? ' is-pending' : '')
          + '" aria-hidden="true"></span>';
        ledger.forEach((x) => {
          const pending = x.resolved_turn == null;
          html += '<div class="causal-node is-delay' + (pending ? ' is-pending' : ' is-resolved') + '"'
            + ' data-deferred="' + this._escape(x.key) + '">'
            + '<span class="cn-tag">埋下延迟</span>'
            + '<span class="cn-text">' + this._escape(hintShort || x.key) + '</span>'
            + '<span class="cn-sub">' + (pending
                ? '还没到，会在后面回合回来'
                : 'T' + this._escape(String(x.resolved_turn)) + ' 已显现') + '</span>'
            + '</div>';
        });
      } else if (keys.length === 0) {
        html += '<span class="causal-link is-pending" aria-hidden="true"></span>';
        html += node('is-null is-pending', '没有涟漪', '这一步既没动数字，也没留下账', '');
      }

      html += '</div></div>';
      return html;
    }

    // P0 #9: the SemIf scorer lives on a backend endpoint this offline build
    // does not ship. Calling it produced a 404 and a console warning on every
    // single turn for a probability the UI never displayed.
    _scoreCurrentDecision() {
      return null;
    }

    _buildStateSummary() {
      const state = this.gameState || {};
      const parts = [];
      for (const f of this.scenarioConfig.stateFields) {
        if (f.key in state) {
          parts.push(`${f.label}: ${state[f.key]}`);
        }
      }
      return parts.join('；') || this.scenarioConfig.label;
    }

    _renderStateChips() {
      const state = this.gameState || {};
      const chips = this.scenarioConfig.stateFields.map((f) => {
        const raw = state[f.key];
        const val = this._formatMetricValue(f.id, raw);
        const delta = (typeof raw === 'number') ? this._deltaFor(f.key) : null;
        const breach = this._isBreaching(f.key, raw);
        // Delta / trend / breach all ride on data-* so the chip's text stays
        // exactly "label + value" — the UI-render assertion reads that string.
        const attrs = [];
        if (delta) {
          attrs.push(' data-delta="' + this._escape(delta.text + (delta.unit || '')) + '"');
          attrs.push(' data-trend="' + (delta.raw > 0 ? 'up' : 'down') + '"');
          attrs.push(' data-tone="' + (delta.better ? 'good' : 'bad') + '"');
        }
        if (breach) attrs.push(' data-breach="1"');
        return `<span class="state-chip${breach ? ' is-breach' : ''}" id="${f.id}" data-metric="${f.key}"${attrs.join('')}>`
          + `<span class="state-chip-label">${f.label}</span>`
          + `<span class="state-chip-value">${val}</span>`
          + this._thresholdBar(f.key, raw)
          + this._sparklineSvg(f.key)
          + '</span>';
      }).join('');
      return `<div class="state-chips">${chips}</div>`;
    }

    // ===== L0-2 · 目标冲突仪表 ============================================
    // 十几个数字在动，玩家却不知道这些数字和"我到底要什么"是什么关系。
    // 所以指标芯片上方固定一行三格：每个目标本回合是被押注、被牺牲，还是没碰。
    //
    // 只读 decision_history，不读 L1-2 的挂起态。这不是实现偷懒：选择前预告
    // "你这一下会牺牲口碑"，等于替玩家把 F5（单目标优化）这道题做完了 ——
    // 他要在不知道代价的情况下选，才可能真的犯错，才有机会在复盘里认出
    // 自己犯的错（T3/T4）。代价必须事后可见，不能事前预警。
    _goalObjectives() {
      const table = (window.OfflineEngine && window.OfflineEngine._flScenarioData) || null;
      const data = table ? table[this.scenarioId] : null;
      const b = data && data.brief;
      if (!b || !Array.isArray(b.objectives)) return [];
      return b.objectives.filter((o) => o && o.id && o.text);
    }

    _renderGoalTension() {
      const objs = this._goalObjectives();
      // 没写 brief 的场景（S1 尚未铺开的 4 个）不出空壳 —— 一个全是
      // "未涉及" 的三格条只会让玩家以为这三个目标本局没人碰过。
      if (!objs.length) return '';
      const st = this.gameState || {};
      const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
      const last = hist.length ? hist[hist.length - 1] : null;
      const axis = (last && Array.isArray(last.goal_axis)) ? last.goal_axis : [];
      const sac = (last && Array.isArray(last.goal_sacrificed)) ? last.goal_sacrificed : [];
      const cells = objs.map((o) => {
        const isSac = sac.indexOf(o.id) >= 0;
        const isAxis = axis.indexOf(o.id) >= 0;
        // 一个目标可以既被押注又被牺牲（想做大 → 先烧口碑）。同格冲突时
        // 按"代价优先"显示：玩家最需要看见的是损失，不是意图。
        const st2 = isSac ? 'sacrificed' : (isAxis ? 'pushed' : 'untouched');
        const word = isSac ? '牺牲' : (isAxis ? '押注' : '未涉及');
        return '<li class="fgt-cell is-' + st2 + '" data-objective="' + this._escape(o.id) + '">'
          + '<span class="fgt-name">' + this._escape(o.text) + '</span>'
          + '<span class="fgt-state">' + word + '</span>'
          + '</li>';
      }).join('');
      // 措辞不判"刚提交 / 已翻页"：仪表永远描述最近一次已提交的决策，翻页
      // 也不清空 —— 代价要留在眼前，直到下一次决策把它覆盖。用"第 N 手"
      // 这种纯序号说法，就不必去猜 lastTurnNumber 的语义（它是 0-based 还是
      // 已提交计数，改一次就错一次），也不用为时态维护两套分支。
      const lturn = last ? (last.turn != null ? last.turn : hist.length) : null;
      const lead = !last
        ? '还没做选择 · 这三件事不可能同时做好'
        : '第 ' + this._escape(String(lturn)) + ' 手 · 代价';
      return '<div class="fl-goal-tension" id="challenger-goal-tension" data-fl-goal-tension="1">'
        + '<div class="fgt-lead">' + lead + '</div>'
        + '<ul class="fgt-cells">' + cells + '</ul>'
        + '</div>';
    }

    // ===== V2 · 未结清的账 =================================================
    // Hidden consequences used to be invisible until they fired, which taught
    // the wrong lesson ("bad luck") instead of the right one ("I already knew").
    // This ledger keeps every planted delay on screen with its birth turn.
    _renderDeferredLedger() {
      const st = this.gameState || {};
      const hist = Array.isArray(st.decision_history) ? st.decision_history : [];
      const ledger = Array.isArray(st.deferred_ledger) ? st.deferred_ledger.filter(Boolean) : [];
      if (!ledger.length) return '';

      const hintFor = (turn) => {
        const hit = hist.filter((h) => Number(h && h.turn) === Number(turn));
        if (!hit.length) return '';
        const t = String(hit[hit.length - 1].option_consequences_for_player || '').trim();
        return t.length > 40 ? t.slice(0, 40) + '…' : t;
      };

      const pending = ledger.filter((x) => x.resolved_turn == null);
      const rows = ledger.map((x) => {
        const isPending = x.resolved_turn == null;
        const hint = hintFor(x.source_turn);
        return '<li class="ledger-row' + (isPending ? ' is-pending' : ' is-resolved') + '"'
          + ' data-source-turn="' + this._escape(String(x.source_turn)) + '"'
          + ' data-resolved-turn="' + (isPending ? '' : this._escape(String(x.resolved_turn))) + '">'
          + '<span class="ledger-turn">T' + this._escape(String(x.source_turn)) + ' 埋下</span>'
          + '<span class="ledger-text">' + this._escape(hint || x.key) + '</span>'
          + '<span class="ledger-status">' + (isPending
              ? '未显现'
              : 'T' + this._escape(String(x.resolved_turn)) + ' 已显现') + '</span>'
          + '</li>';
      }).join('');

      return '<div class="deferred-ledger" id="challenger-deferred-ledger">'
        + '<div class="ledger-head">未结清的账'
        + '<span class="ledger-count">' + (pending.length
            ? pending.length + ' 笔还没回来'
            : '全部已显现') + '</span>'
        + '</div>'
        + '<ul class="ledger-list">' + rows + '</ul>'
        + '</div>';
    }

    _renderFeedbackView() {
      const fb = this.lastFeedback || '';
      const cls = this._feedbackClassForTurn(this.lastTurnNumber);
      return `
        <div class="game-page challenger-feedback-page">
          <div class="page-header">
            <h2>回合 ${this.lastTurnNumber} — 反馈</h2>
          </div>
          <div class="${cls}">
            ${this._feedbackHtml(fb)}
          </div>
          <div class="actions">
            <button class="btn btn-primary" id="challenger-next-turn"
                    data-next-turn="${Math.min(this.lastTurnNumber + 1, this.totalTurns)}"
                    onclick="window.challengerRouter.continueToNextTurn()">
              进入第 ${Math.min(this.lastTurnNumber + 1, this.totalTurns)} 回合 →
            </button>
          </div>
        </div>
      `;
    }

    // P0 #10: 首页那四个数字必须是本机真实数据。过去整条 challenger 路径
    // 从不写 trainingProgress，"本机完成局数"就永远是 0——比虚构的用户数
    // 更难堪（数据来源真、但永不增长）。终局是唯一可以加一的地方。
    _recordCompletion() {
      if (this._completionRecorded) return;
      this._completionRecorded = true;
      try {
        if (typeof TrainingStageTracker === 'undefined') return;
        if (typeof window.__trainingTracker === 'undefined') {
          window.__trainingTracker = new TrainingStageTracker();
        }
        const fb = String(this.lastFeedback || '');
        const biases = [];
        const seen = {};
        (fb.match(/F[1-8]\b/g) || []).forEach((tag) => {
          if (!seen[tag] && biases.length < 3) {
            seen[tag] = true;
            biases.push({ type: tag });
          }
        });
        window.__trainingTracker.recordGameOutcome({
          awakening_count: 0,
          gap_total: 0,
          biases_detected: biases
        });
      } catch (e) {
        if (window.console && console.warn) {
          console.warn('[challenger] completion record skipped:', e.message);
        }
      }
    }

    _renderFinalPage() {
      this._recordCompletion();
      // V3 · 看得见根因：终局页先出骨牌，再挂复盘。
      // 本函数只返回字符串，真正的 DOM 由调用方（3 个入口）插入，
      // 所以挂载推到下一个 tick；_mountDebrief 自带幂等判断。
      setTimeout(() => this._mountDebrief(), 0);
      return `
        <div class="game-page challenger-final-page">
          <div class="page-header">
            <h2>${this._escape(this.scenarioConfig.label)} · 终局</h2>
            <div class="progress">${this.totalTurns} / ${this.totalTurns} 回合完成</div>
          </div>
          <div class="outcome-card outcome-final">
            ${this._feedbackHtml(this.lastFeedback || '游戏结束 — 请查看上方完整反馈。')}
          </div>
          <div class="fl-debrief-host" data-fl-debrief-host></div>
          <div class="actions">
            <button class="btn btn-secondary" onclick="GameManager.hideGameModal(); NavigationManager.navigateTo('scenarios');">
              返回场景列表
            </button>
            <button class="btn btn-primary" onclick="window.challengerRouter.restart()">
              再来一次
            </button>
          </div>
        </div>
      `;
    }

    // ===== V3 · 看得见根因：终局复盘 =====================================
    // 复盘只读 gameState 与场景 JSON，不改任何数值。挂载幂等：重复调用安全。
    _mountDebrief(container) {
      const scope = container || document;
      const root = scope.querySelector('[data-fl-debrief-host]');
      if (!root || root.getAttribute('data-mounted') === '1') return;
      if (!window.FLDebrief) return;
      const data = (window.OfflineEngine && OfflineEngine._flScenarioData)
        ? (OfflineEngine._flScenarioData[this.scenarioId] || null)
        : null;
      if (!data) {
        // 场景 JSON 还没进内存（极端情况）：先空着，稍后再试一次，不猜数据。
        if (!root.getAttribute('data-retry')) {
          root.setAttribute('data-retry', '1');
          setTimeout(() => this._mountDebrief(container), 700);
        }
        return;
      }
      root.setAttribute('data-mounted', '1');
      const model = window.FLDebrief.build({
        state: this.gameState || {},
        scenarioConfig: this.scenarioConfig || {},
        scenarioData: data
      });
      window.FLDebrief.buildConcepts(model, data, this.gameState || {});
      window.FLDebrief.mount(root, model);
    }

    _feedbackClassForTurn(turn) {
      if (turn >= 10) return 'outcome-card outcome-final';
      if (turn >= 8) return 'outcome-card outcome-critical';
      if (turn >= 5) return 'pattern-reveal-card';
      return 'feedback-card';
    }

    // L1-1 · 徽标文案只有 FLDebrief.stanceLabel 一个出口。
    // 这里保留同名私有方法，是为了让旧调用点不改；但文案与色档一律外借，
    // 一旦页面自己写一份映射，就会出现"同一只手、两个叫法"。
    _weightClass(weight) {
      const d = typeof window !== 'undefined' ? window.FLDebrief : null;
      if (d && typeof d.stanceTone === 'function') return d.stanceTone(weight);
      switch (weight) {
        case 'extreme_safe': return 'safe';
        case 'safe': return 'safe';
        case 'neutral': return 'neutral';
        case 'risky': return 'risky';
        case 'extreme_risk': return 'risky';
        default: return 'neutral';
      }
    }

    _weightLabel(weight) {
      const d = typeof window !== 'undefined' ? window.FLDebrief : null;
      if (d && typeof d.stanceLabel === 'function') return d.stanceLabel(weight);
      return weight || '';
    }

    // ===== Situation sanitation =====================================
    // A scenario that shows "{turn4_option}" or "若你T3选了加盟" to a player
    // who never chose 加盟 is not teaching failure logic, it is lying.
    _flMetricWords() {
      return {
        global_avg_temp_c: '全球升温', co2_ppm: 'CO2 浓度', gdp_growth_pct: 'GDP 增长',
        renewable_share_pct: '可再生能源占比', climate_justice_index: '气候正义指数',
        public_support_pct: '公众支持率', whistleblower_silenced_count: '被压制的科学家数',
        international_trust: '国际信任度', tipping_point_proximity: '临界点逼近度',
        share_price_usd: '股价', reported_earnings_usd_m: '账面利润', actual_cashflow_usd_m: '真实现金流',
        off_balance_sheet_exposure_usd_m: '表外敞口', analyst_confidence_index: '分析师信心',
        board_oversight_strength: '董事会监督强度', media_skepticism_index: '媒体质疑指数',
        cash_flow: '现金流', monthly_revenue: '月营收', reputation: '口碑', platform_score: '平台评分',
        waste_rate: '损耗率', inventory_turnover: '库存周转', staff_fatigue: '员工疲劳度',
        service_speed: '出餐速度', menu_scope: '菜单宽度', family_trust: '家人信任',
        expansion_pressure: '扩张压力', debt: '负债', net_equity: '净资产',
        capacity_utilization: '产能利用率', yield_rate: '良率', inventory_buffer: '库存缓冲',
        self_reliance: '自主化程度', supply_chain_risk: '供应链风险', order_backlog: '订单积压',
        debt_ratio: '负债率', rnd_budget: '研发预算', engineer_morale: '工程师士气',
        market_share: '市场份额', policy_standing: '政策关系',
        perception_bias: '外界认知偏差', justification: '决策理由',
      };
    }

    _flHistory() {
      const st = this.gameState || {};
      return Array.isArray(st.decision_history) ? st.decision_history : [];
    }

    _flChoiceText(n) {
      const hit = this._flHistory().filter(function (d) { return d && Number(d.turn) === Number(n); })[0];
      return hit ? String(hit.option_text || '') : '';
    }

    // Loose match: does the player's turn-N choice plausibly correspond to the
    // branch the scenario text is describing? Loose is deliberate — showing an
    // extra branch is a minor flaw, hiding a real one is a broken lesson.
    _flBranchTaken(n, phrase) {
      const chosen = this._flChoiceText(n);
      if (!chosen) return false;
      const clean = String(phrase || '')
        .replace(/选择|选了|了|的/g, '')
        .replace(/[（(][^）)]*[）)]/g, '')
        .trim();
      if (!clean) return true;
      // The scenario wording and the option wording rarely match verbatim
      // ("拿了补贴+扩产" vs "拿地方政府补贴扩产"). Match per token, with a
      // small synonym set for the concepts these four cases actually use.
      const SYN = {
        '加盟': ['加盟', '连锁'],
        '冷冻肉': ['冷冻', '冻肉', '降本', '预制'],
        '过度扩张': ['扩张', '分店', '开店', '新店', '规模化'],
        '扩张': ['扩张', '分店', '开店', '新店'],
        '囤12个月': ['囤', '备件', '库存', '压货'],
        '囤了12个月': ['囤', '备件', '库存', '压货'],
        '全面押注': ['押注', '全面', '国产HBM', 'All'],
        '发乐观通稿': ['通稿', '宣传', '公关', '乐观'],
        '叙事': ['通稿', '宣传', '公关', '信心', '故事'],
        '拿了补贴': ['补贴', '政府', '政策'],
        '全线降价': ['降价', '价格', '低价', '让利'],
      };
      const tokens = clean.split(/[+\/、，,与及]/).map(function (x) { return x.trim(); }).filter(Boolean);
      let hits = 0;
      tokens.forEach(function (tk) {
        // "拒绝加盟" must NOT count as choosing 加盟
        const NEG = ['拒绝', '不', '没', '未', '放弃', '避免', '暂不', '不搞', '不做', '压住', '中立'];
        const syn = [tk].concat(SYN[tk] || []);
        for (let s = 0; s < syn.length; s++) {
          const pos = chosen.indexOf(syn[s]);
          if (pos < 0) continue;
          const head = chosen.slice(Math.max(0, pos - 5), pos);
          if (NEG.some(function (w) { return head.indexOf(w) >= 0; })) continue;
          hits++;
          break;
        }
      });
      if (!tokens.length) return chosen.indexOf(clean) >= 0;
      return hits > 0 && hits >= Math.ceil(tokens.length * 0.5);
    }

    // "若你T3选了加盟，此时加盟店亏损…；若T6选了冷冻肉，口碑…" →
    // keep only the clauses whose branch actually happened.
    _flPruneConditionals(text) {
      const self = this;
      const lines = String(text).split('\n');
      const out = [];
      lines.forEach(function (line) {
        if (line.indexOf('若') < 0 || !/T\d/.test(line)) { out.push(line); return; }
        // a 【默认】 branch describes the world when none of the listed paths
        // were taken. Without it a cautious player reads an empty page.
        const dm = line.match(/【默认】([\s\S]*)$/);
        const defaultText = dm ? dm[1].trim() : '';
        const body = dm ? line.slice(0, dm.index) : line;
        // split on Chinese semicolons, keeping the separator
        const segs = body.split(/(?<=；)/);
        const kept = [];
        segs.forEach(function (seg) {
          const m = seg.match(/若你?\s*T(\d+)(?:\s*\/\s*T?(\d+))?\s*(?:选了?|选择)?([^，,：:；]*)/);
          if (!m) { kept.push(seg); return; }
          const n1 = m[1], n2 = m[2];
          const phrase = m[3] || '';
          const ok = self._flBranchTaken(n1, phrase) || (n2 && self._flBranchTaken(n2, phrase));
          if (!ok) return;
          // strip the conditional prefix, keep the consequence
          kept.push(seg.replace(/^[^若]*若你?\s*T\d+(?:\s*\/\s*T?\d+)?\s*(?:选了?|选择)?[^，,：:；]*[，,：:]?/, ''));
        });
        if (!kept.length) {
          if (defaultText) out.push(defaultText);
          return;
        }
        const joined = kept.join('');
        // if nothing but a label is left, drop the line
        const stripped = joined.replace(/[💰📊⚠️\s：:，,；;—\-]/g, '');
        if (stripped.length < 4) return;
        const trimmed = joined.replace(/；$/, '。');
        out.push(/[。！？]$/.test(trimmed) ? trimmed : trimmed.replace(/[，,]$/, '') + '。');
      });
      return out.join('\n');
    }

    _prepareSituation(text) {
      if (!text) return '';
      let t = String(text);

      // 1) choice placeholders -> what the player really picked
      t = t.replace(/\{turn\s*(\d+)_(?:option|choice)\}/gi, (m, n) => {
        const s = this._flChoiceText(n);
        return s ? '「' + s + '」' : '（该回合未做选择）';
      });
      t = t.replace(/\{turn4_option\}/g, () => {
        const s = this._flChoiceText(4);
        return s ? '「' + s + '」' : '（该回合未做选择）';
      });

      // 2) raw state keys -> Chinese labels
      const words = this._flMetricWords();
      t = t.replace(/\(([a-z_]{4,})(?:\s*,\s*([a-z_]{4,}))*\)/g, (m, a) => {
        const keys = m.slice(1, -1).split(',').map(function (x) { return x.trim(); });
        const labels = keys.map(function (k) { return words[k] || k; });
        return '（' + labels.join('、') + '）';
      });
      t = t.replace(/\b([a-z]{3,}(?:_[a-z]+)+)\b/g, function (m) { return words[m] || m; });

      // 3) the scenario files sometimes embed a whole reveal block inside the
      //    situation text. A situation card must describe the world, not the
      //    lesson: cut everything from the reveal header on.
      let cutAt = t.search(/\n\s*【\s*(Dörner|Dorner)?\s*模式揭示/);
      const cutBack = t.search(/\n\s*回溯分析[：:]/);
      if (cutBack > 0 && (cutAt < 0 || cutBack < cutAt)) cutAt = cutBack;
      if (cutAt > 0) t = t.slice(0, cutAt);
      t = t.split('\n').filter(function (l) {
        return !/⚠️\s*(Dörner|Dorner)/.test(l) && !/^\s*(Dörner|Dorner)\s*F\d/.test(l);
      }).join('\n');

      // 3b) bias codes inside prose belong to the reveal, not the briefing:
      //     translate them into the concept name so the text still reads.
      const FWORD = {
        F1: '非线性', F2: '时间延迟', F3: '自反性', F4: '副作用', F5: '单目标',
        F6: '确认偏误', F7: '自我批评', F8: '调节滞后',
      };
      t = t.replace(/F(\d)(?:\s*\+\s*F(\d))?/g, function (m, a, b) {
        const x = FWORD['F' + a] || m;
        return b ? (x + '与' + (FWORD['F' + b] || 'F' + b)) : x;
      });

      // 3c) any placeholder we cannot resolve is dropped with its line — a raw
      //     {f1_count} on screen is worse than a missing sentence.
      t = t.split('\n').filter(function (l) { return !/\{[A-Za-z_][\w]*\}/.test(l); }).join('\n');

      // 4) conditional branches
      t = this._flPruneConditionals(t);

      // 4b) "时间延迟时间延迟" / "非线性 非线性：" — the code expansion often
      //     collides with the Chinese word that followed it.
      t = t.replace(/([\u4e00-\u9fa5]{2,6})\s*\1/g, '$1');
      t = t.replace(/([\u4e00-\u9fa5]{2,6})[：:]\s*\1/g, '$1');
      // 4c) a bare "（gdp_growth_pct, public_support_pct）" after the same words
      //     in Chinese is noise, not information
      t = t.replace(/（([^）]{2,40})）/g, function (m, inner, offset, whole) {
        const labels = inner.split(/[、,，]/).map(function (x) { return x.trim(); }).filter(Boolean);
        if (!labels.length) return m;
        // only touch metric-label lists like "gdp_growth_pct, public_support_pct";
        // prose in parentheses must survive untouched
        if (labels.length > 4 || labels.some(function (l) { return l.length > 10; })) return m;
        const before = whole.slice(Math.max(0, offset - 24), offset).replace(/\s/g, '');
        const redundant = labels.every(function (l) {
          if (/_/.test(l)) return false;
          const root = l.replace(/\s/g, '').replace(/增长|占比|指数|程度|率|度|数|额|量/g, '');
          return root.length >= 2 && before.indexOf(root) >= 0;
        });
        return redundant ? '' : '（' + labels.join('、') + '）';
      });
      // 4d) dangling "你前 6 回合中：" whose bullets were dropped
      t = t.split('\n').filter(function (l, idx, arr) {
        if (!/[：:]\s*$/.test(l)) return true;
        const rest = arr.slice(idx + 1).join('').replace(/\s/g, '');
        return rest.length > 0;
      }).join('\n');

      // 5) tidy punctuation left behind
      t = t.replace(/[ \t]+\n/g, '\n')
           .replace(/\n{3,}/g, '\n\n')
           .replace(/；\s*；/g, '；')
           .replace(/：\s*；/g, '：')
           .replace(/，\s*。/g, '。')
           .replace(/\n\s*；/g, '\n');
      return t.trim();
    }

    _formatSituation(text) {
      const clean = this._prepareSituation(text);
      return this._escape(clean).split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }

    _escape(s) {
      if (s === undefined || s === null) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // ===== Action handlers (called from inline onclick) =====
    // L1-2 · 选中 → 确认 → 提交。点一下就落地的话，"谨慎"在交互层面根本不存在：
    // 手快点错的人和想清楚的人拿到同一份反馈，代价没在任何一处被记住。
    // 所以按一下只把这一手挂起（关在引擎的 choice gate 里），确认前随时可撤回。
    selectOption(optionId) {
      // P0-1 guard: a spent turn must not accept a second answer.
      if (this.locked || this.submitting) return;
      const gate = this._gate();
      let label = '';
      const btn = document.querySelector(`.challenger-option[data-option="${optionId}"]`);
      if (btn) {
        const t = btn.querySelector('.option-text');
        label = ((t && t.textContent) || '').trim();
      }
      this.selectedOption = optionId;
      if (gate) gate.pendingChoice(this.lastTurnNumber + 1, optionId, label);
      document.querySelectorAll('.challenger-option').forEach((el) => {
        el.classList.toggle('selected', el.getAttribute('data-option') === optionId);
      });
      this._renderConfirmBar();
    }

    _gate() {
      const oe = typeof window !== 'undefined' ? window.OfflineEngine : null;
      return oe && oe._flChoiceGate ? oe._flChoiceGate : null;
    }

    _renderConfirmBar() {
      const bar = document.getElementById('challenger-confirm-bar');
      if (!bar) return;
      const gate = this._gate();
      const pend = gate ? gate.peek() : null;
      if (!pend || !pend.open) {
        bar.hidden = true;
        bar.innerHTML = '';
        return;
      }
      const brief = pend.label
        ? `<span class="cfb-brief">· ${this._escape(pend.label).slice(0, 26)}${pend.label.length > 26 ? '…' : ''}</span>`
        : '';
      bar.hidden = false;
      bar.innerHTML = `
        <div class="cfb-text">已选 <b>${this._escape(pend.option_id)}</b>${brief}</div>
        <div class="cfb-hint">还没提交 · 可以改</div>
        <div class="cfb-actions">
          <button class="cfb-btn cfb-confirm" id="challenger-confirm"
                  onclick="window.challengerRouter.confirmChoice()">确认这一手 →</button>
          <button class="cfb-btn cfb-revert" id="challenger-revert"
                  onclick="window.challengerRouter.revertChoice()">撤回重选</button>
        </div>
      `;
    }

    _hideConfirmBar() {
      const bar = document.getElementById('challenger-confirm-bar');
      if (!bar) return;
      bar.hidden = true;
      bar.innerHTML = '';
    }

    // 只有显式确认才推进回合。没有挂起的选择 = 什么都没选，不是"默认第一项"。
    confirmChoice(optionId) {
      if (this.locked || this.submitting) return;
      const gate = this._gate();
      const target = optionId || this.selectedOption;
      let pend = null;
      if (gate) {
        const open = gate.peek();
        if (!open || !open.open) return;
        pend = gate.confirmSubmit(target);
        if (!pend) return;
      }
      const optId = pend ? pend.option_id : target;
      if (!optId) return;
      this._hideConfirmBar();
      this._commitTurn(optId);
    }

    revertChoice() {
      const gate = this._gate();
      if (gate) gate.revertChoice();
      this.selectedOption = null;
      document.querySelectorAll('.challenger-option').forEach((el) => {
        el.classList.remove('selected');
      });
      this._hideConfirmBar();
    }

    _commitTurn(optionId) {
      const ta = document.getElementById('challenger-justification');
      const justification = ta ? ta.value.trim() : '';
      if (this.submitting || this.locked) return;
      this._submitTurn(optionId, justification).then((resp) => {
        if (!resp) {
          return;
        }
        this._lockDecision();
        const container = document.getElementById('game-container');
        if (this.lastTurnNumber >= this.totalTurns) {
          if (container) {
            container.innerHTML = this._renderFinalPage();
          }
          ChallengerRouter.clearSnapshot(this.gameId);
          return;
        }
        const fbEl = document.getElementById('challenger-feedback-display');
        if (fbEl) {
          fbEl.className = this._feedbackClassForTurn(this.lastTurnNumber);
          fbEl.innerHTML = `${this._feedbackHtml(this.lastFeedback)}${this._nextTurnButtonHtml()}`;
          fbEl.style.display = 'block';
          this._applyStateChangeFlash(this.previousState, this.gameState);
          this._refreshStateChips();
          const taEl = document.getElementById('challenger-justification');
          if (taEl) taEl.value = '';
          const ccEl = document.getElementById('challenger-char-count');
          if (ccEl) ccEl.textContent = '0';
          this._revealFeedback(fbEl);
        }
        const submitBtn = document.getElementById('challenger-submit');
        if (submitBtn) {
          submitBtn.style.display = 'none';
        }
      }).catch((err) => {
        console.error('[challenger] auto-submit failed', err);
        const submitBtn = document.getElementById('challenger-submit');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '提交决定';
        }
      });
    }

    updateCharCount() {
      const ta = document.getElementById('challenger-justification');
      const counter = document.getElementById('challenger-char-count');
      if (ta && counter) counter.textContent = ta.value.length;
    }

    // 老入口保留：外部（键盘、快照恢复、脚本）仍可调 submit，但语义已和
    // "确认"合并——没有挂起的选择就什么都不发生。
    async submit() {
      if (this.locked) return;
      this.confirmChoice();
    }

    // P0-1: freeze the turn. The buttons stay on screen (the player must still
    // be able to see what they chose) but stop being answers to anything.
    _lockDecision() {
      this.locked = true;
      // 这一手已经落地，闸门必须一起清空：留着挂起项会让"确认条"看起来
      // 还能改，而引擎状态已经往前走了。
      const gate = this._gate();
      if (gate) gate.revertChoice();
      this._hideConfirmBar();
      const opts = document.getElementById('challenger-options');
      if (opts) opts.classList.add('options-locked');
      document.querySelectorAll('.challenger-option').forEach((el) => {
        el.setAttribute('disabled', 'disabled');
        el.setAttribute('aria-disabled', 'true');
        el.classList.add('option-spent');
      });
      const card = document.querySelector('.decision-card');
      if (card) card.classList.add('decision-spent');
      const justBox = document.getElementById('challenger-justification-box');
      if (justBox) justBox.open = false;
    }

    _unlockDecision() {
      this.locked = false;
    }

    // P0-3: "继续 →" collided with an option that literally reads
    // "邀请各国继续履约". Naming the destination removes the ambiguity for the
    // player and for every future test selector.
    _nextTurnButtonHtml() {
      const n = Math.min(this.lastTurnNumber + 1, this.totalTurns);
      return `<div class="actions">
              <button class="btn btn-primary" id="challenger-next-turn" data-next-turn="${n}"
                      onclick="window.challengerRouter.continueToNextTurn()">进入第 ${n} 回合 →</button>
            </div>`;
    }

    // P0-2: the feedback is now above the fold; bring it into view so the
    // player does not have to discover it by scrolling.
    _revealFeedback(el) {
      if (!el || typeof el.scrollIntoView !== 'function') return;
      try {
        el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } catch (e) {
        el.scrollIntoView();
      }
    }

    async continueToNextTurn() {
      const container = document.getElementById('game-container');
      if (!container) return;
      if (this.lastTurnNumber >= this.totalTurns) {
        container.innerHTML = this._renderFinalPage();
        ChallengerRouter.clearSnapshot(this.gameId);
        return;
      }
      const nextTurn = this.lastTurnNumber + 1;
      this.selectedOption = null;
      this._unlockDecision();
      await this._loadStep(nextTurn);
      container.innerHTML = this._renderDecisionView(nextTurn);
      this._scoreCurrentDecision();
    }

    restart() {
      ChallengerRouter.clearSnapshot(this.gameId);
      GameManager.hideGameModal();
      NavigationManager.navigateTo('scenarios');
      // Brief delay then re-launch
      setTimeout(() => GameManager.startChallengerGame(), 250);
    }
  }

  // ===== Expose globally so inline onclick can reach it =====
  window.ChallengerRouter = ChallengerRouter;
})();

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
        { id: 'state-tipping', key: 'tipping_point_proximity', label: '⏰ 临界点距离 (%)' },
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
      this.lastFeedback = null;         // last turn's feedback text
      this.lastTurnNumber = 0;          // monotonically increasing
    }

    // ===== Page entry points =====
    async renderStartPage() {
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
        const step = await ApiService.configManager.request(url);
        this.currentStep = step;
        this._lastLoadError = null;
      } catch (err) {
        console.error('[challenger] failed to load step', turnNumber, err);
        this.currentStep = null;
        // Remember the error so _renderDecisionView can show a banner
        // explaining why the situation/options are placeholders.
        this._lastLoadError = err && err.message ? err.message : String(err);
      }
    }

    async _submitTurn(optionId, justification) {
      if (this.submitting) return null;
      this.submitting = true;
      try {
        const resp = await ApiService.games.executeTurn(this.gameId, {
          option: optionId,
          justification: justification || ''
        });
        this.previousState = this.gameState ? Object.assign({}, this.gameState) : null;
        this.gameState = resp.game_state || resp.gameState || this.gameState;
        this.lastFeedback = resp.feedback || '';
        this.lastTurnNumber = resp.turnNumber || resp.turn_number || (this.lastTurnNumber + 1);
        this._saveSnapshot();
        return resp;
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
        localStorage.setItem(SNAPSHOT_PREFIX + this.gameId, JSON.stringify(snap));
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

    static findResumableSnapshots() {
      const out = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SNAPSHOT_PREFIX)) {
          try {
            const snap = JSON.parse(localStorage.getItem(key));
            if (snap && snap.scenarioId === this.scenarioId && snap.turn > 0) {
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

      if (isFinal) {
        return this._renderFinalPage();
      }

      const optionHtml = options.map((o) => `
        <button class="challenger-option"
                data-option="${o.id}"
                onclick="window.challengerRouter.selectOption('${o.id}')">
          <span class="option-tag option-${this._weightClass(o.weight)}">${this._weightLabel(o.weight)}</span>
          <span class="option-letter">${o.id}</span>
          <span class="option-text">${this._escape(o.text)}</span>
        </button>
      `).join('');

      const offlineBanner = this._lastLoadError
        ? `<div class="offline-banner">⚠️ 后端 API 无法连接 — 选项已禁用。请确认 API 服务已启动 (端口 8000) 或检查 Render 部署。<br><small>${this._escape(this._lastLoadError)}</small></div>`
        : '';

      const submitDisabled = options.length === 0 ? 'disabled' : 'disabled';

      return `
        <div class="game-page challenger-decision-page">
          <div class="page-header">
            <h2>${this._escape(this.scenarioConfig.label)} · 第 ${turnNumber} 回合</h2>
            <div class="progress">回合 ${turnNumber} / ${this.totalTurns} · 阶段: ${this._escape(phase)}</div>
          </div>

          <div class="challenger-state-grid" id="challenger-state-grid" style="display: grid;">
            ${this._renderStateGrid()}
          </div>

          ${offlineBanner}

          <div class="situation-card">
            <h3>📖 情境</h3>
            <div class="situation-text">${this._formatSituation(situation)}</div>
            ${isReveal ? '<div class="reveal-banner">⚠️ Dörner 模式揭示即将出现 — 注意你的决策模式</div>' : ''}
          </div>

          <div class="decision-card">
            <h3>📋 你的决策</h3>
            <div class="challenger-options" id="challenger-options">
              ${optionHtml}
            </div>

            <div class="justification-area" id="challenger-justification-area" style="display:none;">
              <label for="challenger-justification">
                <strong>为什么选这个?</strong>
                <span class="char-counter"><span id="challenger-char-count">0</span>/${JUSTIFICATION_MAX}</span>
              </label>
              <textarea id="challenger-justification"
                        maxlength="${JUSTIFICATION_MAX}"
                        placeholder="1-2 句决策理由（可选，提升反思深度）"
                        oninput="window.challengerRouter.updateCharCount()"></textarea>
            </div>

            <button class="btn btn-primary challenger-submit"
                    id="challenger-submit"
                    disabled
                    onclick="window.challengerRouter.submit()">
              提交决定
            </button>
          </div>

          <div id="challenger-feedback-display" class="feedback-section" style="display:none;"></div>
        </div>
      `;
    }

    _renderStateGrid() {
      const state = this.gameState || {};
      const items = this.scenarioConfig.stateFields.map((f) => ({
        id: f.id, label: f.label, val: state[f.key]
      }));
      return items.map((it) => {
        const val = (it.val === undefined || it.val === null) ? '—' : it.val;
        return `
          <div class="state-item">
            <span class="state-label">${it.label}</span>
            <span class="state-value" id="${it.id}">${val}</span>
          </div>
        `;
      }).join('');
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
            <pre class="feedback-pre">${this._escape(fb)}</pre>
          </div>
          <div class="actions">
            <button class="btn btn-primary" onclick="window.challengerRouter.continueToNextTurn()">
              继续 →
            </button>
          </div>
        </div>
      `;
    }

    _renderFinalPage() {
      return `
        <div class="game-page challenger-final-page">
          <div class="page-header">
            <h2>${this._escape(this.scenarioConfig.label)} · 终局</h2>
            <div class="progress">${this.totalTurns} / ${this.totalTurns} 回合完成</div>
          </div>
          <div class="outcome-card outcome-final">
            <pre class="feedback-pre">${this._escape(this.lastFeedback || '游戏结束 — 请查看上方完整反馈。')}</pre>
          </div>
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

    _feedbackClassForTurn(turn) {
      if (turn >= 10) return 'outcome-card outcome-final';
      if (turn >= 8) return 'outcome-card outcome-critical';
      if (turn >= 5) return 'pattern-reveal-card';
      return 'feedback-card';
    }

    _weightClass(weight) {
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
      const labels = {
        extreme_safe: '极保守',
        safe: '保守',
        neutral: '中性',
        risky: '激进',
        extreme_risk: '极激进'
      };
      return labels[weight] || weight || '';
    }

    _formatSituation(text) {
      // Backend already escapes + formats. Render as paragraph blocks.
      return this._escape(text).split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
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
    selectOption(optionId) {
      this.selectedOption = optionId;
      document.querySelectorAll('.challenger-option').forEach((el) => {
        el.classList.toggle('selected', el.getAttribute('data-option') === optionId);
      });
      document.getElementById('challenger-justification-area').style.display = 'block';
      const submitBtn = document.getElementById('challenger-submit');
      if (submitBtn) submitBtn.disabled = false;
    }

    updateCharCount() {
      const ta = document.getElementById('challenger-justification');
      const counter = document.getElementById('challenger-char-count');
      if (ta && counter) counter.textContent = ta.value.length;
    }

    async submit() {
      if (!this.selectedOption) return;
      const ta = document.getElementById('challenger-justification');
      const justification = ta ? ta.value.trim() : '';
      const submitBtn = document.getElementById('challenger-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';
      }
      try {
        const resp = await this._submitTurn(this.selectedOption, justification);
        if (!resp) return;
        // Show feedback inline, then user clicks "继续 →"
        const fbEl = document.getElementById('challenger-feedback-display');
        if (fbEl) {
          fbEl.className = this._feedbackClassForTurn(this.lastTurnNumber);
          fbEl.innerHTML = `<pre class="feedback-pre">${this._escape(this.lastFeedback)}</pre>
            <div class="actions">
              <button class="btn btn-primary" onclick="window.challengerRouter.continueToNextTurn()">继续 →</button>
            </div>`;
          fbEl.style.display = 'block';
          // Apply state change flash on the just-updated grid
          this._applyStateChangeFlash(this.previousState, this.gameState);
        }
      } catch (err) {
        console.error('[challenger] submit failed', err);
        if (fbEl_safe(submitBtn)) {
          submitBtn.disabled = false;
          submitBtn.textContent = '提交决定';
        }
      }
    }

    async continueToNextTurn() {
      const container = document.getElementById('game-container');
      if (!container) return;
      // After T10 (turnNumber=10), show final page directly — there is no T11.
      // The outcome feedback shown above is rendered inside the decision page;
      // clicking "继续 →" takes the player to the final outcome view.
      if (this.lastTurnNumber >= this.totalTurns) {
        container.innerHTML = this._renderFinalPage();
        ChallengerRouter.clearSnapshot(this.gameId);
        return;
      }
      const nextTurn = this.lastTurnNumber + 1;
      this.selectedOption = null;
      await this._loadStep(nextTurn);
      container.innerHTML = this._renderDecisionView(nextTurn);
    }

    restart() {
      ChallengerRouter.clearSnapshot(this.gameId);
      GameManager.hideGameModal();
      NavigationManager.navigateTo('scenarios');
      // Brief delay then re-launch
      setTimeout(() => GameManager.startChallengerGame(), 250);
    }
  }

  function fbEl_safe() { return true; }  // no-op for readability in catch block

  // ===== Expose globally so inline onclick can reach it =====
  window.ChallengerRouter = ChallengerRouter;
})();
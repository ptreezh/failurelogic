/* challenger-router.js — Challenger scenario UI (10-turn Dörner deep dive).
 *
 * Wires GameManager.startChallengerGame() into the existing app:
 *   - startScenario('challenger-launch') → startChallengerGame (wired in app.js)
 *   - get step from GET /scenarios/{scenario_id}/step/{turn}
 *   - submit turn to POST /scenarios/{game_id}/turn with {option, justification}
 *   - render state grid + feedback + reveal/outcome cards
 *   - localStorage snapshot after every turn (crash recovery)
 *
 * Per docs/challenger-frontend-spec.md (B1/B2/B3 done; this is steps 1-9).
 */

(function () {
  'use strict';

  const SCENARIO_ID = 'challenger-launch';
  const SNAPSHOT_PREFIX = 'challenge-snapshot-';
  const TOTAL_TURNS = 10;
  const JUSTIFICATION_MAX = 200;

  class ChallengerRouter {
    constructor(gameState, options) {
      this.gameState = gameState || {};
      this.gameId = (options && options.gameId) || null;
      this.scenarioId = SCENARIO_ID;
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
      const nextTurn = Math.min(this.lastTurnNumber + 1, TOTAL_TURNS);
      if (nextTurn > TOTAL_TURNS) {
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
      } catch (err) {
        console.error('[challenger] failed to load step', turnNumber, err);
        this.currentStep = null;
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
            if (snap && snap.scenarioId === SCENARIO_ID && snap.turn > 0) {
              out.push(snap);
            }
          } catch (e) {}
        }
      }
      return out;
    }

    // ===== Rendering =====
    _stateKeyMap() {
      // JS state grid id ↔ game_state key. State grid lives in app.js HTML.
      return {
        'state-temperature': 'temperature_forecast_f',
        'state-engineer-confidence': 'engineer_confidence',
        'state-schedule-pressure': 'schedule_pressure',
        'state-budget': 'budget_used_pct',
        'state-attention': 'public_attention',
        'state-morale': 'team_morale',
        'state-accepted-risks': 'accepted_risks_count',
        'state-ignored-warnings': 'ignored_warnings_count',
        'state-unresolved': 'risk_acknowledged_unresolved'
      };
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

      return `
        <div class="game-page challenger-decision-page">
          <div class="page-header">
            <h2>🚀 挑战者号发射决策 · 第 ${turnNumber} 回合</h2>
            <div class="progress">回合 ${turnNumber} / ${TOTAL_TURNS} · 阶段: ${phase}</div>
          </div>

          <div class="challenger-state-grid" id="challenger-state-grid" style="display: grid;">
            ${this._renderStateGrid()}
          </div>

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
      const map = this._stateKeyMap();
      const state = this.gameState || {};
      const items = [
        { id: 'state-temperature', label: '🌡️ 预报温度 (°F)', val: state.temperature_forecast_f, hint: '历史最低: 53°F' },
        { id: 'state-engineer-confidence', label: '👷 工程师信心', val: state.engineer_confidence },
        { id: 'state-schedule-pressure', label: '📅 进度压力', val: state.schedule_pressure },
        { id: 'state-budget', label: '💰 预算占比 %', val: state.budget_used_pct },
        { id: 'state-attention', label: '📺 公众关注', val: state.public_attention },
        { id: 'state-morale', label: '🤝 团队士气', val: state.team_morale },
        { id: 'state-accepted-risks', label: '⚠️ 接受风险', val: state.accepted_risks_count },
        { id: 'state-ignored-warnings', label: '🔇 忽视警告', val: state.ignored_warnings_count },
        { id: 'state-unresolved', label: '❓ 未解决风险', val: state.risk_acknowledged_unresolved }
      ];
      return items.map((it) => {
        const val = (it.val === undefined || it.val === null) ? '—' : it.val;
        return `
          <div class="state-item">
            <span class="state-label">${it.label}</span>
            <span class="state-value" id="${it.id}">${val}</span>
            ${it.hint ? `<span class="state-hint">${it.hint}</span>` : ''}
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
            <h2>🚀 挑战者号发射决策 · 终局</h2>
            <div class="progress">10 / 10 回合完成</div>
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
      if (this.lastTurnNumber >= TOTAL_TURNS) {
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
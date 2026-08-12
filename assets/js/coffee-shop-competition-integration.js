/**
 * Coffee Shop Competition Integration
 * 竞争系统集成模块
 *
 * 猴子补丁方式集成，不修改原有咖啡店路由器代码
 */

(function(global) {
    'use strict';

    const STORAGE_KEY = 'failurelogic_leaderboard';

    function initCompetitionSystem() {
        if (typeof CoffeeShopDeepRouter === 'undefined') {
            console.error('CoffeeShopDeepRouter not found');
            return;
        }

        const OriginalRouter = CoffeeShopDeepRouter;

        class CompetitionIntegratedRouter extends OriginalRouter {
            constructor(container) {
                super(container);

                this.competitionSystem = null;
                this.leaderboard = null;
                this.competitors = [];
                this.competitionEnabled = true;
            }

            initialize() {
                this.initCompetition();
                this.renderStartPage();
            }

            initCompetition() {
                try {
                    if (typeof MarketEnvironment === 'undefined' ||
                        typeof AICompetitor === 'undefined' ||
                        typeof CompetitionSystem === 'undefined' ||
                        typeof Leaderboard === 'undefined') {
                        console.warn('Competition modules not loaded, falling back to original behavior');
                        this.competitionEnabled = false;
                        return;
                    }

                    const marketEnv = new MarketEnvironment({
                        totalAddressableMarket: 1000,
                        currentCustomers: 500
                    });

                    this.competitors = [
                        new AICompetitor(PERSONALITY_TYPES.AGGRESSIVE),
                        new AICompetitor(PERSONALITY_TYPES.QUALITY),
                        new AICompetitor(PERSONALITY_TYPES.EFFICIENT),
                        new AICompetitor(PERSONALITY_TYPES.RISKY)
                    ];

                    this.competitionSystem = new CompetitionSystem({
                        marketEnvironment: marketEnv,
                        userState: {
                            satisfaction: this.state.satisfaction,
                            reputation: this.state.reputation,
                            daily_revenue: 500,
                            daily_customers: this.state.daily_customers,
                            staff_count: 3
                        },
                        competitors: this.competitors
                    });

                    this.leaderboard = new Leaderboard();

                    this.competitionEnabled = true;
                } catch (e) {
                    console.warn('Failed to init competition system:', e);
                    this.competitionEnabled = false;
                }
            }

            startGame() {
                this.state = {
                    satisfaction: 50,
                    resources: 1000,
                    reputation: 50,
                    daily_customers: 50,
                    turn: 1,
                    max_turns: 6,
                    phase: 'decision',
                    game_over: false,
                    decision_history: [],
                    awakening_triggered: false,
                    awakening_turn: null
                };

                this.hiddenSystem = new HiddenSystemModel();
                this.socialPressure = new SocialPressureSimulator();
                this.delayedEngine = new DelayedEffectEngine();
                this.tempDecision = null;

                this.initCompetition();
            }

            makeDecision(optionIndex) {
                const options = this.generateContextualOptions();
                const decision = options[optionIndex];

                if (!decision) return;

                this.tempDecision = decision;

                this.updateHiddenSystem(decision);

                const visibleChanges = this.calculateVisibleChanges(decision);
                const hiddenChanges = this.calculateHiddenChanges(decision);

                this.state.satisfaction = Math.max(0, Math.min(100, this.state.satisfaction + visibleChanges.satisfaction));
                this.state.resources += visibleChanges.resources;
                this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + visibleChanges.reputation));
                this.state.daily_customers = Math.max(0, this.state.daily_customers + (visibleChanges.customers || 0));

                if (this.competitionEnabled && this.competitionSystem) {
                    this.updateUserStateForCompetition();
                    const competitionResult = this.competitionSystem.runCompetitionTurn(decision);
                    this.applyCompetitionImpact(competitionResult);
                }

                this.state.decision_history.push({
                    turn: this.state.turn,
                    decision: decision,
                    hidden_state: {
                        staff_efficiency: this.hiddenSystem.staff_efficiency,
                        coordination_cost: this.hiddenSystem.coordination_cost,
                        quality_index: this.hiddenSystem.quality_index,
                        customer_lifetime_value: this.hiddenSystem.customer_lifetime_value
                    },
                    visible_state: {
                        satisfaction: this.state.satisfaction,
                        resources: this.state.resources,
                        reputation: this.state.reputation,
                        daily_customers: this.state.daily_customers
                    },
                    causal_chain: this.generateCausalChain(decision, hiddenChanges)
                });

                this.checkAwakening();

                if (this.state.resources < 0 || this.state.satisfaction <= 0) {
                    this.state.game_over = true;
                    this.state.phase = 'ending';
                } else {
                    this.state.phase = 'social_feedback';
                }

                this.render();
            }

            advanceTurn() {
                const applied = this.delayedEngine.tick();

                for (const effect of applied) {
                    if (effect.changes) {
                        for (const [key, value] of Object.entries(effect.changes)) {
                            if (this.state.hasOwnProperty(key)) {
                                this.state[key] += value;
                            }
                        }
                    }
                }

                if (this.competitionEnabled && this.competitionSystem) {
                    this.updateUserStateForCompetition();
                    this.competitionSystem.runCompetitionTurn(this.tempDecision || { type: 'wait' });
                    this.leaderboard.updateRealtime(this.competitionSystem.getRankingTable());
                }

                this.state.turn++;
                this.tempDecision = null;

                if (this.state.turn > this.state.max_turns || this.state.game_over) {
                    this.state.phase = 'ending';
                } else {
                    this.state.phase = 'decision';
                }

                this.render();
            }

            updateUserStateForCompetition() {
                if (!this.competitionSystem || !this.competitionSystem.userState) return;

                this.competitionSystem.userState.satisfaction = this.state.satisfaction;
                this.competitionSystem.userState.reputation = this.state.reputation;
                this.competitionSystem.userState.daily_revenue = this.state.daily_customers * 25;
                this.competitionSystem.userState.daily_customers = this.state.daily_customers;
                this.competitionSystem.userState.staff_count = this.hiddenSystem.staff_count;
            }

            applyCompetitionImpact(result) {
                if (!result.customerTransfer) return;

                this.state.daily_customers = Math.max(0,
                    this.state.daily_customers + result.customerTransfer.netChange
                );
            }

            renderDecisionPage() {
                const turn = this.state.turn;
                const socialProof = this.socialPressure.getSocialProofText(turn);
                const options = this.generateContextualOptions();

                let competitionHTML = '';

                if (this.competitionEnabled && this.leaderboard) {
                    const rankingTable = this.leaderboard.getRealtimeTable();
                    const userRank = this.leaderboard.getUserRank();
                    const userTrend = this.leaderboard.getUserTrend();

                    competitionHTML = `
                        <div class="competition-panel compact-bias-hint">
                            <h4>📊 实时排行榜</h4>
                            <div class="ranking-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>排名</th>
                                            <th>店铺</th>
                                            <th>营收</th>
                                            <th>口碑</th>
                                            <th>员工</th>
                                            <th>趋势</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rankingTable.map(entry => `
                                            <tr class="${entry.colorClass} ${entry.isUser ? 'user-row' : ''}">
                                                <td>${entry.rank}</td>
                                                <td>${entry.name}${entry.isUser ? ' (你)' : ''}</td>
                                                <td>¥${entry.surface.daily_revenue || 0}</td>
                                                <td>${entry.surface.reputation || 0}</td>
                                                <td>${entry.surface.staff_count || 0}人</td>
                                                <td>${entry.trend}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            ${userRank ? `<p class="user-rank">你的排名: 第${userRank}名 ${userTrend}</p>` : ''}
                        </div>
                    `;
                }

                const html = `
                    <div class="game-page decision-page compact-page-header">
                        <div class="round-header compact-stats-grid">
                            <span class="step-indicator">回合 ${turn} / ${this.state.max_turns}</span>
                        </div>

                        <div class="situation-box compact-situation">
                            <h3>${this.getTurnNarrative(turn)}</h3>
                            <p>${this.getTurnPressure(turn)}</p>
                        </div>

                        <div class="live-metrics compact-stats-grid">
                            <div class="metric-item">
                                <span class="metric-label">😊 满意度</span>
                                <span class="metric-value">${this.state.satisfaction}</span>
                                <div class="metric-bar">
                                    <div class="metric-fill ${this.state.satisfaction < 50 ? 'danger' : ''}" style="width: ${this.state.satisfaction}%"></div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">💰 资金</span>
                                <span class="metric-value">¥${this.state.resources}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">⭐ 口碑</span>
                                <span class="metric-value">${this.state.reputation}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">👥 客流</span>
                                <span class="metric-value">${this.state.daily_customers}人/日</span>
                            </div>
                        </div>

                        ${competitionHTML}

                        <div class="social-pressure compact-bias-hint">
                            <h4>📢 行业动态（来自你的社交圈）</h4>
                            <p>${socialProof.market_hype}</p>
                            <p>${socialProof.peer_stories}</p>
                            <p class="media-narrative">${socialProof.narrative}</p>
                            <p class="pressure-tip">💡 <em>其他经营者似乎在扩张，你会？</em></p>
                        </div>

                        <div class="decision-panel compact-actions">
                            <h3>你的决策：</h3>
                            <div class="options-list compact-options-grid">
                                ${options.map((opt, idx) => `
                                    <button class="option-btn compact-option-card"
                                            onclick="window.coffeeShopDeepRouter.makeDecision(${idx})"
                                            data-risk="${opt.risk || 'low'}">
                                        <strong>${opt.label}</strong>
                                        <span class="option-desc">${opt.description}</span>
                                        ${opt.cost ? `<span class="option-cost">成本: ¥${opt.cost}</span>` : ''}
                                        ${opt.risk === 'high' ? '<span class="risk-badge">高风险</span>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;

                this.container.innerHTML = html;
            }

            renderSocialFeedbackPage() {
                const turn = this.state.turn;
                const decision = this.tempDecision;

                const appliedEffects = this.delayedEngine.tick();
                const visibleChanges = this.calculateVisibleChanges(decision);
                const hiddenChanges = this.calculateHiddenChanges(decision);

                let competitionFeedbackHTML = '';

                if (this.competitionEnabled && this.competitionSystem && this.competitionSystem.competitionHistory.length > 0) {
                    const lastResult = this.competitionSystem.competitionHistory[this.competitionSystem.competitionHistory.length - 1];

                    competitionFeedbackHTML = `
                        <div class="competition-feedback compact-bias-hint">
                            <h4>📊 竞争影响</h4>
                            ${lastResult.customerTransfer.lost > 0 ? `<p>⚠️ 客户流失: ${lastResult.customerTransfer.lost}人</p>` : ''}
                            ${lastResult.customerTransfer.gained > 0 ? `<p>✅ 客户获取: ${lastResult.customerTransfer.gained}人</p>` : ''}
                            <p>净变化: ${lastResult.customerTransfer.netChange > 0 ? '+' : ''}${lastResult.customerTransfer.netChange}人</p>
                            ${lastResult.customerTransfer.reasons.map(r => `<p class="transfer-reason">${r}</p>`).join('')}
                        </div>
                    `;
                }

                const html = `
                    <div class="game-page feedback-page compact-start-page">
                        <h2>📊 第${turn}回合 - 经营报告</h2>

                        <div class="immediate-feedback compact-situation">
                            <h3>📈 表面结果</h3>
                            <div class="changes-list">
                                ${Object.entries(visibleChanges).map(([key, value]) => {
                                    const isPositive = value >= 0;
                                    const icon = key === 'satisfaction' ? '😊' : key === 'resources' ? '💰' : key === 'reputation' ? '⭐' : '👥';
                                    return `<span class="change ${isPositive ? 'positive' : 'negative'}">
                                        ${icon} ${key}: ${isPositive ? '+' : ''}${value}
                                    </span>`;
                                }).join('')}
                            </div>
                            <p class="feedback-text">${this.generateFeedbackText(decision, visibleChanges)}</p>
                        </div>

                        ${competitionFeedbackHTML}

                        <div class="live-metrics compact-stats-grid">
                            <div class="metric-item">
                                <span class="metric-label">😊 满意度</span>
                                <span class="metric-value">${this.state.satisfaction}</span>
                                <div class="metric-bar">
                                    <div class="metric-fill ${this.state.satisfaction < 50 ? 'danger' : ''}" style="width: ${this.state.satisfaction}%"></div>
                                </div>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">💰 资金</span>
                                <span class="metric-value">¥${this.state.resources}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">⭐ 口碑</span>
                                <span class="metric-value">${this.state.reputation}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">👥 客流</span>
                                <span class="metric-value">${this.state.daily_customers}人/日</span>
                            </div>
                        </div>

                        ${appliedEffects.length > 0 ? `
                            <div class="delayed-effects compact-bias-hint">
                                <h3>⏰ 延迟效果显现</h3>
                                ${appliedEffects.map(e => `<p>${e.description}</p>`).join('')}
                            </div>
                        ` : ''}

                        <div class="hidden-pressure compact-situation">
                            <h4>🔍 你注意到了吗？</h4>
                            <p>${this.generateSubtleHint(decision, hiddenChanges)}</p>
                        </div>

                        <div class="compact-actions">
                            <button class="btn btn-primary" onclick="window.coffeeShopDeepRouter.advanceTurn();">
                                继续经营
                            </button>
                        </div>
                    </div>
                `;

                this.container.innerHTML = html;
            }

            renderEndingPage() {
                const performance = this.evaluatePerformance();
                const autopsy = AutopsySystem.generateAutopsy(this.state);
                const biases = this.detectBiases();

                let competitionAnalysisHTML = '';

                if (this.competitionEnabled && this.competitionSystem && this.competitionSystem.competitionHistory.length > 0) {
                    const rankingTable = this.competitionSystem.getRankingTable();
                    const userEntry = rankingTable.find(e => e.isUser);
                    const userRank = userEntry ? userEntry.rank : 'N/A';

                    competitionAnalysisHTML = `
                        <div class="competition-analysis compact-situation">
                            <h4>📊 竞争分析</h4>
                            <p>最终排名: 第${userRank}名</p>
                            <div class="ranking-table-final">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>排名</th>
                                            <th>店铺</th>
                                            <th>营收</th>
                                            <th>口碑</th>
                                            <th>员工</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rankingTable.map(entry => `
                                            <tr class="${entry.isUser ? 'user-row' : ''}">
                                                <td>${entry.rank}</td>
                                                <td>${entry.name}${entry.isUser ? ' (你)' : ''}</td>
                                                <td>¥${entry.surface.daily_revenue || 0}</td>
                                                <td>${entry.surface.reputation || 0}</td>
                                                <td>${entry.surface.staff_count || 0}人</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }

                if (this.leaderboard) {
                    const history = this.leaderboard.getHistory(5);
                    if (history.length > 0) {
                        competitionAnalysisHTML += `
                            <div class="history-section compact-situation">
                                <h4>🏆 历史最佳成绩</h4>
                                ${history.map(entry => `
                                    <p>${entry.playerName}: 存活${entry.turnsSurvived}回合, 排名#${entry.finalRank}, 成绩${entry.performanceGrade}</p>
                                `).join('')}
                            </div>
                        `;
                    }
                }

                const html = `
                    <div class="game-page ending-page compact-start-page">
                        <h2>📊 经营结束</h2>

                        <div class="final-stats compact-stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">😊 最终满意度</span>
                                <span class="stat-value">${this.state.satisfaction}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">💰 最终资金</span>
                                <span class="stat-value">¥${this.state.resources}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">⭐ 最终口碑</span>
                                <span class="stat-value">${this.state.reputation}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">📈 表现评级</span>
                                <span class="stat-value ${performance.grade === 'F' ? 'grade-fail' : ''}">${performance.grade}</span>
                            </div>
                        </div>

                        ${competitionAnalysisHTML}

                        <div class="autopsy-section compact-situation">
                            <h3>🔍 失败尸检</h3>
                            <div class="autopsy-content">
                                <h4>根本原因</h4>
                                <p>${autopsy.rootCause.detail || autopsy.rootCause}</p>

                                <h4>决策时间线</h4>
                                ${this.generateCascadeVisualization()}

                                <h4>认知偏差检测</h4>
                                ${biases.map(b => `
                                    <div class="bias-detected">
                                        <strong>${b.name}</strong>
                                        <p>${b.evidence}</p>
                                        <p class="suggestion">💡 ${b.suggestion}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="compact-actions">
                            <button class="btn btn-primary" onclick="window.coffeeShopDeepRouter.restart();">
                                重新挑战
                            </button>
                        </div>
                    </div>
                `;

                this.container.innerHTML = html;

                if (this.leaderboard) {
                    this.leaderboard.recordGameResult({
                        playerName: 'Anonymous',
                        turnsSurvived: this.state.turn,
                        finalFunds: this.state.resources,
                        finalRank: userRank || 0,
                        performanceGrade: performance.grade,
                        keyFailure: autopsy.rootCause.cause || autopsy.rootCause,
                        hiddenRevelation: this.getCompetitionHiddenRevelation()
                    });
                }
            }

            getCompetitionHiddenRevelation() {
                if (!this.competitionEnabled || !this.competitionSystem) return '';

                const history = this.competitionSystem.competitionHistory;
                if (history.length === 0) return '';

                const revelations = [];

                history.forEach(turn => {
                    turn.competitorActions.forEach(action => {
                        if (action.hidden && action.hidden.coordination_cost > 50) {
                            revelations.push(
                                `${action.name}的"成功"背后：协调成本${action.hidden.coordination_cost}%，效率仅${action.hidden.staff_efficiency}%`
                            );
                        }
                    });
                });

                return revelations.length > 0 ? revelations[0] : '市场竞争影响你的客户流向';
            }
        }

        global.CoffeeShopDeepRouter = CompetitionIntegratedRouter;
        global.coffeeShopDeepRouter = null;

        global.initCoffeeShopDeep = function(containerId) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('Container not found:', containerId);
                return null;
            }
            global.coffeeShopDeepRouter = new CompetitionIntegratedRouter(container);
            global.coffeeShopDeepRouter.initialize();
            return global.coffeeShopDeepRouter;
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCompetitionSystem);
    } else {
        initCompetitionSystem();
    }

})(typeof window !== 'undefined' ? window : global);

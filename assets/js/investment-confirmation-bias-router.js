/**
 * 投资确认偏误场景路由器
 * Investment Confirmation Bias Scenario Router
 * 
 * 来源：Soul Auto-Evolution 循环9
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // 场景配置
    const SCENARIO_ID = 'investment-confirmation-bias';
    const SCENARIO_NAME = '投资确认偏误实验';

    // 状态管理
    const state = {
        currentPhase: 0,
        currentRound: 0,
        decisions: [],
        informationSelections: [],
        confirmationBiasScore: 0,
        startTime: null,
        metrics: {
            positiveSelections: 0,
            negativeSelections: 0,
            neutralSelections: 0
        }
    };

    // 确认偏误评分计算
    const CBSCalculator = {
        /**
         * 计算确认偏误评分
         * CBS = (P_pos - P_neg) / (P_pos + P_neg + P_neu)
         */
        calculate: function(metrics) {
            const { positiveSelections, negativeSelections, neutralSelections } = metrics;
            const total = positiveSelections + negativeSelections + neutralSelections;
            
            if (total === 0) return 0;
            
            const cbs = (positiveSelections - negativeSelections) / total;
            return Math.round(cbs * 100) / 100; // 保留两位小数
        },

        interpret: function(cbs) {
            if (cbs > 0.3) return { level: 'strong', label: '强确认偏误', color: '#e74c3c' };
            if (cbs > 0.1) return { level: 'moderate', label: '中等确认偏误', color: '#f39c12' };
            if (cbs >= -0.1) return { level: 'balanced', label: '相对平衡', color: '#27ae60' };
            return { level: 'reverse', label: '逆向偏误', color: '#3498db' };
        }
    };

    // 决策记录
    const DecisionTracker = {
        record: function(roundId, decision, context) {
            state.decisions.push({
                round: roundId,
                decision: decision,
                timestamp: Date.now(),
                context: context
            });
        },

        analyze: function() {
            return {
                totalDecisions: state.decisions.length,
                biasScore: state.confirmationBiasScore,
                patterns: this.identifyPatterns()
            };
        },

        identifyPatterns: function() {
            const patterns = [];
            
            // 检查是否偏向正面信息
            if (state.metrics.positiveSelections > state.metrics.negativeSelections * 2) {
                patterns.push({
                    type: 'positive_bias',
                    description: '倾向于选择正面信息'
                });
            }
            
            // 检查社交认同影响
            const socialDecision = state.decisions.find(d => d.round === 'round-3');
            if (socialDecision && socialDecision.decision === 'friend') {
                patterns.push({
                    type: 'social_influence',
                    description: '受社交认同影响较大'
                });
            }
            
            return patterns;
        }
    };

    // 觉醒时刻触发器
    const AwakeningTrigger = {
        triggers: {
            unexpected_loss: {
                check: function(decision, outcome) {
                    return decision.risk !== 'none' && outcome.loss > 0.3;
                },
                message: '意外的亏损揭示了被忽视的风险',
                intensity: 'high'
            },
            information_gap_revealed: {
                check: function(selections, missedInfo) {
                    return missedInfo.filter(i => i.bias === 'negative').length > 2;
                },
                message: '回顾信息选择，发现关键风险被遗漏',
                intensity: 'medium'
            },
            pattern_recognition: {
                check: function(cbs) {
                    return cbs > 0.2;
                },
                message: '识别出自己在信息处理中的选择偏好',
                intensity: 'high'
            }
        },

        evaluate: function(context) {
            const triggered = [];
            
            for (const [key, trigger] of Object.entries(this.triggers)) {
                if (trigger.check(context)) {
                    triggered.push({
                        type: key,
                        message: trigger.message,
                        intensity: trigger.intensity
                    });
                }
            }
            
            return triggered;
        }
    };

    // 场景路由器主类
    class InvestmentConfirmationBiasRouter {
        constructor(container, apiClient) {
            this.container = container;
            this.apiClient = apiClient;
            this.scenarioData = null;
            this.state = state;
        }

        async initialize() {
            try {
                // 加载场景数据
                this.scenarioData = await this.loadScenarioData();
                state.startTime = Date.now();
                
                // 渲染初始界面
                this.renderIntro();
                
                Logger?.debug('投资确认偏误场景初始化完成');
            } catch (error) {
                Logger?.error('场景初始化失败:', error);
                this.showError('场景加载失败，请刷新页面重试');
            }
        }

        async loadScenarioData() {
            // 尝试从API加载
            if (this.apiClient) {
                try {
                    const data = await this.apiClient.getScenario(SCENARIO_ID);
                    if (data) return data;
                } catch (e) {
                    if (typeof Logger !== 'undefined') {
                        Logger.warn('InvestmentRouter', 'API加载失败，使用本地数据');
                    }
                }
            }
            
            // 返回默认场景数据
            return this.getDefaultScenarioData();
        }

        getDefaultScenarioData() {
            return {
                id: SCENARIO_ID,
                name: SCENARIO_NAME,
                phases: [
                    {
                        id: 'phase-1-initial',
                        name: '初步印象',
                        rounds: [
                            {
                                round: 1,
                                title: '公司概况',
                                context: '未来科技是一家成立于3年前的科技公司...',
                                information: [
                                    { type: 'news', content: '正面消息1', bias: 'positive' },
                                    { type: 'analyst', content: '正面消息2', bias: 'positive' }
                                ]
                            }
                        ]
                    }
                ]
            };
        }

        renderIntro() {
            const html = `
                <div class="scenario-intro">
                    <h1>${SCENARIO_NAME}</h1>
                    <p class="description">${this.scenarioData.fullDescription || '体验确认偏误如何影响投资决策'}</p>
                    <div class="instructions">
                        <h3>场景说明</h3>
                        <p>${this.scenarioData.instructions?.intro || ''}</p>
                        <p class="warning">${this.scenarioData.instructions?.warning || ''}</p>
                    </div>
                    <button class="start-btn" onclick="window.investmentConfirmationBiasRouter.startScenario()">
                        开始场景
                    </button>
                </div>
            `;
            
            HTMLSanitizer?.setInnerHTML(this.container, html);
        }

        startScenario() {
            state.currentPhase = 0;
            state.currentRound = 0;
            this.renderCurrentRound();
        }

        renderCurrentRound() {
            const phase = this.scenarioData.phases[state.currentPhase];
            if (!phase) {
                this.renderConclusion();
                return;
            }

            const round = phase.rounds[state.currentRound];
            if (!round) {
                state.currentPhase++;
                state.currentRound = 0;
                this.renderCurrentRound();
                return;
            }

            this.renderRound(round);
        }

        renderRound(round) {
            let html = `
                <div class="scenario-round">
                    <div class="round-header">
                        <span class="phase-name">${this.scenarioData.phases[state.currentPhase].name}</span>
                        <h2>${round.title}</h2>
                    </div>
                    <div class="round-context">
                        <p>${round.context}</p>
                    </div>
            `;

            // 渲染信息
            if (round.information) {
                html += '<div class="information-panel">';
                round.information.forEach((info, index) => {
                    html += `
                        <div class="info-item ${info.bias}" data-info-id="${info.id || index}">
                            <span class="info-type">${this.getInfoTypeLabel(info.type)}</span>
                            <p>${info.content}</p>
                            ${info.source ? `<span class="info-source">来源: ${info.source}</span>` : ''}
                        </div>
                    `;
                });
                html += '</div>';
            }

            // 渲染决策
            if (round.decision) {
                html += this.renderDecision(round.decision, round.round);
            }

            html += '</div>';
            HTMLSanitizer?.setInnerHTML(this.container, html);
        }

        renderDecision(decision, roundId) {
            let html = `
                <div class="decision-panel">
                    <h3>${decision.question}</h3>
            `;

            if (decision.type === 'multi_select') {
                html += '<div class="multi-select-options">';
                decision.options.forEach((option, index) => {
                    html += `
                        <label class="option-item">
                            <input type="checkbox" name="decision-${roundId}" value="${option.id}" 
                                   onchange="window.investmentConfirmationBiasRouter.trackSelection('${option.bias}', this.checked)">
                            <span>${option.text}</span>
                        </label>
                    `;
                });
                html += `
                    </div>
                    <button onclick="window.investmentConfirmationBiasRouter.submitMultiSelect(${roundId})">
                        确认选择 (已选: <span id="selection-count">0</span>/${decision.maxSelections || 3})
                    </button>
                `;
            } else {
                html += '<div class="single-select-options">';
                decision.options.forEach((option) => {
                    html += `
                        <button class="option-btn" 
                                onclick="window.investmentConfirmationBiasRouter.makeDecision(${roundId}, '${option.id}', ${option.biasScore || 0})">
                            ${option.text}
                        </button>
                    `;
                });
                html += '</div>';
            }

            html += '</div>';
            return html;
        }

        trackSelection(bias, isSelected) {
            if (isSelected) {
                state.informationSelections.push(bias);
                if (bias === 'positive') state.metrics.positiveSelections++;
                else if (bias === 'negative') state.metrics.negativeSelections++;
                else state.metrics.neutralSelections++;
            } else {
                const index = state.informationSelections.indexOf(bias);
                if (index > -1) {
                    state.informationSelections.splice(index, 1);
                    if (bias === 'positive') state.metrics.positiveSelections--;
                    else if (bias === 'negative') state.metrics.negativeSelections--;
                    else state.metrics.neutralSelections--;
                }
            }
            
            // 更新选择计数
            const countEl = document.getElementById('selection-count');
            if (countEl) {
                countEl.textContent = state.informationSelections.length;
            }

            // 实时计算CBS
            state.confirmationBiasScore = CBSCalculator.calculate(state.metrics);
            Logger?.debug('当前CBS:', state.confirmationBiasScore);
        }

        makeDecision(roundId, optionId, biasScore) {
            DecisionTracker.record(`round-${roundId}`, optionId, { biasScore });
            
            // 根据决策更新指标
            if (biasScore > 0) {
                state.metrics.positiveSelections += biasScore;
            } else if (biasScore < 0) {
                state.metrics.negativeSelections += Math.abs(biasScore);
            }

            state.confirmationBiasScore = CBSCalculator.calculate(state.metrics);

            // 前进到下一轮
            state.currentRound++;
            this.renderCurrentRound();
        }

        submitMultiSelect(roundId) {
            DecisionTracker.record(`round-${roundId}`, state.informationSelections.slice(), state.metrics);
            state.informationSelections = [];
            state.currentRound++;
            this.renderCurrentRound();
        }

        renderConclusion() {
            // 计算最终CBS
            state.confirmationBiasScore = CBSCalculator.calculate(state.metrics);
            const interpretation = CBSCalculator.interpret(state.confirmationBiasScore);

            // 评估觉醒时刻
            const awakenings = AwakeningTrigger.evaluate({
                ...state,
                loss: 0.4 // 模拟亏损
            });

            const html = `
                <div class="scenario-conclusion">
                    <h1>场景结束</h1>
                    
                    <div class="analysis-section">
                        <h2>您的确认偏误分析</h2>
                        <div class="cbs-result" style="color: ${interpretation.color}">
                            <span class="cbs-value">${state.confirmationBiasScore.toFixed(2)}</span>
                            <span class="cbs-label">${interpretation.label}</span>
                        </div>
                        <div class="metrics-breakdown">
                            <p>正面信息选择: ${state.metrics.positiveSelections}</p>
                            <p>负面信息选择: ${state.metrics.negativeSelections}</p>
                            <p>中性信息选择: ${state.metrics.neutralSelections}</p>
                        </div>
                    </div>

                    ${awakenings.length > 0 ? `
                        <div class="awakening-section">
                            <h2>觉醒时刻</h2>
                            ${awakenings.map(a => `
                                <div class="awakening-item intensity-${a.intensity}">
                                    <p>${a.message}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="learning-section">
                        <h2>学习要点</h2>
                        <ul>
                            <li>确认偏误使我们倾向于寻找支持自己观点的证据</li>
                            <li>忽视反面信息可能导致错误的投资决策</li>
                            <li>主动寻找反面观点是克服确认偏误的关键</li>
                        </ul>
                    </div>

                    <div class="action-buttons">
                        <button onclick="window.investmentConfirmationBiasRouter.restart()">重新开始</button>
                        <button onclick="window.location.href='/scenarios.html'">返回场景列表</button>
                    </div>
                </div>
            `;

            HTMLSanitizer?.setInnerHTML(this.container, html);
        }

        restart() {
            // 重置状态
            state.currentPhase = 0;
            state.currentRound = 0;
            state.decisions = [];
            state.informationSelections = [];
            state.confirmationBiasScore = 0;
            state.metrics = {
                positiveSelections: 0,
                negativeSelections: 0,
                neutralSelections: 0
            };
            state.startTime = Date.now();

            this.renderIntro();
        }

        getInfoTypeLabel(type) {
            const labels = {
                news: '新闻',
                analyst: '分析师',
                financial: '财务',
                market: '市场',
                risk: '风险',
                management: '管理层',
                competition: '竞争',
                regulation: '监管',
                scenario: '场景'
            };
            return labels[type] || type;
        }

        showError(message) {
            HTMLSanitizer?.setInnerHTML(this.container, `)
                <div class="error-message">
                    <p>${message}</p>
                    <button onclick="window.location.reload()">刷新页面</button>
                </div>
            `;
        }
    }

    // 导出
    global.InvestmentConfirmationBiasRouter = InvestmentConfirmationBiasRouter;

    // 全局访问点
    global.investmentConfirmationBiasRouter = null;

    // 初始化函数
    global.initInvestmentConfirmationBias = function(containerId, apiClient) {
        const container = document.getElementById(containerId);
        if (!container) {
            Logger?.error('Container not found:', containerId);
            return null;
        }

        global.investmentConfirmationBiasRouter = new InvestmentConfirmationBiasRouter(container, apiClient);
        global.investmentConfirmationBiasRouter.initialize();
        
        return global.investmentConfirmationBiasRouter;
    };

})(typeof window !== 'undefined' ? window : global);

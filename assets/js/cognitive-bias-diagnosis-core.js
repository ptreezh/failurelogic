/**
 * 认知偏差深度诊断模块
 * Cognitive Bias Deep Diagnosis Module
 * 
 * 核心使命：精准识别用户的认知偏差模式，提供个性化干预
 * 
 * 功能：
 * - 认知偏差模式识别
 * - 偏差严重程度评估
 * - 个性化干预策略生成
 * - 学习效果追踪
 * 
 * 创建时间：2026-03-13
 * 来源：Soul核心进化 - 认知偏差教育核心
 */

(function(global) {
    'use strict';

    // ============================================
    // 认知偏差类型定义（核心知识）
    // ============================================
    const BiasTypes = {
        LINEAR_THINKING: {
            id: 'linear_thinking',
            name: '线性思维陷阱',
            description: '将复杂非线性系统简化为线性因果关系',
            symptoms: ['忽视延迟效应', '低估反馈回路', '过度外推趋势'],
            interventions: ['系统动力学训练', '延迟效应体验', '反馈回路可视化']
        },
        CONFIRMATION_BIAS: {
            id: 'confirmation_bias',
            name: '确认偏误',
            description: '倾向于寻找支持现有信念的证据',
            symptoms: ['选择性注意', '信息过滤', '解释偏向'],
            interventions: ['反面证据搜索练习', '多角度分析训练', ' devil\'s advocate']
        },
        TIME_DELAY_BLINDNESS: {
            id: 'time_delay_blindness',
            name: '时间延迟盲点',
            description: '低估决策效果的延迟显现',
            symptoms: ['即时满足偏好', '延迟忽视', '短期思维'],
            interventions: ['延迟效应模拟', '长期后果追踪', '系统响应可视化']
        },
        OVERCONFIDENCE: {
            id: 'overconfidence',
            name: '过度自信',
            description: '对自己的判断能力过度自信',
            symptoms: ['预测过于精确', '忽视不确定性', '低估风险'],
            interventions: ['概率思维训练', '预测记录与回顾', '不确定性量化']
        },
        SUNK_COST_FALLACY: {
            id: 'sunk_cost_fallacy',
            name: '沉没成本谬误',
            description: '因已投入成本而继续错误决策',
            symptoms: ['坚持错误', '追加投入', '不愿止损'],
            interventions: ['机会成本意识训练', '未来导向决策', '止损策略学习']
        },
        ANCHORING_EFFECT: {
            id: 'anchoring_effect',
            name: '锚定效应',
            description: '过度依赖初始信息',
            symptoms: ['初始价格敏感', '第一印象依赖', '调整不足'],
            interventions: ['多锚点比较', '独立估值训练', '锚定意识提醒']
        },
        EXPONENT_BLINDNESS: {
            id: 'exponent_blindness',
            name: '指数盲点',
            description: '低估指数增长的力量',
            symptoms: ['复利忽视', '增长低估', '时间价值误判'],
            interventions: ['复利可视化', '指数增长模拟', '长期投资教育']
        },
        SYSTEM_BLINDNESS: {
            id: 'system_blindness',
            name: '系统盲点',
            description: '忽视复杂系统的涌现性',
            symptoms: ['局部优化', '整体忽视', '非线性误判'],
            interventions: ['系统思维训练', '涌现性体验', '整体视角培养']
        }
    };

    // ============================================
    // 认知偏差诊断器
    // ============================================
    class CognitiveBiasDiagnoser {
        constructor() {
            this.diagnosisHistory = [];
            this.patternThresholds = {
                strong: 0.7,
                moderate: 0.4,
                weak: 0.2
            };
        }

        /**
         * 诊断用户决策中的认知偏差
         * @param {Object} decision - 用户决策数据
         * @param {Object} context - 场景上下文
         * @returns {Object} 诊断结果
         */
        diagnose(decision, context) {
            const biases = [];
            
            // 线性思维检测
            const linearScore = this._detectLinearThinking(decision, context);
            if (linearScore > this.patternThresholds.weak) {
                biases.push({
                    type: BiasTypes.LINEAR_THINKING,
                    score: linearScore,
                    severity: this._getSeverity(linearScore),
                    evidence: this._extractEvidence(decision, 'linear_thinking')
                });
            }
            
            // 确认偏误检测
            const confirmScore = this._detectConfirmationBias(decision, context);
            if (confirmScore > this.patternThresholds.weak) {
                biases.push({
                    type: BiasTypes.CONFIRMATION_BIAS,
                    score: confirmScore,
                    severity: this._getSeverity(confirmScore),
                    evidence: this._extractEvidence(decision, 'confirmation_bias')
                });
            }
            
            // 时间延迟盲点检测
            const delayScore = this._detectTimeDelayBlindness(decision, context);
            if (delayScore > this.patternThresholds.weak) {
                biases.push({
                    type: BiasTypes.TIME_DELAY_BLINDNESS,
                    score: delayScore,
                    severity: this._getSeverity(delayScore),
                    evidence: this._extractEvidence(decision, 'time_delay_blindness')
                });
            }
            
            // 指数盲点检测
            const exponentScore = this._detectExponentBlindness(decision, context);
            if (exponentScore > this.patternThresholds.weak) {
                biases.push({
                    type: BiasTypes.EXPONENT_BLINDNESS,
                    score: exponentScore,
                    severity: this._getSeverity(exponentScore),
                    evidence: this._extractEvidence(decision, 'exponent_blindness')
                });
            }
            
            // 过度自信检测
            const confidenceScore = this._detectOverconfidence(decision, context);
            if (confidenceScore > this.patternThresholds.weak) {
                biases.push({
                    type: BiasTypes.OVERCONFIDENCE,
                    score: confidenceScore,
                    severity: this._getSeverity(confidenceScore),
                    evidence: this._extractEvidence(decision, 'overconfidence')
                });
            }
            
            // 沉没成本检测
            const sunkCostScore = this._detectSunkCostFallacy(decision, context);
            if (sunkCostScore > this.patternThresholds.weak) {
                biases.push({
                    type: BiasTypes.SUNK_COST_FALLACY,
                    score: sunkCostScore,
                    severity: this._getSeverity(sunkCostScore),
                    evidence: this._extractEvidence(decision, 'sunk_cost_fallacy')
                });
            }
            
            // 按严重程度排序
            biases.sort((a, b) => b.score - a.score);
            
            // 记录诊断历史
            this.diagnosisHistory.push({
                timestamp: Date.now(),
                decision,
                biases: biases.map(b => ({ type: b.type.id, score: b.score }))
            });
            
            return {
                biases,
                summary: this._generateSummary(biases),
                recommendations: this._generateRecommendations(biases)
            };
        }

        /**
         * 检测线性思维
         */
        _detectLinearThinking(decision, context) {
            let score = 0;
            let factors = 0;
            
            // 检查是否忽视延迟
            if (decision.expectedTime && context.actualTime) {
                const timeDiff = Math.abs(decision.expectedTime - context.actualTime);
                if (decision.expectedTime < context.actualTime * 0.5) {
                    score += 0.8; // 严重低估延迟
                } else if (decision.expectedTime < context.actualTime * 0.8) {
                    score += 0.4; // 轻度低估
                }
                factors++;
            }
            
            // 检查是否忽视反馈回路
            if (decision.ignoredFeedbacks && decision.ignoredFeedbacks.length > 0) {
                score += Math.min(1, decision.ignoredFeedbacks.length * 0.3);
                factors++;
            }
            
            // 检查是否线性外推
            if (decision.linearExtrapolation) {
                score += 0.6;
                factors++;
            }
            
            return factors > 0 ? score / factors : 0;
        }

        /**
         * 检测确认偏误
         */
        _detectConfirmationBias(decision, context) {
            let score = 0;
            
            // 信息选择偏向分析
            if (decision.informationChoices) {
                const supportiveCount = decision.informationChoices.filter(
                    i => i.supportsInitialBelief
                ).length;
                const totalCount = decision.informationChoices.length;
                
                if (totalCount > 0) {
                    const bias = Math.abs(supportiveCount / totalCount - 0.5) * 2;
                    score += bias;
                }
            }
            
            // CBS评分（确认偏误评分）
            if (decision.cbsScore !== undefined) {
                score = Math.max(score, Math.abs(decision.cbsScore));
            }
            
            return Math.min(1, score);
        }

        /**
         * 检测时间延迟盲点
         */
        _detectTimeDelayBlindness(decision, context) {
            let score = 0;
            
            // 即时满足偏好
            if (decision.preferredImmediateReward && context.delayedRewardHigher) {
                score += 0.7;
            }
            
            // 延迟忽视
            if (decision.ignoredDelayFactor) {
                score += 0.5;
            }
            
            // 短期思维
            if (decision.timeHorizon && decision.timeHorizon < context.optimalTimeHorizon * 0.5) {
                score += 0.6;
            }
            
            return Math.min(1, score);
        }

        /**
         * 检测指数盲点
         */
        _detectExponentBlindness(decision, context) {
            let score = 0;
            
            // 检查对指数增长的估计
            if (decision.exponentialEstimate && context.actualExponential) {
                const ratio = decision.exponentialEstimate / context.actualExponential;
                if (ratio < 0.3) {
                    score += 0.8; // 严重低估
                } else if (ratio < 0.6) {
                    score += 0.5; // 中度低估
                }
            }
            
            // 复利忽视
            if (decision.ignoredCompounding) {
                score += 0.6;
            }
            
            return Math.min(1, score);
        }

        /**
         * 检测过度自信
         */
        _detectOverconfidence(decision, context) {
            let score = 0;
            
            // 置信度与实际准确率差距
            if (decision.confidence && decision.correct !== undefined) {
                const gap = decision.confidence - (decision.correct ? 1 : 0);
                if (gap > 0.3) {
                    score += gap;
                }
            }
            
            // 预测范围过窄
            if (decision.predictionRange && context.optimalRange) {
                if (decision.predictionRange < context.optimalRange * 0.5) {
                    score += 0.5;
                }
            }
            
            return Math.min(1, score);
        }

        /**
         * 检测沉没成本谬误
         */
        _detectSunkCostFallacy(decision, context) {
            let score = 0;
            
            // 是否考虑沉没成本
            if (decision.consideredSunkCost && decision.sunkCostAmount > 0) {
                score += 0.7;
            }
            
            // 是否因为沉没成本而坚持
            if (decision.persistenceDueToSunkCost) {
                score += 0.8;
            }
            
            // 是否拒绝止损
            if (decision.refusedStopLoss && context.shouldStopLoss) {
                score += 0.9;
            }
            
            return Math.min(1, score);
        }

        /**
         * 获取严重程度
         */
        _getSeverity(score) {
            if (score >= this.patternThresholds.strong) return 'strong';
            if (score >= this.patternThresholds.moderate) return 'moderate';
            return 'weak';
        }

        /**
         * 提取证据
         */
        _extractEvidence(decision, biasType) {
            const evidences = {
                linear_thinking: [
                    decision.linearExpectation ? `线性预期: ${decision.linearExpectation}` : null,
                    decision.ignoredFeedbacks ? `忽视的反馈: ${decision.ignoredFeedbacks.length}个` : null
                ].filter(Boolean),
                confirmation_bias: [
                    decision.cbsScore ? `CBS评分: ${decision.cbsScore.toFixed(2)}` : null,
                    decision.informationBias ? `信息偏向: ${decision.informationBias}` : null
                ].filter(Boolean),
                time_delay_blindness: [
                    decision.timeHorizon ? `时间视野: ${decision.timeHorizon}周期` : null,
                    decision.delayAwareness ? `延迟意识: ${decision.delayAwareness}` : null
                ].filter(Boolean),
                exponent_blindness: [
                    decision.exponentialEstimate ? `指数估计: ${decision.exponentialEstimate}` : null,
                    decision.ignoredCompounding ? '忽视复利效应' : null
                ].filter(Boolean),
                overconfidence: [
                    decision.confidence ? `置信度: ${(decision.confidence * 100).toFixed(0)}%` : null,
                    decision.correct !== undefined ? `实际正确: ${decision.correct ? '是' : '否'}` : null
                ].filter(Boolean),
                sunk_cost_fallacy: [
                    decision.sunkCostAmount ? `沉没成本: ${decision.sunkCostAmount}` : null,
                    decision.persistenceDueToSunkCost ? '因沉没成本坚持' : null
                ].filter(Boolean)
            };
            
            return evidences[biasType] || [];
        }

        /**
         * 生成诊断摘要
         */
        _generateSummary(biases) {
            if (biases.length === 0) {
                return {
                    overall: 'healthy',
                    message: '未检测到明显的认知偏差模式',
                    suggestion: '继续保持当前的思维方式'
                };
            }
            
            const strongBiases = biases.filter(b => b.severity === 'strong');
            const moderateBiases = biases.filter(b => b.severity === 'moderate');
            
            let overall = 'needs_attention';
            if (strongBiases.length > 0) overall = 'critical';
            else if (moderateBiases.length > 1) overall = 'moderate';
            
            return {
                overall,
                message: this._getOverallMessage(biases),
                strongBiasCount: strongBiases.length,
                moderateBiasCount: moderateBiases.length,
                primaryBias: biases[0].type.name
            };
        }

        /**
         * 获取整体消息
         */
        _getOverallMessage(biases) {
            const names = biases.slice(0, 3).map(b => b.type.name).join('、');
            if (biases.length === 1) {
                return `检测到 ${names} 倾向`;
            } else if (biases.length <= 3) {
                return `检测到多种认知偏差: ${names}`;
            } else {
                return `检测到 ${biases.length} 种认知偏差模式`;
            }
        }

        /**
         * 生成个性化干预建议
         */
        _generateRecommendations(biases) {
            const recommendations = [];
            
            for (const bias of biases) {
                const interventions = bias.type.interventions;
                const priority = bias.severity === 'strong' ? 'high' : 
                                bias.severity === 'moderate' ? 'medium' : 'low';
                
                recommendations.push({
                    biasType: bias.type.name,
                    priority,
                    interventions: interventions.map(i => ({
                        description: i,
                        relevance: this._calculateInterventionRelevance(i, bias)
                    })),
                    immediate: interventions[0] // 最相关的干预
                });
            }
            
            // 按优先级排序
            recommendations.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            
            return recommendations;
        }

        /**
         * 计算干预相关性
         */
        _calculateInterventionRelevance(intervention, bias) {
            // 简化的相关性计算
            if (bias.score > 0.7) return 'high';
            if (bias.score > 0.4) return 'medium';
            return 'low';
        }

        /**
         * 获取诊断历史统计
         */
        getHistoryStats() {
            if (this.diagnosisHistory.length === 0) {
                return null;
            }
            
            const biasCounts = {};
            for (const record of this.diagnosisHistory) {
                for (const bias of record.biases) {
                    biasCounts[bias.type] = (biasCounts[bias.type] || 0) + 1;
                }
            }
            
            return {
                totalDiagnoses: this.diagnosisHistory.length,
                biasFrequency: biasCounts,
                mostCommonBias: Object.entries(biasCounts)
                    .sort((a, b) => b[1] - a[1])[0]?.[0]
            };
        }
    }

    // ============================================
    // 认知干预效果追踪器
    // ============================================
    class InterventionTracker {
        constructor() {
            this.interventions = [];
            this.outcomes = [];
        }

        /**
         * 记录干预
         */
        recordIntervention(intervention) {
            this.interventions.push({
                ...intervention,
                timestamp: Date.now()
            });
        }

        /**
         * 记录结果
         */
        recordOutcome(outcome) {
            this.outcomes.push({
                ...outcome,
                timestamp: Date.now()
            });
            
            // 匹配最近的干预
            const recentIntervention = this.interventions
                .filter(i => i.userId === outcome.userId)
                .sort((a, b) => b.timestamp - a.timestamp)[0];
            
            if (recentIntervention) {
                recentIntervention.outcome = outcome;
                recentIntervention.effective = this._assessEffectiveness(recentIntervention, outcome);
            }
        }

        /**
         * 评估干预效果
         */
        _assessEffectiveness(intervention, outcome) {
            // 简化评估：检查偏差分数是否下降
            if (outcome.biasScoreAfter !== undefined && intervention.biasScoreBefore !== undefined) {
                return outcome.biasScoreAfter < intervention.biasScoreBefore;
            }
            return null;
        }

        /**
         * 获取有效干预策略
         */
        getEffectiveInterventions(biasType) {
            return this.interventions
                .filter(i => i.biasType === biasType && i.effective === true)
                .map(i => i.description);
        }
    }

    // ============================================
    // 认知偏差教育核心管理器
    // ============================================
    class CognitiveBiasEducationCore {
        constructor() {
            this.diagnoser = new CognitiveBiasDiagnoser();
            this.tracker = new InterventionTracker();
            this.biasTypes = BiasTypes;
        }

        /**
         * 完整诊断流程
         */
        runFullDiagnosis(userId, decision, context) {
            // 1. 诊断
            const diagnosis = this.diagnoser.diagnose(decision, context);
            
            // 2. 生成干预计划
            const interventionPlan = this._createInterventionPlan(userId, diagnosis);
            
            // 3. 记录
            for (const rec of diagnosis.recommendations) {
                this.tracker.recordIntervention({
                    userId,
                    biasType: rec.biasType,
                    description: rec.immediate,
                    biasScoreBefore: diagnosis.biases.find(b => b.type.name === rec.biasType)?.score
                });
            }
            
            return {
                diagnosis,
                interventionPlan,
                awakeningMoment: this._generateAwakeningMoment(diagnosis)
            };
        }

        /**
         * 创建干预计划
         */
        _createInterventionPlan(userId, diagnosis) {
            const plan = {
                userId,
                createdAt: Date.now(),
                phases: []
            };
            
            // 即时干预阶段
            const immediateBiases = diagnosis.biases.filter(b => b.severity === 'strong');
            if (immediateBiases.length > 0) {
                plan.phases.push({
                    phase: 'immediate',
                    description: '即时认知觉醒',
                    actions: immediateBiases.map(b => ({
                        bias: b.type.name,
                        action: b.type.interventions[0],
                        timing: 'now'
                    }))
                });
            }
            
            // 短期训练阶段
            const moderateBiases = diagnosis.biases.filter(b => b.severity === 'moderate');
            if (moderateBiases.length > 0) {
                plan.phases.push({
                    phase: 'short_term',
                    description: '短期认知训练',
                    duration: '1-2周',
                    actions: moderateBiases.flatMap(b => 
                        b.type.interventions.slice(0, 2).map(i => ({
                            bias: b.type.name,
                            action: i
                        }))
                    )
                });
            }
            
            // 长期培养阶段
            if (diagnosis.biases.length > 0) {
                plan.phases.push({
                    phase: 'long_term',
                    description: '长期思维模式培养',
                    duration: '持续',
                    focus: diagnosis.biases.map(b => b.type.name)
                });
            }
            
            return plan;
        }

        /**
         * 生成觉醒时刻
         */
        _generateAwakeningMoment(diagnosis) {
            if (diagnosis.biases.length === 0) {
                return null;
            }
            
            const primaryBias = diagnosis.biases[0];
            
            return {
                type: 'cognitive_awakening',
                biasType: primaryBias.type.name,
                severity: primaryBias.severity,
                message: this._craftAwakeningMessage(primaryBias),
                insight: this._generateInsight(primaryBias),
                visualCue: this._suggestVisualCue(primaryBias)
            };
        }

        /**
         * 构建觉醒消息
         */
        _craftAwakeningMessage(bias) {
            const templates = {
                linear_thinking: '您刚才的决策似乎假设了简单的因果关系，但现实往往更加复杂...',
                confirmation_bias: '注意！您可能正在寻找支持自己观点的证据，而忽略了其他信息...',
                time_delay_blindness: '这个决策的效果不会立即显现，但时间会带来意想不到的变化...',
                exponent_blindness: '指数增长的力量往往被低估，这可能改变您的判断...',
                overconfidence: '您的信心似乎超出了实际准确性，让我们重新审视...',
                sunk_cost_fallacy: '过去的投入不应影响未来的决策，每个选择都应该基于未来价值...'
            };
            
            return templates[bias.type.id] || `检测到 ${bias.type.name} 的迹象`;
        }

        /**
         * 生成洞察
         */
        _generateInsight(bias) {
            return {
                title: bias.type.name,
                description: bias.type.description,
                why: this._explainWhy(bias),
                howToImprove: bias.type.interventions[0]
            };
        }

        /**
         * 解释原因
         */
        _explainWhy(bias) {
            const explanations = {
                linear_thinking: '人类大脑习惯于简化复杂问题，但复杂系统往往有非线性特性',
                confirmation_bias: '我们天生倾向于保护自己的信念，这导致选择性注意',
                time_delay_blindness: '即时满足的进化偏好让我们难以感知延迟效果',
                exponent_blindness: '大脑对指数增长的直觉判断能力较弱',
                overconfidence: '成功经验容易让我们高估自己的预测能力',
                sunk_cost_fallacy: '损失厌恶让我们难以放弃已经投入的资源'
            };
            
            return explanations[bias.type.id] || '';
        }

        /**
         * 建议视觉提示
         */
        _suggestVisualCue(bias) {
            const cues = {
                linear_thinking: 'feedback_loop_diagram',
                confirmation_bias: 'information_balance_chart',
                time_delay_blindness: 'delay_effect_animation',
                exponent_blindness: 'exponential_growth_curve',
                overconfidence: 'confidence_accuracy_gap',
                sunk_cost_fallacy: 'future_value_comparison'
            };
            
            return cues[bias.type.id] || 'general_bias_indicator';
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            BiasTypes,
            CognitiveBiasDiagnoser,
            InterventionTracker,
            CognitiveBiasEducationCore
        };
    } else {
        global.BiasTypes = BiasTypes;
        global.CognitiveBiasDiagnoser = CognitiveBiasDiagnoser;
        global.InterventionTracker = InterventionTracker;
        global.CognitiveBiasEducationCore = CognitiveBiasEducationCore;
    }

})(typeof window !== 'undefined' ? window : this);

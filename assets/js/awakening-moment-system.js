/**
 * 觉醒时刻触发系统
 * Awakening Moment System
 * 
 * 核心使命：在用户认知冲突时触发深刻的觉醒体验
 * 
 * 功能：
 * - 认知冲突检测
 * - 反直觉结果揭示
 * - 觉醒程度量化
 * - 反思引导生成
 * 
 * 创建时间：2026-03-14
 * 来源：Soul核心进化 - 认知偏差教育核心
 */

(function(global) {
    'use strict';

    // ============================================
    // 觉醒时刻类型定义
    // ============================================
    const AwakeningTypes = {
        EXPECTATION_GAP: {
            id: 'expectation_gap',
            name: '预期落差',
            description: '当结果与预期严重不符时触发'
        },
        COUNTER_INTUITIVE: {
            id: 'counter_intuitive',
            name: '反直觉发现',
            description: '当系统行为与直觉相反时触发'
        },
        PATTERN_RECOGNITION: {
            id: 'pattern_recognition',
            name: '模式识别',
            description: '当用户意识到自己的思维模式时触发'
        },
        SYSTEM_INSIGHT: {
            id: 'system_insight',
            name: '系统洞察',
            description: '当用户理解复杂系统行为时触发'
        },
        DELAYED_REALIZATION: {
            id: 'delayed_realization',
            name: '延迟觉醒',
            description: '当延迟效应显现时触发'
        }
    };

    // ============================================
    // 认知冲突检测器
    // ============================================
    class CognitiveConflictDetector {
        constructor() {
            this.thresholds = {
                gapRatio: 0.3,        // 预期差距比例阈值
                surpriseLevel: 0.5,   // 惊讶程度阈值
                conflictScore: 0.4    // 冲突分数阈值
            };
            this.conflictHistory = [];
        }

        /**
         * 检测认知冲突
         */
        detect(expected, actual, context = {}) {
            const gap = this._calculateGap(expected, actual);
            const surpriseLevel = this._calculateSurprise(gap, context);
            const conflictScore = this._calculateConflictScore(gap, surpriseLevel, context);
            
            const conflict = {
                detected: conflictScore > this.thresholds.conflictScore,
                gap,
                surpriseLevel,
                conflictScore,
                type: this._determineConflictType(gap, context),
                timestamp: Date.now()
            };

            if (conflict.detected) {
                this.conflictHistory.push(conflict);
            }

            return conflict;
        }

        /**
         * 计算预期差距
         */
        _calculateGap(expected, actual) {
            if (typeof expected === 'number' && typeof actual === 'number') {
                const absolute = Math.abs(expected - actual);
                const relative = absolute / Math.max(Math.abs(expected), Math.abs(actual), 1);
                return { absolute, relative, direction: actual > expected ? 'higher' : 'lower' };
            }
            
            if (typeof expected === 'string' && typeof actual === 'string') {
                return {
                    absolute: expected === actual ? 0 : 1,
                    relative: expected === actual ? 0 : 1,
                    direction: 'different'
                };
            }
            
            return { absolute: 1, relative: 1, direction: 'unknown' };
        }

        /**
         * 计算惊讶程度
         */
        _calculateSurprise(gap, context) {
            // 基础惊讶程度来自预期差距
            let surprise = gap.relative;
            
            // 根据用户信心调整
            if (context.confidence) {
                surprise *= context.confidence; // 越自信越惊讶
            }
            
            // 根据先验知识调整
            if (context.priorKnowledge) {
                surprise *= (1 - context.priorKnowledge * 0.5); // 有知识则减少惊讶
            }
            
            return Math.min(1, surprise);
        }

        /**
         * 计算冲突分数
         */
        _calculateConflictScore(gap, surprise, context) {
            const weights = {
                gap: 0.4,
                surprise: 0.4,
                context: 0.2
            };
            
            let score = gap.relative * weights.gap + surprise * weights.surprise;
            
            // 上下文因素
            if (context.isCritical) score += 0.1;
            if (context.hasHistory) score -= 0.1;
            
            return Math.min(1, Math.max(0, score));
        }

        /**
         * 确定冲突类型
         */
        _determineConflictType(gap, context) {
            if (context.isDelayed) return AwakeningTypes.DELAYED_REALIZATION;
            if (context.isSystemLevel) return AwakeningTypes.SYSTEM_INSIGHT;
            if (context.isPattern) return AwakeningTypes.PATTERN_RECOGNITION;
            if (gap.relative > 0.7) return AwakeningTypes.COUNTER_INTUITIVE;
            return AwakeningTypes.EXPECTATION_GAP;
        }

        /**
         * 获取冲突模式
         */
        getConflictPattern() {
            if (this.conflictHistory.length < 3) return null;
            
            const recentConflicts = this.conflictHistory.slice(-5);
            const types = recentConflicts.map(c => c.type.id);
            
            // 找出最频繁的冲突类型
            const frequency = {};
            for (const type of types) {
                frequency[type] = (frequency[type] || 0) + 1;
            }
            
            const dominantType = Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])[0];
            
            return {
                dominantType: dominantType[0],
                frequency: dominantType[1],
                pattern: dominantType[1] > types.length * 0.5
            };
        }
    }

    // ============================================
    // 反直觉揭示器
    // ============================================
    class CounterIntuitiveRevealer {
        constructor() {
            this.revelations = new Map();
            this._initRevelations();
        }

        /**
         * 初始化反直觉知识库
         */
        _initRevelations() {
            // 咖啡店线性思维的反直觉
            this.revelations.set('coffee_shop_linear', {
                scenario: 'coffee-shop-nonlinear-effects',
                intuition: '增加广告投入会带来更多顾客',
                reality: '短期有效，但长期可能因产能瓶颈导致服务质量下降，反而流失顾客',
                explanation: '线性思维忽略了系统中的延迟和反馈回路'
            });
            
            // 关系投资的反直觉
            this.revelations.set('relationship_investment_delay', {
                scenario: 'relationship-time-delay',
                intuition: '立即投入会立即得到回报',
                reality: '关系投资的回报有显著延迟，急于求成反而可能破坏关系',
                explanation: '时间延迟效应使得投入和回报不同步'
            });
            
            // 确认偏误的反直觉
            this.revelations.set('investment_confirmation_blind', {
                scenario: 'investment-confirmation-bias',
                intuition: '深入研究支持自己观点的证据是明智的',
                reality: '这可能强化确认偏误，导致错误决策',
                explanation: '过度关注支持性证据会忽视关键风险信号'
            });
            
            // 投资信息处理的反直觉
            this.revelations.set('investment_info_anchor', {
                scenario: 'investment-information-processing',
                intuition: '第一印象和初始信息是决策的重要参考',
                reality: '锚定效应会让你过度依赖初始信息，错过更好的机会',
                explanation: '大脑倾向于过度依赖首先获得的信息'
            });
            
            // 商业战略的反直觉
            this.revelations.set('business_strategy_nonlinear', {
                scenario: 'game-001',
                intuition: '线性增长策略可以持续扩展业务',
                reality: '复杂商业系统中存在临界点和相变，线性策略可能在某点突然失效',
                explanation: '系统盲点让人忽视非线性转折点'
            });
            
            // 公共政策的反直觉
            this.revelations.set('public_policy_delay', {
                scenario: 'game-002',
                intuition: '政策效果应该立竿见影',
                reality: '社会系统的延迟效应使得政策效果可能在数年后才显现',
                explanation: '时间延迟盲点导致对政策效果的误判'
            });
            
            // 个人理财的反直觉
            this.revelations.set('personal_finance_compound', {
                scenario: 'game-003',
                intuition: '小额投资的复利效应微不足道',
                reality: '长期复利可以让小投资变成大财富，但人们往往低估其力量',
                explanation: '指数盲点使人无法直觉理解复利的威力'
            });
            
            // 气候变化的反直觉
            this.revelations.set('climate_system_feedback', {
                scenario: 'adv-game-001',
                intuition: '减少排放的效果应该立即可见',
                reality: '气候系统的巨大惯性和反馈回路使得效果有几十年延迟',
                explanation: '系统盲点和时间延迟效应的共同作用'
            });
            
            // AI治理的反直觉
            this.revelations.set('ai_governance_emergence', {
                scenario: 'ai-governance-regulation',
                intuition: 'AI系统的风险是可预测和可控的',
                reality: '复杂AI系统会展现出设计者未曾预期的涌现行为',
                explanation: '过度自信和系统盲点导致低估涌现性风险'
            });
            
            // 金融危机的反直觉
            this.revelations.set('financial_crisis_cascade', {
                scenario: 'financial-crisis-response',
                intuition: '救助个别机构可以阻止危机蔓延',
                reality: '道德风险和系统性关联可能导致更大的连锁反应',
                explanation: '线性思维和系统盲点掩盖了复杂的传导路径'
            });
            
            // 泰坦尼克的反直觉
            this.revelations.set('titanic_overconfidence', {
                scenario: 'hist-002',
                intuition: '"永不沉没"的声明代表真实的信心',
                reality: '过度自信和确认偏误导致忽视明显的安全警告',
                explanation: '历史教训：过度自信是灾难的催化剂'
            });
            
            // 猪湾事件的反直觉
            this.revelations.set('pig_bay_groupthink', {
                scenario: 'hist-003',
                intuition: '集体决策比个人决策更可靠',
                reality: '群体思维可能导致更极端的错误决策',
                explanation: '确认偏误在群体中被放大，形成回声室效应'
            });
            
            // 恋爱关系的反直觉
            this.revelations.set('love_initial_idealization', {
                scenario: 'love-relationship-001',
                intuition: '强烈的第一印象是真爱',
                reality: '理想化倾向可能掩盖真实的兼容性问题',
                explanation: '确认偏误让人只看到想看到的特质'
            });
            
            // 长期关系的反直觉
            this.revelations.set('love_longterm_sunkcost', {
                scenario: 'love-relationship-002',
                intuition: '投入越多越不应该放弃',
                reality: '沉没成本谬误可能让你困在不健康的关系中',
                explanation: '时间延迟和沉没成本共同扭曲判断'
            });
        }

        /**
         * 揭示反直觉结果
         */
        reveal(scenarioId, decisionType) {
            const key = `${scenarioId}_${decisionType}`;
            const revelation = this.revelations.get(key);
            
            if (!revelation) {
                return this._generateGenericRevelation(scenarioId);
            }
            
            return {
                found: true,
                ...revelation,
                impact: this._calculateImpact(revelation)
            };
        }

        /**
         * 生成通用揭示
         */
        _generateGenericRevelation(scenarioId) {
            return {
                found: false,
                scenario: scenarioId,
                intuition: '您的直觉判断',
                reality: '系统的复杂行为',
                explanation: '复杂系统往往有反直觉的特性',
                impact: 'moderate'
            };
        }

        /**
         * 计算影响程度
         */
        _calculateImpact(revelation) {
            // 基于解释复杂度和现实差异度计算
            return 'significant';
        }
    }

    // ============================================
    // 觉醒程度量化器
    // ============================================
    class AwakeningQuantifier {
        constructor() {
            this.levels = {
                subtle: { range: [0, 0.3], label: '轻微觉醒', color: '#90EE90' },
                moderate: { range: [0.3, 0.6], label: '中度觉醒', color: '#FFD700' },
                strong: { range: [0.6, 0.85], label: '强烈觉醒', color: '#FFA500' },
                profound: { range: [0.85, 1.0], label: '深刻觉醒', color: '#FF4500' }
            };
        }

        /**
         * 量化觉醒程度
         */
        quantify(conflict, revelation, context = {}) {
            // 基础分数来自冲突强度
            let score = conflict.conflictScore * 0.4;
            
            // 加上反直觉因素
            if (revelation.found) {
                score += 0.3;
            }
            
            // 上下文因素
            if (context.isFirstTime) score += 0.1;
            if (context.emotionalIntensity) score += context.emotionalIntensity * 0.1;
            if (context.decisionImportance) score += context.decisionImportance * 0.1;
            
            // 限制在0-1范围
            score = Math.min(1, Math.max(0, score));
            
            // 确定等级
            const level = this._determineLevel(score);
            
            return {
                score,
                level: level.label,
                color: level.color,
                description: this._generateDescription(score, level)
            };
        }

        /**
         * 确定等级
         */
        _determineLevel(score) {
            for (const level of Object.values(this.levels)) {
                if (score >= level.range[0] && score < level.range[1]) {
                    return level;
                }
            }
            return this.levels.profound;
        }

        /**
         * 生成描述
         */
        _generateDescription(score, level) {
            const descriptions = {
                subtle: '您开始注意到一些不同寻常的地方...',
                moderate: '这个发现让您重新思考了一些假设',
                strong: '一个重要的认知突破正在发生！',
                profound: '这是改变思维方式的深刻时刻！'
            };
            return descriptions[level.label] || '';
        }
    }

    // ============================================
    // 反思引导生成器
    // ============================================
    class ReflectionGuideGenerator {
        constructor() {
            this.templates = this._initTemplates();
        }

        /**
         * 初始化反思模板
         */
        _initTemplates() {
            return {
                expectation_gap: [
                    '您预期会发生什么？实际发生了什么？',
                    '是什么因素导致了这种差距？',
                    '下次遇到类似情况，您会如何调整预期？'
                ],
                counter_intuitive: [
                    '为什么结果与您的直觉相反？',
                    '系统中有什么隐藏的机制在起作用？',
                    '这个发现如何改变您的思维方式？'
                ],
                delayed_realization: [
                    '延迟效应是如何逐步显现的？',
                    '您是否在早期错过了某些信号？',
                    '时间因素如何影响系统的行为？'
                ],
                system_insight: [
                    '系统中有哪些相互关联的部分？',
                    '这些部分如何相互影响？',
                    '您发现了什么样的反馈回路？'
                ],
                pattern_recognition: [
                    '您在这次决策中看到了什么样的模式？',
                    '这种模式是否也在其他地方出现过？',
                    '理解这个模式对您有什么帮助？'
                ]
            };
        }

        /**
         * 生成反思引导
         */
        generate(awakeningType, context = {}) {
            const questions = this.templates[awakeningType] || this.templates.expectation_gap;
            
            return {
                type: awakeningType,
                questions: this._personalizeQuestions(questions, context),
                exercises: this._generateExercises(awakeningType, context),
                nextSteps: this._suggestNextSteps(awakeningType)
            };
        }

        /**
         * 个性化问题
         */
        _personalizeQuestions(questions, context) {
            return questions.map(q => {
                if (context.scenario) {
                    q = q.replace('这个发现', `在${context.scenario}中的发现`);
                }
                return q;
            });
        }

        /**
         * 生成练习
         */
        _generateExercises(awakeningType, context) {
            const exercises = {
                expectation_gap: [
                    { type: 'journal', description: '记录您过去三次预期与现实的差距' },
                    { type: 'scenario', description: '重新运行场景，尝试不同的决策' }
                ],
                counter_intuitive: [
                    { type: 'analysis', description: '分析系统中可能存在的反直觉机制' },
                    { type: 'discussion', description: '与他人讨论这个反直觉发现' }
                ],
                delayed_realization: [
                    { type: 'timeline', description: '绘制决策效果的时间线' },
                    { type: 'prediction', description: '预测未来可能显现的延迟效应' }
                ]
            };
            
            return exercises[awakeningType] || exercises.expectation_gap;
        }

        /**
         * 建议下一步
         */
        _suggestNextSteps(awakeningType) {
            const steps = {
                expectation_gap: '尝试在下一个场景中应用新的预期调整策略',
                counter_intuitive: '探索更多具有反直觉特性的场景',
                delayed_realization: '在决策前考虑更长的时间范围',
                system_insight: '尝试识别其他系统中的类似模式',
                pattern_recognition: '有意识地观察日常生活中的类似模式'
            };
            
            return steps[awakeningType] || '继续探索并应用您的洞察';
        }
    }

    // ============================================
    // 觉醒时刻系统
    // ============================================
    class AwakeningMomentSystem {
        constructor() {
            this.conflictDetector = new CognitiveConflictDetector();
            this.revealer = new CounterIntuitiveRevealer();
            this.quantifier = new AwakeningQuantifier();
            this.guideGenerator = new ReflectionGuideGenerator();
            this.awakeningHistory = [];
        }

        /**
         * 处理决策结果，检测觉醒时刻
         */
        process(expected, actual, context = {}) {
            // 1. 检测认知冲突
            const conflict = this.conflictDetector.detect(expected, actual, context);
            
            if (!conflict.detected) {
                return { awakened: false, conflict };
            }
            
            // 2. 揭示反直觉结果
            const revelation = this.revealer.reveal(
                context.scenarioId || 'unknown',
                context.decisionType || 'unknown'
            );
            
            // 3. 量化觉醒程度
            const awakening = this.quantifier.quantify(conflict, revelation, context);
            
            // 4. 生成反思引导
            const reflection = this.guideGenerator.generate(
                conflict.type.id,
                context
            );
            
            // 5. 组装觉醒时刻
            const moment = {
                awakened: true,
                timestamp: Date.now(),
                conflict,
                revelation,
                awakening,
                reflection,
                message: this._craftAwakeningMessage(awakening, conflict)
            };
            
            // 记录历史
            this.awakeningHistory.push(moment);
            
            return moment;
        }

        /**
         * 构建觉醒消息
         */
        _craftAwakeningMessage(awakening, conflict) {
            const prefix = {
                subtle: '💭',
                moderate: '💡',
                strong: '🌟',
                profound: '✨'
            };
            
            const emoji = prefix[awakening.level] || '💭';
            
            return {
                emoji,
                title: `${awakening.level} - ${conflict.type.name}`,
                body: awakening.description,
                cta: '点击深入了解'
            };
        }

        /**
         * 获取觉醒统计
         */
        getStats() {
            if (this.awakeningHistory.length === 0) {
                return { total: 0 };
            }
            
            const types = {};
            const levels = {};
            
            for (const moment of this.awakeningHistory) {
                const typeId = moment.conflict.type.id;
                types[typeId] = (types[typeId] || 0) + 1;
                
                const level = moment.awakening.level;
                levels[level] = (levels[level] || 0) + 1;
            }
            
            return {
                total: this.awakeningHistory.length,
                types,
                levels,
                averageScore: this.awakeningHistory.reduce((sum, m) => 
                    sum + m.awakening.score, 0) / this.awakeningHistory.length
            };
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            AwakeningTypes,
            CognitiveConflictDetector,
            CounterIntuitiveRevealer,
            AwakeningQuantifier,
            ReflectionGuideGenerator,
            AwakeningMomentSystem
        };
    } else {
        global.AwakeningTypes = AwakeningTypes;
        global.CognitiveConflictDetector = CognitiveConflictDetector;
        global.CounterIntuitiveRevealer = CounterIntuitiveRevealer;
        global.AwakeningQuantifier = AwakeningQuantifier;
        global.ReflectionGuideGenerator = ReflectionGuideGenerator;
        global.AwakeningMomentSystem = AwakeningMomentSystem;
    }

})(typeof window !== 'undefined' ? window : this);
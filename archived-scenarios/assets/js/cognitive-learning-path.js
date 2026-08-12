/**
 * 认知学习路径模块
 * Cognitive Learning Path Module
 * 
 * 功能：
 * - 基于用户认知风格生成个性化学习路径
 * - 追踪学习进度和认知成长
 * - 智能推荐下一个学习场景
 * - 认知模式分析与可视化
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环15
 */

(function(global) {
    'use strict';

    // ============================================
    // 认知风格枚举
    // ============================================
    const CognitiveStyle = {
        ANALYTICAL: 'analytical',     // 分析型 - 喜欢数据驱动决策
        INTUITIVE: 'intuitive',       // 直觉型 - 依赖直觉和经验
        BALANCED: 'balanced',         // 平衡型 - 综合分析
        RISK_TAKER: 'risk_taker',     // 风险偏好型 - 喜欢高风险高回报
        RISK_AVERSE: 'risk_averse',   // 风险规避型 - 偏好稳定安全
        SYSTEMATIC: 'systematic',     // 系统型 - 理解复杂系统
        LINEAR: 'linear'              // 线性型 - 简单因果关系
    };

    // ============================================
    // 认知偏差类型枚举
    // ============================================
    const BiasType = {
        LINEAR_THINKING: 'linear_thinking',
        TIME_DELAY_BLINDNESS: 'time_delay_blindness',
        CONFIRMATION_BIAS: 'confirmation_bias',
        OVERCONFIDENCE: 'overconfidence',
        ANCHORING: 'anchoring',
        AVAILABILITY: 'availability',
        SUNK_COST: 'sunk_cost',
        COMPOUND_BLINDNESS: 'compound_blindness',
        SYSTEM_BLINDNESS: 'system_blindness',
        FEEDBACK_BLINDNESS: 'feedback_blindness'
    };

    // ============================================
    // 学习难度级别
    // ============================================
    const DifficultyLevel = {
        BEGINNER: 'beginner',
        INTERMEDIATE: 'intermediate',
        ADVANCED: 'advanced',
        EXPERT: 'expert'
    };

    // ============================================
    // 认知风格检测器
    // ============================================
    class CognitiveStyleDetector {
        constructor() {
            this.decisionHistory = [];
            this.styleScores = {};
            Object.values(CognitiveStyle).forEach(style => {
                this.styleScores[style] = 0;
            });
        }

        /**
         * 记录决策并更新风格评分
         * @param {Object} decision - 决策数据
         */
        recordDecision(decision) {
            this.decisionHistory.push({
                ...decision,
                timestamp: Date.now()
            });
            this._analyzeDecision(decision);
        }

        /**
         * 分析决策并更新风格评分
         */
        _analyzeDecision(decision) {
            const { option, context, timeSpent, informationUsed } = decision;

            // 分析型 vs 直觉型
            if (informationUsed && informationUsed.length > 3) {
                this.styleScores[CognitiveStyle.ANALYTICAL] += 2;
            } else if (timeSpent && timeSpent < 5000) {
                this.styleScores[CognitiveStyle.INTUITIVE] += 2;
            }

            // 风险偏好 vs 风险规避
            if (option === '1' || option === 'aggressive') {
                this.styleScores[CognitiveStyle.RISK_TAKER] += 1;
            } else if (option === '4' || option === 'conservative') {
                this.styleScores[CognitiveStyle.RISK_AVERSE] += 1;
            }

            // 系统型 vs 线性型
            if (context && context.complexity > 3) {
                this.styleScores[CognitiveStyle.SYSTEMATIC] += 1;
            } else {
                this.styleScores[CognitiveStyle.LINEAR] += 1;
            }
        }

        /**
         * 获取主要认知风格
         * @returns {string} 认知风格
         */
        getPrimaryStyle() {
            let maxScore = 0;
            let primaryStyle = CognitiveStyle.BALANCED;

            for (const [style, score] of Object.entries(this.styleScores)) {
                if (score > maxScore) {
                    maxScore = score;
                    primaryStyle = style;
                }
            }

            return primaryStyle;
        }

        /**
         * 获取风格分布
         * @returns {Object} 风格分布数据
         */
        getStyleDistribution() {
            const total = Object.values(this.styleScores).reduce((a, b) => a + b, 0) || 1;
            const distribution = {};

            for (const [style, score] of Object.entries(this.styleScores)) {
                distribution[style] = {
                    score: score,
                    percentage: (score / total * 100).toFixed(1)
                };
            }

            return distribution;
        }
    }

    // ============================================
    // 认知偏差评估器
    // ============================================
    class CognitiveBiasAssessor {
        constructor() {
            this.biasScores = {};
            Object.values(BiasType).forEach(bias => {
                this.biasScores[bias] = {
                    score: 0,
                    instances: 0,
                    severity: 'low'
                };
            });
        }

        /**
         * 评估决策中的认知偏差
         * @param {Object} decision - 决策数据
         * @param {Object} outcome - 决策结果
         */
        assessDecision(decision, outcome) {
            // 线性思维检测
            if (decision.expectedLinear && !outcome.wasLinear) {
                this.biasScores[BiasType.LINEAR_THINKING].score += 1;
                this.biasScores[BiasType.LINEAR_THINKING].instances += 1;
            }

            // 时间延迟盲点检测
            if (decision.ignoredDelay) {
                this.biasScores[BiasType.TIME_DELAY_BLINDNESS].score += 1;
                this.biasScores[BiasType.TIME_DELAY_BLINDNESS].instances += 1;
            }

            // 确认偏误检测
            if (decision.selectiveInformation) {
                this.biasScores[BiasType.CONFIRMATION_BIAS].score += 1;
                this.biasScores[BiasType.CONFIRMATION_BIAS].instances += 1;
            }

            // 过度自信检测
            if (decision.confidence > 80 && outcome.accuracy < 50) {
                this.biasScores[BiasType.OVERCONFIDENCE].score += 2;
                this.biasScores[BiasType.OVERCONFIDENCE].instances += 1;
            }

            // 更新严重程度
            this._updateSeverity();
        }

        /**
         * 更新偏差严重程度
         */
        _updateSeverity() {
            for (const bias of Object.keys(this.biasScores)) {
                const score = this.biasScores[bias].score;
                if (score >= 5) {
                    this.biasScores[bias].severity = 'high';
                } else if (score >= 2) {
                    this.biasScores[bias].severity = 'medium';
                } else {
                    this.biasScores[bias].severity = 'low';
                }
            }
        }

        /**
         * 获取主要偏差
         * @returns {Array} 主要认知偏差列表
         */
        getPrimaryBiases() {
            return Object.entries(this.biasScores)
                .filter(([_, data]) => data.severity !== 'low')
                .sort((a, b) => b[1].score - a[1].score)
                .map(([bias, data]) => ({
                    type: bias,
                    ...data
                }));
        }

        /**
         * 获取偏差改进建议
         * @returns {Array} 改进建议
         */
        getImprovementSuggestions() {
            const suggestions = [];
            const primaryBiases = this.getPrimaryBiases();

            const suggestionMap = {
                [BiasType.LINEAR_THINKING]: {
                    title: '培养系统思维',
                    description: '学会识别复杂系统中的非线性关系',
                    exercises: ['咖啡店非线性效应场景', '系统动力学入门']
                },
                [BiasType.TIME_DELAY_BLINDNESS]: {
                    title: '理解时间延迟效应',
                    description: '认识决策效果的延迟显现',
                    exercises: ['恋爱关系时间延迟场景', '投资复利效应']
                },
                [BiasType.CONFIRMATION_BIAS]: {
                    title: '克服确认偏误',
                    description: '学会客观评估所有证据',
                    exercises: ['投资确认偏误场景', '信息处理训练']
                },
                [BiasType.OVERCONFIDENCE]: {
                    title: '校准自信水平',
                    description: '认识认知局限，保持谦逊',
                    exercises: ['风险决策训练', '概率思维练习']
                }
            };

            for (const bias of primaryBiases) {
                if (suggestionMap[bias.type]) {
                    suggestions.push({
                        biasType: bias.type,
                        severity: bias.severity,
                        ...suggestionMap[bias.type]
                    });
                }
            }

            return suggestions;
        }
    }

    // ============================================
    // 学习路径生成器
    // ============================================
    class LearningPathGenerator {
        constructor(scenarios) {
            this.scenarios = scenarios || [];
            this.completedScenarios = [];
            this.skillProgress = {};
        }

        /**
         * 生成个性化学习路径
         * @param {Object} userProfile - 用户画像
         * @returns {Object} 学习路径
         */
        generatePath(userProfile) {
            const { cognitiveStyle, primaryBiases, currentLevel } = userProfile;

            // 筛选适合的场景
            const suitableScenarios = this._filterSuitableScenarios(
                cognitiveStyle,
                primaryBiases,
                currentLevel
            );

            // 生成学习序列
            const learningSequence = this._createLearningSequence(
                suitableScenarios,
                userProfile
            );

            // 创建里程碑
            const milestones = this._createMilestones(learningSequence);

            return {
                userId: userProfile.id || 'anonymous',
                generatedAt: new Date().toISOString(),
                currentLevel: currentLevel,
                targetLevel: this._getNextLevel(currentLevel),
                totalScenarios: learningSequence.length,
                estimatedTime: this._estimateTime(learningSequence),
                sequence: learningSequence,
                milestones: milestones,
                skillProgress: this.skillProgress
            };
        }

        /**
         * 筛选适合的场景
         */
        _filterSuitableScenarios(style, biases, level) {
            return this.scenarios.filter(scenario => {
                // 难度匹配
                if (!this._matchesLevel(scenario.difficulty, level)) {
                    return false;
                }

                // 检查是否已完成
                if (this.completedScenarios.includes(scenario.id)) {
                    return false;
                }

                return true;
            });
        }

        /**
         * 检查难度是否匹配
         */
        _matchesLevel(scenarioDifficulty, userLevel) {
            const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
            const scenarioIndex = levelOrder.indexOf(scenarioDifficulty);
            const userIndex = levelOrder.indexOf(userLevel);
            return scenarioIndex <= userIndex + 1;
        }

        /**
         * 创建学习序列
         */
        _createLearningSequence(scenarios, userProfile) {
            // 按相关性和难度排序
            const sortedScenarios = [...scenarios].sort((a, b) => {
                const relevanceA = this._calculateRelevance(a, userProfile);
                const relevanceB = this._calculateRelevance(b, userProfile);
                return relevanceB - relevanceA;
            });

            return sortedScenarios.map((scenario, index) => ({
                order: index + 1,
                scenarioId: scenario.id,
                scenarioName: scenario.name,
                difficulty: scenario.difficulty,
                estimatedDuration: scenario.estimatedDuration || 20,
                targetSkills: scenario.targetPatterns || [],
                status: 'pending',
                relevance: this._calculateRelevance(scenario, userProfile)
            }));
        }

        /**
         * 计算场景相关性
         */
        _calculateRelevance(scenario, userProfile) {
            let relevance = 50; // 基础分

            // 如果场景针对用户的认知偏差
            if (scenario.targetPatterns) {
                for (const bias of userProfile.primaryBiases) {
                    if (scenario.targetPatterns.includes(bias.type)) {
                        relevance += 20;
                    }
                }
            }

            // 难度适配加分
            if (scenario.difficulty === userProfile.currentLevel) {
                relevance += 15;
            }

            return Math.min(100, relevance);
        }

        /**
         * 创建学习里程碑
         */
        _createMilestones(sequence) {
            const milestones = [];
            const step = Math.ceil(sequence.length / 5);

            for (let i = 0; i < sequence.length; i += step) {
                const endIndex = Math.min(i + step, sequence.length);
                milestones.push({
                    id: `milestone_${milestones.length + 1}`,
                    name: `阶段 ${milestones.length + 1} 完成`,
                    startIndex: i,
                    endIndex: endIndex - 1,
                    requiredScenarios: endIndex - i,
                    reward: {
                        title: this._getMilestoneTitle(milestones.length),
                        description: '完成阶段学习，解锁新能力'
                    }
                });
            }

            return milestones;
        }

        /**
         * 获取里程碑标题
         */
        _getMilestoneTitle(index) {
            const titles = [
                '认知觉醒者',
                '思维探索者',
                '系统思考者',
                '决策大师',
                '智慧领航者'
            ];
            return titles[index] || `阶段${index + 1}`;
        }

        /**
         * 估算学习时间
         */
        _estimateTime(sequence) {
            const totalMinutes = sequence.reduce((sum, s) => sum + s.estimatedDuration, 0);
            return {
                totalMinutes: totalMinutes,
                hours: Math.floor(totalMinutes / 60),
                minutes: totalMinutes % 60,
                formatted: `${Math.floor(totalMinutes / 60)}小时${totalMinutes % 60}分钟`
            };
        }

        /**
         * 获取下一个难度级别
         */
        _getNextLevel(currentLevel) {
            const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
            const index = levels.indexOf(currentLevel);
            return index < levels.length - 1 ? levels[index + 1] : 'expert';
        }

        /**
         * 更新学习进度
         */
        updateProgress(scenarioId, result) {
            this.completedScenarios.push(scenarioId);

            // 更新技能进度
            if (result.skillsGained) {
                for (const skill of result.skillsGained) {
                    if (!this.skillProgress[skill]) {
                        this.skillProgress[skill] = { level: 0, experience: 0 };
                    }
                    this.skillProgress[skill].experience += result.score || 10;
                    this.skillProgress[skill].level = Math.floor(
                        this.skillProgress[skill].experience / 100
                    ) + 1;
                }
            }
        }
    }

    // ============================================
    // 学习进度追踪器
    // ============================================
    class LearningProgressTracker {
        constructor() {
            this.progress = {
                totalScenarios: 0,
                completedScenarios: 0,
                totalDecisions: 0,
                correctDecisions: 0,
                totalTimeSpent: 0,
                skillsAcquired: {},
                achievements: [],
                streakDays: 0,
                lastActiveDate: null
            };
        }

        /**
         * 记录场景完成
         */
        recordScenarioCompletion(scenarioId, result) {
            this.progress.totalScenarios++;
            if (result.completed) {
                this.progress.completedScenarios++;
            }
            this.progress.totalDecisions += result.decisions || 0;
            this.progress.correctDecisions += result.correctDecisions || 0;
            this.progress.totalTimeSpent += result.timeSpent || 0;

            // 更新活跃日期
            const today = new Date().toDateString();
            if (this.progress.lastActiveDate !== today) {
                const lastDate = this.progress.lastActiveDate 
                    ? new Date(this.progress.lastActiveDate) 
                    : null;
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
                    this.progress.streakDays++;
                } else {
                    this.progress.streakDays = 1;
                }
                this.progress.lastActiveDate = today;
            }

            // 检查成就
            this._checkAchievements();
        }

        /**
         * 检查并解锁成就
         */
        _checkAchievements() {
            const achievements = [
                {
                    id: 'first_scenario',
                    name: '初探认知',
                    description: '完成第一个场景',
                    condition: () => this.progress.completedScenarios >= 1
                },
                {
                    id: 'ten_scenarios',
                    name: '认知探索者',
                    description: '完成10个场景',
                    condition: () => this.progress.completedScenarios >= 10
                },
                {
                    id: 'streak_7',
                    name: '持续学习',
                    description: '连续7天学习',
                    condition: () => this.progress.streakDays >= 7
                },
                {
                    id: 'accuracy_80',
                    name: '精准决策',
                    description: '决策正确率达到80%',
                    condition: () => {
                        const rate = this.progress.correctDecisions / 
                            (this.progress.totalDecisions || 1);
                        return rate >= 0.8 && this.progress.totalDecisions >= 10;
                    }
                }
            ];

            for (const achievement of achievements) {
                if (!this.progress.achievements.includes(achievement.id) && 
                    achievement.condition()) {
                    this.progress.achievements.push(achievement.id);
                }
            }
        }

        /**
         * 获取进度统计
         */
        getStats() {
            const accuracy = this.progress.totalDecisions > 0
                ? (this.progress.correctDecisions / this.progress.totalDecisions * 100).toFixed(1)
                : 0;

            return {
                ...this.progress,
                accuracy: `${accuracy}%`,
                completionRate: this.progress.totalScenarios > 0
                    ? (this.progress.completedScenarios / this.progress.totalScenarios * 100).toFixed(1)
                    : 0,
                averageTimePerScenario: this.progress.completedScenarios > 0
                    ? Math.round(this.progress.totalTimeSpent / this.progress.completedScenarios)
                    : 0
            };
        }

        /**
         * 导出进度数据
         */
        export() {
            return JSON.stringify(this.progress);
        }

        /**
         * 导入进度数据
         */
        import(data) {
            try {
                const parsed = JSON.parse(data);
                this.progress = { ...this.progress, ...parsed };
                return true;
            } catch (e) {
                if (typeof Logger !== 'undefined') {
                    Logger.error('CognitiveLearningPath', 'Failed to load progress', e);
                }
                return false;
            }
        }
    }

    // ============================================
    // 认知学习路径管理器
    // ============================================
    class CognitiveLearningPathManager {
        constructor(config = {}) {
            this.styleDetector = new CognitiveStyleDetector();
            this.biasAssessor = new CognitiveBiasAssessor();
            this.pathGenerator = new LearningPathGenerator(config.scenarios || []);
            this.progressTracker = new LearningProgressTracker();

            this.userProfile = {
                id: config.userId || 'anonymous',
                cognitiveStyle: CognitiveStyle.BALANCED,
                primaryBiases: [],
                currentLevel: DifficultyLevel.BEGINNER
            };
        }

        /**
         * 初始化学习路径
         */
        async initialize(scenarios) {
            this.pathGenerator.scenarios = scenarios;
            return this.generatePersonalizedPath();
        }

        /**
         * 生成个性化学习路径
         */
        generatePersonalizedPath() {
            this.userProfile.cognitiveStyle = this.styleDetector.getPrimaryStyle();
            this.userProfile.primaryBiases = this.biasAssessor.getPrimaryBiases();

            return this.pathGenerator.generatePath(this.userProfile);
        }

        /**
         * 提交决策
         */
        submitDecision(decision, outcome) {
            this.styleDetector.recordDecision(decision);
            this.biasAssessor.assessDecision(decision, outcome);
        }

        /**
         * 完成场景
         */
        completeScenario(scenarioId, result) {
            this.progressTracker.recordScenarioCompletion(scenarioId, result);
            this.pathGenerator.updateProgress(scenarioId, result);

            // 更新用户等级
            if (this.progressTracker.getStats().completedScenarios >= 5) {
                this.userProfile.currentLevel = DifficultyLevel.INTERMEDIATE;
            }
            if (this.progressTracker.getStats().completedScenarios >= 10) {
                this.userProfile.currentLevel = DifficultyLevel.ADVANCED;
            }
            if (this.progressTracker.getStats().completedScenarios >= 20) {
                this.userProfile.currentLevel = DifficultyLevel.EXPERT;
            }
        }

        /**
         * 获取下一个推荐场景
         */
        getNextRecommendedScenario() {
            const path = this.pathGenerator.generatePath(this.userProfile);
            const nextPending = path.sequence.find(s => s.status === 'pending');
            return nextPending || null;
        }

        /**
         * 获取学习报告
         */
        getLearningReport() {
            return {
                userProfile: this.userProfile,
                styleDistribution: this.styleDetector.getStyleDistribution(),
                primaryBiases: this.biasAssessor.getPrimaryBiases(),
                improvementSuggestions: this.biasAssessor.getImprovementSuggestions(),
                progressStats: this.progressTracker.getStats(),
                nextRecommended: this.getNextRecommendedScenario()
            };
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CognitiveStyleDetector,
            CognitiveBiasAssessor,
            LearningPathGenerator,
            LearningProgressTracker,
            CognitiveLearningPathManager,
            CognitiveStyle,
            BiasType,
            DifficultyLevel
        };
    } else {
        global.CognitiveStyleDetector = CognitiveStyleDetector;
        global.CognitiveBiasAssessor = CognitiveBiasAssessor;
        global.LearningPathGenerator = LearningPathGenerator;
        global.LearningProgressTracker = LearningProgressTracker;
        global.CognitiveLearningPathManager = CognitiveLearningPathManager;
        global.CognitiveStyle = CognitiveStyle;
        global.BiasType = BiasType;
        global.DifficultyLevel = DifficultyLevel;
    }

})(typeof window !== 'undefined' ? window : this);

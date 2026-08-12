/**
 * 自适应学习系统模块
 * Adaptive Learning System Module
 * 
 * 功能：
 * - 学习者模型构建
 * - 知识追踪
 * - 自适应内容推送
 * - 难度调节
 * - 学习路径优化
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环20
 */

(function(global) {
    'use strict';

    // ============================================
    // 学习者模型
    // ============================================
    class LearnerModel {
        constructor(userId) {
            this.userId = userId;
            this.knowledgeState = new Map();     // 知识点掌握状态
            this.skillLevels = new Map();        // 技能水平
            this.learningStyle = null;           // 学习风格
            this.cognitiveProfile = null;        // 认知档案
            this.learningHistory = [];           // 学习历史
            this.performanceMetrics = {          // 表现指标
                totalSessions: 0,
                totalTime: 0,
                averageScore: 0,
                improvementRate: 0
            };
            this.preferences = {                 // 学习偏好
                preferredDifficulty: 'medium',
                preferredPace: 'normal',
                preferredFeedback: 'detailed',
                preferredModality: 'visual'
            };
        }

        /**
         * 更新知识状态
         */
        updateKnowledgeState(conceptId, masteryLevel, confidence = 1.0) {
            this.knowledgeState.set(conceptId, {
                masteryLevel,
                confidence,
                lastUpdated: Date.now(),
                attempts: (this.knowledgeState.get(conceptId)?.attempts || 0) + 1
            });
        }

        /**
         * 获取知识掌握度
         */
        getKnowledgeMastery(conceptId) {
            const state = this.knowledgeState.get(conceptId);
            return state ? state.masteryLevel : 0;
        }

        /**
         * 更新技能水平
         */
        updateSkillLevel(skillId, level) {
            this.skillLevels.set(skillId, {
                level,
                lastUpdated: Date.now()
            });
        }

        /**
         * 添加学习记录
         */
        addLearningRecord(record) {
            this.learningHistory.push({
                ...record,
                timestamp: Date.now()
            });
            
            // 更新指标
            this._updateMetrics(record);
        }

        /**
         * 更新表现指标
         */
        _updateMetrics(record) {
            this.performanceMetrics.totalSessions++;
            this.performanceMetrics.totalTime += record.timeSpent || 0;
            
            const scores = this.learningHistory
                .filter(r => r.score !== undefined)
                .map(r => r.score);
            
            if (scores.length > 0) {
                this.performanceMetrics.averageScore = 
                    scores.reduce((a, b) => a + b, 0) / scores.length;
            }
            
            // 计算改进率
            if (scores.length >= 4) {
                const recent = scores.slice(-4).reduce((a, b) => a + b, 0) / 4;
                const earlier = scores.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
                this.performanceMetrics.improvementRate = 
                    earlier > 0 ? (recent - earlier) / earlier : 0;
            }
        }

        /**
         * 序列化
         */
        toJSON() {
            return {
                userId: this.userId,
                knowledgeState: Object.fromEntries(this.knowledgeState),
                skillLevels: Object.fromEntries(this.skillLevels),
                learningStyle: this.learningStyle,
                cognitiveProfile: this.cognitiveProfile,
                learningHistory: this.learningHistory,
                performanceMetrics: this.performanceMetrics,
                preferences: this.preferences
            };
        }

        /**
         * 从JSON加载
         */
        fromJSON(data) {
            Object.assign(this, data);
            this.knowledgeState = new Map(Object.entries(this.knowledgeState || {}));
            this.skillLevels = new Map(Object.entries(this.skillLevels || {}));
            return this;
        }
    }

    // ============================================
    // 知识追踪器 (基于IRT理论的简化版)
    // ============================================
    class KnowledgeTracer {
        constructor() {
            this.difficultyParams = new Map();  // 题目难度参数
            this.abilityEstimates = new Map();  // 能力估计
        }

        /**
         * 设置题目难度
         */
        setItemDifficulty(itemId, difficulty, discrimination = 1.0, guessing = 0.25) {
            this.difficultyParams.set(itemId, {
                difficulty,      // b参数
                discrimination,  // a参数
                guessing         // c参数
            });
        }

        /**
         * 估计正确概率 (3PL模型)
         */
        estimateProbability(itemId, ability) {
            const params = this.difficultyParams.get(itemId);
            if (!params) return 0.5;
            
            const { difficulty, discrimination, guessing } = params;
            
            // 3PL ICC函数
            const exponent = -discrimination * (ability - difficulty);
            const probability = guessing + (1 - guessing) / (1 + Math.exp(exponent));
            
            return probability;
        }

        /**
         * 更新能力估计 (EAP方法)
         */
        updateAbilityEstimate(userId, responses) {
            // 简化的EAP估计
            let sumScore = 0;
            let sumWeight = 0;
            
            for (const { itemId, correct } of responses) {
                const params = this.difficultyParams.get(itemId);
                if (params) {
                    const weight = params.discrimination;
                    sumScore += correct * weight;
                    sumWeight += weight;
                }
            }
            
            const ability = sumWeight > 0 ? (sumScore / sumWeight - 0.5) * 4 : 0;
            
            this.abilityEstimates.set(userId, {
                ability,
                lastUpdated: Date.now()
            });
            
            return ability;
        }

        /**
         * 获取能力估计
         */
        getAbility(userId) {
            const estimate = this.abilityEstimates.get(userId);
            return estimate ? estimate.ability : 0;
        }

        /**
         * 选择最佳下一题
         */
        selectNextItem(userId, availableItems, targetAbility = null) {
            const ability = this.getAbility(userId);
            const target = targetAbility !== null ? targetAbility : ability + 0.2;
            
            let bestItem = null;
            let bestScore = -Infinity;
            
            for (const itemId of availableItems) {
                const params = this.difficultyParams.get(itemId);
                if (!params) continue;
                
                // 选择难度接近目标的题目
                const prob = this.estimateProbability(itemId, target);
                const info = prob * (1 - prob) * params.discrimination * params.discrimination;
                
                // 优先选择信息量大的题目
                if (info > bestScore) {
                    bestScore = info;
                    bestItem = itemId;
                }
            }
            
            return bestItem;
        }
    }

    // ============================================
    // 自适应内容推送器
    // ============================================
    class AdaptiveContentPusher {
        constructor() {
            this.contentPool = new Map();  // 内容池
            this.pushHistory = new Map();  // 推送历史
        }

        /**
         * 添加内容
         */
        addContent(contentId, content) {
            this.contentPool.set(contentId, {
                id: contentId,
                type: content.type || 'lesson',
                difficulty: content.difficulty || 0.5,
                concepts: content.concepts || [],
                prerequisites: content.prerequisites || [],
                estimatedTime: content.estimatedTime || 15,
                tags: content.tags || [],
                ...content
            });
        }

        /**
         * 选择推送内容
         */
        selectContent(learnerModel, options = {}) {
            const masteredConcepts = new Set(
                Array.from(learnerModel.knowledgeState.entries())
                    .filter(([_, state]) => state.masteryLevel > 0.7)
                    .map(([conceptId]) => conceptId)
            );
            
            const currentAbility = this._estimateCurrentAbility(learnerModel);
            const targetDifficulty = this._calculateTargetDifficulty(learnerModel);
            
            // 筛选合适的内容
            const candidates = [];
            
            for (const [contentId, content] of this.contentPool) {
                // 检查前置条件
                const prereqsMet = content.prerequisites.every(p => masteredConcepts.has(p));
                if (!prereqsMet) continue;
                
                // 检查难度匹配
                const difficultyDiff = Math.abs(content.difficulty - targetDifficulty);
                if (difficultyDiff > 0.3) continue;
                
                // 检查是否已推送过
                const history = this.pushHistory.get(learnerModel.userId) || new Set();
                if (history.has(contentId)) continue;
                
                candidates.push({
                    content,
                    difficultyDiff,
                    relevance: this._calculateRelevance(content, learnerModel)
                });
            }
            
            // 排序并选择
            candidates.sort((a, b) => {
                // 先按相关性排序
                if (Math.abs(a.relevance - b.relevance) > 0.1) {
                    return b.relevance - a.relevance;
                }
                // 相关性相近时，选择难度更接近的
                return a.difficultyDiff - b.difficultyDiff;
            });
            
            return candidates.length > 0 ? candidates[0].content : null;
        }

        /**
         * 估计当前能力
         */
        _estimateCurrentAbility(learnerModel) {
            const avgMastery = Array.from(learnerModel.knowledgeState.values())
                .reduce((sum, state) => sum + state.masteryLevel, 0) / 
                Math.max(1, learnerModel.knowledgeState.size);
            
            return avgMastery * 2 - 0.5;  // 映射到能力量表
        }

        /**
         * 计算目标难度
         */
        _calculateTargetDifficulty(learnerModel) {
            const base = this._estimateCurrentAbility(learnerModel);
            
            // 根据改进率调整
            const improvement = learnerModel.performanceMetrics.improvementRate;
            const adjustment = improvement > 0.1 ? 0.1 : 
                             improvement < -0.1 ? -0.1 : 0;
            
            return Math.min(1, Math.max(0, base + 0.2 + adjustment));
        }

        /**
         * 计算内容相关性
         */
        _calculateRelevance(content, learnerModel) {
            let relevance = 0;
            
            // 检查概念匹配
            for (const concept of content.concepts) {
                const mastery = learnerModel.getKnowledgeMastery(concept);
                // 优先推荐未掌握但接近掌握的概念
                if (mastery > 0.3 && mastery < 0.7) {
                    relevance += 0.3;
                } else if (mastery < 0.3) {
                    relevance += 0.2;
                }
            }
            
            // 检查标签匹配
            const preferredTags = learnerModel.preferences.preferredTopics || [];
            for (const tag of content.tags) {
                if (preferredTags.includes(tag)) {
                    relevance += 0.1;
                }
            }
            
            return relevance;
        }

        /**
         * 记录推送
         */
        recordPush(userId, contentId) {
            if (!this.pushHistory.has(userId)) {
                this.pushHistory.set(userId, new Set());
            }
            this.pushHistory.get(userId).add(contentId);
        }
    }

    // ============================================
    // 难度调节器
    // ============================================
    class DifficultyRegulator {
        constructor() {
            this.difficultyLevels = {
                beginner: { range: [0, 0.3], label: '入门' },
                easy: { range: [0.3, 0.5], label: '简单' },
                medium: { range: [0.5, 0.7], label: '中等' },
                hard: { range: [0.7, 0.85], label: '困难' },
                expert: { range: [0.85, 1.0], label: '专家' }
            };
            
            this.adjustmentHistory = new Map();
        }

        /**
         * 获取难度级别
         */
        getDifficultyLevel(value) {
            for (const [level, config] of Object.entries(this.difficultyLevels)) {
                if (value >= config.range[0] && value < config.range[1]) {
                    return { level, ...config };
                }
            }
            return { level: 'expert', ...this.difficultyLevels.expert };
        }

        /**
         * 计算推荐难度
         */
        calculateRecommendedDifficulty(userId, performance) {
            const history = this.adjustmentHistory.get(userId) || [];
            
            // 基于最近表现计算
            let adjustment = 0;
            
            if (performance.successRate > 0.8) {
                adjustment = 0.1;  // 成功率高，增加难度
            } else if (performance.successRate < 0.5) {
                adjustment = -0.15;  // 成功率低，降低难度
            } else if (performance.successRate < 0.6) {
                adjustment = -0.05;  // 略低于目标，微调
            }
            
            // 考虑时间因素
            if (performance.averageTime < performance.expectedTime * 0.7) {
                adjustment += 0.05;  // 完成快，可以增加难度
            } else if (performance.averageTime > performance.expectedTime * 1.5) {
                adjustment -= 0.05;  // 完成慢，可能需要降低难度
            }
            
            // 平滑历史调整
            const recentAdjustments = history.slice(-5);
            if (recentAdjustments.length > 0) {
                const avgAdjustment = recentAdjustments.reduce((a, b) => a + b, 0) / recentAdjustments.length;
                adjustment = adjustment * 0.7 + avgAdjustment * 0.3;
            }
            
            // 记录调整
            history.push(adjustment);
            this.adjustmentHistory.set(userId, history.slice(-20));
            
            return adjustment;
        }

        /**
         * 应用难度调节
         */
        applyDifficultyAdjustment(baseDifficulty, adjustment) {
            const newDifficulty = baseDifficulty + adjustment;
            return Math.max(0, Math.min(1, newDifficulty));
        }
    }

    // ============================================
    // 学习路径优化器
    // ============================================
    class LearningPathOptimizer {
        constructor() {
            this.conceptGraph = new Map();  // 概念依赖图
            this.pathCache = new Map();     // 路径缓存
        }

        /**
         * 添加概念依赖
         */
        addConceptDependency(concept, prerequisites = [], next = []) {
            this.conceptGraph.set(concept, {
                prerequisites,
                next,
                addedAt: Date.now()
            });
            this.pathCache.clear();
        }

        /**
         * 生成学习路径
         */
        generatePath(learnerModel, targetConcepts, options = {}) {
            const path = [];
            const visited = new Set();
            const mastered = new Set(
                Array.from(learnerModel.knowledgeState.entries())
                    .filter(([_, state]) => state.masteryLevel > 0.7)
                    .map(([conceptId]) => conceptId)
            );
            
            // 拓扑排序
            const queue = [...targetConcepts];
            
            while (queue.length > 0) {
                const concept = queue.shift();
                
                if (visited.has(concept)) continue;
                
                const dependencies = this.conceptGraph.get(concept);
                if (dependencies) {
                    // 检查前置依赖
                    const unmetPrereqs = dependencies.prerequisites
                        .filter(p => !mastered.has(p) && !visited.has(p));
                    
                    if (unmetPrereqs.length > 0) {
                        // 先学习前置依赖
                        queue.unshift(...unmetPrereqs, concept);
                        continue;
                    }
                }
                
                visited.add(concept);
                
                // 计算学习优先级
                const mastery = learnerModel.getKnowledgeMastery(concept);
                const priority = 1 - mastery;  // 掌握度越低优先级越高
                
                path.push({
                    concept,
                    priority,
                    mastery,
                    status: mastery > 0.7 ? 'mastered' : 
                           mastery > 0.3 ? 'learning' : 'new',
                    prerequisites: dependencies?.prerequisites || []
                });
            }
            
            // 排序
            path.sort((a, b) => {
                if (a.status !== b.status) {
                    const statusOrder = { new: 0, learning: 1, mastered: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                }
                return b.priority - a.priority;
            });
            
            return path;
        }

        /**
         * 优化学习序列
         */
        optimizeSequence(path, constraints = {}) {
            const {
                maxSessionTime = 30,  // 最大会话时间(分钟)
                minMasteryGain = 0.1  // 最小掌握度增益
            } = constraints;
            
            // 应用启发式规则
            const optimized = [];
            let currentTime = 0;
            
            for (const item of path) {
                if (item.status === 'mastered') continue;
                
                const estimatedTime = this._estimateLearningTime(item);
                
                if (currentTime + estimatedTime <= maxSessionTime) {
                    optimized.push({
                        ...item,
                        estimatedTime,
                        sessionOrder: optimized.length + 1
                    });
                    currentTime += estimatedTime;
                }
            }
            
            return optimized;
        }

        /**
         * 估计学习时间
         */
        _estimateLearningTime(item) {
            // 基于掌握度的简化估计
            const baseTime = 15;  // 基础时间(分钟)
            const masteryFactor = 1 - item.mastery;
            return baseTime * masteryFactor;
        }
    }

    // ============================================
    // 自适应学习管理器
    // ============================================
    class AdaptiveLearningManager {
        constructor() {
            this.learners = new Map();
            this.knowledgeTracer = new KnowledgeTracer();
            this.contentPusher = new AdaptiveContentPusher();
            this.difficultyRegulator = new DifficultyRegulator();
            this.pathOptimizer = new LearningPathOptimizer();
        }

        /**
         * 获取或创建学习者模型
         */
        getLearner(userId) {
            if (!this.learners.has(userId)) {
                this.learners.set(userId, new LearnerModel(userId));
            }
            return this.learners.get(userId);
        }

        /**
         * 处理学习交互
         */
        processInteraction(userId, interaction) {
            const learner = this.getLearner(userId);
            
            // 更新知识状态
            if (interaction.concept && interaction.mastery !== undefined) {
                learner.updateKnowledgeState(
                    interaction.concept,
                    interaction.mastery,
                    interaction.confidence
                );
            }
            
            // 添加学习记录
            learner.addLearningRecord(interaction);
            
            // 更新能力估计
            if (interaction.responses) {
                this.knowledgeTracer.updateAbilityEstimate(userId, interaction.responses);
            }
            
            return this.getRecommendations(userId);
        }

        /**
         * 获取推荐
         */
        getRecommendations(userId) {
            const learner = this.getLearner(userId);
            
            // 获取推荐内容
            const content = this.contentPusher.selectContent(learner);
            
            // 获取难度建议
            const difficulty = this.difficultyRegulator.calculateRecommendedDifficulty(
                userId,
                {
                    successRate: learner.performanceMetrics.averageScore / 100,
                    averageTime: learner.performanceMetrics.totalTime / Math.max(1, learner.performanceMetrics.totalSessions),
                    expectedTime: 15
                }
            );
            
            // 获取学习路径
            const targetConcepts = Array.from(learner.knowledgeState.keys())
                .filter(c => learner.getKnowledgeMastery(c) < 0.7);
            
            const path = this.pathOptimizer.generatePath(learner, targetConcepts);
            
            return {
                nextContent: content,
                difficultyAdjustment: difficulty,
                learningPath: path.slice(0, 5),
                abilityEstimate: this.knowledgeTracer.getAbility(userId)
            };
        }

        /**
         * 保存学习者数据
         */
        saveLearnerData(userId) {
            const learner = this.learners.get(userId);
            return learner ? learner.toJSON() : null;
        }

        /**
         * 加载学习者数据
         */
        loadLearnerData(userId, data) {
            const learner = new LearnerModel(userId);
            learner.fromJSON(data);
            this.learners.set(userId, learner);
            return learner;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            LearnerModel,
            KnowledgeTracer,
            AdaptiveContentPusher,
            DifficultyRegulator,
            LearningPathOptimizer,
            AdaptiveLearningManager
        };
    } else {
        global.LearnerModel = LearnerModel;
        global.KnowledgeTracer = KnowledgeTracer;
        global.AdaptiveContentPusher = AdaptiveContentPusher;
        global.DifficultyRegulator = DifficultyRegulator;
        global.LearningPathOptimizer = LearningPathOptimizer;
        global.AdaptiveLearningManager = AdaptiveLearningManager;
    }

})(typeof window !== 'undefined' ? window : this);

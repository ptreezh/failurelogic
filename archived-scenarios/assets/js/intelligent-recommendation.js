/**
 * 智能推荐模块
 * Intelligent Recommendation Module
 * 
 * 功能：
 * - 协同过滤推荐
 * - 内容推荐
 * - 混合推荐
 * - 个性化排序
 * - 推荐解释
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环19
 */

(function(global) {
    'use strict';

    // ============================================
    // 协同过滤推荐器
    // ============================================
    class CollaborativeFilteringRecommender {
        constructor() {
            this.userItemMatrix = new Map();  // 用户-物品评分矩阵
            this.itemUserMatrix = new Map();  // 物品-用户评分矩阵
            this.userSimilarity = new Map();  // 用户相似度缓存
            this.itemSimilarity = new Map();  // 物品相似度缓存
        }

        /**
         * 添加评分
         */
        addRating(userId, itemId, rating) {
            if (!this.userItemMatrix.has(userId)) {
                this.userItemMatrix.set(userId, new Map());
            }
            this.userItemMatrix.get(userId).set(itemId, rating);
            
            if (!this.itemUserMatrix.has(itemId)) {
                this.itemUserMatrix.set(itemId, new Map());
            }
            this.itemUserMatrix.get(itemId).set(userId, rating);
            
            // 清除缓存
            this.userSimilarity.clear();
            this.itemSimilarity.clear();
        }

        /**
         * 批量添加评分
         */
        addRatings(ratings) {
            for (const { userId, itemId, rating } of ratings) {
                this.addRating(userId, itemId, rating);
            }
        }

        /**
         * 计算余弦相似度
         */
        _cosineSimilarity(vec1, vec2) {
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            
            for (const [key, val1] of vec1) {
                const val2 = vec2.get(key) || 0;
                dotProduct += val1 * val2;
                norm1 += val1 * val1;
            }
            
            for (const val of vec2.values()) {
                norm2 += val * val;
            }
            
            const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
            return denominator > 0 ? dotProduct / denominator : 0;
        }

        /**
         * 计算用户相似度
         */
        getUserSimilarity(user1, user2) {
            const key = `${user1}:${user2}`;
            if (this.userSimilarity.has(key)) {
                return this.userSimilarity.get(key);
            }
            
            const vec1 = this.userItemMatrix.get(user1);
            const vec2 = this.userItemMatrix.get(user2);
            
            if (!vec1 || !vec2) return 0;
            
            const similarity = this._cosineSimilarity(vec1, vec2);
            this.userSimilarity.set(key, similarity);
            return similarity;
        }

        /**
         * 计算物品相似度
         */
        getItemSimilarity(item1, item2) {
            const key = `${item1}:${item2}`;
            if (this.itemSimilarity.has(key)) {
                return this.itemSimilarity.get(key);
            }
            
            const vec1 = this.itemUserMatrix.get(item1);
            const vec2 = this.itemUserMatrix.get(item2);
            
            if (!vec1 || !vec2) return 0;
            
            const similarity = this._cosineSimilarity(vec1, vec2);
            this.itemSimilarity.set(key, similarity);
            return similarity;
        }

        /**
         * 基于用户的协同过滤推荐
         */
        recommendByUser(userId, topN = 10) {
            const userRatings = this.userItemMatrix.get(userId);
            if (!userRatings) return [];
            
            // 找相似用户
            const similarUsers = [];
            for (const otherId of this.userItemMatrix.keys()) {
                if (otherId !== userId) {
                    const sim = this.getUserSimilarity(userId, otherId);
                    if (sim > 0) {
                        similarUsers.push({ userId: otherId, similarity: sim });
                    }
                }
            }
            
            similarUsers.sort((a, b) => b.similarity - a.similarity);
            
            // 计算推荐分数
            const scores = new Map();
            const ratedItems = new Set(userRatings.keys());
            
            for (const { userId: otherId, similarity } of similarUsers.slice(0, 50)) {
                const otherRatings = this.userItemMatrix.get(otherId);
                
                for (const [itemId, rating] of otherRatings) {
                    if (!ratedItems.has(itemId)) {
                        const current = scores.get(itemId) || { score: 0, weight: 0 };
                        scores.set(itemId, {
                            score: current.score + similarity * rating,
                            weight: current.weight + Math.abs(similarity)
                        });
                    }
                }
            }
            
            // 归一化并排序
            const recommendations = [];
            for (const [itemId, { score, weight }] of scores) {
                if (weight > 0) {
                    recommendations.push({
                        itemId,
                        score: score / weight,
                        method: 'user_cf'
                    });
                }
            }
            
            recommendations.sort((a, b) => b.score - a.score);
            return recommendations.slice(0, topN);
        }

        /**
         * 基于物品的协同过滤推荐
         */
        recommendByItem(userId, topN = 10) {
            const userRatings = this.userItemMatrix.get(userId);
            if (!userRatings) return [];
            
            const scores = new Map();
            
            for (const [ratedItem, rating] of userRatings) {
                // 找相似物品
                for (const [itemId] of this.itemUserMatrix) {
                    if (!userRatings.has(itemId)) {
                        const sim = this.getItemSimilarity(ratedItem, itemId);
                        if (sim > 0) {
                            const current = scores.get(itemId) || { score: 0, weight: 0 };
                            scores.set(itemId, {
                                score: current.score + sim * rating,
                                weight: current.weight + Math.abs(sim)
                            });
                        }
                    }
                }
            }
            
            const recommendations = [];
            for (const [itemId, { score, weight }] of scores) {
                if (weight > 0) {
                    recommendations.push({
                        itemId,
                        score: score / weight,
                        method: 'item_cf'
                    });
                }
            }
            
            recommendations.sort((a, b) => b.score - a.score);
            return recommendations.slice(0, topN);
        }
    }

    // ============================================
    // 内容推荐器
    // ============================================
    class ContentBasedRecommender {
        constructor() {
            this.itemFeatures = new Map();  // 物品特征
            this.userProfiles = new Map();  // 用户画像
            this.featureWeights = new Map(); // 特征权重
        }

        /**
         * 设置物品特征
         */
        setItemFeatures(itemId, features) {
            this.itemFeatures.set(itemId, features);
        }

        /**
         * 更新用户画像
         */
        updateUserProfile(userId, itemId, rating) {
            const features = this.itemFeatures.get(itemId);
            if (!features) return;
            
            if (!this.userProfiles.has(userId)) {
                this.userProfiles.set(userId, new Map());
            }
            
            const profile = this.userProfiles.get(userId);
            const weight = (rating - 2.5) / 2.5;  // 标准化到 -1 到 1
            
            for (const [feature, value] of Object.entries(features)) {
                const current = profile.get(feature) || 0;
                profile.set(feature, current + weight * value);
            }
        }

        /**
         * 推荐物品
         */
        recommend(userId, topN = 10) {
            const profile = this.userProfiles.get(userId);
            if (!profile) return [];
            
            const scores = [];
            const ratedItems = new Set();
            
            // 找出已评分物品
            for (const [itemId, features] of this.itemFeatures) {
                let score = 0;
                
                for (const [feature, profileValue] of profile) {
                    const itemValue = features[feature] || 0;
                    score += profileValue * itemValue;
                }
                
                scores.push({
                    itemId,
                    score,
                    method: 'content_based'
                });
            }
            
            scores.sort((a, b) => b.score - a.score);
            return scores.slice(0, topN);
        }

        /**
         * 计算物品相似度
         */
        getItemSimilarity(item1, item2) {
            const feat1 = this.itemFeatures.get(item1);
            const feat2 = this.itemFeatures.get(item2);
            
            if (!feat1 || !feat2) return 0;
            
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            
            for (const [key, val1] of Object.entries(feat1)) {
                const val2 = feat2[key] || 0;
                dotProduct += val1 * val2;
                norm1 += val1 * val1;
            }
            
            for (const val of Object.values(feat2)) {
                norm2 += val * val;
            }
            
            const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
            return denominator > 0 ? dotProduct / denominator : 0;
        }
    }

    // ============================================
    // 混合推荐器
    // ============================================
    class HybridRecommender {
        constructor() {
            this.cfRecommender = new CollaborativeFilteringRecommender();
            this.cbRecommender = new ContentBasedRecommender();
            this.weights = {
                userCf: 0.3,
                itemCf: 0.3,
                contentBased: 0.4
            };
        }

        /**
         * 设置权重
         */
        setWeights(weights) {
            this.weights = { ...this.weights, ...weights };
        }

        /**
         * 添加评分数据
         */
        addRating(userId, itemId, rating) {
            this.cfRecommender.addRating(userId, itemId, rating);
            this.cbRecommender.updateUserProfile(userId, itemId, rating);
        }

        /**
         * 设置物品特征
         */
        setItemFeatures(itemId, features) {
            this.cbRecommender.setItemFeatures(itemId, features);
        }

        /**
         * 混合推荐
         */
        recommend(userId, topN = 10) {
            const userCfRecs = this.cfRecommender.recommendByUser(userId, topN * 2);
            const itemCfRecs = this.cfRecommender.recommendByItem(userId, topN * 2);
            const cbRecs = this.cbRecommender.recommend(userId, topN * 2);
            
            // 合并分数
            const scores = new Map();
            
            for (const rec of userCfRecs) {
                const current = scores.get(rec.itemId) || { score: 0, methods: [] };
                scores.set(rec.itemId, {
                    score: current.score + rec.score * this.weights.userCf,
                    methods: [...current.methods, 'user_cf']
                });
            }
            
            for (const rec of itemCfRecs) {
                const current = scores.get(rec.itemId) || { score: 0, methods: [] };
                scores.set(rec.itemId, {
                    score: current.score + rec.score * this.weights.itemCf,
                    methods: [...current.methods, 'item_cf']
                });
            }
            
            for (const rec of cbRecs) {
                const current = scores.get(rec.itemId) || { score: 0, methods: [] };
                scores.set(rec.itemId, {
                    score: current.score + rec.score * this.weights.contentBased,
                    methods: [...current.methods, 'content_based']
                });
            }
            
            // 排序
            const recommendations = [];
            for (const [itemId, data] of scores) {
                recommendations.push({
                    itemId,
                    score: data.score,
                    methods: [...new Set(data.methods)]
                });
            }
            
            recommendations.sort((a, b) => b.score - a.score);
            return recommendations.slice(0, topN);
        }
    }

    // ============================================
    // 场景推荐器
    // ============================================
    class ScenarioRecommender {
        constructor() {
            this.scenarioFeatures = {
                'coffee_shop': {
                    difficulty: 0.3,
                    complexity: 0.4,
                    timeDelay: 0.8,
                    nonlinear: 0.9,
                    feedbackLoop: 0.7,
                    cognitiveLoad: 0.5
                },
                'relationship_investment': {
                    difficulty: 0.5,
                    complexity: 0.6,
                    timeDelay: 0.9,
                    nonlinear: 0.7,
                    feedbackLoop: 0.8,
                    cognitiveLoad: 0.6
                },
                'investment_confirmation': {
                    difficulty: 0.6,
                    complexity: 0.5,
                    timeDelay: 0.3,
                    nonlinear: 0.4,
                    feedbackLoop: 0.5,
                    cognitiveLoad: 0.7
                },
                'game_theory': {
                    difficulty: 0.8,
                    complexity: 0.9,
                    timeDelay: 0.4,
                    nonlinear: 0.6,
                    feedbackLoop: 0.7,
                    cognitiveLoad: 0.9
                }
            };
            
            this.hybridRecommender = new HybridRecommender();
            this.userProgress = new Map();
        }

        /**
         * 记录场景完成
         */
        recordCompletion(userId, scenarioId, score, timeSpent) {
            const rating = Math.min(5, Math.max(1, score / 20));  // 转换为1-5评分
            this.hybridRecommender.addRating(userId, scenarioId, rating);
            
            if (!this.userProgress.has(userId)) {
                this.userProgress.set(userId, new Map());
            }
            this.userProgress.get(userId).set(scenarioId, {
                score,
                timeSpent,
                completedAt: Date.now()
            });
        }

        /**
         * 推荐场景
         */
        recommendScenarios(userId, topN = 5) {
            // 获取混合推荐
            const recs = this.hybridRecommender.recommend(userId, topN * 2);
            
            // 过滤已完成的场景
            const completed = this.userProgress.get(userId);
            const filtered = recs.filter(rec => !completed || !completed.has(rec.itemId));
            
            // 添加推荐解释
            const recommendations = filtered.map(rec => ({
                scenarioId: rec.itemId,
                score: rec.score,
                methods: rec.methods,
                features: this.scenarioFeatures[rec.itemId] || {},
                explanation: this._generateExplanation(rec)
            }));
            
            return recommendations.slice(0, topN);
        }

        /**
         * 生成推荐解释
         */
        _generateExplanation(rec) {
            const explanations = [];
            
            if (rec.methods.includes('user_cf')) {
                explanations.push('与您学习风格相似的用户也喜欢这个场景');
            }
            if (rec.methods.includes('item_cf')) {
                explanations.push('与您之前喜欢的场景相似');
            }
            if (rec.methods.includes('content_based')) {
                explanations.push('符合您的学习偏好');
            }
            
            return explanations.join('；') || '为您推荐';
        }

        /**
         * 推荐学习路径
         */
        recommendLearningPath(userId) {
            const progress = this.userProgress.get(userId);
            const allScenarios = Object.keys(this.scenarioFeatures);
            
            // 分析用户水平
            let avgScore = 0;
            let count = 0;
            let totalComplexity = 0;
            
            if (progress) {
                for (const [_, data] of progress) {
                    avgScore += data.score;
                    count++;
                }
                avgScore = count > 0 ? avgScore / count : 50;
            } else {
                avgScore = 50;
            }
            
            // 根据水平推荐
            const path = [];
            const completed = new Set(progress ? progress.keys() : []);
            
            // 未完成的简单场景
            for (const scenarioId of allScenarios) {
                const features = this.scenarioFeatures[scenarioId];
                if (!completed.has(scenarioId) && features.difficulty < 0.5) {
                    path.push({ scenarioId, reason: '基础场景', priority: 1 });
                }
            }
            
            // 适合当前水平的场景
            for (const scenarioId of allScenarios) {
                const features = this.scenarioFeatures[scenarioId];
                if (!completed.has(scenarioId) && 
                    features.difficulty >= 0.5 && 
                    features.difficulty <= avgScore / 100 + 0.2) {
                    path.push({ scenarioId, reason: '适合当前水平', priority: 2 });
                }
            }
            
            // 挑战场景
            for (const scenarioId of allScenarios) {
                const features = this.scenarioFeatures[scenarioId];
                if (!completed.has(scenarioId) && features.difficulty > 0.7) {
                    path.push({ scenarioId, reason: '挑战场景', priority: 3 });
                }
            }
            
            path.sort((a, b) => a.priority - b.priority);
            return path;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CollaborativeFilteringRecommender,
            ContentBasedRecommender,
            HybridRecommender,
            ScenarioRecommender
        };
    } else {
        global.CollaborativeFilteringRecommender = CollaborativeFilteringRecommender;
        global.ContentBasedRecommender = ContentBasedRecommender;
        global.HybridRecommender = HybridRecommender;
        global.ScenarioRecommender = ScenarioRecommender;
    }

})(typeof window !== 'undefined' ? window : this);
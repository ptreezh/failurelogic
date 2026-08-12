/**
 * 用户画像建模模块
 * User Profile Modeling Module
 * 
 * 功能：
 * - 用户特征提取
 * - 行为分析
 * - 偏好建模
 * - 画像标签化
 * - 动态更新
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环20
 */

(function(global) {
    'use strict';

    // ============================================
    // 用户画像维度
    // ============================================
    const ProfileDimensions = {
        DEMOGRAPHIC: 'demographic',      // 人口统计
        BEHAVIORAL: 'behavioral',        // 行为特征
        PSYCHOLOGICAL: 'psychological',  // 心理特征
        COGNITIVE: 'cognitive',          // 认知特征
        PREFERENCE: 'preference',        // 偏好特征
        PERFORMANCE: 'performance'       // 表现特征
    };

    // ============================================
    // 用户画像
    // ============================================
    class UserProfile {
        constructor(userId) {
            this.userId = userId;
            this.createdAt = Date.now();
            this.updatedAt = Date.now();
            
            // 各维度数据
            this.dimensions = {
                [ProfileDimensions.DEMOGRAPHIC]: {
                    experience: 'beginner',  // beginner, intermediate, expert
                    educationLevel: 'unknown',
                    domain: 'general'
                },
                [ProfileDimensions.BEHAVIORAL]: {
                    averageSessionTime: 0,
                    sessionFrequency: 0,
                    preferredTimeSlots: [],
                    navigationPatterns: [],
                    interactionIntensity: 0
                },
                [ProfileDimensions.PSYCHOLOGICAL]: {
                    riskTolerance: 0.5,
                    patienceLevel: 0.5,
                    frustrationThreshold: 0.5,
                    motivationType: 'intrinsic'
                },
                [ProfileDimensions.COGNITIVE]: {
                    processingStyle: 'analytical',
                    decisionSpeed: 'moderate',
                    attentionSpan: 0.5,
                    cognitiveFlexibility: 0.5
                },
                [ProfileDimensions.PREFERENCE]: {
                    contentTypes: [],
                    difficultyPreference: 'medium',
                    feedbackFrequency: 'normal',
                    learningPace: 'moderate'
                },
                [ProfileDimensions.PERFORMANCE]: {
                    averageScore: 0,
                    completionRate: 0,
                    improvementTrend: 0,
                    struggleAreas: [],
                    strengthAreas: []
                }
            };
            
            // 标签
            this.tags = new Set();
            
            // 原始数据记录
            this.rawData = [];
        }

        /**
         * 更新维度数据
         */
        updateDimension(dimension, data) {
            if (this.dimensions[dimension]) {
                this.dimensions[dimension] = {
                    ...this.dimensions[dimension],
                    ...data
                };
                this.updatedAt = Date.now();
            }
        }

        /**
         * 添加标签
         */
        addTag(tag) {
            this.tags.add(tag);
            this.updatedAt = Date.now();
        }

        /**
         * 移除标签
         */
        removeTag(tag) {
            this.tags.delete(tag);
            this.updatedAt = Date.now();
        }

        /**
         * 记录原始数据
         */
        recordRawData(data) {
            this.rawData.push({
                ...data,
                timestamp: Date.now()
            });
            
            // 限制历史记录数量
            if (this.rawData.length > 1000) {
                this.rawData = this.rawData.slice(-500);
            }
        }

        /**
         * 获取画像摘要
         */
        getSummary() {
            return {
                userId: this.userId,
                tags: Array.from(this.tags),
                dimensions: this.dimensions,
                completeness: this._calculateCompleteness(),
                lastUpdated: this.updatedAt
            };
        }

        /**
         * 计算完整度
         */
        _calculateCompleteness() {
            let filled = 0;
            let total = 0;
            
            for (const dimension of Object.values(this.dimensions)) {
                for (const value of Object.values(dimension)) {
                    total++;
                    if (value !== null && value !== undefined && value !== '' && value !== 'unknown') {
                        if (Array.isArray(value) && value.length === 0) continue;
                        filled++;
                    }
                }
            }
            
            return total > 0 ? filled / total : 0;
        }

        /**
         * 序列化
         */
        toJSON() {
            return {
                userId: this.userId,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                dimensions: this.dimensions,
                tags: Array.from(this.tags)
            };
        }
    }

    // ============================================
    // 行为分析器
    // ============================================
    class BehaviorAnalyzer {
        constructor() {
            this.eventTypes = {
                CLICK: 'click',
                SCROLL: 'scroll',
                DECISION: 'decision',
                VIEW: 'view',
                SESSION: 'session'
            };
        }

        /**
         * 分析行为模式
         */
        analyzePatterns(events) {
            const patterns = {
                sessionPatterns: this._analyzeSessionPatterns(events),
                decisionPatterns: this._analyzeDecisionPatterns(events),
                navigationPatterns: this._analyzeNavigationPatterns(events),
                timingPatterns: this._analyzeTimingPatterns(events)
            };
            
            return patterns;
        }

        /**
         * 分析会话模式
         */
        _analyzeSessionPatterns(events) {
            const sessions = this._groupBySession(events);
            
            const avgDuration = sessions.reduce((sum, s) => 
                sum + (s.endTime - s.startTime), 0) / Math.max(1, sessions.length);
            
            const sessionCount = sessions.length;
            
            return {
                averageDuration: avgDuration,
                sessionCount,
                sessionRegularity: this._calculateRegularity(sessions)
            };
        }

        /**
         * 分析决策模式
         */
        _analyzeDecisionPatterns(events) {
            const decisions = events.filter(e => e.type === this.eventTypes.DECISION);
            
            if (decisions.length === 0) {
                return { averageTime: 0, consistency: 0 };
            }
            
            const times = decisions.map(d => d.decisionTime || 0);
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            
            // 计算决策一致性
            const types = decisions.map(d => d.decisionType);
            const uniqueTypes = new Set(types);
            const consistency = 1 - uniqueTypes.size / Math.max(1, types.length);
            
            return {
                averageTime: avgTime,
                consistency,
                totalDecisions: decisions.length
            };
        }

        /**
         * 分析导航模式
         */
        _analyzeNavigationPatterns(events) {
            const navigations = events.filter(e => e.type === this.eventTypes.NAVIGATION);
            
            const sequences = [];
            let currentSequence = [];
            
            for (const nav of navigations) {
                currentSequence.push(nav.to);
                if (currentSequence.length >= 3) {
                    sequences.push([...currentSequence]);
                    currentSequence = currentSequence.slice(1);
                }
            }
            
            // 找出常见路径
            const pathFrequency = new Map();
            for (const seq of sequences) {
                const key = seq.join('->');
                pathFrequency.set(key, (pathFrequency.get(key) || 0) + 1);
            }
            
            const commonPaths = Array.from(pathFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([path, count]) => ({ path, count }));
            
            return {
                totalNavigations: navigations.length,
                commonPaths
            };
        }

        /**
         * 分析时间模式
         */
        _analyzeTimingPatterns(events) {
            const hourlyDistribution = new Array(24).fill(0);
            
            for (const event of events) {
                const hour = new Date(event.timestamp).getHours();
                hourlyDistribution[hour]++;
            }
            
            // 找出活跃时段
            const activeHours = hourlyDistribution
                .map((count, hour) => ({ hour, count }))
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map(h => h.hour);
            
            return {
                hourlyDistribution,
                activeHours,
                peakHour: activeHours[0] || 12
            };
        }

        /**
         * 按会话分组
         */
        _groupBySession(events, gap = 30 * 60 * 1000) {
            if (events.length === 0) return [];
            
            const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
            const sessions = [];
            let currentSession = {
                startTime: sorted[0].timestamp,
                endTime: sorted[0].timestamp,
                events: [sorted[0]]
            };
            
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i].timestamp - currentSession.endTime > gap) {
                    sessions.push(currentSession);
                    currentSession = {
                        startTime: sorted[i].timestamp,
                        endTime: sorted[i].timestamp,
                        events: [sorted[i]]
                    };
                } else {
                    currentSession.endTime = sorted[i].timestamp;
                    currentSession.events.push(sorted[i]);
                }
            }
            
            sessions.push(currentSession);
            return sessions;
        }

        /**
         * 计算规律性
         */
        _calculateRegularity(sessions) {
            if (sessions.length < 3) return 0;
            
            const intervals = [];
            for (let i = 1; i < sessions.length; i++) {
                intervals.push(sessions[i].startTime - sessions[i-1].startTime);
            }
            
            const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((sum, i) => 
                sum + Math.pow(i - avg, 2), 0) / intervals.length;
            
            const stdDev = Math.sqrt(variance);
            const cv = avg > 0 ? stdDev / avg : 1;
            
            return Math.max(0, 1 - cv);
        }
    }

    // ============================================
    // 偏好建模器
    // ============================================
    class PreferenceModeler {
        constructor() {
            this.preferenceWeights = {
                explicit: 1.0,    // 显式反馈权重
                implicit: 0.5,    // 隐式行为权重
                recency: 0.3      // 时间衰减权重
            };
        }

        /**
         * 建模内容偏好
         */
        modelContentPreferences(interactions) {
            const preferences = new Map();
            
            for (const interaction of interactions) {
                const { contentId, contentType, rating, timeSpent, completed } = interaction;
                
                let score = 0;
                
                // 显式反馈
                if (rating !== undefined) {
                    score += (rating / 5) * this.preferenceWeights.explicit;
                }
                
                // 隐式行为
                if (completed) score += 0.3 * this.preferenceWeights.implicit;
                if (timeSpent > 60) score += 0.2 * this.preferenceWeights.implicit;
                
                // 时间衰减
                const age = Date.now() - interaction.timestamp;
                const decay = Math.exp(-age / (7 * 24 * 60 * 60 * 1000));  // 一周衰减
                score *= (1 - this.preferenceWeights.recency + this.preferenceWeights.recency * decay);
                
                // 累加
                const current = preferences.get(contentType) || { score: 0, count: 0 };
                preferences.set(contentType, {
                    score: current.score + score,
                    count: current.count + 1
                });
            }
            
            // 归一化
            const result = [];
            for (const [type, data] of preferences) {
                result.push({
                    type,
                    preference: data.score / Math.max(1, data.count),
                    confidence: Math.min(1, data.count / 10)
                });
            }
            
            return result.sort((a, b) => b.preference - a.preference);
        }

        /**
         * 建模难度偏好
         */
        modelDifficultyPreference(performances) {
            if (performances.length === 0) {
                return { optimal: 0.5, range: [0.3, 0.7] };
            }
            
            // 找出表现最好的难度区间
            const difficultyPerformance = new Map();
            
            for (const p of performances) {
                const range = Math.floor(p.difficulty * 10) / 10;  // 分成10个区间
                const current = difficultyPerformance.get(range) || { total: 0, count: 0 };
                difficultyPerformance.set(range, {
                    total: current.total + p.score,
                    count: current.count + 1
                });
            }
            
            let bestRange = 0.5;
            let bestScore = 0;
            
            for (const [range, data] of difficultyPerformance) {
                const avg = data.total / data.count;
                if (avg > bestScore) {
                    bestScore = avg;
                    bestRange = range;
                }
            }
            
            // 适度挑战原则
            const optimal = Math.min(1, bestRange + 0.1);
            
            return {
                optimal,
                range: [Math.max(0, optimal - 0.2), Math.min(1, optimal + 0.2)]
            };
        }

        /**
         * 建模反馈偏好
         */
        modelFeedbackPreference(feedbackInteractions) {
            const feedbackTypes = new Map();
            
            for (const interaction of feedbackInteractions) {
                const { feedbackType, viewed, helpful } = interaction;
                
                if (!feedbackTypes.has(feedbackType)) {
                    feedbackTypes.set(feedbackType, { viewed: 0, helpful: 0 });
                }
                
                const data = feedbackTypes.get(feedbackType);
                if (viewed) data.viewed++;
                if (helpful) data.helpful++;
            }
            
            const preferences = [];
            for (const [type, data] of feedbackTypes) {
                preferences.push({
                    type,
                    engagement: data.viewed,
                    satisfaction: data.helpful / Math.max(1, data.viewed)
                });
            }
            
            return preferences.sort((a, b) => 
                (b.engagement + b.satisfaction) - (a.engagement + a.satisfaction)
            );
        }
    }

    // ============================================
    // 画像标签生成器
    // ============================================
    class ProfileTagger {
        constructor() {
            this.tagRules = [
                {
                    name: '快速学习者',
                    condition: (profile) => profile.dimensions.performance.improvementTrend > 0.3,
                    tag: 'fast_learner'
                },
                {
                    name: '细节导向',
                    condition: (profile) => profile.dimensions.cognitive.processingStyle === 'analytical',
                    tag: 'detail_oriented'
                },
                {
                    name: '风险偏好',
                    condition: (profile) => profile.dimensions.psychological.riskTolerance > 0.7,
                    tag: 'risk_taker'
                },
                {
                    name: '风险规避',
                    condition: (profile) => profile.dimensions.psychological.riskTolerance < 0.3,
                    tag: 'risk_averse'
                },
                {
                    name: '高度参与',
                    condition: (profile) => profile.dimensions.behavioral.sessionFrequency > 5,
                    tag: 'highly_engaged'
                },
                {
                    name: '挑战者',
                    condition: (profile) => profile.dimensions.preference.difficultyPreference === 'hard',
                    tag: 'challenger'
                },
                {
                    name: '稳定学习者',
                    condition: (profile) => profile.dimensions.performance.completionRate > 0.8,
                    tag: 'steady_learner'
                },
                {
                    name: '夜间学习者',
                    condition: (profile) => {
                        const peak = profile.dimensions.behavioral.preferredTimeSlots[0];
                        return peak >= 20 || peak < 6;
                    },
                    tag: 'night_learner'
                }
            ];
        }

        /**
         * 自动打标签
         */
        autoTag(profile) {
            const newTags = [];
            
            for (const rule of this.tagRules) {
                try {
                    if (rule.condition(profile)) {
                        if (!profile.tags.has(rule.tag)) {
                            profile.addTag(rule.tag);
                            newTags.push(rule.tag);
                        }
                    }
                } catch (e) {
                    // 条件评估失败，跳过
                    if (typeof Logger !== 'undefined') {
                        Logger.warn('UserBehaviorAnalytics', 'Rule evaluation failed', e);
                    }
                }
            }
            
            return newTags;
        }

        /**
         * 获取标签解释
         */
        getTagExplanation(tag) {
            const explanations = {
                'fast_learner': '学习进步快速，能高效掌握新知识',
                'detail_oriented': '注重细节分析，喜欢深入了解每个环节',
                'risk_taker': '愿意尝试高风险高回报的选择',
                'risk_averse': '偏好稳妥安全的选项',
                'highly_engaged': '学习积极性高，参与度强',
                'challenger': '喜欢挑战高难度内容',
                'steady_learner': '学习节奏稳定，完成率高',
                'night_learner': '倾向于在夜间学习'
            };
            
            return explanations[tag] || null;
        }
    }

    // ============================================
    // 用户画像管理器
    // ============================================
    class UserProfileManager {
        constructor() {
            this.profiles = new Map();
            this.behaviorAnalyzer = new BehaviorAnalyzer();
            this.preferenceModeler = new PreferenceModeler();
            self.tagger = new ProfileTagger();
        }

        /**
         * 获取或创建用户画像
         */
        getProfile(userId) {
            if (!this.profiles.has(userId)) {
                this.profiles.set(userId, new UserProfile(userId));
            }
            return this.profiles.get(userId);
        }

        /**
         * 记录用户事件
         */
        recordEvent(userId, event) {
            const profile = this.getProfile(userId);
            profile.recordRawData(event);
            
            // 更新行为维度
            this._updateBehavioralDimension(profile, event);
            
            // 自动打标签
            this.tagger.autoTag(profile);
            
            return profile;
        }

        /**
         * 更新行为维度
         */
        _updateBehavioralDimension(profile, event) {
            const behavioral = profile.dimensions[ProfileDimensions.BEHAVIORAL];
            
            if (event.type === 'session') {
                behavioral.sessionFrequency++;
                behavioral.averageSessionTime = 
                    (behavioral.averageSessionTime * (behavioral.sessionFrequency - 1) + 
                    event.duration) / behavioral.sessionFrequency;
            }
        }

        /**
         * 更新表现维度
         */
        updatePerformance(userId, performance) {
            const profile = this.getProfile(userId);
            const perf = profile.dimensions[ProfileDimensions.PERFORMANCE];
            
            if (performance.score !== undefined) {
                perf.averageScore = 
                    (perf.averageScore + performance.score) / 2;
            }
            
            if (performance.completed !== undefined) {
                perf.completionRate = 
                    (perf.completionRate + (performance.completed ? 1 : 0)) / 2;
            }
            
            if (performance.area) {
                if (performance.success) {
                    if (!perf.strengthAreas.includes(performance.area)) {
                        perf.strengthAreas.push(performance.area);
                    }
                } else {
                    if (!perf.struggleAreas.includes(performance.area)) {
                        perf.struggleAreas.push(performance.area);
                    }
                }
            }
            
            profile.updatedAt = Date.now();
            this.tagger.autoTag(profile);
            
            return profile;
        }

        /**
         * 生成画像报告
         */
        generateReport(userId) {
            const profile = this.getProfile(userId);
            const events = profile.rawData;
            
            const behaviorPatterns = this.behaviorAnalyzer.analyzePatterns(events);
            const contentPrefs = this.preferenceModeler.modelContentPreferences(events);
            
            return {
                profile: profile.getSummary(),
                behaviorPatterns,
                contentPreferences: contentPrefs,
                tags: Array.from(profile.tags).map(tag => ({
                    tag,
                    explanation: this.tagger.getTagExplanation(tag)
                })),
                recommendations: this._generateRecommendations(profile)
            };
        }

        /**
         * 生成推荐
         */
        _generateRecommendations(profile) {
            const recommendations = [];
            
            const perf = profile.dimensions[ProfileDimensions.PERFORMANCE];
            const pref = profile.dimensions[ProfileDimensions.PREFERENCE];
            
            // 基于挣扎领域推荐
            if (perf.struggleAreas.length > 0) {
                recommendations.push({
                    type: 'focus_area',
                    areas: perf.struggleAreas,
                    reason: '建议加强这些领域的练习'
                });
            }
            
            // 基于学习风格推荐
            if (pref.feedbackFrequency === 'frequent') {
                recommendations.push({
                    type: 'feedback',
                    suggestion: '开启详细反馈模式',
                    reason: '您喜欢获得详细反馈'
                });
            }
            
            return recommendations;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ProfileDimensions,
            UserProfile,
            BehaviorAnalyzer,
            PreferenceModeler,
            ProfileTagger,
            UserProfileManager
        };
    } else {
        global.ProfileDimensions = ProfileDimensions;
        global.UserProfile = UserProfile;
        global.BehaviorAnalyzer = BehaviorAnalyzer;
        global.PreferenceModeler = PreferenceModeler;
        global.ProfileTagger = ProfileTagger;
        global.UserProfileManager = UserProfileManager;
    }

})(typeof window !== 'undefined' ? window : this);
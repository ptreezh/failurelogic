/**
 * 游戏化学习模块
 * Gamification Learning Module
 * 
 * 功能：
 * - 积分系统
 * - 成就徽章
 * - 排行榜
 * - 挑战任务
 * - 奖励机制
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环21
 */

(function(global) {
    'use strict';

    // ============================================
    // 积分类型
    // ============================================
    const PointType = {
        LEARNING: 'learning',           // 学习积分
        ACHIEVEMENT: 'achievement',     // 成就积分
        CHALLENGE: 'challenge',         // 挑战积分
        SOCIAL: 'social',               // 社交积分
        STREAK: 'streak',               // 连续学习积分
        BONUS: 'bonus'                  // 奖励积分
    };

    // ============================================
    // 成就等级
    // ============================================
    const AchievementLevel = {
        BRONZE: 'bronze',               // 青铜
        SILVER: 'silver',               // 白银
        GOLD: 'gold',                   // 黄金
        PLATINUM: 'platinum',           // 铂金
        DIAMOND: 'diamond'              // 钻石
    };

    // ============================================
    // 挑战状态
    // ============================================
    const ChallengeStatus = {
        LOCKED: 'locked',               // 锁定
        AVAILABLE: 'available',         // 可用
        IN_PROGRESS: 'in_progress',     // 进行中
        COMPLETED: 'completed',         // 完成
        FAILED: 'failed',               // 失败
        EXPIRED: 'expired'              // 过期
    };

    // ============================================
    // 奖励类型
    // ============================================
    const RewardType = {
        POINTS: 'points',               // 积分
        BADGE: 'badge',                 // 徽章
        TITLE: 'title',                 // 称号
        AVATAR: 'avatar',               // 头像框
        THEME: 'theme',                 // 主题
        ABILITY: 'ability'              // 特殊能力
    };

    // ============================================
    // 积分系统
    // ============================================
    class PointsSystem {
        constructor() {
            this.userPoints = new Map();
            this.pointRules = this._initializePointRules();
            this.multipliers = new Map();
            this.history = [];
        }

        /**
         * 初始化积分规则
         */
        _initializePointRules() {
            return {
                // 学习行为
                completeScenario: { points: 100, type: PointType.LEARNING },
                correctDecision: { points: 20, type: PointType.LEARNING },
                avoidBias: { points: 50, type: PointType.LEARNING },
                learnFromMistake: { points: 30, type: PointType.LEARNING },
                completeModule: { points: 200, type: PointType.LEARNING },
                
                // 连续学习
                dailyStreak: { points: 10, type: PointType.STREAK },
                weeklyStreak: { points: 100, type: PointType.STREAK },
                monthlyStreak: { points: 500, type: PointType.STREAK },
                
                // 挑战
                completeChallenge: { points: 150, type: PointType.CHALLENGE },
                masterChallenge: { points: 300, type: PointType.CHALLENGE },
                
                // 社交
                helpOthers: { points: 50, type: PointType.SOCIAL },
                shareProgress: { points: 20, type: PointType.SOCIAL },
                createContent: { points: 100, type: PointType.SOCIAL },
                
                // 成就
                earnBadge: { points: 100, type: PointType.ACHIEVEMENT },
                levelUp: { points: 200, type: PointType.ACHIEVEMENT }
            };
        }

        /**
         * 获取用户积分
         */
        getUserPoints(userId) {
            if (!this.userPoints.has(userId)) {
                this.userPoints.set(userId, {
                    total: 0,
                    byType: {},
                    level: 1,
                    experience: 0,
                    nextLevelExp: 1000
                });
            }
            return this.userPoints.get(userId);
        }

        /**
         * 添加积分
         */
        addPoints(userId, ruleName, multiplier = 1) {
            const rule = this.pointRules[ruleName];
            if (!rule) {
                Logger?.warn(`未知的积分规则: ${ruleName}`);
                return null;
            }
            
            const userPoints = this.getUserPoints(userId);
            let points = rule.points * multiplier;
            
            // 应用用户倍率
            const userMultiplier = this.multipliers.get(userId) || 1;
            points = Math.floor(points * userMultiplier);
            
            // 更新积分
            userPoints.total += points;
            userPoints.byType[rule.type] = (userPoints.byType[rule.type] || 0) + points;
            userPoints.experience += points;
            
            // 检查升级
            const levelUp = this._checkLevelUp(userPoints);
            
            // 记录历史
            this.history.push({
                userId,
                rule: ruleName,
                points,
                type: rule.type,
                timestamp: Date.now()
            });
            
            return {
                points,
                type: rule.type,
                newTotal: userPoints.total,
                levelUp
            };
        }

        /**
         * 检查升级
         */
        _checkLevelUp(userPoints) {
            let levelUp = false;
            
            while (userPoints.experience >= userPoints.nextLevelExp) {
                userPoints.experience -= userPoints.nextLevelExp;
                userPoints.level++;
                userPoints.nextLevelExp = Math.floor(userPoints.nextLevelExp * 1.5);
                levelUp = true;
            }
            
            return levelUp;
        }

        /**
         * 设置积分倍率
         */
        setMultiplier(userId, multiplier, duration = null) {
            this.multipliers.set(userId, multiplier);
            
            if (duration) {
                setTimeout(() => {
                    this.multipliers.delete(userId);
                }, duration);
            }
        }

        /**
         * 获取积分排行榜
         */
        getLeaderboard(limit = 10) {
            const entries = Array.from(this.userPoints.entries())
                .map(([userId, data]) => ({
                    userId,
                    total: data.total,
                    level: data.level
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, limit);
            
            return entries;
        }

        /**
         * 获取用户积分历史
         */
        getUserHistory(userId, limit = 50) {
            return this.history
                .filter(h => h.userId === userId)
                .slice(-limit);
        }

        /**
         * 获取统计信息
         */
        getStatistics(userId) {
            const userPoints = this.getUserPoints(userId);
            const userHistory = this.getUserHistory(userId);
            
            return {
                total: userPoints.total,
                level: userPoints.level,
                experience: userPoints.experience,
                nextLevelExp: userPoints.nextLevelExp,
                expProgress: userPoints.experience / userPoints.nextLevelExp,
                byType: userPoints.byType,
                recentPoints: userHistory.slice(-10)
            };
        }
    }

    // ============================================
    // 成就徽章系统
    // ============================================
    class AchievementBadgeSystem {
        constructor() {
            this.badges = this._initializeBadges();
            this.userBadges = new Map();
            this.badgeProgress = new Map();
        }

        /**
         * 初始化徽章定义
         */
        _initializeBadges() {
            return {
                // 学习徽章
                first_step: {
                    id: 'first_step',
                    name: '初探认知',
                    description: '完成第一个认知陷阱场景',
                    icon: '🌟',
                    level: AchievementLevel.BRONZE,
                    requirement: { type: 'scenarios_completed', value: 1 },
                    points: 50
                },
                explorer: {
                    id: 'explorer',
                    name: '探索者',
                    description: '完成5个不同类型的场景',
                    icon: '🔍',
                    level: AchievementLevel.BRONZE,
                    requirement: { type: 'scenarios_completed', value: 5 },
                    points: 100
                },
                deep_thinker: {
                    id: 'deep_thinker',
                    name: '深度思考者',
                    description: '完成所有高级难度场景',
                    icon: '🧠',
                    level: AchievementLevel.SILVER,
                    requirement: { type: 'advanced_scenarios', value: 10 },
                    points: 200
                },
                
                // 偏差克服徽章
                bias_hunter: {
                    id: 'bias_hunter',
                    name: '偏差猎手',
                    description: '识别并避免10个认知偏差',
                    icon: '🎯',
                    level: AchievementLevel.SILVER,
                    requirement: { type: 'biases_avoided', value: 10 },
                    points: 150
                },
                confirmation_conqueror: {
                    id: 'confirmation_conqueror',
                    name: '确认偏误征服者',
                    description: '在确认偏误场景中连续正确决策',
                    icon: '🏆',
                    level: AchievementLevel.GOLD,
                    requirement: { type: 'specific_bias_streak', bias: 'confirmation', value: 5 },
                    points: 300
                },
                sunk_cost_master: {
                    id: 'sunk_cost_master',
                    name: '沉没成本大师',
                    description: '成功识别并避免沉没成本陷阱',
                    icon: '💎',
                    level: AchievementLevel.GOLD,
                    requirement: { type: 'specific_bias_avoided', bias: 'sunk_cost', value: 3 },
                    points: 250
                },
                
                // 连续学习徽章
                streak_week: {
                    id: 'streak_week',
                    name: '一周坚持',
                    description: '连续7天学习',
                    icon: '🔥',
                    level: AchievementLevel.BRONZE,
                    requirement: { type: 'streak_days', value: 7 },
                    points: 100
                },
                streak_month: {
                    id: 'streak_month',
                    name: '月度学霸',
                    description: '连续30天学习',
                    icon: '📅',
                    level: AchievementLevel.SILVER,
                    requirement: { type: 'streak_days', value: 30 },
                    points: 300
                },
                streak_master: {
                    id: 'streak_master',
                    name: '坚持大师',
                    description: '连续100天学习',
                    icon: '👑',
                    level: AchievementLevel.DIAMOND,
                    requirement: { type: 'streak_days', value: 100 },
                    points: 1000
                },
                
                // 挑战徽章
                challenge_novice: {
                    id: 'challenge_novice',
                    name: '挑战新秀',
                    description: '完成首个挑战任务',
                    icon: '🎖️',
                    level: AchievementLevel.BRONZE,
                    requirement: { type: 'challenges_completed', value: 1 },
                    points: 75
                },
                challenge_veteran: {
                    id: 'challenge_veteran',
                    name: '挑战老兵',
                    description: '完成20个挑战任务',
                    icon: '🏅',
                    level: AchievementLevel.SILVER,
                    requirement: { type: 'challenges_completed', value: 20 },
                    points: 250
                },
                challenge_legend: {
                    id: 'challenge_legend',
                    name: '挑战传奇',
                    description: '完成50个挑战任务',
                    icon: '⭐',
                    level: AchievementLevel.PLATINUM,
                    requirement: { type: 'challenges_completed', value: 50 },
                    points: 500
                },
                
                // 特殊成就
                perfect_score: {
                    id: 'perfect_score',
                    name: '完美表现',
                    description: '在任意场景中获得满分',
                    icon: '💯',
                    level: AchievementLevel.GOLD,
                    requirement: { type: 'perfect_scenarios', value: 1 },
                    points: 200
                },
                speed_learner: {
                    id: 'speed_learner',
                    name: '速学达人',
                    description: '在10分钟内完成一个复杂场景',
                    icon: '⚡',
                    level: AchievementLevel.SILVER,
                    requirement: { type: 'speed_completion', value: 1 },
                    points: 150
                },
                mentor: {
                    id: 'mentor',
                    name: '知识导师',
                    description: '帮助10位其他用户',
                    icon: '🤝',
                    level: AchievementLevel.GOLD,
                    requirement: { type: 'helped_users', value: 10 },
                    points: 300
                }
            };
        }

        /**
         * 获取用户徽章
         */
        getUserBadges(userId) {
            if (!this.userBadges.has(userId)) {
                this.userBadges.set(userId, []);
            }
            return this.userBadges.get(userId);
        }

        /**
         * 检查并授予徽章
         */
        checkAndAwardBadge(userId, stats) {
            const awardedBadges = [];
            const userBadges = this.getUserBadges(userId);
            const earnedIds = new Set(userBadges.map(b => b.badgeId));
            
            for (const [badgeId, badge] of Object.entries(this.badges)) {
                if (earnedIds.has(badgeId)) continue;
                
                if (this._checkRequirement(badge.requirement, stats)) {
                    const awarded = this._awardBadge(userId, badgeId);
                    if (awarded) {
                        awardedBadges.push(awarded);
                    }
                }
            }
            
            return awardedBadges;
        }

        /**
         * 检查需求
         */
        _checkRequirement(requirement, stats) {
            const statValue = stats[requirement.type] || 0;
            
            if (requirement.bias) {
                // 特定偏差需求
                const biasStats = stats[requirement.type] || {};
                return (biasStats[requirement.bias] || 0) >= requirement.value;
            }
            
            return statValue >= requirement.value;
        }

        /**
         * 授予徽章
         */
        _awardBadge(userId, badgeId) {
            const badge = this.badges[badgeId];
            if (!badge) return null;
            
            const userBadges = this.getUserBadges(userId);
            const award = {
                badgeId,
                name: badge.name,
                icon: badge.icon,
                level: badge.level,
                earnedAt: Date.now(),
                points: badge.points
            };
            
            userBadges.push(award);
            
            return award;
        }

        /**
         * 获取徽章进度
         */
        getBadgeProgress(userId, badgeId, stats) {
            const badge = this.badges[badgeId];
            if (!badge) return null;
            
            const userBadges = this.getUserBadges(userId);
            const earned = userBadges.find(b => b.badgeId === badgeId);
            
            if (earned) {
                return { completed: true, progress: 1, earned };
            }
            
            let current = 0;
            if (badge.requirement.bias) {
                const biasStats = stats[badge.requirement.type] || {};
                current = biasStats[badge.requirement.bias] || 0;
            } else {
                current = stats[badge.requirement.type] || 0;
            }
            
            return {
                completed: false,
                progress: Math.min(1, current / badge.requirement.value),
                current,
                required: badge.requirement.value
            };
        }

        /**
         * 获取所有可获得的徽章
         */
        getAllBadges() {
            return Object.values(this.badges);
        }
    }

    // ============================================
    // 排行榜系统
    // ============================================
    class LeaderboardSystem {
        constructor() {
            this.rankings = new Map();
            this.categories = {
                total_points: { name: '总积分榜', icon: '🏆' },
                weekly_points: { name: '周积分榜', icon: '📊' },
                level: { name: '等级榜', icon: '⭐' },
                streak: { name: '连续学习榜', icon: '🔥' },
                challenges: { name: '挑战完成榜', icon: '🎖️' },
                badges: { name: '徽章收集榜', icon: '🏅' }
            };
            this.lastUpdate = 0;
            this.updateInterval = 60000; // 1分钟更新一次
        }

        /**
         * 更新排名
         */
        updateRanking(category, userId, score) {
            if (!this.rankings.has(category)) {
                this.rankings.set(category, new Map());
            }
            
            const categoryRanking = this.rankings.get(category);
            categoryRanking.set(userId, {
                userId,
                score,
                updatedAt: Date.now()
            });
            
            this.lastUpdate = Date.now();
        }

        /**
         * 获取排行榜
         */
        getLeaderboard(category, limit = 10) {
            const categoryRanking = this.rankings.get(category);
            if (!categoryRanking) return [];
            
            return Array.from(categoryRanking.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map((entry, index) => ({
                    rank: index + 1,
                    ...entry
                }));
        }

        /**
         * 获取用户排名
         */
        getUserRank(category, userId) {
            const leaderboard = this.getLeaderboard(category, Infinity);
            const userEntry = leaderboard.find(e => e.userId === userId);
            
            if (!userEntry) return null;
            
            return userEntry.rank;
        }

        /**
         * 获取用户在所有榜单的排名
         */
        getUserAllRanks(userId) {
            const ranks = {};
            
            for (const category of Object.keys(this.categories)) {
                ranks[category] = this.getUserRank(category, userId);
            }
            
            return ranks;
        }

        /**
         * 获取分类信息
         */
        getCategories() {
            return this.categories;
        }

        /**
         * 批量更新排名
         */
        batchUpdate(category, updates) {
            for (const { userId, score } of updates) {
                this.updateRanking(category, userId, score);
            }
        }

        /**
         * 重置周期性榜单
         */
        resetPeriodicLeaderboard(category) {
            this.rankings.set(category, new Map());
        }
    }

    // ============================================
    // 挑战任务系统
    // ============================================
    class ChallengeTaskSystem {
        constructor() {
            this.challenges = this._initializeChallenges();
            this.userChallenges = new Map();
            this.dailyChallenges = new Map();
        }

        /**
         * 初始化挑战任务
         */
        _initializeChallenges() {
            return {
                // 每日挑战
                daily_decision: {
                    id: 'daily_decision',
                    name: '每日决策',
                    description: '完成今天的认知陷阱场景',
                    type: 'daily',
                    difficulty: 'easy',
                    requirements: [
                        { type: 'scenarios_completed', value: 1, timeframe: 'daily' }
                    ],
                    rewards: { points: 50, bonusChance: 0.1 },
                    resetTime: 'daily'
                },
                daily_streak: {
                    id: 'daily_streak',
                    name: '保持连续',
                    description: '今天学习以保持连续天数',
                    type: 'daily',
                    difficulty: 'easy',
                    requirements: [
                        { type: 'daily_login', value: 1 }
                    ],
                    rewards: { points: 30 },
                    resetTime: 'daily'
                },
                
                // 周挑战
                weekly_explorer: {
                    id: 'weekly_explorer',
                    name: '周度探索者',
                    description: '本周完成5个不同场景',
                    type: 'weekly',
                    difficulty: 'medium',
                    requirements: [
                        { type: 'scenarios_completed', value: 5, timeframe: 'weekly' },
                        { type: 'unique_scenarios', value: 3 }
                    ],
                    rewards: { points: 200, badge: 'weekly_hero' },
                    resetTime: 'weekly'
                },
                weekly_perfectionist: {
                    id: 'weekly_perfectionist',
                    name: '周度完美主义者',
                    description: '本周在任意场景获得90%以上正确率',
                    type: 'weekly',
                    difficulty: 'hard',
                    requirements: [
                        { type: 'high_accuracy_scenario', value: 1, accuracy: 0.9 }
                    ],
                    rewards: { points: 300, multiplier: 1.5, duration: 86400000 },
                    resetTime: 'weekly'
                },
                
                // 特殊挑战
                bias_gauntlet: {
                    id: 'bias_gauntlet',
                    name: '偏差挑战赛',
                    description: '连续正确识别5种不同认知偏差',
                    type: 'special',
                    difficulty: 'hard',
                    requirements: [
                        { type: 'biases_identified_streak', value: 5, unique: true }
                    ],
                    rewards: { points: 500, badge: 'bias_master', title: '认知专家' }
                },
                time_pressure: {
                    id: 'time_pressure',
                    name: '时间压力测试',
                    description: '在限时模式下完成高级场景',
                    type: 'special',
                    difficulty: 'extreme',
                    requirements: [
                        { type: 'timed_scenario', value: 1, difficulty: 'advanced', timeLimit: 300 }
                    ],
                    rewards: { points: 400, ability: 'time_insight' }
                },
                decision_chain: {
                    id: 'decision_chain',
                    name: '决策链条',
                    description: '在一个场景中连续做出5个正确决策',
                    type: 'special',
                    difficulty: 'medium',
                    requirements: [
                        { type: 'correct_decisions_streak', value: 5 }
                    ],
                    rewards: { points: 250 }
                },
                
                // 学习路径挑战
                cognitive_mastery: {
                    id: 'cognitive_mastery',
                    name: '认知精通之路',
                    description: '完成所有入门级场景',
                    type: 'path',
                    difficulty: 'medium',
                    requirements: [
                        { type: 'scenarios_by_difficulty', value: 10, difficulty: 'beginner' }
                    ],
                    rewards: { points: 300, unlockPath: 'intermediate' }
                },
                advanced_adept: {
                    id: 'advanced_adept',
                    name: '高级学徒',
                    description: '完成所有中级场景',
                    type: 'path',
                    difficulty: 'hard',
                    requirements: [
                        { type: 'scenarios_by_difficulty', value: 10, difficulty: 'intermediate' }
                    ],
                    rewards: { points: 500, unlockPath: 'advanced', badge: 'intermediate_master' }
                }
            };
        }

        /**
         * 获取用户挑战
         */
        getUserChallenges(userId) {
            if (!this.userChallenges.has(userId)) {
                this.userChallenges.set(userId, new Map());
                this._initializeUserChallenges(userId);
            }
            return this.userChallenges.get(userId);
        }

        /**
         * 初始化用户挑战
         */
        _initializeUserChallenges(userId) {
            const userChallenges = this.userChallenges.get(userId);
            
            for (const [challengeId, challenge] of Object.entries(this.challenges)) {
                userChallenges.set(challengeId, {
                    challengeId,
                    status: ChallengeStatus.AVAILABLE,
                    progress: {},
                    startedAt: null,
                    completedAt: null
                });
            }
        }

        /**
         * 开始挑战
         */
        startChallenge(userId, challengeId) {
            const challenge = this.challenges[challengeId];
            if (!challenge) return null;
            
            const userChallenges = this.getUserChallenges(userId);
            const userChallenge = userChallenges.get(challengeId);
            
            if (!userChallenge || userChallenge.status !== ChallengeStatus.AVAILABLE) {
                return null;
            }
            
            userChallenge.status = ChallengeStatus.IN_PROGRESS;
            userChallenge.startedAt = Date.now();
            userChallenge.progress = this._initializeProgress(challenge);
            
            return userChallenge;
        }

        /**
         * 初始化进度
         */
        _initializeProgress(challenge) {
            const progress = {};
            for (let i = 0; i < challenge.requirements.length; i++) {
                progress[i] = { current: 0, target: challenge.requirements[i].value };
            }
            return progress;
        }

        /**
         * 更新挑战进度
         */
        updateProgress(userId, challengeId, requirementIndex, increment = 1) {
            const userChallenges = this.getUserChallenges(userId);
            const userChallenge = userChallenges.get(challengeId);
            
            if (!userChallenge || userChallenge.status !== ChallengeStatus.IN_PROGRESS) {
                return null;
            }
            
            userChallenge.progress[requirementIndex].current += increment;
            
            // 检查是否完成
            if (this._checkChallengeCompletion(userChallenge)) {
                return this._completeChallenge(userId, challengeId);
            }
            
            return { progress: userChallenge.progress, completed: false };
        }

        /**
         * 检查挑战完成
         */
        _checkChallengeCompletion(userChallenge) {
            for (const key of Object.keys(userChallenge.progress)) {
                const p = userChallenge.progress[key];
                if (p.current < p.target) {
                    return false;
                }
            }
            return true;
        }

        /**
         * 完成挑战
         */
        _completeChallenge(userId, challengeId) {
            const challenge = this.challenges[challengeId];
            const userChallenges = this.getUserChallenges(userId);
            const userChallenge = userChallenges.get(challengeId);
            
            userChallenge.status = ChallengeStatus.COMPLETED;
            userChallenge.completedAt = Date.now();
            
            return {
                completed: true,
                challengeId,
                rewards: challenge.rewards,
                completedAt: userChallenge.completedAt
            };
        }

        /**
         * 获取可用挑战
         */
        getAvailableChallenges(userId) {
            const userChallenges = this.getUserChallenges(userId);
            const available = [];
            
            for (const [challengeId, userChallenge] of userChallenges) {
                if (userChallenge.status === ChallengeStatus.AVAILABLE) {
                    available.push({
                        ...this.challenges[challengeId],
                        ...userChallenge
                    });
                }
            }
            
            return available;
        }

        /**
         * 获取进行中的挑战
         */
        getInProgressChallenges(userId) {
            const userChallenges = this.getUserChallenges(userId);
            const inProgress = [];
            
            for (const [challengeId, userChallenge] of userChallenges) {
                if (userChallenge.status === ChallengeStatus.IN_PROGRESS) {
                    inProgress.push({
                        ...this.challenges[challengeId],
                        ...userChallenge
                    });
            }
            }
            
            return inProgress;
        }

        /**
         * 重置每日/每周挑战
         */
        resetPeriodicChallenges(userId, period) {
            const userChallenges = this.getUserChallenges(userId);
            
            for (const [challengeId, challenge] of Object.entries(this.challenges)) {
                if (challenge.resetTime === period) {
                    const userChallenge = userChallenges.get(challengeId);
                    userChallenge.status = ChallengeStatus.AVAILABLE;
                    userChallenge.progress = {};
                    userChallenge.startedAt = null;
                    userChallenge.completedAt = null;
                }
            }
        }
    }

    // ============================================
    // 奖励系统
    // ============================================
    class RewardSystem {
        constructor() {
            this.userRewards = new Map();
            this.rewardInventory = this._initializeInventory();
        }

        /**
         * 初始化奖励库存
         */
        _initializeInventory() {
            return {
                // 称号
                titles: [
                    { id: 'novice', name: '认知新手', rarity: 'common', requirement: { level: 1 } },
                    { id: 'thinker', name: '思考者', rarity: 'rare', requirement: { level: 5 } },
                    { id: 'analyst', name: '分析师', rarity: 'rare', requirement: { level: 10 } },
                    { id: 'expert', name: '认知专家', rarity: 'epic', requirement: { level: 20 } },
                    { id: 'master', name: '大师', rarity: 'legendary', requirement: { level: 50 } },
                    { id: 'guru', name: '认知导师', rarity: 'mythic', requirement: { badges: 20 } }
                ],
                
                // 头像框
                avatars: [
                    { id: 'bronze_frame', name: '青铜光环', rarity: 'common' },
                    { id: 'silver_frame', name: '白银光环', rarity: 'rare' },
                    { id: 'gold_frame', name: '黄金光环', rarity: 'epic' },
                    { id: 'diamond_frame', name: '钻石光环', rarity: 'legendary' }
                ],
                
                // 主题
                themes: [
                    { id: 'dark_mode', name: '暗夜主题', rarity: 'common' },
                    { id: 'nature', name: '自然主题', rarity: 'rare' },
                    { id: 'cosmic', name: '宇宙主题', rarity: 'epic' }
                ],
                
                // 特殊能力
                abilities: [
                    { id: 'hint_boost', name: '提示增强', description: '获得额外提示机会', rarity: 'rare' },
                    { id: 'time_extension', name: '时间延长', description: '限时模式额外30秒', rarity: 'rare' },
                    { id: 'insight_mode', name: '洞察模式', description: '显示决策预期结果', rarity: 'epic' }
                ]
            };
        }

        /**
         * 授予奖励
         */
        grantReward(userId, reward) {
            if (!this.userRewards.has(userId)) {
                this.userRewards.set(userId, {
                    titles: [],
                    avatars: [],
                    themes: [],
                    abilities: [],
                    activeTitle: null,
                    activeAvatar: null,
                    activeTheme: null
                });
            }
            
            const userRewards = this.userRewards.get(userId);
            const rewardType = this._getRewardType(reward);
            
            if (!rewardType || !userRewards[rewardType]) {
                return null;
            }
            
            // 检查是否已拥有
            if (!userRewards[rewardType].find(r => r.id === reward.id)) {
                userRewards[rewardType].push({
                    ...reward,
                    earnedAt: Date.now()
                });
            }
            
            return reward;
        }

        /**
         * 获取奖励类型
         */
        _getRewardType(reward) {
            if (reward.points !== undefined) return null;
            if (this.rewardInventory.titles.find(t => t.id === reward.id)) return 'titles';
            if (this.rewardInventory.avatars.find(a => a.id === reward.id)) return 'avatars';
            if (this.rewardInventory.themes.find(t => t.id === reward.id)) return 'themes';
            if (this.rewardInventory.abilities.find(a => a.id === reward.id)) return 'abilities';
            return null;
        }

        /**
         * 设置活跃奖励
         */
        setActiveReward(userId, type, rewardId) {
            const userRewards = this.userRewards.get(userId);
            if (!userRewards) return false;
            
            const reward = userRewards[type].find(r => r.id === rewardId);
            if (!reward) return false;
            
            switch (type) {
                case 'titles':
                    userRewards.activeTitle = rewardId;
                    break;
                case 'avatars':
                    userRewards.activeAvatar = rewardId;
                    break;
                case 'themes':
                    userRewards.activeTheme = rewardId;
                    break;
            }
            
            return true;
        }

        /**
         * 获取用户奖励
         */
        getUserRewards(userId) {
            return this.userRewards.get(userId) || {
                titles: [],
                avatars: [],
                themes: [],
                abilities: [],
                activeTitle: null,
                activeAvatar: null,
                activeTheme: null
            };
        }

        /**
         * 检查奖励可用性
         */
        checkRewardAvailability(userId, rewardId) {
            const inventory = Object.values(this.rewardInventory).flat();
            const reward = inventory.find(r => r.id === rewardId);
            
            if (!reward) return { available: false, reason: 'not_found' };
            
            const userRewards = this.userRewards.get(userId);
            if (userRewards) {
                const owned = Object.values(userRewards).flat().find(r => r.id === rewardId);
                if (owned) return { available: false, reason: 'already_owned' };
            }
            
            return { available: true, reward };
        }
    }

    // ============================================
    // 游戏化学习系统（主入口）
    // ============================================
    class GamificationLearningSystem {
        constructor(config = {}) {
            this.config = {
                userId: config.userId || 'default_user',
                autoSave: config.autoSave !== false,
                saveInterval: config.saveInterval || 60000,
                ...config
            };
            
            this.pointsSystem = new PointsSystem();
            this.badgeSystem = new AchievementBadgeSystem();
            this.leaderboard = new LeaderboardSystem();
            this.challengeSystem = new ChallengeTaskSystem();
            this.rewardSystem = new RewardSystem();
            
            this.userStats = new Map();
            this.eventListeners = new Map();
        }

        /**
         * 初始化系统
         */
        async initialize() {
            // 初始化用户统计
            this._initializeUserStats(this.config.userId);
            
            // 设置自动保存
            if (this.config.autoSave) {
                setInterval(() => this.save(), this.config.saveInterval);
            }
            
            Logger?.debug('游戏化学习系统初始化完成');
            return true;
        }

        /**
         * 初始化用户统计
         */
        _initializeUserStats(userId) {
            if (!this.userStats.has(userId)) {
                this.userStats.set(userId, {
                    scenarios_completed: 0,
                    biases_avoided: 0,
                    challenges_completed: 0,
                    streak_days: 0,
                    last_active: Date.now(),
                    total_time: 0,
                    correct_decisions: 0,
                    perfect_scenarios: 0,
                    helped_users: 0
                });
            }
        }

        /**
         * 记录学习活动
         */
        recordActivity(userId, activityType, data = {}) {
            this._initializeUserStats(userId);
            const stats = this.userStats.get(userId);
            
            // 更新统计
            switch (activityType) {
                case 'scenario_completed':
                    stats.scenarios_completed++;
                    if (data.perfect) stats.perfect_scenarios++;
                    if (data.correctDecisions) stats.correct_decisions += data.correctDecisions;
                    break;
                case 'bias_avoided':
                    stats.biases_avoided++;
                    break;
                case 'challenge_completed':
                    stats.challenges_completed++;
                    break;
                case 'daily_login':
                    this._updateStreak(stats);
                    break;
            }
            
            // 添加积分
            const pointsResult = this.pointsSystem.addPoints(userId, activityType, data.multiplier || 1);
            
            // 检查徽章
            const newBadges = this.badgeSystem.checkAndAwardBadge(userId, stats);
            
            // 更新排行榜
            this._updateLeaderboards(userId);
            
            // 触发事件
            this._emit('activity', { userId, activityType, data, pointsResult, newBadges });
            
            return {
                stats,
                points: pointsResult,
                badges: newBadges
            };
        }

        /**
         * 更新连续天数
         */
        _updateStreak(stats) {
            const now = Date.now();
            const lastActive = stats.last_active;
            const dayDiff = Math.floor((now - lastActive) / 86400000);
            
            if (dayDiff === 1) {
                stats.streak_days++;
            } else if (dayDiff > 1) {
                stats.streak_days = 1;
            }
            
            stats.last_active = now;
        }

        /**
         * 更新排行榜
         */
        _updateLeaderboards(userId) {
            const points = this.pointsSystem.getUserPoints(userId);
            const stats = this.userStats.get(userId);
            const badges = this.badgeSystem.getUserBadges(userId);
            
            this.leaderboard.updateRanking('total_points', userId, points.total);
            this.leaderboard.updateRanking('level', userId, points.level);
            this.leaderboard.updateRanking('streak', userId, stats?.streak_days || 0);
            this.leaderboard.updateRanking('challenges', userId, stats?.challenges_completed || 0);
            this.leaderboard.updateRanking('badges', userId, badges.length);
        }

        /**
         * 开始挑战
         */
        startChallenge(userId, challengeId) {
            const result = this.challengeSystem.startChallenge(userId, challengeId);
            
            if (result) {
                this._emit('challenge_started', { userId, challengeId, challenge: result });
            }
            
            return result;
        }

        /**
         * 完成挑战
         */
        completeChallenge(userId, challengeId) {
            const challenge = this.challengeSystem.challenges[challengeId];
            const result = this.challengeSystem._completeChallenge(userId, challengeId);
            
            if (result && challenge.rewards) {
                // 发放奖励
                if (challenge.rewards.points) {
                    this.pointsSystem.addPoints(userId, 'completeChallenge', challenge.rewards.points / 150);
                }
                
                if (challenge.rewards.badge) {
                    // 授予徽章奖励
                }
                
                if (challenge.rewards.multiplier) {
                    this.pointsSystem.setMultiplier(
                        userId, 
                        challenge.rewards.multiplier, 
                        challenge.rewards.duration
                    );
                }
            }
            
            this._emit('challenge_completed', { userId, challengeId, result });
            
            return result;
        }

        /**
         * 获取用户游戏化状态
         */
        getUserGameState(userId) {
            return {
                points: this.pointsSystem.getStatistics(userId),
                badges: this.badgeSystem.getUserBadges(userId),
                leaderboard: this.leaderboard.getUserAllRanks(userId),
                challenges: {
                    available: this.challengeSystem.getAvailableChallenges(userId),
                    inProgress: this.challengeSystem.getInProgressChallenges(userId)
                },
                rewards: this.rewardSystem.getUserRewards(userId),
                stats: this.userStats.get(userId)
            };
        }

        /**
         * 获取排行榜
         */
        getLeaderboard(category, limit = 10) {
            return this.leaderboard.getLeaderboard(category, limit);
        }

        /**
         * 添加事件监听
         */
        on(event, callback) {
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            this.eventListeners.get(event).push(callback);
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            const listeners = this.eventListeners.get(event);
            if (listeners) {
                for (const callback of listeners) {
                    callback(data);
                }
            }
        }

        /**
         * 保存状态
         */
        save() {
            const data = {
                userPoints: Object.fromEntries(this.pointsSystem.userPoints),
                userBadges: Object.fromEntries(
                    Array.from(this.badgeSystem.userBadges.entries())
                        .map(([k, v]) => [k, v])
                ),
                userStats: Object.fromEntries(this.userStats),
                timestamp: Date.now()
            };
            
            // 可以保存到localStorage或发送到服务器
            try {
                localStorage.setItem('gamification_state', JSON.stringify(data));
            } catch (e) {
                if (typeof Logger !== 'undefined') {
                    Logger.warn('Gamification', '游戏化状态保存失败', e);
                }
            }
            
            return data;
        }

        /**
         * 加载状态
         */
        load() {
            try {
                const saved = localStorage.getItem('gamification_state');
                if (saved) {
                    const data = JSON.parse(saved);
                    
                    // 恢复积分
                    this.pointsSystem.userPoints = new Map(Object.entries(data.userPoints || {}));
                    
                    // 恢复徽章
                    this.badgeSystem.userBadges = new Map(Object.entries(data.userBadges || {}));
                    
                    // 恢复统计
                    this.userStats = new Map(Object.entries(data.userStats || {}));
                    
                    return true;
                }
            } catch (e) {
                if (typeof Logger !== 'undefined') {
                    Logger.warn('Gamification', '游戏化状态加载失败', e);
                }
            }
            
            return false;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    const GamificationLearning = {
        GamificationLearningSystem,
        PointsSystem,
        AchievementBadgeSystem,
        LeaderboardSystem,
        ChallengeTaskSystem,
        RewardSystem,
        PointType,
        AchievementLevel,
        ChallengeStatus,
        RewardType
    };

    // UMD导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = GamificationLearning;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return GamificationLearning; });
    } else {
        global.GamificationLearning = GamificationLearning;
    }

})(typeof window !== 'undefined' ? window : this);

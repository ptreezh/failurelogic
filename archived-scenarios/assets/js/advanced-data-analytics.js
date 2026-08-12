/**
 * 高级数据分析模块
 * Advanced Data Analytics Module
 * 
 * 功能：
 * - 学习行为分析
 * - 效果评估分析
 * - 趋势预测分析
 * - 异常检测
 * - 智能洞察生成
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环25
 */

(function(global) {
    'use strict';

    // ============================================
    // 分析类型枚举
    // ============================================
    const AnalysisType = {
        BEHAVIOR: 'behavior',           // 行为分析
        EFFECTIVENESS: 'effectiveness', // 效果评估
        TREND: 'trend',                 // 趋势预测
        ANOMALY: 'anomaly',             // 异常检测
        COMPARATIVE: 'comparative',     // 对比分析
        CORRELATION: 'correlation'      // 相关性分析
    };

    // ============================================
    // 时间粒度枚举
    // ============================================
    const TimeGranularity = {
        HOURLY: 'hourly',
        DAILY: 'daily',
        WEEKLY: 'weekly',
        MONTHLY: 'monthly',
        QUARTERLY: 'quarterly',
        YEARLY: 'yearly'
    };

    // ============================================
    // 分析指标定义
    // ============================================
    const Metrics = {
        // 学习行为指标
        SESSION_DURATION: 'sessionDuration',
        INTERACTION_COUNT: 'interactionCount',
        PAGE_VIEWS: 'pageViews',
        SCENARIO_COMPLETIONS: 'scenarioCompletions',
        DECISION_ACCURACY: 'decisionAccuracy',
        
        // 效果评估指标
        LEARNING_GAIN: 'learningGain',
        SKILL_IMPROVEMENT: 'skillImprovement',
        COGNITIVE_BIAS_REDUCTION: 'cognitiveBiasReduction',
        KNOWLEDGE_RETENTION: 'knowledgeRetention',
        
        // 参与度指标
        ENGAGEMENT_SCORE: 'engagementScore',
        RETURN_RATE: 'returnRate',
        COMPLETION_RATE: 'completionRate',
        ABANDONMENT_RATE: 'abandonmentRate'
    };

    // ============================================
    // 学习行为分析器
    // ============================================
    class LearningBehaviorAnalyzer {
        constructor() {
            this.behaviorData = [];
            this.patterns = new Map();
            this.clusters = [];
        }

        /**
         * 记录行为数据
         * @param {Object} behavior - 行为数据
         */
        recordBehavior(behavior) {
            const enrichedBehavior = {
                ...behavior,
                timestamp: behavior.timestamp || Date.now(),
                sessionId: behavior.sessionId || this._generateSessionId()
            };
            this.behaviorData.push(enrichedBehavior);
            this._updatePatterns(enrichedBehavior);
            return enrichedBehavior;
        }

        /**
         * 生成会话ID
         */
        _generateSessionId() {
            return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        /**
         * 更新模式识别
         */
        _updatePatterns(behavior) {
            const key = `${behavior.type}_${behavior.scenario}`;
            if (!this.patterns.has(key)) {
                this.patterns.set(key, {
                    count: 0,
                    avgDuration: 0,
                    totalDuration: 0,
                    outcomes: []
                });
            }
            const pattern = this.patterns.get(key);
            pattern.count++;
            pattern.totalDuration += behavior.duration || 0;
            pattern.avgDuration = pattern.totalDuration / pattern.count;
            if (behavior.outcome) {
                pattern.outcomes.push(behavior.outcome);
            }
        }

        /**
         * 分析行为模式
         * @param {string} granularity - 时间粒度
         * @returns {Object} 分析结果
         */
        analyzePatterns(granularity = TimeGranularity.DAILY) {
            const groupedData = this._groupByTime(granularity);
            const patterns = [];
            
            for (const [timeKey, behaviors] of Object.entries(groupedData)) {
                const pattern = {
                    timeKey,
                    totalCount: behaviors.length,
                    avgDuration: this._calculateAverage(behaviors, 'duration'),
                    interactionRate: this._calculateInteractionRate(behaviors),
                    topActions: this._getTopActions(behaviors, 5),
                    successRate: this._calculateSuccessRate(behaviors)
                };
                patterns.push(pattern);
            }
            
            return {
                granularity,
                patterns,
                summary: this._generatePatternSummary(patterns),
                trends: this._detectTrends(patterns)
            };
        }

        /**
         * 按时间分组
         */
        _groupByTime(granularity) {
            const groups = {};
            for (const behavior of this.behaviorData) {
                const timeKey = this._getTimeKey(behavior.timestamp, granularity);
                if (!groups[timeKey]) {
                    groups[timeKey] = [];
                }
                groups[timeKey].push(behavior);
            }
            return groups;
        }

        /**
         * 获取时间键
         */
        _getTimeKey(timestamp, granularity) {
            const date = new Date(timestamp);
            switch (granularity) {
                case TimeGranularity.HOURLY:
                    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
                case TimeGranularity.DAILY:
                    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
                case TimeGranularity.WEEKLY:
                    const week = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
                    return `${date.getFullYear()}-${date.getMonth() + 1}-W${week}`;
                case TimeGranularity.MONTHLY:
                    return `${date.getFullYear()}-${date.getMonth() + 1}`;
                case TimeGranularity.QUARTERLY:
                    const quarter = Math.ceil((date.getMonth() + 1) / 3);
                    return `${date.getFullYear()}-Q${quarter}`;
                case TimeGranularity.YEARLY:
                    return `${date.getFullYear()}`;
                default:
                    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            }
        }

        /**
         * 计算平均值
         */
        _calculateAverage(data, field) {
            if (data.length === 0) return 0;
            const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
            return sum / data.length;
        }

        /**
         * 计算交互率
         */
        _calculateInteractionRate(behaviors) {
            if (behaviors.length === 0) return 0;
            const interactiveCount = behaviors.filter(b => b.interactive).length;
            return interactiveCount / behaviors.length;
        }

        /**
         * 获取最频繁操作
         */
        _getTopActions(behaviors, limit) {
            const actionCounts = {};
            for (const b of behaviors) {
                const action = b.type || b.action || 'unknown';
                actionCounts[action] = (actionCounts[action] || 0) + 1;
            }
            return Object.entries(actionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([action, count]) => ({ action, count }));
        }

        /**
         * 计算成功率
         */
        _calculateSuccessRate(behaviors) {
            const withOutcome = behaviors.filter(b => b.outcome !== undefined);
            if (withOutcome.length === 0) return null;
            const successes = withOutcome.filter(b => b.outcome === 'success' || b.outcome === true).length;
            return successes / withOutcome.length;
        }

        /**
         * 生成模式摘要
         */
        _generatePatternSummary(patterns) {
            if (patterns.length === 0) return null;
            
            return {
                totalSessions: patterns.reduce((sum, p) => sum + p.totalCount, 0),
                avgSessionDuration: this._calculateAverage(patterns, 'avgDuration'),
                overallSuccessRate: this._calculateAverage(patterns, 'successRate'),
                peakActivityPeriod: this._findPeakActivity(patterns),
                mostFrequentActions: this._aggregateTopActions(patterns)
            };
        }

        /**
         * 检测趋势
         */
        _detectTrends(patterns) {
            if (patterns.length < 2) return null;
            
            const values = patterns.map(p => p.totalCount);
            const trend = this._calculateLinearTrend(values);
            
            return {
                direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
                slope: trend.slope,
                r2: trend.r2,
                prediction: this._predictNextValue(values, trend)
            };
        }

        /**
         * 计算线性趋势
         */
        _calculateLinearTrend(values) {
            const n = values.length;
            const xMean = (n - 1) / 2;
            const yMean = values.reduce((a, b) => a + b, 0) / n;
            
            let numerator = 0;
            let denominator = 0;
            
            for (let i = 0; i < n; i++) {
                numerator += (i - xMean) * (values[i] - yMean);
                denominator += Math.pow(i - xMean, 2);
            }
            
            const slope = denominator !== 0 ? numerator / denominator : 0;
            const intercept = yMean - slope * xMean;
            
            // 计算R²
            let ssRes = 0;
            let ssTot = 0;
            for (let i = 0; i < n; i++) {
                const predicted = slope * i + intercept;
                ssRes += Math.pow(values[i] - predicted, 2);
                ssTot += Math.pow(values[i] - yMean, 2);
            }
            const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 0;
            
            return { slope, intercept, r2 };
        }

        /**
         * 预测下一个值
         */
        _predictNextValue(values, trend) {
            const nextX = values.length;
            return trend.slope * nextX + trend.intercept;
        }

        /**
         * 查找峰值活动期
         */
        _findPeakActivity(patterns) {
            if (patterns.length === 0) return null;
            const peak = patterns.reduce((max, p) => p.totalCount > max.totalCount ? p : max, patterns[0]);
            return peak.timeKey;
        }

        /**
         * 聚合最频繁操作
         */
        _aggregateTopActions(patterns) {
            const allActions = {};
            for (const p of patterns) {
                for (const { action, count } of p.topActions) {
                    allActions[action] = (allActions[action] || 0) + count;
                }
            }
            return Object.entries(allActions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([action, count]) => ({ action, count }));
        }
    }

    // ============================================
    // 效果评估分析器
    // ============================================
    class EffectivenessAnalyzer {
        constructor() {
            this.assessments = [];
            this.baselines = new Map();
        }

        /**
         * 设置基准线
         * @param {string} metric - 指标名称
         * @param {number} value - 基准值
         */
        setBaseline(metric, value) {
            this.baselines.set(metric, {
                value,
                setAt: Date.now()
            });
        }

        /**
         * 记录评估数据
         * @param {Object} assessment - 评估数据
         */
        recordAssessment(assessment) {
            const enrichedAssessment = {
                ...assessment,
                timestamp: assessment.timestamp || Date.now(),
                id: assessment.id || `assess_${Date.now()}`
            };
            this.assessments.push(enrichedAssessment);
            return enrichedAssessment;
        }

        /**
         * 评估学习效果
         * @param {string} userId - 用户ID
         * @returns {Object} 效果评估结果
         */
        evaluateEffectiveness(userId) {
            const userAssessments = this.assessments.filter(a => a.userId === userId);
            
            if (userAssessments.length < 2) {
                return {
                    status: 'insufficient_data',
                    message: '需要至少两次评估数据'
                };
            }
            
            const sorted = userAssessments.sort((a, b) => a.timestamp - b.timestamp);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            
            // 计算各指标改进
            const improvements = {};
            for (const metric of Object.keys(Metrics)) {
                if (first[metric] !== undefined && last[metric] !== undefined) {
                    const change = last[metric] - first[metric];
                    const percentChange = first[metric] !== 0 ? (change / Math.abs(first[metric])) * 100 : 0;
                    improvements[metric] = {
                        startValue: first[metric],
                        endValue: last[metric],
                        change,
                        percentChange,
                        direction: change > 0 ? 'improved' : change < 0 ? 'declined' : 'stable'
                    };
                }
            }
            
            // 计算综合效果分数
            const effectivenessScore = this._calculateEffectivenessScore(improvements);
            
            return {
                userId,
                assessmentPeriod: {
                    start: first.timestamp,
                    end: last.timestamp,
                    duration: last.timestamp - first.timestamp
                },
                assessmentCount: userAssessments.length,
                improvements,
                effectivenessScore,
                level: this._getEffectivenessLevel(effectivenessScore),
                recommendations: this._generateRecommendations(improvements)
            };
        }

        /**
         * 计算效果分数
         */
        _calculateEffectivenessScore(improvements) {
            const weights = {
                [Metrics.LEARNING_GAIN]: 0.25,
                [Metrics.SKILL_IMPROVEMENT]: 0.20,
                [Metrics.COGNITIVE_BIAS_REDUCTION]: 0.20,
                [Metrics.DECISION_ACCURACY]: 0.20,
                [Metrics.KNOWLEDGE_RETENTION]: 0.15
            };
            
            let totalScore = 0;
            let totalWeight = 0;
            
            for (const [metric, weight] of Object.entries(weights)) {
                if (improvements[metric]) {
                    const normalizedChange = Math.min(Math.max(improvements[metric].percentChange / 100, -1), 1);
                    totalScore += normalizedChange * weight;
                    totalWeight += weight;
                }
            }
            
            return totalWeight > 0 ? (totalScore / totalWeight + 1) * 50 : 50; // 转换为0-100分
        }

        /**
         * 获取效果等级
         */
        _getEffectivenessLevel(score) {
            if (score >= 80) return 'excellent';
            if (score >= 60) return 'good';
            if (score >= 40) return 'moderate';
            if (score >= 20) return 'needs_improvement';
            return 'poor';
        }

        /**
         * 生成改进建议
         */
        _generateRecommendations(improvements) {
            const recommendations = [];
            
            for (const [metric, data] of Object.entries(improvements)) {
                if (data.direction === 'declined') {
                    recommendations.push({
                        metric,
                        priority: 'high',
                        suggestion: `需要重点关注${this._getMetricLabel(metric)}的改进`,
                        currentValue: data.endValue
                    });
                }
            }
            
            return recommendations;
        }

        /**
         * 获取指标标签
         */
        _getMetricLabel(metric) {
            const labels = {
                [Metrics.LEARNING_GAIN]: '学习收益',
                [Metrics.SKILL_IMPROVEMENT]: '技能提升',
                [Metrics.COGNITIVE_BIAS_REDUCTION]: '认知偏差减少',
                [Metrics.DECISION_ACCURACY]: '决策准确性',
                [Metrics.KNOWLEDGE_RETENTION]: '知识保持'
            };
            return labels[metric] || metric;
        }

        /**
         * 批量效果评估
         * @param {Array} userIds - 用户ID列表
         * @returns {Object} 批量评估结果
         */
        batchEvaluate(userIds) {
            const results = userIds.map(userId => this.evaluateEffectiveness(userId));
            
            return {
                totalUsers: userIds.length,
                successfulEvaluations: results.filter(r => r.status !== 'insufficient_data').length,
                averageScore: this._calculateAverage(results.filter(r => r.effectivenessScore).map(r => r.effectivenessScore)),
                levelDistribution: this._getLevelDistribution(results),
                details: results
            };
        }

        /**
         * 计算平均值
         */
        _calculateAverage(values) {
            if (values.length === 0) return 0;
            return values.reduce((a, b) => a + b, 0) / values.length;
        }

        /**
         * 获取等级分布
         */
        _getLevelDistribution(results) {
            const distribution = {};
            for (const r of results) {
                if (r.level) {
                    distribution[r.level] = (distribution[r.level] || 0) + 1;
                }
            }
            return distribution;
        }
    }

    // ============================================
    // 趋势预测分析器
    // ============================================
    class TrendPredictor {
        constructor() {
            this.timeSeriesData = new Map();
            this.models = new Map();
        }

        /**
         * 添加时序数据
         * @param {string} seriesId - 序列ID
         * @param {Array} data - 时序数据
         */
        addTimeSeries(seriesId, data) {
            this.timeSeriesData.set(seriesId, data);
            return this;
        }

        /**
         * 构建预测模型
         * @param {string} seriesId - 序列ID
         * @param {Object} options - 模型选项
         */
        buildModel(seriesId, options = {}) {
            const data = this.timeSeriesData.get(seriesId);
            if (!data || data.length < 3) {
                throw new Error('数据点不足，至少需要3个数据点');
            }
            
            const model = {
                type: options.type || 'linear',
                createdAt: Date.now(),
                dataPoints: data.length
            };
            
            // 根据模型类型构建
            switch (model.type) {
                case 'linear':
                    Object.assign(model, this._buildLinearModel(data));
                    break;
                case 'exponential':
                    Object.assign(model, this._buildExponentialModel(data));
                    break;
                case 'moving_average':
                    Object.assign(model, this._buildMovingAverageModel(data, options.windowSize || 3));
                    break;
                case 'polynomial':
                    Object.assign(model, this._buildPolynomialModel(data, options.degree || 2));
                    break;
                default:
                    Object.assign(model, this._buildLinearModel(data));
            }
            
            this.models.set(seriesId, model);
            return model;
        }

        /**
         * 构建线性模型
         */
        _buildLinearModel(data) {
            const n = data.length;
            const xMean = (n - 1) / 2;
            const yMean = data.reduce((a, b) => a + b, 0) / n;
            
            let numerator = 0;
            let denominator = 0;
            
            for (let i = 0; i < n; i++) {
                numerator += (i - xMean) * (data[i] - yMean);
                denominator += Math.pow(i - xMean, 2);
            }
            
            const slope = denominator !== 0 ? numerator / denominator : 0;
            const intercept = yMean - slope * xMean;
            
            // 计算残差
            const residuals = data.map((y, i) => y - (slope * i + intercept));
            const mse = residuals.reduce((sum, r) => sum + r * r, 0) / n;
            
            return { slope, intercept, mse, rmse: Math.sqrt(mse) };
        }

        /**
         * 构建指数模型
         */
        _buildExponentialModel(data) {
            // 转换为对数线性
            const logData = data.map(y => Math.log(Math.max(y, 0.001)));
            const linearModel = this._buildLinearModel(logData);
            
            return {
                a: Math.exp(linearModel.intercept),
                b: linearModel.slope,
                predict: (x) => this.a * Math.exp(this.b * x),
                rmse: linearModel.rmse
            };
        }

        /**
         * 构建移动平均模型
         */
        _buildMovingAverageModel(data, windowSize) {
            const movingAverages = [];
            for (let i = windowSize - 1; i < data.length; i++) {
                const window = data.slice(i - windowSize + 1, i + 1);
                movingAverages.push(window.reduce((a, b) => a + b, 0) / windowSize);
            }
            
            return {
                windowSize,
                movingAverages,
                lastValue: movingAverages[movingAverages.length - 1],
                predict: () => this.lastValue
            };
        }

        /**
         * 构建多项式模型
         */
        _buildPolynomialModel(data, degree) {
            // 简化的多项式拟合（使用最小二乘法）
            const n = data.length;
            const coefficients = [];
            
            // 构建范德蒙矩阵并求解（简化版本）
            for (let k = 0; k <= degree; k++) {
                let sum = 0;
                for (let i = 0; i < n; i++) {
                    sum += data[i] * Math.pow(i, k);
                }
                coefficients.push(sum / n);
            }
            
            return {
                degree,
                coefficients,
                predict: (x) => {
                    let result = 0;
                    for (let k = 0; k <= degree; k++) {
                        result += coefficients[k] * Math.pow(x, k);
                    }
                    return result;
                }
            };
        }

        /**
         * 预测未来值
         * @param {string} seriesId - 序列ID
         * @param {number} steps - 预测步数
         * @returns {Array} 预测结果
         */
        predict(seriesId, steps = 5) {
            const model = this.models.get(seriesId);
            const data = this.timeSeriesData.get(seriesId);
            
            if (!model || !data) {
                throw new Error('模型或数据不存在');
            }
            
            const predictions = [];
            const startIndex = data.length;
            
            for (let i = 0; i < steps; i++) {
                const x = startIndex + i;
                let predicted;
                
                switch (model.type) {
                    case 'linear':
                        predicted = model.slope * x + model.intercept;
                        break;
                    case 'exponential':
                        predicted = model.a * Math.exp(model.b * x);
                        break;
                    case 'moving_average':
                        predicted = model.lastValue;
                        break;
                    case 'polynomial':
                        predicted = model.predict(x);
                        break;
                    default:
                        predicted = model.slope * x + model.intercept;
                }
                
                predictions.push({
                    step: i + 1,
                    timestamp: Date.now() + (i + 1) * 86400000, // 假设每日数据
                    value: predicted,
                    confidence: Math.max(0.5, 1 - i * 0.1) // 简化的置信度递减
                });
            }
            
            return {
                seriesId,
                modelType: model.type,
                predictions,
                lastActualValue: data[data.length - 1],
                trend: this._determineTrend(model)
            };
        }

        /**
         * 确定趋势方向
         */
        _determineTrend(model) {
            if (model.slope !== undefined) {
                if (model.slope > 0.01) return 'increasing';
                if (model.slope < -0.01) return 'decreasing';
                return 'stable';
            }
            return 'unknown';
        }
    }

    // ============================================
    // 异常检测器
    // ============================================
    class AnomalyDetector {
        constructor(options = {}) {
            this.threshold = options.threshold || 2; // 标准差倍数
            this.minSamples = options.minSamples || 5;
            this.statistics = new Map();
        }

        /**
         * 添加数据点
         * @param {string} metricId - 指标ID
         * @param {number} value - 数据值
         */
        addDataPoint(metricId, value) {
            if (!this.statistics.has(metricId)) {
                this.statistics.set(metricId, {
                    values: [],
                    mean: 0,
                    stdDev: 0,
                    min: Infinity,
                    max: -Infinity
                });
            }
            
            const stats = this.statistics.get(metricId);
            stats.values.push(value);
            stats.min = Math.min(stats.min, value);
            stats.max = Math.max(stats.max, value);
            
            // 更新统计量
            if (stats.values.length >= this.minSamples) {
                this._updateStatistics(stats);
            }
            
            return this;
        }

        /**
         * 更新统计量
         */
        _updateStatistics(stats) {
            const values = stats.values;
            const n = values.length;
            
            // 计算均值
            stats.mean = values.reduce((a, b) => a + b, 0) / n;
            
            // 计算标准差
            const squaredDiffs = values.map(v => Math.pow(v - stats.mean, 2));
            stats.stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / n);
        }

        /**
         * 检测异常
         * @param {string} metricId - 指标ID
         * @param {number} value - 待检测值
         * @returns {Object} 检测结果
         */
        detect(metricId, value) {
            const stats = this.statistics.get(metricId);
            
            if (!stats || stats.values.length < this.minSamples) {
                return {
                    isAnomaly: false,
                    reason: 'insufficient_data',
                    message: `需要至少${this.minSamples}个样本数据`
                };
            }
            
            // Z-score检测
            const zScore = stats.stdDev > 0 ? Math.abs(value - stats.mean) / stats.stdDev : 0;
            const isAnomaly = zScore > this.threshold;
            
            // IQR检测
            const sorted = [...stats.values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            const isIqrAnomaly = value < lowerBound || value > upperBound;
            
            return {
                isAnomaly: isAnomaly || isIqrAnomaly,
                value,
                zScore,
                threshold: this.threshold,
                statistics: {
                    mean: stats.mean,
                    stdDev: stats.stdDev,
                    min: stats.min,
                    max: stats.max,
                    q1,
                    q3,
                    iqr
                },
                methods: {
                    zScore: {
                        isAnomaly,
                        zScore
                    },
                    iqr: {
                        isAnomaly: isIqrAnomaly,
                        bounds: { lower: lowerBound, upper: upperBound }
                    }
                },
                severity: this._getSeverity(zScore),
                recommendation: isAnomaly || isIqrAnomaly ? this._getRecommendation(zScore) : null
            };
        }

        /**
         * 获取异常严重程度
         */
        _getSeverity(zScore) {
            if (zScore > 3) return 'critical';
            if (zScore > 2.5) return 'high';
            if (zScore > 2) return 'medium';
            return 'low';
        }

        /**
         * 获取异常建议
         */
        _getRecommendation(zScore) {
            if (zScore > 3) return '建议立即调查此异常值，可能存在严重问题';
            if (zScore > 2.5) return '建议关注此数据点，可能存在潜在问题';
            return '建议记录并监控此异常情况';
        }

        /**
         * 批量检测
         * @param {Object} dataPoints - 数据点对象
         * @returns {Object} 检测结果
         */
        batchDetect(dataPoints) {
            const results = {};
            const anomalies = [];
            
            for (const [metricId, value] of Object.entries(dataPoints)) {
                const result = this.detect(metricId, value);
                results[metricId] = result;
                
                if (result.isAnomaly) {
                    anomalies.push({
                        metricId,
                        ...result
                    });
                }
            }
            
            return {
                totalChecked: Object.keys(dataPoints).length,
                anomalyCount: anomalies.length,
                anomalies,
                details: results,
                summary: this._generateSummary(anomalies)
            };
        }

        /**
         * 生成摘要
         */
        _generateSummary(anomalies) {
            if (anomalies.length === 0) {
                return { status: 'normal', message: '所有指标均在正常范围内' };
            }
            
            const severityCount = {
                critical: anomalies.filter(a => a.severity === 'critical').length,
                high: anomalies.filter(a => a.severity === 'high').length,
                medium: anomalies.filter(a => a.severity === 'medium').length,
                low: anomalies.filter(a => a.severity === 'low').length
            };
            
            return {
                status: severityCount.critical > 0 ? 'critical' : 
                        severityCount.high > 0 ? 'warning' : 'attention',
                message: `发现${anomalies.length}个异常指标`,
                severityDistribution: severityCount
            };
        }
    }

    // ============================================
    // 高级数据分析管理器
    // ============================================
    class AdvancedDataAnalyticsManager {
        constructor(options = {}) {
            this.behaviorAnalyzer = new LearningBehaviorAnalyzer();
            this.effectivenessAnalyzer = new EffectivenessAnalyzer();
            this.trendPredictor = new TrendPredictor();
            this.anomalyDetector = new AnomalyDetector(options.anomalyDetection || {});
            
            this.config = {
                autoAnomalyDetection: options.autoAnomalyDetection !== false,
                predictionSteps: options.predictionSteps || 5,
                analysisInterval: options.analysisInterval || 3600000 // 1小时
            };
            
            this.analysisHistory = [];
        }

        /**
         * 执行综合分析
         * @param {Object} params - 分析参数
         * @returns {Object} 综合分析结果
         */
        runComprehensiveAnalysis(params) {
            const startTime = Date.now();
            const results = {
                timestamp: startTime,
                params,
                behavior: null,
                effectiveness: null,
                trends: null,
                anomalies: null,
                insights: []
            };
            
            // 行为分析
            if (params.includeBehavior !== false) {
                results.behavior = this.behaviorAnalyzer.analyzePatterns(
                    params.granularity || TimeGranularity.DAILY
                );
            }
            
            // 效果评估
            if (params.userId) {
                results.effectiveness = this.effectivenessAnalyzer.evaluateEffectiveness(params.userId);
            }
            
            // 趋势预测
            if (params.predictTrends && params.timeSeriesData) {
                results.trends = {};
                for (const [seriesId, data] of Object.entries(params.timeSeriesData)) {
                    this.trendPredictor.addTimeSeries(seriesId, data);
                    this.trendPredictor.buildModel(seriesId, params.modelOptions || {});
                    results.trends[seriesId] = this.trendPredictor.predict(seriesId, this.config.predictionSteps);
                }
            }
            
            // 异常检测
            if (params.includeAnomalies !== false) {
                results.anomalies = this.anomalyDetector.batchDetect(params.metrics || {});
            }
            
            // 生成洞察
            results.insights = this._generateInsights(results);
            
            // 记录分析历史
            this.analysisHistory.push({
                timestamp: startTime,
                duration: Date.now() - startTime,
                summary: this._createSummary(results)
            });
            
            return results;
        }

        /**
         * 生成智能洞察
         */
        _generateInsights(results) {
            const insights = [];
            
            // 行为洞察
            if (results.behavior && results.behavior.trends) {
                const trend = results.behavior.trends;
                if (trend.direction === 'increasing') {
                    insights.push({
                        type: 'behavior',
                        importance: 'high',
                        message: '用户活跃度呈上升趋势，建议抓住机会推送更多内容',
                        data: trend
                    });
                } else if (trend.direction === 'decreasing') {
                    insights.push({
                        type: 'behavior',
                        importance: 'high',
                        message: '用户活跃度呈下降趋势，需要调查原因并采取留存措施',
                        data: trend
                    });
                }
            }
            
            // 效果洞察
            if (results.effectiveness && results.effectiveness.effectivenessScore !== undefined) {
                const score = results.effectiveness.effectivenessScore;
                if (score < 40) {
                    insights.push({
                        type: 'effectiveness',
                        importance: 'critical',
                        message: '学习效果评分较低，建议调整学习策略或内容难度',
                        data: { score }
                    });
                }
            }
            
            // 异常洞察
            if (results.anomalies && results.anomalies.anomalyCount > 0) {
                insights.push({
                    type: 'anomaly',
                    importance: results.anomalies.summary.status === 'critical' ? 'critical' : 'high',
                    message: `检测到${results.anomalies.anomalyCount}个异常指标，建议重点关注`,
                    data: results.anomalies.summary
                });
            }
            
            return insights;
        }

        /**
         * 创建分析摘要
         */
        _createSummary(results) {
            return {
                hasBehaviorData: !!results.behavior,
                hasEffectivenessData: !!results.effectiveness,
                hasTrendData: !!results.trends,
                anomalyCount: results.anomalies ? results.anomalies.anomalyCount : 0,
                insightCount: results.insights.length
            };
        }

        /**
         * 获取分析历史
         */
        getAnalysisHistory(limit = 10) {
            return this.analysisHistory.slice(-limit);
        }

        /**
         * 导出分析报告
         */
        exportReport(format = 'json') {
            const report = {
                generatedAt: Date.now(),
                version: '3.0.0',
                statistics: {
                    totalAnalyses: this.analysisHistory.length,
                    behaviorRecords: this.behaviorAnalyzer.behaviorData.length,
                    assessmentRecords: this.effectivenessAnalyzer.assessments.length
                }
            };
            
            if (format === 'json') {
                return JSON.stringify(report, null, 2);
            }
            
            return report;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    const AdvancedDataAnalytics = {
        AnalysisType,
        TimeGranularity,
        Metrics,
        LearningBehaviorAnalyzer,
        EffectivenessAnalyzer,
        TrendPredictor,
        AnomalyDetector,
        AdvancedDataAnalyticsManager,
        
        // 便捷创建方法
        createManager: (options) => new AdvancedDataAnalyticsManager(options),
        createBehaviorAnalyzer: () => new LearningBehaviorAnalyzer(),
        createEffectivenessAnalyzer: () => new EffectivenessAnalyzer(),
        createTrendPredictor: () => new TrendPredictor(),
        createAnomalyDetector: (options) => new AnomalyDetector(options)
    };

    // UMD导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AdvancedDataAnalytics;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return AdvancedDataAnalytics; });
    } else {
        global.AdvancedDataAnalytics = AdvancedDataAnalytics;
    }

})(typeof window !== 'undefined' ? window : this);

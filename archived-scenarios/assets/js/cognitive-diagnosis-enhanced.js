/**
 * 认知诊断增强模块
 * Cognitive Diagnosis Enhanced Module
 * 
 * 功能：
 * - 认知偏差检测器增强版
 * - 多维度诊断报告
 * - 诊断结果可视化
 * - 个性化诊断建议
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环21
 */

(function(global) {
    'use strict';

    // ============================================
    // 认知偏差类型定义
    // ============================================
    const BiasType = {
        CONFIRMATION: 'confirmation',           // 确认偏误
        ANCHORING: 'anchoring',                 // 锚定效应
        AVAILABILITY: 'availability',           // 可得性启发
        REPRESENTATIVENESS: 'representativeness', // 代表性启发
        SUNK_COST: 'sunk_cost',                 // 沉没成本谬误
        FRAMING: 'framing',                     // 框架效应
        HINDSIGHT: 'hindsight',                 // 后见之明
        OVERCONFIDENCE: 'overconfidence',       // 过度自信
        LOSS_AVERSION: 'loss_aversion',         // 损失厌恶
        STATUS_QUO: 'status_quo',               // 现状偏见
        RECENCY: 'recency',                     // 近因效应
        PRIMACY: 'primacy',                     // 首因效应
        GAMBLER_FALLACY: 'gambler_fallacy',     // 赌徒谬误
        OPTIMISM: 'optimism',                   // 乐观偏见
        ATTRIBUTION: 'attribution',             // 归因错误
        DUNNING_KRUGER: 'dunning_kruger'        // 达克效应
    };

    // ============================================
    // 诊断维度
    // ============================================
    const DiagnosisDimension = {
        COGNITIVE: 'cognitive',          // 认知维度
        BEHAVIORAL: 'behavioral',        // 行为维度
        EMOTIONAL: 'emotional',          // 情绪维度
        SOCIAL: 'social',                // 社会维度
        TEMPORAL: 'temporal',            // 时间维度
        CONTEXTUAL: 'contextual'         // 情境维度
    };

    // ============================================
    // 严重程度等级
    // ============================================
    const SeverityLevel = {
        NONE: 0,       // 无偏差
        MILD: 1,       // 轻度
        MODERATE: 2,   // 中度
        SEVERE: 3,     // 严重
        CRITICAL: 4    // 关键
    };

    // ============================================
    // 偏差检测规则
    // ============================================
    class BiasDetectionRule {
        constructor(config) {
            this.id = config.id || `rule_${Date.now()}`;
            this.biasType = config.biasType;
            this.name = config.name;
            this.description = config.description;
            this.conditions = config.conditions || [];
            this.indicators = config.indicators || [];
            this.weight = config.weight || 1.0;
            this.confidence = config.confidence || 0.8;
        }

        /**
         * 评估规则
         */
        evaluate(data) {
            let matchCount = 0;
            const matchedIndicators = [];
            
            for (const indicator of this.indicators) {
                if (this._checkIndicator(indicator, data)) {
                    matchCount++;
                    matchedIndicators.push(indicator);
                }
            }
            
            const matchRatio = this.indicators.length > 0 
                ? matchCount / this.indicators.length 
                : 0;
            
            return {
                matched: matchRatio >= 0.5,
                matchRatio,
                matchedIndicators,
                confidence: this.confidence * matchRatio,
                severity: this._calculateSeverity(matchRatio)
            };
        }

        /**
         * 检查指标
         */
        _checkIndicator(indicator, data) {
            const value = this._getNestedValue(data, indicator.path);
            
            switch (indicator.operator) {
                case 'equals':
                    return value === indicator.value;
                case 'greater_than':
                    return value > indicator.value;
                case 'less_than':
                    return value < indicator.value;
                case 'contains':
                    return String(value).includes(indicator.value);
                case 'pattern':
                    return new RegExp(indicator.value).test(String(value));
                case 'in_range':
                    return value >= indicator.min && value <= indicator.max;
                default:
                    return false;
            }
        }

        /**
         * 获取嵌套值
         */
        _getNestedValue(obj, path) {
            return path.split('.').reduce((current, key) => {
                return current && current[key] !== undefined ? current[key] : null;
            }, obj);
        }

        /**
         * 计算严重程度
         */
        _calculateSeverity(matchRatio) {
            if (matchRatio >= 0.9) return SeverityLevel.CRITICAL;
            if (matchRatio >= 0.7) return SeverityLevel.SEVERE;
            if (matchRatio >= 0.5) return SeverityLevel.MODERATE;
            if (matchRatio >= 0.3) return SeverityLevel.MILD;
            return SeverityLevel.NONE;
        }
    }

    // ============================================
    // 认知偏差检测器
    // ============================================
    class EnhancedBiasDetector {
        constructor() {
            this.rules = new Map();
            this.detectionHistory = [];
            this.learningEnabled = true;
            this._initializeDefaultRules();
        }

        /**
         * 初始化默认检测规则
         */
        _initializeDefaultRules() {
            // 确认偏误检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.CONFIRMATION,
                name: '确认偏误检测',
                description: '检测用户是否倾向于寻找支持已有观点的信息',
                indicators: [
                    { path: 'decision.pattern', operator: 'equals', value: 'selective_search' },
                    { path: 'decision.infoSeeking', operator: 'equals', value: 'one_sided' },
                    { path: 'behavior.disconfirmCount', operator: 'less_than', value: 2 },
                    { path: 'behavior.confirmCount', operator: 'greater_than', value: 5 }
                ],
                weight: 1.0,
                confidence: 0.85
            }));

            // 沉没成本谬误检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.SUNK_COST,
                name: '沉没成本谬误检测',
                description: '检测用户是否因已投入资源而继续不合理的决策',
                indicators: [
                    { path: 'decision.continuedInvestment', operator: 'equals', value: true },
                    { path: 'decision.negativeReturn', operator: 'equals', value: true },
                    { path: 'behavior.rationalization', operator: 'contains', value: 'already_spent' },
                    { path: 'metrics.lossRatio', operator: 'greater_than', value: 0.5 }
                ],
                weight: 1.0,
                confidence: 0.9
            }));

            // 过度自信检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.OVERCONFIDENCE,
                name: '过度自信检测',
                description: '检测用户是否高估自己的判断准确性',
                indicators: [
                    { path: 'confidence.selfRating', operator: 'greater_than', value: 0.8 },
                    { path: 'confidence.actualAccuracy', operator: 'less_than', value: 0.6 },
                    { path: 'behavior.riskTaking', operator: 'greater_than', value: 0.7 },
                    { path: 'decision.speed', operator: 'greater_than', value: 0.8 }
                ],
                weight: 1.0,
                confidence: 0.8
            }));

            // 损失厌恶检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.LOSS_AVERSION,
                name: '损失厌恶检测',
                description: '检测用户是否对损失的反应强于同等收益',
                indicators: [
                    { path: 'decision.riskPreference', operator: 'equals', value: 'loss_averse' },
                    { path: 'behavior.gainLossRatio', operator: 'greater_than', value: 2 },
                    { path: 'decision.sureGainPreference', operator: 'equals', value: true },
                    { path: 'metrics.riskAversionScore', operator: 'greater_than', value: 0.7 }
                ],
                weight: 1.0,
                confidence: 0.85
            }));

            // 赌徒谬误检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.GAMBLER_FALLACY,
                name: '赌徒谬误检测',
                description: '检测用户是否错误地认为随机事件有记忆性',
                indicators: [
                    { path: 'decision.pattern', operator: 'equals', value: 'probability_correction' },
                    { path: 'behavior.streakExpectation', operator: 'equals', value: true },
                    { path: 'reasoning.independenceViolation', operator: 'equals', value: true },
                    { path: 'prediction.baseRateNeglect', operator: 'equals', value: true }
                ],
                weight: 1.0,
                confidence: 0.85
            }));

            // 锚定效应检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.ANCHORING,
                name: '锚定效应检测',
                description: '检测用户是否过度依赖初始信息',
                indicators: [
                    { path: 'decision.anchoredValue', operator: 'equals', value: true },
                    { path: 'behavior.adjustmentRatio', operator: 'less_than', value: 0.3 },
                    { path: 'decision.firstInfoWeight', operator: 'greater_than', value: 0.6 },
                    { path: 'metrics.anchorInfluence', operator: 'greater_than', value: 0.5 }
                ],
                weight: 1.0,
                confidence: 0.8
            }));

            // 框架效应检测规则
            this.addRule(new BiasDetectionRule({
                biasType: BiasType.FRAMING,
                name: '框架效应检测',
                description: '检测用户是否受问题表述方式影响',
                indicators: [
                    { path: 'decision.frameDependency', operator: 'equals', value: true },
                    { path: 'behavior.positiveNegativeBias', operator: 'greater_than', value: 0.6 },
                    { path: 'decision.riskPreferenceShift', operator: 'greater_than', value: 0.4 },
                    { path: 'metrics.frameInfluence', operator: 'greater_than', value: 0.5 }
                ],
                weight: 1.0,
                confidence: 0.85
            }));
        }

        /**
         * 添加规则
         */
        addRule(rule) {
            this.rules.set(rule.id, rule);
        }

        /**
         * 执行偏差检测
         */
        detect(data) {
            const results = [];
            
            for (const [ruleId, rule] of this.rules) {
                const evaluation = rule.evaluate(data);
                
                if (evaluation.matched) {
                    results.push({
                        ruleId,
                        biasType: rule.biasType,
                        name: rule.name,
                        description: rule.description,
                        ...evaluation,
                        weight: rule.weight,
                        timestamp: Date.now()
                    });
                }
            }
            
            // 按严重程度排序
            results.sort((a, b) => b.severity - a.severity);
            
            // 记录检测历史
            this.detectionHistory.push({
                timestamp: Date.now(),
                dataSummary: this._summarizeData(data),
                resultsCount: results.length,
                topBias: results[0]?.biasType || null
            });
            
            // 学习模式：根据历史调整规则
            if (this.learningEnabled) {
                this._learnFromDetection(results, data);
            }
            
            return results;
        }

        /**
         * 数据摘要
         */
        _summarizeData(data) {
            return {
                hasDecision: !!data.decision,
                hasBehavior: !!data.behavior,
                hasMetrics: !!data.metrics,
                keys: Object.keys(data)
            };
        }

        /**
         * 从检测结果学习
         */
        _learnFromDetection(results, data) {
            // 分析检测模式，优化规则权重
            if (this.detectionHistory.length > 10) {
                const recentHistory = this.detectionHistory.slice(-10);
                const biasFrequency = {};
                
                for (const record of recentHistory) {
                    if (record.topBias) {
                        biasFrequency[record.topBias] = (biasFrequency[record.topBias] || 0) + 1;
                    }
                }
                
                // 调整频繁出现的偏差的规则权重
                for (const [ruleId, rule] of this.rules) {
                    const frequency = biasFrequency[rule.biasType] || 0;
                    if (frequency > 3) {
                        rule.weight = Math.min(1.5, rule.weight + 0.1);
                    }
                }
            }
        }

        /**
         * 获取检测统计
         */
        getStatistics() {
            const stats = {
                totalDetections: this.detectionHistory.length,
                biasDistribution: {},
                averageSeverity: 0,
                recentTrends: []
            };
            
            let totalSeverity = 0;
            
            for (const record of this.detectionHistory) {
                if (record.topBias) {
                    stats.biasDistribution[record.topBias] = 
                        (stats.biasDistribution[record.topBias] || 0) + 1;
                }
            }
            
            return stats;
        }
    }

    // ============================================
    // 多维度诊断报告
    // ============================================
    class MultiDimensionalDiagnosisReport {
        constructor(userId) {
            this.userId = userId;
            this.timestamp = Date.now();
            this.dimensions = new Map();
            this.biases = [];
            this.recommendations = [];
            this.overallScore = 0;
            this.riskLevel = 'low';
        }

        /**
         * 添加维度分析
         */
        addDimensionAnalysis(dimension, analysis) {
            this.dimensions.set(dimension, {
                dimension,
                score: analysis.score || 0,
                level: analysis.level || 'normal',
                findings: analysis.findings || [],
                metrics: analysis.metrics || {},
                timestamp: Date.now()
            });
        }

        /**
         * 计算总体得分
         */
        calculateOverallScore() {
            let totalScore = 0;
            let count = 0;
            
            for (const [dimension, data] of this.dimensions) {
                totalScore += data.score;
                count++;
            }
            
            this.overallScore = count > 0 ? totalScore / count : 0;
            this.riskLevel = this._determineRiskLevel(this.overallScore);
            
            return this.overallScore;
        }

        /**
         * 确定风险等级
         */
        _determineRiskLevel(score) {
            if (score >= 0.8) return 'low';
            if (score >= 0.6) return 'moderate';
            if (score >= 0.4) return 'high';
            return 'critical';
        }

        /**
         * 生成诊断摘要
         */
        generateSummary() {
            const dimensionSummaries = [];
            
            for (const [dimension, data] of this.dimensions) {
                dimensionSummaries.push({
                    dimension,
                    score: data.score,
                    level: data.level,
                    keyFindings: data.findings.slice(0, 3)
                });
            }
            
            return {
                userId: this.userId,
                timestamp: this.timestamp,
                overallScore: this.overallScore,
                riskLevel: this.riskLevel,
                biasCount: this.biases.length,
                dimensionSummaries,
                topBiases: this.biases.slice(0, 3).map(b => ({
                    type: b.biasType,
                    severity: b.severity,
                    name: b.name
                }))
            };
        }

        /**
         * 序列化
         */
        toJSON() {
            return {
                userId: this.userId,
                timestamp: this.timestamp,
                overallScore: this.overallScore,
                riskLevel: this.riskLevel,
                dimensions: Object.fromEntries(this.dimensions),
                biases: this.biases,
                recommendations: this.recommendations
            };
        }
    }

    // ============================================
    // 诊断结果可视化
    // ============================================
    class DiagnosisVisualizer {
        constructor(containerId) {
            this.containerId = containerId;
            this.container = null;
            this.charts = new Map();
        }

        /**
         * 初始化
         */
        init() {
            this.container = document.getElementById(this.containerId);
            if (!this.container) {
                Logger?.warn(`诊断可视化容器 #${this.containerId} 未找到`);
                return false;
            }
            return true;
        }

        /**
         * 渲染雷达图
         */
        renderRadarChart(report) {
            const canvas = this._createCanvas('radar-chart');
            const ctx = canvas.getContext('2d');
            
            const dimensions = Array.from(report.dimensions.values());
            const labels = dimensions.map(d => this._getDimensionLabel(d.dimension));
            const scores = dimensions.map(d => d.score);
            
            // 绘制雷达图背景
            this._drawRadarBackground(ctx, canvas, labels.length);
            
            // 绘制数据
            this._drawRadarData(ctx, canvas, scores, '#4CAF50');
            
            return canvas;
        }

        /**
         * 绘制雷达图背景
         */
        _drawRadarBackground(ctx, canvas, numAxes) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 50;
            
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            
            // 绘制同心圆
            for (let i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * i / 5, 0, 2 * Math.PI);
                ctx.stroke();
            }
            
            // 绘制轴
            for (let i = 0; i < numAxes; i++) {
                const angle = (2 * Math.PI * i / numAxes) - Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + radius * Math.cos(angle),
                    centerY + radius * Math.sin(angle)
                );
                ctx.stroke();
            }
        }

        /**
         * 绘制雷达图数据
         */
        _drawRadarData(ctx, canvas, scores, color) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 50;
            
            ctx.fillStyle = color + '40';
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            for (let i = 0; i < scores.length; i++) {
                const angle = (2 * Math.PI * i / scores.length) - Math.PI / 2;
                const r = radius * scores[i];
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        /**
         * 渲染偏差分布图
         */
        renderBiasDistribution(biases) {
            const canvas = this._createCanvas('bias-distribution');
            const ctx = canvas.getContext('2d');
            
            // 统计各类型偏差
            const distribution = {};
            for (const bias of biases) {
                distribution[bias.biasType] = (distribution[bias.biasType] || 0) + 1;
            }
            
            const types = Object.keys(distribution);
            const counts = Object.values(distribution);
            
            // 绘制柱状图
            this._drawBarChart(ctx, canvas, types, counts);
            
            return canvas;
        }

        /**
         * 绘制柱状图
         */
        _drawBarChart(ctx, canvas, labels, values) {
            const padding = 40;
            const barWidth = (canvas.width - padding * 2) / labels.length - 10;
            const maxValue = Math.max(...values);
            const scale = (canvas.height - padding * 2) / maxValue;
            
            ctx.fillStyle = '#2196F3';
            
            for (let i = 0; i < values.length; i++) {
                const x = padding + i * (barWidth + 10);
                const height = values[i] * scale;
                const y = canvas.height - padding - height;
                
                ctx.fillRect(x, y, barWidth, height);
                
                // 标签
                ctx.fillStyle = '#333';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(labels[i].substring(0, 6), x + barWidth / 2, canvas.height - 10);
                ctx.fillStyle = '#2196F3';
            }
        }

        /**
         * 渲染趋势图
         */
        renderTrendChart(history) {
            const canvas = this._createCanvas('trend-chart');
            const ctx = canvas.getContext('2d');
            
            if (history.length < 2) {
                ctx.fillStyle = '#999';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('需要更多数据', canvas.width / 2, canvas.height / 2);
                return canvas;
            }
            
            const scores = history.map(h => h.overallScore);
            this._drawLineChart(ctx, canvas, scores);
            
            return canvas;
        }

        /**
         * 绘制折线图
         */
        _drawLineChart(ctx, canvas, values) {
            const padding = 40;
            const width = canvas.width - padding * 2;
            const height = canvas.height - padding * 2;
            
            ctx.strokeStyle = '#FF5722';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let i = 0; i < values.length; i++) {
                const x = padding + (i / (values.length - 1)) * width;
                const y = canvas.height - padding - values[i] * height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // 绘制数据点
            ctx.fillStyle = '#FF5722';
            for (let i = 0; i < values.length; i++) {
                const x = padding + (i / (values.length - 1)) * width;
                const y = canvas.height - padding - values[i] * height;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        /**
         * 创建画布
         */
        _createCanvas(id) {
            const canvas = document.createElement('canvas');
            canvas.id = id;
            canvas.width = 400;
            canvas.height = 300;
            canvas.style.border = '1px solid #e0e0e0';
            canvas.style.borderRadius = '8px';
            canvas.style.margin = '10px';
            return canvas;
        }

        /**
         * 获取维度标签
         */
        _getDimensionLabel(dimension) {
            const labels = {
                [DiagnosisDimension.COGNITIVE]: '认知',
                [DiagnosisDimension.BEHAVIORAL]: '行为',
                [DiagnosisDimension.EMOTIONAL]: '情绪',
                [DiagnosisDimension.SOCIAL]: '社会',
                [DiagnosisDimension.TEMPORAL]: '时间',
                [DiagnosisDimension.CONTEXTUAL]: '情境'
            };
            return labels[dimension] || dimension;
        }
    }

    // ============================================
    // 个性化诊断建议生成器
    // ============================================
    class PersonalizedRecommendationEngine {
        constructor() {
            this.recommendationTemplates = this._initializeTemplates();
            this.userProfiles = new Map();
        }

        /**
         * 初始化建议模板
         */
        _initializeTemplates() {
            return {
                [BiasType.CONFIRMATION]: {
                    title: '克服确认偏误',
                    strategies: [
                        '主动寻找反对证据',
                        '使用"魔鬼代言人"思考法',
                        '记录并反思自己的假设',
                        '咨询持不同观点的人'
                    ],
                    exercises: [
                        { name: '反向论证', duration: 15, difficulty: 'medium' },
                        { name: '证据平衡表', duration: 10, difficulty: 'easy' }
                    ],
                    resources: [
                        '《思考，快与慢》相关章节',
                        '批判性思维训练课程'
                    ]
                },
                [BiasType.SUNK_COST]: {
                    title: '避免沉没成本陷阱',
                    strategies: [
                        '决策时忽略已投入成本',
                        '使用零基思维重新评估',
                        '设定止损点',
                        '定期重新评估项目价值'
                    ],
                    exercises: [
                        { name: '零基决策', duration: 20, difficulty: 'hard' },
                        { name: '止损模拟', duration: 15, difficulty: 'medium' }
                    ],
                    resources: [
                        '《决策陷阱》相关案例',
                        '投资决策心理课程'
                    ]
                },
                [BiasType.OVERCONFIDENCE]: {
                    title: '校准自信水平',
                    strategies: [
                        '记录预测与实际结果',
                        '寻求外部反馈',
                        '考虑最坏情况',
                        '使用概率区间而非点估计'
                    ],
                    exercises: [
                        { name: '置信度校准', duration: 15, difficulty: 'medium' },
                        { name: '预验尸分析', duration: 20, difficulty: 'hard' }
                    ],
                    resources: [
                        '超级预测者训练材料',
                        '不确定性决策课程'
                    ]
                },
                [BiasType.LOSS_AVERSION]: {
                    title: '平衡得失心理',
                    strategies: [
                        '将决策框架转为收益导向',
                        '使用期望值计算',
                        '设定风险承受上限',
                        '理解损失厌恶系数'
                    ],
                    exercises: [
                        { name: '框架重置', duration: 10, difficulty: 'easy' },
                        { name: '期望值计算', duration: 15, difficulty: 'medium' }
                    ],
                    resources: [
                        '前景理论入门资料',
                        '风险决策心理学课程'
                    ]
                },
                [BiasType.ANCHORING]: {
                    title: '克服锚定效应',
                    strategies: [
                        '识别初始信息的影响',
                        '主动调整初始估计值',
                        '寻找多个参考点',
                        '使用反事实思考'
                    ],
                    exercises: [
                        { name: '锚点识别', duration: 10, difficulty: 'easy' },
                        { name: '多锚点对比', duration: 15, difficulty: 'medium' }
                    ],
                    resources: [
                        '《思考，快与慢》锚定效应章节',
                        '认知偏差训练课程'
                    ]
                },
                [BiasType.FRAMING]: {
                    title: '识别框架效应',
                    strategies: [
                        '重新表述问题',
                        '从多个角度分析',
                        '关注实质而非表述',
                        '使用中性语言'
                    ],
                    exercises: [
                        { name: '框架转换', duration: 15, difficulty: 'medium' },
                        { name: '中性重述', duration: 10, difficulty: 'easy' }
                    ],
                    resources: [
                        '前景理论与框架效应',
                        '决策心理学案例分析'
                    ]
                }
            };
        }

        /**
         * 生成个性化建议
         */
        generateRecommendations(report, userProfile) {
            const recommendations = [];
            
            for (const bias of report.biases) {
                const template = this.recommendationTemplates[bias.biasType];
                
                if (template) {
                    const personalizedRec = this._personalize(template, bias, userProfile);
                    recommendations.push(personalizedRec);
                }
            }
            
            // 根据严重程度排序
            recommendations.sort((a, b) => b.priority - a.priority);
            
            return recommendations;
        }

        /**
         * 个性化调整
         */
        _personalize(template, bias, userProfile) {
            const priority = this._calculatePriority(bias.severity, userProfile);
            const adaptedStrategies = this._adaptStrategies(
                template.strategies, 
                userProfile
            );
            const recommendedExercises = this._selectExercises(
                template.exercises,
                userProfile?.experience || 'beginner'
            );
            
            return {
                biasType: bias.biasType,
                title: template.title,
                priority,
                strategies: adaptedStrategies,
                exercises: recommendedExercises,
                resources: template.resources,
                estimatedImprovement: this._estimateImprovement(bias.severity),
                timeline: this._suggestTimeline(bias.severity, userProfile)
            };
        }

        /**
         * 计算优先级
         */
        _calculatePriority(severity, profile) {
            let priority = severity * 20; // 基础优先级
            
            // 考虑用户特征
            if (profile?.urgency === 'high') {
                priority += 10;
            }
            
            return Math.min(100, priority);
        }

        /**
         * 适配策略
         */
        _adaptStrategies(strategies, profile) {
            // 根据用户特征调整策略顺序和内容
            if (profile?.learningStyle === 'practical') {
                // 实践型用户优先行动导向策略
                return strategies.sort((a, b) => {
                    const aAction = a.includes('使用') || a.includes('设定') ? -1 : 1;
                    const bAction = b.includes('使用') || b.includes('设定') ? -1 : 1;
                    return aAction - bAction;
                });
            }
            return strategies;
        }

        /**
         * 选择练习
         */
        _selectExercises(exercises, experience) {
            const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
            
            if (experience === 'beginner') {
                return exercises.filter(e => e.difficulty === 'easy' || e.difficulty === 'medium');
            } else if (experience === 'advanced') {
                return exercises.filter(e => e.difficulty === 'hard');
            }
            
            return exercises;
        }

        /**
         * 估算改进潜力
         */
        _estimateImprovement(severity) {
            const improvements = {
                [SeverityLevel.NONE]: 0,
                [SeverityLevel.MILD]: 15,
                [SeverityLevel.MODERATE]: 30,
                [SeverityLevel.SEVERE]: 50,
                [SeverityLevel.CRITICAL]: 70
            };
            return improvements[severity] || 0;
        }

        /**
         * 建议时间线
         */
        _suggestTimeline(severity, profile) {
            const baseWeeks = severity * 2;
            const adjustedWeeks = profile?.pace === 'fast' 
                ? baseWeeks * 0.7 
                : profile?.pace === 'slow'
                    ? baseWeeks * 1.5
                    : baseWeeks;
            
            return {
                weeks: Math.ceil(adjustedWeeks),
                sessionsPerWeek: 3,
                minutesPerSession: 30
            };
        }
    }

    // ============================================
    // 认知诊断系统（主入口）
    // ============================================
    class CognitiveDiagnosisSystem {
        constructor(config = {}) {
            this.config = {
                containerId: config.containerId || 'diagnosis-container',
                enableVisualization: config.enableVisualization !== false,
                enableLearning: config.enableLearning !== false,
                historyLimit: config.historyLimit || 100,
                ...config
            };
            
            this.detector = new EnhancedBiasDetector();
            this.visualizer = new DiagnosisVisualizer(this.config.containerId);
            this.recommendationEngine = new PersonalizedRecommendationEngine();
            this.reports = [];
            this.userProfiles = new Map();
        }

        /**
         * 初始化系统
         */
        async initialize() {
            if (this.config.enableVisualization) {
                this.visualizer.init();
            }
            
            Logger?.debug('认知诊断增强系统初始化完成');
            return true;
        }

        /**
         * 执行诊断
         */
        diagnose(userId, data) {
            // 创建诊断报告
            const report = new MultiDimensionalDiagnosisReport(userId);
            
            // 检测偏差
            const biases = this.detector.detect(data);
            report.biases = biases;
            
            // 多维度分析
            this._analyzeDimensions(report, data);
            
            // 计算总体得分
            report.calculateOverallScore();
            
            // 生成建议
            const userProfile = this.userProfiles.get(userId);
            report.recommendations = this.recommendationEngine.generateRecommendations(
                report, 
                userProfile
            );
            
            // 保存报告
            this.reports.push(report);
            if (this.reports.length > this.config.historyLimit) {
                this.reports.shift();
            }
            
            return report;
        }

        /**
         * 分析各维度
         */
        _analyzeDimensions(report, data) {
            // 认知维度分析
            report.addDimensionAnalysis(DiagnosisDimension.COGNITIVE, {
                score: this._analyzeCognitiveDimension(data),
                level: 'analyzed',
                findings: this._getCognitiveFindings(data),
                metrics: {
                    reasoningDepth: data.reasoning?.depth || 0,
                    informationUsage: data.information?.usage || 0
                }
            });
            
            // 行为维度分析
            report.addDimensionAnalysis(DiagnosisDimension.BEHAVIORAL, {
                score: this._analyzeBehavioralDimension(data),
                level: 'analyzed',
                findings: this._getBehavioralFindings(data),
                metrics: {
                    decisionSpeed: data.decision?.speed || 0,
                    consistency: data.behavior?.consistency || 0
                }
            });
            
            // 情绪维度分析
            report.addDimensionAnalysis(DiagnosisDimension.EMOTIONAL, {
                score: this._analyzeEmotionalDimension(data),
                level: 'analyzed',
                findings: this._getEmotionalFindings(data),
                metrics: {
                    emotionalStability: data.emotion?.stability || 0,
                    stressLevel: data.emotion?.stress || 0
                }
            });
            
            // 时间维度分析
            report.addDimensionAnalysis(DiagnosisDimension.TEMPORAL, {
                score: this._analyzeTemporalDimension(data),
                level: 'analyzed',
                findings: this._getTemporalFindings(data),
                metrics: {
                    patienceLevel: data.temporal?.patience || 0,
                    longTermThinking: data.temporal?.longTerm || 0
                }
            });
        }

        /**
         * 认知维度分析
         */
        _analyzeCognitiveDimension(data) {
            let score = 0.7; // 基础分数
            
            if (data.reasoning?.depth > 0.7) score += 0.1;
            if (data.information?.diversity > 0.6) score += 0.1;
            if (data.cognitive?.biases?.length < 2) score += 0.1;
            
            return Math.min(1, score);
        }

        /**
         * 行为维度分析
         */
        _analyzeBehavioralDimension(data) {
            let score = 0.7;
            
            if (data.behavior?.consistency > 0.7) score += 0.1;
            if (data.decision?.quality > 0.6) score += 0.1;
            if (data.feedback?.incorporated > 0.5) score += 0.1;
            
            return Math.min(1, score);
        }

        /**
         * 情绪维度分析
         */
        _analyzeEmotionalDimension(data) {
            let score = 0.7;
            
            if (data.emotion?.stability > 0.7) score += 0.1;
            if (data.emotion?.awareness > 0.6) score += 0.1;
            if (data.emotion?.regulation > 0.5) score += 0.1;
            
            return Math.min(1, score);
        }

        /**
         * 时间维度分析
         */
        _analyzeTemporalDimension(data) {
            let score = 0.7;
            
            if (data.temporal?.patience > 0.6) score += 0.1;
            if (data.temporal?.longTerm > 0.7) score += 0.1;
            if (data.temporal?.delayedGratification > 0.5) score += 0.1;
            
            return Math.min(1, score);
        }

        /**
         * 获取认知发现
         */
        _getCognitiveFindings(data) {
            const findings = [];
            
            if (data.reasoning?.depth < 0.5) {
                findings.push('推理深度不足，建议增加思考层次');
            }
            if (data.information?.diversity < 0.4) {
                findings.push('信息来源单一，建议拓展信息渠道');
            }
            
            return findings;
        }

        /**
         * 获取行为发现
         */
        _getBehavioralFindings(data) {
            const findings = [];
            
            if (data.behavior?.consistency < 0.5) {
                findings.push('决策一致性较低，建议建立决策框架');
            }
            if (data.decision?.speed > 0.8 && data.decision?.quality < 0.5) {
                findings.push('决策过快影响质量，建议增加决策时间');
            }
            
            return findings;
        }

        /**
         * 获取情绪发现
         */
        _getEmotionalFindings(data) {
            const findings = [];
            
            if (data.emotion?.stress > 0.7) {
                findings.push('压力水平较高，建议进行情绪管理');
            }
            
            return findings;
        }

        /**
         * 获取时间发现
         */
        _getTemporalFindings(data) {
            const findings = [];
            
            if (data.temporal?.longTerm < 0.4) {
                findings.push('长期思维不足，建议练习延迟满足');
            }
            
            return findings;
        }

        /**
         * 可视化诊断结果
         */
        visualize(report) {
            if (!this.config.enableVisualization) {
                return null;
            }
            
            const result = {
                radar: this.visualizer.renderRadarChart(report),
                biasDistribution: this.visualizer.renderBiasDistribution(report.biases),
                trend: this.visualizer.renderTrendChart(this.reports.slice(-10))
            };
            
            return result;
        }

        /**
         * 获取用户诊断历史
         */
        getUserHistory(userId) {
            return this.reports.filter(r => r.userId === userId);
        }

        /**
         * 获取系统统计
         */
        getSystemStatistics() {
            return {
                totalReports: this.reports.length,
                detectionStats: this.detector.getStatistics(),
                biasTypeDistribution: this._calculateBiasDistribution()
            };
        }

        /**
         * 计算偏差类型分布
         */
        _calculateBiasDistribution() {
            const distribution = {};
            
            for (const report of this.reports) {
                for (const bias of report.biases) {
                    distribution[bias.biasType] = (distribution[bias.biasType] || 0) + 1;
                }
            }
            
            return distribution;
        }

        /**
         * 更新用户档案
         */
        updateUserProfile(userId, profile) {
            const existing = this.userProfiles.get(userId) || {};
            this.userProfiles.set(userId, { ...existing, ...profile });
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    const CognitiveDiagnosisEnhanced = {
        CognitiveDiagnosisSystem,
        EnhancedBiasDetector,
        MultiDimensionalDiagnosisReport,
        DiagnosisVisualizer,
        PersonalizedRecommendationEngine,
        BiasDetectionRule,
        BiasType,
        DiagnosisDimension,
        SeverityLevel
    };

    // UMD导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CognitiveDiagnosisEnhanced;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return CognitiveDiagnosisEnhanced; });
    } else {
        global.CognitiveDiagnosisEnhanced = CognitiveDiagnosisEnhanced;
    }

})(typeof window !== 'undefined' ? window : this);

/**
 * 蒙特卡洛模拟模块
 * Monte Carlo Simulation Module
 * 
 * 功能：
 * - 决策树概率模拟
 * - 风险评估与量化
 * - 敏感性分析
 * - 结果分布可视化
 * - 置信区间计算
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环17
 */

(function(global) {
    'use strict';

    // ============================================
    // 随机数生成器
    // ============================================
    class RandomGenerator {
        constructor(seed = null) {
            this.seed = seed || Date.now();
        }

        /**
         * 线性同余生成器
         */
        next() {
            this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
            return this.seed / 0x7fffffff;
        }

        /**
         * 正态分布随机数 (Box-Muller变换)
         */
        normal(mean = 0, stdDev = 1) {
            const u1 = this.next();
            const u2 = this.next();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            return mean + z * stdDev;
        }

        /**
         * 均匀分布随机数
         */
        uniform(min = 0, max = 1) {
            return min + this.next() * (max - min);
        }

        /**
         * 指数分布随机数
         */
        exponential(lambda = 1) {
            return -Math.log(1 - this.next()) / lambda;
        }

        /**
         * 三角分布随机数
         */
        triangular(min, mode, max) {
            const u = this.next();
            const fc = (mode - min) / (max - min);
            if (u < fc) {
                return min + Math.sqrt(u * (max - min) * (mode - min));
            } else {
                return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
            }
        }
    }

    // ============================================
    // 概率分布
    // ============================================
    class ProbabilityDistribution {
        constructor(type, params) {
            this.type = type;
            this.params = params;
        }

        /**
         * 获取概率密度
         */
        pdf(x) {
            switch (this.type) {
                case 'normal':
                    return this._normalPdf(x);
                case 'uniform':
                    return this._uniformPdf(x);
                case 'exponential':
                    return this._exponentialPdf(x);
                default:
                    return 0;
            }
        }

        _normalPdf(x) {
            const { mean, stdDev } = this.params;
            const exp = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
            return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exp);
        }

        _uniformPdf(x) {
            const { min, max } = this.params;
            return (x >= min && x <= max) ? 1 / (max - min) : 0;
        }

        _exponentialPdf(x) {
            const { lambda } = this.params;
            return x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
        }
    }

    // ============================================
    // 蒙特卡洛模拟器
    // ============================================
    class MonteCarloSimulator {
        constructor(config = {}) {
            this.iterations = config.iterations || 10000;
            this.random = new RandomGenerator(config.seed);
            this.results = [];
            this.statistics = {};
        }

        /**
         * 运行模拟
         */
        simulate(model, inputs) {
            this.results = [];

            for (let i = 0; i < this.iterations; i++) {
                // 生成随机输入
                const randomInputs = this._generateRandomInputs(inputs);
                
                // 执行模型
                const result = model(randomInputs);
                this.results.push(result);
            }

            // 计算统计量
            this._calculateStatistics();
            
            return this.results;
        }

        /**
         * 生成随机输入
         */
        _generateRandomInputs(inputSpec) {
            const randomInputs = {};
            
            for (const [key, spec] of Object.entries(inputSpec)) {
                switch (spec.distribution) {
                    case 'normal':
                        randomInputs[key] = this.random.normal(spec.mean, spec.stdDev);
                        break;
                    case 'uniform':
                        randomInputs[key] = this.random.uniform(spec.min, spec.max);
                        break;
                    case 'triangular':
                        randomInputs[key] = this.random.triangular(
                            spec.min, spec.mode, spec.max
                        );
                        break;
                    case 'discrete':
                        randomInputs[key] = this._discreteSample(spec.values, spec.probabilities);
                        break;
                    default:
                        randomInputs[key] = spec.value;
                }
            }
            
            return randomInputs;
        }

        /**
         * 离散分布采样
         */
        _discreteSample(values, probabilities) {
            const r = this.random.next();
            let cumulative = 0;
            
            for (let i = 0; i < probabilities.length; i++) {
                cumulative += probabilities[i];
                if (r <= cumulative) {
                    return values[i];
                }
            }
            
            return values[values.length - 1];
        }

        /**
         * 计算统计量
         */
        _calculateStatistics() {
            const n = this.results.length;
            const sorted = [...this.results].sort((a, b) => a - b);

            // 均值
            const mean = this.results.reduce((a, b) => a + b, 0) / n;

            // 标准差
            const variance = this.results.reduce((sum, x) => 
                sum + Math.pow(x - mean, 2), 0) / n;
            const stdDev = Math.sqrt(variance);

            // 百分位数
            const percentiles = {
                p5: sorted[Math.floor(n * 0.05)],
                p10: sorted[Math.floor(n * 0.10)],
                p25: sorted[Math.floor(n * 0.25)],
                p50: sorted[Math.floor(n * 0.50)],
                p75: sorted[Math.floor(n * 0.75)],
                p90: sorted[Math.floor(n * 0.90)],
                p95: sorted[Math.floor(n * 0.95)]
            };

            // 置信区间
            const confidenceInterval95 = {
                lower: percentiles.p5,
                upper: percentiles.p95
            };

            this.statistics = {
                mean,
                stdDev,
                variance,
                min: sorted[0],
                max: sorted[n - 1],
                median: percentiles.p50,
                percentiles,
                confidenceInterval95
            };
        }

        /**
         * 获取统计量
         */
        getStatistics() {
            return this.statistics;
        }

        /**
         * 获取直方图数据
         */
        getHistogram(bins = 20) {
            const min = Math.min(...this.results);
            const max = Math.max(...this.results);
            const binWidth = (max - min) / bins;
            
            const histogram = Array(bins).fill(0);
            
            for (const value of this.results) {
                const binIndex = Math.min(
                    Math.floor((value - min) / binWidth),
                    bins - 1
                );
                histogram[binIndex]++;
            }
            
            const binEdges = [];
            for (let i = 0; i <= bins; i++) {
                binEdges.push(min + i * binWidth);
            }
            
            return {
                counts: histogram,
                binEdges,
                binWidth,
                total: this.results.length
            };
        }
    }

    // ============================================
    // 决策树概率模拟器
    // ============================================
    class DecisionTreeProbabilisticSimulator {
        constructor() {
            this.simulator = new MonteCarloSimulator({ iterations: 10000 });
        }

        /**
         * 模拟决策树
         */
        simulateDecisionTree(tree, context = {}) {
            const results = [];
            
            for (let i = 0; i < this.simulator.iterations; i++) {
                const path = this._traverseTree(tree, context);
                results.push(path);
            }
            
            return this._analyzeResults(results);
        }

        /**
         * 遍历决策树
         */
        _traverseTree(node, context) {
            if (node.type === 'outcome') {
                return {
                    value: node.value,
                    path: [node.id],
                    probability: 1
                };
            }

            // 选择分支
            const branch = this._selectBranch(node.branches, context);
            const result = this._traverseTree(branch.node, context);
            
            return {
                value: result.value,
                path: [node.id, ...result.path],
                probability: branch.probability * result.probability
            };
        }

        /**
         * 选择分支
         */
        _selectBranch(branches, context) {
            const roll = Math.random();
            let cumulative = 0;
            
            for (const branch of branches) {
                cumulative += branch.probability;
                if (roll <= cumulative) {
                    return branch;
                }
            }
            
            return branches[branches.length - 1];
        }

        /**
         * 分析结果
         */
        _analyzeResults(results) {
            const values = results.map(r => r.value);
            const paths = {};
            
            // 统计路径频率
            for (const result of results) {
                const pathKey = result.path.join('->');
                paths[pathKey] = (paths[pathKey] || 0) + 1;
            }
            
            // 计算统计量
            const n = values.length;
            const sorted = [...values].sort((a, b) => a - b);
            const mean = values.reduce((a, b) => a + b, 0) / n;
            const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
            
            return {
                expectedValue: mean,
                variance,
                stdDev: Math.sqrt(variance),
                min: sorted[0],
                max: sorted[n - 1],
                median: sorted[Math.floor(n / 2)],
                percentile5: sorted[Math.floor(n * 0.05)],
                percentile95: sorted[Math.floor(n * 0.95)],
                pathProbabilities: this._normalizePaths(paths, n),
                histogram: this._createHistogram(values, 20)
            };
        }

        /**
         * 标准化路径概率
         */
        _normalizePaths(paths, total) {
            const normalized = {};
            for (const [path, count] of Object.entries(paths)) {
                normalized[path] = count / total;
            }
            return normalized;
        }

        /**
         * 创建直方图
         */
        _createHistogram(values, bins) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const binWidth = (max - min) / bins;
            
            const counts = Array(bins).fill(0);
            
            for (const value of values) {
                const binIndex = Math.min(
                    Math.floor((value - min) / binWidth),
                    bins - 1
                );
                counts[binIndex]++;
            }
            
            return {
                counts,
                binEdges: Array(bins + 1).fill(0).map((_, i) => min + i * binWidth)
            };
        }
    }

    // ============================================
    // 敏感性分析器
    // ============================================
    class SensitivityAnalyzer {
        constructor(model) {
            this.model = model;
            this.baseCase = {};
        }

        /**
         * 设置基础案例
         */
        setBaseCase(baseCase) {
            this.baseCase = baseCase;
            return this;
        }

        /**
         * 执行单因素敏感性分析
         */
        oneWaySensitivity(paramName, range, steps = 10) {
            const results = [];
            const [min, max] = range;
            const stepSize = (max - min) / steps;
            
            for (let i = 0; i <= steps; i++) {
                const paramValue = min + i * stepSize;
                const inputs = { ...this.baseCase, [paramName]: paramValue };
                const result = this.model(inputs);
                
                results.push({
                    paramValue,
                    result,
                    deviation: result - this.model(this.baseCase)
                });
            }
            
            return {
                parameter: paramName,
                baseValue: this.baseCase[paramName],
                results,
                sensitivity: this._calculateSensitivity(results)
            };
        }

        /**
         * 执行多因素敏感性分析
         */
        multiWaySensitivity(params, samples = 1000) {
            const results = [];
            const random = new RandomGenerator();
            
            for (let i = 0; i < samples; i++) {
                const inputs = {};
                
                for (const [param, spec] of Object.entries(params)) {
                    inputs[param] = random.uniform(spec.min, spec.max);
                }
                
                const result = this.model(inputs);
                results.push({ inputs, result });
            }
            
            // 计算每个参数的影响
            const impacts = {};
            for (const param of Object.keys(params)) {
                impacts[param] = this._calculateCorrelation(
                    results.map(r => r.inputs[param]),
                    results.map(r => r.result)
                );
            }
            
            return {
                results,
                impacts,
                rankedParameters: Object.entries(impacts)
                    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                    .map(([param, impact]) => ({ parameter: param, impact }))
            };
        }

        /**
         * 计算敏感性系数
         */
        _calculateSensitivity(results) {
            const n = results.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
            
            for (const r of results) {
                sumX += r.paramValue;
                sumY += r.result;
                sumXY += r.paramValue * r.result;
                sumX2 += r.paramValue * r.paramValue;
                sumY2 += r.result * r.result;
            }
            
            const numerator = n * sumXY - sumX * sumY;
            const denominator = Math.sqrt(
                (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
            );
            
            return denominator !== 0 ? numerator / denominator : 0;
        }

        /**
         * 计算相关系数
         */
        _calculateCorrelation(x, y) {
            const n = x.length;
            const meanX = x.reduce((a, b) => a + b, 0) / n;
            const meanY = y.reduce((a, b) => a + b, 0) / n;
            
            let sumNumerator = 0;
            let sumDenomX = 0;
            let sumDenomY = 0;
            
            for (let i = 0; i < n; i++) {
                const dx = x[i] - meanX;
                const dy = y[i] - meanY;
                sumNumerator += dx * dy;
                sumDenomX += dx * dx;
                sumDenomY += dy * dy;
            }
            
            return sumNumerator / Math.sqrt(sumDenomX * sumDenomY);
        }
    }

    // ============================================
    // 风险评估器
    // ============================================
    class RiskAssessor {
        constructor() {
            this.simulator = new MonteCarloSimulator({ iterations: 10000 });
        }

        /**
         * 评估风险
         */
        assessRisk(model, inputs, targets) {
            const results = this.simulator.simulate(model, inputs);
            const stats = this.simulator.getStatistics();
            
            const riskMetrics = {
                valueAtRisk: this._calculateVaR(results, targets.confidenceLevel || 0.95),
                expectedShortfall: this._calculateES(results, targets.confidenceLevel || 0.95),
                probabilityOfLoss: this._calculateProbLoss(results, targets.breakeven || 0),
                upsidePotential: this._calculateUpside(results, stats.mean),
                downsideRisk: this._calculateDownside(results, stats.mean),
                sharpeRatio: this._calculateSharpe(stats, targets.riskFreeRate || 0.02),
                maxDrawdown: this._calculateMaxDrawdown(results)
            };
            
            return {
                statistics: stats,
                riskMetrics,
                distribution: this.simulator.getHistogram(30),
                recommendation: this._generateRecommendation(riskMetrics, targets)
            };
        }

        /**
         * 计算风险价值 (VaR)
         */
        _calculateVaR(results, confidence) {
            const sorted = [...results].sort((a, b) => a - b);
            const index = Math.floor(results.length * (1 - confidence));
            return sorted[index];
        }

        /**
         * 计算期望短缺 (ES/CVaR)
         */
        _calculateES(results, confidence) {
            const sorted = [...results].sort((a, b) => a - b);
            const tailSize = Math.floor(results.length * (1 - confidence));
            const tail = sorted.slice(0, tailSize);
            return tail.reduce((a, b) => a + b, 0) / tailSize;
        }

        /**
         * 计算损失概率
         */
        _calculateProbLoss(results, breakeven) {
            const losses = results.filter(r => r < breakeven);
            return losses.length / results.length;
        }

        /**
         * 计算上行潜力
         */
        _calculateUpside(results, mean) {
            const upsides = results.filter(r => r > mean);
            if (upsides.length === 0) return 0;
            return upsides.reduce((a, b) => a + b, 0) / upsides.length - mean;
        }

        /**
         * 计算下行风险
         */
        _calculateDownside(results, mean) {
            const downsides = results.filter(r => r < mean);
            if (downsides.length === 0) return 0;
            return mean - downsides.reduce((a, b) => a + b, 0) / downsides.length;
        }

        /**
         * 计算夏普比率
         */
        _calculateSharpe(stats, riskFreeRate) {
            return (stats.mean - riskFreeRate) / stats.stdDev;
        }

        /**
         * 计算最大回撤
         */
        _calculateMaxDrawdown(results) {
            let maxPeak = -Infinity;
            let maxDrawdown = 0;
            
            for (const value of results) {
                maxPeak = Math.max(maxPeak, value);
                const drawdown = (maxPeak - value) / maxPeak;
                maxDrawdown = Math.max(maxDrawdown, drawdown);
            }
            
            return maxDrawdown;
        }

        /**
         * 生成建议
         */
        _generateRecommendation(metrics, targets) {
            const recommendations = [];
            
            if (metrics.probabilityOfLoss > 0.5) {
                recommendations.push({
                    type: 'warning',
                    message: '高损失风险，建议降低风险敞口或增加对冲策略'
                });
            }
            
            if (metrics.valueAtRisk < targets.minAcceptable || 0) {
                recommendations.push({
                    type: 'danger',
                    message: '风险价值超过可接受范围，需要重新评估决策'
                });
            }
            
            if (metrics.sharpeRatio < 1) {
                recommendations.push({
                    type: 'info',
                    message: '风险调整后收益较低，考虑优化投资组合'
                });
            }
            
            if (recommendations.length === 0) {
                recommendations.push({
                    type: 'success',
                    message: '风险水平在可接受范围内'
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
            RandomGenerator,
            ProbabilityDistribution,
            MonteCarloSimulator,
            DecisionTreeProbabilisticSimulator,
            SensitivityAnalyzer,
            RiskAssessor
        };
    } else {
        global.RandomGenerator = RandomGenerator;
        global.ProbabilityDistribution = ProbabilityDistribution;
        global.MonteCarloSimulator = MonteCarloSimulator;
        global.DecisionTreeProbabilisticSimulator = DecisionTreeProbabilisticSimulator;
        global.SensitivityAnalyzer = SensitivityAnalyzer;
        global.RiskAssessor = RiskAssessor;
    }

})(typeof window !== 'undefined' ? window : this);

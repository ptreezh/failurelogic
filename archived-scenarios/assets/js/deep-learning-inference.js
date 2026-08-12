/**
 * 深度学习推理模块
 * Deep Learning Inference Module
 * 
 * 功能：
 * - 神经网络前向传播
 * - 决策模式识别
 * - 认知状态预测
 * - 模式分类器
 * - 特征提取
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环18
 */

(function(global) {
    'use strict';

    // ============================================
    // 激活函数
    // ============================================
    const ActivationFunctions = {
        relu: (x) => Math.max(0, x),
        sigmoid: (x) => 1 / (1 + Math.exp(-x)),
        tanh: (x) => Math.tanh(x),
        leakyRelu: (x, alpha = 0.01) => x > 0 ? x : alpha * x,
        elu: (x, alpha = 1) => x >= 0 ? x : alpha * (Math.exp(x) - 1),
        softmax: (arr) => {
            const max = Math.max(...arr);
            const exp = arr.map(x => Math.exp(x - max));
            const sum = exp.reduce((a, b) => a + b, 0);
            return exp.map(x => x / sum);
        },
        linear: (x) => x
    };

    // ============================================
    // 损失函数
    // ============================================
    const LossFunctions = {
        mse: (predicted, actual) => {
            const diff = predicted.map((p, i) => Math.pow(p - actual[i], 2));
            return diff.reduce((a, b) => a + b, 0) / diff.length;
        },
        crossEntropy: (predicted, actual) => {
            const epsilon = 1e-15;
            return -actual.reduce((sum, a, i) => {
                const p = Math.max(epsilon, Math.min(1 - epsilon, predicted[i]));
                return sum + a * Math.log(p);
            }, 0);
        },
        binaryCrossEntropy: (predicted, actual) => {
            const epsilon = 1e-15;
            const p = Math.max(epsilon, Math.min(1 - epsilon, predicted));
            return -(actual * Math.log(p) + (1 - actual) * Math.log(1 - p));
        }
    };

    // ============================================
    // 神经网络层
    // ============================================
    class NeuralLayer {
        constructor(config) {
            this.inputSize = config.inputSize;
            this.outputSize = config.outputSize;
            this.activation = config.activation || 'relu';
            
            // 初始化权重 (Xavier初始化)
            const scale = Math.sqrt(2 / (this.inputSize + this.outputSize));
            this.weights = [];
            for (let i = 0; i < this.outputSize; i++) {
                this.weights[i] = [];
                for (let j = 0; j < this.inputSize; j++) {
                    this.weights[i][j] = (Math.random() * 2 - 1) * scale;
                }
            }
            
            // 初始化偏置
            this.biases = Array(this.outputSize).fill(0);
            
            // 缓存
            this.lastInput = null;
            this.lastOutput = null;
        }

        /**
         * 前向传播
         */
        forward(input) {
            this.lastInput = input;
            const output = [];
            
            for (let i = 0; i < this.outputSize; i++) {
                let sum = this.biases[i];
                for (let j = 0; j < this.inputSize; j++) {
                    sum += this.weights[i][j] * input[j];
                }
                output.push(sum);
            }
            
            // 应用激活函数
            if (this.activation === 'softmax') {
                this.lastOutput = ActivationFunctions.softmax(output);
            } else {
                const activationFn = ActivationFunctions[this.activation] || ActivationFunctions.relu;
                this.lastOutput = output.map(activationFn);
            }
            
            return this.lastOutput;
        }

        /**
         * 设置权重
         */
        setWeights(weights, biases) {
            this.weights = weights;
            this.biases = biases || Array(this.outputSize).fill(0);
        }
    }

    // ============================================
    // 神经网络
    // ============================================
    class NeuralNetwork {
        constructor(config) {
            this.layers = [];
            this.learningRate = config.learningRate || 0.01;
            
            // 创建层
            for (let i = 0; i < config.layers.length - 1; i++) {
                this.layers.push(new NeuralLayer({
                    inputSize: config.layers[i],
                    outputSize: config.layers[i + 1],
                    activation: config.activations ? config.activations[i] : 'relu'
                }));
            }
        }

        /**
         * 前向传播
         */
        forward(input) {
            let output = input;
            
            for (const layer of this.layers) {
                output = layer.forward(output);
            }
            
            return output;
        }

        /**
         * 预测
         */
        predict(input) {
            const output = this.forward(input);
            return output;
        }

        /**
         * 分类预测
         */
        classify(input) {
            const output = this.forward(input);
            const maxIndex = output.indexOf(Math.max(...output));
            return {
                classIndex: maxIndex,
                probabilities: output,
                confidence: output[maxIndex]
            };
        }

        /**
         * 批量预测
         */
        predictBatch(inputs) {
            return inputs.map(input => this.predict(input));
        }

        /**
         * 从JSON加载模型
         */
        loadModel(modelData) {
            for (let i = 0; i < modelData.layers.length; i++) {
                if (this.layers[i]) {
                    this.layers[i].setWeights(
                        modelData.layers[i].weights,
                        modelData.layers[i].biases
                    );
                }
            }
        }

        /**
         * 导出模型为JSON
         */
        exportModel() {
            return {
                layers: this.layers.map(layer => ({
                    weights: layer.weights,
                    biases: layer.biases,
                    activation: layer.activation
                }))
            };
        }
    }

    // ============================================
    // 决策模式分类器
    // ============================================
    class DecisionPatternClassifier {
        constructor() {
            // 预训练的决策模式识别网络
            this.network = new NeuralNetwork({
                layers: [10, 32, 16, 5],  // 输入10个特征，输出5种模式
                activations: ['relu', 'relu', 'softmax'],
                learningRate: 0.01
            });
            
            this.patternLabels = [
                'risk_seeking',     // 风险偏好
                'risk_averse',      // 风险规避
                'balanced',         // 平衡型
                'impulsive',        // 冲动型
                'analytical'        // 分析型
            ];
            
            this._initializePretrainedWeights();
        }

        /**
         * 初始化预训练权重（模拟）
         */
        _initializePretrainedWeights() {
            // 这里使用随机权重模拟预训练效果
            // 实际应用中应从服务器加载真实权重
        }

        /**
         * 提取决策特征
         */
        extractFeatures(decisionData) {
            return [
                decisionData.riskLevel || 0.5,
                decisionData.timeSpent / 60000 || 0.5,  // 标准化时间
                decisionData.informationUsed / 10 || 0.5,
                decisionData.confidenceLevel || 0.5,
                decisionData.consistencyScore || 0.5,
                decisionData.previousSuccesses / 10 || 0.5,
                decisionData.emotionalState || 0.5,
                decisionData.complexityPreference || 0.5,
                decisionData.delayTolerance || 0.5,
                decisionData.feedbackResponsiveness || 0.5
            ];
        }

        /**
         * 分类决策模式
         */
        classify(decisionData) {
            const features = this.extractFeatures(decisionData);
            const result = this.network.classify(features);
            
            return {
                pattern: this.patternLabels[result.classIndex],
                confidence: result.confidence,
                probabilities: result.probabilities.reduce((obj, prob, i) => {
                    obj[this.patternLabels[i]] = prob;
                    return obj;
                }, {}),
                features: features
            };
        }

        /**
         * 批量分类
         */
        classifyBatch(decisions) {
            return decisions.map(d => this.classify(d));
        }

        /**
         * 获取模式解释
         */
        getPatternExplanation(pattern) {
            const explanations = {
                risk_seeking: {
                    name: '风险偏好型',
                    description: '倾向于选择高风险高回报的选项',
                    strengths: ['机会把握能力强', '创新思维活跃'],
                    weaknesses: ['可能忽视风险', '决策冲动性高'],
                    recommendations: ['增加风险评估环节', '设置决策冷静期']
                },
                risk_averse: {
                    name: '风险规避型',
                    description: '倾向于选择稳定安全的选项',
                    strengths: ['风险意识强', '决策稳健'],
                    weaknesses: ['可能错过机会', '创新性不足'],
                    recommendations: ['适当提高风险容忍度', '尝试小规模创新']
                },
                balanced: {
                    name: '平衡型',
                    description: '在风险和安全之间寻求平衡',
                    strengths: ['决策均衡', '适应性强'],
                    weaknesses: ['可能优柔寡断', '缺乏特色'],
                    recommendations: ['培养决策果断性', '深化特定领域专长']
                },
                impulsive: {
                    name: '冲动型',
                    description: '决策速度快但可能缺乏深思熟虑',
                    strengths: ['决策迅速', '行动力强'],
                    weaknesses: ['思考不充分', '后悔概率高'],
                    recommendations: ['增加决策前思考时间', '建立决策检查清单']
                },
                analytical: {
                    name: '分析型',
                    description: '依赖数据和逻辑进行决策',
                    strengths: ['决策科学', '准确率高'],
                    weaknesses: ['决策速度慢', '可能过度分析'],
                    recommendations: ['设置决策时限', '培养直觉判断能力']
                }
            };
            
            return explanations[pattern] || null;
        }
    }

    // ============================================
    // 认知状态预测器
    // ============================================
    class CognitiveStatePredictor {
        constructor() {
            this.stateModel = new NeuralNetwork({
                layers: [8, 24, 12, 4],
                activations: ['relu', 'relu', 'softmax']
            });
            
            this.states = ['engaged', 'confused', 'fatigued', 'bored'];
        }

        /**
         * 预测认知状态
         */
        predict(sessionData) {
            const features = this._extractSessionFeatures(sessionData);
            const result = this.stateModel.classify(features);
            
            return {
                state: this.states[result.classIndex],
                confidence: result.confidence,
                probabilities: result.probabilities,
                recommendations: this._getStateRecommendations(this.states[result.classIndex])
            };
        }

        /**
         * 提取会话特征
         */
        _extractSessionFeatures(data) {
            return [
                data.responseTime / 10000 || 0.5,
                data.errorRate || 0.5,
                data.decisionChanges / 5 || 0.5,
                data.hintRequests / 10 || 0.5,
                data.sessionDuration / 3600000 || 0.5,
                data.completedScenarios / 10 || 0.5,
                data.accuracy || 0.5,
                data.engagementScore || 0.5
            ];
        }

        /**
         * 获取状态建议
         */
        _getStateRecommendations(state) {
            const recommendations = {
                engaged: {
                    message: '学习状态良好，继续保持！',
                    actions: ['继续当前学习节奏', '尝试更具挑战性的场景']
                },
                confused: {
                    message: '似乎遇到了一些困惑，需要帮助吗？',
                    actions: ['查看场景说明', '请求提示', '尝试更简单的场景']
                },
                fatigued: {
                    message: '学习疲劳检测，建议休息。',
                    actions: ['休息5-10分钟', '喝杯水', '做些伸展运动']
                },
                bored: {
                    message: '可能需要更多刺激。',
                    actions: ['尝试新场景', '挑战更高难度', '开启计时模式']
                }
            };
            
            return recommendations[state] || null;
        }
    }

    // ============================================
    // 特征提取器
    // ============================================
    class FeatureExtractor {
        constructor() {
            this.featureNames = [
                'risk_preference',
                'time_sensitivity',
                'information_usage',
                'decision_consistency',
                'confidence_calibration',
                'learning_speed',
                'error_recovery',
                'pattern_recognition'
            ];
        }

        /**
         * 从决策历史提取特征
         */
        extractFromHistory(decisions) {
            if (decisions.length === 0) {
                return this._emptyFeatures();
            }

            const features = {
                risk_preference: this._calculateRiskPreference(decisions),
                time_sensitivity: this._calculateTimeSensitivity(decisions),
                information_usage: this._calculateInformationUsage(decisions),
                decision_consistency: this._calculateConsistency(decisions),
                confidence_calibration: this._calculateConfidenceCalibration(decisions),
                learning_speed: this._calculateLearningSpeed(decisions),
                error_recovery: this._calculateErrorRecovery(decisions),
                pattern_recognition: this._calculatePatternRecognition(decisions)
            };

            return features;
        }

        /**
         * 计算风险偏好
         */
        _calculateRiskPreference(decisions) {
            const riskScores = decisions
                .filter(d => d.riskLevel !== undefined)
                .map(d => d.riskLevel);
            
            if (riskScores.length === 0) return 0.5;
            return riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
        }

        /**
         * 计算时间敏感性
         */
        _calculateTimeSensitivity(decisions) {
            const times = decisions.map(d => d.timeSpent || 0);
            if (times.length === 0) return 0.5;
            
            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            return Math.min(1, avg / 30000);  // 30秒为基准
        }

        /**
         * 计算信息使用率
         */
        _calculateInformationUsage(decisions) {
            const usageRates = decisions
                .filter(d => d.informationAvailable && d.informationUsed)
                .map(d => d.informationUsed / d.informationAvailable);
            
            if (usageRates.length === 0) return 0.5;
            return usageRates.reduce((a, b) => a + b, 0) / usageRates.length;
        }

        /**
         * 计算决策一致性
         */
        _calculateConsistency(decisions) {
            if (decisions.length < 2) return 0.5;
            
            let consistentPairs = 0;
            for (let i = 1; i < decisions.length; i++) {
                if (decisions[i].decisionType === decisions[i-1].decisionType) {
                    consistentPairs++;
                }
            }
            
            return consistentPairs / (decisions.length - 1);
        }

        /**
         * 计算置信度校准
         */
        _calculateConfidenceCalibration(decisions) {
            const withConfidence = decisions.filter(d => 
                d.confidence !== undefined && d.correct !== undefined
            );
            
            if (withConfidence.length === 0) return 0.5;
            
            // 计算置信度与实际准确率的差异
            let totalDiff = 0;
            for (const d of withConfidence) {
                totalDiff += Math.abs(d.confidence - (d.correct ? 1 : 0));
            }
            
            return 1 - (totalDiff / withConfidence.length);
        }

        /**
         * 计算学习速度
         */
        _calculateLearningSpeed(decisions) {
            if (decisions.length < 5) return 0.5;
            
            // 比较前半部分和后半部分的准确率
            const half = Math.floor(decisions.length / 2);
            const firstHalf = decisions.slice(0, half);
            const secondHalf = decisions.slice(half);
            
            const firstAcc = this._calculateAccuracy(firstHalf);
            const secondAcc = this._calculateAccuracy(secondHalf);
            
            return Math.min(1, (secondAcc - firstAcc + 1) / 2);
        }

        /**
         * 计算错误恢复能力
         */
        _calculateErrorRecovery(decisions) {
            let recoveryCount = 0;
            let totalErrors = 0;
            
            for (let i = 1; i < decisions.length; i++) {
                if (!decisions[i-1].correct) {
                    totalErrors++;
                    if (decisions[i].correct) {
                        recoveryCount++;
                    }
                }
            }
            
            return totalErrors > 0 ? recoveryCount / totalErrors : 0.5;
        }

        /**
         * 计算模式识别能力
         */
        _calculatePatternRecognition(decisions) {
            // 检测是否能在重复场景中改进
            const scenarioPerformance = {};
            
            for (const d of decisions) {
                if (!scenarioPerformance[d.scenarioId]) {
                    scenarioPerformance[d.scenarioId] = [];
                }
                scenarioPerformance[d.scenarioId].push(d.correct ? 1 : 0);
            }
            
            let totalImprovement = 0;
            let count = 0;
            
            for (const performances of Object.values(scenarioPerformance)) {
                if (performances.length > 1) {
                    const first = performances.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
                    const last = performances.slice(-3).reduce((a, b) => a + b, 0) / 3;
                    totalImprovement += (last - first + 1) / 2;
                    count++;
                }
            }
            
            return count > 0 ? totalImprovement / count : 0.5;
        }

        /**
         * 计算准确率
         */
        _calculateAccuracy(decisions) {
            const correct = decisions.filter(d => d.correct).length;
            return decisions.length > 0 ? correct / decisions.length : 0;
        }

        /**
         * 空特征
         */
        _emptyFeatures() {
            const features = {};
            for (const name of this.featureNames) {
                features[name] = 0.5;
            }
            return features;
        }
    }

    // ============================================
    // 深度学习推理管理器
    // ============================================
    class DeepLearningInferenceManager {
        constructor() {
            this.patternClassifier = new DecisionPatternClassifier();
            this.statePredictor = new CognitiveStatePredictor();
            this.featureExtractor = new FeatureExtractor();
        }

        /**
         * 分析用户决策
         */
        analyzeDecision(decision, history) {
            const pattern = this.patternClassifier.classify(decision);
            const features = this.featureExtractor.extractFromHistory(history);
            
            return {
                pattern: pattern,
                features: features,
                explanation: this.patternClassifier.getPatternExplanation(pattern.pattern)
            };
        }

        /**
         * 预测认知状态
         */
        predictCognitiveState(sessionData) {
            return this.statePredictor.predict(sessionData);
        }

        /**
         * 获取个性化建议
         */
        getPersonalizedRecommendations(analysis, state) {
            const recommendations = [];
            
            // 基于决策模式的建议
            if (analysis.pattern) {
                const patternRecs = analysis.explanation?.recommendations || [];
                recommendations.push({
                    source: 'decision_pattern',
                    items: patternRecs
                });
            }
            
            // 基于认知状态的建议
            if (state && state.recommendations) {
                recommendations.push({
                    source: 'cognitive_state',
                    items: state.recommendations.actions || []
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
            NeuralLayer,
            NeuralNetwork,
            DecisionPatternClassifier,
            CognitiveStatePredictor,
            FeatureExtractor,
            DeepLearningInferenceManager,
            ActivationFunctions,
            LossFunctions
        };
    } else {
        global.NeuralLayer = NeuralLayer;
        global.NeuralNetwork = NeuralNetwork;
        global.DecisionPatternClassifier = DecisionPatternClassifier;
        global.CognitiveStatePredictor = CognitiveStatePredictor;
        global.FeatureExtractor = FeatureExtractor;
        global.DeepLearningInferenceManager = DeepLearningInferenceManager;
        global.ActivationFunctions = ActivationFunctions;
        global.LossFunctions = LossFunctions;
    }

})(typeof window !== 'undefined' ? window : this);

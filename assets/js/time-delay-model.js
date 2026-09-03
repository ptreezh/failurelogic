/**
 * 时间延迟模型
 * Time Delay Model
 * 
 * 包含：延迟效果计算、系统动力学建模、因果回路图、时间衰减函数
 * 
 * 来源：Soul Auto-Evolution 循环14
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // 时间延迟效果计算器
    // ============================================
    class TimeDelayEffectCalculator {
        constructor(config = {}) {
            this.config = {
                defaultDelay: config.defaultDelay || 1000,
                decayRate: config.decayRate || 0.1,
                amplificationFactor: config.amplificationFactor || 1.5,
                ...config
            };

            this.delayedEffects = [];
            this.effectId = 0;
        }

        /**
         * 添加延迟效果
         */
        addDelayedEffect(action, delay, config = {}) {
            const effect = {
                id: ++this.effectId,
                action,
                delay: delay || this.config.defaultDelay,
                createdAt: Date.now(),
                executeAt: Date.now() + (delay || this.config.defaultDelay),
                executed: false,
                config: {
                    decay: config.decay !== false,
                    decayRate: config.decayRate || this.config.decayRate,
                    amplification: config.amplification || this.config.amplificationFactor,
                    ...config
                }
            };

            this.delayedEffects.push(effect);
            return effect.id;
        }

        /**
         * 更新并执行到期的效果
         */
        update(callback) {
            const now = Date.now();
            const toExecute = [];

            for (let i = this.delayedEffects.length - 1; i >= 0; i--) {
                const effect = this.delayedEffects[i];

                if (!effect.executed && now >= effect.executeAt) {
                    effect.executed = true;
                    toExecute.push(effect);
                }

                // 清理已执行的效果
                if (effect.executed && now - effect.executeAt > 10000) {
                    this.delayedEffects.splice(i, 1);
                }
            }

            // 执行效果
            for (const effect of toExecute) {
                let result = { action: effect.action };

                // 应用衰减
                if (effect.config.decay) {
                    result.decayed = this.applyDecay(effect);
                }

                // 应用放大
                if (effect.config.amplification) {
                    result.amplified = this.applyAmplification(effect);
                }

                if (callback) {
                    callback(result);
                }
            }

            return toExecute.length;
        }

        /**
         * 应用衰减效果
         */
        applyDecay(effect) {
            const elapsed = Date.now() - effect.createdAt;
            const decayFactor = Math.exp(-effect.config.decayRate * elapsed / 1000);
            return {
                originalValue: effect.action.value || 1,
                decayedValue: (effect.action.value || 1) * decayFactor,
                decayFactor
            };
        }

        /**
         * 应用放大效果（时间延迟导致的效果累积）
         */
        applyAmplification(effect) {
            const delay = effect.delay;
            const amplification = 1 + (effect.config.amplification - 1) * Math.min(1, delay / 5000);
            return {
                originalValue: effect.action.value || 1,
                amplifiedValue: (effect.action.value || 1) * amplification,
                amplificationFactor: amplification
            };
        }

        /**
         * 取消延迟效果
         */
        cancelEffect(effectId) {
            const index = this.delayedEffects.findIndex(e => e.id === effectId);
            if (index !== -1) {
                this.delayedEffects.splice(index, 1);
                return true;
            }
            return false;
        }

        /**
         * 获取待执行效果数量
         */
        getPendingCount() {
            return this.delayedEffects.filter(e => !e.executed).length;
        }

        /**
         * 获取所有延迟效果
         */
        getAllEffects() {
            return [...this.delayedEffects];
        }
    }

    // ============================================
    // 系统动力学模型
    // ============================================
    class SystemDynamicsModel {
        constructor(config = {}) {
            this.config = {
                timeStep: config.timeStep || 100,
                maxHistory: config.maxHistory || 1000,
                ...config
            };

            this.variables = new Map();
            this.flows = new Map();
            this.stock = new Map();
            this.history = new Map();
            this.time = 0;

            this.equations = [];
            this.feedbackLoops = [];
        }

        /**
         * 添加变量
         */
        addVariable(name, initialValue, config = {}) {
            this.variables.set(name, {
                name,
                value: initialValue,
                type: config.type || 'auxiliary',
                unit: config.unit || '',
                min: config.min,
                max: config.max
            });

            this.history.set(name, [initialValue]);
            return this;
        }

        /**
         * 添加存量
         */
        addStock(name, initialValue) {
            this.stock.set(name, initialValue);
            this.addVariable(name, initialValue, { type: 'stock' });
            return this;
        }

        /**
         * 添加流量
         */
        addFlow(name, source, target, equation) {
            this.flows.set(name, {
                name,
                source,
                target,
                equation
            });
            return this;
        }

        /**
         * 添加方程
         */
        addEquation(name, equation) {
            this.equations.push({ name, equation });
            return this;
        }

        /**
         * 添加反馈回路
         */
        addFeedbackLoop(name, variables, type = 'reinforcing') {
            this.feedbackLoops.push({
                name,
                variables,
                type, // 'reinforcing' or 'balancing'
                strength: 1
            });
            return this;
        }

        /**
         * 获取变量值
         */
        getVariable(name) {
            return this.variables.get(name)?.value;
        }

        /**
         * 设置变量值
         */
        setVariable(name, value) {
            const variable = this.variables.get(name);
            if (variable) {
                // 应用边界约束
                if (variable.min !== undefined) value = Math.max(variable.min, value);
                if (variable.max !== undefined) value = Math.min(variable.max, value);

                variable.value = value;

                // 记录历史
                const history = this.history.get(name);
                if (history) {
                    history.push(value);
                    if (history.length > this.config.maxHistory) {
                        history.shift();
                    }
                }
            }
        }

        /**
         * 计算方程
         * 安全替代 eval：白名单字符 + Function 构造器 + 沙箱变量
         */
        evaluateEquation(equation) {
            // 替换变量名为其值
            let expr = equation;
            for (const [name, variable] of this.variables) {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                expr = expr.replace(regex, variable.value.toString());
            }

            // 安全检查：仅允许数字、运算符、括号、空格、小数点
            // 拒绝任何包含字母（除了已替换的变量）或 JS 关键字的表达式
            if (!/^[\d\s+\-*/().]+$/.test(expr)) {
                if (typeof Logger !== 'undefined') {
                    Logger.error('TimeDelayModel', 'Equation rejected (contains non-math characters):', expr);
                }
                return 0;
            }

            try {
                // 使用 Function 构造器 + 严格模式，避免直接 eval
                // 仅暴露 Math 给公式
                const fn = new Function('"use strict"; return (' + expr + ');');
                const result = fn();
                // 检查结果是否为有限数
                if (typeof result !== 'number' || !Number.isFinite(result)) {
                    if (typeof Logger !== 'undefined') {
                        Logger.error('TimeDelayModel', 'Equation returned non-finite value:', result);
                    }
                    return 0;
                }
                return result;
            } catch (e) {
                if (typeof Logger !== 'undefined') {
                    Logger.error('TimeDelayModel', 'Equation evaluation error:', e);
                }
                return 0;
            }
        }

        /**
         * 模拟一个时间步
         */
        step() {
            this.time += this.config.timeStep;

            // 计算流量
            const flowValues = new Map();
            for (const [name, flow] of this.flows) {
                const value = this.evaluateEquation(flow.equation);
                flowValues.set(name, value);

                // 更新存量
                if (flow.source && this.stock.has(flow.source)) {
                    const current = this.stock.get(flow.source);
                    this.stock.set(flow.source, current - value);
                    this.setVariable(flow.source, this.stock.get(flow.source));
                }

                if (flow.target && this.stock.has(flow.target)) {
                    const current = this.stock.get(flow.target);
                    this.stock.set(flow.target, current + value);
                    this.setVariable(flow.target, this.stock.get(flow.target));
                }
            }

            // 计算辅助变量
            for (const { name, equation } of this.equations) {
                const value = this.evaluateEquation(equation);
                this.setVariable(name, value);
            }

            return {
                time: this.time,
                variables: this.getAllVariables(),
                flows: Object.fromEntries(flowValues)
            };
        }

        /**
         * 运行模拟
         */
        simulate(steps) {
            const results = [];
            for (let i = 0; i < steps; i++) {
                results.push(this.step());
            }
            return results;
        }

        /**
         * 获取所有变量
         */
        getAllVariables() {
            const result = {};
            for (const [name, variable] of this.variables) {
                result[name] = variable.value;
            }
            return result;
        }

        /**
         * 获取变量历史
         */
        getHistory(name) {
            return this.history.get(name) || [];
        }

        /**
         * 获取反馈回路分析
         */
        analyzeFeedbackLoops() {
            const analysis = [];

            for (const loop of this.feedbackLoops) {
                let loopStrength = 1;
                let signChanges = 0;

                for (let i = 0; i < loop.variables.length; i++) {
                    const current = loop.variables[i];
                    const next = loop.variables[(i + 1) % loop.variables.length];

                    const currentVal = this.getVariable(current);
                    const history = this.getHistory(current);

                    if (history.length > 1) {
                        const prevVal = history[history.length - 2];
                        if (currentVal > prevVal !== (this.getVariable(next) > currentVal)) {
                            signChanges++;
                        }
                    }
                }

                loopStrength *= (loop.type === 'reinforcing' ? 1 : -1);

                analysis.push({
                    name: loop.name,
                    type: loop.type,
                    polarity: signChanges % 2 === 0 ? 'positive' : 'negative',
                    strength: loopStrength
                });
            }

            return analysis;
        }

        /**
         * 重置模型
         */
        reset() {
            this.time = 0;
            for (const [, variable] of this.variables) {
                const history = this.history.get(variable.name);
                if (history && history.length > 0) {
                    variable.value = history[0];
                    this.history.set(variable.name, [history[0]]);
                }
            }
            for (const [name, value] of this.stock) {
                const history = this.history.get(name);
                this.stock.set(name, history ? history[0] : value);
            }
        }
    }

    // ============================================
    // 因果回路图
    // ============================================
    class CausalLoopDiagram {
        constructor() {
            this.nodes = new Map();
            this.links = [];
            this.loops = [];
        }

        /**
         * 添加节点
         */
        addNode(id, label, config = {}) {
            this.nodes.set(id, {
                id,
                label,
                type: config.type || 'variable', // 'variable', 'stock', 'flow'
                value: config.value,
                ...config
            });
            return this;
        }

        /**
         * 添加链接
         */
        addLink(source, target, polarity = 'positive', config = {}) {
            this.links.push({
                source,
                target,
                polarity, // 'positive' (+) or 'negative' (-)
                delay: config.delay || 0,
                strength: config.strength || 1,
                label: config.label || ''
            });
            return this;
        }

        /**
         * 识别回路
         */
        identifyLoops() {
            const adjacencyList = this.buildAdjacencyList();
            const visited = new Set();
            const loops = [];

            for (const nodeId of this.nodes.keys()) {
                this.findLoopsDFS(nodeId, nodeId, [], visited, adjacencyList, loops);
            }

            this.loops = this.deduplicateLoops(loops);
            return this.loops;
        }

        /**
         * 构建邻接表
         */
        buildAdjacencyList() {
            const adjacencyList = new Map();

            for (const nodeId of this.nodes.keys()) {
                adjacencyList.set(nodeId, []);
            }

            for (const link of this.links) {
                const neighbors = adjacencyList.get(link.source) || [];
                neighbors.push({ node: link.target, link });
                adjacencyList.set(link.source, neighbors);
            }

            return adjacencyList;
        }

        /**
         * DFS查找回路
         */
        findLoopsDFS(start, current, path, visited, adjacencyList, loops) {
            if (path.length > 0 && current === start) {
                loops.push([...path]);
                return;
            }

            if (path.length >= 10) return; // 防止无限循环

            const neighbors = adjacencyList.get(current) || [];
            for (const { node, link } of neighbors) {
                const edgeKey = `${current}-${node}`;
                if (!visited.has(edgeKey)) {
                    visited.add(edgeKey);
                    path.push({ from: current, to: node, link });
                    this.findLoopsDFS(start, node, path, visited, adjacencyList, loops);
                    path.pop();
                    visited.delete(edgeKey);
                }
            }
        }

        /**
         * 去重回路
         */
        deduplicateLoops(loops) {
            const unique = new Map();

            for (const loop of loops) {
                const nodes = loop.map(l => l.from).sort().join('-');
                if (!unique.has(nodes)) {
                    unique.set(nodes, loop);
                }
            }

            return Array.from(unique.values());
        }

        /**
         * 确定回路极性
         */
        determineLoopPolarity(loop) {
            let negativeCount = 0;

            for (const edge of loop) {
                if (edge.link.polarity === 'negative') {
                    negativeCount++;
                }
            }

            // 偶数个负链接 = 正反馈(R), 奇数个 = 负反馈
            return negativeCount % 2 === 0 ? 'reinforcing' : 'balancing';
        }

        /**
         * 获取回路详情
         */
        getLoopDetails() {
            return this.loops.map((loop, index) => ({
                id: index + 1,
                nodes: loop.map(l => ({
                    from: this.nodes.get(l.from)?.label || l.from,
                    to: this.nodes.get(l.to)?.label || l.to
                })),
                polarity: this.determineLoopPolarity(loop),
                type: this.determineLoopPolarity(loop) === 'reinforcing' ? 'R' : 'B'
            }));
        }

        /**
         * 导出为DOT格式
         */
        toDot() {
            let dot = 'digraph CausalLoopDiagram {\n';
            dot += '  rankdir=LR;\n';
            dot += '  node [shape=box];\n\n';

            // 添加节点
            for (const [, node] of this.nodes) {
                dot += `  "${node.id}" [label="${node.label}"];\n`;
            }

            dot += '\n';

            // 添加边
            for (const link of this.links) {
                const style = link.polarity === 'positive' ? '' : ' [style=dashed]';
                const label = link.polarity === 'positive' ? '+' : '-';
                dot += `  "${link.source}" -> "${link.target}"${style} [label="${label}"];\n`;
            }

            dot += '}\n';
            return dot;
        }
    }

    // ============================================
    // 时间衰减函数库
    // ============================================
    const TimeDecayFunctions = {
        /**
         * 指数衰减
         * f(t) = A * e^(-kt)
         */
        exponential: function(t, A, k) {
            return A * Math.exp(-k * t);
        },

        /**
         * 线性衰减
         * f(t) = A * (1 - k*t) for t < 1/k, else 0
         */
        linear: function(t, A, k) {
            const value = A * (1 - k * t);
            return Math.max(0, value);
        },

        /**
         * 对数衰减
         * f(t) = A / (1 + k*t)
         */
        logarithmic: function(t, A, k) {
            return A / (1 + k * t);
        },

        /**
         * 高斯衰减
         * f(t) = A * e^(-(t^2)/(2*sigma^2))
         */
        gaussian: function(t, A, sigma) {
            return A * Math.exp(-(t * t) / (2 * sigma * sigma));
        },

        /**
         * S形衰减
         * f(t) = A / (1 + e^(k*(t - t0)))
         */
        sigmoid: function(t, A, k, t0) {
            return A / (1 + Math.exp(k * (t - t0)));
        },

        /**
         * 双指数衰减(药物代谢模型)
         * f(t) = A * (e^(-alpha*t) - e^(-beta*t))
         */
        biexponential: function(t, A, alpha, beta) {
            return A * (Math.exp(-alpha * t) - Math.exp(-beta * t));
        },

        /**
         * 计算半衰期
         */
        halfLife: function(decayRate) {
            return Math.log(2) / decayRate;
        },

        /**
         * 计算衰减率(给定半衰期)
         */
        decayRateFromHalfLife: function(halfLife) {
            return Math.log(2) / halfLife;
        },

        /**
         * 阶梯衰减
         */
        step: function(t, steps) {
            for (let i = 0; i < steps.length - 1; i++) {
                if (t >= steps[i].time && t < steps[i + 1].time) {
                    return steps[i].value;
                }
            }
            return steps[steps.length - 1].value;
        }
    };

    // ============================================
    // 关系投资时间延迟模拟器
    // ============================================
    class RelationshipTimeDelaySimulator {
        constructor(config = {}) {
            this.config = {
                initialInvestment: config.initialInvestment || 100,
                delayPeriod: config.delayPeriod || 5, // 时间单位
                decayRate: config.decayRate || 0.1,
                feedbackStrength: config.feedbackStrength || 0.5,
                ...config
            };

            this.model = new SystemDynamicsModel();
            this.setupModel();
        }

        /**
         * 设置系统动力学模型
         */
        setupModel() {
            const cfg = this.config;

            // 添加存量
            this.model.addStock('trust', cfg.initialInvestment);
            this.model.addStock('effort', 0);
            this.model.addStock('satisfaction', 50);

            // 添加变量
            this.model.addVariable('investment', 10);
            this.model.addVariable('delayedEffect', 0);
            this.model.addVariable('feedback', 0);

            // 添加流量
            this.model.addFlow('trustGrowth', null, 'trust', 'investment * 0.5');
            this.model.addFlow('trustDecay', 'trust', null, 'trust * decayRate');
            this.model.addFlow('effortFlow', null, 'effort', 'investment');
            this.model.addFlow('satisfactionGrowth', null, 'satisfaction', 'trust * 0.1');

            // 添加方程
            this.model.addEquation('delayedEffect', 'effort * exp(-decayRate * time/1000)');
            this.model.addEquation('feedback', 'satisfaction * feedbackStrength');

            // 添加反馈回路
            this.model.addFeedbackLoop('R1: 信任增长回路', 
                ['trust', 'satisfaction', 'feedback', 'investment'], 
                'reinforcing');
            this.model.addFeedbackLoop('B1: 信任衰减回路', 
                ['trust', 'trustDecay'], 
                'balancing');
        }

        /**
         * 进行投资
         */
        invest(amount) {
            const current = this.model.getVariable('investment') || 0;
            this.model.setVariable('investment', current + amount);
        }

        /**
         * 模拟一个时间步
         */
        step() {
            return this.model.step();
        }

        /**
         * 运行完整模拟
         */
        simulate(steps) {
            return this.model.simulate(steps);
        }

        /**
         * 获取当前状态
         */
        getState() {
            return {
                trust: this.model.getVariable('trust'),
                effort: this.model.getVariable('effort'),
                satisfaction: this.model.getVariable('satisfaction'),
                investment: this.model.getVariable('investment'),
                time: this.model.time
            };
        }

        /**
         * 获取信任历史
         */
        getTrustHistory() {
            return this.model.getHistory('trust');
        }

        /**
         * 分析延迟效果
         */
        analyzeDelayEffect() {
            const trustHistory = this.getTrustHistory();
            const investmentHistory = this.model.getHistory('investment');

            // 找出投资后的信任变化延迟
            const delays = [];
            let lastInvestmentIndex = -1;

            for (let i = 0; i < investmentHistory.length; i++) {
                if (investmentHistory[i] > (investmentHistory[i - 1] || 0)) {
                    lastInvestmentIndex = i;
                }

                if (lastInvestmentIndex >= 0 && i > lastInvestmentIndex) {
                    const trustChange = trustHistory[i] - trustHistory[lastInvestmentIndex];
                    if (Math.abs(trustChange) > 5) { // 显著变化阈值
                        delays.push(i - lastInvestmentIndex);
                        lastInvestmentIndex = -1;
                    }
                }
            }

            return {
                averageDelay: delays.length > 0 ? delays.reduce((a, b) => a + b) / delays.length : 0,
                minDelay: delays.length > 0 ? Math.min(...delays) : 0,
                maxDelay: delays.length > 0 ? Math.max(...delays) : 0,
                samples: delays.length
            };
        }

        /**
         * 重置模拟器
         */
        reset() {
            this.model.reset();
        }
    }

    // 导出
    global.TimeDelayModel = {
        TimeDelayEffectCalculator,
        SystemDynamicsModel,
        CausalLoopDiagram,
        TimeDecayFunctions,
        RelationshipTimeDelaySimulator
    };

    // 便捷创建
    global.createTimeDelayCalculator = function(config = {}) {
        return new TimeDelayEffectCalculator(config);
    };

    global.createSystemDynamicsModel = function(config = {}) {
        return new SystemDynamicsModel(config);
    };

    global.createRelationshipSimulator = function(config = {}) {
        return new RelationshipTimeDelaySimulator(config);
    };

})(typeof window !== 'undefined' ? window : global);
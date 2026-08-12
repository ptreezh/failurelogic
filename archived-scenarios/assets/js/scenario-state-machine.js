/**
 * 场景状态机
 * Scenario State Machine
 * 
 * 包含：状态定义、转换规则、历史追踪、事件处理
 * 
 * 来源：Soul Auto-Evolution 循环14
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // 状态定义类 (State Definition)
    // ============================================
    class StateDefinition {
        constructor(name, config = {}) {
            this.name = name;
            this.config = {
                onEnter: config.onEnter || null,
                onExit: config.onExit || null,
                onStay: config.onStay || null,
                isFinal: config.isFinal || false,
                isInitial: config.isInitial || false,
                timeout: config.timeout || null,
                ...config
            };

            this.transitions = new Map();
            this.data = {};
        }

        /**
         * 添加转换
         */
        addTransition(event, targetState, condition = null, action = null) {
            this.transitions.set(event, {
                target: targetState,
                condition,
                action
            });
            return this;
        }

        /**
         * 检查是否可以转换
         */
        canTransition(event, context) {
            const transition = this.transitions.get(event);
            if (!transition) return false;
            if (transition.condition && !transition.condition(context)) return false;
            return true;
        }

        /**
         * 执行转换
         */
        executeTransition(event, context) {
            const transition = this.transitions.get(event);
            if (!transition) return null;

            if (transition.action) {
                transition.action(context);
            }

            return transition.target;
        }
    }

    // ============================================
    // 状态机核心 (State Machine Core)
    // ============================================
    class StateMachine {
        constructor(config = {}) {
            this.config = {
                name: config.name || 'StateMachine',
                persistence: config.persistence || false,
                maxHistory: config.maxHistory || 100,
                ...config
            };

            this.states = new Map();
            this.currentState = null;
            this.previousState = null;
            this.context = {};
            this.history = [];
            this.eventListeners = new Map();

            this.stateEnterTime = null;
            this.transitionCount = 0;
        }

        /**
         * 添加状态
         */
        addState(stateDef) {
            const state = typeof stateDef === 'string' 
                ? new StateDefinition(stateDef)
                : stateDef;

            this.states.set(state.name, state);

            if (state.config.isInitial) {
                this.currentState = state;
            }

            return this;
        }

        /**
         * 定义转换（链式调用）
         */
        transition(from, event, to, condition = null, action = null) {
            const state = this.states.get(from);
            if (state) {
                state.addTransition(event, to, condition, action);
            }
            return this;
        }

        /**
         * 初始化状态机
         */
        initialize(context = {}) {
            this.context = context;

            // 找到初始状态
            if (!this.currentState) {
                for (const [, state] of this.states) {
                    if (state.config.isInitial) {
                        this.currentState = state;
                        break;
                    }
                }
            }

            if (!this.currentState) {
                throw new Error('No initial state defined');
            }

            this.stateEnterTime = Date.now();
            this.executeOnEnter(this.currentState);

            return this;
        }

        /**
         * 获取当前状态名
         */
        getCurrentState() {
            return this.currentState?.name || null;
        }

        /**
         * 检查是否可以触发事件
         */
        canTrigger(event) {
            if (!this.currentState) return false;
            return this.currentState.canTransition(event, this.context);
        }

        /**
         * 触发事件
         */
        trigger(event, payload = {}) {
            if (!this.currentState) {
                return { success: false, error: 'No current state' };
            }

            const transition = this.currentState.transitions.get(event);
            if (!transition) {
                return { success: false, error: `No transition for event: ${event}` };
            }

            // 检查条件
            if (transition.condition && !transition.condition(this.context)) {
                return { success: false, error: 'Condition not met' };
            }

            // 执行退出动作
            this.executeOnExit(this.currentState);

            // 记录历史
            this.recordHistory(this.currentState.name, event, transition.target);

            // 执行转换动作
            if (transition.action) {
                transition.action({ ...this.context, payload });
            }

            // 更新状态
            this.previousState = this.currentState;
            this.currentState = this.states.get(transition.target);

            if (!this.currentState) {
                throw new Error(`Target state not found: ${transition.target}`);
            }

            this.stateEnterTime = Date.now();
            this.transitionCount++;

            // 执行进入动作
            this.executeOnEnter(this.currentState);

            // 触发事件
            this.emit('stateChange', {
                from: this.previousState.name,
                to: this.currentState.name,
                event,
                payload
            });

            return { 
                success: true, 
                from: this.previousState.name, 
                to: this.currentState.name 
            };
        }

        /**
         * 执行进入动作
         */
        executeOnEnter(state) {
            if (state.config.onEnter) {
                state.config.onEnter(this.context);
            }
            this.emit('enter', { state: state.name, context: this.context });
        }

        /**
         * 执行退出动作
         */
        executeOnExit(state) {
            if (state.config.onExit) {
                state.config.onExit(this.context);
            }
            this.emit('exit', { state: state.name, context: this.context });
        }

        /**
         * 更新状态（调用onStay）
         */
        update(deltaTime) {
            if (this.currentState?.config.onStay) {
                this.currentState.config.onStay(this.context, deltaTime);
            }

            // 检查超时
            if (this.currentState?.config.timeout) {
                const elapsed = Date.now() - this.stateEnterTime;
                if (elapsed > this.currentState.config.timeout) {
                    this.trigger('timeout');
                }
            }
        }

        /**
         * 记录历史
         */
        recordHistory(from, event, to) {
            this.history.push({
                from,
                event,
                to,
                timestamp: Date.now(),
                contextSnapshot: this.config.persistence ? { ...this.context } : null
            });

            if (this.history.length > this.config.maxHistory) {
                this.history.shift();
            }
        }

        /**
         * 获取历史记录
         */
        getHistory(limit = 10) {
            return this.history.slice(-limit);
        }

        /**
         * 回滚到之前的状态
         */
        rollback(steps = 1) {
            if (this.history.length < steps) {
                return { success: false, error: 'Not enough history' };
            }

            const targetIndex = this.history.length - steps;
            const targetEntry = this.history[targetIndex];

            // 执行退出
            if (this.currentState) {
                this.executeOnExit(this.currentState);
            }

            // 恢复状态
            this.currentState = this.states.get(targetEntry.from);
            this.stateEnterTime = Date.now();

            // 恢复上下文
            if (targetEntry.contextSnapshot) {
                this.context = { ...targetEntry.contextSnapshot };
            }

            // 截断历史
            this.history = this.history.slice(0, targetIndex);

            // 执行进入
            this.executeOnEnter(this.currentState);

            return { success: true, state: this.currentState.name };
        }

        /**
         * 重置状态机
         */
        reset() {
            this.currentState = null;
            this.previousState = null;
            this.history = [];
            this.transitionCount = 0;
            this.stateEnterTime = null;

            // 重新初始化
            this.initialize(this.context);
        }

        /**
         * 获取状态持续时间
         */
        getStateDuration() {
            if (!this.stateEnterTime) return 0;
            return Date.now() - this.stateEnterTime;
        }

        /**
         * 检查是否为最终状态
         */
        isFinalState() {
            return this.currentState?.config.isFinal || false;
        }

        /**
         * 获取所有可能的事件
         */
        getAvailableEvents() {
            if (!this.currentState) return [];
            return Array.from(this.currentState.transitions.keys());
        }

        /**
         * 获取状态机统计
         */
        getStats() {
            return {
                name: this.config.name,
                currentState: this.getCurrentState(),
                previousState: this.previousState?.name,
                transitionCount: this.transitionCount,
                stateDuration: this.getStateDuration(),
                historyLength: this.history.length,
                isFinal: this.isFinalState()
            };
        }

        /**
         * 事件监听
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
        emit(event, data) {
            if (this.eventListeners.has(event)) {
                for (const callback of this.eventListeners.get(event)) {
                    callback(data);
                }
            }
        }

        /**
         * 导出状态机配置
         */
        export() {
            const states = {};
            for (const [name, state] of this.states) {
                states[name] = {
                    transitions: Object.fromEntries(state.transitions),
                    isInitial: state.config.isInitial,
                    isFinal: state.config.isFinal
                };
            }
            return { states, current: this.currentState?.name };
        }
    }

    // ============================================
    // 场景状态机工厂 (Scenario State Machine Factory)
    // ============================================
    class ScenarioStateMachineFactory {
        /**
         * 创建认知偏差场景状态机
         */
        static createCognitiveBiasScenario(scenarioConfig) {
            const fsm = new StateMachine({ 
                name: scenarioConfig.name || 'CognitiveBiasScenario',
                persistence: true 
            });

            // 定义场景通用状态
            fsm.addState(new StateDefinition('init', { isInitial: true }))
                .addState(new StateDefinition('intro'))
                .addState(new StateDefinition('playing'))
                .addState(new StateDefinition('decision'))
                .addState(new StateDefinition('feedback'))
                .addState(new StateDefinition('awakening'))
                .addState(new StateDefinition('complete', { isFinal: true }));

            // 定义转换
            fsm.transition('init', 'start', 'intro')
                .transition('intro', 'begin', 'playing')
                .transition('playing', 'decide', 'decision')
                .transition('decision', 'submit', 'feedback')
                .transition('feedback', 'continue', 'playing')
                .transition('feedback', 'awaken', 'awakening')
                .transition('awakening', 'finish', 'complete')
                .transition('playing', 'skip', 'complete');

            return fsm;
        }

        /**
         * 创建游戏场景状态机
         */
        static createGameScenario(scenarioConfig) {
            const fsm = new StateMachine({ 
                name: scenarioConfig.name || 'GameScenario',
                persistence: true 
            });

            fsm.addState(new StateDefinition('menu', { isInitial: true }))
                .addState(new StateDefinition('loading'))
                .addState(new StateDefinition('playing'))
                .addState(new StateDefinition('paused'))
                .addState(new StateDefinition('gameOver'))
                .addState(new StateDefinition('victory'))
                .addState(new StateDefinition('exit', { isFinal: true }));

            fsm.transition('menu', 'start', 'loading')
                .transition('loading', 'loaded', 'playing')
                .transition('playing', 'pause', 'paused')
                .transition('paused', 'resume', 'playing')
                .transition('paused', 'quit', 'menu')
                .transition('playing', 'lose', 'gameOver')
                .transition('playing', 'win', 'victory')
                .transition('gameOver', 'retry', 'loading')
                .transition('gameOver', 'menu', 'menu')
                .transition('victory', 'next', 'loading')
                .transition('victory', 'menu', 'menu');

            return fsm;
        }

        /**
         * 创建学习场景状态机
         */
        static createLearningScenario(scenarioConfig) {
            const fsm = new StateMachine({ 
                name: scenarioConfig.name || 'LearningScenario',
                persistence: true 
            });

            fsm.addState(new StateDefinition('start', { isInitial: true }))
                .addState(new StateDefinition('concept'))
                .addState(new StateDefinition('example'))
                .addState(new StateDefinition('practice'))
                .addState(new StateDefinition('assessment'))
                .addState(new StateDefinition('review'))
                .addState(new StateDefinition('complete', { isFinal: true }));

            fsm.transition('start', 'begin', 'concept')
                .transition('concept', 'understand', 'example')
                .transition('concept', 'confused', 'concept')
                .transition('example', 'practice', 'practice')
                .transition('example', 'more', 'example')
                .transition('practice', 'test', 'assessment')
                .transition('practice', 'help', 'concept')
                .transition('assessment', 'pass', 'review')
                .transition('assessment', 'fail', 'practice')
                .transition('review', 'complete', 'complete')
                .transition('review', 'revisit', 'concept');

            return fsm;
        }
    }

    // ============================================
    // 场景状态管理器 (Scenario State Manager)
    // ============================================
    class ScenarioStateManager {
        constructor() {
            this.instances = new Map();
            this.activeScenarios = new Map();
        }

        /**
         * 创建场景实例
         */
        createInstance(id, type, config = {}) {
            let fsm;

            switch (type) {
                case 'cognitive_bias':
                    fsm = ScenarioStateMachineFactory.createCognitiveBiasScenario(config);
                    break;
                case 'game':
                    fsm = ScenarioStateMachineFactory.createGameScenario(config);
                    break;
                case 'learning':
                    fsm = ScenarioStateMachineFactory.createLearningScenario(config);
                    break;
                default:
                    fsm = new StateMachine({ name: type });
            }

            fsm.initialize(config.context || {});
            this.instances.set(id, { fsm, type, config });

            return fsm;
        }

        /**
         * 获取场景实例
         */
        getInstance(id) {
            return this.instances.get(id)?.fsm;
        }

        /**
         * 激活场景
         */
        activate(id) {
            const instance = this.instances.get(id);
            if (instance) {
                this.activeScenarios.set(id, instance);
                return true;
            }
            return false;
        }

        /**
         * 停用场景
         */
        deactivate(id) {
            return this.activeScenarios.delete(id);
        }

        /**
         * 获取活跃场景
         */
        getActiveScenarios() {
            return Array.from(this.activeScenarios.keys());
        }

        /**
         * 销毁场景实例
         */
        destroyInstance(id) {
            this.activeScenarios.delete(id);
            return this.instances.delete(id);
        }

        /**
         * 获取所有场景统计
         */
        getAllStats() {
            const stats = {};
            for (const [id, { fsm }] of this.instances) {
                stats[id] = fsm.getStats();
            }
            return stats;
        }
    }

    // 导出
    global.ScenarioStateMachine = {
        StateDefinition,
        StateMachine,
        ScenarioStateMachineFactory,
        ScenarioStateManager
    };

    // 便捷创建
    global.createStateMachine = function(config = {}) {
        return new StateMachine(config);
    };

    global.createScenarioManager = function() {
        return new ScenarioStateManager();
    };

})(typeof window !== 'undefined' ? window : global);
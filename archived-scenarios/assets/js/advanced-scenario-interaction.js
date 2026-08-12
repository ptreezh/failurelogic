/**
 * 高级场景交互模块
 * Advanced Scenario Interaction Module
 * 
 * 功能：
 * - 多分支决策树
 * - 动态事件触发
 * - 角色扮演对话系统
 * - 环境因素模拟
 * - 情境感知反馈
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环16
 */

(function(global) {
    'use strict';

    // ============================================
    // 决策节点类型
    // ============================================
    const DecisionNodeType = {
        ROOT: 'root',
        CHOICE: 'choice',
        RANDOM: 'random',
        CONDITION: 'condition',
        OUTCOME: 'outcome',
        BRANCH: 'branch'
    };

    // ============================================
    // 事件优先级
    // ============================================
    const EventPriority = {
        CRITICAL: 1,
        HIGH: 2,
        MEDIUM: 3,
        LOW: 4,
        BACKGROUND: 5
    };

    // ============================================
    // 决策树节点
    // ============================================
    class DecisionNode {
        constructor(config) {
            this.id = config.id || `node_${Date.now()}`;
            this.type = config.type || DecisionNodeType.CHOICE;
            this.content = config.content || '';
            this.options = config.options || [];
            this.children = [];
            this.parent = null;
            this.conditions = config.conditions || [];
            this.effects = config.effects || [];
            this.metadata = config.metadata || {};
        }

        /**
         * 添加子节点
         */
        addChild(node) {
            node.parent = this;
            this.children.push(node);
            return this;
        }

        /**
         * 评估条件
         */
        evaluateConditions(context) {
            for (const condition of this.conditions) {
                if (!condition.evaluate(context)) {
                    return false;
                }
            }
            return true;
        }

        /**
         * 执行效果
         */
        executeEffects(context) {
            const results = [];
            for (const effect of this.effects) {
                results.push(effect.execute(context));
            }
            return results;
        }

        /**
         * 获取可用选项
         */
        getAvailableOptions(context) {
            return this.options.filter(option => {
                if (option.conditions) {
                    return option.conditions.every(c => c.evaluate(context));
                }
                return true;
            });
        }
    }

    // ============================================
    // 决策树引擎
    // ============================================
    class DecisionTreeEngine {
        constructor(config) {
            this.root = null;
            this.currentNode = null;
            this.context = config.context || {};
            this.history = [];
            this.variables = config.variables || {};
        }

        /**
         * 从JSON构建决策树
         */
        buildFromJSON(data) {
            this.root = this._buildNode(data);
            this.currentNode = this.root;
            return this;
        }

        /**
         * 递归构建节点
         */
        _buildNode(data) {
            const node = new DecisionNode(data);
            
            if (data.children) {
                for (const childData of data.children) {
                    node.addChild(this._buildNode(childData));
                }
            }
            
            return node;
        }

        /**
         * 做出决策
         */
        makeDecision(optionId) {
            if (!this.currentNode) return null;

            const option = this.currentNode.options.find(o => o.id === optionId);
            if (!option) return null;

            // 记录历史
            this.history.push({
                nodeId: this.currentNode.id,
                optionId: optionId,
                timestamp: Date.now()
            });

            // 执行选项效果
            if (option.effects) {
                for (const effect of option.effects) {
                    effect.execute(this.context);
                }
            }

            // 移动到下一个节点
            if (option.nextNodeId) {
                this.currentNode = this._findNodeById(option.nextNodeId);
            } else if (this.currentNode.children.length > 0) {
                // 根据条件选择下一个节点
                for (const child of this.currentNode.children) {
                    if (child.evaluateConditions(this.context)) {
                        this.currentNode = child;
                        break;
                    }
                }
            }

            return this.currentNode;
        }

        /**
         * 查找节点
         */
        _findNodeById(id, node = this.root) {
            if (node.id === id) return node;
            
            for (const child of node.children) {
                const found = this._findNodeById(id, child);
                if (found) return found;
            }
            
            return null;
        }

        /**
         * 获取当前状态
         */
        getCurrentState() {
            return {
                nodeId: this.currentNode?.id,
                content: this.currentNode?.content,
                options: this.currentNode?.getAvailableOptions(this.context) || [],
                variables: { ...this.variables },
                historyLength: this.history.length
            };
        }

        /**
         * 回溯决策
         */
        backtrack(steps = 1) {
            for (let i = 0; i < steps && this.history.length > 0; i++) {
                this.history.pop();
            }
            
            // 重建状态
            this.currentNode = this.root;
            for (const h of this.history) {
                const option = this.currentNode.options.find(o => o.id === h.optionId);
                if (option && option.nextNodeId) {
                    this.currentNode = this._findNodeById(option.nextNodeId);
                }
            }
            
            return this.getCurrentState();
        }
    }

    // ============================================
    // 动态事件系统
    // ============================================
    class DynamicEventSystem {
        constructor() {
            this.events = [];
            this.activeEvents = [];
            this.eventQueue = [];
            this.subscribers = {};
        }

        /**
         * 注册事件
         */
        registerEvent(event) {
            this.events.push({
                id: event.id,
                name: event.name,
                trigger: event.trigger,
                priority: event.priority || EventPriority.MEDIUM,
                probability: event.probability || 1.0,
                maxOccurrences: event.maxOccurrences || 1,
                currentOccurrences: 0,
                effects: event.effects || [],
                description: event.description || ''
            });
        }

        /**
         * 检查并触发事件
         */
        checkAndTrigger(context) {
            const triggeredEvents = [];
            
            for (const event of this.events) {
                if (event.currentOccurrences >= event.maxOccurrences) continue;
                if (Math.random() > event.probability) continue;
                
                if (event.trigger.evaluate(context)) {
                    triggeredEvents.push(event);
                    event.currentOccurrences++;
                }
            }
            
            // 按优先级排序
            triggeredEvents.sort((a, b) => a.priority - b.priority);
            
            // 执行事件效果
            for (const event of triggeredEvents) {
                this._executeEvent(event, context);
                this._notifySubscribers(event);
            }
            
            return triggeredEvents;
        }

        /**
         * 执行事件效果
         */
        _executeEvent(event, context) {
            for (const effect of event.effects) {
                effect.execute(context);
            }
            this.activeEvents.push({
                ...event,
                activatedAt: Date.now()
            });
        }

        /**
         * 订阅事件
         */
        subscribe(eventId, callback) {
            if (!this.subscribers[eventId]) {
                this.subscribers[eventId] = [];
            }
            this.subscribers[eventId].push(callback);
        }

        /**
         * 通知订阅者
         */
        _notifySubscribers(event) {
            const callbacks = this.subscribers[event.id] || [];
            for (const callback of callbacks) {
                callback(event);
            }
        }
    }

    // ============================================
    // 对话系统
    // ============================================
    class DialogueSystem {
        constructor() {
            this.characters = {};
            this.currentDialogue = null;
            this.dialogueHistory = [];
        }

        /**
         * 注册角色
         */
        registerCharacter(id, config) {
            this.characters[id] = {
                id: id,
                name: config.name,
                avatar: config.avatar,
                personality: config.personality || {},
                relationship: config.relationship || 50,
                dialogues: config.dialogues || {}
            };
        }

        /**
         * 开始对话
         */
        startDialogue(characterId, dialogueId) {
            const character = this.characters[characterId];
            if (!character) return null;

            const dialogue = character.dialogues[dialogueId];
            if (!dialogue) return null;

            this.currentDialogue = {
                character: character,
                dialogue: dialogue,
                currentNode: dialogue.start,
                history: []
            };

            return this._getDialogueState();
        }

        /**
         * 选择对话选项
         */
        selectOption(optionIndex) {
            if (!this.currentDialogue) return null;

            const { dialogue, currentNode, history, character } = this.currentDialogue;
            const node = dialogue.nodes[currentNode];
            
            if (!node.options || !node.options[optionIndex]) return null;

            const option = node.options[optionIndex];
            
            // 记录历史
            history.push({
                node: currentNode,
                option: optionIndex,
                timestamp: Date.now()
            });

            // 更新关系值
            if (option.relationshipEffect) {
                character.relationship += option.relationshipEffect;
                character.relationship = Math.max(0, Math.min(100, character.relationship));
            }

            // 移动到下一个节点
            this.currentDialogue.currentNode = option.nextNode || 'end';

            return this._getDialogueState();
        }

        /**
         * 获取对话状态
         */
        _getDialogueState() {
            if (!this.currentDialogue) return null;

            const { dialogue, currentNode, character } = this.currentDialogue;
            
            if (currentNode === 'end') {
                return {
                    status: 'ended',
                    character: character,
                    finalRelationship: character.relationship
                };
            }

            const node = dialogue.nodes[currentNode];
            
            return {
                status: 'active',
                character: character,
                speaker: node.speaker || character.id,
                text: node.text,
                options: node.options || [],
                metadata: node.metadata || {}
            };
        }

        /**
         * 获取关系值
         */
        getRelationship(characterId) {
            return this.characters[characterId]?.relationship || 0;
        }
    }

    // ============================================
    // 环境模拟系统
    // ============================================
    class EnvironmentSimulator {
        constructor(config) {
            this.state = {
                time: config.initialTime || 0,
                weather: config.initialWeather || 'normal',
                economicCondition: config.initialEconomic || 'stable',
                marketTrend: config.initialTrend || 'neutral',
                socialMood: config.initialMood || 50,
                resources: config.initialResources || {}
            };
            
            this.rules = config.rules || {};
            this.history = [];
        }

        /**
         * 更新环境状态
         */
        update(deltaTime = 1) {
            this.history.push({ ...this.state });
            
            // 时间流逝
            this.state.time += deltaTime;
            
            // 应用规则
            this._applyRules();
            
            // 随机事件
            this._applyRandomChanges();
            
            return this.getState();
        }

        /**
         * 应用规则
         */
        _applyRules() {
            // 经济周期
            if (this.rules.economicCycle) {
                const cyclePosition = this.state.time % this.rules.economicCycle.period;
                if (cyclePosition < this.rules.economicCycle.recessionPhase) {
                    this.state.economicCondition = 'recession';
                } else if (cyclePosition < this.rules.economicCycle.recoveryPhase) {
                    this.state.economicCondition = 'recovery';
                } else {
                    this.state.economicCondition = 'growth';
                }
            }

            // 市场趋势
            if (this.rules.marketTrend) {
                const rand = Math.random();
                if (this.state.economicCondition === 'growth') {
                    if (rand < 0.6) this.state.marketTrend = 'bull';
                    else if (rand < 0.8) this.state.marketTrend = 'neutral';
                    else this.state.marketTrend = 'bear';
                } else if (this.state.economicCondition === 'recession') {
                    if (rand < 0.7) this.state.marketTrend = 'bear';
                    else if (rand < 0.9) this.state.marketTrend = 'neutral';
                    else this.state.marketTrend = 'bull';
                }
            }
        }

        /**
         * 应用随机变化
         */
        _applyRandomChanges() {
            // 天气变化
            if (Math.random() < 0.1) {
                const weathers = ['sunny', 'cloudy', 'rainy', 'stormy', 'normal'];
                this.state.weather = weathers[Math.floor(Math.random() * weathers.length)];
            }

            // 社会情绪波动
            this.state.socialMood += (Math.random() - 0.5) * 10;
            this.state.socialMood = Math.max(0, Math.min(100, this.state.socialMood));
        }

        /**
         * 获取当前状态
         */
        getState() {
            return { ...this.state };
        }

        /**
         * 应用外部影响
         */
        applyImpact(impact) {
            if (impact.socialMood) {
                this.state.socialMood += impact.socialMood;
                this.state.socialMood = Math.max(0, Math.min(100, this.state.socialMood));
            }
            if (impact.resources) {
                for (const [resource, amount] of Object.entries(impact.resources)) {
                    if (!this.state.resources[resource]) {
                        this.state.resources[resource] = 0;
                    }
                    this.state.resources[resource] += amount;
                }
            }
        }
    }

    // ============================================
    // 高级场景交互管理器
    // ============================================
    class AdvancedScenarioInteractionManager {
        constructor(config) {
            this.decisionTree = new DecisionTreeEngine(config.decisionTree || {});
            this.eventSystem = new DynamicEventSystem();
            this.dialogueSystem = new DialogueSystem();
            this.environment = new EnvironmentSimulator(config.environment || {});
            
            this.state = {
                phase: 'initialized',
                turn: 0,
                score: 0
            };
        }

        /**
         * 初始化场景
         */
        initialize(scenarioConfig) {
            if (scenarioConfig.decisionTree) {
                this.decisionTree.buildFromJSON(scenarioConfig.decisionTree);
            }
            
            if (scenarioConfig.events) {
                for (const event of scenarioConfig.events) {
                    this.eventSystem.registerEvent(event);
                }
            }
            
            if (scenarioConfig.characters) {
                for (const [id, char] of Object.entries(scenarioConfig.characters)) {
                    this.dialogueSystem.registerCharacter(id, char);
                }
            }
            
            this.state.phase = 'ready';
            return this;
        }

        /**
         * 执行回合
         */
        executeTurn(action) {
            this.state.turn++;
            
            // 更新环境
            const envState = this.environment.update(1);
            
            // 检查事件触发
            const triggeredEvents = this.eventSystem.checkAndTrigger({
                ...this.decisionTree.context,
                environment: envState,
                turn: this.state.turn
            });
            
            // 执行决策
            let decisionResult = null;
            if (action.type === 'decision') {
                decisionResult = this.decisionTree.makeDecision(action.optionId);
            } else if (action.type === 'dialogue') {
                decisionResult = this.dialogueSystem.selectOption(action.optionIndex);
            }
            
            // 计算分数
            if (decisionResult?.effects) {
                for (const effect of decisionResult.effects) {
                    if (effect.score) {
                        this.state.score += effect.score;
                    }
                }
            }
            
            return {
                turn: this.state.turn,
                environment: envState,
                events: triggeredEvents,
                decision: decisionResult,
                state: this.decisionTree.getCurrentState()
            };
        }

        /**
         * 获取场景状态
         */
        getScenarioState() {
            return {
                ...this.state,
                decisionState: this.decisionTree.getCurrentState(),
                environment: this.environment.getState(),
                relationships: this._getAllRelationships()
            };
        }

        /**
         * 获取所有关系值
         */
        _getAllRelationships() {
            const relationships = {};
            for (const [id, char] of Object.entries(this.dialogueSystem.characters)) {
                relationships[id] = char.relationship;
            }
            return relationships;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            DecisionNode,
            DecisionTreeEngine,
            DynamicEventSystem,
            DialogueSystem,
            EnvironmentSimulator,
            AdvancedScenarioInteractionManager,
            DecisionNodeType,
            EventPriority
        };
    } else {
        global.DecisionNode = DecisionNode;
        global.DecisionTreeEngine = DecisionTreeEngine;
        global.DynamicEventSystem = DynamicEventSystem;
        global.DialogueSystem = DialogueSystem;
        global.EnvironmentSimulator = EnvironmentSimulator;
        global.AdvancedScenarioInteractionManager = AdvancedScenarioInteractionManager;
        global.DecisionNodeType = DecisionNodeType;
        global.EventPriority = EventPriority;
    }

})(typeof window !== 'undefined' ? window : this);

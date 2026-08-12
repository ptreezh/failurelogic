/**
 * 场景体验增强器
 * Scenario Experience Enhancer
 * 
 * 核心使命：优化认知偏差教育场景的用户体验
 * 
 * 功能：
 * - 场景加载优化
 * - 叙事流畅性提升
 * - 决策反馈即时性
 * - 觉醒时刻震撼效果
 * 
 * 创建时间：2026-03-14
 * 来源：Soul核心进化 - 认知偏差教育聚焦
 */

(function(global) {
    'use strict';

    // ============================================
    // 场景加载优化器
    // ============================================
    class ScenarioLoader {
        constructor() {
            this.cache = new Map();
            this.preloadQueue = [];
            this.loadingProgress = 0;
        }

        /**
         * 预加载场景
         */
        preload(scenarioIds) {
            for (const id of scenarioIds) {
                if (!this.cache.has(id)) {
                    this.preloadQueue.push(id);
                }
            }
            this._processPreloadQueue();
        }

        /**
         * 加载场景
         */
        async load(scenarioId) {
            // 检查缓存
            if (this.cache.has(scenarioId)) {
                return this.cache.get(scenarioId);
            }

            // 加载场景数据
            const scenario = await this._fetchScenario(scenarioId);
            this.cache.set(scenarioId, scenario);
            return scenario;
        }

        /**
         * 获取场景
         */
        async _fetchScenario(scenarioId) {
            try {
                const response = await fetch(`/scenarios/${scenarioId}`);
                if (!response.ok) throw new Error('场景加载失败');
                return await response.json();
            } catch (error) {
                Logger?.error('场景加载错误:', error);
                return this._getFallbackScenario(scenarioId);
            }
        }

        /**
         * 备用场景
         */
        _getFallbackScenario(scenarioId) {
            const fallbacks = {
                'coffee_shop': {
                    id: 'coffee_shop',
                    title: '咖啡店线性思维',
                    description: '探索线性思维陷阱',
                    stages: []
                },
                'relationship_investment': {
                    id: 'relationship_investment', 
                    title: '关系投资时间延迟',
                    description: '理解时间延迟效应',
                    stages: []
                }
            };
            return fallbacks[scenarioId] || { id: scenarioId, title: '场景', stages: [] };
        }

        /**
         * 处理预加载队列
         */
        _processPreloadQueue() {
            const batchSize = 3;
            const batch = this.preloadQueue.splice(0, batchSize);
            
            Promise.all(batch.map(id => this.load(id)))
                .then(() => {
                    if (this.preloadQueue.length > 0) {
                        setTimeout(() => this._processPreloadQueue(), 100);
                    }
                });
        }
    }

    // ============================================
    // 叙事引擎
    // ============================================
    class NarrativeEngine {
        constructor() {
            this.currentStory = null;
            this.storyState = {};
            this.branchHistory = [];
        }

        /**
         * 开始叙事
         */
        beginStory(scenario) {
            this.currentStory = {
                id: scenario.id,
                title: scenario.title,
                chapters: scenario.stages || [],
                currentChapter: 0
            };
            this.storyState = {
                decisions: [],
                emotions: [],
                insights: []
            };
            this.branchHistory = [];
            
            return this._renderChapter(0);
        }

        /**
         * 渲染章节
         */
        _renderChapter(chapterIndex) {
            if (!this.currentStory || chapterIndex >= this.currentStory.chapters.length) {
                return this._renderEnding();
            }

            const chapter = this.currentStory.chapters[chapterIndex];
            
            return {
                type: 'chapter',
                index: chapterIndex,
                title: chapter.title || `第${chapterIndex + 1}章`,
                content: this._processContent(chapter.content),
                choices: this._processChoices(chapter.choices),
                atmosphere: this._generateAtmosphere(chapter)
            };
        }

        /**
         * 处理内容
         */
        _processContent(content) {
            if (typeof content === 'string') {
                return {
                    text: content,
                    highlights: []
                };
            }
            return content;
        }

        /**
         * 处理选择
         */
        _processChoices(choices) {
            if (!choices || choices.length === 0) return [];
            
            return choices.map((choice, index) => ({
                id: index,
                text: choice.text || choice,
                hint: choice.hint || null,
                consequence: choice.consequence || null,
                biasTrigger: choice.biasTrigger || null
            }));
        }

        /**
         * 生成氛围
         */
        _generateAtmosphere(chapter) {
            return {
                mood: chapter.mood || 'neutral',
                urgency: chapter.urgency || 'normal',
                visual: chapter.visual || 'default'
            };
        }

        /**
         * 做出选择
         */
        makeChoice(choiceIndex) {
            if (!this.currentStory) return null;

            const currentChapter = this.currentStory.chapters[this.currentStory.currentChapter];
            const choice = currentChapter?.choices?.[choiceIndex];
            
            if (!choice) return null;

            // 记录决策
            this.storyState.decisions.push({
                chapter: this.currentStory.currentChapter,
                choice: choiceIndex,
                timestamp: Date.now()
            });

            // 记录分支
            this.branchHistory.push({
                from: this.currentStory.currentChapter,
                to: choice.nextChapter || this.currentStory.currentChapter + 1
            });

            // 前进到下一章
            this.currentStory.currentChapter = choice.nextChapter || this.currentStory.currentChapter + 1;

            return this._renderChapter(this.currentStory.currentChapter);
        }

        /**
         * 渲染结局
         */
        _renderEnding() {
            return {
                type: 'ending',
                summary: this._generateSummary(),
                insights: this.storyState.insights,
                biasDetected: this._detectBiasPattern()
            };
        }

        /**
         * 生成总结
         */
        _generateSummary() {
            const decisionCount = this.storyState.decisions.length;
            return {
                decisionsMade: decisionCount,
                path: this.branchHistory.map(b => b.to),
                reflection: `您在${decisionCount}个关键节点做出了决策`
            };
        }

        /**
         * 检测偏差模式
         */
        _detectBiasPattern() {
            // 简化版偏差检测
            const patterns = [];
            
            // 检查是否总是选择即时收益
            const immediateChoices = this.storyState.decisions.filter(d => d.choice === 0);
            if (immediateChoices.length > this.storyState.decisions.length * 0.7) {
                patterns.push('即时满足偏好');
            }
            
            return patterns;
        }
    }

    // ============================================
    // 即时反馈系统
    // ============================================
    class InstantFeedbackSystem {
        constructor() {
            this.feedbackQueue = [];
            this.displayDuration = 3000;
        }

        /**
         * 显示决策反馈
         */
        showDecisionFeedback(decision, result) {
            const feedback = {
                type: 'decision_feedback',
                decision,
                result,
                insight: this._generateInsight(decision, result),
                timing: 'immediate'
            };

            this._display(feedback);
            return feedback;
        }

        /**
         * 生成洞察
         */
        _generateInsight(decision, result) {
            // 基于决策结果生成洞察
            if (result.unexpected) {
                return {
                    type: 'counter_intuitive',
                    message: '结果可能出乎您的意料...',
                    hint: '让我们深入思考为什么'
                };
            }
            
            if (result.delayed) {
                return {
                    type: 'delayed_effect',
                    message: '这个决策的效果将在稍后显现',
                    hint: '耐心等待时间揭示答案'
                };
            }

            return {
                type: 'normal',
                message: result.message || '您的决策已被记录'
            };
        }

        /**
         * 显示认知冲突
         */
        showCognitiveConflict(expected, actual) {
            const feedback = {
                type: 'cognitive_conflict',
                expected,
                actual,
                gap: this._calculateGap(expected, actual),
                message: '您的预期与现实存在差距'
            };

            this._display(feedback);
            return feedback;
        }

        /**
         * 计算差距
         */
        _calculateGap(expected, actual) {
            if (typeof expected === 'number' && typeof actual === 'number') {
                return {
                    absolute: Math.abs(expected - actual),
                    relative: Math.abs(expected - actual) / Math.max(Math.abs(expected), 1)
                };
            }
            return { absolute: 1, relative: 1 };
        }

        /**
         * 显示反馈
         */
        _display(feedback) {
            // 触发反馈事件
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('feedback:show', { detail: feedback }));
            }
        }
    }

    // ============================================
    // 觉醒时刻效果器
    // ============================================
    class AwakeningMomentEffect {
        constructor() {
            this.intensity = {
                subtle: { duration: 1000, effects: ['fade'] },
                moderate: { duration: 2000, effects: ['fade', 'pulse'] },
                strong: { duration: 3000, effects: ['fade', 'pulse', 'shake'] }
            };
        }

        /**
         * 触发觉醒时刻
         */
        trigger(biasType, severity) {
            const config = this.intensity[severity] || this.intensity.moderate;
            
            return {
                type: 'awakening_moment',
                biasType,
                severity,
                effects: config.effects,
                duration: config.duration,
                message: this._craftMessage(biasType, severity)
            };
        }

        /**
         * 构建觉醒消息
         */
        _craftMessage(biasType, severity) {
            const messages = {
                linear_thinking: {
                    subtle: '您可能忽略了某些复杂因素...',
                    moderate: '这个系统比您想象的更加复杂',
                    strong: '关键觉醒：线性思维在这里失效了！'
                },
                confirmation_bias: {
                    subtle: '也许还有其他角度...',
                    moderate: '您是否只看到了想看到的？',
                    strong: '觉醒时刻：确认偏误正在影响您的判断！'
                },
                time_delay_blindness: {
                    subtle: '时间会带来变化...',
                    moderate: '延迟效应比您预期更显著',
                    strong: '关键洞察：时间延迟创造了意外的结果！'
                }
            };

            return messages[biasType]?.[severity] || '一个重要的认知时刻';
        }

        /**
         * 应用视觉效果
         */
        applyVisualEffects(element, effects) {
            for (const effect of effects) {
                switch (effect) {
                    case 'fade':
                        element.style.transition = 'opacity 0.5s';
                        element.style.opacity = '0.5';
                        setTimeout(() => element.style.opacity = '1', 500);
                        break;
                    case 'pulse':
                        element.classList.add('pulse-animation');
                        setTimeout(() => element.classList.remove('pulse-animation'), 1000);
                        break;
                    case 'shake':
                        element.classList.add('shake-animation');
                        setTimeout(() => element.classList.remove('shake-animation'), 500);
                        break;
                }
            }
        }
    }

    // ============================================
    // 场景体验管理器
    // ============================================
    class ScenarioExperienceEnhancer {
        constructor() {
            this.loader = new ScenarioLoader();
            this.narrative = new NarrativeEngine();
            this.feedback = new InstantFeedbackSystem();
            this.awakening = new AwakeningMomentEffect();
            this.currentScenario = null;
        }

        /**
         * 开始场景体验
         */
        async startExperience(scenarioId) {
            // 加载场景
            const scenario = await this.loader.load(scenarioId);
            this.currentScenario = scenario;

            // 预加载相关场景
            this.loader.preload(this._getRelatedScenarios(scenarioId));

            // 开始叙事
            const firstChapter = this.narrative.beginStory(scenario);

            return {
                scenario,
                chapter: firstChapter,
                state: 'started'
            };
        }

        /**
         * 做出决策
         */
        makeDecision(choiceIndex) {
            const result = this.narrative.makeChoice(choiceIndex);
            
            if (result) {
                // 显示即时反馈
                this.feedback.showDecisionFeedback(
                    { choice: choiceIndex },
                    result
                );

                // 检查是否触发觉醒时刻
                if (result.biasDetected && result.biasDetected.length > 0) {
                    const awakening = this.awakening.trigger(
                        result.biasDetected[0],
                        'moderate'
                    );
                    return { ...result, awakening };
                }
            }

            return result;
        }

        /**
         * 获取相关场景
         */
        _getRelatedScenarios(scenarioId) {
            const relations = {
                'coffee_shop': ['relationship_investment', 'game_theory'],
                'relationship_investment': ['coffee_shop', 'investment_confirmation'],
                'investment_confirmation': ['relationship_investment', 'game_theory']
            };
            return relations[scenarioId] || [];
        }

        /**
         * 获取当前状态
         */
        getState() {
            return {
                scenario: this.currentScenario,
                narrative: this.narrative.storyState,
                progress: this.narrative.currentStory?.currentChapter || 0
            };
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ScenarioLoader,
            NarrativeEngine,
            InstantFeedbackSystem,
            AwakeningMomentEffect,
            ScenarioExperienceEnhancer
        };
    } else {
        global.ScenarioLoader = ScenarioLoader;
        global.NarrativeEngine = NarrativeEngine;
        global.InstantFeedbackSystem = InstantFeedbackSystem;
        global.AwakeningMomentEffect = AwakeningMomentEffect;
        global.ScenarioExperienceEnhancer = ScenarioExperienceEnhancer;
    }

})(typeof window !== 'undefined' ? window : this);
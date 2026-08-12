/**
 * AI导师对话模块
 * AI Tutor Dialogue Module
 * 
 * 功能：
 * - 对话状态管理
 * - 意图理解与回复生成
 * - 教学策略选择
 * - 个性化对话风格
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环22
 */

(function(global) {
    'use strict';

    // ============================================
    // 对话状态定义 (Dialogue States)
    // ============================================
    const DialogueState = {
        IDLE: 'idle',                   // 空闲状态
        GREETING: 'greeting',           // 问候阶段
        UNDERSTANDING: 'understanding', // 理解阶段
        EXPLAINING: 'explaining',       // 解释阶段
        QUESTIONING: 'questioning',     // 提问阶段
        FEEDBACK: 'feedback',           // 反馈阶段
        SUMMARY: 'summary',             // 总结阶段
        CLOSING: 'closing'              // 结束阶段
    };

    // ============================================
    // 意图类型定义 (Intent Types)
    // ============================================
    const IntentType = {
        GREETING: 'greeting',           // 问候
        QUESTION: 'question',           // 提问
        ANSWER: 'answer',               // 回答
        CONFIRM: 'confirm',             // 确认
        DENY: 'deny',                   // 否认
        CONFUSED: 'confused',           // 困惑
        REQUEST_HELP: 'request_help',   // 请求帮助
        REQUEST_EXAMPLE: 'request_example', // 请求示例
        CHANGE_TOPIC: 'change_topic',   // 更换话题
        END_CONVERSATION: 'end',        // 结束对话
        FEEDBACK_POSITIVE: 'feedback_positive', // 正面反馈
        FEEDBACK_NEGATIVE: 'feedback_negative', // 负面反馈
        UNKNOWN: 'unknown'              // 未知意图
    };

    // ============================================
    // 教学策略定义 (Teaching Strategies)
    // ============================================
    const TeachingStrategy = {
        SOCRATIC: 'socratic',           // 苏格拉底式(引导提问)
        EXPOSITORY: 'expository',       // 讲授式(直接解释)
        DISCOVERY: 'discovery',         // 发现式(引导探索)
        COLLABORATIVE: 'collaborative', // 协作式(共同讨论)
        ADAPTIVE: 'adaptive'            // 自适应(根据用户调整)
    };

    // ============================================
    // 对话风格定义 (Dialogue Styles)
    // ============================================
    const DialogueStyle = {
        FORMAL: 'formal',               // 正式
        FRIENDLY: 'friendly',           // 友好
        ENCOURAGING: 'encouraging',     // 鼓励型
        CHALLENGING: 'challenging',     // 挑战型
        PATIENT: 'patient',             // 耐心型
        CONCISE: 'concise'              // 简洁型
    };

    // ============================================
    // 对话上下文管理器 (Dialogue Context Manager)
    // ============================================
    class DialogueContextManager {
        constructor(config = {}) {
            this.config = {
                maxHistoryLength: config.maxHistoryLength || 50,
                contextWindowSize: config.contextWindowSize || 5,
                ...config
            };

            this.conversationHistory = [];
            this.currentTopic = null;
            this.userKnowledgeState = new Map();
            this.emotionalState = {
                dominant: 'neutral',
                history: []
            };
            this.learningProgress = {
                conceptsLearned: [],
                conceptsStruggling: [],
                masteryLevel: 0
            };
        }

        /**
         * 添加消息到历史
         */
        addMessage(role, content, metadata = {}) {
            const message = {
                id: Date.now(),
                role: role,  // 'user' | 'tutor'
                content: content,
                timestamp: Date.now(),
                metadata: metadata
            };

            this.conversationHistory.push(message);

            // 限制历史长度
            if (this.conversationHistory.length > this.config.maxHistoryLength) {
                this.conversationHistory = this.conversationHistory.slice(-this.config.maxHistoryLength);
            }

            return message;
        }

        /**
         * 获取上下文窗口
         */
        getContextWindow() {
            return this.conversationHistory.slice(-this.config.contextWindowSize);
        }

        /**
         * 更新用户知识状态
         */
        updateKnowledgeState(concept, understanding) {
            this.userKnowledgeState.set(concept, {
                understanding: understanding,
                lastUpdated: Date.now()
            });

            // 更新学习进度
            if (understanding > 0.7 && !this.learningProgress.conceptsLearned.includes(concept)) {
                this.learningProgress.conceptsLearned.push(concept);
            } else if (understanding < 0.4 && !this.learningProgress.conceptsStruggling.includes(concept)) {
                this.learningProgress.conceptsStruggling.push(concept);
            }

            this._updateMasteryLevel();
        }

        /**
         * 更新掌握程度
         */
        _updateMasteryLevel() {
            if (this.userKnowledgeState.size === 0) {
                this.learningProgress.masteryLevel = 0;
                return;
            }

            let total = 0;
            this.userKnowledgeState.forEach(state => {
                total += state.understanding;
            });

            this.learningProgress.masteryLevel = total / this.userKnowledgeState.size;
        }

        /**
         * 更新情绪状态
         */
        updateEmotionalState(emotion) {
            this.emotionalState.history.push({
                emotion: emotion,
                timestamp: Date.now()
            });

            // 保留最近10条
            if (this.emotionalState.history.length > 10) {
                this.emotionalState.history = this.emotionalState.history.slice(-10);
            }

            // 计算主导情绪
            this._calculateDominantEmotion();
        }

        /**
         * 计算主导情绪
         */
        _calculateDominantEmotion() {
            const emotionCounts = {};
            this.emotionalState.history.forEach(e => {
                emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
            });

            let dominant = 'neutral';
            let maxCount = 0;
            Object.entries(emotionCounts).forEach(([emotion, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    dominant = emotion;
                }
            });

            this.emotionalState.dominant = dominant;
        }

        /**
         * 设置当前话题
         */
        setCurrentTopic(topic) {
            this.currentTopic = topic;
        }

        /**
         * 获取用户画像
         */
        getUserProfile() {
            return {
                knowledgeState: Object.fromEntries(this.userKnowledgeState),
                emotionalState: this.emotionalState,
                learningProgress: this.learningProgress,
                currentTopic: this.currentTopic
            };
        }

        /**
         * 清空上下文
         */
        clear() {
            this.conversationHistory = [];
            this.currentTopic = null;
        }
    }

    // ============================================
    // 意图理解引擎 (Intent Understanding Engine)
    // ============================================
    class IntentUnderstandingEngine {
        constructor(config = {}) {
            this.config = {
                confidenceThreshold: config.confidenceThreshold || 0.6,
                ...config
            };

            // 意图关键词映射
            this.intentPatterns = this._initializeIntentPatterns();
        }

        /**
         * 初始化意图模式
         */
        _initializeIntentPatterns() {
            return {
                [IntentType.GREETING]: {
                    keywords: ['你好', '您好', 'hi', 'hello', '嗨', '早上好', '晚上好'],
                    patterns: [/^(hi|hello|你好|您好)/i]
                },
                [IntentType.QUESTION]: {
                    keywords: ['什么', '为什么', '怎么', '如何', '哪', '吗', '?', '？'],
                    patterns: [/^(什么|为什么|怎么|如何|哪)/, /.*\?$/]
                },
                [IntentType.ANSWER]: {
                    keywords: ['是', '对', '不是', '不对', '我觉得', '我认为'],
                    patterns: [/^(是|对|不是|不对|我觉得|我认为)/]
                },
                [IntentType.CONFIRM]: {
                    keywords: ['是的', '对', '没错', '确认', '确定', '好'],
                    patterns: [/^(是的|对|没错|确认|确定|好)$/]
                },
                [IntentType.DENY]: {
                    keywords: ['不是', '不对', '不', '错', '没有'],
                    patterns: [/^(不是|不对|不|错|没有)$/]
                },
                [IntentType.CONFUSED]: {
                    keywords: ['不明白', '不懂', '困惑', '不清楚', '不理解', '什么意思'],
                    patterns: [/.*(不明白|不懂|困惑|不清楚|不理解|什么意思)/]
                },
                [IntentType.REQUEST_HELP]: {
                    keywords: ['帮助', '怎么弄', '教我', '指导', '提示'],
                    patterns: [/.*(帮助|怎么弄|教我|指导|提示)/]
                },
                [IntentType.REQUEST_EXAMPLE]: {
                    keywords: ['例子', '示例', '举例', '案例'],
                    patterns: [/.*(例子|示例|举例|案例)/]
                },
                [IntentType.CHANGE_TOPIC]: {
                    keywords: ['换个话题', '说说', '下一个', '跳过'],
                    patterns: [/.*(换个话题|说说|下一个|跳过)/]
                },
                [IntentType.END_CONVERSATION]: {
                    keywords: ['再见', '拜拜', '结束', 'bye', '退出'],
                    patterns: [/^(再见|拜拜|结束|bye|退出)/i]
                },
                [IntentType.FEEDBACK_POSITIVE]: {
                    keywords: ['很好', '不错', '谢谢', '有帮助', '明白了'],
                    patterns: [/.*(很好|不错|谢谢|有帮助|明白了)/]
                },
                [IntentType.FEEDBACK_NEGATIVE]: {
                    keywords: ['不好', '没用', '不理解', '还是不懂', '太复杂'],
                    patterns: [/.*(不好|没用|不理解|还是不懂|太复杂)/]
                }
            };
        }

        /**
         * 分析意图
         */
        analyzeIntent(text) {
            const normalizedText = text.toLowerCase().trim();
            const intentScores = new Map();

            // 遍历所有意图模式
            Object.entries(this.intentPatterns).forEach(([intentType, patterns]) => {
                let score = 0;

                // 关键词匹配
                patterns.keywords.forEach(keyword => {
                    if (normalizedText.includes(keyword.toLowerCase())) {
                        score += 0.3;
                    }
                });

                // 正则匹配
                patterns.patterns.forEach(pattern => {
                    if (pattern.test(normalizedText)) {
                        score += 0.5;
                    }
                });

                intentScores.set(intentType, Math.min(score, 1.0));
            });

            // 找到最高分的意图
            let bestIntent = IntentType.UNKNOWN;
            let bestScore = 0;

            intentScores.forEach((score, intentType) => {
                if (score > bestScore) {
                    bestScore = score;
                    bestIntent = intentType;
                }
            });

            // 提取实体
            const entities = this._extractEntities(text);

            return {
                intent: bestIntent,
                confidence: bestScore,
                entities: entities,
                originalText: text
            };
        }

        /**
         * 提取实体
         */
        _extractEntities(text) {
            const entities = [];

            // 数字实体
            const numbers = text.match(/\d+(\.\d+)?/g);
            if (numbers) {
                entities.push({ type: 'number', values: numbers.map(Number) });
            }

            // 认知偏差实体
            const biasTypes = ['确认偏误', '锚定效应', '可得性启发', '沉没成本', '框架效应'];
            biasTypes.forEach(bias => {
                if (text.includes(bias)) {
                    entities.push({ type: 'cognitive_bias', value: bias });
                }
            });

            // 决策相关实体
            const decisionKeywords = ['选择', '决定', '投资', '购买', '策略'];
            decisionKeywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    entities.push({ type: 'decision_context', value: keyword });
                }
            });

            return entities;
        }

        /**
         * 检测情绪
         */
        detectEmotion(text) {
            const emotionPatterns = {
                'confused': ['不明白', '困惑', '不懂', '什么意思'],
                'frustrated': ['烦', '累了', '太难', '放弃'],
                'curious': ['为什么', '怎么', '如果', '假如'],
                'confident': ['明白了', '懂了', '清楚了', '是的'],
                'neutral': []
            };

            for (const [emotion, keywords] of Object.entries(emotionPatterns)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        return { emotion, confidence: 0.7 };
                    }
                }
            }

            return { emotion: 'neutral', confidence: 0.5 };
        }
    }

    // ============================================
    // 回复生成器 (Response Generator)
    // ============================================
    class ResponseGenerator {
        constructor(config = {}) {
            this.config = {
                style: config.style || DialogueStyle.FRIENDLY,
                ...config
            };

            // 回复模板库
            this.templates = this._initializeTemplates();
        }

        /**
         * 初始化回复模板
         */
        _initializeTemplates() {
            return {
                [IntentType.GREETING]: {
                    [DialogueStyle.FORMAL]: ['您好，欢迎来到认知偏差学习平台。有什么可以帮助您的吗？'],
                    [DialogueStyle.FRIENDLY]: ['嗨！欢迎来到认知偏差探索之旅！今天想学点什么呢？', '你好呀！准备好一起探索思维的奥秘了吗？'],
                    [DialogueStyle.ENCOURAGING]: ['你好！很高兴见到你，我相信你今天会有很多收获！']
                },
                [IntentType.QUESTION]: {
                    [DialogueStyle.FORMAL]: ['这是一个很好的问题。让我来为您详细解释。'],
                    [DialogueStyle.FRIENDLY]: ['问得好！这个问题很有意思，让我来给你讲讲~'],
                    [DialogueStyle.ENCOURAGING]: ['太棒了，能提出这个问题说明你在认真思考！让我来解答。']
                },
                [IntentType.CONFUSED]: {
                    [DialogueStyle.FORMAL]: ['我理解您的困惑。让我换一个角度来解释。'],
                    [DialogueStyle.FRIENDLY]: ['没关系，这个概念确实有点绕。我们换个说法试试？'],
                    [DialogueStyle.ENCOURAGING]: ['困惑是学习的第一步！让我用更简单的方式来解释。'],
                    [DialogueStyle.PATIENT]: ['别着急，我们慢慢来。你具体是哪里不太明白呢？']
                },
                [IntentType.REQUEST_HELP]: {
                    [DialogueStyle.FORMAL]: ['当然，我来为您提供帮助。'],
                    [DialogueStyle.FRIENDLY]: ['没问题，我来帮你！'],
                    [DialogueStyle.ENCOURAGING]: ['很高兴能帮到你！让我们一起解决这个问题。']
                },
                [IntentType.REQUEST_EXAMPLE]: {
                    [DialogueStyle.FORMAL]: ['让我为您举一个具体的例子。'],
                    [DialogueStyle.FRIENDLY]: ['好嘞，给你举个生活中的例子~'],
                    [DialogueStyle.ENCOURAGING]: ['例子是最好的老师！让我给你讲个有趣的故事。']
                },
                [IntentType.CONFIRM]: {
                    [DialogueStyle.FORMAL]: ['是的，您的理解是正确的。'],
                    [DialogueStyle.FRIENDLY]: ['没错！你理解得很到位~'],
                    [DialogueStyle.ENCOURAGING]: ['完全正确！你学得真快！']
                },
                [IntentType.DENY]: {
                    [DialogueStyle.FORMAL]: ['让我重新解释一下这个概念。'],
                    [DialogueStyle.FRIENDLY]: ['哦，那我换个说法！'],
                    [DialogueStyle.PATIENT]: ['没关系，我们再试一次。']
                },
                [IntentType.END_CONVERSATION]: {
                    [DialogueStyle.FORMAL]: ['感谢您的学习，期待下次再见。'],
                    [DialogueStyle.FRIENDLY]: ['今天学得很棒！下次见啦~'],
                    [DialogueStyle.ENCOURAGING]: ['很高兴今天能帮到你，期待下次继续学习！']
                },
                [IntentType.FEEDBACK_POSITIVE]: {
                    [DialogueStyle.FORMAL]: ['很高兴对您有帮助。'],
                    [DialogueStyle.FRIENDLY]: ['太好了！很高兴你有所收获~'],
                    [DialogueStyle.ENCOURAGING]: ['太棒了！你真的很努力！']
                },
                [IntentType.FEEDBACK_NEGATIVE]: {
                    [DialogueStyle.FORMAL]: ['感谢您的反馈，让我调整一下教学方式。'],
                    [DialogueStyle.FRIENDLY]: ['抱歉没能帮到你，我们换个方式试试？'],
                    [DialogueStyle.PATIENT]: ['别担心，我们换一种更适合你的方式。']
                }
            };
        }

        /**
         * 生成回复
         */
        generate(intent, context, style = this.config.style) {
            const template = this.templates[intent];
            
            if (!template) {
                return this._generateDefaultResponse(intent, context, style);
            }

            const styleTemplates = template[style] || template[DialogueStyle.FRIENDLY];
            const baseResponse = styleTemplates[Math.floor(Math.random() * styleTemplates.length)];

            return this._personalizeResponse(baseResponse, context);
        }

        /**
         * 个性化回复
         */
        _personalizeResponse(baseResponse, context) {
            let response = baseResponse;

            // 根据用户学习进度调整
            if (context.learningProgress) {
                const mastery = context.learningProgress.masteryLevel;
                
                if (mastery > 0.7) {
                    response = response.replace('简单', '深入');
                } else if (mastery < 0.3) {
                    response += ' 我们可以先从基础开始。';
                }
            }

            // 根据情绪状态调整
            if (context.emotionalState) {
                const emotion = context.emotionalState.dominant;
                
                if (emotion === 'frustrated') {
                    response = '别担心，' + response;
                } else if (emotion === 'confused') {
                    response = '让我更详细地解释一下。' + response;
                }
            }

            return response;
        }

        /**
         * 生成默认回复
         */
        _generateDefaultResponse(intent, context, style) {
            const defaults = {
                [DialogueStyle.FORMAL]: '我理解了，让我继续为您讲解。',
                [DialogueStyle.FRIENDLY]: '好的，我们继续吧~',
                [DialogueStyle.ENCOURAGING]: '很好，让我们继续前进！'
            };

            return defaults[style] || defaults[DialogueStyle.FRIENDLY];
        }

        /**
         * 生成解释内容
         */
        generateExplanation(topic, depth = 'medium') {
            // 解释深度模板
            const depthTemplates = {
                'simple': '简单来说，{topic}就是...',
                'medium': '{topic}是一种认知偏差，它指的是...',
                'deep': '从心理学角度来看，{topic}的形成机制是这样的...'
            };

            return depthTemplates[depth].replace('{topic}', topic);
        }

        /**
         * 生成引导问题
         */
        generateGuidingQuestion(topic) {
            const questions = [
                `你觉得在${topic}的情况下，人们通常会怎么想？`,
                `你能想到生活中${topic}的例子吗？`,
                `如果是你，你会如何避免${topic}的影响？`,
                `为什么${topic}会让我们做出错误的判断？`
            ];

            return questions[Math.floor(Math.random() * questions.length)];
        }
    }

    // ============================================
    // 教学策略选择器 (Teaching Strategy Selector)
    // ============================================
    class TeachingStrategySelector {
        constructor(config = {}) {
            this.config = {
                defaultStrategy: config.defaultStrategy || TeachingStrategy.ADAPTIVE,
                ...config
            };

            this.strategyHistory = [];
        }

        /**
         * 选择教学策略
         */
        selectStrategy(context, intent) {
            const userProfile = context.getUserProfile();
            let strategy = this.config.defaultStrategy;

            // 基于用户掌握程度选择
            const mastery = userProfile.learningProgress.masteryLevel;
            
            if (mastery < 0.3) {
                // 初学者：使用发现式教学
                strategy = TeachingStrategy.DISCOVERY;
            } else if (mastery > 0.7) {
                // 高级学习者：使用挑战式教学
                strategy = TeachingStrategy.SOCRATIC;
            }

            // 基于意图调整
            if (intent === IntentType.CONFUSED) {
                strategy = TeachingStrategy.EXPOSITORY;
            } else if (intent === IntentType.QUESTION) {
                strategy = TeachingStrategy.SOCRATIC;
            }

            // 基于情绪状态调整
            const emotion = userProfile.emotionalState.dominant;
            if (emotion === 'frustrated') {
                strategy = TeachingStrategy.COLLABORATIVE;
            } else if (emotion === 'confused') {
                strategy = TeachingStrategy.EXPOSITORY;
            }

            // 记录策略选择
            this.strategyHistory.push({
                strategy: strategy,
                context: {
                    mastery: mastery,
                    intent: intent,
                    emotion: emotion
                },
                timestamp: Date.now()
            });

            return strategy;
        }

        /**
         * 获取策略指导
         */
        getStrategyGuidance(strategy) {
            const guidance = {
                [TeachingStrategy.SOCRATIC]: {
                    description: '通过提问引导用户自己发现答案',
                    techniques: ['反问', '引导思考', '启发式问题'],
                    exampleQuestions: ['你是怎么想的？', '为什么会有这种感觉？', '能举个例子吗？']
                },
                [TeachingStrategy.EXPOSITORY]: {
                    description: '直接提供清晰的解释和知识',
                    techniques: ['结构化讲解', '图表辅助', '类比说明'],
                    exampleQuestions: ['让我来解释一下...', '想象一下...', '举个例子来说...']
                },
                [TeachingStrategy.DISCOVERY]: {
                    description: '引导用户通过探索来学习',
                    techniques: ['场景模拟', '案例分析', '互动实验'],
                    exampleQuestions: ['试着做一下这个决策...', '如果换一种情况呢？']
                },
                [TeachingStrategy.COLLABORATIVE]: {
                    description: '与用户一起探讨和解决问题',
                    techniques: ['共同分析', '讨论对话', '思维碰撞'],
                    exampleQuestions: ['我们一起看看...', '你觉得呢？', '我们来讨论一下...']
                },
                [TeachingStrategy.ADAPTIVE]: {
                    description: '根据用户反馈实时调整策略',
                    techniques: ['动态调整', '个性化推荐', '智能适配'],
                    exampleQuestions: ['这种方式你感觉如何？', '需要我换一种方式吗？']
                }
            };

            return guidance[strategy] || guidance[TeachingStrategy.ADAPTIVE];
        }
    }

    // ============================================
    // AI导师对话系统主类 (AI Tutor Dialogue System)
    // ============================================
    class AITutorDialogueSystem {
        constructor(config = {}) {
            this.config = {
                style: config.style || DialogueStyle.FRIENDLY,
                autoSaveInterval: config.autoSaveInterval || 60000,
                ...config
            };

            // 初始化各子模块
            this.contextManager = new DialogueContextManager(config.context);
            this.intentEngine = new IntentUnderstandingEngine(config.intent);
            this.responseGenerator = new ResponseGenerator({ style: this.config.style });
            this.strategySelector = new TeachingStrategySelector(config.strategy);

            this.currentState = DialogueState.IDLE;
            this.currentStrategy = TeachingStrategy.ADAPTIVE;
            this.eventHandlers = new Map();

            // 当前会话统计
            this.sessionStats = {
                startTime: null,
                messageCount: 0,
                topicsDiscussed: [],
                conceptsClarified: []
            };
        }

        /**
         * 开始会话
         */
        startSession(topic = null) {
            this.sessionStats.startTime = Date.now();
            this.sessionStats.messageCount = 0;
            this.sessionStats.topicsDiscussed = [];
            this.sessionStats.conceptsClarified = [];

            if (topic) {
                this.contextManager.setCurrentTopic(topic);
                this.sessionStats.topicsDiscussed.push(topic);
            }

            this.currentState = DialogueState.GREETING;

            // 生成问候语
            const greeting = this.responseGenerator.generate(
                IntentType.GREETING,
                this.contextManager.getUserProfile(),
                this.config.style
            );

            this.contextManager.addMessage('tutor', greeting, { state: this.currentState });
            this._emit('message', { role: 'tutor', content: greeting });

            return greeting;
        }

        /**
         * 处理用户输入
         */
        processInput(userInput) {
            // 分析意图
            const intentResult = this.intentEngine.analyzeIntent(userInput);
            const emotionResult = this.intentEngine.detectEmotion(userInput);

            // 更新上下文
            this.contextManager.addMessage('user', userInput, {
                intent: intentResult.intent,
                emotion: emotionResult.emotion
            });
            this.contextManager.updateEmotionalState(emotionResult.emotion);

            // 选择教学策略
            this.currentStrategy = this.strategySelector.selectStrategy(
                this.contextManager,
                intentResult.intent
            );

            // 更新状态
            this.currentState = this._determineNextState(intentResult.intent);

            // 生成回复
            const response = this._generateResponse(intentResult);

            // 记录导师消息
            this.contextManager.addMessage('tutor', response, {
                strategy: this.currentStrategy,
                state: this.currentState
            });

            // 更新统计
            this.sessionStats.messageCount++;

            // 触发事件
            this._emit('message', { role: 'tutor', content: response });
            this._emit('intent', intentResult);

            return {
                response: response,
                intent: intentResult,
                state: this.currentState,
                strategy: this.currentStrategy
            };
        }

        /**
         * 确定下一个对话状态
         */
        _determineNextState(intent) {
            const stateTransitions = {
                [DialogueState.GREETING]: {
                    [IntentType.QUESTION]: DialogueState.EXPLAINING,
                    [IntentType.GREETING]: DialogueState.UNDERSTANDING,
                    'default': DialogueState.UNDERSTANDING
                },
                [DialogueState.UNDERSTANDING]: {
                    [IntentType.QUESTION]: DialogueState.EXPLAINING,
                    [IntentType.CONFUSED]: DialogueState.EXPLAINING,
                    'default': DialogueState.QUESTIONING
                },
                [DialogueState.EXPLAINING]: {
                    [IntentType.CONFIRM]: DialogueState.QUESTIONING,
                    [IntentType.CONFUSED]: DialogueState.EXPLAINING,
                    [IntentType.REQUEST_EXAMPLE]: DialogueState.EXPLAINING,
                    'default': DialogueState.FEEDBACK
                },
                [DialogueState.QUESTIONING]: {
                    [IntentType.ANSWER]: DialogueState.FEEDBACK,
                    [IntentType.CONFUSED]: DialogueState.EXPLAINING,
                    'default': DialogueState.QUESTIONING
                },
                [DialogueState.FEEDBACK]: {
                    [IntentType.FEEDBACK_POSITIVE]: DialogueState.SUMMARY,
                    [IntentType.FEEDBACK_NEGATIVE]: DialogueState.EXPLAINING,
                    'default': DialogueState.QUESTIONING
                },
                [DialogueState.SUMMARY]: {
                    [IntentType.QUESTION]: DialogueState.EXPLAINING,
                    [IntentType.END_CONVERSATION]: DialogueState.CLOSING,
                    'default': DialogueState.SUMMARY
                }
            };

            const transitions = stateTransitions[this.currentState];
            if (!transitions) return DialogueState.UNDERSTANDING;

            return transitions[intent] || transitions['default'] || this.currentState;
        }

        /**
         * 生成回复
         */
        _generateResponse(intentResult) {
            const userProfile = this.contextManager.getUserProfile();
            const strategyGuidance = this.strategySelector.getStrategyGuidance(this.currentStrategy);

            // 基于策略生成回复
            let response;

            switch (this.currentStrategy) {
                case TeachingStrategy.SOCRATIC:
                    response = this._socraticResponse(intentResult, strategyGuidance);
                    break;
                case TeachingStrategy.EXPOSITORY:
                    response = this._expositoryResponse(intentResult, strategyGuidance);
                    break;
                case TeachingStrategy.DISCOVERY:
                    response = this._discoveryResponse(intentResult, strategyGuidance);
                    break;
                case TeachingStrategy.COLLABORATIVE:
                    response = this._collaborativeResponse(intentResult, strategyGuidance);
                    break;
                default:
                    response = this.responseGenerator.generate(
                        intentResult.intent,
                        userProfile,
                        this.config.style
                    );
            }

            return response;
        }

        /**
         * 苏格拉底式回复
         */
        _socraticResponse(intentResult, guidance) {
            const topic = this.contextManager.currentTopic || '认知偏差';
            
            if (intentResult.intent === IntentType.QUESTION) {
                return `这个问题很好！${guidance.exampleQuestions[0]} 让我们先思考一下，${this.responseGenerator.generateGuidingQuestion(topic)}`;
            }
            
            return `${guidance.exampleQuestions[Math.floor(Math.random() * guidance.exampleQuestions.length)]} 你能结合自己的经历来思考一下吗？`;
        }

        /**
         * 讲授式回复
         */
        _expositoryResponse(intentResult, guidance) {
            const topic = this.contextManager.currentTopic || '认知偏差';
            
            if (intentResult.intent === IntentType.CONFUSED) {
                return `让我重新解释一下。${this.responseGenerator.generateExplanation(topic, 'simple')} ${guidance.exampleQuestions[2]}`;
            }
            
            return `${this.responseGenerator.generateExplanation(topic, 'medium')} 你理解了吗？`;
        }

        /**
         * 发现式回复
         */
        _discoveryResponse(intentResult, guidance) {
            const topic = this.contextManager.currentTopic || '认知偏差';
            
            return `让我们通过一个例子来探索${topic}。想象一下，${guidance.exampleQuestions[0]}`;
        }

        /**
         * 协作式回复
         */
        _collaborativeResponse(intentResult, guidance) {
            const baseResponse = this.responseGenerator.generate(
                intentResult.intent,
                this.contextManager.getUserProfile(),
                DialogueStyle.PATIENT
            );
            
            return `${baseResponse} ${guidance.exampleQuestions[1]} 我们一起来分析一下。`;
        }

        /**
         * 获取对话历史
         */
        getHistory() {
            return this.contextManager.conversationHistory;
        }

        /**
         * 获取用户画像
         */
        getUserProfile() {
            return this.contextManager.getUserProfile();
        }

        /**
         * 获取会话统计
         */
        getSessionStats() {
            return {
                ...this.sessionStats,
                duration: this.sessionStats.startTime ? 
                    Date.now() - this.sessionStats.startTime : 0,
                currentState: this.currentState,
                currentStrategy: this.currentStrategy
            };
        }

        /**
         * 设置对话风格
         */
        setStyle(style) {
            if (Object.values(DialogueStyle).includes(style)) {
                this.config.style = style;
                this.responseGenerator.config.style = style;
                return true;
            }
            return false;
        }

        /**
         * 设置话题
         */
        setTopic(topic) {
            this.contextManager.setCurrentTopic(topic);
            if (!this.sessionStats.topicsDiscussed.includes(topic)) {
                this.sessionStats.topicsDiscussed.push(topic);
            }
        }

        /**
         * 结束会话
         */
        endSession() {
            this.currentState = DialogueState.CLOSING;
            
            const closing = this.responseGenerator.generate(
                IntentType.END_CONVERSATION,
                this.contextManager.getUserProfile(),
                this.config.style
            );

            this.contextManager.addMessage('tutor', closing, { state: this.currentState });
            this._emit('message', { role: 'tutor', content: closing });
            this._emit('session:end', this.getSessionStats());

            return closing;
        }

        /**
         * 事件监听
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        Logger?.error('[AITutorDialogue] 事件处理错误:', error);
                    }
                });
            }
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            AITutorDialogueSystem,
            DialogueContextManager,
            IntentUnderstandingEngine,
            ResponseGenerator,
            TeachingStrategySelector,
            DialogueState,
            IntentType,
            TeachingStrategy,
            DialogueStyle
        };
    } else {
        global.AITutorDialogueSystem = AITutorDialogueSystem;
        global.DialogueContextManager = DialogueContextManager;
        global.IntentUnderstandingEngine = IntentUnderstandingEngine;
        global.ResponseGenerator = ResponseGenerator;
        global.TeachingStrategySelector = TeachingStrategySelector;
        global.DialogueState = DialogueState;
        global.IntentType = IntentType;
        global.TeachingStrategy = TeachingStrategy;
        global.DialogueStyle = DialogueStyle;
    }

})(typeof window !== 'undefined' ? window : this);

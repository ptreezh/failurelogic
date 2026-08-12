/**
 * 智能问答系统
 * Intelligent Q&A System
 * 
 * 功能：
 * - 问题理解与分类
 * - 答案检索与排序
 * - 答案生成与优化
 * - 问答历史管理
 * - 上下文感知回答
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环23
 */

(function(global) {
    'use strict';

    // ============================================
    // 问题类型枚举
    // ============================================
    const QuestionType = {
        DEFINITION: 'definition',       // 定义类问题
        COMPARISON: 'comparison',       // 比较类问题
        CAUSALITY: 'causality',         // 因果类问题
        PROCEDURE: 'procedure',         // 过程类问题
        EXAMPLE: 'example',             // 举例类问题
        APPLICATION: 'application',     // 应用类问题
        EVALUATION: 'evaluation',       // 评价类问题
        CONCEPTUAL: 'conceptual',       // 概念类问题
        FACTUAL: 'factual',             // 事实类问题
        OPEN_ENDED: 'open_ended'        // 开放式问题
    };

    // ============================================
    // 答案置信度级别
    // ============================================
    const ConfidenceLevel = {
        HIGH: 'high',           // 高置信度 (>0.8)
        MEDIUM: 'medium',       // 中置信度 (0.5-0.8)
        LOW: 'low',             // 低置信度 (<0.5)
        UNKNOWN: 'unknown'      // 未知置信度
    };

    // ============================================
    // 问题理解器
    // ============================================
    class QuestionAnalyzer {
        constructor() {
            // 问题关键词映射
            this.questionPatterns = {
                [QuestionType.DEFINITION]: [
                    '什么是', '定义', '含义', '意思', '指的是', '解释一下',
                    'what is', 'definition', 'meaning'
                ],
                [QuestionType.COMPARISON]: [
                    '区别', '差异', '不同', '比较', '对比', '相似',
                    'difference', 'compare', 'contrast', 'similar'
                ],
                [QuestionType.CAUSALITY]: [
                    '为什么', '原因', '导致', '引起', '造成', '结果',
                    'why', 'cause', 'reason', 'result', 'lead to'
                ],
                [QuestionType.PROCEDURE]: [
                    '如何', '怎么', '步骤', '方法', '过程', '流程',
                    'how to', 'steps', 'procedure', 'method', 'process'
                ],
                [QuestionType.EXAMPLE]: [
                    '举例', '例子', '案例', '实例', '例如',
                    'example', 'case', 'instance', 'such as'
                ],
                [QuestionType.APPLICATION]: [
                    '应用', '使用', '实践', '场景', '情况',
                    'apply', 'use', 'practice', 'scenario', 'situation'
                ],
                [QuestionType.EVALUATION]: [
                    '评价', '评估', '好坏', '优劣', '效果',
                    'evaluate', 'assess', 'good or bad', 'effect'
                ]
            };

            // 认知偏差相关关键词
            this.domainKeywords = [
                '认知偏差', '确认偏误', '锚定效应', '可得性启发', '后见之明',
                '框架效应', '沉没成本', '损失厌恶', '过度自信', '代表性启发',
                '线性思维', '复杂系统', '时间延迟', '反馈回路', '决策陷阱',
                'cognitive bias', 'confirmation bias', 'anchoring', 'availability heuristic',
                'hindsight bias', 'framing effect', 'sunk cost', 'loss aversion'
            ];
        }

        /**
         * 分析问题
         * @param {string} question - 用户问题
         * @returns {Object} 分析结果
         */
        analyze(question) {
            const normalizedQuestion = this.normalize(question);
            
            return {
                original: question,
                normalized: normalizedQuestion,
                type: this.classifyType(normalizedQuestion),
                keywords: this.extractKeywords(normalizedQuestion),
                entities: this.extractEntities(normalizedQuestion),
                intent: this.detectIntent(normalizedQuestion),
                complexity: this.assessComplexity(normalizedQuestion),
                domainRelevance: this.assessDomainRelevance(normalizedQuestion)
            };
        }

        /**
         * 标准化问题文本
         */
        normalize(text) {
            return text
                .toLowerCase()
                .replace(/[？?！!。，,、；;：:"]]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        /**
         * 分类问题类型
         */
        classifyType(text) {
            let maxScore = 0;
            let bestType = QuestionType.OPEN_ENDED;

            for (const [type, patterns] of Object.entries(this.questionPatterns)) {
                let score = 0;
                for (const pattern of patterns) {
                    if (text.includes(pattern.toLowerCase())) {
                        score += 1;
                    }
                }
                if (score > maxScore) {
                    maxScore = score;
                    bestType = type;
                }
            }

            return bestType;
        }

        /**
         * 提取关键词
         */
        extractKeywords(text) {
            const stopWords = new Set([
                '的', '是', '在', '有', '和', '了', '不', '这', '我', '你',
                '他', '她', '它', '们', '什么', '怎么', '如何', '为什么',
                'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in'
            ]);

            const words = text.split(/\s+/);
            const keywords = [];

            for (const word of words) {
                if (word.length > 1 && !stopWords.has(word)) {
                    keywords.push(word);
                }
            }

            // 检查领域关键词
            for (const domainKeyword of this.domainKeywords) {
                if (text.includes(domainKeyword.toLowerCase()) && !keywords.includes(domainKeyword)) {
                    keywords.push(domainKeyword);
                }
            }

            return [...new Set(keywords)];
        }

        /**
         * 提取实体
         */
        extractEntities(text) {
            const entities = [];

            // 认知偏差实体识别
            const biasPatterns = {
                '确认偏误': ['确认偏误', 'confirmation bias'],
                '锚定效应': ['锚定效应', 'anchoring effect', 'anchoring'],
                '可得性启发': ['可得性启发', 'availability heuristic'],
                '后见之明': ['后见之明', 'hindsight bias'],
                '框架效应': ['框架效应', 'framing effect'],
                '沉没成本': ['沉没成本', 'sunk cost'],
                '损失厌恶': ['损失厌恶', 'loss aversion'],
                '过度自信': ['过度自信', 'overconfidence'],
                '线性思维': ['线性思维', 'linear thinking']
            };

            for (const [entity, patterns] of Object.entries(biasPatterns)) {
                for (const pattern of patterns) {
                    if (text.includes(pattern.toLowerCase())) {
                        entities.push({
                            name: entity,
                            type: 'cognitive_bias',
                            matchedPattern: pattern
                        });
                        break;
                    }
                }
            }

            return entities;
        }

        /**
         * 检测意图
         */
        detectIntent(text) {
            const intentPatterns = {
                'learn': ['学习', '了解', '知道', 'learn', 'understand', 'know'],
                'apply': ['应用', '使用', '实践', 'apply', 'use', 'practice'],
                'analyze': ['分析', '评估', '判断', 'analyze', 'evaluate', 'judge'],
                'solve': ['解决', '处理', '应对', 'solve', 'handle', 'deal with'],
                'compare': ['比较', '对比', '区别', 'compare', 'contrast', 'difference']
            };

            for (const [intent, patterns] of Object.entries(intentPatterns)) {
                for (const pattern of patterns) {
                    if (text.includes(pattern.toLowerCase())) {
                        return intent;
                    }
                }
            }

            return 'inquire'; // 默认为询问意图
        }

        /**
         * 评估问题复杂度
         */
        assessComplexity(text) {
            let score = 0;

            // 长度因素
            if (text.length > 100) score += 2;
            else if (text.length > 50) score += 1;

            // 多部分问题
            if (text.includes('和') || text.includes('以及') || text.includes('and')) {
                score += 1;
            }

            // 复杂词汇
            const complexIndicators = ['关系', '影响', '机制', '原理', '深层次', 'relationship', 'mechanism'];
            for (const indicator of complexIndicators) {
                if (text.includes(indicator.toLowerCase())) {
                    score += 1;
                }
            }

            if (score >= 4) return 'high';
            if (score >= 2) return 'medium';
            return 'low';
        }

        /**
         * 评估领域相关性
         */
        assessDomainRelevance(text) {
            let relevanceScore = 0;

            for (const keyword of this.domainKeywords) {
                if (text.includes(keyword.toLowerCase())) {
                    relevanceScore += 0.15;
                }
            }

            return Math.min(relevanceScore, 1.0);
        }
    }

    // ============================================
    // 答案检索器
    // ============================================
    class AnswerRetriever {
        constructor(knowledgeBase) {
            this.knowledgeBase = knowledgeBase || this.getDefaultKnowledgeBase();
            this.indexedAnswers = new Map();
            this.buildIndex();
        }

        /**
         * 获取默认知识库
         */
        getDefaultKnowledgeBase() {
            return {
                biases: {
                    '确认偏误': {
                        definition: '确认偏误是指人们倾向于寻找、解释和记忆那些支持自己既有信念的信息，同时忽略或贬低与之相矛盾的证据。',
                        examples: [
                            '投资者只关注支持自己投资决策的新闻',
                            '人们倾向于阅读与自己政治观点一致的文章'
                        ],
                        solutions: [
                            '主动寻找反对意见',
                            '使用魔鬼代言人思考法',
                            '保持开放心态'
                        ],
                        relatedBiases: ['选择性知觉', '信念固着']
                    },
                    '锚定效应': {
                        definition: '锚定效应是指人们在做决策时过度依赖最先获得的信息（锚点），后续判断会围绕这个锚点进行调整。',
                        examples: [
                            '谈判时第一个报价往往会影响最终结果',
                            '商品原价标签影响消费者对折扣的感知'
                        ],
                        solutions: [
                            '多角度收集信息',
                            '设定多个参考点',
                            '延迟做出判断'
                        ],
                        relatedBiases: ['调整不足', '框架效应']
                    },
                    '线性思维': {
                        definition: '线性思维是指人们倾向于用简单的线性因果关系来理解复杂系统，忽略了系统中的反馈回路、时间延迟和非线性关系。',
                        examples: [
                            '期望投入增加10%就能得到10%的产出增加',
                            '忽视政策的长期连锁反应'
                        ],
                        solutions: [
                            '绘制系统循环图',
                            '识别反馈回路',
                            '考虑时间延迟'
                        ],
                        relatedBiases: ['因果简化', '过度简化']
                    },
                    '沉没成本谬误': {
                        definition: '沉没成本谬误是指人们因为已经投入了时间、金钱或精力，而继续坚持一个不太可能成功的选择。',
                        examples: [
                            '继续持有一只亏损的股票',
                            '看完一部无聊的电影因为已经买票了'
                        ],
                        solutions: [
                            '只考虑未来成本和收益',
                            '设定止损点',
                            '定期审视决策'
                        ],
                        relatedBiases: ['损失厌恶', '承诺升级']
                    },
                    '损失厌恶': {
                        definition: '损失厌恶是指人们对损失的敏感程度大约是收益的两倍，即失去100元的痛苦大于获得100元的快乐。',
                        examples: [
                            '投资者不愿意卖出亏损股票',
                            '人们更愿意冒险避免损失而不是获得收益'
                        ],
                        solutions: [
                            '重新框架为收益情境',
                            '使用中性评估标准',
                            '分离情绪与决策'
                        ],
                        relatedBiases: ['框架效应', '现状偏见']
                    }
                },
                concepts: {
                    '系统思维': {
                        definition: '系统思维是一种整体性的思考方法，关注要素之间的相互关系和动态变化。',
                        applications: ['商业战略', '政策制定', '问题解决']
                    },
                    '反馈回路': {
                        definition: '反馈回路是指系统的输出反过来影响输入，形成增强或平衡的循环。',
                        types: ['增强回路', '平衡回路']
                    },
                    '时间延迟': {
                        definition: '时间延迟是指行动与其效果之间的时间间隔，是复杂系统的重要特征。',
                        impacts: ['决策滞后', '过度反应', '振荡']
                    }
                }
            };
        }

        /**
         * 构建答案索引
         */
        buildIndex() {
            // 索引认知偏差
            if (this.knowledgeBase.biases) {
                for (const [name, data] of Object.entries(this.knowledgeBase.biases)) {
                    this.indexedAnswers.set(name, {
                        type: 'bias',
                        name: name,
                        content: data
                    });
                }
            }

            // 索引概念
            if (this.knowledgeBase.concepts) {
                for (const [name, data] of Object.entries(this.knowledgeBase.concepts)) {
                    this.indexedAnswers.set(name, {
                        type: 'concept',
                        name: name,
                        content: data
                    });
                }
            }
        }

        /**
         * 检索相关答案
         * @param {Object} analyzedQuestion - 分析后的问题
         * @returns {Array} 相关答案列表
         */
        retrieve(analyzedQuestion) {
            const results = [];
            const keywords = analyzedQuestion.keywords;
            const entities = analyzedQuestion.entities;

            // 基于实体检索
            for (const entity of entities) {
                const answer = this.indexedAnswers.get(entity.name);
                if (answer) {
                    results.push({
                        ...answer,
                        relevanceScore: 0.9,
                        matchType: 'entity'
                    });
                }
            }

            // 基于关键词检索
            for (const [name, answer] of this.indexedAnswers) {
                if (results.some(r => r.name === name)) continue;

                let relevanceScore = 0;
                const nameLower = name.toLowerCase();
                const contentStr = JSON.stringify(answer.content).toLowerCase();

                for (const keyword of keywords) {
                    if (nameLower.includes(keyword.toLowerCase())) {
                        relevanceScore += 0.3;
                    }
                    if (contentStr.includes(keyword.toLowerCase())) {
                        relevanceScore += 0.1;
                    }
                }

                if (relevanceScore > 0.1) {
                    results.push({
                        ...answer,
                        relevanceScore: Math.min(relevanceScore, 0.9),
                        matchType: 'keyword'
                    });
                }
            }

            // 按相关度排序
            return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        }
    }

    // ============================================
    // 答案生成器
    // ============================================
    class AnswerGenerator {
        constructor() {
            this.templates = this.initTemplates();
        }

        /**
         * 初始化答案模板
         */
        initTemplates() {
            return {
                [QuestionType.DEFINITION]: (data) => {
                    if (!data || !data.content) return null;
                    const content = data.content;
                    return {
                        text: `${data.name}的定义：${content.definition || '暂无定义'}`,
                        confidence: 0.9,
                        source: 'knowledge_base'
                    };
                },
                [QuestionType.EXAMPLE]: (data) => {
                    if (!data || !data.content || !data.content.examples) return null;
                    const examples = data.content.examples;
                    return {
                        text: `${data.name}的例子：\n${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
                        confidence: 0.85,
                        source: 'knowledge_base'
                    };
                },
                [QuestionType.PROCEDURE]: (data) => {
                    if (!data || !data.content || !data.content.solutions) return null;
                    const solutions = data.content.solutions;
                    return {
                        text: `应对${data.name}的方法：\n${solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
                        confidence: 0.8,
                        source: 'knowledge_base'
                    };
                },
                [QuestionType.COMPARISON]: (data) => {
                    if (!data || !data.content) return null;
                    const related = data.content.relatedBiases || [];
                    return {
                        text: `${data.name}与以下偏差相关：${related.join('、')}`,
                        confidence: 0.7,
                        source: 'knowledge_base'
                    };
                }
            };
        }

        /**
         * 生成答案
         * @param {Object} question - 分析后的问题
         * @param {Array} retrievedData - 检索到的数据
         * @returns {Object} 生成的答案
         */
        generate(question, retrievedData) {
            if (!retrievedData || retrievedData.length === 0) {
                return this.generateFallbackAnswer(question);
            }

            const bestMatch = retrievedData[0];
            const generator = this.templates[question.type];

            if (generator) {
                const answer = generator(bestMatch);
                if (answer) {
                    return this.enhanceAnswer(answer, question, retrievedData);
                }
            }

            // 默认生成方式
            return {
                text: this.generateDefaultText(bestMatch),
                confidence: bestMatch.relevanceScore,
                source: 'knowledge_base',
                relatedTopics: retrievedData.slice(1, 4).map(d => d.name)
            };
        }

        /**
         * 生成默认答案文本
         */
        generateDefaultText(data) {
            const content = data.content;
            let text = `关于${data.name}：\n`;
            
            if (content.definition) {
                text += `定义：${content.definition}\n`;
            }
            if (content.examples && content.examples.length > 0) {
                text += `\n例子：\n${content.examples.slice(0, 2).map((e, i) => `${i + 1}. ${e}`).join('\n')}\n`;
            }
            if (content.solutions && content.solutions.length > 0) {
                text += `\n应对方法：\n${content.solutions.slice(0, 2).map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
            }

            return text;
        }

        /**
         * 增强答案
         */
        enhanceAnswer(answer, question, retrievedData) {
            // 添加相关问题推荐
            answer.followUpQuestions = this.generateFollowUpQuestions(question, retrievedData);
            
            // 添加置信度说明
            answer.confidenceLevel = this.getConfidenceLevel(answer.confidence);

            return answer;
        }

        /**
         * 生成追问推荐
         */
        generateFollowUpQuestions(question, retrievedData) {
            const followUps = [];
            const mainTopic = retrievedData[0]?.name;

            if (mainTopic) {
                followUps.push(`${mainTopic}在生活中有哪些具体表现？`);
                followUps.push(`如何避免${mainTopic}的影响？`);
                
                if (retrievedData.length > 1) {
                    followUps.push(`${mainTopic}和${retrievedData[1].name}有什么区别？`);
                }
            }

            return followUps.slice(0, 3);
        }

        /**
         * 获取置信度级别
         */
        getConfidenceLevel(confidence) {
            if (confidence >= 0.8) return ConfidenceLevel.HIGH;
            if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
            return ConfidenceLevel.LOW;
        }

        /**
         * 生成兜底答案
         */
        generateFallbackAnswer(question) {
            return {
                text: `抱歉，我暂时无法找到关于"${question.original}"的准确答案。您可以尝试换个方式提问，或者浏览我们的认知偏差案例库。`,
                confidence: 0.3,
                confidenceLevel: ConfidenceLevel.LOW,
                source: 'fallback',
                suggestions: [
                    '您可以询问某个具体的认知偏差，如"什么是确认偏误？"',
                    '您可以询问如何应对某类偏差，如"如何避免锚定效应？"',
                    '您可以要求举例，如"线性思维的例子有哪些？"'
                ]
            };
        }
    }

    // ============================================
    // 问答历史管理器
    // ============================================
    class QAHistoryManager {
        constructor(maxSize = 100) {
            this.history = [];
            this.maxSize = maxSize;
            this.sessionId = this.generateSessionId();
        }

        /**
         * 生成会话ID
         */
        generateSessionId() {
            return `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        /**
         * 记录问答
         */
        record(question, answer, analysis) {
            const record = {
                id: `qa_record_${Date.now()}`,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                question: {
                    original: question,
                    type: analysis.type,
                    keywords: analysis.keywords,
                    complexity: analysis.complexity
                },
                answer: {
                    text: answer.text,
                    confidence: answer.confidence,
                    source: answer.source
                },
                feedback: null
            };

            this.history.push(record);

            // 维护历史大小
            if (this.history.length > this.maxSize) {
                this.history.shift();
            }

            return record;
        }

        /**
         * 记录反馈
         */
        recordFeedback(recordId, feedback) {
            const record = this.history.find(r => r.id === recordId);
            if (record) {
                record.feedback = {
                    rating: feedback.rating, // 1-5
                    helpful: feedback.helpful,
                    comment: feedback.comment,
                    timestamp: Date.now()
                };
            }
        }

        /**
         * 获取会话历史
         */
        getSessionHistory() {
            return this.history.filter(r => r.sessionId === this.sessionId);
        }

        /**
         * 获取历史统计
         */
        getStatistics() {
            const stats = {
                totalQuestions: this.history.length,
                questionTypes: {},
                avgConfidence: 0,
                avgFeedback: 0,
                topKeywords: {}
            };

            let totalConfidence = 0;
            let totalFeedback = 0;
            let feedbackCount = 0;

            for (const record of this.history) {
                // 问题类型统计
                const type = record.question.type;
                stats.questionTypes[type] = (stats.questionTypes[type] || 0) + 1;

                // 置信度统计
                totalConfidence += record.answer.confidence;

                // 关键词统计
                for (const keyword of record.question.keywords) {
                    stats.topKeywords[keyword] = (stats.topKeywords[keyword] || 0) + 1;
                }

                // 反馈统计
                if (record.feedback) {
                    totalFeedback += record.feedback.rating;
                    feedbackCount++;
                }
            }

            stats.avgConfidence = this.history.length > 0 
                ? totalConfidence / this.history.length 
                : 0;
            stats.avgFeedback = feedbackCount > 0 
                ? totalFeedback / feedbackCount 
                : 0;

            // 排序热门关键词
            stats.topKeywords = Object.entries(stats.topKeywords)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});

            return stats;
        }

        /**
         * 清除历史
         */
        clearHistory() {
            this.history = [];
            this.sessionId = this.generateSessionId();
        }
    }

    // ============================================
    // 智能问答系统主类
    // ============================================
    class IntelligentQASystem {
        constructor(config = {}) {
            this.questionAnalyzer = new QuestionAnalyzer();
            this.answerRetriever = new AnswerRetriever(config.knowledgeBase);
            this.answerGenerator = new AnswerGenerator();
            this.historyManager = new QAHistoryManager(config.maxHistorySize || 100);
            
            this.config = {
                enableHistory: config.enableHistory !== false,
                enableFollowUp: config.enableFollowUp !== false,
                minConfidence: config.minConfidence || 0.3
            };

            this.version = '1.0.0';
            this.createdAt = Date.now();
        }

        /**
         * 提问
         * @param {string} question - 用户问题
         * @returns {Object} 回答结果
         */
        ask(question) {
            // 1. 分析问题
            const analysis = this.questionAnalyzer.analyze(question);

            // 2. 检索相关答案
            const retrieved = this.answerRetriever.retrieve(analysis);

            // 3. 生成答案
            const answer = this.answerGenerator.generate(analysis, retrieved);

            // 4. 构建结果
            const result = {
                question: question,
                answer: answer,
                analysis: {
                    type: analysis.type,
                    intent: analysis.intent,
                    complexity: analysis.complexity,
                    domainRelevance: analysis.domainRelevance,
                    entities: analysis.entities
                },
                metadata: {
                    retrievedCount: retrieved.length,
                    processingTime: Date.now()
                }
            };

            // 5. 记录历史
            if (this.config.enableHistory) {
                const record = this.historyManager.record(question, answer, analysis);
                result.recordId = record.id;
            }

            return result;
        }

        /**
         * 提供反馈
         */
        feedback(recordId, feedback) {
            this.historyManager.recordFeedback(recordId, feedback);
        }

        /**
         * 获取历史统计
         */
        getStatistics() {
            return this.historyManager.getStatistics();
        }

        /**
         * 获取推荐问题
         */
        getSuggestedQuestions() {
            const stats = this.getStatistics();
            const suggestions = [];

            // 基于热门关键词生成
            const topKeywords = Object.keys(stats.topKeywords);
            if (topKeywords.length > 0) {
                suggestions.push(`什么是${topKeywords[0]}？`);
                suggestions.push(`如何应对${topKeywords[0]}的影响？`);
            }

            // 添加默认推荐
            suggestions.push('什么是认知偏差？');
            suggestions.push('如何在决策中避免偏差？');

            return [...new Set(suggestions)].slice(0, 5);
        }

        /**
         * 更新知识库
         */
        updateKnowledgeBase(knowledgeBase) {
            this.answerRetriever = new AnswerRetriever(knowledgeBase);
        }

        /**
         * 获取系统信息
         */
        getSystemInfo() {
            return {
                version: this.version,
                createdAt: this.createdAt,
                totalQuestions: this.historyManager.history.length,
                sessionId: this.historyManager.sessionId
            };
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            IntelligentQASystem,
            QuestionAnalyzer,
            AnswerRetriever,
            AnswerGenerator,
            QAHistoryManager,
            QuestionType,
            ConfidenceLevel
        };
    } else {
        global.IntelligentQASystem = IntelligentQASystem;
        global.QuestionAnalyzer = QuestionAnalyzer;
        global.AnswerRetriever = AnswerRetriever;
        global.AnswerGenerator = AnswerGenerator;
        global.QAHistoryManager = QAHistoryManager;
        global.QuestionType = QuestionType;
        global.ConfidenceLevel = ConfidenceLevel;
    }

})(typeof window !== 'undefined' ? window : this);

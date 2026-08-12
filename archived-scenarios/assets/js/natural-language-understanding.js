/**
 * 自然语言理解模块
 * Natural Language Understanding Module
 * 
 * 功能：
 * - 意图识别
 * - 情感分析
 * - 关键词提取
 * - 文本分类
 * - 语义相似度计算
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环18
 */

(function(global) {
    'use strict';

    // ============================================
    // 中文分词器（简化版）
    // ============================================
    class ChineseTokenizer {
        constructor() {
            // 常用停用词
            this.stopWords = new Set([
                '的', '了', '是', '在', '我', '有', '和', '就', '不', '人',
                '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
                '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '他',
                '她', '它', '们', '这个', '那个', '什么', '怎么', '为什么'
            ]);
            
            // 认知偏差相关关键词
            this.domainKeywords = new Set([
                '风险', '决策', '投资', '收益', '损失', '时间', '延迟',
                '线性', '非线性', '系统', '反馈', '因果', '关系', '情绪',
                '理性', '直觉', '确认', '偏误', '陷阱', '认知', '思维',
                '选择', '机会', '成本', '概率', '不确定性', '复杂'
            ]);
        }

        /**
         * 分词（简化版，基于字符和关键词）
         */
        tokenize(text) {
            const tokens = [];
            let i = 0;
            
            while (i < text.length) {
                let matched = false;
                
                // 尝试匹配最长关键词
                for (let len = 4; len >= 1; len--) {
                    const word = text.substr(i, len);
                    if (this.domainKeywords.has(word)) {
                        tokens.push({ text: word, type: 'domain', start: i, end: i + len });
                        i += len;
                        matched = true;
                        break;
                    }
                }
                
                if (!matched) {
                    const char = text[i];
                    if (!/\s/.test(char) && !this.stopWords.has(char)) {
                        tokens.push({ text: char, type: 'char', start: i, end: i + 1 });
                    }
                    i++;
                }
            }
            
            return tokens;
        }

        /**
         * 提取关键词
         */
        extractKeywords(text) {
            const tokens = this.tokenize(text);
            const keywords = tokens
                .filter(t => t.type === 'domain' || t.text.length > 1)
                .map(t => t.text);
            
            // 去重并统计频率
            const frequency = {};
            for (const word of keywords) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
            
            return Object.entries(frequency)
                .sort((a, b) => b[1] - a[1])
                .map(([word, freq]) => ({ word, frequency: freq }));
        }
    }

    // ============================================
    // 意图识别器
    // ============================================
    class IntentRecognizer {
        constructor() {
            // 意图模式库
            this.intentPatterns = {
                'start_scenario': {
                    patterns: ['开始', '启动', '进入', '玩', '试试', '开始游戏'],
                    keywords: ['场景', '游戏', '练习', '学习']
                },
                'get_hint': {
                    patterns: ['提示', '帮助', '不懂', '不会', '怎么', '怎么办'],
                    keywords: ['暗示', '指导', '解释']
                },
                'make_decision': {
                    patterns: ['选择', '决定', '我要', '我选', '就这个'],
                    keywords: ['选项', '决策', '确认']
                },
                'view_result': {
                    patterns: ['结果', '分数', '成绩', '看', '怎么样'],
                    keywords: ['总结', '报告', '分析']
                },
                'change_setting': {
                    patterns: ['设置', '修改', '更改', '调整', '换'],
                    keywords: ['难度', '语言', '音效', '主题']
                },
                'ask_question': {
                    patterns: ['为什么', '什么', '如何', '怎么', '？'],
                    keywords: ['解释', '原因', '方法']
                },
                'express_confusion': {
                    patterns: ['不懂', '不理解', '困惑', '迷茫', '搞不懂'],
                    keywords: ['问题', '疑问', '不清楚']
                },
                'express_satisfaction': {
                    patterns: ['很好', '不错', '喜欢', '满意', '太棒了'],
                    keywords: ['开心', '高兴', '成功']
                },
                'express_frustration': {
                    patterns: ['太难', '不好', '失败', '沮丧', '郁闷'],
                    keywords: ['挫折', '困难', '挑战']
                },
                'request_explanation': {
                    patterns: ['解释', '说明', '告诉我', '为什么这样', '原理'],
                    keywords: ['理解', '理论', '背景']
                }
            };
        }

        /**
         * 识别意图
         */
        recognize(text) {
            const scores = {};
            
            for (const [intent, config] of Object.entries(this.intentPatterns)) {
                let score = 0;
                
                // 匹配模式
                for (const pattern of config.patterns) {
                    if (text.includes(pattern)) {
                        score += 2;
                    }
                }
                
                // 匹配关键词
                for (const keyword of config.keywords) {
                    if (text.includes(keyword)) {
                        score += 1;
                    }
                }
                
                scores[intent] = score;
            }
            
            // 找出最高分意图
            let maxScore = 0;
            let bestIntent = 'unknown';
            
            for (const [intent, score] of Object.entries(scores)) {
                if (score > maxScore) {
                    maxScore = score;
                    bestIntent = intent;
                }
            }
            
            // 计算置信度
            const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
            const confidence = totalScore > 0 ? maxScore / totalScore : 0;
            
            return {
                intent: bestIntent,
                confidence: confidence,
                scores: scores,
                requiresContext: maxScore < 2
            };
        }

        /**
         * 批量识别
         */
        recognizeBatch(texts) {
            return texts.map(text => this.recognize(text));
        }
    }

    // ============================================
    // 情感分析器
    // ============================================
    class SentimentAnalyzer {
        constructor() {
            // 情感词典
            this.sentimentLexicon = {
                positive: new Set([
                    '好', '棒', '优秀', '成功', '喜欢', '满意', '开心', '高兴',
                    '正确', '对', '厉害', '强大', '聪明', '智慧', '胜利',
                    '进步', '提升', '改善', '获得', '收益', '回报', '希望',
                    '机会', '可能', '潜力', '增长', '突破', '创新'
                ]),
                negative: new Set([
                    '差', '坏', '失败', '错误', '讨厌', '不满', '难过', '伤心',
                    '困难', '麻烦', '问题', '风险', '损失', '后悔', '沮丧',
                    '困惑', '迷茫', '焦虑', '担心', '恐惧', '压力', '挑战',
                    '障碍', '阻碍', '缺点', '弱点', '缺陷', '不足'
                ]),
                intensifiers: new Set([
                    '很', '非常', '特别', '极其', '相当', '十分', '太', '超级'
                ]),
                negators: new Set([
                    '不', '没', '无', '非', '未', '别', '莫'
                ])
            };
        }

        /**
         * 分析情感
         */
        analyze(text) {
            let positiveCount = 0;
            let negativeCount = 0;
            let hasNegator = false;
            let hasIntensifier = false;
            
            const tokens = text.split('');
            
            for (let i = 0; i < tokens.length; i++) {
                const char = tokens[i];
                const prevChar = i > 0 ? tokens[i - 1] : '';
                
                // 检查否定词
                if (this.sentimentLexicon.negators.has(char)) {
                    hasNegator = true;
                    continue;
                }
                
                // 检查程度副词
                if (this.sentimentLexicon.intensifiers.has(char)) {
                    hasIntensifier = true;
                    continue;
                }
                
                // 检查积极词
                if (this.sentimentLexicon.positive.has(char)) {
                    const weight = hasIntensifier ? 1.5 : 1;
                    if (hasNegator) {
                        negativeCount += weight;
                    } else {
                        positiveCount += weight;
                    }
                    hasNegator = false;
                    hasIntensifier = false;
                }
                
                // 检查消极词
                if (this.sentimentLexicon.negative.has(char)) {
                    const weight = hasIntensifier ? 1.5 : 1;
                    if (hasNegator) {
                        positiveCount += weight;
                    } else {
                        negativeCount += weight;
                    }
                    hasNegator = false;
                    hasIntensifier = false;
                }
            }
            
            // 计算情感得分 (-1 到 1)
            const total = positiveCount + negativeCount;
            const score = total > 0 ? (positiveCount - negativeCount) / total : 0;
            
            // 确定情感类别
            let sentiment = 'neutral';
            if (score > 0.3) sentiment = 'positive';
            else if (score < -0.3) sentiment = 'negative';
            
            return {
                sentiment: sentiment,
                score: score,
                positiveCount: positiveCount,
                negativeCount: negativeCount,
                confidence: Math.abs(score)
            };
        }

        /**
         * 检测情感强度
         */
        getIntensity(text) {
            let intensifierCount = 0;
            const tokens = text.split('');
            
            for (const char of tokens) {
                if (this.sentimentLexicon.intensifiers.has(char)) {
                    intensifierCount++;
                }
            }
            
            return {
                level: intensifierCount === 0 ? 'normal' : 
                       intensifierCount === 1 ? 'strong' : 'very_strong',
                score: Math.min(1, intensifierCount / 3)
            };
        }
    }

    // ============================================
    // 文本分类器
    // ============================================
    class TextClassifier {
        constructor() {
            this.categories = {
                'feedback': ['反馈', '建议', '意见', '评价', '评分'],
                'question': ['问题', '疑问', '不懂', '怎么', '为什么'],
                'complaint': ['投诉', '不满', '差评', '问题', '错误'],
                'praise': ['表扬', '好评', '感谢', '喜欢', '满意'],
                'suggestion': ['建议', '提议', '希望', '能否', '可以']
            };
            
            this.tokenizer = new ChineseTokenizer();
        }

        /**
         * 分类文本
         */
        classify(text) {
            const scores = {};
            
            for (const [category, keywords] of Object.entries(this.categories)) {
                let score = 0;
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        score++;
                    }
                }
                scores[category] = score;
            }
            
            // 找出最高分类
            let maxScore = 0;
            let bestCategory = 'unknown';
            
            for (const [category, score] of Object.entries(scores)) {
                if (score > maxScore) {
                    maxScore = score;
                    bestCategory = category;
                }
            }
            
            const total = Object.values(scores).reduce((a, b) => a + b, 0);
            const confidence = total > 0 ? maxScore / total : 0;
            
            return {
                category: bestCategory,
                confidence: confidence,
                scores: scores
            };
        }
    }

    // ============================================
    // 语义相似度计算器
    // ============================================
    class SemanticSimilarityCalculator {
        constructor() {
            this.tokenizer = new ChineseTokenizer();
        }

        /**
         * 计算余弦相似度
         */
        cosineSimilarity(text1, text2) {
            const tokens1 = this.tokenizer.tokenize(text1).map(t => t.text);
            const tokens2 = this.tokenizer.tokenize(text2).map(t => t.text);
            
            // 构建词表
            const vocabulary = new Set([...tokens1, ...tokens2]);
            
            // 构建向量
            const vector1 = this._buildVector(tokens1, vocabulary);
            const vector2 = this._buildVector(tokens2, vocabulary);
            
            // 计算余弦相似度
            return this._cosine(vector1, vector2);
        }

        /**
         * 构建词频向量
         */
        _buildVector(tokens, vocabulary) {
            const vector = {};
            for (const word of vocabulary) {
                vector[word] = 0;
            }
            for (const token of tokens) {
                vector[token]++;
            }
            return vector;
        }

        /**
         * 计算余弦值
         */
        _cosine(vec1, vec2) {
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            
            for (const key of Object.keys(vec1)) {
                dotProduct += vec1[key] * vec2[key];
                norm1 += vec1[key] * vec1[key];
                norm2 += vec2[key] * vec2[key];
            }
            
            const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
            return denominator > 0 ? dotProduct / denominator : 0;
        }

        /**
         * Jaccard相似度
         */
        jaccardSimilarity(text1, text2) {
            const tokens1 = new Set(this.tokenizer.tokenize(text1).map(t => t.text));
            const tokens2 = new Set(this.tokenizer.tokenize(text2).map(t => t.text));
            
            const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
            const union = new Set([...tokens1, ...tokens2]);
            
            return union.size > 0 ? intersection.size / union.size : 0;
        }

        /**
         * 编辑距离相似度
         */
        editDistanceSimilarity(text1, text2) {
            const distance = this._levenshteinDistance(text1, text2);
            const maxLength = Math.max(text1.length, text2.length);
            return maxLength > 0 ? 1 - distance / maxLength : 1;
        }

        /**
         * Levenshtein距离
         */
        _levenshteinDistance(s1, s2) {
            const m = s1.length;
            const n = s2.length;
            const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
            
            for (let i = 0; i <= m; i++) dp[i][0] = i;
            for (let j = 0; j <= n; j++) dp[0][j] = j;
            
            for (let i = 1; i <= m; i++) {
                for (let j = 1; j <= n; j++) {
                    if (s1[i - 1] === s2[j - 1]) {
                        dp[i][j] = dp[i - 1][j - 1];
                    } else {
                        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                    }
                }
            }
            
            return dp[m][n];
        }
    }

    // ============================================
    // 自然语言理解管理器
    // ============================================
    class NLUManager {
        constructor() {
            this.tokenizer = new ChineseTokenizer();
            this.intentRecognizer = new IntentRecognizer();
            this.sentimentAnalyzer = new SentimentAnalyzer();
            this.textClassifier = new TextClassifier();
            this.similarityCalculator = new SemanticSimilarityCalculator();
        }

        /**
         * 理解文本
         */
        understand(text) {
            return {
                text: text,
                tokens: this.tokenizer.tokenize(text),
                keywords: this.tokenizer.extractKeywords(text),
                intent: this.intentRecognizer.recognize(text),
                sentiment: this.sentimentAnalyzer.analyze(text),
                category: this.textClassifier.classify(text),
                intensity: this.sentimentAnalyzer.getIntensity(text)
            };
        }

        /**
         * 匹配回复模板
         */
        matchResponse(input, templates) {
            let bestMatch = null;
            let bestScore = 0;
            
            for (const template of templates) {
                const score = this.similarityCalculator.cosineSimilarity(
                    input, 
                    template.pattern
                );
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = template;
                }
            }
            
            return {
                template: bestMatch,
                confidence: bestScore,
                matched: bestScore > 0.5
            };
        }

        /**
         * 提取实体
         */
        extractEntities(text) {
            const entities = [];
            
            // 提取数字
            const numbers = text.match(/\d+(\.\d+)?/g);
            if (numbers) {
                entities.push({
                    type: 'number',
                    values: numbers.map(n => parseFloat(n))
                });
            }
            
            // 提取百分比
            const percentages = text.match(/\d+%/g);
            if (percentages) {
                entities.push({
                    type: 'percentage',
                    values: percentages.map(p => parseInt(p) / 100)
                });
            }
            
            // 提取场景相关关键词
            const keywords = this.tokenizer.extractKeywords(text);
            if (keywords.length > 0) {
                entities.push({
                    type: 'keyword',
                    values: keywords.map(k => k.word)
                });
            }
            
            return entities;
        }

        /**
         * 生成响应建议
         */
        generateResponseSuggestion(understanding) {
            const suggestions = [];
            
            // 基于意图的建议
            if (understanding.intent.confidence > 0.5) {
                switch (understanding.intent.intent) {
                    case 'start_scenario':
                        suggestions.push('您想开始哪个场景？');
                        break;
                    case 'get_hint':
                        suggestions.push('让我为您解释这个概念...');
                        break;
                    case 'express_confusion':
                        suggestions.push('我来帮您理清思路...');
                        break;
                    case 'express_frustration':
                        suggestions.push('别担心，这是个学习过程...');
                        break;
                }
            }
            
            // 基于情感的建议
            if (understanding.sentiment.sentiment === 'negative') {
                suggestions.push('我理解您的感受...');
            } else if (understanding.sentiment.sentiment === 'positive') {
                suggestions.push('很高兴您有这种感觉！');
            }
            
            return suggestions;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ChineseTokenizer,
            IntentRecognizer,
            SentimentAnalyzer,
            TextClassifier,
            SemanticSimilarityCalculator,
            NLUManager
        };
    } else {
        global.ChineseTokenizer = ChineseTokenizer;
        global.IntentRecognizer = IntentRecognizer;
        global.SentimentAnalyzer = SentimentAnalyzer;
        global.TextClassifier = TextClassifier;
        global.SemanticSimilarityCalculator = SemanticSimilarityCalculator;
        global.NLUManager = NLUManager;
    }

})(typeof window !== 'undefined' ? window : this);

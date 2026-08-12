/**
 * 知识检索增强模块
 * Knowledge Retrieval Enhanced Module
 * 
 * 功能：
 * - 倒排索引构建
 * - TF-IDF/BM25排序
 * - 语义相似度匹配
 * - 混合检索策略
 * - 查询优化与扩展
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环23
 */

(function(global) {
    'use strict';

    // ============================================
    // 文本处理器
    // ============================================
    class TextProcessor {
        constructor() {
            // 中文停用词
            this.stopWords = new Set([
                '的', '是', '在', '有', '和', '了', '不', '这', '我', '你',
                '他', '她', '它', '们', '个', '也', '就', '都', '而', '及',
                '与', '或', '但', '如', '被', '把', '让', '给', '从', '到',
                '对', '向', '往', '在', '以', '为', '因', '所', '能', '会',
                '可', '要', '应', '该', '将', '已', '还', '又', '再', '很',
                'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                'could', 'should', 'may', 'might', 'can', 'to', 'of', 'in',
                'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into'
            ]);

            // 同义词映射
            this.synonyms = {
                '偏误': ['偏差', '偏见', '倾向'],
                '效应': ['效果', '作用', '影响'],
                '决策': ['决定', '选择', '判断'],
                '思维': ['思考', '想法', '思路'],
                '系统': ['体系', '整体', '框架'],
                '认知': ['认识', '理解', '感知']
            };
        }

        /**
         * 分词（简化版本，实际应使用专业分词器）
         */
        tokenize(text) {
            // 简单的分词逻辑：按空格和标点分割
            const tokens = text
                .toLowerCase()
                .replace(/[，。！？；：""''【】（）、]/g, ' ')
                .replace(/[,.!?;:'"()\[\]]/g, ' ')
                .split(/\s+/)
                .filter(token => token.length > 0);

            return this.removeStopWords(tokens);
        }

        /**
         * 移除停用词
         */
        removeStopWords(tokens) {
            return tokens.filter(token => !this.stopWords.has(token));
        }

        /**
         * 词干提取（简化版本）
         */
        stem(word) {
            // 简单的词干提取规则
            if (word.endsWith('ing')) return word.slice(0, -3);
            if (word.endsWith('ed')) return word.slice(0, -2);
            if (word.endsWith('ly')) return word.slice(0, -2);
            if (word.endsWith('ness')) return word.slice(0, -4);
            return word;
        }

        /**
         * 获取同义词
         */
        getSynonyms(word) {
            const result = [word];
            
            // 检查是否是同义词组的主词
            for (const [main, synonyms] of Object.entries(this.synonyms)) {
                if (main === word || synonyms.includes(word)) {
                    result.push(main, ...synonyms.filter(s => s !== word));
                }
            }

            return [...new Set(result)];
        }

        /**
         * N-gram生成
         */
        generateNgrams(tokens, n = 2) {
            const ngrams = [];
            for (let i = 0; i <= tokens.length - n; i++) {
                ngrams.push(tokens.slice(i, i + n).join(' '));
            }
            return ngrams;
        }
    }

    // ============================================
    // 倒排索引
    // ============================================
    class InvertedIndex {
        constructor() {
            this.index = new Map();      // 词项 -> 文档列表
            this.documents = new Map();   // 文档ID -> 文档内容
            this.docLengths = new Map();  // 文档ID -> 文档长度
            this.avgDocLength = 0;        // 平均文档长度
            this.totalDocs = 0;           // 文档总数
            this.textProcessor = new TextProcessor();
        }

        /**
         * 添加文档
         */
        addDocument(docId, content, metadata = {}) {
            const tokens = this.textProcessor.tokenize(content);
            const termFreq = this.calculateTermFrequency(tokens);

            // 存储文档
            this.documents.set(docId, {
                id: docId,
                content: content,
                tokens: tokens,
                termFreq: termFreq,
                metadata: metadata,
                length: tokens.length
            });

            // 更新文档长度
            this.docLengths.set(docId, tokens.length);

            // 更新倒排索引
            for (const [term, freq] of termFreq) {
                if (!this.index.has(term)) {
                    this.index.set(term, new Map());
                }
                this.index.get(term).set(docId, freq);
            }

            // 更新统计信息
            this.totalDocs++;
            this.updateAvgDocLength();
        }

        /**
         * 批量添加文档
         */
        addDocuments(documents) {
            for (const doc of documents) {
                this.addDocument(doc.id, doc.content, doc.metadata);
            }
        }

        /**
         * 计算词频
         */
        calculateTermFrequency(tokens) {
            const freq = new Map();
            for (const token of tokens) {
                freq.set(token, (freq.get(token) || 0) + 1);
            }
            return freq;
        }

        /**
         * 更新平均文档长度
         */
        updateAvgDocLength() {
            let totalLength = 0;
            for (const length of this.docLengths.values()) {
                totalLength += length;
            }
            this.avgDocLength = this.totalDocs > 0 ? totalLength / this.totalDocs : 0;
        }

        /**
         * 获取文档频率
         */
        getDocumentFrequency(term) {
            const postings = this.index.get(term);
            return postings ? postings.size : 0;
        }

        /**
         * 搜索词项
         */
        searchTerm(term) {
            return this.index.get(term) || new Map();
        }

        /**
         * 删除文档
         */
        removeDocument(docId) {
            const doc = this.documents.get(docId);
            if (!doc) return false;

            // 从倒排索引中移除
            for (const term of doc.termFreq.keys()) {
                const postings = this.index.get(term);
                if (postings) {
                    postings.delete(docId);
                    if (postings.size === 0) {
                        this.index.delete(term);
                    }
                }
            }

            // 删除文档记录
            this.documents.delete(docId);
            this.docLengths.delete(docId);

            this.totalDocs--;
            this.updateAvgDocLength();

            return true;
        }

        /**
         * 获取索引统计
         */
        getStatistics() {
            return {
                totalDocs: this.totalDocs,
                totalTerms: this.index.size,
                avgDocLength: this.avgDocLength,
                vocabularySize: this.index.size
            };
        }
    }

    // ============================================
    // TF-IDF评分器
    // ============================================
    class TFIDFScorer {
        constructor(index) {
            this.index = index;
        }

        /**
         * 计算TF（词频）
         * 使用对数缩放
         */
        calculateTF(termFreq) {
            if (termFreq === 0) return 0;
            return 1 + Math.log10(termFreq);
        }

        /**
         * 计算IDF（逆文档频率）
         */
        calculateIDF(term) {
            const df = this.index.getDocumentFrequency(term);
            if (df === 0) return 0;
            return Math.log10(this.index.totalDocs / df);
        }

        /**
         * 计算TF-IDF分数
         */
        calculateTFIDF(term, docId) {
            const postings = this.index.searchTerm(term);
            const tf = postings.get(docId) || 0;
            const idf = this.calculateIDF(term);

            return this.calculateTF(tf) * idf;
        }

        /**
         * 计算文档向量
         */
        calculateDocumentVector(docId) {
            const doc = this.index.documents.get(docId);
            if (!doc) return new Map();

            const vector = new Map();
            for (const [term, freq] of doc.termFreq) {
                const tfidf = this.calculateTFIDF(term, docId);
                if (tfidf > 0) {
                    vector.set(term, tfidf);
                }
            }

            return vector;
        }

        /**
         * 计算查询向量
         */
        calculateQueryVector(queryTerms) {
            const termFreq = new Map();
            for (const term of queryTerms) {
                termFreq.set(term, (termFreq.get(term) || 0) + 1);
            }

            const vector = new Map();
            for (const [term, tf] of termFreq) {
                const idf = this.calculateIDF(term);
                if (idf > 0) {
                    vector.set(term, this.calculateTF(tf) * idf);
                }
            }

            return vector;
        }

        /**
         * 计算余弦相似度
         */
        cosineSimilarity(vec1, vec2) {
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;

            // 计算点积和模长
            const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);
            for (const term of allTerms) {
                const v1 = vec1.get(term) || 0;
                const v2 = vec2.get(term) || 0;
                dotProduct += v1 * v2;
                norm1 += v1 * v1;
                norm2 += v2 * v2;
            }

            if (norm1 === 0 || norm2 === 0) return 0;
            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        }
    }

    // ============================================
    // BM25评分器
    // ============================================
    class BM25Scorer {
        constructor(index, k1 = 1.5, b = 0.75) {
            this.index = index;
            this.k1 = k1;  // 词频饱和参数
            this.b = b;    // 文档长度归一化参数
        }

        /**
         * 计算BM25分数
         */
        calculateScore(queryTerms, docId) {
            const doc = this.index.documents.get(docId);
            if (!doc) return 0;

            const docLength = doc.length;
            const avgDocLength = this.index.avgDocLength;
            let score = 0;

            for (const term of queryTerms) {
                const postings = this.index.searchTerm(term);
                const tf = postings.get(docId) || 0;
                
                if (tf === 0) continue;

                // IDF计算
                const df = postings.size;
                const idf = Math.log(1 + (this.index.totalDocs - df + 0.5) / (df + 0.5));

                // TF计算（考虑文档长度归一化）
                const numerator = tf * (this.k1 + 1);
                const denominator = tf + this.k1 * (1 - this.b + this.b * docLength / avgDocLength);

                score += idf * (numerator / denominator);
            }

            return score;
        }

        /**
         * 批量评分
         */
        scoreDocuments(queryTerms, docIds) {
            const scores = [];
            for (const docId of docIds) {
                const score = this.calculateScore(queryTerms, docId);
                if (score > 0) {
                    scores.push({ docId, score });
                }
            }
            return scores.sort((a, b) => b.score - a.score);
        }
    }

    // ============================================
    // 语义相似度匹配器
    // ============================================
    class SemanticSimilarityMatcher {
        constructor() {
            // 预定义的语义向量（简化版本，实际应使用词嵌入）
            this.wordVectors = this.initWordVectors();
            this.vectorSize = 50;
        }

        /**
         * 初始化词向量（简化版）
         */
        initWordVectors() {
            // 这里使用随机初始化，实际应加载预训练的词向量
            const vectors = new Map();
            const keywords = [
                '确认偏误', '锚定效应', '损失厌恶', '沉没成本', '线性思维',
                '认知偏差', '决策', '系统', '反馈', '延迟',
                'confirmation', 'bias', 'anchoring', 'loss', 'aversion',
                'sunk', 'cost', 'linear', 'thinking', 'decision'
            ];

            for (const word of keywords) {
                const vector = [];
                for (let i = 0; i < this.vectorSize; i++) {
                    vector.push(Math.random() * 2 - 1);
                }
                vectors.set(word, vector);
            }

            return vectors;
        }

        /**
         * 获取词向量
         */
        getWordVector(word) {
            if (this.wordVectors.has(word)) {
                return this.wordVectors.get(word);
            }
            // 未知词返回零向量
            return new Array(this.vectorSize).fill(0);
        }

        /**
         * 计算余弦相似度
         */
        cosineSimilarity(vec1, vec2) {
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;

            for (let i = 0; i < vec1.length; i++) {
                dotProduct += vec1[i] * vec2[i];
                norm1 += vec1[i] * vec1[i];
                norm2 += vec2[i] * vec2[i];
            }

            if (norm1 === 0 || norm2 === 0) return 0;
            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        }

        /**
         * 计算句子相似度（词袋平均）
         */
        calculateSentenceSimilarity(tokens1, tokens2) {
            // 计算两个句子的平均向量
            const avgVec1 = this.calculateAverageVector(tokens1);
            const avgVec2 = this.calculateAverageVector(tokens2);

            return this.cosineSimilarity(avgVec1, avgVec2);
        }

        /**
         * 计算平均向量
         */
        calculateAverageVector(tokens) {
            const avgVector = new Array(this.vectorSize).fill(0);
            
            if (tokens.length === 0) return avgVector;

            for (const token of tokens) {
                const vec = this.getWordVector(token);
                for (let i = 0; i < this.vectorSize; i++) {
                    avgVector[i] += vec[i];
                }
            }

            for (let i = 0; i < this.vectorSize; i++) {
                avgVector[i] /= tokens.length;
            }

            return avgVector;
        }

        /**
         * 找到最相似的词
         */
        findMostSimilar(word, topN = 5) {
            const targetVec = this.getWordVector(word);
            const similarities = [];

            for (const [otherWord, vec] of this.wordVectors) {
                if (otherWord !== word) {
                    const sim = this.cosineSimilarity(targetVec, vec);
                    similarities.push({ word: otherWord, similarity: sim });
                }
            }

            return similarities
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topN);
        }
    }

    // ============================================
    // 混合检索器
    // ============================================
    class HybridRetriever {
        constructor(index) {
            this.index = index;
            this.tfidfScorer = new TFIDFScorer(index);
            this.bm25Scorer = new BM25Scorer(index);
            this.semanticMatcher = new SemanticSimilarityMatcher();
            this.textProcessor = new TextProcessor();

            // 权重配置
            this.weights = {
                bm25: 0.4,
                tfidf: 0.3,
                semantic: 0.3
            };
        }

        /**
         * 执行混合检索
         */
        search(query, options = {}) {
            const queryTokens = this.textProcessor.tokenize(query);
            const topN = options.topN || 10;

            // 扩展查询（添加同义词）
            const expandedTokens = this.expandQuery(queryTokens);

            // 获取候选文档
            const candidateDocs = this.getCandidateDocuments(expandedTokens);

            // 计算各种分数
            const bm25Scores = this.calculateBM25Scores(expandedTokens, candidateDocs);
            const tfidfScores = this.calculateTFIDFScores(expandedTokens, candidateDocs);
            const semanticScores = this.calculateSemanticScores(queryTokens, candidateDocs);

            // 融合分数
            const fusedScores = this.fuseScores(
                bm25Scores,
                tfidfScores,
                semanticScores,
                candidateDocs
            );

            // 排序并返回结果
            return fusedScores
                .sort((a, b) => b.score - a.score)
                .slice(0, topN)
                .map(result => ({
                    docId: result.docId,
                    score: result.score,
                    doc: this.index.documents.get(result.docId),
                    highlights: this.generateHighlights(result.docId, queryTokens)
                }));
        }

        /**
         * 扩展查询
         */
        expandQuery(tokens) {
            const expanded = [...tokens];
            
            for (const token of tokens) {
                const synonyms = this.textProcessor.getSynonyms(token);
                for (const syn of synonyms) {
                    if (!expanded.includes(syn)) {
                        expanded.push(syn);
                    }
                }
            }

            return expanded;
        }

        /**
         * 获取候选文档
         */
        getCandidateDocuments(tokens) {
            const candidates = new Set();

            for (const token of tokens) {
                const postings = this.index.searchTerm(token);
                for (const docId of postings.keys()) {
                    candidates.add(docId);
                }
            }

            return [...candidates];
        }

        /**
         * 计算BM25分数
         */
        calculateBM25Scores(tokens, docIds) {
            const scores = {};
            for (const docId of docIds) {
                scores[docId] = this.bm25Scorer.calculateScore(tokens, docId);
            }
            return scores;
        }

        /**
         * 计算TF-IDF分数
         */
        calculateTFIDFScores(tokens, docIds) {
            const scores = {};
            const queryVec = this.tfidfScorer.calculateQueryVector(tokens);

            for (const docId of docIds) {
                const docVec = this.tfidfScorer.calculateDocumentVector(docId);
                scores[docId] = this.tfidfScorer.cosineSimilarity(queryVec, docVec);
            }

            return scores;
        }

        /**
         * 计算语义分数
         */
        calculateSemanticScores(queryTokens, docIds) {
            const scores = {};

            for (const docId of docIds) {
                const doc = this.index.documents.get(docId);
                if (doc) {
                    scores[docId] = this.semanticMatcher.calculateSentenceSimilarity(
                        queryTokens,
                        doc.tokens
                    );
                }
            }

            return scores;
        }

        /**
         * 融合分数（线性加权）
         */
        fuseScores(bm25Scores, tfidfScores, semanticScores, docIds) {
            // 归一化函数
            const normalize = (scores) => {
                const values = Object.values(scores);
                const max = Math.max(...values, 1);
                const min = Math.min(...values, 0);
                const range = max - min || 1;
                
                const normalized = {};
                for (const [id, score] of Object.entries(scores)) {
                    normalized[id] = (score - min) / range;
                }
                return normalized;
            };

            const normBM25 = normalize(bm25Scores);
            const normTFIDF = normalize(tfidfScores);
            const normSemantic = normalize(semanticScores);

            const results = [];
            for (const docId of docIds) {
                const fusedScore = 
                    this.weights.bm25 * (normBM25[docId] || 0) +
                    this.weights.tfidf * (normTFIDF[docId] || 0) +
                    this.weights.semantic * (normSemantic[docId] || 0);

                results.push({
                    docId: docId,
                    score: fusedScore,
                    components: {
                        bm25: normBM25[docId] || 0,
                        tfidf: normTFIDF[docId] || 0,
                        semantic: normSemantic[docId] || 0
                    }
                });
            }

            return results;
        }

        /**
         * 生成高亮片段
         */
        generateHighlights(docId, queryTokens) {
            const doc = this.index.documents.get(docId);
            if (!doc) return [];

            const highlights = [];
            const content = doc.content.toLowerCase();

            for (const token of queryTokens) {
                const index = content.indexOf(token.toLowerCase());
                if (index !== -1) {
                    const start = Math.max(0, index - 20);
                    const end = Math.min(content.length, index + token.length + 20);
                    highlights.push({
                        term: token,
                        snippet: doc.content.substring(start, end),
                        position: index
                    });
                }
            }

            return highlights;
        }

        /**
         * 更新权重
         */
        updateWeights(weights) {
            this.weights = { ...this.weights, ...weights };
        }
    }

    // ============================================
    // 知识检索增强系统主类
    // ============================================
    class KnowledgeRetrievalEnhanced {
        constructor(config = {}) {
            this.index = new InvertedIndex();
            this.hybridRetriever = new HybridRetriever(this.index);
            this.textProcessor = new TextProcessor();

            this.config = {
                defaultTopN: config.defaultTopN || 10,
                enableQueryExpansion: config.enableQueryExpansion !== false,
                enableHighlighting: config.enableHighlighting !== false,
                minScore: config.minScore || 0.1
            };

            this.version = '1.0.0';
            this.createdAt = Date.now();

            // 初始化默认知识
            if (config.initialKnowledge) {
                this.indexDocuments(config.initialKnowledge);
            }
        }

        /**
         * 索引文档
         */
        indexDocuments(documents) {
            this.index.addDocuments(documents);
        }

        /**
         * 添加单个文档
         */
        addDocument(id, content, metadata = {}) {
            this.index.addDocument(id, content, metadata);
        }

        /**
         * 搜索
         */
        search(query, options = {}) {
            const mergedOptions = {
                topN: options.topN || this.config.defaultTopN,
                ...options
            };

            const results = this.hybridRetriever.search(query, mergedOptions);

            // 过滤低分结果
            return results.filter(r => r.score >= this.config.minScore);
        }

        /**
         * 相似文档查询
         */
        findSimilar(docId, topN = 5) {
            const doc = this.index.documents.get(docId);
            if (!doc) return [];

            // 使用文档内容作为查询
            return this.search(doc.content, { topN });
        }

        /**
         * 获取文档
         */
        getDocument(docId) {
            return this.index.documents.get(docId);
        }

        /**
         * 删除文档
         */
        removeDocument(docId) {
            return this.index.removeDocument(docId);
        }

        /**
         * 获取统计信息
         */
        getStatistics() {
            return {
                ...this.index.getStatistics(),
                version: this.version,
                createdAt: this.createdAt
            };
        }

        /**
         * 批量搜索
         */
        batchSearch(queries, options = {}) {
            return queries.map(query => ({
                query: query,
                results: this.search(query, options)
            }));
        }

        /**
         * 查询建议
         */
        suggestQueries(prefix, limit = 5) {
            const suggestions = [];
            const prefixLower = prefix.toLowerCase();

            for (const term of this.index.index.keys()) {
                if (term.startsWith(prefixLower)) {
                    suggestions.push(term);
                    if (suggestions.length >= limit) break;
                }
            }

            return suggestions;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            KnowledgeRetrievalEnhanced,
            InvertedIndex,
            TFIDFScorer,
            BM25Scorer,
            SemanticSimilarityMatcher,
            HybridRetriever,
            TextProcessor
        };
    } else {
        global.KnowledgeRetrievalEnhanced = KnowledgeRetrievalEnhanced;
        global.InvertedIndex = InvertedIndex;
        global.TFIDFScorer = TFIDFScorer;
        global.BM25Scorer = BM25Scorer;
        global.SemanticSimilarityMatcher = SemanticSimilarityMatcher;
        global.HybridRetriever = HybridRetriever;
        global.TextProcessor = TextProcessor;
    }

})(typeof window !== 'undefined' ? window : this);

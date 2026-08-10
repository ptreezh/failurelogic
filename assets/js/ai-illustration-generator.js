/**
 * AI Illustration Generator - 智能插图生成服务
 * Skill-driven AI illustration workflow for Failure Logic
 *
 * 功能：
 * - 混合模式：模板 SVG (立即可用) + AI 生成 (增强体验)
 * - localStorage 缓存，避免重复生成
 * - 优雅降级：AI 不可用时回退到模板
 * - 支持场景卡片、反馈页、觉醒时刻等不同上下文
 */

(function(global) {
    'use strict';

    // ==================== 配置 ====================

    const CONFIG = {
        cachePrefix: 'fl_illust_',
        cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7天
        aiCachePrefix: 'fl_ai_illust_',
        aiCacheTTL: 30 * 24 * 60 * 60 * 1000, // 30天
        maxRetries: 2,
        retryDelay: 1000,
        // 插图尺寸配置
        sizes: {
            card: { width: 320, height: 180 },
            feedback: { width: 280, height: 160 },
            awakening: { width: 240, height: 140 },
            thumbnail: { width: 120, height: 80 }
        }
    };

    // ==================== 插图上下文类型 ====================

    const IllustrationContext = {
        CARD: 'card',
        FEEDBACK: 'feedback',
        AWAKENING: 'awakening',
        THUMBNAIL: 'thumbnail'
    };

    // ==================== 核心服务类 ====================

    class AIIllustrationGenerator {
        constructor() {
            this._llmAvailable = null; // lazy check
            this._cache = new Map();
        }

        // ===================== 公共 API ====================

        /**
         * 获取场景插图
         * @param {string} scenarioId - 场景ID
         * @param {string} context - 上下文类型 (card|feedback|awakening|thumbnail)
         * @param {object} options - 可选配置 {biasType, theme, forceRefresh}
         * @returns {Promise<string>} SVG 字符串
         */
        async getIllustration(scenarioId, context = IllustrationContext.CARD, options = {}) {
            const { biasType = null, theme = 'light', forceRefresh = false } = options;

            // 1. 检查AI缓存（优先）
            const cacheKey = this._getCacheKey(scenarioId, context, 'ai');
            if (!forceRefresh) {
                const cached = this._getFromCache(cacheKey, CONFIG.aiCachePrefix);
                if (cached) return cached;
            }

            // 2. 尝试AI生成
            const aiSvg = await this._tryAIGeneration(scenarioId, context, biasType, theme);
            if (aiSvg) {
                this._saveToCache(cacheKey, aiSvg, CONFIG.aiCachePrefix);
                return aiSvg;
            }

            // 3. 回退到模板SVG
            return this._getTemplateIllustration(scenarioId, biasType, theme, context);
        }

        /**
         * 批量获取多个场景的插图
         * @param {Array} scenarioIds - 场景ID数组
         * @param {string} context - 上下文类型
         * @returns {Promise<Map<string, string>>} scenarioId -> SVG 映射
         */
        async batchGet(scenarioIds, context = IllustrationContext.CARD) {
            const results = new Map();
            await Promise.all(
                scenarioIds.map(async (id) => {
                    const svg = await this.getIllustration(id, context);
                    results.set(id, svg);
                })
            );
            return results;
        }

        /**
         * 预加载场景插图（后台生成）
         * @param {Array} scenarioIds - 场景ID数组
         */
        async preload(scenarioIds) {
            scenarioIds.forEach(id => {
                this.getIllustration(id, IllustrationContext.CARD).catch(() => {});
            });
        }

        /**
         * 清除插图缓存
         * @param {string} scope - 'all' | 'ai' | 'template'
         */
        clearCache(scope = 'all') {
            if (scope === 'all' || scope === 'ai') {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(CONFIG.cachePrefix + 'ai')) {
                        localStorage.removeItem(key);
                    }
                });
            }
            this._cache.clear();
        }

        /**
         * 获取当前AI服务状态
         * @returns {Promise<{available: boolean, provider: string}>}
         */
        async getStatus() {
            try {
                const llm = global.LLMService || window.LLMService;
                if (llm?.isAvailable) {
                    return { available: true, provider: llm.currentProvider?.name || 'unknown' };
                }
            } catch (e) { /* ignore */ }
            return { available: false, provider: null };
        }

        // ===================== 内部方法 ====================

        /**
         * 尝试AI生成插图
         */
        async _tryAIGeneration(scenarioId, context, biasType, theme) {
            try {
                const llm = global.LLMService || window.LLMService;
                if (!llm?.isAvailable) return null;

                const prompt = this._buildPrompt(scenarioId, context, biasType, theme);
                const response = await llm.generate(prompt, { mode: 'svg' });

                if (response && this._isValidSVG(response)) {
                    return this._sanitizeSVG(response);
                }
            } catch (e) {
                Log.warn('[AIIllustrationGenerator] AI generation failed:', e.message);
            }
            return null;
        }

        /**
         * 构建AI提示词
         */
        _buildPrompt(scenarioId, context, biasType, theme) {
            const scenarioMeta = this._getScenarioMeta(scenarioId);
            const size = CONFIG.sizes[context] || CONFIG.sizes.card;

            return `生成一个内联 SVG 插图，用于认知偏误训练场景 "${scenarioMeta.name}"。

场景描述：${scenarioMeta.description}
认知偏误类型：${biasType || scenarioMeta.bias}
上下文：${context}

要求：
- 尺寸: ${size.width}x${size.height}
- 风格：教育性、清晰、专业，与 Failure Logic 平台风格一致
- 使用蓝橙配色 (#2563eb, #fbbf24, #ef4444, #10b981)
- 不要包含任何文本标签
- 只输出 SVG 字符串，外层用 <svg> 包裹
- 不要用 foreignObject
- 不要包含任何中文字符或说明文字

主题：${theme === 'dark' ? '深色背景，白色/浅蓝色内容' : '浅色背景，深蓝内容'}`;
        }

        /**
         * 获取场景元数据
         */
        _getScenarioMeta(scenarioId) {
            const metaMap = {
                'coffee-shop-nonlinear-effects': {
                    name: '咖啡店非线性效应',
                    description: '在咖啡店管理中体验非线性效应和指数增长',
                    bias: '线性思维'
                },
                'investment-confirmation-bias': {
                    name: '投资确认偏误',
                    description: '在投资决策中体验选择性过滤信息',
                    bias: '确认偏误'
                },
                'relationship-time-delay': {
                    name: '恋爱关系时间延迟',
                    description: '体验决策效果滞后显现的时间延迟效应',
                    bias: '即时满足偏好'
                },
                'business-strategy-game': {
                    name: '商业战略推理',
                    description: '在复杂商业环境中进行系统性决策',
                    bias: '过度自信'
                },
                'public-policy-simulation': {
                    name: '公共政策制定',
                    description: '平衡多方利益进行政策决策',
                    bias: '短期导向'
                },
                'investment-info-processing': {
                    name: '投资信息处理',
                    description: '在信息过载中做出数据驱动的投资决策',
                    bias: '信息过载'
                },
                'climate-change-scenario': {
                    name: '气候变化应对',
                    description: '体验复杂系统中的蝴蝶效应',
                    bias: '系统盲区'
                },
                'financial-crisis-scenario': {
                    name: '金融危机应对',
                    description: '识别系统性风险和连锁反应',
                    bias: '风险低估'
                },
                'ai-governance-scenario': {
                    name: 'AI治理决策',
                    description: '平衡AI效率与安全性',
                    bias: '效率偏向'
                },
                'personal-finance-scenario': {
                    name: '个人理财规划',
                    description: '理解复利思维和长期财务规划',
                    bias: '短期冲动'
                },
                'social-media-echo-chamber': {
                    name: '社交媒体回音壁',
                    description: '体验信息茧房和确认偏误放大',
                    bias: '群体极化'
                },
                'cognitive-diagnosis': {
                    name: '认知偏误诊断',
                    description: '全面诊断个人认知偏误模式',
                    bias: '多重偏误'
                }
            };

            return metaMap[scenarioId] || { name: scenarioId, description: '认知训练场景', bias: '通用' };
        }

        /**
         * 获取模板SVG
         */
        _getTemplateIllustration(scenarioId, biasType, theme, context) {
            const size = CONFIG.sizes[context] || CONFIG.sizes.card;
            const viewBox = `0 0 ${size.width} ${size.height}`;
            const svg = ScenarioIllustrations?.generate(scenarioId, biasType, theme) || '';

            // 如果SVG存在且匹配尺寸，直接返回
            if (svg && svg.includes('<svg')) {
                // 替换 viewBox
                return svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
            }

            // 返回默认模板
            return ScenarioIllustrations?.generate('default', null, theme) || '';
        }

        /**
         * 验证SVG格式
         */
        _isValidSVG(content) {
            if (!content || typeof content !== 'string') return false;
            const trimmed = content.trim();
            return trimmed.startsWith('<svg') || trimmed.includes('<svg');
        }

        /**
         * 清理SVG（安全处理）
         */
        _sanitizeSVG(svg) {
            // 移除 script 标签和事件属性
            let clean = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            clean = clean.replace(/\s+on\w+=["'][^"']*["']/gi, '');
            clean = clean.replace(/\s+on\w+=\s*[^\s>]+/gi, '');
            // 移除 javascript: URL
            clean = clean.replace(/javascript:/gi, '');
            return clean;
        }

        /**
         * 获取缓存键
         */
        _getCacheKey(scenarioId, context, type) {
            return `${scenarioId}_${context}_${type}`;
        }

        /**
         * 从缓存读取
         */
        _getFromCache(key, prefix) {
            const cacheKey = prefix + key;
            try {
                const cached = localStorage.getItem(cacheKey);
                if (!cached) return null;

                const { data, timestamp } = JSON.parse(cached);
                const ttl = prefix.includes('ai') ? CONFIG.aiCacheTTL : CONFIG.cacheTTL;

                if (Date.now() - timestamp > ttl) {
                    localStorage.removeItem(cacheKey);
                    return null;
                }
                return data;
            } catch (e) {
                return null;
            }
        }

        /**
         * 保存到缓存
         */
        _saveToCache(key, data, prefix) {
            try {
                const cacheKey = prefix + key;
                localStorage.setItem(cacheKey, JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (e) {
                // localStorage 满了，尝试清理后重试
                this._evictOldCache();
                try {
                    localStorage.setItem(prefix + key, JSON.stringify({
                        data,
                        timestamp: Date.now()
                    }));
                } catch (e2) {
                    Log.warn('[AIIllustrationGenerator] Cache save failed:', e2.message);
                }
            }
        }

        /**
         * 清理旧缓存
         */
        _evictOldCache() {
            const keys = Object.keys(localStorage).filter(k => k.startsWith(CONFIG.cachePrefix));
            // 按时间排序，删除最老的
            keys.sort();
            while (keys.length > 50) {
                const key = keys.shift();
                localStorage.removeItem(key);
            }
        }
    }

    // ==================== 单例 + 导出 ====================

    const instance = new AIIllustrationGenerator();

    global.AIIllustrationGenerator = instance;
    global.IllustrationContext = IllustrationContext;

    // 便捷函数
    global.getScenarioIllustration = (scenarioId, context) =>
        instance.getIllustration(scenarioId, context);

    global.preloadIllustrations = (scenarioIds) =>
        instance.preload(scenarioIds);

})(typeof global !== 'undefined' ? global : window);
/**
 * LLM智能服务模块
 * LLM Intelligence Service
 * 
 * 功能：
 * - 统一LLM API接口
 * - 多提供商支持 (OpenAI, Claude, 本地模型)
 * - 自动降级
 * - 响应缓存
 * - 优雅降级到规则引擎
 * 
 * 创建时间：2026-04-04
 */

(function(global) {
    'use strict';

    // LLM配置
    const LLM_CONFIG = {
        providers: [
            {
                name: 'openai',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-4o-mini',
                apiKey: null,  // 从环境变量或配置获取
                enabled: true,
                timeout: 5000
            },
            {
                name: 'claude',
                endpoint: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-haiku',
                apiKey: null,
                enabled: true,
                timeout: 5000
            },
            {
                name: 'local',
                endpoint: 'http://localhost:11434/api/generate',
                model: 'llama3',
                apiKey: null,
                enabled: false,
                timeout: 10000
            }
        ],
        fallback: 'rule-based',
        cache: {
            enabled: true,
            ttl: 3600,  // 1小时
            maxSize: 1000
        },
        retryAttempts: 2,
        retryDelay: 1000
    };

    // LLM服务类
    class LLMService {
        constructor(config = {}) {
            this.config = { ...LLM_CONFIG, ...config };
            this.currentProvider = null;
            this.cache = new Map();
            this.isAvailable = false;
            this.usageCount = 0;
            this.errorCount = 0;
        }

        /**
         * 初始化LLM服务
         */
        async initialize() {
            Logger?.debug('🤖 初始化LLM服务...');
            
            // 检测可用提供商
            this.currentProvider = await this._detectAvailableProvider();
            this.isAvailable = !!this.currentProvider;
            
            if (this.isAvailable) {
                Logger?.debug(`✅ LLM服务可用，使用提供商: ${this.currentProvider.name}`);
            } else {
                Logger?.debug('⚠️ 无可用LLM提供商，将使用规则引擎降级');
            }
            
            return this.isAvailable;
        }

        /**
         * 生成智能响应
         */
        async generate(prompt, options = {}) {
            // 检查缓存
            const cacheKey = this._getCacheKey(prompt, options);
            if (this.config.cache.enabled && this.cache.has(cacheKey)) {
                Logger?.debug('📦 使用缓存响应');
                return this.cache.get(cacheKey);
            }

            // 尝试LLM生成
            if (this.isAvailable) {
                try {
                    const response = await this._callLLM(prompt, options);
                    
                    // 缓存响应
                    if (this.config.cache.enabled) {
                        this._setCache(cacheKey, response);
                    }
                    
                    this.usageCount++;
                    return response;
                } catch (error) {
                    Logger?.warn('⚠️ LLM调用失败，降级到规则引擎:', error.message);
                    this.errorCount++;
                    
                    // 如果错误率过高，重新检测提供商
                    if (this.errorCount > 3) {
                        this.isAvailable = false;
                        this.currentProvider = await this._detectAvailableProvider();
                        this.isAvailable = !!this.currentProvider;
                        this.errorCount = 0;
                    }
                }
            }

            // 降级到规则引擎
            Logger?.debug('📜 降级到规则引擎');
            return RuleEngine.generate(prompt, options);
        }

        /**
         * 检测可用提供商
         */
        async _detectAvailableProvider() {
            for (const provider of this.config.providers) {
                if (!provider.enabled) {
                    Logger?.debug(`⏭️ 跳过禁用的提供商: ${provider.name}`);
                    continue;
                }
                
                // 检查API密钥（本地模型不需要）
                if (!provider.apiKey && provider.name !== 'local') {
                    // 尝试从全局配置获取
                    const globalKey = global.LLM_API_KEYS?.[provider.name];
                    if (!globalKey) {
                        Logger?.debug(`⏭️ 跳过无密钥的提供商: ${provider.name}`);
                        continue;
                    }
                    provider.apiKey = globalKey;
                }
                
                try {
                    await this._testProvider(provider);
                    Logger?.debug(`✅ 提供商可用: ${provider.name}`);
                    return provider;
                } catch (error) {
                    Logger?.warn(`❌ 提供商 ${provider.name} 不可用:`, error.message);
                }
            }
            return null;
        }

        /**
         * 测试提供商可用性
         */
        async _testProvider(provider) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            
            try {
                const response = await fetch(provider.endpoint, {
                    method: 'POST',
                    headers: this._getHeaders(provider),
                    body: JSON.stringify(this._getTestPayload(provider)),
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return true;
            } catch (error) {
                clearTimeout(timeout);
                throw error;
            }
        }

        /**
         * 调用LLM API
         */
        async _callLLM(prompt, options) {
            const provider = this.currentProvider;
            if (!provider) {
                throw new Error('无可用LLM提供商');
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), provider.timeout);
            
            const payload = this._getPayload(provider, prompt, options);
            
            try {
                const response = await fetch(provider.endpoint, {
                    method: 'POST',
                    headers: this._getHeaders(provider),
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                return this._parseResponse(provider, data);
            } catch (error) {
                clearTimeout(timeout);
                throw error;
            }
        }

        /**
         * 获取请求头
         */
        _getHeaders(provider) {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (provider.name === 'openai') {
                headers['Authorization'] = `Bearer ${provider.apiKey}`;
            } else if (provider.name === 'claude') {
                headers['x-api-key'] = provider.apiKey;
                headers['anthropic-version'] = '2023-06-01';
            }
            
            return headers;
        }

        /**
         * 获取测试负载
         */
        _getTestPayload(provider) {
            if (provider.name === 'openai') {
                return {
                    model: provider.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                };
            } else if (provider.name === 'claude') {
                return {
                    model: provider.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10
                };
            } else if (provider.name === 'local') {
                return {
                    model: provider.model,
                    prompt: 'test',
                    stream: false
                };
            }
        }

        /**
         * 获取请求负载
         */
        _getPayload(provider, prompt, options) {
            const systemPrompt = options.systemPrompt || '你是一个认知偏差教育助手，帮助用户理解决策中的思维陷阱。';
            
            if (provider.name === 'openai') {
                return {
                    model: provider.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: options.maxTokens || 500,
                    temperature: options.temperature || 0.7
                };
            } else if (provider.name === 'claude') {
                return {
                    model: provider.model,
                    messages: [{ role: 'user', content: prompt }],
                    system: systemPrompt,
                    max_tokens: options.maxTokens || 500,
                    temperature: options.temperature || 0.7
                };
            } else if (provider.name === 'local') {
                return {
                    model: provider.model,
                    prompt: `${systemPrompt}\n\n${prompt}`,
                    stream: false
                };
            }
        }

        /**
         * 解析响应
         */
        _parseResponse(provider, data) {
            if (provider.name === 'openai') {
                return data.choices?.[0]?.message?.content || '';
            } else if (provider.name === 'claude') {
                return data.content?.[0]?.text || '';
            } else if (provider.name === 'local') {
                return data.response || '';
            }
            return '';
        }

        /**
         * 获取缓存键
         */
        _getCacheKey(prompt, options) {
            return `${prompt}_${JSON.stringify(options)}`;
        }

        /**
         * 设置缓存
         */
        _setCache(key, value) {
            // 限制缓存大小
            if (this.cache.size >= this.config.cache.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(key, {
                value,
                timestamp: Date.now()
            });
        }

        /**
         * 获取使用统计
         */
        getStats() {
            return {
                isAvailable: this.isAvailable,
                provider: this.currentProvider?.name || 'none',
                usageCount: this.usageCount,
                errorCount: this.errorCount,
                cacheSize: this.cache.size,
                errorRate: this.usageCount > 0 ? (this.errorCount / this.usageCount * 100).toFixed(2) : 0
            };
        }
    }

    // 规则引擎（降级支持）
    class RuleEngine {
        static templates = {
            feedback: {
                default: '你的决策已记录。在复杂系统中，结果往往与预期不同。请反思你的决策过程。',
                linear_thinking: '你选择了线性思维策略。在复杂系统中，因果关系往往不是简单的直线关系。小变化可能产生大影响，直接原因可能有意想不到的间接后果。',
                confirmation_bias: '你表现出确认偏误倾向。尝试寻找反对证据，而不仅仅是支持证据。真正的决策者会主动挑战自己的假设。',
                time_delay: '你的决策可能受到时间延迟偏差的影响。在复杂系统中，结果往往不会立即显现。耐心等待并观察长期效果。',
                sunk_cost: '注意沉没成本陷阱！已经投入的资源不应该影响未来决策。问自己：如果从头开始，我还会做同样的选择吗？',
                overconfidence: '你可能过于自信了。在复杂系统中，预测往往不准确。保持谦逊，考虑多种可能性。',
                anchoring: '你的决策可能受到锚定效应的影响。初始信息会影响后续判断。尝试从不同角度重新评估。',
                framing: '注意框架效应！同样的信息用不同方式表述会导致不同决策。尝试用多种方式理解问题。'
            },
            awakening: {
                default: '💡 觉醒时刻：你发现了决策中的认知陷阱！回顾你的决策过程，识别可能的思维偏差。',
                linear_thinking: '💡 觉醒时刻：线性思维在复杂系统中往往导致错误决策！系统思考需要考虑反馈循环、延迟和非线性关系。',
                confirmation_bias: '💡 觉醒时刻：确认偏误让你只看到支持证据！真正的智慧在于主动寻找反对证据，挑战自己的信念。',
                time_delay: '💡 觉醒时刻：时间延迟让你误判了因果关系！在复杂系统中，原因和结果往往不是即时对应的。',
                sunk_cost: '💡 觉醒时刻：沉没成本正在影响你的判断！理性决策应该基于未来预期，而非过去投入。',
                overconfidence: '💡 觉醒时刻：过度自信让你低估了风险！在不确定环境中，保持谦逊和开放心态更重要。',
                anchoring: '💡 觉醒时刻：锚定效应扭曲了你的判断！初始信息不应该过度影响后续评估。',
                framing: '💡 觉醒时刻：框架效应影响了你的选择！同样的问题用不同方式理解会得出不同结论。'
            },
            suggestion: {
                default: '建议：多做反思，识别决策中的认知偏差，持续改进决策能力。',
                linear_thinking: '建议：学习系统思考，识别反馈循环和延迟效应，避免简单因果推理。',
                confirmation_bias: '建议：主动寻找反对证据，进行"魔鬼代言人"思考，挑战自己的假设。',
                time_delay: '建议：建立长期观察习惯，不要期望即时结果，理解延迟效应。',
                sunk_cost: '建议：使用"零基思维"，问自己：如果从头开始，我还会做同样选择吗？',
                overconfidence: '建议：记录预测与实际结果，校准自信水平，考虑最坏情况。',
                anchoring: '建议：识别初始锚点，主动调整估计值，寻找多个参考点。',
                framing: '建议：重新表述问题，从多个角度分析，关注实质而非表述。'
            }
        };

        static generate(prompt, options = {}) {
            const type = options.type || 'feedback';
            const biasType = options.biasType || 'default';
            
            const templates = this.templates[type] || this.templates.feedback;
            return templates[biasType] || templates.default;
        }
    }

    // 混合决策器
    class HybridDecider {
        constructor(llmService) {
            this.llm = llmService;
        }

        async decide(context) {
            // 评估决策复杂度
            const complexity = this._evaluateComplexity(context);
            
            Logger?.debug(`🧠 决策复杂度: ${(complexity * 100).toFixed(0)}%`);
            
            if (complexity > 0.6 && this.llm?.isAvailable) {
                // 高复杂度且LLM可用，使用LLM
                Logger?.debug('🤖 使用LLM进行智能决策');
                const prompt = this._buildPrompt(context);
                return await this.llm.generate(prompt, {
                    type: context.type || 'feedback',
                    biasType: context.biasType || 'default',
                    systemPrompt: context.systemPrompt
                });
            } else {
                // 低复杂度或LLM不可用，使用规则
                Logger?.debug('📜 使用规则引擎决策');
                return RuleEngine.generate(context.prompt || '', {
                    type: context.type || 'feedback',
                    biasType: context.biasType || 'default'
                });
            }
        }

        _evaluateComplexity(context) {
            let score = 0;
            
            // 决策历史长度
            if (context.decisionHistory?.length > 5) score += 0.2;
            if (context.decisionHistory?.length > 10) score += 0.1;
            
            // 认知偏差数量
            if (context.biases?.length > 2) score += 0.2;
            if (context.biases?.length > 4) score += 0.1;
            
            // 是否需要创造性
            if (context.requiresCreativity) score += 0.3;
            
            // 是否需要深度分析
            if (context.requiresDeepAnalysis) score += 0.2;
            
            // 用户水平
            if (context.userLevel === 'advanced') score += 0.1;
            
            return Math.min(1, score);
        }

        _buildPrompt(context) {
            let prompt = '';
            
            if (context.systemPrompt) {
                prompt += `${context.systemPrompt}\n\n`;
            }
            
            if (context.scenario) {
                prompt += `场景：${context.scenario}\n\n`;
            }
            
            if (context.decisionHistory) {
                prompt += `用户决策历史：\n${JSON.stringify(context.decisionHistory, null, 2)}\n\n`;
            }
            
            if (context.biases) {
                prompt += `检测到的认知偏差：${context.biases.join(', ')}\n\n`;
            }
            
            if (context.question) {
                prompt += `用户问题：${context.question}\n\n`;
            }
            
            prompt += context.prompt || '请提供智能反馈。';
            
            return prompt;
        }
    }

    // 导出模块
    const LLMIntelligence = {
        LLMService,
        RuleEngine,
        HybridDecider,
        LLM_CONFIG
    };

    // UMD导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = LLMIntelligence;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return LLMIntelligence; });
    } else {
        global.LLMIntelligence = LLMIntelligence;
        global.LLMService = LLMService;
        global.RuleEngine = RuleEngine;
        global.HybridDecider = HybridDecider;
    }

})(typeof window !== 'undefined' ? window : this);

/**
 * API网关系统
 * API Gateway System
 * 
 * 包含：请求路由、限流、缓存、重试、熔断、负载均衡
 * 
 * 来源：Soul Auto-Evolution 循环13
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // 请求路由器 (Request Router)
    // ============================================
    class RequestRouter {
        constructor(config = {}) {
            this.config = {
                baseUrl: config.baseUrl || '',
                timeout: config.timeout || 30000,
                retries: config.retries || 3,
                retryDelay: config.retryDelay || 1000,
                ...config
            };

            this.routes = new Map();
            this.middleware = [];
            this.interceptors = {
                request: [],
                response: []
            };
        }

        /**
         * 注册路由
         */
        registerRoute(pattern, handler, options = {}) {
            this.routes.set(pattern, {
                pattern,
                handler,
                options: {
                    cache: options.cache !== false,
                    cacheTTL: options.cacheTTL || 60000,
                    auth: options.auth || false,
                    rateLimit: options.rateLimit || null,
                    ...options
                }
            });
        }

        /**
         * 添加中间件
         */
        use(middleware) {
            this.middleware.push(middleware);
        }

        /**
         * 添加请求拦截器
         */
        addRequestInterceptor(interceptor) {
            this.interceptors.request.push(interceptor);
        }

        /**
         * 添加响应拦截器
         */
        addResponseInterceptor(interceptor) {
            this.interceptors.response.push(interceptor);
        }

        /**
         * 发送请求
         */
        async request(method, path, data = null, options = {}) {
            let config = {
                method,
                url: this.config.baseUrl + path,
                headers: options.headers || {},
                body: data,
                ...options
            };

            // 应用请求拦截器
            for (const interceptor of this.interceptors.request) {
                config = await interceptor(config);
            }

            // 应用中间件
            for (const mw of this.middleware) {
                config = mw(config);
            }

            // 执行请求（带重试）
            return this.executeWithRetry(config);
        }

        /**
         * 带重试的请求执行
         */
        async executeWithRetry(config, attempt = 1) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.config.timeout);

                const response = await fetch(config.url, {
                    method: config.method,
                    headers: config.headers,
                    body: config.body ? JSON.stringify(config.body) : null,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                let data = await response.json();

                // 应用响应拦截器
                for (const interceptor of this.interceptors.response) {
                    data = await interceptor(data);
                }

                return { success: true, data, status: response.status };

            } catch (error) {
                if (attempt < this.config.retries && this.shouldRetry(error)) {
                    await this.delay(this.config.retryDelay * attempt);
                    return this.executeWithRetry(config, attempt + 1);
                }
                return { success: false, error: error.message };
            }
        }

        shouldRetry(error) {
            return error.name === 'AbortError' || 
                   error.message.includes('503') ||
                   error.message.includes('502') ||
                   error.message.includes('NetworkError');
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // 便捷方法
        get(path, options) { return this.request('GET', path, null, options); }
        post(path, data, options) { return this.request('POST', path, data, options); }
        put(path, data, options) { return this.request('PUT', path, data, options); }
        delete(path, options) { return this.request('DELETE', path, null, options); }
    }

    // ============================================
    // 限流器 (Rate Limiter)
    // ============================================
    class RateLimiter {
        constructor(config = {}) {
            this.config = {
                maxRequests: config.maxRequests || 100,
                windowMs: config.windowMs || 60000, // 1分钟窗口
                strategy: config.strategy || 'sliding_window',
                ...config
            };

            this.requests = new Map();
            this.blockedIPs = new Map();
        }

        /**
         * 检查是否允许请求
         */
        isAllowed(identifier) {
            // 检查是否被封禁
            if (this.isBlocked(identifier)) {
                return { allowed: false, reason: 'blocked', retryAfter: this.getBlockedRemaining(identifier) };
            }

            const now = Date.now();
            const windowStart = now - this.config.windowMs;

            if (!this.requests.has(identifier)) {
                this.requests.set(identifier, []);
            }

            const userRequests = this.requests.get(identifier);

            // 移除过期的请求记录
            while (userRequests.length > 0 && userRequests[0] < windowStart) {
                userRequests.shift();
            }

            // 检查是否超过限制
            if (userRequests.length >= this.config.maxRequests) {
                const oldestRequest = userRequests[0];
                const retryAfter = oldestRequest + this.config.windowMs - now;

                return { 
                    allowed: false, 
                    reason: 'rate_limited',
                    retryAfter,
                    currentCount: userRequests.length
                };
            }

            // 记录新请求
            userRequests.push(now);

            return { 
                allowed: true, 
                currentCount: userRequests.length,
                remaining: this.config.maxRequests - userRequests.length
            };
        }

        /**
         * 封禁IP
         */
        block(identifier, duration = 3600000) {
            this.blockedIPs.set(identifier, {
                blockedAt: Date.now(),
                duration
            });
        }

        /**
         * 解封IP
         */
        unblock(identifier) {
            this.blockedIPs.delete(identifier);
        }

        /**
         * 检查是否被封禁
         */
        isBlocked(identifier) {
            if (!this.blockedIPs.has(identifier)) return false;

            const blockInfo = this.blockedIPs.get(identifier);
            const now = Date.now();

            if (now - blockInfo.blockedAt > blockInfo.duration) {
                this.blockedIPs.delete(identifier);
                return false;
            }

            return true;
        }

        /**
         * 获取封禁剩余时间
         */
        getBlockedRemaining(identifier) {
            if (!this.blockedIPs.has(identifier)) return 0;

            const blockInfo = this.blockedIPs.get(identifier);
            const elapsed = Date.now() - blockInfo.blockedAt;
            return Math.max(0, blockInfo.duration - elapsed);
        }

        /**
         * 获取统计信息
         */
        getStats() {
            const stats = {
                activeUsers: this.requests.size,
                blockedUsers: this.blockedIPs.size,
                totalRequests: 0
            };

            for (const [, requests] of this.requests) {
                stats.totalRequests += requests.length;
            }

            return stats;
        }
    }

    // ============================================
    // 熔断器 (Circuit Breaker)
    // ============================================
    class CircuitBreaker {
        constructor(config = {}) {
            this.config = {
                failureThreshold: config.failureThreshold || 5,
                successThreshold: config.successThreshold || 3,
                timeout: config.timeout || 30000,
                ...config
            };

            this.states = new Map();
            this.states.CLOSED = 'closed';
            this.states.OPEN = 'open';
            this.states.HALF_OPEN = 'half_open';

            this.circuits = new Map();
        }

        /**
         * 获取或创建熔断器状态
         */
        getCircuit(name) {
            if (!this.circuits.has(name)) {
                this.circuits.set(name, {
                    state: this.states.CLOSED,
                    failureCount: 0,
                    successCount: 0,
                    lastFailureTime: null,
                    lastStateChange: Date.now()
                });
            }
            return this.circuits.get(name);
        }

        /**
         * 执行请求（带熔断保护）
         */
        async execute(name, requestFn) {
            const circuit = this.getCircuit(name);

            // 检查熔断器状态
            if (circuit.state === this.states.OPEN) {
                if (Date.now() - circuit.lastFailureTime > this.config.timeout) {
                    this.transitionTo(name, this.states.HALF_OPEN);
                } else {
                    throw new Error('Circuit breaker is OPEN');
                }
            }

            try {
                const result = await requestFn();
                this.recordSuccess(name);
                return result;
            } catch (error) {
                this.recordFailure(name);
                throw error;
            }
        }

        /**
         * 记录成功
         */
        recordSuccess(name) {
            const circuit = this.getCircuit(name);

            if (circuit.state === this.states.HALF_OPEN) {
                circuit.successCount++;
                if (circuit.successCount >= this.config.successThreshold) {
                    this.transitionTo(name, this.states.CLOSED);
                }
            } else if (circuit.state === this.states.CLOSED) {
                circuit.failureCount = 0;
            }
        }

        /**
         * 记录失败
         */
        recordFailure(name) {
            const circuit = this.getCircuit(name);

            circuit.failureCount++;
            circuit.lastFailureTime = Date.now();

            if (circuit.state === this.states.HALF_OPEN) {
                this.transitionTo(name, this.states.OPEN);
            } else if (circuit.state === this.states.CLOSED) {
                if (circuit.failureCount >= this.config.failureThreshold) {
                    this.transitionTo(name, this.states.OPEN);
                }
            }
        }

        /**
         * 状态转换
         */
        transitionTo(name, newState) {
            const circuit = this.getCircuit(name);
            circuit.state = newState;
            circuit.lastStateChange = Date.now();

            if (newState === this.states.CLOSED) {
                circuit.failureCount = 0;
                circuit.successCount = 0;
            } else if (newState === this.states.HALF_OPEN) {
                circuit.successCount = 0;
            }
        }

        /**
         * 获取熔断器状态
         */
        getState(name) {
            return this.getCircuit(name).state;
        }

        /**
         * 获取所有熔断器状态
         */
        getAllStates() {
            const result = {};
            for (const [name, circuit] of this.circuits) {
                result[name] = {
                    state: circuit.state,
                    failureCount: circuit.failureCount,
                    successCount: circuit.successCount,
                    lastStateChange: circuit.lastStateChange
                };
            }
            return result;
        }
    }

    // ============================================
    // 智能缓存系统 (Smart Cache System)
    // ============================================
    class SmartCacheSystem {
        constructor(config = {}) {
            this.config = {
                maxSize: config.maxSize || 100,
                defaultTTL: config.defaultTTL || 60000,
                cleanupInterval: config.cleanupInterval || 300000,
                ...config
            };

            this.cache = new Map();
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                size: 0
            };

            this.startCleanupTimer();
        }

        /**
         * 设置缓存
         */
        set(key, value, ttl = this.config.defaultTTL) {
            // 检查是否需要淘汰
            if (this.cache.size >= this.config.maxSize) {
                this.evictLRU();
            }

            this.cache.set(key, {
                value,
                createdAt: Date.now(),
                expiresAt: Date.now() + ttl,
                accessCount: 0,
                lastAccessed: Date.now()
            });

            this.stats.size = this.cache.size;
        }

        /**
         * 获取缓存
         */
        get(key) {
            const entry = this.cache.get(key);

            if (!entry) {
                this.stats.misses++;
                return null;
            }

            // 检查是否过期
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(key);
                this.stats.misses++;
                this.stats.evictions++;
                return null;
            }

            // 更新访问统计
            entry.accessCount++;
            entry.lastAccessed = Date.now();

            this.stats.hits++;
            return entry.value;
        }

        /**
         * 删除缓存
         */
        delete(key) {
            const result = this.cache.delete(key);
            this.stats.size = this.cache.size;
            return result;
        }

        /**
         * 清空缓存
         */
        clear() {
            this.cache.clear();
            this.stats.size = 0;
        }

        /**
         * LRU淘汰
         */
        evictLRU() {
            let oldestKey = null;
            let oldestTime = Infinity;

            for (const [key, entry] of this.cache) {
                if (entry.lastAccessed < oldestTime) {
                    oldestTime = entry.lastAccessed;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.stats.evictions++;
            }
        }

        /**
         * 启动清理定时器
         */
        startCleanupTimer() {
            this.cleanupTimer = setInterval(() => {
                this.cleanup();
            }, this.config.cleanupInterval);
        }

        /**
         * 清理过期缓存
         */
        cleanup() {
            const now = Date.now();
            let evicted = 0;

            for (const [key, entry] of this.cache) {
                if (now > entry.expiresAt) {
                    this.cache.delete(key);
                    evicted++;
                }
            }

            this.stats.evictions += evicted;
            this.stats.size = this.cache.size;

            return evicted;
        }

        /**
         * 获取缓存统计
         */
        getStats() {
            const total = this.stats.hits + this.stats.misses;
            return {
                ...this.stats,
                hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : 'N/A'
            };
        }

        /**
         * 获取缓存键列表
         */
        keys() {
            return Array.from(this.cache.keys());
        }

        /**
         * 检查键是否存在
         */
        has(key) {
            const entry = this.cache.get(key);
            if (!entry) return false;
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(key);
                return false;
            }
            return true;
        }

        /**
         * 获取或设置（如果不存在则计算）
         */
        async getOrSet(key, computeFn, ttl) {
            const cached = this.get(key);
            if (cached !== null) {
                return cached;
            }

            const value = await computeFn();
            this.set(key, value, ttl);
            return value;
        }

        /**
         * 批量获取
         */
        mget(keys) {
            const result = {};
            for (const key of keys) {
                result[key] = this.get(key);
            }
            return result;
        }

        /**
         * 批量设置
         */
        mset(entries, ttl) {
            for (const [key, value] of Object.entries(entries)) {
                this.set(key, value, ttl);
            }
        }
    }

    // ============================================
    // 负载均衡器 (Load Balancer)
    // ============================================
    class LoadBalancer {
        constructor(config = {}) {
            this.config = {
                strategy: config.strategy || 'round_robin',
                healthCheckInterval: config.healthCheckInterval || 30000,
                healthCheckTimeout: config.healthCheckTimeout || 5000,
                ...config
            };

            this.endpoints = [];
            this.currentIndex = 0;
            this.healthStatus = new Map();
            this.weights = new Map();
        }

        /**
         * 添加端点
         */
        addEndpoint(url, options = {}) {
            const endpoint = {
                url,
                weight: options.weight || 1,
                healthy: true,
                addedAt: Date.now()
            };

            this.endpoints.push(endpoint);
            this.weights.set(url, endpoint.weight);
            this.healthStatus.set(url, true);
        }

        /**
         * 移除端点
         */
        removeEndpoint(url) {
            this.endpoints = this.endpoints.filter(e => e.url !== url);
            this.weights.delete(url);
            this.healthStatus.delete(url);
        }

        /**
         * 获取下一个端点
         */
        getNextEndpoint() {
            const healthyEndpoints = this.endpoints.filter(e => e.healthy);

            if (healthyEndpoints.length === 0) {
                throw new Error('No healthy endpoints available');
            }

            switch (this.config.strategy) {
                case 'round_robin':
                    return this.roundRobin(healthyEndpoints);
                case 'weighted':
                    return this.weighted(healthyEndpoints);
                case 'least_connections':
                    return this.leastConnections(healthyEndpoints);
                case 'random':
                    return this.random(healthyEndpoints);
                default:
                    return this.roundRobin(healthyEndpoints);
            }
        }

        roundRobin(endpoints) {
            const endpoint = endpoints[this.currentIndex % endpoints.length];
            this.currentIndex++;
            return endpoint;
        }

        weighted(endpoints) {
            const totalWeight = endpoints.reduce((sum, e) => sum + this.weights.get(e.url), 0);
            let random = Math.random() * totalWeight;

            for (const endpoint of endpoints) {
                random -= this.weights.get(endpoint.url);
                if (random <= 0) {
                    return endpoint;
                }
            }

            return endpoints[0];
        }

        leastConnections(endpoints) {
            // 简化实现：选择最后一个使用的（模拟最少连接）
            return endpoints.reduce((min, e) => 
                (e.connectionCount || 0) < (min.connectionCount || 0) ? e : min
            );
        }

        random(endpoints) {
            return endpoints[Math.floor(Math.random() * endpoints.length)];
        }

        /**
         * 标记端点健康状态
         */
        markHealth(url, healthy) {
            const endpoint = this.endpoints.find(e => e.url === url);
            if (endpoint) {
                endpoint.healthy = healthy;
                this.healthStatus.set(url, healthy);
            }
        }

        /**
         * 获取健康状态
         */
        getHealthStatus() {
            return Object.fromEntries(this.healthStatus);
        }

        /**
         * 获取可用端点数
         */
        getAvailableCount() {
            return this.endpoints.filter(e => e.healthy).length;
        }
    }

    // ============================================
    // API网关 (API Gateway)
    // ============================================
    class APIGateway {
        constructor(config = {}) {
            this.router = new RequestRouter(config.router);
            this.rateLimiter = new RateLimiter(config.rateLimiter);
            this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
            this.cache = new SmartCacheSystem(config.cache);
            this.loadBalancer = new LoadBalancer(config.loadBalancer);

            this.setupDefaults();
        }

        /**
         * 设置默认中间件
         */
        setupDefaults() {
            // 限流中间件
            this.router.use((config) => {
                const identifier = this.getIdentifier(config);
                const rateCheck = this.rateLimiter.isAllowed(identifier);

                if (!rateCheck.allowed) {
                    throw new Error(`Rate limited. Retry after ${rateCheck.retryAfter}ms`);
                }

                return config;
            });

            // 缓存中间件
            this.router.addRequestInterceptor(async (config) => {
                if (config.method === 'GET' && config.cache !== false) {
                    const cacheKey = this.getCacheKey(config);
                    const cached = this.cache.get(cacheKey);
                    if (cached !== null) {
                        return { ...config, cached: true, cachedData: cached };
                    }
                }
                return config;
            });

            // 响应缓存
            this.router.addResponseInterceptor(async (data, config) => {
                if (config?.method === 'GET' && config?.cache !== false) {
                    const cacheKey = this.getCacheKey(config);
                    this.cache.set(cacheKey, data);
                }
                return data;
            });
        }

        /**
         * 获取标识符
         */
        getIdentifier(config) {
            return config.headers['X-User-ID'] || 
                   config.headers['X-Session-ID'] || 
                   'anonymous';
        }

        /**
         * 获取缓存键
         */
        getCacheKey(config) {
            return `${config.method}:${config.url}:${JSON.stringify(config.body || {})}`;
        }

        /**
         * 发送请求（带所有保护机制）
         */
        async request(method, path, data, options = {}) {
            const serviceName = options.service || 'default';

            try {
                return await this.circuitBreaker.execute(serviceName, async () => {
                    const result = await this.router.request(method, path, data, options);

                    if (!result.success) {
                        throw new Error(result.error);
                    }

                    return result;
                });
            } catch (error) {
                if (error.message.includes('Circuit breaker')) {
                    return { success: false, error: 'Service temporarily unavailable' };
                }
                throw error;
            }
        }

        /**
         * 获取网关统计
         */
        getStats() {
            return {
                cache: this.cache.getStats(),
                rateLimiter: this.rateLimiter.getStats(),
                circuitBreakers: this.circuitBreaker.getAllStates(),
                loadBalancer: {
                    totalEndpoints: this.loadBalancer.endpoints.length,
                    availableEndpoints: this.loadBalancer.getAvailableCount()
                }
            };
        }

        // 便捷方法
        get(path, options) { return this.request('GET', path, null, options); }
        post(path, data, options) { return this.request('POST', path, data, options); }
        put(path, data, options) { return this.request('PUT', path, data, options); }
        delete(path, options) { return this.request('DELETE', path, null, options); }
    }

    // 导出
    global.APIGateway = {
        RequestRouter,
        RateLimiter,
        CircuitBreaker,
        SmartCacheSystem,
        LoadBalancer,
        APIGateway
    };

    // 便捷创建
    global.createAPIGateway = function(config = {}) {
        return new APIGateway(config);
    };

})(typeof window !== 'undefined' ? window : global);

/**
 * 性能监控仪表盘
 * Performance Monitoring Dashboard
 * 
 * 包含：性能指标收集、FPS监控、内存追踪、网络请求监控、用户体验指标
 * 
 * 来源：Soul Auto-Evolution 循环12
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // 性能指标收集器 (Performance Metrics Collector)
    // ============================================
    class PerformanceMetricsCollector {
        constructor() {
            this.metrics = {
                timing: {},
                resources: [],
                memory: {},
                custom: new Map()
            };

            this.observers = [];
            this.startTime = performance.now();

            this.collectTimingMetrics();
            this.setupObservers();
        }

        /**
         * 收集页面加载时间指标
         */
        collectTimingMetrics() {
            if (!performance.timing) return;

            const timing = performance.timing;
            this.metrics.timing = {
                // DNS查询时间
                dns: timing.domainLookupEnd - timing.domainLookupStart,
                // TCP连接时间
                tcp: timing.connectEnd - timing.connectStart,
                // 请求响应时间
                request: timing.responseStart - timing.requestStart,
                // 响应时间
                response: timing.responseEnd - timing.responseStart,
                // DOM解析时间
                domParsing: timing.domInteractive - timing.responseEnd,
                // DOM完成时间
                domComplete: timing.domComplete - timing.domInteractive,
                // 页面加载总时间
                pageLoad: timing.loadEventEnd - timing.navigationStart,
                // 首次绘制时间
                firstPaint: this.getFirstPaint(),
                // 首次内容绘制
                firstContentfulPaint: this.getFirstContentfulPaint(),
                // 可交互时间
                timeToInteractive: timing.domInteractive - timing.navigationStart
            };
        }

        getFirstPaint() {
            const entries = performance.getEntriesByType('paint');
            const fp = entries.find(e => e.name === 'first-paint');
            return fp ? fp.startTime : null;
        }

        getFirstContentfulPaint() {
            const entries = performance.getEntriesByType('paint');
            const fcp = entries.find(e => e.name === 'first-contentful-paint');
            return fcp ? fcp.startTime : null;
        }

        /**
         * 设置性能观察者
         */
        setupObservers() {
            // 观察资源加载
            if (PerformanceObserver) {
                try {
                    const resourceObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        for (const entry of entries) {
                            this.metrics.resources.push({
                                name: entry.name,
                                type: entry.initiatorType,
                                duration: entry.duration,
                                size: entry.transferSize || 0,
                                startTime: entry.startTime
                            });
                        }
                    });
                    resourceObserver.observe({ entryTypes: ['resource'] });
                    this.observers.push(resourceObserver);
                } catch (e) {
                    // 不支持
                    if (typeof Logger !== 'undefined') {
                        Logger.debug('PerformanceMonitoring', 'Resource observer not supported', e);
                    }
                }

                // 观察长任务
                try {
                    const longTaskObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        for (const entry of entries) {
                            this.recordCustomMetric('longTask', {
                                duration: entry.duration,
                                startTime: entry.startTime,
                                name: entry.name
                            });
                        }
                    });
                    longTaskObserver.observe({ entryTypes: ['longtask'] });
                    this.observers.push(longTaskObserver);
                } catch (e) {
                    // 不支持
                    if (typeof Logger !== 'undefined') {
                        Logger.debug('PerformanceMonitoring', 'Long task observer not supported', e);
                    }
                }
            }
        }

        /**
         * 记录自定义指标
         */
        recordCustomMetric(name, value) {
            if (!this.metrics.custom.has(name)) {
                this.metrics.custom.set(name, []);
            }
            this.metrics.custom.get(name).push({
                value,
                timestamp: Date.now()
            });
        }

        /**
         * 开始计时
         */
        startTimer(name) {
            this.metrics.custom.set(`${name}_start`, performance.now());
        }

        /**
         * 结束计时
         */
        endTimer(name) {
            const startTime = this.metrics.custom.get(`${name}_start`);
            if (startTime) {
                const duration = performance.now() - startTime;
                this.recordCustomMetric(name, { duration });
                this.metrics.custom.delete(`${name}_start`);
                return duration;
            }
            return null;
        }

        /**
         * 获取所有指标
         */
        getAllMetrics() {
            return {
                ...this.metrics,
                custom: Object.fromEntries(this.metrics.custom),
                uptime: performance.now() - this.startTime
            };
        }

        /**
         * 清理观察者
         */
        cleanup() {
            for (const observer of this.observers) {
                observer.disconnect();
            }
            this.observers = [];
        }
    }

    // ============================================
    // FPS监控器 (FPS Monitor)
    // ============================================
    class FPSMonitor {
        constructor(config = {}) {
            this.config = {
                sampleSize: config.sampleSize || 60,
                warningThreshold: config.warningThreshold || 30,
                criticalThreshold: config.criticalThreshold || 15,
                ...config
            };

            this.frames = [];
            this.lastFrameTime = performance.now();
            this.isRunning = false;
            this.rafId = null;

            this.callbacks = {
                onFrame: [],
                onWarning: [],
                onCritical: []
            };
        }

        /**
         * 开始监控
         */
        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.tick();
        }

        /**
         * 停止监控
         */
        stop() {
            this.isRunning = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }

        /**
         * 帧循环
         */
        tick() {
            if (!this.isRunning) return;

            const now = performance.now();
            const delta = now - this.lastFrameTime;
            this.lastFrameTime = now;

            const fps = 1000 / delta;
            this.frames.push(fps);

            if (this.frames.length > this.config.sampleSize) {
                this.frames.shift();
            }

            // 触发回调
            this.callbacks.onFrame.forEach(cb => cb(fps));

            // 检查阈值
            if (fps < this.config.criticalThreshold) {
                this.callbacks.onCritical.forEach(cb => cb(fps));
            } else if (fps < this.config.warningThreshold) {
                this.callbacks.onWarning.forEach(cb => cb(fps));
            }

            this.rafId = requestAnimationFrame(() => this.tick());
        }

        /**
         * 获取当前FPS
         */
        getCurrentFPS() {
            return this.frames.length > 0 ? this.frames[this.frames.length - 1] : 0;
        }

        /**
         * 获取平均FPS
         */
        getAverageFPS() {
            if (this.frames.length === 0) return 0;
            return this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        }

        /**
         * 获取FPS统计
         */
        getStats() {
            if (this.frames.length === 0) return null;

            const sorted = [...this.frames].sort((a, b) => a - b);
            return {
                current: this.getCurrentFPS(),
                average: this.getAverageFPS(),
                min: sorted[0],
                max: sorted[sorted.length - 1],
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)]
            };
        }

        /**
         * 注册回调
         */
        on(event, callback) {
            if (this.callbacks[event]) {
                this.callbacks[event].push(callback);
            }
        }
    }

    // ============================================
    // 内存追踪器 (Memory Tracker)
    // ============================================
    class MemoryTracker {
        constructor(config = {}) {
            this.config = {
                sampleInterval: config.sampleInterval || 5000,
                maxSamples: config.maxSamples || 100,
                warningThreshold: config.warningThreshold || 0.8, // 80% of heap limit
                ...config
            };

            this.samples = [];
            this.intervalId = null;
            this.isTracking = false;
        }

        /**
         * 开始追踪
         */
        start() {
            if (this.isTracking) return;
            if (!performance.memory) {
                Logger?.warn('Memory API not available');
                return;
            }

            this.isTracking = true;
            this.sample();
            this.intervalId = setInterval(() => this.sample(), this.config.sampleInterval);
        }

        /**
         * 停止追踪
         */
        stop() {
            this.isTracking = false;
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        /**
         * 采样
         */
        sample() {
            if (!performance.memory) return;

            const memory = performance.memory;
            const sample = {
                timestamp: Date.now(),
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };

            this.samples.push(sample);

            if (this.samples.length > this.config.maxSamples) {
                this.samples.shift();
            }

            // 检查内存警告
            if (sample.usagePercentage > this.config.warningThreshold * 100) {
                this.onMemoryWarning(sample);
            }

            return sample;
        }

        /**
         * 内存警告处理
         */
        onMemoryWarning(sample) {
            Logger?.warn('Memory usage high:', sample.usagePercentage.toFixed(2) + '%');
        }

        /**
         * 获取当前内存使用
         */
        getCurrentMemory() {
            return this.samples.length > 0 ? this.samples[this.samples.length - 1] : null;
        }

        /**
         * 获取内存趋势
         */
        getMemoryTrend() {
            if (this.samples.length < 2) return 'stable';

            const recent = this.samples.slice(-10);
            const older = this.samples.slice(-20, -10);

            if (older.length === 0) return 'insufficient_data';

            const recentAvg = recent.reduce((a, s) => a + s.usedJSHeapSize, 0) / recent.length;
            const olderAvg = older.reduce((a, s) => a + s.usedJSHeapSize, 0) / older.length;

            const change = (recentAvg - olderAvg) / olderAvg;

            if (change > 0.1) return 'increasing';
            if (change < -0.1) return 'decreasing';
            return 'stable';
        }

        /**
         * 获取内存统计
         */
        getStats() {
            if (this.samples.length === 0) return null;

            const usedSizes = this.samples.map(s => s.usedJSHeapSize);
            return {
                current: this.getCurrentMemory(),
                min: Math.min(...usedSizes),
                max: Math.max(...usedSizes),
                average: usedSizes.reduce((a, b) => a + b, 0) / usedSizes.length,
                trend: this.getMemoryTrend(),
                sampleCount: this.samples.length
            };
        }
    }

    // ============================================
    // 网络请求监控器 (Network Request Monitor)
    // ============================================
    class NetworkRequestMonitor {
        constructor() {
            this.requests = [];
            this.maxRequests = 200;

            this.interceptXHR();
            this.observeFetch();
        }

        /**
         * 拦截XHR请求
         */
        interceptXHR() {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;
            const self = this;

            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._monitorData = {
                    method,
                    url,
                    startTime: null
                };
                return originalOpen.call(this, method, url, ...args);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                if (this._monitorData) {
                    this._monitorData.startTime = performance.now();
                    
                    this.addEventListener('load', function() {
                        self.recordRequest({
                            type: 'xhr',
                            method: this._monitorData.method,
                            url: this._monitorData.url,
                            status: this.status,
                            duration: performance.now() - this._monitorData.startTime,
                            size: this.responseText.length,
                            success: this.status >= 200 && this.status < 300
                        });
                    });

                    this.addEventListener('error', function() {
                        self.recordRequest({
                            type: 'xhr',
                            method: this._monitorData.method,
                            url: this._monitorData.url,
                            status: 0,
                            duration: performance.now() - this._monitorData.startTime,
                            error: true,
                            success: false
                        });
                    });
                }
                return originalSend.apply(this, args);
            };
        }

        /**
         * 通过 PerformanceObserver 监听 fetch 请求（不再 monkey-patch window.fetch）
         * 浏览器自动报告 resource timing entries，无需重写全局 fetch。
         */
        observeFetch() {
            if (typeof PerformanceObserver === 'undefined') {
                // 旧浏览器或 SSR 环境：跳过
                return;
            }
            const self = this;
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        // 仅关注 fetch 请求（initiatorType === 'fetch'）
                        if (entry.initiatorType !== 'fetch') continue;
                        self.recordRequest({
                            type: 'fetch',
                            method: 'GET',  // PerformanceResourceTiming 不暴露方法
                            url: entry.name,
                            status: entry.responseStatus || 0,
                            duration: entry.duration,
                            size: entry.transferSize || 0,
                            success: entry.responseStatus >= 200 && entry.responseStatus < 300
                        });
                    }
                });
                observer.observe({ entryTypes: ['resource'] });
            } catch (e) {
                // PerformanceObserver 可能不可用（如隐私模式）
                if (typeof Logger !== 'undefined') {
                    Logger.warn('PerformanceMonitor', 'PerformanceObserver unavailable:', e);
                }
            }
        }

        /**
         * 记录请求
         */
        recordRequest(data) {
            this.requests.push({
                ...data,
                timestamp: Date.now()
            });

            if (this.requests.length > this.maxRequests) {
                this.requests.shift();
            }
        }

        /**
         * 获取请求统计
         */
        getStats() {
            if (this.requests.length === 0) return null;

            const successful = this.requests.filter(r => r.success);
            const failed = this.requests.filter(r => !r.success);
            const durations = successful.map(r => r.duration);

            return {
                total: this.requests.length,
                successful: successful.length,
                failed: failed.length,
                successRate: (successful.length / this.requests.length) * 100,
                avgDuration: durations.length > 0 
                    ? durations.reduce((a, b) => a + b, 0) / durations.length 
                    : 0,
                minDuration: durations.length > 0 ? Math.min(...durations) : 0,
                maxDuration: durations.length > 0 ? Math.max(...durations) : 0
            };
        }

        /**
         * 获取慢请求
         */
        getSlowRequests(threshold = 1000) {
            return this.requests.filter(r => r.duration > threshold);
        }
    }

    // ============================================
    // 错误追踪器 (Error Tracker)
    // ============================================
    class ErrorTracker {
        constructor(config = {}) {
            this.config = {
                maxErrors: config.maxErrors || 50,
                captureStackTrace: config.captureStackTrace !== false,
                ...config
            };

            this.errors = [];
            this.setupErrorHandlers();
        }

        /**
         * 设置错误处理器
         */
        setupErrorHandlers() {
            // 全局错误
            window.addEventListener('error', (event) => {
                this.captureError({
                    type: 'error',
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error?.stack
                });
            });

            // Promise未捕获错误
            window.addEventListener('unhandledrejection', (event) => {
                this.captureError({
                    type: 'unhandledrejection',
                    message: event.reason?.message || String(event.reason),
                    stack: event.reason?.stack
                });
            });

            // 控制台错误
            const originalConsoleError = console.error;
            console.error = (...args) => {
                this.captureError({
                    type: 'console.error',
                    message: args.map(a => String(a)).join(' ')
                });
                originalConsoleError.apply(console, args);
            };
        }

        /**
         * 捕获错误
         */
        captureError(error) {
            const record = {
                ...error,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            this.errors.push(record);

            if (this.errors.length > this.config.maxErrors) {
                this.errors.shift();
            }

            return record;
        }

        /**
         * 手动记录错误
         */
        logError(message, context = {}) {
            return this.captureError({
                type: 'manual',
                message,
                ...context
            });
        }

        /**
         * 获取错误统计
         */
        getStats() {
            if (this.errors.length === 0) return null;

            const byType = {};
            for (const error of this.errors) {
                byType[error.type] = (byType[error.type] || 0) + 1;
            }

            return {
                total: this.errors.length,
                byType,
                recent: this.errors.slice(-5)
            };
        }

        /**
         * 清空错误记录
         */
        clear() {
            this.errors = [];
        }
    }

    // ============================================
    // 性能监控仪表盘 (Performance Dashboard)
    // ============================================
    class PerformanceDashboard {
        constructor(config = {}) {
            this.config = {
                autoStart: config.autoStart !== false,
                updateInterval: config.updateInterval || 1000,
                ...config
            };

            this.metricsCollector = new PerformanceMetricsCollector();
            this.fpsMonitor = new FPSMonitor(config.fps);
            this.memoryTracker = new MemoryTracker(config.memory);
            this.networkMonitor = new NetworkRequestMonitor();
            this.errorTracker = new ErrorTracker(config.error);

            this.updateTimer = null;
            this.listeners = new Map();

            if (this.config.autoStart) {
                this.start();
            }
        }

        /**
         * 启动监控
         */
        start() {
            this.fpsMonitor.start();
            this.memoryTracker.start();
            this.updateTimer = setInterval(() => this.update(), this.config.updateInterval);
        }

        /**
         * 停止监控
         */
        stop() {
            this.fpsMonitor.stop();
            this.memoryTracker.stop();
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = null;
            }
        }

        /**
         * 更新数据
         */
        update() {
            const data = this.getDashboardData();
            this.emit('update', data);
        }

        /**
         * 获取仪表盘数据
         */
        getDashboardData() {
            return {
                timestamp: Date.now(),
                fps: this.fpsMonitor.getStats(),
                memory: this.memoryTracker.getStats(),
                network: this.networkMonitor.getStats(),
                errors: this.errorTracker.getStats(),
                timing: this.metricsCollector.metrics.timing,
                uptime: performance.now() - this.metricsCollector.startTime
            };
        }

        /**
         * 生成性能报告
         */
        generateReport() {
            const data = this.getDashboardData();

            return {
                summary: {
                    fpsStatus: this.evaluateFPS(data.fps),
                    memoryStatus: this.evaluateMemory(data.memory),
                    networkStatus: this.evaluateNetwork(data.network),
                    errorCount: data.errors?.total || 0
                },
                details: data,
                recommendations: this.generateRecommendations(data)
            };
        }

        evaluateFPS(fps) {
            if (!fps) return 'unknown';
            if (fps.average >= 55) return 'excellent';
            if (fps.average >= 45) return 'good';
            if (fps.average >= 30) return 'fair';
            return 'poor';
        }

        evaluateMemory(memory) {
            if (!memory) return 'unknown';
            if (memory.current?.usagePercentage < 50) return 'good';
            if (memory.current?.usagePercentage < 75) return 'fair';
            return 'high';
        }

        evaluateNetwork(network) {
            if (!network) return 'unknown';
            if (network.successRate >= 99) return 'excellent';
            if (network.successRate >= 95) return 'good';
            if (network.successRate >= 90) return 'fair';
            return 'poor';
        }

        generateRecommendations(data) {
            const recommendations = [];

            if (data.fps?.average < 30) {
                recommendations.push({
                    type: 'performance',
                    priority: 'high',
                    message: 'FPS较低，建议检查渲染性能，减少DOM操作或使用requestAnimationFrame'
                });
            }

            if (data.memory?.trend === 'increasing') {
                recommendations.push({
                    type: 'memory',
                    priority: 'high',
                    message: '内存使用呈上升趋势，可能存在内存泄漏，建议检查事件监听器和闭包'
                });
            }

            if (data.network?.successRate < 95) {
                recommendations.push({
                    type: 'network',
                    priority: 'medium',
                    message: '网络请求失败率较高，建议添加重试机制和错误处理'
                });
            }

            if (data.errors?.total > 10) {
                recommendations.push({
                    type: 'error',
                    priority: 'high',
                    message: '存在较多错误，建议优先修复控制台错误'
                });
            }

            return recommendations;
        }

        /**
         * 事件监听
         */
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }

        /**
         * 触发事件
         */
        emit(event, data) {
            if (this.listeners.has(event)) {
                for (const callback of this.listeners.get(event)) {
                    callback(data);
                }
            }
        }

        /**
         * 清理资源
         */
        destroy() {
            this.stop();
            this.metricsCollector.cleanup();
            this.listeners.clear();
        }
    }

    // 导出
    global.PerformanceMonitoring = {
        PerformanceMetricsCollector,
        FPSMonitor,
        MemoryTracker,
        NetworkRequestMonitor,
        ErrorTracker,
        PerformanceDashboard
    };

    // 便捷创建
    global.createPerformanceDashboard = function(config = {}) {
        return new PerformanceDashboard(config);
    };

})(typeof window !== 'undefined' ? window : global);

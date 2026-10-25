/**
 * 移动端适配模块 (Mobile Adaptation Module)
 * 认知陷阱平台 - Soul进化系统 v3.1.0
 * 
 * 功能特性:
 * - 响应式布局检测与适配
 * - 触摸交互优化
 * - 移动端UI适配
 * - 设备特性检测
 * 
 * @author Soul Evolution System
 * @version 3.1.0
 */

(function(root, factory) {
    'use strict';
    // UMD模块定义
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MobileAdaptation = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    'use strict';

    // ========================================
    // 设备检测模块
    // ========================================
    
    /**
     * 设备检测器
     * 检测设备类型、操作系统、浏览器等特性
     */
    const DeviceDetector = {
        // 用户代理字符串
        ua: navigator.userAgent.toLowerCase(),
        
        // 屏幕信息
        screen: {
            width: window.screen.width,
            height: window.screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown'
        },
        
        /**
         * 检测是否为移动设备
         * @returns {boolean}
         */
        isMobile: function() {
            return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(this.ua);
        },
        
        /**
         * 检测是否为平板设备
         * @returns {boolean}
         */
        isTablet: function() {
            return /ipad|android(?!.*mobile)|tablet/i.test(this.ua) ||
                   (this.isTouch() && window.screen.width >= 768);
        },
        
        /**
         * 检测是否为触摸设备
         * @returns {boolean}
         */
        isTouch: function() {
            return 'ontouchstart' in window ||
                   navigator.maxTouchPoints > 0 ||
                   navigator.msMaxTouchPoints > 0;
        },
        
        /**
         * 检测操作系统
         * @returns {string} 操作系统名称
         */
        getOS: function() {
            const osPatterns = {
                'iOS': /iphone|ipad|ipod/i,
                'Android': /android/i,
                'Windows': /windows nt/i,
                'Mac OS': /mac os x/i,
                'Linux': /linux/i,
                'Chrome OS': /cros/i
            };
            
            for (const [os, pattern] of Object.entries(osPatterns)) {
                if (pattern.test(this.ua)) {
                    return os;
                }
            }
            return 'Unknown';
        },
        
        /**
         * 检测浏览器
         * @returns {string} 浏览器名称
         */
        getBrowser: function() {
            const browserPatterns = {
                'Chrome': /chrome\/[\d.]+/i,
                'Safari': /safari\/[\d.]+/i,
                'Firefox': /firefox\/[\d.]+/i,
                'Edge': /edg\/[\d.]+/i,
                'Opera': /opr\/[\d.]+|opera/i,
                'IE': /msie|trident/i,
                'WeChat': /micromessenger/i,
                'QQ': /qq\//i,
                'Weibo': /weibo/i
            };
            
            for (const [browser, pattern] of Object.entries(browserPatterns)) {
                if (pattern.test(this.ua)) {
                    return browser;
                }
            }
            return 'Unknown';
        },
        
        /**
         * 获取设备完整信息
         * @returns {Object} 设备信息对象
         */
        getDeviceInfo: function() {
            return {
                type: this.isMobile() ? 'mobile' : (this.isTablet() ? 'tablet' : 'desktop'),
                os: this.getOS(),
                browser: this.getBrowser(),
                isTouch: this.isTouch(),
                screen: this.screen,
                language: navigator.language || navigator.userLanguage,
                connection: this.getConnectionInfo()
            };
        },
        
        /**
         * 获取网络连接信息
         * @returns {Object} 连接信息
         */
        getConnectionInfo: function() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                return {
                    type: connection.effectiveType || 'unknown',
                    downlink: connection.downlink || 0,
                    rtt: connection.rtt || 0,
                    saveData: connection.saveData || false
                };
            }
            return { type: 'unknown' };
        }
    };

    // ========================================
    // 响应式布局模块
    // ========================================
    
    /**
     * 响应式布局管理器
     * 处理不同屏幕尺寸的布局适配
     */
    const ResponsiveLayout = {
        // 断点配置
        breakpoints: {
            xs: 0,      // 超小屏幕 (手机)
            sm: 576,    // 小屏幕 (手机横屏)
            md: 768,    // 中等屏幕 (平板)
            lg: 992,    // 大屏幕 (桌面)
            xl: 1200,   // 超大屏幕
            xxl: 1400   // 超超大屏幕
        },
        
        // 当前断点
        currentBreakpoint: null,
        
        // 监听器列表
        listeners: [],
        
        /**
         * 初始化响应式布局
         */
        init: function() {
            this.updateBreakpoint();
            this.setupResizeListener();
            this.setupOrientationListener();
            Logger?.debug('[MobileAdaptation] 响应式布局初始化完成，当前断点:', this.currentBreakpoint);
        },
        
        /**
         * 更新当前断点
         */
        updateBreakpoint: function() {
            const width = window.innerWidth;
            let newBreakpoint = 'xs';
            
            for (const [name, size] of Object.entries(this.breakpoints)) {
                if (width >= size) {
                    newBreakpoint = name;
                }
            }
            
            if (this.currentBreakpoint !== newBreakpoint) {
                const oldBreakpoint = this.currentBreakpoint;
                this.currentBreakpoint = newBreakpoint;
                this.notifyListeners(oldBreakpoint, newBreakpoint);
            }
        },
        
        /**
         * 设置窗口大小变化监听
         */
        setupResizeListener: function() {
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.updateBreakpoint();
                    this.adjustLayout();
                }, 150);
            });
        },
        
        /**
         * 设置屏幕方向变化监听
         */
        setupOrientationListener: function() {
            if (window.screen.orientation) {
                window.screen.orientation.addEventListener('change', () => {
                    this.handleOrientationChange();
                });
            } else {
                // 兼容旧API
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => this.handleOrientationChange(), 100);
                });
            }
        },
        
        /**
         * 处理屏幕方向变化
         */
        handleOrientationChange: function() {
            const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
            Logger?.debug('[MobileAdaptation] 屏幕方向变化:', orientation);
            
            // 触发自定义事件
            window.dispatchEvent(new CustomEvent('orientationChanged', {
                detail: { orientation: orientation }
            }));
            
            this.adjustLayout();
        },
        
        /**
         * 调整布局
         */
        adjustLayout: function() {
            const isMobile = this.isMobileView();
            
            // 调整导航栏
            this.adjustNavigation(isMobile);
            
            // 调整卡片布局
            this.adjustCards(isMobile);
            
            // 调整字体大小
            this.adjustTypography(isMobile);
            
            // 调整模态框
            this.adjustModals(isMobile);
        },
        
        /**
         * 检测是否为移动端视图
         * @returns {boolean}
         */
        isMobileView: function() {
            return ['xs', 'sm'].includes(this.currentBreakpoint);
        },
        
        /**
         * 调整导航栏
         * @param {boolean} isMobile 是否为移动端
         */
        adjustNavigation: function(isMobile) {
            const nav = document.querySelector('.main-nav') || document.querySelector('nav');
            if (!nav) return;
            
            if (isMobile) {
                nav.classList.add('mobile-nav');
                nav.classList.remove('desktop-nav');
            } else {
                nav.classList.remove('mobile-nav');
                nav.classList.add('desktop-nav');
            }
        },
        
        /**
         * 调整卡片布局
         * @param {boolean} isMobile 是否为移动端
         */
        adjustCards: function(isMobile) {
            const cards = document.querySelectorAll('.scenario-card, .card');
            cards.forEach(card => {
                if (isMobile) {
                    card.classList.add('mobile-card');
                } else {
                    card.classList.remove('mobile-card');
                }
            });
        },
        
        /**
         * 调整字体大小
         * @param {boolean} isMobile 是否为移动端
         */
        adjustTypography: function(isMobile) {
            document.body.classList.toggle('mobile-typography', isMobile);
        },
        
        /**
         * 调整模态框
         * @param {boolean} isMobile 是否为移动端
         */
        adjustModals: function(isMobile) {
            const modals = document.querySelectorAll('.modal, .modal-dialog');
            modals.forEach(modal => {
                modal.classList.toggle('mobile-modal', isMobile);
            });
        },
        
        /**
         * 添加断点变化监听器
         * @param {Function} callback 回调函数
         */
        addListener: function(callback) {
            this.listeners.push(callback);
        },
        
        /**
         * 通知所有监听器
         * @param {string} oldBreakpoint 旧断点
         * @param {string} newBreakpoint 新断点
         */
        notifyListeners: function(oldBreakpoint, newBreakpoint) {
            this.listeners.forEach(callback => {
                try {
                    callback(oldBreakpoint, newBreakpoint);
                } catch (e) {
                    if (typeof Logger !== 'undefined') {
                        Logger.error('MobileAdaptation', '监听器执行错误:', e);
                    }
                }
            });
        },
        
        /**
         * 获取当前断点
         * @returns {string}
         */
        getBreakpoint: function() {
            return this.currentBreakpoint;
        }
    };

    // ========================================
    // 触摸交互优化模块
    // ========================================
    
    /**
     * 触摸交互优化器
     * 提供优化的触摸交互体验
     */
    const TouchOptimizer = {
        // 触摸状态
        touchState: {
            startX: 0,
            startY: 0,
            startTime: 0,
            isSwiping: false,
            target: null
        },
        
        // 滑动配置
        swipeConfig: {
            threshold: 50,      // 滑动阈值（像素）
            timeout: 300,       // 滑动超时（毫秒）
            direction: 'all'    // 滑动方向: all, horizontal, vertical
        },
        
        // 手势回调
        gestures: {
            swipeLeft: [],
            swipeRight: [],
            swipeUp: [],
            swipeDown: [],
            tap: [],
            longPress: []
        },
        
        // 长按计时器
        longPressTimer: null,
        
        /**
         * 初始化触摸优化
         */
        init: function() {
            if (!DeviceDetector.isTouch()) {
                Logger?.debug('[MobileAdaptation] 非触摸设备，跳过触摸优化');
                return;
            }
            
            this.setupTouchEvents();
            this.preventDoubleTapZoom();
            this.optimizeClickDelay();
            Logger?.debug('[MobileAdaptation] 触摸交互优化完成');
        },
        
        /**
         * 设置触摸事件
         */
        setupTouchEvents: function() {
            document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        },
        
        /**
         * 处理触摸开始
         * @param {TouchEvent} e 触摸事件
         */
        handleTouchStart: function(e) {
            const touch = e.touches[0];
            
            this.touchState = {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now(),
                isSwiping: false,
                target: e.target
            };
            
            // 开始长按检测
            this.startLongPressDetection(e.target);
            
            // 标记触摸元素
            e.target.classList.add('touch-active');
        },
        
        /**
         * 处理触摸移动
         * @param {TouchEvent} e 触摸事件
         */
        handleTouchMove: function(e) {
            if (!this.touchState.target) return;
            
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchState.startX;
            const deltaY = touch.clientY - this.touchState.startY;
            
            // 检测是否开始滑动
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                this.touchState.isSwiping = true;
                this.cancelLongPress();
                
                // 触发滑动预览
                this.triggerSwipePreview(deltaX, deltaY);
            }
        },
        
        /**
         * 处理触摸结束
         * @param {TouchEvent} e 触摸事件
         */
        handleTouchEnd: function(e) {
            if (!this.touchState.target) return;
            
            this.cancelLongPress();
            this.touchState.target.classList.remove('touch-active');
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchState.startX;
            const deltaY = touch.clientY - this.touchState.startY;
            const duration = Date.now() - this.touchState.startTime;
            
            // 判断手势类型
            if (this.touchState.isSwiping) {
                this.handleSwipe(deltaX, deltaY, duration);
            } else if (duration < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                this.handleTap(e);
            }
            
            this.touchState = {};
        },
        
        /**
         * 处理滑动手势
         * @param {number} deltaX X轴位移
         * @param {number} deltaY Y轴位移
         * @param {number} duration 持续时间
         */
        handleSwipe: function(deltaX, deltaY, duration) {
            if (duration > this.swipeConfig.timeout) return;
            
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            const threshold = this.swipeConfig.threshold;
            
            let direction = null;
            
            if (absX > absY && absX > threshold) {
                direction = deltaX > 0 ? 'swipeRight' : 'swipeLeft';
            } else if (absY > absX && absY > threshold) {
                direction = deltaY > 0 ? 'swipeDown' : 'swipeUp';
            }
            
            if (direction) {
                Logger?.debug('[MobileAdaptation] 检测到滑动手势:', direction);
                this.triggerGesture(direction, { deltaX, deltaY, duration });
            }
        },
        
        /**
         * 处理点击手势
         * @param {TouchEvent} e 触摸事件
         */
        handleTap: function(e) {
            Logger?.debug('[MobileAdaptation] 检测到点击手势');
            this.triggerGesture('tap', { target: e.target });
        },
        
        /**
         * 开始长按检测
         * @param {Element} target 目标元素
         */
        startLongPressDetection: function(target) {
            this.longPressTimer = setTimeout(() => {
                Logger?.debug('[MobileAdaptation] 检测到长按手势');
                this.triggerGesture('longPress', { target: target });
                target.classList.add('long-press-active');
                
                // 触觉反馈
                this.triggerHapticFeedback('longPress');
            }, 500);
        },
        
        /**
         * 取消长按检测
         */
        cancelLongPress: function() {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        },
        
        /**
         * 触发滑动手势预览
         * @param {number} deltaX X轴位移
         * @param {number} deltaY Y轴位移
         */
        triggerSwipePreview: function(deltaX, deltaY) {
            const preview = document.querySelector('.swipe-preview');
            if (preview) {
                preview.style.transform = `translate(${deltaX * 0.3}px, ${deltaY * 0.3}px)`;
            }
        },
        
        /**
         * 阻止双击缩放
         */
        preventDoubleTapZoom: function() {
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (e) => {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                    e.preventDefault();
                }
                lastTouchEnd = now;
            }, { passive: false });
        },
        
        /**
         * 优化点击延迟
         */
        optimizeClickDelay: function() {
            // 使用FastClick原理优化点击延迟
            document.addEventListener('touchend', (e) => {
                // 排除需要原生行为的元素
                const excludeTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
                if (excludeTags.includes(e.target.tagName)) return;
                
                // 触发合成点击
                if (!this.touchState.isSwiping) {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    e.target.dispatchEvent(clickEvent);
                }
            }, { passive: true });
        },
        
        /**
         * 触发触觉反馈
         * @param {string} type 反馈类型
         */
        triggerHapticFeedback: function(type) {
            if (navigator.vibrate) {
                const patterns = {
                    tap: [10],
                    longPress: [50],
                    swipe: [20]
                };
                navigator.vibrate(patterns[type] || [10]);
            }
        },
        
        /**
         * 注册手势回调
         * @param {string} gesture 手势名称
         * @param {Function} callback 回调函数
         */
        on: function(gesture, callback) {
            if (this.gestures[gesture]) {
                this.gestures[gesture].push(callback);
            }
        },
        
        /**
         * 触发手势回调
         * @param {string} gesture 手势名称
         * @param {Object} data 手势数据
         */
        triggerGesture: function(gesture, data) {
            const callbacks = this.gestures[gesture] || [];
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    if (typeof Logger !== 'undefined') {
                        Logger.error('MobileAdaptation', '手势回调执行错误:', e);
                    }
                }
            });
        }
    };

    // ========================================
    // 移动端UI适配模块
    // ========================================
    
    /**
     * 移动端UI适配器
     * 提供移动端特定的UI优化
     */
    const MobileUIAdapter = {
        // 配置
        config: {
            enableSafeArea: true,       // 启用安全区域
            enableBottomNav: true,      // 启用底部导航
            enablePullToRefresh: true,  // 启用下拉刷新
            enableInfiniteScroll: true  // 启用无限滚动
        },
        
        /**
         * 初始化UI适配
         */
        init: function() {
            this.applySafeAreaInsets();
            this.setupMobileNavigation();
            this.setupPullToRefresh();
            this.setupInfiniteScroll();
            this.optimizeKeyboard();
            this.optimizeScrolling();
            Logger?.debug('[MobileAdaptation] UI适配完成');
        },
        
        /**
         * 应用安全区域内边距
         */
        applySafeAreaInsets: function() {
            if (!this.config.enableSafeArea) return;
            
            // 检测CSS环境变量支持
            const testEl = document.createElement('div');
            testEl.style.paddingTop = 'env(safe-area-inset-top)';
            
            if (testEl.style.paddingTop) {
                document.documentElement.classList.add('safe-area-supported');
                
                // 应用安全区域样式
                const style = document.createElement('style');
                style.textContent = `
                    .safe-area-top { padding-top: env(safe-area-inset-top); }
                    .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
                    .safe-area-left { padding-left: env(safe-area-inset-left); }
                    .safe-area-right { padding-right: env(safe-area-inset-right); }
                `;
                document.head.appendChild(style);
            }
        },
        
        /**
         * 设置移动端导航
         */
        setupMobileNavigation: function() {
            if (!this.config.enableBottomNav) return;
            
            const existingNav = document.querySelector('.mobile-bottom-nav');
            if (existingNav) return;
            
            // 创建底部导航
            const bottomNav = document.createElement('nav');
            bottomNav.className = 'mobile-bottom-nav safe-area-bottom';
            HTMLSanitizer?.setInnerHTML(bottomNav, `)
                <button class="nav-item active" data-action="home">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-label">首页</span>
                </button>
                <button class="nav-item" data-action="scenarios">
                    <span class="nav-icon">🎮</span>
                    <span class="nav-label">场景</span>
                </button>
                <button class="nav-item" data-action="progress">
                    <span class="nav-icon">📊</span>
                    <span class="nav-label">进度</span>
                </button>
                <button class="nav-item" data-action="settings">
                    <span class="nav-icon">⚙️</span>
                    <span class="nav-label">设置</span>
                </button>
            `;
            
            document.body.appendChild(bottomNav);
            
            // 添加导航样式
            const style = document.createElement('style');
            style.textContent = `
                .mobile-bottom-nav {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: space-around;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                    padding: 8px 0;
                    z-index: 1000;
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                }
                .mobile-bottom-nav .nav-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: none;
                    border: none;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .mobile-bottom-nav .nav-item.active {
                    color: #007bff;
                }
                .mobile-bottom-nav .nav-icon {
                    font-size: 24px;
                }
                .mobile-bottom-nav .nav-label {
                    font-size: 12px;
                    margin-top: 4px;
                }
                body.has-bottom-nav {
                    padding-bottom: 70px;
                }
                @media (min-width: 768px) {
                    .mobile-bottom-nav { display: none; }
                    body.has-bottom-nav { padding-bottom: 0; }
                }
            `;
            document.head.appendChild(style);
            
            document.body.classList.add('has-bottom-nav');
            
            // 绑定导航事件
            bottomNav.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    bottomNav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    
                    const action = item.dataset.action;
                    window.dispatchEvent(new CustomEvent('mobileNavigation', {
                        detail: { action: action }
                    }));
                });
            });
        },
        
        /**
         * 设置下拉刷新
         */
        setupPullToRefresh: function() {
            if (!this.config.enablePullToRefresh || !DeviceDetector.isTouch()) return;
            
            let startY = 0;
            let isPulling = false;
            const threshold = 80;
            
            // 创建刷新指示器
            const indicator = document.createElement('div');
            indicator.className = 'pull-to-refresh-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: -50px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 40px;
                background: #007bff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                transition: top 0.3s;
                z-index: 999;
            `;
            HTMLSanitizer?.setInnerHTML(indicator, '↓');
            document.body.appendChild(indicator);
            
            document.addEventListener('touchstart', (e) => {
                if (window.scrollY === 0) {
                    startY = e.touches[0].clientY;
                    isPulling = true;
                }
            });
            
            document.addEventListener('touchmove', (e) => {
                if (!isPulling) return;
                
                const currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                
                if (diff > 0 && window.scrollY === 0) {
                    const progress = Math.min(diff / threshold, 1);
                    indicator.style.top = `${-50 + diff * 0.5}px`;
                    indicator.style.transform = `translateX(-50%) rotate(${progress * 180}deg)`;
                }
            });
            
            document.addEventListener('touchend', () => {
                if (!isPulling) return;
                isPulling = false;
                
                const currentTop = parseInt(indicator.style.top);
                
                if (currentTop > -30) {
                    // 触发刷新
                    HTMLSanitizer?.setInnerHTML(indicator, '⟳');
                    indicator.style.animation = 'spin 1s linear infinite';
                    
                    window.dispatchEvent(new CustomEvent('pullToRefresh'));
                    
                    setTimeout(() => {
                        indicator.style.top = '-50px';
                        indicator.style.animation = '';
                        HTMLSanitizer?.setInnerHTML(indicator, '↓');
                    }, 1500);
                } else {
                    indicator.style.top = '-50px';
                }
            });
        },
        
        /**
         * 设置无限滚动
         */
        setupInfiniteScroll: function() {
            if (!this.config.enableInfiniteScroll) return;
            
            let isLoading = false;
            const threshold = 200;
            
            window.addEventListener('scroll', () => {
                if (isLoading) return;
                
                const scrollTop = window.scrollY;
                const scrollHeight = document.documentElement.scrollHeight;
                const clientHeight = window.innerHeight;
                
                if (scrollTop + clientHeight >= scrollHeight - threshold) {
                    isLoading = true;
                    
                    // 显示加载指示器
                    const loader = document.querySelector('.infinite-scroll-loader');
                    if (!loader) {
                        const newLoader = document.createElement('div');
                        newLoader.className = 'infinite-scroll-loader';
                        HTMLSanitizer?.setInnerHTML(newLoader, '<div class="spinner"></div><span>加载中...</span>');
                        newLoader.style.cssText = `
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            padding: 20px;
                            gap: 10px;
                        `;
                        document.body.appendChild(newLoader);
                    }
                    
                    window.dispatchEvent(new CustomEvent('infiniteScroll', {
                        detail: {
                            complete: () => {
                                isLoading = false;
                                const loaderEl = document.querySelector('.infinite-scroll-loader');
                                if (loaderEl) loaderEl.remove();
                            }
                        }
                    }));
                }
            });
        },
        
        /**
         * 优化虚拟键盘
         */
        optimizeKeyboard: function() {
            // 监听输入框聚焦
            const inputs = document.querySelectorAll('input, textarea');
            
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    // 滚动到可见区域
                    setTimeout(() => {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
            });
            
            // 监听视口变化（键盘弹出）
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', () => {
                    document.body.style.height = `${window.visualViewport.height}px`;
                });
            }
        },
        
        /**
         * 优化滚动体验
         */
        optimizeScrolling: function() {
            // 添加平滑滚动
            document.documentElement.style.scrollBehavior = 'smooth';
            
            // iOS橡皮筋效果优化
            document.body.style.overscrollBehavior = 'none';
            
            // 滚动性能优化
            const scrollContainers = document.querySelectorAll('.scroll-container');
            scrollContainers.forEach(container => {
                container.style.webkitOverflowScrolling = 'touch';
            });
        }
    };

    // ========================================
    // 主模块API
    // ========================================
    
    const MobileAdaptation = {
        // 版本信息
        version: '3.1.0',
        
        // 子模块引用
        DeviceDetector: DeviceDetector,
        ResponsiveLayout: ResponsiveLayout,
        TouchOptimizer: TouchOptimizer,
        MobileUIAdapter: MobileUIAdapter,
        
        /**
         * 初始化移动端适配
         * @param {Object} options 配置选项
         */
        init: function(options = {}) {
            Logger?.debug('[MobileAdaptation] 初始化移动端适配模块 v' + this.version);
            
            // 合并配置
            Object.assign(MobileUIAdapter.config, options);
            
            // 初始化子模块
            ResponsiveLayout.init();
            TouchOptimizer.init();
            MobileUIAdapter.init();
            
            // 输出设备信息
            const deviceInfo = DeviceDetector.getDeviceInfo();
            Logger?.debug('[MobileAdaptation] 设备信息:', deviceInfo);
            
            // 触发初始化完成事件
            window.dispatchEvent(new CustomEvent('mobileAdaptationReady', {
                detail: { deviceInfo: deviceInfo }
            }));
            
            return this;
        },
        
        /**
         * 获取设备信息
         * @returns {Object} 设备信息
         */
        getDeviceInfo: function() {
            return DeviceDetector.getDeviceInfo();
        },
        
        /**
         * 检测是否为移动端
         * @returns {boolean}
         */
        isMobile: function() {
            return DeviceDetector.isMobile() || ResponsiveLayout.isMobileView();
        },
        
        /**
         * 获取当前断点
         * @returns {string}
         */
        getBreakpoint: function() {
            return ResponsiveLayout.getBreakpoint();
        },
        
        /**
         * 注册手势回调
         * @param {string} gesture 手势名称
         * @param {Function} callback 回调函数
         */
        onGesture: function(gesture, callback) {
            TouchOptimizer.on(gesture, callback);
        },
        
        /**
         * 注册断点变化监听
         * @param {Function} callback 回调函数
         */
        onBreakpointChange: function(callback) {
            ResponsiveLayout.addListener(callback);
        },
        
        /**
         * 触发触觉反馈
         * @param {string} type 反馈类型
         */
        haptic: function(type) {
            TouchOptimizer.triggerHapticFeedback(type);
        }
    };
    
    return MobileAdaptation;
}));

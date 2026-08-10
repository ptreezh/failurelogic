/**
 * 应用核心模块
 * App Core Module
 * 
 * 替代全局window对象污染
 * 使用模块模式管理路由器和其他全局状态
 * 
 * 创建时间：2026-04-04
 */

(function(global) {
    'use strict';

    // 应用单例模式
    const App = {
        // 路由器注册表
        routers: new Map(),
        
        // 游戏状态存储
        gameStates: new Map(),
        
        // 用户配置
        config: {
            debug: global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1',
            apiBaseUrl: null,
            llmEnabled: false
        },
        
        // 工具方法
        utils: {},
        
        /**
         * 注册路由器
         */
        registerRouter(name, router) {
            this.routers.set(name, router);
            if (this.config.debug) {
                Logger?.debug(`[App] 路由器已注册: ${name}`);
            }
        },
        
        /**
         * 获取路由器
         */
        getRouter(name) {
            return this.routers.get(name);
        },
        
        /**
         * 检查路由器是否存在
         */
        hasRouter(name) {
            return this.routers.has(name);
        },
        
        /**
         * 存储游戏状态
         */
        saveGameState(scenarioId, state) {
            this.gameStates.set(scenarioId, {
                state,
                timestamp: Date.now()
            });
        },
        
        /**
         * 获取游戏状态
         */
        getGameState(scenarioId) {
            const saved = this.gameStates.get(scenarioId);
            if (!saved) return null;
            
            // 检查是否过期（24小时）
            if (Date.now() - saved.timestamp > 24 * 60 * 60 * 1000) {
                this.gameStates.delete(scenarioId);
                return null;
            }
            
            return saved.state;
        },
        
        /**
         * 清除游戏状态
         */
        clearGameState(scenarioId) {
            this.gameStates.delete(scenarioId);
        },
        
        /**
         * 初始化应用
         */
        async initialize() {
            if (this.config.debug) {
                Logger?.debug('[App] 初始化应用...');
            }
            
            // 加载配置
            await this.loadConfig();
            
            if (this.config.debug) {
                Logger?.debug('[App] 应用初始化完成');
            }
        },
        
        /**
         * 加载配置
         */
        async loadConfig() {
            // 从全局配置加载
            if (global.APP_CONFIG) {
                this.config.apiBaseUrl = global.APP_CONFIG.apiBaseUrl;
            }
            
            if (global.LLM_CONFIG) {
                this.config.llmEnabled = global.LLM_CONFIG.enabled !== false;
            }
        },
        
        /**
         * 获取应用统计
         */
        getStats() {
            return {
                routerCount: this.routers.size,
                gameStateCount: this.gameStates.size,
                config: { ...this.config }
            };
        }
    };

    // Logger模块
    const Logger = {
        _enabled: true,
        _level: 'debug',
        
        setEnabled(enabled) {
            this._enabled = enabled;
        },
        
        setLevel(level) {
            this._level = level;
        },
        
        debug(...args) {
            if (this._enabled && this._level === 'debug') {
                Logger?.debug('[DEBUG]', ...args);
            }
        },
        
        info(...args) {
            if (this._enabled) {
                Logger?.debug('[INFO]', ...args);
            }
        },
        
        warn(...args) {
            if (this._enabled) {
                Logger?.warn('[WARN]', ...args);
            }
        },
        
        error(...args) {
            if (this._enabled) {
                Logger?.error('[ERROR]', ...args);
            }
        }
    };

    // HTML Sanitizer模块
    const HTMLSanitizer = {
        // 允许的标签
        _allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
        
        // 允许的屬性
        _allowedAttributes: ['class', 'id', 'style'],
        
        /**
         * 清理HTML
         */
        sanitize(html) {
            if (!html) return '';
            
            // 创建临时DOM
            const temp = document.createElement('div');
            HTMLSanitizer?.setInnerHTML(temp, html);
            
            // 递归清理
            this._cleanElement(temp);
            
            return temp.innerHTML;
        },
        
        /**
         * 递归清理元素
         */
        _cleanElement(element) {
            // 移除不允许的标签
            const children = Array.from(element.children);
            children.forEach(child => {
                if (!this._allowedTags.includes(child.tagName.toLowerCase())) {
                    // 保留内容，移除标签
                    const text = document.createTextNode(child.textContent);
                    child.parentNode.replaceChild(text, child);
                } else {
                    // 移除不允许的屬性
                    const attrs = Array.from(child.attributes);
                    attrs.forEach(attr => {
                        if (!this._allowedAttributes.includes(attr.name)) {
                            child.removeAttribute(attr.name);
                        }
                    });
                    
                    // 递归清理子元素
                    this._cleanElement(child);
                }
            });
        },
        
        /**
         * 安全地设置innerHTML
         */
        setInnerHTML(element, html) {
            if (!element) return;
            HTMLSanitizer?.setInnerHTML(element, this.sanitize(html));
        }
    };

    // 导出模块
    const AppModules = {
        App,
        Logger,
        HTMLSanitizer
    };

    // UMD导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AppModules;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return AppModules; });
    } else {
        global.AppModules = AppModules;
        global.App = App;
        global.Logger = Logger;
        global.HTMLSanitizer = HTMLSanitizer;
    }

})(typeof window !== 'undefined' ? window : this);

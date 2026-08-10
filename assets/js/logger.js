/**
 * Logger模块
 * Logger Module
 * 
 * 替代console语句，提供结构化日志
 * 
 * 创建时间：2026-04-04
 */

(function(global) {
    'use strict';

    // Logger类
    class Logger {
        constructor(options = {}) {
            this.enabled = options.enabled !== false;
            this.level = options.level || 'debug';
            this.prefix = options.prefix || '';
            this.maxLogs = options.maxLogs || 1000;
            this.logs = [];
        }

        // 日志级别
        static LEVELS = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            none: 4
        };

        /**
         * 设置日志级别
         */
        setLevel(level) {
            this.level = level;
        }

        /**
         * 启用/禁用日志
         */
        setEnabled(enabled) {
            this.enabled = enabled;
        }

        /**
         * 设置前缀
         */
        setPrefix(prefix) {
            this.prefix = prefix;
        }

        /**
         * 记录调试日志
         */
        debug(...args) {
            this._log('debug', args);
        }

        /**
         * 记录信息日志
         */
        info(...args) {
            this._log('info', args);
        }

        /**
         * 记录警告日志
         */
        warn(...args) {
            this._log('warn', args);
        }

        /**
         * 记录错误日志
         */
        error(...args) {
            this._log('error', args);
        }

        /**
         * 内部日志记录
         */
        _log(level, args) {
            if (!this.enabled) return;
            if (Logger.LEVELS[level] < Logger.LEVELS[this.level]) return;

            const timestamp = new Date().toISOString();
            const prefix = this.prefix ? `[${this.prefix}]` : '';
            const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');

            // 存储日志
            this.logs.push({
                timestamp,
                level,
                message,
                args
            });

            // 限制日志数量
            if (this.logs.length > this.maxLogs) {
                this.logs.shift();
            }

            // 输出到控制台
            const formattedMessage = `${prefix}[${level.toUpperCase()}] ${timestamp}: ${message}`;
            
            switch (level) {
                case 'debug':
                    console.debug(formattedMessage, ...args);
                    break;
                case 'info':
                    console.info(formattedMessage, ...args);
                    break;
                case 'warn':
                    Logger?.warn(formattedMessage, ...args);
                    break;
                case 'error':
                    Logger?.error(formattedMessage, ...args);
                    break;
            }
        }

        /**
         * 获取日志
         */
        getLogs(level = null) {
            if (!level) return this.logs;
            return this.logs.filter(log => log.level === level);
        }

        /**
         * 清空日志
         */
        clear() {
            this.logs = [];
        }

        /**
         * 导出日志为JSON
         */
        exportLogs() {
            return JSON.stringify(this.logs, null, 2);
        }
    }

    // 创建全局Logger实例
    const logger = new Logger({
        prefix: 'App',
        enabled: global.location.hostname === 'localhost' || global.location.hostname === '127.0.0.1'
    });

    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Logger, logger };
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return { Logger, logger }; });
    } else {
        global.Logger = Logger;
        global.logger = logger;
    }

})(typeof window !== 'undefined' ? window : this);

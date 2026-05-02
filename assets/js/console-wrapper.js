/**
 * ConsoleWrapper - Drop-in console replacement with production control
 * Replaces console.* calls with a unified logging API
 * Usage: Replace `console.log(...)` with `Log.info(...)`
 */
(function(global) {
    'use strict';

    const isProduction = global.location &&
        (global.location.hostname === 'localhost' ||
         global.location.hostname === '127.0.0.1' ||
         global.location.hostname.endsWith('.github.dev'));

    class Log {
        static _logger = null;

        static _getLogger() {
            if (!Log._logger && typeof global.Logger !== 'undefined') {
                Log._logger = global.Logger;
            }
            return Log._logger;
        }

        static debug(...args) {
            const logger = Log._getLogger();
            if (logger) {
                logger.debug(...args);
            } else {
                console.debug(...args);
            }
        }

        static info(...args) {
            const logger = Log._getLogger();
            if (logger) {
                logger.info(...args);
            } else {
                console.info(...args);
            }
        }

        static warn(...args) {
            const logger = Log._getLogger();
            if (logger) {
                logger.warn(...args);
            } else {
                console.warn(...args);
            }
        }

        static error(...args) {
            const logger = Log._getLogger();
            if (logger) {
                logger.error(...args);
            } else {
                console.error(...args);
            }
        }

        static log(...args) {
            const logger = Log._getLogger();
            if (logger) {
                logger.info(...args);
            } else {
                console.log(...args);
            }
        }
    }

    global.Log = Log;
})(typeof window !== 'undefined' ? window : this);

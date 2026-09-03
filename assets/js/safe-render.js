/**
 * Safe Render — XSS-safe DOM updates
 *
 * 提供全局 SafeRender.setHTML(element, html, options)，
 * 优先走 HTMLSanitizer.sanitize()；trust=true 时跳过净化。
 *
 * 使用规则：
 *   SafeRender.setHTML(el, html)             // 自动净化
 *   SafeRender.setHTML(el, html, {trust:true})  // 显式信任
 *   SafeRender.setText(el, text)             // 纯文本
 */

(function(global) {
    'use strict';

    function getSanitizer() {
        return global.HTMLSanitizer || global.sanitizer || null;
    }

    const SafeRender = {
        /**
         * 设置 HTML 内容（自动 XSS 净化）
         * @param {Element} element 目标元素
         * @param {string} html HTML 字符串
         * @param {Object} options { trust?: bool, fallback?: string }
         */
        setHTML(element, html, options = {}) {
            if (!element) return;
            if (html == null) {
                element.innerHTML = '';
                return;
            }
            if (typeof html !== 'string') {
                html = String(html);
            }

            if (options.trust === true) {
                // 显式标记为可信（如静态模板字符串）
                element.innerHTML = html;
                return;
            }

            const sanitizer = getSanitizer();
            if (sanitizer && typeof sanitizer.sanitize === 'function') {
                try {
                    element.innerHTML = sanitizer.sanitize(html);
                    return;
                } catch (e) {
                    if (typeof Logger !== 'undefined') {
                        Logger.error('SafeRender', 'Sanitize failed, falling back:', e);
                    }
                }
            }

            // Fallback: textContent 防止 XSS，但保留换行
            // （比直接 innerHTML 安全得多）
            element.textContent = html;
            if (typeof Logger !== 'undefined') {
                Logger.warn('SafeRender', 'No sanitizer available, used textContent fallback');
            }
        },

        /**
         * 设置纯文本（始终安全）
         */
        setText(element, text) {
            if (!element) return;
            element.textContent = text == null ? '' : String(text);
        },

        /**
         * 追加 HTML（XSS 净化）
         */
        appendHTML(element, html, options = {}) {
            if (!element) return;
            const temp = document.createElement('div');
            this.setHTML(temp, html, options);
            while (temp.firstChild) {
                element.appendChild(temp.firstChild);
            }
        }
    };

    global.SafeRender = SafeRender;

})(typeof window !== 'undefined' ? window : globalThis);

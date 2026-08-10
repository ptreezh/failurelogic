/**
 * HTML Sanitizer模块
 * HTML Sanitizer Module
 * 
 * 安全地处理HTML，防止XSS攻击
 * 
 * 创建时间：2026-04-04
 */

(function(global) {
    'use strict';

    class HTMLSanitizer {
        constructor(options = {}) {
            this.allowedTags = options.allowedTags || [
                'p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div',
                'a', 'img', 'button', 'input', 'form'
            ];
            this.allowedAttributes = options.allowedAttributes || [
                'class', 'id', 'style', 'href', 'src', 'alt', 
                'title', 'type', 'value', 'placeholder', 'onclick'
            ];
            this.allowedProtocols = options.allowedProtocols || [
                'http:', 'https:', 'mailto:', 'tel:'
            ];
        }

        /**
         * 清理HTML字符串
         */
        sanitize(html) {
            if (!html || typeof html !== 'string') return '';

            // 创建临时DOM
            const temp = document.createElement('div');
            temp.innerHTML = html;

            // 递归清理
            this._cleanElement(temp);

            return temp.innerHTML;
        }

        /**
         * 安全地设置innerHTML
         */
        setInnerHTML(element, html) {
            if (!element) return;
            element.innerHTML = this.sanitize(html);
        }

        /**
         * 递归清理元素
         */
        _cleanElement(element) {
            const children = Array.from(element.children);
            
            children.forEach(child => {
                const tagName = child.tagName.toLowerCase();
                
                // 移除不允许的标签
                if (!this.allowedTags.includes(tagName)) {
                    // 保留文本内容，移除标签
                    const text = document.createTextNode(child.textContent);
                    child.parentNode.replaceChild(text, child);
                    return;
                }

                // 清理属性
                const attrs = Array.from(child.attributes);
                attrs.forEach(attr => {
                    const attrName = attr.name.toLowerCase();
                    
                    // 移除不允许的属性
                    if (!this.allowedAttributes.includes(attrName)) {
                        child.removeAttribute(attr.name);
                        return;
                    }

                    // 检查URL属性的协议
                    if (['href', 'src', 'action'].includes(attrName)) {
                        const value = attr.value.trim();
                        if (value.startsWith('javascript:') || value.startsWith('data:')) {
                            child.removeAttribute(attr.name);
                        }
                    }
                });

                // 递归清理子元素
                this._cleanElement(child);
            });
        }

        /**
         * 转义HTML实体
         */
        static escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * 反转义HTML实体
         */
        static unescapeHtml(html) {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.textContent;
        }
    }

    // 创建全局实例
    const sanitizer = new HTMLSanitizer();

    // 导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { HTMLSanitizer, sanitizer };
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return { HTMLSanitizer, sanitizer }; });
    } else {
        global.HTMLSanitizer = HTMLSanitizer;
        global.sanitizer = sanitizer;
    }

})(typeof window !== 'undefined' ? window : this);

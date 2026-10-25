/**
 * ErrorToast - 错误提示组件
 * 统一错误提示，提升用户体验
 */

const ErrorToast = {
  // 提示队列
  queue: [],
  // 当前显示
  current: null,
  // 容器
  container: null,
  // 配置
  config: {
    duration: 5000,
    maxVisible: 3,
    position: 'top-right' // top-right, top-left, bottom-right, bottom-left
  },

  /**
   * 初始化
   */
  init() {
    // 创建容器
    this.container = document.createElement('div');
    this.container.id = 'error-toast-container';
    this.container.className = 'error-toast-container';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);

    Logger?.debug('ErrorToast: Initialized');
  },

  /**
   * 显示错误提示
   * @param {string} message - 错误消息
   * @param {Object} options - 配置选项
   */
  show(message, options = {}) {
    const {
      type = 'error', // error, warning, info, success
      duration = this.config.duration,
      action = null, // { label, callback }
      id = 'toast-' + Date.now()
    } = options;

    // 创建提示元素
    const toast = document.createElement('div');
    toast.id = id;
    toast.className = `error-toast error-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      pointer-events: auto;
      animation: slideIn 0.3s ease;
      border-left: 4px solid;
    `;

    // 根据类型设置颜色
    const colors = {
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      success: '#22c55e'
    };
    toast.style.borderLeftColor = colors[type] || colors.error;

    // 图标
    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅'
    };

    HTMLSanitizer?.setInnerHTML(toast, `)
      <span class="error-toast-icon" style="font-size: 20px;">${icons[type] || icons.error}</span>
      <div class="error-toast-content" style="flex: 1;">
        <p class="error-toast-message" style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">${message}</p>
        ${action ? `<button class="error-toast-action" style="margin-top: 8px; background: none; border: none; color: ${colors[type]}; cursor: pointer; font-size: 14px; font-weight: 500; padding: 0;">${action.label}</button>` : ''}
      </div>
      <button class="error-toast-close" style="background: none; border: none; cursor: pointer; font-size: 18px; color: #6b7280; padding: 0; line-height: 1;">&times;</button>
    `;

    // 添加到容器
    this.container.appendChild(toast);

    // 绑定关闭按钮
    const closeBtn = toast.querySelector('.error-toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(id));

    // 绑定操作按钮
    if (action && action.callback) {
      const actionBtn = toast.querySelector('.error-toast-action');
      actionBtn.addEventListener('click', () => {
        action.callback();
        this.dismiss(id);
      });
    }

    // 自动关闭
    if (duration > 0) {
      toast._timeout = setTimeout(() => this.dismiss(id), duration);
    }

    Logger?.debug(`ErrorToast: Show ${type} toast: ${message}`);

    return id;
  },

  /**
   * 关闭提示
   * @param {string} id - 提示ID
   */
  dismiss(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    // 清除自动关闭定时器
    if (toast._timeout) {
      clearTimeout(toast._timeout);
    }

    // 添加关闭动画
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);

    Logger?.debug(`ErrorToast: Dismiss toast: ${id}`);
  },

  /**
   * 显示错误提示
   * @param {string} message - 错误消息
   * @param {Object} options - 配置选项
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  },

  /**
   * 显示警告提示
   * @param {string} message - 警告消息
   * @param {Object} options - 配置选项
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  },

  /**
   * 显示信息提示
   * @param {string} message - 信息消息
   * @param {Object} options - 配置选项
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  },

  /**
   * 显示成功提示
   * @param {string} message - 成功消息
   * @param {Object} options - 配置选项
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  },

  /**
   * 关闭所有提示
   */
  dismissAll() {
    const toasts = this.container.querySelectorAll('.error-toast');
    toasts.forEach(toast => this.dismiss(toast.id));
  },

  /**
   * 获取当前显示的提示数量
   * @returns {number} 提示数量
   */
  getCount() {
    return this.container.querySelectorAll('.error-toast').length;
  }
};

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .error-toast:hover {
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }

  .error-toast-action:hover {
    text-decoration: underline;
  }

  .error-toast-close:hover {
    color: #1a1a1a;
  }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ErrorToast.init());
} else {
  ErrorToast.init();
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorToast;
}

/**
 * EventBus - 统一事件管理
 * 替代内联onclick和全局window引用
 * 提供解耦的事件通信机制
 */

const EventBus = {
  // 事件监听器存储
  listeners: {},

  // 注册事件监听
  on(event, callback, context = null) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push({
      callback,
      context,
      id: Date.now() + Math.random()
    });

    return this.listeners[event][this.listeners[event].length - 1].id;
  },

  // 移除事件监听
  off(event, listenerId) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        listener => listener.id !== listenerId
      );
    }
  },

  // 触发事件
  emit(event, data = {}) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => {
        try {
          listener.callback.call(listener.context, data);
        } catch (error) {
          Logger?.error(`[EventBus] Error in event "${event}":`, error);
        }
      });
    }
  },

  // 一次性事件监听
  once(event, callback, context = null) {
    const listenerId = this.on(event, (data) => {
      this.off(event, listenerId);
      callback.call(context, data);
    }, context);

    return listenerId;
  },

  // 清空所有监听器
  clear(event = null) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  },

  // 获取事件监听器数量
  listenerCount(event) {
    return this.listeners[event] ? this.listeners[event].length : 0;
  },

  // 调试：列出所有事件
  debug() {
    Logger?.debug('[EventBus] Registered events:');
    Object.keys(this.listeners).forEach(event => {
      Logger?.debug(`  - ${event}: ${this.listeners[event].length} listeners`);
    });
  }
};

/**
 * 自动绑定data-action属性到事件
 * 在DOM加载完成后执行
 */
function bindActionEvents() {
  // 查找所有带data-action的元素
  document.querySelectorAll('[data-action]').forEach(element => {
    const action = element.dataset.action;

    // 如果已经有监听器，跳过
    if (element._eventBound) return;

    // 添加点击事件
    element.addEventListener('click', (e) => {
      e.preventDefault();

      // 收集data-*参数
      const data = {};
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-param-')) {
          const key = attr.name.replace('data-param-', '');
          data[key] = attr.value;
        }
      });

      // 触发事件
      EventBus.emit(action, {
        element,
        event: e,
        ...data
      });
    });

    element._eventBound = true;
  });
}

// DOM加载完成后自动绑定
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindActionEvents);
} else {
  bindActionEvents();
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventBus, bindActionEvents };
}

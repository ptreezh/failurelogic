/**
 * 画布优化系统
 * Canvas Optimization System
 * 
 * 包含：离屏渲染、分层渲染、脏矩形检测、节流渲染
 * 
 * 来源：Soul Auto-Evolution 循环13
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // 离屏渲染器 (Offscreen Renderer)
    // ============================================
    class OffscreenRenderer {
        constructor(width, height) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            this.ctx = this.canvas.getContext('2d');
            this.width = width;
            this.height = height;
        }

        /**
         * 获取渲染上下文
         */
        getContext() {
            return this.ctx;
        }

        /**
         * 绘制到目标画布
         */
        drawTo(targetCtx, x = 0, y = 0, width = this.width, height = this.height) {
            targetCtx.drawImage(this.canvas, x, y, width, height);
        }

        /**
         * 清除画布
         */
        clear() {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }

        /**
         * 调整大小
         */
        resize(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.width = width;
            this.height = height;
        }

        /**
         * 获取图像数据
         */
        getImageData(x = 0, y = 0, width = this.width, height = this.height) {
            return this.ctx.getImageData(x, y, width, height);
        }

        /**
         * 放置图像数据
         */
        putImageData(imageData, x = 0, y = 0) {
            this.ctx.putImageData(imageData, x, y);
        }
    }

    // ============================================
    // 分层渲染器 (Layered Renderer)
    // ============================================
    class LayeredRenderer {
        constructor(container, config = {}) {
            this.config = {
                width: config.width || 800,
                height: config.height || 600,
                layers: config.layers || ['background', 'main', 'foreground', 'ui'],
                ...config
            };

            this.container = container;
            this.layers = new Map();
            this.layerOrder = [];

            this.initLayers();
        }

        /**
         * 初始化所有层
         */
        initLayers() {
            for (const layerName of this.config.layers) {
                this.addLayer(layerName);
            }
        }

        /**
         * 添加层
         */
        addLayer(name, zIndex = this.layers.size) {
            const canvas = document.createElement('canvas');
            canvas.width = this.config.width;
            canvas.height = this.config.height;
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = zIndex;
            canvas.style.pointerEvents = name === 'ui' ? 'auto' : 'none';

            this.container.appendChild(canvas);
            this.layers.set(name, {
                canvas,
                ctx: canvas.getContext('2d'),
                visible: true,
                dirty: true,
                zIndex
            });

            this.layerOrder.push(name);
            this.sortLayers();

            return this.layers.get(name);
        }

        /**
         * 排序层
         */
        sortLayers() {
            this.layerOrder.sort((a, b) => {
                return (this.layers.get(a)?.zIndex || 0) - (this.layers.get(b)?.zIndex || 0);
            });
        }

        /**
         * 获取层
         */
        getLayer(name) {
            return this.layers.get(name);
        }

        /**
         * 获取层上下文
         */
        getContext(name) {
            return this.layers.get(name)?.ctx;
        }

        /**
         * 清除层
         */
        clearLayer(name) {
            const layer = this.layers.get(name);
            if (layer) {
                layer.ctx.clearRect(0, 0, this.config.width, this.config.height);
                layer.dirty = false;
            }
        }

        /**
         * 清除所有层
         */
        clearAll() {
            for (const name of this.layerOrder) {
                this.clearLayer(name);
            }
        }

        /**
         * 显示/隐藏层
         */
        setLayerVisibility(name, visible) {
            const layer = this.layers.get(name);
            if (layer) {
                layer.visible = visible;
                layer.canvas.style.display = visible ? 'block' : 'none';
            }
        }

        /**
         * 标记层为脏
         */
        markDirty(name) {
            const layer = this.layers.get(name);
            if (layer) {
                layer.dirty = true;
            }
        }

        /**
         * 渲染所有脏层
         */
        render(renderFunc) {
            for (const name of this.layerOrder) {
                const layer = this.layers.get(name);
                if (layer?.dirty && layer.visible) {
                    renderFunc(name, layer.ctx);
                    layer.dirty = false;
                }
            }
        }

        /**
         * 调整大小
         */
        resize(width, height) {
            this.config.width = width;
            this.config.height = height;

            for (const [, layer] of this.layers) {
                layer.canvas.width = width;
                layer.canvas.height = height;
            }
        }

        /**
         * 销毁
         */
        destroy() {
            for (const [, layer] of this.layers) {
                layer.canvas.remove();
            }
            this.layers.clear();
            this.layerOrder = [];
        }
    }

    // ============================================
    // 脏矩形检测器 (Dirty Rectangle Detector)
    // ============================================
    class DirtyRectangleDetector {
        constructor(config = {}) {
            this.config = {
                mergeThreshold: config.mergeThreshold || 10,
                minSize: config.minSize || 1,
                expand: config.expand || 2,
                ...config
            };

            this.dirtyRects = [];
            this.previousState = new Map();
        }

        /**
         * 添加脏矩形
         */
        addRect(x, y, width, height) {
            // 扩展边界
            const rect = {
                x: Math.max(0, x - this.config.expand),
                y: Math.max(0, y - this.config.expand),
                width: width + this.config.expand * 2,
                height: height + this.config.expand * 2
            };

            this.dirtyRects.push(rect);
        }

        /**
         * 检测变化（通过对象位置比较）
         */
        detectChanges(objects) {
            const currentPositions = new Map();

            for (const obj of objects) {
                const id = obj.id || obj;
                const pos = {
                    x: obj.x || 0,
                    y: obj.y || 0,
                    width: obj.width || 1,
                    height: obj.height || 1
                };

                currentPositions.set(id, pos);

                // 检查是否移动或新增
                const prev = this.previousState.get(id);
                if (!prev) {
                    // 新对象
                    this.addRect(pos.x, pos.y, pos.width, pos.height);
                } else if (prev.x !== pos.x || prev.y !== pos.y || 
                           prev.width !== pos.width || prev.height !== pos.height) {
                    // 移动或大小变化，标记新旧位置
                    this.addRect(prev.x, prev.y, prev.width, prev.height);
                    this.addRect(pos.x, pos.y, pos.width, pos.height);
                }
            }

            // 检查删除的对象
            for (const [id, prev] of this.previousState) {
                if (!currentPositions.has(id)) {
                    this.addRect(prev.x, prev.y, prev.width, prev.height);
                }
            }

            this.previousState = currentPositions;
        }

        /**
         * 合并重叠的矩形
         */
        mergeOverlapping() {
            if (this.dirtyRects.length <= 1) return;

            const merged = [];
            const used = new Set();

            for (let i = 0; i < this.dirtyRects.length; i++) {
                if (used.has(i)) continue;

                let rect = { ...this.dirtyRects[i] };

                for (let j = i + 1; j < this.dirtyRects.length; j++) {
                    if (used.has(j)) continue;

                    const other = this.dirtyRects[j];

                    if (this.rectsOverlap(rect, other)) {
                        rect = this.mergeRects(rect, other);
                        used.add(j);
                    }
                }

                merged.push(rect);
            }

            this.dirtyRects = merged;
        }

        /**
         * 检查两个矩形是否重叠
         */
        rectsOverlap(r1, r2) {
            return !(r1.x + r1.width < r2.x ||
                     r2.x + r2.width < r1.x ||
                     r1.y + r1.height < r2.y ||
                     r2.y + r2.height < r1.y);
        }

        /**
         * 合并两个矩形
         */
        mergeRects(r1, r2) {
            const x = Math.min(r1.x, r2.x);
            const y = Math.min(r1.y, r2.y);
            const right = Math.max(r1.x + r1.width, r2.x + r2.width);
            const bottom = Math.max(r1.y + r1.height, r2.y + r2.height);

            return {
                x,
                y,
                width: right - x,
                height: bottom - y
            };
        }

        /**
         * 获取脏矩形列表
         */
        getDirtyRects() {
            this.mergeOverlapping();
            return this.dirtyRects.filter(r => 
                r.width >= this.config.minSize && r.height >= this.config.minSize
            );
        }

        /**
         * 清空脏矩形
         */
        clear() {
            this.dirtyRects = [];
        }

        /**
         * 获取合并后的边界
         */
        getBoundingRect() {
            if (this.dirtyRects.length === 0) return null;

            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            for (const rect of this.dirtyRects) {
                minX = Math.min(minX, rect.x);
                minY = Math.min(minY, rect.y);
                maxX = Math.max(maxX, rect.x + rect.width);
                maxY = Math.max(maxY, rect.y + rect.height);
            }

            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }
    }

    // ============================================
    // 节流渲染器 (Throttled Renderer)
    // ============================================
    class ThrottledRenderer {
        constructor(config = {}) {
            this.config = {
                targetFPS: config.targetFPS || 60,
                maxFPS: config.maxFPS || 120,
                adaptive: config.adaptive !== false,
                ...config
            };

            this.frameInterval = 1000 / this.config.targetFPS;
            this.lastFrameTime = 0;
            this.frameCount = 0;
            this.fpsHistory = [];
            this.isRunning = false;
            this.rafId = null;

            this.renderQueue = [];
            this.callbacks = {
                onRender: [],
                onFrameDrop: []
            };
        }

        /**
         * 开始渲染循环
         */
        start(renderFunc) {
            if (this.isRunning) return;
            this.isRunning = true;
            this.renderFunc = renderFunc;
            this.loop();
        }

        /**
         * 停止渲染循环
         */
        stop() {
            this.isRunning = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }

        /**
         * 渲染循环
         */
        loop(timestamp = 0) {
            if (!this.isRunning) return;

            const elapsed = timestamp - this.lastFrameTime;

            if (elapsed >= this.frameInterval) {
                // 计算实际FPS
                const fps = 1000 / elapsed;
                this.fpsHistory.push(fps);

                if (this.fpsHistory.length > 60) {
                    this.fpsHistory.shift();
                }

                // 自适应调整
                if (this.config.adaptive) {
                    this.adaptFrameRate();
                }

                // 执行渲染
                this.lastFrameTime = timestamp - (elapsed % this.frameInterval);
                this.frameCount++;

                if (this.renderFunc) {
                    this.renderFunc(timestamp);
                }

                // 触发回调
                this.callbacks.onRender.forEach(cb => cb(timestamp, fps));

                // 检测丢帧
                if (fps < this.config.targetFPS * 0.8) {
                    this.callbacks.onFrameDrop.forEach(cb => cb(fps));
                }
            }

            this.rafId = requestAnimationFrame((t) => this.loop(t));
        }

        /**
         * 自适应帧率调整
         */
        adaptFrameRate() {
            if (this.fpsHistory.length < 10) return;

            const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

            if (avgFPS < this.config.targetFPS * 0.7) {
                // 性能不足，降低目标帧率
                this.config.targetFPS = Math.max(15, this.config.targetFPS - 5);
                this.frameInterval = 1000 / this.config.targetFPS;
            } else if (avgFPS > this.config.targetFPS * 1.1 && this.config.targetFPS < this.config.maxFPS) {
                // 性能充足，提高目标帧率
                this.config.targetFPS = Math.min(this.config.maxFPS, this.config.targetFPS + 5);
                this.frameInterval = 1000 / this.config.targetFPS;
            }
        }

        /**
         * 请求渲染
         */
        requestRender(callback) {
            this.renderQueue.push(callback);
        }

        /**
         * 获取当前FPS
         */
        getCurrentFPS() {
            return this.fpsHistory.length > 0 ? this.fpsHistory[this.fpsHistory.length - 1] : 0;
        }

        /**
         * 获取平均FPS
         */
        getAverageFPS() {
            if (this.fpsHistory.length === 0) return 0;
            return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        }

        /**
         * 获取统计信息
         */
        getStats() {
            return {
                frameCount: this.frameCount,
                currentFPS: this.getCurrentFPS(),
                averageFPS: this.getAverageFPS(),
                targetFPS: this.config.targetFPS,
                frameInterval: this.frameInterval
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
    // Canvas优化管理器 (Canvas Optimization Manager)
    // ============================================
    class CanvasOptimizationManager {
        constructor(canvas, config = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            this.config = {
                width: config.width || canvas.width,
                height: config.height || canvas.height,
                ...config
            };

            this.offscreenRenderer = new OffscreenRenderer(this.config.width, this.config.height);
            this.dirtyDetector = new DirtyRectangleDetector(config.dirtyRect);
            this.throttledRenderer = new ThrottledRenderer(config.throttle);

            this.objects = [];
            this.objectMap = new Map();

            this.callbacks = {
                onRender: [],
                onUpdate: []
            };
        }

        /**
         * 添加对象
         */
        addObject(obj) {
            const id = obj.id || `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            obj.id = id;
            this.objects.push(obj);
            this.objectMap.set(id, obj);
            this.dirtyDetector.addRect(obj.x, obj.y, obj.width || 1, obj.height || 1);
            return id;
        }

        /**
         * 更新对象
         */
        updateObject(id, updates) {
            const obj = this.objectMap.get(id);
            if (obj) {
                Object.assign(obj, updates);
                this.dirtyDetector.addRect(obj.x, obj.y, obj.width || 1, obj.height || 1);
            }
        }

        /**
         * 删除对象
         */
        removeObject(id) {
            const obj = this.objectMap.get(id);
            if (obj) {
                this.objects = this.objects.filter(o => o.id !== id);
                this.objectMap.delete(id);
                this.dirtyDetector.addRect(obj.x, obj.y, obj.width || 1, obj.height || 1);
            }
        }

        /**
         * 开始渲染
         */
        start(renderFunc) {
            this.renderFunc = renderFunc;
            this.throttledRenderer.start((timestamp) => this.render(timestamp));
        }

        /**
         * 停止渲染
         */
        stop() {
            this.throttledRenderer.stop();
        }

        /**
         * 渲染
         */
        render(timestamp) {
            // 检测变化
            this.dirtyDetector.detectChanges(this.objects);

            // 获取脏矩形
            const dirtyRects = this.dirtyDetector.getDirtyRects();

            if (dirtyRects.length > 0) {
                // 只渲染脏区域
                for (const rect of dirtyRects) {
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
                    this.ctx.clip();

                    if (this.renderFunc) {
                        this.renderFunc(this.ctx, rect, timestamp);
                    } else {
                        this.defaultRender(rect);
                    }

                    this.ctx.restore();
                }

                // 清空脏矩形
                this.dirtyDetector.clear();
            }

            // 触发回调
            this.callbacks.onRender.forEach(cb => cb(timestamp));
        }

        /**
         * 默认渲染
         */
        defaultRender(rect) {
            // 清除脏区域
            this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

            // 渲染该区域内的对象
            for (const obj of this.objects) {
                if (this.isObjectInRect(obj, rect)) {
                    this.renderObject(obj);
                }
            }
        }

        /**
         * 检查对象是否在矩形内
         */
        isObjectInRect(obj, rect) {
            return !(obj.x + (obj.width || 0) < rect.x ||
                     rect.x + rect.width < obj.x ||
                     obj.y + (obj.height || 0) < rect.y ||
                     rect.y + rect.height < obj.y);
        }

        /**
         * 渲染单个对象
         */
        renderObject(obj) {
            if (obj.render) {
                obj.render(this.ctx);
            } else if (obj.type === 'rect') {
                this.ctx.fillStyle = obj.color || '#000';
                this.ctx.fillRect(obj.x, obj.y, obj.width || 1, obj.height || 1);
            } else if (obj.type === 'circle') {
                this.ctx.fillStyle = obj.color || '#000';
                this.ctx.beginPath();
                this.ctx.arc(obj.x, obj.y, obj.radius || 1, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (obj.type === 'text') {
                this.ctx.fillStyle = obj.color || '#000';
                this.ctx.font = obj.font || '16px Arial';
                this.ctx.fillText(obj.text || '', obj.x, obj.y);
            }
        }

        /**
         * 全量重绘
         */
        fullRedraw() {
            this.dirtyDetector.addRect(0, 0, this.config.width, this.config.height);
        }

        /**
         * 获取统计信息
         */
        getStats() {
            return {
                objects: this.objects.length,
                renderer: this.throttledRenderer.getStats(),
                dirtyRects: this.dirtyDetector.dirtyRects.length
            };
        }

        /**
         * 调整大小
         */
        resize(width, height) {
            this.config.width = width;
            this.config.height = height;
            this.canvas.width = width;
            this.canvas.height = height;
            this.offscreenRenderer.resize(width, height);
            this.fullRedraw();
        }

        /**
         * 销毁
         */
        destroy() {
            this.stop();
            this.objects = [];
            this.objectMap.clear();
            this.callbacks = { onRender: [], onUpdate: [] };
        }
    }

    // 导出
    global.CanvasOptimization = {
        OffscreenRenderer,
        LayeredRenderer,
        DirtyRectangleDetector,
        ThrottledRenderer,
        CanvasOptimizationManager
    };

    // 便捷创建
    global.createCanvasOptimizer = function(canvas, config = {}) {
        return new CanvasOptimizationManager(canvas, config);
    };

})(typeof window !== 'undefined' ? window : global);
/**
 * 多模态交互模块
 * Multimodal Interaction Module
 * 
 * 功能：
 * - 语音识别接口（Web Speech API封装）
 * - 手势识别（触摸事件处理）
 * - 表情/情绪识别接口
 * - 多模态融合处理
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环22
 */

(function(global) {
    'use strict';

    // ============================================
    // 模态类型定义 (Modal Types)
    // ============================================
    const ModalType = {
        VOICE: 'voice',           // 语音模态
        GESTURE: 'gesture',       // 手势模态
        FACIAL: 'facial',         // 面部表情模态
        TEXT: 'text',             // 文本模态
        TOUCH: 'touch',           // 触摸模态
        MOTION: 'motion'          // 运动模态
    };

    // ============================================
    // 情绪类型定义 (Emotion Types)
    // ============================================
    const EmotionType = {
        HAPPY: 'happy',
        SAD: 'sad',
        ANGRY: 'angry',
        FEARFUL: 'fearful',
        SURPRISED: 'surprised',
        DISGUSTED: 'disgusted',
        NEUTRAL: 'neutral',
        CONFUSED: 'confused',
        FRUSTRATED: 'frustrated',
        CONFIDENT: 'confident'
    };

    // ============================================
    // 手势类型定义 (Gesture Types)
    // ============================================
    const GestureType = {
        TAP: 'tap',                    // 点击
        DOUBLE_TAP: 'double_tap',      // 双击
        LONG_PRESS: 'long_press',      // 长按
        SWIPE_LEFT: 'swipe_left',      // 左滑
        SWIPE_RIGHT: 'swipe_right',    // 右滑
        SWIPE_UP: 'swipe_up',          // 上滑
        SWIPE_DOWN: 'swipe_down',      // 下滑
        PINCH: 'pinch',                // 捏合
        SPREAD: 'spread',              // 张开
        ROTATE: 'rotate',              // 旋转
        DRAG: 'drag',                  // 拖拽
        DROP: 'drop'                   // 放置
    };

    // ============================================
    // 语音识别管理器 (Voice Recognition Manager)
    // ============================================
    class VoiceRecognitionManager {
        constructor(config = {}) {
            this.config = {
                language: config.language || 'zh-CN',
                continuous: config.continuous || false,
                interimResults: config.interimResults || true,
                maxAlternatives: config.maxAlternatives || 3,
                ...config
            };

            this.recognition = null;
            this.isListening = false;
            this.eventHandlers = new Map();
            this.transcriptHistory = [];
            this.confidenceThreshold = config.confidenceThreshold || 0.7;

            this._initializeRecognition();
        }

        /**
         * 初始化语音识别
         */
        _initializeRecognition() {
            const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;
            
            if (!SpeechRecognition) {
                Logger?.warn('[VoiceRecognition] 浏览器不支持Web Speech API');
                return;
            }

            this.recognition = new SpeechRecognition();
            this.recognition.lang = this.config.language;
            this.recognition.continuous = this.config.continuous;
            this.recognition.interimResults = this.config.interimResults;
            this.recognition.maxAlternatives = this.config.maxAlternatives;

            // 绑定事件处理
            this.recognition.onstart = () => this._handleStart();
            this.recognition.onend = () => this._handleEnd();
            this.recognition.onresult = (event) => this._handleResult(event);
            this.recognition.onerror = (event) => this._handleError(event);
        }

        /**
         * 开始语音识别
         */
        start() {
            if (!this.recognition) {
                this._emit('error', { message: '语音识别不可用', code: 'NOT_SUPPORTED' });
                return false;
            }

            if (this.isListening) {
                return true;
            }

            try {
                this.recognition.start();
                return true;
            } catch (error) {
                Logger?.error('[VoiceRecognition] 启动失败:', error);
                this._emit('error', { message: error.message, code: 'START_FAILED' });
                return false;
            }
        }

        /**
         * 停止语音识别
         */
        stop() {
            if (this.recognition && this.isListening) {
                this.recognition.stop();
            }
        }

        /**
         * 处理识别开始
         */
        _handleStart() {
            this.isListening = true;
            this._emit('start', { timestamp: Date.now() });
        }

        /**
         * 处理识别结束
         */
        _handleEnd() {
            this.isListening = false;
            this._emit('end', { timestamp: Date.now() });
        }

        /**
         * 处理识别结果
         */
        _handleResult(event) {
            const results = [];
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const alternatives = [];
                
                for (let j = 0; j < result.length; j++) {
                    alternatives.push({
                        transcript: result[j].transcript,
                        confidence: result[j].confidence
                    });
                }

                results.push({
                    isFinal: result.isFinal,
                    alternatives: alternatives,
                    bestTranscript: alternatives[0]?.transcript || '',
                    bestConfidence: alternatives[0]?.confidence || 0
                });
            }

            // 记录到历史
            if (results.length > 0 && results[0].isFinal) {
                this.transcriptHistory.push({
                    timestamp: Date.now(),
                    results: results
                });
            }

            this._emit('result', { results: results });
        }

        /**
         * 处理识别错误
         */
        _handleError(event) {
            const errorMap = {
                'no-speech': '未检测到语音',
                'audio-capture': '无法捕获音频',
                'not-allowed': '麦克风权限被拒绝',
                'network': '网络错误',
                'aborted': '识别被中止',
                'service-not-allowed': '服务不允许'
            };

            this._emit('error', {
                code: event.error,
                message: errorMap[event.error] || '未知错误'
            });
        }

        /**
         * 事件监听
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        Logger?.error('[VoiceRecognition] 事件处理错误:', error);
                    }
                });
            }
        }

        /**
         * 获取历史记录
         */
        getHistory() {
            return [...this.transcriptHistory];
        }

        /**
         * 清空历史记录
         */
        clearHistory() {
            this.transcriptHistory = [];
        }

        /**
         * 检查是否支持语音识别
         */
        static isSupported() {
            return !!(global.SpeechRecognition || global.webkitSpeechRecognition);
        }
    }

    // ============================================
    // 手势识别管理器 (Gesture Recognition Manager)
    // ============================================
    class GestureRecognitionManager {
        constructor(config = {}) {
            this.config = {
                swipeThreshold: config.swipeThreshold || 50,      // 滑动阈值(像素)
                longPressDelay: config.longPressDelay || 500,     // 长按延迟(毫秒)
                doubleTapDelay: config.doubleTapDelay || 300,     // 双击间隔(毫秒)
                pinchThreshold: config.pinchThreshold || 10,      // 捏合阈值
                ...config
            };

            this.eventHandlers = new Map();
            this.touchState = {
                startX: 0,
                startY: 0,
                startTime: 0,
                lastTapTime: 0,
                lastTapX: 0,
                lastTapY: 0,
                isLongPress: false,
                longPressTimer: null,
                initialDistance: 0,
                initialAngle: 0,
                isDragging: false
            };
            this.gestureHistory = [];
        }

        /**
         * 初始化触摸事件监听
         */
        initialize(element) {
            if (!element) {
                Logger?.warn('[GestureRecognition] 无效的目标元素');
                return false;
            }

            this.targetElement = element;

            // 绑定触摸事件
            element.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: false });
            element.addEventListener('touchmove', (e) => this._handleTouchMove(e), { passive: false });
            element.addEventListener('touchend', (e) => this._handleTouchEnd(e), { passive: false });
            element.addEventListener('touchcancel', (e) => this._handleTouchCancel(e), { passive: false });

            // 绑定鼠标事件(桌面端模拟)
            element.addEventListener('mousedown', (e) => this._handleMouseDown(e));
            element.addEventListener('mousemove', (e) => this._handleMouseMove(e));
            element.addEventListener('mouseup', (e) => this._handleMouseUp(e));
            element.addEventListener('mouseleave', (e) => this._handleMouseLeave(e));

            return true;
        }

        /**
         * 处理触摸开始
         */
        _handleTouchStart(event) {
            const touch = event.touches[0];
            
            this.touchState.startX = touch.clientX;
            this.touchState.startY = touch.clientY;
            this.touchState.startTime = Date.now();
            this.touchState.isLongPress = false;
            this.touchState.isDragging = false;

            // 多指触摸处理
            if (event.touches.length === 2) {
                this._handleMultiTouchStart(event);
            }

            // 长按检测
            this.touchState.longPressTimer = setTimeout(() => {
                this.touchState.isLongPress = true;
                this._emitGesture(GestureType.LONG_PRESS, {
                    x: touch.clientX,
                    y: touch.clientY,
                    duration: this.config.longPressDelay
                });
            }, this.config.longPressDelay);
        }

        /**
         * 处理多点触摸开始
         */
        _handleMultiTouchStart(event) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            this.touchState.initialDistance = this._calculateDistance(
                touch1.clientX, touch1.clientY,
                touch2.clientX, touch2.clientY
            );

            this.touchState.initialAngle = this._calculateAngle(
                touch1.clientX, touch1.clientY,
                touch2.clientX, touch2.clientY
            );
        }

        /**
         * 处理触摸移动
         */
        _handleTouchMove(event) {
            if (this.touchState.longPressTimer) {
                clearTimeout(this.touchState.longPressTimer);
            }

            const touch = event.touches[0];
            const deltaX = touch.clientX - this.touchState.startX;
            const deltaY = touch.clientY - this.touchState.startY;

            // 多指触摸处理
            if (event.touches.length === 2) {
                this._handleMultiTouchMove(event);
                return;
            }

            // 检测拖拽
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                this.touchState.isDragging = true;
                this._emitGesture(GestureType.DRAG, {
                    startX: this.touchState.startX,
                    startY: this.touchState.startY,
                    currentX: touch.clientX,
                    currentY: touch.clientY,
                    deltaX: deltaX,
                    deltaY: deltaY
                });
            }
        }

        /**
         * 处理多点触摸移动
         */
        _handleMultiTouchMove(event) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            const currentDistance = this._calculateDistance(
                touch1.clientX, touch1.clientY,
                touch2.clientX, touch2.clientY
            );

            const currentAngle = this._calculateAngle(
                touch1.clientX, touch1.clientY,
                touch2.clientX, touch2.clientY
            );

            // 捏合手势
            const distanceDiff = currentDistance - this.touchState.initialDistance;
            if (Math.abs(distanceDiff) > this.config.pinchThreshold) {
                if (distanceDiff > 0) {
                    this._emitGesture(GestureType.SPREAD, {
                        scale: currentDistance / this.touchState.initialDistance
                    });
                } else {
                    this._emitGesture(GestureType.PINCH, {
                        scale: currentDistance / this.touchState.initialDistance
                    });
                }
            }

            // 旋转手势
            const angleDiff = currentAngle - this.touchState.initialAngle;
            if (Math.abs(angleDiff) > 10) {
                this._emitGesture(GestureType.ROTATE, {
                    angle: angleDiff
                });
            }
        }

        /**
         * 处理触摸结束
         */
        _handleTouchEnd(event) {
            if (this.touchState.longPressTimer) {
                clearTimeout(this.touchState.longPressTimer);
            }

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - this.touchState.startX;
            const deltaY = touch.clientY - this.touchState.startY;
            const duration = Date.now() - this.touchState.startTime;

            // 拖拽结束
            if (this.touchState.isDragging) {
                this._emitGesture(GestureType.DROP, {
                    startX: this.touchState.startX,
                    startY: this.touchState.startY,
                    endX: touch.clientX,
                    endY: touch.clientY
                });
                return;
            }

            // 长按不触发其他手势
            if (this.touchState.isLongPress) {
                return;
            }

            // 滑动手势检测
            if (Math.abs(deltaX) > this.config.swipeThreshold || 
                Math.abs(deltaY) > this.config.swipeThreshold) {
                this._detectSwipe(deltaX, deltaY, duration);
                return;
            }

            // 点击/双击检测
            this._detectTap(touch.clientX, touch.clientY);
        }

        /**
         * 处理触摸取消
         */
        _handleTouchCancel(event) {
            if (this.touchState.longPressTimer) {
                clearTimeout(this.touchState.longPressTimer);
            }
            this._resetTouchState();
        }

        /**
         * 检测滑动手势
         */
        _detectSwipe(deltaX, deltaY, duration) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            let gestureType = null;

            if (absX > absY) {
                // 水平滑动
                gestureType = deltaX > 0 ? GestureType.SWIPE_RIGHT : GestureType.SWIPE_LEFT;
            } else {
                // 垂直滑动
                gestureType = deltaY > 0 ? GestureType.SWIPE_DOWN : GestureType.SWIPE_UP;
            }

            this._emitGesture(gestureType, {
                distance: Math.max(absX, absY),
                duration: duration,
                direction: gestureType.replace('swipe_', '')
            });
        }

        /**
         * 检测点击手势
         */
        _detectTap(x, y) {
            const now = Date.now();
            const timeDiff = now - this.touchState.lastTapTime;
            const distanceDiff = Math.sqrt(
                Math.pow(x - this.touchState.lastTapX, 2) +
                Math.pow(y - this.touchState.lastTapY, 2)
            );

            if (timeDiff < this.config.doubleTapDelay && distanceDiff < 30) {
                // 双击
                this._emitGesture(GestureType.DOUBLE_TAP, {
                    x: x,
                    y: y
                });
                this.touchState.lastTapTime = 0;
            } else {
                // 单击
                this._emitGesture(GestureType.TAP, {
                    x: x,
                    y: y
                });
                this.touchState.lastTapTime = now;
                this.touchState.lastTapX = x;
                this.touchState.lastTapY = y;
            }
        }

        /**
         * 鼠标事件处理(桌面端模拟)
         */
        _handleMouseDown(event) {
            this.touchState.startX = event.clientX;
            this.touchState.startY = event.clientY;
            this.touchState.startTime = Date.now();
            this.touchState.isDragging = false;
        }

        _handleMouseMove(event) {
            if (this.touchState.startTime > 0) {
                const deltaX = event.clientX - this.touchState.startX;
                const deltaY = event.clientY - this.touchState.startY;

                if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                    this.touchState.isDragging = true;
                    this._emitGesture(GestureType.DRAG, {
                        startX: this.touchState.startX,
                        startY: this.touchState.startY,
                        currentX: event.clientX,
                        currentY: event.clientY,
                        deltaX: deltaX,
                        deltaY: deltaY
                    });
                }
            }
        }

        _handleMouseUp(event) {
            if (this.touchState.startTime > 0) {
                const deltaX = event.clientX - this.touchState.startX;
                const deltaY = event.clientY - this.touchState.startY;

                if (this.touchState.isDragging) {
                    this._emitGesture(GestureType.DROP, {
                        startX: this.touchState.startX,
                        startY: this.touchState.startY,
                        endX: event.clientX,
                        endY: event.clientY
                    });
                } else {
                    this._emitGesture(GestureType.TAP, {
                        x: event.clientX,
                        y: event.clientY
                    });
                }
            }
            this._resetTouchState();
        }

        _handleMouseLeave(event) {
            this._resetTouchState();
        }

        /**
         * 计算两点距离
         */
        _calculateDistance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }

        /**
         * 计算两点角度
         */
        _calculateAngle(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        }

        /**
         * 重置触摸状态
         */
        _resetTouchState() {
            this.touchState.startTime = 0;
            this.touchState.isDragging = false;
            this.touchState.isLongPress = false;
        }

        /**
         * 触发手势事件
         */
        _emitGesture(type, data) {
            const gesture = {
                type: type,
                data: data,
                timestamp: Date.now()
            };

            this.gestureHistory.push(gesture);
            this._emit('gesture', gesture);
        }

        /**
         * 事件监听
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        Logger?.error('[GestureRecognition] 事件处理错误:', error);
                    }
                });
            }
        }

        /**
         * 获取手势历史
         */
        getHistory() {
            return [...this.gestureHistory];
        }

        /**
         * 销毁实例
         */
        destroy() {
            if (this.targetElement) {
                // 移除事件监听...
            }
            this.eventHandlers.clear();
            this.gestureHistory = [];
        }
    }

    // ============================================
    // 情绪识别管理器 (Emotion Recognition Manager)
    // ============================================
    class EmotionRecognitionManager {
        constructor(config = {}) {
            this.config = {
                detectionInterval: config.detectionInterval || 500,
                confidenceThreshold: config.confidenceThreshold || 0.6,
                ...config
            };

            this.eventHandlers = new Map();
            this.isDetecting = false;
            this.detectionTimer = null;
            this.emotionHistory = [];
            this.currentEmotion = null;
        }

        /**
         * 开始情绪检测
         */
        startDetection(videoElement) {
            if (!videoElement) {
                Logger?.warn('[EmotionRecognition] 无效的视频元素');
                return false;
            }

            this.videoElement = videoElement;
            this.isDetecting = true;

            // 模拟情绪检测循环
            this.detectionTimer = setInterval(() => {
                this._detectEmotion();
            }, this.config.detectionInterval);

            this._emit('start', { timestamp: Date.now() });
            return true;
        }

        /**
         * 停止情绪检测
         */
        stopDetection() {
            if (this.detectionTimer) {
                clearInterval(this.detectionTimer);
                this.detectionTimer = null;
            }
            this.isDetecting = false;
            this._emit('stop', { timestamp: Date.now() });
        }

        /**
         * 情绪检测(模拟实现)
         */
        _detectEmotion() {
            // 实际实现需要集成face-api.js或类似库
            // 这里提供接口框架
            
            const emotions = this._analyzeEmotion();
            
            if (emotions && emotions.confidence > this.config.confidenceThreshold) {
                this.currentEmotion = emotions;
                this.emotionHistory.push({
                    timestamp: Date.now(),
                    emotion: emotions
                });
                this._emit('emotion', emotions);
            }
        }

        /**
         * 分析情绪(模拟)
         */
        _analyzeEmotion() {
            // 模拟情绪检测
            // 实际应用中应使用face-api.js或TensorFlow.js
            const emotions = [
                { type: EmotionType.NEUTRAL, confidence: 0.7 },
                { type: EmotionType.HAPPY, confidence: 0.2 },
                { type: EmotionType.CONFUSED, confidence: 0.1 }
            ];

            return emotions.sort((a, b) => b.confidence - a.confidence)[0];
        }

        /**
         * 基于文本的情绪分析
         */
        analyzeTextEmotion(text) {
            // 简单的关键词情绪分析
            const emotionKeywords = {
                [EmotionType.HAPPY]: ['开心', '高兴', '快乐', '棒', '好', '喜欢', '哈哈', '谢谢'],
                [EmotionType.SAD]: ['难过', '伤心', '悲伤', '失望', '遗憾', '可惜'],
                [EmotionType.ANGRY]: ['生气', '愤怒', '讨厌', '烦', '不满', '恼火'],
                [EmotionType.FRUSTRATED]: ['沮丧', '无奈', '纠结', '困扰', '麻烦'],
                [EmotionType.CONFUSED]: ['困惑', '疑惑', '不明白', '不懂', '什么意思'],
                [EmotionType.CONFIDENT]: ['确定', '肯定', '相信', '坚信', '没问题']
            };

            let detectedEmotion = { type: EmotionType.NEUTRAL, confidence: 0.5 };

            for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        detectedEmotion = {
                            type: emotion,
                            confidence: 0.8,
                            matchedKeyword: keyword
                        };
                        break;
                    }
                }
            }

            return detectedEmotion;
        }

        /**
         * 获取当前情绪
         */
        getCurrentEmotion() {
            return this.currentEmotion;
        }

        /**
         * 获取情绪历史
         */
        getHistory() {
            return [...this.emotionHistory];
        }

        /**
         * 事件监听
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        Logger?.error('[EmotionRecognition] 事件处理错误:', error);
                    }
                });
            }
        }
    }

    // ============================================
    // 多模态融合处理器 (Multimodal Fusion Processor)
    // ============================================
    class MultimodalFusionProcessor {
        constructor(config = {}) {
            this.config = {
                fusionWindow: config.fusionWindow || 1000,  // 融合时间窗口(毫秒)
                weightVoice: config.weightVoice || 0.4,
                weightGesture: config.weightGesture || 0.3,
                weightEmotion: config.weightEmotion || 0.3,
                ...config
            };

            this.modalInputs = new Map();
            this.fusionHistory = [];
            this.eventHandlers = new Map();

            this._initializeModalInputs();
        }

        /**
         * 初始化模态输入存储
         */
        _initializeModalInputs() {
            Object.values(ModalType).forEach(modal => {
                this.modalInputs.set(modal, {
                    data: null,
                    timestamp: 0,
                    weight: this._getModalWeight(modal)
                });
            });
        }

        /**
         * 获取模态权重
         */
        _getModalWeight(modalType) {
            const weights = {
                [ModalType.VOICE]: this.config.weightVoice,
                [ModalType.GESTURE]: this.config.weightGesture,
                [ModalType.FACIAL]: this.config.weightEmotion,
                [ModalType.TEXT]: 0.5,
                [ModalType.TOUCH]: 0.3,
                [ModalType.MOTION]: 0.2
            };
            return weights[modalType] || 0.25;
        }

        /**
         * 接收模态输入
         */
        receiveInput(modalType, data) {
            if (!this.modalInputs.has(modalType)) {
                Logger?.warn('[MultimodalFusion] 未知的模态类型:', modalType);
                return;
            }

            const input = {
                data: data,
                timestamp: Date.now(),
                weight: this._getModalWeight(modalType)
            };

            this.modalInputs.set(modalType, input);

            // 尝试融合
            this._tryFusion();
        }

        /**
         * 尝试多模态融合
         */
        _tryFusion() {
            const now = Date.now();
            const activeInputs = [];

            // 收集时间窗口内的有效输入
            this.modalInputs.forEach((input, modalType) => {
                if (input.data && (now - input.timestamp) < this.config.fusionWindow) {
                    activeInputs.push({
                        modalType: modalType,
                        ...input
                    });
                }
            });

            // 单模态输入直接输出
            if (activeInputs.length === 1) {
                this._emitFusion({
                    type: 'single',
                    modalType: activeInputs[0].modalType,
                    data: activeInputs[0].data,
                    confidence: 0.7
                });
                return;
            }

            // 多模态融合
            if (activeInputs.length > 1) {
                const fusedResult = this._performFusion(activeInputs);
                this._emitFusion(fusedResult);
            }
        }

        /**
         * 执行融合计算
         */
        _performFusion(inputs) {
            const totalWeight = inputs.reduce((sum, input) => sum + input.weight, 0);
            
            // 基于加权投票的意图识别
            const intentVotes = new Map();

            inputs.forEach(input => {
                const normalizedWeight = input.weight / totalWeight;
                const intent = this._extractIntent(input);

                if (intent) {
                    const current = intentVotes.get(intent.type) || { weight: 0, data: [] };
                    intentVotes.set(intent.type, {
                        weight: current.weight + normalizedWeight,
                        data: [...current.data, { modalType: input.modalType, intent: intent }]
                    });
                }
            });

            // 选择最高权重的意图
            let bestIntent = { type: 'unknown', confidence: 0 };
            intentVotes.forEach((value, key) => {
                if (value.weight > bestIntent.confidence) {
                    bestIntent = {
                        type: key,
                        confidence: value.weight,
                        modalData: value.data
                    };
                }
            });

            return {
                type: 'fused',
                intent: bestIntent,
                activeModals: inputs.map(i => i.modalType),
                timestamp: Date.now()
            };
        }

        /**
         * 从输入中提取意图
         */
        _extractIntent(input) {
            switch (input.modalType) {
                case ModalType.VOICE:
                    return this._extractVoiceIntent(input.data);
                case ModalType.GESTURE:
                    return this._extractGestureIntent(input.data);
                case ModalType.FACIAL:
                    return this._extractEmotionIntent(input.data);
                default:
                    return { type: 'unknown', confidence: 0 };
            }
        }

        /**
         * 从语音提取意图
         */
        _extractVoiceIntent(data) {
            const intentKeywords = {
                'confirm': ['确定', '好的', '是', '对', '确认'],
                'cancel': ['取消', '不', '不是', '拒绝'],
                'help': ['帮助', '怎么', '什么', '如何'],
                'navigate': ['去', '跳转', '打开', '下一页', '上一页'],
                'select': ['选择', '点击', '这个']
            };

            if (data.results && data.results[0]) {
                const transcript = data.results[0].bestTranscript || '';
                
                for (const [intent, keywords] of Object.entries(intentKeywords)) {
                    for (const keyword of keywords) {
                        if (transcript.includes(keyword)) {
                            return { type: intent, confidence: 0.8, transcript };
                        }
                    }
                }
            }

            return { type: 'unknown', confidence: 0.3 };
        }

        /**
         * 从手势提取意图
         */
        _extractGestureIntent(data) {
            const gestureIntents = {
                [GestureType.TAP]: { type: 'select', confidence: 0.7 },
                [GestureType.DOUBLE_TAP]: { type: 'zoom', confidence: 0.7 },
                [GestureType.SWIPE_LEFT]: { type: 'next', confidence: 0.8 },
                [GestureType.SWIPE_RIGHT]: { type: 'previous', confidence: 0.8 },
                [GestureType.SWIPE_UP]: { type: 'scroll_down', confidence: 0.7 },
                [GestureType.SWIPE_DOWN]: { type: 'scroll_up', confidence: 0.7 },
                [GestureType.LONG_PRESS]: { type: 'context_menu', confidence: 0.8 },
                [GestureType.PINCH]: { type: 'zoom_out', confidence: 0.8 },
                [GestureType.SPREAD]: { type: 'zoom_in', confidence: 0.8 }
            };

            if (data.type && gestureIntents[data.type]) {
                return gestureIntents[data.type];
            }

            return { type: 'unknown', confidence: 0.3 };
        }

        /**
         * 从情绪提取意图
         */
        _extractEmotionIntent(data) {
            const emotionIntents = {
                [EmotionType.HAPPY]: { type: 'positive_feedback', confidence: 0.6 },
                [EmotionType.FRUSTRATED]: { type: 'need_help', confidence: 0.7 },
                [EmotionType.CONFUSED]: { type: 'need_explanation', confidence: 0.8 },
                [EmotionType.CONFIDENT]: { type: 'ready_to_proceed', confidence: 0.7 }
            };

            if (data.type && emotionIntents[data.type]) {
                return emotionIntents[data.type];
            }

            return { type: 'neutral', confidence: 0.5 };
        }

        /**
         * 发送融合结果
         */
        _emitFusion(result) {
            this.fusionHistory.push(result);
            this._emit('fusion', result);
        }

        /**
         * 事件监听
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        Logger?.error('[MultimodalFusion] 事件处理错误:', error);
                    }
                });
            }
        }

        /**
         * 获取融合历史
         */
        getHistory() {
            return [...this.fusionHistory];
        }
    }

    // ============================================
    // 多模态交互系统主类 (Multimodal Interaction System)
    // ============================================
    class MultimodalInteractionSystem {
        constructor(config = {}) {
            this.config = {
                enableVoice: config.enableVoice !== false,
                enableGesture: config.enableGesture !== false,
                enableEmotion: config.enableEmotion !== false,
                enableFusion: config.enableFusion !== false,
                ...config
            };

            // 初始化各子模块
            this.voiceManager = this.config.enableVoice ? 
                new VoiceRecognitionManager(config.voice) : null;
            
            this.gestureManager = this.config.enableGesture ? 
                new GestureRecognitionManager(config.gesture) : null;
            
            this.emotionManager = this.config.enableEmotion ? 
                new EmotionRecognitionManager(config.emotion) : null;
            
            this.fusionProcessor = this.config.enableFusion ? 
                new MultimodalFusionProcessor(config.fusion) : null;

            this.eventHandlers = new Map();
            this._setupEventRouting();
        }

        /**
         * 设置事件路由
         */
        _setupEventRouting() {
            // 语音事件路由
            if (this.voiceManager) {
                this.voiceManager.on('result', (data) => {
                    this._handleVoiceResult(data);
                });
                this.voiceManager.on('error', (data) => {
                    this._emit('voice:error', data);
                });
            }

            // 手势事件路由
            if (this.gestureManager) {
                this.gestureManager.on('gesture', (data) => {
                    this._handleGestureResult(data);
                });
            }

            // 情绪事件路由
            if (this.emotionManager) {
                this.emotionManager.on('emotion', (data) => {
                    this._handleEmotionResult(data);
                });
            }

            // 融合事件路由
            if (this.fusionProcessor) {
                this.fusionProcessor.on('fusion', (data) => {
                    this._emit('fusion', data);
                });
            }
        }

        /**
         * 处理语音结果
         */
        _handleVoiceResult(data) {
            this._emit('voice:result', data);
            
            if (this.fusionProcessor) {
                this.fusionProcessor.receiveInput(ModalType.VOICE, data);
            }
        }

        /**
         * 处理手势结果
         */
        _handleGestureResult(data) {
            this._emit('gesture:result', data);
            
            if (this.fusionProcessor) {
                this.fusionProcessor.receiveInput(ModalType.GESTURE, data);
            }
        }

        /**
         * 处理情绪结果
         */
        _handleEmotionResult(data) {
            this._emit('emotion:result', data);
            
            if (this.fusionProcessor) {
                this.fusionProcessor.receiveInput(ModalType.FACIAL, data);
            }
        }

        /**
         * 初始化手势识别
         */
        initializeGestures(element) {
            if (this.gestureManager) {
                return this.gestureManager.initialize(element);
            }
            return false;
        }

        /**
         * 开始语音识别
         */
        startVoiceRecognition() {
            if (this.voiceManager) {
                return this.voiceManager.start();
            }
            return false;
        }

        /**
         * 停止语音识别
         */
        stopVoiceRecognition() {
            if (this.voiceManager) {
                this.voiceManager.stop();
            }
        }

        /**
         * 开始情绪检测
         */
        startEmotionDetection(videoElement) {
            if (this.emotionManager) {
                return this.emotionManager.startDetection(videoElement);
            }
            return false;
        }

        /**
         * 停止情绪检测
         */
        stopEmotionDetection() {
            if (this.emotionManager) {
                this.emotionManager.stopDetection();
            }
        }

        /**
         * 分析文本情绪
         */
        analyzeTextEmotion(text) {
            if (this.emotionManager) {
                return this.emotionManager.analyzeTextEmotion(text);
            }
            return { type: EmotionType.NEUTRAL, confidence: 0.5 };
        }

        /**
         * 手动发送模态输入
         */
        sendInput(modalType, data) {
            if (this.fusionProcessor) {
                this.fusionProcessor.receiveInput(modalType, data);
            }
        }

        /**
         * 事件监听
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            if (this.eventHandlers.has(event)) {
                const handlers = this.eventHandlers.get(event);
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        }

        /**
         * 触发事件
         */
        _emit(event, data) {
            if (this.eventHandlers.has(event)) {
                this.eventHandlers.get(event).forEach(handler => {
                    try {
                        handler(data);
                    } catch (error) {
                        Logger?.error('[MultimodalInteraction] 事件处理错误:', error);
                    }
                });
            }
        }

        /**
         * 检查浏览器支持
         */
        static checkSupport() {
            return {
                voice: VoiceRecognitionManager.isSupported(),
                gesture: 'ontouchstart' in global || 'onmousedown' in global,
                emotion: 'mediaDevices' in navigator,
                fusion: true
            };
        }

        /**
         * 销毁系统
         */
        destroy() {
            if (this.voiceManager) {
                this.voiceManager.stop();
            }
            if (this.emotionManager) {
                this.emotionManager.stopDetection();
            }
            if (this.gestureManager) {
                this.gestureManager.destroy();
            }
            this.eventHandlers.clear();
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            MultimodalInteractionSystem,
            VoiceRecognitionManager,
            GestureRecognitionManager,
            EmotionRecognitionManager,
            MultimodalFusionProcessor,
            ModalType,
            EmotionType,
            GestureType
        };
    } else {
        global.MultimodalInteractionSystem = MultimodalInteractionSystem;
        global.VoiceRecognitionManager = VoiceRecognitionManager;
        global.GestureRecognitionManager = GestureRecognitionManager;
        global.EmotionRecognitionManager = EmotionRecognitionManager;
        global.MultimodalFusionProcessor = MultimodalFusionProcessor;
        global.ModalType = ModalType;
        global.EmotionType = EmotionType;
        global.GestureType = GestureType;
    }

})(typeof window !== 'undefined' ? window : this);

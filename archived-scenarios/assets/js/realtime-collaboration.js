/**
 * 实时协作系统
 * Real-Time Collaboration System
 * 
 * 包含：房间管理、消息广播、状态同步、用户在线状态、协作编辑
 * 
 * 来源：Soul Auto-Evolution 循环11
 * 创建时间：2026-03-13
 */

(function(global) {
    'use strict';

    // ============================================
    // WebSocket管理器 (WebSocket Manager)
    // ============================================
    class WebSocketManager {
        constructor(config = {}) {
            this.config = {
                url: config.url || 'ws://localhost:8080',
                reconnectInterval: config.reconnectInterval || 3000,
                maxReconnectAttempts: config.maxReconnectAttempts || 5,
                heartbeatInterval: config.heartbeatInterval || 30000,
                ...config
            };

            this.ws = null;
            this.isConnected = false;
            this.reconnectAttempts = 0;
            this.messageQueue = [];
            this.eventHandlers = new Map();
            this.heartbeatTimer = null;

            this.eventTypes = {
                CONNECTED: 'connected',
                DISCONNECTED: 'disconnected',
                MESSAGE: 'message',
                ERROR: 'error',
                RECONNECTING: 'reconnecting'
            };
        }

        /**
         * 连接WebSocket
         */
        connect() {
            return new Promise((resolve, reject) => {
                try {
                    this.ws = new WebSocket(this.config.url);

                    this.ws.onopen = () => {
                        this.isConnected = true;
                        this.reconnectAttempts = 0;
                        this.flushMessageQueue();
                        this.startHeartbeat();
                        this.emit(this.eventTypes.CONNECTED);
                        resolve();
                    };

                    this.ws.onmessage = (event) => {
                        try {
                            const message = JSON.parse(event.data);
                            this.emit(this.eventTypes.MESSAGE, message);
                        } catch (e) {
                            if (typeof Logger !== 'undefined') {
                                Logger.warn('RealtimeCollaboration', 'Message parse error, using raw data');
                            }
                            this.emit(this.eventTypes.MESSAGE, event.data);
                        }
                    };

                    this.ws.onclose = () => {
                        this.isConnected = false;
                        this.stopHeartbeat();
                        this.emit(this.eventTypes.DISCONNECTED);
                        this.attemptReconnect();
                    };

                    this.ws.onerror = (error) => {
                        this.emit(this.eventTypes.ERROR, error);
                        reject(error);
                    };

                } catch (error) {
                    reject(error);
                }
            });
        }

        /**
         * 断开连接
         */
        disconnect() {
            if (this.ws) {
                this.stopHeartbeat();
                this.ws.close();
                this.ws = null;
                this.isConnected = false;
            }
        }

        /**
         * 发送消息
         */
        send(type, payload) {
            const message = { type, payload, timestamp: Date.now() };

            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(message));
                return true;
            } else {
                this.messageQueue.push(message);
                return false;
            }
        }

        /**
         * 刷新消息队列
         */
        flushMessageQueue() {
            while (this.messageQueue.length > 0 && this.isConnected) {
                const message = this.messageQueue.shift();
                this.ws.send(JSON.stringify(message));
            }
        }

        /**
         * 尝试重连
         */
        attemptReconnect() {
            if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
                Logger?.error('Max reconnection attempts reached');
                return;
            }

            this.reconnectAttempts++;
            this.emit(this.eventTypes.RECONNECTING, { attempt: this.reconnectAttempts });

            setTimeout(() => {
                this.connect().catch(() => {});
            }, this.config.reconnectInterval);
        }

        /**
         * 开始心跳
         */
        startHeartbeat() {
            this.heartbeatTimer = setInterval(() => {
                if (this.isConnected) {
                    this.send('heartbeat', { ping: true });
                }
            }, this.config.heartbeatInterval);
        }

        /**
         * 停止心跳
         */
        stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        }

        /**
         * 注册事件处理器
         */
        on(event, handler) {
            if (!this.eventHandlers.has(event)) {
                this.eventHandlers.set(event, []);
            }
            this.eventHandlers.get(event).push(handler);
        }

        /**
         * 移除事件处理器
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
        emit(event, data) {
            if (this.eventHandlers.has(event)) {
                for (const handler of this.eventHandlers.get(event)) {
                    handler(data);
                }
            }
        }
    }

    // ============================================
    // 房间管理器 (Room Manager)
    // ============================================
    class RoomManager {
        constructor(wsManager) {
            this.wsManager = wsManager;
            this.rooms = new Map();
            this.currentRoom = null;
            this.userId = this.generateUserId();
            this.userName = 'User_' + Math.random().toString(36).substr(2, 4);

            this.setupMessageHandlers();
        }

        generateUserId() {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        }

        /**
         * 设置消息处理器
         */
        setupMessageHandlers() {
            this.wsManager.on('message', (message) => {
                this.handleMessage(message);
            });
        }

        /**
         * 加入房间
         */
        joinRoom(roomId, options = {}) {
            const room = {
                id: roomId,
                name: options.name || roomId,
                users: new Map(),
                state: options.initialState || {},
                createdAt: Date.now(),
                isJoined: false
            };

            this.rooms.set(roomId, room);
            this.currentRoom = room;

            // 发送加入房间消息
            this.wsManager.send('room:join', {
                roomId,
                userId: this.userId,
                userName: this.userName,
                ...options
            });

            return room;
        }

        /**
         * 离开房间
         */
        leaveRoom(roomId) {
            if (this.rooms.has(roomId)) {
                this.wsManager.send('room:leave', {
                    roomId,
                    userId: this.userId
                });
                this.rooms.delete(roomId);
                if (this.currentRoom?.id === roomId) {
                    this.currentRoom = null;
                }
            }
        }

        /**
         * 获取房间内所有用户
         */
        getRoomUsers(roomId) {
            const room = this.rooms.get(roomId);
            return room ? Array.from(room.users.values()) : [];
        }

        /**
         * 广播消息到房间
         */
        broadcast(roomId, event, data) {
            this.wsManager.send('room:broadcast', {
                roomId,
                event,
                data,
                senderId: this.userId
            });
        }

        /**
         * 发送私信
         */
        sendPrivateMessage(targetUserId, message) {
            this.wsManager.send('message:private', {
                senderId: this.userId,
                targetUserId,
                message,
                timestamp: Date.now()
            });
        }

        /**
         * 处理收到的消息
         */
        handleMessage(message) {
            const { type, payload } = message;

            switch (type) {
                case 'room:joined':
                    this.handleRoomJoined(payload);
                    break;
                case 'room:user_joined':
                    this.handleUserJoined(payload);
                    break;
                case 'room:user_left':
                    this.handleUserLeft(payload);
                    break;
                case 'room:broadcast':
                    this.handleBroadcast(payload);
                    break;
                case 'room:state_sync':
                    this.handleStateSync(payload);
                    break;
                case 'user:presence':
                    this.handleUserPresence(payload);
                    break;
            }
        }

        handleRoomJoined(payload) {
            const room = this.rooms.get(payload.roomId);
            if (room) {
                room.isJoined = true;
                room.users = new Map(Object.entries(payload.users || {}));
                this.wsManager.emit('room:joined', room);
            }
        }

        handleUserJoined(payload) {
            const room = this.rooms.get(payload.roomId);
            if (room) {
                room.users.set(payload.userId, {
                    id: payload.userId,
                    name: payload.userName,
                    joinedAt: payload.timestamp
                });
                this.wsManager.emit('room:user_joined', payload);
            }
        }

        handleUserLeft(payload) {
            const room = this.rooms.get(payload.roomId);
            if (room) {
                room.users.delete(payload.userId);
                this.wsManager.emit('room:user_left', payload);
            }
        }

        handleBroadcast(payload) {
            this.wsManager.emit('room:broadcast', payload);
        }

        handleStateSync(payload) {
            const room = this.rooms.get(payload.roomId);
            if (room) {
                room.state = { ...room.state, ...payload.state };
                this.wsManager.emit('room:state_sync', room.state);
            }
        }

        handleUserPresence(payload) {
            this.wsManager.emit('user:presence', payload);
        }

        /**
         * 同步房间状态
         */
        syncState(roomId, state) {
            this.wsManager.send('room:state_sync', {
                roomId,
                state,
                senderId: this.userId,
                timestamp: Date.now()
            });
        }
    }

    // ============================================
    // 协作编辑器 (Collaborative Editor)
    // ============================================
    class CollaborativeEditor {
        constructor(roomManager) {
            this.roomManager = roomManager;
            this.documents = new Map();
            this.localChanges = [];
            this.remoteChanges = [];
            this.version = 0;

            this.setupHandlers();
        }

        /**
         * 设置处理器
         */
        setupHandlers() {
            this.roomManager.wsManager.on('room:broadcast', (payload) => {
                if (payload.event === 'editor:change') {
                    this.applyRemoteChange(payload.data);
                }
            });

            this.roomManager.wsManager.on('room:state_sync', (state) => {
                if (state.document) {
                    this.syncDocument(state.document);
                }
            });
        }

        /**
         * 创建文档
         */
        createDocument(docId, content = '') {
            const doc = {
                id: docId,
                content,
                version: 0,
                operations: [],
                cursors: new Map(),
                lastModified: Date.now()
            };

            this.documents.set(docId, doc);
            return doc;
        }

        /**
         * 应用本地编辑
         */
        applyLocalEdit(docId, operation) {
            const doc = this.documents.get(docId);
            if (!doc) return null;

            // 记录操作
            const op = {
                id: 'op_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                type: operation.type, // 'insert', 'delete', 'replace'
                position: operation.position,
                content: operation.content,
                length: operation.length,
                version: doc.version,
                timestamp: Date.now(),
                userId: this.roomManager.userId
            };

            doc.operations.push(op);
            doc.version++;
            doc.lastModified = Date.now();

            // 应用到本地内容
            this.applyOperation(doc, op);

            // 广播到其他用户
            this.roomManager.broadcast(
                this.roomManager.currentRoom?.id,
                'editor:change',
                { docId, operation: op }
            );

            this.localChanges.push(op);
            return op;
        }

        /**
         * 应用操作到文档
         */
        applyOperation(doc, op) {
            switch (op.type) {
                case 'insert':
                    doc.content = 
                        doc.content.slice(0, op.position) + 
                        op.content + 
                        doc.content.slice(op.position);
                    break;
                case 'delete':
                    doc.content = 
                        doc.content.slice(0, op.position) + 
                        doc.content.slice(op.position + op.length);
                    break;
                case 'replace':
                    doc.content = 
                        doc.content.slice(0, op.position) + 
                        op.content + 
                        doc.content.slice(op.position + op.length);
                    break;
            }
        }

        /**
         * 应用远程编辑
         */
        applyRemoteChange(data) {
            const doc = this.documents.get(data.docId);
            if (!doc) return;

            const op = data.operation;

            // 跳过自己的操作
            if (op.userId === this.roomManager.userId) return;

            // 检查版本
            if (op.version < doc.version) {
                // 需要转换操作 (简化处理)
                this.transformOperation(doc, op);
            }

            this.applyOperation(doc, op);
            doc.version++;
            doc.operations.push(op);
            doc.lastModified = Date.now();

            this.remoteChanges.push(op);

            // 触发更新事件
            this.roomManager.wsManager.emit('editor:remote_change', {
                docId: data.docId,
                operation: op,
                content: doc.content
            });
        }

        /**
         * 转换操作 (Operational Transformation 简化版)
         */
        transformOperation(doc, op) {
            // 简化的OT实现
            const pendingOps = doc.operations.filter(
                o => o.version >= op.version && o.userId !== op.userId
            );

            for (const pendingOp of pendingOps) {
                if (pendingOp.type === 'insert' && pendingOp.position <= op.position) {
                    op.position += pendingOp.content.length;
                } else if (pendingOp.type === 'delete' && pendingOp.position < op.position) {
                    op.position -= pendingOp.length;
                }
            }
        }

        /**
         * 更新光标位置
         */
        updateCursor(docId, position) {
            this.roomManager.broadcast(
                this.roomManager.currentRoom?.id,
                'editor:cursor',
                {
                    docId,
                    userId: this.roomManager.userId,
                    userName: this.roomManager.userName,
                    position,
                    timestamp: Date.now()
                }
            );
        }

        /**
         * 获取文档内容
         */
        getDocument(docId) {
            return this.documents.get(docId);
        }

        /**
         * 同步文档
         */
        syncDocument(docData) {
            const doc = this.documents.get(docData.id);
            if (doc) {
                doc.content = docData.content;
                doc.version = docData.version;
                doc.lastModified = Date.now();
            }
        }
    }

    // ============================================
    // 用户在线状态管理器 (User Presence Manager)
    // ============================================
    class UserPresenceManager {
        constructor(roomManager) {
            this.roomManager = roomManager;
            this.presenceData = new Map();
            this.activityStates = {
                ONLINE: 'online',
                AWAY: 'away',
                BUSY: 'busy',
                OFFLINE: 'offline'
            };

            this.setupHandlers();
        }

        setupHandlers() {
            this.roomManager.wsManager.on('room:user_joined', (data) => {
                this.updatePresence(data.userId, {
                    status: this.activityStates.ONLINE,
                    userName: data.userName,
                    lastSeen: Date.now()
                });
            });

            this.roomManager.wsManager.on('room:user_left', (data) => {
                this.updatePresence(data.userId, {
                    status: this.activityStates.OFFLINE,
                    lastSeen: Date.now()
                });
            });

            this.roomManager.wsManager.on('user:presence', (data) => {
                this.updatePresence(data.userId, data);
            });
        }

        /**
         * 更新用户在线状态
         */
        updatePresence(userId, data) {
            this.presenceData.set(userId, {
                ...this.presenceData.get(userId),
                ...data,
                updatedAt: Date.now()
            });

            this.roomManager.wsManager.emit('presence:updated', {
                userId,
                data: this.presenceData.get(userId)
            });
        }

        /**
         * 设置自己的状态
         */
        setMyStatus(status) {
            this.updatePresence(this.roomManager.userId, { status });
            this.roomManager.wsManager.send('presence:update', {
                userId: this.roomManager.userId,
                status,
                timestamp: Date.now()
            });
        }

        /**
         * 获取用户状态
         */
        getUserPresence(userId) {
            return this.presenceData.get(userId);
        }

        /**
         * 获取所有在线用户
         */
        getOnlineUsers() {
            const online = [];
            for (const [userId, data] of this.presenceData) {
                if (data.status !== this.activityStates.OFFLINE) {
                    online.push({ userId, ...data });
                }
            }
            return online;
        }
    }

    // ============================================
    // 协作会话管理器 (Collaboration Session Manager)
    // ============================================
    class CollaborationSessionManager {
        constructor(config = {}) {
            this.wsManager = new WebSocketManager(config);
            this.roomManager = new RoomManager(this.wsManager);
            this.editor = new CollaborativeEditor(this.roomManager);
            this.presence = new UserPresenceManager(this.roomManager);

            this.sessionId = null;
            this.isInitialized = false;
        }

        /**
         * 初始化协作会话
         */
        async initialize(sessionId) {
            this.sessionId = sessionId;

            await this.wsManager.connect();
            this.isInitialized = true;

            return {
                sessionId,
                userId: this.roomManager.userId,
                userName: this.roomManager.userName
            };
        }

        /**
         * 创建协作房间
         */
        createCollaborationRoom(roomId, options = {}) {
            return this.roomManager.joinRoom(roomId, options);
        }

        /**
         * 开始协作编辑
         */
        startCollaborativeEditing(docId, initialContent = '') {
            const doc = this.editor.createDocument(docId, initialContent);

            // 同步初始状态
            this.roomManager.syncState(this.roomManager.currentRoom?.id, {
                document: { id: docId, content: initialContent, version: 0 }
            });

            return doc;
        }

        /**
         * 编辑文档
         */
        editDocument(docId, operation) {
            return this.editor.applyLocalEdit(docId, operation);
        }

        /**
         * 获取完整会话状态
         */
        getSessionState() {
            return {
                sessionId: this.sessionId,
                isConnected: this.wsManager.isConnected,
                currentRoom: this.roomManager.currentRoom,
                onlineUsers: this.presence.getOnlineUsers(),
                documents: Array.from(this.editor.documents.entries()).map(([id, doc]) => ({
                    id,
                    version: doc.version,
                    lastModified: doc.lastModified
                }))
            };
        }

        /**
         * 结束会话
         */
        endSession() {
            if (this.roomManager.currentRoom) {
                this.roomManager.leaveRoom(this.roomManager.currentRoom.id);
            }
            this.wsManager.disconnect();
            this.isInitialized = false;
        }

        /**
         * 注册事件监听
         */
        on(event, handler) {
            this.wsManager.on(event, handler);
        }

        /**
         * 移除事件监听
         */
        off(event, handler) {
            this.wsManager.off(event, handler);
        }
    }

    // 导出
    global.RealTimeCollaboration = {
        WebSocketManager,
        RoomManager,
        CollaborativeEditor,
        UserPresenceManager,
        CollaborationSessionManager
    };

    // 便捷创建
    global.createCollaborationSession = function(config = {}) {
        return new CollaborationSessionManager(config);
    };

})(typeof window !== 'undefined' ? window : global);

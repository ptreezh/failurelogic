/**
 * 协作学习模块
 * Collaborative Learning Module
 * 
 * 功能：
 * - 协作空间管理
 * - 实时协作会话
 * - 任务分工与追踪
 * - 协作成果评价
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环24
 */

(function(global) {
    'use strict';

    // ============================================
    // 协作空间类型
    // ============================================
    const SpaceType = {
        STUDY_GROUP: 'study_group',     // 学习小组
        PROJECT: 'project',             // 项目协作
        DISCUSSION: 'discussion',       // 讨论空间
        CHALLENGE: 'challenge',         // 挑战协作
        MENTORSHIP: 'mentorship'        // 师徒指导
    };

    // ============================================
    // 会话状态
    // ============================================
    const SessionStatus = {
        SCHEDULED: 'scheduled',         // 已安排
        ACTIVE: 'active',               // 进行中
        PAUSED: 'paused',               // 已暂停
        COMPLETED: 'completed',         // 已完成
        CANCELLED: 'cancelled'          // 已取消
    };

    // ============================================
    // 任务状态
    // ============================================
    const TaskStatus = {
        TODO: 'todo',                   // 待办
        IN_PROGRESS: 'in_progress',     // 进行中
        REVIEW: 'review',               // 待审核
        COMPLETED: 'completed',         // 已完成
        BLOCKED: 'blocked'              // 阻塞中
    };

    // ============================================
    // 任务优先级
    // ============================================
    const TaskPriority = {
        LOW: 'low',                     // 低优先级
        MEDIUM: 'medium',               // 中优先级
        HIGH: 'high',                   // 高优先级
        URGENT: 'urgent'                // 紧急
    };

    // ============================================
    // 成员角色
    // ============================================
    const MemberRole = {
        OWNER: 'owner',                 // 所有者
        ADMIN: 'admin',                 // 管理员
        MEMBER: 'member',               // 成员
        GUEST: 'guest'                  // 访客
    };

    // ============================================
    // 协作空间管理器
    // ============================================
    class CollaborationSpaceManager {
        constructor() {
            this.spaces = new Map();
            this.memberships = new Map();
            this.initSampleSpaces();
        }

        /**
         * 初始化示例协作空间
         */
        initSampleSpaces() {
            const sampleSpaces = [
                {
                    id: 'space_001',
                    name: '高级场景攻克小组',
                    description: '协作攻克高难度认知陷阱场景',
                    type: SpaceType.STUDY_GROUP,
                    ownerId: 'user_001',
                    memberCount: 8,
                    maxMembers: 15,
                    settings: {
                        isPublic: false,
                        allowInvite: true,
                        requireApproval: true
                    },
                    tags: ['高级场景', '协作学习'],
                    createdAt: Date.now() - 86400000 * 14,
                    lastActivityAt: Date.now() - 3600000
                },
                {
                    id: 'space_002',
                    name: '投资决策研究项目',
                    description: '研究投资决策中的认知偏差及其应对策略',
                    type: SpaceType.PROJECT,
                    ownerId: 'user_002',
                    memberCount: 5,
                    maxMembers: 10,
                    settings: {
                        isPublic: true,
                        allowInvite: true,
                        requireApproval: false
                    },
                    tags: ['投资', '研究', '认知偏差'],
                    createdAt: Date.now() - 86400000 * 7,
                    lastActivityAt: Date.now() - 7200000
                },
                {
                    id: 'space_003',
                    name: '新手训练营',
                    description: '帮助新用户快速入门认知陷阱学习',
                    type: SpaceType.MENTORSHIP,
                    ownerId: 'system',
                    memberCount: 25,
                    maxMembers: 50,
                    settings: {
                        isPublic: true,
                        allowInvite: true,
                        requireApproval: false
                    },
                    tags: ['入门', '指导', '新手'],
                    createdAt: Date.now() - 86400000 * 30,
                    lastActivityAt: Date.now() - 1800000
                }
            ];

            sampleSpaces.forEach(space => {
                this.spaces.set(space.id, space);
            });
        }

        /**
         * 创建协作空间
         * @param {Object} data - 空间数据
         * @returns {Object} 创建的空间
         */
        createSpace(data) {
            const space = {
                id: 'space_' + Date.now(),
                name: data.name,
                description: data.description || '',
                type: data.type || SpaceType.STUDY_GROUP,
                ownerId: data.ownerId,
                memberCount: 1,
                maxMembers: data.maxMembers || 20,
                settings: {
                    isPublic: data.isPublic !== false,
                    allowInvite: data.allowInvite !== false,
                    requireApproval: data.requireApproval || false
                },
                tags: data.tags || [],
                createdAt: Date.now(),
                lastActivityAt: Date.now()
            };

            this.spaces.set(space.id, space);
            this.joinSpace(space.id, data.ownerId, MemberRole.OWNER);
            
            return space;
        }

        /**
         * 获取空间列表
         * @param {Object} filters - 过滤条件
         * @returns {Array} 空间列表
         */
        getSpaces(filters = {}) {
            let spaces = Array.from(this.spaces.values());

            if (filters.type) {
                spaces = spaces.filter(s => s.type === filters.type);
            }
            if (filters.isPublic !== undefined) {
                spaces = spaces.filter(s => s.settings.isPublic === filters.isPublic);
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                spaces = spaces.filter(s => 
                    s.name.toLowerCase().includes(search) ||
                    s.description.toLowerCase().includes(search)
                );
            }

            // 按活跃度排序
            spaces.sort((a, b) => b.lastActivityAt - a.lastActivityAt);

            return spaces;
        }

        /**
         * 获取空间详情
         * @param {string} spaceId - 空间ID
         * @returns {Object|null} 空间详情
         */
        getSpace(spaceId) {
            return this.spaces.get(spaceId) || null;
        }

        /**
         * 加入空间
         * @param {string} spaceId - 空间ID
         * @param {string} userId - 用户ID
         * @param {string} role - 角色
         * @returns {Object} 加入结果
         */
        joinSpace(spaceId, userId, role = MemberRole.MEMBER) {
            const space = this.spaces.get(spaceId);
            if (!space) {
                return { success: false, message: '空间不存在' };
            }

            if (space.memberCount >= space.maxMembers) {
                return { success: false, message: '空间已满' };
            }

            const membershipKey = `${userId}_${spaceId}`;
            
            if (this.memberships.has(membershipKey)) {
                return { success: false, message: '已加入该空间' };
            }

            const membership = {
                userId,
                spaceId,
                role,
                joinedAt: Date.now(),
                lastActiveAt: Date.now(),
                contributionScore: 0,
                completedTasks: 0
            };

            this.memberships.set(membershipKey, membership);
            space.memberCount++;
            space.lastActivityAt = Date.now();

            return { success: true, membership };
        }

        /**
         * 离开空间
         * @param {string} spaceId - 空间ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        leaveSpace(spaceId, userId) {
            const space = this.spaces.get(spaceId);
            if (!space) return false;

            // 所有者不能离开
            if (space.ownerId === userId) {
                return false;
            }

            const membershipKey = `${userId}_${spaceId}`;
            if (this.memberships.has(membershipKey)) {
                this.memberships.delete(membershipKey);
                space.memberCount--;
                return true;
            }

            return false;
        }

        /**
         * 获取用户的空间列表
         * @param {string} userId - 用户ID
         * @returns {Array} 空间列表
         */
        getUserSpaces(userId) {
            const userSpaces = [];
            
            this.memberships.forEach((membership, key) => {
                if (membership.userId === userId) {
                    const space = this.spaces.get(membership.spaceId);
                    if (space) {
                        userSpaces.push({
                            ...space,
                            membership
                        });
                    }
                }
            });

            return userSpaces;
        }

        /**
         * 获取空间成员
         * @param {string} spaceId - 空间ID
         * @returns {Array} 成员列表
         */
        getSpaceMembers(spaceId) {
            const members = [];
            
            this.memberships.forEach(membership => {
                if (membership.spaceId === spaceId) {
                    members.push(membership);
                }
            });

            return members.sort((a, b) => b.contributionScore - a.contributionScore);
        }

        /**
         * 更新成员角色
         * @param {string} spaceId - 空间ID
         * @param {string} userId - 用户ID
         * @param {string} newRole - 新角色
         * @param {string} operatorId - 操作者ID
         * @returns {boolean} 是否成功
         */
        updateMemberRole(spaceId, userId, newRole, operatorId) {
            const space = this.spaces.get(spaceId);
            if (!space || space.ownerId !== operatorId) return false;

            const membershipKey = `${userId}_${spaceId}`;
            const membership = this.memberships.get(membershipKey);
            if (!membership) return false;

            membership.role = newRole;
            this.memberships.set(membershipKey, membership);
            
            return true;
        }
    }

    // ============================================
    // 实时协作会话管理器
    // ============================================
    class RealtimeSessionManager {
        constructor() {
            this.sessions = new Map();
            this.sessionParticipants = new Map();
            this.sessionMessages = new Map();
            this.initSampleSessions();
        }

        /**
         * 初始化示例会话
         */
        initSampleSessions() {
            const sampleSessions = [
                {
                    id: 'session_001',
                    spaceId: 'space_001',
                    title: '咖啡店场景高级挑战攻略',
                    description: '讨论咖啡店线性思维场景的高级挑战策略',
                    status: SessionStatus.ACTIVE,
                    creatorId: 'user_001',
                    participantCount: 4,
                    maxParticipants: 10,
                    startedAt: Date.now() - 3600000,
                    scheduledEnd: Date.now() + 3600000,
                    settings: {
                        allowVoice: true,
                        allowVideo: false,
                        allowScreenShare: true,
                        recordSession: true
                    }
                },
                {
                    id: 'session_002',
                    spaceId: 'space_002',
                    title: '投资偏误研究周会',
                    description: '每周投资决策认知偏误研究进展分享',
                    status: SessionStatus.SCHEDULED,
                    creatorId: 'user_002',
                    participantCount: 0,
                    maxParticipants: 15,
                    startedAt: null,
                    scheduledStart: Date.now() + 86400000,
                    scheduledEnd: Date.now() + 86400000 + 7200000,
                    settings: {
                        allowVoice: true,
                        allowVideo: true,
                        allowScreenShare: true,
                        recordSession: true
                    }
                }
            ];

            sampleSessions.forEach(session => {
                this.sessions.set(session.id, session);
                this.sessionMessages.set(session.id, []);
            });
        }

        /**
         * 创建会话
         * @param {Object} data - 会话数据
         * @returns {Object} 创建的会话
         */
        createSession(data) {
            const session = {
                id: 'session_' + Date.now(),
                spaceId: data.spaceId,
                title: data.title,
                description: data.description || '',
                status: data.scheduledStart ? SessionStatus.SCHEDULED : SessionStatus.ACTIVE,
                creatorId: data.creatorId,
                participantCount: 0,
                maxParticipants: data.maxParticipants || 20,
                startedAt: data.scheduledStart ? null : Date.now(),
                scheduledStart: data.scheduledStart || null,
                scheduledEnd: data.scheduledEnd || null,
                endedAt: null,
                settings: {
                    allowVoice: data.allowVoice !== false,
                    allowVideo: data.allowVideo || false,
                    allowScreenShare: data.allowScreenShare !== false,
                    recordSession: data.recordSession || false
                }
            };

            this.sessions.set(session.id, session);
            this.sessionMessages.set(session.id, []);
            
            return session;
        }

        /**
         * 加入会话
         * @param {string} sessionId - 会话ID
         * @param {string} userId - 用户ID
         * @returns {Object} 加入结果
         */
        joinSession(sessionId, userId) {
            const session = this.sessions.get(sessionId);
            if (!session) {
                return { success: false, message: '会话不存在' };
            }

            if (session.status !== SessionStatus.ACTIVE) {
                return { success: false, message: '会话未激活' };
            }

            if (session.participantCount >= session.maxParticipants) {
                return { success: false, message: '会话已满' };
            }

            const participantKey = `${userId}_${sessionId}`;
            
            if (this.sessionParticipants.has(participantKey)) {
                return { success: false, message: '已加入该会话' };
            }

            const participant = {
                userId,
                sessionId,
                joinedAt: Date.now(),
                lastActiveAt: Date.now(),
                role: session.creatorId === userId ? 'host' : 'participant',
                isActive: true
            };

            this.sessionParticipants.set(participantKey, participant);
            session.participantCount++;

            return { success: true, participant };
        }

        /**
         * 离开会话
         * @param {string} sessionId - 会话ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        leaveSession(sessionId, userId) {
            const session = this.sessions.get(sessionId);
            if (!session) return false;

            const participantKey = `${userId}_${sessionId}`;
            const participant = this.sessionParticipants.get(participantKey);
            
            if (participant) {
                participant.isActive = false;
                participant.leftAt = Date.now();
                session.participantCount--;
                
                // 如果是主持人离开，转移主持权
                if (participant.role === 'host' && session.participantCount > 0) {
                    const nextHost = Array.from(this.sessionParticipants.values())
                        .find(p => p.sessionId === sessionId && p.isActive && p.userId !== userId);
                    if (nextHost) {
                        nextHost.role = 'host';
                    }
                }
                
                return true;
            }

            return false;
        }

        /**
         * 发送消息
         * @param {string} sessionId - 会话ID
         * @param {string} userId - 用户ID
         * @param {string} content - 消息内容
         * @param {string} type - 消息类型
         * @returns {Object} 消息对象
         */
        sendMessage(sessionId, userId, content, type = 'text') {
            const session = this.sessions.get(sessionId);
            if (!session || session.status !== SessionStatus.ACTIVE) {
                return null;
            }

            const message = {
                id: 'msg_' + Date.now(),
                sessionId,
                userId,
                content,
                type,
                createdAt: Date.now(),
                reactions: []
            };

            const messages = this.sessionMessages.get(sessionId) || [];
            messages.push(message);
            this.sessionMessages.set(sessionId, messages);

            return message;
        }

        /**
         * 获取会话消息
         * @param {string} sessionId - 会话ID
         * @param {Object} options - 选项
         * @returns {Array} 消息列表
         */
        getMessages(sessionId, options = {}) {
            const messages = this.sessionMessages.get(sessionId) || [];
            
            let filtered = messages;
            
            if (options.since) {
                filtered = filtered.filter(m => m.createdAt > options.since);
            }

            const limit = options.limit || 50;
            return filtered.slice(-limit);
        }

        /**
         * 获取活跃会话
         * @param {string} spaceId - 空间ID（可选）
         * @returns {Array} 会话列表
         */
        getActiveSessions(spaceId = null) {
            let sessions = Array.from(this.sessions.values())
                .filter(s => s.status === SessionStatus.ACTIVE);

            if (spaceId) {
                sessions = sessions.filter(s => s.spaceId === spaceId);
            }

            return sessions.sort((a, b) => b.startedAt - a.startedAt);
        }

        /**
         * 获取即将开始的会话
         * @param {string} userId - 用户ID
         * @returns {Array} 会话列表
         */
        getUpcomingSessions(userId) {
            const now = Date.now();
            
            return Array.from(this.sessions.values())
                .filter(s => 
                    s.status === SessionStatus.SCHEDULED &&
                    s.scheduledStart > now &&
                    s.scheduledStart < now + 86400000 * 7
                )
                .sort((a, b) => a.scheduledStart - b.scheduledStart);
        }

        /**
         * 结束会话
         * @param {string} sessionId - 会话ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        endSession(sessionId, userId) {
            const session = this.sessions.get(sessionId);
            if (!session) return false;

            const participantKey = `${userId}_${sessionId}`;
            const participant = this.sessionParticipants.get(participantKey);
            
            if (!participant || participant.role !== 'host') {
                return false;
            }

            session.status = SessionStatus.COMPLETED;
            session.endedAt = Date.now();

            return true;
        }

        /**
         * 获取会话参与者
         * @param {string} sessionId - 会话ID
         * @returns {Array} 参与者列表
         */
        getSessionParticipants(sessionId) {
            const participants = [];
            
            this.sessionParticipants.forEach(participant => {
                if (participant.sessionId === sessionId && participant.isActive) {
                    participants.push(participant);
                }
            });

            return participants;
        }
    }

    // ============================================
    // 任务分工与追踪系统
    // ============================================
    class TaskTrackingSystem {
        constructor() {
            this.tasks = new Map();
            this.taskAssignments = new Map();
            this.taskDependencies = new Map();
            this.initSampleTasks();
        }

        /**
         * 初始化示例任务
         */
        initSampleTasks() {
            const sampleTasks = [
                {
                    id: 'task_001',
                    spaceId: 'space_001',
                    title: '分析咖啡店场景高级策略',
                    description: '深入分析咖啡店线性思维场景的高级挑战策略，整理成文档',
                    status: TaskStatus.IN_PROGRESS,
                    priority: TaskPriority.HIGH,
                    creatorId: 'user_001',
                    assignees: ['user_001', 'user_002'],
                    dueDate: Date.now() + 86400000 * 3,
                    estimatedHours: 4,
                    actualHours: 2,
                    completedAt: null,
                    createdAt: Date.now() - 86400000,
                    tags: ['分析', '策略', '高级场景']
                },
                {
                    id: 'task_002',
                    spaceId: 'space_001',
                    title: '整理认知陷阱案例库',
                    description: '收集和整理各类认知陷阱的实际案例',
                    status: TaskStatus.TODO,
                    priority: TaskPriority.MEDIUM,
                    creatorId: 'user_001',
                    assignees: ['user_003'],
                    dueDate: Date.now() + 86400000 * 7,
                    estimatedHours: 6,
                    actualHours: 0,
                    completedAt: null,
                    createdAt: Date.now() - 3600000,
                    tags: ['案例', '整理']
                },
                {
                    id: 'task_003',
                    spaceId: 'space_002',
                    title: '撰写研究报告初稿',
                    description: '完成投资决策认知偏误研究报告的初稿',
                    status: TaskStatus.REVIEW,
                    priority: TaskPriority.HIGH,
                    creatorId: 'user_002',
                    assignees: ['user_004'],
                    dueDate: Date.now() + 86400000 * 2,
                    estimatedHours: 8,
                    actualHours: 7,
                    completedAt: null,
                    createdAt: Date.now() - 86400000 * 3,
                    tags: ['报告', '研究']
                }
            ];

            sampleTasks.forEach(task => {
                this.tasks.set(task.id, task);
            });
        }

        /**
         * 创建任务
         * @param {Object} data - 任务数据
         * @returns {Object} 创建的任务
         */
        createTask(data) {
            const task = {
                id: 'task_' + Date.now(),
                spaceId: data.spaceId,
                title: data.title,
                description: data.description || '',
                status: TaskStatus.TODO,
                priority: data.priority || TaskPriority.MEDIUM,
                creatorId: data.creatorId,
                assignees: data.assignees || [],
                dueDate: data.dueDate || null,
                estimatedHours: data.estimatedHours || 0,
                actualHours: 0,
                completedAt: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tags: data.tags || [],
                attachments: [],
                comments: [],
                progress: 0
            };

            this.tasks.set(task.id, task);

            // 处理任务依赖
            if (data.dependsOn && Array.isArray(data.dependsOn)) {
                this.taskDependencies.set(task.id, data.dependsOn);
            }

            return task;
        }

        /**
         * 更新任务状态
         * @param {string} taskId - 任务ID
         * @param {string} newStatus - 新状态
         * @param {string} userId - 操作者ID
         * @returns {Object} 更新结果
         */
        updateTaskStatus(taskId, newStatus, userId) {
            const task = this.tasks.get(taskId);
            if (!task) {
                return { success: false, message: '任务不存在' };
            }

            // 检查依赖是否完成
            if (newStatus === TaskStatus.IN_PROGRESS) {
                const dependencies = this.taskDependencies.get(taskId) || [];
                const incompleteDependency = dependencies.find(depId => {
                    const dep = this.tasks.get(depId);
                    return dep && dep.status !== TaskStatus.COMPLETED;
                });

                if (incompleteDependency) {
                    return { 
                        success: false, 
                        message: '依赖任务未完成',
                        blockedBy: incompleteDependency
                    };
                }
            }

            task.status = newStatus;
            task.updatedAt = Date.now();

            if (newStatus === TaskStatus.COMPLETED) {
                task.completedAt = Date.now();
                task.progress = 100;
            }

            this.tasks.set(taskId, task);

            return { success: true, task };
        }

        /**
         * 分配任务
         * @param {string} taskId - 任务ID
         * @param {string} userId - 用户ID
         * @param {string} assignedBy - 分配者ID
         * @returns {boolean} 是否成功
         */
        assignTask(taskId, userId, assignedBy) {
            const task = this.tasks.get(taskId);
            if (!task) return false;

            if (!task.assignees.includes(userId)) {
                task.assignees.push(userId);
                task.updatedAt = Date.now();
                this.tasks.set(taskId, task);
            }

            const assignmentKey = `${userId}_${taskId}`;
            this.taskAssignments.set(assignmentKey, {
                userId,
                taskId,
                assignedBy,
                assignedAt: Date.now()
            });

            return true;
        }

        /**
         * 取消任务分配
         * @param {string} taskId - 任务ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        unassignTask(taskId, userId) {
            const task = this.tasks.get(taskId);
            if (!task) return false;

            task.assignees = task.assignees.filter(id => id !== userId);
            task.updatedAt = Date.now();
            this.tasks.set(taskId, task);

            const assignmentKey = `${userId}_${taskId}`;
            this.taskAssignments.delete(assignmentKey);

            return true;
        }

        /**
         * 更新任务进度
         * @param {string} taskId - 任务ID
         * @param {number} progress - 进度百分比
         * @param {number} hours - 已用时间
         * @returns {boolean} 是否成功
         */
        updateProgress(taskId, progress, hours = null) {
            const task = this.tasks.get(taskId);
            if (!task) return false;

            task.progress = Math.min(100, Math.max(0, progress));
            if (hours !== null) {
                task.actualHours = hours;
            }
            task.updatedAt = Date.now();

            this.tasks.set(taskId, task);
            return true;
        }

        /**
         * 添加任务评论
         * @param {string} taskId - 任务ID
         * @param {string} userId - 用户ID
         * @param {string} content - 评论内容
         * @returns {Object} 评论对象
         */
        addTaskComment(taskId, userId, content) {
            const task = this.tasks.get(taskId);
            if (!task) return null;

            const comment = {
                id: 'comment_' + Date.now(),
                taskId,
                userId,
                content,
                createdAt: Date.now()
            };

            task.comments.push(comment);
            task.updatedAt = Date.now();
            this.tasks.set(taskId, task);

            return comment;
        }

        /**
         * 获取空间任务
         * @param {string} spaceId - 空间ID
         * @param {Object} filters - 过滤条件
         * @returns {Array} 任务列表
         */
        getSpaceTasks(spaceId, filters = {}) {
            let tasks = Array.from(this.tasks.values())
                .filter(t => t.spaceId === spaceId);

            if (filters.status) {
                tasks = tasks.filter(t => t.status === filters.status);
            }
            if (filters.priority) {
                tasks = tasks.filter(t => t.priority === filters.priority);
            }
            if (filters.assignee) {
                tasks = tasks.filter(t => t.assignees.includes(filters.assignee));
            }

            // 排序：优先级 > 截止日期
            const priorityOrder = {
                [TaskPriority.URGENT]: 0,
                [TaskPriority.HIGH]: 1,
                [TaskPriority.MEDIUM]: 2,
                [TaskPriority.LOW]: 3
            };

            tasks.sort((a, b) => {
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return (a.dueDate || Infinity) - (b.dueDate || Infinity);
            });

            return tasks;
        }

        /**
         * 获取用户任务
         * @param {string} userId - 用户ID
         * @returns {Array} 任务列表
         */
        getUserTasks(userId) {
            return Array.from(this.tasks.values())
                .filter(t => t.assignees.includes(userId) || t.creatorId === userId)
                .sort((a, b) => a.dueDate - b.dueDate);
        }

        /**
         * 获取任务统计
         * @param {string} spaceId - 空间ID
         * @returns {Object} 统计数据
         */
        getTaskStats(spaceId) {
            const tasks = this.getSpaceTasks(spaceId);

            return {
                total: tasks.length,
                todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
                inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
                review: tasks.filter(t => t.status === TaskStatus.REVIEW).length,
                completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
                blocked: tasks.filter(t => t.status === TaskStatus.BLOCKED).length,
                overdue: tasks.filter(t => 
                    t.dueDate && t.dueDate < Date.now() && 
                    t.status !== TaskStatus.COMPLETED
                ).length
            };
        }
    }

    // ============================================
    // 协作成果评价系统
    // ============================================
    class CollaborativeEvaluationSystem {
        constructor() {
            this.evaluations = new Map();
            this.contributions = new Map();
            this.initSampleEvaluations();
        }

        /**
         * 初始化示例评价
         */
        initSampleEvaluations() {
            // 示例评价数据
            const sampleEvaluations = [
                {
                    id: 'eval_001',
                    targetType: 'task',
                    targetId: 'task_001',
                    spaceId: 'space_001',
                    evaluatorId: 'user_002',
                    evaluatedUserId: 'user_001',
                    scores: {
                        quality: 4.5,
                        timeliness: 5,
                        collaboration: 4,
                        innovation: 4.5
                    },
                    comment: '分析非常到位，策略整理清晰易懂',
                    createdAt: Date.now() - 86400000
                }
            ];

            sampleEvaluations.forEach(evaluation => {
                this.evaluations.set(evaluation.id, evaluation);
            });
        }

        /**
         * 创建评价
         * @param {Object} data - 评价数据
         * @returns {Object} 创建的评价
         */
        createEvaluation(data) {
            // 计算总分
            const scores = data.scores || {};
            const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 
                              Object.keys(scores).length;

            const evaluation = {
                id: 'eval_' + Date.now(),
                targetType: data.targetType,
                targetId: data.targetId,
                spaceId: data.spaceId,
                evaluatorId: data.evaluatorId,
                evaluatedUserId: data.evaluatedUserId,
                scores: {
                    quality: scores.quality || 0,
                    timeliness: scores.timeliness || 0,
                    collaboration: scores.collaboration || 0,
                    innovation: scores.innovation || 0
                },
                totalScore: totalScore.toFixed(2),
                comment: data.comment || '',
                createdAt: Date.now()
            };

            this.evaluations.set(evaluation.id, evaluation);

            // 更新贡献度
            this.updateContribution(data.spaceId, data.evaluatedUserId, totalScore);

            return evaluation;
        }

        /**
         * 更新贡献度
         * @param {string} spaceId - 空间ID
         * @param {string} userId - 用户ID
         * @param {number} score - 得分
         */
        updateContribution(spaceId, userId, score) {
            const key = `${userId}_${spaceId}`;
            const current = this.contributions.get(key) || {
                userId,
                spaceId,
                totalScore: 0,
                evaluationCount: 0,
                badges: []
            };

            current.totalScore += score;
            current.evaluationCount++;
            current.averageScore = (current.totalScore / current.evaluationCount).toFixed(2);

            // 检查徽章
            this.checkBadges(current);

            this.contributions.set(key, current);
        }

        /**
         * 检查并授予徽章
         * @param {Object} contribution - 贡献记录
         */
        checkBadges(contribution) {
            const badges = [];

            if (contribution.evaluationCount >= 5) {
                badges.push('active_contributor');
            }
            if (contribution.averageScore >= 4.5) {
                badges.push('excellent_quality');
            }
            if (contribution.evaluationCount >= 10 && contribution.averageScore >= 4) {
                badges.push('star_collaborator');
            }

            contribution.badges = badges;
        }

        /**
         * 获取用户评价
         * @param {string} userId - 用户ID
         * @param {string} spaceId - 空间ID（可选）
         * @returns {Array} 评价列表
         */
        getUserEvaluations(userId, spaceId = null) {
            let evaluations = Array.from(this.evaluations.values())
                .filter(e => e.evaluatedUserId === userId);

            if (spaceId) {
                evaluations = evaluations.filter(e => e.spaceId === spaceId);
            }

            return evaluations.sort((a, b) => b.createdAt - a.createdAt);
        }

        /**
         * 获取用户贡献度
         * @param {string} userId - 用户ID
         * @param {string} spaceId - 空间ID
         * @returns {Object|null} 贡献记录
         */
        getUserContribution(userId, spaceId) {
            const key = `${userId}_${spaceId}`;
            return this.contributions.get(key) || null;
        }

        /**
         * 获取空间贡献排行榜
         * @param {string} spaceId - 空间ID
         * @param {number} limit - 限制数量
         * @returns {Array} 排行榜
         */
        getContributionLeaderboard(spaceId, limit = 10) {
            const contributions = [];

            this.contributions.forEach(contribution => {
                if (contribution.spaceId === spaceId) {
                    contributions.push(contribution);
                }
            });

            return contributions
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, limit);
        }

        /**
         * 获取评价统计
         * @param {string} userId - 用户ID
         * @returns {Object} 统计数据
         */
        getEvaluationStats(userId) {
            const evaluations = this.getUserEvaluations(userId);

            if (evaluations.length === 0) {
                return {
                    totalEvaluations: 0,
                    averageScore: 0,
                    scoreBreakdown: {
                        quality: 0,
                        timeliness: 0,
                        collaboration: 0,
                        innovation: 0
                    }
                };
            }

            const scoreBreakdown = {
                quality: 0,
                timeliness: 0,
                collaboration: 0,
                innovation: 0
            };

            evaluations.forEach(e => {
                scoreBreakdown.quality += e.scores.quality;
                scoreBreakdown.timeliness += e.scores.timeliness;
                scoreBreakdown.collaboration += e.scores.collaboration;
                scoreBreakdown.innovation += e.scores.innovation;
            });

            Object.keys(scoreBreakdown).forEach(key => {
                scoreBreakdown[key] = (scoreBreakdown[key] / evaluations.length).toFixed(2);
            });

            return {
                totalEvaluations: evaluations.length,
                averageScore: (evaluations.reduce((sum, e) => 
                    sum + parseFloat(e.totalScore), 0) / evaluations.length).toFixed(2),
                scoreBreakdown
            };
        }

        /**
         * 获取徽章说明
         * @param {string} badgeId - 徽章ID
         * @returns {Object} 徽章信息
         */
        getBadgeInfo(badgeId) {
            const badgeInfo = {
                'active_contributor': {
                    name: '活跃贡献者',
                    description: '参与评价超过5次',
                    icon: 'star'
                },
                'excellent_quality': {
                    name: '卓越品质',
                    description: '平均得分超过4.5分',
                    icon: 'diamond'
                },
                'star_collaborator': {
                    name: '明星协作者',
                    description: '参与评价超过10次且平均得分超过4分',
                    icon: 'crown'
                }
            };

            return badgeInfo[badgeId] || null;
        }
    }

    // ============================================
    // 协作学习系统主类
    // ============================================
    class CollaborativeLearningSystem {
        constructor() {
            this.spaceManager = new CollaborationSpaceManager();
            this.sessionManager = new RealtimeSessionManager();
            this.taskSystem = new TaskTrackingSystem();
            this.evaluationSystem = new CollaborativeEvaluationSystem();
            
            this.currentUser = null;
            this.eventListeners = new Map();
        }

        /**
         * 设置当前用户
         * @param {Object} user - 用户信息
         */
        setCurrentUser(user) {
            this.currentUser = user;
        }

        /**
         * 获取空间管理器
         * @returns {CollaborationSpaceManager} 空间管理器
         */
        getSpaceManager() {
            return this.spaceManager;
        }

        /**
         * 获取会话管理器
         * @returns {RealtimeSessionManager} 会话管理器
         */
        getSessionManager() {
            return this.sessionManager;
        }

        /**
         * 获取任务系统
         * @returns {TaskTrackingSystem} 任务系统
         */
        getTaskSystem() {
            return this.taskSystem;
        }

        /**
         * 获取评价系统
         * @returns {CollaborativeEvaluationSystem} 评价系统
         */
        getEvaluationSystem() {
            return this.evaluationSystem;
        }

        /**
         * 创建学习小组
         * @param {Object} data - 小组数据
         * @returns {Object} 创建结果
         */
        createStudyGroup(data) {
            const space = this.spaceManager.createSpace({
                ...data,
                type: SpaceType.STUDY_GROUP
            });

            this.emit('space:created', space);
            
            return { success: true, space };
        }

        /**
         * 创建协作会话
         * @param {Object} data - 会话数据
         * @returns {Object} 创建结果
         */
        startCollaborationSession(data) {
            const session = this.sessionManager.createSession({
                ...data,
                creatorId: this.currentUser?.id
            });

            // 自动加入会话
            if (this.currentUser) {
                this.sessionManager.joinSession(session.id, this.currentUser.id);
            }

            this.emit('session:created', session);
            
            return { success: true, session };
        }

        /**
         * 分配协作任务
         * @param {Object} data - 任务数据
         * @returns {Object} 创建结果
         */
        assignTask(data) {
            const task = this.taskSystem.createTask({
                ...data,
                creatorId: this.currentUser?.id
            });

            this.emit('task:created', task);
            
            return { success: true, task };
        }

        /**
         * 评价协作成果
         * @param {Object} data - 评价数据
         * @returns {Object} 评价结果
         */
        evaluateContribution(data) {
            const evaluation = this.evaluationSystem.createEvaluation({
                ...data,
                evaluatorId: this.currentUser?.id
            });

            this.emit('evaluation:created', evaluation);
            
            return { success: true, evaluation };
        }

        /**
         * 获取协作概览
         * @param {string} spaceId - 空间ID
         * @returns {Object} 概览数据
         */
        getCollaborationOverview(spaceId) {
            const space = this.spaceManager.getSpace(spaceId);
            const activeSessions = this.sessionManager.getActiveSessions(spaceId);
            const taskStats = this.taskSystem.getTaskStats(spaceId);
            const leaderboard = this.evaluationSystem.getContributionLeaderboard(spaceId, 5);

            return {
                space,
                activeSessions,
                taskStats,
                topContributors: leaderboard
            };
        }

        /**
         * 获取用户协作数据
         * @param {string} userId - 用户ID
         * @returns {Object} 协作数据
         */
        getUserCollaborationData(userId) {
            const spaces = this.spaceManager.getUserSpaces(userId);
            const tasks = this.taskSystem.getUserTasks(userId);
            const evaluationStats = this.evaluationSystem.getEvaluationStats(userId);

            return {
                spaces,
                tasks,
                evaluationStats,
                activeTaskCount: tasks.filter(t => 
                    t.status === TaskStatus.IN_PROGRESS || 
                    t.status === TaskStatus.TODO
                ).length
            };
        }

        /**
         * 获取协作推荐
         * @returns {Object} 推荐内容
         */
        getCollaborationRecommendations() {
            const publicSpaces = this.spaceManager.getSpaces({ isPublic: true })
                .filter(s => s.memberCount < s.maxMembers)
                .slice(0, 5);
            
            const upcomingSessions = this.sessionManager.getUpcomingSessions(
                this.currentUser?.id
            ).slice(0, 3);

            return {
                recommendedSpaces: publicSpaces,
                upcomingSessions,
                suggestedActions: [
                    '加入一个学习小组',
                    '参加即将开始的协作会话',
                    '创建一个学习项目'
                ]
            };
        }

        /**
         * 添加事件监听器
         * @param {string} event - 事件名称
         * @param {Function} callback - 回调函数
         */
        on(event, callback) {
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            this.eventListeners.get(event).push(callback);
        }

        /**
         * 触发事件
         * @param {string} event - 事件名称
         * @param {Object} data - 事件数据
         */
        emit(event, data) {
            const listeners = this.eventListeners.get(event);
            if (listeners) {
                listeners.forEach(callback => callback(data));
            }
        }

        /**
         * 获取系统状态
         * @returns {Object} 系统状态
         */
        getSystemStatus() {
            return {
                spaces: this.spaceManager.spaces.size,
                sessions: this.sessionManager.sessions.size,
                tasks: this.taskSystem.tasks.size,
                evaluations: this.evaluationSystem.evaluations.size,
                contributions: this.evaluationSystem.contributions.size
            };
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CollaborativeLearningSystem,
            CollaborationSpaceManager,
            RealtimeSessionManager,
            TaskTrackingSystem,
            CollaborativeEvaluationSystem,
            SpaceType,
            SessionStatus,
            TaskStatus,
            TaskPriority,
            MemberRole
        };
    } else {
        global.CollaborativeLearningSystem = CollaborativeLearningSystem;
        global.CollaborativeLearningTypes = {
            SpaceType,
            SessionStatus,
            TaskStatus,
            TaskPriority,
            MemberRole
        };
    }

})(typeof window !== 'undefined' ? window : this);

/**
 * 社交学习系统
 * Social Learning System
 * 
 * 功能：
 * - 学习社区管理
 * - 好友系统
 * - 学习动态分享
 * - 互动评论系统
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环24
 */

(function(global) {
    'use strict';

    // ============================================
    // 社区类型
    // ============================================
    const CommunityType = {
        PUBLIC: 'public',               // 公开社区
        PRIVATE: 'private',             // 私有社区
        COURSE: 'course',               // 课程社区
        INTEREST: 'interest',           // 兴趣小组
        STUDY_GROUP: 'study_group'      // 学习小组
    };

    // ============================================
    // 好友状态
    // ============================================
    const FriendshipStatus = {
        NONE: 'none',                   // 无关系
        PENDING: 'pending',             // 待确认
        ACCEPTED: 'accepted',           // 已接受
        BLOCKED: 'blocked',             // 已屏蔽
        REMOVED: 'removed'              // 已删除
    };

    // ============================================
    // 动态类型
    // ============================================
    const PostType = {
        ACHIEVEMENT: 'achievement',     // 成就分享
        PROGRESS: 'progress',           // 学习进度
        QUESTION: 'question',           // 问题求助
        RESOURCE: 'resource',           // 资源分享
        DISCUSSION: 'discussion',       // 讨论话题
        MILESTONE: 'milestone'          // 里程碑
    };

    // ============================================
    // 互动类型
    // ============================================
    const InteractionType = {
        LIKE: 'like',                   // 点赞
        COMMENT: 'comment',             // 评论
        SHARE: 'share',                 // 分享
        COLLECT: 'collect',             // 收藏
        FOLLOW: 'follow'                // 关注
    };

    // ============================================
    // 社区管理器
    // ============================================
    class CommunityManager {
        constructor() {
            this.communities = new Map();
            this.userMemberships = new Map();
            this.initSampleCommunities();
        }

        /**
         * 初始化示例社区
         */
        initSampleCommunities() {
            const sampleCommunities = [
                {
                    id: 'comm_001',
                    name: '认知偏差学习社区',
                    description: '探索认知偏差，提升决策能力',
                    type: CommunityType.PUBLIC,
                    ownerId: 'user_001',
                    memberCount: 1256,
                    postCount: 342,
                    tags: ['认知科学', '决策', '心理学'],
                    createdAt: Date.now() - 86400000 * 30,
                    rules: ['尊重他人', '分享原创内容', '禁止广告'],
                    icon: 'brain'
                },
                {
                    id: 'comm_002',
                    name: '投资思维训练小组',
                    description: '投资决策中的认知陷阱识别与规避',
                    type: CommunityType.STUDY_GROUP,
                    ownerId: 'user_002',
                    memberCount: 458,
                    postCount: 127,
                    tags: ['投资', '理财', '风险管理'],
                    createdAt: Date.now() - 86400000 * 15,
                    rules: ['分享真实案例', '理性讨论'],
                    icon: 'chart'
                },
                {
                    id: 'comm_003',
                    name: '高级场景挑战营',
                    description: '高级认知挑战场景讨论与协作',
                    type: CommunityType.COURSE,
                    ownerId: 'system',
                    memberCount: 89,
                    postCount: 56,
                    tags: ['高级挑战', '协作学习'],
                    createdAt: Date.now() - 86400000 * 7,
                    rules: ['完成前置课程', '积极参与讨论'],
                    icon: 'challenge'
                }
            ];

            sampleCommunities.forEach(community => {
                this.communities.set(community.id, community);
            });
        }

        /**
         * 创建社区
         * @param {Object} data - 社区数据
         * @returns {Object} 创建的社区
         */
        createCommunity(data) {
            const community = {
                id: 'comm_' + Date.now(),
                name: data.name,
                description: data.description || '',
                type: data.type || CommunityType.PUBLIC,
                ownerId: data.ownerId,
                memberCount: 1,
                postCount: 0,
                tags: data.tags || [],
                createdAt: Date.now(),
                rules: data.rules || [],
                icon: data.icon || 'default',
                settings: {
                    allowPost: true,
                    allowComment: true,
                    requireApproval: false,
                    maxMembers: data.maxMembers || 1000
                }
            };

            this.communities.set(community.id, community);
            this.joinCommunity(community.id, data.ownerId, 'owner');
            
            return community;
        }

        /**
         * 获取社区列表
         * @param {Object} filters - 过滤条件
         * @returns {Array} 社区列表
         */
        getCommunities(filters = {}) {
            let communities = Array.from(this.communities.values());

            if (filters.type) {
                communities = communities.filter(c => c.type === filters.type);
            }
            if (filters.tag) {
                communities = communities.filter(c => c.tags.includes(filters.tag));
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                communities = communities.filter(c => 
                    c.name.toLowerCase().includes(search) ||
                    c.description.toLowerCase().includes(search)
                );
            }

            // 排序：按成员数降序
            communities.sort((a, b) => b.memberCount - a.memberCount);

            return communities;
        }

        /**
         * 获取社区详情
         * @param {string} communityId - 社区ID
         * @returns {Object|null} 社区详情
         */
        getCommunity(communityId) {
            return this.communities.get(communityId) || null;
        }

        /**
         * 加入社区
         * @param {string} communityId - 社区ID
         * @param {string} userId - 用户ID
         * @param {string} role - 角色
         * @returns {boolean} 是否成功
         */
        joinCommunity(communityId, userId, role = 'member') {
            const community = this.communities.get(communityId);
            if (!community) return false;

            // 更新社区成员数
            const membershipKey = `${userId}_${communityId}`;
            if (!this.userMemberships.has(membershipKey)) {
                community.memberCount++;
                this.userMemberships.set(membershipKey, {
                    userId,
                    communityId,
                    role,
                    joinedAt: Date.now(),
                    lastActiveAt: Date.now(),
                    contributionScore: 0
                });
            }

            return true;
        }

        /**
         * 离开社区
         * @param {string} communityId - 社区ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        leaveCommunity(communityId, userId) {
            const community = this.communities.get(communityId);
            if (!community) return false;

            const membershipKey = `${userId}_${communityId}`;
            if (this.userMemberships.has(membershipKey)) {
                this.userMemberships.delete(membershipKey);
                community.memberCount--;
                return true;
            }

            return false;
        }

        /**
         * 获取用户加入的社区
         * @param {string} userId - 用户ID
         * @returns {Array} 社区列表
         */
        getUserCommunities(userId) {
            const userCommunities = [];
            
            this.userMemberships.forEach((membership, key) => {
                if (membership.userId === userId) {
                    const community = this.communities.get(membership.communityId);
                    if (community) {
                        userCommunities.push({
                            ...community,
                            membership
                        });
                    }
                }
            });

            return userCommunities;
        }
    }

    // ============================================
    // 好友系统
    // ============================================
    class FriendSystem {
        constructor() {
            this.friendships = new Map();
            this.friendRequests = new Map();
            this.initSampleFriends();
        }

        /**
         * 初始化示例好友
         */
        initSampleFriends() {
            const sampleUsers = [
                { id: 'user_002', name: '小明', avatar: 'avatar1.png', level: 15 },
                { id: 'user_003', name: '小红', avatar: 'avatar2.png', level: 23 },
                { id: 'user_004', name: '小华', avatar: 'avatar3.png', level: 8 },
                { id: 'user_005', name: '小李', avatar: 'avatar4.png', level: 31 }
            ];

            sampleUsers.forEach(user => {
                const key = `user_001_${user.id}`;
                this.friendships.set(key, {
                    user1Id: 'user_001',
                    user2Id: user.id,
                    status: FriendshipStatus.ACCEPTED,
                    createdAt: Date.now() - Math.random() * 86400000 * 30,
                    intimacy: Math.floor(Math.random() * 100),
                    interactions: Math.floor(Math.random() * 50),
                    lastInteraction: Date.now() - Math.random() * 86400000 * 7
                });
            });
        }

        /**
         * 发送好友请求
         * @param {string} fromUserId - 发送者ID
         * @param {string} toUserId - 接收者ID
         * @param {string} message - 请求消息
         * @returns {Object} 请求结果
         */
        sendFriendRequest(fromUserId, toUserId, message = '') {
            const requestId = 'req_' + Date.now();
            
            // 检查是否已经是好友
            const existingFriendship = this.getFriendship(fromUserId, toUserId);
            if (existingFriendship && existingFriendship.status === FriendshipStatus.ACCEPTED) {
                return { success: false, message: '已经是好友了' };
            }

            const request = {
                id: requestId,
                fromUserId,
                toUserId,
                message,
                status: FriendshipStatus.PENDING,
                createdAt: Date.now()
            };

            this.friendRequests.set(requestId, request);
            
            return { success: true, requestId, message: '好友请求已发送' };
        }

        /**
         * 接受好友请求
         * @param {string} requestId - 请求ID
         * @returns {boolean} 是否成功
         */
        acceptFriendRequest(requestId) {
            const request = this.friendRequests.get(requestId);
            if (!request) return false;

            // 创建好友关系
            const key1 = `${request.fromUserId}_${request.toUserId}`;
            const key2 = `${request.toUserId}_${request.fromUserId}`;

            const friendship = {
                user1Id: request.fromUserId,
                user2Id: request.toUserId,
                status: FriendshipStatus.ACCEPTED,
                createdAt: Date.now(),
                intimacy: 0,
                interactions: 0,
                lastInteraction: Date.now()
            };

            this.friendships.set(key1, friendship);
            this.friendships.set(key2, friendship);
            
            // 更新请求状态
            request.status = FriendshipStatus.ACCEPTED;
            this.friendRequests.set(requestId, request);

            return true;
        }

        /**
         * 拒绝好友请求
         * @param {string} requestId - 请求ID
         * @returns {boolean} 是否成功
         */
        rejectFriendRequest(requestId) {
            const request = this.friendRequests.get(requestId);
            if (!request) return false;

            request.status = FriendshipStatus.REMOVED;
            this.friendRequests.set(requestId, request);
            
            return true;
        }

        /**
         * 获取好友关系
         * @param {string} userId1 - 用户ID1
         * @param {string} userId2 - 用户ID2
         * @returns {Object|null} 好友关系
         */
        getFriendship(userId1, userId2) {
            const key = `${userId1}_${userId2}`;
            return this.friendships.get(key) || null;
        }

        /**
         * 获取好友列表
         * @param {string} userId - 用户ID
         * @returns {Array} 好友列表
         */
        getFriends(userId) {
            const friends = [];
            
            this.friendships.forEach((friendship, key) => {
                if (key.startsWith(userId + '_') && friendship.status === FriendshipStatus.ACCEPTED) {
                    friends.push({
                        friendId: friendship.user2Id,
                        intimacy: friendship.intimacy,
                        interactions: friendship.interactions,
                        lastInteraction: friendship.lastInteraction,
                        friendsSince: friendship.createdAt
                    });
                }
            });

            // 按亲密度排序
            friends.sort((a, b) => b.intimacy - a.intimacy);
            
            return friends;
        }

        /**
         * 获取待处理的好友请求
         * @param {string} userId - 用户ID
         * @returns {Array} 请求列表
         */
        getPendingRequests(userId) {
            const requests = [];
            
            this.friendRequests.forEach(request => {
                if (request.toUserId === userId && request.status === FriendshipStatus.PENDING) {
                    requests.push(request);
                }
            });

            return requests.sort((a, b) => b.createdAt - a.createdAt);
        }

        /**
         * 增加互动
         * @param {string} userId1 - 用户ID1
         * @param {string} userId2 - 用户ID2
         */
        addInteraction(userId1, userId2) {
            const key1 = `${userId1}_${userId2}`;
            const key2 = `${userId2}_${userId1}`;
            
            [key1, key2].forEach(key => {
                const friendship = this.friendships.get(key);
                if (friendship) {
                    friendship.interactions++;
                    friendship.lastInteraction = Date.now();
                    // 亲密度增加
                    friendship.intimacy = Math.min(100, friendship.intimacy + 2);
                    this.friendships.set(key, friendship);
                }
            });
        }

        /**
         * 删除好友
         * @param {string} userId - 用户ID
         * @param {string} friendId - 好友ID
         * @returns {boolean} 是否成功
         */
        removeFriend(userId, friendId) {
            const key1 = `${userId}_${friendId}`;
            const key2 = `${friendId}_${userId}`;
            
            this.friendships.delete(key1);
            this.friendships.delete(key2);
            
            return true;
        }
    }

    // ============================================
    // 学习动态分享系统
    // ============================================
    class LearningFeedSystem {
        constructor() {
            this.posts = new Map();
            this.initSamplePosts();
        }

        /**
         * 初始化示例动态
         */
        initSamplePosts() {
            const samplePosts = [
                {
                    id: 'post_001',
                    userId: 'user_002',
                    userName: '小明',
                    type: PostType.ACHIEVEMENT,
                    content: '刚刚完成了"咖啡店线性思维"场景的高级挑战！耗时45分钟，终于突破了认知陷阱！',
                    images: ['achievement1.png'],
                    relatedScenario: 'coffee_shop',
                    likes: 23,
                    comments: 5,
                    shares: 3,
                    createdAt: Date.now() - 3600000
                },
                {
                    id: 'post_002',
                    userId: 'user_003',
                    userName: '小红',
                    type: PostType.QUESTION,
                    content: '在"投资确认偏误"场景中，有没有什么好的策略来识别信息确认偏差？求教！',
                    images: [],
                    relatedScenario: 'investment_confirmation',
                    likes: 12,
                    comments: 8,
                    shares: 1,
                    createdAt: Date.now() - 7200000
                },
                {
                    id: 'post_003',
                    userId: 'user_004',
                    userName: '小华',
                    type: PostType.PROGRESS,
                    content: '本周学习进度：完成5个场景，解锁3个成就，积分+520！继续加油💪',
                    images: ['progress_chart.png'],
                    relatedScenario: null,
                    likes: 35,
                    comments: 12,
                    shares: 5,
                    createdAt: Date.now() - 86400000
                }
            ];

            samplePosts.forEach(post => {
                this.posts.set(post.id, post);
            });
        }

        /**
         * 发布动态
         * @param {Object} data - 动态数据
         * @returns {Object} 发布的动态
         */
        createPost(data) {
            const post = {
                id: 'post_' + Date.now(),
                userId: data.userId,
                userName: data.userName || '匿名用户',
                type: data.type || PostType.DISCUSSION,
                content: data.content,
                images: data.images || [],
                relatedScenario: data.relatedScenario || null,
                likes: 0,
                comments: 0,
                shares: 0,
                visibility: data.visibility || 'public',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            this.posts.set(post.id, post);
            
            return post;
        }

        /**
         * 获取动态流
         * @param {string} userId - 用户ID
         * @param {Object} options - 选项
         * @returns {Array} 动态列表
         */
        getFeed(userId, options = {}) {
            let posts = Array.from(this.posts.values());

            // 过滤类型
            if (options.type) {
                posts = posts.filter(p => p.type === options.type);
            }

            // 过滤场景
            if (options.scenarioId) {
                posts = posts.filter(p => p.relatedScenario === options.scenarioId);
            }

            // 排序：按创建时间降序
            posts.sort((a, b) => b.createdAt - a.createdAt);

            // 分页
            const page = options.page || 1;
            const pageSize = options.pageSize || 20;
            const startIndex = (page - 1) * pageSize;
            
            return posts.slice(startIndex, startIndex + pageSize);
        }

        /**
         * 获取用户动态
         * @param {string} userId - 用户ID
         * @returns {Array} 动态列表
         */
        getUserPosts(userId) {
            const userPosts = [];
            
            this.posts.forEach(post => {
                if (post.userId === userId) {
                    userPosts.push(post);
                }
            });

            return userPosts.sort((a, b) => b.createdAt - a.createdAt);
        }

        /**
         * 删除动态
         * @param {string} postId - 动态ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        deletePost(postId, userId) {
            const post = this.posts.get(postId);
            if (!post || post.userId !== userId) return false;

            this.posts.delete(postId);
            return true;
        }
    }

    // ============================================
    // 互动评论系统
    // ============================================
    class InteractionSystem {
        constructor() {
            this.interactions = new Map();
            this.comments = new Map();
            this.initSampleInteractions();
        }

        /**
         * 初始化示例互动
         */
        initSampleInteractions() {
            // 示例评论
            const sampleComments = [
                {
                    id: 'comment_001',
                    postId: 'post_001',
                    userId: 'user_003',
                    userName: '小红',
                    content: '太棒了！高级挑战很难的，恭喜！',
                    likes: 5,
                    createdAt: Date.now() - 1800000
                },
                {
                    id: 'comment_002',
                    postId: 'post_001',
                    userId: 'user_005',
                    userName: '小李',
                    content: '分享一下你的解题思路呗～',
                    likes: 3,
                    createdAt: Date.now() - 900000
                }
            ];

            sampleComments.forEach(comment => {
                this.comments.set(comment.id, comment);
            });
        }

        /**
         * 点赞
         * @param {string} targetId - 目标ID
         * @param {string} targetType - 目标类型
         * @param {string} userId - 用户ID
         * @returns {Object} 点赞结果
         */
        like(targetId, targetType, userId) {
            const interactionId = `like_${userId}_${targetId}`;
            
            // 检查是否已点赞
            if (this.interactions.has(interactionId)) {
                // 取消点赞
                this.interactions.delete(interactionId);
                return { liked: false, message: '已取消点赞' };
            }

            const interaction = {
                id: interactionId,
                type: InteractionType.LIKE,
                targetId,
                targetType,
                userId,
                createdAt: Date.now()
            };

            this.interactions.set(interactionId, interaction);
            
            return { liked: true, message: '点赞成功' };
        }

        /**
         * 发表评论
         * @param {Object} data - 评论数据
         * @returns {Object} 评论结果
         */
        comment(data) {
            const comment = {
                id: 'comment_' + Date.now(),
                postId: data.postId,
                userId: data.userId,
                userName: data.userName || '匿名用户',
                content: data.content,
                parentId: data.parentId || null,
                replyTo: data.replyTo || null,
                likes: 0,
                createdAt: Date.now()
            };

            this.comments.set(comment.id, comment);
            
            return comment;
        }

        /**
         * 获取评论列表
         * @param {string} postId - 动态ID
         * @param {Object} options - 选项
         * @returns {Array} 评论列表
         */
        getComments(postId, options = {}) {
            let comments = [];
            
            this.comments.forEach(comment => {
                if (comment.postId === postId) {
                    comments.push(comment);
                }
            });

            // 排序：按时间降序
            comments.sort((a, b) => b.createdAt - a.createdAt);

            // 分页
            const page = options.page || 1;
            const pageSize = options.pageSize || 10;
            const startIndex = (page - 1) * pageSize;
            
            return comments.slice(startIndex, startIndex + pageSize);
        }

        /**
         * 删除评论
         * @param {string} commentId - 评论ID
         * @param {string} userId - 用户ID
         * @returns {boolean} 是否成功
         */
        deleteComment(commentId, userId) {
            const comment = this.comments.get(commentId);
            if (!comment || comment.userId !== userId) return false;

            this.comments.delete(commentId);
            return true;
        }

        /**
         * 分享
         * @param {string} targetId - 目标ID
         * @param {string} targetType - 目标类型
         * @param {string} userId - 用户ID
         * @param {string} shareTo - 分享目标
         * @returns {Object} 分享结果
         */
        share(targetId, targetType, userId, shareTo = 'timeline') {
            const shareId = 'share_' + Date.now();
            
            const share = {
                id: shareId,
                type: InteractionType.SHARE,
                targetId,
                targetType,
                userId,
                shareTo,
                createdAt: Date.now()
            };

            this.interactions.set(shareId, share);
            
            return { success: true, shareId, message: '分享成功' };
        }

        /**
         * 收藏
         * @param {string} targetId - 目标ID
         * @param {string} targetType - 目标类型
         * @param {string} userId - 用户ID
         * @returns {Object} 收藏结果
         */
        collect(targetId, targetType, userId) {
            const collectId = `collect_${userId}_${targetId}`;
            
            if (this.interactions.has(collectId)) {
                this.interactions.delete(collectId);
                return { collected: false, message: '已取消收藏' };
            }

            const collect = {
                id: collectId,
                type: InteractionType.COLLECT,
                targetId,
                targetType,
                userId,
                createdAt: Date.now()
            };

            this.interactions.set(collectId, collect);
            
            return { collected: true, message: '收藏成功' };
        }

        /**
         * 获取用户收藏列表
         * @param {string} userId - 用户ID
         * @param {string} targetType - 目标类型
         * @returns {Array} 收藏列表
         */
        getUserCollections(userId, targetType = null) {
            const collections = [];
            
            this.interactions.forEach(interaction => {
                if (interaction.type === InteractionType.COLLECT && 
                    interaction.userId === userId) {
                    if (!targetType || interaction.targetType === targetType) {
                        collections.push(interaction);
                    }
                }
            });

            return collections.sort((a, b) => b.createdAt - a.createdAt);
        }

        /**
         * 获取互动统计
         * @param {string} targetId - 目标ID
         * @returns {Object} 统计数据
         */
        getInteractionStats(targetId) {
            let likes = 0;
            let comments = 0;
            let shares = 0;
            let collects = 0;

            this.interactions.forEach(interaction => {
                if (interaction.targetId === targetId) {
                    switch (interaction.type) {
                        case InteractionType.LIKE: likes++; break;
                        case InteractionType.SHARE: shares++; break;
                        case InteractionType.COLLECT: collects++; break;
                    }
                }
            });

            this.comments.forEach(comment => {
                if (comment.postId === targetId) {
                    comments++;
                }
            });

            return { likes, comments, shares, collects };
        }
    }

    // ============================================
    // 社交学习系统主类
    // ============================================
    class SocialLearningSystem {
        constructor() {
            this.communityManager = new CommunityManager();
            this.friendSystem = new FriendSystem();
            this.feedSystem = new LearningFeedSystem();
            this.interactionSystem = new InteractionSystem();
            
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
         * 获取社区管理器
         * @returns {CommunityManager} 社区管理器
         */
        getCommunityManager() {
            return this.communityManager;
        }

        /**
         * 获取好友系统
         * @returns {FriendSystem} 好友系统
         */
        getFriendSystem() {
            return this.friendSystem;
        }

        /**
         * 获取动态系统
         * @returns {LearningFeedSystem} 动态系统
         */
        getFeedSystem() {
            return this.feedSystem;
        }

        /**
         * 获取互动系统
         * @returns {InteractionSystem} 互动系统
         */
        getInteractionSystem() {
            return this.interactionSystem;
        }

        /**
         * 发布学习动态
         * @param {Object} data - 动态数据
         * @returns {Object} 发布结果
         */
        shareProgress(data) {
            const post = this.feedSystem.createPost({
                userId: this.currentUser?.id || 'guest',
                userName: this.currentUser?.name || '访客',
                type: data.type || PostType.PROGRESS,
                content: data.content,
                images: data.images || [],
                relatedScenario: data.scenarioId
            });

            this.emit('post:created', post);
            
            return { success: true, post };
        }

        /**
         * 分享成就
         * @param {Object} achievement - 成就信息
         * @returns {Object} 分享结果
         */
        shareAchievement(achievement) {
            return this.shareProgress({
                type: PostType.ACHIEVEMENT,
                content: `解锁成就【${achievement.name}】：${achievement.description}`,
                images: achievement.icon ? [achievement.icon] : [],
                scenarioId: achievement.scenarioId
            });
        }

        /**
         * 获取社交推荐
         * @returns {Object} 推荐内容
         */
        getSocialRecommendations() {
            const communities = this.communityManager.getCommunities()
                .slice(0, 5);
            
            const trendingPosts = this.feedSystem.getFeed(null, { pageSize: 10 })
                .filter(p => p.likes > 10);
            
            const friendActivities = this.currentUser ? 
                this.friendSystem.getFriends(this.currentUser.id)
                    .slice(0, 3)
                    .map(f => ({
                        friendId: f.friendId,
                        recentPosts: this.feedSystem.getUserPosts(f.friendId)
                            .slice(0, 2)
                    })) : [];

            return {
                recommendedCommunities: communities,
                trendingPosts,
                friendActivities
            };
        }

        /**
         * 获取社交统计
         * @param {string} userId - 用户ID
         * @returns {Object} 统计数据
         */
        getSocialStats(userId) {
            const friends = this.friendSystem.getFriends(userId);
            const communities = this.communityManager.getUserCommunities(userId);
            const posts = this.feedSystem.getUserPosts(userId);
            const collections = this.interactionSystem.getUserCollections(userId);

            return {
                friendCount: friends.length,
                communityCount: communities.length,
                postCount: posts.length,
                collectionCount: collections.length,
                totalInteractions: posts.reduce((sum, p) => 
                    sum + p.likes + p.comments + p.shares, 0)
            };
        }

        /**
         * 搜索
         * @param {string} query - 搜索关键词
         * @param {string} type - 搜索类型
         * @returns {Object} 搜索结果
         */
        search(query, type = 'all') {
            const results = {
                communities: [],
                posts: [],
                users: []
            };

            if (type === 'all' || type === 'community') {
                results.communities = this.communityManager.getCommunities({ search: query });
            }

            if (type === 'all' || type === 'post') {
                const posts = this.feedSystem.getFeed(null, { pageSize: 100 });
                results.posts = posts.filter(p => 
                    p.content.toLowerCase().includes(query.toLowerCase())
                );
            }

            return results;
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
                communities: this.communityManager.communities.size,
                friendships: this.friendSystem.friendships.size,
                posts: this.feedSystem.posts.size,
                interactions: this.interactionSystem.interactions.size,
                comments: this.interactionSystem.comments.size
            };
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            SocialLearningSystem,
            CommunityManager,
            FriendSystem,
            LearningFeedSystem,
            InteractionSystem,
            CommunityType,
            FriendshipStatus,
            PostType,
            InteractionType
        };
    } else {
        global.SocialLearningSystem = SocialLearningSystem;
        global.SocialLearningTypes = {
            CommunityType,
            FriendshipStatus,
            PostType,
            InteractionType
        };
    }

})(typeof window !== 'undefined' ? window : this);

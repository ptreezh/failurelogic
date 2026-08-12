/**
 * 知识图谱模块
 * Knowledge Graph Module
 * 
 * 功能：
 * - 认知偏差知识图谱
 * - 概念关系建模
 * - 推理引擎
 * - 知识检索
 * - 图谱可视化
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环19
 */

(function(global) {
    'use strict';

    // ============================================
    // 实体类型
    // ============================================
    const EntityType = {
        CONCEPT: 'concept',
        BIAS: 'bias',
        SCENARIO: 'scenario',
        SYMPTOM: 'symptom',
        SOLUTION: 'solution',
        EXAMPLE: 'example',
        THEORY: 'theory'
    };

    // ============================================
    // 关系类型
    // ============================================
    const RelationType = {
        CAUSES: 'causes',
        CAUSED_BY: 'caused_by',
        RELATES_TO: 'relates_to',
        EXAMPLE_OF: 'example_of',
        SOLUTION_FOR: 'solution_for',
        SYMPTOM_OF: 'symptom_of',
        PRECEDES: 'precedes',
        FOLLOWS: 'follows',
        CONTRADICTS: 'contradicts',
        REINFORCES: 'reinforces'
    };

    // ============================================
    // 知识图谱节点
    // ============================================
    class KnowledgeNode {
        constructor(config) {
            this.id = config.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.type = config.type || EntityType.CONCEPT;
            this.name = config.name || '';
            this.description = config.description || '';
            this.properties = config.properties || {};
            this.confidence = config.confidence || 1.0;
            this.source = config.source || 'system';
            this.createdAt = Date.now();
            this.updatedAt = Date.now();
        }

        /**
         * 更新属性
         */
        updateProperty(key, value) {
            this.properties[key] = value;
            this.updatedAt = Date.now();
        }

        /**
         * 序列化
         */
        toJSON() {
            return {
                id: this.id,
                type: this.type,
                name: this.name,
                description: this.description,
                properties: this.properties,
                confidence: this.confidence,
                source: this.source,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt
            };
        }
    }

    // ============================================
    // 知识图谱边
    // ============================================
    class KnowledgeEdge {
        constructor(config) {
            this.id = config.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.source = config.source;
            this.target = config.target;
            this.relation = config.relation || RelationType.RELATES_TO;
            this.weight = config.weight || 1.0;
            this.properties = config.properties || {};
            this.confidence = config.confidence || 1.0;
        }

        toJSON() {
            return {
                id: this.id,
                source: this.source,
                target: this.target,
                relation: this.relation,
                weight: this.weight,
                properties: this.properties,
                confidence: this.confidence
            };
        }
    }

    // ============================================
    // 知识图谱
    // ============================================
    class KnowledgeGraph {
        constructor() {
            this.nodes = new Map();
            this.edges = new Map();
            this.adjacencyList = new Map();
            this.reverseAdjacencyList = new Map();
            this.indexByName = new Map();
            this.indexByType = new Map();
        }

        /**
         * 添加节点
         */
        addNode(node) {
            if (typeof node === 'object' && !(node instanceof KnowledgeNode)) {
                node = new KnowledgeNode(node);
            }
            
            this.nodes.set(node.id, node);
            
            // 索引
            this.indexByName.set(node.name.toLowerCase(), node.id);
            
            if (!this.indexByType.has(node.type)) {
                this.indexByType.set(node.type, new Set());
            }
            this.indexByType.get(node.type).add(node.id);
            
            // 邻接表初始化
            if (!this.adjacencyList.has(node.id)) {
                this.adjacencyList.set(node.id, new Set());
            }
            if (!this.reverseAdjacencyList.has(node.id)) {
                this.reverseAdjacencyList.set(node.id, new Set());
            }
            
            return node;
        }

        /**
         * 添加边
         */
        addEdge(edge) {
            if (typeof edge === 'object' && !(edge instanceof KnowledgeEdge)) {
                edge = new KnowledgeEdge(edge);
            }
            
            this.edges.set(edge.id, edge);
            
            // 更新邻接表
            if (this.adjacencyList.has(edge.source)) {
                this.adjacencyList.get(edge.source).add(edge.id);
            }
            if (this.reverseAdjacencyList.has(edge.target)) {
                this.reverseAdjacencyList.get(edge.target).add(edge.id);
            }
            
            return edge;
        }

        /**
         * 获取节点
         */
        getNode(id) {
            return this.nodes.get(id);
        }

        /**
         * 按名称查找节点
         */
        findNodeByName(name) {
            const id = this.indexByName.get(name.toLowerCase());
            return id ? this.nodes.get(id) : null;
        }

        /**
         * 按类型获取节点
         */
        getNodesByType(type) {
            const ids = this.indexByType.get(type);
            if (!ids) return [];
            return Array.from(ids).map(id => this.nodes.get(id));
        }

        /**
         * 获取邻居节点
         */
        getNeighbors(nodeId, direction = 'out') {
            const edgeIds = direction === 'out' 
                ? this.adjacencyList.get(nodeId)
                : this.reverseAdjacencyList.get(nodeId);
            
            if (!edgeIds) return [];
            
            const neighbors = [];
            for (const edgeId of edgeIds) {
                const edge = this.edges.get(edgeId);
                if (edge) {
                    const neighborId = direction === 'out' ? edge.target : edge.source;
                    neighbors.push({
                        node: this.nodes.get(neighborId),
                        edge: edge
                    });
                }
            }
            
            return neighbors;
        }

        /**
         * 查找路径 (BFS)
         */
        findPath(startId, endId, maxDepth = 5) {
            const queue = [[startId, [startId]]];
            const visited = new Set([startId]);
            
            while (queue.length > 0) {
                const [currentId, path] = queue.shift();
                
                if (currentId === endId) {
                    return this._buildPathResult(path);
                }
                
                if (path.length >= maxDepth) continue;
                
                const neighbors = this.getNeighbors(currentId);
                for (const { node } of neighbors) {
                    if (!visited.has(node.id)) {
                        visited.add(node.id);
                        queue.push([node.id, [...path, node.id]]);
                    }
                }
            }
            
            return null;
        }

        /**
         * 构建路径结果
         */
        _buildPathResult(path) {
            const result = {
                nodes: [],
                edges: [],
                length: path.length - 1
            };
            
            for (let i = 0; i < path.length; i++) {
                result.nodes.push(this.nodes.get(path[i]));
                
                if (i < path.length - 1) {
                    const edge = this._findEdge(path[i], path[i + 1]);
                    if (edge) result.edges.push(edge);
                }
            }
            
            return result;
        }

        /**
         * 查找两个节点间的边
         */
        _findEdge(sourceId, targetId) {
            const edgeIds = this.adjacencyList.get(sourceId);
            if (!edgeIds) return null;
            
            for (const edgeId of edgeIds) {
                const edge = this.edges.get(edgeId);
                if (edge && edge.target === targetId) {
                    return edge;
                }
            }
            
            return null;
        }

        /**
         * 子图提取
         */
        extractSubgraph(centerId, depth = 2) {
            const subgraph = new KnowledgeGraph();
            const visited = new Set();
            
            this._extractSubgraphDFS(centerId, depth, subgraph, visited);
            
            return subgraph;
        }

        /**
         * DFS提取子图
         */
        _extractSubgraphDFS(nodeId, depth, subgraph, visited) {
            if (depth < 0 || visited.has(nodeId)) return;
            
            visited.add(nodeId);
            const node = this.nodes.get(nodeId);
            if (!node) return;
            
            subgraph.addNode(node);
            
            const neighbors = this.getNeighbors(nodeId);
            for (const { node: neighbor, edge } of neighbors) {
                subgraph.addNode(neighbor);
                subgraph.addEdge(edge);
                this._extractSubgraphDFS(neighbor.id, depth - 1, subgraph, visited);
            }
        }

        /**
         * 导出为JSON
         */
        toJSON() {
            return {
                nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
                edges: Array.from(this.edges.values()).map(e => e.toJSON())
            };
        }

        /**
         * 从JSON导入
         */
        fromJSON(data) {
            for (const nodeData of data.nodes) {
                this.addNode(new KnowledgeNode(nodeData));
            }
            for (const edgeData of data.edges) {
                this.addEdge(new KnowledgeEdge(edgeData));
            }
            return this;
        }

        /**
         * 统计信息
         */
        getStats() {
            const typeCount = {};
            for (const [type, ids] of this.indexByType) {
                typeCount[type] = ids.size;
            }
            
            return {
                totalNodes: this.nodes.size,
                totalEdges: this.edges.size,
                nodeTypes: typeCount
            };
        }
    }

    // ============================================
    // 推理引擎
    // ============================================
    class InferenceEngine {
        constructor(knowledgeGraph) {
            this.graph = knowledgeGraph;
            this.rules = [];
        }

        /**
         * 添加推理规则
         */
        addRule(rule) {
            this.rules.push({
                id: rule.id,
                name: rule.name,
                condition: rule.condition,
                action: rule.action,
                priority: rule.priority || 0
            });
            
            // 按优先级排序
            this.rules.sort((a, b) => b.priority - a.priority);
        }

        /**
         * 前向推理
         */
        forwardChain(facts) {
            const derived = new Set(facts);
            let changed = true;
            
            while (changed) {
                changed = false;
                
                for (const rule of this.rules) {
                    const result = rule.condition(this.graph, derived);
                    if (result) {
                        const newFacts = rule.action(this.graph, result);
                        for (const fact of newFacts) {
                            if (!derived.has(fact)) {
                                derived.add(fact);
                                changed = true;
                            }
                        }
                    }
                }
            }
            
            return Array.from(derived);
        }

        /**
         * 后向推理
         */
        backwardChain(goal, visited = new Set()) {
            if (visited.has(goal)) return false;
            visited.add(goal);
            
            // 检查是否已知
            if (this.graph.findNodeByName(goal)) {
                return true;
            }
            
            // 尝试通过规则推导
            for (const rule of this.rules) {
                const subgoals = this._getSubgoals(rule, goal);
                if (subgoals) {
                    let allProven = true;
                    for (const subgoal of subgoals) {
                        if (!this.backwardChain(subgoal, visited)) {
                            allProven = false;
                            break;
                        }
                    }
                    if (allProven) return true;
                }
            }
            
            return false;
        }

        /**
         * 获取子目标
         */
        _getSubgoals(rule, goal) {
            // 简化实现：检查规则是否可能推导目标
            return null;
        }

        /**
         * 查找相关概念
         */
        findRelatedConcepts(conceptName, maxDepth = 2) {
            const node = this.graph.findNodeByName(conceptName);
            if (!node) return [];
            
            const related = [];
            const visited = new Set();
            
            this._collectRelated(node.id, maxDepth, related, visited);
            
            return related;
        }

        /**
         * 收集相关概念
         */
        _collectRelated(nodeId, depth, related, visited) {
            if (depth <= 0 || visited.has(nodeId)) return;
            visited.add(nodeId);
            
            const neighbors = this.graph.getNeighbors(nodeId);
            for (const { node, edge } of neighbors) {
                related.push({
                    concept: node,
                    relation: edge.relation,
                    distance: depth
                });
                this._collectRelated(node.id, depth - 1, related, visited);
            }
        }

        /**
         * 推荐解决方案
         */
        recommendSolutions(biasName) {
            const biasNode = this.graph.findNodeByName(biasName);
            if (!biasNode) return [];
            
            const solutions = [];
            const neighbors = this.graph.getNeighbors(biasNode.id);
            
            for (const { node, edge } of neighbors) {
                if (edge.relation === RelationType.SOLUTION_FOR || 
                    node.type === EntityType.SOLUTION) {
                    solutions.push({
                        solution: node,
                        relevance: edge.weight,
                        relation: edge.relation
                    });
                }
            }
            
            // 递归查找更多解决方案
            for (const { node } of neighbors) {
                if (node.type === EntityType.CONCEPT) {
                    const subNeighbors = this.graph.getNeighbors(node.id);
                    for (const { node: subNode, edge: subEdge } of subNeighbors) {
                        if (subNode.type === EntityType.SOLUTION) {
                            solutions.push({
                                solution: subNode,
                                relevance: subEdge.weight * 0.8, // 降低间接关联的相关性
                                relation: 'indirect'
                            });
                        }
                    }
                }
            }
            
            // 去重并排序
            const unique = new Map();
            for (const s of solutions) {
                if (!unique.has(s.solution.id) || unique.get(s.solution.id).relevance < s.relevance) {
                    unique.set(s.solution.id, s);
                }
            }
            
            return Array.from(unique.values())
                .sort((a, b) => b.relevance - a.relevance);
        }
    }

    // ============================================
    // 认知偏差知识图谱构建器
    // ============================================
    class CognitiveBiasKnowledgeGraphBuilder {
        constructor() {
            this.graph = new KnowledgeGraph();
        }

        /**
         * 构建默认知识图谱
         */
        buildDefault() {
            // 添加认知偏差节点
            const biases = [
                { name: '线性思维', type: EntityType.BIAS, description: '将复杂系统简化为线性因果关系' },
                { name: '确认偏误', type: EntityType.BIAS, description: '倾向于寻找支持现有信念的证据' },
                { name: '时间延迟盲点', type: EntityType.BIAS, description: '低估决策效果的延迟显现' },
                { name: '过度自信', type: EntityType.BIAS, description: '对自己的判断过于自信' },
                { name: '锚定效应', type: EntityType.BIAS, description: '过度依赖初始信息' },
                { name: '沉没成本谬误', type: EntityType.BIAS, description: '因已投入成本而继续错误决策' },
                { name: '复利盲点', type: EntityType.BIAS, description: '低估指数增长的力量' },
                { name: '系统盲点', type: EntityType.BIAS, description: '忽视复杂系统的涌现性' }
            ];
            
            for (const bias of biases) {
                this.graph.addNode(bias);
            }
            
            // 添加场景节点
            const scenarios = [
                { name: '咖啡店场景', type: EntityType.SCENARIO, description: '体验非线性效应和时间延迟' },
                { name: '关系投资场景', type: EntityType.SCENARIO, description: '理解时间延迟和反馈回路' },
                { name: '投资确认偏误场景', type: EntityType.SCENARIO, description: '识别信息选择偏好' },
                { name: '博弈论场景', type: EntityType.SCENARIO, description: '理解复杂决策和纳什均衡' }
            ];
            
            for (const scenario of scenarios) {
                this.graph.addNode(scenario);
            }
            
            // 添加解决方案节点
            const solutions = [
                { name: '系统思维训练', type: EntityType.SOLUTION, description: '学习识别复杂系统中的反馈回路' },
                { name: '多角度分析', type: EntityType.SOLUTION, description: '主动寻找反面证据' },
                { name: '延迟效应意识', type: EntityType.SOLUTION, description: '建立决策效果的延迟追踪机制' },
                { name: '概率思维', type: EntityType.SOLUTION, description: '用概率而非确定性思考' },
                { name: '决策日志', type: EntityType.SOLUTION, description: '记录决策过程以便反思' }
            ];
            
            for (const solution of solutions) {
                this.graph.addNode(solution);
            }
            
            // 添加关系
            const relations = [
                { source: '咖啡店场景', target: '线性思维', relation: RelationType.EXAMPLE_OF },
                { source: '咖啡店场景', target: '时间延迟盲点', relation: RelationType.EXAMPLE_OF },
                { source: '关系投资场景', target: '时间延迟盲点', relation: RelationType.EXAMPLE_OF },
                { source: '关系投资场景', target: '复利盲点', relation: RelationType.EXAMPLE_OF },
                { source: '投资确认偏误场景', target: '确认偏误', relation: RelationType.EXAMPLE_OF },
                { source: '博弈论场景', target: '系统盲点', relation: RelationType.EXAMPLE_OF },
                { source: '系统思维训练', target: '线性思维', relation: RelationType.SOLUTION_FOR },
                { source: '系统思维训练', target: '系统盲点', relation: RelationType.SOLUTION_FOR },
                { source: '多角度分析', target: '确认偏误', relation: RelationType.SOLUTION_FOR },
                { source: '延迟效应意识', target: '时间延迟盲点', relation: RelationType.SOLUTION_FOR },
                { source: '概率思维', target: '过度自信', relation: RelationType.SOLUTION_FOR },
                { source: '决策日志', target: '锚定效应', relation: RelationType.SOLUTION_FOR },
                { source: '线性思维', target: '时间延迟盲点', relation: RelationType.RELATES_TO },
                { source: '确认偏误', target: '过度自信', relation: RelationType.REINFORCES }
            ];
            
            for (const rel of relations) {
                const sourceNode = this.graph.findNodeByName(rel.source);
                const targetNode = this.graph.findNodeByName(rel.target);
                if (sourceNode && targetNode) {
                    this.graph.addEdge({
                        source: sourceNode.id,
                        target: targetNode.id,
                        relation: rel.relation,
                        weight: 1.0
                    });
                }
            }
            
            return this.graph;
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            KnowledgeNode,
            KnowledgeEdge,
            KnowledgeGraph,
            InferenceEngine,
            CognitiveBiasKnowledgeGraphBuilder,
            EntityType,
            RelationType
        };
    } else {
        global.KnowledgeNode = KnowledgeNode;
        global.KnowledgeEdge = KnowledgeEdge;
        global.KnowledgeGraph = KnowledgeGraph;
        global.InferenceEngine = InferenceEngine;
        global.CognitiveBiasKnowledgeGraphBuilder = CognitiveBiasKnowledgeGraphBuilder;
        global.EntityType = EntityType;
        global.RelationType = RelationType;
    }

})(typeof window !== 'undefined' ? window : this);

/**
 * Causal Loop Diagram (CLD) 可视化模块
 * 基于 D3.js 力导向图实现
 * 用于认知陷阱平台的系统动力学可视化
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环1
 */

// CLD数据结构定义
const CLD_SCHEMA = {
    nodes: [
        {
            id: "string",           // 唯一标识
            name: "string",         // 变量名称
            type: "stock|flow|aux", // 变量类型
            value: "number",        // 当前值（可选）
            description: "string"   // 描述（可选）
        }
    ],
    links: [
        {
            source: "string",       // 源节点ID
            target: "string",       // 目标节点ID
            polarity: "+|-" ,       // 极性：正向(+)或负向(-)
            delay: "number",        // 时间延迟（回合数）
            strength: "number"      // 关系强度 0-1
        }
    ],
    loops: [
        {
            id: "string",
            name: "string",
            type: "R|B",            // R=增强回路, B=平衡回路
            nodes: ["string"]       // 回路包含的节点ID列表
        }
    ]
};

// 咖啡店场景CLD数据
const COFFEE_SHOP_CLD = {
    nodes: [
        { id: "quality", name: "咖啡质量", type: "stock", value: 70 },
        { id: "satisfaction", name: "顾客满意度", type: "aux", value: 60 },
        { id: "reputation", name: "店铺口碑", type: "stock", value: 50 },
        { id: "customers", name: "顾客数量", type: "flow", value: 100 },
        { id: "revenue", name: "营业收入", type: "stock", value: 50000 },
        { id: "training", name: "员工培训投入", type: "flow", value: 5000 },
        { id: "expansion", name: "扩张速度", type: "flow", value: 0 },
        { id: "complexity", name: "管理复杂度", type: "aux", value: 30 }
    ],
    links: [
        { source: "quality", target: "satisfaction", polarity: "+", delay: 0, strength: 0.8 },
        { source: "satisfaction", target: "reputation", polarity: "+", delay: 2, strength: 0.7 },
        { source: "reputation", target: "customers", polarity: "+", delay: 1, strength: 0.9 },
        { source: "customers", target: "revenue", polarity: "+", delay: 0, strength: 1.0 },
        { source: "revenue", target: "training", polarity: "+", delay: 0, strength: 0.5 },
        { source: "training", target: "quality", polarity: "+", delay: 3, strength: 0.6 },
        { source: "revenue", target: "expansion", polarity: "+", delay: 0, strength: 0.4 },
        { source: "expansion", target: "complexity", polarity: "+", delay: 1, strength: 0.8 },
        { source: "complexity", target: "quality", polarity: "-", delay: 2, strength: 0.5 }
    ],
    loops: [
        {
            id: "R1",
            name: "质量提升增强回路",
            type: "R",
            nodes: ["quality", "satisfaction", "reputation", "customers", "revenue", "training"]
        },
        {
            id: "B1",
            name: "扩张平衡回路",
            type: "B",
            nodes: ["revenue", "expansion", "complexity", "quality"]
        }
    ]
};

// D3.js CLD可视化类
class CausalLoopDiagram {
    constructor(containerId, width = 800, height = 600) {
        this.containerId = containerId;
        this.width = width;
        this.height = height;
        this.data = null;
        this.simulation = null;
        this.svg = null;
        
        this.init();
    }
    
    init() {
        // 创建SVG容器
        this.svg = d3.select(`#${this.containerId}`)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class", "cld-container");
        
        // 定义箭头标记
        this.defineArrowMarkers();
        
        // 创建图层
        this.linksGroup = this.svg.append("g").attr("class", "links");
        this.nodesGroup = this.svg.append("g").attr("class", "nodes");
        this.labelsGroup = this.svg.append("g").attr("class", "labels");
    }
    
    defineArrowMarkers() {
        // 正向箭头（蓝色）
        this.svg.append("defs").append("marker")
            .attr("id", "arrow-positive")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#2563eb");
        
        // 负向箭头（红色）
        this.svg.append("defs").append("marker")
            .attr("id", "arrow-negative")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#dc2626");
    }
    
    loadData(data) {
        this.data = data;
        this.processData();
        this.createSimulation();
        this.render();
    }
    
    processData() {
        // 构建节点索引映射
        const nodeMap = new Map();
        this.data.nodes.forEach((node, i) => {
            nodeMap.set(node.id, i);
        });
        
        // 转换链接数据
        this.links = this.data.links.map(link => ({
            source: nodeMap.get(link.source),
            target: nodeMap.get(link.target),
            polarity: link.polarity,
            delay: link.delay,
            strength: link.strength,
            original: link
        }));
        
        // 转换节点数据
        this.nodes = this.data.nodes.map(node => ({ ...node }));
    }
    
    createSimulation() {
        this.simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.links)
                .id(d => d.id)
                .distance(120)
                .strength(d => d.strength))
            .force("charge", d3.forceManyBody()
                .strength(-400))
            .force("center", d3.forceCenter(
                this.width / 2,
                this.height / 2
            ))
            .force("collision", d3.forceCollide().radius(50));
    }
    
    render() {
        // 渲染链接
        const link = this.linksGroup.selectAll(".link")
            .data(this.links)
            .enter()
            .append("path")
            .attr("class", d => `link link-${d.polarity === '+' ? 'positive' : 'negative'}`)
            .attr("stroke", d => d.polarity === '+' ? '#2563eb' : '#dc2626')
            .attr("stroke-width", d => 2 + d.strength * 3)
            .attr("fill", "none")
            .attr("marker-end", d => `url(#arrow-${d.polarity === '+' ? 'positive' : 'negative'})`)
            .attr("stroke-dasharray", d => d.delay > 0 ? "5,5" : "none");
        
        // 渲染节点
        const node = this.nodesGroup.selectAll(".node")
            .data(this.nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .call(this.drag());
        
        // 节点形状根据类型
        node.each(function(d) {
            const g = d3.select(this);
            
            if (d.type === "stock") {
                // 存量用矩形
                g.append("rect")
                    .attr("width", 80)
                    .attr("height", 40)
                    .attr("x", -40)
                    .attr("y", -20)
                    .attr("rx", 4)
                    .attr("fill", "#3b82f6")
                    .attr("stroke", "#1d4ed8")
                    .attr("stroke-width", 2);
            } else if (d.type === "flow") {
                // 流量用平行四边形
                g.append("polygon")
                    .attr("points", "-40,-20 40,-20 30,20 -50,20")
                    .attr("fill", "#10b981")
                    .attr("stroke", "#059669")
                    .attr("stroke-width", 2);
            } else {
                // 辅助变量用圆形
                g.append("circle")
                    .attr("r", 25)
                    .attr("fill", "#f59e0b")
                    .attr("stroke", "#d97706")
                    .attr("stroke-width", 2);
            }
        });
        
        // 节点标签
        const label = this.labelsGroup.selectAll(".label")
            .data(this.nodes)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(d => d.name);
        
        // 更新位置
        this.simulation.on("tick", () => {
            link.attr("d", d => this.linkPath(d));
            node.attr("transform", d => `translate(${d.x},${d.y})`);
            label.attr("x", d => d.x)
                 .attr("y", d => d.y);
        });
    }
    
    linkPath(d) {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // 曲线连接
        return `M${d.source.x},${d.source.y}
                A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    }
    
    drag() {
        return d3.drag()
            .on("start", (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on("drag", (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on("end", (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
    
    // 高亮反馈回路
    highlightLoop(loopId) {
        const loop = this.data.loops.find(l => l.id === loopId);
        if (!loop) return;
        
        // 重置所有样式
        this.linksGroup.selectAll(".link")
            .attr("stroke-opacity", 0.2);
        this.nodesGroup.selectAll(".node")
            .attr("opacity", 0.3);
        
        // 高亮回路中的节点和链接
        loop.nodes.forEach(nodeId => {
            this.nodesGroup.selectAll(".node")
                .filter(d => d.id === nodeId)
                .attr("opacity", 1);
        });
        
        this.linksGroup.selectAll(".link")
            .filter(d => {
                const sourceId = this.nodes[d.source.index]?.id;
                const targetId = this.nodes[d.target.index]?.id;
                return loop.nodes.includes(sourceId) && loop.nodes.includes(targetId);
            })
            .attr("stroke-opacity", 1)
            .attr("stroke-width", d => 4 + d.strength * 4);
    }
    
    // 模拟系统动态
    simulate(steps = 10, interval = 500) {
        let currentStep = 0;
        
        const runStep = () => {
            if (currentStep >= steps) return;
            
            // 更新节点值
            this.data.links.forEach(link => {
                const sourceNode = this.nodes.find(n => n.id === link.source);
                const targetNode = this.nodes.find(n => n.id === link.target);
                
                if (sourceNode && targetNode) {
                    const change = sourceNode.value * link.strength * 0.1;
                    if (link.polarity === '+') {
                        targetNode.value += change;
                    } else {
                        targetNode.value -= change;
                    }
                }
            });
            
            // 更新显示
            this.updateValues();
            
            currentStep++;
            setTimeout(runStep, interval);
        };
        
        runStep();
    }
    
    updateValues() {
        this.nodesGroup.selectAll(".node")
            .each(function(d) {
                // 更新显示的值
                const valueText = d3.select(this).select(".value-display");
                if (valueText.empty()) {
                    d3.select(this).append("text")
                        .attr("class", "value-display")
                        .attr("y", 30)
                        .attr("text-anchor", "middle")
                        .attr("fill", "#666")
                        .attr("font-size", "10px")
                        .text(d.value.toFixed(0));
                } else {
                    valueText.text(d.value.toFixed(0));
                }
            });
    }
}

// 觉醒时刻可视化
class AwakeningMomentVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
    
    show(expected, actual, divergence) {
        const html = `
            <div class="awakening-moment">
                <div class="awakening-title">⚡ 觉醒时刻 ⚡</div>
                <div class="comparison">
                    <div class="expected">
                        <div class="label">你的线性期望</div>
                        <div class="value">${expected.toFixed(1)}</div>
                        <div class="bar" style="width: ${Math.min(expected, 100)}%"></div>
                    </div>
                    <div class="actual">
                        <div class="label">系统的真实反馈</div>
                        <div class="value">${actual.toFixed(1)}</div>
                        <div class="bar" style="width: ${Math.min(actual, 100)}%"></div>
                    </div>
                </div>
                <div class="divergence">
                    <span class="gap">差距：${divergence.toFixed(1)}</span>
                    <span class="insight">${this.getInsight(divergence)}</span>
                </div>
            </div>
        `;
        
        HTMLSanitizer?.setInnerHTML(this.container, html);
        this.animate();
    }
    
    getInsight(divergence) {
        if (divergence > 50) {
            return "🚨 严重偏差！系统存在强反馈回路和时间延迟";
        } else if (divergence > 30) {
            return "⚠️ 显著偏差！线性思维忽略了系统复杂性";
        } else if (divergence > 10) {
            return "💡 轻微偏差，注意时间延迟效应";
        }
        return "✅ 预测接近，继续观察";
    }
    
    animate() {
        // CSS动画类
        this.container.querySelector('.awakening-moment')
            .classList.add('animate-in');
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CausalLoopDiagram, AwakeningMomentVisualizer, COFFEE_SHOP_CLD };
}

// 使用示例
/*
// 初始化CLD
const cld = new CausalLoopDiagram("cld-container");
cld.loadData(COFFEE_SHOP_CLD);

// 高亮特定回路
cld.highlightLoop("R1");

// 模拟系统动态
cld.simulate(20, 300);

// 显示觉醒时刻
const awakening = new AwakeningMomentVisualizer("awakening-container");
awakening.show(80, 45, 35);
*/

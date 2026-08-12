/**
 * 数据可视化增强模块
 * Data Visualization Enhancement Module
 * 
 * 功能：
 * - 决策路径可视化
 * - 实时数据图表
 * - 认知偏差热力图
 * - 学习进度仪表盘
 * - 交互式数据探索
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环16
 */

(function(global) {
    'use strict';

    // ============================================
    // 图表类型枚举
    // ============================================
    const ChartType = {
        LINE: 'line',
        BAR: 'bar',
        PIE: 'pie',
        RADAR: 'radar',
        HEATMAP: 'heatmap',
        SANKEY: 'sankey',
        TREEMAP: 'treemap',
        GAUGE: 'gauge'
    };

    // ============================================
    // 颜色主题
    // ============================================
    const ColorTheme = {
        PRIMARY: '#2563eb',
        SECONDARY: '#64748b',
        SUCCESS: '#22c55e',
        WARNING: '#f59e0b',
        DANGER: '#ef4444',
        INFO: '#06b6d4',
        GRADIENT_BLUE: ['#3b82f6', '#60a5fa', '#93c5fd'],
        GRADIENT_GREEN: ['#22c55e', '#4ade80', '#86efac'],
        GRADIENT_RED: ['#ef4444', '#f87171', '#fca5a5'],
        COGNITIVE_BIAS: {
            low: '#22c55e',
            medium: '#f59e0b',
            high: '#ef4444'
        }
    };

    // ============================================
    // 基础图表渲染器
    // ============================================
    class ChartRenderer {
        constructor(containerId, options = {}) {
            this.container = document.getElementById(containerId);
            this.options = {
                width: options.width || 600,
                height: options.height || 400,
                margin: options.margin || { top: 20, right: 20, bottom: 40, left: 50 },
                animated: options.animated !== false,
                responsive: options.responsive !== false,
                ...options
            };
            
            this.canvas = null;
            this.ctx = null;
            this.data = null;
            this.scales = {};
            
            this._initCanvas();
        }

        /**
         * 初始化Canvas
         */
        _initCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;
            
            if (this.options.responsive) {
                this.canvas.style.width = '100%';
                this.canvas.style.height = 'auto';
            }
            
            this.ctx = this.canvas.getContext('2d');
            
            if (this.container) {
                HTMLSanitizer?.setInnerHTML(this.container, '');
                this.container.appendChild(this.canvas);
            }
        }

        /**
         * 设置数据
         */
        setData(data) {
            this.data = data;
            return this;
        }

        /**
         * 清除画布
         */
        clear() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return this;
        }

        /**
         * 绘制坐标轴
         */
        drawAxes(xLabel = '', yLabel = '') {
            const { width, height, margin } = this.options;
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;

            this.ctx.strokeStyle = '#e5e7eb';
            this.ctx.lineWidth = 1;

            // Y轴
            this.ctx.beginPath();
            this.ctx.moveTo(margin.left, margin.top);
            this.ctx.lineTo(margin.left, height - margin.bottom);
            this.ctx.stroke();

            // X轴
            this.ctx.beginPath();
            this.ctx.moveTo(margin.left, height - margin.bottom);
            this.ctx.lineTo(width - margin.right, height - margin.bottom);
            this.ctx.stroke();

            // 标签
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '12px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(xLabel, margin.left + chartWidth / 2, height - 5);

            this.ctx.save();
            this.ctx.translate(15, margin.top + chartHeight / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.fillText(yLabel, 0, 0);
            this.ctx.restore();

            return this;
        }

        /**
         * 绘制网格
         */
        drawGrid(xSteps = 10, ySteps = 5) {
            const { width, height, margin } = this.options;
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;

            this.ctx.strokeStyle = '#f1f5f9';
            this.ctx.lineWidth = 0.5;

            // 水平网格线
            for (let i = 0; i <= ySteps; i++) {
                const y = margin.top + (chartHeight / ySteps) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(margin.left, y);
                this.ctx.lineTo(width - margin.right, y);
                this.ctx.stroke();
            }

            // 垂直网格线
            for (let i = 0; i <= xSteps; i++) {
                const x = margin.left + (chartWidth / xSteps) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(x, margin.top);
                this.ctx.lineTo(x, height - margin.bottom);
                this.ctx.stroke();
            }

            return this;
        }

        /**
         * 导出为图片
         */
        toDataURL(format = 'png') {
            return this.canvas.toDataURL(`image/${format}`);
        }
    }

    // ============================================
    // 折线图
    // ============================================
    class LineChart extends ChartRenderer {
        constructor(containerId, options = {}) {
            super(containerId, options);
            this.points = [];
            this.lines = [];
        }

        /**
         * 添加数据线
         */
        addLine(data, label, color = ColorTheme.PRIMARY) {
            this.lines.push({ data, label, color });
            return this;
        }

        /**
         * 渲染图表
         */
        render() {
            this.clear();
            
            if (this.lines.length === 0) return this;

            const { width, height, margin } = this.options;
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;

            // 计算数据范围
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            for (const line of this.lines) {
                for (const point of line.data) {
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minY = Math.min(minY, point.y);
                    maxY = Math.max(maxY, point.y);
                }
            }

            // 绘制网格和坐标轴
            this.drawGrid(10, 5);
            this.drawAxes();

            // 计算比例尺
            const xScale = chartWidth / (maxX - minX || 1);
            const yScale = chartHeight / (maxY - minY || 1);

            // 绘制每条线
            for (const line of this.lines) {
                this.ctx.strokeStyle = line.color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();

                const sortedData = [...line.data].sort((a, b) => a.x - b.x);
                
                for (let i = 0; i < sortedData.length; i++) {
                    const point = sortedData[i];
                    const x = margin.left + (point.x - minX) * xScale;
                    const y = height - margin.bottom - (point.y - minY) * yScale;

                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }

                this.ctx.stroke();

                // 绘制数据点
                this.ctx.fillStyle = line.color;
                for (const point of sortedData) {
                    const x = margin.left + (point.x - minX) * xScale;
                    const y = height - margin.bottom - (point.y - minY) * yScale;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }

            // 绘制图例
            this._drawLegend();

            return this;
        }

        /**
         * 绘制图例
         */
        _drawLegend() {
            const { width, margin } = this.options;
            let x = margin.left;
            
            this.ctx.font = '11px Inter, sans-serif';
            
            for (const line of this.lines) {
                this.ctx.fillStyle = line.color;
                this.ctx.fillRect(x, 5, 15, 10);
                
                this.ctx.fillStyle = '#374151';
                this.ctx.textAlign = 'left';
                this.ctx.fillText(line.label, x + 20, 13);
                
                x += this.ctx.measureText(line.label).width + 40;
            }
        }
    }

    // ============================================
    // 雷达图
    // ============================================
    class RadarChart extends ChartRenderer {
        constructor(containerId, options = {}) {
            super(containerId, options);
            this.dimensions = [];
            this.datasets = [];
        }

        /**
         * 设置维度
         */
        setDimensions(dimensions) {
            this.dimensions = dimensions;
            return this;
        }

        /**
         * 添加数据集
         */
        addDataset(values, label, color = ColorTheme.PRIMARY) {
            this.datasets.push({ values, label, color });
            return this;
        }

        /**
         * 渲染图表
         */
        render() {
            this.clear();
            
            if (this.dimensions.length < 3) return this;

            const { width, height, margin } = this.options;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(width, height) / 2 - Math.max(margin.left, margin.top) - 30;
            const angleStep = (Math.PI * 2) / this.dimensions.length;

            // 绘制背景网格
            this.ctx.strokeStyle = '#e5e7eb';
            this.ctx.lineWidth = 1;

            for (let level = 1; level <= 5; level++) {
                const r = radius * (level / 5);
                this.ctx.beginPath();
                for (let i = 0; i <= this.dimensions.length; i++) {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.stroke();
            }

            // 绘制轴线
            for (let i = 0; i < this.dimensions.length; i++) {
                const angle = i * angleStep - Math.PI / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(
                    centerX + Math.cos(angle) * radius,
                    centerY + Math.sin(angle) * radius
                );
                this.ctx.stroke();

                // 标签
                const labelX = centerX + Math.cos(angle) * (radius + 15);
                const labelY = centerY + Math.sin(angle) * (radius + 15);
                this.ctx.fillStyle = '#374151';
                this.ctx.font = '11px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.dimensions[i], labelX, labelY);
            }

            // 绘制数据
            for (const dataset of this.datasets) {
                this.ctx.beginPath();
                this.ctx.fillStyle = dataset.color + '40';
                this.ctx.strokeStyle = dataset.color;
                this.ctx.lineWidth = 2;

                for (let i = 0; i <= dataset.values.length; i++) {
                    const idx = i % dataset.values.length;
                    const value = dataset.values[idx];
                    const angle = idx * angleStep - Math.PI / 2;
                    const r = radius * (value / 100);
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;

                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }

                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }

            return this;
        }
    }

    // ============================================
    // 仪表盘
    // ============================================
    class GaugeChart extends ChartRenderer {
        constructor(containerId, options = {}) {
            super(containerId, options);
            this.value = 0;
            this.max = 100;
            this.label = '';
            this.colorRanges = [
                { min: 0, max: 30, color: ColorTheme.DANGER },
                { min: 30, max: 70, color: ColorTheme.WARNING },
                { min: 70, max: 100, color: ColorTheme.SUCCESS }
            ];
        }

        /**
         * 设置值
         */
        setValue(value, max = 100, label = '') {
            this.value = Math.min(value, max);
            this.max = max;
            this.label = label;
            return this;
        }

        /**
         * 渲染图表
         */
        render() {
            this.clear();

            const { width, height } = this.options;
            const centerX = width / 2;
            const centerY = height / 2 + 20;
            const radius = Math.min(width, height) / 2 - 40;

            // 绘制背景弧
            this.ctx.strokeStyle = '#e5e7eb';
            this.ctx.lineWidth = 20;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, Math.PI, 0);
            this.ctx.stroke();

            // 绘制值弧
            const valueAngle = Math.PI - (this.value / this.max) * Math.PI;
            const valueColor = this._getValueColor();
            
            this.ctx.strokeStyle = valueColor;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, Math.PI, valueAngle);
            this.ctx.stroke();

            // 绘制数值
            this.ctx.fillStyle = '#1f2937';
            this.ctx.font = 'bold 32px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Math.round(this.value), centerX, centerY + 10);

            // 绘制标签
            this.ctx.fillStyle = '#6b7280';
            this.ctx.font = '14px Inter, sans-serif';
            this.ctx.fillText(this.label || 'Score', centerX, centerY + 35);

            // 绘制刻度
            this.ctx.fillStyle = '#9ca3af';
            this.ctx.font = '11px Inter, sans-serif';
            this.ctx.fillText('0', centerX - radius - 10, centerY + 30);
            this.ctx.fillText(this.max.toString(), centerX + radius + 10, centerY + 30);

            return this;
        }

        /**
         * 获取值对应的颜色
         */
        _getValueColor() {
            for (const range of this.colorRanges) {
                if (this.value >= range.min && this.value < range.max) {
                    return range.color;
                }
            }
            return ColorTheme.SUCCESS;
        }
    }

    // ============================================
    // 热力图
    // ============================================
    class HeatmapChart extends ChartRenderer {
        constructor(containerId, options = {}) {
            super(containerId, options);
            this.matrix = [];
            this.xLabels = [];
            this.yLabels = [];
            this.colorScale = {
                low: '#dbeafe',
                mid: '#3b82f6',
                high: '#1e40af'
            };
        }

        /**
         * 设置数据
         */
        setMatrix(matrix, xLabels, yLabels) {
            this.matrix = matrix;
            this.xLabels = xLabels;
            this.yLabels = yLabels;
            return this;
        }

        /**
         * 渲染图表
         */
        render() {
            this.clear();

            if (this.matrix.length === 0) return this;

            const { width, height, margin } = this.options;
            const chartWidth = width - margin.left - margin.right;
            const chartHeight = height - margin.top - margin.bottom;

            const rows = this.matrix.length;
            const cols = this.matrix[0].length;
            const cellWidth = chartWidth / cols;
            const cellHeight = chartHeight / rows;

            // 找出最大最小值
            let minVal = Infinity, maxVal = -Infinity;
            for (const row of this.matrix) {
                for (const val of row) {
                    minVal = Math.min(minVal, val);
                    maxVal = Math.max(maxVal, val);
                }
            }

            // 绘制单元格
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const value = this.matrix[i][j];
                    const normalized = (value - minVal) / (maxVal - minVal || 1);
                    
                    this.ctx.fillStyle = this._interpolateColor(normalized);
                    this.ctx.fillRect(
                        margin.left + j * cellWidth,
                        margin.top + i * cellHeight,
                        cellWidth - 1,
                        cellHeight - 1
                    );

                    // 显示数值
                    this.ctx.fillStyle = normalized > 0.5 ? '#fff' : '#1f2937';
                    this.ctx.font = '10px Inter, sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(
                        value.toFixed(1),
                        margin.left + j * cellWidth + cellWidth / 2,
                        margin.top + i * cellHeight + cellHeight / 2 + 3
                    );
                }
            }

            // 绘制X轴标签
            this.ctx.fillStyle = '#374151';
            this.ctx.font = '10px Inter, sans-serif';
            for (let j = 0; j < this.xLabels.length; j++) {
                this.ctx.fillText(
                    this.xLabels[j],
                    margin.left + j * cellWidth + cellWidth / 2,
                    height - margin.bottom + 15
                );
            }

            // 绘制Y轴标签
            for (let i = 0; i < this.yLabels.length; i++) {
                this.ctx.textAlign = 'right';
                this.ctx.fillText(
                    this.yLabels[i],
                    margin.left - 5,
                    margin.top + i * cellHeight + cellHeight / 2 + 3
                );
            }

            return this;
        }

        /**
         * 颜色插值
         */
        _interpolateColor(t) {
            // 简单的线性插值
            const r = Math.round(219 + (30 - 219) * t);
            const g = Math.round(234 + (64 - 234) * t);
            const b = Math.round(254 + (175 - 254) * t);
            return `rgb(${r}, ${g}, ${b})`;
        }
    }

    // ============================================
    // 认知偏差可视化器
    // ============================================
    class CognitiveBiasVisualizer {
        constructor(containerId, options = {}) {
            this.container = document.getElementById(containerId);
            this.options = options;
            this.biasData = {};
        }

        /**
         * 设置偏差数据
         */
        setBiasData(data) {
            this.biasData = data;
            return this;
        }

        /**
         * 渲染偏差仪表盘
         */
        renderBiasDashboard() {
            if (!this.container) return;

            const biases = Object.entries(this.biasData);
            const grid = document.createElement('div');
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;';

            for (const [biasName, data] of biases) {
                const card = document.createElement('div');
                card.style.cssText = `
                    background: #fff;
                    border-radius: 12px;
                    padding: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                `;

                const title = document.createElement('h4');
                title.textContent = this._formatBiasName(biasName);
                title.style.cssText = 'margin: 0 0 12px 0; color: #374151; font-size: 14px;';

                const gaugeId = `gauge_${biasName}`;
                const gaugeContainer = document.createElement('div');
                gaugeContainer.id = gaugeId;

                card.appendChild(title);
                card.appendChild(gaugeContainer);
                grid.appendChild(card);

                // 创建仪表盘
                const gauge = new GaugeChart(gaugeId, { width: 180, height: 120 });
                gauge.setValue(data.score, 10, data.severity);
                gauge.render();
            }

            HTMLSanitizer?.setInnerHTML(this.container, '');
            this.container.appendChild(grid);
        }

        /**
         * 格式化偏差名称
         */
        _formatBiasName(name) {
            return name
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ChartRenderer,
            LineChart,
            RadarChart,
            GaugeChart,
            HeatmapChart,
            CognitiveBiasVisualizer,
            ChartType,
            ColorTheme
        };
    } else {
        global.ChartRenderer = ChartRenderer;
        global.LineChart = LineChart;
        global.RadarChart = RadarChart;
        global.GaugeChart = GaugeChart;
        global.HeatmapChart = HeatmapChart;
        global.CognitiveBiasVisualizer = CognitiveBiasVisualizer;
        global.ChartType = ChartType;
        global.ColorTheme = ColorTheme;
    }

})(typeof window !== 'undefined' ? window : this);

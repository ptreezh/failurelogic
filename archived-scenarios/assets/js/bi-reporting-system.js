/**
 * BI报表系统模块
 * Business Intelligence Reporting System Module
 * 
 * 功能：
 * - 报表模板管理
 * - 数据聚合计算
 * - 可视化图表生成
 * - 报表导出功能
 * - 自动化报表调度
 * 
 * 创建时间：2026-03-13
 * 来源：Soul自主进化循环25
 */

(function(global) {
    'use strict';

    // ============================================
    // 报表类型枚举
    // ============================================
    const ReportType = {
        LEARNING_SUMMARY: 'learning_summary',       // 学习摘要报表
        BEHAVIOR_ANALYSIS: 'behavior_analysis',     // 行为分析报表
        EFFECTIVENESS: 'effectiveness',             // 效果评估报表
        TREND_FORECAST: 'trend_forecast',           // 趋势预测报表
        ANOMALY_REPORT: 'anomaly_report',           // 异常报告
        COMPARATIVE: 'comparative',                 // 对比分析报表
        EXECUTIVE: 'executive',                     // 高管摘要报表
        DETAILED: 'detailed'                        // 详细报表
    };

    // ============================================
    // 导出格式枚举
    // ============================================
    const ExportFormat = {
        JSON: 'json',
        CSV: 'csv',
        HTML: 'html',
        PDF: 'pdf',
        EXCEL: 'xlsx',
        PNG: 'png',
        SVG: 'svg'
    };

    // ============================================
    // 聚合函数枚举
    // ============================================
    const AggregationType = {
        SUM: 'sum',
        AVG: 'avg',
        COUNT: 'count',
        MIN: 'min',
        MAX: 'max',
        MEDIAN: 'median',
        STDDEV: 'stddev',
        PERCENTILE: 'percentile',
        DISTINCT_COUNT: 'distinct_count',
        FIRST: 'first',
        LAST: 'last'
    };

    // ============================================
    // 报表模板定义
    // ============================================
    const ReportTemplates = {
        // 学习摘要模板
        [ReportType.LEARNING_SUMMARY]: {
            name: '学习摘要报表',
            description: '展示用户学习活动的综合摘要',
            sections: [
                { id: 'overview', name: '概览', metrics: ['totalSessions', 'totalTime', 'avgScore'] },
                { id: 'progress', name: '进度', metrics: ['completedScenarios', 'inProgressScenarios', 'completionRate'] },
                { id: 'performance', name: '表现', metrics: ['avgAccuracy', 'avgDecisionTime', 'improvementTrend'] }
            ],
            charts: [
                { type: 'gauge', field: 'completionRate', title: '完成率' },
                { type: 'line', field: 'scoreTrend', title: '分数趋势' },
                { type: 'bar', field: 'scenarioBreakdown', title: '场景分布' }
            ]
        },
        
        // 行为分析模板
        [ReportType.BEHAVIOR_ANALYSIS]: {
            name: '行为分析报表',
            description: '分析用户学习行为模式',
            sections: [
                { id: 'patterns', name: '行为模式', metrics: ['activeHours', 'sessionPatterns', 'navigationPaths'] },
                { id: 'engagement', name: '参与度', metrics: ['interactionRate', 'focusTime', 'returnRate'] },
                { id: 'preferences', name: '偏好', metrics: ['preferredScenarios', 'preferredDifficulty', 'preferredTime'] }
            ],
            charts: [
                { type: 'heatmap', field: 'activityHeatmap', title: '活动热力图' },
                { type: 'pie', field: 'actionDistribution', title: '操作分布' },
                { type: 'sankey', field: 'navigationFlow', title: '导航流向' }
            ]
        },
        
        // 效果评估模板
        [ReportType.EFFECTIVENESS]: {
            name: '效果评估报表',
            description: '评估学习效果和改进情况',
            sections: [
                { id: 'outcomes', name: '学习成果', metrics: ['learningGain', 'skillImprovement', 'knowledgeRetention'] },
                { id: 'bias', name: '认知偏差改善', metrics: ['biasReduction', 'decisionQuality', 'awarenessLevel'] },
                { id: 'comparison', name: '对比分析', metrics: ['peerComparison', 'historicalComparison', 'benchmarkGap'] }
            ],
            charts: [
                { type: 'radar', field: 'skillProfile', title: '技能画像' },
                { type: 'bar', field: 'beforeAfter', title: '前后对比' },
                { type: 'line', field: 'progressCurve', title: '进步曲线' }
            ]
        },
        
        // 高管摘要模板
        [ReportType.EXECUTIVE]: {
            name: '高管摘要报表',
            description: '面向管理层的简化摘要报表',
            sections: [
                { id: 'kpi', name: '关键指标', metrics: ['activeUsers', 'avgCompletionRate', 'avgSatisfaction'] },
                { id: 'highlights', name: '亮点', metrics: ['topPerformers', 'significantImprovements', 'notableTrends'] },
                { id: 'actions', name: '行动建议', metrics: ['recommendations', 'priorityIssues', 'nextSteps'] }
            ],
            charts: [
                { type: 'gauge', field: 'overallScore', title: '综合评分' },
                { type: 'treemap', field: 'categoryBreakdown', title: '类别分布' },
                { type: 'bullet', field: 'kpiComparison', title: 'KPI对比' }
            ]
        }
    };

    // ============================================
    // 数据聚合器
    // ============================================
    class DataAggregator {
        constructor() {
            this.cache = new Map();
        }

        /**
         * 执行聚合计算
         * @param {Array} data - 原始数据
         * @param {string} field - 聚合字段
         * @param {string} aggregationType - 聚合类型
         * @param {Object} options - 附加选项
         * @returns {number|Object} 聚合结果
         */
        aggregate(data, field, aggregationType, options = {}) {
            const values = data.map(item => item[field]).filter(v => v !== undefined && v !== null);
            
            switch (aggregationType) {
                case AggregationType.SUM:
                    return values.reduce((sum, v) => sum + v, 0);
                
                case AggregationType.AVG:
                    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
                
                case AggregationType.COUNT:
                    return values.length;
                
                case AggregationType.MIN:
                    return values.length > 0 ? Math.min(...values) : null;
                
                case AggregationType.MAX:
                    return values.length > 0 ? Math.max(...values) : null;
                
                case AggregationType.MEDIAN:
                    return this._calculateMedian(values);
                
                case AggregationType.STDDEV:
                    return this._calculateStdDev(values);
                
                case AggregationType.PERCENTILE:
                    return this._calculatePercentile(values, options.percentile || 50);
                
                case AggregationType.DISTINCT_COUNT:
                    return new Set(values).size;
                
                case AggregationType.FIRST:
                    return values.length > 0 ? values[0] : null;
                
                case AggregationType.LAST:
                    return values.length > 0 ? values[values.length - 1] : null;
                
                default:
                    throw new Error(`不支持的聚合类型: ${aggregationType}`);
            }
        }

        /**
         * 计算中位数
         */
        _calculateMedian(values) {
            if (values.length === 0) return null;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        }

        /**
         * 计算标准差
         */
        _calculateStdDev(values) {
            if (values.length === 0) return 0;
            const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
            const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
            return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
        }

        /**
         * 计算百分位数
         */
        _calculatePercentile(values, percentile) {
            if (values.length === 0) return null;
            const sorted = [...values].sort((a, b) => a - b);
            const index = Math.ceil((percentile / 100) * sorted.length) - 1;
            return sorted[Math.max(0, index)];
        }

        /**
         * 分组聚合
         * @param {Array} data - 原始数据
         * @param {string} groupBy - 分组字段
         * @param {Object} aggregations - 聚合配置
         * @returns {Object} 分组聚合结果
         */
        groupBy(data, groupBy, aggregations) {
            const groups = {};
            
            // 分组
            for (const item of data) {
                const key = item[groupBy];
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(item);
            }
            
            // 对每组执行聚合
            const results = {};
            for (const [key, groupData] of Object.entries(groups)) {
                results[key] = {};
                for (const [field, aggConfig] of Object.entries(aggregations)) {
                    const { type, options } = typeof aggConfig === 'string' 
                        ? { type: aggConfig, options: {} }
                        : aggConfig;
                    results[key][field] = this.aggregate(groupData, field, type, options);
                }
            }
            
            return results;
        }

        /**
         * 时间窗口聚合
         * @param {Array} data - 原始数据
         * @param {string} timestampField - 时间戳字段
         * @param {string} windowSize - 窗口大小（hourly, daily, weekly, monthly）
         * @param {Object} aggregations - 聚合配置
         */
        timeWindowAggregate(data, timestampField, windowSize, aggregations) {
            const grouped = {};
            
            for (const item of data) {
                const timestamp = item[timestampField];
                const windowKey = this._getWindowKey(timestamp, windowSize);
                if (!grouped[windowKey]) {
                    grouped[windowKey] = [];
                }
                grouped[windowKey].push(item);
            }
            
            const results = [];
            for (const [windowKey, windowData] of Object.entries(grouped)) {
                const result = { window: windowKey, count: windowData.length };
                for (const [field, aggConfig] of Object.entries(aggregations)) {
                    const { type, options } = typeof aggConfig === 'string'
                        ? { type: aggConfig, options: {} }
                        : aggConfig;
                    result[field] = this.aggregate(windowData, field, type, options);
                }
                results.push(result);
            }
            
            return results.sort((a, b) => a.window.localeCompare(b.window));
        }

        /**
         * 获取时间窗口键
         */
        _getWindowKey(timestamp, windowSize) {
            const date = new Date(timestamp);
            switch (windowSize) {
                case 'hourly':
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
                case 'daily':
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                case 'weekly':
                    const week = this._getWeekNumber(date);
                    return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
                case 'monthly':
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                default:
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            }
        }

        /**
         * 获取周数
         */
        _getWeekNumber(date) {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        }

        /**
         * 清除缓存
         */
        clearCache() {
            this.cache.clear();
        }
    }

    // ============================================
    // 图表生成器
    // ============================================
    class ChartGenerator {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.options = {
                width: options.width || 600,
                height: options.height || 400,
                margin: options.margin || { top: 20, right: 20, bottom: 40, left: 50 },
                colors: options.colors || this._defaultColors(),
                animated: options.animated !== false,
                ...options
            };
            this.charts = new Map();
        }

        /**
         * 默认颜色方案
         */
        _defaultColors() {
            return ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#10b981'];
        }

        /**
         * 创建折线图
         * @param {string} chartId - 图表ID
         * @param {Object} config - 图表配置
         */
        createLineChart(chartId, config) {
            const chart = {
                type: 'line',
                id: chartId,
                data: config.data,
                options: {
                    title: config.title || '',
                    xAxis: config.xAxis || { label: '', field: 'x' },
                    yAxis: config.yAxis || { label: '', field: 'y' },
                    series: config.series || [{ field: 'y', name: 'Series 1' }],
                    showLegend: config.showLegend !== false,
                    showGrid: config.showGrid !== false,
                    smooth: config.smooth || false,
                    fill: config.fill || false,
                    ...config.options
                },
                render: (container) => this._renderLineChart(chart, container)
            };
            
            this.charts.set(chartId, chart);
            return chart;
        }

        /**
         * 创建柱状图
         */
        createBarChart(chartId, config) {
            const chart = {
                type: 'bar',
                id: chartId,
                data: config.data,
                options: {
                    title: config.title || '',
                    xAxis: config.xAxis || { label: '', field: 'category' },
                    yAxis: config.yAxis || { label: '', field: 'value' },
                    horizontal: config.horizontal || false,
                    stacked: config.stacked || false,
                    showValues: config.showValues || false,
                    ...config.options
                },
                render: (container) => this._renderBarChart(chart, container)
            };
            
            this.charts.set(chartId, chart);
            return chart;
        }

        /**
         * 创建饼图
         */
        createPieChart(chartId, config) {
            const chart = {
                type: 'pie',
                id: chartId,
                data: config.data,
                options: {
                    title: config.title || '',
                    innerRadius: config.innerRadius || 0,
                    showLabels: config.showLabels !== false,
                    showPercentages: config.showPercentages !== false,
                    showLegend: config.showLegend !== false,
                    ...config.options
                },
                render: (container) => this._renderPieChart(chart, container)
            };
            
            this.charts.set(chartId, chart);
            return chart;
        }

        /**
         * 创建雷达图
         */
        createRadarChart(chartId, config) {
            const chart = {
                type: 'radar',
                id: chartId,
                data: config.data,
                options: {
                    title: config.title || '',
                    maxValue: config.maxValue || 100,
                    levels: config.levels || 5,
                    showLabels: config.showLabels !== false,
                    ...config.options
                },
                render: (container) => this._renderRadarChart(chart, container)
            };
            
            this.charts.set(chartId, chart);
            return chart;
        }

        /**
         * 创建仪表盘图
         */
        createGaugeChart(chartId, config) {
            const chart = {
                type: 'gauge',
                id: chartId,
                data: config.data,
                options: {
                    title: config.title || '',
                    min: config.min || 0,
                    max: config.max || 100,
                    thresholds: config.thresholds || [
                        { value: 33, color: '#ef4444' },
                        { value: 66, color: '#f59e0b' },
                        { value: 100, color: '#22c55e' }
                    ],
                    showValue: config.showValue !== false,
                    unit: config.unit || '%',
                    ...config.options
                },
                render: (container) => this._renderGaugeChart(chart, container)
            };
            
            this.charts.set(chartId, chart);
            return chart;
        }

        /**
         * 创建热力图
         */
        createHeatmapChart(chartId, config) {
            const chart = {
                type: 'heatmap',
                id: chartId,
                data: config.data,
                options: {
                    title: config.title || '',
                    xLabels: config.xLabels || [],
                    yLabels: config.yLabels || [],
                    colorScale: config.colorScale || ['#f0f0f0', '#3b82f6'],
                    showValues: config.showValues || false,
                    ...config.options
                },
                render: (container) => this._renderHeatmapChart(chart, container)
            };
            
            this.charts.set(chartId, chart);
            return chart;
        }

        /**
         * 渲染折线图
         */
        _renderLineChart(chart, container) {
            const { data, options } = chart;
            const svg = this._createSVG(container, options);
            
            // 计算比例尺
            const xExtent = [0, data.length - 1];
            const yExtent = [
                Math.min(...data.map(d => d[options.yAxis.field])),
                Math.max(...data.map(d => d[options.yAxis.field]))
            ];
            
            const xScale = (i) => this.options.margin.left + (i / (data.length - 1)) * (this.options.width - this.options.margin.left - this.options.margin.right);
            const yScale = (v) => this.options.height - this.options.margin.bottom - ((v - yExtent[0]) / (yExtent[1] - yExtent[0])) * (this.options.height - this.options.margin.top - this.options.margin.bottom);
            
            // 绘制网格
            if (options.showGrid) {
                this._drawGrid(svg, xExtent, yExtent, xScale, yScale);
            }
            
            // 绘制线条
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d[options.yAxis.field])}`).join(' ');
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', this.options.colors[0]);
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            svg.appendChild(path);
            
            // 绘制数据点
            for (let i = 0; i < data.length; i++) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', xScale(i));
                circle.setAttribute('cy', yScale(data[i][options.yAxis.field]));
                circle.setAttribute('r', '4');
                circle.setAttribute('fill', this.options.colors[0]);
                svg.appendChild(circle);
            }
            
            // 添加标题
            if (options.title) {
                this._addTitle(svg, options.title);
            }
            
            return svg;
        }

        /**
         * 渲染柱状图
         */
        _renderBarChart(chart, container) {
            const { data, options } = chart;
            const svg = this._createSVG(container, options);
            
            const barWidth = (this.options.width - this.options.margin.left - this.options.margin.right) / data.length - 4;
            const maxValue = Math.max(...data.map(d => d[options.yAxis.field]));
            
            for (let i = 0; i < data.length; i++) {
                const barHeight = (data[i][options.yAxis.field] / maxValue) * (this.options.height - this.options.margin.top - this.options.margin.bottom);
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', this.options.margin.left + i * (barWidth + 4));
                rect.setAttribute('y', this.options.height - this.options.margin.bottom - barHeight);
                rect.setAttribute('width', barWidth);
                rect.setAttribute('height', barHeight);
                rect.setAttribute('fill', this.options.colors[i % this.options.colors.length]);
                svg.appendChild(rect);
                
                // 添加数值标签
                if (options.showValues) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', this.options.margin.left + i * (barWidth + 4) + barWidth / 2);
                    text.setAttribute('y', this.options.height - this.options.margin.bottom - barHeight - 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-size', '12');
                    text.textContent = data[i][options.yAxis.field];
                    svg.appendChild(text);
                }
            }
            
            if (options.title) {
                this._addTitle(svg, options.title);
            }
            
            return svg;
        }

        /**
         * 渲染饼图
         */
        _renderPieChart(chart, container) {
            const { data, options } = chart;
            const svg = this._createSVG(container, options);
            
            const total = data.reduce((sum, d) => sum + d.value, 0);
            const cx = this.options.width / 2;
            const cy = this.options.height / 2;
            const radius = Math.min(this.options.width, this.options.height) / 2 - 20;
            const innerRadius = radius * options.innerRadius;
            
            let currentAngle = -Math.PI / 2;
            
            for (let i = 0; i < data.length; i++) {
                const sliceAngle = (data[i].value / total) * 2 * Math.PI;
                
                const x1 = cx + Math.cos(currentAngle) * radius;
                const y1 = cy + Math.sin(currentAngle) * radius;
                const x2 = cx + Math.cos(currentAngle + sliceAngle) * radius;
                const y2 = cy + Math.sin(currentAngle + sliceAngle) * radius;
                
                const largeArc = sliceAngle > Math.PI ? 1 : 0;
                
                let pathData;
                if (innerRadius > 0) {
                    const ix1 = cx + Math.cos(currentAngle) * innerRadius;
                    const iy1 = cy + Math.sin(currentAngle) * innerRadius;
                    const ix2 = cx + Math.cos(currentAngle + sliceAngle) * innerRadius;
                    const iy2 = cy + Math.sin(currentAngle + sliceAngle) * innerRadius;
                    pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                } else {
                    pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                }
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pathData);
                path.setAttribute('fill', this.options.colors[i % this.options.colors.length]);
                svg.appendChild(path);
                
                // 添加标签
                if (options.showLabels || options.showPercentages) {
                    const labelAngle = currentAngle + sliceAngle / 2;
                    const labelRadius = radius * 0.7;
                    const lx = cx + Math.cos(labelAngle) * labelRadius;
                    const ly = cy + Math.sin(labelAngle) * labelRadius;
                    
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', lx);
                    text.setAttribute('y', ly);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('fill', '#fff');
                    
                    if (options.showPercentages) {
                        text.textContent = `${((data[i].value / total) * 100).toFixed(1)}%`;
                    } else {
                        text.textContent = data[i].label || data[i].name;
                    }
                    svg.appendChild(text);
                }
                
                currentAngle += sliceAngle;
            }
            
            if (options.title) {
                this._addTitle(svg, options.title);
            }
            
            return svg;
        }

        /**
         * 渲染雷达图
         */
        _renderRadarChart(chart, container) {
            const { data, options } = chart;
            const svg = this._createSVG(container, options);
            
            const cx = this.options.width / 2;
            const cy = this.options.height / 2;
            const radius = Math.min(this.options.width, this.options.height) / 2 - 40;
            const angleStep = (2 * Math.PI) / data.length;
            
            // 绘制背景网格
            for (let level = 1; level <= options.levels; level++) {
                const levelRadius = (radius / options.levels) * level;
                for (let i = 0; i <= data.length; i++) {
                    const angle = i * angleStep - Math.PI / 2;
                    const x = cx + Math.cos(angle) * levelRadius;
                    const y = cy + Math.sin(angle) * levelRadius;
                    
                    if (i === 0) {
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        let pathData = '';
                        for (let j = 0; j <= data.length; j++) {
                            const a = j * angleStep - Math.PI / 2;
                            const px = cx + Math.cos(a) * levelRadius;
                            const py = cy + Math.sin(a) * levelRadius;
                            pathData += (j === 0 ? 'M' : 'L') + ` ${px} ${py}`;
                        }
                        path.setAttribute('d', pathData);
                        path.setAttribute('stroke', '#e5e7eb');
                        path.setAttribute('fill', 'none');
                        svg.appendChild(path);
                        break;
                    }
                }
            }
            
            // 绘制轴线
            for (let i = 0; i < data.length; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', cx);
                line.setAttribute('y1', cy);
                line.setAttribute('x2', cx + Math.cos(angle) * radius);
                line.setAttribute('y2', cy + Math.sin(angle) * radius);
                line.setAttribute('stroke', '#e5e7eb');
                svg.appendChild(line);
                
                // 添加标签
                if (options.showLabels) {
                    const labelRadius = radius + 15;
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', cx + Math.cos(angle) * labelRadius);
                    text.setAttribute('y', cy + Math.sin(angle) * labelRadius);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-size', '12');
                    text.textContent = data[i].label || data[i].name;
                    svg.appendChild(text);
                }
            }
            
            // 绘制数据多边形
            let pathData = '';
            for (let i = 0; i <= data.length; i++) {
                const idx = i % data.length;
                const angle = idx * angleStep - Math.PI / 2;
                const value = data[idx].value / options.maxValue;
                const x = cx + Math.cos(angle) * radius * value;
                const y = cy + Math.sin(angle) * radius * value;
                pathData += (i === 0 ? 'M' : 'L') + ` ${x} ${y}`;
            }
            
            const dataPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            dataPath.setAttribute('d', pathData);
            dataPath.setAttribute('fill', this.options.colors[0] + '40');
            dataPath.setAttribute('stroke', this.options.colors[0]);
            dataPath.setAttribute('stroke-width', '2');
            svg.appendChild(dataPath);
            
            if (options.title) {
                this._addTitle(svg, options.title);
            }
            
            return svg;
        }

        /**
         * 渲染仪表盘图
         */
        _renderGaugeChart(chart, container) {
            const { data, options } = chart;
            const svg = this._createSVG(container, options);
            
            const cx = this.options.width / 2;
            const cy = this.options.height / 2 + 20;
            const radius = Math.min(this.options.width, this.options.height) / 2 - 40;
            
            // 绘制背景弧
            for (const threshold of options.thresholds) {
                const endAngle = -Math.PI / 2 + (threshold.value / options.max) * Math.PI;
                // 简化：绘制完整弧
            }
            
            // 绘制背景半圆
            const bgArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            bgArc.setAttribute('d', `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`);
            bgArc.setAttribute('stroke', '#e5e7eb');
            bgArc.setAttribute('stroke-width', '20');
            bgArc.setAttribute('fill', 'none');
            svg.appendChild(bgArc);
            
            // 绘制值弧
            const valueRatio = data.value / options.max;
            const valueAngle = -Math.PI / 2 + valueRatio * Math.PI;
            const endX = cx + Math.cos(valueAngle) * radius;
            const endY = cy + Math.sin(valueAngle) * radius;
            
            const valueArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            valueArc.setAttribute('d', `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`);
            valueArc.setAttribute('stroke', this._getThresholdColor(data.value, options.thresholds));
            valueArc.setAttribute('stroke-width', '20');
            valueArc.setAttribute('fill', 'none');
            svg.appendChild(valueArc);
            
            // 显示值
            if (options.showValue) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', cx);
                text.setAttribute('y', cy + 40);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('font-size', '32');
                text.setAttribute('font-weight', 'bold');
                text.textContent = `${data.value}${options.unit}`;
                svg.appendChild(text);
            }
            
            if (options.title) {
                this._addTitle(svg, options.title);
            }
            
            return svg;
        }

        /**
         * 渲染热力图
         */
        _renderHeatmapChart(chart, container) {
            const { data, options } = chart;
            const svg = this._createSVG(container, options);
            
            const rows = data.length;
            const cols = data[0].length;
            const cellWidth = (this.options.width - this.options.margin.left - this.options.margin.right) / cols;
            const cellHeight = (this.options.height - this.options.margin.top - this.options.margin.bottom) / rows;
            
            // 找出最大最小值
            let min = Infinity, max = -Infinity;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    min = Math.min(min, data[i][j]);
                    max = Math.max(max, data[i][j]);
                }
            }
            
            // 绘制单元格
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const value = data[i][j];
                    const ratio = max !== min ? (value - min) / (max - min) : 0.5;
                    const color = this._interpolateColor(options.colorScale[0], options.colorScale[1], ratio);
                    
                    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    rect.setAttribute('x', this.options.margin.left + j * cellWidth);
                    rect.setAttribute('y', this.options.margin.top + i * cellHeight);
                    rect.setAttribute('width', cellWidth - 1);
                    rect.setAttribute('height', cellHeight - 1);
                    rect.setAttribute('fill', color);
                    svg.appendChild(rect);
                    
                    if (options.showValues) {
                        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        text.setAttribute('x', this.options.margin.left + j * cellWidth + cellWidth / 2);
                        text.setAttribute('y', this.options.margin.top + i * cellHeight + cellHeight / 2);
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('dominant-baseline', 'middle');
                        text.setAttribute('font-size', '10');
                        text.textContent = value;
                        svg.appendChild(text);
                    }
                }
            }
            
            if (options.title) {
                this._addTitle(svg, options.title);
            }
            
            return svg;
        }

        /**
         * 创建SVG容器
         */
        _createSVG(container, options) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', this.options.width);
            svg.setAttribute('height', this.options.height);
            svg.setAttribute('viewBox', `0 0 ${this.options.width} ${this.options.height}`);
            return svg;
        }

        /**
         * 添加标题
         */
        _addTitle(svg, title) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', this.options.width / 2);
            text.setAttribute('y', 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', 'bold');
            text.textContent = title;
            svg.appendChild(text);
        }

        /**
         * 绘制网格
         */
        _drawGrid(svg, xExtent, yExtent, xScale, yScale) {
            // 简化的网格绘制
            for (let i = 0; i < 5; i++) {
                const y = this.options.margin.top + i * (this.options.height - this.options.margin.top - this.options.margin.bottom) / 4;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', this.options.margin.left);
                line.setAttribute('y1', y);
                line.setAttribute('x2', this.options.width - this.options.margin.right);
                line.setAttribute('y2', y);
                line.setAttribute('stroke', '#e5e7eb');
                line.setAttribute('stroke-dasharray', '2');
                svg.appendChild(line);
            }
        }

        /**
         * 获取阈值颜色
         */
        _getThresholdColor(value, thresholds) {
            for (const threshold of thresholds) {
                if (value <= threshold.value) {
                    return threshold.color;
                }
            }
            return thresholds[thresholds.length - 1].color;
        }

        /**
         * 颜色插值
         */
        _interpolateColor(color1, color2, ratio) {
            const r1 = parseInt(color1.slice(1, 3), 16);
            const g1 = parseInt(color1.slice(3, 5), 16);
            const b1 = parseInt(color1.slice(5, 7), 16);
            const r2 = parseInt(color2.slice(1, 3), 16);
            const g2 = parseInt(color2.slice(3, 5), 16);
            const b2 = parseInt(color2.slice(5, 7), 16);
            
            const r = Math.round(r1 + (r2 - r1) * ratio);
            const g = Math.round(g1 + (g2 - g1) * ratio);
            const b = Math.round(b1 + (b2 - b1) * ratio);
            
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }

        /**
         * 渲染图表
         */
        render(chartId, container) {
            const chart = this.charts.get(chartId);
            if (!chart) {
                throw new Error(`图表不存在: ${chartId}`);
            }
            
            const targetContainer = container || document.getElementById(this.containerId);
            if (!targetContainer) {
                throw new Error(`容器不存在: ${this.containerId}`);
            }
            
            HTMLSanitizer?.setInnerHTML(targetContainer, '');
            return chart.render(targetContainer);
        }

        /**
         * 渲染所有图表
         */
        renderAll(container) {
            const results = {};
            for (const [chartId, chart] of this.charts) {
                results[chartId] = this.render(chartId, container);
            }
            return results;
        }
    }

    // ============================================
    // 报表生成器
    // ============================================
    class ReportGenerator {
        constructor() {
            this.templates = new Map(Object.entries(ReportTemplates));
            this.aggregator = new DataAggregator();
            this.reports = new Map();
        }

        /**
         * 注册自定义模板
         * @param {string} templateId - 模板ID
         * @param {Object} template - 模板定义
         */
        registerTemplate(templateId, template) {
            this.templates.set(templateId, template);
            return this;
        }

        /**
         * 生成报表
         * @param {string} reportType - 报表类型
         * @param {Object} data - 报表数据
         * @param {Object} options - 生成选项
         * @returns {Object} 生成的报表
         */
        generateReport(reportType, data, options = {}) {
            const template = this.templates.get(reportType);
            if (!template) {
                throw new Error(`未找到报表模板: ${reportType}`);
            }
            
            const report = {
                id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: reportType,
                name: options.name || template.name,
                description: options.description || template.description,
                generatedAt: Date.now(),
                period: options.period || { start: Date.now() - 86400000 * 7, end: Date.now() },
                sections: [],
                charts: [],
                summary: {},
                metadata: {
                    generatedBy: options.generatedBy || 'system',
                    version: '3.0.0'
                }
            };
            
            // 生成各部分内容
            for (const section of template.sections) {
                const sectionData = this._generateSection(section, data, options);
                report.sections.push(sectionData);
            }
            
            // 生成图表配置
            for (const chartConfig of template.charts) {
                const chartData = this._generateChartData(chartConfig, data, options);
                report.charts.push(chartData);
            }
            
            // 生成摘要
            report.summary = this._generateSummary(report.sections);
            
            // 存储报表
            this.reports.set(report.id, report);
            
            return report;
        }

        /**
         * 生成报表部分
         */
        _generateSection(section, data, options) {
            const metricsData = {};
            
            for (const metric of section.metrics) {
                if (data[metric] !== undefined) {
                    metricsData[metric] = {
                        value: data[metric],
                        label: this._getMetricLabel(metric),
                        trend: data[`${metric}Trend`] || null,
                        comparison: data[`${metric}Comparison`] || null
                    };
                }
            }
            
            return {
                id: section.id,
                name: section.name,
                metrics: metricsData,
                insights: this._generateSectionInsights(section, metricsData)
            };
        }

        /**
         * 获取指标标签
         */
        _getMetricLabel(metric) {
            const labels = {
                totalSessions: '总会话数',
                totalTime: '总学习时间',
                avgScore: '平均分数',
                completedScenarios: '已完成场景',
                inProgressScenarios: '进行中场景',
                completionRate: '完成率',
                avgAccuracy: '平均准确率',
                avgDecisionTime: '平均决策时间',
                improvementTrend: '进步趋势',
                learningGain: '学习收益',
                skillImprovement: '技能提升',
                knowledgeRetention: '知识保持',
                activeUsers: '活跃用户',
                avgSatisfaction: '平均满意度'
            };
            return labels[metric] || metric;
        }

        /**
         * 生成部分洞察
         */
        _generateSectionInsights(section, metricsData) {
            const insights = [];
            
            for (const [metric, data] of Object.entries(metricsData)) {
                if (data.trend) {
                    if (data.trend > 0) {
                        insights.push(`${data.label}呈上升趋势 (+${(data.trend * 100).toFixed(1)}%)`);
                    } else if (data.trend < 0) {
                        insights.push(`${data.label}呈下降趋势 (${(data.trend * 100).toFixed(1)}%)`);
                    }
                }
            }
            
            return insights;
        }

        /**
         * 生成图表数据
         */
        _generateChartData(chartConfig, data, options) {
            return {
                type: chartConfig.type,
                field: chartConfig.field,
                title: chartConfig.title,
                data: data[chartConfig.field] || [],
                options: chartConfig.options || {}
            };
        }

        /**
         * 生成摘要
         */
        _generateSummary(sections) {
            const totalMetrics = sections.reduce((sum, s) => sum + Object.keys(s.metrics).length, 0);
            const totalInsights = sections.reduce((sum, s) => sum + s.insights.length, 0);
            
            return {
                totalSections: sections.length,
                totalMetrics,
                totalInsights,
                keyFindings: sections.flatMap(s => s.insights).slice(0, 5),
                generatedAt: Date.now()
            };
        }

        /**
         * 获取报表
         */
        getReport(reportId) {
            return this.reports.get(reportId);
        }

        /**
         * 获取所有报表
         */
        getAllReports() {
            return Array.from(this.reports.values());
        }

        /**
         * 删除报表
         */
        deleteReport(reportId) {
            return this.reports.delete(reportId);
        }
    }

    // ============================================
    // 报表导出器
    // ============================================
    class ReportExporter {
        constructor() {
            this.supportedFormats = Object.values(ExportFormat);
        }

        /**
         * 导出报表
         * @param {Object} report - 报表对象
         * @param {string} format - 导出格式
         * @returns {string|Blob} 导出内容
         */
        export(report, format = ExportFormat.JSON) {
            if (!this.supportedFormats.includes(format)) {
                throw new Error(`不支持的导出格式: ${format}`);
            }
            
            switch (format) {
                case ExportFormat.JSON:
                    return this._exportJSON(report);
                case ExportFormat.CSV:
                    return this._exportCSV(report);
                case ExportFormat.HTML:
                    return this._exportHTML(report);
                default:
                    return this._exportJSON(report);
            }
        }

        /**
         * 导出为JSON
         */
        _exportJSON(report) {
            return JSON.stringify(report, null, 2);
        }

        /**
         * 导出为CSV
         */
        _exportCSV(report) {
            const rows = [];
            
            // 表头
            rows.push(['报表名称', report.name]);
            rows.push(['生成时间', new Date(report.generatedAt).toISOString()]);
            rows.push([]);
            
            // 各部分数据
            for (const section of report.sections) {
                rows.push([`=== ${section.name} ===`]);
                rows.push(['指标', '值']);
                for (const [metric, data] of Object.entries(section.metrics)) {
                    rows.push([data.label, data.value]);
                }
                rows.push([]);
            }
            
            return rows.map(row => row.join(',')).join('\n');
        }

        /**
         * 导出为HTML
         */
        _exportHTML(report) {
            return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .report-header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .report-header h1 { margin: 0 0 10px 0; }
        .report-meta { opacity: 0.9; font-size: 14px; }
        .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .section h2 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-top: 0; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .metric-card { background: #f8fafc; border-radius: 8px; padding: 16px; }
        .metric-label { color: #64748b; font-size: 12px; margin-bottom: 4px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .insight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-top: 16px; border-radius: 0 8px 8px 0; }
        .chart-placeholder { background: #f1f5f9; height: 300px; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #64748b; }
    </style>
</head>
<body>
    <div class="report-header">
        <h1>${report.name}</h1>
        <div class="report-meta">
            <div>生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}</div>
            <div>报表类型: ${report.type}</div>
        </div>
    </div>
    ${report.sections.map(section => `
    <div class="section">
        <h2>${section.name}</h2>
        <div class="metrics-grid">
            ${Object.entries(section.metrics).map(([key, data]) => `
            <div class="metric-card">
                <div class="metric-label">${data.label}</div>
                <div class="metric-value">${data.value}</div>
            </div>
            `).join('')}
        </div>
        ${section.insights.length > 0 ? `
        <div class="insight">
            <strong>洞察:</strong> ${section.insights.join('; ')}
        </div>
        ` : ''}
    </div>
    `).join('')}
    ${report.charts.length > 0 ? `
    <div class="section">
        <h2>图表</h2>
        <div class="chart-placeholder">图表区域 (${report.charts.length} 个图表)</div>
    </div>
    ` : ''}
</body>
</html>`;
        }

        /**
         * 下载报表
         * @param {Object} report - 报表对象
         * @param {string} format - 导出格式
         * @param {string} filename - 文件名
         */
        download(report, format = ExportFormat.JSON, filename) {
            const content = this.export(report, format);
            const mimeType = format === ExportFormat.HTML ? 'text/html' : 
                            format === ExportFormat.CSV ? 'text/csv' : 'application/json';
            
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `${report.name}_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // ============================================
    // BI报表系统管理器
    // ============================================
    class BIReportingSystem {
        constructor(options = {}) {
            this.aggregator = new DataAggregator();
            this.chartGenerator = new ChartGenerator(options.containerId, options.chartOptions);
            this.reportGenerator = new ReportGenerator();
            this.reportExporter = new ReportExporter();
            
            this.config = {
                autoSave: options.autoSave !== false,
                defaultFormat: options.defaultFormat || ExportFormat.JSON,
                ...options
            };
            
            this.scheduledReports = new Map();
        }

        /**
         * 创建数据分析报表
         * @param {string} reportType - 报表类型
         * @param {Object} data - 数据
         * @param {Object} options - 选项
         */
        createReport(reportType, data, options = {}) {
            // 预处理数据
            const processedData = this._preprocessData(data, options);
            
            // 生成报表
            const report = this.reportGenerator.generateReport(reportType, processedData, options);
            
            return report;
        }

        /**
         * 预处理数据
         */
        _preprocessData(data, options) {
            const processed = { ...data };
            
            // 执行聚合计算
            if (options.aggregations) {
                for (const [field, config] of Object.entries(options.aggregations)) {
                    if (data.rawData) {
                        processed[field] = this.aggregator.aggregate(
                            data.rawData, 
                            config.field, 
                            config.type, 
                            config.options
                        );
                    }
                }
            }
            
            // 执行分组聚合
            if (options.groupByAggregations) {
                for (const [resultField, config] of Object.entries(options.groupByAggregations)) {
                    if (data.rawData) {
                        processed[resultField] = this.aggregator.groupBy(
                            data.rawData,
                            config.groupBy,
                            config.aggregations
                        );
                    }
                }
            }
            
            return processed;
        }

        /**
         * 添加图表
         * @param {string} chartId - 图表ID
         * @param {string} chartType - 图表类型
         * @param {Object} config - 图表配置
         */
        addChart(chartId, chartType, config) {
            const createMethod = {
                'line': 'createLineChart',
                'bar': 'createBarChart',
                'pie': 'createPieChart',
                'radar': 'createRadarChart',
                'gauge': 'createGaugeChart',
                'heatmap': 'createHeatmapChart'
            }[chartType];
            
            if (!createMethod || !this.chartGenerator[createMethod]) {
                throw new Error(`不支持的图表类型: ${chartType}`);
            }
            
            return this.chartGenerator[createMethod](chartId, config);
        }

        /**
         * 渲染图表
         */
        renderChart(chartId, container) {
            return this.chartGenerator.render(chartId, container);
        }

        /**
         * 导出报表
         */
        exportReport(report, format) {
            return this.reportExporter.export(report, format || this.config.defaultFormat);
        }

        /**
         * 下载报表
         */
        downloadReport(report, format, filename) {
            this.reportExporter.download(report, format || this.config.defaultFormat, filename);
        }

        /**
         * 调度报表生成
         * @param {string} scheduleId - 调度ID
         * @param {Object} config - 调度配置
         */
        scheduleReport(scheduleId, config) {
            const schedule = {
                id: scheduleId,
                reportType: config.reportType,
                dataProvider: config.dataProvider,
                interval: config.interval,
                format: config.format || this.config.defaultFormat,
                recipients: config.recipients || [],
                lastRun: null,
                nextRun: this._calculateNextRun(config.interval),
                active: true
            };
            
            this.scheduledReports.set(scheduleId, schedule);
            return schedule;
        }

        /**
         * 计算下次运行时间
         */
        _calculateNextRun(interval) {
            const now = Date.now();
            switch (interval) {
                case 'hourly': return now + 3600000;
                case 'daily': return now + 86400000;
                case 'weekly': return now + 604800000;
                case 'monthly': return now + 2592000000;
                default: return now + 86400000;
            }
        }

        /**
         * 获取所有调度报表
         */
        getScheduledReports() {
            return Array.from(this.scheduledReports.values());
        }

        /**
         * 取消调度报表
         */
        cancelScheduledReport(scheduleId) {
            const schedule = this.scheduledReports.get(scheduleId);
            if (schedule) {
                schedule.active = false;
                return true;
            }
            return false;
        }

        /**
         * 聚合数据
         */
        aggregateData(data, field, aggregationType, options) {
            return this.aggregator.aggregate(data, field, aggregationType, options);
        }

        /**
         * 分组聚合
         */
        groupByAggregate(data, groupBy, aggregations) {
            return this.aggregator.groupBy(data, groupBy, aggregations);
        }

        /**
         * 时间窗口聚合
         */
        timeWindowAggregate(data, timestampField, windowSize, aggregations) {
            return this.aggregator.timeWindowAggregate(data, timestampField, windowSize, aggregations);
        }
    }

    // ============================================
    // 导出模块
    // ============================================
    const BIReportingSystem = {
        ReportType,
        ExportFormat,
        AggregationType,
        ReportTemplates,
        DataAggregator,
        ChartGenerator,
        ReportGenerator,
        ReportExporter,
        BIReportingSystemManager: BIReportingSystem,
        
        // 便捷创建方法
        create: (options) => new BIReportingSystem(options),
        createAggregator: () => new DataAggregator(),
        createChartGenerator: (containerId, options) => new ChartGenerator(containerId, options),
        createReportGenerator: () => new ReportGenerator(),
        createExporter: () => new ReportExporter()
    };

    // UMD导出
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BIReportingSystem;
    } else if (typeof define === 'function' && define.amd) {
        define([], function() { return BIReportingSystem; });
    } else {
        global.BIReportingSystem = BIReportingSystem;
    }

})(typeof window !== 'undefined' ? window : this);

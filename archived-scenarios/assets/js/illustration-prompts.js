/**
 * 插图提示词模板库
 * Illustration Prompt Templates for AI Generation
 *
 * 为每个认知偏误场景提供结构化的 AI 生成提示词
 * 支持不同上下文（卡片、反馈、觉醒时刻）和风格变体
 */

(function(global) {
    'use strict';

    // ==================== 基础提示词模板 ====================

    const BASE_TEMPLATE = `生成一个认知偏误训练场景的 SVG 插图。

场景: {scenario_name}
场景描述: {scenario_description}
认知偏误: {cognitive_bias}
上下文: {context}

设计要求:
- 尺寸: {width}x{height}
- 配色: primary=#2563eb, accent=#fbbf24, danger=#ef4444, success=#10b981, bg=#eff6ff
- 风格: 教育性、清晰、专业，避免过度装饰
- 不要包含任何文字标签
- 只输出 SVG，外层 <svg>
- 主题: {theme}

视觉元素要求:
{visual_elements}`;

    // ==================== 场景提示词配置 ====================

    const SCENARIO_PROMPTS = {

        'coffee-shop-nonlinear-effects': {
            name: '咖啡店非线性效应',
            description: '在咖啡店管理中体验非线性效应和指数增长',
            bias: '线性思维 (Linear Thinking)',
            visualElements: `
- 咖啡杯 + 上升曲线图（指数增长）
- 蒸汽/烟雾效果
- 增长箭头/指示器
- 避免: 具体的咖啡豆或复杂的人物`
        },

        'investment-confirmation-bias': {
            name: '投资确认偏误',
            description: '在投资决策中体验选择性过滤信息',
            bias: '确认偏误 (Confirmation Bias)',
            visualElements: `
- 过滤器/筛子（选择性接收信息）
- 放大镜（聚焦符合预期的信息）
- ✓ 和 ✗ 符号区分接受/拒绝的信息
- 避免: 具体的股票代码或图表`
        },

        'relationship-time-delay': {
            name: '恋爱关系时间延迟',
            description: '体验决策效果滞后显现的时间延迟效应',
            bias: '即时满足偏好 (Present Bias)',
            visualElements: `
- 两个人物剪影（代表关系双方）
- 时钟或沙漏（延迟效果）
- 波浪线/连接线（时间延迟的因果关系）
- 避免: 具体的人物形象或场景`
        },

        'business-strategy-game': {
            name: '商业战略推理',
            description: '在复杂商业环境中进行系统性决策',
            bias: '过度自信 (Overconfidence)',
            visualElements: `
- 摩天楼/商业建筑群
- 分支决策树或十字路口
- 箭头指向多个方向（多条战略路径）
- 避免: 具体的公司标志或品牌`
        },

        'public-policy-simulation': {
            name: '公共政策制定',
            description: '平衡多方利益进行政策决策',
            bias: '短期导向 (Short-term Orientation)',
            visualElements: `
- 投票箱或民意调查图标
- 天平（利益平衡）
- 多个人形图标（代表不同群体）
- 避免: 具体的政策文本或政治符号`
        },

        'investment-info-processing': {
            name: '投资信息处理',
            description: '在信息过载中做出数据驱动的投资决策',
            bias: '信息过载 (Information Overload)',
            visualElements: `
- 大脑或CPU处理器
- 多条数据流汇入
- 分支决策流程
- 避免: 具体的K线或股票代码`
        },

        'climate-change-scenario': {
            name: '气候变化应对',
            description: '体验复杂系统中的蝴蝶效应',
            bias: '系统盲区 (System Blindness)',
            visualElements: `
- 地球/全球视图
- 温度计或热量上升指示
- 连锁反应箭头
- 避免: 具体的国家边界或政治内容`
        },

        'financial-crisis-scenario': {
            name: '金融危机应对',
            description: '识别系统性风险和连锁反应',
            bias: '风险低估 (Risk Underestimation)',
            visualElements: `
- 股市K线图（下跌趋势）
- 警告三角形/感叹号
- 断开的链条或崩溃的积木
- 避免: 具体的金融术语或机构名称`
        },

        'ai-governance-scenario': {
            name: 'AI治理决策',
            description: '平衡AI效率与安全性',
            bias: '效率偏向 (Efficiency Bias)',
            visualElements: `
- AI芯片/神经网络
- 天平（效率 vs 安全）
- 盾牌/锁图标（安全保护）
- 避免: 具体的AI公司标志`
        },

        'personal-finance-scenario': {
            name: '个人理财规划',
            description: '理解复利思维和长期财务规划',
            bias: '短期冲动 (Short-term Impulsivity)',
            visualElements: `
- 钱包/储蓄罐 + 硬币
- 饼图或环形图（预算分配）
- 增长曲线或阶梯上升
- 避免: 具体金额或货币符号`
        },

        'social-media-echo-chamber': {
            name: '社交媒体回音壁',
            description: '体验信息茧房和确认偏误放大',
            bias: '群体极化 (Group Polarization)',
            visualElements: `
- 手机 + 社交媒体通知
- 同心圆（回音壁效果）
- 反射/共鸣波纹
- 避免: 具体的社交平台标志`
        },

        'cognitive-diagnosis': {
            name: '认知偏误诊断',
            description: '全面诊断个人认知偏误模式',
            bias: '多重偏误 (Multiple Biases)',
            visualElements: `
- 放大镜 + 大脑
- 诊断报告/图表
- 多色标记点（识别不同偏误）
- 避免: 具体的医学术语`
        },

        'advanced-compound-scenarios': {
            name: '复合认知场景',
            description: '体验多重偏误的叠加效应',
            bias: '复合偏误 (Compound Biases)',
            visualElements: `
- 多个互锁的齿轮
- 连锁反应箭头
- 复杂网络节点
- 避免: 具体的场景细节`
        }
    };

    // ==================== 上下文特定变体 ====================

    const CONTEXT_VARIANTS = {

        card: {
            description: '场景选择卡片中的插图',
            width: 320,
            height: 180,
            visualEmphasis: '整体氛围、场景识别度',
            style: 'full-illustration'
        },

        feedback: {
            description: '决策反馈页面中的插图',
            width: 280,
            height: 160,
            visualEmphasis: '决策结果可视化、因果关系',
            style: 'result-focused'
        },

        awakening: {
            description: '觉醒时刻的插图（顿悟效果）',
            width: 240,
            height: 140,
            visualEmphasis: '思维转变、对比冲击',
            style: 'impact-focused'
        },

        thumbnail: {
            description: '场景缩略图标',
            width: 120,
            height: 80,
            visualEmphasis: '简洁、符号化、一眼识别',
            style: 'iconic'
        }
    };

    // ==================== 风格变体 ====================

    const STYLE_VARIANTS = {
        light: {
            background: '#eff6ff',
            foreground: '#2563eb',
            accent: '#fbbf24',
            contrast: 'low'
        },

        dark: {
            background: '#0f172a',
            foreground: '#e2e8f0',
            accent: '#fbbf24',
            contrast: 'high'
        },

        warm: {
            background: '#fff7ed',
            foreground: '#c2410c',
            accent: '#ea580c',
            contrast: 'medium'
        },

        professional: {
            background: '#f8fafc',
            foreground: '#1e293b',
            accent: '#3b82f6',
            contrast: 'medium'
        }
    };

    // ==================== 提示词生成器 ====================

    /**
     * 生成完整提示词
     * @param {string} scenarioId - 场景ID
     * @param {string} context - 上下文类型
     * @param {string} style - 风格变体 ('light'|'dark'|'warm'|'professional')
     * @returns {string} 完整的AI生成提示词
     */
    function generatePrompt(scenarioId, context = 'card', style = 'light') {
        const scenario = SCENARIO_PROMPTS[scenarioId] || SCENARIO_PROMPTS['cognitive-diagnosis'];
        const contextConfig = CONTEXT_VARIANTS[context] || CONTEXT_VARIANTS.card;
        const styleConfig = STYLE_VARIANTS[style] || STYLE_VARIANTS.light;

        let visualElements = scenario.visualElements;

        // 根据上下文调整视觉元素
        if (context === 'awakening') {
            visualElements += '\n- 顿悟/灯泡效果（思维突破）\n- 对比元素（前后对照）';
        } else if (context === 'feedback') {
            visualElements += '\n- 结果指示器（上升/下降）\n- 因果连线';
        }

        return BASE_TEMPLATE
            .replace('{scenario_name}', scenario.name)
            .replace('{scenario_description}', scenario.description)
            .replace('{cognitive_bias}', scenario.bias)
            .replace('{context}', contextConfig.description)
            .replace('{width}', contextConfig.width)
            .replace('{height}', contextConfig.height)
            .replace('{theme}', style === 'dark' ? '深色背景' : '浅色背景')
            .replace('{visual_elements}', visualElements)
            + `\n\n配色: bg=${styleConfig.background}, fg=${styleConfig.foreground}, accent=${styleConfig.accent}`;
    }

    /**
     * 批量生成提示词
     * @param {Array} scenarioIds - 场景ID数组
     * @param {string} context - 上下文类型
     * @param {string} style - 风格变体
     * @returns {Map<string, string>} scenarioId -> prompt
     */
    function batchGeneratePrompts(scenarioIds, context = 'card', style = 'light') {
        const prompts = new Map();
        scenarioIds.forEach(id => {
            prompts.set(id, generatePrompt(id, context, style));
        });
        return prompts;
    }

    /**
     * 获取场景元数据
     * @param {string} scenarioId - 场景ID
     * @returns {object} 场景元数据
     */
    function getScenarioMeta(scenarioId) {
        return SCENARIO_PROMPTS[scenarioId] || {
            name: scenarioId,
            description: '认知训练场景',
            bias: '通用认知偏误',
            visualElements: '- 大脑/灯泡图标'
        };
    }

    // ==================== 导出 ====================

    global.IllustrationPrompts = {
        generate: generatePrompt,
        batchGenerate: batchGeneratePrompts,
        getMeta: getScenarioMeta,
        scenarios: SCENARIO_PROMPTS,
        contexts: CONTEXT_VARIANTS,
        styles: STYLE_VARIANTS,
        listScenarios: () => Object.keys(SCENARIO_PROMPTS)
    };

})(typeof global !== 'undefined' ? global : window);
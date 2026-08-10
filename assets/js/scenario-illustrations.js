/**
 * 场景 SVG 插图模板库
 * Scenario SVG Illustration Templates
 *
 * 为每个认知偏误训练场景提供内置 SVG 插图
 * 生成函数: generateScenarioSVG(scenarioId, biasType, theme)
 * theme: 'light' | 'dark' (默认 'light')
 */

(function(global) {
    'use strict';

    // ==================== SVG 工具函数 ====================

    function wrapSVG(content, viewBox = '0 0 320 180') {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#eff6ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dbeafe;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2563eb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGrad)" rx="12"/>
  ${content}
</svg>`;
    }

    // ==================== 场景插图生成器 ====================

    const ScenarioIllustrations = {

        // ===================== 1. 咖啡店 - 线性思维 / 非线性效应 ====================
        'coffee-shop-nonlinear-effects': function(theme = 'light') {
            const content = `
    <!-- 咖啡杯 + 上升曲线 -->
    <g transform="translate(20, 30)">
      <!-- 咖啡杯主体 -->
      <path d="M20,40 L20,90 Q20,110 50,110 Q80,110 80,90 L80,40 Z" fill="#8B4513" opacity="0.8"/>
      <path d="M20,40 L20,85 Q20,105 50,105 Q80,105 80,85 L80,40 Z" fill="#D2691E"/>
      <!-- 咖啡液面 -->
      <ellipse cx="50" cy="40" rx="30" ry="8" fill="#5D4037"/>
      <!-- 蒸汽 -->
      <path d="M35,30 Q30,20 35,10" stroke="#93c5fd" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M50,25 Q55,15 50,5" stroke="#93c5fd" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M65,30 Q60,20 65,10" stroke="#93c5fd" stroke-width="2" fill="none" opacity="0.6"/>
    </g>
    <!-- 非线性增长曲线 -->
    <g transform="translate(140, 20)">
      <polyline points="0,140 40,130 80,100 100,50 120,10" stroke="#2563eb" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="80" cy="100" r="4" fill="#2563eb"/>
      <circle cx="100" cy="50" r="5" fill="#3b82f6"/>
      <circle cx="120" cy="10" r="6" fill="#1d4ed8"/>
      <!-- 小箭头 -->
      <path d="M115,15 L125,5 L120,12" stroke="#2563eb" stroke-width="2" fill="none"/>
      <!-- Y轴标签 -->
      <text x="-5" y="70" font-size="10" fill="#2563eb" text-anchor="end">非线性!</text>
    </g>
    <!-- 标题 -->
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">非线性效应 · 指数增长</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 2. 投资 - 确认偏误 ====================
        'investment-confirmation-bias': function(theme = 'light') {
            const content = `
    <!-- 过滤器/筛子 -->
    <g transform="translate(30, 20)">
      <path d="M10,20 L90,20 L80,90 L20,90 Z" fill="#93c5fd" opacity="0.3" stroke="#2563eb" stroke-width="2"/>
      <line x1="10" y1="20" x2="90" y2="20" stroke="#2563eb" stroke-width="3"/>
      <!-- 漏下的金币（被过滤） -->
      <circle cx="30" cy="60" r="6" fill="#ef4444" opacity="0.5"/>
      <circle cx="50" cy="75" r="6" fill="#ef4444" opacity="0.5"/>
      <circle cx="70" cy="70" r="6" fill="#ef4444" opacity="0.5"/>
      <!-- 保留的金币（符合预期的） -->
      <circle cx="55" cy="35" r="8" fill="#fbbf24"/>
      <circle cx="55" cy="35" r="5" fill="#f59e0b"/>
    </g>
    <!-- 放大镜（确认偏误） -->
    <g transform="translate(180, 30)">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" stroke-width="4"/>
      <circle cx="50" cy="50" r="36" fill="#eff6ff" opacity="0.3"/>
      <line x1="80" y1="80" x2="110" y2="110" stroke="#2563eb" stroke-width="6" stroke-linecap="round"/>
      <!-- 镜中的✓ -->
      <text x="50" y="56" font-size="28" fill="#2563eb" text-anchor="middle">✓</text>
    </g>
    <!-- 标签 -->
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">确认偏误 · 选择性过滤信息</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 3. 关系时间延迟 ====================
        'relationship-time-delay': function(theme = 'light') {
            const content = `
    <!-- 两个人物剪影 -->
    <g transform="translate(20, 30)">
      <!-- 人物A -->
      <circle cx="40" cy="30" r="15" fill="#2563eb" opacity="0.8"/>
      <rect x="28" y="48" width="24" height="35" rx="8" fill="#2563eb" opacity="0.8"/>
      <!-- 人物B -->
      <circle cx="100" cy="30" r="15" fill="#7c3aed" opacity="0.8"/>
      <rect x="88" y="48" width="24" height="35" rx="8" fill="#7c3aed" opacity="0.8"/>
      <!-- 关系线（波浪/延迟） -->
      <path d="M62,40 Q85,20 95,40" stroke="#2563eb" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
      <path d="M62,50 Q85,30 95,50" stroke="#7c3aed" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
    </g>
    <!-- 时钟（延迟效果） -->
    <g transform="translate(170, 25)">
      <circle cx="50" cy="50" r="45" fill="#f8fafc" stroke="#2563eb" stroke-width="3"/>
      <circle cx="50" cy="50" r="3" fill="#2563eb"/>
      <!-- 时针 -->
      <line x1="50" y1="50" x2="50" y2="25" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
      <!-- 分针 -->
      <line x1="50" y1="50" x2="72" y2="62" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
      <!-- 时间标记 -->
      <text x="50" y="18" font-size="10" fill="#2563eb" text-anchor="middle">12</text>
      <text x="88" y="54" font-size="10" fill="#2563eb" text-anchor="middle">3</text>
      <text x="50" y="92" font-size="10" fill="#2563eb" text-anchor="middle">6</text>
      <text x="12" y="54" font-size="10" fill="#2563eb" text-anchor="middle">9</text>
      <!-- 延迟箭头 -->
      <path d="M25,75 Q10,85 15,105" stroke="#ef4444" stroke-width="2" fill="none" marker-end="url(#arrowRed)"/>
      <text x="8" y="120" font-size="10" fill="#ef4444">延迟!</text>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">时间延迟 · 决策效果滞后显现</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 4. 商业战略 ====================
        'business-strategy-game': function(theme = 'light') {
            const content = `
    <!-- 商业建筑/摩天楼群 -->
    <g transform="translate(20, 25)">
      <rect x="10" y="60" width="35" height="80" fill="#1e40af" opacity="0.7" rx="2"/>
      <rect x="50" y="30" width="40" height="110" fill="#2563eb" opacity="0.8" rx="2"/>
      <rect x="95" y="50" width="30" height="90" fill="#3b82f6" opacity="0.6" rx="2"/>
      <!-- 窗户 -->
      <rect x="18" y="70" width="6" height="6" fill="#fbbf24" opacity="0.8"/>
      <rect x="28" y="70" width="6" height="6" fill="#fbbf24" opacity="0.8"/>
      <rect x="18" y="82" width="6" height="6" fill="#fbbf24" opacity="0.6"/>
      <rect x="28" y="82" width="6" height="6" fill="#fbbf24" opacity="0.6"/>
      <rect x="18" y="94" width="6" height="6" fill="#fbbf24" opacity="0.8"/>
      <rect x="28" y="94" width="6" height="6" fill="#fbbf24" opacity="0.6"/>
      <rect x="58" y="40" width="8" height="8" fill="#fbbf24" opacity="0.7"/>
      <rect x="72" y="40" width="8" height="8" fill="#fbbf24" opacity="0.7"/>
      <rect x="58" y="55" width="8" height="8" fill="#fbbf24" opacity="0.8"/>
      <rect x="72" y="55" width="8" height="8" fill="#fbbf24" opacity="0.6"/>
      <rect x="58" y="70" width="8" height="8" fill="#fbbf24" opacity="0.7"/>
    </g>
    <!-- 箭头/决策 -->
    <g transform="translate(180, 30)">
      <path d="M20,80 L60,80 L50,60 M60,80 L50,100" stroke="#2563eb" stroke-width="4" fill="none" stroke-linecap="round"/>
      <!-- 分支决策 -->
      <circle cx="100" cy="50" r="15" fill="#3b82f6" opacity="0.8"/>
      <text x="100" y="55" font-size="14" fill="white" text-anchor="middle" font-weight="bold">!</text>
      <path d="M115,50 L150,30" stroke="#2563eb" stroke-width="3" fill="none"/>
      <path d="M115,50 L150,70" stroke="#2563eb" stroke-width="3" fill="none"/>
      <text x="155" y="28" font-size="10" fill="#2563eb">扩张</text>
      <text x="155" y="75" font-size="10" fill="#2563eb">收缩</text>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">商业战略 · 系统性决策思维</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 5. 公共政策 ====================
        'public-policy-simulation': function(theme = 'light') {
            const content = `
    <!-- 投票箱 -->
    <g transform="translate(30, 20)">
      <rect x="20" y="60" width="60" height="50" fill="#1e40af" rx="4"/>
      <rect x="15" y="50" width="70" height="15" fill="#3b82f6" rx="3"/>
      <!-- 插槽 -->
      <rect x="35" y="53" width="30" height="4" fill="#1e3a8a" rx="1"/>
      <!-- 票 -->
      <rect x="40" y="25" width="20" height="12" fill="#f8fafc" rx="1"/>
      <rect x="42" y="27" width="10" height="2" fill="#93c5fd"/>
      <!-- 手（投） -->
      <path d="M70,10 L75,35 L65,35 Z" fill="#fbbf24" opacity="0.8"/>
    </g>
    <!-- 天平（平衡利益） -->
    <g transform="translate(160, 25)">
      <line x1="80" y1="20" x2="80" y2="100" stroke="#2563eb" stroke-width="3"/>
      <line x1="30" y1="40" x2="130" y2="40" stroke="#2563eb" stroke-width="3"/>
      <!-- 左盘 -->
      <line x1="30" y1="40" x2="30" y2="55" stroke="#2563eb" stroke-width="2"/>
      <ellipse cx="30" cy="65" rx="20" ry="8" fill="#ef4444" opacity="0.7"/>
      <!-- 右盘 -->
      <line x1="130" y1="40" x2="130" y2="55" stroke="#2563eb" stroke-width="2"/>
      <ellipse cx="130" cy="55" rx="20" ry="8" fill="#10b981" opacity="0.7"/>
      <!-- 平衡点 -->
      <circle cx="80" cy="20" r="6" fill="#2563eb"/>
      <!-- 标签 -->
      <text x="30" y="80" font-size="9" fill="#ef4444" text-anchor="middle">成本</text>
      <text x="130" y="80" font-size="9" fill="#10b981" text-anchor="middle">收益</text>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">公共政策 · 利益平衡与长远规划</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 6. 投资信息处理 ====================
        'investment-info-processing': function(theme = 'light') {
            const content = `
    <!-- 数据流/信息处理 -->
    <g transform="translate(20, 20)">
      <!-- 数据块 -->
      <rect x="0" y="30" width="40" height="25" fill="#ef4444" opacity="0.7" rx="4"/>
      <text x="20" y="47" font-size="9" fill="white" text-anchor="middle">数据A</text>
      <rect x="0" y="65" width="40" height="25" fill="#fbbf24" opacity="0.8" rx="4"/>
      <text x="20" y="82" font-size="9" fill="#1e3a8a" text-anchor="middle">数据B</text>
      <rect x="0" y="100" width="40" height="25" fill="#10b981" opacity="0.7" rx="4"/>
      <text x="20" y="117" font-size="9" fill="white" text-anchor="middle">数据C</text>
      <!-- 箭头到处理器 -->
      <path d="M42,42 L70,55" stroke="#2563eb" stroke-width="2" fill="none"/>
      <path d="M42,77 L70,77" stroke="#2563eb" stroke-width="2" fill="none"/>
      <path d="M42,112 L70,99" stroke="#2563eb" stroke-width="2" fill="none"/>
    </g>
    <!-- 大脑/处理器 -->
    <g transform="translate(130, 30)">
      <ellipse cx="50" cy="50" rx="45" ry="40" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
      <path d="M25,50 Q50,20 75,50 Q50,80 25,50" fill="#93c5fd" opacity="0.5"/>
      <!-- 神经节点 -->
      <circle cx="35" cy="35" r="4" fill="#2563eb"/>
      <circle cx="65" cy="35" r="4" fill="#2563eb"/>
      <circle cx="50" cy="50" r="5" fill="#2563eb"/>
      <circle cx="35" cy="65" r="4" fill="#2563eb"/>
      <circle cx="65" cy="65" r="4" fill="#2563eb"/>
      <!-- 连接线 -->
      <line x1="35" y1="35" x2="50" y2="50" stroke="#2563eb" stroke-width="1"/>
      <line x1="65" y1="35" x2="50" y2="50" stroke="#2563eb" stroke-width="1"/>
      <line x1="35" y1="65" x2="50" y2="50" stroke="#2563eb" stroke-width="1"/>
      <line x1="65" y1="65" x2="50" y2="50" stroke="#2563eb" stroke-width="1"/>
    </g>
    <!-- 输出 -->
    <g transform="translate(230, 45)">
      <rect x="0" y="0" width="55" height="30" fill="#2563eb" rx="4"/>
      <text x="27" y="20" font-size="11" fill="white" text-anchor="middle" font-weight="600">决策</text>
      <path d="M-10,15 L5,15" stroke="#2563eb" stroke-width="2"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">信息处理 · 数据驱动的投资决策</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 7. 气候变化 ====================
        'climate-change-scenario': function(theme = 'light') {
            const content = `
    <!-- 地球 -->
    <g transform="translate(30, 15)">
      <circle cx="60" cy="70" r="55" fill="#1e3a8a"/>
      <circle cx="60" cy="70" r="52" fill="#2563eb"/>
      <!-- 大陆 -->
      <ellipse cx="45" cy="55" rx="20" ry="15" fill="#10b981" opacity="0.8"/>
      <ellipse cx="75" cy="80" rx="15" ry="20" fill="#10b981" opacity="0.8"/>
      <ellipse cx="55" cy="90" rx="25" ry="10" fill="#10b981" opacity="0.7"/>
      <!-- 温度升高 -->
      <path d="M60,5 L65,25 L55,25 Z" fill="#ef4444" opacity="0.8"/>
      <text x="60" y="0" font-size="10" fill="#ef4444" text-anchor="middle">+2°C</text>
    </g>
    <!-- 图表（碳排放） -->
    <g transform="translate(170, 30)">
      <line x1="20" y1="120" x2="130" y2="120" stroke="#94a3b8" stroke-width="2"/>
      <line x1="20" y1="120" x2="20" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <!-- 上升柱状图 -->
      <rect x="25" y="100" width="15" height="20" fill="#ef4444" opacity="0.6"/>
      <rect x="45" y="80" width="15" height="40" fill="#ef4444" opacity="0.7"/>
      <rect x="65" y="60" width="15" height="60" fill="#ef4444" opacity="0.8"/>
      <rect x="85" y="35" width="15" height="85" fill="#ef4444" opacity="0.9"/>
      <!-- 趋势线 -->
      <polyline points="25,100 45,80 65,60 85,35" stroke="#ef4444" stroke-width="2" fill="none"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">气候变化 · 复杂系统的蝴蝶效应</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 8. 金融危机 ====================
        'financial-crisis-scenario': function(theme = 'light') {
            const content = `
    <!-- 股市K线 -->
    <g transform="translate(20, 20)">
      <line x1="30" y1="120" x2="130" y2="120" stroke="#94a3b8" stroke-width="2"/>
      <line x1="30" y1="120" x2="30" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <!-- 下跌K线 -->
      <rect x="35" y="30" width="15" height="50" fill="#ef4444" opacity="0.8"/>
      <line x1="35" y1="15" x2="50" y2="30" stroke="#ef4444" stroke-width="1"/>
      <line x1="35" y1="80" x2="50" y2="100" stroke="#ef4444" stroke-width="1"/>
      <rect x="55" y="20" width="15" height="40" fill="#ef4444" opacity="0.7"/>
      <line x1="55" y1="5" x2="70" y2="20" stroke="#ef4444" stroke-width="1"/>
      <line x1="55" y1="60" x2="70" y2="75" stroke="#ef4444" stroke-width="1"/>
      <rect x="75" y="10" width="15" height="30" fill="#ef4444" opacity="0.9"/>
      <line x1="75" y1="0" x2="90" y2="10" stroke="#ef4444" stroke-width="1"/>
      <line x1="75" y1="40" x2="90" y2="55" stroke="#ef4444" stroke-width="1"/>
      <rect x="95" y="5" width="15" height="20" fill="#ef4444" opacity="0.6"/>
      <line x1="95" y1="-5" x2="110" y2="5" stroke="#ef4444" stroke-width="1"/>
      <line x1="95" y1="25" x2="110" y2="40" stroke="#ef4444" stroke-width="1"/>
    </g>
    <!-- 警告图标 -->
    <g transform="translate(170, 30)">
      <polygon points="50,10 95,90 5,90" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
      <text x="50" y="75" font-size="40" fill="#1e3a8a" text-anchor="middle" font-weight="bold">!</text>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">金融危机 · 系统性风险与连锁反应</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 9. AI治理 ====================
        'ai-governance-scenario': function(theme = 'light') {
            const content = `
    <!-- AI芯片/大脑 -->
    <g transform="translate(30, 15)">
      <rect x="20" y="30" width="80" height="80" fill="#1e3a8a" rx="8"/>
      <rect x="28" y="38" width="64" height="64" fill="#2563eb" rx="4"/>
      <!-- 电路图案 -->
      <line x1="40" y1="50" x2="40" y2="90" stroke="#93c5fd" stroke-width="2"/>
      <line x1="40" y1="50" x2="60" y2="50" stroke="#93c5fd" stroke-width="2"/>
      <line x1="60" y1="50" x2="60" y2="70" stroke="#93c5fd" stroke-width="2"/>
      <line x1="60" y1="70" x2="80" y2="70" stroke="#93c5fd" stroke-width="2"/>
      <circle cx="40" cy="50" r="4" fill="#fbbf24"/>
      <circle cx="60" cy="50" r="4" fill="#fbbf24"/>
      <circle cx="60" cy="70" r="4" fill="#fbbf24"/>
      <circle cx="80" cy="70" r="4" fill="#10b981"/>
      <!-- 眼睛/传感器 -->
      <circle cx="60" cy="85" r="8" fill="#ef4444"/>
      <circle cx="60" cy="85" r="4" fill="#1e3a8a"/>
    </g>
    <!-- 天平（AI治理平衡） -->
    <g transform="translate(170, 20)">
      <line x1="80" y1="15" x2="80" y2="90" stroke="#2563eb" stroke-width="3"/>
      <line x1="25" y1="35" x2="135" y2="35" stroke="#2563eb" stroke-width="3"/>
      <!-- 效率盘 -->
      <line x1="25" y1="35" x2="25" y2="50" stroke="#2563eb" stroke-width="2"/>
      <ellipse cx="25" cy="60" rx="18" ry="7" fill="#3b82f6" opacity="0.8"/>
      <text x="25" y="75" font-size="9" fill="#2563eb" text-anchor="middle">效率↑</text>
      <!-- 安全盘 -->
      <line x1="135" y1="35" x2="135" y2="50" stroke="#2563eb" stroke-width="2"/>
      <ellipse cx="135" cy="60" rx="18" ry="7" fill="#ef4444" opacity="0.8"/>
      <text x="135" y="75" font-size="9" fill="#ef4444" text-anchor="middle">安全↑</text>
      <circle cx="80" cy="15" r="5" fill="#2563eb"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">AI治理 · 效率与安全的平衡艺术</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 10. 个人理财 ====================
        'personal-finance-scenario': function(theme = 'light') {
            const content = `
    <!-- 钱包/储蓄罐 -->
    <g transform="translate(30, 25)">
      <rect x="10" y="30" width="70" height="55" fill="#1e40af" rx="6"/>
      <rect x="5" y="22" width="80" height="15" fill="#2563eb" rx="4"/>
      <!-- 硬币入口 -->
      <ellipse cx="45" cy="22" rx="12" ry="5" fill="#1e3a8a"/>
      <!-- 硬币 -->
      <circle cx="35" cy="55" r="10" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
      <text x="35" y="59" font-size="10" fill="#1e3a8a" text-anchor="middle">$</text>
      <circle cx="55" cy="70" r="10" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
      <text x="55" y="74" font-size="10" fill="#1e3a8a" text-anchor="middle">$</text>
      <!-- 增长箭头 -->
      <path d="M75,15 L90,5 L88,18" stroke="#10b981" stroke-width="2" fill="none"/>
    </g>
    <!-- 预算图表 -->
    <g transform="translate(175, 30)">
      <circle cx="55" cy="60" r="50" fill="#f8fafc" stroke="#2563eb" stroke-width="2"/>
      <!-- 扇形 -->
      <path d="M55,60 L55,10 A50,50 0 0,1 100,40 Z" fill="#3b82f6" opacity="0.7"/>
      <path d="M55,60 L100,40 A50,50 0 0,1 90,95 Z" fill="#10b981" opacity="0.7"/>
      <path d="M55,60 L90,95 A50,50 0 0,1 20,90 Z" fill="#fbbf24" opacity="0.7"/>
      <path d="M55,60 L20,90 A50,50 0 0,1 15,40 Z" fill="#ef4444" opacity="0.7"/>
      <path d="M55,60 L15,40 A50,50 0 0,1 55,10 Z" fill="#8b5cf6" opacity="0.7"/>
      <!-- 中心 -->
      <circle cx="55" cy="60" r="20" fill="#f8fafc"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">个人理财 · 复利思维与长期规划</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 11. 社交媒体回音壁 ====================
        'social-media-echo-chamber': function(theme = 'light') {
            const content = `
    <!-- 手机 + 社交网络 -->
    <g transform="translate(20, 15)">
      <!-- 手机 -->
      <rect x="10" y="20" width="45" height="80" fill="#1e3a8a" rx="6"/>
      <rect x="14" y="28" width="37" height="60" fill="#0f172a"/>
      <!-- 屏幕内容 -->
      <circle cx="32" cy="45" r="12" fill="#3b82f6"/>
      <rect x="22" y="62" width="20" height="3" fill="#93c5fd"/>
      <rect x="22" y="68" width="15" height="3" fill="#93c5fd" opacity="0.6"/>
      <!-- 点赞 -->
      <text x="45" y="88" font-size="14" fill="#ef4444">♥</text>
    </g>
    <!-- 回音壁效果 -->
    <g transform="translate(120, 20)">
      <!-- 同心圆（回音） -->
      <circle cx="80" cy="60" r="60" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.4"/>
      <circle cx="80" cy="60" r="45" fill="none" stroke="#3b82f6" stroke-width="3" opacity="0.5"/>
      <circle cx="80" cy="60" r="30" fill="none" stroke="#3b82f6" stroke-width="4" opacity="0.7"/>
      <circle cx="80" cy="60" r="15" fill="#2563eb" opacity="0.9"/>
      <!-- 消息符号 -->
      <text x="80" y="65" font-size="16" fill="white" text-anchor="middle">@</text>
      <!-- 反馈箭头 -->
      <path d="M25,90 Q5,60 25,30" stroke="#ef4444" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
      <path d="M135,30 Q155,60 135,90" stroke="#ef4444" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">社交媒体 · 回音壁效应与信息茧房</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 12. 默认/通用场景 ====================
        'default': function(theme = 'light') {
            const content = `
    <!-- 大脑图标 -->
    <g transform="translate(20, 20)">
      <ellipse cx="70" cy="65" rx="55" ry="45" fill="#dbeafe" stroke="#2563eb" stroke-width="3"/>
      <!-- 脑叶 -->
      <path d="M30,65 Q70,20 110,65" fill="#93c5fd" opacity="0.5" stroke="#2563eb" stroke-width="2"/>
      <path d="M30,65 Q70,110 110,65" fill="#93c5fd" opacity="0.5" stroke="#2563eb" stroke-width="2"/>
      <!-- 神经连接 -->
      <circle cx="50" cy="50" r="5" fill="#2563eb"/>
      <circle cx="80" cy="45" r="5" fill="#2563eb"/>
      <circle cx="90" cy="70" r="5" fill="#2563eb"/>
      <circle cx="65" cy="80" r="5" fill="#2563eb"/>
      <line x1="50" y1="50" x2="80" y2="45" stroke="#2563eb" stroke-width="1.5"/>
      <line x1="80" y1="45" x2="90" y2="70" stroke="#2563eb" stroke-width="1.5"/>
      <line x1="65" y1="80" x2="90" y2="70" stroke="#2563eb" stroke-width="1.5"/>
      <!-- 灯泡/思考 -->
      <g transform="translate(95, 15)">
        <circle cx="20" cy="20" r="18" fill="#fbbf24" opacity="0.3"/>
        <path d="M12,20 Q20,5 28,20 Q20,35 12,20" fill="#fbbf24"/>
        <rect x="16" y="30" width="8" height="6" fill="#94a3b8" rx="1"/>
        <!-- 光芒 -->
        <line x1="20" y1="0" x2="20" y2="-5" stroke="#fbbf24" stroke-width="2"/>
        <line x1="35" y1="8" x2="38" y2="4" stroke="#fbbf24" stroke-width="2"/>
        <line x1="5" y1="8" x2="2" y2="4" stroke="#fbbf24" stroke-width="2"/>
      </g>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">认知训练 · 认知偏误诊断与矫正</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 14. 复合场景（高级）====================
        'advanced-compound-scenarios': function(theme = 'light') {
            const content = `
    <!-- 多重齿轮（复杂系统） -->
    <g transform="translate(20, 20)">
      <!-- 齿轮A -->
      <g transform="translate(50, 50)">
        <circle cx="0" cy="0" r="30" fill="#2563eb" opacity="0.8"/>
        <circle cx="0" cy="0" r="22" fill="none" stroke="#93c5fd" stroke-width="2"/>
        <!-- 齿 -->
        <rect x="-5" y="-35" width="10" height="8" fill="#2563eb" rx="1"/>
        <rect x="-5" y="27" width="10" height="8" fill="#2563eb" rx="1"/>
        <rect x="-35" y="-5" width="8" height="10" fill="#2563eb" rx="1"/>
        <rect x="27" y="-5" width="8" height="10" fill="#2563eb" rx="1"/>
        <circle cx="0" cy="0" r="5" fill="#eff6ff"/>
      </g>
      <!-- 齿轮B -->
      <g transform="translate(100, 75)">
        <circle cx="0" cy="0" r="22" fill="#3b82f6" opacity="0.8"/>
        <circle cx="0" cy="0" r="16" fill="none" stroke="#93c5fd" stroke-width="2"/>
        <rect x="-4" y="-28" width="8" height="6" fill="#3b82f6" rx="1"/>
        <rect x="-4" y="22" width="8" height="6" fill="#3b82f6" rx="1"/>
        <rect x="-28" y="-4" width="6" height="8" fill="#3b82f6" rx="1"/>
        <rect x="22" y="-4" width="6" height="8" fill="#3b82f6" rx="1"/>
        <circle cx="0" cy="0" r="4" fill="#eff6ff"/>
      </g>
      <!-- 齿轮C -->
      <g transform="translate(70, 110)">
        <circle cx="0" cy="0" r="18" fill="#60a5fa" opacity="0.8"/>
        <circle cx="0" cy="0" r="12" fill="none" stroke="#93c5fd" stroke-width="2"/>
        <rect x="-3" y="-22" width="6" height="5" fill="#60a5fa" rx="1"/>
        <rect x="-3" y="17" width="6" height="5" fill="#60a5fa" rx="1"/>
        <rect x="-22" y="-3" width="5" height="6" fill="#60a5fa" rx="1"/>
        <rect x="17" y="-3" width="5" height="6" fill="#60a5fa" rx="1"/>
        <circle cx="0" cy="0" r="3" fill="#eff6ff"/>
      </g>
    </g>
    <!-- 连接箭头 -->
    <g transform="translate(170, 40)">
      <text x="50" y="20" font-size="11" fill="#2563eb" text-anchor="middle" font-weight="600">复杂系统</text>
      <path d="M50,30 L50,50" stroke="#2563eb" stroke-width="2"/>
      <polygon points="45,45 55,45 50,55" fill="#2563eb"/>
      <text x="50" y="75" font-size="10" fill="#ef4444" text-anchor="middle">连锁反应!</text>
      <path d="M35,85 Q20,100 30,120" stroke="#ef4444" stroke-width="2" fill="none"/>
      <path d="M65,85 Q80,100 70,120" stroke="#ef4444" stroke-width="2" fill="none"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">复合认知 · 多重偏误的叠加效应</text>
  `;
            return wrapSVG(content);
        },

        // ===================== 15. 认知偏误诊断 ====================
        'cognitive-diagnosis': function(theme = 'light') {
            const content = `
    <!-- 放大镜 + 大脑 -->
    <g transform="translate(20, 15)">
      <!-- 放大镜 -->
      <circle cx="65" cy="60" r="45" fill="none" stroke="#2563eb" stroke-width="5"/>
      <circle cx="65" cy="60" r="40" fill="#eff6ff" opacity="0.3"/>
      <line x1="100" y1="90" x2="130" y2="125" stroke="#2563eb" stroke-width="8" stroke-linecap="round"/>
      <!-- 镜中大脑 -->
      <ellipse cx="65" cy="60" rx="28" ry="22" fill="#93c5fd" opacity="0.6"/>
      <path d="M45,55 Q65,35 85,55" stroke="#2563eb" stroke-width="2" fill="none"/>
      <path d="M45,65 Q65,85 85,65" stroke="#2563eb" stroke-width="2" fill="none"/>
      <!-- 偏误标记 -->
      <circle cx="55" cy="50" r="6" fill="#ef4444" opacity="0.8"/>
      <circle cx="75" cy="55" r="5" fill="#fbbf24" opacity="0.8"/>
      <circle cx="60" cy="70" r="4" fill="#10b981" opacity="0.8"/>
    </g>
    <!-- 诊断报告图标 -->
    <g transform="translate(170, 30)">
      <rect x="10" y="5" width="80" height="100" fill="#f8fafc" stroke="#2563eb" stroke-width="2" rx="4"/>
      <!-- 标题线 -->
      <rect x="20" y="15" width="40" height="6" fill="#2563eb" opacity="0.5" rx="1"/>
      <!-- 内容线 -->
      <rect x="20" y="30" width="60" height="4" fill="#93c5fd" opacity="0.5" rx="1"/>
      <rect x="20" y="40" width="55" height="4" fill="#93c5fd" opacity="0.5" rx="1"/>
      <rect x="20" y="50" width="50" height="4" fill="#93c5fd" opacity="0.5" rx="1"/>
      <!-- 图表 -->
      <rect x="20" y="65" width="12" height="25" fill="#3b82f6" opacity="0.6"/>
      <rect x="38" y="55" width="12" height="35" fill="#3b82f6" opacity="0.7"/>
      <rect x="56" y="45" width="12" height="45" fill="#3b82f6" opacity="0.8"/>
      <rect x="74" y="35" width="12" height="55" fill="#ef4444" opacity="0.8"/>
      <!-- 对勾 -->
      <circle cx="110" cy="100" r="18" fill="#10b981"/>
      <path d="M100,100 L107,107 L120,93" stroke="white" stroke-width="3" fill="none"/>
    </g>
    <text x="160" y="170" font-size="13" fill="#2563eb" text-anchor="middle" font-weight="600">认知诊断 · 偏误模式识别与分析</text>
  `;
            return wrapSVG(content);
        }
    };

    // ==================== 主生成函数 ====================

    /**
     * 生成场景 SVG 插图
     * @param {string} scenarioId - 场景ID
     * @param {string} biasType - 偏误类型（可选，用于选择特定风格）
     * @param {string} theme - 主题 ('light' | 'dark')
     * @returns {string} SVG 字符串
     */
    function generateScenarioSVG(scenarioId, biasType = null, theme = 'light') {
        // 精确匹配
        if (ScenarioIllustrations[scenarioId]) {
            return ScenarioIllustrations[scenarioId](theme);
        }

        // 模糊匹配场景ID关键词
        const idLower = scenarioId.toLowerCase();
        const patterns = [
            { key: 'coffee', illust: 'coffee-shop-nonlinear-effects' },
            { key: 'investment', illust: 'investment-confirmation-bias' },
            { key: 'relationship', illust: 'relationship-time-delay' },
            { key: 'business', illust: 'business-strategy-game' },
            { key: 'policy', illust: 'public-policy-simulation' },
            { key: 'info', illust: 'investment-info-processing' },
            { key: 'climate', illust: 'climate-change-scenario' },
            { key: 'crisis', illust: 'financial-crisis-scenario' },
            { key: 'ai', illust: 'ai-governance-scenario' },
            { key: 'finance', illust: 'personal-finance-scenario' },
            { key: 'social', illust: 'social-media-echo-chamber' },
            { key: 'compound', illust: 'advanced-compound-scenarios' },
            { key: 'cognitive', illust: 'cognitive-diagnosis' },
        ];

        for (const p of patterns) {
            if (idLower.includes(p.key)) {
                return ScenarioIllustrations[p.illust](theme);
            }
        }

        // 偏误类型匹配
        if (biasType) {
            const biasPatterns = [
                { key: 'linear', illust: 'coffee-shop-nonlinear-effects' },
                { key: 'confirmation', illust: 'investment-confirmation-bias' },
                { key: 'time', illust: 'relationship-time-delay' },
                { key: 'overconfiden', illust: 'business-strategy-game' },
                { key: 'exponential', illust: 'coffee-shop-nonlinear-effects' },
                { key: 'sunk', illust: 'personal-finance-scenario' },
            ];
            for (const p of biasPatterns) {
                if (biasType.toLowerCase().includes(p.key)) {
                    return ScenarioIllustrations[p.illust](theme);
                }
            }
        }

        // 默认插图
        return ScenarioIllustrations['default'](theme);
    }

    // ==================== 导出 ====================

    global.ScenarioIllustrations = {
        generate: generateScenarioSVG,
        illustrations: ScenarioIllustrations,
        listScenarioIds: () => Object.keys(ScenarioIllustrations).filter(k => k !== 'default')
    };

})(typeof global !== 'undefined' ? global : window);
/**
 * UX审计脚本 - 自动化检测场景视觉友好性和交互便利性
 */

const { chromium } = require('playwright');

// UX检测配置
const UX_CONFIG = {
  // 最小按钮尺寸（WCAG推荐44x44px）
  MIN_BUTTON_SIZE: 44,
  
  // 最小字体大小
  MIN_FONT_SIZE: 14,
  
  // 颜色对比度阈值（WCAG AA）
  MIN_CONTRAST_RATIO: 4.5,
  
  // 最大加载时间（毫秒）
  MAX_LOAD_TIME: 3000,
  
  // 场景列表
  SCENARIOS: [
    'coffee-shop-linear-thinking',
    'relationship-time-delay',
    'investment-confirmation-bias',
    'business-strategy-reasoning',
    'public-policy-making',
    'personal-finance-decision',
    'climate-change-policy',
    'ai-governance-regulation',
    'financial-crisis-response'
  ]
};

// 审计结果
const auditResults = {
  scenarios: {},
  summary: {
    totalIssues: 0,
    criticalIssues: 0,
    warningIssues: 0,
    infoIssues: 0
  }
};

/**
 * 检测按钮尺寸
 */
async function checkButtonSizes(page) {
  const buttons = await page.locator('button, .btn, [role="button"]').all();
  const issues = [];
  
  for (const btn of buttons) {
    const box = await btn.boundingBox();
    if (box) {
      if (box.width < UX_CONFIG.MIN_BUTTON_SIZE || box.height < UX_CONFIG.MIN_BUTTON_SIZE) {
        issues.push({
          type: 'critical',
          element: 'button',
          message: `按钮尺寸过小 (${Math.round(box.width)}x${Math.round(box.height)}px)，建议>=${UX_CONFIG.MIN_BUTTON_SIZE}x${UX_CONFIG.MIN_BUTTON_SIZE}px`,
          suggestion: '增大按钮尺寸以提高点击便利性'
        });
      }
    }
  }
  
  return issues;
}

/**
 * 检测加载状态
 */
async function checkLoadingStates(page) {
  const issues = [];
  
  // 检查是否有加载指示器
  const loadingIndicators = await page.locator('.loading, .spinner, [aria-label*="loading"]').count();
  if (loadingIndicators === 0) {
    issues.push({
      type: 'warning',
      element: 'page',
      message: '未检测到加载状态指示器',
      suggestion: '添加加载动画或骨架屏以提升用户体验'
    });
  }
  
  return issues;
}

/**
 * 检测错误提示
 */
async function checkErrorMessages(page) {
  const issues = [];
  
  // 检查是否有错误提示容器
  const errorContainers = await page.locator('.error, .alert, [role="alert"]').count();
  if (errorContainers === 0) {
    issues.push({
      type: 'info',
      element: 'page',
      message: '未检测到错误提示容器',
      suggestion: '添加错误提示组件以改善错误恢复体验'
    });
  }
  
  return issues;
}

/**
 * 检测颜色对比度
 */
async function checkColorContrast(page) {
  const issues = [];
  
  // 获取所有文本元素
  const textElements = await page.locator('p, span, h1, h2, h3, h4, h5, h6, button, a').all();
  
  for (const el of textElements.slice(0, 20)) { // 限制检测数量
    try {
      const bgColor = await el.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      const textColor = await el.evaluate(el => {
        return window.getComputedStyle(el).color;
      });
      
      // 简化的对比度检测（实际应使用更复杂的算法）
      if (bgColor === 'rgba(0, 0, 0, 0)' || textColor === 'rgba(0, 0, 0, 0)') {
        issues.push({
          type: 'warning',
          element: 'text',
          message: '可能存在颜色对比度问题',
          suggestion: '确保文本和背景颜色对比度>=4.5:1'
        });
      }
    } catch (e) {
      // 忽略检测错误
    }
  }
  
  return issues;
}

/**
 * 检测模态框体验
 */
async function checkModalUX(page) {
  const issues = [];
  
  // 检查模态框是否存在
  const modal = await page.locator('#game-modal, .modal').count();
  if (modal > 0) {
    // 检查模态框关闭按钮
    const closeBtn = await page.locator('#close-modal, .modal-close, [aria-label*="close"]').count();
    if (closeBtn === 0) {
      issues.push({
        type: 'critical',
        element: 'modal',
        message: '模态框缺少关闭按钮',
        suggestion: '添加明显的关闭按钮以提升用户控制感'
      });
    }
    
    // 检查模态框滚动
    const modalContent = await page.locator('#game-container').first();
    if (await modalContent.count() > 0) {
      const scrollable = await modalContent.evaluate(el => {
        return el.scrollHeight > el.clientHeight;
      });
      
      if (!scrollable) {
        issues.push({
          type: 'info',
          element: 'modal',
          message: '模态框内容可能无法滚动',
          suggestion: '确保模态框内容在溢出时可滚动'
        });
      }
    }
  }
  
  return issues;
}

/**
 * 审计单个场景
 */
async function auditScenario(scenarioId) {
  console.log(`\n🔍 审计场景: ${scenarioId}`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  const issues = [];
  
  try {
    // 访问场景页面
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
    
    // 点击场景卡片
    const scenarioCard = page.locator(`.scenario-card:has-text("${scenarioId}")`).first();
    if (await scenarioCard.count() > 0) {
      await scenarioCard.click();
      await page.waitForTimeout(1000);
    }
    
    // 执行各项检测
    console.log('  检测按钮尺寸...');
    issues.push(...await checkButtonSizes(page));
    
    console.log('  检测加载状态...');
    issues.push(...await checkLoadingStates(page));
    
    console.log('  检测错误提示...');
    issues.push(...await checkErrorMessages(page));
    
    console.log('  检测颜色对比度...');
    issues.push(...await checkColorContrast(page));
    
    console.log('  检测模态框体验...');
    issues.push(...await checkModalUX(page));
    
    // 记录结果
    auditResults.scenarios[scenarioId] = {
      issues,
      criticalCount: issues.filter(i => i.type === 'critical').length,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length
    };
    
    auditResults.summary.totalIssues += issues.length;
    auditResults.summary.criticalIssues += auditResults.scenarios[scenarioId].criticalCount;
    auditResults.summary.warningIssues += auditResults.scenarios[scenarioId].warningCount;
    auditResults.summary.infoIssues += auditResults.scenarios[scenarioId].infoCount;
    
    console.log(`  ✅ 审计完成: ${issues.length}个问题 (${auditResults.scenarios[scenarioId].criticalCount}严重, ${auditResults.scenarios[scenarioId].warningCount}警告, ${auditResults.scenarios[scenarioId].infoCount}提示)`);
    
  } catch (error) {
    console.error(`  ❌ 审计失败: ${error.message}`);
    auditResults.scenarios[scenarioId] = {
      issues: [{ type: 'critical', message: `审计失败: ${error.message}` }],
      criticalCount: 1,
      warningCount: 0,
      infoCount: 0
    };
  } finally {
    await browser.close();
  }
}

/**
 * 生成审计报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 UX审计报告');
  console.log('='.repeat(60));
  
  console.log('\n📋 场景审计结果:');
  for (const [scenarioId, result] of Object.entries(auditResults.scenarios)) {
    console.log(`\n  ${scenarioId}:`);
    console.log(`    总问题数: ${result.issues.length}`);
    console.log(`    严重问题: ${result.criticalCount}`);
    console.log(`    警告问题: ${result.warningCount}`);
    console.log(`    提示问题: ${result.infoCount}`);
    
    if (result.issues.length > 0) {
      console.log('    问题列表:');
      result.issues.forEach((issue, index) => {
        console.log(`      ${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
        if (issue.suggestion) {
          console.log(`         建议: ${issue.suggestion}`);
        }
      });
    }
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('📈 总体统计:');
  console.log(`  总问题数: ${auditResults.summary.totalIssues}`);
  console.log(`  严重问题: ${auditResults.summary.criticalIssues}`);
  console.log(`  警告问题: ${auditResults.summary.warningIssues}`);
  console.log(`  提示问题: ${auditResults.summary.infoIssues}`);
  console.log('='.repeat(60));
  
  return auditResults;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始UX审计...');
  console.log(`📋 审计场景数: ${UX_CONFIG.SCENARIOS.length}`);
  
  // 审计每个场景
  for (const scenarioId of UX_CONFIG.SCENARIOS) {
    await auditScenario(scenarioId);
  }
  
  // 生成报告
  const report = generateReport();
  
  // 保存报告到文件
  const fs = require('fs');
  const reportPath = 'D:\\AIDevelop\\failureLogic\\.qwen\\ux-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 报告已保存到: ${reportPath}`);
  
  return report;
}

// 执行审计
main().catch(console.error);

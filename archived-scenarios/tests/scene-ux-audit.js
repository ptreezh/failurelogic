/**
 * 场景深度UX审计脚本
 * 逐个场景检测视觉友好性和交互便利性
 */

const { chromium } = require('playwright');
const fs = require('fs');

// 场景配置
const SCENARIOS = [
  { id: 'coffee-shop-linear-thinking', name: '咖啡店线性思维' },
  { id: 'relationship-time-delay', name: '恋爱关系时间延迟' },
  { id: 'investment-confirmation-bias', name: '投资信息处理' },
  { id: 'business-strategy-reasoning', name: '商业战略推理游戏' },
  { id: 'public-policy-making', name: '公共政策制定模拟' },
  { id: 'personal-finance-decision', name: '个人财务决策模拟' },
  { id: 'climate-change-policy', name: '全球气候变化政策制定博弈' },
  { id: 'ai-governance-regulation', name: 'AI治理与监管决策模拟' },
  { id: 'financial-crisis-response', name: '复杂金融市场危机应对模拟' }
];

// UX检测配置
const UX_CONFIG = {
  MIN_BUTTON_SIZE: 44,
  MIN_FONT_SIZE: 14,
  MAX_LOAD_TIME: 3000,
  MIN_CONTRAST_RATIO: 4.5
};

// 审计结果
const auditResults = {
  scenarios: {},
  summary: {
    totalIssues: 0,
    criticalIssues: 0,
    warningIssues: 0,
    infoIssues: 0,
    uxScore: 0
  }
};

/**
 * 检测按钮尺寸
 */
async function checkButtonSizes(page) {
  const issues = [];
  const buttons = await page.locator('button, .btn, [role="button"]').all();
  
  for (const btn of buttons) {
    try {
      const box = await btn.boundingBox();
      if (box) {
        if (box.width < UX_CONFIG.MIN_BUTTON_SIZE || box.height < UX_CONFIG.MIN_BUTTON_SIZE) {
          issues.push({
            type: 'critical',
            category: '按钮尺寸',
            message: `按钮尺寸过小 (${Math.round(box.width)}x${Math.round(box.height)}px)，建议>=${UX_CONFIG.MIN_BUTTON_SIZE}x${UX_CONFIG.MIN_BUTTON_SIZE}px`,
            suggestion: '增大按钮尺寸以提高点击便利性',
            element: await btn.evaluate(el => el.outerHTML.substring(0, 100))
          });
        }
      }
    } catch (e) {
      // 忽略不可见元素
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
      category: '加载状态',
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
      category: '错误提示',
      message: '未检测到错误提示容器',
      suggestion: '添加错误提示组件以改善错误恢复体验'
    });
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
        category: '模态框',
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
          category: '模态框',
          message: '模态框内容可能无法滚动',
          suggestion: '确保模态框内容在溢出时可滚动'
        });
      }
    }
  }
  
  return issues;
}

/**
 * 检测场景流程完整性
 */
async function checkScenarioFlow(page, scenarioId) {
  const issues = [];
  
  // 检查场景介绍
  const intro = await page.locator('.scenario-intro, .intro, [class*="intro"]').count();
  if (intro === 0) {
    issues.push({
      type: 'warning',
      category: '场景流程',
      message: '缺少场景介绍',
      suggestion: '添加清晰的场景介绍以帮助用户理解目标'
    });
  }
  
  // 检查进度指示
  const progress = await page.locator('.progress, [class*="progress"], .step-indicator').count();
  if (progress === 0) {
    issues.push({
      type: 'warning',
      category: '场景流程',
      message: '缺少进度指示',
      suggestion: '添加进度条或步骤指示器以帮助用户了解当前位置'
    });
  }
  
  // 检查决策选项
  const options = await page.locator('.option, .choice, [class*="option"], [class*="choice"]').count();
  if (options === 0) {
    issues.push({
      type: 'critical',
      category: '场景流程',
      message: '缺少决策选项',
      suggestion: '确保场景有清晰的决策选项供用户选择'
    });
  }
  
  return issues;
}

/**
 * 检测移动端适配
 */
async function checkMobileAdaptation(page) {
  const issues = [];
  
  // 检查视口设置
  const viewport = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? meta.content : null;
  });
  
  if (!viewport) {
    issues.push({
      type: 'critical',
      category: '移动端适配',
      message: '缺少viewport meta标签',
      suggestion: '添加viewport meta标签以支持移动端'
    });
  }
  
  // 检查触摸目标尺寸
  const touchTargets = await page.locator('button, a, input, select, textarea').all();
  for (const target of touchTargets.slice(0, 10)) {
    try {
      const box = await target.boundingBox();
      if (box) {
        if (box.width < 48 || box.height < 48) {
          issues.push({
            type: 'warning',
            category: '移动端适配',
            message: `触摸目标过小 (${Math.round(box.width)}x${Math.round(box.height)}px)，移动端建议>=48x48px`,
            suggestion: '增大触摸目标尺寸以改善移动端体验'
          });
        }
      }
    } catch (e) {
      // 忽略不可见元素
    }
  }
  
  return issues;
}

/**
 * 审计单个场景
 */
async function auditScenario(scenario) {
  console.log(`\n🔍 审计场景: ${scenario.name} (${scenario.id})`);
  
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
    const scenarioCard = page.locator(`.scenario-card:has-text("${scenario.name}")`).first();
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
    
    console.log('  检测模态框体验...');
    issues.push(...await checkModalUX(page));
    
    console.log('  检测场景流程...');
    issues.push(...await checkScenarioFlow(page, scenario.id));
    
    console.log('  检测移动端适配...');
    issues.push(...await checkMobileAdaptation(page));
    
    // 记录结果
    auditResults.scenarios[scenario.id] = {
      name: scenario.name,
      issues,
      criticalCount: issues.filter(i => i.type === 'critical').length,
      warningCount: issues.filter(i => i.type === 'warning').length,
      infoCount: issues.filter(i => i.type === 'info').length,
      uxScore: calculateUXScore(issues)
    };
    
    auditResults.summary.totalIssues += issues.length;
    auditResults.summary.criticalIssues += auditResults.scenarios[scenario.id].criticalCount;
    auditResults.summary.warningIssues += auditResults.scenarios[scenario.id].warningCount;
    auditResults.summary.infoIssues += auditResults.scenarios[scenario.id].infoCount;
    
    console.log(`  ✅ 审计完成: ${issues.length}个问题 (${auditResults.scenarios[scenario.id].criticalCount}严重, ${auditResults.scenarios[scenario.id].warningCount}警告, ${auditResults.scenarios[scenario.id].infoCount}提示), UX评分: ${auditResults.scenarios[scenario.id].uxScore}`);
    
  } catch (error) {
    console.error(`  ❌ 审计失败: ${error.message}`);
    auditResults.scenarios[scenario.id] = {
      name: scenario.name,
      issues: [{ type: 'critical', category: '审计失败', message: `审计失败: ${error.message}` }],
      criticalCount: 1,
      warningCount: 0,
      infoCount: 0,
      uxScore: 0
    };
  } finally {
    await browser.close();
  }
}

/**
 * 计算UX评分
 */
function calculateUXScore(issues) {
  const criticalWeight = 10;
  const warningWeight = 3;
  const infoWeight = 1;
  
  const penalty = issues.reduce((sum, issue) => {
    if (issue.type === 'critical') return sum + criticalWeight;
    if (issue.type === 'warning') return sum + warningWeight;
    return sum + infoWeight;
  }, 0);
  
  const score = Math.max(0, 100 - penalty);
  return score;
}

/**
 * 生成审计报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 场景UX审计报告');
  console.log('='.repeat(80));
  
  console.log('\n📋 场景审计结果:');
  for (const [scenarioId, result] of Object.entries(auditResults.scenarios)) {
    console.log(`\n  ${result.name} (${scenarioId}):`);
    console.log(`    UX评分: ${result.uxScore}/100`);
    console.log(`    总问题数: ${result.issues.length}`);
    console.log(`    严重问题: ${result.criticalCount}`);
    console.log(`    警告问题: ${result.warningCount}`);
    console.log(`    提示问题: ${result.infoCount}`);
    
    if (result.issues.length > 0 && result.issues.length <= 10) {
      console.log('    问题列表:');
      result.issues.forEach((issue, index) => {
        console.log(`      ${index + 1}. [${issue.type.toUpperCase()}] [${issue.category}] ${issue.message}`);
        if (issue.suggestion) {
          console.log(`         建议: ${issue.suggestion}`);
        }
      });
    }
  }
  
  // 计算总体UX评分
  const scores = Object.values(auditResults.scenarios).map(s => s.uxScore);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  auditResults.summary.uxScore = Math.round(avgScore);
  
  console.log('\n' + '-'.repeat(80));
  console.log('📈 总体统计:');
  console.log(`  总问题数: ${auditResults.summary.totalIssues}`);
  console.log(`  严重问题: ${auditResults.summary.criticalIssues}`);
  console.log(`  警告问题: ${auditResults.summary.warningIssues}`);
  console.log(`  提示问题: ${auditResults.summary.infoIssues}`);
  console.log(`  平均UX评分: ${auditResults.summary.uxScore}/100`);
  console.log('='.repeat(80));
  
  return auditResults;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始场景深度UX审计...');
  console.log(`📋 审计场景数: ${SCENARIOS.length}`);
  
  // 审计每个场景
  for (const scenario of SCENARIOS) {
    await auditScenario(scenario);
  }
  
  // 生成报告
  const report = generateReport();
  
  // 保存报告到文件
  const reportPath = 'D:\\AIDevelop\\failureLogic\\.qwen\\scene-ux-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 报告已保存到: ${reportPath}`);
  
  return report;
}

// 执行审计
main().catch(console.error);

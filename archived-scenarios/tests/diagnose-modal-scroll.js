/**
 * 弹窗滚动问题诊断脚本
 * 检查弹窗打开时背景是否可滚动
 */

const { chromium } = require('playwright');

(async function diagnoseModalScroll() {
  console.log('🔍 开始诊断弹窗滚动问题...\n');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. 访问应用
    console.log('📱 步骤1: 访问应用...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('✅ 首页加载成功\n');
    
    // 2. 导航到场景页面
    console.log('📱 步骤2: 导航到场景页面...');
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { 
      state: 'visible', 
      timeout: 15000 
    });
    console.log('✅ 场景页面加载成功\n');
    
    // 3. 检查初始body状态
    console.log('📊 步骤3: 检查初始body状态...');
    const bodyOverflowBefore = await page.evaluate(() => {
      return {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        hasModalOpenClass: document.body.classList.contains('modal-open')
      };
    });
    console.log('Body状态 (弹窗前):');
    console.log(`  overflow: "${bodyOverflowBefore.overflow}"`);
    console.log(`  position: "${bodyOverflowBefore.position}"`);
    console.log(`  hasModalOpenClass: ${bodyOverflowBefore.hasModalOpenClass}\n`);
    
    // 4. 打开场景卡片
    console.log('📱 步骤4: 打开场景卡片...');
    const firstCard = page.locator('.scenario-card').first();
    await firstCard.click();
    await page.waitForTimeout(1000);
    
    // 5. 检查弹窗打开后的body状态
    console.log('📊 步骤5: 检查弹窗打开后的body状态...');
    const bodyOverflowAfter = await page.evaluate(() => {
      return {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        hasModalOpenClass: document.body.classList.contains('modal-open'),
        modalActive: document.getElementById('game-modal')?.classList.contains('active')
      };
    });
    console.log('Body状态 (弹窗后):');
    console.log(`  overflow: "${bodyOverflowAfter.overflow}"`);
    console.log(`  position: "${bodyOverflowAfter.position}"`);
    console.log(`  hasModalOpenClass: ${bodyOverflowAfter.hasModalOpenClass}`);
    console.log(`  modalActive: ${bodyOverflowAfter.modalActive}\n`);
    
    // 6. 尝试滚动背景
    console.log('📊 步骤6: 尝试滚动背景...');
    const scrollResult = await page.evaluate(() => {
      const scrollTopBefore = window.scrollY;
      window.scrollTo(0, 500);
      const scrollTopAfter = window.scrollY;
      return {
        before: scrollTopBefore,
        after: scrollTopAfter,
        scrolled: scrollTopAfter > scrollTopBefore
      };
    });
    console.log(`滚动测试结果:`);
    console.log(`  滚动前: ${scrollResult.before}px`);
    console.log(`  滚动后: ${scrollResult.after}px`);
    console.log(`  是否滚动: ${scrollResult.scrolled}\n`);
    
    // 7. 检查modal-content是否可滚动
    console.log('📊 步骤7: 检查modal-content滚动...');
    const modalScrollResult = await page.evaluate(() => {
      const modalContent = document.querySelector('.modal-content');
      if (!modalContent) return { found: false };
      return {
        found: true,
        scrollHeight: modalContent.scrollHeight,
        clientHeight: modalContent.clientHeight,
        canScroll: modalContent.scrollHeight > modalContent.clientHeight,
        overflowY: getComputedStyle(modalContent).overflowY
      };
    });
    console.log('Modal-content状态:');
    console.log(`  找到: ${modalScrollResult.found}`);
    if (modalScrollResult.found) {
      console.log(`  scrollHeight: ${modalScrollResult.scrollHeight}px`);
      console.log(`  clientHeight: ${modalScrollResult.clientHeight}px`);
      console.log(`  可滚动: ${modalScrollResult.canScroll}`);
      console.log(`  overflow-y: ${modalScrollResult.overflowY}`);
    }
    
    console.log('\n✅ 诊断完成');
    
    // 总结
    console.log('\n📋 问题总结:');
    if (bodyOverflowAfter.hasModalOpenClass && !scrollResult.scrolled) {
      console.log('✅ 弹窗滚动锁定正常工作');
    } else if (!bodyOverflowAfter.hasModalOpenClass) {
      console.log('❌ 问题: body没有modal-open类');
    } else if (scrollResult.scrolled) {
      console.log('❌ 问题: 弹窗打开时背景仍可滚动');
    }
    
  } catch (error) {
    console.error('\n❌ 诊断过程中出错:');
    console.error(error.message);
  } finally {
    await browser.close();
  }
})();

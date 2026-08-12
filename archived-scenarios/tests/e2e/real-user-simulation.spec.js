/**
 * 真实用户模拟测试 - 全场景自然交互走查
 * 模拟真实用户行为，缓慢、自然地交互
 * 遍历所有场景，验证用户体验
 */

import { test, expect } from '@playwright/test';

// 真实用户交互延迟（毫秒）
const USER_DELAY = {
  PAGE_NAVIGATION: 800,      // 页面导航后等待
  CARD_CLICK: 600,           // 看到场景卡片后点击
  MODAL_OPEN: 1000,          // 等待模态框打开
  DECISION_READING: 1500,    // 阅读决策选项
  BUTTON_CLICK: 500,         // 点击按钮后等待
  FEEDBACK_READING: 2000,    // 阅读反馈内容
  SCROLL: 800,               // 滚动页面
  TYPING: 300,               // 输入延迟
};

// 辅助函数：模拟用户思考延迟
const userThink = async (page, minMs = 500, maxMs = 1500) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  await page.waitForTimeout(delay);
};

// 辅助函数：模拟用户点击（带延迟）
const userClick = async (page, selector) => {
  await userThink(page, 300, 800);
  const element = page.locator(selector).first();
  await expect(element).toBeVisible({ timeout: 10000 });
  await element.click();
  await userThink(page, 500, 1000);
};

// 辅助函数：模拟用户滚动
const userScroll = async (page) => {
  await userThink(page, 500, 1000);
  await page.evaluate(() => {
    window.scrollBy({ top: 300, behavior: 'smooth' });
  });
  await userThink(page, 500, 800);
};

test.describe('真实用户模拟 - 全场景自然交互走查', () => {
  
  test('完整用户旅程：首页→场景列表→场景体验→返回', async ({ page }) => {
    console.log('🚀 开始真实用户模拟测试...');
    
    // 1. 访问首页
    console.log('📱 步骤1: 访问首页...');
    await page.goto('/', { waitUntil: 'networkidle' });
    await userThink(page, 1000, 2000);
    
    // 验证首页加载
    await expect(page.locator('#home-page')).toHaveClass(/active/);
    await expect(page.locator('.hero-section')).toBeVisible();
    console.log('✅ 首页加载成功');
    
    // 2. 导航到场景页面
    console.log('📱 步骤2: 导航到场景页面...');
    await userClick(page, '[data-page="scenarios"]');
    await userThink(page, USER_DELAY.PAGE_NAVIGATION, USER_DELAY.PAGE_NAVIGATION + 500);
    
    // 验证场景页面
    await expect(page.locator('#scenarios-page')).toHaveClass(/active/);
    await expect(page.locator('#scenarios-page .page-title')).toContainText('认知场景');
    console.log('✅ 场景页面加载成功');
    
    // 3. 等待场景卡片加载
    console.log('📱 步骤3: 等待场景卡片加载...');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
    await userThink(page, 1000, 2000);
    
    // 统计场景卡片
    const scenarioCards = page.locator('.scenario-card');
    const cardCount = await scenarioCards.count();
    console.log(`✅ 找到 ${cardCount} 个场景卡片`);
    expect(cardCount).toBeGreaterThan(0);
    
    // 4. 浏览场景卡片（滚动）
    console.log('📱 步骤4: 浏览场景卡片...');
    await userScroll(page);
    await userScroll(page);
    
    // 5. 选择第一个场景
    console.log('📱 步骤5: 选择第一个场景...');
    const firstCard = scenarioCards.first();
    await userThink(page, 1000, 2000);
    await firstCard.click();
    await userThink(page, USER_DELAY.MODAL_OPEN, USER_DELAY.MODAL_OPEN + 1000);
    
    // 验证模态框打开
    const modal = page.locator('#game-modal');
    await expect(modal).toBeVisible();
    console.log('✅ 模态框打开成功');
    
    // 6. 查看场景介绍
    console.log('📱 步骤6: 查看场景介绍...');
    await userThink(page, 2000, 3000);
    await userScroll(page);
    
    // 7. 开始游戏
    console.log('📱 步骤7: 开始游戏...');
    const startButton = page.locator('#game-container button:has-text("开始"), #game-container button:has-text("开始挑战"), #game-container button:has-text("开始决策")').first();
    if (await startButton.count() > 0) {
      await userClick(page, '#game-container button:has-text("开始"), #game-container button:has-text("开始挑战"), #game-container button:has-text("开始决策")');
      await userThink(page, 1000, 2000);
      console.log('✅ 游戏开始成功');
    }
    
    // 8. 阅读决策选项
    console.log('📱 步骤8: 阅读决策选项...');
    await userThink(page, USER_DELAY.DECISION_READING, USER_DELAY.DECISION_READING + 1000);
    await userScroll(page);
    
    // 9. 做出决策
    console.log('📱 步骤9: 做出决策...');
    const optionCards = page.locator('.option-card');
    const optionCount = await optionCards.count();
    if (optionCount > 0) {
      // 随机选择一个选项
      const randomIndex = Math.floor(Math.random() * optionCount);
      console.log(`  选择第 ${randomIndex + 1} 个选项`);
      await userClick(page, `.option-card:nth-child(${randomIndex + 1})`);
      
      // 提交决策
      const submitButton = page.locator('#game-container button:has-text("提交"), #game-container button:has-text("确认")').first();
      if (await submitButton.count() > 0) {
        await userClick(page, '#game-container button:has-text("提交"), #game-container button:has-text("确认")');
        await userThink(page, USER_DELAY.FEEDBACK_READING, USER_DELAY.FEEDBACK_READING + 1000);
        console.log('✅ 决策提交成功');
      }
    }
    
    // 10. 查看反馈
    console.log('📱 步骤10: 查看反馈...');
    await userThink(page, 2000, 3000);
    await userScroll(page);
    
    // 11. 关闭模态框
    console.log('📱 步骤11: 关闭模态框...');
    // 使用JavaScript关闭模态框
    await page.evaluate(() => {
      if (window.GameManager && typeof window.GameManager.hideGameModal === 'function') {
        window.GameManager.hideGameModal();
      }
    });
    await userThink(page, 1000, 1500);
    
    // 验证模态框关闭
    await expect(page.locator('#game-modal')).not.toBeVisible();
    console.log('✅ 模态框关闭成功');

    // 12. 返回首页
    console.log('📱 步骤12: 返回首页...');
    await userClick(page, '[data-page="home"]');
    await userThink(page, USER_DELAY.PAGE_NAVIGATION, USER_DELAY.PAGE_NAVIGATION + 500);
    
    // 验证首页
    await expect(page.locator('#home-page')).toHaveClass(/active/);
    console.log('✅ 返回首页成功');
    
    console.log('🎉 完整用户旅程测试完成！');
  });
  
  test('全场景卡片浏览：查看所有场景详情', async ({ page }) => {
    test.setTimeout(120000); // 增加超时时间到2分钟，因为有40个场景
    
    console.log('🔍 开始全场景卡片浏览测试...');
    
    // 导航到场景页面
    await page.goto('/', { waitUntil: 'networkidle' });
    await userClick(page, '[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
    
    // 获取所有场景卡片
    const scenarioCards = page.locator('.scenario-card');
    const cardCount = await scenarioCards.count();
    console.log(`📊 找到 ${cardCount} 个场景卡片`);
    
    expect(cardCount).toBeGreaterThan(0);
    
    // 逐个查看场景卡片详情
    for (let i = 0; i < cardCount; i++) {
      console.log(`\n📱 查看场景 ${i + 1}/${cardCount}...`);
      
      const card = scenarioCards.nth(i);
      await card.scrollIntoViewIfNeeded();
      await userThink(page, 800, 1500);
      
      // 验证卡片可见
      await expect(card).toBeVisible();
      
      // 验证卡片内容
      const title = card.locator('h3');
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      console.log(`  场景名称: ${titleText}`);
      
      // 验证难度标签
      const badge = card.locator('.badge, .difficulty-badge');
      if (await badge.count() > 0) {
        const badgeText = await badge.textContent();
        console.log(`  难度: ${badgeText}`);
      }
      
      // 验证描述
      const description = card.locator('.scenario-description, p');
      if (await description.count() > 0) {
        const descText = await description.first().textContent();
        console.log(`  描述: ${descText.substring(0, 50)}...`);
      }
      
      // 短暂停留模拟阅读
      await userThink(page, 500, 1000);
    }
    
    console.log('\n🎉 全场景卡片浏览测试完成！');
  });
  
  test('多场景快速切换：验证导航稳定性', async ({ page }) => {
    console.log('🔄 开始多场景快速切换测试...');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 快速切换页面5次
    const pages = ['scenarios', 'home', 'about', 'scenarios', 'home'];
    
    for (let i = 0; i < pages.length; i++) {
      console.log(`📱 切换到 ${pages[i]} (${i + 1}/${pages.length})...`);
      await userClick(page, `[data-page="${pages[i]}"]`);
      await userThink(page, 300, 600);
      
      // 验证页面切换成功
      await expect(page.locator(`#${pages[i]}-page`)).toHaveClass(/active/);
      console.log(`✅ ${pages[i]} 页面激活成功`);
    }
    
    console.log('🎉 多场景快速切换测试完成！');
  });
  
  test('模态框交互：打开、操作、关闭', async ({ page }) => {
    console.log('📦 开始模态框交互测试...');
    
    // 导航到场景并打开模态框
    await page.goto('/', { waitUntil: 'networkidle' });
    await userClick(page, '[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
    
    // 打开模态框
    console.log('📱 打开模态框...');
    await userClick(page, '.scenario-card');
    await userThink(page, 1000, 1500);
    
    // 验证模态框
    const modal = page.locator('#game-modal');
    await expect(modal).toBeVisible();
    console.log('✅ 模态框打开成功');
    
    // 验证模态框内容
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();
    console.log('✅ 模态框内容可见');
    
    // 滚动查看内容
    await userScroll(page);
    await userScroll(page);
    
    // 关闭模态框
    console.log('📱 关闭模态框...');
    // 尝试点击关闭按钮或按Escape
    const closeBtn = page.locator('#game-modal .close-btn, #game-modal button:has-text("关闭"), #game-modal button:has-text("返回")').first();
    if (await closeBtn.count() > 0) {
      await userClick(page, '#game-modal .close-btn, #game-modal button:has-text("关闭"), #game-modal button:has-text("返回")');
    } else {
      // 使用JavaScript关闭模态框
      await page.evaluate(() => {
        if (window.GameManager && typeof window.GameManager.hideGameModal === 'function') {
          window.GameManager.hideGameModal();
        }
      });
    }
    await userThink(page, 500, 1000);
    
    // 验证模态框关闭
    await expect(page.locator('#game-modal')).not.toBeVisible();
    console.log('✅ 模态框关闭成功');
    
    console.log('🎉 模态框交互测试完成！');
  });
});

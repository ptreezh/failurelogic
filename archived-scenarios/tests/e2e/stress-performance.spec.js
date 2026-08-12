/**
 * 压力性能并发测试
 * 高并发、极限测试系统性能和稳定性
 */

import { test, expect } from '@playwright/test';

test.describe('压力性能并发测试', () => {
  
  test('并发场景加载：10个并发会话', async ({ browser }) => {
    console.log('⚡ 开始并发场景加载测试...');
    
    const concurrentSessions = 10;
    const promises = [];
    
    // 创建10个并发会话
    for (let i = 0; i < concurrentSessions; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      promises.push(
        (async (sessionNum) => {
          console.log(`📱 会话 ${sessionNum}: 开始...`);
          const startTime = Date.now();
          
          // 访问首页
          await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
          
          // 导航到场景页面
          await page.click('[data-page="scenarios"]');
          
          // 等待场景加载
          await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
          
          // 统计场景卡片
          const cards = await page.locator('.scenario-card').count();
          const loadTime = Date.now() - startTime;
          
          console.log(`✅ 会话 ${sessionNum}: 加载 ${cards} 个场景，耗时 ${loadTime}ms`);
          
          await context.close();
          return { sessionNum, cards, loadTime };
        })(i + 1)
      );
    }
    
    // 等待所有会话完成
    const results = await Promise.all(promises);
    
    // 分析结果
    const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
    const maxLoadTime = Math.max(...results.map(r => r.loadTime));
    const minLoadTime = Math.min(...results.map(r => r.loadTime));
    
    console.log('\n📊 并发测试结果:');
    console.log(`  平均加载时间: ${avgLoadTime.toFixed(0)}ms`);
    console.log(`  最快: ${minLoadTime}ms`);
    console.log(`  最慢: ${maxLoadTime}ms`);
    console.log(`  成功会话: ${results.filter(r => r.cards > 0).length}/${concurrentSessions}`);
    
    // 验证性能
    expect(avgLoadTime).toBeLessThan(5000); // 平均加载时间<5秒
    expect(results.filter(r => r.cards > 0).length).toBe(concurrentSessions);
  });
  
  test('快速连续导航：验证系统稳定性', async ({ page }) => {
    console.log('⚡ 开始快速连续导航测试...');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 快速切换页面20次
    const pages = ['scenarios', 'home', 'about', 'scenarios', 'home', 'about', 'scenarios', 'home', 'about', 'scenarios',
                   'home', 'about', 'scenarios', 'home', 'about', 'scenarios', 'home', 'about', 'scenarios', 'home'];
    
    const startTime = Date.now();
    
    for (let i = 0; i < pages.length; i++) {
      console.log(`📱 导航 ${i + 1}/${pages.length}: ${pages[i]}`);
      await page.click(`[data-page="${pages[i]}"]`);
      await page.waitForTimeout(100); // 100ms间隔
    }
    
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / pages.length;
    
    console.log(`\n📊 快速导航结果:`);
    console.log(`  总次数: ${pages.length}`);
    console.log(`  总耗时: ${totalTime}ms`);
    console.log(`  平均每次: ${avgTime.toFixed(0)}ms`);
    
    // 验证最后页面正确
    await expect(page.locator('#home-page')).toHaveClass(/active/);
  });
  
  test('模态框并发：同时打开多个模态框', async ({ page }) => {
    console.log('⚡ 开始模态框并发测试...');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.click('[data-page="scenarios"]');
    await page.waitForSelector('.scenario-card', { state: 'visible', timeout: 15000 });
    
    // 快速点击5个场景卡片
    const cards = page.locator('.scenario-card');
    const cardCount = await cards.count();
    const clickCount = Math.min(5, cardCount);
    
    console.log(`📱 快速点击 ${clickCount} 个场景卡片...`);
    
    for (let i = 0; i < clickCount; i++) {
      await cards.nth(i).click();
      await page.waitForTimeout(200);
    }
    
    await page.waitForTimeout(2000);
    
    // 验证只有一个模态框打开
    const activeModals = await page.locator('#game-modal.active').count();
    console.log(`✅ 活动模态框数量: ${activeModals}`);
    expect(activeModals).toBe(1); // 应该只有一个模态框
    
    // 关闭模态框
    await page.locator('#game-modal').press('Escape');
    await page.waitForTimeout(500);
    
    // 验证模态框关闭
    const stillActive = await page.locator('#game-modal.active').count();
    expect(stillActive).toBe(0);
    
    console.log('✅ 模态框并发测试通过');
  });
  
  test('API并发请求：验证API稳定性', async ({ request }) => {
    console.log('⚡ 开始API并发请求测试...');
    
    const concurrentRequests = 20;
    const promises = [];
    
    // 发送20个并发API请求
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        (async (reqNum) => {
          const startTime = Date.now();
          const res = await request.get('http://localhost:8000/api/scenarios');
          const responseTime = Date.now() - startTime;
          
          return {
            reqNum,
            status: res.status(),
            responseTime,
            ok: res.ok()
          };
        })(i + 1)
      );
    }
    
    const results = await Promise.all(promises);
    
    // 分析结果
    const successCount = results.filter(r => r.ok).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const maxResponseTime = Math.max(...results.map(r => r.responseTime));
    
    console.log('\n📊 API并发测试结果:');
    console.log(`  总请求数: ${concurrentRequests}`);
    console.log(`  成功: ${successCount}`);
    console.log(`  失败: ${concurrentRequests - successCount}`);
    console.log(`  平均响应时间: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`  最慢响应: ${maxResponseTime}ms`);
    
    // 验证
    expect(successCount).toBe(concurrentRequests);
    expect(avgResponseTime).toBeLessThan(2000);
  });
  
  test('长时间运行：内存泄漏检测', async ({ page }) => {
    console.log('⚡ 开始长时间运行测试...');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // 获取初始内存使用
    const initialMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0;
    });
    
    console.log(`📊 初始内存使用: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    
    // 执行100次页面切换
    for (let i = 0; i < 100; i++) {
      const pageName = i % 2 === 0 ? 'scenarios' : 'home';
      await page.click(`[data-page="${pageName}"]`);
      await page.waitForTimeout(50);
      
      if (i % 20 === 0) {
        console.log(`  完成 ${i + 1}/100 次切换...`);
      }
    }
    
    // 获取最终内存使用
    const finalMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0;
    });
    
    console.log(`📊 最终内存使用: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    
    const memoryGrowth = finalMemory - initialMemory;
    const memoryGrowthPercent = initialMemory > 0 ? (memoryGrowth / initialMemory * 100) : 0;
    
    console.log(`📊 内存增长: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB (${memoryGrowthPercent.toFixed(1)}%)`);
    
    // 验证内存增长不超过20%
    expect(memoryGrowthPercent).toBeLessThan(20);
    
    console.log('✅ 长时间运行测试通过');
  });
});

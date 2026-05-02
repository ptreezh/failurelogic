/**
 * 恋爱关系时间延迟场景 E2E 测试
 * Relationship Time Delay Scenario E2E Tests
 * 
 * 测试目标：
 * 1. 场景初始化：验证场景正确加载
 * 2. 时间延迟机制：验证投资决策不会立即产生回报
 * 3. 投资回报计算：验证多轮后的累计效应
 * 4. 教育反馈：验证反馈指出时间延迟理解不足
 * 5. 多轮连贯性：验证 5 轮（月）决策流程完整
 * 6. 觉醒时刻：验证玩家能体验到"过早放弃"的失败模式
 */

import { test, expect } from '@playwright/test';

test.describe('恋爱关系时间延迟场景 - E2E 测试', () => {
  // 测试超时设置为 90 秒，因为完整游戏流程需要时间
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // 访问首页
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test.describe('场景初始化', () => {
    test('应该正确加载恋爱关系时间延迟场景卡片', async ({ page }) => {
      // 导航到场景页面
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });

      // 查找恋爱关系场景卡片
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await expect(relationshipCard).toBeVisible();

      // 验证场景信息
      await expect(relationshipCard).toContainText('时间延迟');
      await expect(relationshipCard).toContainText('intermediate');
    });

    test('应该正确打开恋爱关系场景游戏模态框', async ({ page }) => {
      // 导航到场景页面
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });

      // 点击恋爱关系场景
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 验证游戏模态框打开
      await expect(page.locator('#game-modal')).toHaveClass(/active/);

      // 验证游戏容器存在
      await expect(page.locator('#game-container')).toBeVisible();
    });

    test('应该显示场景开始页面', async ({ page }) => {
      // 导航到场景页面
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });

      // 点击恋爱关系场景
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待游戏模态框
      await expect(page.locator('#game-modal')).toHaveClass(/active/);

      // 等待游戏内容加载
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('恋爱关系时间延迟');
      }, { timeout: 10000 });

      // 验证开始页面内容
      const startPage = page.locator('.start-page');
      await expect(startPage).toBeVisible();
      await expect(startPage).toContainText('恋爱关系时间延迟');
      await expect(startPage).toContainText('时间延迟');
      await expect(startPage).toContainText('开始交往');
    });
  });

  test.describe('时间延迟机制', () => {
    test('应该显示时间延迟警告信息', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 等待决策页面加载 - 使用更宽松的匹配
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && (container.innerHTML.includes('第 1 月') || container.innerHTML.includes('决策'));
      }, { timeout: 10000 });

      // 验证周数信息显示
      const weekInfo = page.locator('.week-info');
      await expect(weekInfo).toBeVisible();
      await expect(weekInfo).toContainText('周');
    });

    test('应该在选择决策后显示延迟反馈', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 等待决策页面
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });

      // 选择中频联系选项
      const mediumOption = page.locator('input[name="communication_style"][value="medium"]');
      await mediumOption.check();

      // 确认选择
      await page.click('button:has-text("确认选择")');

      // 等待反馈页面
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('你的决策已记录');
      }, { timeout: 10000 });

      // 验证反馈页面显示延迟提醒
      const feedbackPage = page.locator('.feedback-page');
      await expect(feedbackPage).toBeVisible();
      await expect(feedbackPage).toContainText('延迟');
    });

    test('应该对高频联系显示风险警告', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 等待决策页面
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });

      // 选择高频联系选项
      const highOption = page.locator('input[name="communication_style"][value="high"]');
      await highOption.check();

      // 确认选择
      await page.click('button:has-text("确认选择")');

      // 等待反馈页面
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('你的决策已记录');
      }, { timeout: 10000 });

      // 验证风险警告
      const feedbackPage = page.locator('.feedback-page');
      await expect(feedbackPage).toContainText('压力');
    });
  });

  test.describe('多轮决策流程', () => {
    test('应该完成第 1 月的两个决策', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 第 1 个决策：联系频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });

      const mediumOption = page.locator('input[name="communication_style"][value="medium"]');
      await mediumOption.check();
      await page.click('button:has-text("确认选择")');

      // 确认反馈
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('继续');
      }, { timeout: 10000 });
      await page.click('button:has-text("继续")');

      // 第 2 个决策：约会频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('约会频率');
      }, { timeout: 10000 });

      const weeklyOption = page.locator('input[name="dating_frequency"][value="once_weekly"]');
      await weeklyOption.check();
      await page.click('button:has-text("确认选择")');

      // 确认反馈
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('继续');
      }, { timeout: 10000 });
      await page.click('button:has-text("继续")');

      // 验证进入第 1 月总结
      const summaryPage = page.locator('.summary-page');
      await expect(summaryPage).toBeVisible();
      await expect(summaryPage).toContainText('月总结');
    });

    test('应该完成完整的 5 轮（月）游戏流程', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 辅助函数：完成一个决策
      const makeDecision = async (selector, value) => {
        const option = page.locator(selector);
        // 等待选项可用
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.check();
        await page.click('button:has-text("确认选择")');
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && container.innerHTML.includes('继续');
        }, { timeout: 10000 });
        await page.click('button:has-text("继续")');
      };

      // 辅助函数：完成一个月（处理总结页面）
      const finishMonth = async () => {
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && (container.innerHTML.includes('进入下月') || container.innerHTML.includes('继续'));
        }, { timeout: 10000 });
        // 尝试点击"进入下月"或"继续"
        try {
          await page.click('button:has-text("进入下月")');
        } catch {
          await page.click('button:has-text("继续")');
        }
      };

      // 第 1 月 - 联系频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="communication_style"][value="medium"]', 'medium');

      // 第 1 月 - 约会频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('约会频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="dating_frequency"][value="once_weekly"]', 'once_weekly');

      // 完成第 1 月总结
      await finishMonth();

      // 验证进入第 2 月
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && (container.innerHTML.includes('第 2 月') || container.innerHTML.includes('冲突'));
      }, { timeout: 10000 });

      // 第 2 月 - 冲突处理
      await makeDecision('input[name="conflict_style"][value="collaborative"]', 'collaborative');

      // 完成第 2 月总结
      await finishMonth();

      // 验证进入第 3 月
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && (container.innerHTML.includes('第 3 月') || container.innerHTML.includes('礼物'));
      }, { timeout: 10000 });

      // 第 3 月 - 礼物投入
      await makeDecision('input[name="gift_investment"][value="moderate"]', 'moderate');

      // 完成第 3 月总结
      await finishMonth();

      // 验证进入觉醒页面（第 4 月）
      const awakeningPage = page.locator('.awakening-page');
      await expect(awakeningPage).toBeVisible({ timeout: 10000 });
      await expect(awakeningPage).toContainText('觉醒时刻');
    });

    test('应该显示觉醒时刻的教育内容', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 辅助函数：完成一个决策
      const makeDecision = async (selector, value) => {
        const option = page.locator(selector);
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.check();
        await page.click('button:has-text("确认选择")');
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && container.innerHTML.includes('继续');
        }, { timeout: 10000 });
        await page.click('button:has-text("继续")');
      };

      // 辅助函数：完成一个月（处理总结页面）
      const finishMonth = async () => {
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && (container.innerHTML.includes('进入下月') || container.innerHTML.includes('继续'));
        }, { timeout: 10000 });
        try {
          await page.click('button:has-text("进入下月")');
        } catch {
          await page.click('button:has-text("继续")');
        }
      };

      // 第 1 月 - 联系频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="communication_style"][value="medium"]', 'medium');

      // 第 1 月 - 约会频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('约会频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="dating_frequency"][value="once_weekly"]', 'once_weekly');

      // 完成第 1 月总结
      await finishMonth();

      // 第 2 月 - 冲突处理
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('冲突');
      }, { timeout: 10000 });
      await makeDecision('input[name="conflict_style"][value="collaborative"]', 'collaborative');

      // 完成第 2 月总结
      await finishMonth();

      // 第 3 月 - 礼物投入
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('礼物');
      }, { timeout: 10000 });
      await makeDecision('input[name="gift_investment"][value="moderate"]', 'moderate');

      // 完成第 3 月总结
      await finishMonth();

      // 验证觉醒页面内容
      const awakeningPage = page.locator('.awakening-page');
      await expect(awakeningPage).toBeVisible({ timeout: 10000 });
      await expect(awakeningPage).toContainText('觉醒时刻');
      await expect(awakeningPage).toContainText('失败的逻辑');
      await expect(awakeningPage).toContainText('延迟');

      // 验证策略选择
      await expect(page.locator('button:has-text("继续现状")')).toBeVisible();
      await expect(page.locator('button:has-text("调整策略")')).toBeVisible();
      await expect(page.locator('button:has-text("深度投入")')).toBeVisible();
    });

    test('应该显示最终结局和学习成果', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 辅助函数：完成一个决策
      const makeDecision = async (selector, value) => {
        const option = page.locator(selector);
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.check();
        await page.click('button:has-text("确认选择")');
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && container.innerHTML.includes('继续');
        }, { timeout: 10000 });
        await page.click('button:has-text("继续")');
      };

      // 辅助函数：完成一个月（处理总结页面）
      const finishMonth = async () => {
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && (container.innerHTML.includes('进入下月') || container.innerHTML.includes('继续'));
        }, { timeout: 10000 });
        try {
          await page.click('button:has-text("进入下月")');
        } catch {
          await page.click('button:has-text("继续")');
        }
      };

      // 第 1 月 - 联系频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="communication_style"][value="medium"]', 'medium');

      // 第 1 月 - 约会频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('约会频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="dating_frequency"][value="once_weekly"]', 'once_weekly');

      // 完成第 1 月总结
      await finishMonth();

      // 第 2 月 - 冲突处理
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('冲突');
      }, { timeout: 10000 });
      await makeDecision('input[name="conflict_style"][value="collaborative"]', 'collaborative');

      // 完成第 2 月总结
      await finishMonth();

      // 第 3 月 - 礼物投入
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('礼物');
      }, { timeout: 10000 });
      await makeDecision('input[name="gift_investment"][value="moderate"]', 'moderate');

      // 完成第 3 月总结
      await finishMonth();

      // 觉醒时刻选择调整策略
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('觉醒时刻');
      }, { timeout: 10000 });
      await page.click('button:has-text("调整策略")');

      // 第 5 月决策
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('未来规划');
      }, { timeout: 10000 });
      const committedOption = page.locator('input[name="future_planning"][value="committed"]');
      await committedOption.waitFor({ state: 'visible', timeout: 10000 });
      await committedOption.check();
      await page.click('button:has-text("确认选择")');
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('继续');
      }, { timeout: 10000 });
      await page.click('button:has-text("继续")');

      // 验证结局页面
      const endingPage = page.locator('.ending-page');
      await expect(endingPage).toBeVisible({ timeout: 10000 });
      await expect(endingPage).toContainText('结局');

      // 验证学习成果
      await expect(endingPage).toContainText('学到');
      await expect(endingPage).toContainText('延迟');

      // 验证最终统计
      await expect(endingPage).toContainText('好感度');
      await expect(endingPage).toContainText('满意度');
    });
  });

  test.describe('时间线可视化', () => {
    test('应该显示延迟效果时间线', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 完成第 1 个决策
      const mediumOption = page.locator('input[name="communication_style"][value="medium"]');
      await mediumOption.check();
      await page.click('button:has-text("确认选择")');

      // 等待反馈页面
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('继续');
      }, { timeout: 10000 });
      await page.click('button:has-text("继续")');

      // 完成第 2 个决策
      const weeklyOption = page.locator('input[name="dating_frequency"][value="once_weekly"]');
      await weeklyOption.check();
      await page.click('button:has-text("确认选择")');

      // 等待反馈页面
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('继续');
      }, { timeout: 10000 });
      await page.click('button:has-text("继续")');

      // 验证总结页面显示时间线
      const summaryPage = page.locator('.summary-page');
      await expect(summaryPage).toBeVisible();

      // 检查时间线部分
      const timelineSection = page.locator('.timeline-section');
      await expect(timelineSection).toBeVisible();
      await expect(timelineSection).toContainText('时间线');
    });
  });

  test.describe('聊天界面', () => {
    test('应该显示小林的消息回复', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 完成第 1 月
      const makeDecision = async (selector, value) => {
        const option = page.locator(selector);
        await option.check();
        await page.click('button:has-text("确认选择")');
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && container.innerHTML.includes('继续');
        }, { timeout: 10000 });
        await page.click('button:has-text("继续")');
      };

      await makeDecision('input[name="communication_style"][value="medium"]', 'medium');
      await makeDecision('input[name="dating_frequency"][value="once_weekly"]', 'once_weekly');

      // 验证总结页面显示小林的回复
      const summaryPage = page.locator('.summary-page');
      await expect(summaryPage).toContainText('小林');

      // 检查聊天界面
      const chatInterface = page.locator('.chat-interface');
      await expect(chatInterface).toBeVisible();
    });
  });

  test.describe('游戏重置功能', () => {
    test('应该能够重新开始游戏', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 完成第 1 个决策
      const mediumOption = page.locator('input[name="communication_style"][value="medium"]');
      await mediumOption.check();
      await page.click('button:has-text("确认选择")');

      // 关闭模态框
      await page.click('#close-modal');

      // 重新打开场景
      await relationshipCard.click();

      // 验证重新开始
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });

      const startPage = page.locator('.start-page');
      await expect(startPage).toBeVisible();
    });
  });

  test.describe('教育目标验证', () => {
    test('应该展示关系投资不会立即见效', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待游戏内容加载
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });

      // 验证开始页面说明 - 使用更宽松的匹配
      const gameContainer = page.locator('#game-container');
      await expect(gameContainer).toBeVisible();
      await expect(gameContainer).toContainText('付出');
      await expect(gameContainer).toContainText('效果');
      await expect(gameContainer).toContainText('延迟');
    });

    test('应该揭示人们低估时间延迟的认知偏差', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 完成一个决策
      const mediumOption = page.locator('input[name="communication_style"][value="medium"]');
      await mediumOption.check();
      await page.click('button:has-text("确认选择")');

      // 验证反馈页面显示期望 vs 实际
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('你的期望');
      }, { timeout: 10000 });

      const feedbackPage = page.locator('.feedback-page');
      await expect(feedbackPage).toContainText('期望');
      await expect(feedbackPage).toContainText('延迟');
    });

    test('应该体验延迟满足的重要性', async ({ page }) => {
      // 导航并打开场景
      await page.click('[data-page="scenarios"]');
      await page.waitForSelector('.scenario-card', { state: 'visible' });
      const relationshipCard = page.locator('.scenario-card').filter({ hasText: '恋爱关系时间延迟' });
      await relationshipCard.click();

      // 等待并开始游戏
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('开始交往');
      }, { timeout: 10000 });
      await page.click('button:has-text("开始交往")');

      // 辅助函数：完成一个决策
      const makeDecision = async (selector, value) => {
        const option = page.locator(selector);
        await option.waitFor({ state: 'visible', timeout: 10000 });
        await option.check();
        await page.click('button:has-text("确认选择")');
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && container.innerHTML.includes('继续');
        }, { timeout: 10000 });
        await page.click('button:has-text("继续")');
      };

      // 辅助函数：完成一个月（处理总结页面）
      const finishMonth = async () => {
        await page.waitForFunction(() => {
          const container = document.getElementById('game-container');
          return container && (container.innerHTML.includes('进入下月') || container.innerHTML.includes('继续'));
        }, { timeout: 10000 });
        try {
          await page.click('button:has-text("进入下月")');
        } catch {
          await page.click('button:has-text("继续")');
        }
      };

      // 第 1 月 - 联系频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('联系频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="communication_style"][value="medium"]', 'medium');

      // 第 1 月 - 约会频率
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('约会频率');
      }, { timeout: 10000 });
      await makeDecision('input[name="dating_frequency"][value="once_weekly"]', 'once_weekly');

      // 完成第 1 月总结
      await finishMonth();

      // 第 2 月 - 冲突处理
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('冲突');
      }, { timeout: 10000 });
      await makeDecision('input[name="conflict_style"][value="collaborative"]', 'collaborative');

      // 完成第 2 月总结
      await finishMonth();

      // 第 3 月 - 礼物投入
      await page.waitForFunction(() => {
        const container = document.getElementById('game-container');
        return container && container.innerHTML.includes('礼物');
      }, { timeout: 10000 });
      await makeDecision('input[name="gift_investment"][value="moderate"]', 'moderate');

      // 完成第 3 月总结
      await finishMonth();

      // 验证觉醒页面显示延迟满足的教育内容
      const awakeningPage = page.locator('.awakening-page');
      await expect(awakeningPage).toBeVisible({ timeout: 10000 });
      await expect(awakeningPage).toContainText('延迟');
      await expect(awakeningPage).toContainText('投入');
      await expect(awakeningPage).toContainText('效果');
    });
  });
});

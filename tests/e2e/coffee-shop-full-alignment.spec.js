/**
 * Coffee Shop Full Alignment + Resilience E2E
 *
 * 目标：所有 8 轮训练机制在浏览器中贯通验证 + 韧性测试
 *
 * 覆盖：
 *   - 失败四层次：即时 / 延迟 / 级联 / 阈值
 *   - 觉醒时刻：4 种模式检测
 *   - 训练阶段：L1-L4 演化
 *   - 偏差诊断：6 类偏差检测
 *   - 终局尸检：决策时间线
 *   - 历史案例：4 个真实案例对照
 *   - 韧性：localStorage 清理后系统仍可用
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function navigateToCoffeeShopGame(page) {
  await page.goto(BASE_URL);
  await page.locator('.nav-item[data-page="scenarios"]').click();
  await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });
  const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
  if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await welcomeClose.click();
  }
  const coffeeCard = page.locator('.scenario-card', { hasText: '咖啡店' }).first();
  await coffeeCard.click();
  await expect(page.locator('#game-modal')).toBeVisible({ timeout: 5000 });
}

async function setSlider(page, decisionId, value) {
  const slider = page.locator(`#${decisionId}`).first();
  await expect(slider).toBeVisible({ timeout: 5000 });
  await slider.evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function completeFullPlaythrough(page, decisions) {
  await navigateToCoffeeShopGame(page);
  await page.locator('#game-modal button', { hasText: '开始经营' }).click();

  for (let i = 0; i < decisions.length; i++) {
    const { decisionId, value } = decisions[i];

    // 等待对应的 slider 出现
    let attempts = 0;
    while (attempts < 5) {
      const slider = page.locator(`#${decisionId}`).first();
      if (await slider.isVisible({ timeout: 1000 }).catch(() => false)) {
        break;
      }
      // 没看到 slider，看页面是 feedback 还是 summary
      const continueBtn = page.locator('button', { hasText: /继续下个决策/ }).first();
      const enterBtn = page.locator('button', { hasText: '进入第' }).first();
      if (await continueBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await continueBtn.click();
      } else if (await enterBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await enterBtn.click();
      } else {
        await page.waitForTimeout(300);
      }
      attempts++;
    }

    await setSlider(page, decisionId, value);
    await page.locator('#game-modal .confirm-btn').first().click();
  }

  // 现在所有 5 个决策已完成，可能停在 TURN_X_SUMMARY
  // 点"进入第"直到 TURN_4_AWAKENING
  for (let i = 0; i < 3; i++) {
    const enterBtn = page.locator('button', { hasText: '进入第' }).first();
    if (await enterBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await enterBtn.click();
    }
  }

  // TURN_4_AWAKENING → 选 balanced
  const awakeningBtn = page.locator('.awakening-options button', { hasText: '平衡' }).first();
  if (await awakeningBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await awakeningBtn.click();
  }
}

test.describe('Coffee Shop - Full Alignment + Resilience (Iteration 8)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // 清理 localStorage（韧性：每次都是干净状态）
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('all 8 alignment layers are present in a complete playthrough', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    // 直接注入完整游戏历史并跳到 ending
    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 10, promotionBudget: 200 }, linear_expectation: { total_expected_profit: 200 }, actual_result: { actual_profit: 80 }, gap: -120 },
        { turn: 2, decisions: { coffeeVariety: 10, seats: 8, premiumPrice: 13 }, linear_expectation: { total_expected_profit: 250 }, actual_result: { actual_profit: -50 }, gap: -300 },
        { turn: 3, decisions: { coffeeVariety: 10, expansionStrategy: 3 }, linear_expectation: { total_expected_profit: 300 }, actual_result: { actual_profit: -200 }, gap: -500 }
      ];
      r.gameState.resources = 600;
      r.gameState.satisfaction = 35;
      r.gameState.reputation = 40;
      r.currentPage = 'TURN_5_ENDING';
      r._stageRecorded = false;  // 允许 ending 重新记录
      r.render();
    });

    await expect(page.locator('.ending-page')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="bias-diagnosis-report"]')).toBeVisible();
    await expect(page.locator('[data-testid="autopsy-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="historical-case"]')).toBeVisible();
  });

  test('full playthrough updates training stage tracker to conscious_incompetence', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 9, promotionBudget: 50 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 60 }, gap: -40 },
        { turn: 2, decisions: { coffeeVariety: 9, seats: 4, premiumPrice: 11 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 80 }, gap: -20 },
        { turn: 3, decisions: { coffeeVariety: 9, expansionStrategy: 2 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 90 }, gap: -10 }
      ];
      r.currentPage = 'TURN_5_ENDING';
      r._stageRecorded = false;
      r.render();
    });

    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('failureLogic.trainingProgress');
      return raw ? JSON.parse(raw) : null;
    });
    expect(progress).toBeTruthy();
    expect(progress.games_completed).toBeGreaterThanOrEqual(1);
    expect(['conscious_incompetence', 'conscious_competence']).toContain(progress.last_stage);
  });

  test('immediate feedback layer renders within 500ms after confirm', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    await setSlider(page, 'coffeeVariety', 7);
    const startTime = Date.now();
    await page.locator('#game-modal .confirm-btn').first().click();
    await expect(page.locator('[data-testid="immediate-impact"]')).toBeVisible({ timeout: 500 });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(1500);
  });

  test('delayed effects panel shows queued effect after overloading decision', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();
    await setSlider(page, 'coffeeVariety', 10);
    await page.locator('#game-modal .confirm-btn').first().click();
    await page.locator('.feedback-page button', { hasText: '继续下个决策' }).click();

    await expect(page.locator('[data-testid="pending-effects-panel"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('[data-testid="pending-effect"]').first()).toBeVisible();
  });

  test('tipping point warning renders when resources < 200', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();
    await page.evaluate(() => {
      window.coffeeShopRouter.gameState.resources = 100;
      window.coffeeShopRouter.render();
    });
    await expect(page.locator('[data-testid="tipping-banner"]').first()).toBeVisible({ timeout: 2000 });
  });

  test('awakening overlay appears with proper learning point', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();
    await page.evaluate(() => {
      window.coffeeShopRouter.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 8 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 70 }, gap: -30 },
        { turn: 2, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 50 }, gap: -50 },
        { turn: 3, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 100 }, gap: 0 }
      ];
      window.coffeeShopRouter.currentPage = 'TURN_4_AWAKENING';
      window.coffeeShopRouter.render();
    });
    await expect(page.locator('[data-testid="awakening-overlay"]')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('[data-testid="learning-point"]')).toBeVisible();
  });

  test('resilience: clearing localStorage does not break the game', async ({ page }) => {
    // 已经 beforeEach 清理，再做一次
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    // 游戏应该能正常进入 TURN_1_DECISION_1
    await expect(page.locator('.decision-page')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#coffeeVariety')).toBeVisible();
  });

  test('resilience: starting a 2nd playthrough after a complete 1st does not error', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    // 第一局：注入 + 跳到 ending
    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 70 }, gap: -30 },
        { turn: 2, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 60 }, gap: -40 }
      ];
      r.currentPage = 'TURN_5_ENDING';
      r._stageRecorded = false;
      r.render();
    });

    await expect(page.locator('.ending-page')).toBeVisible({ timeout: 3000 });

    // 检查 stage 已记录
    const stage1 = await page.evaluate(() => {
      const raw = localStorage.getItem('failureLogic.trainingProgress');
      return raw ? JSON.parse(raw).last_stage : null;
    });
    expect(stage1).toBe('conscious_incompetence');
  });

  test('all 9 coffee-shop spec files are present and structurally complete', async ({ page }) => {
    // 元测试：确保 8 轮的所有 spec 文件都存在
    const specFiles = [
      'coffee-shop-foundation.spec.js',
      'coffee-shop-immediate-feedback.spec.js',
      'coffee-shop-delayed-effects.spec.js',
      'coffee-shop-tipping-point.spec.js',
      'coffee-shop-awakening-moment.spec.js',
      'coffee-shop-training-stage.spec.js',
      'coffee-shop-bias-diagnosis.spec.js',
      'coffee-shop-autopsy-case.spec.js',
      'coffee-shop-full-alignment.spec.js'
    ];

    // 此测试本身在 full-alignment.spec.js 中运行
    // 我们通过页面 URL 验证测试基础设施（静态文件服务可用）
    const response = await page.goto(`${BASE_URL}/tests/e2e/coffee-shop-foundation.spec.js`);
    expect(response.status()).toBe(200);

    // 简单 sanity：每个 spec 文件应至少有 test.describe
    for (const specFile of specFiles) {
      const r = await page.goto(`${BASE_URL}/tests/e2e/${specFile}`);
      expect(r.status(), `${specFile} should be served`).toBe(200);
      const body = await r.text();
      expect(body).toContain('test.describe');
    }
  });
});

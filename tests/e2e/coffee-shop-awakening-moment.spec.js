/**
 * Coffee Shop Awakening Moment E2E
 *
 * 目标：Dörner 训练核心 — 在 TURN_4_AWAKENING 页面根据用户决策历史
 *      动态生成觉醒时刻 overlay，含 learningPoint + evidence
 *
 * 关键断言：
 *   - 选择过载模式（coffeeVariety ≥ 8 持续 2 月）触发 selection_overload 觉醒
 *   - 激进扩张模式触发 overexpansion 觉醒
 *   - 营销疲劳模式触发 marketing_fatigue_pattern 觉醒
 *   - 累积差距模式触发 cumulative_gap 觉醒
 *   - 觉醒 overlay 含 learningPoint、awakeningTypeTag、evidence
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

async function startGame(page) {
  await page.locator('#game-modal button', { hasText: '开始经营' }).click();
}

async function jumpToAwakeningPage(page) {
  // 直接设置 currentPage + 注入决策历史
  await page.evaluate(() => {
    const r = window.coffeeShopRouter;
    r.currentPage = 'TURN_4_AWAKENING';
    r.render();
  });
}

test.describe('Coffee Shop - Awakening Moment (Iteration 4)', () => {
  test('selection overload pattern triggers awakening with learning point', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    // 注入决策历史：2 个月选择 ≥8 种咖啡
    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 8 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 70 }, gap: -30 },
        { turn: 2, decisions: { coffeeVariety: 9 }, linear_expectation: { total_expected_profit: 120 }, actual_result: { actual_profit: 70 }, gap: -50 },
        { turn: 3, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 80 }, actual_result: { actual_profit: 80 }, gap: 0 }
      ];
    });
    await jumpToAwakeningPage(page);

    // 觉醒 overlay 应出现
    const overlay = page.locator('[data-testid="awakening-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 2000 });

    // 类型应为 selection_overload
    const type = await overlay.getAttribute('data-type');
    expect(type).toBe('selection_overload');

    // 含 learningPoint
    const lp = page.locator('[data-testid="learning-point"]');
    await expect(lp).toBeVisible();
    await expect(lp).toContainText('选择过载');

    // 含 awakeningTypeTag
    const tag = page.locator('[data-testid="awakening-type-tag"]');
    await expect(tag).toContainText('COUNTER_INTUITIVE');

    // 含 evidence
    const evidence = overlay.locator('.awakening-evidence li');
    expect(await evidence.count()).toBeGreaterThanOrEqual(1);
  });

  test('overexpansion pattern triggers awakening with EXPECTATION_GAP type', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 90 }, gap: -10 },
        { turn: 2, decisions: { coffeeVariety: 5, expansionStrategy: 3 }, linear_expectation: { total_expected_profit: 300 }, actual_result: { actual_profit: 100 }, gap: -200 },
        { turn: 3, decisions: { coffeeVariety: 6 }, linear_expectation: { total_expected_profit: 80 }, actual_result: { actual_profit: 80 }, gap: 0 }
      ];
    });
    await jumpToAwakeningPage(page);

    const overlay = page.locator('[data-testid="awakening-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 2000 });
    const type = await overlay.getAttribute('data-type');
    expect(type).toBe('overexpansion');

    const tag = page.locator('[data-testid="awakening-type-tag"]');
    await expect(tag).toContainText('EXPECTATION_GAP');

    // 应有 profound 级别
    const level = await overlay.getAttribute('data-level');
    expect(level).toBe('profound');
  });

  test('marketing fatigue pattern triggers awakening with DELAYED_REALIZATION type', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 5, promotionBudget: 250 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 100 }, gap: 0 },
        { turn: 2, decisions: { coffeeVariety: 5, promotionBudget: 300 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 100 }, gap: 0 },
        { turn: 3, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 100 }, gap: 0 }
      ];
    });
    await jumpToAwakeningPage(page);

    const overlay = page.locator('[data-testid="awakening-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 2000 });
    const type = await overlay.getAttribute('data-type');
    expect(type).toBe('marketing_fatigue_pattern');

    const tag = page.locator('[data-testid="awakening-type-tag"]');
    await expect(tag).toContainText('DELAYED_REALIZATION');

    const lp = page.locator('[data-testid="learning-point"]');
    await expect(lp).toContainText('营销疲劳');
  });

  test('cumulative gap triggers awakening with PATTERN_RECOGNITION type', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 20 }, gap: -80 },
        { turn: 2, decisions: { coffeeVariety: 6 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 10 }, gap: -90 },
        { turn: 3, decisions: { coffeeVariety: 5 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 0 }, gap: -100 }
      ];
    });
    await jumpToAwakeningPage(page);

    const overlay = page.locator('[data-testid="awakening-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 2000 });
    const type = await overlay.getAttribute('data-type');
    expect(type).toBe('cumulative_gap');

    const tag = page.locator('[data-testid="awakening-type-tag"]');
    await expect(tag).toContainText('PATTERN_RECOGNITION');
  });

  test('no awakening overlay when decisions are well-balanced', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);

    await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        { turn: 1, decisions: { coffeeVariety: 5, promotionBudget: 100 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 90 }, gap: -10 },
        { turn: 2, decisions: { coffeeVariety: 5, promotionBudget: 100 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 80 }, gap: -20 },
        { turn: 3, decisions: { coffeeVariety: 5, promotionBudget: 100 }, linear_expectation: { total_expected_profit: 100 }, actual_result: { actual_profit: 85 }, gap: -15 }
      ];
    });
    await jumpToAwakeningPage(page);

    const overlayCount = await page.locator('[data-testid="awakening-overlay"]').count();
    expect(overlayCount).toBe(0);
  });

  test('awakening page still shows decision history and choice buttons', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await startGame(page);
    await jumpToAwakeningPage(page);

    // 即使没触发觉醒，仍应有觉醒页的标准元素
    await expect(page.locator('.awakening-page h2')).toContainText('觉醒时刻');
    // 3 个策略按钮
    const options = page.locator('.awakening-options .btn-option');
    await expect(options).toHaveCount(3);
  });
});

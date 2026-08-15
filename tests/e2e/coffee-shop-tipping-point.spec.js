/**
 * Coffee Shop Tipping Point + Cascade E2E
 *
 * 目标：Dörner 失败四层次之"阈值崩溃"与"级联失败"——
 *      用户必须在阈值突破前看到预警，突破后看到因果链
 *
 * 关键断言：
 *   - 资金 < 200 时，状态栏出现"⚠️ 接近破产阈值"预警
 *   - 资金 < 100 时进入 critical 级
 *   - 资金 < 0 时，出现"🚨 阈值已被突破"严重级警示
 *   - 级联反应链显示哪条决策触发了最终的失败
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

async function startGameAndMutateState(page, mutateFn) {
  await navigateToCoffeeShopGame(page);
  await page.locator('#game-modal button', { hasText: '开始经营' }).click();
  // 等待 modal 渲染完成（含 state-display）
  await expect(page.locator('.state-display')).toBeVisible({ timeout: 2000 });
  await page.evaluate(mutateFn);
}

test.describe('Coffee Shop - Tipping Point + Cascade (Iteration 3)', () => {
  test('warning banner appears when resources drop below 200', async ({ page }) => {
    await startGameAndMutateState(page, () => {
      window.coffeeShopRouter.gameState.resources = 150;
      window.coffeeShopRouter.render();
    });

    const warning = page.locator('[data-testid="tipping-banner"][data-severity="warning"]');
    await expect(warning).toBeVisible({ timeout: 2000 });
    await expect(warning).toContainText('破产阈值');
  });

  test('critical banner appears when resources drop below 100', async ({ page }) => {
    await startGameAndMutateState(page, () => {
      window.coffeeShopRouter.gameState.resources = 80;
      window.coffeeShopRouter.render();
    });

    const critical = page.locator('[data-testid="tipping-banner"][data-severity="critical"]');
    await expect(critical).toBeVisible({ timeout: 2000 });
    await expect(critical).toContainText('破产阈值');
  });

  test('breached banner appears when resources go below 0 (bankruptcy)', async ({ page }) => {
    await startGameAndMutateState(page, () => {
      window.coffeeShopRouter.gameState.resources = -50;
      window.coffeeShopRouter.render();
    });

    const breached = page.locator('[data-testid="tipping-banner"][data-severity="breached"]');
    await expect(breached).toBeVisible({ timeout: 2000 });
    await expect(breached).toContainText('已被突破');
    const cascade = await breached.getAttribute('data-cascade');
    expect(cascade).toBe('system_collapse');
  });

  test('cascade root cause is identified from decision history', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();
    await expect(page.locator('.state-display')).toBeVisible({ timeout: 2000 });

    const rootCause = await page.evaluate(() => {
      const r = window.coffeeShopRouter;
      r.gameState.decision_history = [
        {
          turn: 1,
          decisions: { coffeeVariety: 5, promotionBudget: 100 },
          linear_expectation: { total_expected_profit: 200 },
          actual_result: { actual_profit: 200, resources: 1100 },
          gap: 100
        },
        {
          turn: 2,
          decisions: { coffeeVariety: 10, promotionBudget: 200 },
          linear_expectation: { total_expected_profit: 300 },
          actual_result: { actual_profit: -200, resources: 600 },
          gap: -500
        }
      ];
      return r.getCascadeRootCause();
    });

    expect(rootCause).toBeTruthy();
    expect(rootCause.turn).toBe(2);
    expect(rootCause.decisions.coffeeVariety).toBe(10);
    expect(rootCause.gap).toBe(-500);
  });

  test('satisfaction-collapse tipping point activates below 30', async ({ page }) => {
    await startGameAndMutateState(page, () => {
      window.coffeeShopRouter.gameState.satisfaction = 25;
      window.coffeeShopRouter.render();
    });

    const banners = page.locator('[data-testid="tipping-banner"]');
    await expect(banners.first()).toBeVisible({ timeout: 2000 });
    const cascadeAttr = await banners.first().getAttribute('data-cascade');
    expect(cascadeAttr).toBe('churn_cascade');
  });

  test('no tipping banner when state is healthy', async ({ page }) => {
    await startGameAndMutateState(page, () => {
      // 默认 healthy state 不变
    });
    const bannerCount = await page.locator('[data-testid="tipping-banner"]').count();
    expect(bannerCount).toBe(0);
  });
});

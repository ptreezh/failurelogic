/**
 * Coffee Shop Immediate Feedback E2E
 *
 * 目标：Dörner 失败四层次之"立即失败"—— 每个决策后用户应能立即看到
 *      该决策对资金/满意度/声誉的影响（不只是线性期望）
 *
 * 关键断言：
 *   - 点击"确认选择"后，feedback-page 出现"📍 即时影响"卡
 *   - 即时影响卡显示资金/满意度/声誉 3 个数值变化（含方向箭头）
 *   - 影响原因文本存在
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

test.describe('Coffee Shop - Immediate Feedback Layer (Iteration 1)', () => {
  test('feedback page shows "📍 即时影响" card after confirming a decision', async ({ page }) => {
    await navigateToCoffeeShopGame(page);

    // 开始经营
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    // 移动滑块以确保数值非默认值
    const slider = page.locator('#coffeeVariety').first();
    await expect(slider).toBeVisible({ timeout: 5000 });
    await slider.evaluate((el) => {
      el.value = 6;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // 确认选择
    await page.locator('#game-modal .confirm-btn').first().click();

    // 验证 feedback-page 出现
    await expect(page.locator('.feedback-page')).toBeVisible({ timeout: 3000 });

    // 验证即时影响卡存在
    const impactCard = page.locator('[data-testid="immediate-impact"]');
    await expect(impactCard).toBeVisible({ timeout: 2000 });

    // 验证卡片标题
    await expect(impactCard.locator('h3')).toContainText('即时影响');

    // 验证 3 个影响行
    const rows = impactCard.locator('.impact-row');
    await expect(rows).toHaveCount(3);

    // 验证原因文本
    await expect(impactCard.locator('.impact-reason')).not.toBeEmpty();
  });

  test('immediate impact reflects the chosen slider value (deltas are non-zero)', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    const slider = page.locator('#coffeeVariety').first();
    await expect(slider).toBeVisible({ timeout: 5000 });
    await slider.evaluate((el) => {
      el.value = 8;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.locator('#game-modal .confirm-btn').first().click();
    await expect(page.locator('.feedback-page')).toBeVisible({ timeout: 3000 });

    const impactCard = page.locator('[data-testid="immediate-impact"]');
    await expect(impactCard).toBeVisible({ timeout: 2000 });

    // coffeeVariety=8 → cost = 5*15 = -75 (resources_delta negative)
    const resourcesRow = impactCard.locator('.impact-row').first();
    const resourcesDelta = await resourcesRow.locator('.delta').innerText();
    expect(resourcesDelta).not.toBe('±0');
    // 至少 1 个 delta 应该是 negative 或 positive（非 neutral）
    const allDeltas = await impactCard.locator('.delta').allInnerTexts();
    const hasNonNeutral = allDeltas.some((t) => t !== '±0');
    expect(hasNonNeutral).toBeTruthy();

    // 验证 hint 提示月底揭示
    await expect(impactCard.locator('.impact-hint')).toContainText('月底');
  });

  test('immediate impact appears within 500ms of confirm click (responsiveness)', async ({ page }) => {
    await navigateToCoffeeShopGame(page);
    await page.locator('#game-modal button', { hasText: '开始经营' }).click();

    const slider = page.locator('#coffeeVariety').first();
    await expect(slider).toBeVisible({ timeout: 5000 });
    await slider.evaluate((el) => {
      el.value = 5;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const startTime = Date.now();
    await page.locator('#game-modal .confirm-btn').first().click();

    // 等待即时影响卡可见（timeout 500ms 验证即时性）
    await expect(page.locator('[data-testid="immediate-impact"]')).toBeVisible({ timeout: 500 });
    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(1500);
  });
});

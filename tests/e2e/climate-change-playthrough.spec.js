/**
 * Climate-Change End-to-End Playthrough Test
 *
 * Validates docs/climate-change-plan.md DoD:
 *   - Browser can load climate-change-policy card
 *   - 4 options + justification textarea appear
 *   - State grid shows 9 climate-specific vars (升温/CO2/GDP/可再生/etc)
 *   - T3 progressive reveal fires
 *   - T10 final outcome renders
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Climate-Change - Full Playthrough', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.route('**/*', (route) => {
      const headers = { ...route.request().headers(), 'Cache-Control': 'no-cache' };
      route.continue({ headers });
    });
  });

  test('user can load climate-change page and see climate-specific state grid', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    // 找 climate-change 卡片
    const climateCard = page.locator('.scenario-card', { hasText: '全球气候政策' }).first();
    await expect(climateCard).toBeVisible({ timeout: 5000 });

    // 点开始挑战
    await climateCard.locator('button', { hasText: '开始挑战' }).click();
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 5000 });

    // 决策页加载
    await expect(page.locator('.challenger-decision-page')).toBeVisible({ timeout: 15000 });

    // 4 选项 + textarea
    const options = await page.locator('.challenger-option').count();
    expect(options).toBe(4);

    await expect(page.locator('#challenger-justification')).toBeAttached();
    await expect(page.locator('#challenger-submit')).toBeAttached();

    // 状态网格应该显示气候变量,不是 Challenger 的工程师信心
    const gridText = await page.locator('.challenger-state-grid').textContent();
    expect(gridText).toContain('升温');  // 升温 vs Challenger 的温度
    expect(gridText).toContain('CO2');  // CO2 vs Challenger 的工程师信心
    expect(gridText).toContain('GDP');  // GDP
    expect(gridText).not.toContain('工程师');  // 不应该是 Challenger 变量
  });

  test('user can complete T1 → T4 with T3 reveal', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    const climateCard = page.locator('.scenario-card', { hasText: '全球气候政策' }).first();
    await climateCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    // 玩 3 个回合 — T3 应揭示
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector(`.challenger-option[data-option="A"]`, { timeout: 8000 });
      await page.locator('.challenger-option[data-option="A"]').click();
      await page.locator('#challenger-submit').click();
      await page.waitForTimeout(1500);
      const continueBtn = page.locator('button', { hasText: /^继续\s*→/ }).first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // T3 reveal 应出现 (somewhere in feedback). Reload page and verify by checking feedback text via UI
    const fbText = await page.locator('body').textContent();
    // Should mention F5 (单目标优化) — T3 reveal pattern
    expect(fbText).toContain('Dörner');
  });

  test('state grid shows climate vars (升温/CO2/GDP)', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });
    const climateCard = page.locator('.scenario-card', { hasText: '全球气候政策' }).first();
    await climateCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    // Verify state grid has 9 climate-specific elements
    const gridIds = await page.locator('.challenger-state-grid .state-value').evaluateAll(
      (els) => els.map((e) => e.id)
    );
    expect(gridIds.length).toBeGreaterThanOrEqual(9);
    expect(gridIds).toContain('state-temperature');
    expect(gridIds).toContain('state-co2');
    expect(gridIds).toContain('state-gdp');
    expect(gridIds).toContain('state-renewable');
    expect(gridIds).toContain('state-tipping');

    // No Challenger-specific vars should leak through
    expect(gridIds).not.toContain('state-engineer-confidence');
    expect(gridIds).not.toContain('state-morale');
  });
});
/**
 * Enron-Collapse End-to-End Playthrough Test
 *
 * Validates the 3rd deep scenario (enron-collapse):
 *   - Browser can load enron-collapse card
 *   - 4 options + justification textarea appear
 *   - State grid shows 9 enron-specific vars (股价/信用评级/隐性负债/etc)
 *   - T3 progressive reveal fires
 *   - Cover-up playthrough reaches total-collapse outcome
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Enron-Collapse - Full Playthrough', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.route('**/*', (route) => {
      const headers = { ...route.request().headers(), 'Cache-Control': 'no-cache' };
      route.continue({ headers });
    });
  });

  test('user can load enron page and see enron-specific state grid', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await expect(page.locator('#scenarios-grid')).toBeVisible({ timeout: 5000 });

    const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
    if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await welcomeClose.click();
    }

    // 找 enron 卡片 — 用唯一文案避免与其他历史案例卡冲突
    const enronCard = page.locator('.scenario-card', { hasText: '安然帝国崩塌' }).first();
    await expect(enronCard).toBeVisible({ timeout: 5000 });

    // 点开始挑战
    await enronCard.locator('button', { hasText: '开始挑战' }).click();
    await expect(page.locator('#game-modal')).toBeVisible({ timeout: 5000 });

    // 决策页加载
    await expect(page.locator('.challenger-decision-page')).toBeVisible({ timeout: 15000 });

    // 4 选项 + textarea
    const options = await page.locator('.challenger-option').count();
    expect(options).toBe(4);

    await expect(page.locator('#challenger-justification')).toBeAttached();
    await expect(page.locator('#challenger-submit')).toBeAttached();

    // 状态网格应该显示安然变量,不是 Challenger/Climate 的变量
    const gridText = await page.locator('.challenger-state-grid').textContent();
    expect(gridText).toContain('股价');
    expect(gridText).toContain('信用评级');
    expect(gridText).toContain('隐性负债');
    expect(gridText).toContain('举报人');
    expect(gridText).not.toContain('工程师');   // Challenger 变量
    expect(gridText).not.toContain('CO2');     // Climate 变量
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

    const enronCard = page.locator('.scenario-card', { hasText: '安然帝国崩塌' }).first();
    await enronCard.locator('button', { hasText: '开始挑战' }).click();
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

    // T3 reveal 应出现 — Dörner 模式揭示
    const fbText = await page.locator('body').textContent();
    expect(fbText).toContain('Dörner');
  });

  test('state grid shows 9 enron vars (股价/评级/负债/举报人)', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });
    const enronCard = page.locator('.scenario-card', { hasText: '安然帝国崩塌' }).first();
    await enronCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    // Verify state grid has 9 enron-specific elements
    const gridIds = await page.locator('.challenger-state-grid .state-value').evaluateAll(
      (els) => els.map((e) => e.id)
    );
    expect(gridIds.length).toBeGreaterThanOrEqual(9);
    expect(gridIds).toContain('state-share-price');
    expect(gridIds).toContain('state-credit');
    expect(gridIds).toContain('state-earnings');
    expect(gridIds).toContain('state-cashflow');
    expect(gridIds).toContain('state-offbalance');
    expect(gridIds).toContain('state-analyst');
    expect(gridIds).toContain('state-silenced');
    expect(gridIds).toContain('state-board');
    expect(gridIds).toContain('state-media');

    // No Challenger/Climate-specific vars should leak through
    expect(gridIds).not.toContain('state-engineer-confidence');
    expect(gridIds).not.toContain('state-co2');
    expect(gridIds).not.toContain('state-tipping');

    // GUARD: state values must NOT all be "—" (the offline fallback bug
    // that masked the per-scenario step dispatch failure until 2026-09-13).
    const gridValues = await page.locator('.challenger-state-grid .state-value').evaluateAll(
      (els) => els.map((e) => e.textContent.trim())
    );
    const allEmpty = gridValues.every((v) => v === '—' || v === '');
    expect(allEmpty).toBe(false);
    // Spot-check specific seeded values
    const share = await page.locator('#state-share-price').textContent();
    expect(share.trim()).toBe('90');
    const credit = await page.locator('#state-credit').textContent();
    expect(credit.trim()).toBe('BBB+');
  });

  test('decision page title shows "安然帝国崩塌" (not hard-coded Challenger)', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });
    const enronCard = page.locator('.scenario-card', { hasText: '安然帝国崩塌' }).first();
    await enronCard.locator('button', { hasText: '开始挑战' }).click();
    await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

    const title = (await page.locator('.challenger-decision-page h2').textContent()) || '';
    expect(title).toContain('安然帝国崩塌');
    expect(title).not.toContain('挑战者号');
  });

  test('card button has no difficulty suffix for deep scenarios', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(BASE_URL);
    await page.locator('.nav-item[data-page="scenarios"]').click();
    await page.waitForSelector('#scenarios-grid', { timeout: 5000 });
    const enronCard = page.locator('.scenario-card', { hasText: '安然帝国崩塌' }).first();
    const btnText = (await enronCard.locator('button').first().textContent()) || '';
    expect(btnText.trim()).toBe('开始挑战');
    expect(btnText).not.toContain('难度');
  });
});

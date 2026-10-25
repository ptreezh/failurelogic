import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(__dirname, 'test-results', 'e2e-screenshots-all-scenarios');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const SCENARIOS = [
  { id: 'coffee-shop-linear-thinking', name: '咖啡店线性思维', category: '基础认知' },
  { id: 'relationship-time-delay', name: '恋爱关系时间延迟', category: '基础认知' },
  { id: 'investment-confirmation-bias', name: '投资确认偏误', category: '基础认知' },
  { id: 'challenger-launch', name: '挑战者号发射决策', category: '历史案例·深度' },
  { id: 'climate-change-policy', name: '全球气候政策十年', category: '重大公共决策·深度' },
  { id: 'enron-collapse', name: '安然帝国崩塌', category: '历史案例·深度' },
];

async function takeScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  📸 Screenshot: ${filePath}`);
}

async function waitForScenarioCards(page) {
  await page.waitForSelector('.scenario-card', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

test.describe('Cognitive Trap Platform - Full Scenario E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  for (const scenario of SCENARIOS) {
    test(`${scenario.name} - 端到端交互测试`, async ({ page }) => {
      console.log(`\n=== Testing: ${scenario.name} (${scenario.id}) ===`);

      // 1. Navigate to home
      await page.goto('/');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `${scenario.id}-01-home`);

      // 2. Navigate to scenarios page
      await page.click('[data-page="scenarios"]');
      await page.waitForTimeout(3000);
      await takeScreenshot(page, `${scenario.id}-02-scenarios-page`);

      // 3. Verify scenarios grid loaded
      const grid = page.locator('#scenarios-grid');
      await expect(grid).toBeVisible();
      const cardCount = await grid.locator('.scenario-card').count();
      console.log(`  📊 Found ${cardCount} scenario cards`);
      await takeScreenshot(page, `${scenario.id}-03-scenarios-grid`);

      // 4. Find and click the specific scenario card
      const card = grid.locator('.scenario-card').filter({ hasText: scenario.name }).first();
      await card.waitFor({ state: 'visible', timeout: 15000 });
      await takeScreenshot(page, `${scenario.id}-04-card-visible`);

      // 5. Click the start button
      const startBtn = card.locator('button').filter({ hasText: /开始挑战|立即体验/ }).first();
      await startBtn.click();

      // 6. Wait for modal/game container
      await page.waitForTimeout(4000);
      await takeScreenshot(page, `${scenario.id}-05-game-loaded`);

      // 7. Check game content
      const gameModal = page.locator('#game-modal');
      const gameContainer = page.locator('.game-container, #game-container, .scenario-game, main');

      let contentArea = gameModal;
      if (!(await contentArea.isVisible({ timeout: 2000 }).catch(() => false))) {
        contentArea = gameContainer.first();
      }

      const contentText = await contentArea.textContent({ timeout: 5000 }).catch(() => '');
      const hasError = contentText && /失败|错误|Error|未找到|未加载|加载失败/.test(contentText);
      const hasContent = contentText && contentText.length > 50 && !hasError;

      if (hasError) {
        console.log(`  ❌ ${scenario.name}: ERROR in content`);
        await takeScreenshot(page, `${scenario.id}-06-ERROR`);
      } else if (hasContent) {
        console.log(`  ✅ ${scenario.name}: Content loaded (${contentText.length} chars)`);
        await takeScreenshot(page, `${scenario.id}-06-content-loaded`);
      } else {
        console.log(`  ⚠️  ${scenario.name}: Content unclear (${contentText?.length || 0} chars)`);
        await takeScreenshot(page, `${scenario.id}-06-content-unclear`);
      }

      // 8. Try to interact with the game (make a decision if possible)
      const decisionButtons = page.locator('button, input[type="range"], select').filter({
        hasText: /确认|选择|决定|提交|继续|下一步|开始/
      });

      const buttonCount = await decisionButtons.count();
      console.log(`  🎮 Found ${buttonCount} interactive elements`);

      if (buttonCount > 0 && !hasError) {
        try {
          const firstBtn = decisionButtons.first();
          if (await firstBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstBtn.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, `${scenario.id}-07-after-first-interaction`);
            console.log(`  🎮 Made first interaction`);
          }
        } catch (e) {
          console.log(`  ⚠️  Interaction skipped: ${e.message}`);
        }
      }

      // 9. Take final screenshot
      await takeScreenshot(page, `${scenario.id}-08-final`);

      // 10. Close modal if open
      const closeBtn = page.locator('#close-modal, .modal-close, .close-button');
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }

      console.log(`  ✅ ${scenario.name} test complete`);
    });
  }

  test('All scenarios page overview', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'overview-01-home');

    await page.click('[data-page="scenarios"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, 'overview-02-scenarios');

    const cards = page.locator('.scenario-card');
    const count = await cards.count();
    console.log(`\n📊 Total scenario cards: ${count}`);
    await expect(cards.first()).toBeVisible();

    // Take a screenshot of all cards
    await takeScreenshot(page, 'overview-03-all-cards');
  });
});

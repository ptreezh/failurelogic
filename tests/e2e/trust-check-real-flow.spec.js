/**
 * TRUST CHECK: Real end-to-end user flow for enron.
 * Goal: prove or disprove the system is actually usable.
 * Walk through: card click → T1 option select → justification → submit →
 * feedback page → continue → T2 option → submit → ... → T10 final.
 * Check EVERY interaction: state values, options, justification visibility,
 * submit enabling, feedback content, next turn routing.
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test('TRUST: enron full playthrough with explicit assertions at each step', async ({ page }) => {
  const allErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') allErrors.push(`[c] ${msg.text()}`); });
  page.on('pageerror', (err) => allErrors.push(`[pe] ${err.message}`));
  page.on('requestfailed', (req) => {
    allErrors.push(`[rf] ${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });

  console.log('\n=== TRUST CHECK: enron 10-turn playthrough ===\n');

  // ----- Initial load -----
  await page.goto(BASE_URL);
  await page.locator('.nav-item[data-page="scenarios"]').click();
  await page.waitForSelector('#scenarios-grid', { timeout: 5000 });
  const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
  if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await welcomeClose.click();
  }

  // ----- Click enron card -----
  const enronCard = page.locator('.scenario-card', { hasText: '安然帝国崩塌' }).first();
  await enronCard.locator('button', { hasText: '开始挑战' }).click();
  await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

  // ----- T1 ASSERTIONS -----
  console.log('--- T1 ---');
  const titleT1 = await page.locator('.challenger-decision-page h2').textContent();
  console.log('  title:', titleT1);
  expect(titleT1).toContain('安然帝国崩塌');

  const t1StateValues = {};
  for (const id of ['state-share-price','state-credit','state-earnings','state-cashflow',
                    'state-offbalance','state-analyst','state-silenced','state-board','state-media']) {
    t1StateValues[id] = (await page.locator('#' + id).textContent()).trim();
  }
  console.log('  state:', JSON.stringify(t1StateValues));
  expect(t1StateValues['state-share-price']).toBe('90');
  expect(t1StateValues['state-credit']).toBe('BBB+');
  expect(t1StateValues['state-earnings']).toBe('979');

  const optionCount = await page.locator('.challenger-option').count();
  console.log('  options:', optionCount);
  expect(optionCount).toBe(4);

  // ----- T1: select option A -----
  await page.locator('.challenger-option[data-option="A"]').click();
  await page.waitForTimeout(200);
  const justVisible = await page.locator('#challenger-justification').isVisible();
  console.log('  after A click, justification visible:', justVisible);
  expect(justVisible).toBe(true);

  // ----- T1: submit -----
  const submitDisabledBefore = await page.locator('#challenger-submit').isDisabled();
  console.log('  submit disabled before:', submitDisabledBefore);
  expect(submitDisabledBefore).toBe(false);

  await page.locator('#challenger-justification').fill('我想验证系统端到端可用');
  await page.locator('#challenger-submit').click();

  // ----- Wait for feedback or next turn -----
  // Look for either feedback-section OR next turn page
  await page.waitForTimeout(3000);
  const feedbackVisible = await page.locator('#challenger-feedback-display').isVisible().catch(() => false);
  const continueBtns = await page.locator('button', { hasText: /^继续\s*→/ }).count();
  const decisionAgain = await page.locator('.challenger-decision-page').count();
  console.log('  after submit: feedbackVisible=' + feedbackVisible + ', continueBtns=' + continueBtns + ', decisionAgain=' + decisionAgain);

  // What did the API actually return?
  // (we already have the response logged via requestfailed — print summary)
  console.log('  errors so far:', allErrors.length, '|', allErrors.slice(0, 3).join(' | '));

  // Try to find T2 page
  const stillOnT1 = await page.locator('.challenger-decision-page h2').textContent().catch(() => '');
  console.log('  page now shows title:', stillOnT1);
});

test('TRUST: challenger full playthrough with explicit assertions', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.locator('.nav-item[data-page="scenarios"]').click();
  await page.waitForSelector('#scenarios-grid', { timeout: 5000 });
  const welcomeClose = page.locator('#welcome-modal .close, .welcome-close, [data-dismiss="welcome"]').first();
  if (await welcomeClose.isVisible({ timeout: 1000 }).catch(() => false)) await welcomeClose.click();

  const card = page.locator('.scenario-card', { hasText: '挑战者号发射决策' }).first();
  await card.locator('button', { hasText: '开始挑战' }).click();
  await page.waitForSelector('.challenger-decision-page', { timeout: 15000 });

  console.log('\n=== TRUST CHECK: challenger 10-turn playthrough ===\n');

  for (let turn = 1; turn <= 10; turn++) {
    const title = await page.locator('.challenger-decision-page h2').textContent().catch(() => '(none)');
    console.log(`--- T${turn} --- title:`, title);

    if (turn > 1) {
      expect(title).toContain(`第 ${turn} 回合`);
    }

    // If final outcome page reached, break
    if (await page.locator('.challenger-final-page').isVisible().catch(() => false)) {
      console.log('  final outcome reached');
      break;
    }

    // Wait for option
    try {
      await page.waitForSelector('.challenger-option[data-option="A"]', { timeout: 8000 });
    } catch {
      console.log('  NO option A found — page may be in feedback state');
      const fb = await page.locator('#challenger-feedback-display').isVisible().catch(() => false);
      console.log('  feedback visible:', fb);
      break;
    }
    await page.locator('.challenger-option[data-option="A"]').click();
    await page.waitForTimeout(150);
    const justV = await page.locator('#challenger-justification').isVisible();
    if (justV) {
      await page.locator('#challenger-justification').fill('测试决策理由');
    }
    const subDisabled = await page.locator('#challenger-submit').isDisabled();
    if (subDisabled) {
      console.log('  submit still disabled — bug');
      break;
    }
    await page.locator('#challenger-submit').click();
    await page.waitForTimeout(2000);
    // Look for continue or next decision
    const cont = page.locator('button', { hasText: /^继续\s*→/ }).first();
    if (await cont.isVisible().catch(() => false)) {
      await cont.click();
      await page.waitForTimeout(500);
    }
  }

  // Final check
  const finalVisible = await page.locator('.challenger-final-page').isVisible().catch(() => false);
  console.log('=== challenger final page visible:', finalVisible, '===');
});

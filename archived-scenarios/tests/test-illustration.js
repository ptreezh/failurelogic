const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect ALL console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Collect errors
  const errors = [];
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  // Collect request failures
  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('=== Deep Testing Failure Logic App ===\n');

    // 1. Open the app
    console.log('1. Opening http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);  // Wait for scripts to load
    console.log('   ✓ Page loaded\n');

    // 2. Check page title
    const title = await page.title();
    console.log(`   Page title: ${title}`);

    // 3. Check if NavigationManager exists
    console.log('\n2. Checking JavaScript state...');
    const hasNavManager = await page.evaluate(() => typeof NavigationManager !== 'undefined');
    const hasScenarioIllustrations = await page.evaluate(() => typeof ScenarioIllustrations !== 'undefined');
    const hasAppState = await page.evaluate(() => typeof AppState !== 'undefined');
    console.log(`   NavigationManager: ${hasNavManager ? '✓' : '✗'}`);
    console.log(`   ScenarioIllustrations: ${hasScenarioIllustrations ? '✓' : '✗'}`);
    console.log(`   AppState: ${hasAppState ? '✓' : '✗'}`);

    // 4. Check AppState.scenarios
    const scenariosCount = await page.evaluate(() => {
      return AppState?.scenarios?.length || 0;
    });
    console.log(`   AppState.scenarios count: ${scenariosCount}`);

    // 5. Call loadScenariosPage manually
    console.log('\n3. Manually calling NavigationManager.loadScenariosPage()...');
    await page.evaluate(async () => {
      if (typeof NavigationManager !== 'undefined' && NavigationManager.loadScenariosPage) {
        await NavigationManager.loadScenariosPage();
      }
    });
    await page.waitForTimeout(3000);

    // 6. Check scenarios again
    const scenariosCount2 = await page.evaluate(() => {
      return AppState?.scenarios?.length || 0;
    });
    console.log(`   AppState.scenarios count after load: ${scenariosCount2}`);

    // 7. Check if grid has content
    const gridContent = await page.evaluate(() => {
      const grid = document.getElementById('scenarios-grid');
      return grid ? grid.innerHTML.substring(0, 500) : 'NOT FOUND';
    });
    console.log(`\n4. scenarios-grid content:\n${gridContent}...`);

    // 8. Check for scenario cards
    const cards = await page.locator('.scenario-card').all();
    console.log(`\n5. Found ${cards.length} scenario cards`);

    // 9. Check for SVGs
    const svgs = await page.locator('.scenario-illustration svg').all();
    console.log(`   Found ${svgs.length} SVG illustrations`);

    // 10. Check all console logs
    console.log('\n6. All console logs:');
    consoleLogs.forEach(log => console.log(`   ${log}`));

    // 11. Check failed requests
    if (failedRequests.length > 0) {
      console.log('\n7. Failed requests:');
      failedRequests.forEach(req => console.log(`   ❌ ${req}`));
    }

    // 12. Screenshot
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('\n8. Screenshot saved: test-screenshot.png');

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }

  console.log('\n=== Test Complete ===');
})();
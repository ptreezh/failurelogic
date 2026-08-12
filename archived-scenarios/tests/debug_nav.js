const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.error('Browser error:', error.message);
  });

  await page.goto('http://localhost:8066/');
  await page.waitForTimeout(3000);

  await browser.close();
})();


import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const ROOT = 'D:/AIDevelop/failureLogic';
const PORT = 8177;
const OUT = 'F:/cache/marvis/User/oAN1i2XyfQxkYqw-GOGJ0H1tteIo/workspace/conv_6a106edf62bc4958a9335155f4dc984f/temp/brief-card.png';
const srv = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
await page.click('#start-journey');
await page.waitForTimeout(900);

const info = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.scenario-card')];
  const card = cards.find((n) => n.innerText.includes('老周家牛肉面馆'));
  if (!card) return { found: false, cards: cards.length };
  const el = card.querySelector('.scenario-brief');
  if (!el) return { found: false, why: 'card 无 .scenario-brief', html: card.innerText.slice(0, 200) };
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const li = [...el.querySelectorAll('li')];
  return {
    found: true,
    text: el.innerText,
    bullets: li.map((x) => ({ t: x.innerText, title: x.getAttribute('title') })),
    h: Math.round(r.height), w: Math.round(r.width),
    borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftColor}`,
    impossibleVisible: !!el.querySelector('.brief-impossible'),
    overflow: el.scrollWidth > el.clientWidth + 1,
  };
});
console.log(JSON.stringify(info, null, 2));
console.log('pageerrors', JSON.stringify(errs));
const brief = page.locator('.scenario-card', { hasText: '老周家牛肉面馆' }).locator('.scenario-brief').first();
await brief.screenshot({ path: OUT });
console.log('shot', OUT);
await browser.close();
srv.kill();

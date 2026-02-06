"""
检查前端页面结构
"""

import asyncio
from playwright.async_api import async_playwright

async def check_structure():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = await context.new_page()

        print("📍 访问前端...")
        await page.goto("https://ptreezh.github.io/failurelogic/", wait_until='networkidle')
        await page.wait_for_timeout(3000)

        # 获取页面 HTML
        nav_html = await page.evaluate('''() => {
            const nav = document.querySelector('nav');
            return nav ? nav.innerHTML : 'No nav found';
        }''')

        print("\n📋 导航栏 HTML:")
        print(nav_html[:500])

        # 查找所有链接
        links = await page.evaluate('''() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links.map(a => ({
                href: a.href,
                text: a.textContent.trim().slice(0, 50)
            }));
        }''')

        print(f"\n🔗 找到 {len(links)} 个链接:")
        for link in links[:10]:
            print(f"   - {link['text']} -> {link['href']}")

        # 检查是否有 JavaScript 错误
        errors = []
        page.on('console', lambda msg: print(f"Console: {msg.text}"))
        await page.wait_for_timeout(3000)

        await browser.close()

asyncio.run(check_structure())

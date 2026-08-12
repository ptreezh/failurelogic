import asyncio
from playwright.async_api import async_playwright
import time

async def main():
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False)  # 使用非headless模式以便观察
        page = await browser.new_page()
        
        # 导航到应用
        await page.goto("http://localhost:8080")
        print("已连接到 http://localhost:8080")
        
        # 等待页面加载
        await page.wait_for_timeout(3000)
        
        # 验证页面基本元素
        print("正在验证页面基本元素...")
        title = await page.title()
        print(f"页面标题: {title}")
        
        # 检查导航栏
        nav_links = await page.locator('.nav-link').count()
        if nav_links > 0:
            print(f"✓ 导航栏正常，发现 {nav_links} 个导航项")
        else:
            print("✗ 导航栏异常")
        
        # 点击"场景"导航项以显示所有场景
        await page.locator('a[data-page="scenarios"]').click()
        await page.wait_for_timeout(5000)  # 增加等待时间
        
        # 查看页面源码结构
        print("\n=== 页面HTML结构 ===")
        html_content = await page.content()
        print(html_content[:2000])  # 只打印前2000个字符
        print("...")
        
        # 查找场景列表中的按钮
        print("\n=== 查找场景按钮 ===")
        buttons = await page.locator('button').all()
        for i, button in enumerate(buttons):
            try:
                text = await button.inner_text()
                data_id = await button.get_attribute('data-id')
                print(f"按钮 {i+1}: 文本='{text}', data-id='{data_id}'")
            except Exception as e:
                print(f"按钮 {i+1}: 错误={str(e)}")
        
        # 截图整个页面
        timestamp = int(time.time())
        screenshot_path = f"debug_scenarios_page_{timestamp}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"\n已保存调试截图: {screenshot_path}")
        
        # 等待用户查看
        print("\n页面已打开，请手动检查场景是否正确加载。5秒后关闭浏览器...")
        await page.wait_for_timeout(5000)
        
        # 关闭浏览器
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
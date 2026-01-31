import asyncio
from playwright.async_api import async_playwright
import time

async def main():
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False)  # 使用非headless模式以便观察
        page = await browser.new_page()
        
        # 启用控制台日志记录
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
        
        # 导航到应用
        await page.goto("http://localhost:8080")
        print("已连接到 http://localhost:8080")
        
        # 等待页面加载
        await page.wait_for_timeout(3000)
        
        # 检查控制台是否有错误
        print("\n=== 检查控制台错误 ===")
        
        # 点击"场景"导航项以显示所有场景
        await page.locator('a[data-page="scenarios"]').click()
        await page.wait_for_timeout(5000)
        
        # 检查是否有JavaScript错误
        print("\n=== 检查页面内容 ===")
        content = await page.content()
        if "加载中" in content:
            print("发现'加载中'文本，说明JS正在尝试加载场景")
        else:
            print("未发现'加载中'文本")
        
        # 查看页面源码
        print("\n=== 页面源码片段 ===")
        print(content[:2000])
        print("...")
        
        # 检查是否有错误信息
        error_messages = await page.locator('text="加载失败"').count()
        if error_messages > 0:
            print("发现'加载失败'消息")
        
        # 截图整个页面
        timestamp = int(time.time())
        screenshot_path = f"console_debug_{timestamp}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"\n已保存调试截图: {screenshot_path}")
        
        # 等待用户查看
        print("\n页面已打开，请查看浏览器控制台是否有错误。10秒后关闭浏览器...")
        await page.wait_for_timeout(10000)
        
        # 关闭浏览器
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
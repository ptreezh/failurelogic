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
        
        # 点击"场景"导航项以显示所有场景
        await page.locator('a[data-page="scenarios"]').click()
        await page.wait_for_timeout(5000)  # 增加等待时间
        
        # 检查是否有场景卡片加载
        print("\n=== 检查场景卡片 ===")
        cards = await page.locator('.card').count()
        print(f"找到 {cards} 个卡片")
        
        if cards == 0:
            # 检查是否有场景列表容器
            print("\n=== 检查场景列表容器 ===")
            scenarios_list = await page.locator('#scenarios-list').count()
            print(f"找到 {scenarios_list} 个场景列表容器")
            
            if scenarios_list > 0:
                # 等待内容加载
                await page.wait_for_selector('#scenarios-list .card', timeout=10000)
                cards_after_wait = await page.locator('.card').count()
                print(f"等待后找到 {cards_after_wait} 个卡片")
        
        # 查找所有按钮
        print("\n=== 查找所有按钮 ===")
        buttons = await page.locator('button').count()
        print(f"总共找到 {buttons} 个按钮")
        
        # 获取按钮文本
        button_texts = []
        all_buttons = await page.locator('button').all()
        for i, button in enumerate(all_buttons):
            try:
                text = await button.inner_text()
                button_class = await button.get_attribute('class')
                button_id = await button.get_attribute('data-id')
                button_texts.append((text, button_class, button_id))
                print(f"按钮 {i+1}: 文本='{text}', 类名='{button_class}', data-id='{button_id}'")
            except Exception as e:
                print(f"按钮 {i+1}: 错误={str(e)}")
        
        # 特别查找"开始挑战"按钮
        print("\n=== 查找'开始挑战'按钮 ===")
        start_buttons = await page.locator("text='开始挑战'").count()
        print(f"找到 {start_buttons} 个'开始挑战'按钮")
        
        if start_buttons > 0:
            # 获取这些按钮的data-id属性
            start_button_elements = await page.locator("text='开始挑战'").all()
            for i, btn in enumerate(start_button_elements):
                try:
                    parent = await btn.evaluate_handle("el => el.closest('.card')")
                    if parent:
                        data_id_btn = await parent.query_selector('button[data-id]')
                        if data_id_btn:
                            data_id = await data_id_btn.get_attribute('data-id')
                            print(f"'开始挑战'按钮 {i+1} 对应的data-id: {data_id}")
                except Exception as e:
                    print(f"获取按钮 {i+1} 的data-id 时出错: {str(e)}")
        
        # 截图整个页面
        timestamp = int(time.time())
        screenshot_path = f"detailed_debug_scenarios_page_{timestamp}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"\n已保存详细调试截图: {screenshot_path}")
        
        # 等待用户查看
        print("\n页面已打开，请手动检查场景是否正确加载。10秒后关闭浏览器...")
        await page.wait_for_timeout(10000)
        
        # 关闭浏览器
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
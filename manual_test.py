"""
手动测试场景加载
"""

import asyncio
from playwright.async_api import async_playwright
import time

async def manual_test():
    print("手动测试场景加载...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=500)
        page = await browser.new_page()
        
        # 监听控制台消息
        def console_handler(msg):
            if msg.type == 'log':
                print(f"LOG: {msg.text}")
            elif msg.type == 'warning':
                print(f"WARN: {msg.text}")
            elif msg.type == 'error':
                print(f"ERROR: {msg.text}")
        
        page.on('console', console_handler)
        
        try:
            # 访问页面
            await page.goto("http://localhost:8000", wait_until="domcontentloaded")
            await page.wait_for_timeout(2000)
            
            print("点击场景导航按钮...")
            # 点击场景按钮
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(5000)  # 等待页面切换和数据加载
            
            # 检查页面状态
            scenarios_page_class = await page.evaluate("document.querySelector('#scenarios-page').className")
            print(f"场景页面类名: {scenarios_page_class}")
            
            # 检查网格状态
            grid_display = await page.evaluate("getComputedStyle(document.querySelector('#scenarios-grid')).display")
            grid_visibility = await page.evaluate("getComputedStyle(document.querySelector('#scenarios-grid')).visibility")
            print(f"网格显示状态: {grid_display}, 可见性: {grid_visibility}")
            
            # 检查卡片数量
            card_count = await page.evaluate("document.querySelectorAll('.scenario-card').length")
            print(f"场景卡片数量: {card_count}")
            
            # 检查是否有内容
            grid_content = await page.evaluate("document.querySelector('#scenarios-grid').innerHTML")
            print(f"网格内容长度: {len(grid_content)}")
            if len(grid_content) < 100:
                print(f"网格内容: {grid_content}")
            
            # 尝试手动调用加载函数
            print("尝试手动调用场景加载...")
            try:
                result = await page.evaluate("""
                    async () => {
                        if (window.NavigationManager && typeof window.NavigationManager.loadScenariosPage === 'function') {
                            try {
                                await window.NavigationManager.loadScenariosPage();
                                return 'Load function called successfully';
                            } catch (e) {
                                return 'Error calling load function: ' + e.message;
                            }
                        } else {
                            return 'NavigationManager or loadScenariosPage not found';
                        }
                    }
                """)
                print(f"手动加载结果: {result}")
                
                # 等待一段时间再检查
                await page.wait_for_timeout(3000)
                
                # 再次检查卡片数量
                card_count_after = await page.evaluate("document.querySelectorAll('.scenario-card').length")
                print(f"手动加载后场景卡片数量: {card_count_after}")
                
            except Exception as e:
                print(f"手动调用失败: {e}")
            
            print("等待用户交互...")
            await page.wait_for_timeout(10000)  # 等待用户查看页面
            
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(manual_test())
"""
前端交互测试页面
用于验证前端界面是否正确加载并提供交互功能
"""
import asyncio
from playwright.async_api import async_playwright
import time

async def test_frontend_basic_interactions():
    """测试前端基础交互功能"""
    print("开始前端基础交互测试...")
    
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        print("访问认知陷阱平台...")
        await page.goto("http://localhost:8082/index.html")
        
        # 等待页面加载
        await page.wait_for_timeout(5000)
        
        # 检查页面是否包含主要元素
        try:
            # 检查是否有场景网格
            scenarios_grid_exists = await page.is_visible("text=认知场景")
            if scenarios_grid_exists:
                print("✓ 检测到场景标题")
            else:
                print("⚠ 未找到场景标题，尝试其他元素")
                
            # 检查是否有场景列表或卡片
            has_scenario_elements = await page.locator(".scenario-card, .scenarios-grid, [id*='scenario']").count() > 0
            if has_scenario_elements:
                print("✓ 检测到场景元素")
            else:
                print("⚠ 未检测到场景元素")
                
            # 检查难度选择器
            has_difficulty_selector = await page.locator("#difficulty-level").count() > 0
            if has_difficulty_selector:
                print("✓ 检测到难度选择器")
                
                # 测试难度选择
                await page.select_option("#difficulty-level", "intermediate")
                print("✓ 成功选择中级难度")
                
                await page.select_option("#difficulty-level", "advanced")
                print("✓ 成功选择高级难度")
                
                await page.select_option("#difficulty-level", "beginner")
                print("✓ 成功选择初级难度")
            else:
                print("⚠ 未检测到难度选择器")
                
            # 检查是否有导航元素
            nav_elements = await page.locator("nav, [href], .nav-item, .page-header").count()
            print(f"✓ 检测到 {nav_elements} 个导航相关元素")
            
            # 尝试与第一个挑战按钮交互
            start_buttons = await page.locator("button:has-text('开始')").all()
            if start_buttons:
                print(f"✓ 检测到 {len(start_buttons)} 个开始按钮")
                
                # 点击第一个开始按钮
                if start_buttons:
                    await start_buttons[0].click()
                    print("✓ 成功点击开始按钮")
                    
                    # 等待页面可能的变化
                    await page.wait_for_timeout(2000)
                    
                    # 检查是否有游戏界面显示
                    has_game_content = await page.locator(".game-content, .game-header, #game-container").count() > 0
                    if has_game_content:
                        print("✓ 游戏内容已加载")
                    else:
                        print("⚠ 游戏内容未加载，可能需要更多时间或API响应")
            else:
                print("⚠ 未找到开始挑战按钮")
                
        except Exception as e:
            print(f"❌ 前端交互测试失败: {e}")
            import traceback
            traceback.print_exc()
            
        print("\n前端交互测试完成，保持浏览器打开供手动检查...")
        print("请手动验证以下功能:")
        print("1. 页面是否正确加载")
        print("2. 难度选择器是否正常工作")
        print("3. 场景卡片是否显示正常")
        print("4. 开始挑战按钮是否可点击")
        print("5. 是否能正确与后端API通信")
        
        # 保持浏览器打开30秒供手动检查
        await page.wait_for_timeout(30000)
        
        await browser.close()
        
        return True

if __name__ == "__main__":
    print("启动Playwright前端交互测试...")
    print("此测试将验证前端界面是否正常加载并提供交互功能\n")
    
    try:
        result = asyncio.run(test_frontend_basic_interactions())
        if result:
            print("\n✅ 前端交互测试完成！")
        else:
            print("\n❌ 前端交互测试失败！")
    except Exception as e:
        print(f"❌ 测试执行出错: {e}")
        import traceback
        traceback.print_exc()
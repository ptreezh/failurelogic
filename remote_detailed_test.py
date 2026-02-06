"""
详细测试远程网站的具体交互问题
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime

async def test_remote_specific_issues():
    """
    详细测试用户报告的具体问题：
    1. 场景选择后没有自动跳到下一步
    2. 不能切换
    3. 关闭弹窗再选择别的场景无法再打开弹窗
    """
    print("🧪 详细测试远程网站具体交互问题")
    print("=" * 70)
    
    async with async_playwright() as p:
        print("🔍 启动浏览器...")
        browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=500)
        page = await browser.new_page()
        
        try:
            # 访问远程网站
            url = "https://ptreezh.github.io/failurelogic/"
            print(f"🌐 访问: {url}")
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 导航到场景页面
            print("\n🎯 步骤1: 导航到场景页面")
            scenario_nav = page.locator("[data-page='scenarios']")
            await scenario_nav.click()
            await page.wait_for_timeout(2000)
            print("✅ 导航到场景页面")
            
            # 等待场景卡片加载
            await page.wait_for_selector(".scenario-card", state="visible")
            
            # 测试问题1: 场景选择后是否自动跳到下一步
            print("\n🎯 步骤2: 测试场景选择后是否自动跳到下一步")
            first_scenario = page.locator(".scenario-card").first
            await first_scenario.click()
            print("✅ 点击第一个场景")
            
            # 等待弹窗
            await page.wait_for_selector("#game-modal", state="visible")
            print("✅ 弹窗出现")
            
            # 检查游戏内容是否自动加载
            game_container = page.locator("#game-container")
            content_loaded = await game_container.inner_html()
            print(f"游戏内容长度: {len(content_loaded)} 字符")
            
            if len(content_loaded) > 100:
                print("✅ 游戏内容自动加载")
            else:
                print("❌ 游戏内容未自动加载 - 可能需要手动触发下一步")
            
            # 截图
            await page.screenshot(path="detailed_test_1_after_first_click.png", full_page=True)
            
            # 测试问题2: 关闭弹窗后是否能重新打开
            print("\n🎯 步骤3: 测试关闭弹窗后是否能重新打开")
            close_btn = page.locator("#close-modal")
            await close_btn.click()
            print("✅ 关闭弹窗")
            
            await page.wait_for_timeout(1000)
            
            # 再次点击同一个场景
            print("再次点击第一个场景...")
            await first_scenario.click()
            await page.wait_for_timeout(2000)
            
            modal_visible = await page.locator("#game-modal").is_visible()
            if modal_visible:
                print("✅ 弹窗可以重新打开")
            else:
                print("❌ 弹窗无法重新打开 - 问题复现！")
            
            # 截图
            await page.screenshot(path="detailed_test_2_reopen_attempt.png", full_page=True)
            
            # 测试问题3: 场景切换
            print("\n🎯 步骤4: 测试场景切换功能")
            
            # 关闭弹窗
            if modal_visible:
                await close_btn.click()
                await page.wait_for_timeout(1000)
            
            # 尝试切换到第二个场景
            second_scenario = page.locator(".scenario-card").nth(1)
            second_title = await second_scenario.locator("h3").inner_text()
            print(f"尝试切换到第二个场景: {second_title}")
            
            await second_scenario.click()
            await page.wait_for_timeout(2000)
            
            modal_visible = await page.locator("#game-modal").is_visible()
            if modal_visible:
                print("✅ 场景切换成功")
                
                # 检查游戏内容是否更新
                new_content = await game_container.inner_html()
                if new_content != content_loaded:
                    print("✅ 游戏内容已更新")
                else:
                    print("⚠️ 游戏内容可能未更新")
            else:
                print("❌ 场景切换失败 - 弹窗未打开")
            
            # 截图
            await page.screenshot(path="detailed_test_3_switch_scenario.png", full_page=True)
            
            # 测试问题4: 多次切换场景
            print("\n🎯 步骤5: 测试多次切换场景")
            
            for i in range(3):
                print(f"\n  切换尝试 {i+1}:")
                
                # 关闭弹窗
                if await page.locator("#game-modal").is_visible():
                    await close_btn.click()
                    await page.wait_for_timeout(1000)
                
                # 选择不同场景
                scenario_index = i % 3  # 循环选择前3个场景
                scenario = page.locator(".scenario-card").nth(scenario_index)
                title = await scenario.locator("h3").inner_text()
                print(f"  选择场景: {title}")
                
                await scenario.click()
                await page.wait_for_timeout(1500)
                
                modal_visible = await page.locator("#game-modal").is_visible()
                if modal_visible:
                    print(f"  ✅ 弹窗打开成功")
                else:
                    print(f"  ❌ 弹窗打开失败")
            
            # 截图
            await page.screenshot(path="detailed_test_4_multiple_switches.png", full_page=True)
            
            print("\n" + "=" * 70)
            print("📊 测试完成")
            print("=" * 70)
            
        except Exception as e:
            print(f"\n❌ 测试过程中出现错误: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_remote_specific_issues())
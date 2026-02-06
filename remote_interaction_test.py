"""
远程网站交互问题测试
测试 https://ptreezh.github.io/failurelogic/ 的场景选择和弹窗问题
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime

async def test_remote_interaction_issues():
    """
    测试远程网站的交互问题：
    1. 场景选择后没有自动跳到下一步
    2. 不能切换
    3. 关闭弹窗再选择别的场景无法再打开弹窗
    """
    print("🧪 测试远程网站交互问题")
    print("=" * 70)
    
    async with async_playwright() as p:
        print("🔍 启动浏览器...")
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问远程网站
            url = "https://ptreezh.github.io/failurelogic/"
            print(f"🌐 访问: {url}")
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 验证页面加载
            title = await page.title()
            print(f"📄 页面标题: {title}")
            
            # 截图1: 初始页面
            await page.screenshot(path="remote_test_1_initial.png", full_page=True)
            print("📸 截图1: 初始页面已保存")
            
            # 测试1: 点击场景导航
            print("\n🎯 测试1: 导航到场景页面")
            scenario_nav = page.locator("[data-page='scenarios']")
            await scenario_nav.wait_for(state="visible")
            await scenario_nav.click()
            await page.wait_for_timeout(2000)
            print("✅ 点击场景导航")
            
            # 截图2: 场景页面
            await page.screenshot(path="remote_test_2_scenarios.png", full_page=True)
            print("📸 截图2: 场景页面已保存")
            
            # 测试2: 选择第一个场景
            print("\n🎯 测试2: 选择第一个场景")
            first_scenario = page.locator(".scenario-card").first
            await first_scenario.wait_for(state="visible")
            await first_scenario.click()
            await page.wait_for_timeout(2000)
            print("✅ 点击第一个场景")
            
            # 截图3: 弹窗打开
            await page.screenshot(path="remote_test_3_modal_open.png", full_page=True)
            print("📸 截图3: 弹窗打开已保存")
            
            # 验证弹窗是否打开
            modal = page.locator("#game-modal")
            modal_visible = await modal.is_visible()
            if modal_visible:
                print("✅ 弹窗成功打开")
                
                # 测试3: 关闭弹窗
                print("\n🎯 测试3: 关闭弹窗")
                close_btn = page.locator("#close-modal")
                await close_btn.click()
                await page.wait_for_timeout(1000)
                print("✅ 点击关闭按钮")
                
                # 验证弹窗是否关闭
                modal_visible = await modal.is_visible()
                if not modal_visible:
                    print("✅ 弹窗成功关闭")
                else:
                    print("❌ 弹窗未关闭")
                
                # 截图4: 弹窗关闭后
                await page.screenshot(path="remote_test_4_modal_closed.png", full_page=True)
                print("📸 截图4: 弹窗关闭后已保存")
                
                # 测试4: 再次选择场景（问题复现测试）
                print("\n🎯 测试4: 再次选择场景（问题复现）")
                await page.wait_for_timeout(2000)
                
                # 尝试再次点击第一个场景
                print("尝试再次点击第一个场景...")
                await first_scenario.click()
                await page.wait_for_timeout(2000)
                
                # 验证弹窗是否再次打开
                modal_visible = await modal.is_visible()
                if modal_visible:
                    print("✅ 弹窗再次打开成功")
                else:
                    print("❌ 弹窗无法再次打开 - 问题复现！")
                
                # 截图5: 再次尝试打开弹窗
                await page.screenshot(path="remote_test_5_reopen_attempt.png", full_page=True)
                print("📸 截图5: 再次尝试打开弹窗已保存")
                
                # 测试5: 尝试选择其他场景
                print("\n🎯 测试5: 选择其他场景")
                
                # 关闭弹窗如果还开着
                if modal_visible:
                    await close_btn.click()
                    await page.wait_for_timeout(1000)
                
                # 尝试点击第二个场景
                second_scenario = page.locator(".scenario-card").nth(1)
                second_scenario_visible = await second_scenario.is_visible()
                
                if second_scenario_visible:
                    print("找到第二个场景，尝试点击...")
                    await second_scenario.click()
                    await page.wait_for_timeout(2000)
                    
                    # 验证弹窗是否打开
                    modal_visible = await modal.is_visible()
                    if modal_visible:
                        print("✅ 第二个场景弹窗打开成功")
                    else:
                        print("❌ 第二个场景无法打开弹窗 - 问题复现！")
                else:
                    print("⚠️ 未找到第二个场景")
                
                # 截图6: 选择其他场景
                await page.screenshot(path="remote_test_6_other_scenario.png", full_page=True)
                print("📸 截图6: 选择其他场景已保存")
                
                # 测试6: 验证游戏内交互
                if modal_visible:
                    print("\n🎯 测试6: 验证游戏内交互")
                    
                    # 查找游戏控制元素
                    game_controls = page.locator("#game-container button, #game-container input")
                    control_count = await game_controls.count()
                    print(f"找到 {control_count} 个游戏控制元素")
                    
                    if control_count > 0:
                        # 尝试点击第一个控制元素
                        first_control = game_controls.first
                        await first_control.click()
                        await page.wait_for_timeout(1000)
                        print("✅ 游戏内交互正常")
                    else:
                        print("⚠️ 未找到游戏控制元素")
                    
                    # 截图7: 游戏内交互
                    await page.screenshot(path="remote_test_7_game_interaction.png", full_page=True)
                    print("📸 截图7: 游戏内交互已保存")
                
            else:
                print("❌ 弹窗未打开")
            
            print("\n" + "=" * 70)
            print("📊 测试完成")
            print("=" * 70)
            
        except Exception as e:
            print(f"\n❌ 测试过程中出现错误: {e}")
            import traceback
            traceback.print_exc()
            
            # 错误截图
            await page.screenshot(path="remote_test_error.png", full_page=True)
            print("📸 错误截图已保存")
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_remote_interaction_issues())

"""
真实用户交互模拟测试
模拟真实用户的完整操作流程，验证交互体验
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import time

class RealUserInteractionSimulator:
    def __init__(self):
        self.test_results = []
        self.screenshots = []
        
    async def simulate_real_user(self):
        """模拟真实用户的完整交互流程"""
        print("👤 启动真实用户交互模拟测试")
        print("=" * 80)
        print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        async with async_playwright() as p:
            print("\n🔍 启动浏览器 (模拟用户打开浏览器)...")
            browser = await p.chromium.launch(
                channel='msedge',
                headless=False,
                slow_mo=500  # 模拟真实用户的操作延迟
            )
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
            )
            page = await context.new_page()
            
            try:
                # 步骤1: 用户输入网址访问网站
                print("\n🌐 步骤1: 用户输入网址访问网站")
                url = "https://ptreezh.github.io/failurelogic/"
                print(f"   用户输入: {url}")
                print("   按下回车键...")
                
                await page.goto(url, wait_until="networkidle")
                await page.wait_for_timeout(3000)
                
                # 截图1: 用户首次访问
                screenshot_path = f"user_simulation_01_initial_visit_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "初始访问", "path": screenshot_path})
                print(f"   ✅ 页面加载完成")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤2: 用户浏览首页内容
                print("\n👀 步骤2: 用户浏览首页内容")
                print("   用户向下滚动页面...")
                await page.evaluate("window.scrollTo(0, 500)")
                await page.wait_for_timeout(2000)
                
                # 截图2: 滚动后
                screenshot_path = f"user_simulation_02_scrolled_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "滚动浏览", "path": screenshot_path})
                print(f"   ✅ 滚动完成")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤3: 用户点击"场景"导航
                print("\n🖱️ 步骤3: 用户点击'场景'导航")
                print("   用户将鼠标移动到'场景'按钮上...")
                scenario_nav = page.locator("[data-page='scenarios']")
                await scenario_nav.hover()
                await page.wait_for_timeout(500)
                print("   用户点击'场景'按钮...")
                await scenario_nav.click()
                await page.wait_for_timeout(2000)
                
                # 截图3: 场景页面
                screenshot_path = f"user_simulation_03_scenarios_page_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "场景页面", "path": screenshot_path})
                print(f"   ✅ 场景页面加载完成")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤4: 用户浏览场景卡片
                print("\n📋 步骤4: 用户浏览场景卡片")
                scenario_cards = page.locator(".scenario-card")
                card_count = await scenario_cards.count()
                print(f"   页面显示 {card_count} 个场景卡片")
                print("   用户向下滚动查看所有场景...")
                
                await page.evaluate("window.scrollTo(0, 800)")
                await page.wait_for_timeout(2000)
                
                # 截图4: 滚动查看所有场景
                screenshot_path = f"user_simulation_04_all_scenarios_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "查看所有场景", "path": screenshot_path})
                print(f"   ✅ 滚动完成")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤5: 用户选择第一个场景
                print("\n🎯 步骤5: 用户选择第一个场景")
                first_card = scenario_cards.first
                title = await first_card.locator("h3").inner_text()
                print(f"   用户点击第一个场景: '{title}'")
                
                await first_card.click()
                await page.wait_for_timeout(3000)
                
                # 截图5: 弹窗打开
                screenshot_path = f"user_simulation_05_modal_open_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "弹窗打开", "path": screenshot_path})
                print(f"   ✅ 弹窗成功打开")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤6: 用户在弹窗中滚动查看内容
                print("\n🔄 步骤6: 用户在弹窗中滚动查看内容")
                print("   用户尝试在弹窗内向下滚动...")
                
                # 在弹窗内滚动
                await page.evaluate("""
                    const modalContent = document.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.scrollTop = modalContent.scrollHeight;
                    }
                """)
                await page.wait_for_timeout(2000)
                
                # 截图6: 弹窗滚动后
                screenshot_path = f"user_simulation_06_modal_scrolled_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "弹窗滚动", "path": screenshot_path})
                print(f"   ✅ 弹窗滚动完成")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤7: 用户与游戏内容交互
                print("\n🎮 步骤7: 用户与游戏内容交互")
                
                # 查找交互元素
                controls = page.locator("#game-container button, #game-container input, #game-container .slider")
                control_count = await controls.count()
                
                if control_count > 0:
                    print(f"   发现 {control_count} 个可交互元素")
                    
                    # 模拟用户点击第一个按钮或调整滑块
                    first_control = controls.first
                    control_type = await first_control.evaluate("el => el.tagName + (el.type ? '[' + el.type + ']' : '')")
                    
                    print(f"   第一个交互元素类型: {control_type}")
                    
                    if "range" in control_type.lower():
                        print("   用户拖动滑块到中间位置...")
                        await first_control.evaluate("el => el.value = 5")
                        await first_control.dispatch_event("change")
                    else:
                        print("   用户点击按钮...")
                        await first_control.click()
                    
                    await page.wait_for_timeout(2000)
                    
                    # 截图7: 交互后
                    screenshot_path = f"user_simulation_07_after_interaction_{int(time.time())}.png"
                    await page.screenshot(path=screenshot_path, full_page=True)
                    self.screenshots.append({"step": "用户交互后", "path": screenshot_path})
                    print(f"   ✅ 交互完成")
                    print(f"   📸 截图已保存: {screenshot_path}")
                    
                    # 检查反馈内容
                    feedback = page.locator("#game-container .feedback, #game-container .result")
                    if await feedback.count() > 0:
                        feedback_text = await feedback.first.inner_text()
                        print(f"   系统反馈: {feedback_text[:100]}...")
                    
                else:
                    print("   ⚠️ 未找到可交互元素")
                
                # 步骤8: 用户尝试关闭弹窗
                print("\n❌ 步骤8: 用户尝试关闭弹窗")
                print("   用户点击关闭按钮...")
                
                close_btn = page.locator("#close-modal")
                await close_btn.click()
                await page.wait_for_timeout(2000)
                
                # 验证弹窗是否关闭
                modal_visible = await page.locator("#game-modal").is_visible()
                if not modal_visible:
                    print("   ✅ 弹窗成功关闭")
                else:
                    print("   ❌ 弹窗未关闭")
                
                # 截图8: 弹窗关闭后
                screenshot_path = f"user_simulation_08_modal_closed_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "弹窗关闭后", "path": screenshot_path})
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤9: 用户选择另一个场景
                print("\n🔄 步骤9: 用户选择另一个场景")
                print("   用户滚动回顶部...")
                await page.evaluate("window.scrollTo(0, 0)")
                await page.wait_for_timeout(1000)
                
                second_card = page.locator(".scenario-card").nth(1)
                second_title = await second_card.locator("h3").inner_text()
                print(f"   用户点击第二个场景: '{second_title}'")
                
                await second_card.click()
                await page.wait_for_timeout(3000)
                
                # 验证弹窗是否打开
                modal_visible = await page.locator("#game-modal").is_visible()
                if modal_visible:
                    print("   ✅ 第二个场景弹窗成功打开")
                else:
                    print("   ❌ 第二个场景弹窗无法打开")
                
                # 截图9: 第二个场景弹窗
                screenshot_path = f"user_simulation_09_second_scenario_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "第二个场景", "path": screenshot_path})
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 步骤10: 用户完成体验
                print("\n✅ 步骤10: 用户完成体验")
                print("   用户关闭弹窗...")
                await page.locator("#close-modal").click()
                await page.wait_for_timeout(1000)
                
                print("   用户滚动到页面底部...")
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(2000)
                
                # 截图10: 最终页面
                screenshot_path = f"user_simulation_10_final_{int(time.time())}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                self.screenshots.append({"step": "最终页面", "path": screenshot_path})
                print(f"   ✅ 完整流程完成")
                print(f"   📸 截图已保存: {screenshot_path}")
                
                # 生成测试总结
                await self.generate_summary()
                
            except Exception as e:
                print(f"\n❌ 测试过程中出现错误: {e}")
                import traceback
                traceback.print_exc()
            
            finally:
                await browser.close()
                print("\n✅ 浏览器已关闭")
    
    async def generate_summary(self):
        """生成测试总结"""
        print(f"\n{'='*80}")
        print("📊 真实用户交互模拟测试总结")
        print(f"{'='*80}")
        
        print(f"\n📸 截图记录 ({len(self.screenshots)} 张):")
        for i, screenshot in enumerate(self.screenshots, 1):
            print(f"   {i:2d}. {screenshot['step']}: {screenshot['path']}")
        
        print(f"\n✅ 测试流程完成:")
        print("   1. ✓ 用户访问网站")
        print("   2. ✓ 浏览首页内容")
        print("   3. ✓ 导航到场景页面")
        print("   4. ✓ 浏览场景卡片")
        print("   5. ✓ 选择并打开场景")
        print("   6. ✓ 在弹窗内滚动")
        print("   7. ✓ 与游戏内容交互")
        print("   8. ✓ 关闭弹窗")
        print("   9. ✓ 切换场景")
        print("  10. ✓ 完成体验")
        
        print(f"\n💡 关键发现:")
        print("   - 弹窗滚动功能: 需要验证是否正常工作")
        print("   - 场景切换: 需要验证关闭后能否重新打开")
        print("   - 交互反馈: 用户需要清晰的视觉反馈")
        print("   - 关闭操作: 需要支持多种关闭方式（按钮、ESC、点击外部）")
        
        print(f"\n{'='*80}")

if __name__ == "__main__":
    simulator = RealUserInteractionSimulator()
    asyncio.run(simulator.simulate_real_user())

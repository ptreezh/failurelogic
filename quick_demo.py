"""
Quick Demo for Failure Logic Platform
This script quickly demonstrates the core functionality without extensive waits
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import sys
import os

# Add project path
sys.path.insert(0, os.path.join(os.getcwd()))

async def run_quick_demo():
    """
    Execute quick demonstration of the platform
    """
    print("🎮 启动快速演示")
    print("=" * 50)

    async with async_playwright() as p:
        # Launch Microsoft Edge browser in NON-HEADLESS MODE
        print("🔍 启动Microsoft Edge浏览器...")
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()

        try:
            print(f"🌐 访问前端服务 (时间: {datetime.now().strftime('%H:%M:%S')})")
            await page.goto("http://localhost:8081", wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # Verify homepage loads
            title = await page.title()
            print(f"📄 页面标题: {title}")

            # Wait for main content
            content = await page.content()
            if "Failure Logic" in content or "认知" in content or "陷阱" in content:
                print("✅ 前端界面成功加载")
            
            # Click on scenarios navigation
            print("🚀 导航到场景页面...")
            scenario_nav_button = page.locator("[data-page='scenarios']").first
            await scenario_nav_button.wait_for(state="visible", timeout=5000)
            await scenario_nav_button.click()
            print("✅ 点击场景导航按钮")
            
            await page.wait_for_timeout(2000)
            
            # Count scenarios
            scenario_cards_count = await page.locator('#scenarios-grid .scenario-card').count()
            print(f"📊 发现 {scenario_cards_count} 个可用场景")
            
            if scenario_cards_count > 0:
                # Select first scenario
                first_scenario = page.locator('#scenarios-grid .scenario-card').first
                await first_scenario.scroll_into_view_if_needed()
                await first_scenario.wait_for(state="visible")
                
                # Get scenario info
                scenario_title = await first_scenario.locator('h3, .card-title').first.text_content()
                print(f"📋 选择场景: {scenario_title}")
                
                # Click start button in the card
                start_button = first_scenario.locator("button:has-text('开始挑战')").first
                if await start_button.count() > 0:
                    await start_button.click()
                    print("✅ 点击开始挑战按钮")
                else:
                    # If no start button in card, click the card itself
                    await first_scenario.click()
                    print("✅ 点击场景卡片")
                
                # Wait for game modal
                await page.wait_for_timeout(3000)
                
                # Check if game modal is open
                modal_visible = await page.locator('#game-modal.active').count() > 0
                if modal_visible:
                    print("✅ 游戏模态框已打开")
                    
                    # Look for decision controls
                    decision_controls = await page.locator('.game-slider, input[type="radio"], .choice-btn, button.choice').count()
                    print(f"🖱️ 发现 {decision_controls} 个决策控件")
                    
                    if decision_controls > 0:
                        print("✅ 交互功能正常")
                        
                        # Try to interact with a slider if available
                        sliders = await page.locator('.game-slider').all()
                        if sliders:
                            await sliders[0].set_input_value('50')  # Set slider to middle value
                            print("✅ 与滑块控件交互")
                        
                        # Look for submit button
                        submit_btn = page.locator("#submit-decision, .submit-btn, button:has-text('提交')").first
                        if await submit_btn.count() > 0:
                            await submit_btn.scroll_into_view_if_needed()
                            await submit_btn.wait_for(state="visible")
                            await submit_btn.click()
                            print("✅ 提交决策")
                            
                            await page.wait_for_timeout(2000)
                            
                            # Look for feedback
                            feedback_count = await page.locator('.feedback, .result, .explanation').count()
                            if feedback_count > 0:
                                print("✅ 反馈显示正常")
                            else:
                                print("ℹ️ 未立即看到反馈")
                
            print("🎯 演示步骤完成！")
            print("💡 浏览器将保持开启状态，您可以手动继续体验...")
            
            # Keep browser open for manual interaction
            await asyncio.sleep(30)  # Keep open for 30 seconds
            
        except Exception as e:
            print(f"❌ 演示执行失败: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            print("👋 演示结束")
            # Don't close browser to allow manual interaction

async def main():
    """Main demo function"""
    await run_quick_demo()

if __name__ == "__main__":
    asyncio.run(main())
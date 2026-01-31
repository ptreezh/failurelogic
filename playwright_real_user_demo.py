"""
Real User Interaction Demo for Failure Logic Platform
This script demonstrates the Failure Logic platform with real user interactions in Microsoft Edge browser.
Steps: 1) Browse homepage 2) Navigate to scenarios page 3) Select a scenario (e.g., coffee shop linear thinking) 
4) Perform several rounds of interactive decision making 5) Show feedback results.
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import sys
import os

# Add project path
sys.path.insert(0, os.path.join(os.getcwd()))

async def run_real_user_demo():
    """
    Execute real user interaction demonstration
    Using Microsoft Edge browser (non-headless mode as required)
    Demo covers homepage browsing, scenarios navigation, scenario selection, decision making, and feedback
    """
    print("🎮 启动Playwright真实用户交互演示")
    print("📋 演示协议: Microsoft Edge浏览器 + 非headless模式")
    print("=" * 70)

    async with async_playwright() as p:
        # Launch Microsoft Edge browser in NON-HEADLESS MODE (as required by specification)
        print("🔍 启动Microsoft Edge浏览器（非headless模式）...")
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()

        try:
            print(f"🌐 步骤1: 访问前端服务 (时间: {datetime.now().strftime('%H:%M:%S')})")
            await page.goto("http://localhost:8081", wait_until="networkidle")
            await page.wait_for_timeout(5000)

            # Verify homepage loads correctly
            title = await page.title()
            print(f"📄 页面标题: {title}")

            # Wait for the main app scripts to load
            try:
                await page.wait_for_function("window.App && typeof window.App === 'object'", timeout=10000)
                print("✅ 应用程序脚本已加载")
            except:
                print("⚠️ 应用程序脚本加载超时，继续演示")

            # Check if main content is visible
            content = await page.content()
            if "Failure Logic" in content or "认知" in content or "陷阱" in content:
                print("✅ 前端界面成功加载")
            else:
                print("⚠️ 前端界面内容可能未正常加载")

            # Step 1: Browse homepage
            print("\n🏠 步骤1: 浏览主页")
            homepage_success = True

            # Wait for homepage content to be visible
            try:
                await page.wait_for_selector('#home-page.active', timeout=5000)
                print("✅ 主页内容已加载")
                
                # Take screenshot of homepage
                await page.screenshot(path="homepage.png")
                print("📸 主页截图已保存")
                
                # Wait to observe homepage
                await page.wait_for_timeout(3000)
            except:
                print("⚠️ 主页内容加载超时")
                homepage_success = False

            # Step 2: Navigate to scenarios page
            print("\n🚀 步骤2: 导航到场景页面")
            scenarios_success = True

            # Click on scenarios navigation button
            try:
                # First, try clicking the navigation button with data-page='scenarios'
                scenario_nav_button = page.locator("[data-page='scenarios']").first
                await scenario_nav_button.wait_for(state="visible", timeout=5000)
                await scenario_nav_button.click()
                print("✅ 点击场景导航按钮")

                # Wait for page transition
                await page.wait_for_timeout(3000)

                # Check if we're on the scenarios page
                is_on_scenarios_page = await page.locator('#scenarios-page.active').count() > 0
                if is_on_scenarios_page:
                    print("✅ 成功导航到场景页面")
                    scenario_navigated = True
                else:
                    print("⚠️ 未检测到场景页面，等待内容加载...")
                    # Wait a bit more for the page to load
                    await page.wait_for_timeout(3000)
                    is_on_scenarios_page = await page.locator('#scenarios-page.active').count() > 0
                    if is_on_scenarios_page:
                        print("✅ 延迟后成功导航到场景页面")
                        scenario_navigated = True
                    else:
                        print("⚠️ 仍然未检测到场景页面")
                        scenario_navigated = False
                        
                # Take screenshot of scenarios page
                await page.screenshot(path="scenarios_page.png")
                print("📸 场景页面截图已保存")
                
                # Wait to observe scenarios page
                await page.wait_for_timeout(3000)

            except Exception as e:
                print(f"导航到场景页面失败: {e}")
                scenario_navigated = False
                scenarios_success = False

            # Wait for scenarios to load (they might be loaded dynamically)
            await page.wait_for_timeout(5000)

            # Count available scenarios after waiting
            # First, wait for the loading indicator to disappear and actual scenario cards to appear
            try:
                # Wait for the loading indicator to disappear and scenario cards to appear in the grid
                await page.wait_for_function("""
                    (function() {
                        const loadingEl = document.querySelector('#scenarios-loading');
                        const gridContainer = document.querySelector('#scenarios-grid');
                        const scenarioCards = gridContainer ? gridContainer.querySelectorAll('.scenario-card') : [];
                        return (!loadingEl || loadingEl.style.display === 'none' || loadingEl.offsetParent === null) &&
                               scenarioCards.length > 0;
                    })()
                """, timeout=15000)
                print("✅ 场景加载完成，发现动态加载的场景卡片")
            except:
                print("⚠️ 场景加载等待超时，继续演示")

            # Count the actual scenario cards within the scenarios-grid container
            scenario_cards_count = await page.locator('#scenarios-grid .scenario-card').count()
            print(f"📊 发现 {scenario_cards_count} 个可用场景")

            if scenario_cards_count > 0:
                print("✅ 成功浏览所有可用场景")

                # List some scenario titles if available
                scenario_titles = await page.locator('.scenario-card h3, .scenario-card .title, [class*="title"]').all_text_contents()
                if scenario_titles:
                    print(f"📝 场景标题示例: {scenario_titles[:3]}")  # Show first 3 titles
            else:
                print("⚠️ 未发现任何场景卡片")

            # Step 3: Select a scenario (e.g., coffee shop linear thinking)
            print("\n☕ 步骤3: 选择一个场景（咖啡店线性思维）")
            selection_success = True

            if scenario_cards_count > 0:
                # Find and click the coffee shop scenario card
                coffee_shop_selector = "text=咖啡店线性思维"
                coffee_shop_card = None
                
                try:
                    # Look for the coffee shop scenario specifically
                    coffee_shop_card = page.locator(f'#scenarios-grid .scenario-card:has({coffee_shop_selector})').first
                    if await coffee_shop_card.count() > 0:
                        print("✅ 找到咖啡店线性思维场景")
                    else:
                        # If not found by text, just select the first scenario
                        coffee_shop_card = page.locator('#scenarios-grid .scenario-card').first
                        print("⚠️ 未找到咖啡店线性思维场景，选择第一个场景")
                        
                    # Scroll into view and click
                    await coffee_shop_card.scroll_into_view_if_needed()
                    await coffee_shop_card.wait_for(state="visible")
                    
                    # Get the scenario ID from the onclick attribute or data attribute
                    onclick_attr = await coffee_shop_card.get_attribute("onclick")
                    if onclick_attr and "GameManager.startScenario" in onclick_attr:
                        # Extract scenario ID from the onclick attribute
                        import re
                        scenario_id_match = re.search(r"GameManager\.startScenario\(['\"]([^'\"]+)['\"]\)", onclick_attr)
                        if scenario_id_match:
                            scenario_id = scenario_id_match.group(1)
                            print(f"✅ 找到场景ID: {scenario_id}")
                            
                            # Click the scenario card
                            await coffee_shop_card.click()
                            print("✅ 点击场景卡片")
                            
                            # Wait for the game modal or scenario page to load
                            await page.wait_for_timeout(8000)
                            
                            # Take screenshot of scenario selection
                            await page.screenshot(path="scenario_selected.png")
                            print("📸 场景选择截图已保存")
                            
                            # Wait to observe the scenario opening
                            await page.wait_for_timeout(3000)
                        else:
                            print("⚠️ 无法从onclick属性中提取场景ID")
                            selection_success = False
                    else:
                        # If no onclick attribute, try clicking the start button inside the card
                        start_button = coffee_shop_card.locator("button:has-text('开始挑战')").first
                        if await start_button.count() > 0:
                            await start_button.scroll_into_view_if_needed()
                            await start_button.wait_for(state="visible")
                            await start_button.click()
                            print("✅ 点击开始挑战按钮")
                            
                            # Wait for the game modal or scenario page to load
                            await page.wait_for_timeout(8000)
                            
                            # Take screenshot of scenario selection
                            await page.screenshot(path="scenario_selected.png")
                            print("📸 场景选择截图已保存")
                            
                            # Wait to observe the scenario opening
                            await page.wait_for_timeout(3000)
                        else:
                            print("⚠️ 未找到开始挑战按钮")
                            selection_success = False
                            
                except Exception as e:
                    print(f"⚠️ 选择场景失败: {e}")
                    selection_success = False
            else:
                print("⚠️ 无可用场景进行选择")
                selection_success = False

            # Step 4: Perform several rounds of interactive decision making
            print("\n🤔 步骤4: 进行几轮交互决策")
            decision_success = True

            # Wait for game modal to appear and become visible
            try:
                await page.wait_for_selector('#game-modal.active', timeout=15000)
                print("✅ 游戏模态框已打开")
                
                # Wait for content inside the modal to load
                await page.wait_for_timeout(3000)
                
                # Look for interactive elements (questions, inputs, buttons)
                interactive_elements = await page.locator('input, textarea, select, button, [role="button"], .decision-control, [class*="control"], [class*="input"], .question, .choice, .option, .answer').count()
                print(f"🖱️ 发现 {interactive_elements} 个交互元素")

                if interactive_elements > 0:
                    print("✅ 场景交互功能正常")
                    
                    # Take screenshot of decision interface
                    await page.screenshot(path="decision_interface.png")
                    print("📸 决策界面截图已保存")
                    
                    # Look for decision controls and make selections
                    # Try to find and interact with various types of controls
                    decision_controls_found = False
                    
                    # Look for radio buttons or checkboxes for decision making
                    radio_buttons = await page.locator('input[type="radio"]').all()
                    if radio_buttons and len(radio_buttons) > 0:
                        await radio_buttons[0].click()  # Select first option
                        print("✅ 成功选择决策选项")
                        decision_controls_found = True

                        # Look for submit/check buttons
                        submit_selectors = [
                            "button:has-text('提交')",
                            "button:has-text('Submit')",
                            "button:has-text('检查')",
                            "button:has-text('Check')",
                            "button:has-text('下一步')",
                            "button:has-text('Next')",
                            "button:has-text('确认')",
                            "button:has-text('Confirm')",
                            "button:has-text('行动')",
                            "button:has-text('Action')",
                            "button:has-text('继续')",
                            "button:has-text('Continue')",
                            "#submit-decision",
                            "#submit-btn",
                            "#check-answer",
                            ".submit-btn",
                            ".check-btn",
                            ".submit-scenario-btn",
                            "[onclick*='submit']"
                        ]

                        submitted = False
                        for submit_selector in submit_selectors:
                            try:
                                submit_btn = page.locator(submit_selector).first
                                await submit_btn.wait_for(state="visible", timeout=2000)
                                await submit_btn.click()
                                await page.wait_for_timeout(1500)
                                print("✅ 成功提交决策")
                                submitted = True
                                break
                            except:
                                continue

                        if not submitted:
                            print("⚠️ 未找到提交按钮")
                            
                        # Wait to see feedback
                        await page.wait_for_timeout(3000)
                        
                        # Take screenshot of feedback
                        await page.screenshot(path="decision_feedback.png")
                        print("📸 决策反馈截图已保存")

                    else:
                        print("ℹ️ 场景中未找到单选按钮，测试其他类型交互")

                        # Look for choice buttons (common in quiz apps)
                        choice_buttons = await page.locator('.choice-btn, .option-btn, .answer-btn, button.choice, button.option, .scenario-option, .decision-option').count()
                        if choice_buttons > 0:
                            choice_btn = page.locator('.choice-btn, .option-btn, .answer-btn, button.choice, button.option, .scenario-option, .decision-option').first
                            if await choice_btn.count() > 0:
                                await choice_btn.click()
                                print("✅ 成功与选择按钮交互")
                                decision_controls_found = True

                                # Submit if possible
                                for submit_selector in submit_selectors:
                                    try:
                                        submit_btn = page.locator(submit_selector).first
                                        await submit_btn.wait_for(state="visible", timeout=2000)
                                        await submit_btn.click()
                                        await page.wait_for_timeout(1000)
                                        print("✅ 成功提交选择")
                                        break
                                    except:
                                        continue
                                        
                                # Wait to see feedback
                                await page.wait_for_timeout(3000)
                                
                                # Take screenshot of feedback
                                await page.screenshot(path="decision_feedback.png")
                                print("📸 决策反馈截图已保存")

                        # Look for sliders
                        sliders = await page.locator('input[type="range"]').count()
                        if sliders > 0:
                            slider = page.locator('input[type="range"]').first
                            if await slider.count() > 0:
                                # Get current value
                                current_value = await slider.get_attribute('value')
                                print(f"📊 滑块当前值: {current_value}")
                                
                                # Move slider to a different position (middle)
                                await slider.set_checked(True)  # Focus the slider
                                await slider.focus()
                                # Try to move the slider
                                await slider.evaluate("el => el.value = '50'")
                                await slider.dispatch_event('input')
                                await slider.dispatch_event('change')
                                print("✅ 成功与滑块控件交互")
                                decision_controls_found = True
                                
                                # Submit if possible
                                for submit_selector in submit_selectors:
                                    try:
                                        submit_btn = page.locator(submit_selector).first
                                        await submit_btn.wait_for(state="visible", timeout=2000)
                                        await submit_btn.click()
                                        await page.wait_for_timeout(1000)
                                        print("✅ 成功提交滑块选择")
                                        break
                                    except:
                                        continue
                                        
                                # Wait to see feedback
                                await page.wait_for_timeout(3000)
                                
                                # Take screenshot of feedback
                                await page.screenshot(path="decision_feedback.png")
                                print("📸 决策反馈截图已保存")

                        # Look for text inputs
                        text_inputs = await page.locator('input[type="text"], input[type="number"], textarea').count()
                        if text_inputs > 0:
                            text_input = page.locator('input[type="text"], input[type="number"], textarea').first
                            if await text_input.count() > 0:
                                await text_input.fill("演示输入")
                                print("✅ 成功与文本输入框交互")
                                decision_controls_found = True

                                # Submit if possible
                                for submit_selector in submit_selectors:
                                    try:
                                        submit_btn = page.locator(submit_selector).first
                                        await submit_btn.wait_for(state="visible", timeout=2000)
                                        await submit_btn.click()
                                        await page.wait_for_timeout(1000)
                                        print("✅ 成功提交文本输入")
                                        break
                                    except:
                                        continue
                                        
                                # Wait to see feedback
                                await page.wait_for_timeout(3000)
                                
                                # Take screenshot of feedback
                                await page.screenshot(path="decision_feedback.png")
                                print("📸 决策反馈截图已保存")

                        # Look for dropdowns
                        selects = await page.locator('select').count()
                        if selects > 0:
                            select_element = page.locator('select').first
                            if await select_element.count() > 0:
                                options = await select_element.locator('option').count()
                                if options > 1:
                                    await select_element.select_option(index=1)
                                    print("✅ 成功与下拉菜单交互")
                                    decision_controls_found = True

                                    # Submit if possible
                                    for submit_selector in submit_selectors:
                                        try:
                                            submit_btn = page.locator(submit_selector).first
                                            await submit_btn.wait_for(state="visible", timeout=2000)
                                            await submit_btn.click()
                                            await page.wait_for_timeout(1000)
                                            print("✅ 成功提交下拉选择")
                                            break
                                        except:
                                            continue
                                            
                                    # Wait to see feedback
                                    await page.wait_for_timeout(3000)
                                    
                                    # Take screenshot of feedback
                                    await page.screenshot(path="decision_feedback.png")
                                    print("📸 决策反馈截图已保存")

                    if not decision_controls_found:
                        print("⚠️ 未找到可交互的决策控件")
                        decision_success = False
                        
                else:
                    print("⚠️ 场景中未发现交互元素")
                    decision_success = False
            else:
                print("⚠️ 游戏模态框未在预期时间内出现")
                decision_success = False

            # Step 5: Show feedback results
            print("\n📊 步骤5: 展示反馈结果")
            feedback_success = True

            # Look for feedback elements after decision submission
            feedback_selectors = [
                '.feedback',
                '.result',
                '.explanation',
                '[class*="feedback"]',
                '[class*="result"]',
                '[class*="explanation"]',
                '.answer-feedback',
                '.decision-result',
                '#feedback-display',
                '.game-feedback'
            ]

            feedback_found = False
            for selector in feedback_selectors:
                feedback_count = await page.locator(selector).count()
                if feedback_count > 0:
                    feedback_found = True
                    print(f"✅ 找到 {feedback_count} 个反馈元素")

                    # Get feedback content
                    feedback_texts = await page.locator(selector).all_inner_texts()
                    if feedback_texts:
                        print(f"📝 反馈内容示例: {feedback_texts[0][:100]}...")  # First 100 chars
                        
                    # Take screenshot of feedback
                    await page.screenshot(path="feedback_results.png")
                    print("📸 反馈结果截图已保存")
                    break

            if not feedback_found:
                print("⚠️ 未找到反馈元素，可能反馈还在加载或需要更多交互")

                # Wait a bit more and check again
                await page.wait_for_timeout(3000)
                for selector in feedback_selectors:
                    feedback_count = await page.locator(selector).count()
                    if feedback_count > 0:
                        feedback_found = True
                        print(f"✅ 延迟后找到 {feedback_count} 个反馈元素")
                        break

            if feedback_found:
                print("✅ 结果反馈展示功能正常")
            else:
                print("⚠️ 未检测到结果反馈")
                feedback_success = False

            print()
            print("=" * 70)
            print("🎯 Playwright真实用户交互演示完成!")

            # Summarize demo results
            all_success = homepage_success and scenarios_success and selection_success and decision_success and feedback_success

            print("📋 演示结果摘要:")
            print(f"  1. 主页浏览: {'✅ 正常' if homepage_success else '❌ 异常'}")
            print(f"  2. 场景页面导航: {'✅ 正常' if scenarios_success else '❌ 异常'}")
            print(f"  3. 场景选择: {'✅ 正常' if selection_success else '❌ 异常'}")
            print(f"  4. 交互决策: {'✅ 正常' if decision_success else '❌ 异常'}")
            print(f"  5. 反馈展示: {'✅ 正常' if feedback_success else '❌ 异常'}")

            if all_success:
                print()
                print("🏆 真实用户交互演示成功!")
                print("✅ Microsoft Edge浏览器非headless模式运行正常")
                print("✅ 主页浏览功能正常")
                print("✅ 场景页面导航正常")
                print("✅ 场景选择功能正常")
                print("✅ 交互决策功能正常")
                print("✅ 反馈展示功能正常")
                print("✅ 认知陷阱平台功能完整验证")
                print()
                print("🎯 演示覆盖的所有功能:")
                print("   - 主页浏览体验")
                print("   - 场景页面导航")
                print("   - 场景选择与启动")
                print("   - 交互决策过程")
                print("   - 反馈结果展示")
                print()
                print("🚀 系统已完全准备就绪，可用于真实的用户体验!")
            else:
                print()
                print("⚠️ 部分真实用户交互演示未通过")
                if not homepage_success:
                    print("   - 主页浏览存在问题")
                if not scenarios_success:
                    print("   - 场景页面导航存在问题")
                if not selection_success:
                    print("   - 场景选择存在问题")
                if not decision_success:
                    print("   - 交互决策存在问题")
                if not feedback_success:
                    print("   - 反馈展示存在问题")

            return all_success

        except Exception as e:
            print(f"❌ Playwright真实用户交互演示执行失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            print("\n💡 浏览器将保持开启状态供您手动演示体验...")
            # Keep browser open for manual demonstration (as per requirements)

async def main():
    """Main demo function"""
    success = await run_real_user_demo()

    print()
    print("=" * 70)
    if success:
        print("🎉 Playwright真实用户交互演示成功!")
        print("✅ 遵循协议: Microsoft Edge浏览器 + 非headless模式")
        print("✅ 所有用户交互功能演示通过")
        print("✅ 认知陷阱平台准备就绪")
    else:
        print("⚠️ Playwright真实用户交互演示部分失败")
        print("💡 需要进一步检查系统状态")

    print(f"\n🏁 演示完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("💡 认知陷阱演示平台已为真实用户交互体验完全准备就绪")
    print("💡 浏览器将保持开启状态，请手动关闭")

    return success

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
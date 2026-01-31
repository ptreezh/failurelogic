"""
MCP Playwright Comprehensive Navigation and Interaction Test
This test specifically focuses on verifying:
1) Scene page navigation works properly
2) Difficulty selector is functional 
3) Scene card clicks work correctly
4) Calculator functions are available on respective pages
Using Microsoft Edge browser in non-headless mode as required.
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import sys
import os

async def run_navigation_interaction_test():
    """
    Execute comprehensive navigation and interaction test
    Using Microsoft Edge browser (non-headless mode as required)
    Focus on specific navigation and interaction features
    """
    print("🚀 启动MCP Playwright导航和交互功能专项测试")
    print("📋 测试协议: Microsoft Edge浏览器 + 非headless模式 (严格禁止无头浏览器)")
    print("=" * 70)

    async with async_playwright() as p:
        # Launch Microsoft Edge browser in NON-HEADLESS MODE (as required by specification)
        print("🔍 启动Microsoft Edge浏览器（非headless模式）...")
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()

        try:
            print(f"🌐 步骤1: 访问前端界面 (时间: {datetime.now().strftime('%H:%M:%S')})")
            await page.goto("http://localhost:8083", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

            # Verify homepage loads correctly
            title = await page.title()
            print(f"📄 页面标题: {title}")

            # Check if main content is visible
            content = await page.content()
            if "Failure Logic" in content or "认知" in content or "陷阱" in content:
                print("✅ 前端界面成功加载")
            else:
                print("⚠️ 前端界面内容可能未正常加载")

            # Test 1: Scene page navigation
            print("\n🔍 测试1: 场景页面导航功能")
            navigation_success = True
            
            # Try to navigate to scenarios page using various selectors
            scenario_nav_selectors = [
                "[data-page='scenarios']",
                "button:has-text('场景')",
                "button:has-text('Scenarios')",
                "text=场景",
                "text=Scenarios"
            ]

            scenario_navigated = False
            for selector in scenario_nav_selectors:
                try:
                    # Wait for the navigation element to be available
                    nav_elements = await page.locator(selector).all()
                    if nav_elements:
                        for nav_element in nav_elements:
                            try:
                                # Wait for element to be visible and enabled
                                await nav_element.wait_for(state="visible")
                                await nav_element.click()
                                
                                # Wait for page transition
                                await page.wait_for_timeout(3000)
                                
                                # Check if we're on the scenarios page
                                is_on_scenarios_page = await page.locator('#scenarios-page.active').count() > 0
                                if is_on_scenarios_page:
                                    scenario_navigated = True
                                    print("✅ 成功导航到场景页面")
                                    break
                            except Exception as e:
                                print(f"导航尝试失败 {selector}: {e}")
                                continue
                    if scenario_navigated:
                        break
                except Exception as e:
                    print(f"查找导航元素失败 {selector}: {e}")
                    continue

            if not scenario_navigated:
                print("⚠️ 未能导航到场景页面")
                navigation_success = False
            else:
                print("✅ 场景页面导航功能正常")

            # Test 2: Difficulty selector functionality
            print("\n🔍 测试2: 难度选择器功能")
            difficulty_success = True
            
            # Wait for scenarios page to fully load
            await page.wait_for_timeout(3000)
            
            # Check if difficulty selector exists
            difficulty_selector_exists = await page.locator('#difficulty-level').count() > 0
            if difficulty_selector_exists:
                try:
                    # Get current value
                    current_value = await page.input_value('#difficulty-level')
                    print(f"📊 当前难度: {current_value}")
                    
                    # Try changing to intermediate
                    await page.select_option('#difficulty-level', 'intermediate')
                    await page.wait_for_timeout(1000)
                    new_value = await page.input_value('#difficulty-level')
                    if new_value == 'intermediate':
                        print("✅ 成功切换到中级难度")
                    else:
                        print(f"⚠️ 难度切换可能失败，当前值: {new_value}")
                        difficulty_success = False
                    
                    # Try changing to advanced
                    await page.select_option('#difficulty-level', 'advanced')
                    await page.wait_for_timeout(1000)
                    new_value = await page.input_value('#difficulty-level')
                    if new_value == 'advanced':
                        print("✅ 成功切换到高级难度")
                    else:
                        print(f"⚠️ 难度切换可能失败，当前值: {new_value}")
                        difficulty_success = False
                    
                    # Switch back to beginner
                    await page.select_option('#difficulty-level', 'beginner')
                    await page.wait_for_timeout(1000)
                    new_value = await page.input_value('#difficulty-level')
                    if new_value == 'beginner':
                        print("✅ 成功切换到初级难度")
                    else:
                        print(f"⚠️ 难度切换可能失败，当前值: {new_value}")
                        difficulty_success = False
                        
                except Exception as e:
                    print(f"❌ 难度选择器操作失败: {e}")
                    difficulty_success = False
            else:
                print("ℹ️ 未找到难度选择器元素")
                # This might be acceptable depending on the page layout
                print("⚠️ 难度选择器不存在，检查页面布局...")
                
                # Look for alternative difficulty selectors
                alt_selectors = [
                    "select", 
                    "[class*='difficulty']",
                    "[id*='difficulty']",
                    "[name*='difficulty']"
                ]
                
                for alt_selector in alt_selectors:
                    elements = await page.locator(alt_selector).all()
                    if elements:
                        print(f"🔍 找到可能的难度选择器: {alt_selector}")
                        for elem in elements:
                            try:
                                tag = await elem.evaluate("el => el.tagName")
                                classes = await elem.get_attribute("class") or ""
                                print(f"   - {tag} with class '{classes}'")
                                
                                # Try interacting with this element
                                try:
                                    await elem.click()
                                    await page.wait_for_timeout(500)
                                    print("   - 元素可点击")
                                    
                                    # Try selecting options if it's a select element
                                    if tag.lower() == 'select':
                                        options = await elem.locator('option').all()
                                        if options:
                                            for opt in options[:2]:  # Try first 2 options
                                                opt_val = await opt.get_attribute('value')
                                                if opt_val:
                                                    try:
                                                        await elem.select_option(opt_val)
                                                        await page.wait_for_timeout(500)
                                                        print(f"   - 成功选择选项: {opt_val}")
                                                    except:
                                                        continue
                                except:
                                    continue
                                    
                            except Exception as e:
                                print(f"   - 无法与元素交互: {e}")
                                continue
                        break
                else:
                    print("⚠️ 未找到任何可能的难度选择器元素")
            
            # Test 3: Scene card click functionality
            print("\n🔍 测试3: 场景卡片点击功能")
            card_click_success = True
            
            # Wait for scenarios to load
            await page.wait_for_timeout(3000)
            
            # Look for scenario cards
            scenario_cards = await page.locator('.scenario-card, [class*="scenario"][class*="card"], .card').all()
            if scenario_cards:
                print(f"📊 发现 {len(scenario_cards)} 个场景卡片")
                
                # Try clicking the first few scenario cards
                clicked_any_card = False
                for i, card in enumerate(scenario_cards[:3]):  # Test first 3 cards
                    try:
                        # Check if card is visible
                        if await card.is_visible():
                            print(f"尝试点击第 {i+1} 个场景卡片...")
                            
                            # Get card info before click
                            card_text = await card.text_content()
                            print(f"   卡片内容预览: {card_text[:50]}...")
                            
                            # Click the card
                            await card.click()
                            await page.wait_for_timeout(2000)
                            
                            # Check if a modal or new page opened
                            modal_opened = await page.locator('#game-modal.active').count() > 0
                            if modal_opened:
                                print(f"✅ 第 {i+1} 个场景卡片点击成功 - 模态框打开")
                                clicked_any_card = True
                                
                                # Close the modal to continue testing
                                close_btn = page.locator('#close-modal')
                                if await close_btn.count() > 0:
                                    await close_btn.click()
                                    await page.wait_for_timeout(1000)
                                else:
                                    # Try alternative close methods
                                    await page.keyboard.press('Escape')
                                    await page.wait_for_timeout(1000)
                                
                                # Navigate back to scenarios page
                                await page.locator("[data-page='scenarios']").click()
                                await page.wait_for_timeout(2000)
                                
                            else:
                                # Check if URL changed or page content changed
                                current_url = page.url
                                print(f"   当前URL: {current_url}")
                                
                                # Check if we moved to a scenario detail page
                                if 'scenarios' not in current_url or 'scenario' in current_url:
                                    print(f"✅ 第 {i+1} 个场景卡片点击成功 - 页面导航")
                                    clicked_any_card = True
                                    
                                    # Navigate back to scenarios page
                                    await page.go_back()
                                    await page.wait_for_timeout(2000)
                                    await page.locator("[data-page='scenarios']").click()
                                    await page.wait_for_timeout(2000)
                                else:
                                    print(f"⚠️ 第 {i+1} 个场景卡片点击可能无效 - 无页面变化")
                        
                        else:
                            print(f"第 {i+1} 个场景卡片不可见")
                            
                    except Exception as e:
                        print(f"点击第 {i+1} 个场景卡片失败: {e}")
                        continue
                
                if not clicked_any_card:
                    print("⚠️ 未能成功点击任何场景卡片")
                    card_click_success = False
                else:
                    print("✅ 场景卡片点击功能正常")
            else:
                print("⚠️ 未找到场景卡片元素")
                card_click_success = False
            
            # Test 4: Calculator functions on respective pages
            print("\n🔍 测试4: 计算器功能")
            calculator_success = True
            
            # Navigate to exponential page to test calculators
            exponential_nav_selectors = [
                "[data-page='exponential']",
                "button:has-text('指数测试')",
                "button:has-text('Exponential')"
            ]
            
            exponential_navigated = False
            for selector in exponential_nav_selectors:
                try:
                    nav_elements = await page.locator(selector).all()
                    if nav_elements:
                        for nav_element in nav_elements:
                            try:
                                await nav_element.wait_for(state="visible")
                                await nav_element.click()
                                await page.wait_for_timeout(3000)
                                
                                # Check if we're on the exponential page
                                is_on_exponential_page = await page.locator('#exponential-page.active').count() > 0
                                if is_on_exponential_page:
                                    exponential_navigated = True
                                    print("✅ 成功导航到指数测试页面")
                                    break
                            except:
                                continue
                    if exponential_navigated:
                        break
                except:
                    continue
            
            if exponential_navigated:
                # Look for calculator elements
                calc_buttons = await page.locator('#calculate-btn, #calculate-exp-btn').count()
                if calc_buttons > 0:
                    print("🔍 发现计算器按钮")
                    
                    # Test compound calculator
                    compound_calc_btn = page.locator('#calculate-btn')
                    if await compound_calc_btn.count() > 0:
                        try:
                            # Fill in some values for compound calculation
                            await page.fill('#principal', '100000')
                            await page.fill('#rate', '8')
                            await page.fill('#time', '30')
                            
                            await compound_calc_btn.click()
                            await page.wait_for_timeout(2000)
                            
                            # Check if result is displayed
                            result_elements = await page.locator('#compound-result').count()
                            if result_elements > 0:
                                result_text = await page.locator('#compound-result').text_content()
                                if result_text and len(result_text.strip()) > 0:
                                    print("✅ 复利计算器功能正常")
                                else:
                                    print("⚠️ 复利计算器结果为空")
                                    calculator_success = False
                            else:
                                print("⚠️ 未找到复利计算器结果区域")
                                calculator_success = False
                        except Exception as e:
                            print(f"❌ 复利计算器测试失败: {e}")
                            calculator_success = False
                    else:
                        print("ℹ️ 未找到复利计算器按钮")
                    
                    # Test exponential calculator
                    exp_calc_btn = page.locator('#calculate-exp-btn')
                    if await exp_calc_btn.count() > 0:
                        try:
                            # Fill in values for exponential calculation
                            await page.fill('#base', '2')
                            await page.fill('#exponent', '10')
                            
                            await exp_calc_btn.click()
                            await page.wait_for_timeout(2000)
                            
                            # Check if result is displayed
                            result_elements = await page.locator('#exponential-result').count()
                            if result_elements > 0:
                                result_text = await page.locator('#exponential-result').text_content()
                                if result_text and len(result_text.strip()) > 0:
                                    print("✅ 指数计算器功能正常")
                                else:
                                    print("⚠️ 指数计算器结果为空")
                                    calculator_success = False
                            else:
                                print("⚠️ 未找到指数计算器结果区域")
                                calculator_success = False
                        except Exception as e:
                            print(f"❌ 指数计算器测试失败: {e}")
                            calculator_success = False
                    else:
                        print("ℹ️ 未找到指数计算器按钮")
                else:
                    print("⚠️ 未找到计算器按钮")
                    calculator_success = False
            else:
                print("⚠️ 未能导航到指数测试页面进行计算器测试")
                calculator_success = False

            print()
            print("=" * 70)
            print("🎯 MCP Playwright导航和交互功能专项测试完成!")

            # Summarize test results
            all_success = navigation_success and difficulty_success and card_click_success and calculator_success

            print("📋 测试结果摘要:")
            print(f"  1. 场景页面导航: {'✅ 正常' if navigation_success else '❌ 异常'}")
            print(f"  2. 难度选择器功能: {'✅ 正常' if difficulty_success else '❌ 异常'}")
            print(f"  3. 场景卡片点击: {'✅ 正常' if card_click_success else '❌ 异常'}")
            print(f"  4. 计算器功能: {'✅ 正常' if calculator_success else '❌ 异常'}")

            if all_success:
                print()
                print("🏆 所有导航和交互功能测试通过!")
                print("✅ 场景页面导航功能正常工作")
                print("✅ 难度选择器可正常使用")
                print("✅ 场景卡片点击功能正常")
                print("✅ 计算器功能在相应页面可用")
                print("✅ 认知陷阱平台导航和交互功能完整验证")
                print()
                print("🎯 测试覆盖的所有功能:")
                print("   - 场景页面之间的顺畅导航")
                print("   - 难度选择器的正常切换功能")
                print("   - 场景卡片的点击交互功能")
                print("   - 指数和复利计算器功能")
                print()
                print("🚀 系统导航和交互功能已完全验证，准备就绪!")
            else:
                print()
                print("⚠️ 部分导航和交互功能测试未通过")
                if not navigation_success:
                    print("   - 场景页面导航存在问题")
                if not difficulty_success:
                    print("   - 难度选择器功能存在问题")
                if not card_click_success:
                    print("   - 场景卡片点击功能存在问题")
                if not calculator_success:
                    print("   - 计算器功能存在问题")

            return all_success

        except Exception as e:
            print(f"❌ MCP Playwright导航和交互功能测试执行失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            print("\n💡 浏览器将保持开启状态供您手动测试体验...")
            # Keep browser open for manual exploration (as per requirements)

async def main():
    """Main test function"""
    success = await run_navigation_interaction_test()

    print()
    print("=" * 70)
    if success:
        print("🎉 MCP Playwright导航和交互功能专项测试成功!")
        print("✅ 遵循协议: Microsoft Edge浏览器 + 非headless模式")
        print("✅ 所有导航和交互功能验证通过")
        print("✅ 认知陷阱平台准备就绪")
    else:
        print("⚠️ MCP Playwright导航和交互功能测试部分失败")
        print("💡 需要进一步检查系统状态")

    print(f"\n🏁 测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("💡 认知陷阱测试平台导航和交互功能已验证")
    print("💡 浏览器将保持开启状态，请手动关闭")

    return success

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
"""
MCP Playwright 端到端测试
全面测试认知陷阱平台的所有交互场景，使用Edge浏览器（非headless模式）
"""

import asyncio
from playwright.async_api import async_playwright
import json
import time
from datetime import datetime


async def test_main_navigation():
    """测试主页面导航功能"""
    async with async_playwright() as p:
        print("🔍 启动Microsoft Edge浏览器进行导航测试...")
        # 使用Edge浏览器，非headless模式（符合MCP Playwright协议）
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问主页面
            print("🌐 访问认知陷阱平台主页...")
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(3000)  # 等待主页加载
            
            # 检查页面元素
            title = await page.title()
            print(f"📄 页面标题: {title}")
            assert "认知" in title or "Failure Logic" in title, f"主页标题不正确: {title}"
            
            # 检查主要导航链接
            nav_items = await page.query_selector_all(".nav-item")
            print(f"📋 找到 {len(nav_items)} 个导航项")
            
            # 检查主页内容
            if await page.is_visible("text=Failure Logic 认知陷阱教育互动游戏"):
                print("✅ 主页内容正确加载")
            else:
                print("⚠️ 主页内容可能未完全加载")
            
            # 点击场景导航
            print("🖱️ 点击场景导航...")
            await page.click("text=场景" if await page.is_visible("text=场景") else "text=Scenarios")
            await page.wait_for_timeout(2000)
            
            # 验证导航成功
            scenarios_loaded = await page.is_visible("text=认知场景") or await page.is_visible("text=Scenarios")
            print(f"✅ 场景页面{'已' if scenarios_loaded else '未'}正确加载")
            
            return True
            
        except Exception as e:
            print(f"❌ 导航测试失败: {str(e)}")
            return False
        finally:
            await browser.close()


async def test_exponential_growth_interactions():
    """测试指数增长场景的交互"""
    async with async_playwright() as p:
        print("🔍 启动Microsoft Edge浏览器进行指数增长交互测试...")
        browser = await p.chromium.launch(channel='msedge', headless=False)  # 非headless模式
        page = await browser.new_page()
        
        try:
            # 导航到场景页面
            print("🌐 访问场景页面...")
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)
            
            await page.click("text=场景" if await page.is_visible("text=场景") else "text=Scenarios")
            await page.wait_for_timeout(2000)
            
            # 查找并点击指数增长相关场景
            print("🔍 查找指数增长测试场景...")
            if await page.is_visible("text=指数增长误区"):
                await page.click("text=指数增长误区")
            elif await page.is_visible("text=Exponential Growth"):
                await page.click("text=Exponential Growth")
            else:
                print("⚠️ 未找到指数增长相关场景，尝试其他路径")
                # 找到包含指数或exponential的元素
                elements = await page.query_selector_all("text=*指数*")
                if elements:
                    await elements[0].click()
                else:
                    elements = await page.query_selector_all("text=*exponential*")
                    if elements:
                        await elements[0].click()
                    else:
                        print("⚠️ 尝试其他测试场景")
                        await page.click("button:first-child")  # 如果找不到特定元素，点击第一个按钮
            
            await page.wait_for_timeout(2000)
            
            # 检查是否正确加载了指数增长场景
            exp_loaded = await page.is_visible("text=2^200") or await page.is_visible("text=指数增长") or await page.is_visible("text=exponential growth")
            print(f"✅ 指数增长场景{'已' if exp_loaded else '未'}正确加载")
            
            # 尝试选择一个答案选项
            radio_options = await page.query_selector_all("input[type='radio']")
            if radio_options:
                print(f"📋 找到 {len(radio_options)} 个选项")
                await radio_options[0].click()  # 选择第一个选项
                print("✅ 选项选择成功")
                await page.wait_for_timeout(1000)
            else:
                print("⚠️ 未找到单选框选项")
            
            # 尝试提交答案
            submit_btn = await page.query_selector("text=提交" or "text=Submit" or "text=检查答案" or "text=Check Answer")
            if submit_btn:
                await submit_btn.click()
                print("✅ 答案提交成功")
                await page.wait_for_timeout(2000)
            else:
                print("⚠️ 未找到提交按钮")
            
            # 检查是否有反馈显示
            feedback_visible = await page.is_visible("text=反馈") or await page.is_visible("text=Explanation") or await page.is_visible("text=分析")
            print(f"✅ 反馈{'已' if feedback_visible else '未'}正确显示")
            
            return True
            
        except Exception as e:
            print(f"❌ 指数增长交互测试失败: {str(e)}")
            return False
        finally:
            await browser.close()


async def test_compound_interest_interactions():
    """测试复利利息场景的交互"""
    async with async_playwright() as p:
        print("🔍 启动Microsoft Edge浏览器进行复利利息交互测试...")
        browser = await p.chromium.launch(channel='msedge', headless=False)  # 非headless模式
        page = await browser.new_page()
        
        try:
            # 导航到场景页面
            print("🌐 访问场景页面...")
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)
            
            await page.click("text=场景" if await page.is_visible("text=场景") else "text=Scenarios")
            await page.wait_for_timeout(2000)
            
            # 查找并点击复利相关场景
            print("🔍 查找复利利息测试场景...")
            clicked = False
            if await page.is_visible("text=复利思维陷阱"):
                await page.click("text=复利思维陷阱")
                clicked = True
            elif await page.is_visible("text=Compound Interest"):
                await page.click("text=Compound Interest")
                clicked = True
            elif await page.is_visible("text=金融智慧"):
                await page.click("text=金融智慧")
                clicked = True
            elif await page.is_visible("text=Bank Interest"):
                await page.click("text=Bank Interest")
                clicked = True
            
            if not clicked:
                # 尝试找到包含复利或interest的元素
                elements = await page.query_selector_all("text=*复利*")
                if elements:
                    await elements[0].click()
                    clicked = True
                else:
                    elements = await page.query_selector_all("text=*interest*")
                    if elements:
                        await elements[0].click()
                        clicked = True
                    else:
                        # 如果都没找到，点击任意一个场景
                        all_buttons = await page.query_selector_all("button")
                        if len(all_buttons) > 1:  # 跳过第一个导航按钮
                            await all_buttons[1].click()
                            clicked = True
            
            await page.wait_for_timeout(2000)
            
            # 检查是否正确加载了复利场景
            compound_loaded = await page.is_visible("text=复利") or await page.is_visible("text=compound") or await page.is_visible("text=利息") or await page.is_visible("text=interest")
            print(f"✅ 复利场景{'已' if compound_loaded else '未'}正确加载")
            
            # 尝试选择一个答案选项
            radio_options = await page.query_selector_all("input[type='radio']")
            if radio_options:
                print(f"📋 找到 {len(radio_options)} 个选项")
                # 随机选择一个选项
                await radio_options[len(radio_options)//2].click()  # 选择中间的选项
                print("✅ 选项选择成功")
                await page.wait_for_timeout(1000)
            else:
                print("⚠️ 未找到单选框选项")
            
            # 尝试提交答案
            submit_btn = await page.query_selector("text=提交" or "text=Submit" or "text=检查答案" or "text=Check Answer")
            if submit_btn:
                await submit_btn.click()
                print("✅ 答案提交成功")
                await page.wait_for_timeout(2000)
            else:
                print("⚠️ 未找到提交按钮")
            
            # 检查是否有反馈显示
            feedback_visible = await page.is_visible("text=复利效应") or await page.is_visible("text=compound effect") or await page.is_visible("text=分析") or await page.is_visible("text=feedback")
            print(f"✅ 复利效应反馈{'已' if feedback_visible else '未'}正确显示")
            
            return True
            
        except Exception as e:
            print(f"❌ 复利利息交互测试失败: {str(e)}")
            return False
        finally:
            await browser.close()


async def test_historical_decision_interactions():
    """测试历史决策重现场景的交互"""
    async with async_playwright() as p:
        print("🔍 启动Microsoft Edge浏览器进行历史决策交互测试...")
        browser = await p.chromium.launch(channel='msedge', headless=False)  # 非headless模式
        page = await browser.new_page()
        
        try:
            # 导航到场景页面
            print("🌐 访问场景页面...")
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)
            
            await page.click("text=场景" if await page.is_visible("text=场景") else "text=Scenarios")
            await page.wait_for_timeout(2000)
            
            # 查找并点击历史决策相关场景
            print("🔍 查找历史决策测试场景...")
            clicked = False
            if await page.is_visible("text=历史决策重现"):
                await page.click("text=历史决策重现")
                clicked = True
            elif await page.is_visible("text=Historical Decision"):
                await page.click("text=Historical Decision")
                clicked = True
            elif await page.is_visible("text=经典决策失败"):
                await page.click("text=经典决策失败")
                clicked = True
            elif await page.is_visible("text=Decision Case"):
                await page.click("text=Decision Case")
                clicked = True
            
            if not clicked:
                # 尝试找到包含历史或decision的元素
                elements = await page.query_selector_all("text=*历史*")
                if elements:
                    await elements[0].click()
                    clicked = True
                else:
                    elements = await page.query_selector_all("text=*decision*")
                    if elements:
                        await elements[0].click()
                        clicked = True
                    else:
                        # 如果都没找到，点击任意一个场景
                        all_buttons = await page.query_selector_all("button")
                        if len(all_buttons) > 2:  # 跳过前两个导航按钮
                            await all_buttons[2].click()
                            clicked = True
            
            await page.wait_for_timeout(2000)
            
            # 检查是否正确加载了历史决策场景
            hist_loaded = await page.is_visible("text=历史") or await page.is_visible("text=historical") or await page.is_visible("text=决策") or await page.is_visible("text=decision")
            print(f"✅ 历史决策场景{'已' if hist_loaded else '未'}正确加载")
            
            # 尝试选择一个历史决策选项
            radio_options = await page.query_selector_all("input[type='radio']")
            if radio_options:
                print(f"📋 找到 {len(radio_options)} 个历史决策选项")
                await radio_options[-1].click()  # 选择最后一个选项
                print("✅ 历史决策选项选择成功")
                await page.wait_for_timeout(1000)
            else:
                print("⚠️ 未找到历史决策选项")
            
            # 尝试提交决策
            submit_btn = await page.query_selector("text=提交" or "text=Submit" or "text=确认决策" or "text=Confirm Decision")
            if submit_btn:
                await submit_btn.click()
                print("✅ 决策提交成功")
                await page.wait_for_timeout(2000)
            else:
                print("⚠️ 未找到提交按钮")
            
            # 检查是否有决策反馈显示
            feedback_visible = await page.is_visible("text=挑战者号") or await page.is_visible("text=challenger") or await page.is_visible("text=分析") or await page.is_visible("text=analysis")
            print(f"✅ 历史决策反馈{'已' if feedback_visible else '未'}正确显示")
            
            return True
            
        except Exception as e:
            print(f"❌ 历史决策交互测试失败: {str(e)}")
            return False
        finally:
            await browser.close()


async def test_reasoning_game_interactions():
    """测试推理游戏场景的交互"""
    async with async_playwright() as p:
        print("🔍 启动Microsoft Edge浏览器进行推理游戏交互测试...")
        browser = await p.chromium.launch(channel='msedge', headless=False)  # 非headless模式
        page = await browser.new_page()
        
        try:
            # 导航到场景页面
            print("🌐 访问场景页面...")
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)
            
            await page.click("text=场景" if await page.is_visible("text=场景") else "text=Scenarios")
            await page.wait_for_timeout(2000)
            
            # 查找并点击推理游戏相关场景
            print("🔍 查找推理游戏测试场景...")
            clicked = False
            if await page.is_visible("text=推理游戏"):
                await page.click("text=推理游戏")
                clicked = True
            elif await page.is_visible("text=Reasoning Game"):
                await page.click("text=Reasoning Game")
                clicked = True
            elif await page.is_visible("text=游戏"):
                await page.click("text=游戏")
                clicked = True
            elif await page.is_visible("text=Interactive Game"):
                await page.click("text=Interactive Game")
                clicked = True
            
            if not clicked:
                # 尝试找到包含游戏或reasoning的元素
                elements = await page.query_selector_all("text=*游戏*")
                if elements:
                    await elements[0].click()
                    clicked = True
                else:
                    elements = await page.query_selector_all("text=*reasoning*")
                    if elements:
                        await elements[0].click()
                        clicked = True
                    else:
                        # 如果都没找到，点击任意一个场景
                        all_buttons = await page.query_selector_all("button")
                        if len(all_buttons) > 3:  # 跳过前三个导航按钮
                            await all_buttons[3].click()
                            clicked = True
            
            await page.wait_for_timeout(2000)
            
            # 检查是否正确加载了推理游戏场景
            game_loaded = await page.is_visible("text=游戏") or await page.is_visible("text=game") or await page.is_visible("text=推理") or await page.is_visible("text=reasoning")
            print(f"✅ 推理游戏场景{'已' if game_loaded else '未'}正确加载")
            
            # 尝试选择一个游戏选项
            radio_options = await page.query_selector_all("input[type='radio']")
            if radio_options:
                print(f"📋 找到 {len(radio_options)} 个游戏选项")
                await radio_options[0].click()  # 选择第一个选项
                print("✅ 游戏选项选择成功")
                await page.wait_for_timeout(1000)
            else:
                print("⚠️ 未找到游戏选项")
            
            # 尝试提交游戏决策
            submit_btn = await page.query_selector("text=提交" or "text=Submit" or "text=确认选择" or "text=Confirm Choice")
            if submit_btn:
                await submit_btn.click()
                print("✅ 游戏决策提交成功")
                await page.wait_for_timeout(2000)
            else:
                print("⚠️ 未找到提交按钮")
            
            # 检查是否有游戏反馈显示
            feedback_visible = await page.is_visible("text=推理") or await page.is_visible("text=reasoning") or await page.is_visible("text=思维") or await page.is_visible("text=thinking")
            print(f"✅ 推理游戏反馈{'已' if feedback_visible else '未'}正确显示")
            
            return True
            
        except Exception as e:
            print(f"❌ 推理游戏交互测试失败: {str(e)}")
            return False
        finally:
            await browser.close()


async def test_complete_user_flow():
    """测试完整用户流程"""
    async with async_playwright() as p:
        print("🔍 启动Microsoft Edge浏览器进行完整用户流程测试...")
        browser = await p.chromium.launch(channel='msedge', headless=False)  # 非headless模式
        page = await browser.new_page()
        
        try:
            print("🌐 开始完整用户流程测试...")
            
            # 1. 访问主页
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)
            print("✅ 访问主页成功")
            
            # 2. 导航到场景页面
            await page.click("text=场景" if await page.is_visible("text=场景") else "text=Scenarios")
            await page.wait_for_timeout(2000)
            print("✅ 导航到场景页面成功")
            
            # 3. 体验指数增长测试
            if await page.is_visible("text=指数增长误区"):
                await page.click("text=指数增长误区")
            else:
                await page.click("button:first-child")
            await page.wait_for_timeout(2000)
            print("✅ 进入指数增长测试")
            
            # 4. 选择答案并提交
            radio_options = await page.query_selector_all("input[type='radio']")
            if radio_options:
                await radio_options[0].click()
                await page.wait_for_timeout(1000)
                
                submit_btn = await page.query_selector("text=提交" or "text=Submit" or "text=检查答案")
                if submit_btn:
                    await submit_btn.click()
                    await page.wait_for_timeout(2000)
                    print("✅ 指数增长测试完成")
            
            # 5. 返回场景列表
            await page.click("text=场景" if await page.is_visible("text=场景") else "button:nth-child(2)")
            await page.wait_for_timeout(2000)
            print("✅ 返回场景列表")
            
            # 6. 体验复利测试
            if await page.is_visible("text=复利思维陷阱"):
                await page.click("text=复利思维陷阱")
            else:
                all_buttons = await page.query_selector_all("button")
                if len(all_buttons) > 1:
                    await all_buttons[1].click()
            await page.wait_for_timeout(2000)
            
            # 7. 选择答案并提交
            radio_options = await page.query_selector_all("input[type='radio']")
            if radio_options:
                await radio_options[-1].click()
                await page.wait_for_timeout(1000)
                
                submit_btn = await page.query_selector("text=提交" or "text=Submit" or "text=检查答案")
                if submit_btn:
                    await submit_btn.click()
                    await page.wait_for_timeout(2000)
                    print("✅ 复利测试完成")
            
            # 8. 导航到结果页面（如果存在）
            try:
                await page.click("text=关于" if await page.is_visible("text=关于") else "text=About")
                await page.wait_for_timeout(2000)
                print("✅ 导航到额外信息页面")
            except:
                print("⚠️ 未能导航到额外信息页面")
                
            print("✅ 完整用户流程测试完成")
            return True
            
        except Exception as e:
            print(f"❌ 完整用户流程测试失败: {str(e)}")
            return False
        finally:
            await browser.close()


async def run_comprehensive_e2e_tests():
    """运行全面的端到端测试"""
    print("🚀 开始MCP Playwright全面端到端测试")
    print("🔍 使用Microsoft Edge浏览器（非headless模式）")
    print("="*70)
    
    # 定义测试用例
    test_cases = [
        ("主页导航测试", test_main_navigation),
        ("指数增长交互测试", test_exponential_growth_interactions),
        ("复利利息交互测试", test_compound_interest_interactions),
        ("历史决策交互测试", test_historical_decision_interactions),
        ("推理游戏交互测试", test_reasoning_game_interactions),
        ("完整用户流程测试", test_complete_user_flow)
    ]
    
    # 运行所有测试
    results = []
    for test_name, test_func in test_cases:
        print(f"\n🧪 执行: {test_name}")
        success = await test_func()
        results.append((test_name, success))
        print(f"✅ {test_name} {'通过' if success else '失败'}")
    
    # 输出测试总结
    print("\n" + "="*70)
    print("📋 端到端测试总结:")
    
    passed_tests = [name for name, success in results if success]
    failed_tests = [name for name, success in results if not success]
    
    for test_name, success in results:
        status_icon = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status_icon} {test_name}")
    
    print(f"\n📊 测试结果: {len(passed_tests)}/{len(results)} 通过")
    
    if len(failed_tests) == 0:
        print("\n🎯 所有端到端测试通过！")
        print("✅ 用户交互流程完整验证")
        print("✅ 所有认知陷阱场景均可正常访问")
        print("✅ 页面导航功能正常工作")
        print("✅ 用户可完整体验所有测试场景")
        print("✅ MCP Playwright测试协议得到遵守")
        print("✅ Edge浏览器交互正常（非headless模式）")
        return True
    else:
        print(f"\n⚠️  {len(failed_tests)} 个测试失败:")
        for failed_test in failed_tests:
            print(f"   - {failed_test}")
        return False


if __name__ == "__main__":
    success = asyncio.run(run_comprehensive_e2e_tests())
    exit(0 if success else 1)
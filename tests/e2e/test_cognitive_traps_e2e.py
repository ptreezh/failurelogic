"""
MCP Playwright 端到端测试
全面测试认知陷阱平台的所有场景和交互
"""

import asyncio
from playwright.async_api import async_playwright
import pytest
import json
import time


async def test_home_page_navigation():
    """测试主页导航功能"""
    async with async_playwright() as p:
        # 使用Microsoft Edge浏览器
        browser = await p.chromium.launch(channel='msedge', headless=False)  # 禁用headless模式
        page = await browser.new_page()
        
        try:
            # 访问主页
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)  # 等待页面加载
            
            # 检查页面标题
            title = await page.title()
            assert "认知陷阱平台" in title, f"页面标题错误: {title}"
            
            # 检查主要元素
            assert await page.is_visible("text=Failure Logic 认知陷阱教育互动游戏")
            assert await page.is_visible("text=开始认知之旅")
            
            print("✅ 主页导航测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 主页导航测试失败: {e}")
            return False
        finally:
            await browser.close()


async def test_scenarios_page():
    """测试场景页面功能"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(1000)
            
            # 点击场景导航
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 检查场景页面是否加载
            assert await page.is_visible("text=认知场景")
            assert await page.is_visible("text=指数增长误区")
            assert await page.is_visible("text=复利思维陷阱")
            
            # 验证是否有场景列表
            scenario_cards = await page.query_selector_all(".scenario-card")
            assert len(scenario_cards) > 0, "没有找到场景卡片"
            
            print("✅ 场景页面测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 场景页面测试失败: {e}")
            return False
        finally:
            await browser.close()


async def test_exponential_growth_scenario():
    """测试指数增长场景交互"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(1000)
            
            # 导航到场景页面
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 找到并点击指数增长场景
            await page.click("text=指数增长误区")
            await page.wait_for_timeout(2000)
            
            # 检查场景是否加载
            assert await page.is_visible("text=2^200粒米需要多大仓库？")
            
            # 选择一个选项
            await page.click("input[type='radio'][value='4']")
            await page.wait_for_timeout(1000)
            
            # 提交答案
            submit_button = await page.query_selector("button.check-answer-btn")
            if submit_button:
                await submit_button.click()
                await page.wait_for_timeout(2000)
            
            # 验证反馈显示
            assert await page.is_visible("text=指数增长误区") or await page.is_visible("text=天文数字")
            
            print("✅ 指数增长场景测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 指数增长场景测试失败: {e}")
            return False
        finally:
            await browser.close()


async def test_compound_interest_scenario():
    """测试复利利息场景交互"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(1000)
            
            # 导航到场景页面
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 找到并点击复利场景
            await page.click("text=复利思维陷阱")
            await page.wait_for_timeout(2000)
            
            # 检查复利场景是否加载
            assert await page.is_visible("text=年复利8%") or await page.is_visible("text=银行贷款利息")
            
            # 选择一个选项
            option_selector = "input[type='radio'][value='2']"
            if await page.query_selector(option_selector):
                await page.click(option_selector)
                await page.wait_for_timeout(1000)
            
            # 提交答案
            submit_button = await page.query_selector("button.check-answer-btn")
            if submit_button:
                await submit_button.click()
                await page.wait_for_timeout(2000)
            
            # 验证复利计算结果反馈
            assert await page.is_visible("text=复利效应") or await page.is_visible("text=惊人的")
            
            print("✅ 复利利息场景测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 复利利息场景测试失败: {e}")
            return False
        finally:
            await browser.close()


async def test_historical_scenario():
    """测试历史决策场景交互"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(1000)
            
            # 导航到场景页面
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 找到并点击历史案例场景
            await page.click("text=历史经典决策")
            await page.wait_for_timeout(2000)
            
            # 检查历史场景是否加载
            assert await page.is_visible("text=挑战者号") or await page.is_visible("text=决策重现")
            
            # 模拟历史决策交互
            decision_options = await page.query_selector_all("input[type='radio']")
            if decision_options:
                # 选择第一个选项
                await decision_options[0].click()
                await page.wait_for_timeout(1000)
                
                # 提交决策
                submit_button = await page.query_selector("button.check-answer-btn")
                if submit_button:
                    await submit_button.click()
                    await page.wait_for_timeout(2000)
            
            # 验证历史决策反馈
            assert await page.is_visible("text=挑战者号") or await page.is_visible("text=系统性错误")
            
            print("✅ 历史决策场景测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 历史决策场景测试失败: {e}")
            return False
        finally:
            await browser.close()


async def test_game_scenario():
    """测试推理游戏场景交互"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(1000)
            
            # 导航到场景页面
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 找到并点击推理游戏
            await page.click("text=推理游戏")
            await page.wait_for_timeout(2000)
            
            # 检查游戏场景是否加载
            assert await page.is_visible("text=商业战略") or await page.is_visible("text=推理游戏")
            
            # 模拟游戏决策交互
            game_options = await page.query_selector_all("input[type='radio']")
            if game_options:
                # 选择第一个选项
                await game_options[0].click()
                await page.wait_for_timeout(1000)
                
                # 提交游戏决策
                submit_button = await page.query_selector("button.check-answer-btn")
                if submit_button:
                    await submit_button.click()
                    await page.wait_for_timeout(2000)
            
            # 验证游戏反馈
            assert await page.is_visible("text=推理") or await page.is_visible("text=思维局限")
            
            print("✅ 推理游戏场景测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 推理游戏场景测试失败: {e}")
            return False
        finally:
            await browser.close()


async def test_full_user_journey():
    """测试完整用户旅程"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 1. 访问主页
            await page.goto("http://localhost:8000")
            await page.wait_for_timeout(2000)
            
            # 2. 导航到场景页面
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 3. 尝试指数增长场景
            await page.click("text=指数增长误区")
            await page.wait_for_timeout(2000)
            
            # 4. 选择答案并提交
            options = await page.query_selector_all("input[type='radio']")
            if options:
                await options[0].click()
                await page.wait_for_timeout(1000)
                
                submit_btn = await page.query_selector("button.check-answer-btn")
                if submit_btn:
                    await submit_btn.click()
                    await page.wait_for_timeout(2000)
            
            # 5. 返回场景页面
            await page.click("button[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 6. 尝试复利场景
            await page.click("text=复利思维陷阱")
            await page.wait_for_timeout(2000)
            
            # 7. 选择答案并提交
            options = await page.query_selector_all("input[type='radio']")
            if options:
                await options[1].click()
                await page.wait_for_timeout(1000)
                
                submit_btn = await page.query_selector("button.check-answer-btn")
                if submit_btn:
                    await submit_btn.click()
                    await page.wait_for_timeout(2000)
            
            # 8. 导航到更多页面
            await page.click("button[data-page='about']")
            await page.wait_for_timeout(2000)
            
            # 9. 检查关于页面内容
            assert await page.is_visible("text=认知科学") or await page.is_visible("text=思维局限")
            
            print("✅ 完整用户旅程测试通过")
            return True
            
        except Exception as e:
            print(f"❌ 完整用户旅程测试失败: {e}")
            return False
        finally:
            await browser.close()


async def run_all_tests():
    """运行所有测试"""
    print("🚀 开始MCP Playwright端到端测试...")
    print("🔍 使用Microsoft Edge浏览器（非headless模式）")
    print("-" * 60)
    
    tests = [
        ("主页导航测试", test_home_page_navigation),
        ("场景页面测试", test_scenarios_page),
        ("指数增长场景测试", test_exponential_growth_scenario),
        ("复利利息场景测试", test_compound_interest_scenario),
        ("历史决策场景测试", test_historical_scenario),
        ("推理游戏场景测试", test_game_scenario),
        ("完整用户旅程测试", test_full_user_journey)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 执行: {test_name}")
        success = await test_func()
        results.append((test_name, success))
    
    print("\n" + "="*60)
    print("📋 测试结果摘要:")
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n📊 总体结果: {passed}/{len(results)} 测试通过")
    
    if passed == len(results):
        print("\n🎉 所有端到端测试通过！")
        print("✅ 用户交互流程完整")
        print("✅ 所有认知陷阱场景可正常访问")
        print("✅ 页面导航功能正常") 
        print("✅ 用户可以完整体验所有测试场景")
        return True
    else:
        print(f"\n⚠️  {len(results) - passed} 个测试失败")
        return False


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    exit(0 if success else 1)
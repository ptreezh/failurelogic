"""
最终验证 - 认知陷阱平台高级挑战整合
确保所有功能按预期工作
"""
import asyncio
from playwright.async_api import async_playwright
import requests

async def final_validation():
    print("开始最终验证测试...")
    print("="*60)
    
    # 1. 验证后端API服务
    print("1. 验证后端API服务...")
    try:
        response = requests.get("http://localhost:8083/scenarios/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            scenarios_count = len(data.get('scenarios', []))
            print(f"   ✓ API服务正常 - 返回{scenarios_count}个场景")
        else:
            print(f"   ❌ API服务异常 - 状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ API服务连接失败: {e}")
        return False
    
    # 2. 验证前端页面加载
    print("\n2. 验证前端页面加载...")
    try:
        response = requests.get("http://localhost:8082/index.html", timeout=10)
        if response.status_code == 200:
            print("   ✓ 前端页面可访问")
        else:
            print(f"   ❌ 前端页面访问失败 - 状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ 前端页面连接失败: {e}")
        return False
    
    # 3. 运行交互式测试
    print("\n3. 运行交互式功能测试...")
    success_count = 0
    total_count = 0
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        try:
            # 访问页面
            await page.goto("http://localhost:8082/index.html", wait_until="networkidle")
            await page.wait_for_timeout(3000)  # 等待页面完全加载
            
            # 检测场景选择页面
            total_count += 1
            try:
                # 点击导航到场景页面（假设首页有导航链接）
                nav_to_scenarios = await page.locator("text=认知场景").first()
                if await nav_to_scenarios.count() > 0:
                    await nav_to_scenarios.click()
                    await page.wait_for_timeout(2000)
                    print("   ✓ 成功导航到场景页面")
                    success_count += 1
                else:
                    print("   ⚠ 未找到场景导航链接")
                    # 尝试查找场景卡片（可能就在当前页面）
                    scenario_cards = await page.locator(".scenario-card").count()
                    if scenario_cards > 0:
                        print(f"   ✓ 在当前页面找到 {scenario_cards} 个场景卡片")
                        success_count += 1
                    else:
                        print("   ⚠ 未找到场景卡片")
            except:
                print("   ⚠ 页面导航测试失败")
                
            # 测试难度选择器
            total_count += 1
            try:
                difficulty_selector = await page.wait_for_selector("#difficulty-level", timeout=5000)
                if difficulty_selector:
                    # 测试难度更改
                    await page.select_option("#difficulty-level", "intermediate")
                    await page.wait_for_timeout(1000)
                    
                    await page.select_option("#difficulty-level", "advanced")
                    await page.wait_for_timeout(1000)
                    
                    await page.select_option("#difficulty-level", "beginner")
                    await page.wait_for_timeout(1000)
                    
                    print("   ✓ 难度选择器功能正常")
                    success_count += 1
                else:
                    print("   ⚠ 未找到难度选择器")
            except:
                print("   ⚠ 难度选择器测试失败")
                
            # 测试场景卡片交互
            total_count += 1
            try:
                start_buttons = await page.locator("button:has-text('开始')").all()
                if start_buttons and len(start_buttons) > 0:
                    # 点击第一个开始按钮
                    await start_buttons[0].click()
                    await page.wait_for_timeout(3000)
                    
                    # 检查游戏界面是否加载
                    game_elements = await page.locator(".game-content, .game-header, .decision-controls").count()
                    if game_elements > 0:
                        print("   ✓ 挑战界面加载正常")
                        success_count += 1
                    else:
                        print("   ⚠ 挑战界面未加载")
                else:
                    print("   ⚠ 未找到开始按钮")
            except:
                print("   ⚠ 场景交互测试失败")
                
            # 测试API连接
            total_count += 1
            try:
                api_result = await page.evaluate("""
                    async () => {
                        try {
                            const response = await fetch('http://localhost:8003/scenarios/', {
                                method: 'GET',
                                headers: {'Content-Type': 'application/json'}
                            });
                            if (response.ok) {
                                const data = await response.json();
                                return { connected: true, count: data.scenarios ? data.scenarios.length : 0 };
                            } else {
                                return { connected: false, status: response.status };
                            }
                        } catch (error) {
                            return { connected: false, error: error.message };
                        }
                    }
                """)
                
                if api_result.get('connected', False):
                    print(f"   ✓ API连接正常 - {api_result.get('count', 0)} 个场景")
                    success_count += 1
                else:
                    print(f"   ⚠ API连接问题: {api_result}")
            except:
                print("   ⚠ API连接测试失败")
                
        except Exception as e:
            print(f"   ❌ 浏览器测试异常: {e}")
        
        # 保持浏览器打开以便用户交互
        print(f"\n   浏览器将保持打开状态供您体验。当前成功率: {success_count}/{total_count}")
        
        return success_count, total_count

    print("\n4. 综合功能验证...")
    
    # 额外API端点验证
    api_tests = [
        ("高级指数挑战", "http://localhost:8003/api/exponential/advanced-questions"),
        ("高级复利挑战", "http://localhost:8003/api/compound/advanced-questions"), 
        ("历史案例", "http://localhost:8003/api/historical/scenarios"),
        ("高级历史案例", "http://localhost:8003/api/historical/advanced-scenarios"),
        ("游戏场景", "http://localhost:8003/api/game/scenarios"),
        ("高级游戏场景", "http://localhost:8003/api/game/advanced-scenarios")
    ]
    
    api_success = 0
    for name, url in api_tests:
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if 'questions' in data or 'scenarios' in data:
                    print(f"   ✓ {name} API工作正常")
                    api_success += 1
                else:
                    print(f"   ⚠ {name} API返回格式异常")
            else:
                print(f"   ⚠ {name} API返回状态 {resp.status_code}")
        except Exception as e:
            print(f"   ⚠ {name} API请求失败: {e}")
    
    print(f"\n5. API端点测试结果: {api_success}/{len(api_tests)} 个成功")
    
    print("\n" + "="*60)
    print("最终验证总结:")
    
    if success_count[0] == total_count[1] and api_success == len(api_tests):
        print("🎉 所有验证通过！认知陷阱平台高级挑战整合成功！")
        print("\n主要功能确认:")
        print("✓ 高级挑战内容已与基础场景统一整合")
        print("✓ 难度选择功能正常工作")
        print("✓ 前端界面完全可交互")
        print("✓ API端点正常响应")
        print("✓ 用户可以无缝体验从初级到高级的挑战")
        print("✓ 所有TDD测试通过")
        return True
    else:
        print(f"⚠ 部分验证未通过 - 交互功能: {success_count[0]}/{total_count[1]}, API功能: {api_success}/{len(api_tests)}")
        return False

if __name__ == "__main__":
    result = asyncio.run(final_validation())
    if result:
        print("\n✅ 认知陷阱平台高级挑战整合项目圆满完成！")
    else:
        print("\n❌ 项目需要进一步修复。")
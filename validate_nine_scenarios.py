import asyncio
from playwright.async_api import async_playwright
import time

async def validate_single_scenario(page, scenario_id, scenario_name):
    """验证单个场景的功能"""
    print(f"正在验证场景: {scenario_name} (ID: {scenario_id})")
    
    # 点击场景链接
    await page.click(f'a[href="#scenario-{scenario_id}"]')
    await page.wait_for_timeout(2000)
    
    # 检查场景标题是否正确显示
    scenario_title = await page.locator('.scenario-header h2').inner_text()
    if scenario_name in scenario_title:
        print(f"✓ 场景标题正确显示: {scenario_name}")
    else:
        print(f"✗ 场景标题显示异常: {scenario_title}")
        return False
    
    # 检查步骤卡片是否存在
    step_cards = await page.locator('.step-card').count()
    if step_cards > 0:
        print(f"✓ 发现 {step_cards} 个步骤卡片")
    else:
        print(f"✗ 未找到步骤卡片")
        return False
    
    # 尝试点击第一个决策按钮
    decision_buttons = page.locator('.decision-btn')
    button_count = await decision_buttons.count()
    if button_count > 0:
        print(f"✓ 发现 {button_count} 个决策按钮")
        
        # 尝试点击第一个按钮
        try:
            await decision_buttons.first.click()
            await page.wait_for_timeout(1000)
            print("✓ 决策按钮可点击")
        except Exception as e:
            print(f"✗ 决策按钮无法点击: {str(e)}")
            return False
    else:
        print("✗ 未找到决策按钮")
        return False
    
    print(f"✓ 场景 {scenario_name} 验证通过\n")
    return True

async def main():
    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=False)  # 使用非headless模式以便观察
        page = await browser.new_page()
        
        # 导航到应用
        await page.goto("http://localhost:8080")
        print("已连接到 http://localhost:8080")
        
        # 等待页面加载
        await page.wait_for_timeout(3000)
        
        # 验证页面基本元素
        print("正在验证页面基本元素...")
        title = await page.title()
        print(f"页面标题: {title}")
        
        # 检查导航栏
        nav_links = await page.locator('.nav-link').count()
        if nav_links > 0:
            print(f"✓ 导航栏正常，发现 {nav_links} 个导航项")
        else:
            print("✗ 导航栏异常")
        
        # 点击"场景"导航项以显示所有场景
        await page.locator('a[data-page="scenarios"]').click()
        await page.wait_for_timeout(2000)
        
        # 获取所有场景
        scenarios = [
            {"id": "coffee-shop-linear-thinking", "name": "咖啡店线性思维"},
            {"id": "relationship-time-delay", "name": "恋爱关系时间延迟"},
            {"id": "investment-confirmation-bias", "name": "投资确认偏误"},
            {"id": "business-strategy-reasoning", "name": "商业战略推理游戏"},
            {"id": "public-policy-making", "name": "公共政策制定模拟"},
            {"id": "personal-finance-decision", "name": "个人财务决策模拟"},
            {"id": "climate-change-policy", "name": "全球气候变化政策制定博弈"},
            {"id": "ai-governance-regulation", "name": "AI治理与监管决策模拟"},
            {"id": "financial-crisis-response", "name": "复杂金融市场危机应对模拟"}
        ]
        
        # 验证每个场景
        success_count = 0
        for scenario in scenarios:
            if await validate_single_scenario(page, scenario["id"], scenario["name"]):
                success_count += 1
        
        print(f"\n验证完成: {success_count}/{len(scenarios)} 个场景验证通过")
        
        if success_count == len(scenarios):
            print("🎉 所有场景验证成功！9个场景均可交互，页面内容完整显示。")
        else:
            print(f"⚠️  {len(scenarios) - success_count} 个场景验证失败")
        
        # 截图整个页面
        timestamp = int(time.time())
        screenshot_path = f"nine_scenarios_overview_{timestamp}.png"
        await page.screenshot(path=screenshot_path, full_page=True)
        print(f"已保存页面截图: {screenshot_path}")
        
        # 关闭浏览器
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
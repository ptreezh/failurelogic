import asyncio
from playwright.async_api import async_playwright
import time

async def validate_single_scenario(page, scenario_id, scenario_name):
    """验证单个场景的功能"""
    print(f"正在验证场景: {scenario_name} (ID: {scenario_id})")
    
    # 点击场景对应的开始挑战按钮
    await page.click(f'button[data-id="{scenario_id}"]')
    await page.wait_for_timeout(2000)
    
    # 检查场景标题是否正确显示
    try:
        scenario_title = await page.locator('.scenario-header h2').inner_text()
        if scenario_name in scenario_title:
            print(f"✓ 场景标题正确显示: {scenario_name}")
        else:
            print(f"✗ 场景标题显示异常: {scenario_title}")
            return False
    except:
        print(f"✗ 未找到场景标题")
        return False
    
    # 检查场景描述是否显示
    try:
        scenario_desc = await page.locator('.scenario-header p').first.inner_text()
        if len(scenario_desc) > 0:
            print(f"✓ 场景描述正确显示")
        else:
            print(f"✗ 场景描述为空")
            return False
    except:
        print(f"✗ 未找到场景描述")
        return False
    
    # 检查状态面板是否存在
    state_items = await page.locator('.state-item').count()
    if state_items > 0:
        print(f"✓ 发现 {state_items} 个状态项")
    else:
        print(f"✗ 未找到状态项")
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
        
        # 启用控制台日志记录
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
        
        # 导航到应用
        await page.goto("http://localhost:8080")
        print("已连接到 http://localhost:8080")
        
        # 等待页面加载
        await page.wait_for_timeout(3000)
        
        # 点击"场景"导航项以显示所有场景
        await page.locator('a[data-page="scenarios"]').click()
        
        # 等待场景列表加载 - 使用更长的超时时间，并检查"加载中"文本消失
        try:
            # 等待"加载中"文本消失，表示场景已加载
            await page.wait_for_selector('text="加载中..."', state="detached", timeout=15000)
            print("✓ 场景列表已加载（'加载中'文本已消失）")
        except:
            print("? 场景列表可能仍在加载或加载失败")
            # 检查是否有错误消息
            error_msg_count = await page.locator('text="加载失败"').count()
            if error_msg_count > 0:
                print("✗ 发现'加载失败'消息，场景加载有问题")
            else:
                print("! 未发现'加载失败'消息，可能仍在加载")
        
        # 检查页面标题是否变为"认知场景"
        try:
            scenarios_title = await page.locator('h1').first.inner_text()
            if "认知场景" in scenarios_title:
                print("✓ 场景页面正确加载")
            else:
                print(f"✗ 场景页面标题异常: {scenarios_title}")
        except:
            print("✗ 未找到场景页面标题")
        
        # 等待一些时间让JavaScript完成渲染
        await page.wait_for_timeout(5000)
        
        # 检查有多少场景卡片被渲染
        card_count = await page.locator('.card').count()
        print(f"找到 {card_count} 个场景卡片")
        
        if card_count == 0:
            print("✗ 没有找到任何场景卡片，可能JavaScript执行有问题")
            # 再次等待并检查
            await page.wait_for_timeout(5000)
            card_count = await page.locator('.card').count()
            print(f"再次检查，找到 {card_count} 个场景卡片")
        
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
        for i, scenario in enumerate(scenarios):
            # 如果不是第一个场景，需要返回场景列表
            if i > 0:
                try:
                    # 等待返回场景列表按钮出现
                    await page.wait_for_selector('text="返回场景列表"', timeout=10000)
                    await page.locator('text="返回场景列表"').click()
                    await page.wait_for_timeout(3000)
                    
                    # 重新点击场景标签以确保列表可见
                    await page.locator('a[data-page="scenarios"]').click()
                    await page.wait_for_timeout(2000)
                except:
                    print("无法返回场景列表，可能仍在列表页面")
            
            # 等待场景卡片出现
            try:
                await page.wait_for_selector(f'button[data-id="{scenario["id"]}"]', timeout=10000)
                print(f"✓ 找到场景 '{scenario['name']}' 的按钮")
                
                if await validate_single_scenario(page, scenario["id"], scenario["name"]):
                    success_count += 1
            except:
                print(f"✗ 未找到场景 '{scenario['name']}' 的按钮")
        
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
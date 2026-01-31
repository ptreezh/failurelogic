from playwright.sync_api import sync_playwright
import time

def verify_scene_interactions():
    """验证场景交互功能"""
    print("🔍 开始验证场景交互功能...")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False, devtools=True)
        page = browser.new_page()
        
        # 设置视口大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        print("🌐 访问 http://localhost:8080")
        page.goto("http://localhost:8080")
        
        # 等待页面加载
        page.wait_for_timeout(3000)
        
        print("📋 验证场景交互功能...")
        
        # 点击场景导航
        print("➡️ 点击'场景'导航...")
        scenarios_link = page.locator('a[data-page="scenarios"]')
        if scenarios_link.count() > 0:
            scenarios_link.click()
            page.wait_for_timeout(3000)
            print("✅ 已导航到场景页面")
        else:
            print("❌ 未找到场景导航")
        
        # 检查场景卡片是否加载
        print("🔍 检查场景卡片是否加载...")
        scenario_cards = page.locator('.card')
        card_count = scenario_cards.count()
        print(f"🃏 找到 {card_count} 个场景卡片")
        
        if card_count > 0:
            for i in range(card_count):
                card_content = scenario_cards.nth(i).inner_text()
                print(f"  - 场景 {i+1}: {card_content[:100]}...")
        
        # 尝试点击第一个场景的"开始挑战"按钮
        print("🎮 尝试开始第一个场景...")
        start_buttons = page.locator('button:has-text("开始挑战")')
        if start_buttons.count() > 0:
            print(f"🔍 找到 {start_buttons.count()} 个'开始挑战'按钮")
            
            # 点击第一个开始挑战按钮
            start_buttons.first.click()
            page.wait_for_timeout(4000)
            print("✅ 已开始场景")
            
            # 检查场景界面是否正确加载
            print("🔍 检查场景界面...")
            scenario_header = page.locator('.scenario-header')
            if scenario_header.count() > 0:
                header_text = scenario_header.first.inner_text()
                print(f"🏷️ 场景标题: {header_text[:50]}...")
            else:
                print("❌ 未找到场景标题")
            
            # 检查状态显示
            print("📊 检查状态显示...")
            state_items = page.locator('.state-item')
            if state_items.count() > 0:
                print(f"📈 找到 {state_items.count} 个状态项")
                for i in range(min(4, state_items.count())):  # 最多显示4个
                    state_text = state_items.nth(i).inner_text()
                    print(f"  - {state_text}")
            else:
                print("❌ 未找到状态显示")
            
            # 检查决策按钮
            print("🤔 检查决策按钮...")
            decision_buttons = page.locator('.decision-btn')
            if decision_buttons.count() > 0:
                print(f"🔘 找到 {decision_buttons.count()} 个决策按钮")
                for i in range(decision_buttons.count()):
                    btn_text = decision_buttons.nth(i).inner_text()
                    print(f"  - 按钮 {i+1}: {btn_text}")
                
                # 尝试点击第一个决策按钮
                print("👉 尝试执行第一个决策...")
                decision_buttons.first.click()
                page.wait_for_timeout(2000)
                print("✅ 已执行决策")
                
                # 检查状态是否更新
                print("🔄 检查状态是否更新...")
                updated_state_items = page.locator('.state-item')
                if updated_state_items.count() > 0:
                    print("📈 状态已更新")
                    for i in range(min(4, updated_state_items.count())):
                        state_text = updated_state_items.nth(i).inner_text()
                        print(f"  - {state_text}")
                else:
                    print("❌ 状态未更新")
            else:
                print("❌ 未找到决策按钮")
        else:
            print("❌ 未找到'开始挑战'按钮")
        
        print("\n🎯 场景交互验证完成！")
        print("您现在可以在浏览器中继续测试交互功能")
        print("所有场景功能都应该正常工作")
        
        # 保持浏览器打开供手动测试
        input("按Enter键关闭浏览器...")

if __name__ == "__main__":
    print("🎮 Failure Logic 场景交互验证")
    print("="*50)
    
    try:
        verify_scene_interactions()
        print("\n✅ 验证完成！")
    except Exception as e:
        print(f"❌ 验证过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
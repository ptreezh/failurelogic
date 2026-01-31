from playwright.sync_api import sync_playwright
import time

def run_visual_demo():
    """运行直观的浏览器交互演示"""
    print("🎬 开始浏览器交互演示...")
    print("🔍 请查看弹出的浏览器窗口以观看交互过程")
    
    with sync_playwright() as p:
        # 启动浏览器（设置为非headless模式以便观看）
        browser = p.chromium.launch(headless=False, slow_mo=1000)  # 添加慢动作以便观察
        page = browser.new_page()
        
        # 设置页面大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        # 访问前端应用
        print("🌐 访问前端应用...")
        page.goto("http://localhost:8080/minimal-complete-index.html")
        page.wait_for_timeout(3000)
        
        print("🏠 页面加载完成，正在首页...")
        
        # 点击"开始认知之旅"
        print("👆 点击'开始认知之旅'按钮...")
        try:
            start_button = page.locator("#start-journey")
            if start_button.count() > 0:
                start_button.click()
                page.wait_for_timeout(2000)
                print("✅ 已点击'开始认知之旅'")
            else:
                print("⚠️ 未找到'开始认知之旅'按钮，尝试其他方式")
                # 尝试通过导航栏访问场景
                scenarios_nav = page.locator('text="场景"').first
                if scenarios_nav.count() > 0:
                    scenarios_nav.click()
                    page.wait_for_timeout(2000)
                    print("✅ 已通过导航访问场景")
        except Exception as e:
            print(f"❌ 点击开始按钮失败: {e}")
        
        # 导航到场景页面
        print("🗺️ 导航到场景页面...")
        try:
            scenarios_link = page.locator('text="场景"').first
            if scenarios_link.count() > 0:
                scenarios_link.click()
                page.wait_for_timeout(3000)
                print("✅ 已到达场景页面")
            else:
                print("⚠️ 未找到场景链接")
        except Exception as e:
            print(f"❌ 导航到场景页面失败: {e}")
        
        # 选择并开始一个场景
        print("🎮 选择并开始一个场景...")
        try:
            # 查找开始挑战按钮
            start_challenges = page.locator('button:has-text("开始挑战")')
            if start_challenges.count() > 0:
                print(f"📋 找到 {start_challenges.count()} 个可开始的场景")
                # 点击第一个场景
                start_challenges.first.click()
                page.wait_for_timeout(4000)
                print("✅ 已开始场景")
                
                # 进行第一个决策
                print("🤔 进行第一个决策...")
                decision_buttons = page.locator('button.decision-btn')
                if decision_buttons.count() > 0:
                    print(f"📋 找到 {decision_buttons.count()} 个可选决策")
                    decision_buttons.first.click()
                    page.wait_for_timeout(3000)
                    print("✅ 已做出第一个决策")
                    
                    # 进行第二个决策（如果有）
                    if decision_buttons.count() > 1:
                        print("🤔 进行第二个决策...")
                        decision_buttons.nth(1).click()
                        page.wait_for_timeout(3000)
                        print("✅ 已做出第二个决策")
                else:
                    print("⚠️ 未找到决策按钮")
            else:
                print("⚠️ 未找到开始挑战按钮")
        except Exception as e:
            print(f"❌ 场景交互失败: {e}")
        
        print("🎯 演示完成！浏览器将保持开启状态供您查看。")
        print("💡 您可以在浏览器中继续探索其他功能。")
        print("❌ 请手动关闭浏览器窗口以结束演示。")
        
        # 保持浏览器开启，让用户可以手动操作
        input("按Enter键关闭浏览器...")

if __name__ == "__main__":
    print("="*60)
    print("🎬 FAILURE LOGIC 浏览器交互演示")
    print("="*60)
    print("🔍 此演示将:")
    print("   1. 打开浏览器窗口")
    print("   2. 访问Failure Logic应用")
    print("   3. 展示主要交互流程")
    print("   4. 进行场景选择和决策")
    print("="*60)
    
    try:
        run_visual_demo()
    except Exception as e:
        print(f"❌ 演示过程中发生错误: {e}")
        input("按Enter键退出...")
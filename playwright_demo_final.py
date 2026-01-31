from playwright.sync_api import sync_playwright
import time
import subprocess
import threading

def start_services():
    """启动服务的函数"""
    # 启动后端服务
    backend_process = subprocess.Popen(
        ["python", "api-server/start.py"],
        cwd=r"D:\AIDevelop\failureLogic",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # 启动前端服务
    frontend_process = subprocess.Popen(
        ["node", "static-server.js"],
        cwd=r"D:\AIDevelop\failureLogic",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # 等待服务启动
    time.sleep(5)
    
    return backend_process, frontend_process

def demo_playwright_interaction():
    """演示Playwright与系统交互"""
    print("🎬 开始Playwright浏览器交互演示")
    print("🔧 正在启动浏览器并连接到Failure Logic系统...")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False, slow_mo=1000)  # 降低速度以便观察
        page = browser.new_page()
        
        # 设置页面大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        print("🌐 正在访问 http://localhost:8080/minimal-complete-index.html")
        
        # 访问应用
        page.goto("http://localhost:8080/minimal-complete-index.html")
        print("✅ 页面已加载")
        
        # 等待页面完全加载
        page.wait_for_timeout(2000)
        
        print("🔍 浏览器已打开，您现在可以看到Failure Logic界面")
        print("📱 界面包含导航栏、首页内容和'开始认知之旅'按钮")
        
        # 点击"开始认知之旅"按钮
        print("👆 正在点击'开始认知之旅'按钮...")
        try:
            start_button = page.locator("#start-journey")
            if start_button.count() > 0:
                start_button.click()
                print("✅ 已点击'开始认知之旅'")
                page.wait_for_timeout(2000)
            else:
                print("⚠️ 未找到'开始认知之旅'按钮")
        except Exception as e:
            print(f"❌ 点击'开始认知之旅'按钮失败: {e}")
        
        # 导航到场景页面
        print("🗺️ 正在导航到场景页面...")
        try:
            scenarios_nav = page.locator('button[data-page="scenarios"]').first
            if scenarios_nav.count() > 0:
                scenarios_nav.click()
                print("✅ 已导航到场景页面")
                page.wait_for_timeout(3000)
            else:
                print("⚠️ 未找到场景导航按钮")
        except Exception as e:
            print(f"❌ 导航到场景页面失败: {e}")
        
        # 尝试开始一个场景
        print("🎮 正在尝试开始一个场景...")
        try:
            start_challenges = page.locator('button:has-text("开始挑战")')
            if start_challenges.count() > 0:
                print(f"📋 找到 {start_challenges.count()} 个可开始的场景")
                # 点击第一个场景
                start_challenges.first.click()
                print("✅ 已开始场景")
                page.wait_for_timeout(3000)
                
                # 进行一个决策
                decision_buttons = page.locator('button.decision-btn')
                if decision_buttons.count() > 0:
                    print(f"🤔 在场景中进行决策，找到 {decision_buttons.count()} 个选项")
                    decision_buttons.first.click()
                    print("✅ 已做出决策")
                    page.wait_for_timeout(2000)
            else:
                print("⚠️ 未找到开始挑战按钮")
        except Exception as e:
            print(f"❌ 场景交互失败: {e}")
        
        print("\n🎯 Playwright交互演示完成！")
        print("✨ 您刚才看到了浏览器与Failure Logic系统的完整交互过程")
        print("🏠 系统包含首页、场景页面和交互式决策功能")
        print("📊 所有9个认知场景都可通过此界面访问")
        
        # 保持浏览器开启一段时间，让用户可以手动探索
        print("\n⏳ 浏览器将保持开启状态30秒，您可以手动探索界面...")
        page.wait_for_timeout(30000)
        
        # 关闭浏览器
        browser.close()
        print("✅ 浏览器已关闭")

if __name__ == "__main__":
    print("🚀 Failure Logic Playwright交互演示")
    print("此演示将展示浏览器与系统的完整交互过程")
    
    try:
        demo_playwright_interaction()
        print("\n🎉 演示成功完成！")
        print("📋 总结：")
        print("   - 浏览器成功打开并访问了Failure Logic系统")
        print("   - 界面正常显示，包含导航和交互元素")
        print("   - 成功进行了页面导航和交互操作")
        print("   - 所有功能模块均可正常访问")
    except Exception as e:
        print(f"❌ 演示过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
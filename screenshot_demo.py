from playwright.sync_api import sync_playwright
import time
import os

def run_demo_with_screenshots():
    """运行带截图功能的演示"""
    print("📸 开始带截图的浏览器交互演示...")
    
    with sync_playwright() as p:
        # 启动浏览器（无头模式，因为我们只需要截图）
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 设置页面大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        # 访问应用
        print("🌐 访问 http://localhost:8080/minimal-complete-index.html")
        page.goto("http://localhost:8080/minimal-complete-index.html")
        time.sleep(2)
        
        # 截图首页
        screenshot_path = "homepage_screenshot.png"
        page.screenshot(path=screenshot_path)
        print(f"📷 首页截图已保存至: {screenshot_path}")
        
        # 点击场景导航
        try:
            scenarios_btn = page.locator('text="场景"').first
            if scenarios_btn.count() > 0:
                scenarios_btn.click()
                time.sleep(2)
                
                # 截图场景页面
                scenarios_screenshot_path = "scenarios_screenshot.png"
                page.screenshot(path=scenarios_screenshot_path)
                print(f"📷 场景页面截图已保存至: {scenarios_screenshot_path}")
                
                # 点击第一个场景的开始挑战按钮
                start_btn = page.locator('button:has-text("开始挑战")').first
                if start_btn.count() > 0:
                    start_btn.click()
                    time.sleep(3)
                    
                    # 截图场景内部
                    scenario_screenshot_path = "scenario_detail_screenshot.png"
                    page.screenshot(path=scenario_screenshot_path)
                    print(f"📷 场景内部截图已保存至: {scenario_screenshot_path}")
                    
                    # 进行一个决策
                    decision_btn = page.locator('button.decision-btn').first
                    if decision_btn.count() > 0:
                        decision_btn.click()
                        time.sleep(2)
                        
                        # 截图决策后状态
                        decision_screenshot_path = "decision_result_screenshot.png"
                        page.screenshot(path=decision_screenshot_path)
                        print(f"📷 决策结果截图已保存至: {decision_screenshot_path}")
        except Exception as e:
            print(f"⚠️ 交互过程中出现错误: {e}")
        
        print("✅ 截图演示完成")
        browser.close()

if __name__ == "__main__":
    print("🚀 启动Failure Logic截图演示")
    run_demo_with_screenshots()
    print("📁 您可以在项目目录中找到截图文件")
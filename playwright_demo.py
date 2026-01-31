from playwright.sync_api import sync_playwright
import time
import threading
import subprocess
import sys
import os

def run_playwright_test():
    """使用Playwright进行用户交互演示"""
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 设置为False以便观看演示
        page = browser.new_page()
        
        # 访问前端应用
        print("正在访问前端应用...")
        page.goto("http://localhost:8080/minimal-complete-index.html")
        page.wait_for_timeout(2000)
        
        print("页面加载完成，开始演示...")
        
        # 点击"开始认知之旅"
        start_button = page.locator("#start-journey")
        start_button.click()
        page.wait_for_timeout(2000)
        
        print("已点击'开始认知之旅'")
        
        # 点击"场景"导航
        scenarios_link = page.locator('a[data-page="scenarios"]')
        scenarios_link.click()
        page.wait_for_timeout(2000)
        
        print("已导航到场景页面")
        
        # 选择一个场景（例如咖啡店场景）
        coffee_shop_button = page.locator('button:has-text("开始挑战")').first
        coffee_shop_button.click()
        page.wait_for_timeout(3000)
        
        print("已开始咖啡店场景")
        
        # 进行第一个决策（雇佣员工）
        hire_staff_button = page.locator('button:has-text("雇佣员工")')
        if hire_staff_button.count() > 0:
            hire_staff_button.first.click()
            page.wait_for_timeout(2000)
            print("已选择雇佣员工")
        
        # 进行第二个决策（扩大店面）
        expand_space_button = page.locator('button:has-text("扩大店面")')
        if expand_space_button.count() > 0:
            expand_space_button.first.click()
            page.wait_for_timeout(2000)
            print("已选择扩大店面")
        
        # 进行第三个决策（重新开始）
        restart_button = page.locator('#complete-restart')
        if restart_button.count() > 0:
            restart_button.click()
            page.wait_for_timeout(2000)
            print("已重新开始场景")
        
        # 返回场景列表
        back_to_scenarios = page.locator('button:has-text("返回场景列表")')
        if back_to_scenarios.count() > 0:
            back_to_scenarios.click()
            page.wait_for_timeout(2000)
            print("已返回场景列表")
        
        # 尝试另一个场景（恋爱关系）
        relationship_buttons = page.locator('button:has-text("开始挑战")')
        if relationship_buttons.count() > 1:
            relationship_buttons.nth(1).click()  # 选择第二个场景
            page.wait_for_timeout(3000)
            print("已开始恋爱关系场景")
            
            # 进行决策
            spend_time_button = page.locator('button:has-text("花更多时间相处")')
            if spend_time_button.count() > 0:
                spend_time_button.first.click()
                page.wait_for_timeout(2000)
                print("已选择花更多时间相处")
                
                travel_button = page.locator('button:has-text("一起旅行")')
                if travel_button.count() > 0:
                    travel_button.first.click()
                    page.wait_for_timeout(2000)
                    print("已选择一起旅行")
        
        print("演示完成！")
        
        # 保持浏览器打开一段时间以便观察
        page.wait_for_timeout(5000)
        
        # 关闭浏览器
        browser.close()

def check_services():
    """检查后端和前端服务是否运行"""
    import requests
    
    # 检查后端服务
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ 后端服务运行正常")
        else:
            print("❌ 后端服务响应异常")
    except Exception as e:
        print(f"❌ 后端服务不可达: {e}")
    
    # 检查前端服务
    try:
        response = requests.get("http://localhost:8080/", timeout=5)
        if response.status_code == 200:
            print("✅ 前端服务运行正常")
        else:
            print("❌ 前端服务响应异常")
    except Exception as e:
        print(f"❌ 前端服务不可达: {e}")

if __name__ == "__main__":
    print("开始验证系统...")
    
    # 检查服务状态
    check_services()
    
    print("\n开始Playwright用户交互演示...")
    run_playwright_test()
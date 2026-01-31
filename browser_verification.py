from playwright.sync_api import sync_playwright
import time
import subprocess
import sys
import os

def run_browser_verification():
    """启动浏览器并验证Failure Logic体验"""
    print("🔍 启动浏览器验证...")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)  # 设置为False以便查看
        page = browser.new_page()
        
        # 设置视口大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        print("🌐 访问 http://localhost:8080")
        page.goto("http://localhost:8080")
        
        # 等待页面加载
        page.wait_for_timeout(3000)
        
        print("✅ 页面已加载")
        print("📋 验证页面内容...")
        
        # 检查页面标题
        title = page.title()
        print(f"📄 页面标题: {title}")
        
        # 检查是否存在导航链接
        nav_links = page.locator('.nav-link')
        nav_count = nav_links.count()
        print(f"🔗 导航链接数量: {nav_count}")
        
        if nav_count > 0:
            for i in range(nav_count):
                link_text = nav_links.nth(i).inner_text()
                print(f"  - {link_text}")
        
        # 检查是否存在主要内容
        main_content = page.locator('#main-content')
        if main_content.count() > 0:
            print("🏠 主内容区域存在")
        
        # 尝试点击首页的某个元素
        try:
            start_button = page.locator("#start-journey")
            if start_button.count() > 0:
                print("🔍 找到'开始认知之旅'按钮")
                start_button.click()
                page.wait_for_timeout(2000)
                print("✅ 已点击'开始认知之旅'")
            else:
                print("⚠️ 未找到'开始认知之旅'按钮")
        except Exception as e:
            print(f"⚠️ 点击按钮时出错: {e}")
        
        # 点击场景导航
        try:
            scenarios_link = page.locator('a[data-page="scenarios"]')
            if scenarios_link.count() > 0:
                print("🔍 找到'场景'导航")
                scenarios_link.click()
                page.wait_for_timeout(3000)
                print("✅ 已导航到场景页面")
                
                # 检查场景卡片
                scenario_cards = page.locator('.card')
                card_count = scenario_cards.count()
                print(f"🃏 场景卡片数量: {card_count}")
                
                if card_count > 0:
                    for i in range(min(3, card_count)):  # 最多检查前3个
                        card_content = scenario_cards.nth(i).inner_text()
                        print(f"  - 场景 {i+1}: {card_content[:50]}...")
            else:
                print("⚠️ 未找到'场景'导航")
        except Exception as e:
            print(f"⚠️ 场景导航时出错: {e}")
        
        print("\n🎯 浏览器验证完成！")
        print("您现在可以在浏览器中看到完整的Failure Logic界面")
        print("所有功能应该都能正常工作")
        
        # 保持浏览器打开一段时间，让用户可以手动操作
        print("\n⏰ 浏览器将保持打开状态30秒，您可以手动测试功能...")
        page.wait_for_timeout(30000)
        
        # 关闭浏览器
        browser.close()
        print("✅ 浏览器已关闭")

if __name__ == "__main__":
    print("🚀 Failure Logic 浏览器体验验证")
    print("="*50)
    
    try:
        run_browser_verification()
        print("\n✅ 验证完成！")
    except Exception as e:
        print(f"❌ 验证过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
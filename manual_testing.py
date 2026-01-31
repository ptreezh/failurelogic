from playwright.sync_api import sync_playwright
import time
import subprocess
import sys
import os

def run_manual_testing():
    """启动浏览器并保持打开状态以供手动测试"""
    print("🔍 启动浏览器以供手动测试...")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False, devtools=True)  # 打开开发者工具
        page = browser.new_page()
        
        # 设置视口大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        print("🌐 访问 http://localhost:8080")
        page.goto("http://localhost:8080")
        
        # 等待页面加载
        page.wait_for_timeout(3000)
        
        print("✅ 页面已加载")
        print("📋 检查页面内容...")
        
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
        
        print("\n🎯 浏览器已打开，现在您可以手动测试以下功能：")
        print("   1. 点击导航菜单（首页、场景、关于、书籍）")
        print("   2. 点击'开始认知之旅'按钮")
        print("   3. 在场景页面选择并开始挑战")
        print("   4. 在场景中进行交互式决策")
        print("   5. 检查开发者工具中的控制台日志")
        print("\n⏰ 浏览器将保持打开状态，直到您手动关闭它")
        print("💡 请在浏览器中进行测试，然后手动关闭浏览器窗口")
        
        # 等待用户手动关闭浏览器
        try:
            # 等待页面关闭
            page.wait_for_timeout(60000)  # 等待60秒
            print("⏰ 60秒已过，如果您仍在测试，请刷新页面继续...")
        except:
            pass
        
        # 检查浏览器是否仍然打开
        if not browser.is_connected():
            print("❌ 浏览器已关闭")
        else:
            print("ℹ️  浏览器仍在运行，您可以继续手动测试")
            input("按Enter键关闭浏览器...")

if __name__ == "__main__":
    print("🚀 Failure Logic 手动测试环境")
    print("="*50)
    
    try:
        run_manual_testing()
        print("\n✅ 手动测试环境已启动！")
        print("请在浏览器中进行测试，所有功能都应该正常工作")
    except Exception as e:
        print(f"❌ 启动过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
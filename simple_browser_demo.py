from playwright.sync_api import sync_playwright
import time

def simple_demo():
    """简单演示，打开浏览器并展示交互"""
    print("🎬 打开浏览器进行交互演示...")
    
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False, slow_mo=1000)
        page = browser.new_page()
        
        # 设置页面大小
        page.set_viewport_size({"width": 1280, "height": 720})
        
        # 访问应用
        print("🌐 访问 http://localhost:8080/minimal-complete-index.html")
        page.goto("http://localhost:8080/minimal-complete-index.html")
        print("✅ 页面已加载")
        
        print("🔍 您现在可以在浏览器中看到应用界面")
        print("📱 您可以手动点击导航、选择场景并进行交互")
        print("⏰ 演示将在30秒后自动关闭浏览器...")
        
        # 等待30秒，让用户可以手动交互
        for i in range(30, 0, -1):
            print(f"⏳ 剩余时间: {i}秒", end="\r")
            time.sleep(1)
        
        print("\n👋 演示结束，正在关闭浏览器...")
        browser.close()
        print("✅ 浏览器已关闭")

if __name__ == "__main__":
    print("🚀 启动Failure Logic浏览器交互演示")
    simple_demo()
    print("🎉 演示完成！")
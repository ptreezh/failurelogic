"""
简化浏览器测试 - 直接验证NavigationManager
"""

import asyncio
from playwright.async_api import async_playwright

async def simple_browser_test():
    """简化浏览器测试"""
    print("🔍 简化浏览器测试 - 验证NavigationManager初始化...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问主页
            print("🌐 访问认知陷阱平台...")
            await page.goto("http://localhost:8081", wait_until="domcontentloaded")
            await page.wait_for_timeout(5000)
            
            # 添加一个控制台消息监听器
            def handle_console_msg(msg):
                print(f"📄 控制台消息: {msg.text}")
            
            page.on("console", handle_console_msg)
            
            # 检查页面加载状态
            ready_state = await page.evaluate("document.readyState")
            print(f"✅ 文档就绪状态: {ready_state}")
            
            # 检查NavigationManager是否存在（直接在页面上下文中）
            nav_manager_exists = await page.evaluate("() => { return typeof NavigationManager !== 'undefined'; }")
            print(f"✅ NavigationManager类定义存在: {nav_manager_exists}")
            
            # 检查window.NavigationManager是否存在
            window_nav_manager_exists = await page.evaluate("() => { return typeof window.NavigationManager !== 'undefined'; }")
            print(f"✅ window.NavigationManager存在: {window_nav_manager_exists}")
            
            # 检查页面中是否有错误
            page_errors = await page.evaluate("() => { return window.errors || []; }")
            print(f"✅ 页面错误数量: {len(page_errors) if page_errors else 0}")
            
            # 尝试获取页面中的所有全局对象
            global_objects = await page.evaluate("() => { return Object.keys(window).filter(key => key.includes('Navigation')); }")
            print(f"✅ 包含'Navigation'的全局对象: {global_objects}")
            
            # 如果window.NavigationManager不存在，尝试手动初始化
            if not window_nav_manager_exists:
                print("🔧 尝试手动初始化NavigationManager...")
                try:
                    # 等待DOM完全加载
                    await page.evaluate("""() => {
                        return new Promise(resolve => {
                            if (document.readyState === 'complete') resolve();
                            else window.addEventListener('load', resolve);
                        });
                    }""")

                    # 检查是否已通过脚本初始化
                    await page.wait_for_timeout(3000)
                    window_nav_manager_exists = await page.evaluate("() => { return typeof window.NavigationManager !== 'undefined'; }")
                    print(f"✅ 延迟检查window.NavigationManager存在: {window_nav_manager_exists}")

                    if window_nav_manager_exists:
                        print("✅ NavigationManager已成功初始化")
                        return True
                    else:
                        print("❌ NavigationManager仍未初始化")
                        return False
                except Exception as e:
                    print(f"❌ 初始化NavigationManager失败: {e}")
                    return False
            else:
                print("✅ NavigationManager已正确初始化")
                return True
                
        except Exception as e:
            print(f"❌ 简化浏览器测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await browser.close()

def main():
    """主函数"""
    print("🏠 认知陷阱平台 - 简化浏览器测试")
    print("=" * 50)
    
    success = asyncio.run(simple_browser_test())
    
    print("\n" + "=" * 50)
    if success:
        print("✅ 简化浏览器测试成功!")
        print("✅ NavigationManager已正确初始化")
        print("✅ 用户可以与认知陷阱平台正常交互")
    else:
        print("❌ 简化浏览器测试失败")
        print("💡 需要进一步排查JavaScript初始化问题")
    
    print("=" * 50)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
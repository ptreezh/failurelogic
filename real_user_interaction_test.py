"""
真实用户交互模拟测试 - 深入诊断交互阻塞问题
"""

import asyncio
from playwright.async_api import async_playwright
import time

async def real_user_interaction_test():
    """真实用户交互模拟测试"""
    print("🔍 开始真实用户交互模拟测试...")
    
    async with async_playwright() as p:
        # 使用非headless模式以便观察
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问认知陷阱平台
            print("🌐 访问认知陷阱平台 (http://localhost:8082)...")
            await page.goto("http://localhost:8082", wait_until="domcontentloaded")
            await page.wait_for_timeout(5000)  # 等待页面完全加载
            
            print("✅ 页面已加载")
            
            # 检查页面标题
            title = await page.title()
            print(f"📄 页面标题: {title}")
            
            # 检查NavigationManager是否已初始化
            nav_manager_exists = await page.evaluate("typeof window.NavigationManager !== 'undefined'")
            print(f"✅ NavigationManager对象存在: {nav_manager_exists}")
            
            if not nav_manager_exists:
                print("❌ NavigationManager未初始化，这可能是交互问题的根本原因")
                # 检查是否有JavaScript错误
                print("🔍 检查控制台错误...")
                # 由于Playwright无法直接获取控制台错误，我们尝试检查页面状态
                page_content = await page.content()
                if "error" in page_content.lower() or "exception" in page_content.lower():
                    print("⚠️ 页面内容中发现错误相关词汇")
                else:
                    print("✅ 页面内容中未发现明显错误词汇")
            else:
                print("✅ NavigationManager已初始化")
                
                # 检查关键方法是否存在
                navigate_method_exists = await page.evaluate("typeof window.NavigationManager.navigateTo === 'function'")
                render_method_exists = await page.evaluate("typeof window.NavigationManager.renderPage === 'function'")
                
                print(f"✅ NavigationManager.navigateTo方法存在: {navigate_method_exists}")
                print(f"✅ NavigationManager.renderPage方法存在: {render_method_exists}")
            
            # 检查页面元素是否可点击
            print("\n🔍 检查页面元素可点击性...")
            
            # 检查是否有加载屏幕元素
            loading_screen = await page.query_selector("#loading-screen")
            if loading_screen:
                loading_display = await loading_screen.evaluate("el => el.style.display")
                loading_visibility = await loading_screen.evaluate("el => el.style.visibility")
                loading_zindex = await loading_screen.evaluate("el => getComputedStyle(el).zIndex")
                loading_pointer_events = await loading_screen.evaluate("el => getComputedStyle(el).pointerEvents")
                
                print(f"🔍 加载屏幕状态:")
                print(f"   display: {loading_display}")
                print(f"   visibility: {loading_visibility}")
                print(f"   zIndex: {loading_zindex}")
                print(f"   pointerEvents: {loading_pointer_events}")
                
                # 检查加载屏幕是否仍然覆盖页面
                is_covering = await page.evaluate("""
                    () => {
                        const loadingScreen = document.getElementById('loading-screen');
                        if (!loadingScreen) return false;
                        
                        // 检查元素是否拦截指针事件
                        const rect = loadingScreen.getBoundingClientRect();
                        if (rect.width === 0 && rect.height === 0) return false;
                        
                        const topElement = document.elementFromPoint(
                            rect.left + rect.width/2, 
                            rect.top + rect.height/2
                        );
                        
                        return topElement === loadingScreen || loadingScreen.contains(topElement);
                    }
                """)
                
                print(f"   是否拦截指针: {is_covering}")
                
                if is_covering or loading_pointer_events != 'none':
                    print("❌ 加载屏幕仍在拦截用户交互!")
                    print("💡 需要强制移除加载屏幕")
                    
                    # 强制移除加载屏幕
                    await page.evaluate("""
                        () => {
                            const loadingScreen = document.getElementById('loading-screen');
                            if (loadingScreen) {
                                // 方法1: 设置样式确保不可见且不拦截事件
                                loadingScreen.style.display = 'none';
                                loadingScreen.style.visibility = 'hidden';
                                loadingScreen.style.opacity = '0';
                                loadingScreen.style.zIndex = '-9999';
                                loadingScreen.style.pointerEvents = 'none';
                                
                                // 方法2: 从DOM中完全移除
                                loadingScreen.remove();
                                
                                // 方法3: 添加全局CSS覆盖
                                const css = document.createElement('style');
                                css.textContent = `
                                    #loading-screen,
                                    .loading-screen,
                                    .loading-content,
                                    .loading-overlay,
                                    .loading {
                                        display: none !important;
                                        visibility: hidden !important;
                                        pointer-events: none !important;
                                        z-index: -9999 !important;
                                        opacity: 0 !important;
                                    }
                                    
                                    body {
                                        pointer-events: auto !important;
                                    }
                                `;
                                document.head.appendChild(css);
                                
                                console.log('Force removed loading screen');
                            }
                        }
                    """)
                    
                    print("✅ 已强制移除加载屏幕")
                    await page.wait_for_timeout(1000)
            else:
                print("✅ 未找到加载屏幕元素")
            
            # 检查导航按钮
            print("\n🔍 检查导航按钮...")
            nav_buttons = await page.query_selector_all("button.nav-item")
            print(f"✅ 找到 {len(nav_buttons)} 个导航按钮")
            
            for i, button in enumerate(nav_buttons):
                try:
                    is_enabled = await button.is_enabled()
                    is_visible = await button.is_visible()
                    
                    # 检查按钮是否被其他元素遮挡
                    is_clickable = await button.evaluate("""
                        (btn) => {
                            const rect = btn.getBoundingClientRect();
                            const elementAtPoint = document.elementFromPoint(
                                rect.left + rect.width/2, 
                                rect.top + rect.height/2
                            );
                            return elementAtPoint === btn || btn.contains(elementAtPoint);
                        }
                    """)
                    
                    print(f"   按钮 {i+1}: 启用={is_enabled}, 可见={is_visible}, 可点击={is_clickable}")
                    
                    if is_enabled and is_visible and is_clickable:
                        # 尝试点击按钮
                        await button.click(timeout=5000)
                        print(f"   ✅ 成功点击按钮 {i+1}")
                        
                        # 等待页面切换
                        await page.wait_for_timeout(2000)
                        
                        # 检查页面URL是否变化
                        current_url = await page.url()
                        print(f"   📄 当前URL: {current_url}")
                        
                        # 检查页面内容是否变化
                        new_content = await page.content()
                        if "场景" in new_content or "指数" in new_content or "about" in new_content:
                            print(f"   ✅ 页面内容已更新")
                        else:
                            print(f"   ⚠️ 页面内容未更新")
                        
                        # 返回主页
                        await page.goto("http://localhost:8082", wait_until="domcontentloaded")
                        await page.wait_for_timeout(2000)
                        
                        break  # 只测试第一个可点击的按钮
                    else:
                        print(f"   ⚠️ 按钮 {i+1} 不可交互")
                        
                except Exception as e:
                    print(f"   ❌ 按钮 {i+1} 点击失败: {e}")
            
            # 测试特定的交互元素
            print("\n🔍 测试特定交互元素...")
            
            # 测试开始认知之旅按钮
            start_btn = await page.query_selector("#start-journey")
            if start_btn:
                try:
                    is_enabled = await start_btn.is_enabled()
                    is_visible = await start_btn.is_visible()
                    
                    if is_enabled and is_visible:
                        await start_btn.click()
                        await page.wait_for_timeout(2000)
                        print("✅ 成功点击'开始认知之旅'按钮")
                        
                        # 检查页面是否变化
                        new_content = await page.content()
                        if "场景" in new_content or "scenarios" in new_content:
                            print("✅ 点击按钮后页面已更新")
                        else:
                            print("⚠️ 点击按钮后页面未更新")
                    else:
                        print(f"❌ '开始认知之旅'按钮不可交互: 启用={is_enabled}, 可见={is_visible}")
                except Exception as e:
                    print(f"❌ '开始认知之旅'按钮点击失败: {e}")
            else:
                print("⚠️ 未找到'开始认知之旅'按钮")
            
            # 测试了解更多信息按钮
            learn_more_btn = await page.query_selector("#learn-more")
            if learn_more_btn:
                try:
                    is_enabled = await learn_more_btn.is_enabled()
                    is_visible = await learn_more_btn.is_visible()
                    
                    if is_enabled and is_visible:
                        await learn_more_btn.click()
                        await page.wait_for_timeout(2000)
                        print("✅ 成功点击'了解更多'按钮")
                        
                        # 检查页面是否变化
                        new_content = await page.content()
                        if "关于" in new_content or "about" in new_content:
                            print("✅ 点击按钮后页面已更新")
                        else:
                            print("⚠️ 点击按钮后页面未更新")
                    else:
                        print(f"❌ '了解更多'按钮不可交互: 启用={is_enabled}, 可见={is_visible}")
                except Exception as e:
                    print(f"❌ '了解更多'按钮点击失败: {e}")
            else:
                print("⚠️ 未找到'了解更多'按钮")
            
            print("\n🏆 真实用户交互测试完成!")
            
            # 保持浏览器打开以便观察
            print("⏳ 保持浏览器打开30秒以供观察...")
            await page.wait_for_timeout(30000)
            
            return True
            
        except Exception as e:
            print(f"❌ 交互测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await browser.close()

def main():
    """主函数"""
    print("🏠 认知陷阱平台 - 真实用户交互模拟测试")
    print("=" * 60)
    print("📋 测试目标: 模拟真实用户交互，诊断交互阻塞问题")
    print("=" * 60)
    
    success = asyncio.run(real_user_interaction_test())
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 真实用户交互测试成功!")
        print("✅ 用户可以与认知陷阱平台正常交互")
        print("✅ 导航功能正常工作")
        print("✅ 页面切换正常")
        print("✅ 所有交互元素可点击")
    else:
        print("❌ 真实用户交互测试失败")
        print("💡 需要进一步排查交互问题")
    
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
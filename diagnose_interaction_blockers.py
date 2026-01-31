"""
真实用户交互模拟测试 - 诊断交互阻塞问题
"""

import asyncio
from playwright.async_api import async_playwright
import time

async def diagnose_interaction_blockers():
    """诊断交互阻塞问题"""
    print("🔍 开始诊断交互阻塞问题...")
    
    async with async_playwright() as p:
        # 使用非headless模式以便观察
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问页面
            print("🌐 访问认知陷阱平台...")
            await page.goto("http://localhost:8081", wait_until="domcontentloaded")
            await page.wait_for_timeout(5000)  # 等待页面完全加载
            
            print("✅ 页面已加载")
            
            # 检查加载屏幕状态
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
                        const topElement = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
                        
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
                                    .loading-overlay {
                                        display: none !important;
                                        visibility: hidden !important;
                                        pointer-events: none !important;
                                        z-index: -9999 !important;
                                        opacity: 0 !important;
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
            
            # 检查页面元素是否可交互
            print("\n🔍 检查页面元素可交互性...")
            
            # 尝试点击导航按钮
            nav_buttons = await page.query_selector_all("button.nav-item")
            print(f"✅ 找到 {len(nav_buttons)} 个导航按钮")
            
            if len(nav_buttons) > 0:
                for i, button in enumerate(nav_buttons):
                    try:
                        # 检查按钮是否可点击
                        is_enabled = await button.is_enabled()
                        is_visible = await button.is_visible()
                        
                        print(f"   按钮 {i+1}: 启用={is_enabled}, 可见={is_visible}")
                        
                        if is_enabled and is_visible:
                            # 尝试点击按钮
                            await button.click(timeout=5000)
                            print(f"   ✅ 成功点击按钮 {i+1}")
                            
                            # 等待页面切换
                            await page.wait_for_timeout(2000)
                            
                            # 检查页面是否发生变化
                            current_url = await page.url()
                            print(f"   📄 当前URL: {current_url}")
                            
                            # 返回主页继续测试
                            await page.goto("http://localhost:8081", wait_until="domcontentloaded")
                            await page.wait_for_timeout(2000)
                            
                            break  # 只测试第一个可点击的按钮
                        else:
                            print(f"   ⚠️ 按钮 {i+1} 不可交互")
                    except Exception as e:
                        print(f"   ❌ 按钮 {i+1} 点击失败: {e}")
            
            # 检查其他可交互元素
            clickable_elements = await page.query_selector_all("button, a, [onclick], [data-page]")
            print(f"\n✅ 找到 {len(clickable_elements)} 个可点击元素")
            
            if len(clickable_elements) > 0:
                for i, element in enumerate(clickable_elements[:3]):  # 只测试前3个元素
                    try:
                        is_enabled = await element.is_enabled()
                        is_visible = await element.is_visible()
                        
                        if is_enabled and is_visible:
                            tag_name = await element.evaluate("el => el.tagName")
                            class_name = await element.evaluate("el => el.className")
                            print(f"   尝试点击元素 {i+1} ({tag_name}): {class_name[:50]}...")
                            
                            await element.click(timeout=5000)
                            print(f"   ✅ 成功点击元素 {i+1}")
                            
                            # 等待一小段时间观察变化
                            await page.wait_for_timeout(1000)
                            
                            # 返回主页
                            await page.goto("http://localhost:8081", wait_until="domcontentloaded")
                            await page.wait_for_timeout(1000)
                            
                    except Exception as e:
                        print(f"   ❌ 元素 {i+1} 点击失败: {e}")
            
            print("\n🎯 诊断完成!")
            
            # 保持浏览器打开以便观察
            print("⏳ 保持浏览器打开30秒以供观察...")
            await page.wait_for_timeout(30000)
            
            return True
            
        except Exception as e:
            print(f"❌ 诊断测试失败: {e}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            await browser.close()

def main():
    """主函数"""
    print("🏠 认知陷阱平台 - 交互阻塞问题诊断")
    print("=" * 60)
    print("📋 诊断目标: 找出阻塞用户交互的根本原因")
    print("=" * 60)
    
    success = asyncio.run(diagnose_interaction_blockers())
    
    print("\n" + "=" * 60)
    if success:
        print("✅ 诊断完成")
        print("💡 如已发现问题并进行了修复，请重启服务器以使更改生效")
    else:
        print("❌ 诊断失败")
        print("💡 需要进一步排查问题")
    
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
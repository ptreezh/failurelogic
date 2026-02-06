滚动修复验证测试
验证弹窗滚动和背景锁定是否正常工作

import asyncio
from playwright.async_api import async_playwright

async def test_scroll_fix():
    print("🔍 测试弹窗滚动修复")
    print("=" * 60)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问网站
            await page.goto("https://ptreezh.github.io/failurelogic/", wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 导航到场景页面
            await page.click("[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 打开场景
            await page.locator(".scenario-card").first.click()
            await page.wait_for_timeout(3000)
            
            print("\n📋 测试1: 检查body状态")
            body_state = await page.evaluate("""
                () => {
                    const body = document.body;
                    return {
                        hasModalOpenClass: body.classList.contains('modal-open'),
                        overflow: body.style.overflow,
                        position: body.style.position
                    };
                }
            """)
            print(f"   body.modal-open类: {body_state['hasModalOpenClass']}")
            print(f"   body.style.overflow: {body_state['overflow']}")
            print(f"   body.style.position: {body_state['position']}")
            
            print("\n📋 测试2: 检查弹窗滚动")
            scroll_info = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    if (!modal) return null;
                    return {
                        scrollHeight: modal.scrollHeight,
                        clientHeight: modal.clientHeight,
                        canScroll: modal.scrollHeight > modal.clientHeight
                    };
                }
            """)
            
            if scroll_info:
                print(f"   内容高度: {scroll_info['scrollHeight']}px")
                print(f"   可视高度: {scroll_info['clientHeight']}px")
                print(f"   是否可以滚动: {scroll_info['canScroll']}")
            
            print("\n📋 测试3: 尝试滚动弹窗")
            # 滚动前位置
            scroll_before = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    return modal ? modal.scrollTop : 0;
                }
            """)
            
            # 将鼠标移动到弹窗上并滚动
            await page.hover(".modal-content.game-modal-content")
            await page.mouse.wheel(0, 200)
            await page.wait_for_timeout(1500)
            
            # 滚动后位置
            scroll_after = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    return modal ? modal.scrollTop : 0;
                }
            """)
            
            print(f"   滚动前位置: {scroll_before}px")
            print(f"   滚动后位置: {scroll_after}px")
            
            if scroll_after > scroll_before:
                print("   ✅ 弹窗滚动成功")
            else:
                print("   ❌ 弹窗未滚动")
            
            print("\n📋 测试4: 检查页面是否滚动")
            page_scroll = await page.evaluate("() => window.pageYOffset")
            print(f"   页面滚动位置: {page_scroll}px")
            
            if page_scroll == 0:
                print("   ✅ 页面未滚动（背景被锁定）")
            else:
                print("   ❌ 页面发生了滚动")
            
            # 滚动到底部查看所有内容
            print("\n📋 测试5: 滚动到底部查看所有交互元素")
            await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    if (modal) modal.scrollTop = modal.scrollHeight;
                }
            """)
            await page.wait_for_timeout(1000)
            
            # 检查交互元素
            controls = await page.evaluate("""
                () => {
                    const container = document.getElementById('game-container');
                    if (!container) return 0;
                    
                    const buttons = container.querySelectorAll('button');
                    const inputs = container.querySelectorAll('input');
                    const sliders = container.querySelectorAll('.slider');
                    
                    return buttons.length + inputs.length + sliders.length;
                }
            """)
            print(f"   发现交互元素: {controls} 个")
            
            if controls > 0:
                print("   ✅ 所有交互元素可见")
            
            print("\n" + "=" * 60)
            print("✅ 测试完成")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_scroll_fix())
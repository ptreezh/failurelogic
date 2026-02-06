"""
最终弹窗滚动测试
验证修复后的弹窗滚动功能
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime

async def test_modal_scroll_final():
    """测试修复后的弹窗滚动功能"""
    print("🧪 最终弹窗滚动功能测试")
    print("=" * 70)
    
    async with async_playwright() as p:
        print("\n🔍 启动浏览器...")
        browser = await p.chromium.launch(channel='msedge', headless=False)
        page = await browser.new_page()
        
        try:
            # 访问网站
            url = "https://ptreezh.github.io/failurelogic/"
            print(f"🌐 访问: {url}")
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 记录初始body样式
            initial_body_style = await page.evaluate("""
                () => {
                    const body = document.body;
                    return {
                        overflow: body.style.overflow,
                        position: body.style.position,
                        classList: body.classList.value
                    };
                }
            """)
            print(f"   初始body状态: {initial_body_style}")
            
            # 导航到场景页面
            await page.click("[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            await page.wait_for_selector(".scenario-card", state="visible")
            
            # 打开第一个场景
            print("\n🎯 打开第一个场景")
            await page.locator(".scenario-card").first.click()
            await page.wait_for_timeout(3000)
            
            # 检查弹窗打开后的body状态
            modal_open_body_style = await page.evaluate("""
                () => {
                    const body = document.body;
                    const modal = document.getElementById('game-modal');
                    return {
                        overflow: body.style.overflow,
                        position: body.style.position,
                        classList: body.classList.value,
                        modalActive: modal ? modal.classList.contains('active') : false
                    };
                }
            """)
            print(f"   弹窗打开后body状态: {modal_open_body_style}")
            
            if ('modal-open' in modal_open_body_style['classList']):
                print("   ✅ body.modal-open类已添加")
            else:
                print("   ❌ body.modal-open类未添加")
            
            # 测试1: 检查滚动条
            print("\n📌 测试1: 检查弹窗滚动条")
            has_scrollbar = await page.evaluate("""
                () => {
                    const modalContent = document.querySelector('.modal-content.game-modal-content');
                    if (!modalContent) return false;
                    
                    const hasScrollbar = modalContent.scrollHeight > modalContent.clientHeight;
                    console.log('ScrollHeight:', modalContent.scrollHeight);
                    console.log('ClientHeight:', modalContent.clientHeight);
                    console.log('Has scrollbar:', hasScrollbar);
                    
                    return {
                        hasScrollbar: hasScrollbar,
                        scrollHeight: modalContent.scrollHeight,
                        clientHeight: modalContent.clientHeight
                    };
                }
            """)
            
            print(f"   滚动高度: {has_scrollbar['scrollHeight']}px")
            print(f"   可视高度: {has_scrollbar['clientHeight']}px")
            
            if has_scrollbar['hasScrollbar']:
                print("   ✅ 检测到垂直滚动条")
            else:
                print("   ⚠️ 未检测到垂直滚动条")
            
            # 测试2: 尝试滚动弹窗内容
            print("\n📌 测试2: 滚动弹窗内容")
            print("   将鼠标移动到弹窗上...")
            await page.hover(".modal-content.game-modal-content")
            
            initial_scroll = await page.evaluate("""
                () => {
                    const modalContent = document.querySelector('.modal-content.game-modal-content');
                    return modalContent ? modalContent.scrollTop : 0;
                }
            """)
            print(f"   初始滚动位置: {initial_scroll}px")
            
            print("   模拟鼠标滚轮向下滚动...")
            await page.mouse.wheel(0, 300)  # 向下滚动300像素
            await page.wait_for_timeout(1000)
            
            after_scroll = await page.evaluate("""
                () => {
                    const modalContent = document.querySelector('.modal-content.game-modal-content');
                    return modalContent ? modalContent.scrollTop : 0;
                }
            """)
            print(f"   滚动后位置: {after_scroll}px")
            
            if after_scroll > initial_scroll:
                print("   ✅ 弹窗内容滚动成功")
            else:
                print("   ❌ 弹窗内容未滚动")
            
            # 测试3: 验证背景页面没有滚动
            print("\n📌 测试3: 验证背景页面未滚动")
            page_scroll = await page.evaluate("() => window.pageYOffset")
            print(f"   页面垂直滚动位置: {page_scroll}px")
            
            if page_scroll == 0:
                print("   ✅ 背景页面未滚动")
            else:
                print("   ❌ 背景页面发生了滚动")
            
            # 测试4: 查找并验证交互元素
            print("\n📌 测试4: 验证交互元素")
            
            # 滚动到底部查看所有内容
            await page.evaluate("""
                () => {
                    const modalContent = document.querySelector('.modal-content.game-modal-content');
                    if (modalContent) {
                        modalContent.scrollTop = modalContent.scrollHeight;
                    }
                }
            """)
            await page.wait_for_timeout(1000)
            
            controls = page.locator("#game-container button, #game-container input, #game-container .slider, #game-container select")
            control_count = await controls.count()
            print(f"   发现 {control_count} 个交互元素")
            
            if control_count > 0:
                # 检查所有交互元素的位置
                for i in range(min(control_count, 5)):  # 检查前5个
                    control = controls.nth(i)
                    bounding_box = await control.bounding_box()
                    
                    if bounding_box:
                        modal_box = await page.locator(".modal-content.game-modal-content").bounding_box()
                        if modal_box:
                            # 计算相对于modal的位置
                            relative_top = bounding_box['y'] - modal_box['y'] + (await page.evaluate("""
                                () => {
                                    const modal = document.querySelector('.modal-content.game-modal-content');
                                    return modal ? modal.scrollTop : 0;
                                }
                            ""))
                            
                            is_visible = relative_top >= 0 and relative_top <= modal_box['height']
                            
                            control_type = await control.evaluate("el => el.tagName")
                            print(f"   元素 {i+1} ({control_type}): y={relative_top:.1f}, 可见: {'是' if is_visible else '否'}")
            
            # 测试5: 关闭弹窗并验证body状态恢复
            print("\n📌 测试5: 关闭弹窗并验证状态恢复")
            await page.click("#close-modal")
            await page.wait_for_timeout(2000)
            
            after_close_body_style = await page.evaluate("""
                () => {
                    const body = document.body;
                    return {
                        overflow: body.style.overflow,
                        position: body.style.position,
                        classList: body.classList.value
                    };
                }
            """)
            print(f"   弹窗关闭后body状态: {after_close_body_style}")
            
            if ('modal-open' not in after_close_body_style['classList']):
                print("   ✅ body.modal-open类已移除")
            else:
                print("   ❌ body.modal-open类未移除")
            
            # 测试6: 验证页面可以再次滚动
            print("\n📌 测试6: 验证页面滚动恢复")
            await page.mouse.move(100, 100)
            await page.mouse.wheel(0, 200)  # 尝试滚动页面
            await page.wait_for_timeout(1000)
            
            page_scroll_after = await page.evaluate("() => window.pageYOffset")
            print(f"   页面滚动位置: {page_scroll_after}px")
            
            if page_scroll_after > 0:
                print("   ✅ 页面滚动已恢复")
            else:
                print("   ⚠️ 页面滚动可能未恢复（可能在页面顶部）")
            
            print(f"\n{'='*70}")
            print("📊 滚动测试完成")
            print(f"{'='*70}")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_modal_scroll_final())
"""
弹窗滚动功能测试
验证修复后的弹窗滚动是否正常工作
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime

async def test_modal_scroll():
    """测试弹窗滚动功能"""
    print("🧪 弹窗滚动功能测试")
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
            
            # 导航到场景页面
            await page.click("[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            await page.wait_for_selector(".scenario-card", state="visible")
            
            # 打开第一个场景
            print("\n🎯 打开第一个场景")
            await page.locator(".scenario-card").first.click()
            await page.wait_for_timeout(3000)
            
            # 截图1: 初始状态
            await page.screenshot(path="scroll_test_01_initial.png", full_page=True)
            print("📸 初始状态截图已保存")
            
            # 测试1: 检查滚动条是否存在
            print("\n📌 测试1: 检查滚动条")
            has_scrollbar = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content');
                    if (!modal) return false;
                    
                    const hasVerticalScrollbar = modal.scrollHeight > modal.clientHeight;
                    console.log('ScrollHeight:', modal.scrollHeight);
                    console.log('ClientHeight:', modal.clientHeight);
                    console.log('Has scrollbar:', hasVerticalScrollbar);
                    
                    return hasVerticalScrollbar;
                }
            """)
            
            if has_scrollbar:
                print("✅ 检测到垂直滚动条")
            else:
                print("⚠️ 未检测到垂直滚动条（内容可能未超出）")
            
            # 测试2: 滚动到不同位置
            print("\n📌 测试2: 滚动到不同位置")
            
            # 滚动到中间
            await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content');
                    if (modal) {
                        modal.scrollTop = modal.scrollHeight / 2;
                    }
                }
            """)
            await page.wait_for_timeout(1000)
            await page.screenshot(path="scroll_test_02_middle.png", full_page=True)
            print("📸 滚动到中间截图已保存")
            
            # 滚动到底部
            await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content');
                    if (modal) {
                        modal.scrollTop = modal.scrollHeight;
                    }
                }
            """)
            await page.wait_for_timeout(1000)
            await page.screenshot(path="scroll_test_03_bottom.png", full_page=True)
            print("📸 滚动到底部截图已保存")
            
            # 滚动回顶部
            await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content');
                    if (modal) {
                        modal.scrollTop = 0;
                    }
                }
            """)
            await page.wait_for_timeout(1000)
            print("✅ 滚动回顶部")
            
            # 测试3: 验证游戏内容是否完整
            print("\n📌 测试3: 验证游戏内容完整性")
            game_content = await page.evaluate("""
                () => {
                    const container = document.getElementById('game-container');
                    if (!container) return null;
                    
                    return {
                        innerHTML: container.innerHTML,
                        textLength: container.innerText.length,
                        elementCount: container.querySelectorAll('*').length
                    };
                }
            """)
            
            if game_content:
                print(f"   游戏内容长度: {game_content['textLength']} 字符")
                print(f"   元素数量: {game_content['elementCount']} 个")
                print("✅ 游戏内容加载完成")
            
            # 测试4: 验证交互元素是否在可视区域
            print("\n📌 测试4: 验证交互元素")
            controls = page.locator("#game-container button, #game-container input, #game-container .slider")
            control_count = await controls.count()
            print(f"   发现 {control_count} 个交互元素")
            
            if control_count > 0:
                # 获取第一个交互元素的位置
                first_control = controls.first
                control_box = await first_control.bounding_box()
                
                if control_box:
                    print(f"   第一个交互元素位置: y={control_box['y']:.1f}, height={control_box['height']:.1f}")
                    
                    # 检查是否在可视区域内 - 使用更精确的选择器
                    modal_box = await page.locator(".modal-content.game-modal-content").bounding_box()
                    if modal_box:
                        # 计算元素是否在modal可视区域内
                        control_top_in_modal = control_box['y'] - modal_box['y']
                        control_bottom_in_modal = control_top_in_modal + control_box['height']
                        
                        is_visible = (
                            control_top_in_modal >= 0 and
                            control_bottom_in_modal <= modal_box['height']
                        )
                        
                        if is_visible:
                            print("   ✅ 交互元素在可视区域内")
                        else:
                            print("   ⚠️ 交互元素在可视区域外，需要滚动")
                            print(f"      元素位置: {control_top_in_modal:.1f} - {control_bottom_in_modal:.1f}")
                            print(f"      Modal高度: {modal_box['height']:.1f}")
            
            # 测试5: 模拟用户滚动交互
            print("\n📌 测试5: 模拟用户滚动交互")
            print("   用户向下滚动查看内容...")
            
            # 使用更精确的选择器
            await page.hover(".modal-content.game-modal-content")
            await page.mouse.wheel(0, 300)  # 向下滚动300像素
            await page.wait_for_timeout(1000)
            
            scroll_position = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    return modal ? modal.scrollTop : 0;
                }
            """)
            print(f"   当前滚动位置: {scroll_position}px")
            
            if scroll_position > 0:
                print("   ✅ 滚动功能正常工作")
            else:
                print("   ❌ 滚动功能可能有问题")
            
            # 截图4: 滚动后
            await page.screenshot(path="scroll_test_04_after_scroll.png", full_page=True)
            print("📸 滚动后截图已保存")
            
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
    asyncio.run(test_modal_scroll())

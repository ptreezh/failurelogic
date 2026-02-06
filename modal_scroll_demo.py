"""
弹窗滚动问题演示和解决方案
演示远程网站的弹窗滚动问题并提供修复建议
"""

import asyncio
from playwright.async_api import async_playwright

async def demonstrate_modal_scroll_issue():
    """演示弹窗滚动问题"""
    print("🎬 弹窗滚动问题演示")
    print("=" * 70)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=300)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        try:
            # 访问远程网站
            print("\n🌐 访问远程网站...")
            await page.goto("https://ptreezh.github.io/failurelogic/", wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 演示问题1: 弹窗打开时背景可以滚动
            print("\n❌ 问题1: 弹窗打开时背景页面可以滚动")
            print("   步骤1: 导航到场景页面...")
            await page.click("[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            print("   步骤2: 打开第一个场景...")
            await page.locator(".scenario-card").first.click()
            await page.wait_for_timeout(3000)
            
            # 检查body状态
            body_info = await page.evaluate("""
                () => {
                    const body = document.body;
                    return {
                        classList: body.className,
                        overflow: body.style.overflow,
                        position: body.style.position
                    };
                }
            """)
            print(f"   当前body状态: {body_info}")
            
            if 'modal-open' not in body_info['classList']:
                print("   ❌ body没有modal-open类，背景可以滚动")
            else:
                print("   ✅ body有modal-open类")
            
            # 演示问题2: 弹窗内容无法滚动
            print("\n❌ 问题2: 弹窗内容无法滚动或交互元素看不到")
            
            # 检查弹窗内容高度
            modal_info = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    if (!modal) return null;
                    return {
                        scrollHeight: modal.scrollHeight,
                        clientHeight: modal.clientHeight,
                        scrollTop: modal.scrollTop,
                        canScroll: modal.scrollHeight > modal.clientHeight
                    };
                }
            """)
            
            if modal_info:
                print(f"   弹窗内容高度: {modal_info['scrollHeight']}px")
                print(f"   弹窗可视高度: {modal_info['clientHeight']}px")
                print(f"   是否可以滚动: {modal_info['canScroll']}")
                
                if modal_info['canScroll']:
                    print("   ⚠️ 内容超出，需要滚动")
                else:
                    print("   ✅ 内容未超出")
            
            # 尝试滚动
            print("   尝试滚动弹窗内容...")
            await page.hover(".modal-content.game-modal-content")
            
            before_scroll = modal_info['scrollTop'] if modal_info else 0
            await page.mouse.wheel(0, 300)
            await page.wait_for_timeout(1500)
            
            after_scroll = await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    return modal ? modal.scrollTop : 0;
                }
            """)
            
            print(f"   滚动前位置: {before_scroll}px")
            print(f"   滚动后位置: {after_scroll}px")
            
            if after_scroll > before_scroll:
                print("   ✅ 弹窗可以滚动")
            else:
                print("   ❌ 弹窗无法滚动（问题复现）")
            
            # 检查背景页面是否滚动
            page_scroll = await page.evaluate("() => window.pageYOffset")
            print(f"   背景页面滚动: {page_scroll}px")
            
            if page_scroll > 0:
                print("   ❌ 背景页面在滚动（问题复现）")
            else:
                print("   ✅ 背景页面未滚动")
            
            # 演示问题3: 交互元素可能被遮挡
            print("\n❌ 问题3: 交互元素可能被遮挡")
            
            # 滚动到底部查看所有内容
            await page.evaluate("""
                () => {
                    const modal = document.querySelector('.modal-content.game-modal-content');
                    if (modal) modal.scrollTop = modal.scrollHeight;
                }
            """)
            await page.wait_for_timeout(1000)
            
            # 查找所有交互元素
            interactive_elements = await page.evaluate("""
                () => {
                    const container = document.getElementById('game-container');
                    if (!container) return [];
                    
                    const elements = [];
                    const buttons = container.querySelectorAll('button');
                    const inputs = container.querySelectorAll('input');
                    const sliders = container.querySelectorAll('.slider');
                    
                    buttons.forEach((btn, i) => {
                        const rect = btn.getBoundingClientRect();
                        elements.push({
                            type: 'button',
                            text: btn.textContent,
                            visible: rect.width > 0 && rect.height > 0
                        });
                    });
                    
                    inputs.forEach((input, i) => {
                        const rect = input.getBoundingClientRect();
                        elements.push({
                            type: 'input',
                            placeholder: input.placeholder,
                            visible: rect.width > 0 && rect.height > 0
                        });
                    });
                    
                    return elements;
                }
            """)
            
            print(f"   找到 {len(interactive_elements)} 个交互元素:")
            for elem in interactive_elements:
                visible_str = "可见" if elem['visible'] else "不可见"
                if elem['type'] == 'button':
                    print(f"   - 按钮: '{elem['text'][:30]}...' ({visible_str})")
                elif elem['type'] == 'input':
                    print(f"   - 输入框: '{elem['placeholder'][:30]}...' ({visible_str})")
            
            # 提供解决方案
            print("\n" + "=" * 70)
            print("🔧 解决方案")
            print("=" * 70)
            
            print("""
1. 在assets/css/components.css中添加:
   
   body.modal-open {
     overflow: hidden;
     position: fixed;
     width: 100%;
     height: 100%;
   }

2. 在assets/js/app.js的showGameModal函数中:
   
   static showGameModal() {
     const modal = document.getElementById('game-modal');
     if (modal) {
       modal.classList.add('active');
       document.body.classList.add('modal-open');  // 添加这一行
       console.log('Game modal shown');
     }
   }

3. 在assets/js/app.js的hideGameModal函数中:
   
   static hideGameModal() {
     const modal = document.getElementById('game-modal');
     if (modal) {
       modal.classList.remove('active');
       document.body.classList.remove('modal-open');  // 添加这一行
       console.log('Game modal hidden');
     }
     AppState.gameSession = null;
   }

4. 确保.modal-content有正确的overflow-y设置:
   
   .modal-content {
     overflow-y: auto;  /* 允许垂直滚动 */
     max-height: 90vh;  /* 限制最大高度 */
   }
""")
            
            print("\n💡 这些修改将确保:")
            print("   ✅ 弹窗打开时背景页面被锁定，无法滚动")
            print("   ✅ 弹窗内容可以独立滚动")
            print("   ✅ 所有交互元素都可以通过滚动访问到")
            print("   ✅ 关闭弹窗后页面滚动恢复正常")
            
            # 保持浏览器打开以便查看
            print("\n⏳ 保持浏览器打开30秒以便查看...")
            await page.wait_for_timeout(30000)
            
        except Exception as e:
            print(f"\n❌ 错误: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(demonstrate_modal_scroll_issue())

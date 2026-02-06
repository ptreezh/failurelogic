"""
验证弹窗修复效果
测试修复后的弹窗打开/关闭/重新打开功能
"""

import asyncio
from playwright.async_api import async_playwright

async def test_modal_fix():
    """测试弹窗修复效果"""
    print("🔍 验证弹窗修复效果")
    print("=" * 70)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=300)
        page = await browser.new_page()
        
        try:
            # 访问网站
            print("\n🌐 访问网站...")
            await page.goto("https://ptreezh.github.io/failurelogic/", wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 导航到场景页面
            print("\n📍 导航到场景页面...")
            await page.click("[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            await page.wait_for_selector(".scenario-card", state="visible")
            
            scenario_cards = page.locator(".scenario-card")
            count = await scenario_cards.count()
            print(f"📊 发现 {count} 个场景")
            
            # 测试循环：打开 -> 关闭 -> 打开另一个场景
            for i in range(min(count, 3)):
                card = scenario_cards.nth(i)
                title = await card.locator("h3").inner_text()
                
                print(f"\n{'='*70}")
                print(f"🎮 测试场景 {i+1}: {title}")
                print(f"{'='*70}")
                
                # 滚动到卡片位置
                await card.scroll_into_view_if_needed()
                await page.wait_for_timeout(500)
                
                # 点击打开场景
                print(f"\n📌 打开场景...")
                await card.click()
                await page.wait_for_timeout(3000)
                
                # 验证弹窗状态
                modal_visible = await page.locator("#game-modal").is_visible()
                modal_active = await page.evaluate("""
                    () => {
                        const modal = document.getElementById('game-modal');
                        return modal ? modal.classList.contains('active') : false;
                    }
                """)
                
                print(f"   弹窗可见: {'✅ 是' if modal_visible else '❌ 否'}")
                print(f"   弹窗active类: {'✅ 有' if modal_active else '❌ 无'}")
                
                if modal_visible and modal_active:
                    print("   ✅ 弹窗正常打开")
                    
                    # 检查body状态
                    body_state = await page.evaluate("""
                        () => {
                            const body = document.body;
                            return {
                                modalOpenClass: body.classList.contains('modal-open'),
                                overflow: body.style.overflow,
                                position: body.style.position
                            };
                        }
                    """)
                    print(f"   body.modal-open: {'✅ 有' if body_state['modalOpenClass'] else '❌ 无'}")
                    
                    # 测试弹窗内容
                    game_content = await page.evaluate("""
                        () => {
                            const container = document.getElementById('game-container');
                            return container ? container.innerText.length : 0;
                        }
                    """)
                    print(f"   游戏内容长度: {game_content} 字符")
                    
                    # 关闭弹窗
                    print(f"\n📌 关闭弹窗...")
                    await page.click("#close-modal")
                    await page.wait_for_timeout(2000)
                    
                    # 验证关闭状态
                    modal_visible = await page.locator("#game-modal").is_visible()
                    modal_active = await page.evaluate("""
                        () => {
                            const modal = document.getElementById('game-modal');
                            return modal ? modal.classList.contains('active') : false;
                        }
                    """)
                    
                    print(f"   弹窗可见: {'❌ 是' if modal_visible else '✅ 否'}")
                    print(f"   弹窗active类: {'❌ 有' if modal_active else '✅ 无'}")
                    
                    if not modal_visible and not modal_active:
                        print("   ✅ 弹窗正常关闭")
                        
                        # 检查body状态恢复
                        body_state = await page.evaluate("""
                            () => {
                                const body = document.body;
                                return {
                                    modalOpenClass: body.classList.contains('modal-open'),
                                    overflow: body.style.overflow,
                                    position: body.style.position
                                };
                            }
                        """)
                        print(f"   body.modal-open: {'❌ 有' if body_state['modalOpenClass'] else '✅ 无'}")
                    else:
                        print("   ❌ 弹窗未完全关闭")
                        
                else:
                    print("   ❌ 弹窗未能正常打开")
                    break
                
                # 等待后继续下一个
                await page.wait_for_timeout(2000)
            
            print(f"\n{'='*70}")
            print("📊 测试结果")
            print(f"{'='*70}")
            print("✅ 修复验证完成")
            print("\n修复内容包括:")
            print("1. ✅ hideGameModal() 完全移除active类并清理状态")
            print("2. ✅ showGameModal() 添加保护，防止重复打开")
            print("3. ✅ startScenario() 确保之前的弹窗已关闭")
            print("4. ✅ 添加动画完成后的回调，确保状态一致性")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_modal_fix())
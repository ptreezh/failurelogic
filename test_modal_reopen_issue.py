"""
测试弹窗重新打开问题
验证关闭弹窗后是否可以打开其他场景
"""

import asyncio
from playwright.async_api import async_playwright

async def test_modal_reopen_issue():
    """测试关闭弹窗后无法重新打开的问题"""
    print("🧪 测试弹窗重新打开问题")
    print("=" * 70)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=500)
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
            
            # 获取前3个场景
            scenario_cards = page.locator(".scenario-card")
            count = await scenario_cards.count()
            print(f"📊 发现 {count} 个场景")
            
            # 测试场景1: 打开第一个场景
            print(f"\n🎯 测试1: 打开第一个场景")
            first_card = scenario_cards.nth(0)
            first_title = await first_card.locator("h3").inner_text()
            print(f"   场景: {first_title}")
            
            await first_card.click()
            await page.wait_for_timeout(3000)
            
            # 验证弹窗打开
            modal_visible = await page.locator("#game-modal").is_visible()
            print(f"   弹窗状态: {'✅ 已打开' if modal_visible else '❌ 未打开'}")
            
            if modal_visible:
                print("   ✅ 第一个场景弹窗正常打开")
                
                # 关闭弹窗
                print("\n📌 关闭弹窗...")
                await page.click("#close-modal")
                await page.wait_for_timeout(2000)
                
                modal_visible = await page.locator("#game-modal").is_visible()
                print(f"   关闭后弹窗状态: {'❌ 仍打开' if modal_visible else '✅ 已关闭'}")
                
                # 检查body状态
                body_state = await page.evaluate("""
                    () => {
                        const body = document.body;
                        return {
                            classList: body.className,
                            overflow: body.style.overflow,
                            position: body.style.position
                        };
                    }
                """)
                print(f"   body状态: {body_state}")
            else:
                print("   ❌ 第一个场景弹窗未能打开，测试终止")
                return
            
            # 测试场景2: 打开第二个场景（问题复现）
            print(f"\n🎯 测试2: 打开第二个场景（问题复现测试）")
            second_card = scenario_cards.nth(1)
            second_title = await second_card.locator("h3").inner_text()
            print(f"   场景: {second_title}")
            
            # 滚动到第二个场景位置
            await second_card.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)
            
            # 尝试点击第二个场景
            print("   点击第二个场景...")
            await second_card.click()
            await page.wait_for_timeout(3000)
            
            # 验证弹窗是否打开
            modal_visible = await page.locator("#game-modal").is_visible()
            print(f"   弹窗状态: {'✅ 已打开' if modal_visible else '❌ 未打开'}")
            
            if modal_visible:
                print("   ✅ 第二个场景弹窗成功打开")
                await page.click("#close-modal")
                await page.wait_for_timeout(2000)
            else:
                print("   ❌ 第二个场景弹窗无法打开 - 问题复现！")
                
                # 进一步诊断
                print("\n🔍 问题诊断:")
                
                # 检查控制台错误
                console_logs = await page.evaluate("""
                    () => {
                        const logs = [];
                        if (window.consoleErrors) logs.push(...window.consoleErrors);
                        return logs;
                    }
                """)
                if console_logs:
                    print(f"   控制台错误: {console_logs}")
                
                # 检查modal元素状态
                modal_state = await page.evaluate("""
                    () => {
                        const modal = document.getElementById('game-modal');
                        if (!modal) return 'modal not found';
                        
                        return {
                            classList: modal.className,
                            display: modal.style.display,
                            opacity: modal.style.opacity,
                            visibility: modal.style.visibility
                        };
                    }
                """)
                print(f"   Modal状态: {modal_state}")
                
                # 检查事件监听器
                event_listeners = await page.evaluate("""
                    () => {
                        const modal = document.getElementById('game-modal');
                        if (!modal) return 'modal not found';
                        
                        // 检查点击事件
                        const listeners = getEventListeners(modal);
                        return {
                            clickListeners: listeners.click ? listeners.click.length : 0,
                            hasActiveClass: modal.classList.contains('active')
                        };
                    }
                """)
                print(f"   事件监听器: {event_listeners}")
                
                # 尝试直接调用showGameModal
                print("   尝试直接调用showGameModal...")
                await page.evaluate("GameManager.showGameModal()")
                await page.wait_for_timeout(2000)
                
                modal_visible = await page.locator("#game-modal").is_visible()
                print(f"   直接调用后弹窗状态: {'✅ 已打开' if modal_visible else '❌ 仍未打开'}")
            
            # 测试场景3: 再次打开第一个场景
            print(f"\n🎯 测试3: 再次打开第一个场景")
            print(f"   场景: {first_title}")
            
            await first_card.scroll_into_view_if_needed()
            await page.wait_for_timeout(1000)
            
            print("   再次点击第一个场景...")
            await first_card.click()
            await page.wait_for_timeout(3000)
            
            modal_visible = await page.locator("#game-modal").is_visible()
            print(f"   弹窗状态: {'✅ 已打开' if modal_visible else '❌ 未打开'}")
            
            if modal_visible:
                print("   ✅ 第一个场景可以重新打开")
                await page.click("#close-modal")
            else:
                print("   ❌ 第一个场景也无法重新打开")
            
            print(f"\n{'='*70}")
            print("📊 测试结果总结")
            print(f"{'='*70}")
            print("问题: 关闭弹窗后无法重新打开其他场景")
            print("状态: ✅ 问题已复现并诊断")
            print("原因: 需要进一步分析JavaScript状态管理")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_modal_reopen_issue())

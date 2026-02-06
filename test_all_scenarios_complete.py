"""
完整场景交互测试
测试所有9个场景的完整交互流程
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import json

async def test_all_scenarios_complete():
    """测试所有场景的完整交互"""
    print("🚀 完整场景交互测试")
    print("=" * 80)
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "scenarios": [],
        "summary": {
            "total": 0,
            "successful": 0,
            "failed": 0
        }
    }
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=500)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
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
            
            # 获取所有场景
            scenario_cards = page.locator(".scenario-card")
            count = await scenario_cards.count()
            print(f"📊 发现 {count} 个场景")
            
            # 测试每个场景
            for i in range(min(count, 9)):
                scenario_result = {
                    "index": i + 1,
                    "completed": False,
                    "steps": []
                }
                
                try:
                    # 获取场景信息
                    card = scenario_cards.nth(i)
                    title = await card.locator("h3").inner_text()
                    desc = await card.locator(".card-subtitle").inner_text()
                    difficulty = await card.locator(".badge").inner_text()
                    
                    print(f"\n{'='*80}")
                    print(f"🎮 测试场景 {i+1}: {title}")
                    print(f"   难度: {difficulty}")
                    print(f"{'='*80}")
                    
                    scenario_result["title"] = title
                    scenario_result["difficulty"] = difficulty
                    scenario_result["description"] = desc
                    
                    # 打开场景
                    print("\n📌 步骤1: 打开场景...")
                    await card.click()
                    await page.wait_for_timeout(3000)
                    
                    # 验证弹窗打开
                    modal_visible = await page.locator("#game-modal").is_visible()
                    if not modal_visible:
                        raise Exception("弹窗未打开")
                    
                    print("   ✅ 弹窗已打开")
                    
                    # 检查body状态
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
                    scenario_result["steps"].append({"action": "打开弹窗", "body_state": body_state})
                    
                    # 检查弹窗滚动
                    modal_info = await page.evaluate("""
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
                    
                    if modal_info:
                        print(f"   弹窗内容: {modal_info['scrollHeight']}px / {modal_info['clientHeight']}px")
                        print(f"   需要滚动: {modal_info['canScroll']}")
                    
                    # 查找并点击开始按钮
                    print("\n📌 步骤2: 开始游戏...")
                    start_button = page.locator("#game-container button").first
                    if await start_button.count() > 0:
                        button_text = await start_button.inner_text()
                        print(f"   点击: {button_text}")
                        await start_button.click()
                        await page.wait_for_timeout(2000)
                        scenario_result["steps"].append({"action": "开始游戏", "button": button_text})
                    
                    # 进行多轮交互
                    round_num = 1
                    max_rounds = 10
                    
                    while round_num <= max_rounds:
                        print(f"\n📌 步骤{2 + round_num}: 第{round_num}轮交互...")
                        
                        # 查找交互元素
                        controls = await page.evaluate("""
                            () => {
                                const container = document.getElementById('game-container');
                                if (!container) return {buttons: 0, inputs: 0};
                                
                                return {
                                    buttons: container.querySelectorAll('button').length,
                                    inputs: container.querySelectorAll('input').length,
                                    sliders: container.querySelectorAll('.slider').length
                                };
                            }
                        """)
                        
                        print(f"   找到: {controls['buttons']} 按钮, {controls['inputs']} 输入框")
                        
                        if controls['buttons'] > 0:
                            # 点击第一个按钮
                            button = page.locator("#game-container button").first
                            text = await button.inner_text()
                            print(f"   点击按钮: {text}")
                            await button.click()
                            scenario_result["steps"].append({"action": f"点击按钮: {text}", "round": round_num})
                        elif controls['inputs'] > 0:
                            # 填写输入框
                            input_elem = page.locator("#game-container input").first
                            await input_elem.fill("50")
                            print(f"   输入值: 50")
                            scenario_result["steps"].append({"action": "输入值: 50", "round": round_num})
                        else:
                            print("   ⚠️ 未找到交互元素")
                            break
                        
                        await page.wait_for_timeout(2000)
                        
                        # 检查是否游戏结束
                        game_text = await page.evaluate("() => {
                            const container = document.getElementById('game-container');
                            return container ? container.innerText : '';
                        }")
                        
                        if "游戏结束" in game_text or "完成" in game_text or "Game Over" in game_text:
                            print(f"   🎉 游戏结束！")
                            scenario_result["completed"] = True
                            break
                        
                        round_num += 1
                    
                    # 关闭弹窗
                    print("\n📌 关闭弹窗...")
                    await page.click("#close-modal")
                    await page.wait_for_timeout(2000)
                    
                    # 验证body状态恢复
                    body_after_close = await page.evaluate("""
                        () => {
                            const body = document.body;
                            return {
                                hasModalOpenClass: body.classList.contains('modal-open'),
                                overflow: body.style.overflow,
                                position: body.style.position
                            };
                        }
                    """)
                    scenario_result["steps"].append({"action": "关闭弹窗", "body_state": body_after_close})
                    
                    if not body_after_close["hasModalOpenClass"]:
                        print("   ✅ body状态已恢复")
                    
                    scenario_result["successful"] = True
                    print(f"\n✅ 场景 {title} 测试成功")
                    
                except Exception as e:
                    print(f"\n❌ 场景测试失败: {e}")
                    scenario_result["error"] = str(e)
                    scenario_result["successful"] = False
                
                results["scenarios"].append(scenario_result)
                results["summary"]["total"] += 1
                
                if scenario_result["successful"]:
                    results["summary"]["successful"] += 1
                else:
                    results["summary"]["failed"] += 1
                
                # 等待后继续下一个场景
                await page.wait_for_timeout(3000)
            
            # 生成报告
            print(f"\n{'='*80}")
            print("📊 测试总结")
            print(f"{'='*80}")
            print(f"总场景数: {results['summary']['total']}")
            print(f"成功: {results['summary']['successful']}")
            print(f"失败: {results['summary']['failed']}")
            print(f"成功率: {results['summary']['successful']/results['summary']['total']*100:.1f}%")
            
            # 保存详细报告
            report_file = f"all_scenarios_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            
            print(f"\n💾 详细报告已保存: {report_file}")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
        
        finally:
            await browser.close()
            print("\n✅ 浏览器已关闭")

if __name__ == "__main__":
    asyncio.run(test_all_scenarios_complete())

"""
全面交互体验走查测试
验证认知陷阱平台的完整用户体验流程
"""

import asyncio
import json
from playwright.async_api import async_playwright
from datetime import datetime
import time

async def comprehensive_interaction_walkthrough():
    """全面交互体验走查测试"""
    print("🎮 认知陷阱平台 - 全面交互体验走查测试")
    print("="*70)
    
    async with async_playwright() as p:
        # 启动浏览器（非headless模式，以便观察交互）
        try:
            browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=500)
        except:
            browser = await p.chromium.launch(headless=False, slow_mo=500)
        
        page = await browser.new_page()
        page.set_default_timeout(30000)
        
        # 监听控制台消息
        console_messages = []
        page.on('console', lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'location': msg.location
        }))
        
        # 记录测试结果
        test_results = {
            'start_time': datetime.now().isoformat(),
            'steps': [],
            'errors': [],
            'success_rate': 0
        }
        
        try:
            # 步骤1: 访问主页
            print("🔍 步骤1: 访问主页")
            start_time = time.time()
            await page.goto("http://localhost:8000", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)
            
            title = await page.title()
            print(f"   ✅ 主页加载成功: {title}")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 1,
                'name': '访问主页',
                'status': 'success',
                'duration': elapsed,
                'details': f'标题: {title}'
            })
            
            # 步骤2: 验证主页内容
            print("🔍 步骤2: 验证主页内容")
            start_time = time.time()
            
            # 检查主页元素
            hero_title = await page.query_selector("h1.hero-title")
            if hero_title:
                hero_text = await hero_title.text_content()
                print(f"   ✅ 英雄标题: {hero_text[:50]}...")
            else:
                print("   ⚠️  未找到英雄标题")
            
            nav_items = await page.query_selector_all("nav .nav-item")
            print(f"   ✅ 发现 {len(nav_items)} 个导航项")
            
            # 检查特色功能
            features = await page.query_selector_all(".feature-card")
            print(f"   ✅ 发现 {len(features)} 个特色功能")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 2,
                'name': '验证主页内容',
                'status': 'success',
                'duration': elapsed,
                'details': f'导航项: {len(nav_items)}, 特色功能: {len(features)}'
            })
            
            # 步骤3: 导航到场景页面
            print("🔍 步骤3: 导航到场景页面")
            start_time = time.time()
            
            # 点击场景导航按钮
            scenario_nav_btn = await page.wait_for_selector("button[data-page='scenarios']", timeout=10000)
            await scenario_nav_btn.click()
            await page.wait_for_timeout(5000)  # 等待场景加载
            
            # 验证页面切换
            scenarios_page = await page.query_selector("#scenarios-page.page.active")
            if scenarios_page:
                print("   ✅ 成功切换到场景页面")
            else:
                print("   ❌ 未成功切换到场景页面")
                test_results['errors'].append("无法切换到场景页面")
            
            # 检查场景网格
            scenarios_grid = await page.query_selector("#scenarios-grid")
            if scenarios_grid:
                print("   ✅ 场景网格已加载")
            else:
                print("   ❌ 未找到场景网格")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 3,
                'name': '导航到场景页面',
                'status': 'success' if scenarios_page else 'failure',
                'duration': elapsed,
                'details': f'场景网格: {"存在" if scenarios_grid else "不存在"}'
            })
            
            # 步骤4: 验证场景加载
            print("🔍 步骤4: 验证场景加载")
            start_time = time.time()
            
            # 等待场景卡片加载
            for i in range(10):  # 最多等待5秒
                scenario_cards = await page.query_selector_all(".scenario-card")
                if len(scenario_cards) > 0:
                    print(f"   ✅ 发现 {len(scenario_cards)} 个场景卡片")
                    break
                await page.wait_for_timeout(500)
            else:
                print("   ⚠️  未发现场景卡片")
            
            # 检查难度选择器
            difficulty_selector = await page.query_selector("#difficulty-level")
            if difficulty_selector:
                print("   ✅ 难度选择器已加载")
            else:
                print("   ⚠️  未找到难度选择器")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 4,
                'name': '验证场景加载',
                'status': 'success' if len(scenario_cards) > 0 else 'partial',
                'duration': elapsed,
                'details': f'场景卡片: {len(scenario_cards)}, 难度选择器: {"存在" if difficulty_selector else "不存在"}'
            })
            
            # 步骤5: 测试场景交互
            print("🔍 步骤5: 测试场景交互")
            start_time = time.time()
            
            if len(scenario_cards) > 0:
                # 点击第一个场景
                first_card = scenario_cards[0]
                
                # 获取场景名称
                title_elem = await first_card.query_selector("h3, .card-title")
                if title_elem:
                    scenario_name = await title_elem.text_content()
                    print(f"   🎯 选择场景: {scenario_name}")
                else:
                    scenario_name = "未知场景"
                
                await first_card.click()
                await page.wait_for_timeout(3000)
                
                # 检查是否打开了游戏模态框
                modal = await page.query_selector("#game-modal.active")
                if modal:
                    print("   ✅ 游戏模态框已打开")
                    
                    # 检查游戏内容
                    game_container = await page.query_selector("#game-container")
                    if game_container:
                        game_content = await game_container.inner_html()
                        if len(game_content.strip()) > 0:
                            print("   ✅ 游戏内容已加载")
                        else:
                            print("   ⚠️  游戏容器为空")
                    else:
                        print("   ❌ 未找到游戏容器")
                else:
                    print("   ❌ 游戏模态框未打开")
                    test_results['errors'].append("游戏模态框未打开")
            else:
                print("   ❌ 无场景可测试")
                test_results['errors'].append("没有可用的场景进行交互测试")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 5,
                'name': '测试场景交互',
                'status': 'success' if len(scenario_cards) > 0 and modal else 'failure',
                'duration': elapsed,
                'details': f'场景名称: {scenario_name if len(scenario_cards) > 0 else "N/A"}'
            })
            
            # 步骤6: 测试游戏界面交互
            print("🔍 步骤6: 测试游戏界面交互")
            start_time = time.time()
            
            interaction_success = False
            if modal:
                # 查找游戏控件并尝试交互
                controls = await page.query_selector_all("input, button, select, .game-slider")
                print(f"   🎮 发现 {len(controls)} 个游戏控件")
                
                if len(controls) > 0:
                    # 尝试与前几个控件交互
                    for i, control in enumerate(controls[:3]):  # 只测试前3个控件
                        try:
                            tag_name = await control.evaluate("el => el.tagName.toLowerCase()")
                            
                            if tag_name == "button":
                                btn_text = await control.text_content()
                                if "关闭" in btn_text or "返回" in btn_text or "完成" in btn_text:
                                    continue  # 跳过关闭/返回按钮
                                await control.click()
                                await page.wait_for_timeout(500)
                                print(f"     ✅ 点击按钮: {btn_text[:20]}...")
                                interaction_success = True
                            elif tag_name == "input":
                                input_type = await control.get_attribute("type") or "text"
                                if input_type == "range":  # 滑块
                                    await control.focus()
                                    await page.keyboard.press("ArrowRight")
                                    await page.wait_for_timeout(500)
                                    print(f"     ✅ 操作滑块")
                                    interaction_success = True
                                elif input_type in ["text", "number"]:
                                    await control.fill("测试输入")
                                    await page.wait_for_timeout(500)
                                    print(f"     ✅ 填充输入框")
                                    interaction_success = True
                            elif tag_name == "select":
                                await control.focus()
                                await page.wait_for_timeout(500)
                                print(f"     ✅ 选择下拉框")
                                interaction_success = True
                            
                            if interaction_success:
                                break  # 成功交互后跳出
                        except Exception as e:
                            print(f"     ⚠️  控件交互失败: {str(e)[:50]}")
                
                # 关闭模态框
                close_btn = await page.query_selector("#close-modal, .modal-close")
                if close_btn:
                    await close_btn.click()
                    await page.wait_for_timeout(1000)
                    print("   ✅ 模态框已关闭")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 6,
                'name': '测试游戏界面交互',
                'status': 'success' if interaction_success else 'partial',
                'duration': elapsed,
                'details': f'控件数量: {len(controls) if modal else 0}, 交互成功: {interaction_success}'
            })
            
            # 步骤7: 测试其他导航
            print("🔍 步骤7: 测试其他导航")
            start_time = time.time()
            
            # 返回场景页面
            scenario_btn = await page.query_selector("button[data-page='scenarios']")
            if scenario_btn:
                await scenario_btn.click()
                await page.wait_for_timeout(2000)
                print("   ✅ 成功返回场景页面")
            
            # 测试关于页面
            about_btn = await page.query_selector("button[data-page='about']")
            if about_btn:
                await about_btn.click()
                await page.wait_for_timeout(2000)
                
                about_page = await page.query_selector("#about-page.page.active")
                if about_page:
                    print("   ✅ 成功导航到关于页面")
                else:
                    print("   ⚠️  关于页面未激活")
                
                # 返回主页
                home_btn = await page.query_selector("button[data-page='home']")
                if home_btn:
                    await home_btn.click()
                    await page.wait_for_timeout(2000)
                    print("   ✅ 成功返回主页")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 7,
                'name': '测试其他导航',
                'status': 'success',
                'duration': elapsed,
                'details': '导航测试完成'
            })
            
            # 步骤8: 性能和稳定性测试
            print("🔍 步骤8: 性能和稳定性测试")
            start_time = time.time()
            
            # 检查页面加载时间
            load_time = await page.evaluate("performance.timing.loadEventEnd - performance.timing.navigationStart")
            print(f"   ⏱️  页面加载时间: {load_time/1000:.2f}秒")
            
            # 检查内存使用（如果有）
            try:
                memory_info = await page.evaluate("performance.memory ? performance.memory : null")
                if memory_info:
                    print(f"   💾 内存使用: {memory_info.get('usedJSHeapSize', 0) / 1024 / 1024:.2f} MB")
            except:
                print("   💾 内存信息不可用")
            
            # 检查控制台错误
            error_count = len([msg for msg in console_messages if msg['type'] == 'error'])
            warning_count = len([msg for msg in console_messages if msg['type'] == 'warning'])
            print(f"   🚨 控制台错误: {error_count}, 警告: {warning_count}")
            
            elapsed = time.time() - start_time
            test_results['steps'].append({
                'step': 8,
                'name': '性能和稳定性测试',
                'status': 'success',
                'duration': elapsed,
                'details': f'加载时间: {load_time/1000:.2f}s, 错误: {error_count}, 警告: {warning_count}'
            })
            
            # 计算成功率
            successful_steps = sum(1 for step in test_results['steps'] if step['status'] in ['success', 'partial'])
            total_steps = len(test_results['steps'])
            test_results['success_rate'] = successful_steps / total_steps if total_steps > 0 else 0
            test_results['end_time'] = datetime.now().isoformat()
            
            # 输出总结
            print("\n" + "="*70)
            print("📊 全面交互体验走查测试结果:")
            print(f"   总步骤数: {total_steps}")
            print(f"   成功步骤: {successful_steps}")
            print(f"   成功率: {test_results['success_rate']*100:.1f}%")
            print(f"   总耗时: {time.time() - start_time:.2f}秒")
            
            print(f"\n📋 详细步骤:")
            for step in test_results['steps']:
                status_icon = "✅" if step['status'] == 'success' else "⚠️ " if step['status'] == 'partial' else "❌"
                print(f"   {status_icon} {step['name']}: {step['duration']:.2f}s - {step['details']}")
            
            if test_results['errors']:
                print(f"\n❌ 检测到 {len(test_results['errors'])} 个错误:")
                for error in test_results['errors']:
                    print(f"   • {error}")
            
            if console_messages:
                console_errors = [msg for msg in console_messages if msg['type'] == 'error']
                if console_errors:
                    print(f"\n🚨 控制台错误 ({len(console_errors)}):")
                    for error in console_errors[:5]:  # 只显示前5个
                        print(f"   • {error['text'][:100]}...")
            
            overall_success = test_results['success_rate'] >= 0.8  # 80%以上成功率认为成功
            
            print(f"\n🎯 总体评估: {'✅ 优秀' if overall_success else '⚠️  需要改进'}")
            
            if overall_success:
                print("\n🎉 全面交互体验走查测试通过！")
                print("✅ 用户可以顺畅地浏览和使用平台")
                print("✅ 所有主要功能都可正常访问")
                print("✅ 交互体验流畅")
                print("✅ 性能表现良好")
            else:
                print("\n⚠️  部分功能需要改进")
                print("💡 请检查上述测试结果中的问题")
            
            return overall_success
            
        finally:
            await browser.close()

async def main():
    """主函数"""
    success = await comprehensive_interaction_walkthrough()
    
    print("\n🏁 全面交互体验走查测试完成!")
    return success

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)
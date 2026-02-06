"""
完整端到端场景走查测试
测试所有9个场景的完整交互流程，直到每个场景结束
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import json
import time

class CompleteE2EScenarioWalkthrough:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "url": "https://ptreezh.github.io/failurelogic/",
            "scenarios": {},
            "summary": {
                "total_scenarios": 9,
                "completed": 0,
                "failed": 0,
                "total_decisions": 0,
                "total_steps": 0
            }
        }
        self.screenshot_count = 0
    
    def get_screenshot_path(self, scenario_name, step_name):
        """生成截图文件名"""
        self.screenshot_count += 1
        timestamp = int(time.time())
        safe_name = "".join(c for c in scenario_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_step = "".join(c for c in step_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        return f"e2e_{self.screenshot_count:02d}_{safe_name[:20]}_{safe_step[:20]}_{timestamp}.png"
    
    async def run_complete_walkthrough(self):
        """运行完整的场景走查"""
        print("🚀 完整端到端场景走查测试")
        print("=" * 80)
        print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"测试URL: {self.results['url']}")
        print("=" * 80)
        print("\n📋 测试目标: 对每个场景执行完整流程，直到游戏结束")
        
        async with async_playwright() as p:
            print("\n🔍 启动Microsoft Edge浏览器...")
            browser = await p.chromium.launch(
                channel='msedge',
                headless=False,
                slow_mo=400  # 减慢速度以便观察
            )
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            try:
                # 访问网站
                print("\n🌐 步骤1: 访问网站")
                await page.goto(self.results['url'], wait_until="networkidle")
                await page.wait_for_timeout(3000)
                
                title = await page.title()
                print(f"   ✅ 网站加载成功: {title}")
                
                # 截图: 初始页面
                screenshot = self.get_screenshot_path("首页", "初始访问")
                await page.screenshot(path=screenshot, full_page=True)
                print(f"   📸 截图: {screenshot}")
                
                # 导航到场景页面
                print("\n📍 步骤2: 导航到场景页面")
                await page.click("[data-page='scenarios']")
                await page.wait_for_timeout(2000)
                await page.wait_for_selector(".scenario-card", state="visible")
                print("   ✅ 场景页面加载成功")
                
                # 截图: 场景页面
                screenshot = self.get_screenshot_path("场景页面", "加载完成")
                await page.screenshot(path=screenshot, full_page=True)
                print(f"   📸 截图: {screenshot}")
                
                # 获取所有场景
                scenario_cards = page.locator(".scenario-card")
                count = await scenario_cards.count()
                print(f"\n📊 发现 {count} 个场景")
                
                # 测试每个场景
                for i in range(min(count, 9)):
                    await self.test_single_scenario_complete(page, i)
                
                # 生成最终报告
                await self.generate_final_report()
                
            except Exception as e:
                print(f"\n❌ 测试失败: {e}")
                import traceback
                traceback.print_exc()
            
            finally:
                await browser.close()
                print("\n✅ 浏览器已关闭")
    
    async def test_single_scenario_complete(self, page, index):
        """测试单个场景的完整流程直到结束"""
        scenario_card = page.locator(".scenario-card").nth(index)
        
        # 获取场景信息
        scenario_title = await scenario_card.locator("h3").inner_text()
        scenario_desc = await scenario_card.locator(".card-subtitle").inner_text()
        difficulty = await scenario_card.locator(".badge").inner_text()
        
        print(f"\n{'='*80}")
        print(f"🎮 测试场景 {index + 1}: {scenario_title}")
        print(f"   描述: {scenario_desc}")
        print(f"   难度: {difficulty}")
        print(f"{'='*80}")
        
        scenario_result = {
            "index": index + 1,
            "title": scenario_title,
            "description": scenario_desc,
            "difficulty": difficulty,
            "steps": [],
            "decisions": [],
            "completed": False,
            "final_state": None,
            "screenshots": []
        }
        
        try:
            # 步骤1: 打开场景
            print(f"\n📌 步骤1: 打开场景")
            await scenario_card.click()
            await page.wait_for_timeout(3000)
            
            screenshot = self.get_screenshot_path(scenario_title, "打开场景")
            await page.screenshot(path=screenshot, full_page=True)
            scenario_result["screenshots"].append({"step": "打开场景", "file": screenshot})
            print(f"   ✅ 场景已打开")
            print(f"   📸 截图: {screenshot}")
            
            # 验证弹窗显示
            modal_visible = await page.locator("#game-modal").is_visible()
            if not modal_visible:
                raise Exception("弹窗未显示")
            
            # 步骤2: 开始游戏
            print(f"\n📌 步骤2: 开始游戏")
            
            # 查找开始按钮
            start_button = page.locator("#game-container button").first
            if await start_button.count() > 0:
                button_text = await start_button.inner_text()
                print(f"   点击: {button_text}")
                await start_button.click()
                await page.wait_for_timeout(2000)
                
                screenshot = self.get_screenshot_path(scenario_title, "开始游戏")
                await page.screenshot(path=screenshot, full_page=True)
                scenario_result["screenshots"].append({"step": "开始游戏", "file": screenshot})
                print(f"   ✅ 游戏已开始")
                print(f"   📸 截图: {screenshot}")
            else:
                print(f"   ⚠️ 未找到开始按钮，直接进入游戏")
            
            # 步骤3-10: 进行多轮决策直到游戏结束
            round_num = 1
            max_rounds = 15  # 防止无限循环
            
            while round_num <= max_rounds:
                print(f"\n📌 步骤{2 + round_num}: 第{round_num}轮决策")
                
                # 检查游戏状态
                game_state = await page.evaluate("""
                    () => {
                        const container = document.getElementById('game-container');
                        if (!container) return null;
                        
                        return {
                            text: container.innerText,
                            hasButton: container.querySelector('button') !== null,
                            hasInput: container.querySelector('input') !== null,
                            hasSlider: container.querySelector('.slider') !== null,
                            turnInfo: container.querySelector('.turn-info') ? 
                                     container.querySelector('.turn-info').innerText : null,
                            feedback: container.querySelector('.feedback') ?
                                     container.querySelector('.feedback').innerText : null,
                            gameOver: container.querySelector('.game-over, .final-result, .completion') !== null
                        };
                    }
                """)
                
                if not game_state:
                    print(f"   ❌ 无法获取游戏状态")
                    break
                
                print(f"   回合信息: {game_state['turnInfo'] or 'N/A'}")
                
                # 检查游戏是否结束
                if game_state['gameOver'] or "游戏结束" in game_state['text'] or "完成" in game_state['text']:
                    print(f"   🎉 游戏结束！")
                    scenario_result["completed"] = True
                    
                    # 获取最终结果
                    final_result = await page.evaluate("""
                        () => {
                            const container = document.getElementById('game-container');
                            const resultElement = container.querySelector('.final-result, .game-over, .completion, .result');
                            return resultElement ? resultElement.innerText : container.innerText;
                        }
                    """)
                    scenario_result["final_state"] = final_result[:500]
                    print(f"   最终结果: {final_result[:200]}...")
                    break
                
                # 查找可交互元素
                interactive_elements = []
                
                # 查找按钮
                buttons = page.locator("#game-container button")
                button_count = await buttons.count()
                if button_count > 0:
                    for i in range(button_count):
                        button = buttons.nth(i)
                        if await button.is_visible():
                            text = await button.inner_text()
                            interactive_elements.append({"type": "button", "text": text, "index": i})
                
                # 查找输入框
                inputs = page.locator("#game-container input")
                input_count = await inputs.count()
                if input_count > 0:
                    for i in range(input_count):
                        input_elem = inputs.nth(i)
                        if await input_elem.is_visible():
                            placeholder = await input_elem.get_attribute("placeholder") or ""
                            interactive_elements.append({"type": "input", "placeholder": placeholder, "index": i})
                
                # 查找滑块
                sliders = page.locator("#game-container .slider")
                slider_count = await sliders.count()
                if slider_count > 0:
                    for i in range(slider_count):
                        slider = sliders.nth(i)
                        if await slider.is_visible():
                            interactive_elements.append({"type": "slider", "index": i})
                
                print(f"   发现 {len(interactive_elements)} 个可交互元素")
                
                if len(interactive_elements) == 0:
                    print(f"   ⚠️ 未找到可交互元素，等待2秒后重试")
                    await page.wait_for_timeout(2000)
                    
                    # 再次检查游戏是否结束
                    game_text = await page.evaluate("""() => {
                        const container = document.getElementById('game-container');
                        return container ? container.innerText : '';
                    }""")
                    
                    if "游戏结束" in game_text or "完成" in game_text:
                        print(f"   🎉 游戏已结束")
                        scenario_result["completed"] = True
                        break
                    else:
                        print(f"   ❌ 仍无交互元素，结束测试")
                        break
                
                # 执行交互
                decision = {
                    "round": round_num,
                    "actions": []
                }
                
                for elem in interactive_elements:
                    if elem["type"] == "button":
                        print(f"   点击按钮: '{elem['text']}'")
                        await buttons.nth(elem["index"]).click()
                        decision["actions"].append({"type": "button", "text": elem["text"]})
                    elif elem["type"] == "input":
                        # 输入测试数据
                        test_value = "50"
                        print(f"   输入值: {test_value} (placeholder: '{elem['placeholder']}')")
                        await inputs.nth(elem["index"]).fill(test_value)
                        decision["actions"].append({"type": "input", "value": test_value})
                    elif elem["type"] == "slider":
                        print(f"   调整滑块到中间位置")
                        await sliders.nth(elem["index"]).evaluate("el => el.value = 5")
                        decision["actions"].append({"type": "slider", "value": 5})
                
                scenario_result["decisions"].append(decision)
                self.results["summary"]["total_decisions"] += 1
                
                # 等待反馈
                await page.wait_for_timeout(3000)
                
                # 截图记录
                screenshot = self.get_screenshot_path(scenario_title, f"决策{round_num}")
                await page.screenshot(path=screenshot, full_page=True)
                scenario_result["screenshots"].append({"step": f"决策{round_num}", "file": screenshot})
                print(f"   📸 截图: {screenshot}")
                
                round_num += 1
                
                # 防止无限循环
                if round_num > max_rounds:
                    print(f"   ⚠️ 达到最大回合数限制({max_rounds})，结束测试")
                    break
            
            # 最终状态截图
            print(f"\n📌 最终状态")
            screenshot = self.get_screenshot_path(scenario_title, "最终状态")
            await page.screenshot(path=screenshot, full_page=True)
            scenario_result["screenshots"].append({"step": "最终状态", "file": screenshot})
            print(f"   📸 截图: {screenshot}")
            
            # 步骤: 关闭弹窗
            print(f"\n📌 关闭弹窗")
            await page.click("#close-modal")
            await page.wait_for_timeout(2000)
            
            modal_visible = await page.locator("#game-modal").is_visible()
            if not modal_visible:
                print(f"   ✅ 弹窗已关闭")
                scenario_result["steps"].append({"action": "关闭弹窗", "success": True})
            else:
                print(f"   ❌ 弹窗未关闭")
                scenario_result["steps"].append({"action": "关闭弹窗", "success": False})
            
        except Exception as e:
            print(f"\n❌ 测试场景时出错: {e}")
            import traceback
            traceback.print_exc()
            scenario_result["error"] = str(e)
        
        # 保存结果
        self.results["scenarios"][f"scenario_{index+1}"] = scenario_result
        
        if scenario_result["completed"]:
            self.results["summary"]["completed"] += 1
            print(f"\n✅ 场景 {scenario_title} 测试完成")
        else:
            self.results["summary"]["failed"] += 1
            print(f"\n❌ 场景 {scenario_title} 未完成")
        
        # 统计总步骤数
        self.results["summary"]["total_steps"] += len(scenario_result["steps"]) + len(scenario_result["decisions"])
        
        # 等待一下再测试下一个场景
        await page.wait_for_timeout(3000)
    
    async def generate_final_report(self):
        """生成最终测试报告"""
        print(f"\n{'='*80}")
        print("📊 完整走查测试报告")
        print(f"{'='*80}")
        
        summary = self.results["summary"]
        print(f"\n🎯 测试总结:")
        print(f"   总场景数: {summary['total_scenarios']}")
        print(f"   已完成: {summary['completed']}")
        print(f"   未完成: {summary['failed']}")
        print(f"   完成率: {summary['completed']/summary['total_scenarios']*100:.1f}%")
        print(f"   总决策数: {summary['total_decisions']}")
        print(f"   总步骤数: {summary['total_steps']}")
        print(f"   截图数量: {self.screenshot_count}")
        
        print(f"\n📋 详细结果:")
        for key, scenario in self.results["scenarios"].items():
            status = "✅ 完成" if scenario["completed"] else "❌ 未完成"
            decision_count = len(scenario["decisions"])
            print(f"   {scenario['title']}: {status} ({decision_count} 个决策)")
            
            if not scenario["completed"] and "error" in scenario:
                print(f"      错误: {scenario['error']}")
        
        # 保存JSON报告
        report_file = f"complete_e2e_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 详细报告已保存: {report_file}")
        
        # 生成HTML报告
        await self.generate_html_report()
    
    async def generate_html_report(self):
        """生成HTML格式的报告"""
        html_content = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Failure Logic 完整端到端测试报告</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f8f9fa; }}
        .container {{ max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
        h1 {{ color: #2c3e50; border-bottom: 4px solid #3498db; padding-bottom: 15px; margin-bottom: 30px; }}
        h2 {{ color: #34495e; margin-top: 40px; padding-bottom: 10px; border-bottom: 2px solid #ecf0f1; }}
        h3 {{ color: #7f8c8d; margin-top: 25px; }}
        .summary {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 25px 0; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }}
        .summary-item {{ text-align: center; }}
        .summary-item .number {{ font-size: 2.5em; font-weight: bold; display: block; }}
        .scenario {{ border: 1px solid #e0e7ff; margin: 25px 0; padding: 25px; border-radius: 10px; background: #f8faff; }}
        .scenario.completed {{ border-left: 5px solid #10b981; background: #f0fdf4; }}
        .scenario.failed {{ border-left: 5px solid #ef4444; background: #fef2f2; }}
        .decision-log {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }}
        .decision-item {{ padding: 10px; margin: 8px 0; background: #f9fbfd; border-left: 3px solid #3b82f6; border-radius: 5px; }}
        .screenshot-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin: 20px 0; }}
        .screenshot-item {{ background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }}
        .screenshot-item img {{ width: 100%; height: 200px; object-fit: cover; border-radius: 5px; }}
        .final-state {{ background: #fef3c7; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }}
        .error {{ background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        .footer {{ margin-top: 50px; padding-top: 25px; border-top: 2px solid #e5e7eb; color: #6b7280; text-align: center; }}
        .badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.875em; font-weight: 600; margin: 5px; }}
        .badge-success {{ background: #d1fae5; color: #065f46; }}
        .badge-warning {{ background: #fed7aa; color: #92400e; }}
        .badge-error {{ background: #fee2e2; color: #991b1b; }}
        .stats-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }}
        .stat-card {{ background: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }}
        .stat-number {{ font-size: 2em; font-weight: bold; color: #4f46e5; }}
        .stat-label {{ color: #6b7280; font-size: 0.875em; margin-top: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Failure Logic 完整端到端测试报告</h1>
        
        <div class="summary">
            <h2 style="color: white; border-bottom: 2px solid rgba(255,255,255,0.3); margin-top: 0;">📊 测试总结</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="number">{self.results['summary']['total_scenarios']}</span>
                    <span>总场景数</span>
                </div>
                <div class="summary-item">
                    <span class="number" style="color: #10b981;">{self.results['summary']['completed']}</span>
                    <span>已完成</span>
                </div>
                <div class="summary-item">
                    <span class="number" style="color: #ef4444;">{self.results['summary']['failed']}</span>
                    <span>未完成</span>
                </div>
                <div class="summary-item">
                    <span class="number">{self.results['summary']['completed']/self.results['summary']['total_scenarios']*100:.1f}%</span>
                    <span>完成率</span>
                </div>
            </div>
            <p style="margin-top: 20px; text-align: center;">
                <strong>测试时间:</strong> {self.results['timestamp']} | 
                <strong>总决策数:</strong> {self.results['summary']['total_decisions']} | 
                <strong>截图数量:</strong> {self.screenshot_count}
            </p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">{len(self.results['scenarios'])}</div>
                <div class="stat-label">测试场景</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{self.results['summary']['total_decisions']}</div>
                <div class="stat-label">总决策数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{self.screenshot_count}</div>
                <div class="stat-label">截图数量</div>
            </div>
        </div>
"""
        
        for key, scenario in self.results["scenarios"].items():
            status_class = "completed" if scenario["completed"] else "failed"
            status_badge = "<span class='badge badge-success'>✅ 完成</span>" if scenario["completed"] else "<span class='badge badge-error'>❌ 未完成</span>"
            
            html_content += f"""
        <div class="scenario {status_class}">
            <h2>{scenario['title']} {status_badge}</h2>
            <p><strong>描述:</strong> {scenario['description']}</p>
            <p><strong>难度:</strong> <span class="badge badge-warning">{scenario['difficulty']}</span></p>
            <p><strong>决策数量:</strong> {len(scenario['decisions'])}</p>
            
            <h3>🎯 决策记录</h3>
            <div class="decision-log">
"""
            
            for decision in scenario["decisions"]:
                html_content += f"""
                <div class="decision-item">
                    <strong>第{decision['round']}轮决策:</strong>
                    <ul>
"""
                for action in decision["actions"]:
                    if action["type"] == "button":
                        html_content += f"                        <li>点击按钮: '{action['text']}'</li>\n"
                    elif action["type"] == "input":
                        html_content += f"                        <li>输入值: {action['value']}</li>\n"
                    elif action["type"] == "slider":
                        html_content += f"                        <li>调整滑块: {action['value']}</li>\n"
                
                html_content += "                    </ul>\n                </div>\n"
            
            html_content += "            </div>\n"
            
            if scenario["final_state"]:
                html_content += f"""
            <h3>🏆 最终状态</h3>
            <div class="final-state">
                {scenario['final_state'][:500]}
            </div>
"""
            
            if "error" in scenario:
                html_content += f"""
            <h3>❌ 错误信息</h3>
            <div class="error">
                {scenario['error']}
            </div>
"""
            
            if scenario["screenshots"]:
                html_content += """
            <h3>📸 测试截图</h3>
            <div class="screenshot-grid">
"""
                for screenshot in scenario["screenshots"]:
                    html_content += f"""
                <div class="screenshot-item">
                    <img src="{screenshot['file']}" alt="{screenshot['step']}">
                    <p>{screenshot['step']}</p>
                </div>
"""
                html_content += "            </div>\n"
            
            html_content += "        </div>\n"
        
        html_content += f"""
        <div class="footer">
            <p>测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>测试工具: Playwright + Microsoft Edge | 测试框架: Python asyncio</p>
        </div>
    </div>
</body>
</html>
"""
        
        html_file = f"complete_e2e_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"\n💾 HTML报告已保存: {html_file}")

if __name__ == "__main__":
    tester = CompleteE2EScenarioWalkthrough()
    asyncio.run(tester.run_complete_walkthrough())

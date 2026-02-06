"""
完整场景全流程交互走查测试
测试所有9个认知陷阱场景的完整交互流程
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import json

class ScenarioWalkthroughTester:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "url": "https://ptreezh.github.io/failurelogic/",
            "scenarios": {},
            "summary": {
                "total": 9,
                "passed": 0,
                "failed": 0,
                "issues": []
            }
        }
    
    async def test_all_scenarios(self):
        """测试所有9个场景的全流程交互"""
        print("🚀 启动完整场景全流程交互走查测试")
        print("=" * 80)
        print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"测试URL: {self.results['url']}")
        print("=" * 80)
        
        async with async_playwright() as p:
            print("🔍 启动Microsoft Edge浏览器...")
            browser = await p.chromium.launch(
                channel='msedge', 
                headless=False,
                slow_mo=300  # 减慢速度以便观察
            )
            page = await browser.new_page()
            
            try:
                # 访问网站
                print(f"\n🌐 访问网站: {self.results['url']}")
                await page.goto(self.results['url'], wait_until="networkidle")
                await page.wait_for_timeout(3000)
                
                # 验证页面加载
                title = await page.title()
                print(f"📄 页面标题: {title}")
                
                # 截图: 初始页面
                await page.screenshot(path="walkthrough_00_initial.png", full_page=True)
                
                # 导航到场景页面
                print("\n🎯 步骤1: 导航到场景页面")
                await page.click("[data-page='scenarios']")
                await page.wait_for_timeout(2000)
                await page.wait_for_selector(".scenario-card", state="visible")
                print("✅ 场景页面加载完成")
                
                # 获取所有场景卡片
                scenario_cards = page.locator(".scenario-card")
                scenario_count = await scenario_cards.count()
                print(f"📊 发现 {scenario_count} 个场景")
                
                # 测试每个场景
                for i in range(min(scenario_count, 9)):
                    await self.test_scenario(page, i)
                
                # 生成测试报告
                await self.generate_report()
                
            except Exception as e:
                print(f"\n❌ 测试失败: {e}")
                import traceback
                traceback.print_exc()
            
            finally:
                await browser.close()
                print("\n✅ 浏览器已关闭")
    
    async def test_scenario(self, page, index):
        """测试单个场景的完整流程"""
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
            "title": scenario_title,
            "description": scenario_desc,
            "difficulty": difficulty,
            "tests": {},
            "passed": True,
            "issues": []
        }
        
        try:
            # 测试1: 场景选择
            print("\n📌 测试1: 场景选择")
            await scenario_card.click()
            await page.wait_for_timeout(2000)
            
            modal_visible = await page.locator("#game-modal").is_visible()
            if modal_visible:
                print("✅ 场景选择成功，弹窗打开")
                scenario_result["tests"]["scenario_selection"] = "passed"
            else:
                print("❌ 场景选择失败，弹窗未打开")
                scenario_result["tests"]["scenario_selection"] = "failed"
                scenario_result["passed"] = False
                scenario_result["issues"].append("场景选择后弹窗未打开")
            
            # 截图
            await page.screenshot(path=f"walkthrough_{index+1:02d}_{scenario_title.replace(' ', '_')}_modal.png", full_page=True)
            
            if modal_visible:
                # 测试2: 游戏内容加载
                print("\n📌 测试2: 游戏内容加载")
                game_container = page.locator("#game-container")
                content = await game_container.inner_html()
                content_length = len(content)
                
                if content_length > 100:
                    print(f"✅ 游戏内容加载成功 ({content_length} 字符)")
                    scenario_result["tests"]["content_load"] = "passed"
                else:
                    print(f"❌ 游戏内容加载失败 ({content_length} 字符)")
                    scenario_result["tests"]["content_load"] = "failed"
                    scenario_result["passed"] = False
                    scenario_result["issues"].append("游戏内容未正确加载")
                
                # 测试3: 游戏控制元素
                print("\n📌 测试3: 游戏控制元素")
                controls = page.locator("#game-container button, #game-container input, #game-container .slider")
                control_count = await controls.count()
                
                if control_count > 0:
                    print(f"✅ 发现 {control_count} 个控制元素")
                    scenario_result["tests"]["game_controls"] = "passed"
                    
                    # 测试4: 游戏交互
                    print("\n📌 测试4: 游戏交互")
                    first_control = controls.first
                    control_type = await first_control.evaluate("el => el.tagName + (el.type ? '[' + el.type + ']' : '')")
                    
                    print(f"交互元素类型: {control_type}")
                    
                    if "range" in control_type.lower() or "slider" in control_type.lower():
                        # 如果是滑块
                        await first_control.evaluate("el => el.value = 5")
                        print("✅ 滑块交互成功")
                    else:
                        # 点击按钮
                        await first_control.click()
                        print("✅ 按钮点击成功")
                    
                    await page.wait_for_timeout(1000)
                    scenario_result["tests"]["interaction"] = "passed"
                else:
                    print("❌ 未发现游戏控制元素")
                    scenario_result["tests"]["game_controls"] = "failed"
                    scenario_result["passed"] = False
                    scenario_result["issues"].append("未找到游戏控制元素")
                
                # 测试5: 关闭弹窗
                print("\n📌 测试5: 关闭弹窗")
                await page.click("#close-modal")
                await page.wait_for_timeout(1000)
                
                modal_visible = await page.locator("#game-modal").is_visible()
                if not modal_visible:
                    print("✅ 弹窗关闭成功")
                    scenario_result["tests"]["modal_close"] = "passed"
                else:
                    print("❌ 弹窗关闭失败")
                    scenario_result["tests"]["modal_close"] = "failed"
                    scenario_result["passed"] = False
                    scenario_result["issues"].append("弹窗无法关闭")
                
                # 测试6: 重新打开同一场景
                print("\n📌 测试6: 重新打开同一场景")
                await scenario_card.click()
                await page.wait_for_timeout(2000)
                
                modal_visible = await page.locator("#game-modal").is_visible()
                if modal_visible:
                    print("✅ 重新打开成功")
                    scenario_result["tests"]["reopen"] = "passed"
                    
                    # 关闭弹窗
                    await page.click("#close-modal")
                    await page.wait_for_timeout(1000)
                else:
                    print("❌ 重新打开失败")
                    scenario_result["tests"]["reopen"] = "failed"
                    scenario_result["passed"] = False
                    scenario_result["issues"].append("无法重新打开场景")
            
        except Exception as e:
            print(f"\n❌ 测试场景时出错: {e}")
            scenario_result["passed"] = False
            scenario_result["issues"].append(f"异常: {str(e)}")
        
        # 保存结果
        self.results["scenarios"][f"scenario_{index+1}"] = scenario_result
        
        if scenario_result["passed"]:
            self.results["summary"]["passed"] += 1
            print(f"\n✅ 场景 {scenario_title} 测试通过")
        else:
            self.results["summary"]["failed"] += 1
            self.results["summary"]["issues"].extend(scenario_result["issues"])
            print(f"\n❌ 场景 {scenario_title} 测试失败")
        
        # 等待一下再测试下一个场景
        await page.wait_for_timeout(2000)
    
    async def generate_report(self):
        """生成测试报告"""
        print(f"\n{'='*80}")
        print("📊 完整测试报告")
        print(f"{'='*80}")
        
        print(f"\n🎯 测试总结:")
        print(f"   总场景数: {self.results['summary']['total']}")
        print(f"   通过: {self.results['summary']['passed']}")
        print(f"   失败: {self.results['summary']['failed']}")
        print(f"   通过率: {self.results['summary']['passed']/self.results['summary']['total']*100:.1f}%")
        
        if self.results["summary"]["issues"]:
            print(f"\n⚠️  发现的问题:")
            for i, issue in enumerate(self.results["summary"]["issues"], 1):
                print(f"   {i}. {issue}")
        
        print(f"\n📋 详细结果:")
        for key, scenario in self.results["scenarios"].items():
            status = "✅ 通过" if scenario["passed"] else "❌ 失败"
            print(f"   {scenario['title']}: {status}")
            
            if not scenario["passed"] and scenario["issues"]:
                for issue in scenario["issues"]:
                    print(f"      - {issue}")
        
        # 保存报告到文件
        report_file = f"complete_walkthrough_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 详细报告已保存到: {report_file}")
        
        # 生成 HTML 报告
        await self.generate_html_report()
    
    async def generate_html_report(self):
        """生成 HTML 格式的报告"""
        html_content = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Failure Logic 完整场景交互走查测试报告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
        h2 {{ color: #555; margin-top: 30px; }}
        .summary {{ background: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .scenario {{ border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; }}
        .scenario.passed {{ border-left: 5px solid #4CAF50; }}
        .scenario.failed {{ border-left: 5px solid #f44336; }}
        .test-result {{ margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 3px; }}
        .passed {{ color: #4CAF50; }}
        .failed {{ color: #f44336; }}
        .issues {{ background: #ffebee; padding: 10px; border-radius: 3px; margin: 10px 0; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Failure Logic 完整场景交互走查测试报告</h1>
        
        <div class="summary">
            <h2>📊 测试总结</h2>
            <p><strong>测试时间:</strong> {self.results['timestamp']}</p>
            <p><strong>测试URL:</strong> <a href="{self.results['url']}" target="_blank">{self.results['url']}</a></p>
            <p><strong>总场景数:</strong> {self.results['summary']['total']}</p>
            <p><strong>通过:</strong> <span class="passed">{self.results['summary']['passed']}</span></p>
            <p><strong>失败:</strong> <span class="failed">{self.results['summary']['failed']}</span></p>
            <p><strong>通过率:</strong> {self.results['summary']['passed']/self.results['summary']['total']*100:.1f}%</p>
        </div>
        
        <h2>🎯 详细测试结果</h2>
"""
        
        for key, scenario in self.results["scenarios"].items():
            status_class = "passed" if scenario["passed"] else "failed"
            status_text = "✅ 通过" if scenario["passed"] else "❌ 失败"
            
            html_content += f"""
        <div class="scenario {status_class}">
            <h3>{scenario['title']} {status_text}</h3>
            <p><strong>描述:</strong> {scenario['description']}</p>
            <p><strong>难度:</strong> {scenario['difficulty']}</p>
            
            <div class="test-result">
                <h4>测试项目:</h4>
                <ul>
"""
            
            for test_name, result in scenario["tests"].items():
                status = "✅" if result == "passed" else "❌"
                html_content += f"                    <li>{status} {test_name}: {result}</li>\n"
            
            html_content += "                </ul>\n            </div>\n"
            
            if scenario["issues"]:
                html_content += f"""
            <div class="issues">
                <h4>⚠️ 发现的问题:</h4>
                <ul>
"""
                for issue in scenario["issues"]:
                    html_content += f"                    <li>{issue}</li>\n"
                html_content += "                </ul>\n            </div>\n"
            
            html_content += "        </div>\n"
        
        if self.results["summary"]["issues"]:
            html_content += f"""
        <h2>⚠️  汇总问题</h2>
        <div class="issues">
            <ul>
"""
            for issue in self.results["summary"]["issues"]:
                html_content += f"                <li>{issue}</li>\n"
            html_content += "            </ul>\n        </div>\n"
        
        html_content += f"""
        <div class="footer">
            <p>测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>测试工具: Playwright + Microsoft Edge</p>
        </div>
    </div>
</body>
</html>
"""
        
        html_file = f"complete_walkthrough_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"💾 HTML报告已保存到: {html_file}")

if __name__ == "__main__":
    tester = ScenarioWalkthroughTester()
    asyncio.run(tester.test_all_scenarios())

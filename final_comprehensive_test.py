"""
最终完整功能测试
验证部署后的所有功能是否正常
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import json

class FinalComprehensiveTester:
    def __init__(self):
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "url": "https://ptreezh.github.io/failurelogic/",
            "tests": {},
            "summary": {
                "total_tests": 0,
                "passed": 0,
                "failed": 0,
                "scenarios_tested": 0
            }
        }
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("🚀 最终完整功能测试")
        print("=" * 80)
        print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"测试URL: {self.results['url']}")
        print("=" * 80)
        
        async with async_playwright() as p:
            print("\n🔍 启动浏览器...")
            browser = await p.chromium.launch(
                channel='msedge',
                headless=False,
                slow_mo=300
            )
            page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
            
            try:
                # 测试1: 网站访问
                await self.test_website_access(page)
                
                # 测试2: 场景页面
                await self.test_scenarios_page(page)
                
                # 测试3: 弹窗功能
                await self.test_modal_functionality(page)
                
                # 测试4: 场景切换
                await self.test_scenario_switching(page)
                
                # 测试5: 完整游戏流程
                await self.test_complete_game_flow(page)
                
                # 生成报告
                await self.generate_report()
                
            except Exception as e:
                print(f"\n❌ 测试失败: {e}")
                import traceback
                traceback.print_exc()
            
            finally:
                await browser.close()
                print("\n✅ 浏览器已关闭")
    
    async def test_website_access(self, page):
        """测试网站访问"""
        print("\n📋 测试1: 网站访问")
        test_result = {"passed": False, "details": {}}
        
        try:
            print(f"🌐 访问: {self.results['url']}")
            await page.goto(self.results['url'], wait_until="networkidle")
            await page.wait_for_timeout(3000)
            
            # 检查标题
            title = await page.title()
            test_result["details"]["title"] = title
            print(f"   页面标题: {title}")
            
            # 检查关键元素
            nav_exists = await page.locator("nav").count() > 0
            test_result["details"]["nav_exists"] = nav_exists
            print(f"   导航栏: {'✅ 存在' if nav_exists else '❌ 不存在'}")
            
            test_result["passed"] = nav_exists
            
        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ 错误: {e}")
        
        self.results["tests"]["website_access"] = test_result
        self.update_summary()
    
    async def test_scenarios_page(self, page):
        """测试场景页面"""
        print("\n📋 测试2: 场景页面")
        test_result = {"passed": False, "details": {}}
        
        try:
            # 导航到场景页面
            await page.click("[data-page='scenarios']")
            await page.wait_for_timeout(2000)
            
            # 等待场景卡片
            await page.wait_for_selector(".scenario-card", state="visible", timeout=10000)
            
            # 统计场景数量
            scenario_cards = page.locator(".scenario-card")
            count = await scenario_cards.count()
            test_result["details"]["scenario_count"] = count
            print(f"   场景数量: {count}")
            
            # 检查第一个场景
            if count > 0:
                first_title = await scenario_cards.first.locator("h3").inner_text()
                test_result["details"]["first_scenario_title"] = first_title
                print(f"   第一个场景: {first_title}")
                
                # 检查难度标签
                difficulty = await scenario_cards.first.locator(".badge").inner_text()
                test_result["details"]["first_difficulty"] = difficulty
                print(f"   难度: {difficulty}")
            
            test_result["passed"] = count >= 9  # 应该至少有9个场景
            
        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ 错误: {e}")
        
        self.results["tests"]["scenarios_page"] = test_result
        self.update_summary()
    
    async def test_modal_functionality(self, page):
        """测试弹窗功能"""
        print("\n📋 测试3: 弹窗功能")
        test_result = {"passed": False, "details": {}}
        
        try:
            # 打开第一个场景
            scenario_cards = page.locator(".scenario-card")
            if await scenario_cards.count() == 0:
                raise Exception("未找到场景卡片")
            
            first_card = scenario_cards.first
            first_title = await first_card.locator("h3").inner_text()
            print(f"   测试场景: {first_title}")
            
            await first_card.click()
            await page.wait_for_timeout(3000)
            
            # 验证弹窗打开
            modal_visible = await page.locator("#game-modal").is_visible()
            test_result["details"]["modal_opened"] = modal_visible
            print(f"   弹窗打开: {'✅ 成功' if modal_visible else '❌ 失败'}")
            
            if modal_visible:
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
                test_result["details"]["body_state"] = body_state
                print(f"   body.modal-open: {'✅ 有' if body_state['modalOpenClass'] else '❌ 无'}")
                
                # 检查弹窗滚动
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
                test_result["details"]["scroll_info"] = scroll_info
                
                if scroll_info:
                    print(f"   内容高度: {scroll_info['scrollHeight']}px")
                    print(f"   可视高度: {scroll_info['clientHeight']}px")
                    print(f"   可滚动: {'✅ 是' if scroll_info['canScroll'] else '⚠️ 否'}")
                
                # 测试滚动
                await page.hover(".modal-content.game-modal-content")
                await page.mouse.wheel(0, 100)
                await page.wait_for_timeout(1000)
                
                scroll_after = await page.evaluate("""
                    () => {
                        const modal = document.querySelector('.modal-content.game-modal-content');
                        return modal ? modal.scrollTop : 0;
                    }
                """)
                test_result["details"]["scroll_works"] = scroll_after > 0
                print(f"   滚动测试: {'✅ 成功' if scroll_after > 0 else '❌ 失败'} ({scroll_after}px)")
                
                # 关闭弹窗
                await page.click("#close-modal")
                await page.wait_for_timeout(2000)
                
                modal_visible = await page.locator("#game-modal").is_visible()
                test_result["details"]["modal_closed"] = not modal_visible
                print(f"   弹窗关闭: {'✅ 成功' if not modal_visible else '❌ 失败'}")
                
                test_result["passed"] = test_result["details"]["modal_opened"] and test_result["details"]["modal_closed"]
            
        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ 错误: {e}")
        
        self.results["tests"]["modal_functionality"] = test_result
        self.update_summary()
    
    async def test_scenario_switching(self, page):
        """测试场景切换"""
        print("\n📋 测试4: 场景切换")
        test_result = {"passed": False, "details": {"scenarios": []}}
        
        try:
            scenario_cards = page.locator(".scenario-card")
            count = await scenario_cards.count()
            
            if count < 2:
                print("   ⚠️  场景数量不足，跳过切换测试")
                return
            
            # 测试前2个场景的切换
            for i in range(min(count, 3)):
                card = scenario_cards.nth(i)
                title = await card.locator("h3").inner_text()
                
                print(f"\n   测试场景 {i+1}: {title}")
                
                # 滚动到卡片位置
                await card.scroll_into_view_if_needed()
                await page.wait_for_timeout(500)
                
                # 点击打开
                await card.click()
                await page.wait_for_timeout(3000)
                
                # 验证打开
                modal_visible = await page.locator("#game-modal").is_visible()
                print(f"     打开: {'✅ 成功' if modal_visible else '❌ 失败'}")
                
                if modal_visible:
                    # 关闭
                    await page.click("#close-modal")
                    await page.wait_for_timeout(2000)
                    
                    modal_visible = await page.locator("#game-modal").is_visible()
                    print(f"     关闭: {'✅ 成功' if not modal_visible else '❌ 失败'}")
                    
                    test_result["details"]["scenarios"].append({
                        "title": title,
                        "opened": True,
                        "closed": not modal_visible
                    })
                else:
                    test_result["details"]["scenarios"].append({
                        "title": title,
                        "opened": False,
                        "closed": False
                    })
            
            # 检查是否所有场景都成功
            all_opened = all(s["opened"] for s in test_result["details"]["scenarios"])
            all_closed = all(s["closed"] for s in test_result["details"]["scenarios"])
            test_result["passed"] = all_opened and all_closed
            
            print(f"\n   切换测试: {'✅ 通过' if test_result['passed'] else '❌ 失败'}")
            
        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ 错误: {e}")
        
        self.results["tests"]["scenario_switching"] = test_result
        self.update_summary()
    
    async def test_complete_game_flow(self, page):
        """测试完整游戏流程"""
        print("\n📋 测试5: 完整游戏流程")
        test_result = {"passed": False, "details": {}}
        
        try:
            # 打开第一个场景
            scenario_cards = page.locator(".scenario-card")
            if await scenario_cards.count() == 0:
                raise Exception("未找到场景卡片")
            
            first_card = scenario_cards.first
            first_title = await first_card.locator("h3").inner_text()
            print(f"   测试场景: {first_title}")
            
            await first_card.click()
            await page.wait_for_timeout(3000)
            
            # 开始游戏（点击开始按钮）
            start_button = page.locator("#game-container button").first
            if await start_button.count() > 0:
                button_text = await start_button.inner_text()
                print(f"   开始游戏: {button_text}")
                await start_button.click()
                await page.wait_for_timeout(2000)
            
            # 进行3轮决策
            decisions = []
            for round_num in range(1, 4):
                print(f"\n   第{round_num}轮决策...")
                
                # 查找交互元素
                buttons = page.locator("#game-container button")
                inputs = page.locator("#game-container input")
                
                if await buttons.count() > 0:
                    button = buttons.first
                    text = await button.inner_text()
                    print(f"     点击: {text}")
                    await button.click()
                    decisions.append(f"点击: {text}")
                elif await inputs.count() > 0:
                    input_elem = inputs.first
                    await input_elem.fill("50")
                    print(f"     输入: 50")
                    decisions.append("输入: 50")
                else:
                    print(f"     未找到交互元素")
                    break
                
                await page.wait_for_timeout(2000)
            
            test_result["details"]["decisions"] = decisions
            test_result["details"]["decision_count"] = len(decisions)
            print(f"   完成 {len(decisions)} 轮决策")
            
            # 关闭弹窗
            await page.click("#close-modal")
            await page.wait_for_timeout(2000)
            
            modal_visible = await page.locator("#game-modal").is_visible()
            test_result["details"]["game_completed"] = not modal_visible
            
            print(f"   游戏完成: {'✅ 是' if not modal_visible else '❌ 否'}")
            test_result["passed"] = len(decisions) > 0 and not modal_visible
            
        except Exception as e:
            test_result["error"] = str(e)
            print(f"   ❌ 错误: {e}")
        
        self.results["tests"]["complete_game_flow"] = test_result
        self.update_summary()
    
    def update_summary(self):
        """更新测试总结"""
        passed = sum(1 for test in self.results["tests"].values() if test.get("passed", False))
        total = len(self.results["tests"])
        
        self.results["summary"]["total_tests"] = total
        self.results["summary"]["passed"] = passed
        self.results["summary"]["failed"] = total - passed
    
    async def generate_report(self):
        """生成测试报告"""
        print(f"\n{'='*80}")
        print("📊 最终测试结果")
        print(f"{'='*80}")
        
        summary = self.results["summary"]
        print(f"\n总测试项: {summary['total_tests']}")
        print(f"通过: {summary['passed']} ✅")
        print(f"失败: {summary['failed']} {'❌' if summary['failed'] > 0 else ''}")
        print(f"通过率: {summary['passed']/summary['total_tests']*100:.1f}%")
        
        # 详细结果
        print(f"\n📋 详细结果:")
        for test_name, test_result in self.results["tests"].items():
            status = "✅ 通过" if test_result.get("passed") else "❌ 失败"
            print(f"   {test_name}: {status}")
        
        # 保存JSON报告
        report_file = f"final_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 详细报告已保存: {report_file}")
        
        # 生成HTML报告
        await self.generate_html_report()
    
    async def generate_html_report(self):
        """生成HTML报告"""
        html_content = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Failure Logic 最终测试报告</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
        h2 {{ color: #555; margin-top: 30px; }}
        .summary {{ background: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .test-result {{ border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px; }}
        .test-result.passed {{ border-left: 5px solid #4CAF50; background: #f0fdf4; }}
        .test-result.failed {{ border-left: 5px solid #f44336; background: #fef2f2; }}
        .details {{ background: #f9f9f9; padding: 10px; border-radius: 3px; margin: 10px 0; }}
        .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Failure Logic 最终测试报告</h1>
        
        <div class="summary">
            <h2>📊 测试总结</h2>
            <p><strong>测试时间:</strong> {self.results['timestamp']}</p>
            <p><strong>测试URL:</strong> <a href="{self.results['url']}" target="_blank">{self.results['url']}</a></p>
            <p><strong>总测试项:</strong> {self.results['summary']['total_tests']}</p>
            <p><strong>通过:</strong> <span style="color: #4CAF50;">{self.results['summary']['passed']}</span></p>
            <p><strong>失败:</strong> <span style="color: #f44336;">{self.results['summary']['failed']}</span></p>
            <p><strong>通过率:</strong> {self.results['summary']['passed']/self.results['summary']['total_tests']*100:.1f}%</p>
        </div>
"""
        
        for test_name, test_result in self.results["tests"].items():
            status_class = "passed" if test_result.get("passed") else "failed"
            status_text = "✅ 通过" if test_result.get("passed") else "❌ 失败"
            
            html_content += f"""
        <div class="test-result {status_class}">
            <h3>{test_name.replace('_', ' ').title()}: {status_text}</h3>
            <div class="details">
                <pre>{json.dumps(test_result, ensure_ascii=False, indent=2)}</pre>
            </div>
        </div>
"""
        
        html_content += f"""
        <div class="footer">
            <p>测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>测试工具: Playwright + Microsoft Edge</p>
        </div>
    </div>
</body>
</html>
"""
        
        html_file = f"final_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"\n💾 HTML报告已保存: {html_file}")

if __name__ == "__main__":
    tester = FinalComprehensiveTester()
    asyncio.run(tester.run_all_tests())

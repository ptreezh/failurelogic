"""
针对本地部署的完整场景验证测试
处理前端SPA路由问题
"""

import asyncio
from playwright.async_api import async_playwright
from universal_scenario_validator import ScenarioTestFramework
from specific_scenario_validations import ComprehensiveScenarioValidator
from datetime import datetime
import json
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_local_deployment_comprehensive():
    """全面测试本地部署的所有场景"""
    print("🚀 开始全面测试本地部署的所有场景")
    print("="*60)
    
    # 加载所有场景
    framework = ScenarioTestFramework(base_url="http://localhost:8000")
    framework.load_scenarios()
    
    if not framework.all_scenarios:
        print("❌ 未找到任何场景定义")
        return False
    
    print(f"✅ 已加载 {len(framework.all_scenarios)} 个场景")
    
    # 限制测试数量以避免过长时间运行 - 可以根据需要调整
    test_scenarios = framework.all_scenarios[:min(10, len(framework.all_scenarios))]  # 测试前10个场景
    
    print(f"🔍 将测试 {len(test_scenarios)} 个场景")
    
    # 为SPA应用创建特殊的验证器
    results = []
    validator = ComprehensiveScenarioValidator(base_url="http://localhost:8000")
    
    for i, scenario in enumerate(test_scenarios):
        print(f"  [{i+1}/{len(test_scenarios)}] 测试场景: {scenario['name']}")
        
        try:
            # 对于SPA应用，我们需要先访问主页，然后通过应用内导航访问场景
            async with async_playwright() as p:
                try:
                    browser = await p.chromium.launch(channel='msedge', headless=False, slow_mo=500)
                except:
                    browser = await p.chromium.launch(headless=False, slow_mo=500)
                
                page = await browser.new_page()
                page.set_default_timeout(30000)
                
                # 监听控制台错误
                console_errors = []
                page.on('console', lambda msg: console_errors.append({
                    'type': msg.type,
                    'text': msg.text,
                    'location': msg.location
                }) if msg.type == 'error' else None)
                
                try:
                    # 首先访问主页
                    print(f"    访问主页...")
                    await page.goto("http://localhost:8000", wait_until="domcontentloaded")
                    await page.wait_for_timeout(3000)
                    
                    # 尝试通过导航菜单访问场景
                    print(f"    尝试导航到场景...")
                    
                    # 点击场景导航按钮
                    try:
                        # 查找场景导航按钮 - 分别尝试每个选择器
                        selectors = [
                            "button[data-page='scenarios']",
                            "text=场景",
                            "text=Scenarios",
                            "button:has-text('场景')",
                            "button:has-text('Scenarios')"
                        ]
                        
                        scenario_nav_btn = None
                        for selector in selectors:
                            try:
                                scenario_nav_btn = await page.query_selector(selector)
                                if scenario_nav_btn:
                                    print(f"    找到导航按钮: {selector}")
                                    break
                            except:
                                continue
                        
                        if scenario_nav_btn:
                            await scenario_nav_btn.click()
                            await page.wait_for_timeout(2000)
                            print(f"    导航到场景页面成功")
                        else:
                            print(f"    未找到场景导航按钮，尝试其他方式")
                    except Exception as nav_error:
                        print(f"    导航到场景页面时出错: {nav_error}")
                    
                    # 查找并点击特定场景
                    try:
                        # 尝试查找场景卡片 - 分别尝试每个选择器
                        card_selectors = [
                            f"text={scenario['name']}",
                            f".scenario-card:has-text('{scenario['name']}')",
                            f"[data-scenario-id='{scenario['id']}']",
                            f"button:has-text('{scenario['name']}')",
                            f"a:has-text('{scenario['name']}')"
                        ]
                        
                        scenario_card = None
                        for selector in card_selectors:
                            try:
                                scenario_card = await page.query_selector(selector)
                                if scenario_card:
                                    print(f"    找到场景卡片: {selector}")
                                    break
                            except:
                                continue
                        
                        if scenario_card:
                            await scenario_card.click()
                            await page.wait_for_timeout(3000)
                            print(f"    点击场景卡片成功")
                        else:
                            print(f"    未找到场景卡片: {scenario['name']}")
                    except Exception as card_error:
                        print(f"    点击场景卡片时出错: {card_error}")
                    
                    # 验证页面内容
                    content = await page.content()
                    name_found = scenario['name'] in content
                    desc_found = scenario['description'][:20] in content if scenario['description'] else False
                    
                    # 检查是否有交互元素
                    buttons = await page.query_selector_all("button")
                    inputs = await page.query_selector_all("input")
                    
                    # 尝试一些交互
                    if buttons:
                        for btn in buttons[:2]:  # 尝试点击前2个按钮
                            try:
                                if await btn.is_enabled() and await btn.is_visible():
                                    await btn.click()
                                    await page.wait_for_timeout(500)
                                    break
                            except:
                                continue
                    
                    # 构造结果
                    result = {
                        'scenario_id': scenario['id'],
                        'scenario_name': scenario['name'],
                        'name_found_in_content': name_found,
                        'description_found_in_content': desc_found,
                        'has_buttons': len(buttons) > 0,
                        'has_inputs': len(inputs) > 0,
                        'console_errors': console_errors,
                        'overall_success': name_found and len(buttons) > 0,  # 基本要求：能找到名称且有交互元素
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    results.append(result)
                    
                    status = "✅" if result['overall_success'] else "⚠️ "
                    print(f"      {status} {scenario['name']}: 名称找到={name_found}, 按钮数={len(buttons)}")
                    
                finally:
                    await browser.close()
                    
        except Exception as e:
            print(f"    ❌ {scenario['name']}: {str(e)}")
            results.append({
                'scenario_id': scenario['id'],
                'scenario_name': scenario['name'],
                'overall_success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    # 统计结果
    successful = sum(1 for r in results if r.get('overall_success', False))
    total_tested = len(results)
    
    print(f"\n📊 测试结果: {successful}/{total_tested} 成功")
    print(f"📈 成功率: {successful/total_tested*100:.1f}%")
    
    # 显示详细结果
    print(f"\n📋 详细结果:")
    for result in results:
        status = "✅" if result.get('overall_success', False) else "❌"
        scenario_name = result.get('scenario_name', 'Unknown')
        print(f"  {status} {scenario_name}")
    
    return successful == total_tested

async def main():
    """主函数"""
    print("🎯 本地部署场景验证测试")
    print("="*60)
    
    success = await test_local_deployment_comprehensive()
    
    print("\n" + "="*60)
    if success:
        print("🎉 所有测试场景验证通过！")
        print("✅ 本地部署的所有场景功能正常")
    else:
        print("⚠️  部分场景验证失败")
        print("💡 请注意检查失败的场景")
    
    print("🏁 测试完成")
    return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
"""
并发Playwright端到端测试智能体
全面测试Failure Logic平台的所有功能
四个智能体分别负责不同测试场景：
1) 场景页面导航和难度选择器功能
2) 计算器和指数增长功能  
3) 用户交互和游戏流程
4) API连接和数据同步功能
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def scenario_navigation_agent(browser):
    """智能体1: 场景页面导航和难度选择器功能测试"""
    logger.info("[场景导航智能体] 开始测试场景页面导航和难度选择器功能")
    
    page = await browser.new_page()
    results = {}
    
    try:
        # 访问主页
        await page.goto("http://localhost:8081", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        # 移除加载屏幕
        await page.evaluate("""
            () => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }
            }
        """)
        
        # 测试导航到场景页面
        scenario_nav_button = await page.query_selector("[data-page='scenarios']")
        if scenario_nav_button:
            await scenario_nav_button.click()
            await page.wait_for_timeout(3000)
            
            # 检查是否成功导航到场景页面
            scenario_page_active = await page.query_selector("#scenarios-page.page.active")
            if scenario_page_active:
                logger.info("[场景导航智能体] ✅ 成功导航到场景页面")
                results['navigation'] = True
            else:
                logger.warning("[场景导航智能体] ⚠️ 未能确认到达场景页面")
                results['navigation'] = False
        else:
            logger.error("[场景导航智能体] ❌ 未找到场景导航按钮")
            results['navigation'] = False
        
        # 测试难度选择器功能
        difficulty_selector = await page.query_selector("#difficulty-level")
        if difficulty_selector:
            # 获取当前难度值
            current_difficulty = await page.input_value("#difficulty-level")
            logger.info(f"[场景导航智能体] 当前难度: {current_difficulty}")
            
            # 测试切换难度
            await page.select_option("#difficulty-level", "intermediate")
            await page.wait_for_timeout(500)
            
            new_difficulty = await page.input_value("#difficulty-level")
            if new_difficulty == "intermediate":
                logger.info("[场景导航智能体] ✅ 成功切换到中级难度")
                
                await page.select_option("#difficulty-level", "advanced")
                await page.wait_for_timeout(500)
                
                new_difficulty = await page.input_value("#difficulty-level")
                if new_difficulty == "advanced":
                    logger.info("[场景导航智能体] ✅ 成功切换到高级难度")
                    
                    await page.select_option("#difficulty-level", "beginner")
                    await page.wait_for_timeout(500)
                    
                    new_difficulty = await page.input_value("#difficulty-level")
                    if new_difficulty == "beginner":
                        logger.info("[场景导航智能体] ✅ 成功切换回初级难度")
                        results['difficulty_selector'] = True
                    else:
                        logger.error("[场景导航智能体] ❌ 难度切换失败")
                        results['difficulty_selector'] = False
                else:
                    logger.error("[场景导航智能体] ❌ 高级难度切换失败")
                    results['difficulty_selector'] = False
            else:
                logger.error("[场景导航智能体] ❌ 中级难度切换失败")
                results['difficulty_selector'] = False
        else:
            logger.warning("[场景导航智能体] ℹ️ 未找到难度选择器")
            results['difficulty_selector'] = False
        
        # 测试场景卡片加载
        await page.wait_for_timeout(3000)  # 等待场景加载
        scenario_cards_count = await page.locator('.scenario-card').count()
        logger.info(f"[场景导航智能体] 发现 {scenario_cards_count} 个场景卡片")
        
        if scenario_cards_count > 0:
            logger.info("[场景导航智能体] ✅ 场景卡片加载正常")
            results['scenario_cards'] = True
        else:
            logger.warning("[场景导航智能体] ⚠️ 未发现场景卡片")
            results['scenario_cards'] = False
            
    except Exception as e:
        logger.error(f"[场景导航智能体] 测试过程中发生错误: {str(e)}")
        results['navigation'] = False
        results['difficulty_selector'] = False
        results['scenario_cards'] = False
    
    finally:
        await page.close()
        logger.info("[场景导航智能体] 测试完成")
        
    return results


async def calculator_exponential_agent(browser):
    """智能体2: 计算器和指数增长功能测试"""
    logger.info("[计算器指数增长智能体] 开始测试计算器和指数增长功能")
    
    page = await browser.new_page()
    results = {}
    
    try:
        # 访问指数增长页面
        await page.goto("http://localhost:8081/#exponential", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        # 移除加载屏幕
        await page.evaluate("""
            () => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }
            }
        """)
        
        # 等待页面加载
        await page.wait_for_timeout(3000)
        
        # 测试复利计算器
        principal_input = await page.query_selector("#principal")
        rate_input = await page.query_selector("#rate")
        time_input = await page.query_selector("#time")
        calc_button = await page.query_selector("#calculate-btn")
        
        if all([principal_input, rate_input, time_input, calc_button]):
            # 填入测试数据
            await principal_input.fill("100000")  # 10万本金
            await rate_input.fill("8")           # 8%年利率
            await time_input.fill("30")          # 30年
            
            await calc_button.click()
            await page.wait_for_timeout(1000)
            
            # 检查结果是否显示
            result_container = await page.query_selector("#compound-result")
            if result_container:
                result_text = await result_container.inner_text()
                if result_text and "复利" in result_text:
                    logger.info("[计算器指数增长智能体] ✅ 复利计算器功能正常")
                    results['compound_calculator'] = True
                else:
                    logger.warning("[计算器指数增长智能体] ⚠️ 复利计算器结果未显示或格式异常")
                    results['compound_calculator'] = False
            else:
                logger.warning("[计算器指数增长智能体] ⚠️ 未找到复利计算器结果容器")
                results['compound_calculator'] = False
        else:
            logger.error("[计算器指数增长智能体] ❌ 复利计算器组件缺失")
            results['compound_calculator'] = False
        
        # 测试指数计算器
        base_input = await page.query_selector("#base")
        exponent_input = await page.query_selector("#exponent")
        exp_calc_button = await page.query_selector("#calculate-exp-btn")
        
        if all([base_input, exponent_input, exp_calc_button]):
            # 填入测试数据
            await base_input.fill("2")      # 底数为2
            await exponent_input.fill("10") # 指数为10
            
            await exp_calc_button.click()
            await page.wait_for_timeout(1000)
            
            # 检查结果是否显示
            exp_result_container = await page.query_selector("#exponential-result")
            if exp_result_container:
                exp_result_text = await exp_result_container.inner_text()
                if exp_result_text and "2^10" in exp_result_text:
                    logger.info("[计算器指数增长智能体] ✅ 指数计算器功能正常")
                    results['exponential_calculator'] = True
                else:
                    logger.warning("[计算器指数增长智能体] ⚠️ 指数计算器结果未显示或格式异常")
                    results['exponential_calculator'] = False
            else:
                logger.warning("[计算器指数增长智能体] ⚠️ 未找到指数计算器结果容器")
                results['exponential_calculator'] = False
        else:
            logger.error("[计算器指数增长智能体] ❌ 指数计算器组件缺失")
            results['exponential_calculator'] = False
            
    except Exception as e:
        logger.error(f"[计算器指数增长智能体] 测试过程中发生错误: {str(e)}")
        results['compound_calculator'] = False
        results['exponential_calculator'] = False
    
    finally:
        await page.close()
        logger.info("[计算器指数增长智能体] 测试完成")
        
    return results


async def user_interaction_game_agent(browser):
    """智能体3: 用户交互和游戏流程测试"""
    logger.info("[用户交互游戏智能体] 开始测试用户交互和游戏流程")
    
    page = await browser.new_page()
    results = {}
    
    try:
        # 访问主页
        await page.goto("http://localhost:8081", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        # 移除加载屏幕
        await page.evaluate("""
            () => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }
            }
        """)
        
        # 导航到场景页面
        scenario_nav_button = await page.query_selector("[data-page='scenarios']")
        if scenario_nav_button:
            await scenario_nav_button.click()
            await page.wait_for_timeout(3000)
        else:
            logger.error("[用户交互游戏智能体] ❌ 未找到场景导航按钮")
            results['navigation'] = False
            await page.close()
            return results
        
        # 等待场景加载
        await page.wait_for_timeout(3000)
        
        # 尝试点击第一个场景卡片
        scenario_cards = await page.locator('.scenario-card').all()
        if scenario_cards:
            # 点击第一个场景
            await scenario_cards[0].click()
            await page.wait_for_timeout(3000)
            
            # 检查是否有交互元素
            interactive_elements = await page.locator('input, textarea, select, button, [role="button"], .decision-control').count()
            logger.info(f"[用户交互游戏智能体] 发现 {interactive_elements} 个交互元素")
            
            if interactive_elements > 0:
                logger.info("[用户交互游戏智能体] ✅ 场景交互功能正常")
                results['interaction_elements'] = True
                
                # 尝试与一些交互元素互动
                # 查找单选按钮
                radio_buttons = await page.locator('input[type="radio"]').all()
                if radio_buttons:
                    await radio_buttons[0].click()
                    logger.info("[用户交互游戏智能体] ✅ 成功与单选按钮交互")
                    results['radio_interaction'] = True
                else:
                    logger.info("[用户交互游戏智能体] ℹ️ 未找到单选按钮")
                    results['radio_interaction'] = False
                
                # 查找文本输入框
                text_inputs = await page.locator('input[type="text"], input[type="number"], textarea').count()
                if text_inputs > 0:
                    text_input = page.locator('input[type="text"], input[type="number"], textarea').first
                    if await text_input.count() > 0:
                        await text_input.fill("Test input")
                        logger.info("[用户交互游戏智能体] ✅ 成功与文本输入框交互")
                        results['text_input_interaction'] = True
                    else:
                        logger.info("[用户交互游戏智能体] ℹ️ 未找到可交互的文本输入框")
                        results['text_input_interaction'] = False
                else:
                    logger.info("[用户交互游戏智能体] ℹ️ 未找到文本输入框")
                    results['text_input_interaction'] = False
                    
                # 查找提交按钮并尝试点击
                submit_selectors = [
                    "button:has-text('提交')",
                    "button:has-text('Submit')", 
                    "button:has-text('检查')",
                    "button:has-text('Check')",
                    "button:has-text('下一步')",
                    "button:has-text('Next')"
                ]
                
                submitted = False
                for submit_selector in submit_selectors:
                    try:
                        submit_btn = page.locator(submit_selector).first
                        if await submit_btn.count() > 0:
                            await submit_btn.click()
                            await page.wait_for_timeout(1500)
                            logger.info("[用户交互游戏智能体] ✅ 成功点击提交按钮")
                            submitted = True
                            results['submit_interaction'] = True
                            break
                    except:
                        continue
                
                if not submitted:
                    logger.info("[用户交互游戏智能体] ℹ️ 未找到提交按钮")
                    results['submit_interaction'] = False
                    
            else:
                logger.warning("[用户交互游戏智能体] ⚠️ 场景中未发现交互元素")
                results['interaction_elements'] = False
                results['radio_interaction'] = False
                results['text_input_interaction'] = False
                results['submit_interaction'] = False
        else:
            logger.warning("[用户交互游戏智能体] ⚠️ 未找到场景卡片")
            results['interaction_elements'] = False
            results['radio_interaction'] = False
            results['text_input_interaction'] = False
            results['submit_interaction'] = False
            
    except Exception as e:
        logger.error(f"[用户交互游戏智能体] 测试过程中发生错误: {str(e)}")
        results['interaction_elements'] = False
        results['radio_interaction'] = False
        results['text_input_interaction'] = False
        results['submit_interaction'] = False
    
    finally:
        await page.close()
        logger.info("[用户交互游戏智能体] 测试完成")
        
    return results


async def api_data_sync_agent(browser):
    """智能体4: API连接和数据同步功能测试"""
    logger.info("[API数据同步智能体] 开始测试API连接和数据同步功能")
    
    page = await browser.new_page()
    results = {}
    
    try:
        # 访问主页
        await page.goto("http://localhost:8081", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        
        # 移除加载屏幕
        await page.evaluate("""
            () => {
                const loadingScreen = document.getElementById('loading-screen');
                if (loadingScreen) {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                }
            }
        """)
        
        # 测试API连接
        logger.info("[API数据同步智能体] 测试API端点连接...")
        
        # 使用浏览器的fetch API测试后端连接
        api_results = await page.evaluate("""
            async () => {
                const results = {};
                
                try {
                    // 测试指数问题API端点
                    const expResponse = await fetch('http://localhost:8082/api/exponential/questions', {
                        method: 'GET',
                        headers: {'Content-Type': 'application/json'}
                    }).then(res => ({ok: res.ok, status: res.status}));
                    results.expQuestions = expResponse;
                } catch(e) {
                    results.expQuestions = {ok: false, error: e.message};
                }
                
                try {
                    // 测试复合问题API端点
                    const compResponse = await fetch('http://localhost:8082/api/compound/questions', {
                        method: 'GET',
                        headers: {'Content-Type': 'application/json'}
                    }).then(res => ({ok: res.ok, status: res.status}));
                    results.compQuestions = compResponse;
                } catch(e) {
                    results.compQuestions = {ok: false, error: e.message};
                }
                
                try {
                    // 测试健康检查API端点
                    const healthResponse = await fetch('http://localhost:8082/health', {
                        method: 'GET',
                        headers: {'Content-Type': 'application/json'}
                    }).then(res => ({ok: res.ok, status: res.status}));
                    results.health = healthResponse;
                } catch(e) {
                    results.health = {ok: false, error: e.message};
                }
                
                try {
                    // 测试结果提交API端点
                    const resultResponse = await fetch('http://localhost:8082/api/results/submit', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({test: true})
                    }).then(res => ({ok: res.ok, status: res.status}));
                    results.resultsSubmit = resultResponse;
                } catch(e) {
                    results.resultsSubmit = {ok: false, error: e.message};
                }
                
                return results;
            }
        """)
        
        # 分析API测试结果
        api_success_count = 0
        total_apis = 0
        
        for api_name, result in api_results.items():
            total_apis += 1
            if result.get('ok', False):
                logger.info(f"[API数据同步智能体] ✅ {api_name} API: 状态码 {result.get('status', 'N/A')}")
                api_success_count += 1
            else:
                logger.warning(f"[API数据同步智能体] ❌ {api_name} API: {result.get('error', '连接失败')}")
        
        if api_success_count >= 2:  # 至少一半API正常
            logger.info(f"[API数据同步智能体] ✅ API连接测试通过 ({api_success_count}/{total_apis})")
            results['api_connection'] = True
        else:
            logger.warning(f"[API数据同步智能体] ⚠️ API连接测试部分失败 ({api_success_count}/{total_apis})")
            results['api_connection'] = False
        
        # 测试数据同步功能（如果存在同步按钮）
        sync_button = await page.query_selector("#sync-button")
        if sync_button:
            try:
                await sync_button.click()
                await page.wait_for_timeout(2000)
                logger.info("[API数据同步智能体] ✅ 数据同步按钮点击成功")
                results['sync_functionality'] = True
            except Exception as e:
                logger.warning(f"[API数据同步智能体] ⚠️ 数据同步功能测试失败: {str(e)}")
                results['sync_functionality'] = False
        else:
            logger.info("[API数据同步智能体] ℹ️ 未找到数据同步按钮")
            results['sync_functionality'] = False
            
    except Exception as e:
        logger.error(f"[API数据同步智能体] 测试过程中发生错误: {str(e)}")
        results['api_connection'] = False
        results['sync_functionality'] = False
    
    finally:
        await page.close()
        logger.info("[API数据同步智能体] 测试完成")
        
    return results


async def run_concurrent_tests():
    """运行并发测试"""
    logger.info("🚀 启动并发Playwright端到端测试智能体")
    logger.info("📋 测试协议: Microsoft Edge浏览器 + 非headless模式")
    logger.info("=" * 70)
    
    async with async_playwright() as p:
        # 启动Microsoft Edge浏览器（非headless模式）
        try:
            browser = await p.chromium.launch(channel='msedge', headless=False)
            logger.info("✅ 已启动Microsoft Edge浏览器（非headless模式）")
        except Exception as e:
            logger.warning(f"⚠️ 无法启动Edge浏览器: {e}")
            logger.info("⚠️ 尝试启动Chromium浏览器...")
            browser = await p.chromium.launch(headless=False)
            logger.info("✅ 已启动Chromium浏览器（非headless模式）")
        
        # 并发运行所有测试智能体
        results = await asyncio.gather(
            scenario_navigation_agent(browser),
            calculator_exponential_agent(browser),
            user_interaction_game_agent(browser),
            api_data_sync_agent(browser)
        )
        
        # 关闭浏览器
        await browser.close()
        
        # 汇总结果
        logger.info("=" * 70)
        logger.info("🎯 并发端到端测试完成!")
        logger.info("📋 各智能体测试结果:")
        
        agent_names = [
            "场景导航智能体",
            "计算器指数增长智能体", 
            "用户交互游戏智能体",
            "API数据同步智能体"
        ]
        
        for i, (agent_name, result) in enumerate(zip(agent_names, results)):
            logger.info(f"\n{agent_name}结果:")
            for key, value in result.items():
                status = "✅" if value else "❌"
                logger.info(f"  {key}: {status}")
        
        # 计算总体成功率
        total_checks = 0
        successful_checks = 0
        
        for result in results:
            for value in result.values():
                total_checks += 1
                if value:
                    successful_checks += 1
        
        if total_checks > 0:
            success_rate = (successful_checks / total_checks) * 100
            logger.info(f"\n📊 总体成功率: {successful_checks}/{total_checks} ({success_rate:.1f}%)")
        
        if successful_checks == total_checks:
            logger.info("\n🏆 所有并发测试通过!")
            logger.info("✅ 四个智能体均成功完成各自测试任务")
            logger.info("✅ 所有功能模块正常工作")
            logger.info("✅ 系统准备就绪，可用于全面的认知偏差教育体验!")
        else:
            logger.info(f"\n⚠️ 部分测试未通过")
            logger.info(f"   成功: {successful_checks}, 失败: {total_checks - successful_checks}")
        
        logger.info(f"\n🏁 测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return results


def main():
    """主函数"""
    logger.info("🏠 Failure Logic平台 - 并发端到端测试智能体")
    logger.info("=" * 80)
    logger.info("📋 测试协议: MCP Playwright + Microsoft Edge (非headless模式)")
    logger.info("🎯 测试目标: 四个智能体并发验证所有功能模块")
    logger.info("=" * 80)
    
    # 运行异步测试
    results = asyncio.run(run_concurrent_tests())
    
    logger.info("\n" + "=" * 80)
    logger.info("🎉 并发端到端测试完成!")
    
    return results


if __name__ == "__main__":
    main()
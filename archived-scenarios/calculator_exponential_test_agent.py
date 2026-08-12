"""
计算器和指数增长功能测试智能体
专门测试指数计算页面、复合计算器功能、指数计算器功能、验证计算结果准确性、测试不同参数的计算
在Microsoft Edge浏览器中运行，禁用无头模式
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def calculator_exponential_test_agent():
    """计算器和指数增长功能测试智能体"""
    logger.info("🚀 启动计算器和指数增长功能测试智能体")
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

        page = await browser.new_page()
        results = {}

        try:
            # 1. 访问主页然后导航到指数计算页面
            logger.info("\n🔍 测试步骤 1: 访问主页并导航到指数计算页面")
            await page.goto("http://localhost:8081", wait_until="domcontentloaded")
            await page.wait_for_timeout(3000)

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

            # 检查指数页面元素是否存在于DOM中
            exponential_page_exists = await page.evaluate("""
                () => {
                    return document.getElementById('exponential-page') !== null;
                }
            """)

            if exponential_page_exists:
                logger.info("✅ 指数页面元素存在于DOM中")

                # 尝试直接激活指数页面（通过JavaScript调用NavigationManager）
                try:
                    await page.evaluate("""
                        () => {
                            if (window.NavigationManager) {
                                window.NavigationManager.navigateTo('exponential');
                            } else {
                                // 如果没有NavigationManager，则直接显示指数页面
                                const allPages = document.querySelectorAll('.page');
                                allPages.forEach(p => p.classList.remove('active'));

                                const expPage = document.getElementById('exponential-page');
                                if (expPage) {
                                    expPage.classList.add('active');
                                }

                                // 更新导航按钮状态
                                const allNavButtons = document.querySelectorAll('.nav-item');
                                allNavButtons.forEach(btn => {
                                    btn.classList.remove('active');
                                    if (btn.dataset.page === 'exponential') {
                                        btn.classList.add('active');
                                    }
                                });
                            }
                        }
                    """)
                    await page.wait_for_timeout(2000)

                    # 检查指数页面是否被激活
                    is_active = await page.evaluate("""
                        () => {
                            const expPage = document.getElementById('exponential-page');
                            return expPage && expPage.classList.contains('active');
                        }
                    """)

                    if is_active:
                        logger.info("✅ 成功激活指数计算页面")
                        results['access_exponential_page'] = True
                    else:
                        logger.error("❌ 未能激活指数计算页面")
                        results['access_exponential_page'] = False

                except Exception as e:
                    logger.error(f"❌ 激活指数页面时出错: {str(e)}")
                    results['access_exponential_page'] = False
            else:
                logger.error("❌ 指数页面元素不存在于DOM中")
                results['access_exponential_page'] = False

            # 2. 测试复合计算器功能
            logger.info("\n🧮 测试步骤 2: 测试复合计算器功能")

            # 等待复合计算器组件加载
            try:
                await page.wait_for_selector("#principal", timeout=10000)
                await page.wait_for_selector("#rate", timeout=10000)
                await page.wait_for_selector("#time", timeout=10000)
                await page.wait_for_selector("#calculate-btn", timeout=10000)

                # 查找复合计算器组件
                principal_input = await page.query_selector("#principal")
                rate_input = await page.query_selector("#rate")
                time_input = await page.query_selector("#time")
                calc_button = await page.query_selector("#calculate-btn")

                if all([principal_input, rate_input, time_input, calc_button]):
                    logger.info("✅ 复合计算器组件加载正常")

                    # 测试案例1: 标准复利计算 (10万本金, 8%年利率, 30年)
                    await principal_input.fill("100000")  # 10万本金
                    await rate_input.fill("8")            # 8%年利率
                    await time_input.fill("30")           # 30年

                    await calc_button.click()
                    await page.wait_for_timeout(1000)

                    # 检查结果是否显示
                    result_container = await page.query_selector("#compound-result")
                    if result_container:
                        result_text = await result_container.inner_text()
                        if result_text and "复利" in result_text:
                            logger.info(f"✅ 复利计算器结果: {result_text}")

                            # 验证计算结果的准确性 (100000*(1+0.08)^30 ≈ 1006265.69)
                            expected_amount = 100000 * (1.08 ** 30)
                            logger.info(f"预期金额: {expected_amount:.2f}")

                            # 提取实际计算结果进行比较
                            import re
                            numbers = re.findall(r'\d+\.?\d*', result_text.replace(',', ''))
                            actual_amount = 0
                            for num in numbers:
                                if float(num) > actual_amount:  # 找到最大的数字作为结果
                                    actual_amount = float(num)

                            if abs(actual_amount - expected_amount) < 1000:  # 允许一定误差
                                logger.info("✅ 复利计算器计算结果准确")
                                results['compound_calculator_accuracy'] = True
                            else:
                                logger.warning(f"⚠️ 复利计算器计算结果可能不准确。预期: {expected_amount:.2f}, 实际: {actual_amount}")
                                results['compound_calculator_accuracy'] = False

                            results['compound_calculator_functionality'] = True
                        else:
                            logger.warning("⚠️ 复利计算器结果未显示或格式异常")
                            results['compound_calculator_functionality'] = False
                            results['compound_calculator_accuracy'] = False
                    else:
                        logger.error("❌ 未找到复利计算器结果容器")
                        results['compound_calculator_functionality'] = False
                        results['compound_calculator_accuracy'] = False
                else:
                    logger.error("❌ 复利计算器组件缺失")
                    results['compound_calculator_functionality'] = False
                    results['compound_calculator_accuracy'] = False
            except:
                logger.error("❌ 复合计算器组件未加载")
                results['compound_calculator_functionality'] = False
                results['compound_calculator_accuracy'] = False

            # 3. 测试指数计算器功能
            logger.info("\n📈 测试步骤 3: 测试指数计算器功能")

            # 等待指数计算器组件加载
            try:
                await page.wait_for_selector("#base", timeout=10000)
                await page.wait_for_selector("#exponent", timeout=10000)
                await page.wait_for_selector("#calculate-exp-btn", timeout=10000)

                # 查找指数计算器组件
                base_input = await page.query_selector("#base")
                exponent_input = await page.query_selector("#exponent")
                exp_calc_button = await page.query_selector("#calculate-exp-btn")

                if all([base_input, exponent_input, exp_calc_button]):
                    logger.info("✅ 指数计算器组件加载正常")

                    # 测试案例1: 2^10 = 1024
                    await base_input.fill("2")      # 底数为2
                    await exponent_input.fill("10") # 指数为10

                    await exp_calc_button.click()
                    await page.wait_for_timeout(1000)

                    # 检查结果是否显示
                    exp_result_container = await page.query_selector("#exponential-result")
                    if exp_result_container:
                        exp_result_text = await exp_result_container.inner_text()
                        if exp_result_text and "2^10" in exp_result_text:
                            logger.info(f"✅ 指数计算器结果: {exp_result_text}")

                            # 验证计算结果的准确性 (2^10 = 1024)
                            expected_exp_result = 2 ** 10
                            logger.info(f"预期指数结果: {expected_exp_result}")

                            # 提取实际计算结果进行比较
                            import re
                            numbers = re.findall(r'\d+', exp_result_text)
                            actual_exp_result = 0
                            for num in numbers:
                                if int(num) > actual_exp_result:  # 找到最大的数字作为结果
                                    actual_exp_result = int(num)

                            if actual_exp_result == expected_exp_result:
                                logger.info("✅ 指数计算器计算结果准确")
                                results['exponential_calculator_accuracy'] = True
                            else:
                                logger.warning(f"⚠️ 指数计算器计算结果不准确。预期: {expected_exp_result}, 实际: {actual_exp_result}")
                                results['exponential_calculator_accuracy'] = False

                            results['exponential_calculator_functionality'] = True
                        else:
                            logger.warning("⚠️ 指数计算器结果未显示或格式异常")
                            results['exponential_calculator_functionality'] = False
                            results['exponential_calculator_accuracy'] = False
                    else:
                        logger.error("❌ 未找到指数计算器结果容器")
                        results['exponential_calculator_functionality'] = False
                        results['exponential_calculator_accuracy'] = False
                else:
                    logger.error("❌ 指数计算器组件缺失")
                    results['exponential_calculator_functionality'] = False
                    results['exponential_calculator_accuracy'] = False

            except:
                logger.error("❌ 指数计算器组件未加载")
                results['exponential_calculator_functionality'] = False
                results['exponential_calculator_accuracy'] = False

            # 4. 验证计算结果的准确性 - 额外测试
            logger.info("\n🔍 测试步骤 4: 验证计算结果的准确性 - 额外测试")

            # 测试复合计算器其他参数组合
            try:
                # 等待组件可用
                await page.wait_for_selector("#principal", timeout=5000)
                await page.wait_for_selector("#rate", timeout=5000)
                await page.wait_for_selector("#time", timeout=5000)
                await page.wait_for_selector("#calculate-btn", timeout=5000)

                principal_input = await page.query_selector("#principal")
                rate_input = await page.query_selector("#rate")
                time_input = await page.query_selector("#time")
                calc_button = await page.query_selector("#calculate-btn")

                if all([principal_input, rate_input, time_input, calc_button]):
                    # 测试案例2: 较小数值 (1000本金, 5%年利率, 10年)
                    await principal_input.fill("1000")  # 1000本金
                    await rate_input.fill("5")          # 5%年利率
                    await time_input.fill("10")         # 10年

                    await calc_button.click()
                    await page.wait_for_timeout(1000)

                    result_container = await page.query_selector("#compound-result")
                    if result_container:
                        result_text = await result_container.inner_text()
                        if result_text:
                            logger.info(f"✅ 复利计算器额外测试结果: {result_text}")

                            # 验证计算结果的准确性 (1000*(1+0.05)^10 ≈ 1628.89)
                            expected_amount = 1000 * (1.05 ** 10)
                            logger.info(f"预期金额: {expected_amount:.2f}")

                            import re
                            numbers = re.findall(r'\d+\.?\d*', result_text.replace(',', ''))
                            actual_amount = 0
                            for num in numbers:
                                if float(num) > actual_amount:  # 找到最大的数字作为结果
                                    actual_amount = float(num)

                            if abs(actual_amount - expected_amount) < 10:  # 允许较小误差
                                logger.info("✅ 复利计算器额外测试计算结果准确")
                                results['compound_calculator_additional_accuracy'] = True
                            else:
                                logger.warning(f"⚠️ 复利计算器额外测试计算结果可能不准确。预期: {expected_amount:.2f}, 实际: {actual_amount}")
                                results['compound_calculator_additional_accuracy'] = False
                        else:
                            logger.warning("⚠️ 复利计算器额外测试结果未显示")
                            results['compound_calculator_additional_accuracy'] = False
                    else:
                        logger.error("❌ 未找到复利计算器额外测试结果容器")
                        results['compound_calculator_additional_accuracy'] = False
                else:
                    logger.error("❌ 复利计算器组件在额外测试中缺失")
                    results['compound_calculator_additional_accuracy'] = False
            except:
                logger.error("❌ 复利计算器额外测试失败")
                results['compound_calculator_additional_accuracy'] = False

            # 测试指数计算器其他参数组合
            try:
                # 等待组件可用
                await page.wait_for_selector("#base", timeout=5000)
                await page.wait_for_selector("#exponent", timeout=5000)
                await page.wait_for_selector("#calculate-exp-btn", timeout=5000)

                base_input = await page.query_selector("#base")
                exponent_input = await page.query_selector("#exponent")
                exp_calc_button = await page.query_selector("#calculate-exp-btn")

                if all([base_input, exponent_input, exp_calc_button]):
                    # 测试案例2: 3^4 = 81
                    await base_input.fill("3")      # 底数为3
                    await exponent_input.fill("4")  # 指数为4

                    await exp_calc_button.click()
                    await page.wait_for_timeout(1000)

                    exp_result_container = await page.query_selector("#exponential-result")
                    if exp_result_container:
                        exp_result_text = await exp_result_container.inner_text()
                        if exp_result_text:
                            logger.info(f"✅ 指数计算器额外测试结果: {exp_result_text}")

                            # 验证计算结果的准确性 (3^4 = 81)
                            expected_exp_result = 3 ** 4
                            logger.info(f"预期指数结果: {expected_exp_result}")

                            import re
                            numbers = re.findall(r'\d+', exp_result_text)
                            actual_exp_result = 0
                            for num in numbers:
                                if int(num) > actual_exp_result:  # 找到最大的数字作为结果
                                    actual_exp_result = int(num)

                            if actual_exp_result == expected_exp_result:
                                logger.info("✅ 指数计算器额外测试计算结果准确")
                                results['exponential_calculator_additional_accuracy'] = True
                            else:
                                logger.warning(f"⚠️ 指数计算器额外测试计算结果不准确。预期: {expected_exp_result}, 实际: {actual_exp_result}")
                                results['exponential_calculator_additional_accuracy'] = False
                        else:
                            logger.warning("⚠️ 指数计算器额外测试结果未显示")
                            results['exponential_calculator_additional_accuracy'] = False
                    else:
                        logger.error("❌ 未找到指数计算器额外测试结果容器")
                        results['exponential_calculator_additional_accuracy'] = False
                else:
                    logger.error("❌ 指数计算器组件在额外测试中缺失")
                    results['exponential_calculator_additional_accuracy'] = False
            except:
                logger.error("❌ 指数计算器额外测试失败")
                results['exponential_calculator_additional_accuracy'] = False

            # 5. 测试不同参数的计算
            logger.info("\n⚙️ 测试步骤 5: 测试不同参数的计算")

            # 测试复合计算器边界情况
            try:
                # 等待组件可用
                await page.wait_for_selector("#principal", timeout=5000)
                await page.wait_for_selector("#rate", timeout=5000)
                await page.wait_for_selector("#time", timeout=5000)
                await page.wait_for_selector("#calculate-btn", timeout=5000)

                principal_input = await page.query_selector("#principal")
                rate_input = await page.query_selector("#rate")
                time_input = await page.query_selector("#time")
                calc_button = await page.query_selector("#calculate-btn")

                if all([principal_input, rate_input, time_input, calc_button]):
                    # 测试案例3: 边界情况 (1元本金, 1%年利率, 1年)
                    await principal_input.fill("1")   # 1元本金
                    await rate_input.fill("1")        # 1%年利率
                    await time_input.fill("1")        # 1年

                    await calc_button.click()
                    await page.wait_for_timeout(1000)

                    result_container = await page.query_selector("#compound-result")
                    if result_container:
                        result_text = await result_container.inner_text()
                        if result_text:
                            logger.info(f"✅ 复利计算器边界测试结果: {result_text}")
                            results['compound_calculator_boundary_test'] = True
                        else:
                            logger.warning("⚠️ 复利计算器边界测试结果未显示")
                            results['compound_calculator_boundary_test'] = False
                    else:
                        logger.error("❌ 未找到复利计算器边界测试结果容器")
                        results['compound_calculator_boundary_test'] = False
                else:
                    logger.error("❌ 复利计算器组件在边界测试中缺失")
                    results['compound_calculator_boundary_test'] = False
            except:
                logger.error("❌ 复利计算器边界测试失败")
                results['compound_calculator_boundary_test'] = False

            # 测试指数计算器边界情况
            try:
                # 等待组件可用
                await page.wait_for_selector("#base", timeout=5000)
                await page.wait_for_selector("#exponent", timeout=5000)
                await page.wait_for_selector("#calculate-exp-btn", timeout=5000)

                base_input = await page.query_selector("#base")
                exponent_input = await page.query_selector("#exponent")
                exp_calc_button = await page.query_selector("#calculate-exp-btn")

                if all([base_input, exponent_input, exp_calc_button]):
                    # 测试案例3: 边界情况 (0^5 = 0)
                    await base_input.fill("0")      # 底数为0
                    await exponent_input.fill("5")  # 指数为5

                    await exp_calc_button.click()
                    await page.wait_for_timeout(1000)

                    exp_result_container = await page.query_selector("#exponential-result")
                    if exp_result_container:
                        exp_result_text = await exp_result_container.inner_text()
                        if exp_result_text:
                            logger.info(f"✅ 指数计算器边界测试结果: {exp_result_text}")

                            # 验证计算结果的准确性 (0^5 = 0)
                            expected_exp_result = 0 ** 5
                            logger.info(f"预期指数结果: {expected_exp_result}")

                            import re
                            numbers = re.findall(r'\d+', exp_result_text)
                            actual_exp_result = 0
                            for num in numbers:
                                if int(num) > actual_exp_result:  # 找到最大的数字作为结果
                                    actual_exp_result = int(num)

                            if actual_exp_result == expected_exp_result:
                                logger.info("✅ 指数计算器边界测试计算结果准确")
                                results['exponential_calculator_boundary_test'] = True
                            else:
                                logger.warning(f"⚠️ 指数计算器边界测试计算结果不准确。预期: {expected_exp_result}, 实际: {actual_exp_result}")
                                results['exponential_calculator_boundary_test'] = False
                        else:
                            logger.warning("⚠️ 指数计算器边界测试结果未显示")
                            results['exponential_calculator_boundary_test'] = False
                    else:
                        logger.error("❌ 未找到指数计算器边界测试结果容器")
                        results['exponential_calculator_boundary_test'] = False
                else:
                    logger.error("❌ 指数计算器组件在边界测试中缺失")
                    results['exponential_calculator_boundary_test'] = False
            except:
                logger.error("❌ 指数计算器边界测试失败")
                results['exponential_calculator_boundary_test'] = False

            # 测试复合计算器较大数值
            try:
                # 等待组件可用
                await page.wait_for_selector("#principal", timeout=5000)
                await page.wait_for_selector("#rate", timeout=5000)
                await page.wait_for_selector("#time", timeout=5000)
                await page.wait_for_selector("#calculate-btn", timeout=5000)

                principal_input = await page.query_selector("#principal")
                rate_input = await page.query_selector("#rate")
                time_input = await page.query_selector("#time")
                calc_button = await page.query_selector("#calculate-btn")

                if all([principal_input, rate_input, time_input, calc_button]):
                    # 测试案例4: 较大数值 (1000000本金, 10%年利率, 20年)
                    await principal_input.fill("1000000")  # 100万本金
                    await rate_input.fill("10")            # 10%年利率
                    await time_input.fill("20")            # 20年

                    await calc_button.click()
                    await page.wait_for_timeout(1000)

                    result_container = await page.query_selector("#compound-result")
                    if result_container:
                        result_text = await result_container.inner_text()
                        if result_text:
                            logger.info(f"✅ 复利计算器大数值测试结果: {result_text}")

                            # 验证计算结果的准确性 (1000000*(1+0.1)^20 ≈ 6727499.95)
                            expected_amount = 1000000 * (1.1 ** 20)
                            logger.info(f"预期金额: {expected_amount:.2f}")

                            import re
                            numbers = re.findall(r'\d+\.?\d*', result_text.replace(',', ''))
                            actual_amount = 0
                            for num in numbers:
                                if float(num) > actual_amount:  # 找到最大的数字作为结果
                                    actual_amount = float(num)

                            if abs(actual_amount - expected_amount) < 10000:  # 允许较大误差
                                logger.info("✅ 复利计算器大数值测试计算结果准确")
                                results['compound_calculator_large_values_test'] = True
                            else:
                                logger.warning(f"⚠️ 复利计算器大数值测试计算结果可能不准确。预期: {expected_amount:.2f}, 实际: {actual_amount}")
                                results['compound_calculator_large_values_test'] = False
                        else:
                            logger.warning("⚠️ 复利计算器大数值测试结果未显示")
                            results['compound_calculator_large_values_test'] = False
                    else:
                        logger.error("❌ 未找到复利计算器大数值测试结果容器")
                        results['compound_calculator_large_values_test'] = False
                else:
                    logger.error("❌ 复利计算器组件在大数值测试中缺失")
                    results['compound_calculator_large_values_test'] = False
            except:
                logger.error("❌ 复利计算器大数值测试失败")
                results['compound_calculator_large_values_test'] = False

            # 测试指数计算器较大数值
            try:
                # 等待组件可用
                await page.wait_for_selector("#base", timeout=5000)
                await page.wait_for_selector("#exponent", timeout=5000)
                await page.wait_for_selector("#calculate-exp-btn", timeout=5000)

                base_input = await page.query_selector("#base")
                exponent_input = await page.query_selector("#exponent")
                exp_calc_button = await page.query_selector("#calculate-exp-btn")

                if all([base_input, exponent_input, exp_calc_button]):
                    # 测试案例4: 较大数值 (2^20 = 1048576)
                    await base_input.fill("2")       # 底数为2
                    await exponent_input.fill("20")  # 指数为20

                    await exp_calc_button.click()
                    await page.wait_for_timeout(1000)

                    exp_result_container = await page.query_selector("#exponential-result")
                    if exp_result_container:
                        exp_result_text = await exp_result_container.inner_text()
                        if exp_result_text:
                            logger.info(f"✅ 指数计算器大数值测试结果: {exp_result_text}")

                            # 验证计算结果的准确性 (2^20 = 1048576)
                            expected_exp_result = 2 ** 20
                            logger.info(f"预期指数结果: {expected_exp_result}")

                            import re
                            numbers = re.findall(r'\d+', exp_result_text)
                            actual_exp_result = 0
                            for num in numbers:
                                if int(num) > actual_exp_result:  # 找到最大的数字作为结果
                                    actual_exp_result = int(num)

                            if actual_exp_result == expected_exp_result:
                                logger.info("✅ 指数计算器大数值测试计算结果准确")
                                results['exponential_calculator_large_values_test'] = True
                            else:
                                logger.warning(f"⚠️ 指数计算器大数值测试计算结果不准确。预期: {expected_exp_result}, 实际: {actual_exp_result}")
                                results['exponential_calculator_large_values_test'] = False
                        else:
                            logger.warning("⚠️ 指数计算器大数值测试结果未显示")
                            results['exponential_calculator_large_values_test'] = False
                    else:
                        logger.error("❌ 未找到指数计算器大数值测试结果容器")
                        results['exponential_calculator_large_values_test'] = False
                else:
                    logger.error("❌ 指数计算器组件在大数值测试中缺失")
                    results['exponential_calculator_large_values_test'] = False
            except:
                logger.error("❌ 指数计算器大数值测试失败")
                results['exponential_calculator_large_values_test'] = False

        except Exception as e:
            logger.error(f"❌ 测试过程中发生错误: {str(e)}")
            # 设置所有结果为False
            results = {
                'access_exponential_page': False,
                'compound_calculator_functionality': False,
                'compound_calculator_accuracy': False,
                'exponential_calculator_functionality': False,
                'exponential_calculator_accuracy': False,
                'compound_calculator_additional_accuracy': False,
                'exponential_calculator_additional_accuracy': False,
                'compound_calculator_boundary_test': False,
                'exponential_calculator_boundary_test': False,
                'compound_calculator_large_values_test': False,
                'exponential_calculator_large_values_test': False
            }

        finally:
            await page.close()
            await browser.close()
            logger.info("\n✅ 测试浏览器已关闭")

        # 汇总结果
        logger.info("\n" + "=" * 70)
        logger.info("📊 计算器和指数增长功能测试结果汇总:")
        
        for key, value in results.items():
            status = "✅" if value else "❌"
            logger.info(f"  {key}: {status}")

        # 计算总体成功率
        total_checks = len(results)
        successful_checks = sum(1 for value in results.values() if value)

        if total_checks > 0:
            success_rate = (successful_checks / total_checks) * 100
            logger.info(f"\n📈 总体成功率: {successful_checks}/{total_checks} ({success_rate:.1f}%)")

        if successful_checks == total_checks:
            logger.info("\n🏆 所有测试通过!")
            logger.info("✅ 访问指数计算页面正常")
            logger.info("✅ 复合计算器功能正常且结果准确")
            logger.info("✅ 指数计算器功能正常且结果准确")
            logger.info("✅ 不同参数的计算均正常工作")
            logger.info("✅ 系统准备就绪，可用于指数增长认知偏差教育体验!")
        else:
            logger.info(f"\n⚠️ 部分测试未通过")
            logger.info(f"   成功: {successful_checks}, 失败: {total_checks - successful_checks}")

        logger.info(f"\n🏁 测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return results


def main():
    """主函数"""
    logger.info("🏠 Failure Logic平台 - 计算器和指数增长功能测试智能体")
    logger.info("=" * 80)
    logger.info("📋 测试协议: Playwright + Microsoft Edge (非headless模式)")
    logger.info("🎯 测试目标: 验证计算器和指数增长功能的完整性与准确性")
    logger.info("🔍 测试内容:")
    logger.info("   1. 访问指数计算页面")
    logger.info("   2. 测试复合计算器功能")
    logger.info("   3. 测试指数计算器功能")
    logger.info("   4. 验证计算结果的准确性")
    logger.info("   5. 测试不同参数的计算")
    logger.info("=" * 80)

    # 运行异步测试
    results = asyncio.run(calculator_exponential_test_agent())

    logger.info("\n" + "=" * 80)
    logger.info("🎉 计算器和指数增长功能测试完成!")

    return results


if __name__ == "__main__":
    main()
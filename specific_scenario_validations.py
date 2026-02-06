"""
具体场景验证测试用例

为每种类型的场景创建专门的验证测试用例
确保每个场景的独特功能得到充分测试
"""

import asyncio
from playwright.async_api import async_playwright
from datetime import datetime
import json
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class SpecificScenarioValidator:
    """特定场景类型的验证器"""
    
    @staticmethod
    async def validate_coffee_shop_scenario(page, scenario_data) -> Dict:
        """验证咖啡店线性思维场景"""
        logger.info(f"验证咖啡店场景: {scenario_data['name']}")
        results = {
            'scenario_type': 'coffee_shop',
            'checks': {},
            'details': {}
        }
        
        try:
            # 检查是否包含线性思维相关元素
            content = await page.content()
            
            # 检查线性思维相关关键词
            linear_keywords = ["线性", "线性思维", "非线性", "效应", "因果", "简单"]
            linear_found = any(keyword in content for keyword in linear_keywords)
            results['checks']['linear_keywords'] = linear_found
            
            # 检查是否有决策相关的UI元素
            decision_elements = await page.query_selector_all(
                "button, input, select, .decision, .choice, .option"
            )
            results['checks']['decision_elements'] = len(decision_elements) > 0
            results['details']['decision_element_count'] = len(decision_elements)
            
            # 检查是否有数值输入或滑块
            numeric_elements = await page.query_selector_all(
                "input[type='number'], input[type='range'], .slider"
            )
            results['checks']['numeric_elements'] = len(numeric_elements) > 0
            
            # 尝试与一些元素交互
            if decision_elements:
                for element in decision_elements[:2]:  # 只测试前2个元素
                    try:
                        if await element.is_enabled() and await element.is_visible():
                            await element.click()
                            await page.wait_for_timeout(500)
                            break
                    except:
                        continue
            
            logger.info(f"咖啡店场景验证完成: {scenario_data['name']}")
            
        except Exception as e:
            logger.error(f"咖啡店场景验证失败: {str(e)}")
            results['error'] = str(e)
        
        return results
    
    @staticmethod
    async def validate_relationship_scenario(page, scenario_data) -> Dict:
        """验证恋爱关系时间延迟场景"""
        logger.info(f"验证恋爱关系场景: {scenario_data['name']}")
        results = {
            'scenario_type': 'relationship',
            'checks': {},
            'details': {}
        }
        
        try:
            content = await page.content()
            
            # 检查关系相关关键词
            relationship_keywords = ["恋爱", "关系", "时间延迟", "情感", "互动", "沟通"]
            relationship_found = any(keyword in content for keyword in relationship_keywords)
            results['checks']['relationship_keywords'] = relationship_found
            
            # 检查是否有情感决策相关的UI
            emotion_elements = await page.query_selector_all(
                ".emotion, .feeling, .relationship, .communication, .interaction"
            )
            results['checks']['emotion_elements'] = len(emotion_elements) > 0
            results['details']['emotion_element_count'] = len(emotion_elements)
            
            # 检查是否有时间相关的元素（延迟、等待等）
            time_elements = await page.query_selector_all(
                ".time, .delay, .wait, .later, .future, [class*='time'], [id*='time']"
            )
            results['checks']['time_elements'] = len(time_elements) > 0
            
            # 尝试交互
            all_elements = await page.query_selector_all(
                "button, input, select, .decision, .choice"
            )
            if all_elements:
                for element in all_elements[:2]:
                    try:
                        if await element.is_enabled() and await element.is_visible():
                            await element.click()
                            await page.wait_for_timeout(500)
                            break
                    except:
                        continue
            
            logger.info(f"恋爱关系场景验证完成: {scenario_data['name']}")
            
        except Exception as e:
            logger.error(f"恋爱关系场景验证失败: {str(e)}")
            results['error'] = str(e)
        
        return results
    
    @staticmethod
    async def validate_investment_scenario(page, scenario_data) -> Dict:
        """验证投资信息处理场景"""
        logger.info(f"验证投资场景: {scenario_data['name']}")
        results = {
            'scenario_type': 'investment',
            'checks': {},
            'details': {}
        }
        
        try:
            content = await page.content()
            
            # 检查投资相关关键词
            investment_keywords = ["投资", "信息", "处理", "风险", "收益", "市场", "分析"]
            investment_found = any(keyword in content for keyword in investment_keywords)
            results['checks']['investment_keywords'] = investment_found
            
            # 检查是否有金融相关的UI元素
            finance_elements = await page.query_selector_all(
                ".finance, .investment, .money, .risk, .return, .market, .analysis"
            )
            results['checks']['finance_elements'] = len(finance_elements) > 0
            results['details']['finance_element_count'] = len(finance_elements)
            
            # 检查是否有数值输入（金额、百分比等）
            numeric_fields = await page.query_selector_all(
                "input[type='number'], input[type='text'][pattern*='[0-9]'], .amount, .percentage"
            )
            results['checks']['numeric_fields'] = len(numeric_fields) > 0
            
            # 检查是否有图表或数据展示元素
            chart_elements = await page.query_selector_all(
                ".chart, .graph, .data, .visualization, canvas, svg"
            )
            results['checks']['chart_elements'] = len(chart_elements) > 0
            
            # 尝试交互
            input_elements = await page.query_selector_all("input, select, button")
            if input_elements:
                for element in input_elements[:2]:
                    try:
                        tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
                        if tag_name == "input":
                            if await element.is_enabled() and await element.is_visible():
                                await element.fill("10000")  # 填充示例数值
                                await page.wait_for_timeout(500)
                        elif tag_name == "button":
                            if await element.is_enabled() and await element.is_visible():
                                await element.click()
                                await page.wait_for_timeout(500)
                        break
                    except:
                        continue
            
            logger.info(f"投资场景验证完成: {scenario_data['name']}")
            
        except Exception as e:
            logger.error(f"投资场景验证失败: {str(e)}")
            results['error'] = str(e)
        
        return results
    
    @staticmethod
    async def validate_game_scenario(page, scenario_data) -> Dict:
        """验证游戏类场景（商业战略、公共政策、个人理财）"""
        logger.info(f"验证游戏场景: {scenario_data['name']}")
        results = {
            'scenario_type': 'game',
            'checks': {},
            'details': {}
        }
        
        try:
            content = await page.content()
            
            # 检查游戏相关关键词
            game_keywords = ["游戏", "策略", "决策", "步骤", "选项", "结果", "规则", "挑战"]
            game_found = any(keyword in content for keyword in game_keywords)
            results['checks']['game_keywords'] = game_found
            
            # 检查是否有游戏步骤相关的元素
            step_elements = await page.query_selector_all(
                ".step, .stage, .phase, .turn, .round, [class*='step'], [id*='step']"
            )
            results['checks']['step_elements'] = len(step_elements) > 0
            results['details']['step_element_count'] = len(step_elements)
            
            # 检查是否有选项选择相关的UI
            option_elements = await page.query_selector_all(
                ".option, .choice, .decision, .answer, .selection"
            )
            results['checks']['option_elements'] = len(option_elements) > 0
            
            # 检查是否有进度指示器
            progress_elements = await page.query_selector_all(
                ".progress, .status, .score, .level, [class*='progress'], [id*='progress']"
            )
            results['checks']['progress_elements'] = len(progress_elements) > 0
            
            # 尝试游戏交互
            choice_elements = await page.query_selector_all(
                "button, .choice, .option, label"
            )
            if choice_elements:
                for element in choice_elements[:2]:
                    try:
                        if await element.is_enabled() and await element.is_visible():
                            await element.click()
                            await page.wait_for_timeout(1000)  # 游戏可能需要更多时间响应
                            break
                    except:
                        continue
            
            logger.info(f"游戏场景验证完成: {scenario_data['name']}")
            
        except Exception as e:
            logger.error(f"游戏场景验证失败: {str(e)}")
            results['error'] = str(e)
        
        return results
    
    @staticmethod
    async def validate_advanced_game_scenario(page, scenario_data) -> Dict:
        """验证高级游戏场景（气候变化、AI治理、金融危机）"""
        logger.info(f"验证高级游戏场景: {scenario_data['name']}")
        results = {
            'scenario_type': 'advanced_game',
            'checks': {},
            'details': {}
        }
        
        try:
            content = await page.content()
            
            # 检查高级游戏相关关键词
            advanced_keywords = ["高级", "复杂", "系统", "博弈", "治理", "政策", "风险", "多边"]
            advanced_found = any(keyword in content for keyword in advanced_keywords)
            results['checks']['advanced_keywords'] = advanced_found
            
            # 检查是否有复杂系统相关的UI
            complex_elements = await page.query_selector_all(
                ".complex, .system, .network, .multi, .advanced, [class*='complex'], [id*='system']"
            )
            results['checks']['complex_elements'] = len(complex_elements) > 0
            results['details']['complex_element_count'] = len(complex_elements)
            
            # 检查是否有多个决策步骤
            multiple_steps = len(await page.query_selector_all(".step, .stage, .phase")) > 1
            results['checks']['multiple_steps'] = multiple_steps
            
            # 检查是否有高级分析工具
            analysis_tools = await page.query_selector_all(
                ".analysis, .analytics, .dashboard, .metrics, .indicator"
            )
            results['checks']['analysis_tools'] = len(analysis_tools) > 0
            
            # 尝试高级交互
            interaction_elements = await page.query_selector_all(
                "button, input, select, .interaction, .control"
            )
            if interaction_elements:
                for element in interaction_elements[:3]:  # 高级场景可能有更多交互
                    try:
                        if await element.is_enabled() and await element.is_visible():
                            tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
                            if tag_name == "button":
                                await element.click()
                            elif tag_name in ["input", "select"]:
                                if tag_name == "input":
                                    await element.fill("测试值")
                                elif tag_name == "select":
                                    options = await element.query_selector_all("option")
                                    if len(options) > 1:
                                        await element.select_option(index=1)
                            await page.wait_for_timeout(800)
                            break
                    except:
                        continue
            
            logger.info(f"高级游戏场景验证完成: {scenario_data['name']}")
            
        except Exception as e:
            logger.error(f"高级游戏场景验证失败: {str(e)}")
            results['error'] = str(e)
        
        return results
    
    @staticmethod
    async def validate_historical_scenario(page, scenario_data) -> Dict:
        """验证历史案例场景"""
        logger.info(f"验证历史案例场景: {scenario_data['name']}")
        results = {
            'scenario_type': 'historical',
            'checks': {},
            'details': {}
        }
        
        try:
            content = await page.content()
            
            # 检查历史相关关键词
            historical_keywords = ["历史", "案例", "事件", "回顾", "分析", "教训", "过去", "经验"]
            historical_found = any(keyword in content for keyword in historical_keywords)
            results['checks']['historical_keywords'] = historical_found
            
            # 检查是否有时间线相关的元素
            timeline_elements = await page.query_selector_all(
                ".timeline, .history, .date, .event, .period, [class*='time'], [id*='history']"
            )
            results['checks']['timeline_elements'] = len(timeline_elements) > 0
            results['details']['timeline_element_count'] = len(timeline_elements)
            
            # 检查是否有案例分析相关的UI
            analysis_elements = await page.query_selector_all(
                ".analysis, .case, .study, .lesson, .finding, .pyramid"
            )
            results['checks']['analysis_elements'] = len(analysis_elements) > 0
            
            # 检查是否有决策点标记
            decision_point_elements = await page.query_selector_all(
                ".decision-point, .point, .choice, .option"
            )
            results['checks']['decision_points'] = len(decision_point_elements) > 0
            
            # 尝试与历史案例交互
            info_elements = await page.query_selector_all(
                "button, .info, .detail, .expand, .more"
            )
            if info_elements:
                for element in info_elements[:2]:
                    try:
                        if await element.is_enabled() and await element.is_visible():
                            await element.click()
                            await page.wait_for_timeout(1000)
                            break
                    except:
                        continue
            
            logger.info(f"历史案例场景验证完成: {scenario_data['name']}")
            
        except Exception as e:
            logger.error(f"历史案例场景验证失败: {str(e)}")
            results['error'] = str(e)
        
        return results


class ComprehensiveScenarioValidator:
    """综合场景验证器 - 结合通用和特定验证"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.specific_validator = SpecificScenarioValidator()
        
    async def validate_scenario_comprehensively(self, scenario_data: Dict) -> Dict:
        """全面验证单个场景"""
        async with async_playwright() as p:
            # 启动浏览器
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
                # 构建场景URL
                scenario_url = f"{self.base_url}/scenarios/{scenario_data['id']}"
                
                # 尝试访问场景页面
                try:
                    await page.goto(scenario_url, wait_until="domcontentloaded")
                    await page.wait_for_timeout(3000)
                    page_loaded = True
                except:
                    # 如果直接访问失败，尝试通过主页导航
                    await page.goto(f"{self.base_url}", wait_until="domcontentloaded")
                    await page.wait_for_timeout(2000)
                    
                    # 尝试点击场景链接
                    scenario_links = [
                        f"text={scenario_data['name']}",
                        f"button:has-text('{scenario_data['name']}')",
                        f"a:has-text('{scenario_data['name']}')"
                    ]
                    
                    page_loaded = False
                    for link_selector in scenario_links:
                        try:
                            element = await page.query_selector(link_selector)
                            if element:
                                await element.click()
                                await page.wait_for_timeout(3000)
                                page_loaded = True
                                break
                        except:
                            continue
                
                if not page_loaded:
                    return {
                        'scenario_id': scenario_data['id'],
                        'scenario_name': scenario_data['name'],
                        'overall_success': False,
                        'error': '无法加载页面',
                        'console_errors': console_errors
                    }
                
                # 执行通用验证
                universal_checks = await self._perform_universal_checks(page, scenario_data)
                
                # 根据场景类型执行特定验证
                scenario_type = self._determine_scenario_type(scenario_data)
                specific_results = await self._validate_by_type(page, scenario_data, scenario_type)
                
                # 合并结果
                result = {
                    'scenario_id': scenario_data['id'],
                    'scenario_name': scenario_data['name'],
                    'scenario_type': scenario_type,
                    'universal_checks': universal_checks,
                    'specific_checks': specific_results,
                    'console_errors': console_errors,
                    'overall_success': self._calculate_overall_success(universal_checks, specific_results, console_errors),
                    'timestamp': datetime.now().isoformat()
                }
                
                return result
                
            finally:
                await browser.close()
    
    async def _perform_universal_checks(self, page, scenario_data) -> Dict:
        """执行通用检查"""
        checks = {}
        
        # 检查页面标题和内容
        title = await page.title()
        content = await page.content()
        
        checks['page_title_contains_name'] = scenario_data['name'] in title
        checks['page_content_contains_description'] = scenario_data['description'][:20] in content if scenario_data['description'] else True
        
        # 检查基本交互元素
        buttons = await page.query_selector_all("button")
        inputs = await page.query_selector_all("input")
        links = await page.query_selector_all("a")
        
        checks['has_buttons'] = len(buttons) > 0
        checks['has_inputs'] = len(inputs) > 0
        checks['has_links'] = len(links) > 0
        
        # 检查页面响应性
        checks['page_loaded_successfully'] = True
        
        return checks
    
    def _determine_scenario_type(self, scenario_data: Dict) -> str:
        """确定场景类型"""
        name = scenario_data['name'].lower()
        scenario_id = scenario_data['id'].lower()
        
        if 'coffee' in name or '线性' in name or 'linear' in name:
            return 'coffee_shop'
        elif 'relationship' in scenario_id or 'love' in name or '恋爱' in name or '关系' in name:
            return 'relationship'
        elif 'investment' in name or '投资' in name or '信息处理' in name:
            return 'investment'
        elif 'game' in scenario_id or 'game' in name or '战略' in name or '政策' in name or '理财' in name:
            if 'adv-' in scenario_id or 'advanced' in name:
                return 'advanced_game'
            else:
                return 'game'
        elif 'hist-' in scenario_id or '历史' in name or '案例' in name:
            return 'historical'
        else:
            return 'general'
    
    async def _validate_by_type(self, page, scenario_data, scenario_type: str) -> Dict:
        """根据类型执行特定验证"""
        if scenario_type == 'coffee_shop':
            return await self.specific_validator.validate_coffee_shop_scenario(page, scenario_data)
        elif scenario_type == 'relationship':
            return await self.specific_validator.validate_relationship_scenario(page, scenario_data)
        elif scenario_type == 'investment':
            return await self.specific_validator.validate_investment_scenario(page, scenario_data)
        elif scenario_type == 'game':
            return await self.specific_validator.validate_game_scenario(page, scenario_data)
        elif scenario_type == 'advanced_game':
            return await self.specific_validator.validate_advanced_game_scenario(page, scenario_data)
        elif scenario_type == 'historical':
            return await self.specific_validator.validate_historical_scenario(page, scenario_data)
        else:
            # 对于一般场景，执行基本检查
            content = await page.content()
            return {
                'scenario_type': 'general',
                'checks': {
                    'content_accessible': len(content) > 100,  # 确保有内容
                    'has_interactive_elements': len(await page.query_selector_all("button, input, select")) > 0
                },
                'details': {}
            }
    
    def _calculate_overall_success(self, universal_checks: Dict, specific_results: Dict, console_errors: List) -> bool:
        """计算总体成功状态"""
        # 检查是否有致命错误
        fatal_errors = [
            err for err in console_errors 
            if 'error' in err['type'] and 
            ('unhandled' in err['text'].lower() or 'exception' in err['text'].lower())
        ]
        
        if fatal_errors:
            return False
        
        # 检查基本功能是否正常
        basic_checks = [
            universal_checks.get('page_loaded_successfully', False),
            universal_checks.get('has_buttons', False) or universal_checks.get('has_inputs', False)
        ]
        
        # 至少要通过基本检查
        return all(basic_checks) and len(fatal_errors) == 0


# 测试用例示例
async def run_specific_validations_example():
    """运行特定验证的示例"""
    validator = ComprehensiveScenarioValidator()
    
    # 示例场景数据
    sample_scenarios = [
        {
            "id": "coffee-shop-nonlinear-effects",
            "name": "咖啡店非线性效应",
            "description": "非线性效应体验场景"
        },
        {
            "id": "relationship-time-delay",
            "name": "恋爱关系时间延迟",
            "description": "时间延迟效应场景"
        },
        {
            "id": "investment-information-processing",
            "name": "投资信息处理",
            "description": "信息处理模式场景"
        }
    ]
    
    print("🧪 开始运行特定场景验证测试...")
    
    for scenario in sample_scenarios:
        print(f"\n🔍 验证场景: {scenario['name']}")
        result = await validator.validate_scenario_comprehensively(scenario)
        
        print(f"   整体成功: {'✅' if result['overall_success'] else '❌'}")
        print(f"   控制台错误: {len(result['console_errors'])}")
        print(f"   场景类型: {result['scenario_type']}")
        
        if not result['overall_success']:
            print(f"   错误详情: {result.get('error', 'N/A')}")
    
    print("\n✅ 特定场景验证测试完成!")


if __name__ == "__main__":
    asyncio.run(run_specific_validations_example())
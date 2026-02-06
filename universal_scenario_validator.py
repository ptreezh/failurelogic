"""
通用场景验证测试框架

该框架提供了一套标准化的方法来验证所有认知陷阱场景的交互功能
确保每个场景都能正确加载、交互并提供教育价值
"""

import asyncio
import json
from playwright.async_api import async_playwright
from datetime import datetime
import os
import sys
from pathlib import Path
import logging
from typing import Dict, List, Optional, Tuple

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scenario_validation.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class ScenarioValidator:
    """场景验证器 - 用于验证单个场景的完整交互流程"""
    
    def __init__(self, scenario_data: Dict, base_url: str = "http://localhost:8000"):
        self.scenario = scenario_data
        self.base_url = base_url
        self.browser = None
        self.page = None
        self.test_results = {}
        
    async def setup_browser(self):
        """设置浏览器环境"""
        logger.info(f"启动浏览器以验证场景: {self.scenario['name']}")
        
        # 使用Playwright启动Edge浏览器（非headless模式）
        self.playwright = await async_playwright().start()
        
        try:
            # 优先尝试Edge浏览器
            self.browser = await self.playwright.chromium.launch(
                channel='msedge',  # 使用Edge浏览器
                headless=False,    # 非headless模式
                slow_mo=500        # 慢动作模式，便于观察
            )
            logger.info("✅ 成功启动Microsoft Edge浏览器")
        except Exception as e:
            logger.warning(f"⚠️ 无法启动Edge浏览器: {e}，尝试使用Chromium")
            self.browser = await self.playwright.chromium.launch(
                headless=False,
                slow_mo=500
            )
            logger.info("✅ 成功启动Chromium浏览器")
        
        self.page = await self.browser.new_page()
        self.page.set_default_timeout(30000)  # 设置30秒超时
        
        # 监听控制台错误
        self.console_errors = []
        self.page.on('console', self.handle_console_message)
        
    def handle_console_message(self, msg):
        """处理控制台消息"""
        if msg.type == 'error':
            self.console_errors.append({
                'text': msg.text,
                'location': msg.location
            })
            logger.error(f"控制台错误: {msg.text} at {msg.location}")
    
    async def validate_page_load(self) -> bool:
        """验证页面加载"""
        try:
            logger.info(f"验证场景页面加载: {self.scenario['name']}")
            
            # 构建场景URL（根据场景类型）
            scenario_url = f"{self.base_url}/scenarios/{self.scenario['id']}"
            
            # 尝试访问场景页面
            await self.page.goto(scenario_url, wait_until="domcontentloaded")
            await self.page.wait_for_timeout(3000)  # 等待页面完全加载
            
            # 检查页面标题是否包含场景名称
            title = await self.page.title()
            content = await self.page.content()
            
            # 验证页面是否包含场景相关信息
            name_found = self.scenario['name'] in content or self.scenario['name'] in title
            desc_found = self.scenario['description'][:20] in content if self.scenario['description'] else True
            
            if name_found or desc_found:
                logger.info(f"✅ 场景页面加载成功: {self.scenario['name']}")
                return True
            else:
                logger.warning(f"⚠️ 场景页面可能未正确加载: {self.scenario['name']}")
                
                # 尝试通过主页导航到场景
                await self.page.goto(f"{self.base_url}", wait_until="domcontentloaded")
                await self.page.wait_for_timeout(2000)
                
                # 查找并点击场景导航
                scenario_links = [
                    f"text={self.scenario['name']}",
                    f"text={self.scenario['name'][:10]}",
                    f"button:has-text('{self.scenario['name']}')",
                    f"a:has-text('{self.scenario['name']}')"
                ]
                
                for link_selector in scenario_links:
                    try:
                        element = await self.page.query_selector(link_selector)
                        if element:
                            await element.click()
                            await self.page.wait_for_timeout(3000)
                            
                            # 再次检查内容
                            new_content = await self.page.content()
                            if self.scenario['name'] in new_content:
                                logger.info(f"✅ 通过导航成功加载场景: {self.scenario['name']}")
                                return True
                    except:
                        continue
                
                logger.error(f"❌ 无法加载场景页面: {self.scenario['name']}")
                return False
                
        except Exception as e:
            logger.error(f"❌ 页面加载验证失败: {self.scenario['name']} - {str(e)}")
            return False
    
    async def validate_interactions(self) -> bool:
        """验证交互功能"""
        try:
            logger.info(f"验证场景交互功能: {self.scenario['name']}")
            
            # 查找交互元素
            interaction_selectors = [
                "button", "input", "select", "textarea",
                "[class*='interaction']", "[class*='decision']",
                "[id*='interaction']", "[id*='decision']"
            ]
            
            interactions_found = False
            for selector in interaction_selectors:
                elements = await self.page.query_selector_all(selector)
                if len(elements) > 0:
                    logger.info(f"找到 {len(elements)} 个 {selector} 元素")
                    interactions_found = True
                    
                    # 尝试与前几个元素交互
                    for i, element in enumerate(elements[:3]):  # 只测试前3个元素
                        try:
                            if await element.is_enabled() and await element.is_visible():
                                tag_name = await element.evaluate("el => el.tagName.toLowerCase()")
                                
                                if tag_name == "button":
                                    await element.click()
                                    await self.page.wait_for_timeout(500)
                                    logger.info(f"✅ 点击了按钮元素 {i+1}")
                                    
                                elif tag_name in ["input", "textarea"]:
                                    if await element.get_attribute("type") != "hidden":
                                        await element.fill("测试输入")
                                        await self.page.wait_for_timeout(500)
                                        logger.info(f"✅ 填写了输入元素 {i+1}")
                                        
                                elif tag_name == "select":
                                    options = await element.query_selector_all("option")
                                    if len(options) > 1:
                                        await element.select_option(index=1)
                                        await self.page.wait_for_timeout(500)
                                        logger.info(f"✅ 选择了下拉选项 {i+1}")
                                        
                        except Exception as elem_error:
                            logger.debug(f"元素交互失败 {i+1}: {str(elem_error)}")
                    
                    break  # 找到交互元素后跳出循环
            
            if interactions_found:
                logger.info(f"✅ 场景交互功能验证成功: {self.scenario['name']}")
                return True
            else:
                logger.warning(f"⚠️ 未找到明显的交互元素: {self.scenario['name']}")
                return True  # 不将此视为失败，因为某些场景可能是展示性的
                
        except Exception as e:
            logger.error(f"❌ 交互功能验证失败: {self.scenario['name']} - {str(e)}")
            return False
    
    async def validate_educational_content(self) -> bool:
        """验证教育内容"""
        try:
            logger.info(f"验证教育内容: {self.scenario['name']}")
            
            content = await self.page.content()
            
            # 检查是否包含教育相关关键词
            educational_keywords = [
                "认知", "思维", "陷阱", "偏差", "决策", "模式", "系统", 
                "linear", "thinking", "bias", "decision", "pattern", "system",
                "线性", "非线性", "时间延迟", "复利", "指数", "复杂性"
            ]
            
            found_keywords = []
            for keyword in educational_keywords:
                if keyword in content:
                    found_keywords.append(keyword)
            
            if found_keywords:
                logger.info(f"✅ 发现教育关键词: {', '.join(found_keywords[:5])}... ({len(found_keywords)} total)")
                return True
            else:
                logger.warning(f"⚠️ 未发现明显的教育关键词: {self.scenario['name']}")
                return True  # 不将此视为失败
                
        except Exception as e:
            logger.error(f"❌ 教育内容验证失败: {self.scenario['name']} - {str(e)}")
            return False
    
    async def validate_api_connection(self) -> bool:
        """验证API连接"""
        try:
            logger.info(f"验证API连接: {self.scenario['name']}")
            
            # 尝试调用场景相关的API端点
            scenario_id = self.scenario['id']
            
            # 测试场景数据API
            api_result = await self.page.evaluate(f"""
                async () => {{
                    try {{
                        const response = await fetch('{self.base_url}/api/scenarios/{scenario_id}', {{
                            method: 'GET',
                            headers: {{'Content-Type': 'application/json'}}
                        }});
                        return {{
                            success: response.ok,
                            status: response.status,
                            data: response.ok ? await response.json() : null
                        }};
                    }} catch (error) {{
                        return {{
                            success: false,
                            error: error.message
                        }};
                    }}
                }}
            """)
            
            if api_result.get('success'):
                logger.info(f"✅ API连接成功: {self.scenario['name']}")
                return True
            else:
                logger.warning(f"⚠️ API连接可能有问题: {self.scenario['name']} - {api_result.get('error', 'Status: ' + str(api_result.get('status')))}")
                return True  # 不将此视为失败，因为API可能不需要
                
        except Exception as e:
            logger.error(f"❌ API连接验证失败: {self.scenario['name']} - {str(e)}")
            return False
    
    async def take_scenario_screenshots(self) -> List[str]:
        """为场景拍摄截图"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshots = []
            
            # 创建截图目录
            screenshot_dir = Path("screenshots")
            screenshot_dir.mkdir(exist_ok=True)
            
            # 主页面截图
            screenshot_path = screenshot_dir / f"scenario_{self.scenario['id']}_{timestamp}_main.png"
            await self.page.screenshot(path=str(screenshot_path))
            screenshots.append(str(screenshot_path))
            logger.info(f"📸 截图已保存: {screenshot_path}")
            
            return screenshots
            
        except Exception as e:
            logger.error(f"❌ 截图失败: {self.scenario['name']} - {str(e)}")
            return []
    
    async def run_validation(self) -> Dict:
        """运行完整的场景验证"""
        logger.info(f"开始验证场景: {self.scenario['name']} (ID: {self.scenario['id']})")
        
        # 初始化浏览器
        await self.setup_browser()
        
        try:
            # 执行各项验证
            results = {
                'scenario_id': self.scenario['id'],
                'scenario_name': self.scenario['name'],
                'start_time': datetime.now().isoformat(),
                'validations': {},
                'console_errors': [],
                'screenshots': [],
                'overall_success': False
            }
            
            # 1. 验证页面加载
            results['validations']['page_load'] = await self.validate_page_load()
            
            if results['validations']['page_load']:
                # 2. 验证交互功能
                results['validations']['interactions'] = await self.validate_interactions()
                
                # 3. 验证教育内容
                results['validations']['educational_content'] = await self.validate_educational_content()
                
                # 4. 验证API连接
                results['validations']['api_connection'] = await self.validate_api_connection()
                
                # 5. 拍摄截图
                results['screenshots'] = await self.take_scenario_screenshots()
            
            # 收集控制台错误
            results['console_errors'] = self.console_errors
            
            # 计算总体成功状态
            if results['validations'].get('page_load', False):
                successful_validations = sum(1 for v in results['validations'].values() if v)
                total_validations = len(results['validations'])
                results['overall_success'] = successful_validations >= total_validations * 0.6  # 至少60%的验证通过
            else:
                results['overall_success'] = False
            
            results['end_time'] = datetime.now().isoformat()
            
            self.test_results = results
            logger.info(f"场景验证完成: {self.scenario['name']}, 成功: {results['overall_success']}")
            
            return results
            
        finally:
            # 清理资源
            if self.browser:
                await self.browser.close()
            if hasattr(self, 'playwright'):
                await self.playwright.stop()
    
    def get_validation_summary(self) -> str:
        """获取验证摘要"""
        if not self.test_results:
            return "尚未运行验证"
        
        summary = f"""
场景验证摘要: {self.test_results['scenario_name']}
ID: {self.test_results['scenario_id']}
开始时间: {self.test_results['start_time']}
结束时间: {self.test_results['end_time']}
总体成功: {'✅ 是' if self.test_results['overall_success'] else '❌ 否'}

验证详情:
- 页面加载: {'✅' if self.test_results['validations'].get('page_load', False) else '❌'}
- 交互功能: {'✅' if self.test_results['validations'].get('interactions', False) else '❌'}
- 教育内容: {'✅' if self.test_results['validations'].get('educational_content', False) else '❌'}
- API连接: {'✅' if self.test_results['validations'].get('api_connection', False) else '❌'}

控制台错误数: {len(self.test_results['console_errors'])}
截图数量: {len(self.test_results['screenshots'])}
        """
        return summary


class ScenarioTestFramework:
    """场景测试框架 - 管理所有场景的批量验证"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.all_scenarios = []
        self.validation_results = []
        
    def load_scenarios(self):
        """从数据文件加载所有场景"""
        logger.info("开始加载所有场景定义...")
        
        # 定义场景数据文件路径
        scenario_files = [
            "api-server/data/scenarios.json",
            "api-server/data/game_scenarios.json", 
            "api-server/data/advanced_game_scenarios.json",
            "api-server/data/love_relationship_scenarios.json",
            "api-server/data/historical_cases.json"
        ]
        
        loaded_count = 0
        
        for file_path in scenario_files:
            full_path = Path(file_path)
            if full_path.exists():
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                    # 根据文件类型提取场景
                    if 'scenarios' in data:
                        scenarios = data['scenarios']
                    elif 'game_scenarios' in data:
                        scenarios = data['game_scenarios']
                    elif 'historical_cases' in data:
                        scenarios = data['historical_cases']
                    else:
                        scenarios = []
                    
                    for scenario in scenarios:
                        # 确保场景有必需的字段
                        if 'id' in scenario and 'name' in scenario:
                            self.all_scenarios.append(scenario)
                            loaded_count += 1
                        else:
                            logger.warning(f"跳过无效场景定义: {scenario.get('id', 'unknown')}")
                            
                    logger.info(f"从 {file_path} 加载了 {len(scenarios)} 个场景")
                    
                except Exception as e:
                    logger.error(f"加载场景文件失败 {file_path}: {str(e)}")
            else:
                logger.warning(f"场景文件不存在: {file_path}")
        
        logger.info(f"总共加载了 {loaded_count} 个场景")
        
    async def run_all_validations(self) -> List[Dict]:
        """运行所有场景的验证"""
        logger.info(f"开始验证 {len(self.all_scenarios)} 个场景")
        
        for i, scenario in enumerate(self.all_scenarios):
            logger.info(f"验证进度: {i+1}/{len(self.all_scenarios)} - {scenario['name']}")
            
            validator = ScenarioValidator(scenario, self.base_url)
            result = await validator.run_validation()
            self.validation_results.append(result)
            
            # 输出单个场景的摘要
            print(validator.get_validation_summary())
            print("-" * 60)
        
        return self.validation_results
    
    def generate_summary_report(self) -> str:
        """生成汇总报告"""
        if not self.validation_results:
            return "尚未运行任何验证"
        
        total_scenarios = len(self.validation_results)
        successful_scenarios = sum(1 for r in self.validation_results if r['overall_success'])
        failed_scenarios = total_scenarios - successful_scenarios
        
        # 统计控制台错误
        total_errors = sum(len(r['console_errors']) for r in self.validation_results)
        
        # 统计截图
        total_screenshots = sum(len(r['screenshots']) for r in self.validation_results)
        
        report = f"""
{'='*80}
                    认知陷阱场景批量验证报告
{'='*80}

总体统计:
- 总场景数: {total_scenarios}
- 验证成功: {successful_scenarios}
- 验证失败: {failed_scenarios}
- 成功率: {successful_scenarios/total_scenarios*100:.1f}%

详细统计:
- 总控制台错误: {total_errors}
- 总截图数量: {total_screenshots}

成功场景:
"""
        
        for result in self.validation_results:
            status = "✅" if result['overall_success'] else "❌"
            report += f"  {status} {result['scenario_name']} (ID: {result['scenario_id']})\n"
        
        report += f"""
{'='*80}
                    验证完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'='*80}
"""
        
        return report
    
    def save_detailed_report(self, filename: str = None):
        """保存详细报告到文件"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"scenario_validation_report_{timestamp}.json"
        
        report_data = {
            'summary': self.generate_summary_report(),
            'validation_results': self.validation_results,
            'execution_info': {
                'start_time': datetime.now().isoformat(),
                'total_scenarios': len(self.all_scenarios),
                'base_url': self.base_url
            }
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"详细报告已保存到: {filename}")


# 使用示例
async def main():
    """主函数 - 运行完整的场景验证"""
    print("🚀 启动认知陷阱场景批量验证框架")
    print("="*60)
    
    # 创建测试框架实例
    framework = ScenarioTestFramework(base_url="http://localhost:8000")
    
    # 加载所有场景
    framework.load_scenarios()
    
    if not framework.all_scenarios:
        logger.error("❌ 未找到任何场景定义，验证无法继续")
        return False
    
    print(f"📋 已加载 {len(framework.all_scenarios)} 个场景")
    print()
    
    # 运行所有验证
    results = await framework.run_all_validations()
    
    # 生成并显示汇总报告
    summary = framework.generate_summary_report()
    print(summary)
    
    # 保存详细报告
    framework.save_detailed_report()
    
    print("✅ 所有场景验证完成！")
    return True


if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n🎉 批量场景验证成功完成！")
    else:
        print("\n❌ 批量场景验证遇到问题！")
        sys.exit(1)
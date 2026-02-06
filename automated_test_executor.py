"""
自动化测试执行器

该执行器负责协调和运行所有场景的验证测试
提供统一的接口来执行批量测试和管理测试流程
"""

import asyncio
import json
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import logging
import signal
import sys
from concurrent.futures import ThreadPoolExecutor
import threading

from universal_scenario_validator import ScenarioTestFramework
from specific_scenario_validations import ComprehensiveScenarioValidator

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('test_executor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class TestExecutionManager:
    """测试执行管理器 - 管理整个测试执行流程"""
    
    def __init__(self, base_url: str = "http://localhost:8000", max_concurrent: int = 1):
        self.base_url = base_url
        self.max_concurrent = max_concurrent  # 由于浏览器资源限制，通常一次只运行一个测试
        self.executor = ThreadPoolExecutor(max_workers=max_concurrent)
        self.results = []
        self.lock = threading.Lock()
        self.interrupted = False
        
        # 注册信号处理器以优雅地处理中断
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """信号处理器 - 用于优雅地停止测试"""
        logger.info(f"收到信号 {signum}，正在优雅地停止测试...")
        self.interrupted = True
    
    async def load_all_scenarios(self) -> List[Dict]:
        """加载所有场景定义"""
        logger.info("开始加载所有场景定义...")
        
        framework = ScenarioTestFramework(base_url=self.base_url)
        framework.load_scenarios()
        
        logger.info(f"成功加载 {len(framework.all_scenarios)} 个场景")
        return framework.all_scenarios
    
    async def run_single_scenario_validation(self, scenario: Dict) -> Dict:
        """运行单个场景的验证"""
        if self.interrupted:
            logger.info(f"测试已被中断，跳过场景: {scenario['name']}")
            return {
                'scenario_id': scenario['id'],
                'scenario_name': scenario['name'],
                'status': 'interrupted',
                'timestamp': datetime.now().isoformat()
            }
        
        logger.info(f"开始验证场景: {scenario['name']}")
        
        try:
            validator = ComprehensiveScenarioValidator(base_url=self.base_url)
            result = await validator.validate_scenario_comprehensively(scenario)
            
            # 添加执行时间戳
            result['execution_timestamp'] = datetime.now().isoformat()
            
            logger.info(f"场景验证完成: {scenario['name']}, 成功: {result['overall_success']}")
            return result
            
        except Exception as e:
            logger.error(f"验证场景失败: {scenario['name']}, 错误: {str(e)}")
            return {
                'scenario_id': scenario['id'],
                'scenario_name': scenario['name'],
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    async def run_batch_validation(self, scenarios: List[Dict], max_concurrent: int = 1) -> List[Dict]:
        """运行批量验证"""
        logger.info(f"开始批量验证 {len(scenarios)} 个场景")
        
        results = []
        
        # 由于浏览器资源限制，我们一次只运行一个测试
        for i, scenario in enumerate(scenarios):
            if self.interrupted:
                logger.info("测试执行被中断")
                break
                
            logger.info(f"进度: {i+1}/{len(scenarios)} - {scenario['name']}")
            
            # 运行单个场景验证
            result = await self.run_single_scenario_validation(scenario)
            results.append(result)
            
            # 添加间隔以避免资源冲突
            if i < len(scenarios) - 1:  # 不在最后一个场景后等待
                await asyncio.sleep(2)
        
        logger.info(f"批量验证完成，成功: {sum(1 for r in results if r.get('overall_success', False))}/{len(results)}")
        return results
    
    async def run_comprehensive_test_suite(self) -> Dict:
        """运行全面的测试套件"""
        start_time = datetime.now()
        logger.info(f"开始运行全面测试套件 - 时间: {start_time}")
        
        try:
            # 1. 加载所有场景
            all_scenarios = await self.load_all_scenarios()
            
            if not all_scenarios:
                logger.error("未找到任何场景定义")
                return {
                    'status': 'error',
                    'error': 'No scenarios found',
                    'start_time': start_time.isoformat(),
                    'end_time': datetime.now().isoformat()
                }
            
            # 2. 运行批量验证
            validation_results = await self.run_batch_validation(all_scenarios)
            
            # 3. 生成汇总统计
            total_scenarios = len(validation_results)
            successful_scenarios = sum(1 for r in validation_results if r.get('overall_success', False))
            failed_scenarios = total_scenarios - successful_scenarios
            error_scenarios = sum(1 for r in validation_results if r.get('status') == 'error')
            
            # 4. 收集所有控制台错误
            all_console_errors = []
            for result in validation_results:
                if 'console_errors' in result:
                    all_console_errors.extend(result['console_errors'])
            
            end_time = datetime.now()
            
            comprehensive_result = {
                'status': 'completed',
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'duration_seconds': (end_time - start_time).total_seconds(),
                'total_scenarios': total_scenarios,
                'successful_scenarios': successful_scenarios,
                'failed_scenarios': failed_scenarios,
                'error_scenarios': error_scenarios,
                'success_rate': successful_scenarios / total_scenarios if total_scenarios > 0 else 0,
                'validation_results': validation_results,
                'total_console_errors': len(all_console_errors),
                'console_errors': all_console_errors,
                'interrupted': self.interrupted
            }
            
            logger.info(f"测试套件完成 - 成功率: {comprehensive_result['success_rate']*100:.1f}%")
            return comprehensive_result
            
        except Exception as e:
            logger.error(f"测试套件执行失败: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return {
                'status': 'error',
                'error': str(e),
                'traceback': traceback.format_exc(),
                'start_time': start_time.isoformat(),
                'end_time': datetime.now().isoformat()
            }
    
    def save_execution_results(self, results: Dict, filename: str = None):
        """保存执行结果到文件"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"test_execution_results_{timestamp}.json"
        
        # 确保输出目录存在
        output_dir = Path("test_results")
        output_dir.mkdir(exist_ok=True)
        
        filepath = output_dir / filename
        
        # 为了避免JSON序列化问题，移除可能无法序列化的对象
        serializable_results = self._make_serializable(results)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(serializable_results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"执行结果已保存到: {filepath}")
        return str(filepath)
    
    def _make_serializable(self, obj):
        """使对象可序列化"""
        if isinstance(obj, dict):
            return {key: self._make_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif hasattr(obj, '__dict__'):
            return self._make_serializable(obj.__dict__)
        else:
            # 对于无法序列化的对象，转换为字符串
            try:
                json.dumps(obj)
                return obj
            except TypeError:
                return str(obj)


class ParallelTestExecutor:
    """并行测试执行器 - 如果需要更高性能的执行"""
    
    def __init__(self, base_url: str = "http://localhost:8000", max_parallel: int = 1):
        self.base_url = base_url
        self.max_parallel = max_parallel  # 限制并行度以避免资源冲突
    
    async def run_with_semaphore(self, semaphore, scenario):
        """使用信号量限制并发"""
        async with semaphore:
            executor = TestExecutionManager(base_url=self.base_url, max_concurrent=1)
            return await executor.run_single_scenario_validation(scenario)
    
    async def run_parallel_validation(self, scenarios: List[Dict]) -> List[Dict]:
        """运行并行验证（受限并行以避免资源冲突）"""
        # 使用信号量限制并发浏览器实例数量
        semaphore = asyncio.Semaphore(min(self.max_parallel, 3))  # 最多3个并行实例
        
        tasks = [
            self.run_with_semaphore(semaphore, scenario)
            for scenario in scenarios
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理可能的异常
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    'scenario_id': scenarios[i]['id'],
                    'scenario_name': scenarios[i]['name'],
                    'status': 'error',
                    'error': str(result),
                    'timestamp': datetime.now().isoformat()
                })
            else:
                processed_results.append(result)
        
        return processed_results


async def main():
    """主函数 - 执行完整的自动化测试"""
    print("🚀 启动认知陷阱场景自动化测试执行器")
    print("="*70)
    print(f"📋 测试目标: 验证所有认知陷阱场景的完整交互功能")
    print(f"🌐 测试地址: http://localhost:8000")
    print(f"🎯 预期: 所有场景均能在Edge浏览器非headless模式下正常工作")
    print("="*70)
    
    # 询问用户要测试的URL
    import os
    test_url = os.getenv('TEST_URL', 'http://localhost:8000')  # 默认本地，可通过环境变量指定远程
    print(f"🌍 实际测试URL: {test_url}")
    
    # 创建执行管理器
    executor = TestExecutionManager(base_url=test_url)
    
    try:
        # 运行全面测试套件
        print("\n🔍 开始执行全面测试套件...")
        results = await executor.run_comprehensive_test_suite()
        
        # 保存结果
        print("\n💾 保存测试结果...")
        result_file = executor.save_execution_results(results)
        
        # 输出摘要
        print("\n" + "="*70)
        print("📊 测试执行摘要")
        print("="*70)
        
        if results['status'] == 'completed':
            print(f"总场景数: {results['total_scenarios']}")
            print(f"验证成功: {results['successful_scenarios']}")
            print(f"验证失败: {results['failed_scenarios']}")
            print(f"执行错误: {results['error_scenarios']}")
            print(f"成功率: {results['success_rate']*100:.1f}%")
            print(f"总耗时: {results['duration_seconds']:.1f} 秒")
            print(f"控制台错误数: {results['total_console_errors']}")
            print(f"结果文件: {result_file}")
            
            if results['interrupted']:
                print("⚠️  测试在执行过程中被中断")
            
            print("\n✅ 自动化测试执行器运行完成!")
            
            # 根据成功率决定退出码
            if results['success_rate'] >= 0.8:  # 80%以上成功率认为成功
                print("🎉 测试成功率达标!")
                return True
            else:
                print("⚠️ 测试成功率未达标，需要检查失败的场景")
                return False
        else:
            print(f"❌ 测试执行失败: {results.get('error', 'Unknown error')}")
            return False
            
    except KeyboardInterrupt:
        print("\n⚠️ 测试被用户中断")
        return False
    except Exception as e:
        logger.error(f"执行器运行失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
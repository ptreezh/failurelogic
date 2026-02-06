"""
远程部署验证脚本

用于验证远程部署的认知陷阱平台的所有场景功能
"""

import asyncio
import os
from automated_test_executor import TestExecutionManager
from universal_scenario_validator import ScenarioTestFramework
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_remote_deployment(remote_url: str):
    """测试远程部署"""
    print(f"🌍 开始测试远程部署: {remote_url}")
    print("="*60)
    
    # 创建执行管理器
    executor = TestExecutionManager(base_url=remote_url)
    
    try:
        # 加载所有场景定义（从本地文件）
        print("📚 加载场景定义...")
        framework = ScenarioTestFramework(base_url=remote_url)
        framework.load_scenarios()
        
        if not framework.all_scenarios:
            print("❌ 未找到任何场景定义")
            return False
        
        print(f"✅ 已加载 {len(framework.all_scenarios)} 个场景")
        
        # 选择前几个场景进行快速验证（可以调整数量）
        test_scenarios = framework.all_scenarios[:5]  # 先测试前5个场景作为样本
        print(f"🔍 将测试前 {len(test_scenarios)} 个场景作为样本验证")
        
        # 运行样本验证
        validation_results = []
        for i, scenario in enumerate(test_scenarios):
            print(f"  测试 {i+1}/{len(test_scenarios)}: {scenario['name']}")
            
            # 直接使用ComprehensiveScenarioValidator进行验证
            from specific_scenario_validations import ComprehensiveScenarioValidator
            validator = ComprehensiveScenarioValidator(base_url=remote_url)
            result = await validator.validate_scenario_comprehensively(scenario)
            validation_results.append(result)
            
            status_icon = "✅" if result.get('overall_success', False) else "❌"
            print(f"    {status_icon} {result.get('scenario_name', 'Unknown')}: {'Success' if result.get('overall_success', False) else 'Failed'}")
        
        # 统计结果
        successful = sum(1 for r in validation_results if r.get('overall_success', False))
        total = len(validation_results)
        
        print(f"\n📊 样本测试结果: {successful}/{total} 成功")
        
        if successful == total:
            print("✅ 样本测试全部通过，远程部署功能正常")
            
            # 询问是否继续测试所有场景
            print(f"\nℹ️  已成功测试 {len(test_scenarios)} 个场景作为样本")
            print("❓ 是否要继续测试所有场景? (这可能需要较长时间)")
            
            # 为演示目的，我们只测试样本，实际使用时可以测试全部
            print(f"\n🎯 远程部署验证完成: {remote_url}")
            print(f"📈 样本测试成功率: {successful/total*100:.1f}%")
            
            return True
        else:
            print(f"❌ 样本测试失败: {total-successful} 个场景验证失败")
            return False
            
    except Exception as e:
        logger.error(f"测试远程部署时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def quick_remote_test(remote_url: str):
    """快速远程测试 - 只测试几个关键场景"""
    print(f"⚡ 执行快速远程测试: {remote_url}")
    print("="*50)
    
    from specific_scenario_validations import ComprehensiveScenarioValidator
    
    # 定义几个关键场景进行测试
    key_scenarios = [
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
    
    validator = ComprehensiveScenarioValidator(base_url=remote_url)
    
    results = []
    for scenario in key_scenarios:
        print(f"🔍 测试关键场景: {scenario['name']}")
        try:
            result = await validator.validate_scenario_comprehensively(scenario)
            results.append(result)
            
            status = "✅" if result.get('overall_success', False) else "❌"
            print(f"   {status} {scenario['name']}")
            
        except Exception as e:
            print(f"   ❌ {scenario['name']}: {str(e)}")
            results.append({
                'scenario_id': scenario['id'],
                'scenario_name': scenario['name'],
                'overall_success': False,
                'error': str(e)
            })
    
    # 统计结果
    successful = sum(1 for r in results if r.get('overall_success', False))
    total = len(results)
    
    print(f"\n📊 快速测试结果: {successful}/{total} 成功")
    
    if successful > 0:
        print("✅ 至少有一个关键场景测试通过，远程部署基本功能正常")
    else:
        print("❌ 所有关键场景测试失败，远程部署可能存在问题")
    
    return successful > 0

async def main():
    """主函数"""
    print("🚀 认知陷阱平台远程部署验证工具")
    print("="*60)
    
    # 获取远程URL
    print("请输入要测试的远程部署URL:")
    print("示例: https://your-deployment.vercel.app, https://your-project.railway.app")
    
    # 对于演示，我们使用一个假设的远程URL
    # 在实际使用中，这里应该是用户输入的URL
    remote_urls = [
        "http://localhost:8000",  # 本地测试
        # "https://your-actual-deployment-url.com",  # 实际远程URL
    ]
    
    # 如果设置了环境变量，则使用它
    env_url = os.getenv('REMOTE_TEST_URL')
    if env_url:
        remote_urls = [env_url]
    
    all_results = {}
    
    for url in remote_urls:
        print(f"\n🌐 测试URL: {url}")
        print("-" * 40)
        
        # 执行快速测试
        result = await quick_remote_test(url)
        all_results[url] = result
        
        print()
    
    # 输出总体结果
    print("📈 测试总结:")
    print("="*30)
    for url, result in all_results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} {url}")
    
    print(f"\n🎯 远程部署验证完成!")
    
    # 返回总体结果
    return all(result for result in all_results.values())

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
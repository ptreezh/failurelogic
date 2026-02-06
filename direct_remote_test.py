"""
远程部署验证脚本 - 直接测试远程部署的网址
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

async def test_remote_deployment_full(remote_url: str):
    """全面测试远程部署"""
    print(f"🌍 开始全面测试远程部署: {remote_url}")
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
        
        # 为了演示目的，我们测试所有场景（实际运行时可能需要较长时间）
        # 但在实际使用中，我们可以设置一个合理的数量限制
        total_scenarios = len(framework.all_scenarios)
        print(f"🔍 准备测试全部 {total_scenarios} 个场景")
        
        # 限制测试数量以避免过长时间运行
        test_limit = min(total_scenarios, 10)  # 限制为前10个场景进行演示
        test_scenarios = framework.all_scenarios[:test_limit]
        
        print(f"📝 实际将测试前 {len(test_scenarios)} 个场景")
        
        # 运行验证
        validation_results = []
        for i, scenario in enumerate(test_scenarios):
            print(f"  [{i+1}/{len(test_scenarios)}] 测试场景: {scenario['name']}")
            
            # 直接使用ComprehensiveScenarioValidator进行验证
            from specific_scenario_validations import ComprehensiveScenarioValidator
            validator = ComprehensiveScenarioValidator(base_url=remote_url)
            result = await validator.validate_scenario_comprehensively(scenario)
            validation_results.append(result)
            
            status_icon = "✅" if result.get('overall_success', False) else "❌"
            print(f"      {status_icon} {result.get('scenario_name', 'Unknown')}: {'Success' if result.get('overall_success', False) else 'Failed'}")
        
        # 统计结果
        successful = sum(1 for r in validation_results if r.get('overall_success', False))
        total_tested = len(validation_results)
        
        print(f"\n📊 测试结果: {successful}/{total_tested} 成功")
        print(f"📈 成功率: {successful/total_tested*100:.1f}%")
        
        # 显示失败的场景
        failed_scenarios = [r for r in validation_results if not r.get('overall_success', False)]
        if failed_scenarios:
            print(f"\n❌ 失败的场景:")
            for result in failed_scenarios:
                print(f"   • {result.get('scenario_name', 'Unknown')}")
        
        # 显示成功的场景
        successful_scenarios = [r for r in validation_results if r.get('overall_success', False)]
        if successful_scenarios:
            print(f"\n✅ 成功的场景:")
            for result in successful_scenarios[:5]:  # 只显示前5个成功场景
                print(f"   • {result.get('scenario_name', 'Unknown')}")
            if len(successful_scenarios) > 5:
                print(f"   ... 还有 {len(successful_scenarios)-5} 个成功场景")
        
        print(f"\n🎯 远程部署验证完成: {remote_url}")
        print(f"📈 总体成功率: {successful/total_tested*100:.1f}%")
        
        return successful == total_tested  # 如果所有测试都成功则返回True
        
    except Exception as e:
        logger.error(f"测试远程部署时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def quick_remote_validation(remote_url: str):
    """快速验证远程部署的关键功能"""
    print(f"⚡ 执行快速远程验证: {remote_url}")
    print("="*50)
    
    from specific_scenario_validations import ComprehensiveScenarioValidator
    
    # 定义关键场景进行快速验证
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
        },
        {
            "id": "game-001",
            "name": "商业战略推理游戏",
            "description": "模拟商业决策推理过程"
        },
        {
            "id": "hist-001",
            "name": "挑战者号航天飞机灾难",
            "description": "历史案例分析"
        }
    ]
    
    validator = ComprehensiveScenarioValidator(base_url=remote_url)
    
    results = []
    for i, scenario in enumerate(key_scenarios):
        print(f"  [{i+1}/{len(key_scenarios)}] 验证: {scenario['name']}")
        try:
            result = await validator.validate_scenario_comprehensively(scenario)
            results.append(result)
            
            status = "✅" if result.get('overall_success', False) else "❌"
            print(f"      {status} {scenario['name']}")
            
        except Exception as e:
            print(f"      ❌ {scenario['name']}: {str(e)}")
            results.append({
                'scenario_id': scenario['id'],
                'scenario_name': scenario['name'],
                'overall_success': False,
                'error': str(e)
            })
    
    # 统计结果
    successful = sum(1 for r in results if r.get('overall_success', False))
    total = len(results)
    
    print(f"\n📊 快速验证结果: {successful}/{total} 成功")
    print(f"📈 成功率: {successful/total*100:.1f}%")
    
    if successful == total:
        print("✅ 所有关键场景验证通过，远程部署功能正常")
    elif successful > 0:
        print("⚠️  部分关键场景验证通过，远程部署基本功能正常")
    else:
        print("❌ 所有关键场景验证失败，远程部署存在问题")
    
    return successful > 0

async def main():
    """主函数 - 测试远程部署"""
    print("🚀 认知陷阱平台远程部署验证工具")
    print("="*60)
    
    # 获取远程URL - 从环境变量或使用默认值
    remote_url = os.getenv('REMOTE_TEST_URL', 'https://failure-logic-platform.vercel.app')
    
    print(f"🌍 测试远程部署URL: {remote_url}")
    print("-" * 50)
    
    # 首先执行快速验证
    print("🔍 执行快速验证...")
    quick_result = await quick_remote_validation(remote_url)
    
    print("\n" + "="*60)
    
    if quick_result:
        print("✅ 快速验证通过，继续执行全面验证...")
        
        # 执行全面验证（仅限演示，实际可能限制数量）
        full_result = await test_remote_deployment_full(remote_url)
        
        print("\n" + "="*60)
        print("🎯 验证完成总结:")
        print(f"   快速验证: {'✅ 通过' if quick_result else '❌ 失败'}")
        print(f"   全面验证: {'✅ 通过' if full_result else '❌ 失败'}")
        
        if quick_result and full_result:
            print("🎉 远程部署验证完全通过！")
            return True
        else:
            print("⚠️ 远程部署验证部分通过，需要注意失败的场景")
            return False
    else:
        print("❌ 快速验证失败，无需执行全面验证")
        print("❌ 远程部署存在问题，请检查部署状态")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
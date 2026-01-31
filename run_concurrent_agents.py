"""
并发Playwright端到端测试智能体 - 主运行器
协调四个智能体的执行并生成综合报告
"""

import asyncio
import subprocess
import sys
from datetime import datetime
import logging
from concurrent_e2e_test_agents_simple import main as run_tests
from generate_test_report import generate_comprehensive_report, save_detailed_results

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """主运行器函数"""
    logger.info("🚀 启动Failure Logic平台并发端到端测试")
    logger.info("=" * 80)
    logger.info("📋 测试协议: Microsoft Edge浏览器 + 非headless模式")
    logger.info("🎯 测试目标: 四个智能体并发验证所有功能模块")
    logger.info("=" * 80)
    
    print("🔍 检查服务可用性...")
    
    # 检查前端服务
    try:
        import requests
        response = requests.get("http://localhost:8081", timeout=10)
        if response.status_code == 200:
            print("✅ 前端服务正在运行 (端口 8081)")
        else:
            print(f"⚠️ 前端服务响应异常: {response.status_code}")
            print("💡 请确保已启动前端服务器 (通常在 http://localhost:8081)")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到前端服务")
        print("💡 请确保已启动前端服务器 (通常在 http://localhost:8081)")
        return False
    except ImportError:
        print("⚠️ requests库未安装，跳过服务检查")
    except Exception as e:
        print(f"❌ 检查前端服务时出错: {e}")
        return False

    # 检查API服务
    try:
        import requests
        response = requests.get("http://localhost:8082/health", timeout=10)
        if response.status_code == 200:
            print("✅ API服务正在运行 (端口 8082)")
        else:
            print(f"⚠️ API服务响应异常: {response.status_code}")
            print("💡 请确保已启动API服务器 (通常在 http://localhost:8082)")
    except requests.exceptions.ConnectionError:
        print("⚠️ 无法连接到API服务")
        print("💡 请确保已启动API服务器 (通常在 http://localhost:8082)")
    except Exception as e:
        print(f"⚠️ 检查API服务时出错: {e}")

    print()
    
    # 运行并发测试
    print("🏃‍♂️ 正在运行并发测试...")
    test_results = run_tests()
    
    if test_results:
        print("\n📊 生成综合测试报告...")
        
        # 生成综合报告
        report_file = generate_comprehensive_report(test_results)
        
        # 保存详细结果
        detailed_file = save_detailed_results(test_results)
        
        print(f"\n📄 综合报告: {report_file}")
        print(f"📊 详细结果: {detailed_file}")
        
        # 输出总体结果
        total_checks = 0
        successful_checks = 0
        
        for result in test_results:
            for value in result.values():
                total_checks += 1
                if value:
                    successful_checks += 1
        
        if total_checks > 0:
            success_rate = (successful_checks / total_checks) * 100
            print(f"\n📈 总体成功率: {successful_checks}/{total_checks} ({success_rate:.1f}%)")
            
            if successful_checks == total_checks:
                print("\n🏆 所有并发测试通过!")
                print("✅ 四个智能体均成功完成各自测试任务")
                print("✅ 所有功能模块正常工作")
                print("✅ 系统准备就绪，可用于全面的认知偏差教育体验!")
            else:
                print(f"\n⚠️ 部分测试未通过")
                print(f"   成功: {successful_checks}, 失败: {total_checks - successful_checks}")
    
    print(f"\n🏁 测试完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("💡 测试报告已生成，详情请查看相关文件")


if __name__ == "__main__":
    main()
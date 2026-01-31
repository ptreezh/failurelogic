"""
API连接和数据同步测试运行器
用于启动和管理API连接及数据同步功能的Playwright测试
"""
import asyncio
import subprocess
import sys
import os
from pathlib import Path

def run_api_data_sync_test():
    """运行API连接和数据同步测试"""
    print("="*70)
    print("启动API连接和数据同步功能专项测试")
    print("="*70)
    print("测试配置:")
    print("- 浏览器: Microsoft Edge")
    print("- 无头模式: 已禁用")
    print("- 测试项目:")
    print("  1. 前端与后端API连接")
    print("  2. 数据同步功能") 
    print("  3. API端点可用性")
    print("  4. 数据传输验证")
    print("  5. 错误处理机制")
    print("="*70)
    
    try:
        # 运行测试脚本
        result = subprocess.run([
            sys.executable, 
            "-m", 
            "playwright", 
            "install", 
            "msedge"
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"警告: Playwright Edge安装可能有问题: {result.stderr}")
        
        # 执行测试
        test_script = Path(__file__).parent / "api_data_sync_playwright_test.py"
        result = subprocess.run([sys.executable, str(test_script)], 
                               capture_output=True, text=True)
        
        print("测试输出:")
        print(result.stdout)
        if result.stderr:
            print("错误信息:")
            print(result.stderr)
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"运行测试时发生错误: {e}")
        return False

def run_async_test():
    """异步运行测试"""
    async def async_run():
        # 导入测试类并运行
        import api_data_sync_playwright_test
        tester = api_data_sync_playwright_test.APIDataSyncTester()
        return await tester.run_comprehensive_test()
    
    try:
        return asyncio.run(async_run())
    except Exception as e:
        print(f"异步测试执行失败: {e}")
        return False

if __name__ == "__main__":
    print("选择测试运行方式:")
    print("1. 子进程方式 (推荐)")
    print("2. 异步方式")
    
    choice = input("请选择 (1 或 2, 默认为 1): ").strip() or "1"
    
    success = False
    
    if choice == "1":
        success = run_api_data_sync_test()
    elif choice == "2":
        success = run_async_test()
    else:
        print("无效选择，使用默认方式 (1)")
        success = run_api_data_sync_test()
    
    print("\n" + "="*70)
    if success:
        print("✅ API连接和数据同步测试执行完成!")
        print("请检查浏览器窗口中的测试过程和结果")
    else:
        print("❌ API连接和数据同步测试执行失败!")
        print("请检查错误信息并重试")
    print("="*70)
"""
运行场景导航和难度选择器测试的脚本
"""
import subprocess
import sys
import os
from pathlib import Path

def run_scenario_navigation_test():
    """运行场景导航和难度选择器测试"""
    print("🚀 启动场景页面导航和难度选择器专项测试")
    print("="*60)
    
    # 检查Playwright是否已安装
    try:
        import playwright
        print("✅ Playwright 已安装")
    except ImportError:
        print("❌ Playwright 未安装，正在安装...")
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright"])
        subprocess.run([sys.executable, "-m", "playwright", "install"])
        print("✅ Playwright 安装完成")
    
    # 检查测试文件是否存在
    test_file = Path("scenario_navigation_difficulty_test.py")
    if not test_file.exists():
        print(f"❌ 测试文件不存在: {test_file}")
        return False
    
    print(f"📋 执行测试文件: {test_file}")
    print("💡 测试将在Microsoft Edge浏览器中以非headless模式运行")
    print()
    
    # 运行测试
    try:
        result = subprocess.run([
            sys.executable, 
            str(test_file)
        ], check=True, capture_output=True, text=True)
        
        print("✅ 测试执行完成")
        print("标准输出:")
        print(result.stdout)
        
        if result.stderr:
            print("标准错误:")
            print(result.stderr)
            
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 测试执行失败: {e}")
        print("返回码:", e.returncode)
        print("标准输出:", e.stdout)
        print("标准错误:", e.stderr)
        return False
    except Exception as e:
        print(f"❌ 运行测试时发生未知错误: {e}")
        return False

if __name__ == "__main__":
    print("🏠 认知陷阱测试平台 - 场景导航和难度选择器测试运行器")
    print("=" * 80)
    
    success = run_scenario_navigation_test()
    
    if success:
        print("\n🎉 测试运行成功完成!")
    else:
        print("\n⚠️ 测试运行出现问题!")
        sys.exit(1)
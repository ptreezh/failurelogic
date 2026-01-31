"""
Runner for MCP Playwright Comprehensive End-to-End Test
Ensures the test runs with Microsoft Edge in non-headless mode
"""

import subprocess
import sys
import os
from pathlib import Path

def run_comprehensive_test():
    """Run the comprehensive Playwright test"""
    print("🚀 启动MCP Playwright全面端到端测试运行器")
    print("📋 确保使用Microsoft Edge浏览器 + 非headless模式")
    print("=" * 60)
    
    # Check if Playwright is installed
    try:
        import playwright
        print("✅ Playwright已安装")
    except ImportError:
        print("❌ Playwright未安装，正在安装...")
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright"])
        import playwright
    
    # Install browsers (ensure Edge is available)
    print("🔧 确保浏览器已安装...")
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"])  # Edge uses Chromium engine
    
    # Run the comprehensive test
    test_script = "comprehensive_mcp_playwright_test.py"
    
    if not os.path.exists(test_script):
        print(f"❌ 测试脚本 {test_script} 不存在")
        return False
        
    print(f"🏃 执行测试脚本: {test_script}")
    print("💡 注意: 浏览器将以非headless模式启动，您将看到实际界面")
    
    # Run the test with Python
    result = subprocess.run([sys.executable, test_script], cwd=os.getcwd())
    
    if result.returncode == 0:
        print("\n✅ 全面端到端测试执行成功!")
        return True
    else:
        print(f"\n❌ 全面端到端测试执行失败 (返回码: {result.returncode})")
        return False

def main():
    """Main function"""
    print("MCP Playwright全面端到端测试运行器")
    print("=====================================")
    
    success = run_comprehensive_test()
    
    if success:
        print("\n🎉 测试运行完成!")
        print("📋 测试涵盖以下方面:")
        print("   1. 访问前端界面")
        print("   2. 浏览所有可用测试场景") 
        print("   3. 完成至少一个完整测试流程")
        print("   4. 验证后端API连接")
        print("   5. 检查所有交互功能")
        print("   6. 使用Microsoft Edge浏览器 (非headless模式)")
    else:
        print("\n⚠️ 测试运行出现问题，请检查输出日志")
        
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
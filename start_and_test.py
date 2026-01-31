"""
Script to start the API server and run the comprehensive Playwright test
"""
import subprocess
import sys
import time
import threading
import requests
import signal
import os

def start_api_server():
    """Start the API server in a separate thread"""
    print("🚀 启动API服务器...")
    try:
        # Start the server using server_runner.py which runs on port 8082
        server_process = subprocess.Popen([
            sys.executable, "-m", "api-server.server_runner"
        ], cwd=os.getcwd())
        
        return server_process
    except Exception as e:
        print(f"❌ 启动API服务器失败: {e}")
        return None

def check_server_health(max_attempts=30):
    """Check if the server is running and healthy"""
    print("🏥 检查服务器健康状态...")
    for attempt in range(max_attempts):
        try:
            response = requests.get("http://localhost:8082/health", timeout=5)
            if response.status_code == 200:
                print("✅ 服务器健康检查通过")
                return True
        except requests.exceptions.RequestException:
            pass
        
        print(f"⏳ 等待服务器启动... ({attempt + 1}/{max_attempts})")
        time.sleep(2)
    
    print("❌ 服务器健康检查失败")
    return False

def run_comprehensive_test():
    """Run the comprehensive Playwright test"""
    print("🏃 执行全面端到端测试...")
    
    # Run the test with Python
    result = subprocess.run([
        sys.executable, "comprehensive_mcp_playwright_test.py"
    ], cwd=os.getcwd())
    
    return result.returncode == 0

def main():
    """Main function to orchestrate the test"""
    print("🧪 MCP Playwright全面端到端测试启动器")
    print("=" * 50)
    
    # Start the API server
    server_process = start_api_server()
    if not server_process:
        print("❌ 无法启动API服务器，退出测试")
        return False
    
    # Wait for server to be ready
    if not check_server_health():
        print("❌ 服务器未能在规定时间内启动，终止测试")
        server_process.terminate()
        return False
    
    print("✅ 服务器已就绪，开始运行端到端测试...")
    
    # Run the comprehensive test
    test_success = run_comprehensive_test()
    
    # Terminate the server
    print("\n🛑 关闭API服务器...")
    server_process.terminate()
    
    if test_success:
        print("\n🎉 全面端到端测试成功完成!")
        print("📋 测试涵盖以下方面:")
        print("   1. 访问前端界面")
        print("   2. 浏览所有可用测试场景") 
        print("   3. 完成至少一个完整测试流程")
        print("   4. 验证后端API连接")
        print("   5. 检查所有交互功能")
        print("   6. 使用Microsoft Edge浏览器 (非headless模式)")
        return True
    else:
        print("\n❌ 全面端到端测试失败")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
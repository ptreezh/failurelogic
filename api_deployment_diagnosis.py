"""
API部署问题深度排查脚本
用于诊断Railway部署环境中API端点无法访问的问题
"""

import subprocess
import sys
import os
import requests
import json
from datetime import datetime

def check_deployment_status():
    """检查部署状态"""
    print("🔍 检查部署状态...")
    
    try:
        # 检查服务状态
        result = subprocess.run(['railway', 'status'], capture_output=True, text=True)
        print(f"Railway状态:\n{result.stdout}")
        if result.stderr:
            print(f"错误: {result.stderr}")
    except Exception as e:
        print(f"❌ 无法检查Railway状态: {e}")

def check_service_details():
    """检查服务详细信息"""
    print("\n🔍 检查服务详细信息...")
    
    try:
        # 获取服务列表
        result = subprocess.run(['railway', 'service', 'list'], capture_output=True, text=True)
        print(f"服务列表:\n{result.stdout}")
    except Exception as e:
        print(f"❌ 无法获取服务列表: {e}")

def diagnose_api_issue():
    """诊断API问题"""
    print("\n🔍 诊断API端点问题...")
    
    base_url = "https://insightful-enthusiasm-production.up.railway.app"
    
    # 测试多个端点
    endpoints = [
        "/",
        "/docs",
        "/openapi.json",
        "/scenarios/",
        "/api/interactive/chat",
        "/health"
    ]
    
    print("测试各个端点响应:")
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"  {endpoint:25} -> {response.status_code} ({len(response.content)} bytes)")
        except Exception as e:
            print(f"  {endpoint:25} -> ERROR: {str(e)}")
    
    print("\n尝试POST请求到互动端点:")
    try:
        response = requests.post(
            f"{base_url}/api/interactive/chat",
            json={"user_input": "test"},
            timeout=10
        )
        print(f"  POST /api/interactive/chat -> {response.status_code}")
        print(f"  响应内容: {response.text[:200]}...")
    except Exception as e:
        print(f"  POST /api/interactive/chat -> ERROR: {str(e)}")

def check_routes_in_deployment():
    """检查部署中的路由配置"""
    print("\n🔍 检查部署中的路由配置...")
    
    # 创建一个临时的最小化FastAPI应用来测试路由
    temp_app_code = '''
from fastapi import FastAPI
import uvicorn
import os

app = FastAPI(title="Route Test App")

@app.get("/")
async def root():
    return {"message": "Root endpoint working", "routes_count": len(app.routes)}

@app.get("/test")
async def test():
    return {"message": "Test endpoint working"}

@app.get("/scenarios/")
async def scenarios():
    return {"scenarios": [{"id": "test", "name": "Test Scenario"}]}

@app.post("/api/interactive/chat")
async def chat_endpoint():
    return {"response": "Chat endpoint working"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
'''

    with open("temp_route_test.py", "w", encoding='utf-8') as f:
        f.write(temp_app_code)
    
    print("已创建临时路由测试应用")
    
    # 清理临时文件
    if os.path.exists("temp_route_test.py"):
        os.remove("temp_route_test.py")
    
    print("💡 可能的问题原因:")
    print("   1. 部署环境中的Python依赖版本不兼容")
    print("   2. FastAPI路由注册在部署环境中失败")
    print("   3. 部署配置中的启动命令问题")
    print("   4. 静态文件路由与API路由冲突")
    print("   5. 中间件配置阻止了API路由")

def analyze_deployment_logs():
    """分析部署日志"""
    print("\n🔍 分析部署日志...")
    
    try:
        result = subprocess.run(['railway', 'logs'], capture_output=True, text=True)
        logs = result.stdout
        
        print("日志摘要:")
        lines = logs.split('\\n')
        for line in lines[-20:]:  # 显示最后20行
            if 'error' in line.lower() or 'exception' in line.lower() or 'fail' in line.lower():
                print(f"  ⚠️  {line}")
        
        if not any('error' in line.lower() or 'exception' in line.lower() for line in lines[-20:]):
            print("  ✅ 最近日志中未发现明显错误")
            
        print(f"\\n完整日志行数: {len(lines)}")
        
    except Exception as e:
        print(f"❌ 无法获取部署日志: {e}")

def suggest_fixes():
    """建议修复方案"""
    print("\\n🔧 建议的修复方案:")
    
    fixes = [
        "1. 检查requirements.txt中的依赖版本是否与部署环境兼容",
        "2. 验证API服务器启动脚本是否正确初始化所有路由", 
        "3. 检查是否有静态文件路由(/.*)覆盖了API路由",
        "4. 确认部署环境中的Python版本与开发环境一致",
        "5. 检查是否在部署环境中正确设置了环境变量"
    ]
    
    for fix in fixes:
        print(f"   {fix}")

def main():
    """主函数"""
    print("🚀 认知陷阱平台 - API部署问题深度排查")
    print("="*60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    check_deployment_status()
    check_service_details() 
    diagnose_api_issue()
    check_routes_in_deployment()
    analyze_deployment_logs()
    suggest_fixes()
    
    print()
    print("="*60)
    print("✅ 排查完成，请根据建议进行修复")

if __name__ == "__main__":
    main()
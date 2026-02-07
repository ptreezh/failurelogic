"""
API端点验证和修复脚本
验证API服务端点是否正确注册
"""

import requests
import time

def test_api_endpoints():
    """测试API端点"""
    base_url = "https://insightful-enthusiasm-production.up.railway.app"
    
    endpoints_to_test = [
        "/",
        "/scenarios/",
        "/health",
        "/scenarios/coffee-shop-nonlinear-effects",
        "/api/scenarios/",
        "/v1/scenarios/",
        "/api/v1/scenarios/"
    ]
    
    print("🔍 测试API端点连通性...")
    
    for endpoint in endpoints_to_test:
        try:
            url = base_url + endpoint
            response = requests.get(url, timeout=10)
            print(f"  {endpoint}: {response.status_code} - {'✅' if response.status_code == 200 else '❌'}")
        except Exception as e:
            print(f"  {endpoint}: ❌ Error - {str(e)}")
    
    print("\n💡 如果端点仍然返回404，可能需要检查:")
    print("   1. FastAPI路由是否正确注册")
    print("   2. Railway环境变量配置")
    print("   3. 服务器启动配置")

def main():
    print("🚀 API端点验证工具")
    print("="*50)
    
    test_api_endpoints()
    
    print("\n✅ 验证完成")

if __name__ == "__main__":
    main()
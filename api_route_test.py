"""
API服务器部署验证工具
验证API服务器在部署环境中的路由是否正确工作
"""

import requests
import time

def test_api_routes():
    """测试API服务器路由"""
    base_url = "https://insightful-enthusiasm-production.up.railway.app"
    
    # 测试多个端点
    endpoints = [
        "/",
        "/scenarios/",
        "/health",
        "/docs",
        "/openapi.json"
    ]
    
    print("🔍 测试API服务器路由...")
    print(f"   基础URL: {base_url}")
    print()
    
    for endpoint in endpoints:
        try:
            print(f"  测试 {endpoint} ...")
            response = requests.get(f"{base_url}{endpoint}", timeout=15)
            print(f"    状态码: {response.status_code}")
            print(f"    响应大小: {len(response.content)} 字节")
            
            # 尝试解析JSON响应
            try:
                json_resp = response.json()
                print(f"    JSON响应: {bool(json_resp)}")
            except:
                print(f"    JSON响应: False (非JSON格式)")
            
            print()
        except Exception as e:
            print(f"    ❌ 错误: {e}")
            print()

if __name__ == "__main__":
    test_api_routes()
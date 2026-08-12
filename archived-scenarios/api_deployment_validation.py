"""
API服务器部署验证脚本
验证API服务器在部署环境中的路由注册情况
"""

import requests
import json
from datetime import datetime

def test_api_routes():
    """测试API服务器的路由"""
    base_url = "https://insightful-enthusiasm-production.up.railway.app"
    
    print("🔍 测试API服务器路由注册情况...")
    print(f"🎯 测试URL: {base_url}")
    
    # 测试各种端点
    endpoints_to_test = [
        "/",
        "/scenarios/",
        "/health",
        "/docs",
        "/openapi.json"
    ]
    
    results = {}
    
    for endpoint in endpoints_to_test:
        try:
            print(f"  🧪 测试 {endpoint} ...")
            response = requests.get(f"{base_url}{endpoint}", timeout=15)
            results[endpoint] = {
                'status_code': response.status_code,
                'success': response.status_code in [200, 405],  # 200=成功, 405=方法不允许但端点存在
                'response_time': response.elapsed.total_seconds(),
                'content_type': response.headers.get('content-type', 'unknown')
            }
            print(f"    ✅ {endpoint}: {response.status_code} ({response.elapsed.total_seconds():.2f}s, {results[endpoint]['content_type']})")
        except requests.exceptions.RequestException as e:
            results[endpoint] = {
                'status_code': None,
                'success': False,
                'error': str(e)
            }
            print(f"    ❌ {endpoint}: 错误 - {str(e)}")
    
    # 汇总结果
    successful_endpoints = sum(1 for r in results.values() if r['success'])
    total_endpoints = len(results)
    
    print(f"\n📊 路由测试结果: {successful_endpoints}/{total_endpoints} 成功")
    
    if successful_endpoints == 0:
        print("❌ 所有端点都返回404，API服务器路由可能未正确注册")
    elif successful_endpoints < total_endpoints:
        print("⚠️  部分端点无法访问，路由注册可能存在问题")
    else:
        print("✅ 所有端点均可访问，路由注册正常")
    
    return results

def main():
    """主函数"""
    print("🚀 认知陷阱平台 - API服务器部署验证")
    print("="*60)
    
    # 执行路由测试
    results = test_api_routes()
    
    print("\n" + "="*60)
    print("📋 验证结果摘要:")
    
    for endpoint, result in results.items():
        status_icon = "✅" if result['success'] else "❌"
        status_code = result.get('status_code', 'ERROR')
        print(f"  {status_icon} {endpoint}: {status_code}")
    
    successful_count = sum(1 for r in results.values() if r['success'])
    total_count = len(results)
    success_rate = successful_count / total_count if total_count > 0 else 0
    
    print(f"\n📈 总体成功率: {success_rate*100:.1f}% ({successful_count}/{total_count})")
    
    if success_rate == 0:
        print("\n❌ 严重问题: 所有API端点都无法访问")
        print("💡 可能的原因:")
        print("   - FastAPI应用在部署时未正确初始化")
        print("   - 路由未正确注册")
        print("   - 部署配置问题")
        print("   - 模块导入路径问题")
    elif success_rate < 0.5:
        print("\n⚠️  问题: 多数API端点无法访问")
        print("💡 需要检查路由注册和部署配置")
    else:
        print("\n✅ API服务器部署基本正常")
    
    print(f"\n⏰ 验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return success_rate >= 0.5  # 如果至少一半端点成功则认为基本正常

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
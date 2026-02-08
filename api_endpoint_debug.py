"""
API端点验证和调试脚本
用于验证部署环境中的API端点是否正常工作
"""

import requests
import time
from datetime import datetime

def test_api_endpoints():
    """测试API端点"""
    base_url = "https://insightful-enthusiasm-production.up.railway.app"
    
    print("🔍 测试API端点连通性...")
    print(f"🌐 基础URL: {base_url}")
    print()
    
    # 测试各种端点
    endpoints = [
        ("/", "根路径"),
        ("/scenarios/", "场景列表"),
        ("/health", "健康检查"),
        ("/api/interactive/chat", "互动聊天端点"),
        ("/docs", "API文档"),
        ("/openapi.json", "OpenAPI规范")
    ]
    
    results = {}
    
    for endpoint, description in endpoints:
        try:
            print(f"  🧪 测试 {description} ({endpoint}) ...")
            response = requests.get(f"{base_url}{endpoint}", timeout=15)
            results[endpoint] = {
                'status_code': response.status_code,
                'content_length': len(response.content),
                'content_type': response.headers.get('content-type', 'unknown'),
                'success': response.status_code == 200
            }
            print(f"     状态码: {response.status_code}, 内容长度: {len(response.content)}")
        except requests.exceptions.RequestException as e:
            results[endpoint] = {
                'status_code': None,
                'content_length': 0,
                'content_type': 'unknown',
                'success': False,
                'error': str(e)
            }
            print(f"     ❌ 错误: {str(e)}")
    
    print()
    print("📊 测试结果汇总:")
    successful = 0
    for endpoint, result in results.items():
        status_icon = "✅" if result['success'] else "❌"
        print(f"  {status_icon} {endpoint:25s} -> {str(result.get('status_code', 'ERROR')):3s} ({result.get('content_length', 0):3d} bytes)")
        if result['success']:
            successful += 1
    
    print(f"\n📈 成功率: {successful}/{len(endpoints)} ({successful/len(endpoints)*100:.1f}%)")
    
    return results

def check_deployment_status():
    """检查部署状态"""
    print("🔍 检查部署状态...")
    
    # 检查服务器响应头
    try:
        response = requests.head("https://insightful-enthusiasm-production.up.railway.app/", timeout=10)
        print(f"   Server: {response.headers.get('Server', 'Unknown')}")
        print(f"   X-Railway-Edge: {response.headers.get('X-Railway-Edge', 'Unknown')}")
        print(f"   Date: {response.headers.get('Date', 'Unknown')}")
    except Exception as e:
        print(f"   ❌ 无法获取响应头: {e}")

def main():
    """主函数"""
    print("🚀 认知陷阱平台 - API端点验证和调试")
    print("="*60)
    print(f"时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 检查部署状态
    check_deployment_status()
    print()
    
    # 测试API端点
    results = test_api_endpoints()
    
    print("\n" + "="*60)
    
    # 分析结果
    if results.get('/', {}).get('status_code') == 404 and results.get('/scenarios/', {}).get('status_code') == 404:
        print("⚠️  问题分析:")
        print("   - 所有端点都返回404，可能的原因:")
        print("     1. FastAPI应用未正确初始化")
        print("     2. 路由注册失败")
        print("     3. 部署环境配置问题")
        print("     4. 中间件阻止了请求")
        
        print("\n🔧 建议的解决方案:")
        print("   1. 检查部署环境中的依赖安装")
        print("   2. 验证FastAPI路由注册逻辑")
        print("   3. 检查通配符路由是否干扰了API路由")
        print("   4. 确认环境变量配置正确")
    else:
        print("✅ API端点工作正常")
    
    print("\n🎯 验证完成")
    
    return True

if __name__ == "__main__":
    main()
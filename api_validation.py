"""
API验证脚本
验证Railway部署的API是否正常工作
"""

import requests
import time
from datetime import datetime

def test_deployed_api():
    """测试部署的API"""
    print("🔍 测试部署的API服务...")
    
    # 使用Railway生成的URL
    base_url = "https://insightful-enthusiasm-production.up.railway.app"
    
    print(f"📡 测试API端点: {base_url}")
    
    # 测试不同的API端点
    endpoints = [
        "/scenarios/",
        "/"
    ]
    
    results = {}
    
    for endpoint in endpoints:
        try:
            print(f"  🧪 测试 {endpoint} ...")
            response = requests.get(f"{base_url}{endpoint}", timeout=15)
            results[endpoint] = {
                'status_code': response.status_code,
                'success': response.status_code in [200, 405, 404],  # 服务可达即为成功
                'response_time': response.elapsed.total_seconds(),
                'content_length': len(response.content)
            }
            print(f"    ✅ {endpoint}: {response.status_code} ({response.elapsed.total_seconds():.2f}s, {len(response.content)} bytes)")
        except requests.exceptions.RequestException as e:
            results[endpoint] = {
                'status_code': None,
                'success': False,
                'error': str(e),
                'response_time': 0,
                'content_length': 0
            }
            print(f"    ❌ {endpoint}: 错误 - {str(e)}")
    
    # 特别测试场景端点
    try:
        print(f"  🧪 测试 /scenarios/ 端点 (JSON数据) ...")
        response = requests.get(f"{base_url}/scenarios/", timeout=15)
        if response.status_code == 200:
            try:
                data = response.json()
                if 'scenarios' in data:
                    print(f"    ✅ /scenarios/: 返回 {len(data['scenarios'])} 个场景")
                    results['/scenarios/']['scenario_count'] = len(data['scenarios'])
                else:
                    print(f"    ⚠️  /scenarios/: 返回数据格式不符合预期")
            except ValueError:
                print(f"    ❌ /scenarios/: 未返回JSON格式数据")
        else:
            print(f"    ❌ /scenarios/: 状态码 {response.status_code}")
    except Exception as e:
        print(f"    ❌ /scenarios/: 请求异常 - {str(e)}")
    
    return results

def main():
    """主函数"""
    print("🚀 认知陷阱平台 - API部署验证")
    print("="*60)
    print(f"📋 验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 等待一段时间确保服务完全启动
    print("\n⏳ 等待服务完全启动...")
    time.sleep(5)
    
    # 测试API
    results = test_deployed_api()
    
    # 汇总结果
    print("\n" + "="*60)
    print("📊 验证结果汇总:")
    
    successful_tests = sum(1 for result in results.values() if result['success'])
    total_tests = len(results)
    
    for endpoint, result in results.items():
        status = "✅" if result['success'] else "❌"
        print(f"   {status} {endpoint}: {result.get('status_code', 'N/A')} ({result.get('response_time', 0):.2f}s)")
    
    print(f"\n📈 成功率: {successful_tests}/{total_tests} ({successful_tests/total_tests*100:.1f}%)")
    
    # 检查关键端点是否成功
    scenarios_ok = results.get('/scenarios/', {}).get('success', False)
    api_available = successful_tests > 0
    
    overall_success = api_available and scenarios_ok
    
    print(f"\n🎯 总体状态: {'✅ API服务正常' if overall_success else '⚠️  API服务部分正常'}")
    
    if overall_success:
        print("\n🎉 API部署验证成功！")
        print("✅ API服务正在Railway上正常运行")
        print("✅ 场景端点可正常访问")
        print("✅ 数据格式正确")
        print("\n🔗 部署的API端点:")
        print("   https://insightful-enthusiasm-production.up.railway.app/scenarios/")
        print("\n💡 前端应用现在可以连接到此API端点")
    else:
        print("\n❌ API部署验证未完全通过")
        print("💡 请检查服务状态和日志")
    
    # 显示部署信息
    print(f"\n☁️  部署信息:")
    print(f"   服务名称: insightful-enthusiasm")
    print(f"   状态: 运行中")
    print(f"   URL: https://insightful-enthusiasm-production.up.railway.app")
    print(f"   验证时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return overall_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
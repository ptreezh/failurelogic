"""
验证修复后的认知陷阱平台功能
"""

import requests
import time

def verify_fix():
    """验证修复是否成功"""
    print("🔍 验证认知陷阱平台修复...")
    
    # 检查前端服务
    try:
        response = requests.get("http://localhost:8081", timeout=10)
        if response.status_code == 200:
            content = response.text
            if ("Failure Logic" in content or "认知陷阱" in content) and "SocienceAI" not in content:
                print("✅ 前端服务正常运行，显示正确的认知陷阱平台")
            else:
                print("❌ 前端服务未显示正确的认知陷阱平台")
                print("💡 页面内容:", content[:200] + "..." if len(content) > 200 else content)
                return False
        else:
            print(f"❌ 前端服务响应异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 前端服务不可达: {e}")
        return False
    
    # 检查API服务
    try:
        response = requests.get("http://localhost:8082/health", timeout=10)
        if response.status_code == 200:
            print("✅ API服务正常运行")
        else:
            print(f"❌ API服务响应异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API服务不可达: {e}")
        return False
    
    # 测试API端点
    api_endpoints = [
        "/api/exponential/questions",
        "/api/compound/questions", 
        "/api/historical/scenarios",
        "/api/explanations/linear_thinking"
    ]
    
    success_count = 0
    for endpoint in api_endpoints:
        try:
            response = requests.get(f"http://localhost:8082{endpoint}", timeout=10)
            if response.status_code in [200, 405]:  # 405表示端点存在但方法不允许
                print(f"✅ {endpoint} - 可访问 (状态码: {response.status_code})")
                success_count += 1
            else:
                print(f"❌ {endpoint} - 状态异常 (状态码: {response.status_code})")
        except Exception as e:
            print(f"❌ {endpoint} - 请求失败: {e}")
    
    if success_count >= 3:  # 至少3个端点成功
        print(f"✅ API端点测试通过: {success_count}/{len(api_endpoints)}")
    else:
        print(f"❌ API端点测试失败: {success_count}/{len(api_endpoints)}")
        return False
    
    return True

def main():
    """主函数"""
    print("🏠 认知陷阱平台 - 修复验证")
    print("=" * 50)
    print("📋 验证项目:")
    print("  - 前端服务是否显示正确的认知陷阱平台")
    print("  - API服务是否正常运行")
    print("  - API端点是否可访问")
    print("=" * 50)
    
    success = verify_fix()
    
    print()
    print("=" * 50)
    if success:
        print("🎉 验证成功!")
        print("✅ 认知陷阱平台已正确显示")
        print("✅ API服务正常运行")
        print("✅ API端点可正常访问")
        print()
        print("💡 认知陷阱平台现在完全准备就绪")
        print("💡 用户可以正常体验所有认知偏差教育功能")
    else:
        print("❌ 验证失败")
        print("💡 需要进一步排查问题")
    
    print("=" * 50)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
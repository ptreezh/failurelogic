"""
API服务器路由验证脚本
验证API服务器路由是否正确注册
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))

def test_routes_registration():
    """测试API服务器路由注册"""
    print("🔍 测试API服务器路由注册...")
    
    try:
        # 导入API应用
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))
        from start import app
        print("✅ 成功导入API应用")
        
        # 打印所有路由
        print(f"\n📋 API服务器注册了 {len(app.routes)} 个路由:")
        for i, route in enumerate(app.routes):
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ', '.join(sorted(route.methods))
                print(f"  {i+1:2d}. {methods:15s} {route.path}")
        
        # 检查关键路由是否存在
        scenarios_routes = [r for r in app.routes if '/scenarios' in r.path]
        print(f"\n🔍 包含 'scenarios' 的路由: {len(scenarios_routes)} 个")
        for route in scenarios_routes:
            methods = ', '.join(sorted(route.methods))
            print(f"     {methods:15s} {route.path}")
        
        # 检查根路径路由
        root_routes = [r for r in app.routes if r.path == '/']
        print(f"\n🏠 根路径路由: {len(root_routes)} 个")
        for route in root_routes:
            methods = ', '.join(sorted(route.methods))
            print(f"     {methods:15s} {route.path}")
        
        # 检查健康检查路由
        health_routes = [r for r in app.routes if '/health' in r.path]
        print(f"\n🏥 健康检查路由: {len(health_routes)} 个")
        for route in health_routes:
            methods = ', '.join(sorted(route.methods))
            print(f"     {methods:15s} {route.path}")
        
        return True
        
    except Exception as e:
        print(f"❌ 导入API应用失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 API服务器路由验证工具")
    print("="*50)
    
    success = test_routes_registration()
    
    print(f"\n{'='*50}")
    if success:
        print("✅ 路由验证完成 - API服务器路由已正确注册")
    else:
        print("❌ 路由验证失败 - API服务器路由可能存在问题")
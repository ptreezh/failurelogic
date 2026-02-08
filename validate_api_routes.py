"""
API端点验证和修复脚本
验证API服务器端点是否正确注册并修复问题
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))

def validate_api_routes():
    """验证API路由是否正确注册"""
    print("🔍 验证API服务器路由注册...")
    
    try:
        from start import app
        print("✅ 成功导入API应用")
        
        print(f"路由总数: {len(app.routes)}")
        
        # 检查关键端点
        endpoints_to_check = [
            "/scenarios/",
            "/scenarios/{scenario_id}",
            "/scenarios/create_game_session",
            "/scenarios/{game_id}/turn",
            "/health",
            "/api/interactive/chat",
            "/api/interactive/analyze-decision",
            "/api/interactive/guided-tour",
            "/api/interactive/personalized-feedback"
        ]
        
        print("\n📋 检查关键端点:")
        for endpoint in endpoints_to_check:
            found = any(route.path == endpoint or 
                       (hasattr(route, 'prefix') and endpoint.startswith(route.prefix)) or
                       endpoint.replace('/api', '') == route.path
                       for route in app.routes)
            
            status = "✅" if found else "❌"
            print(f"  {status} {endpoint}")
        
        # 检查所有路由
        print(f"\n📊 所有已注册路由 ({len(app.routes)} 个):")
        for i, route in enumerate(app.routes):
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ', '.join(sorted(list(route.methods))) if hasattr(route, 'methods') and isinstance(route.methods, (list, set)) else str(getattr(route, 'methods', 'UNKNOWN'))
                print(f"  {i+1:2d}. {methods:20s} {route.path}")
            else:
                route_type = type(route).__name__
                path = getattr(route, 'path', 'Unknown') if hasattr(route, 'path') else 'Unknown'
                print(f"  {i+1:2d}. {route_type:20s} {path}")
        
        return True
        
    except Exception as e:
        print(f"❌ 验证失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("🚀 API端点验证工具")
    print("="*50)
    
    success = validate_api_routes()
    
    print(f"\n{'='*50}")
    if success:
        print("✅ API路由验证完成")
        print("💡 如果部署环境中端点仍返回404，可能是部署配置问题")
    else:
        print("❌ API路由验证失败")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
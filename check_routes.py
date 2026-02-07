"""
检查API服务器路由注册
"""
import sys
import os
import json

# 添加项目路径
project_dir = r"D:\AIDevelop\failureLogic"
api_server_dir = os.path.join(project_dir, "api-server")
sys.path.insert(0, api_server_dir)

try:
    from start import app
    print(f"✅ 成功导入API应用")
    print(f"路由总数: {len(app.routes)}")
    
    print("\n路由列表:")
    for i, route in enumerate(app.routes):
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ','.join(sorted(list(route.methods))) if hasattr(route, 'methods') and isinstance(route.methods, (list, set)) else str(getattr(route, 'methods', 'UNKNOWN'))
            print(f"{i+1:2d}. {methods:20s} {route.path}")
        else:
            route_type = type(route).__name__
            path = getattr(route, 'path', 'Unknown') if hasattr(route, 'path') else 'Unknown'
            print(f"{i+1:2d}. {route_type:20s} {path}")
    
    print("\n按路径排序的路由:")
    sorted_routes = sorted(app.routes, key=lambda r: getattr(r, 'path', ''))
    for i, route in enumerate(sorted_routes):
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ','.join(sorted(list(route.methods))) if hasattr(route, 'methods') and isinstance(route.methods, (list, set)) else str(getattr(route, 'methods', 'UNKNOWN'))
            print(f"{i+1:2d}. {methods:20s} {route.path}")
        else:
            route_type = type(route).__name__
            path = getattr(route, 'path', 'Unknown') if hasattr(route, 'path') else 'Unknown'
            print(f"{i+1:2d}. {route_type:20s} {path}")

except Exception as e:
    print(f"❌ 导入API应用失败: {e}")
    import traceback
    traceback.print_exc()
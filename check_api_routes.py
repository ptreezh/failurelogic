"""
API服务器路由验证脚本
验证API服务器的路由是否正确注册
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api-server'))

try:
    from start import app
    print("✅ 成功导入API应用")
    
    # 打印所有注册的路由
    print("\n📋 已注册的API路由:")
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(sorted(route.methods))
            print(f"  {methods:15} {route.path}")
    
    print(f"\n📊 总共注册了 {len([r for r in app.routes if hasattr(r, 'path')])} 个路由")
    
    # 检查特定路由是否存在
    scenarios_routes = [r for r in app.routes if '/scenarios' in r.path]
    print(f"\n🔍 包含 'scenarios' 的路由: {len(scenarios_routes)} 个")
    for route in scenarios_routes:
        methods = ', '.join(sorted(route.methods))
        print(f"  {methods:15} {route.path}")
        
except Exception as e:
    print(f"❌ 导入API应用失败: {e}")
    import traceback
    traceback.print_exc()
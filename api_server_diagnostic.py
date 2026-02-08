"""
部署环境路由注册诊断工具
用于检查FastAPI路由在部署环境中是否正确注册
"""

import os
import sys

# 添加项目路径
project_root = os.path.dirname(os.path.abspath(__file__))
api_server_path = os.path.join(project_root, 'api-server')
sys.path.insert(0, api_server_path)

def check_routes_in_deployment_env():
    """检查部署环境中的路由注册"""
    print("🔍 检查部署环境中的路由注册...")
    
    # 检查路径是否存在
    if not os.path.exists(api_server_path):
        print(f"❌ API服务器路径不存在: {api_server_path}")
        return False
    
    try:
        # 导入API应用
        sys.path.insert(0, api_server_path)  # 确保API服务器路径在Python路径中
        os.chdir(api_server_path)  # 切换到API服务器目录
        from start import app
        print(f"✅ 成功导入FastAPI应用")
        print(f"   应用标题: {app.title}")
        print(f"   路由数量: {len(app.routes)}")
        
        # 检查特定路由是否存在
        routes_info = []
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                methods = ', '.join(list(route.methods)) if hasattr(route, 'methods') and isinstance(route.methods, (list, set)) else str(getattr(route, 'methods', 'UNKNOWN'))
                routes_info.append({'path': route.path, 'methods': methods})
            else:
                routes_info.append({'path': getattr(route, 'path', 'Unknown'), 'methods': 'MOUNT/MIDDLEWARE'})
        
        print(f"\n📋 已注册路由列表:")
        for i, route in enumerate(routes_info, 1):
            print(f"  {i:2d}. {route['methods']:20s} {route['path']}")
        
        # 检查关键路由
        critical_routes = [
            '/scenarios/',
            '/scenarios/{scenario_id}',
            '/api/interactive/chat',
            '/health',
            '/docs',
            '/openapi.json'
        ]
        
        print(f"\n🎯 关键路由检查:")
        for route_path in critical_routes:
            found = any(r['path'] == route_path for r in routes_info)
            status = "✅" if found else "❌"
            print(f"  {status} {route_path}")
        
        # 检查通配符路由位置
        wildcard_routes = [r for r in routes_info if '{' in r['path'] and '}' in r['path']]
        print(f"\n🔍 通配符路由检查:")
        for route in wildcard_routes:
            print(f"  ⚠️  {route['methods']:20s} {route['path']}")
            if route['path'] == '/{full_path:path}':
                print(f"     这是通配符路由，应放在最后")
        
        # 检查路由顺序
        all_paths = [r['path'] for r in routes_info]
        wildcard_idx = -1
        api_idx = -1
        for i, path in enumerate(all_paths):
            if path == '/{full_path:path}':
                wildcard_idx = i
            elif path == '/scenarios/':
                api_idx = i
        
        if wildcard_idx != -1 and api_idx != -1:
            if api_idx > wildcard_idx:
                print(f"✅ API路由({api_idx})在通配符路由({wildcard_idx})之后 - 顺序正确")
            else:
                print(f"❌ API路由({api_idx})在通配符路由({wildcard_idx})之前 - 顺序错误")
        
        return True
        
    except Exception as e:
        print(f"❌ 检查路由时出错: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_module_imports():
    """检查模块导入"""
    print(f"\n🔍 检查模块导入...")
    
    modules_to_check = [
        ('start', 'app'),
        ('endpoints.interactive', 'router'),
        ('utils.error_handlers', 'global_exception_handler'),
        ('pydantic', 'BaseModel'),
        ('fastapi', 'FastAPI'),
        ('uvicorn', 'run')
    ]
    
    for module_name, attr_name in modules_to_check:
        try:
            module = __import__(module_name, fromlist=[attr_name])
            if hasattr(module, attr_name):
                print(f"✅ {module_name}.{attr_name}")
            else:
                print(f"⚠️  {module_name} (no {attr_name})")
        except ImportError as e:
            print(f"❌ {module_name}: {e}")
        except Exception as e:
            print(f"⚠️  {module_name}: {e}")

def main():
    """主函数"""
    print("🚀 认知陷阱平台 - 部署环境路由诊断")
    print("="*60)
    
    success1 = check_routes_in_deployment_env()
    check_module_imports()
    
    print(f"\n{'='*60}")
    if success1:
        print("✅ 路由注册检查完成")
        print("💡 如果本地检查通过但部署环境失败，可能是部署配置问题")
    else:
        print("❌ 路由注册检查失败")
        print("🔧 需要修复路由注册问题")
    
    return success1

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
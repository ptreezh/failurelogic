#!/usr/bin/env python3
"""
测试认知陷阱API服务器端点
"""
import sys
import os

# 切换到正确的目录
original_dir = os.getcwd()
api_server_dir = os.path.join(os.path.dirname(__file__), 'api-server')
os.chdir(api_server_dir)

# 检查assets目录是否存在
if not os.path.exists("../assets"):
    print("警告: ../assets目录不存在，可能会导致错误")
    # 创建一个临时的assets目录以允许模块加载
    os.makedirs("../assets", exist_ok=True)

sys.path.insert(0, ".")

# 从start.py导入app对象
import importlib.util
spec = importlib.util.spec_from_file_location("start", "start.py")
start_module = importlib.util.module_from_spec(spec)

# 运行模块但捕获app对象
try:
    spec.loader.exec_module(start_module)
    # 获取app对象
    app = start_module.app

    # 检查API路由
    print("正在检查API路由...")
    routes = [route.path for route in app.routes]
    print(f"可用路由数量: {len(routes)}")
    print("前10个路由:")
    for i, route in enumerate(app.routes[:10]):
        print(f"  {i+1}. {route.path} - {route.methods}")

    # 检查是否包含认知测试相关路由
    cognitive_routes = [route for route in app.routes if 'cognitive' in route.path.lower() or 'exponential' in route.path.lower() or 'compound' in route.path.lower() or 'historical' in route.path.lower() or 'game' in route.path.lower()]
    print(f"\n认知测试相关路由数量: {len(cognitive_routes)}")
    for route in cognitive_routes:  # 显示所有认知相关路由
        print(f"  - {route.path} - {route.methods}")

except Exception as e:
    print(f"加载模块时发生错误: {e}")
    import traceback
    traceback.print_exc()
finally:
    # 恢复原始目录
    os.chdir(original_dir)
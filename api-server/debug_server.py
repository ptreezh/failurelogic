"""
调试版API服务器启动脚本
用于诊断部署环境中的路由注册问题
"""

import sys
import os
import logging

# 添加项目路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
api_server_path = os.path.join(project_root, 'api-server')
sys.path.insert(0, api_server_path)

# 设置详细日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

logger.info("=== API服务器启动调试 ===")
logger.info(f"当前工作目录: {os.getcwd()}")
logger.info(f"Python路径: {sys.path[:3]}...")

try:
    # 检查start.py文件是否存在
    start_py_path = os.path.join(api_server_path, 'start.py')
    logger.info(f"检查start.py文件: {start_py_path}")
    logger.info(f"文件存在: {os.path.exists(start_py_path)}")
    
    # 检查API服务器目录内容
    logger.info(f"API服务器目录内容: {os.listdir(api_server_path)}")
    
    # 导入API应用
    logger.info("开始导入start模块...")
    from start import app
    logger.info("✅ 成功导入app模块")
    
    # 输出路由数量和列表
    logger.info(f"路由总数: {len(app.routes)}")
    for i, route in enumerate(app.routes):
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(sorted(list(route.methods))) if hasattr(route, 'methods') else 'UNKNOWN'
            logger.info(f"  路由 {i+1}: {methods} -> {route.path}")
        else:
            logger.info(f"  路由 {i+1}: {type(route).__name__} -> {getattr(route, 'path', 'Unknown')}")
    
    # 检查关键路由是否存在
    critical_routes = ['/scenarios/', '/health', '/docs', '/openapi.json']
    for route_path in critical_routes:
        found = any(getattr(r, 'path', '') == route_path for r in app.routes if hasattr(r, 'path'))
        status = "✅" if found else "❌"
        logger.info(f"  {status} 关键路由 {route_path}")
    
    import uvicorn
    logger.info("✅ 成功导入uvicorn")
    
    # 使用环境变量中的端口
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"🚀 启动服务器，端口: {port}")
    
    # 启动服务器
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")

except Exception as e:
    logger.error(f"❌ 服务器启动失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
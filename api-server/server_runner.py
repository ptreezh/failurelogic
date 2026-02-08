#!/usr/bin/env python3
"""
Script to run the API server
"""
import sys
import os

# 修复部署环境中的路径问题
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import logging

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()  # 加载 .env 文件

# Set up detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

try:
    logger.info("Setting up Python path...")
    api_server_path = os.path.dirname(os.path.abspath(__file__))
    if api_server_path not in sys.path:
        sys.path.insert(0, api_server_path)
    logger.info(f"Added to path: {api_server_path}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"API server directory exists: {os.path.exists(api_server_path)}")
    
    # 检查start.py文件是否存在
    start_py_path = os.path.join(api_server_path, 'start.py')
    logger.info(f"Checking start.py file: {start_py_path}")
    logger.info(f"start.py exists: {os.path.exists(start_py_path)}")
    
    logger.info("Importing start module...")
    from start import app
    logger.info("Successfully imported app")
    
    # 输出路由信息
    logger.info(f"Total routes registered: {len(app.routes)}")
    for i, route in enumerate(app.routes):
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(sorted(list(route.methods))) if hasattr(route, 'methods') and isinstance(route.methods, (list, set)) else str(getattr(route, 'methods', 'UNKNOWN'))
            logger.info(f"  Route {i+1:2d}: {methods:20s} {route.path}")
        else:
            logger.info(f"  Route {i+1:2d}: {type(route).__name__:20s} {getattr(route, 'path', 'Unknown')}")
    
    # 检查关键路由是否存在
    critical_routes = ['/scenarios/', '/health', '/docs', '/openapi.json']
    for route_path in critical_routes:
        found = any(getattr(r, 'path', '') == route_path for r in app.routes if hasattr(r, 'path'))
        status = "✅" if found else "❌"
        logger.info(f"  {status} Critical route {route_path}: {'Found' if found else 'Missing'}")
    
    logger.info("Importing uvicorn...")
    import uvicorn
    logger.info("Successfully imported uvicorn")

    # 使用环境变量中的端口，这对于Railway部署很重要
    port = int(os.environ.get("PORT", 8082))
    logger.info(f"Starting server on port {port}...")
    logger.info(f"Server will listen on http://0.0.0.0:{port}")
    
    # 启动服务器
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")

except Exception as e:
    logger.error(f"Error running server: {e}")
    import traceback
    traceback.print_exc()
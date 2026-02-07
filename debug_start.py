#!/usr/bin/env python3
"""
调试版API服务器启动脚本 - 用于Railway部署
"""
import sys
import os
import logging

# 设置详细日志 - 使用StreamHandler确保输出到控制台
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)  # 确保日志输出到控制台
    ]
)
logger = logging.getLogger(__name__)

# 立即输出调试信息
logger.info("=========================================")
logger.info("API服务器启动脚本开始执行")
logger.info(f"当前工作目录: {os.getcwd()}")
logger.info(f"脚本位置: {os.path.abspath(__file__)}")
logger.info(f"Python版本: {sys.version}")
logger.info(f"环境变量PORT: {os.environ.get('PORT', 'Not set')}")
logger.info("=========================================")

try:
    # 确定api-server目录路径
    current_dir = os.path.dirname(os.path.abspath(__file__))
    api_server_dir = os.path.join(current_dir, 'api-server')
    
    logger.info(f"API服务器目录: {api_server_dir}")
    logger.info(f"API服务器目录是否存在: {os.path.exists(api_server_dir)}")
    
    # 检查start.py文件是否存在
    start_py_path = os.path.join(api_server_dir, 'start.py')
    logger.info(f"start.py路径: {start_py_path}")
    logger.info(f"start.py文件是否存在: {os.path.exists(start_py_path)}")
    
    # 添加API服务器目录到Python路径
    if api_server_dir not in sys.path:
        sys.path.insert(0, api_server_dir)
    
    # 改变工作目录到api-server
    os.chdir(api_server_dir)
    logger.info(f"已改变工作目录到: {os.getcwd()}")

    logger.info("开始导入API应用...")
    
    # 使用绝对导入
    import sys
    sys.path.insert(0, os.getcwd())
    
    from start import app
    logger.info("✅ 成功导入API应用")
    
    # 调试：打印路由数量和前几个路由
    logger.info(f"路由总数: {len(app.routes)}")
    for i, route in enumerate(app.routes[:20]):  # 打印前20个路由
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            methods = ', '.join(sorted(route.methods))
            logger.info(f"  路由 {i+1:2d}: {methods:15s} {route.path}")
        else:
            logger.info(f"  路由 {i+1:2d}: {str(route)[:50]}...")

    import uvicorn
    logger.info("✅ 成功导入uvicorn")
    
    # 使用环境变量中的端口
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"🚀 启动服务器，端口: {port}")
    
    # 启动服务器
    logger.info("开始运行Uvicorn服务器...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="debug")

except ImportError as ie:
    logger.error(f"❌ 导入错误: {ie}")
    logger.error(f"Python路径: {sys.path}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    logger.error(f"❌ 服务器启动失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
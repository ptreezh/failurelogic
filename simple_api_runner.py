#!/usr/bin/env python3
"""
简化的API服务器启动脚本 - 用于Railway部署
"""
import sys
import os
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    # 添加项目路径
    project_root = os.path.dirname(os.path.abspath(__file__))
    api_server_path = os.path.join(project_root, 'api-server')
    
    if api_server_path not in sys.path:
        sys.path.insert(0, api_server_path)
    
    logger.info(f"API服务器路径: {api_server_path}")
    logger.info(f"当前工作目录: {os.getcwd()}")
    
    # 验证路径
    if not os.path.exists(api_server_path):
        raise FileNotFoundError(f"API服务器目录不存在: {api_server_path}")
    
    # 切换到api-server目录
    os.chdir(api_server_path)
    logger.info(f"已切换到: {os.getcwd()}")
    
    # 导入并启动应用
    logger.info("正在导入start模块...")
    from start import app
    logger.info("✅ 成功导入应用")
    
    import uvicorn
    logger.info("✅ 成功导入uvicorn")
    
    # 使用环境变量中的端口
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"🚀 启动服务器，端口: {port}")
    
    # 启动服务器
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

except Exception as e:
    logger.error(f"❌ 服务器启动失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
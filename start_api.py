#!/usr/bin/env python3
"""
API服务器启动脚本 - 用于Railway部署
"""
import sys
import os
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 添加项目路径
project_root = os.path.dirname(os.path.abspath(__file__))
api_server_path = os.path.join(project_root, 'api-server')
sys.path.insert(0, api_server_path)

logger.info("开始导入API服务器模块...")

try:
    # 导入API应用 - 不改变工作目录，使用正确路径导入
    import sys
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    api_server_dir = os.path.join(current_dir, 'api-server')
    sys.path.insert(0, api_server_dir)
    
    from start import app
    logger.info("✅ 成功导入API应用")
    
    import uvicorn
    logger.info("✅ 成功导入uvicorn")
    
    # 使用环境变量中的端口
    port = int(os.environ.get("PORT", 8082))
    logger.info(f"🚀 启动服务器，端口: {port}")
    
    # 启动服务器
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    
except Exception as e:
    logger.error(f"❌ 服务器启动失败: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
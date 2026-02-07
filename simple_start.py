#!/usr/bin/env python3
"""
简单API服务器启动脚本 - 用于Railway部署
"""
import sys
import os
import logging

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    # 直接在api-server目录中运行
    api_server_dir = os.path.join(os.path.dirname(__file__), 'api-server')
    os.chdir(api_server_dir)
    
    # 添加当前目录到Python路径
    sys.path.insert(0, api_server_dir)
    
    logger.info("当前工作目录: " + os.getcwd())
    logger.info("导入API应用...")
    
    from start import app
    logger.info("✅ 成功导入API应用")
    
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
#!/usr/bin/env python3
"""
Script to run the API server
"""
import sys
import os
import logging

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    logger.info("Importing start module...")
    from start import app
    logger.info("Successfully imported app")
    
    logger.info("Importing uvicorn...")
    import uvicorn
    logger.info("Successfully imported uvicorn")
    
    # 使用环境变量中的端口，这对于Railway部署很重要
    port = int(os.environ.get("PORT", 8082))
    logger.info(f"Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
    
except Exception as e:
    logger.error(f"Error running server: {e}")
    import traceback
    traceback.print_exc()
#!/usr/bin/env python3
"""
Debug server startup script
"""
import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    logger.info("Starting server initialization...")
    
    # Import the app
    logger.info("Importing start module...")
    from start import app
    logger.info("App imported successfully")
    
    # Import uvicorn
    logger.info("Importing uvicorn...")
    import uvicorn
    logger.info("Uvicorn imported successfully")
    
    # Start the server
    logger.info("Starting server on port 8082...")
    uvicorn.run(app, host="0.0.0.0", port=8082, log_level="debug")
    
except Exception as e:
    logger.error(f"Error starting server: {e}", exc_info=True)
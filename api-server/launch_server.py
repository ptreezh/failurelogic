#!/usr/bin/env python3
"""
Server startup script for the cognitive traps platform
"""
import sys
import os
import time
import threading
import requests
from urllib3.exceptions import ConnectionError

# Add the current directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def start_server():
    """Function to start the server"""
    try:
        from start import app
        import uvicorn
        
        print("Starting cognitive traps platform API server on port 8082...")
        uvicorn.run(app, host="0.0.0.0", port=8082, log_level="info")
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()

def check_server_health():
    """Function to check if server is running"""
    url = "http://localhost:8082/health"
    timeout = 30  # seconds
    interval = 1  # second
    
    print("Waiting for server to start...")
    for i in range(timeout):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✓ Server is running! Health check passed.")
                print(f"✓ API available at: http://localhost:8082")
                print(f"✓ API docs available at: http://localhost:8082/docs")
                return True
        except (requests.ConnectionError, requests.ConnectTimeout):
            pass
        
        time.sleep(interval)
        print(".", end="", flush=True)
    
    print(f"\n✗ Server did not start within {timeout} seconds.")
    return False

if __name__ == "__main__":
    # Start the server in a separate thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait a moment for the server to begin starting
    time.sleep(2)
    
    # Check if the server becomes available
    if check_server_health():
        print("\nThe cognitive traps platform API server is now running on port 8082!")
        print("Press Ctrl+C to stop the server.")
        
        # Keep the main thread alive
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down server...")
            sys.exit(0)
    else:
        print("\nFailed to start the server.")
        sys.exit(1)
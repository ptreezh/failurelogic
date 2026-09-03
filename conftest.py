"""Pytest configuration for Failure Logic backend."""
import os
import sys

# Add api-server to path so tests can `import logic.X`
_HERE = os.path.dirname(__file__)
_API_SERVER = os.path.join(_HERE, "api-server")
if _API_SERVER not in sys.path:
    sys.path.insert(0, _API_SERVER)

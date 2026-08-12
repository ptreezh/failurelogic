@echo off
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo API server skipped - Python not available
    exit /b 0
)
echo Starting API server on port 8000...
python ..\api-server\start.py 8000

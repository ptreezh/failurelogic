@echo off
REM 安装Playwright依赖和浏览器
echo Installing Playwright browsers...
playwright install chromium
playwright install msedge

REM 运行并发测试智能体
echo Running concurrent E2E test agents...
python run_concurrent_agents.py

pause
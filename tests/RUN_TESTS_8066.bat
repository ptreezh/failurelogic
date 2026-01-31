@echo off
echo Running Playwright Tests with Port 8066
echo ====================================
cd tests

echo Stopping any existing servers...
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul

echo.
echo Starting API Server on port 8066...
start /B python ..\api-server\start.py 8066

echo Waiting for API to start...
timeout /t 5 /nobreak

echo.
echo Starting Playwright tests...
npx playwright test real-app-tests-fixed-v2.spec.js --project=msedge --reporter=line

echo.
echo Tests completed!
echo Check results at: tests\playwright-report\index.html
echo.
pause
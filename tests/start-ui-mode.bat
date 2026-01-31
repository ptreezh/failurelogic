@echo off
echo Starting Playwright UI Mode for Cognitive Trap Platform
echo.

REM Change to tests directory
cd /d "%~dp0"

echo Checking prerequisites...
call npm list @playwright/test >nul 2>&1
if errorlevel 1 (
    echo Installing Playwright...
    call npm install
    call npx playwright install
)

echo.
echo Starting Playwright UI Mode...
echo.
echo This will:
echo 1. Start backend API on port 8000
echo 2. Start frontend on port 3000
echo 3. Launch Playwright Test UI
echo.
echo Press Ctrl+C to stop the tests
echo.

REM Start Playwright in UI mode
call npx playwright test --ui

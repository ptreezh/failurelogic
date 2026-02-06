@echo off
REM Qwen Superpowers Installation Script for Windows

echo Installing Qwen Superpowers...

REM Check if running in the correct directory
if not exist "skills" (
  echo Error: skills directory not found in current directory.
  echo Please run this script from the qwen-superpowers directory.
  exit /b 1
)

REM Try to determine the Qwen config directory
set QWEN_CONFIG_DIR=%USERPROFILE%\.qwen

echo Using Qwen config directory: %QWEN_CONFIG_DIR%

REM Create the skills directory if it doesn't exist
if not exist "%QWEN_CONFIG_DIR%" (
  echo Creating Qwen config directory...
  mkdir "%QWEN_CONFIG_DIR%"
)

if not exist "%QWEN_CONFIG_DIR%\skills" (
  echo Creating skills directory...
  mkdir "%QWEN_CONFIG_DIR%\skills"
)

REM Copy all skills to the Qwen skills directory
echo Copying skills to Qwen configuration...
xcopy /E /I /Y "skills" "%QWEN_CONFIG_DIR%\skills"

echo.
echo Qwen Superpowers installed successfully!
echo.
echo The following skills are now available:
echo.  - advanced-planning
echo.  - code-analysis
echo.  - system-automation
echo.  - research-assistant
echo.
echo To use these skills, restart your Qwen environment.
echo You can reference specific skills in your prompts, for example:
echo.  - "Use advanced-planning to organize this task"
echo.  - "Apply code-analysis techniques to understand this codebase"
echo.
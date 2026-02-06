@echo off
REM Qwen Superpowers Hooks Installation Script for Windows

echo Installing Qwen Superpowers Hooks...

REM Try to determine the Qwen config directory
set QWEN_CONFIG_DIR=%USERPROFILE%\.qwen

echo Using Qwen config directory: %QWEN_CONFIG_DIR%

REM Create the hooks directory if it doesn't exist
if not exist "%QWEN_CONFIG_DIR%\hooks" (
  echo Creating hooks directory...
  mkdir "%QWEN_CONFIG_DIR%\hooks"
)

REM Copy hook configuration files to the Qwen hooks directory
echo Copying hooks configuration to Qwen...
copy "hooks\CONTEXT_INJECTION_HOOKS.md" "%QWEN_CONFIG_DIR%\hooks\CONTEXT_INJECTION_HOOKS.md"
copy "hooks\HOOKS_CONFIG.md" "%QWEN_CONFIG_DIR%\hooks\HOOKS_CONFIG.md"

echo.
echo Qwen Superpowers Hooks installed successfully!
echo.
echo The following hook configurations are now available:
echo.  - Context Injection Hooks
echo.  - Automatic Context Injection Configurations
echo.
echo To use these hooks, restart your Qwen environment.
echo The hooks will automatically monitor conversations and inject relevant context.
echo.
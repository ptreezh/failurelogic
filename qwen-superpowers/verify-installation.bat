@echo off
REM Qwen Superpowers Verification Script for Windows

echo Verifying Qwen Superpowers Installation...

REM Check if skills are installed
echo.
echo Checking skills installation...
if exist "%USERPROFILE%\.qwen\skills\advanced-planning\SKILL.md" (
  echo   [OK] Advanced Planning skill found
) else (
  echo   [MISSING] Advanced Planning skill
)

if exist "%USERPROFILE%\.qwen\skills\code-analysis\SKILL.md" (
  echo   [OK] Code Analysis skill found
) else (
  echo   [MISSING] Code Analysis skill
)

if exist "%USERPROFILE%\.qwen\skills\system-automation\SKILL.md" (
  echo   [OK] System Automation skill found
) else (
  echo   [MISSING] System Automation skill
)

if exist "%USERPROFILE%\.qwen\skills\research-assistant\SKILL.md" (
  echo   [OK] Research Assistant skill found
) else (
  echo   [MISSING] Research Assistant skill
)

if exist "%USERPROFILE%\.qwen\skills\planning-with-files\SKILL.md" (
  echo   [OK] Planning with Files skill found
) else (
  echo   [MISSING] Planning with Files skill
)

REM Check if hooks are installed
echo.
echo Checking hooks installation...
if exist "%USERPROFILE%\.qwen\hooks\CONTEXT_INJECTION_HOOKS.md" (
  echo   [OK] Context Injection Hooks found
) else (
  echo   [MISSING] Context Injection Hooks
)

if exist "%USERPROFILE%\.qwen\hooks\HOOKS_CONFIG.md" (
  echo   [OK] Hooks Configuration found
) else (
  echo   [MISSING] Hooks Configuration
)

echo.
echo Verification complete!
echo.
echo To use these features, restart your Qwen environment.
echo.
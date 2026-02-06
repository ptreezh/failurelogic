@echo off
REM Check task completion status script - Windows version

echo Checking task completion status...

REM Check if task_plan.md exists
if not exist task_plan.md (
  echo ERROR: task_plan.md does not exist. Please initialize planning files first.
  exit /b 1
)

REM Check if contains "**Status:** pending"
findstr /C:"**Status:** pending" task_plan.md > nul
set pending_found=%errorlevel%

REM Check if contains "**Status:** in_progress"
findstr /C:"**Status:** in_progress" task_plan.md > nul
set in_progress_found=%errorlevel%

REM If pending or in_progress is found, output warning
if %pending_found% EQU 0 (
  echo WARNING: There are incomplete phases in task_plan.md
  echo.
  echo Pending phases:
  findstr /C:"**Status:** pending" task_plan.md
  echo.
  echo Please complete all phases before finishing the task.
  exit /b 1
)

if %in_progress_found% EQU 0 (
  echo WARNING: There are in-progress phases in task_plan.md
  echo.
  echo In-progress phases:
  findstr /C:"**Status:** in_progress" task_plan.md
  echo.
  echo Please complete all phases before finishing the task.
  exit /b 1
)

echo SUCCESS: All phases in task_plan.md are marked as complete.
echo.
echo Remember to update progress.md with final results and findings.md with any final insights.
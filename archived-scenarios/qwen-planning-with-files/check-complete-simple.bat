@echo off
REM 简化的检查任务完成情况的脚本 - Windows版

echo Checking task completion status...

REM 检查 task_plan.md 是否存在
if not exist task_plan.md (
  echo ERROR: task_plan.md does not exist. Please initialize planning files first.
  exit /b 1
)

REM 检查是否包含 "Status: pending"
findstr /C:"Status: pending" task_plan.md > nul
set pending_found=%errorlevel%

REM 检查是否包含 "Status: in_progress"  
findstr /C:"Status: in_progress" task_plan.md > nul
set in_progress_found=%errorlevel%

REM 如果找到 pending 或 in_progress，则输出警告
if %pending_found% EQU 0 (
  echo WARNING: There are incomplete phases in task_plan.md
  echo.
  echo Pending phases:
  findstr /C:"Status: pending" task_plan.md
  echo.
  echo Please complete all phases before finishing the task.
  exit /b 1
)

if %in_progress_found% EQU 0 (
  echo WARNING: There are in-progress phases in task_plan.md
  echo.
  echo In-progress phases:
  findstr /C:"Status: in_progress" task_plan.md
  echo.
  echo Please complete all phases before finishing the task.
  exit /b 1
)

echo SUCCESS: All phases in task_plan.md are marked as complete.
echo.
echo Remember to update progress.md with final results and findings.md with any final insights.
@echo off
REM 检查任务完成情况的脚本 - Windows版

echo Checking task completion status...

REM 检查 task_plan.md 是否存在
if not exist task_plan.md (
  echo ERROR: task_plan.md does not exist. Please initialize planning files first.
  exit /b 1
)

REM 检查是否有未完成的阶段 (精确匹配整行)
findstr /R /C:"Status: pending" task_plan.md > nul
if %errorlevel% == 0 (
  echo WARNING: There are incomplete phases in task_plan.md
  echo.
  echo Pending phases:
  findstr /R /C:"Status: pending" task_plan.md
  echo.
  echo Please complete all phases before finishing the task.
  exit /b 1
)

REM 检查是否有进行中的阶段 (精确匹配整行)
findstr /R /C:"Status: in_progress" task_plan.md > nul
if %errorlevel% == 0 (
  echo WARNING: There are in-progress phases in task_plan.md
  echo.
  echo In-progress phases:
  findstr /R /C:"Status: in_progress" task_plan.md
  echo.
  echo Please complete all phases before finishing the task.
  exit /b 1
)

echo SUCCESS: All phases in task_plan.md are marked as complete.
echo.
echo Remember to update progress.md with final results and findings.md with any final insights.
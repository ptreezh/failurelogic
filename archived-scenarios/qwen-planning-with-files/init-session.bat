@echo off
REM 初始化规划文件的批处理脚本 - Windows版

echo Creating task_plan.md...
if not exist task_plan.md (
  echo # Task Plan > task_plan.md
  echo. >> task_plan.md
  echo ## Goal >> task_plan.md
  echo [Describe the main goal of this task] >> task_plan.md
  echo. >> task_plan.md
  echo ## Phases >> task_plan.md
  echo ### Phase 1: [Phase Name] >> task_plan.md
  echo - [ ] Task 1 >> task_plan.md
  echo - [ ] Task 2 >> task_plan.md
  echo - **Status:** pending >> task_plan.md
  echo. >> task_plan.md
  echo ### Phase 2: [Phase Name] >> task_plan.md
  echo - [ ] Task 1 >> task_plan.md
  echo - [ ] Task 2 >> task_plan.md
  echo - **Status:** pending >> task_plan.md
  echo. >> task_plan.md
  echo ## Technical Decisions >> task_plan.md
  echo ^| Decision ^| Rationale ^| >> task_plan.md
  echo ^|----------^|-----------^| >> task_plan.md
  echo. >> task_plan.md
  echo ## Errors Encountered >> task_plan.md
  echo ^| Error ^| Attempt ^| Resolution ^| >> task_plan.md
  echo ^|-------^|---------^|------------^| >> task_plan.md
  echo.
) else (
  echo task_plan.md already exists
)

echo Creating findings.md...
if not exist findings.md (
  echo # Research Findings > findings.md
  echo. >> findings.md
  echo ## Sources Consulted >> findings.md
  echo - [List sources here] >> findings.md
  echo. >> findings.md
  echo ## Key Insights >> findings.md
  echo - [List insights here] >> findings.md
  echo. >> findings.md
  echo ## Technical Decisions >> findings.md
  echo ^| Decision ^| Rationale ^| >> findings.md
  echo ^|----------^|-----------^| >> findings.md
  echo. >> findings.md
  echo ## Useful Resources >> findings.md
  echo - [List URLs, docs, references here] >> findings.md
  echo.
) else (
  echo findings.md already exists
)

echo Creating progress.md...
if not exist progress.md (
  echo # Progress Log > progress.md
  echo. >> progress.md
  echo ## Phase 1: [Name] >> progress.md
  echo ### Actions Taken >> progress.md
  echo ^| Action ^| Result ^| Files Modified ^| >> progress.md
  echo ^|--------^|--------^|----------------^| >> progress.md
  echo. >> progress.md
  echo ### Test Results >> progress.md
  echo ^| Test ^| Command ^| Result ^| >> progress.md
  echo ^|------^|---------^|--------^| >> progress.md
  echo. >> progress.md
  echo ### Error Log >> progress.md
  echo ^| Time ^| Error ^| Action Taken ^| >> progress.md
  echo ^|------^|-------^|--------------^| >> progress.md
  echo.
) else (
  echo progress.md already exists
)

echo Planning files initialized!
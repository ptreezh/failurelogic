@echo off
REM Batch script to run the scenario navigation and difficulty selector test

echo Starting Scenario Navigation and Difficulty Selector Test...
echo.

REM Navigate to the project directory
cd /d D:\AIDevelop\failureLogic

REM Run the test
python scenario_navigation_difficulty_test_spa.py

echo.
echo Test execution completed!
pause
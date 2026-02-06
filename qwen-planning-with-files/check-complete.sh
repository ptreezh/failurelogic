#!/bin/bash
# 检查任务完成情况的脚本 - Linux/macOS版

echo "Checking task completion status..."

# 检查 task_plan.md 是否存在
if [ ! -f task_plan.md ]; then
  echo "ERROR: task_plan.md does not exist. Please initialize planning files first."
  exit 1
fi

# 检查是否有未完成的阶段
if grep -q "Status: pending" task_plan.md; then
  echo "WARNING: There are incomplete phases in task_plan.md"
  echo
  echo "Pending phases:"
  grep "Status: pending" task_plan.md
  echo
  echo "Please complete all phases before finishing the task."
  exit 1
fi

if grep -q "Status: in_progress" task_plan.md; then
  echo "WARNING: There are in-progress phases in task_plan.md"
  echo
  echo "In-progress phases:"
  grep "Status: in_progress" task_plan.md
  echo
  echo "Please complete all phases before finishing the task."
  exit 1
fi

echo "SUCCESS: All phases in task_plan.md are marked as complete."
echo
echo "Remember to update progress.md with final results and findings.md with any final insights."
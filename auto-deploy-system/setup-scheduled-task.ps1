# 30小时自动验证任务配置
# 创建Windows计划任务

$taskName = "FailureLogic-AutoVerification"
$taskDescription = "每30小时自动验证FailureLogic部署状态并执行全场景测试"

# 删除旧任务（如果存在）
schtasks /delete /tn $taskName /f 2>$null

# 创建新任务
schtasks /create `
  -tn $taskName `
  -tr "node D:\AIDevelop\failureLogic\auto-deploy-system\auto-verifier.js" `
  -sc daily `
  -mo 30 `
  -st 00:00 `
  -ru SYSTEM `
  -rl HIGHEST `
  -f `
  -d $taskDescription

Write-Host "✅ 计划任务已创建: $taskName"
Write-Host "   执行频率: 每30小时"
Write-Host "   下次运行: $(Get-Date).AddHours(30)"

# 验证任务
schtasks /query /tn $taskName /fo list

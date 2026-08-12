@echo off
REM Railway 快速部署脚本
REM 一键部署 Failure Logic 到 Railway

echo ========================================
echo Railway 快速部署脚本
echo ========================================
echo.

REM 检查 Railway CLI
echo 检查 Railway CLI...
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI 未安装
    echo.
    echo 请先安装 Railway CLI:
    echo npm i -g @railway/cli
    echo.
    pause
    exit /b 1
)
echo ✅ Railway CLI 已安装
echo.

REM 检查登录状态
echo 检查登录状态...
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  未登录到 Railway
    echo.
    echo 请先登录:
    echo railway login
    echo.
    pause
    exit /b 1
)
echo ✅ 已登录到 Railway
echo.

REM 部署
echo ========================================
echo 开始部署到 Railway...
echo ========================================
echo.

echo 步骤 1: 连接到 Railway 项目...
railway connect >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  未找到 Railway 项目，创建新项目...
    railway init --name failure-logic-api
)

echo.
echo 步骤 2: 配置环境变量...
railway variables set PYTHON_VERSION=3.12
railway variables set PORT=8000
railway variables set PYTHONPATH=/app/api-server
echo ✅ 环境变量已配置

echo.
echo 步骤 3: 开始部署...
echo 这可能需要几分钟时间...
echo.

railway up

if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失败
    echo.
    echo 请查看错误信息并解决后重试
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 部署完成！
echo ========================================
echo.

echo 检查部署状态...
railway status

echo.
echo 📝 后续操作:
echo 1. 查看日志: railway logs
echo 2. 查看部署历史: railway deployments
echo 3. 测试 API: curl https://your-app.up.railway.app/health
echo.

pause

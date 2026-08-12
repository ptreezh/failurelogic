@echo off
REM Vercel部署脚本 (Windows版本)

echo 🚀 开始Vercel部署流程

REM 1. 登录Vercel (需要手动操作)
echo 1. 请先在浏览器中登录Vercel账户
echo    访问: https://vercel.com/login
echo    登录完成后按任意键继续...
pause

REM 2. 初始化Vercel项目
echo 2. 初始化Vercel项目...
vercel

REM 3. 部署到生产环境
echo 3. 部署到生产环境...
vercel --prod --yes

echo ✅ 部署完成!
echo 请访问Vercel控制台查看部署状态
pause
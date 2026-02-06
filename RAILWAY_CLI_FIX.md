# Railway CLI 安装问题修复指南

## ❌ 问题描述

Railway CLI 已安装但无法运行，错误信息：
```
Error: Cannot find module 'C:\Users\Zhang\AppData\Roaming\npm\node_modules\@railway\cli\bin\railway.js'
```

## 🔍 问题原因

Railway CLI 的 npm 包已安装，但二进制文件或依赖模块缺失或损坏。

## ✅ 解决方案

### 方法 1: 重新安装 Railway CLI（推荐）

```bash
# 1. 卸载现有安装
npm uninstall -g @railway/cli

# 2. 清除 npm 缓存
npm cache clean --force

# 3. 重新安装
npm install -g @railway/cli

# 4. 验证安装
railway --version
```

### 方法 2: 手动修复安装

```bash
# 1. 进入 Railway CLI 安装目录
cd C:\Users\Zhang\AppData\Roaming\npm\node_modules\@railway\cli

# 2. 重新安装依赖
npm install

# 3. 验证安装
railway --version
```

### 方法 3: 使用 Railway 网站部署（无需 CLI）

如果无法修复 CLI，可以使用 Railway 网站直接部署：

1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择 `ptreezh/failurelogic` 仓库
5. Railway 会自动检测配置并部署

详细步骤见: `MANUAL_DEPLOYMENT_GUIDE.md`

### 方法 4: 使用 GitHub Actions 部署（推荐）

完全不需要本地安装 Railway CLI：

1. 获取 Railway Token: https://railway.app/account/tokens
2. 添加到 GitHub Secrets: `RAILWAY_TOKEN`
3. 推送代码自动部署

详细步骤见: `MANUAL_DEPLOYMENT_GUIDE.md`

---

## 📝 快速修复命令

```bash
# 尝试重新安装（需要稳定的网络连接）
npm uninstall -g @railway/cli
npm install -g @railway/cli

# 如果仍然失败，尝试使用特定版本
npm install -g @railway/cli@3.18.2

# 验证安装
railway --version
railway whoami
```

---

## 🎯 推荐方案

如果无法修复 Railway CLI 安装问题，建议使用：

1. **GitHub Actions 自动部署**（最推荐）
   - 无需本地 CLI
   - 完全自动化
   - 推送代码即部署

2. **Railway 网站手动部署**
   - 图形化界面
   - 简单直观
   - 无需命令行工具

详细说明见: `MANUAL_DEPLOYMENT_GUIDE.md`

---

**当前状态**: Railway CLI 安装不完整，需要重新安装或使用替代部署方案。

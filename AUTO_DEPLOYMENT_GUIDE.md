# 自动化部署到 GitHub Pages 和 Codespaces 完整指南

## 📋 目录

1. [架构概览](#架构概览)
2. [GitHub Pages 自动部署](#github-pages-自动部署)
3. [GitHub Codespaces 配置](#github-codespaces-配置)
4. [完整部署流程](#完整部署流程)
5. [常见问题和最佳实践](#常见问题和最佳实践)
6. [从零开始配置清单](#从零开始配置清单)

---

## 架构概览

本项目实现了**双栈部署架构**：

```
┌─────────────────────────────────────────────────────┐
│                   GitHub 仓库                        │
│            ptreezh/failurelogic                     │
└───────────────────┬─────────────────────────────────┘
                    │
                    │ push to main
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌──────────────┐
│ GitHub Pages  │       │ Codespaces   │
│ (静态前端)    │       │ (全栈环境)   │
│               │       │              │
│ • 自动构建    │       │ • Python 3.11│
│ • HTTPS       │       │ • Node.js    │
│ • 全球 CDN    │       │ • API服务器  │
└───────────────┘       └──────────────┘
     https://           https://
     ptreezh.github.    psychic-meme-
     io/failurelogic/   rvq4v7pqwx3xxrr-
                        8000.app.github.
                        dev
```

**关键特性**：
- ✅ **零配置部署**：推送代码自动触发 GitHub Pages 构建
- ✅ **一键开发环境**：Codespaces 自动安装依赖并启动服务
- ✅ **前后端分离**：前端静态部署，后端 API 独立运行
- ✅ **智能降级**：前端在 API 不可用时使用内置数据

---

## GitHub Pages 自动部署

### 核心文件结构

```
.github/
└── workflows/
    └── pages.yml          # GitHub Actions 工作流
```

### 1. 创建工作流配置 (.github/workflows/pages.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]      # 推送到 main 分支时触发
  workflow_dispatch:        # 支持手动触发

permissions:
  contents: read
  pages: write              # 需要 Pages 写权限
  id-token: write           # OIDC 认证需要

concurrency:
  group: "pages"
  cancel-in-progress: false # 避免取消正在运行的部署

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'          # 上传整个仓库

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 2. 启用 GitHub Pages

**步骤**：
1. 进入仓库 **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存设置

**重要**：不要选择 "Deploy from a branch"，要选择 "GitHub Actions"

### 3. 验证部署

```bash
# 推送代码到 main 分支
git add .
git commit -m "feat: Initial deployment"
git push origin main

# 检查 Actions 标签页
# https://github.com/ptreezh/failurelogic/actions
```

### 4. 关键配置说明

| 配置项 | 说明 | 注意事项 |
|--------|------|----------|
| `on.push.branches` | 触发部署的分支 | 通常用 `main` 或 `gh-pages` |
| `permissions` | 权限配置 | **必须**包含 `pages: write` 和 `id-token: write` |
| `path` | 上传路径 | `.` 表示整个仓库根目录 |
| `concurrency` | 并发控制 | 避免多次部署冲突 |

---

## GitHub Codespaces 配置

### 核心文件结构

```
.devcontainer/
├── devcontainer.json      # Codespaces 配置
└── deploy_codespaces.sh   # 自动部署脚本
```

### 1. 创建 devcontainer 配置

```json
{
  "name": "Your App Name",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "onCreateCommand": "./deploy_codespaces.sh",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  },
  "forwardPorts": [3000, 8000],
  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "onAutoForward": "openPreview"
    },
    "8000": {
      "label": "API Server",
      "onAutoForward": "notify"
    }
  },
  "postCreateCommand": "pip install --upgrade pip && cd api-server && pip install fastapi uvicorn",
  "remoteUser": "vscode"
}
```

### 2. 创建自动部署脚本 (deploy_codespaces.sh)

```bash
#!/bin/bash
set -e  # 遇到错误时退出

echo "==================================="
echo "自动部署脚本"
echo "==================================="

# 1. 设置环境变量
export PYTHONPATH="${PYTHONPATH}:$(pwd)/api-server"

# 2. 安装依赖
cd api-server
pip install --upgrade pip
pip install fastapi uvicorn python-multipart requests pydantic[email]

# 3. 启动服务（后台运行）
PORT=${PORT:-8000}
uvicorn start:app --host 0.0.0.0 --port $PORT --reload &

SERVER_PID=$!
echo "服务启动，PID: $SERVER_PID"

# 4. 等待服务启动
sleep 5

# 5. 健康检查
if curl -f http://localhost:$PORT/health >/dev/null 2>&1; then
    echo "✅ 服务正常运行"
else
    echo "⚠️  服务启动失败"
    exit 1
fi

echo "==================================="
echo "部署完成!"
echo "访问地址: http://localhost:$PORT"
echo "==================================="

# 保持服务运行
wait $SERVER_PID
```

**重要**：脚本必须有执行权限
```bash
chmod +x .devcontainer/deploy_codespaces.sh
```

### 3. 关键配置说明

| 配置项 | 说明 | 推荐值 |
|--------|------|--------|
| `image` | 基础镜像 | `mcr.microsoft.com/devcontainers/python:3.11` |
| `onCreateCommand` | 创建时执行的命令 | 自动启动脚本 |
| `forwardPorts` | 自动转发的端口 | `[3000, 8000]` |
| `onAutoForward` | 端口行为 | `openPreview` (前端) / `notify` (后端) |
| `postCreateCommand` | 创建后执行的命令 | 安装依赖 |

---

## 完整部署流程

### 场景 1：首次部署（从零开始）

```bash
# 1. 创建 GitHub 仓库
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main

# 2. 启用 GitHub Pages
# 在 GitHub 网页上：Settings → Pages → Source → GitHub Actions

# 3. 创建 Codespaces
# 在 GitHub 网页上：Code → Codespaces → Create codespace on main

# 4. 验证部署
# GitHub Pages: https://YOUR_USERNAME.github.io/YOUR_REPO/
# Codespaces: 自动生成 URL（类似 xxx-8000.app.github.dev）
```

### 场景 2：日常开发流程

```bash
# 1. 本地开发
git checkout -b feature/new-feature
# ... 编写代码 ...
npm test  # 运行测试

# 2. 提交代码
git add .
git commit -m "feat: Add new feature"
git push origin feature/new-feature

# 3. 创建 Pull Request
# 在 GitHub 网页上创建 PR

# 4. 合并后自动部署
# 合并到 main 分支后，GitHub Actions 自动触发部署
```

### 场景 3：全栈开发（前端 + 后端）

```bash
# 终端 1 - 启动后端 API
cd api-server
python start.py 8000

# 终端 2 - 启动前端开发服务器
cd tests
npx serve -l 3000 ..

# 终端 3 - 运行 E2E 测试
cd tests
npm test
```

---

## 常见问题和最佳实践

### ❌ 问题 1：GitHub Pages 部署失败

**原因**：
- 权限配置错误
- 仓库是私有的
- 工作流文件路径错误

**解决方案**：
```yaml
# 确保权限配置正确
permissions:
  contents: read
  pages: write      # ← 必须有
  id-token: write   # ← 必须有

# 仓库必须是公开的，或者升级到 GitHub Team/Enterprise
```

### ❌ 问题 2：Codespaces 端口无法访问

**原因**：
- 服务未启动
- 端口未监听 0.0.0.0
- 防火墙阻止

**解决方案**：
```bash
# 1. 检查服务是否运行
netstat -tlnp | grep python

# 2. 确保监听 0.0.0.0（不是 127.0.0.1）
uvicorn start:app --host 0.0.0.0 --port 8000

# 3. 检查端口转发配置
# 在 Codespaces 中：Ports → Add Port
```

### ❌ 问题 3：API 跨域错误（CORS）

**原因**：
- GitHub Pages 是静态托管，无法直接调用本地 API
- API 服务器未配置 CORS

**解决方案**：
```python
# api-server/start.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### ✅ 最佳实践 1：使用环境变量

```javascript
// assets/js/api-config-manager.js
const API_CONFIG = {
  development: 'http://localhost:8000',
  production: 'https://your-codespace-8000.app.github.dev',
  fallback: 'https://your-api.vercel.app'
};

// 根据环境自动选择
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return API_CONFIG.development;
  } else if (window.location.hostname.includes('github.io')) {
    return API_CONFIG.production;
  }
  return API_CONFIG.fallback;
};
```

### ✅ 最佳实践 2：健康检查端点

```python
# api-server/endpoints/health.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }
```

### ✅ 最佳实践 3：自动重试机制

```javascript
// assets/js/api-fallback-manager.js
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

---

## 从零开始配置清单

### 📝 GitHub Pages 部署清单

- [ ] 创建 GitHub 仓库
- [ ] 创建 `.github/workflows/pages.yml` 文件
- [ ] 配置工作流（触发条件、权限、部署步骤）
- [ ] 推送代码到 `main` 分支
- [ ] 在仓库 Settings 中启用 Pages
- [ ] Source 选择 "GitHub Actions"
- [ ] 验证 Actions 运行成功
- [ ] 访问部署的 URL

### 📝 Codespaces 配置清单

- [ ] 创建 `.devcontainer/devcontainer.json`
- [ ] 选择合适的基础镜像（如 `python:3.11`）
- [ ] 配置 VS Code 扩展
- [ ] 配置端口转发
- [ ] 创建 `deploy_codespaces.sh` 脚本
- [ ] 脚本添加执行权限（`chmod +x`）
- [ ] 测试脚本在本地运行
- [ ] 创建 Codespaces 并验证

### 📝 全栈应用配置清单

- [ ] 前端静态文件（HTML/CSS/JS）
- [ ] 后端 API 服务器（FastAPI/Express）
- [ ] API CORS 配置
- [ ] 环境变量管理
- [ ] 健康检查端点
- [ ] API 降级策略（fallback data）
- [ ] E2E 测试配置
- [ ] 部署文档（README.md）

---

## 总结

### 核心文件

| 文件 | 作用 | 必需性 |
|------|------|--------|
| `.github/workflows/pages.yml` | GitHub Pages 自动部署 | ✅ 必需 |
| `.devcontainer/devcontainer.json` | Codespaces 环境配置 | ⭐ 推荐 |
| `.devcontainer/deploy_codespaces.sh` | 自动启动脚本 | ⭐ 推荐 |
| `assets/js/api-config-manager.js` | API 配置管理 | ⭐ 推荐 |

### 三分钟快速部署

```bash
# 1. 克隆模板配置
git clone https://github.com/ptreezh/failurelogic.git my-app
cd my-app

# 2. 修改配置
# - 编辑 .github/workflows/pages.yml（如果需要）
# - 编辑 .devcontainer/devcontainer.json（如果需要）

# 3. 创建新仓库
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_APP.git
git push -u origin main

# 4. 启用 Pages
# Settings → Pages → Source → GitHub Actions

# 5. 创建 Codespaces
# Code → Codespaces → Create codespace on main

# 完成！✅
```

### 下一步

- 📖 查看 [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- 📖 查看 [Codespaces 官方文档](https://docs.github.com/en/codespaces)
- 🎓 学习 [GitHub Actions 进阶配置](https://docs.github.com/en/actions)
- 🔧 配置自定义域名（可选）

---

**最后更新**: 2026-01-31
**维护者**: ptreezh
**仓库**: https://github.com/ptreezh/failurelogic

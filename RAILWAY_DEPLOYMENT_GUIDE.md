# Railway 自动化部署指南

## 🚀 快速开始

### 一键部署

```bash
# 确保已安装 Railway CLI
npm i -g @railway/cli

# 运行自动化部署脚本
python deploy_to_railway.py
```

### 交互式部署

```bash
# 运行脚本
python deploy_to_railway.py

# 选择选项:
# 1. 运行完整部署
# 2. 检查部署状态
# 3. 显示使用说明
# 4. 退出
```

## 📋 前置条件

### 1. 安装 Railway CLI

```bash
# 使用 npm 安装
npm i -g @railway/cli

# 或使用 Homebrew (macOS)
brew install railway

# 验证安装
railway --version
```

### 2. 注册 Railway 账户

- 访问 https://railway.app
- 使用 GitHub 账户注册
- 验证邮箱

### 3. 登录 Railway

```bash
# 命令行登录
railway login

# 或使用浏览器登录
railway login --browser
```

### 4. 项目要求

确保项目包含以下文件:

```
D:\AIDevelop\failureLogic/
├── railway.json              # Railway 配置文件
├── nixpacks.toml             # 构建配置
├── api-server/
│   ├── requirements.txt      # Python 依赖
│   └── start.py             # 启动脚本
└── assets/
    └── js/
        └── api-config-manager.js  # API 配置
```

## ⚙️ 配置说明

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python api-server/start.py",
    "healthcheckPath": "/health"
  }
}
```

### nixpacks.toml

```toml
[phases.build]
cmds = ["pip install --no-cache-dir -r api-server/requirements.txt"]

[phases.start]
cmds = ["python api-server/start.py"]

[[services.port]]
port = 8000
type = "HTTP"

[healthcheck]
path = "/health"
interval = "30s"
timeout = "10s"
retries = 3
```

### api-server/requirements.txt

```
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
python-multipart>=0.0.6
requests>=2.31.0
pydantic[email]>=2.5.0
pydantic-settings>=2.1.0
```

## 🎯 部署步骤

### 步骤 1: 运行部署脚本

```bash
cd D:\AIDevelop\failureLogic
python deploy_to_railway.py
```

### 步骤 2: 登录验证

如果未登录，脚本会提示:
```
📝 请运行以下命令登录:
   railway login
   
或使用浏览器登录:
   railway login --browser
```

### 步骤 3: 创建项目

脚本会自动:
- 检查是否已有 Railway 项目
- 如果没有，创建新项目
- 项目名称: `failure-logic-api`

### 步骤 4: 配置环境变量

脚本会自动设置:
- `PYTHON_VERSION=3.12`
- `PORT=8000`
- `PYTHONPATH=/app/api-server`

### 步骤 5: 部署

脚本会:
- 推送代码到 Railway
- 触发构建和部署
- 显示部署日志

### 步骤 6: 检查状态

部署完成后，脚本会:
- 检查部署状态
- 获取部署URL
- 更新前端配置

## 📊 部署后操作

### 查看日志

```bash
# 查看实时日志
railway logs

# 查看部署状态
railway status
```

### 管理环境变量

```bash
# 查看环境变量
railway variables

# 添加环境变量
railway variables set KEY=value

# 删除环境变量
railway variables delete KEY
```

### 连接到项目

```bash
# 连接到 Railway 项目
railway connect

# 列出所有项目
railway projects
```

### 重新部署

```bash
# 重新部署当前项目
railway up

# 查看部署历史
railway deployments
```

## 🔧 手动部署（不使用脚本）

### 方法 1: 使用 Railway CLI

```bash
# 1. 初始化项目
cd D:\AIDevelop\failureLogic
railway init --name failure-logic-api

# 2. 配置环境变量
railway variables set PYTHON_VERSION=3.12
railway variables set PORT=8000

# 3. 部署
railway up

# 4. 查看状态
railway status
```

### 方法 2: 使用 Railway 网站

1. 访问 https://railway.app
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择 `ptreezh/failurelogic` 仓库
5. Railway 会自动检测配置并部署
6. 配置环境变量（如果需要）
7. 等待部署完成

## 🌐 前端配置

### 更新 API 配置

部署完成后，需要更新前端 API 配置:

**文件**: `assets/js/api-config-manager.js`

**添加 Railway 端点**:

```javascript
const API_ENDPOINTS = {
  railway: 'https://your-app.up.railway.app',
  github_pages: 'https://ptreezh.github.io/failurelogic/api',
  localhost: 'http://localhost:8000',
  // ... 其他端点
};
```

**自动化**: 部署脚本会自动完成此配置。

## 🐛 故障排除

### 问题 1: Railway CLI 未安装

**错误**:
```
railway: command not found
```

**解决**:
```bash
npm i -g @railway/cli
```

### 问题 2: 未登录

**错误**:
```
Not logged in
```

**解决**:
```bash
railway login
```

### 问题 3: 部署失败

**错误**:
```
Build failed
```

**可能原因和解决**:

1. **依赖问题**
   ```bash
   # 检查 requirements.txt
   cat api-server/requirements.txt
   
   # 本地测试
   cd api-server
   pip install -r requirements.txt
   python start.py
   ```

2. **端口问题**
   - 确保使用 `PORT` 环境变量
   - 检查 nixpacks.toml 配置

3. **构建超时**
   - 检查网络连接
   - 重试部署: `railway up`

### 问题 4: API 无法访问

**错误**:
```
Connection refused
```

**检查步骤**:

1. **查看日志**
   ```bash
   railway logs
   ```

2. **检查健康状态**
   ```bash
   curl https://your-app.up.railway.app/health
   ```

3. **验证环境变量**
   ```bash
   railway variables
   ```

### 问题 5: 前端无法连接后端

**错误**:
```
API Error
```

**解决**:

1. **检查 API 配置**
   ```javascript
   // assets/js/api-config-manager.js
   const API_ENDPOINTS = {
     railway: 'https://your-app.up.railway.app',  // 确认URL正确
     // ...
   };
   ```

2. **检查 CORS 设置**
   - FastAPI 中已配置 CORS
   - 确保允许前端域名

3. **测试 API**
   ```bash
   curl https://your-app.up.railway.app/scenarios
   ```

## 📊 监控和管理

### 查看资源使用

```bash
# 查看资源使用情况
railway usage

# 查看账单信息
railway billing
```

### 设置自定义域名

```bash
# 添加自定义域名
railway domain add your-domain.com

# 查看域名设置
railway domain
```

### 环境管理

```bash
# 查看所有环境
railway environments

# 创建新环境
railway environment create production

# 切换到环境
railway environment production
```

## 💰 费用说明

### Railway 免费额度

- **资源**: 每月5美元
- **执行时间**: 500小时/月
- **内存**: 1GB
- **存储**: 5GB
- **出站流量**: 5GB

### 成本估算

对于本项目:
- **API 服务器**: ~0.5-1GB 内存
- **月费用**: 0-5美元（免费额度内）
- **超出后**: 按使用量计费

### 节省成本技巧

1. **自动休眠**: 不使用时会自动休眠
2. **监控使用**: 定期检查资源使用
3. **优化代码**: 减少内存使用
4. **缓存**: 使用缓存减少计算

## 🔐 安全建议

### 环境变量

**不要提交到 Git**:
```bash
# 创建 .env 文件（不要提交）
echo ".env" >> .gitignore

# 在 Railway 中设置敏感信息
railway variables set SECRET_KEY=your-secret-key
```

### API 密钥

如果项目需要 API 密钥:
```bash
# 在 Railway 中设置
railway variables set API_KEY=your-api-key
```

### 数据库

如果需要数据库:
```bash
# Railway 提供 PostgreSQL 插件
railway add postgresql

# 自动设置连接字符串
railway variables
```

## 📚 参考链接

- [Railway 文档](https://docs.railway.app)
- [Railway CLI 文档](https://docs.railway.app/develop/cli)
- [Nixpacks 文档](https://nixpacks.com)
- [FastAPI 部署](https://fastapi.tiangolo.com/deployment/)

## 🤝 获取帮助

### Railway 社区

- [Discord](https://discord.gg/railway)
- [GitHub Discussions](https://github.com/railwayapp/railway/discussions)

### 项目问题

如果遇到项目相关问题:
- 检查日志: `railway logs`
- 查看部署状态: `railway status`
- 本地测试: `cd api-server && python start.py`

---

**最后更新**: 2026-02-06  
**Railway CLI 版本**: 3.x  
**Python 版本**: 3.12+

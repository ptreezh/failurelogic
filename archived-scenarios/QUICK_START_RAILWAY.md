# Railway 部署快速开始

## 🎯 一键部署（推荐）

### 使用 Python 脚本（跨平台）

```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录 Railway
railway login

# 3. 运行自动化部署
python deploy_to_railway.py
```

### 使用 Windows 批处理

```bash
# 双击运行或命令行执行
deploy_railway.bat
```

## 📊 部署状态

### 配置文件检查 ✅

```
✅ railway.json          - Railway 配置文件已存在
✅ nixpacks.toml         - 构建配置已存在
✅ requirements.txt      - Python 依赖已配置
✅ start.py             - 启动脚本已存在
✅ health endpoint      - 健康检查已实现
```

### 自动化工具 ✅

```
✅ deploy_to_railway.py  - Python 自动化部署脚本
✅ deploy_railway.bat    - Windows 批处理脚本
✅ RAILWAY_DEPLOYMENT_GUIDE.md - 详细部署指南
✅ RAILWAY_AUTOMATION_SUMMARY.md - 自动化总结
```

## 🚀 部署步骤详解

### 步骤 1: 安装 Railway CLI（如果未安装）

```bash
npm i -g @railway/cli
```

### 步骤 2: 登录 Railway

```bash
railway login
```

### 步骤 3: 运行部署

选择一种方法：

**方法 A: Python 脚本（推荐）**
```bash
python deploy_to_railway.py
```

**方法 B: 批处理脚本（Windows）**
```bash
deploy_railway.bat
```

**方法 C: 手动命令**
```bash
railway init --name failure-logic-api
railway variables set PYTHON_VERSION=3.12
railway variables set PORT=8000
railway up
```

### 步骤 4: 等待部署完成

部署通常需要 3-5 分钟。

### 步骤 5: 验证部署

```bash
# 检查部署状态
railway status

# 查看日志
railway logs

# 测试 API
curl https://your-app.up.railway.app/health
```

### 步骤 6: 更新前端配置

部署脚本会自动更新 `assets/js/api-config-manager.js`。

手动更新：
```javascript
const API_ENDPOINTS = {
  railway: 'https://your-app.up.railway.app',
  github_pages: 'https://ptreezh.github.io/failurelogic/api',
  localhost: 'http://localhost:8000',
  // ...
};
```

## 📈 预计部署时间

| 步骤 | 时间 | 说明 |
|------|------|------|
| 安装 Railway CLI | 1-2 分钟 | 如果已安装则跳过 |
| 登录 | 1 分钟 | 浏览器验证 |
| 项目创建 | 1 分钟 | 自动完成 |
| 环境配置 | 1 分钟 | 自动完成 |
| 构建和部署 | 3-5 分钟 | 主要时间 |
| 验证 | 1-2 分钟 | 测试 API |
| **总计** | **8-13 分钟** | 首次部署 |

## 🔧 部署后管理

### 常用命令

```bash
# 查看日志
railway logs

# 查看状态
railway status

# 重新部署
railway up

# 管理环境变量
railway variables

# 查看部署历史
railway deployments
```

### 故障排除

**问题: Railway CLI 未安装**
```bash
npm i -g @railway/cli
```

**问题: 未登录**
```bash
railway login
```

**问题: 部署失败**
```bash
# 查看详细日志
railway logs

# 本地测试
cd api-server
pip install -r requirements.txt
python start.py
```

**问题: API 无法访问**
```bash
# 测试健康检查
curl https://your-app.up.railway.app/health

# 检查环境变量
railway variables
```

## 💰 费用说明

### Railway 免费额度

- **每月**: 5 美元
- **执行时间**: 500 小时/月
- **内存**: 1GB
- **存储**: 5GB
- **出站流量**: 5GB

### 本项目估算

- **内存使用**: ~200-300MB
- **CPU 使用**: 低
- **月费用**: 0-2 美元（在免费额度内）

### 节省成本技巧

1. **自动休眠**: 不使用时会自动休眠
2. **监控使用**: 定期检查资源使用
3. **优化代码**: 减少内存和CPU使用

## 🎯 下一步

部署完成后：

1. **测试 API**
   ```bash
   curl https://your-app.up.railway.app/scenarios
   ```

2. **测试前端**
   - 访问 https://ptreezh.github.io/failurelogic/
   - 打开浏览器开发者工具
   - 检查 Network 标签
   - 确认 API 请求成功

3. **完整测试**
   - 打开一个场景
   - 进行游戏交互
   - 验证所有功能正常

4. **监控**
   - 查看 Railway 仪表板
   - 监控资源使用
   - 查看日志

## 📚 完整文档

- **详细指南**: `RAILWAY_DEPLOYMENT_GUIDE.md`
- **自动化总结**: `RAILWAY_AUTOMATION_SUMMARY.md`
- **部署验证**: `DEPLOYMENT_VERIFICATION_REPORT.md`

## 🔗 相关链接

- [Railway 官网](https://railway.app)
- [Railway 文档](https://docs.railway.app)
- [项目 GitHub](https://github.com/ptreezh/failurelogic)

---

**准备好部署了吗？**

运行以下命令开始：

```bash
python deploy_to_railway.py
```

预计 8-13 分钟完成部署！

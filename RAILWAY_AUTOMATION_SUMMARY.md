# Railway 自动化部署总结

## 📦 已创建的自动化工具

### 1. Python 部署脚本

**文件**: `deploy_to_railway.py`

**功能**:
- ✅ 检查先决条件（Railway CLI、Git、必要文件）
- ✅ 登录验证
- ✅ 创建/连接 Railway 项目
- ✅ 配置环境变量
- ✅ 部署到 Railway
- ✅ 检查部署状态
- ✅ 更新前端 API 配置

**使用方法**:
```bash
# 交互式部署
python deploy_to_railway.py

# 直接部署
python deploy_to_railway.py --deploy

# 检查状态
python deploy_to_railway.py --status

# 显示帮助
python deploy_to_railway.py --help-deploy
```

### 2. Windows 批处理脚本

**文件**: `deploy_railway.bat`

**功能**:
- ✅ 检查 Railway CLI
- ✅ 检查登录状态
- ✅ 自动创建项目（如果不存在）
- ✅ 配置环境变量
- ✅ 执行部署
- ✅ 显示部署后操作

**使用方法**:
```bash
# 双击运行或命令行执行
deploy_railway.bat
```

### 3. 详细部署指南

**文件**: `RAILWAY_DEPLOYMENT_GUIDE.md`

**内容**:
- 快速开始
- 前置条件
- 配置说明
- 部署步骤
- 故障排除
- 监控和管理
- 费用说明
- 安全建议

## ⚙️ 配置文件

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

## 🚀 快速部署流程

### 方法 1: 使用 Python 脚本（推荐）

```bash
# 1. 安装 Railway CLI
npm i -g @railway/cli

# 2. 登录
railway login

# 3. 运行自动化部署
python deploy_to_railway.py

# 4. 按照提示操作
```

**预计时间**: 5-10 分钟

### 方法 2: 使用批处理脚本（Windows）

```bash
# 1. 确保已安装 Railway CLI 并已登录

# 2. 双击运行或命令行执行
deploy_railway.bat

# 3. 等待部署完成
```

**预计时间**: 5-10 分钟

### 方法 3: 手动部署

参考 `RAILWAY_DEPLOYMENT_GUIDE.md` 中的详细步骤。

**预计时间**: 10-15 分钟

## 📊 部署架构

```
┌─────────────────────────────────────┐
│  Railway Dashboard                  │
│  (https://railway.app)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Railway 项目: failure-logic-api    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Web Service                  │ │
│  │  - Python 3.12                │ │
│  │  - FastAPI                    │ │
│  │  - 自动构建和部署             │ │
│  └──────────────┬────────────────┘ │
│                 │                    │
│  ┌──────────────▼────────────────┐ │
│  │  Health Check: /health        │ │
│  │  Port: 8000                   │ │
│  │  URL: xxx.up.railway.app      │ │
│  └───────────────────────────────┘ │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  GitHub Repository                  │
│  ptreezh/failurelogic               │
└─────────────────────────────────────┘
```

## 🎯 部署后配置

### 1. 获取 API URL

部署完成后，脚本会自动显示:
```
📡 API URL: https://your-app.up.railway.app
```

### 2. 更新前端配置

脚本会自动更新 `assets/js/api-config-manager.js`:

```javascript
const API_ENDPOINTS = {
  railway: 'https://your-app.up.railway.app',
  github_pages: 'https://ptreezh.github.io/failurelogic/api',
  localhost: 'http://localhost:8000',
  // ...
};
```

### 3. 配置 API 管理器

确保 `ApiConfigManager` 使用 Railway 端点:

```javascript
// 在 app.js 中
const apiEndpoint = ApiConfigManager.getApiEndpoint('railway');
```

### 4. 测试 API

```bash
# 测试健康检查
curl https://your-app.up.railway.app/health

# 测试场景列表
curl https://your-app.up.railway.app/scenarios

# 测试游戏会话
curl -X POST https://your-app.up.railway.app/api/games \
  -H "Content-Type: application/json" \
  -d '{"scenarioId": "coffee-shop-linear-thinking", "difficulty": "beginner"}'
```

### 5. 配置 GitHub Pages

确保前端使用 Railway API:

```javascript
// 在场景加载时
const scenarios = await ApiManager.makeRequest(
  `${apiEndpoint}/scenarios`,
  'GET'
);
```

## 🔧 管理命令

### 查看日志

```bash
# 实时日志
railway logs

# 查看历史日志
railway logs --lines 100
```

### 查看状态

```bash
# 部署状态
railway status

# 资源使用
railway usage
```

### 管理环境变量

```bash
# 查看环境变量
railway variables

# 添加变量
railway variables set KEY=value

# 删除变量
railway variables delete KEY
```

### 重新部署

```bash
# 重新部署
railway up

# 查看部署历史
railway deployments
```

## 🐛 故障排除

### 问题 1: Railway CLI 未安装

```bash
# 安装 Railway CLI
npm i -g @railway/cli
```

### 问题 2: 未登录

```bash
# 登录
railway login
```

### 问题 3: 部署失败

```bash
# 查看详细日志
railway logs

# 检查配置
railway status

# 本地测试
cd api-server
pip install -r requirements.txt
python start.py
```

### 问题 4: API 无法访问

```bash
# 测试健康检查
curl https://your-app.up.railway.app/health

# 检查环境变量
railway variables
```

## 📈 监控和优化

### 资源监控

```bash
# 查看资源使用
railway usage

# 查看账单
railway billing
```

### 性能优化

1. **减少内存使用**
   ```python
   # 使用生成器而不是列表
   # 及时释放大对象
   # 使用连接池
   ```

2. **减少启动时间**
   ```python
   # 延迟导入
   # 使用懒加载
   # 优化依赖
   ```

3. **缓存**
   ```python
   # 使用 Redis 缓存场景数据
   # 缓存 API 响应
   ```

## 💰 费用管理

### Railway 免费额度

- **每月**: 5美元
- **执行时间**: 500小时/月
- **内存**: 1GB
- **存储**: 5GB
- **出站流量**: 5GB

### 成本优化

1. **自动休眠**: 不使用时自动休眠
2. **监控使用**: 定期检查资源使用
3. **优化代码**: 减少内存和CPU使用
4. **使用缓存**: 减少重复计算

### 超出免费额度

如果超出免费额度:
- 每小时约 0.01美元
- 每月预计 5-10美元（轻量级使用）

## 🔐 安全建议

### 环境变量

**不要提交敏感信息到 Git**:
```bash
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

**在 Railway 中设置敏感信息**:
```bash
railway variables set SECRET_KEY=your-secret-key
railway variables set API_KEY=your-api-key
```

### API 安全

1. **使用 HTTPS**: Railway 自动提供 HTTPS
2. **验证请求**: 在 FastAPI 中添加验证
3. **速率限制**: 防止滥用

### 数据库安全

如果需要数据库:
```bash
# 添加 PostgreSQL
railway add postgresql

# 连接字符串会自动设置为环境变量
# DATABASE_URL=postgresql://...
```

## 📚 参考文档

- [Railway 官方文档](https://docs.railway.app)
- [Railway CLI 文档](https://docs.railway.app/develop/cli)
- [Nixpacks 文档](https://nixpacks.com)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [Python 部署最佳实践](https://docs.python-guide.org/scenarios/deploy/)

## 🤝 获取帮助

### Railway 支持

- [Discord 社区](https://discord.gg/railway)
- [GitHub Discussions](https://github.com/railwayapp/railway/discussions)
- [官方文档](https://docs.railway.app)

### 项目支持

如果遇到项目相关问题:
1. 检查日志: `railway logs`
2. 查看状态: `railway status`
3. 本地测试: `cd api-server && python start.py`
4. 查看部署报告: `DEPLOYMENT_VERIFICATION_REPORT.md`

## 🎯 部署检查清单

部署前检查:
- [ ] Railway CLI 已安装
- [ ] 已登录 Railway
- [ ] 项目在 Git 仓库中
- [ ] 所有必要文件存在
- [ ] requirements.txt 最新
- [ ] 代码已提交到 GitHub

部署后检查:
- [ ] 部署成功
- [ ] API 可访问
- [ ] 健康检查通过
- [ ] 前端配置已更新
- [ ] 前端可以连接后端
- [ ] 所有功能正常

---

**最后更新**: 2026-02-06  
**Railway CLI 版本**: 3.x  
**Python 版本**: 3.12+  
**FastAPI 版本**: 0.104.0+

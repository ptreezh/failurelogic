# Railway 部署指南

## 部署步骤

### 1. 访问 Railway 并登录

1. 访问 https://railway.com/new
2. 点击 "Continue with GitHub" 授权登录

### 2. 创建新项目

1. 登录后，点击 **"New Project"** 按钮
2. 选择 **"Deploy from GitHub repo"**
3. 搜索并选择 `ptreezh/failurelogic` 仓库

### 3. 配置部署

Railway 会自动检测项目配置：

- **Builder**: Nixpacks（通过 `nixpacks.toml` 配置）
- **Start Command**: `python api-server/start.py`
- **Port**: 自动检测（通过 `PORT` 环境变量）

### 4. 部署设置

确认以下配置：

| 设置项 | 值 |
|--------|-----|
| Root Directory | `/` |
| Build Command | `pip install --no-cache-dir -r api-server/requirements.txt` |
| Start Command | `python api-server/start.py` |
| Healthcheck Path | `/health` |

### 5. 环境变量（可选）

如需配置环境变量，在项目设置中添加：

| 变量名 | 说明 |
|--------|------|
| PORT | Railway 自动设置（通常 8000） |
| PYTHON_VERSION | Python 版本（默认 3.x） |

### 6. 部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，Railway 会分配一个公网 URL

### 7. 获取部署 URL

部署完成后：
1. 进入项目 → **Settings** → **Domains**
2. 复制生成的 URL（如：`https://xxx.up.railway.app`）

### 8. 验证部署

访问以下端点验证：

```bash
# 健康检查
curl https://xxx.up.railway.app/health

# API 文档
# 浏览器访问：https://xxx.up.railway.app/docs

# 根路径（前端）
# 浏览器访问：https://xxx.up.railway.app/
```

### 9. 更新前端 API 配置

编辑 `assets/js/api-config-manager.js`，在 `API_SOURCES` 数组中添加 Railway URL：

```javascript
const API_SOURCES = [
  {
    url: 'https://xxx.up.railway.app',
    name: 'Railway Production',
    priority: 1  // 最高优先级
  },
  // ... 其他备用源
];
```

---

## 故障排查

### 构建失败

- 检查 `api-server/requirements.txt` 是否存在
- 查看构建日志确认错误信息

### 启动失败

- 确认 `api-server/start.py` 支持环境变量 `PORT`
- 检查日志：Railway → 项目 → Logs

### 404 错误

- 确认 `Root Directory` 设置正确
- 检查路由配置

---

## Railway 配置文件

项目中已包含以下配置文件：

- `nixpacks.toml` - Nixpacks 构建配置
- `railway.json` - Railway 项目元数据
- `api-server/requirements.txt` - Python 依赖

---

## 下一步

部署成功后：
1. 将 Railway URL 添加到前端 API 配置
2. 提交并推送更新
3. 前端将自动使用 Railway 作为主要 API 源

# Railway 手动部署指南（网络问题替代方案）

## ⚠️ 网络问题说明

由于网络连接问题，无法自动安装 Railway CLI。请使用以下手动部署方法。

## 🎯 部署方法选择

### 方法 1: 使用 Railway 网站（推荐）

**步骤**:  

1. **访问 Railway 网站**
   - 打开浏览器: https://railway.app
   - 点击 "Start a New Project"

2. **连接 GitHub**
   - 点击 "Deploy from GitHub repo"
   - 授权 Railway 访问你的 GitHub 账户
   - 选择 `ptreezh/failurelogic` 仓库

3. **配置项目**
   - Railway 会自动检测配置
   - 项目名称: `failure-logic-api`
   - 环境: `Python 3.12`

4. **设置环境变量**
   - 点击 "Variables"
   - 添加:
     ```
     PYTHON_VERSION = 3.12
     PORT = 8000
     ```

5. **部署**
   - Railway 会自动开始部署
   - 等待 3-5 分钟
   - 查看部署日志

6. **获取部署 URL**
   - 部署完成后，点击 "Settings"
   - 找到 "Domain"
   - 复制 URL: `https://your-app.up.railway.app`

**预计时间**: 5-10 分钟

---

### 方法 2: 手动下载 Railway CLI

**步骤**:

1. **下载 Railway CLI**
   - 访问: https://github.com/railwayapp/cli/releases
   - 下载最新版本: `railway-v3.x.x-x86_64-pc-windows-gnu.tar.gz`

2. **解压文件**
   ```bash
   # 解压到 C:\railway
   tar -xzf railway-v3.x.x-x86_64-pc-windows-gnu.tar.gz -C C:\railway
   ```

3. **添加到系统 PATH**
   ```bash
   # 将 C:\railway 添加到系统 PATH
   setx PATH "%PATH%;C:\railway"
   ```

4. **验证安装**
   ```bash
   railway --version
   ```

5. **登录并部署**
   ```bash
   railway login
   railway init --name failure-logic-api
   railway up
   ```

---

### 方法 3: 使用 GitHub Actions（完全自动化）

**步骤**:

1. **获取 Railway 令牌**
   - 访问: https://railway.app/account/tokens
   - 点击 "New Token"
   - 复制令牌

2. **添加到 GitHub Secrets**
   - 访问: https://github.com/ptreezh/failurelogic/settings/secrets/actions
   - 点击 "New repository secret"
   - 名称: `RAILWAY_TOKEN`
   - 值: 粘贴你的 Railway 令牌

3. **触发部署**
   - 推送代码到 main 分支
   - 或手动触发: Actions 标签页 → Deploy to Railway → Run workflow

4. **查看部署**
   - Railway 仪表板会自动显示部署

**预计时间**: 3-5 分钟（配置完成后）

---

### 方法 4: 本地构建后上传

**步骤**:

1. **本地测试 API**
   ```bash
   cd D:\AIDevelop\failureLogic\api-server
   pip install -r requirements.txt
   python start.py 8000
   ```

2. **测试 API**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/scenarios
   ```

3. **使用 Docker（如果有 Docker）**
   ```bash
   # 创建 Dockerfile
   cd D:\AIDevelop\failureLogic
   
   # 构建镜像
   docker build -t failure-logic-api .
   
   # 推送到 Docker Hub
   docker tag failure-logic-api yourusername/failure-logic-api
   docker push yourusername/failure-logic-api
   
   # 在 Railway 中使用 Docker 镜像
   ```

---

## 📋 部署验证

部署完成后，验证 API 是否正常工作：

```bash
# 测试健康检查
curl https://your-app.up.railway.app/health

# 应该返回:
{"status":"healthy","timestamp":"..."}

# 测试场景列表
curl https://your-app.up.railway.app/scenarios

# 应该返回场景列表
```

## 🔧 配置前端

部署完成后，更新前端 API 配置：

**文件**: `assets/js/api-config-manager.js`

```javascript
const API_ENDPOINTS = {
  railway: 'https://your-app.up.railway.app',  // 你的 Railway URL
  github_pages: 'https://ptreezh.github.io/failurelogic/api',
  localhost: 'http://localhost:8000',
  // ...
};
```

## 🐛 故障排除

### 问题 1: 部署失败

**原因**: 依赖安装失败

**解决**:
```bash
# 检查 requirements.txt
cat api-server/requirements.txt

# 本地测试
cd api-server
pip install -r requirements.txt
```

### 问题 2: API 无法访问

**原因**: 端口或环境变量配置错误

**解决**:
- 检查 Railway 环境变量: `PORT=8000`
- 检查健康检查路径: `/health`

### 问题 3: 前端无法连接

**原因**: CORS 或 API URL 错误

**解决**:
- 检查 API URL 是否正确
- 检查浏览器控制台错误
- 验证 CORS 设置

## 📊 监控部署

### Railway 仪表板

访问: https://railway.app

查看:
- 部署状态
- 资源使用
- 日志
- 环境变量

### GitHub Actions

如果使用 GitHub Actions:
- 访问: https://github.com/ptreezh/failurelogic/actions
- 查看部署工作流
- 查看部署日志

## 📚 参考文档

- [Railway 文档](https://docs.railway.app)
- [Railway CLI 安装](https://docs.railway.app/develop/cli#installing-the-cli)
- [GitHub Actions 部署](https://docs.railway.app/deployments/ci-cd#github-actions)

## 🎯 推荐方法

**对于当前情况（网络问题）**:

1. **首选**: 方法 1（使用 Railway 网站）- 最简单
2. **次选**: 方法 3（GitHub Actions）- 完全自动化
3. **备选**: 方法 2（手动安装 CLI）- 需要下载

---

**准备好部署了吗？**

选择以上任意一种方法开始部署！

预计部署时间: 5-10 分钟

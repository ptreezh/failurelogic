# 部署说明

## GitHub Pages 前端部署

1. 确保以下文件在仓库根目录：
   - `index.html`
   - `assets/` 目录
   - `manifest.json`
   - `sw.js`

2. 在GitHub仓库设置中启用GitHub Pages：
   - 进入仓库的Settings
   - 选择Pages选项卡
   - 选择"Deploy from a branch"
   - 选择主分支和根目录
   - 点击Save

## GitHub Codespaces 后端部署

1. 确保以下文件在仓库中：
   - `api-server/` 目录
   - `api-server/start.py`
   - `api-server/requirements.txt`
   - `.devcontainer.json`

2. 启动Codespaces：
   - 在GitHub上打开仓库
   - 点击"<> Code"按钮
   - 选择"Codespaces"标签
   - 点击"New codespace"或选择现有Codespace

3. 启动API服务器：
   ```bash
   cd api-server
   pip install -r requirements.txt
   python start.py 8000
   ```

4. 将端口设为Public：
   - 在Codespaces中，点击底部状态栏的端口8000
   - 选择"Port Visibility"
   - 选择"Public"

## 本地开发

### 启动前端：
直接在浏览器中打开 `index.html` 文件

### 启动后端：
```bash
cd api-server
pip install -r requirements.txt
python start.py 8000
```

访问 http://localhost:8000 查看API文档
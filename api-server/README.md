# 认知陷阱平台API服务器

基于FastAPI的后端服务，为认知陷阱平台提供API支持。

## 功能特性

- 场景管理API
- 游戏会话管理
- 决策处理和分析
- 用户统计数据
- 排行榜功能
- CORS支持

## 安装依赖

```bash
pip install -r requirements.txt
```

## 启动服务器

```bash
# 使用默认端口8000
python start.py

# 使用指定端口
python start.py 8003
```

## API端点

### 基础端点
- `GET /` - API根端点，返回服务状态
- `GET /docs` - 自动生成的API文档

### 场景相关
- `GET /api/v1/scenarios` - 获取所有认知陷阱场景
- `GET /api/v1/scenarios/{scenario_id}` - 获取特定场景详情

### 游戏会话
- `POST /api/v1/scenarios/create_game_session` - 为指定场景创建游戏会话
- `POST /api/v1/scenarios/{game_id}/turn` - 执行游戏回合
- `GET /api/v1/scenarios/{game_id}/analysis` - 获取游戏分析结果

### 用户相关
- `GET /api/v1/users/profile` - 获取用户配置文件
- `GET /api/v1/users/stats` - 获取用户统计数据
- `GET /api/v1/users/achievements` - 获取用户成就
- `GET /api/v1/users/leaderboard` - 获取排行榜

## 部署到GitHub Codespaces

1. 在Codespaces中打开项目
2. 安装依赖: `pip install -r requirements.txt`
3. 启动服务器: `python start.py 8000`
4. 在Codespaces端口设置中将8000端口设为Public
5. 使用生成的URL作为前端API源

## 开发说明

API服务器使用FastAPI框架，支持自动文档生成和类型检查。
# Quickstart Guide: 认知陷阱测试扩展

**Feature**: 001-cognitive-trap-tests  
**Date**: 2025-11-09  
**Status**: Ready for Implementation

## Overview

本指南介绍如何快速搭建和运行认知陷阱测试扩展功能，包括指数增长误区、复利思维陷阱、历史决策重现和互动式推理游戏等功能模块。

## Prerequisites

- Python 3.8+
- Node.js 16+ (for development tools)
- FastAPI-compatible environment
- Web browser (preferably Microsoft Edge for testing)

## Local Development Setup

### 1. Backend Setup

1. 导航至api-server目录:
```bash
cd api-server
```

2. 创建虚拟环境并激活:
```bash
python -m venv venv
source venv/bin/activate  # Linux/MacOS
# 或
venv\Scripts\activate  # Windows
```

3. 安装依赖:
```bash
pip install -r requirements.txt
```

4. 启动后端服务器:
```bash
python start.py
```

服务器将在 `http://localhost:8000` 上启动。

### 2. Frontend Setup

前端代码位于 `web-app/` 和 `assets/` 目录中，使用纯JavaScript、HTML和CSS实现，无需额外构建步骤。

## Key Endpoints

### 指数增长测试
- `GET /api/exponential/questions` - 获取指数增长相关测试题
- `POST /api/exponential/calculate/compound` - 复利计算工具
- `POST /api/exponential/calculate/exponential` - 指数计算工具
- `POST /api/exponential/check-answer/{question_id}` - 检查答案

### 复利思维测试
- `GET /api/compound/questions` - 获取复利相关测试题

### 历史决策重现
- `GET /api/historical/scenarios` - 获取历史决策场景

### 推理游戏
- `GET /api/game/scenarios` - 获取推理游戏场景

### 结果管理
- `POST /api/results/submit` - 提交测试结果
- `GET /api/results/{userId}/{sessionId}` - 获取特定结果

### 认知偏差解释
- `GET /api/explanations/{biasType}` - 获取偏见解释

## Running Tests

### Unit Tests
```bash
cd api-server
python -m pytest tests/unit/
```

### Integration Tests
```bash
cd api-server
python -m pytest tests/integration/
```

### API Testing
使用Postman或curl测试API端点:
```bash
curl -X GET http://localhost:8000/api/exponential/questions
```

## Configuration

所有配置都在 `api-server/start.py` 中定义，可根据需要调整端口、调试模式等设置。

## Development Workflow

### Adding New Test Questions
1. 在 `api-server/data/exponential_questions.json` 或相应文件中添加问题
2. 确保问题遵循契约中定义的格式
3. 测试端点以确保问题正确加载

### Extending Functionality
1. 创建新的模型文件在 `api-server/models/`
2. 创建新的逻辑处理文件在 `api-server/logic/`
3. 创建新的端点文件在 `api-server/endpoints/`
4. 在主应用文件中注册新端点

## Testing Protocol

按照项目宪法要求，所有测试必须使用MCP Playwright配合Edge浏览器进行，不得使用无头浏览器模式。

## Deployment

### GitHub Codespaces for Backend
- 推送代码到GitHub
- Codespaces将自动部署后端服务

### GitHub Pages for Frontend
- 将前端文件（index.html, web-app/, assets/）推送到gh-pages分支
- GitHub Pages将自动托管前端

## Troubleshooting

- 确保Python版本兼容性
- 检查端口是否被占用
- 验证API契约格式
- 查看服务器日志获取错误信息

## Next Steps

1. 实现具体的测试问题逻辑
2. 开发前端交互界面
3. 集成结果分析和反馈系统
4. 完善用户界面和体验

## API Documentation
访问 `http://localhost:8000/docs` 查看自动生成的API文档。
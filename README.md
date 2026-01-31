# Failure Logic - 认知陷阱教育互动游戏

通过互动式决策游戏，体验《失败的逻辑》揭示的人类思维局限，在安全的环境中学习和成长。

## 部署到 GitHub Pages

此项目已配置为可通过 GitHub Pages 访问。以下是部署说明：

### 自动部署

1. 确保您的代码推送到 `main` 分支
2. GitHub Actions 会自动构建并部署到 GitHub Pages
3. 访问地址：https://ptreezh.github.io/failurelogic/

### 手动部署

如果您想手动部署到 GitHub Pages：

1. 确保您的仓库启用了 GitHub Pages
2. 选择 `gh-pages` 分支或 `/docs` 文件夹作为源
3. 推送代码后，GitHub Actions 会自动处理部署

## 项目结构

- `index.html` - 主页面
- `manifest.json` - PWA 配置
- `sw.js` - Service Worker (支持离线访问)
- `assets/` - 静态资源 (CSS, JS, 图片, 图标)
- `api-server/` - 后端 API 服务

## 功能特性

- **认知训练场景** - 多种认知陷阱场景供学习
- **PWA 支持** - 可安装到主屏幕的应用体验
- **离线访问** - Service Worker 支持基本离线功能
- **响应式设计** - 适配各种设备屏幕
- **渐进式难度** - 从初级到高级的挑战模式

## API 配置

应用支持多种 API 端点配置，包括本地开发和云端部署。

## 认知科学基础

基于 Dietrich Dörner 的《失败的逻辑》理论，通过互动游戏体验：
- 系统思维与复杂性
- 认知偏差识别
- 决策模式分析
- 线性思维陷阱
- 时间延迟效应
- 确认偏误
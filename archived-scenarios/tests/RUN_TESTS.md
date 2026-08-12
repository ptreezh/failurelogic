# Playwright 测试指南

## 快速开始

### 方法 1: 使用 Playwright UI 模式 (推荐)

**Windows:**
```bash
cd tests
start-ui-mode.bat
```

**Mac/Linux:**
```bash
cd tests
npx playwright test --ui
```

这会：
1. 自动启动后端 API (端口 8000)
2. 启动前端服务器 (端口 3000)
3. 打开 Playwright UI 界面

### 方法 2: 运行所有测试

```bash
cd tests
npm test
```

### 方法 3: 运行特定测试文件

```bash
cd tests

# API 集成测试
npx playwright test api-integration.spec.js

# 场景交互测试
npx playwright test scenarios-interaction.spec.js

# 应用加载测试
npx playwright test app-load.spec.js

# 真实应用测试
npx playwright test real-app-tests-fixed-v2.spec.js
```

### 方法 4: 调试模式

```bash
cd tests
npm run test:debug
# 或
npx playwright test --debug
```

### 方法 5: 查看测试报告

```bash
cd tests
npm run test:report
# 或
npx playwright show-report
```

## 测试文件说明

| 测试文件 | 描述 |
|---------|------|
| `api-integration.spec.js` | API 端点集成测试 |
| `app-load.spec.js` | 应用加载和初始化测试 |
| `scenarios-interaction.spec.js` | 场景交互流程测试 |
| `bias-diagnosis.spec.js` | 认知偏差诊断测试 |
| `real-app-tests-fixed-v2.spec.js` | 真实应用功能测试 |

## 常见问题

### Q: Playwright UI 模式无法打开？
**A:** 确保：
1. Node.js 版本 >= 18.0.0
2. 已运行 `npm install` 和 `npx playwright install`
3. 端口 8000 和 3000 未被占用

### Q: 测试失败显示服务器未启动？
**A:** Playwright 配置会自动启动服务器，检查：
- `playwright.config.js` 中的 `webServer` 配置
- 等待足够时间让服务器启动（最多 2 分钟）

### Q: 如何在浏览器中看到测试过程？
**A:** 使用 `--headed` 参数：
```bash
npx playwright test --headed
```

### Q: 如何只运行一个测试？
**A:** 在测试文件中使用 `test.only`：
```javascript
test.only('my specific test', async ({ page }) => {
  // ...
});
```

## 部署 URL 测试

测试已部署的网站（无需本地服务器）：

```bash
# 设置环境变量指向 GitHub Pages
export BASE_URL=https://ptreezh.github.io/failurelogic/

# 运行测试
cd tests
npx playwright test
```

# 并发Playwright端到端测试智能体

本项目包含四个并发运行的Playwright测试智能体，用于全面测试Failure Logic平台的所有功能。

## 智能体说明

1. **场景导航智能体** - 测试场景页面导航和难度选择器功能
2. **计算器指数增长智能体** - 测试计算器和指数增长功能
3. **用户交互游戏智能体** - 测试用户交互和游戏流程
4. **API数据同步智能体** - 测试API连接和数据同步功能

## 系统要求

- Python 3.7+
- Microsoft Edge浏览器（推荐）或Chromium
- 已启动的Frontend服务（端口8081）
- 已启动的API服务（端口8082）

## 安装依赖

```bash
pip install -r test_requirements.txt
```

安装Playwright浏览器：

```bash
playwright install chromium
playwright install msedge
```

## 运行测试

### 方法1：使用批处理脚本（Windows）

```bash
install_and_run_tests.bat
```

### 方法2：手动运行

```bash
# 安装浏览器（首次运行时）
playwright install msedge

# 运行测试
python run_concurrent_agents.py
```

### 方法3：直接运行测试

```bash
python concurrent_e2e_test_agents_simple.py
```

## 报告生成

测试完成后会自动生成以下报告：

- `CONCURRENT_E2E_TEST_REPORT_YYYYMMDD_HHMMSS.md` - 综合测试报告
- `detailed_test_results_YYYYMMDD_HHMMSS.json` - 详细测试结果

## 测试内容

### 场景导航智能体
- 验证导航到场景页面的功能
- 测试难度选择器的切换功能
- 检查场景卡片的加载情况

### 计算器指数增长智能体
- 测试复利计算器功能
- 测试指数计算器功能
- 验证计算结果的正确性

### 用户交互游戏智能体
- 测试场景卡片的点击交互
- 验证各种输入控件的可用性
- 测试提交按钮等功能

### API数据同步智能体
- 测试API端点的连通性
- 验证数据同步功能
- 检查后端服务的响应

## 浏览器配置

所有测试均使用Microsoft Edge浏览器在非headless模式下运行，以确保：
- 可视化测试过程
- 更真实的用户交互模拟
- 便于调试和问题定位

## 故障排除

如果遇到Edge浏览器无法启动的问题，系统会自动降级使用Chromium浏览器。

如果服务未启动，请先启动相应的前端和API服务：

```bash
# 启动前端服务（在另一个终端）
cd web-app
python -m http.server 8081

# 启动API服务（在另一个终端）
cd api-server
python start.py
```
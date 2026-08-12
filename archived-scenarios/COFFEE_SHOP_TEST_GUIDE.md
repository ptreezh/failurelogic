# 咖啡店线性思维场景 - 测试指南

## 测试目标
验证咖啡店线性思维场景的所有问题已修复，游戏可以正常进行5轮。

## 测试环境要求

### 必需
- Python 3.7+
- Node.js 16+
- Playwright

### 可选
- 浏览器（Chrome/Edge/Firefox）

## 测试类型

### 1. 单元测试（手动）

#### 测试1: 游戏初始化
```
目的：验证游戏状态正确初始化
步骤：
1. 打开 test_coffee_shop_manual.html
2. 点击"运行所有测试"
3. 检查输出

预期结果：
✅ CoffeeShopPageRouter 类已加载
✅ 游戏初始化成功
✅ delayed_effects 正确初始化为数组
✅ 线性期望计算成功
✅ 回合总结计算成功
```

#### 测试2: 延迟效果安全检查
```
目的：验证所有边界情况都被正确处理
测试用例：
1. 空数组 []
2. undefined
3. null
4. 非数组对象 {}
5. 字符串 "not array"

预期结果：
✅ 所有情况都应该返回 { state: {...}, triggered: [] }
✅ 不应该抛出任何错误
```

#### 测试3: 线性期望计算
```
目的：验证线性期望计算逻辑
测试数据：
- coffeeVariety = 6
  期望: 新增3种 × 10顾客/种 = 30顾客
  期望利润: 30 × 9 - 3 × 15 = 225元

- promotionBudget = 100
  期望: 100 × 3 - 100 = 200元

预期结果：
✅ 期望值正确计算
✅ 显示正确的"线性思维"逻辑
```

### 2. 集成测试（自动化）

#### 测试4: 完整游戏流程
```
运行命令：
python test_coffee_shop_complete.py

测试步骤：
1. 导航到首页
2. 打开场景列表
3. 选择咖啡店场景
4. 开始游戏
5. 进行3轮决策
6. 验证教育内容
7. 检查游戏结束

预期结果：
✅ 无 delayedErrors.forEach 错误
✅ 游戏流程正常运行
✅ UI组件正常显示
✅ 教育关键词出现
```

#### 测试5: Playwright E2E测试
```
运行命令：
cd tests
npx playwright test coffee-shop

测试覆盖：
- 游戏加载
- 决策提交
- 结果显示
- 状态更新
- 延迟效果触发

预期结果：
✅ 所有测试通过
✅ 无控制台错误
✅ 无网络错误
```

### 3. 手动测试（浏览器）

#### 测试6: 用户交互流程
```
步骤：
1. 访问 http://localhost:3000
2. 点击"认知训练场景"
3. 选择"咖啡店线性思维"
4. 点击"开始挑战"
5. 查看游戏介绍
6. 调整决策滑块（如咖啡种类）
7. 点击"提交"或"继续"
8. 查看反馈页面
9. 重复5轮
10. 查看最终结果

预期结果：
✅ 游戏介绍清晰
✅ 滑块可调整
✅ 提交按钮可点击
✅ 反馈显示期望 vs 实际
✅ 第3轮揭示线性思维陷阱
✅ 最终结果显示总分和建议
```

#### 测试7: 边界情况测试
```
测试用例：
1. 最小值决策（咖啡种类=3）
2. 最大值决策（咖啡种类=10）
3. 极端组合（所有决策都选最大值）
4. 快速连续点击（测试防抖）
5. 页面刷新（测试状态保持）

预期结果：
✅ 所有值都在合理范围内
✅ 不会崩溃或卡死
✅ 状态正确更新
```

### 4. 性能测试

#### 测试8: 加载时间
```
目的：确保游戏加载迅速
测量指标：
- 首页加载时间 < 2秒
- 场景详情加载 < 1秒
- 游戏初始化 < 1秒
- 回合计算 < 500ms

工具：
- Chrome DevTools Performance
- Lighthouse
```

#### 测试9: 内存泄漏
```
目的：确保长时间运行不会内存泄漏
步骤：
1. 打开游戏
2. 进行10轮（重复开始）
3. 检查内存使用

预期结果：
✅ 内存使用稳定
✅ 无明显增长趋势
```

## 测试检查清单

### 基础功能
- [ ] 游戏可以正常启动
- [ ] 决策UI正常显示
- [ ] 可以提交决策
- [ ] 反馈页面正常显示
- [ ] 可以进入下一轮
- [ ] 游戏可以正常结束

### 线性思维教育
- [ ] 显示线性期望计算
- [ ] 显示实际结果
- [ ] 显示期望与实际的差距
- [ ] 第3轮揭示认知陷阱
- [ ] 提供改进建议

### 技术稳定性
- [ ] 无 JavaScript 错误
- [ ] 无网络错误
- [ ] 无内存泄漏
- [ ] 响应式设计正常
- [ ] 跨浏览器兼容

### 边界情况
- [ ] 空数组 delayed_effects
- [ ] undefined delayed_effects
- [ ] null delayed_effects
- [ ] 非数组 delayed_effects
- [ ] 极端决策值
- [ ] 快速连续操作

## 常见问题诊断

### 问题1: "delayedEffects.forEach is not a function"
```
原因：delayedEffects 不是数组
检查：
1. 查看浏览器控制台
2. 检查 AppState.gameSession.delayed_effects
3. 确认是数组类型 []

解决：
- 已修复：所有 applyDelayedEffects 都添加了 Array.isArray 检查
```

### 问题2: 游戏UI不显示
```
原因：DOM未正确渲染
检查：
1. #game-container 是否存在
2. window.coffeeShopRouter 是否定义
3. router.renderPage() 是否返回HTML

解决：
- 刷新页面
- 检查JavaScript是否加载
- 查看控制台错误
```

### 问题3: 决策无法提交
```
原因：事件处理器未绑定
检查：
1. 按钮是否有 onclick 属性
2. 函数是否定义
3. 作用域是否正确

解决：
- 确保 window.coffeeShopRouter 可访问
- 检查函数名拼写
- 确认在全局作用域
```

### 问题4: 教育内容不显示
```
原因：反馈生成逻辑问题
检查：
1. generateTurnFeedback 是否调用
2. 参数是否正确
3. DOM是否更新

解决：
- 查看反馈字符串内容
- 检查innerHTML赋值
- 确认页面渲染时机
```

## 测试报告模板

```markdown
# 测试执行报告

## 测试信息
- 测试日期：2026-02-06
- 测试人员：[姓名]
- 测试环境：[浏览器/版本]
- 测试类型：[单元/集成/E2E]

## 测试结果

### 通过的测试
- [x] 测试1: 游戏初始化
- [x] 测试2: 延迟效果安全检查
- [x] 测试3: 线性期望计算
- [ ] 测试4: 完整游戏流程
- [ ] 测试5: Playwright E2E测试
- [ ] 测试6: 用户交互流程
- [ ] 测试7: 边界情况测试
- [ ] 测试8: 加载时间
- [ ] 测试9: 内存泄漏

### 失败的测试
- [ ] 测试X: [描述]
  问题：[描述]
  截图：[链接]
  日志：[链接]

### 缺陷列表
1. [缺陷ID] [缺陷描述]
   严重性：[高/中/低]
   状态：[待修复/已修复]

### 建议
1. [建议1]
2. [建议2]

## 总结
通过率：X/9 (X%)
总体评价：[优/良/中/差]
```

## 快速验证命令

```bash
# 1. 启动服务器
cd tests && npx serve -l 3000 ..

# 2. 运行自动化测试
python test_coffee_shop_complete.py

# 3. 检查代码修复
grep -n "Array.isArray(delayedEffects)" ../assets/js/app.js

# 4. 验证初始化
grep -n "delayed_effects: \[\]" ../assets/js/app.js

# 5. 运行Playwright测试
cd tests && npx playwright test
```

## 持续集成

### GitHub Actions 配置
```yaml
name: Coffee Shop Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          pip install playwright
          npx playwright install
      - name: Run tests
        run: python test_coffee_shop_complete.py
```

## 测试覆盖率目标

- 代码覆盖率: > 80%
- 分支覆盖率: > 70%
- 功能覆盖率: 100%
- 边界情况: 100%

## 相关文档

- `COFFEE_SHOP_FIX_REPORT.md` - 详细修复报告
- `COFFEE_SHOP_QUICK_REFERENCE.md` - 快速参考
- `test_coffee_shop_complete.py` - 自动化测试
- `test_coffee_shop_manual.html` - 手动测试页面

---
最后更新：2026-02-06
维护者：Claude Code

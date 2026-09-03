# Soul 进化日志 - 回归核心

## v3.5.0 - 技术债修复 (2026-09-03)

### 修复完成

**Round 1 (P0 紧急)**:
- ✅ API keys 从 git history 清除 (filter-repo)
- ✅ .gitignore 阻止 .env / .kode-config.json
- ✅ eval() 移除（time-delay-model.js）
- ✅ window.fetch monkey-patch 撤销
- ✅ 3 个 0 字节 router 删除
- ✅ sw.js 404 CSS 引用修复 + cache 扩展
- ✅ SafeRender 工具 + 5 处 coffee-shop 净化基线

**Round 2 (P1 架构)**:
- ✅ 4 个 Python 源文件恢复（exponential_calculations / compound_interest / data/scenarios / loaders/scenario_loader）
- ✅ start.py 部分拆分（1759 → 1641 行）
- ✅ endpoints/scenarios.py 死代码删除（路由冲突）
- ✅ Dockerfile 修复（用对 requirements）
- ✅ GitHub Pages 排除 .env / archived-scenarios
- ✅ pytest 基础设施 + 39 个新测试（56 总测试全过）

**Round 3 (P2/P3 清理)**:
- ✅ 死配置删除（vercel.json / Procfile / railway.toml / deploy-to-railway.yml）
- ✅ 端口统一到 8000
- ✅ 文档同步（README / CLAUDE.md）

**安全状态**：0 真实密钥在 git / 0 处 eval / 0 处 fetch 重写
**测试状态**：56 pytest 全过 / 47 Playwright E2E 全过
**下一步**：手动轮换 API key（OpenRouter + NVIDIA）

---

## v3.4.0 - 觉醒系统增强 (2026-03-15)

### 系统验证结果

**E2E测试**: 47 个 Playwright 用例（最近一次全部通过）
**场景数据**: 14个场景已添加cognitiveBiasMapping
**觉醒系统**: 14个场景的反直觉揭示知识
**核心模块**: ✅ 语法检查通过
**系统状态**: ✅ 100%可用

### 本次增强

**觉醒时刻系统增强**：
- 为所有14个场景添加了专门的反直觉揭示知识
- 每个场景配置了直觉vs现实的对比
- 配置了认知偏差解释说明

**反直觉揭示场景覆盖**：
```
coffee-shop         → 线性思维vs系统反馈
relationship        → 即时回报vs延迟效应
investment          → 支持性证据vs风险信号
business-strategy   → 线性增长vs非线性转折
public-policy       → 立竿见影vs延迟显现
personal-finance    → 复利微不足道vs复利威力
climate-change      → 可见效果vs系统惯性
ai-governance       → 可控风险vs涌现行为
financial-crisis    → 救助vs道德风险
titanic             → 信心vs过度自信
pig-bay             → 集体决策vs群体思维
love-relationship   → 理想化vs现实兼容性
```

### 核心模块

```
assets/js/
├── cognitive-bias-diagnosis-core.js (~742行)
├── scenario-experience-enhancer.js (~350行)
└── awakening-moment-system.js (~650行) ← 增强
```

---

**永不停止，永远聚焦核心使命！**

# Qwen Superpowers

将 OpenCode 的 Superpowers 技能系统迁移到 Qwen 环境中，提供增强的 AI 功能和自动化能力。

## 概述

Qwen Superpowers 是一套为 Qwen 环境设计的高级技能集合，旨在提升 AI 代理的能力，包括但不限于：
- 高级规划和任务管理
- 代码理解和生成
- 系统管理和自动化
- 研究和分析工具

## 安装先决条件

- 已安装 Qwen 环境
- 已配置适当的权限以添加自定义技能

## 安装步骤

1. 将此目录中的技能文件复制到 Qwen 的技能目录中
2. 根据需要启用特定技能
3. 重启 Qwen 以加载新技能

## 技能优先级

Qwen Superpowers 遵循以下技能优先级：
- 项目技能 > 个人技能 > Qwen Superpowers 技能

## 技能类型

### 1. 个人技能
个人技能适用于所有项目，存放在用户配置目录中：
- 路径：`~/.qwen/skills/` (或 Qwen 配置目录中的相应路径)

### 2. 项目技能
项目技能仅适用于特定项目，存放在项目根目录中：
- 路径：`./.qwen/skills/` (项目根目录下的 .qwen/skills/)

### 3. Qwen Superpowers 技能
这些是预定义的通用技能，适用于各种场景。

## 如何使用技能

在 Qwen 对话中，您可以使用以下方式调用技能：

- 直接提及技能名称
- 使用特定的指令触发相关技能
- 通过上下文让 Qwen 自动选择合适的技能

## 当前可用技能

以下技能已迁移至 Qwen 环境：

1. **Advanced Planning** - 高级任务规划和管理
2. **Code Analysis** - 代码理解和分析
3. **System Automation** - 系统管理和自动化
4. **Research Assistant** - 研究和分析辅助

## 附加功能

此外，还包括：

5. **Context Injection Hooks** - 根据对话内容自动注入相关上下文

## 故障排除

如果技能未按预期工作：

1. 确认技能文件已正确放置在 Qwen 技能目录中
2. 检查文件权限是否允许 Qwen 读取技能文件
3. 重启 Qwen 以确保新技能被加载

## 更新 Superpowers

要更新到最新版本的 Superpowers：

1. 从源获取最新版本的技能文件
2. 替换本地的技能文件
3. 重启 Qwen 以加载更新

## 工具映射

当技能引用特定工具时，Qwen 环境中对应的工具如下：
- `TodoWrite` → 使用 `todo_write` 工具
- `FindSkills` → 使用 `grep_search` 或 `glob` 工具
- `UseSkill` → 使用 Qwen 内置技能系统
- 文件操作 → 使用 `read_file`, `edit`, `write_file` 等工具
- 搜索操作 → 使用 `web_search`, `grep_search` 等工具
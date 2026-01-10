# NVIDIA NIM 探索技能

## 描述
直接访问 NVIDIA NIM 集成主页 (https://build.nvidia.com/explore/discover)，获取可用的模型和蓝图信息。

## 使用方式

```python
from tools.nvidia_nim_explorer import (
    explore_nvidia_nim,
    search_models,
    search_blueprints
)

# 1. 探索所有可用的模型和蓝图
result = explore_nvidia_nim()

# 2. 搜索特定模型
models = search_models("reasoning")

# 3. 搜索特定蓝图
blueprints = search_blueprints("RAG")
```

## 功能

- **探索 NIM 主页**: 获取所有特色模型、蓝图和工具信息
- **模型搜索**: 在已知模型中搜索匹配的模型
- **蓝图搜索**: 在已知蓝图中搜索匹配的蓝图

## 示例输出

```json
{
  "featured_models": [
    {
      "id": "nvidianemotron-3-nano-30b-a3b",
      "name": "nvidianemotron-3-nano-30b-a3b",
      "description": "Open, efficient MoE model with 1M context, excelling in coding, reasoning, instruction following, tool calling, and more"
    }
  ],
  "blueprints": [...],
  "tools": [...],
  "explore_url": "https://build.nvidia.com/explore/discover"
}
```

## 更多信息
- 官方主页: https://build.nvidia.com/explore/discover
- 包含 Nemotron、Qwen 等主流模型
- 包含企业 RAG、视频搜索等蓝图的完整信息

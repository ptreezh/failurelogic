"""
NVIDIA NIM 探索技能
直接访问 NVIDIA NIM 集成主页，获取可用的模型和蓝图信息
"""

import json
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class NIMModel:
    """NIM 模型信息"""
    name: str
    description: str
    category: str = "featured"


@dataclass
class NIMBlueprint:
    """NIM 蓝图信息"""
    name: str
    description: str
    category: str = "blueprint"


# 预定义的模型和蓝图信息（基于 https://build.nvidia.com/explore/discover）
KNOWN_MODELS = {
    "nvidianemotron-3-nano-30b-a3b": {
        "description": "Open, efficient MoE model with 1M context, excelling in coding, reasoning, instruction following, tool calling, and more",
        "category": "featured"
    },
    "nvidianemotron-nano-12b-v2-vl": {
        "description": "Nemotron Nano 12B v2 VL enables multi-image and video understanding, along with visual Q&A and summarization capabilities.",
        "category": "featured"
    },
    "openaigpt-oss-20b": {
        "description": "Smaller Mixture of Experts (MoE) text-only LLM for efficient AI reasoning and math",
        "category": "featured"
    },
    "qwenqwen3-next-80b-a3b-thinking": {
        "description": "80B parameter AI model with hybrid reasoning, MoE architecture, support for 119 languages.",
        "category": "featured"
    }
}

KNOWN_BLUEPRINTS = {
    "cyborg": {
        "description": "Cyborg Enterprise RAG - Securely extract, embed, and index multimodal data with encryption in-use for fast, accurate semantic search.",
        "category": "blueprint"
    },
    "h2o": {
        "description": "H2O.ai Flood Intelligence - Provides real-time, scalable intelligence for AI-powered disaster management.",
        "category": "blueprint"
    },
    "enterprise-research": {
        "description": "Build an AI Agent for Enterprise Research - Build a custom enterprise research assistant powered by state-of-the-art models.",
        "category": "blueprint"
    },
    "video-search": {
        "description": "Build a Video Search and Summarization (VSS) Agent - Ingest massive volumes of live or archived videos and extract insights.",
        "category": "blueprint"
    }
}

DATA_DESIGNER = {
    "name": "NeMo Data Designer",
    "description": "Create high-quality, domain-specific synthetic datasets at scale with NeMo Data Designer.",
    "category": "tool"
}


def explore_nvidia_nim() -> Dict:
    """
    探索 NVIDIA NIM 集成主页，返回所有可用的模型和蓝图信息
    
    Returns:
        Dict 包含模型、蓝图和工具的信息
    """
    return {
        "featured_models": [
            {
                "id": model_id,
                "name": model_id,
                "description": info["description"],
                "category": info["category"],
                "url": f"https://build.nvidia.com/{model_id.replace('.', '-')}"
            }
            for model_id, info in KNOWN_MODELS.items()
        ],
        "blueprints": [
            {
                "id": blueprint_id,
                "name": name,
                "description": info["description"],
                "category": info["category"],
                "url": f"https://build.nvidia.com/{blueprint_id}"
            }
            for blueprint_id, info in KNOWN_BLUEPRINTS.items()
        ],
        "tools": [
            {
                "name": DATA_DESIGNER["name"],
                "description": DATA_DESIGNER["description"],
                "category": "data-design",
                "url": "https://build.nvidia.com/nemo/data-designer"
            }
        ],
        "explore_url": "https://build.nvidia.com/explore/discover",
        "total_models": len(KNOWN_MODELS),
        "total_blueprints": len(KNOWN_BLUEPRINTS)
    }


def search_models(query: str) -> List[Dict]:
    """
    在已知模型中搜索匹配的模型
    
    Args:
        query: 搜索关键词
        
    Returns:
        匹配的模型列表
    """
    query_lower = query.lower()
    results = []
    
    for model_id, info in KNOWN_MODELS.items():
        if query_lower in model_id.lower() or query_lower in info["description"].lower():
            results.append({
                "id": model_id,
                "name": model_id,
                "description": info["description"],
                "url": f"https://build.nvidia.com/{model_id.replace('.', '-')}"
            })
    
    return results


def search_blueprints(query: str) -> List[Dict]:
    """
    在已知蓝图中搜索匹配的蓝图
    
    Args:
        query: 搜索关键词
        
    Returns:
        匹配的蓝图列表
    """
    query_lower = query.lower()
    results = []
    
    for blueprint_id, info in KNOWN_BLUEPRINTS.items():
        name_lower = info["description"].lower()
        if query_lower in blueprint_id.lower() or query_lower in name_lower:
            results.append({
                "id": blueprint_id,
                "name": info["description"].split(" - ")[0] if " - " in info["description"] else blueprint_id,
                "description": info["description"],
                "url": f"https://build.nvidia.com/{blueprint_id}"
            })
    
    return results


if __name__ == "__main__":
    # 测试
    result = explore_nvidia_nim()
    print(json.dumps(result, indent=2, ensure_ascii=False))

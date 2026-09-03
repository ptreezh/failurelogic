"""
场景加载器模块
提供从 JSON 数据文件加载场景的能力

重建日期: 2026-09-03 (R2.3 修复)
基于反编译 loaders/__pycache__/scenario_loader.cpython-312.pyc 的类/函数签名恢复
注: 当前 active 代码未使用此模块，但保留以供未来扩展
"""

import json
import os
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


@dataclass
class Scenario:
    """场景数据类"""
    id: str
    name: str
    description: str = ""
    fullDescription: str = ""
    difficulty: str = "beginner"
    estimatedDuration: int = 15
    targetBiases: Optional[List[str]] = None
    cognitiveBias: str = ""
    duration: str = ""
    category: str = ""
    thumbnail: str = ""

    def __post_init__(self):
        if self.targetBiases is None:
            self.targetBiases = []


def get_data_dir() -> str:
    """获取数据目录路径"""
    return os.path.abspath(DATA_DIR)


def load_json_file(filename: str) -> Any:
    """加载 JSON 文件"""
    full_path = os.path.join(get_data_dir(), filename)
    if not os.path.exists(full_path):
        return None
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return None


def normalize_scenario(scenario: Dict[str, Any], scenario_type: str = "basic") -> Dict[str, Any]:
    """标准化场景数据，添加 scenarioType 字段"""
    out = dict(scenario)
    out.setdefault("scenarioType", scenario_type)
    return out


class ScenarioLoader:
    """场景加载器（带缓存）"""
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def load_all(self, cache_enabled: bool = True) -> List[Dict[str, Any]]:
        """加载所有场景"""
        if cache_enabled and "all" in self._cache:
            return self._cache["all"]
        scenarios: List[Dict[str, Any]] = []
        for filename in ("game_scenarios.json", "advanced_game_scenarios.json", "historical_cases.json"):
            data = load_json_file(filename)
            if isinstance(data, dict):
                for key in ("scenarios", "game_scenarios", "advanced_scenarios", "historical_cases"):
                    if key in data and isinstance(data[key], list):
                        scenarios.extend(data[key])
        if cache_enabled:
            self._cache["all"] = scenarios
        return scenarios

    def load_by_id(self, scenario_id: str, cache_enabled: bool = True) -> Optional[Dict[str, Any]]:
        """按 ID 加载场景"""
        if cache_enabled and scenario_id in self._cache:
            return self._cache[scenario_id]
        for s in self.load_all(cache_enabled=cache_enabled):
            if s.get("id") == scenario_id or s.get("scenarioId") == scenario_id:
                if cache_enabled:
                    self._cache[scenario_id] = s
                return s
        return None


def load_all_scenarios(cache_enabled: bool = True) -> List[Dict[str, Any]]:
    """便捷函数：加载所有场景"""
    return ScenarioLoader().load_all(cache_enabled=cache_enabled)


def load_by_id(scenario_id: str, cache_enabled: bool = True) -> Optional[Dict[str, Any]]:
    """便捷函数：通过 ID 加载场景"""
    return ScenarioLoader().load_by_id(scenario_id, cache_enabled=cache_enabled)

"""
SemIf 本地决策评分客户端

单例加载 Qwen3.5-4B (或指定模型)，对外提供 score_decision()，
供 interactive.analyze_decision 使用。

环境变量：
- SEMIF_MODEL_DIR: 模型目录，默认 D:\\AIDevelop\\failureLogic\\SemIf\\models\\Qwen3.5-4B-v2
- SEMIF_REVISION: 模型 revision，默认 851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a
- SEMIF_DEVICE: cuda / cpu / auto，默认 cuda
- SEMIF_DTYPE: bfloat16 / float16 / float32，默认 bfloat16
- SEMIF_MAX_TOKENS: 最大 token 数，默认 4096
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_SEMIF_MODEL = None
_SEMIF_TOKENIZER = None
_SEMIF_METADATA: Dict[str, Any] = {}


def _get_config() -> Dict[str, str]:
    return {
        "model_dir": os.getenv("SEMIF_MODEL_DIR", r"D:\AIDevelop\failureLogic\SemIf\models\Qwen3.5-4B-v2"),
        "revision": os.getenv("SEMIF_REVISION", "851bf6e806efd8d0a36b00ddf55e13ccb7b8cd0a"),
        "device": os.getenv("SEMIF_DEVICE", "cuda"),
        "dtype": os.getenv("SEMIF_DTYPE", "bfloat16"),
        "max_tokens": int(os.getenv("SEMIF_MAX_TOKENS", "4096")),
    }


def _load_model():
    global _SEMIF_MODEL, _SEMIF_TOKENIZER, _SEMIF_METADATA
    if _SEMIF_MODEL is not None and _SEMIF_TOKENIZER is not None:
        return _SEMIF_MODEL, _SEMIF_TOKENIZER, _SEMIF_METADATA

    cfg = _get_config()
    model_dir = cfg["model_dir"]
    revision = cfg["revision"]
    device = cfg["device"]
    dtype_str = cfg["dtype"]
    max_tokens = cfg["max_tokens"]

    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, AutoConfig

    logger.info("Loading SemIf model from %s (revision=%s, device=%s, dtype=%s)", model_dir, revision, device, dtype_str)

    tokenizer = AutoTokenizer.from_pretrained(model_dir, revision=revision, trust_remote_code=True)
    config = AutoConfig.from_pretrained(model_dir, revision=revision, trust_remote_code=True)

    dtype_map = {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }
    torch_dtype = dtype_map.get(dtype_str, torch.bfloat16)

    model_kwargs: Dict[str, Any] = {
        "config": config,
        "trust_remote_code": True,
        "torch_dtype": torch_dtype,
        "low_cpu_mem_usage": True,
    }
    if device != "cpu":
        model_kwargs["device_map"] = "auto"

    model = AutoModelForCausalLM.from_pretrained(model_dir, revision=revision, **model_kwargs)

    if device == "cpu":
        model.to("cpu")
    elif device == "cuda":
        torch.cuda.synchronize()

    metadata = {
        "source": os.path.abspath(model_dir),
        "revision": revision,
        "dtype": dtype_str,
        "device": str(next(model.parameters()).device),
        "torch_version": torch.__version__,
        "transformers_version": _get_transformers_version(),
    }

    _SEMIF_MODEL = model
    _SEMIF_TOKENIZER = tokenizer
    _SEMIF_METADATA = metadata

    logger.info("SemIf model loaded on %s", metadata["device"])
    return model, tokenizer, metadata


def _get_transformers_version() -> str:
    try:
        import transformers
        return transformers.__version__
    except Exception:
        return "unknown"


def _validate_row(row: Dict[str, Any]) -> None:
    required = {"id", "state", "question", "options"}
    missing = required - row.keys()
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    if not isinstance(row["options"], list) or len(row["options"]) < 2:
        raise ValueError("options must be a list with at least 2 items")
    for opt in row["options"]:
        if not isinstance(opt, dict) or "id" not in opt or "description" not in opt:
            raise ValueError("Each option must have id and description")


def score_decision(
    decision_id: str,
    state: str,
    question: str,
    options: List[Dict[str, str]],
    max_tokens: Optional[int] = None,
) -> Dict[str, Any]:
    """
    对单个决策进行评分。

    Args:
        decision_id: 决策唯一标识
        state: 当前状态描述
        question: 决策问题
        options: [{"id": "a", "description": "..."}, ...]
        max_tokens: 覆盖默认值

    Returns:
        {
            "id": ...,
            "option_ids": [...],
            "probabilities": [...],
            "option_logits": [...],
            "input_tokens": ...,
            "forward_seconds": ...,
            "total_seconds": ...,
            "winner": "option_id",
            "winner_probability": float,
        }
    """
    import time

    cfg = _get_config()
    model, tokenizer, metadata = _load_model()
    max_tokens = max_tokens or int(cfg["max_tokens"])

    row = {
        "id": decision_id,
        "state": state,
        "question": question,
        "options": options,
    }
    _validate_row(row)

    started = time.perf_counter()
    ids, slots, prompt_hash = _encode_prompt(tokenizer, row, max_tokens)

    import torch
    device = next(model.parameters()).device
    inputs = {
        "input_ids": torch.tensor([ids], dtype=torch.long, device=device),
        "attention_mask": torch.ones((1, len(ids)), dtype=torch.long, device=device),
    }

    torch.cuda.synchronize() if device.type == "cuda" else None
    forward_start = time.perf_counter()

    with torch.inference_mode():
        logits = model(**inputs, use_cache=False, return_dict=True).logits[:, -1, :].float()

    torch.cuda.synchronize() if device.type == "cuda" else None
    selected = logits[0][slots].cpu().tolist()

    probs = _softmax(selected)
    option_ids = [opt["id"] for opt in options]
    winner_idx = probs.index(max(probs))

    return {
        "id": decision_id,
        "option_ids": option_ids,
        "probabilities": probs,
        "option_logits": selected,
        "input_tokens": len(ids),
        "forward_seconds": time.perf_counter() - forward_start,
        "total_seconds": time.perf_counter() - started,
        "prompt_sha256": prompt_hash,
        "prompt_version": "direct-options-v1",
        "model": metadata,
        "readout": "native full-vocabulary last-position logits restricted to declared answer slots",
        "probability_status": "conditional option score; uncalibrated as decision confidence",
        "winner": option_ids[winner_idx],
        "winner_probability": probs[winner_idx],
    }


def _encode_prompt(tokenizer, row: Dict[str, Any], max_tokens: int):
    from semif_phase1.core import LETTERS, digest, direct_messages

    prompt = tokenizer.apply_chat_template(
        direct_messages(row), tokenize=False, add_generation_prompt=True, enable_thinking=False
    )
    ids = tokenizer.encode(prompt, add_special_tokens=False)
    if not ids or len(ids) > max_tokens:
        raise ValueError(f"Row {row['id']}: {len(ids)} input tokens exceed limit {max_tokens}")

    slots = _slot_ids(tokenizer, len(row["options"]))
    for letter, token in zip(LETTERS, slots):
        if tokenizer.encode(prompt + letter, add_special_tokens=False) != ids + [token]:
            raise ValueError(f"Answer boundary changes tokenization for slot {letter}")

    return ids, slots, digest(prompt)


def _slot_ids(tokenizer, count: int) -> List[int]:
    from semif_phase1.core import LETTERS
    result = []
    for letter in LETTERS[:count]:
        encoded = tokenizer.encode(letter, add_special_tokens=False)
        if len(encoded) != 1 or tokenizer.decode(encoded) != letter:
            raise ValueError(f"Answer slot {letter!r} is not one exact round-trip token")
        result.append(encoded[0])
    if len(result) != len(set(result)):
        raise ValueError("Answer-slot tokens collide")
    return result


def _softmax(logits: List[float]) -> List[float]:
    import math
    max_val = max(logits)
    exps = [math.exp(x - max_val) for x in logits]
    total = sum(exps)
    return [e / total for e in exps]

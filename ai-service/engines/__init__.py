"""Engine registry: add a new model by importing its class here.

The service auto-detects which engines are actually usable on this
machine (dependencies installed) and reports them via /health.
"""
from .base import AnalysisResult, Engine, Region, Series
from .lungmask_engine import LungmaskEngine
from .statistical import StatisticalEngine
from .totalseg_engine import TotalSegmentatorEngine

# Order matters: "auto" picks the first available engine that supports
# the study's modality; the statistical baseline is the safety net.
ENGINE_CLASSES: list[type[Engine]] = [
    LungmaskEngine,
    TotalSegmentatorEngine,
    StatisticalEngine,
]


def list_engines() -> list[dict]:
    return [
        {
            "id": cls.id,
            "name": cls.name,
            "description": cls.description,
            "modalities": list(cls.modalities),
            "ready": cls.available(),
        }
        for cls in ENGINE_CLASSES
    ]


def pick_engine(engine_id: str, modality: str) -> Engine:
    modality = modality.upper()
    if engine_id != "auto":
        for cls in ENGINE_CLASSES:
            if cls.id == engine_id:
                if not cls.available():
                    raise LookupError(f"Движок '{engine_id}' не готов: зависимости не установлены")
                return cls()
        raise LookupError(f"Неизвестный движок '{engine_id}'")
    for cls in ENGINE_CLASSES:
        if cls.available() and (modality in cls.modalities or not cls.modalities):
            return cls()
    return StatisticalEngine()


__all__ = [
    "AnalysisResult",
    "Engine",
    "Region",
    "Series",
    "ENGINE_CLASSES",
    "list_engines",
    "pick_engine",
]

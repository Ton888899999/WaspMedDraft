"""Engine contract: every model plugs in by implementing Engine.

A region is an attention cue for the physician in normalized slice
coordinates — the same shape the web/desktop UI already renders.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import numpy as np


@dataclass
class Series:
    """Ordered DICOM series prepared for inference."""

    modality: str                 # "CT", "MR", ...
    pixels: np.ndarray            # float32, shape (slices, rows, cols), rescaled (HU for CT)
    slice_numbers: list[int]      # 1-based numbers matching the UI viewer
    spacing_mm: tuple[float, float, float] | None = None  # (z, y, x) if known


@dataclass
class Region:
    slice_number: int             # 1-based
    cx: float                     # percent 0-100
    cy: float
    rx: float
    ry: float
    score: float
    mean_value: float
    label: str

    def to_json(self) -> dict:
        return {
            "sliceNumber": self.slice_number,
            "cx": self.cx,
            "cy": self.cy,
            "rx": self.rx,
            "ry": self.ry,
            "score": self.score,
            "meanValue": self.mean_value,
            "label": self.label,
        }


@dataclass
class AnalysisResult:
    regions: list[Region]
    summary: str                          # short human-readable summary (Russian)
    extra: dict = field(default_factory=dict)  # engine-specific payload (volumes, masks meta...)


class Engine(ABC):
    """A pluggable analysis engine. Implement, then register in engines/__init__.py."""

    id: str = "base"
    name: str = "Base engine"
    description: str = ""
    modalities: tuple[str, ...] = ("CT", "MR")

    @classmethod
    def available(cls) -> bool:
        """True when the engine's dependencies/weights are installed."""
        return False

    @abstractmethod
    def analyze(self, series: Series) -> AnalysisResult: ...

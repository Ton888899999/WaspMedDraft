"""TotalSegmentator adapter (real ML model, Apache-2.0 for the `total` task).

Becomes active automatically after `pip install TotalSegmentator`.
Runs organ segmentation on CT (fast 3 mm mode, CPU-capable) and returns
a study-level summary of segmented structures with volumes. Regions are
not produced by this engine — it enriches the report, while region-level
attention comes from `statistical` or `lungmask`.
"""
from __future__ import annotations

import tempfile

import numpy as np

from .base import AnalysisResult, Engine, Series

try:
    import nibabel as nib  # type: ignore
    from totalsegmentator.python_api import totalsegmentator  # type: ignore

    _AVAILABLE = True
except ImportError:
    _AVAILABLE = False


class TotalSegmentatorEngine(Engine):
    id = "totalsegmentator"
    name = "TotalSegmentator (органы, --fast)"
    description = (
        "Реальная ML-модель (nnU-Net, Apache-2.0): сегментация 117 структур на КТ. "
        "Возвращает перечень структур и объёмы для протокола."
    )
    modalities = ("CT",)

    @classmethod
    def available(cls) -> bool:
        return _AVAILABLE

    def analyze(self, series: Series) -> AnalysisResult:
        if series.spacing_mm is None:
            return AnalysisResult(
                regions=[],
                summary="TotalSegmentator: в серии нет информации о вокселе (spacing) — пропущено.",
            )
        z, y, x = series.spacing_mm
        affine = np.diag([x, y, z, 1.0])
        volume = np.transpose(series.pixels, (2, 1, 0)).astype(np.float32)

        with tempfile.TemporaryDirectory() as tmp:
            nii_path = f"{tmp}/study.nii.gz"
            nib.save(nib.Nifti1Image(volume, affine), nii_path)
            seg = totalsegmentator(nii_path, output=None, fast=True, ml=True, quiet=True)
            seg_data = np.asarray(seg.dataobj)
            label_map = {int(k): v for k, v in seg.header.extensions[0].get_content().items()} \
                if seg.header.extensions else {}

        voxel_ml = (x * y * z) / 1000.0
        organs: dict[str, float] = {}
        for label in np.unique(seg_data):
            if label == 0:
                continue
            name = label_map.get(int(label), f"structure_{int(label)}")
            organs[name] = round(float((seg_data == label).sum()) * voxel_ml, 1)

        top = sorted(organs.items(), key=lambda kv: kv[1], reverse=True)[:15]
        listing = ", ".join(f"{name} ({ml} мл)" for name, ml in top)
        return AnalysisResult(
            regions=[],
            summary=f"Сегментировано структур: {len(organs)}. Крупнейшие: {listing}.",
            extra={"organVolumesMl": organs},
        )

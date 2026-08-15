"""lungmask R231 adapter (real ML model, Apache-2.0, CPU-capable).

Becomes active automatically after `pip install lungmask` (pulls torch).
Segments both lungs on CT, then flags dense tissue inside the lung mask
(consolidation / effusion candidates) as attention regions.
"""
from __future__ import annotations

import numpy as np

from .base import AnalysisResult, Engine, Region, Series

try:
    from lungmask import LMInferer  # type: ignore
    import SimpleITK as sitk  # type: ignore

    _AVAILABLE = True
except ImportError:
    _AVAILABLE = False

# Lung tissue is air-filled (< -500 HU). Values above this inside the
# lung mask are "dense" — consolidation, mass, fluid, atelectasis.
DENSE_HU = -300.0
MIN_DENSE_FRACTION = 0.07  # slice flagged when >7% of lung area is dense


class LungmaskEngine(Engine):
    id = "lungmask"
    name = "lungmask R231 (сегментация лёгких)"
    description = (
        "Реальная ML-модель (U-Net, Apache-2.0): сегментация лёгких на КТ + "
        "поиск уплотнений лёгочной ткани внутри маски."
    )
    modalities = ("CT",)

    @classmethod
    def available(cls) -> bool:
        return _AVAILABLE

    def analyze(self, series: Series) -> AnalysisResult:
        image = sitk.GetImageFromArray(series.pixels.astype(np.float32))
        if series.spacing_mm is not None:
            z, y, x = series.spacing_mm
            image.SetSpacing((x, y, z))

        inferer = LMInferer(modelname="R231")
        mask = inferer.apply(image)  # (slices, rows, cols); 0 bg, 1 right, 2 left

        lung_voxels = int((mask > 0).sum())
        regions: list[Region] = []
        candidates: list[tuple[float, Region]] = []

        for i in range(series.pixels.shape[0]):
            lung = mask[i] > 0
            area = int(lung.sum())
            if area < 500:
                continue
            dense = lung & (series.pixels[i] > DENSE_HU)
            frac = float(dense.sum()) / area
            if frac < MIN_DENSE_FRACTION:
                continue
            ys, xs = np.nonzero(dense)
            rows, cols = series.pixels[i].shape
            cy = float(ys.mean()) / rows * 100
            cx = float(xs.mean()) / cols * 100
            ry = min(max(3.5, float(ys.std()) * 2.2 / rows * 100), 24)
            rx = min(max(3.5, float(xs.std()) * 2.2 / cols * 100), 24)
            mean_hu = float(series.pixels[i][dense].mean())
            region = Region(
                slice_number=series.slice_numbers[i],
                cx=cx, cy=cy, rx=rx, ry=ry,
                score=round(frac * 100, 1),
                mean_value=mean_hu,
                label=f"Уплотнение лёгочной ткани · {frac * 100:.0f}% площади · {round(mean_hu)} HU",
            )
            candidates.append((frac, region))

        candidates.sort(key=lambda t: t[0], reverse=True)
        min_gap = max(2, series.pixels.shape[0] // 12)
        for _, region in candidates:
            if any(abs(r.slice_number - region.slice_number) < min_gap for r in regions):
                continue
            regions.append(region)
            if len(regions) >= 5:
                break

        summary = (
            f"Лёгкие сегментированы ({lung_voxels} вокселей). "
            + (f"Срезов с уплотнением ткани: {len(candidates)}." if candidates
               else "Значимых уплотнений лёгочной ткани не выявлено.")
        )
        return AnalysisResult(regions=regions, summary=summary, extra={"lungVoxels": lung_voxels})

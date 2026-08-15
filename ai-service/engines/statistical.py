"""Baseline engine: robust statistical density scan (no ML weights).

Mirrors the in-browser analyzer so the service always has a working
engine, and serves as the reference implementation of the contract.
"""
from __future__ import annotations

import numpy as np

from .base import AnalysisResult, Engine, Region, Series


class StatisticalEngine(Engine):
    id = "statistical"
    name = "Статистический анализ плотности"
    description = (
        "Robust-статистика по блокам ткани каждого среза (медиана + MAD). "
        "Отмечает зоны аномальной локальной плотности. Не является ML-моделью."
    )
    modalities = ("CT", "MR", "OT")

    @classmethod
    def available(cls) -> bool:
        return True

    def analyze(self, series: Series) -> AnalysisResult:
        is_ct = series.modality.upper() == "CT"
        n_slices = series.pixels.shape[0]
        step = max(1, n_slices // 120)

        candidates: list[Region] = []
        for i in range(0, n_slices, step):
            region = self._analyze_slice(series.pixels[i], series.slice_numbers[i], is_ct)
            if region is not None:
                candidates.append(region)

        candidates.sort(key=lambda r: r.score, reverse=True)
        min_gap = max(2, round(n_slices / 12))
        picked: list[Region] = []
        for c in candidates:
            if c.score < 2.6:
                break
            if any(abs(p.slice_number - c.slice_number) < min_gap for p in picked):
                continue
            picked.append(c)
            if len(picked) >= 3:
                break

        summary = (
            f"Отмечено зон внимания: {len(picked)}"
            if picked
            else "Значимых статистических отклонений плотности не выявлено"
        )
        return AnalysisResult(regions=picked, summary=summary)

    def _analyze_slice(self, values: np.ndarray, slice_number: int, is_ct: bool) -> Region | None:
        rows, cols = values.shape
        bs = max(8, min(rows, cols) // 24)
        grows, gcols = rows // bs, cols // bs
        if grows < 4 or gcols < 4:
            return None

        v = values[: grows * bs, : gcols * bs].reshape(grows, bs, gcols, bs)
        body_threshold = -400.0 if is_ct else float(values.max()) * 0.12
        body = v > body_threshold
        body_frac = body.mean(axis=(1, 3))
        sums = np.where(body, v, 0.0).sum(axis=(1, 3))
        counts = body.sum(axis=(1, 3))
        means = np.where(counts > 0, sums / np.maximum(counts, 1), body_threshold)

        usable = np.zeros((grows, gcols), dtype=bool)
        usable[1:-1, 1:-1] = body_frac[1:-1, 1:-1] > 0.6
        if usable.sum() < 12:
            return None

        tissue = means[usable]
        median = float(np.median(tissue))
        p10, p90 = np.percentile(tissue, [10, 90])
        spread = max(float(p90 - p10), 1e-3)
        mad_floor = 6.0 if is_ct else spread * 0.04
        mad = max(float(np.median(np.abs(tissue - median))), mad_floor)
        min_abs_dev = 25.0 if is_ct else spread * 0.45

        dev = np.abs(means - median)
        scores = np.where(usable & (dev >= min_abs_dev), dev / (mad * 1.4826), 0.0)
        best = float(scores.max())
        if best <= 0:
            return None
        by, bx = np.unravel_index(int(scores.argmax()), scores.shape)

        # Grow over neighbours with a comparable deviation.
        y0, y1 = max(0, by - 2), min(grows - 1, by + 2)
        x0, x1 = max(0, bx - 2), min(gcols - 1, bx + 2)
        neigh = scores[y0 : y1 + 1, x0 : x1 + 1] > best * 0.55
        neigh_frac_ok = body_frac[y0 : y1 + 1, x0 : x1 + 1] > 0.5
        mask = neigh & neigh_frac_ok
        mask[by - y0, bx - x0] = True
        ys, xs = np.nonzero(mask)
        min_y, max_y = y0 + ys.min(), y0 + ys.max()
        min_x, max_x = x0 + xs.min(), x0 + xs.max()
        mean_value = float(means[y0 + ys, x0 + xs].mean())

        cx = ((min_x + max_x + 1) / 2) * bs / cols * 100
        cy = ((min_y + max_y + 1) / 2) * bs / rows * 100
        rx = min(max(3.5, (max_x - min_x + 1) * bs / cols * 55), 22)
        ry = min(max(3.5, (max_y - min_y + 1) * bs / rows * 55), 22)

        direction = "повышенной" if mean_value > median else "пониженной"
        label = f"Зона {direction} плотности"
        if is_ct:
            label += f" · {round(mean_value)} HU"
        return Region(slice_number, cx, cy, rx, ry, best, mean_value, label)

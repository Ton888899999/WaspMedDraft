"""ZIP → ordered DICOM series via pydicom.

pydicom reads more than the in-browser parser: with pylibjpeg installed
it also decodes JPEG/JPEG2000-compressed transfer syntaxes.
"""
from __future__ import annotations

import io
import zipfile

import numpy as np
import pydicom

from engines.base import Series


class SeriesLoadError(Exception):
    pass


def load_series_from_zip(zip_bytes: bytes) -> tuple[Series, int]:
    """Returns (series, skipped_file_count)."""
    try:
        archive = zipfile.ZipFile(io.BytesIO(zip_bytes))
    except zipfile.BadZipFile as exc:
        raise SeriesLoadError("Файл не является корректным ZIP-архивом.") from exc

    datasets: list[pydicom.Dataset] = []
    skipped = 0
    for info in archive.infolist():
        if info.is_dir():
            continue
        base = info.filename.rsplit("/", 1)[-1]
        if "__MACOSX" in info.filename or base.startswith("."):
            continue
        try:
            ds = pydicom.dcmread(io.BytesIO(archive.read(info)), force=False)
            _ = ds.pixel_array  # decode now; raises for unsupported syntaxes
            datasets.append(ds)
        except Exception:  # not a DICOM / unsupported transfer syntax
            skipped += 1

    if not datasets:
        raise SeriesLoadError(
            "В архиве не найдено читаемых DICOM-файлов с пиксельными данными."
        )

    def sort_key(ds: pydicom.Dataset):
        return (
            int(getattr(ds, "InstanceNumber", 0) or 0),
            float(getattr(ds, "SliceLocation", 0.0) or 0.0),
        )

    datasets.sort(key=sort_key)

    first = datasets[0]
    rows, cols = int(first.Rows), int(first.Columns)
    usable = [ds for ds in datasets if int(ds.Rows) == rows and int(ds.Columns) == cols]
    skipped += len(datasets) - len(usable)

    volume = np.empty((len(usable), rows, cols), dtype=np.float32)
    numbers: list[int] = []
    for i, ds in enumerate(usable):
        arr = ds.pixel_array.astype(np.float32)
        if arr.ndim == 3:  # RGB — collapse to luminance for analysis
            arr = arr.mean(axis=2)
        slope = float(getattr(ds, "RescaleSlope", 1.0) or 1.0)
        intercept = float(getattr(ds, "RescaleIntercept", 0.0) or 0.0)
        volume[i] = arr * slope + intercept
        numbers.append(int(getattr(ds, "InstanceNumber", i + 1) or (i + 1)))

    spacing = None
    try:
        py, px = (float(v) for v in first.PixelSpacing)
        pz = float(getattr(first, "SliceThickness", 0.0) or 0.0)
        if pz > 0:
            spacing = (pz, py, px)
    except (AttributeError, TypeError, ValueError):
        pass

    series = Series(
        modality=str(getattr(first, "Modality", "OT") or "OT"),
        pixels=volume,
        slice_numbers=numbers,
        spacing_mm=spacing,
    )
    return series, skipped

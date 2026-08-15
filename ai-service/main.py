"""WaspMed Draft — локальный AI-сервис анализа DICOM-исследований.

Запуск:  uvicorn main:app --port 8421
Фронтенд обнаруживает сервис автоматически (GET /health) и отправляет
исследование на анализ вместо встроенного браузерного алгоритма.
"""
from __future__ import annotations

import time

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from dicom_io import SeriesLoadError, load_series_from_zip
from engines import list_engines, pick_engine

app = FastAPI(title="WaspMed Draft AI Service", version="0.1.0")

# The service binds to localhost only; CORS is open so any local
# frontend origin (dev server, packaged app) can reach it.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "waspmed-ai",
        "version": app.version,
        "engines": list_engines(),
    }


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    engine: str = Query(default="auto"),
) -> dict:
    payload = await file.read()
    try:
        series, skipped = load_series_from_zip(payload)
    except SeriesLoadError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        selected = pick_engine(engine, series.modality)
    except LookupError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    started = time.monotonic()
    try:
        result = selected.analyze(series)
    except Exception as exc:  # engine crash must not kill the service
        raise HTTPException(
            status_code=500, detail=f"Движок '{selected.id}' завершился с ошибкой: {exc}"
        ) from exc

    return {
        "engine": {"id": selected.id, "name": selected.name},
        "modality": series.modality,
        "sliceCount": int(series.pixels.shape[0]),
        "skippedFiles": skipped,
        "elapsedSec": round(time.monotonic() - started, 2),
        "regions": [r.to_json() for r in result.regions],
        "summary": result.summary,
        "extra": result.extra,
        "disclaimer": (
            "Результат сформирован автоматически и не является диагнозом. "
            "Требуется верификация врачом."
        ),
    }

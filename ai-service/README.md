# WaspMed Draft — AI Service

Локальный сервис анализа DICOM-исследований. Фронтенд (веб `/workspace`)
обнаруживает его автоматически и отправляет исследования сюда; если
сервис не запущен, работает встроенный браузерный анализ.

## Запуск

```bash
cd ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8421
```

Проверка: `curl http://localhost:8421/health` — в ответе список движков
и их готовность.

## Подключение реальных моделей

Слоты уже готовы — модель активируется установкой пакета, код менять не нужно:

| Движок | Как включить | Что даёт |
|---|---|---|
| `lungmask` | `pip install lungmask` | Сегментация лёгких на КТ (R231, Apache-2.0) + зоны уплотнения ткани |
| `totalsegmentator` | `pip install TotalSegmentator` | 117 структур на КТ, объёмы органов в протокол |
| `statistical` | всегда включён | Базовый статистический анализ плотности |

Режим `auto` выбирает первый готовый движок, подходящий по модальности.
Конкретный движок: `POST /analyze?engine=lungmask`.

## Как добавить свою модель

1. Создайте `engines/my_model.py`, реализуйте класс `Engine`
   (см. `engines/base.py`): `available()` — проверка зависимостей,
   `analyze(series) -> AnalysisResult` — инференс.
   На вход придёт `Series`: numpy-том `(slices, rows, cols)` в HU (для КТ),
   номера срезов и voxel spacing.
2. Зарегистрируйте класс в `ENGINE_CLASSES` (`engines/__init__.py`).
3. Регионы возвращайте в нормализованных координатах (cx/cy/rx/ry в %),
   UI отрисует их на срезах автоматически.

## API

- `GET /health` → `{status, engines: [{id, name, ready, ...}]}`
- `POST /analyze` (multipart `file` = ZIP с DICOM, `?engine=auto|<id>`)
  → `{engine, modality, sliceCount, regions[], summary, extra}`

## Важно

Все результаты — черновик для врача, не диагноз. Модели research-уровня;
клиническое применение требует регистрации ПО как медицинского изделия.

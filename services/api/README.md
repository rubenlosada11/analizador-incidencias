# API de TrackFlow (`services/api`)

API centralizada de TrackFlow con **FastAPI**. Hoy expone el **Analizador de Incidencias**; la lógica de validación y
métricas vive en el paquete compartido [`packages/analisis-incidencias`](../../packages/analisis-incidencias), el mismo
que usa `scripts/analyze.py`.

Documentación completa del proyecto: [`docs/analizador-incidencias.md`](../../docs/analizador-incidencias.md).

## Arranque

Requisitos: Python ≥ 3.11 y [uv](https://docs.astral.sh/uv/).

```powershell
cd services\api
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: `http://localhost:8000/docs`.

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3002` | Orígenes permitidos, separados por comas |

## Endpoints

| Método y ruta | Descripción |
| --- | --- |
| `POST /api/incidents/analyze` | CSV en `multipart/form-data` (campo `file`) → resultado en JSON |
| `GET /api/incidents/results/export` | Último análisis como `results.csv` (descarga) |
| `GET /api/health` | `{"status": "ok"}` |

Errores en JSON `{"detail": "..."}`: 400 sin fichero · 404 exportación sin análisis · 413 > 5 MB · 415 no `.csv` ·
422 contenido no procesable · 500 error inesperado (sin traza al cliente).

El último análisis se guarda en memoria (`app.state`) mientras la API está en marcha.

## Estructura

```text
app/main.py               ← create_app(): CORS, estado en memoria, /api/health, manejador de errores 500
app/routers/incidents.py  ← endpoints de incidencias
tests/test_incidents.py   ← tests con TestClient
```

## Tests

```powershell
cd services\api
uv run pytest
```

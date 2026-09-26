"""API centralizada de TrackFlow.

Arranque local (desde services/api):
    uv run uvicorn app.main:app --reload --port 8000
"""

import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import incidents

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("trackflow.api")

ORIGENES_POR_DEFECTO = "http://localhost:3002"  # backoffice en desarrollo


def create_app() -> FastAPI:
    app = FastAPI(title="TrackFlow API", version="0.1.0")

    origenes = os.getenv("CORS_ALLOWED_ORIGINS", ORIGENES_POR_DEFECTO)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origenes.split(",") if o.strip()],
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"],
    )

    # Último análisis realizado. Vive en memoria mientras la API está en marcha.
    app.state.ultimo_analisis = None
    app.include_router(incidents.router)

    @app.get("/api/health", tags=["health"])
    def health() -> dict:
        return {"status": "ok"}

    @app.exception_handler(Exception)
    async def error_inesperado(request: Request, exc: Exception) -> JSONResponse:
        # La traza completa queda en el log del servidor; al cliente solo le llega un mensaje genérico.
        logger.exception("Error no controlado en %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content={"detail": "Error interno del servidor."})

    return app


app = create_app()

"""Endpoints del analizador de incidencias.

Toda la validación y el cálculo se delegan en el paquete compartido
`analisis-incidencias`, el mismo que usa `scripts/analyze.py`.
"""

import logging
from pathlib import PurePath

from analisis_incidencias import (
    REGLAS,
    REGLAS_COMPLEMENTARIAS,
    ErrorAnalisis,
    analizar,
    decodificar_csv,
    generar_csv_bytes,
)
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import Response

logger = logging.getLogger("trackflow.api.incidents")

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

TAMANO_MAXIMO = 5 * 1024 * 1024  # 5 MB: el CSV de un mes ocupa ~15 KB por cada 100 filas
NOMBRE_EXPORTACION = "results.csv"

# Etiquetas legibles de cada regla, para que el frontend no las duplique.
ETIQUETAS_REGLAS = {
    codigo: {"etiqueta": etiqueta, "complementaria": codigo in REGLAS_COMPLEMENTARIAS}
    for codigo, etiqueta in REGLAS.items()
}


@router.post("/analyze")
async def analizar_incidencias(
    request: Request,
    file: UploadFile | None = File(None, description="CSV de incidencias (UTF-8, separado por comas)"),
) -> dict:
    """Valida el CSV y devuelve el resumen de métricas. No incluye datos personales."""
    if file is None or not file.filename:
        raise HTTPException(400, "No se ha enviado ningún fichero. Adjunta un CSV en el campo 'file'.")

    nombre = PurePath(file.filename.replace("\\", "/")).name
    if not nombre.lower().endswith(".csv"):
        raise HTTPException(415, f"Formato no admitido: '{nombre}'. El fichero debe tener extensión .csv.")

    contenido = await file.read(TAMANO_MAXIMO + 1)
    if len(contenido) > TAMANO_MAXIMO:
        raise HTTPException(413, f"El fichero supera el tamaño máximo de {TAMANO_MAXIMO // (1024 * 1024)} MB.")

    try:
        filas = decodificar_csv(contenido)
    except ErrorAnalisis as error:
        raise HTTPException(422, str(error)) from None

    resultado = analizar(filas, nombre)
    request.app.state.ultimo_analisis = resultado
    totales = resultado["totales"]
    logger.info(
        "Análisis de '%s': %d registros (%d válidos, %d inválidos)",
        nombre, totales["procesados"], totales["validos"], totales["invalidos"],
    )
    return {**resultado, "reglas": ETIQUETAS_REGLAS}


@router.get("/results/export")
def exportar_resultados(request: Request) -> Response:
    """Descarga el último análisis como CSV (una fila por métrica)."""
    resultado = request.app.state.ultimo_analisis
    if resultado is None:
        raise HTTPException(404, "Todavía no se ha analizado ningún fichero. Usa primero POST /api/incidents/analyze.")
    return Response(
        content=generar_csv_bytes(resultado),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{NOMBRE_EXPORTACION}"'},
    )

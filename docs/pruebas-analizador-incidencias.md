# Registro de pruebas — Analizador de Incidencias

Fecha de ejecución: 2026-09-26 · Windows 11 · Python 3.14.6 · Node 24.19 · Microsoft Edge.
Todas las pruebas se han ejecutado; ninguna se marca PASS sin ejecutarse.

| Batería | Comando | Resultado |
| --- | --- | --- |
| Paquete + script | `python -m pytest scripts/tests packages/analisis-incidencias/tests` | 70 passed |
| API | `cd services/api` · `uv run pytest` | 23 passed |
| Backoffice | `npm run lint` · `npm run typecheck` · `npm run build` | sin errores |
| Backoffice en navegador | `npm run test:e2e` (API y backoffice arrancados) | 14 passed |

## Script (`scripts/analyze.py` + paquete compartido)

| Prueba | Entrada | Acción | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- | --- |
| CSV válido | CSV con registros correctos | `analizar()` | 0 inválidos, métricas calculadas | 0 inválidos (`test_puntuacion_en_incidencia_abierta_es_valida_pero_no_cuenta`, `test_registro_valido_no_tiene_errores`) | PASS |
| CSV con inválidos | `incidents-trackflow.csv` | `python analyze.py incidents-trackflow.csv` | 100 / 95 / 5 y valores del CONTEXT | 100 / 95 / 5; categorías 14/38/19/17/7; estados 29/52/14; media 3.06 | PASS |
| Campo obligatorio ausente o mal formado | `country`, `carrier`, `tracking_number`, `category`, `customer_email` vacíos; `description`, `date`, `incident_id` con formato inválido | `validar_registro()` | regla correspondiente | regla correspondiente en cada caso (`test_cada_regla_se_detecta`) | PASS |
| Categoría inválida | `category = OTHER` / vacía | `validar_registro()` | `categoria_invalida` | `categoria_invalida` | PASS |
| Estado inválido | `status = PENDING` / `closed` | `validar_registro()` | `estado_invalido` | `estado_invalido` | PASS |
| Puntuación ausente | `CLOSED` sin puntuación | `validar_registro()` | `cerrada_sin_puntuacion` | `cerrada_sin_puntuacion` | PASS |
| Puntuación presente | `CLOSED` con 4; `OPEN` con 1 | `analizar()` | ambos válidos; media solo con la cerrada (4.0) | media 4.0, 1 puntuada | PASS |
| Puntuación fuera de rango | 0, 6, 3.5, abc | `validar_registro()` | `puntuacion_fuera_rango` | `puntuacion_fuera_rango` | PASS |
| Varias reglas en un registro | categoría vacía + email sin @ | `analizar()` | 1 inválido, cuenta en 2 reglas | 1 inválido, 2 reglas | PASS |
| CSV vacío | fichero de 0 bytes | `python analyze.py vacio.csv` | error claro, salida 1 | "Error: El fichero está vacío.", salida 1 | PASS |
| Solo cabecera / columnas ausentes / no UTF-8 | ficheros sintéticos | `leer_csv()` / CLI | error de fichero | "no contiene registros" / "Faltan columnas obligatorias" / "no está codificado en UTF-8" | PASS |
| Fichero inexistente | `nada.csv` | `python analyze.py nada.csv` | error claro, salida 1 | "Error: El fichero no existe: nada.csv", salida 1 | PASS |
| Sin argumento | — | `python analyze.py` | uso y salida 2 | uso de argparse, salida 2 | PASS |
| Exportación con `s` | CSV real | responder `s` | `results.csv` una fila por métrica | 151 métricas, cabecera `seccion,metrica,valor,porcentaje` | PASS |
| Exportación con `n` | CSV real | responder `n` | no se crea fichero | no se crea `results.csv` | PASS |
| Respuesta inesperada / EOF | `quizá`, vacío, Ctrl+C, EOF | pregunta de exportación | repite / termina sin exportar sin perder el informe | repite con aviso; EOF y Ctrl+C no exportan | PASS |
| Privacidad | CSV real | informe + exportación | ningún correo | 0 correos y 0 `@` | PASS |

## API (`services/api`)

| Prueba | Entrada | Acción | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- | --- |
| POST correcto | `incidents-trackflow.csv` | `POST /api/incidents/analyze` | 200 y valores del CONTEXT | 200; 100/95/5; media 3.06; 5 IDs inválidos | PASS |
| Equivalencia con el script | CSV real | comparar JSON con `analizar()` del script | idéntico | idéntico | PASS |
| Fichero no enviado | sin campo `file` / otro campo | POST | 400 | 400 "No se ha enviado ningún fichero…" | PASS |
| Fichero vacío | 0 bytes | POST | 422 | 422 "El fichero está vacío." | PASS |
| CSV inválido | `.txt` / `.xlsx`; bytes latin-1 | POST | 415 / 422 | 415 "…extensión .csv"; 422 "…UTF-8" | PASS |
| Estructura incorrecta | cabecera `a,b`; solo cabecera | POST | 422 | 422 "Faltan columnas obligatorias…" / "no contiene registros" | PASS |
| Fichero demasiado grande | límite reducido a 100 B | POST | 413 | 413 | PASS |
| Error inesperado | `analizar` forzado a fallar | POST | 500 sin traza | 500 `{"detail": "Error interno del servidor."}` | PASS |
| GET de exportación | tras analizar el CSV real | `GET /api/incidents/results/export` | CSV descargable | 200, `text/csv; charset=utf-8`, `attachment; filename="results.csv"` | PASS |
| Exportación = script | CSV real | comparar con `results.csv` del script | mismos bytes | idéntico byte a byte | PASS |
| Exportación antes de analizar | API recién arrancada | GET | 404 | 404 "Todavía no se ha analizado ningún fichero…" | PASS |
| Análisis fallido conserva el anterior | CSV real y después CSV vacío | POST, POST, GET | exporta el primero | exporta 100 registros | PASS |
| CORS | origen `localhost:3002` / otro | preflight `OPTIONS` | permitido / rechazado | permitido / sin cabecera | PASS |
| Servidor real | `uvicorn` + `curl` | todos los casos anteriores | mismos códigos | mismos códigos; log sin correos | PASS |

## Backoffice (`uis/backoffice`, Edge)

| Prueba | Entrada | Acción | Resultado esperado | Resultado obtenido | Estado |
| --- | --- | --- | --- | --- | --- |
| Navegación | — | clic en "Análisis de incidencias" | abre `/incidencias` y marca el enlace activo | `/incidencias`, enlace con `aria-current="page"` | PASS |
| Sin fichero | — | clic en "Analizar CSV" | aviso | "Selecciona un fichero CSV antes de analizar." | PASS |
| Fichero no CSV | `datos.txt` | seleccionar | aviso sin llamar a la API | "El fichero debe tener extensión .csv." | PASS |
| Error de API | CSV vacío | analizar | mensaje de la API | "El fichero está vacío." | PASS |
| Carga (loading) | CSV real, respuesta retrasada 1 s | analizar | botón "Analizando…" deshabilitado | deshabilitado | PASS |
| Resultado correcto | CSV real | analizar | valores del CONTEXT | 100 / 95 / 5 / 3,06; 14/38/19/17/7; 29/52/14; 6/11/15/14/6 | PASS |
| Registros inválidos | CSV real | analizar | 5 registros con línea, ID y motivo; sin correos | 5 IDs; 0 `@` en la página | PASS |
| Descarga | CSV real | "Descargar resultados CSV" | `results.csv` igual al del script | idéntico byte a byte | PASS |
| API caída | respuesta 500 del proxy (simulada) y API detenida (manual) | analizar | mensaje de conexión | "No se ha podido conectar con la API de análisis…" | PASS |
| Descarga sin análisis en la API | 404 (simulado) y API reiniciada (manual) | descargar | mensaje del 404 | "Todavía no se ha analizado ningún fichero…" | PASS |
| Móvil | viewport 390 px | analizar | sin scroll horizontal | `scrollWidth` = 390 | PASS |
| Consola del navegador | flujo completo | — | sin errores de la aplicación | 0 (solo el 422 intencionado de la prueba del CSV vacío) | PASS |

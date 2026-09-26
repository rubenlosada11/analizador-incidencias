# Analizador de Incidencias — TrackFlow

Herramienta interna para el equipo de atención postventa (CX) de TrackFlow. Lee el CSV de incidencias exportado del
helpdesk, valida cada registro según [`CONTEXT.es.md`](../CONTEXT.es.md), excluye los inválidos y calcula las métricas
de volumen, categoría, estado, satisfacción y errores. Funciona de dos formas que comparten exactamente la misma lógica:

- **Script de consola** (`scripts/analyze.py`).
- **Backoffice web** (`uis/backoffice`) sobre una **API** (`services/api`).

Todo el procesamiento es local: el CSV contiene correos de clientes y no se envía a servicios externos ni de IA.

## Estructura

```text
scripts/
├── analyze.py                    ← CLI: informe en consola y exportación a results.csv
├── incidents-trackflow.csv       ← fichero de prueba (100 registros)
└── tests/                        ← tests de la CLI y del contrato con CONTEXT.es.md
packages/analisis-incidencias/    ← lógica compartida (solo biblioteca estándar de Python)
├── src/analisis_incidencias/     ← dominio · carga · validacion · metricas · exportacion
└── tests/
services/api/                     ← API FastAPI (POST /api/incidents/analyze, GET /api/incidents/results/export)
uis/backoffice/                   ← Next.js: página "Análisis de incidencias"
└── e2e/                          ← pruebas en navegador (Edge) de extremo a extremo
```

```text
CSV ──► packages/analisis-incidencias ──┬──► scripts/analyze.py (consola + results.csv)
                                        └──► services/api ──► uis/backoffice (navegador)
```

## Requisitos

| Herramienta | Versión probada | Para qué |
| --- | --- | --- |
| Python | 3.14.6 (mínimo 3.11) | script, paquete y API |
| uv | 0.12.19 | entorno y dependencias de la API |
| Node.js / npm | 24.19 / 11.17 (Node ≥ 20.9) | backoffice |
| Microsoft Edge | el instalado en Windows | solo para `npm run test:e2e` (configurable) |

## Instalación

El script no necesita instalar nada. Para la API y el backoffice (PowerShell, un comando por línea):

```powershell
cd services\api
uv sync
cd ..\..\uis\backoffice
npm install
```

`uv sync` crea `services/api/.venv` e instala FastAPI, Uvicorn, python-multipart y el paquete compartido (editable).

## Ejecución

### Script

```powershell
cd scripts
python analyze.py incidents-trackflow.csv
```

- Argumento obligatorio: ruta al CSV. Opción `-o/--output` para cambiar el fichero de exportación (por defecto
  `results.csv` en el directorio actual).
- Al terminar pregunta `¿Deseas exportar los resultados a CSV? [s / n]`. Acepta `s`, `sí`, `si`, `y`, `n`, `no`;
  ante otra respuesta vuelve a preguntar; con Ctrl+C o fin de entrada termina sin exportar.
- Códigos de salida: `0` correcto, `1` error de fichero (no existe, vacío, no UTF-8, columnas incorrectas), `2` falta
  el argumento.

### API

```powershell
cd services\api
uv run uvicorn app.main:app --reload --port 8000
```

Documentación interactiva en `http://localhost:8000/docs`. Variable opcional: `CORS_ALLOWED_ORIGINS` (orígenes
separados por comas; por defecto `http://localhost:3002`). No es necesaria si se usa el backoffice, que llama a la API a
través de su propio servidor.

### Backoffice

Con la API arrancada:

```powershell
cd uis\backoffice
npm run dev
```

Abrir `http://localhost:3002/incidencias` (también accesible desde el menú lateral). Next.js reenvía `/api/*` a la API;
la URL se cambia con la variable `API_BASE_URL` (por defecto `http://localhost:8000`).

## Formato del CSV

UTF-8 (con o sin BOM), separado por comas, con cabecera. Columnas obligatorias (definidas en `CONTEXT.es.md`):
`incident_id, date, country, customer_type, tracking_number, carrier, category, description, status, customer_email,
satisfaction_score`. Las líneas en blanco se ignoran; se admiten columnas adicionales.

## Validación

Un registro es **inválido** si incumple al menos una regla. Los inválidos se cuentan, se clasifican por regla y se
listan (línea e `incident_id`, nunca el correo), pero no participan en las métricas.

| Regla | Condición | Origen |
| --- | --- | --- |
| País ausente o inválido | distinto de `US` / `ES` | CONTEXT |
| Transportista inválido para el país | vacío, desconocido o que no opera en el país (US: UPS, FEDEX, DHL_US · ES: MRW, SEUR, DHL_ES, LOCAL_ES) | CONTEXT |
| Número de seguimiento inválido | vacío o < 8 caracteres | CONTEXT |
| Categoría ausente o inválida | fuera de LOST_PARCEL, DELAYED_DELIVERY, WRONG_ADDRESS, RETURN_REQUEST, DAMAGE | CONTEXT |
| Descripción ausente o muy corta | < 5 caracteres | CONTEXT |
| Email ausente o inválido | vacío o sin `@` | CONTEXT |
| Cerrada sin puntuación | `status = CLOSED` sin `satisfaction_score` | CONTEXT |
| Puntuación fuera de rango | hay valor pero no es un entero de 1 a 5 | CONTEXT |
| ID de incidencia inválido | no sigue `TRF-` + 6 dígitos | complementaria |
| Fecha ausente o inválida | no es una fecha real `YYYY-MM-DD` | complementaria |
| Tipo de cliente inválido | distinto de `B2B` / `B2C` | complementaria |
| Estado ausente o inválido | distinto de `OPEN` / `CLOSED` / `DISCARDED` | complementaria |
| Número de columnas incorrecto | la fila no tiene las mismas columnas que la cabecera | complementaria |

Las reglas **complementarias** derivan de la tabla de campos obligatorios del CONTEXT (formato y valores permitidos),
no de su lista de reglas; con el fichero de prueba no marcan ningún registro.

Criterios:

- Un registro que incumple varias reglas cuenta **una vez** como inválido y aparece en **cada** regla del desglose.
- Si el país es inválido, solo se comprueba que el transportista exista (no se cuenta dos veces el mismo problema).
- Solo se eliminan espacios en los extremos; no se corrigen mayúsculas (`closed` es inválido).
- Una puntuación en una incidencia `OPEN` o `DISCARDED` no invalida el registro, pero no entra en el índice.

## Métricas (sobre registros válidos)

- Totales: procesados, válidos, inválidos.
- Por categoría, estado, país, tipo de cliente y transportista (conteo y porcentaje).
- Evolución temporal: por mes, trimestre, semana ISO y día de la semana.
- Cruces: país × categoría, transportista × categoría, transportista × estado.
- Satisfacción: incidencias cerradas con puntuación, media (2 decimales) y distribución 1–5; también por país,
  categoría y transportista.
- Errores: inválidos por regla y detalle por registro.

Con `scripts/incidents-trackflow.csv` se obtienen exactamente los valores esperados de `CONTEXT.es.md`: 100 registros,
95 válidos, 5 inválidos (1 por regla: seguimiento, transportista/país, categoría, email, cerrada sin puntuación);
categorías 14/38/19/17/7; estados 29/52/14; países 50/45; satisfacción 3,06 con distribución 6/11/15/14/6.

## Endpoints

| Método y ruta | Descripción |
| --- | --- |
| `POST /api/incidents/analyze` | `multipart/form-data` con el CSV en el campo `file`. Devuelve el resultado en JSON. |
| `GET /api/incidents/results/export` | Descarga el último análisis como `results.csv` (`text/csv; charset=utf-8`, `attachment`). |
| `GET /api/health` | Comprobación de estado: `{"status": "ok"}`. |

La respuesta de `POST` contiene `archivo`, `totales`, `invalidos_por_regla`, `registros_invalidos`, `por_categoria`,
`por_estado`, `por_pais`, `por_tipo_cliente`, `por_transportista`, `por_fecha`, `cruces`, `satisfaccion` y `reglas`
(etiqueta legible de cada regla y si es complementaria). Es el mismo diccionario que calcula el script.

Errores (siempre JSON `{"detail": "mensaje"}`, sin trazas):

| Código | Caso |
| --- | --- |
| 400 | no se envía fichero en el campo `file` |
| 404 | exportación sin ningún análisis previo |
| 413 | fichero mayor de 5 MB |
| 415 | el fichero no tiene extensión `.csv` |
| 422 | fichero vacío, solo cabecera, no UTF-8, CSV mal formado o columnas obligatorias ausentes |
| 500 | error inesperado: mensaje genérico al cliente; la traza queda en el log del servidor |

El último análisis correcto se guarda **en memoria** mientras la API está en marcha (sin base de datos). Un análisis
fallido no lo sustituye.

## Exportación

`results.csv` tiene una fila por métrica con las columnas `seccion, metrica, valor, porcentaje` (UTF-8 con BOM, para que
Excel respete los acentos). El porcentaje es sobre el total de su grupo: registros válidos en los desgloses simples,
la fila en los cruces (p. ej. `UPS|LOST_PARCEL` sobre el total de UPS) e incidencias puntuadas en la distribución de
satisfacción. Solo contiene agregados: ni correos ni IDs. El script y la API generan **los mismos bytes**.

## Pruebas

| Batería | Comando | Resultado |
| --- | --- | --- |
| Paquete + script | `python -m pytest scripts/tests packages/analisis-incidencias/tests` (desde la raíz) | 70 superados |
| API | `uv run pytest` (desde `services/api`) | 23 superados |
| Backoffice (calidad) | `npm run lint`, `npm run typecheck`, `npm run build` (desde `uis/backoffice`) | sin errores |
| Backoffice (navegador) | `npm run test:e2e` con la API y el backoffice arrancados | 14 superados |

Registro detallado: [`pruebas-analizador-incidencias.md`](./pruebas-analizador-incidencias.md).

## Evidencias

Generadas con el CSV de prueba de 100 registros (carpeta [`evidencias/`](./evidencias/)):

| Fichero | Contenido |
| --- | --- |
| `script-consola.png` | Salida de `python analyze.py incidents-trackflow.csv` respondiendo `s` a la exportación. Es el texto real capturado de la ejecución, representado con estilo de terminal. |
| `backoffice-resumen.png` | Backoffice con el CSV cargado y el resumen general. |
| `backoffice-invalidos.png` | Sección de registros inválidos (reglas y detalle por línea e ID). |
| `backoffice-completo.png` | Página completa del análisis. |

## Seguridad y datos sensibles

- Sin servicios externos ni de IA: el paquete solo usa la biblioteca estándar; la API, FastAPI/Uvicorn.
- `customer_email` nunca se imprime, registra, devuelve ni exporta (hay tests que lo comprueban en consola, JSON,
  exportación y página web). Los inválidos se identifican por número de línea e `incident_id`.
- El log de la API solo registra la petición HTTP y una línea de resumen por análisis (nombre de fichero y totales).
- Sin secretos en el código. `.env` y `.env.*` están en `.gitignore` (salvo `.env.example`).
- `scripts/incidents-trackflow.csv` se versiona con autorización expresa: son datos del ejercicio.
- Las fuentes del backoffice (`next/font/google`) se descargan al compilar y se sirven desde el propio backoffice.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Python estándar, sin pandas | 100 filas y conteos simples: sin dependencias y con traza por registro de las reglas incumplidas. |
| Lógica en `packages/analisis-incidencias` | Regla del monorepo: el código usado por 2+ carpetas va en `packages/`. El script la importa desde `src/` sin instalarla; la API la instala como dependencia editable con `uv`. |
| API FastAPI con `uv` | El README del monorepo fija FastAPI en `services/`; `uv` es el gestor del devcontainer. |
| Último resultado en memoria | El ejercicio no necesita persistencia; evita una base de datos. |
| Next.js 16 + Tailwind 4 | Mismas versiones y convenciones que el backoffice de TrackFlow existente. |
| Proxy `/api/*` desde Next.js | El navegador usa el mismo origen: sin CORS y descargas directas. |
| Salida en español | Decisión del equipo; los códigos de categoría, estado, país y transportista se muestran tal como los define el CONTEXT. |
| Reglas complementarias | Validan campos obligatorios que la lista de reglas del CONTEXT no cubre, sin alterar los valores esperados. |

## Limitaciones conocidas

- El último análisis se pierde al reiniciar la API y es compartido por todos los usuarios (un solo proceso).
- `CONTEXT.es.md` menciona "1,000 filas" y una ruta `incidents-analysis/…`; se toma como referencia la tabla de
  valores esperados (100 filas).
- El mensaje de `argparse` cuando falta el argumento está en inglés (lo genera la biblioteca estándar).
- En Windows, si la salida de la API se redirige a un fichero, las tildes del log se escriben en cp1252.
- Excel en configuración regional española puede esperar `;` como separador al abrir el CSV con doble clic; se
  mantiene la coma que define el CONTEXT.
- El `.devcontainer` de la plantilla ejecuta `uv sync` en la raíz, donde no hay `pyproject.toml`; en Codespaces hay
  que ejecutar `uv sync` dentro de `services/api`.
- npm 11 bloquea el script de instalación de `unrs-resolver` (dependencia de ESLint); el lint funciona sin él.

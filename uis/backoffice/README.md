# Backoffice de TrackFlow (`uis/backoffice`)

Aplicación interna de TrackFlow Tech. Incluye la página **Análisis de incidencias** (`/incidencias`): subir el CSV del
helpdesk, ver el resumen, los desgloses, la satisfacción y los registros inválidos, y descargar los resultados en CSV.

Documentación completa del proyecto: [`docs/analizador-incidencias.md`](../../docs/analizador-incidencias.md).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript estricto · ESLint 9. Fuentes Archivo y Manrope,
paleta `blue`/`slate` e identidad visual de TrackFlow.

## Arranque

Requiere Node ≥ 20.9 y la API (`services/api`) arrancada en el puerto 8000.

```powershell
cd uis\backoffice
npm install
npm run dev
```

Abrir `http://localhost:3002`. Next.js reenvía `/api/*` a la API (`next.config.ts`), por lo que el navegador no
necesita CORS.

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `API_BASE_URL` | `http://localhost:8000` | URL de la API a la que se reenvían las peticiones `/api/*` |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Desarrollo en el puerto 3002 |
| `npm run build` / `npm run start` | Compilación y servidor de producción (puerto 3002) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos de rutas + `tsc --noEmit` |
| `npm run test:e2e` | Pruebas en navegador (Edge) con la API y el backoffice arrancados |

`test:e2e` usa `node:test` y `playwright-core` sobre el Edge instalado. Variables opcionales:
`E2E_BROWSER_CHANNEL` (p. ej. `chrome`), `E2E_BASE_URL` y `PYTHON` (para comparar la descarga con el script).

## Estructura

```text
app/                        ← rutas: / (inicio) y /incidencias
components/                 ← Sidebar, Topbar, NavLinks, StatCard, PageSection
components/incidencias/     ← SelectorCsv, AnalizadorIncidencias, ResultadosAnalisis, ListaBarras,
                              TablaCruce, TablaSatisfaccion, RegistrosInvalidos
lib/api.ts                  ← llamadas a la API y descarga
lib/formato.ts              ← formato de números (es-ES) y etiquetas
types/incidencias.ts        ← tipos de la respuesta de la API
e2e/                        ← pruebas extremo a extremo
```

# Carpeta `scripts`

Esta carpeta contiene **scripts auxiliares** del monorepo: automatizaciones de desarrollo, utilidades de mantenimiento, tareas repetitivas (setup, lint, migraciones, generación de datos, etc.) y tooling interno.

- **Propósito principal**: agrupar herramientas de soporte que no pertenecen a una app/agente/pipeline específico, pero facilitan el trabajo del equipo.
- **Recomendación**: documenta cada script (qué hace, parámetros, requisitos, ejemplos de uso) y procura que sean reproducibles (y seguros) en distintos entornos.

## Analizador de incidencias

- [`analyze.py`](./analyze.py): analiza el CSV de incidencias de TrackFlow (validación, métricas y exportación a `results.csv`).
  Uso: `python analyze.py incidents-trackflow.csv [-o results.csv]`. Fichero de prueba: `incidents-trackflow.csv`.
  Tests: `python -m pytest scripts/tests` (desde la raíz). Documentación: [`docs/analizador-incidencias.md`](../docs/analizador-incidencias.md).

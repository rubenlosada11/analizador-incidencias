# `scripts` folder

This folder contains **helper scripts** for the monorepo: development automation, maintenance utilities, repetitive tasks (setup, lint, migrations, data generation, etc.), and internal tooling.

- **Main purpose**: group support tools that do not belong to a specific app, agent, or pipeline but make the team’s work easier.
- **Recommendation**: document each script (what it does, parameters, requirements, usage examples) and keep them reproducible (and safe) across environments.

## Incident analyzer

- [`analyze.py`](./analyze.py): analyzes TrackFlow's incident CSV (validation, metrics and export to `results.csv`).
  Usage: `python analyze.py incidents-trackflow.csv [-o results.csv]`. Test file: `incidents-trackflow.csv`.
  Docs (Spanish): [`docs/analizador-incidencias.md`](../docs/analizador-incidencias.md).

> _Spanish version: [README.es.md](./README.es.md)._

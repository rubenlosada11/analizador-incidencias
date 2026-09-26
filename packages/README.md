# `packages` folder

This folder contains **shared packages** for the monorepo: internal libraries, utilities, types, shared components, SDKs, clients, and any code reused by multiple applications, agents, or pipelines.

Each subfolder under `packages/` should represent **one versionable package** (for example `shared-types`, `ui`, `analytics-sdk`) with its own README.

- **Main purpose**: encourage reuse and consistency across all company deliverables.
- **Recommendation**: document packages as you add them—their public API and how they are consumed from `apps/`, `agents/`, and `workflows/`.

## Packages

- [`analisis-incidencias/`](./analisis-incidencias/README.md): validation and metrics for the incident CSV (standard-library Python).
  Used by `scripts/analyze.py` and `services/api`.

> _Spanish version: [README.es.md](./README.es.md)._

# Copilot Instructions — Cratekeeper

Cratekeeper is a single-operator, local-first DJ library tool: it turns a Spotify
wishlist into a classified, mood-analyzed, properly tagged, event-ready folder
on disk and accumulates the keepers into a curated Master Library.

Read [project/PRD.md](../project/PRD.md) for product context,
[project/ARCHITECTURE.md](../project/ARCHITECTURE.md) for the system design, and
[project/DESIGN.md](../project/DESIGN.md) for UX/UI conventions.

## Repository Layout

Two services in one repo, each with its own dependency manager:

- **`backend/`** — FastAPI app (`cratekeeper_api/`) wrapping a Python domain engine
  (`cratekeeper/`). `uv` + `pyproject.toml`. Alembic migrations under
  `backend/alembic/`. Pytest tests under `backend/tests/`. The LLM tagging code
  is integrated here under `cratekeeper_api/integrations/anthropic_client.py` —
  there is **no separate agent service**.
- **`frontend/`** — React 19 + Vite 8 + TypeScript 6 + Tailwind 4 SPA.
  `npm` + `package.json`. Routed by `react-router-dom` v7. Icons via
  `lucide-react`.

Supporting folders:

- `data/` — credential JSONs (`spotify-config.json`, `tidal-session.json`) and
  event artifacts. Mounted into the API container.
- `docker-compose.yml` — Postgres 16 (port 5432, db `djlib`, user/pw `dj`/`dj`)
  and the API container (port `8765`).
- `frontend-plan/` — design system + section-by-section UI specs that informed
  the current frontend implementation.
- `project/` — PRD, architecture, design docs.
- `.github/agents/` — agent-mode personas (architecture, backend, frontend,
  qa, requirements). `.github/skills/` — invokable skills.

Service-specific conventions live in
[.github/instructions/backend.instructions.md](instructions/backend.instructions.md)
and
[.github/instructions/frontend.instructions.md](instructions/frontend.instructions.md).

## Build & Run

There is **no Makefile** in the repo. Use the underlying commands directly.

### First-time setup

```bash
# Backend
cd backend && uv sync --extra test

# Frontend
cd frontend && npm install
```

### Postgres + migrations

```bash
docker compose up -d db                                 # Postgres on :5432
cd backend && uv run alembic upgrade head               # apply migrations
```

### Run dev servers

```bash
# API on :8765 (host/port from CRATEKEEPER_BIND_HOST/PORT, default 0.0.0.0:8765)
cd backend && uv run cratekeeper-api
# or:  cd backend && uv run python -m cratekeeper_api

# Frontend on :5173
cd frontend && npm run dev
```

### Required environment

- `CRATEKEEPER_DB_URL` — e.g. `postgresql+psycopg://dj:dj@localhost:5432/djlib`
- `CRATEKEEPER_FERNET_KEY` — used by `secrets_store.py` to encrypt
  per-integration credentials. Generate with
  `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`.
- `CRATEKEEPER_API_TOKEN` — bearer token required on every router (skipped only
  when `test_mode` is on). Frontend sends it as `Authorization: Bearer …`.
- `CRATEKEEPER_CORS_ORIGINS` — comma-separated allowed origins for CORS.
- `ANTHROPIC_API_KEY` — for LLM tag classification. Stored either via env or
  through the Settings page (encrypted via `secrets_store`).

The full API container env is in `docker-compose.yml`.

## Testing

```bash
# Backend — pytest, asyncio_mode = "auto"; spins up an ephemeral Postgres via
# `docker run` (see backend/tests/conftest.py). Docker must be running.
cd backend && uv run pytest
cd backend && uv run pytest tests/test_events.py
cd backend && uv run pytest -k test_name

# Frontend — no test runner configured. Lint only:
cd frontend && npm run lint
cd frontend && npm run build       # tsc -b + vite build (use this to typecheck)
```

There is no Playwright / Jest / Vitest setup in `frontend/`. If a change calls
for tests, add the smallest viable harness instead of inventing scripts.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/).
  When working on a tracked feature, prefix with the feature ID
  (`feat(CRATE-X): …`). When there is no tracked feature, use plain scopes
  (`feat(api): …`, `fix(frontend): …`, `chore(infra): …`).
- **TypeScript:** strict mode with `noUnusedLocals`, `noUnusedParameters`,
  `noFallthroughCasesInSwitch`. Run `npm run build` to typecheck.
- **Python tests:** `asyncio_mode = "auto"` — `async def` test functions need no
  decorator. Tests use a real Postgres via `docker run`, not testcontainers.
- **Migrations:** Alembic in `backend/alembic/`. Create with
  `cd backend && uv run alembic revision --autogenerate -m "description"`,
  then review the generated file before committing. The pre-existing `tracks`
  table is owned by `cratekeeper/local_scanner.py` and mapped read-only as
  `LibraryTrack` — Alembic must **not** create or alter it (see
  `__table_args__ = {"info": {"skip_autogenerate": True}}` on the model).

## Product & Architecture Quick Reference

- **Pipeline (11 steps):** Fetch → Enrich → Classify → Review → Scan → Match →
  Analyze → Classify Tags → Apply → Build Event → Build Library. Each step is
  a job handler under `backend/cratekeeper_api/jobs/handlers/`.
- **Job engine:** in-process asyncio queue with semaphores (1 heavy slot, 4
  light), persistent state in Postgres, live progress over SSE
  (`/jobs/{id}/stream`). See `backend/cratekeeper_api/jobs/engine.py`.
- **Domain engine:** `backend/cratekeeper/` (vendored package shipped inside
  the backend wheel via `[tool.hatch.build.targets.wheel] packages`). Pure
  Python — imported directly by job handlers and services.
- **Auth:** single bearer token (`CRATEKEEPER_API_TOKEN`). Routers attach
  `AuthDep` from `routers/_auth.py`. No user accounts, no JWTs, no Authentik.
- **Secrets:** Spotify/Tidal/Anthropic credentials encrypted at rest in the
  `settings` table via Fernet (`cratekeeper_api/secrets_store.py`).
- **Filesystem safety:** every path crossing the API boundary must pass through
  `cratekeeper_api/security.py` (`get_allowed_roots`, `PathOutsideRootError`,
  `MountNotReadyError`).

## Agent Workflow

Specialized agent personas live in `.github/agents/` and are selected from the
**Copilot Chat dropdown**. The intended flow:

```
Requirements Engineer → Solution Architect → Backend Developer ⇄ Frontend Developer → QA Engineer
```

These agents reference a feature-tracking layout (`project/features/INDEX.md`,
`project/plans/CRATE-X-plan.md`) that is **not yet present in this repo**.
Create those files only when adopting the workflow; otherwise stick to direct
edits and reference work via commit scopes.

Skills (invoked with `/skill`):

- `/help` — orientation and next-step guidance.
- `/frontend-design` — production-grade UI patterns.

## Agent Behavior

### Workflow

For non-trivial changes:

1. **Research** — read relevant files, reuse existing utilities.
2. **Plan** — small, self-contained tasks with clear acceptance criteria.
3. **Implement** — minimal, surgical changes.
4. **Verify** — `uv run pytest` (backend) and/or `npm run build` (frontend).

### Principles

- **Minimum necessary complexity.** YAGNI/KISS. No speculative abstractions.
- **Verify before acting.** Never assume — read the code, check the file path,
  confirm the API signature.
- **Clean up as you go.** Remove dead code and orphaned imports immediately.
- **Propagate change impact.** Update every caller when changing a signature
  or contract.
- **Reuse what exists.** Search the codebase for utilities, components, hooks,
  and services before creating new ones.
- **Don't hammer.** If an approach fails twice, change strategy.
- **Constructive fixes only.** Address root causes — do not disable tests or
  suppress errors to make something pass.
- **Keep architecture docs in sync.** After non-trivial changes (new endpoints,
  models, auth changes), update [project/ARCHITECTURE.md](../project/ARCHITECTURE.md).

## Parallel Sessions

Multiple Copilot sessions can work in parallel — keep each one to a single
service boundary:

- **Backend session** — working dir `backend/`. Routes, services, models, jobs,
  migrations, integrations.
- **Frontend session** — working dir `frontend/`. Components, pages, sections,
  styles.
- **Cross-cutting session** — `docker-compose.yml`, project docs, CI.

Coordinate Alembic revisions (only one session creates migrations at a time)
and shared files (`docker-compose.yml`, `.env.example`). Run
`git pull --rebase` before committing to pick up other sessions' work.

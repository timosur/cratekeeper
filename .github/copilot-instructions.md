# Copilot Instructions

## Build & Run

```bash
make setup          # first time: .env, Python + Node deps, Authentik provisioning
make dev            # PostgreSQL + Authentik → migrations → backend (8000) + frontend (5173)
make dev-stop       # stop containers
```

### Testing

```bash
make test-backend                          # all backend tests (pytest)
cd backend && uv run pytest tests/test_api/test_rides.py  # single test file
cd backend && uv run pytest -k test_name   # single test by name

make test-agent                            # all agent tests (pytest)
cd agent && uv run pytest tests/test_file.py  # single agent test file

make test-frontend                         # Playwright E2E (all)
cd frontend && npx playwright test e2e/auth.spec.ts  # single E2E spec
```

### Build

```bash
cd frontend && npm run build    # tsc -b + vite build
```

No linter is configured for either frontend or backend.

## Architecture

Three independent services in one repo, each with its own dependency management:

- **`frontend/`** — React 19 SPA. `npm` + `package.json`. Vite dev server proxied to backend.
- **`backend/`** — FastAPI REST API. `uv` + `pyproject.toml`. Alembic for DB migrations.
- **`agent/`** — LLM-powered product scraper (OpenAI + Anthropic). `uv` + `pyproject.toml`. Standalone CLI.

Service-specific conventions and patterns are in `.github/instructions/`:
- `backend.instructions.md` — route/service/model patterns, migrations, auth
- `frontend.instructions.md` — React patterns, Tailwind, i18n, API client
- `agent.instructions.md` — LLM extraction, shop config, publisher architecture
- `security.instructions.md` — JWT, rate limiting, secrets, input validation

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat(BIKE-X):`, `fix(BIKE-X):`, etc. Use the feature ID when working on a tracked feature.
- **TypeScript:** Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **Python tests:** `asyncio_mode = "auto"` in pytest config — test functions can be `async def` without decorators.
- **Backend migrations:** Alembic in `backend/alembic/`. Run `cd backend && uv run alembic revision --autogenerate -m "description"` to create new migrations.

## Feature Tracking

All features are tracked in `project/features/INDEX.md` with specs in `project/features/BIKE-X-name.md`. Read `project/features/README.md` for the full workflow.

**Implementation plans** live in `project/plans/BIKE-X-plan.md` — phased task checklists with manual verification checkpoints. Created by the **Solution Architect** agent, executed by **Backend Developer** and **Frontend Developer** agents.

**Before starting any work:**
1. Read `project/features/INDEX.md` to understand current feature landscape
2. If the work relates to an existing feature, read its spec
3. Check `project/plans/` for an existing implementation plan
4. If it's a new feature not yet tracked, create a spec first (switch to the **Requirements Engineer** agent)

**After completing work:**
1. Update the feature spec with what was built and any deviations
2. Update `project/features/INDEX.md` status if applicable (Planned → In Progress → In Review → Deployed)
3. Update `project/plans/BIKE-X-plan.md` — check off completed tasks and update the status line
4. Actually edit the files — don't just describe changes. Re-read after editing to verify.

**Feature IDs:** Sequential `BIKE-1`, `BIKE-2`, etc. Check INDEX.md for the next available number.

## Product Context

See `project/PRD.md` for product vision, target users, and roadmap.
See `project/ARCHITECTURE.md` for system architecture, API endpoints, data models, and auth flow.

## Development Workflow

Use specialized agents for structured feature development. Agents are selected from the **dropdown in the Copilot Chat window** (not slash commands — those are for skills). Each agent has a distinct persona with appropriate tool restrictions and handoff buttons:

```
Requirements Engineer → Solution Architect → Backend Developer ⟷ Frontend Developer → QA Engineer
```

| Agent | Purpose |
|-------|---------|
| **Requirements Engineer** | Create feature specs with user stories and acceptance criteria |
| **Solution Architect** | Design tech architecture + create implementation plan (`project/plans/BIKE-X-plan.md`) |
| **Frontend Developer** | Build UI components, pages, styling (React, Tailwind, TypeScript) |
| **Backend Developer** | Build APIs, database schemas, services, migrations (FastAPI, SQLModel, async Python). Also handles agent service work. |
| **QA Engineer** | Test against acceptance criteria + security audit. Never fixes bugs — only documents them. |

Supporting skills (invoked via `/skill` slash commands):

| Skill | Purpose |
|-------|---------|
| `/release` | Tag, deploy, update changelog (shipping is always separate) |
| `/help` | Check project status, plan progress, and get next-step guidance |

Each agent reads `project/features/INDEX.md` at start and suggests the next agent on completion via handoff buttons. Handoffs are user-initiated — an agent never auto-proceeds to the next phase.

## Agent Behavior

### Workflow

For non-trivial changes, follow this sequence:
1. **Research** — read relevant files, search for existing patterns and reusable utilities before writing code.
2. **Plan** — decompose into small, self-contained tasks with clear acceptance criteria.
3. **Implement** — execute each task with surgical precision. Make minimal changes.
4. **Verify** — confirm the change works (build, tests, manual check) before moving on.

### Principles

- **Minimum necessary complexity.** Apply YAGNI/KISS — don't add unrequested features or speculative abstractions. Balance leanness with genuine robustness.
- **Verify before acting.** Never assume — read the actual code, check actual file paths, confirm actual API signatures. Base decisions on verified facts, not guesses.
- **Clean up as you go.** When changes make code obsolete, remove it immediately. No dead code, no orphaned imports.
- **Propagate change impact.** When modifying a function signature, type, or API contract, trace and update all upstream and downstream callers.
- **Reuse what exists.** Search for existing utilities, components, hooks, and helpers before creating new ones. Follow established patterns in the codebase.
- **Don't hammer.** If an approach fails twice, change strategy instead of retrying the same thing.
- **Constructive fixes only.** Address root causes — don't disable tests, suppress errors, or remove functionality to make something pass.
- **Keep architecture docs in sync.** After making non-trivial code changes (new endpoints, models, or auth changes), update `project/ARCHITECTURE.md`.

## Parallel Sessions

Multiple Copilot CLI instances can run simultaneously in separate terminals to work on different parts of the project. Guidelines:

### Recommended Session Splits

- **Frontend session** — UI components, pages, i18n, styles. Working directory: `frontend/`.
- **Backend session** — API routes, services, models, migrations. Working directory: `backend/`.
- **Agent session** — Product scraper logic. Working directory: `agent/`.
- **Cross-cutting session** — Docker, CI/CD, docs, root-level config.

### Avoiding Conflicts

- Each session should focus on one service boundary. Avoid editing the same files from multiple sessions.
- Coordinate database migrations — only one session should create Alembic revisions at a time.
- If sessions touch shared files (e.g., `docker-compose.yml`, `.env.example`), finish one edit before starting another.
- Run `git pull --rebase` before committing to pick up changes from other sessions.

### Tips

- Use `/rename` to label each session (e.g., "frontend-auth", "backend-api").
- Use `/diff` in each session to review changes before committing.
- Keep sessions focused — one feature or fix per session works best.
- If a change in one service requires a matching change in another (e.g., new API endpoint + frontend integration), plan the interface first, then implement in parallel.

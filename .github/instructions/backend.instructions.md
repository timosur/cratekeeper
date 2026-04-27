---
applyTo: "backend/**"
---

# Backend Instructions — `backend/`

FastAPI app (`cratekeeper_api/`) plus a vendored domain engine (`cratekeeper/`),
both shipped from the same wheel. Python ≥ 3.11, managed with `uv`.

Always read [backend/cratekeeper_api/main.py](../../backend/cratekeeper_api/main.py)
and [backend/cratekeeper_api/container.py](../../backend/cratekeeper_api/container.py)
before adding a new wiring point — the lifespan, routers, and DI container are
the single registration surface.

## Package Layout

```
backend/
├── alembic/                       # Migrations (head must equal HEAD on every PR touching ORM)
├── cratekeeper/                   # Domain engine (pure Python). Pipeline modules:
│   ├── classifier.py              # rule-based genre bucket assignment
│   ├── matcher.py                 # ISRC → exact → fuzzy local matching
│   ├── mood_analyzer.py           # essentia + TF audio analysis
│   ├── tag_writer.py              # in-place ID3/Vorbis/MP4 writes (with backups)
│   ├── event_builder.py / library_builder.py
│   ├── local_scanner.py           # owns the `tracks` table DDL
│   ├── spotify_client.py / tidal_client.py / musicbrainz_client.py
│   └── models.py                  # canonical Track / EventPlan dataclasses
├── cratekeeper_api/
│   ├── main.py                    # app factory + lifespan + middleware
│   ├── config.py                  # pydantic-settings, env-prefixed CRATEKEEPER_*
│   ├── container.py               # DI: db, registries, integration clients
│   ├── db.py / orm.py             # SQLAlchemy 2.x session + Mapped models
│   ├── schemas.py                 # Pydantic request/response shapes
│   ├── secrets_store.py           # Fernet-encrypted setting kv
│   ├── security.py                # filesystem root allow-list + mount checks
│   ├── seed.py                    # initial settings + 18 genre buckets
│   ├── integrations/              # spotify / tidal / musicbrainz / anthropic
│   ├── jobs/
│   │   ├── engine.py              # asyncio queue, semaphores (1 heavy / 4 light)
│   │   ├── registry.py            # @register("name") handler decorator
│   │   ├── context.py             # JobContext: db_session, log, progress, params
│   │   ├── sse.py                 # /jobs/{id}/stream event format
│   │   └── handlers/              # one file per pipeline step
│   ├── routers/                   # one file per resource
│   └── services/                  # cross-router business logic
└── tests/                         # pytest, asyncio_mode = "auto"
```

## Routes & Auth

- One router per resource under `cratekeeper_api/routers/`. Wire it in
  `main.py` (see existing imports — order matters only for OpenAPI tags).
- Every router that mutates state attaches the bearer-token guard:

  ```python
  from cratekeeper_api.routers._auth import AuthDep

  router = APIRouter(prefix="/events", tags=["events"], dependencies=[AuthDep])
  ```

- Inject the DB session via `Depends(get_db)` from `cratekeeper_api.db`. Never
  open a `Session` manually inside a request handler.
- Request/response shapes live in `schemas.py` as Pydantic v2 models. Do not
  return ORM instances directly — convert to a schema (e.g. `_to_out(...)`).

## ORM & Migrations

- Models extend `Base` from `cratekeeper_api.db` and use SQLAlchemy 2.x
  `Mapped[...]` / `mapped_column(...)`. UUIDs are stringified via the `_uuid()`
  helper in `orm.py`. Use `_utcnow` (timezone-aware UTC) for default timestamps.
- The `tracks` table is owned by `cratekeeper/local_scanner.py`. The
  `LibraryTrack` mapping carries `__table_args__ = {"info": {"skip_autogenerate": True}}`.
  When adding new models, **never** introduce relationships that would require
  Alembic to alter `tracks`.
- Create migrations with:

  ```bash
  cd backend && uv run alembic revision --autogenerate -m "short imperative summary"
  ```

  Always open the generated file and: (1) drop any `op.create_table("tracks", ...)`
  or `op.drop_table("tracks")` if autogenerate slips; (2) add explicit
  `server_default` for new non-null columns on existing tables; (3) keep the
  `down_revision` chain linear.

## Jobs

- A pipeline step is a handler module under `jobs/handlers/`. Register with
  `@register("step-name")` and accept a single `JobContext`:

  ```python
  @register("fetch")
  async def run(ctx: JobContext) -> dict:
      ...
      return {"summary": ...}   # JSON-serializable; persisted on the job row
  ```

- Use `ctx.db_session()` (a `with` block — auto-commits on success) for DB
  access. Use `ctx.log(...)` for SSE log lines and `ctx.progress(done, total)`
  for progress updates.
- Heavy jobs (`analyze`, `apply_tags`, `build*`) compete for the single heavy
  slot; everything else runs on the light pool. Mark new jobs explicitly when
  registering if they touch the filesystem at scale.
- Long-running steps must be **resumable**: write checkpoints (per-track or
  per-batch) so a restart can skip completed work.

## Integration Clients

- Wrappers in `cratekeeper_api/integrations/` and direct REST clients in
  `cratekeeper/*_client.py`. Always go through the shared client in
  `container.get_container()` — do not instantiate Spotify/Tidal/Anthropic
  clients ad-hoc inside handlers.
- Credentials come from `secrets_store` (Fernet-encrypted) — never read from
  `data/*.json` directly in new code.

## Filesystem Safety

Any path that originates from request input, env, or user-stored settings must
be resolved via `cratekeeper_api.security.get_allowed_roots(db)` and rejected
with `PathOutsideRootError` if it escapes. Mount readiness is checked with
`MountNotReadyError`. Never accept absolute paths into the API without this
check.

## Testing

- Tests live in `backend/tests/`. `conftest.py` spins up an ephemeral Postgres
  via `docker run` and runs migrations — Docker must be available.
- `asyncio_mode = "auto"` is set, so test functions can be `async def` without
  decorators.
- Use the `client` fixture (FastAPI `TestClient`) and `session_scope()` for
  direct DB assertions. Auth is bypassed via `test_mode` — do not add bearer
  headers in tests.
- Single test:
  `cd backend && uv run pytest tests/test_events.py::test_create_event -x`.

## Don'ts

- Don't write to `tracks` from routes/services — the scanner owns it.
- Don't perform blocking I/O on the event loop. Wrap CPU/blocking work in
  `anyio.to_thread.run_sync` or push it into a job handler.
- Don't bypass `AuthDep` on mutating routes.
- Don't add a new Pydantic settings field without a default and an env prefix
  (`CRATEKEEPER_*`).
- Don't introduce a new ORM relationship across the `tracks` boundary.

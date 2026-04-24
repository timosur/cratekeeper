## Cratekeeper Web App V1 — Plan Index

Build a local-first web app (FastAPI + React) that orchestrates the existing cratekeeper pipeline end-to-end, including event workflows and master playlist management. Reuse current Python domain modules as the execution engine, extend the existing PostgreSQL schema for workflow state, and run long steps asynchronously with real-time progress updates.

### Milestones

1. [01-foundations.md](01-foundations.md) — Phase 1: architecture, data model, API contract, security.
2. [02-backend.md](02-backend.md) — Phase 2: backend baseline + tests, async job engine, integration adapters, LLM tag classifier, filesystem/artifacts.
3. [03-frontend.md](03-frontend.md) — Phase 3: React shell, event workflow UI, master library UI, settings.
4. [04-hardening.md](04-hardening.md) — Phase 4: reliability/safety hardening, verification + rollout.

### Decisions (cross-cutting)

- **Scope**: full pipeline in v1 (intake → sync/tagging) and the on-disk master library (`crate build-library` — accumulates real files at `~/Music/Library/Genre/…`). Spotify/Tidal *master-playlist* management is **deferred past v1** — event sub-playlists on Spotify/Tidal are still in scope (that's part of per-event sync).
- **UX**: hybrid dashboard + guided event workflow; multi-event concurrent (dashboard lists all active events; heavy jobs serialize in the backend queue).
- **Stack**: FastAPI backend; React + Vite + TypeScript + TanStack Query + react-hook-form on the frontend; SSE for progress + logs (no WebSockets in v1).
- **Persistence**: extend the existing PostgreSQL schema (owned today by `local_scanner.py`'s `tracks` table); Alembic for migrations; single source of truth shared with the CLI.
- **Runtime**: local macOS, single-user. Backend + worker run natively on the mac (essentia + TF run locally now — old Docker-only constraint no longer applies). Postgres runs in Docker as today. Models stay on local disk as the CLI uses them. Production hosting deferred beyond v1.
- **Jobs**: in-process asyncio queue inside FastAPI (no separate worker process in v1). Crash recovery handled via DB checkpoints.
- **Integrations**: reimplement Spotify/Tidal in Python against their REST APIs; the existing `spotify-mcp` / `tidal-mcp` servers are not used by the web app. Both Spotify and Tidal use an in-app OAuth flow for first-run auth and re-auth (the skill delegates Spotify auth to the MCP today; the web app can't).
- **LLM tag classification**: move from Claude Code's `runSubagent` (used by the prepare-event skill (removed) today) to a direct Anthropic API call from the backend using the `anthropic` Python SDK. Enable prompt caching on the fixed instruction block. Surface token usage and estimated cost in the UI before the user triggers the job (`runSubagent` was effectively free under the Claude Code subscription; the API bills per token). Tag vocabularies (`energy/function/crowd/mood`) are fixed in v1 — not user-editable — unlike genre buckets which are.
- **LLM genre-suggestions**: the classifier returns an optional `genre_suggestion` per track. These are surfaced in a dedicated review lane after tagging (separate from tag corrections), user bulk-accepts or ignores.
- **Stale-build invalidation**: re-running Tagging marks library and event-folder builds as stale; the UI prompts for a rebuild (does not auto-rebuild — files are large).
- **Quality gate**: a pre-flight Quality Checks panel runs before the destructive steps (tag-write, build-event, sync). Warnings are advisory; failures require explicit override.
- **Event folder build mode**: copy by default (portable output); symlink is a per-event option.
- **Out of scope for v1**: cloud multi-tenant auth, multi-user permissions, Windows support, hosted operations.

### Relevant files (reused across milestones)

- [cratekeeper-api/cratekeeper/cli.py](../../cratekeeper-api/cratekeeper/cli.py) — command-to-service mapping, workflow sequencing.
- [cratekeeper-api/cratekeeper/models.py](../../cratekeeper-api/cratekeeper/models.py) — canonical Track / EventPlan models.
- [cratekeeper-api/cratekeeper/classifier.py](../../cratekeeper-api/cratekeeper/classifier.py) — classification logic.
- [cratekeeper-api/cratekeeper/matcher.py](../../cratekeeper-api/cratekeeper/matcher.py) — local matching engine; `progress_callback(i, total, track, result)` pattern.
- [cratekeeper-api/cratekeeper/mood_analyzer.py](../../cratekeeper-api/cratekeeper/mood_analyzer.py) — essentia + TF; long-running audio analysis integration points.
- [cratekeeper-api/cratekeeper/event_builder.py](../../cratekeeper-api/cratekeeper/event_builder.py) — event folder output and report generation.
- [cratekeeper-api/cratekeeper/library_builder.py](../../cratekeeper-api/cratekeeper/library_builder.py) — master/library build.
- [cratekeeper-api/cratekeeper/tag_writer.py](../../cratekeeper-api/cratekeeper/tag_writer.py) — in-place metadata writes; needs backup + undo.
- prepare-event skill (removed) — current manual pipeline; step 8 uses Claude Code `runSubagent` that the backend must replace with a direct Anthropic API call.
- [cratekeeper-api/cratekeeper/cli.py:589](../../cratekeeper-api/cratekeeper/cli.py) — `apply-tags` command; the backend LLM classifier writes the same `data/<slug>.tags.json` format this command consumes, so existing logic is reused.
- [cratekeeper-api/cratekeeper/spotify_client.py](../../cratekeeper-api/cratekeeper/spotify_client.py) — Spotify API integration.
- [cratekeeper-api/cratekeeper/tidal_client.py](../../cratekeeper-api/cratekeeper/tidal_client.py) — Tidal API/session.
- [cratekeeper-api/cratekeeper/musicbrainz_client.py](../../cratekeeper-api/cratekeeper/musicbrainz_client.py) — enforces 1 req/sec rate limit.
- [cratekeeper-api/cratekeeper/local_scanner.py](../../cratekeeper-api/cratekeeper/local_scanner.py) — owns the canonical `tracks` postgres schema; extend, don't duplicate.
- [cratekeeper-api/cratekeeper/genre_buckets.py](../../cratekeeper-api/cratekeeper/genre_buckets.py) — 18 hardcoded buckets; migrate to DB-backed config.
- [cratekeeper-api/cratekeeper/mood_config.py](../../cratekeeper-api/cratekeeper/mood_config.py) — genre-specific thresholds; migrate to DB-backed config.
- [docker-compose.yml](../../docker-compose.yml) — postgres runs here; the `crate` container stays for CLI use but is not part of the web app runtime.
- [data/wedding-test.json](../../data/wedding-test.json), [.classified.json](../../data/wedding-test.classified.json), [.tags.json](../../data/wedding-test.tags.json) — workflow fixtures.

### Open questions

None at the plan level — all foundational decisions are resolved. Remaining unknowns are implementation details that should surface during Milestone 1 work (e.g. concrete DB schema shape, exact SSE event payloads, OAuth redirect URI for local dev).

### Top-level acceptance (see per-milestone acceptance for details)

- Full pipeline runs end-to-end from playlist intake to event folder build and playlist sync on local macOS.
- `crate` CLI and the web app can both mutate state without drift (coexistence test passes).
- Mood analysis can be killed mid-run and resumed without double-processing.
- Tag writes can be reverted to the pre-write byte-exact state.

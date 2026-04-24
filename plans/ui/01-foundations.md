## Milestone 1 — Phase 1: Foundations

Design-only milestone. No production code yet; output is a set of contracts (schema, API, security) that unblock Phase 2.

**Depends on**: nothing.
**Unblocks**: Milestone 2 (every Phase 1 output feeds directly into backend implementation).

### Work items

1. **Architecture and foundations**: define bounded contexts (Events, Tracks, Workflow Jobs, Playlist Integrations, Settings). Map CLI commands in [cli.py](../../cratekeeper-cli/cratekeeper/cli.py) to backend services. Decide per module whether to invoke directly or wrap in an adapter.

2. **Data model design**: extend the existing PostgreSQL schema. [local_scanner.py](../../cratekeeper-cli/cratekeeper/local_scanner.py) owns the canonical `tracks` table — do not duplicate. Add new tables:
   - `events` (id, name, slug auto-derived + editable, date, source_playlist_url, created/updated timestamps).
   - `event_tracks` (joins events ↔ tracks with per-event state: bucket, confidence, era, audio analysis, llm tags, llm_genre_suggestion, local_path, match_status, acquire_later flag).
   - `event_builds` (state per build artifact — library + event folder — with `is_stale` flag, last-built-at, path; set stale when upstream tagging reruns).
   - `event_fetches` (history of fetch/re-fetch runs per event with added/removed/unchanged track diffs).
   - `job_runs` (job type, event, status, started/ended, structured summary blob — match breakdown, energy dist, token usage, etc.).
   - `job_checkpoints` (per-track progress for resumable jobs).
   - `playlist_sync_runs` (per-event Spotify/Tidal sub-playlist sync history).
   - `settings` (key-value; holds Anthropic API key, model, caching toggle, allowed FS roots, etc.).
   - `genre_buckets` + `mood_thresholds` (DB-backed config seeded from current constants; shared with CLI).

   Introduce Alembic for migrations. Define a CLI/web coexistence contract so both read/write without corruption. Map to existing [models.py](../../cratekeeper-cli/cratekeeper/models.py) dataclasses.

3. **API contract design** (parallel with #2): define REST endpoints + SSE channels for workflow control, track review/editing, job progress, event outputs, and master playlist management. Commit to SSE (unidirectional progress fits server-sent events; no WebSockets in v1). Define a separate SSE channel per job for structured log lines, distinct from the progress channel. Include the in-app Tidal OAuth redirect endpoints.

4. **Security and runtime constraints**: define local-only auth mode, secrets storage strategy for Spotify/Tidal/Anthropic tokens (stored server-side, never returned to the browser), file-system safety rules (read/write allowed roots), and destructive-operation confirmations (tag writing). Anthropic usage bills per token — the backend must persist `ANTHROPIC_API_KEY` securely (env var or DB-backed settings encrypted at rest) and log per-job token counts for cost attribution. Mount pre-flight: before dispatching any scan, build-library, or build-event job, verify configured roots (e.g. `/Volumes/Music`) are reachable and readable; fail fast with a clear error instead of silently producing empty results.

### Acceptance

- Written architecture doc with bounded contexts and CLI-command → service map.
- Alembic migration scaffolded; schema diagram or SQL that extends (not duplicates) the existing `tracks` table.
- OpenAPI schema draft for REST endpoints; per-channel SSE event schema (progress vs. log).
- Security doc listing allowed file roots, secret storage, and confirmation rules for destructive ops.

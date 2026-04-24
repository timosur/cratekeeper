## Milestone 2 — Phase 2: Backend Implementation

Build the FastAPI backend, async job engine, integration adapters, and filesystem/artifact layer. Everything from here runs real code against the real pipeline.

**Depends on**: Milestone 1 (all foundational decisions).
**Unblocks**: Milestone 3 (frontend consumes the API + SSE contracts built here).

### Work items

1. **Backend baseline** (depends on all Milestone 1 items): scaffold FastAPI app structure and service layer that reuses existing cratekeeper modules for fetch/classify/review/match/build/sync/tag flows.

   **Test baseline sub-step** (non-negotiable, do this first): introduce pytest, an ephemeral postgres fixture (testcontainers or a compose override), and mock doubles for MCP/Spotify/Tidal/MusicBrainz clients. No tests exist in the repo today; without this sub-step, later work cannot TDD against contracts.

2. **Async execution engine** (depends on API contract from Milestone 1): implement an in-process asyncio-backed job runner inside FastAPI for fetch, enrich, classify, scan (incremental + full), match, analyze-mood, classify-tags, tag, build-library, build-event, and sync operations (no separate worker process in v1). Forward existing `progress_callback(i, total, track, result)` hooks from [matcher.py](../../cratekeeper-cli/cratekeeper/matcher.py), [mood_analyzer.py](../../cratekeeper-cli/cratekeeper/mood_analyzer.py), etc. to the SSE progress and log channels.

   **Scan modes**: incremental is the default ([local_scanner.py](../../cratekeeper-cli/cratekeeper/local_scanner.py) skips already-indexed files); the `full` mode re-indexes everything. Surface as two distinct job types or one job with a `mode` param — pick whichever maps cleanest to the step 1 service layer.

   **Per-job summaries**: on completion, persist structured summary artifacts in `job_runs` (match-rate breakdown, energy distribution, BPM histogram, token usage) so the UI can render first-class summary pages without re-parsing logs.

   **Smart re-fetch / diff**: a `refetch` job type compares a new fetch against the last saved tracks for the event, computes added / removed / unchanged sets, persists the diff on the `job_runs` row, and returns it for the UI to show. Downstream re-runs (enrich/classify/match/analyze/classify-tags) accept a `track_ids` filter so they only process the affected subset. Unchanged tracks keep their prior state untouched.

   **Checkpointing from day one**: mood analysis is minutes-to-hours per event — crashes and backend restarts must not lose work (in-process queues die with the process, so DB-backed checkpoints are the only recovery mechanism). Persist per-track checkpoints in `job_checkpoints` and support `resume_from` on re-run.

   **Concurrency model**: one heavy job (mood, scan) at a time globally, enforced via an asyncio semaphore; light jobs (MusicBrainz enrichment, classify) can parallelize across events.

   **Rate limiting**: enforce the [musicbrainz_client.py](../../cratekeeper-cli/cratekeeper/musicbrainz_client.py) 1 req/sec limit at the runner level (shared token bucket), so multiple concurrent jobs cannot violate it together.

3. **Integration adapters** (parallel after backend baseline): reimplement Spotify and Tidal directly in Python against their REST APIs (not via the MCP servers); reuse [spotify_client.py](../../cratekeeper-cli/cratekeeper/spotify_client.py) and [tidal_client.py](../../cratekeeper-cli/cratekeeper/tidal_client.py) as the foundation and extend them with server-side token storage and refresh. **Both Spotify and Tidal** use an in-app OAuth flow for first-run auth and re-auth (redirect → backend callback → return to UI); the skill's reliance on the Spotify MCP for auth is not available to the web app. Intake endpoint normalizes either a Spotify playlist URL or a raw playlist ID. Scope: playlist read (Spotify wish playlists), per-event sub-playlist sync on both platforms, and the Tidal URL surface for unmatched tracks (the same URLs `crate match --tidal-urls` produces today). **Out of scope in v1**: master-playlist CRUD on Spotify/Tidal. Also wrap [musicbrainz_client.py](../../cratekeeper-cli/cratekeeper/musicbrainz_client.py) as a rate-limited adapter; expose the rate-limited queue depth as a computable ETA that the UI can render during enrichment (1 rps × N pending). All adapters: idempotent retry for long jobs.

4. **LLM tag classifier** (parallel after backend baseline): build a new `tag_classifier` module (none exists today — the [prepare-event skill](../../.github/skills/prepare-event/SKILL.md) delegates this to Claude Code's `runSubagent`). Implementation:
   - Use the `anthropic` Python SDK against the Anthropic API; default model `claude-sonnet-4-6` (tags are structured classification, not reasoning-heavy).
   - Port the prompt from step 8 of the skill verbatim; enable **prompt caching** on the fixed instruction block (valid values, rules, schema) since the per-track lines are the only varying part across runs.
   - Chunk large playlists (e.g. 50 tracks per request) to keep latency bounded and partial failures recoverable.
   - Expose as a job type `classify-tags` in the async engine (item #2) with the same progress/log SSE contract as other jobs.
   - Write the classifier output into the same `data/<slug>.tags.json` format that `crate apply-tags` already consumes ([cli.py:589](../../cratekeeper-cli/cratekeeper/cli.py)) — do not invent a new format.
   - Persist the optional `genre_suggestion` field per track on `event_tracks.llm_genre_suggestion` so the UI can surface a distinct "suggested reclassifications" lane without re-parsing the tags JSON.
   - On successful completion, mark any existing `event_builds` rows for this event as `is_stale=true` so the UI prompts for a rebuild (do not auto-rebuild; file copies are expensive).
   - Record per-job input/output token counts + cache-hit ratio in `job_runs` for cost attribution. Stream them into the log SSE channel so the UI can render a running cost.

5. **Filesystem and artifact layer** (depends on backend baseline): implement a managed artifact store for JSON outputs and missing reports, plus path normalization/configuration for local macOS. Keep producing `data/*.json` artifacts so the CLI continues to work against the same state, or provide a read-adapter if artifacts move into the DB — do not silently drop them. Event folder builds copy files by default (portable); symlink is a per-event option surfaced in the UI. Before any scan / build-library / build-event dispatch, run the mount pre-flight from Milestone 1 step 4 — fail fast with a structured error the UI can render ("Music library at /Volumes/Music is not mounted").

6. **Quality checks service** (depends on backend baseline): compute the skill's Quality Checks (all tracks accounted for, match rate ≥ 50%, audio analysis complete, LLM tags assigned, tags written, files are real copies vs. symlinks with a warning only, missing tracks listed) as a single endpoint that returns a structured result. Called by the UI pre-flight panel before the destructive steps (tag-write, build-event, sync).

### Acceptance

- Pytest runs green locally against an ephemeral postgres; mock doubles exist for all external integrations (including a mocked Anthropic client for the tag classifier).
- Each workflow endpoint triggers the expected service calls and persists the correct event/job state transitions (contract tests pass).
- SSE progress + log events stream for scan, match, analyze-mood, classify-tags, and sync jobs.
- Tag classifier produces a `data/<slug>.tags.json` that `crate apply-tags` accepts without modification; running a classifier job twice on the same input with prompt caching on shows a cache-hit ratio > 0 on the second run.
- Incremental scan skips already-indexed files; full scan re-indexes everything (assert row counts + timestamps).
- Re-fetching a playlist that has one added track and one removed track produces a diff with exactly those two entries; running enrich/classify/match/analyze afterwards only processes the added track.
- Each completed job persists a structured summary (e.g. match-rate counts, energy distribution) in `job_runs` that the API returns without the UI parsing log lines.
- Quality-checks endpoint returns deterministic green/warn/fail states on a fixture event.
- A classify-tags job completion flips `event_builds.is_stale` to true for any existing builds on that event.
- Dispatching a scan against an unmounted `/Volumes/Music` returns a structured "not mounted" error before any work is queued.
- Running [data/wedding-test.json](../../data/wedding-test.json) through the full backend pipeline produces the expected bucket summary, matched tracks, tags, and generated reports.
- File operations cannot write outside configured roots (safety tests pass).
- Killing a mood analysis job at ~50% and resuming does not double-process and does not lose work.
- MusicBrainz rate limit is respected when two enrichment jobs run concurrently.
- `crate scan` from the CLI while the web app is idle, and a web-app-triggered scan while the CLI is idle, both leave the DB consistent with no duplicate rows.

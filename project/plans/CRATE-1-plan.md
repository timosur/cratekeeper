# Plan: CRATE-1 — Events list aggregation API

> Status: Phase 3 complete — ready for final manual walkthrough
> Feature spec: [CRATE-1](../features/CRATE-1-events-list-aggregation-api.md)
> Created: 2026-04-27

This is a **backend-only** feature. All phases are owned by the
**Backend Developer** agent. No frontend phase — the dashboard is wired
in CRATE-2.

---

## Phase 1: Backend — Pipeline ordering primitive + schema

Owner: **Backend Developer**

- [x] Create `backend/cratekeeper_api/pipeline.py` with:
  - `PipelineStep` dataclass (`index`, `label`, `job_type`, `derives_progress`)
  - `PIPELINE_ORDER` constant — 11 entries in canonical order (Fetch, Enrich, Classify, Review, Scan, Match, Analyze, Classify Tags, Apply, Build Event, Build Library); Review and Scan have `derives_progress=false`.
  - `total_steps()` returning `len(PIPELINE_ORDER)`.
  - `current_step(db, event_id)` returning `(index, label)` based on the highest `derives_progress=true` step with at least one succeeded `JobRun` for the event (defaults to the first entry when none).
- [x] Add unit test `tests/test_pipeline_order.py` (renamed from `test_pipeline.py` because that file already exists for the end-to-end vertical):
  - Asserts every `job_type` in `PIPELINE_DEPENDENCIES` is also present in `PIPELINE_ORDER` (excluding library-scoped jobs).
  - Asserts `current_step` for fixtures: no jobs → `(0, "Fetch")`; only `fetch` succeeded → Fetch; `apply-tags` succeeded out-of-order → Apply (defensive, AC-EC-5); ignores non-succeeded jobs.
- [x] Create Alembic migration `0002_tagged_at` adding nullable `event_tracks.tagged_at TIMESTAMPTZ` (no index — `event_id` filter is sufficient).
- [x] Add `tagged_at: Mapped[datetime | None]` to the `EventTrack` ORM model.
- [x] Update `apply-tags` handler — sets `tagged_at = NOW()` in the same session that writes tag backups when `dry_run` is false.
- [x] Update `undo-tags` handler — clears `tagged_at` to `NULL` for restored rows in a single bulk update.
- [x] Migrations applied via Alembic in test fixtures; `uv run pytest` green (35 passed).
- [x] **Checkpoint:** Manual verification — show the migration diff, the new `pipeline.py` API, the apply-tags / undo-tags edits. Confirm pipeline ordering matches the PRD section list. **Pause for approval before Phase 2.**

## Phase 2: Backend — Aggregated `GET /events` payload

Owner: **Backend Developer**

- [x] Extend `EventOut` in `backend/cratekeeper_api/schemas.py` with the 8 new optional fields (defaults preserved for create/update backward compat).
- [x] Extend `JobOut` with `queue_position: int | None = None`.
- [x] Implement `backend/cratekeeper_api/services/event_aggregation.py` with `build_event_out` / `build_event_outs`. Rather than `LEFT JOIN LATERAL`, the service issues a constant ~7 batched aggregate queries keyed by `event_id` (counts, succeeded step indexes, stale flag, last job/track activity, active job, queue positions). Equivalent perf with the existing `event_id` indexes and easier to maintain.
- [x] Implement `_compute_queue_positions(...)` — loads all queued JobRuns globally, partitions by heavy (from the registry) vs light per type, 1-based ranks by `created_at`.
- [x] Wire the helper into list/get responses so `active_job.queue_position` is set when status is `queued`.
- [x] Rewrote `list_events` and `get_event` in `routers/events.py` to use the aggregation service. Create/update routes still use the basic `_to_out(...)` (defaults for new fields).
- [x] Added EXPLAIN smoke test (asserts the aggregation query targets `event_tracks`).
- [x] Added behavioral tests in `tests/test_events_aggregation.py`: empty event (EC-1), mid-pipeline succeeded jobs (AC-4), failed-only (active_job surfaces error), cancelled-only (EC-3), stale builds (AC-8), multi-failed + running (EC-2 — running wins), out-of-order succeeded (EC-5), queued with position 1+2 (AC-10), list shape, create-response defaults.
- [x] `uv run pytest` green: 47 passed.
- [ ] **Checkpoint:** Manual verification — `curl` `GET /events` and `GET /events/{id}` against a seeded DB; inspect the JSON; confirm all 8 new fields are present and correct. **Pause for approval before Phase 3.**

## Phase 3: Integration & docs

Owner: **Backend Developer**

- [x] Update `project/ARCHITECTURE.md`:
  - Mention the new `pipeline.py` module and its relationship to `jobs/dependencies.py`.
  - Note that `GET /events[/{id}]` returns the enriched payload while create/update endpoints return the basic shape.
  - Add `tagged_at` to the `event_tracks` schema description.
- [ ] Update `project/features/INDEX.md`: set CRATE-1 status to **Done** after merge (the implementing agent does this in the merge commit).
- [x] Run `cd backend && uv run pytest` one final time to confirm a clean baseline. (47 passed)
- [ ] **Checkpoint:** Manual verification — full feature walkthrough:
  1. Start the API + Postgres locally.
  2. Seed two events via the existing seed flow / API.
  3. Hit `GET /events`; confirm `current_step_*`, `matched_count`, `tagged_count`, `is_stale`, `last_activity_at`, `active_job` all populate correctly across at least three event states (no jobs / running / failed).
  4. Confirm response time is reasonable (<100ms for ≤50 events on dev hardware).

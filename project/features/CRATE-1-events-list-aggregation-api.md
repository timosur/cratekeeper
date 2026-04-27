# CRATE-1: Events list aggregation API

## Description

Extend the backend's `GET /events` endpoint so a single request returns
everything the Events Dashboard needs to render a card: track counts
(total / matched / tagged), pipeline progress (current step index +
label, total steps), the active job (running / queued / failed) for the
event, a stale-build flag, and a last-activity timestamp.

Today the dashboard would have to make N+1 calls (`/events`, then per
event `/tracks`, `/builds`, `/jobs?event_id=…`) to assemble the same
view. This feature collapses that into one round-trip and introduces a
canonical, ordered list of the 11 pipeline steps as backend-owned truth.

## Scope

**In scope**
- Define a canonical `PIPELINE_ORDER` (the 11 user-visible steps) and a
  helper that derives `(current_step_index, current_step_label)` for an
  event from its `JobRun` history.
- Extend the response payload of `GET /events` (and `GET /events/{id}`)
  with the aggregated fields listed in **Acceptance Criteria**.
- A single SQL strategy that does **not** N+1 over events.

**Out of scope**
- Changes to the Events Dashboard UI (covered by **CRATE-2**).
- A global jobs SSE stream (covered by **CRATE-5**).
- Auto-enqueueing jobs on event creation (covered by **CRATE-3**).
- Any new write endpoints; this feature is read-only.

## Dependencies

None — this is a foundation feature.

## Services Affected

- **backend** — `cratekeeper_api/routers/events.py`,
  `cratekeeper_api/schemas.py`, `cratekeeper_api/jobs/dependencies.py`
  (or a new `pipeline.py`).

## User Stories

- As an **operator**, I want to open the Events page and immediately see
  every active event's progress and active job, so that I can decide what
  to work on without clicking into each one.
- As an **operator**, I want each card to tell me which of the 11
  pipeline steps the event is currently on, so that I always know "where
  am I" at a glance.
- As an **operator**, I want stale events (downstream builds out of date)
  to be flagged on the list, so that I can re-run the build before the
  gig.
- As an **operator**, I want events with a failed job to be visually
  distinct in the list, so that I can prioritize fixing them.
- As a **frontend developer**, I want a single endpoint that returns
  everything a card needs, so that I don't have to fan out N+1 requests
  per page render.

## Acceptance Criteria

- [ ] **AC-1:** `GET /events` returns, for each event, the existing
  fields **plus** `matched_count: int`, `tagged_count: int`,
  `current_step_index: int` (0-based), `current_step_label: str`,
  `total_steps: int` (11), `is_stale: bool`, `last_activity_at: datetime`,
  and `active_job: JobOut | null`.
- [ ] **AC-2:** `GET /events/{id}` returns the same enriched shape as
  the list endpoint (single object).
- [ ] **AC-3:** `PIPELINE_ORDER` is a single ordered list of 11 entries
  matching the canonical pipeline documented in
  [.github/copilot-instructions.md](../../.github/copilot-instructions.md):
  Fetch → Enrich → Classify → Review → Scan → Match → Analyze →
  Classify Tags → Apply → Build Event → Build Library.
- [ ] **AC-4:** `current_step_index` is computed as the index of the
  highest-positioned step that has at least one `succeeded` `JobRun` for
  the event; if none have succeeded, it is `0` (Fetch).
- [ ] **AC-5:** `current_step_label` is the human-readable label of the
  step at `current_step_index` (e.g. `"Analyze Mood"`).
- [ ] **AC-6:** `matched_count` counts `event_tracks` rows where
  `match_status IN ('isrc','exact','fuzzy')`.
- [ ] **AC-7:** `tagged_count` reflects the number of tracks whose tags
  have been written to disk for this event (definition documented in
  the spec; e.g. tracks covered by the most recent successful
  `apply-tags` run, or a per-track flag).
- [ ] **AC-8:** `is_stale` is `true` when at least one `event_builds`
  row for the event has `is_stale = true`.
- [ ] **AC-9:** `active_job` is the newest `JobRun` for the event whose
  status is `running`, `queued`, or `failed`, in that priority order
  (running > queued > failed); `null` if no such job exists.
- [ ] **AC-10:** `active_job.queue_position` is populated when status is
  `queued`, reflecting the rank within queued jobs of the same slot
  class (heavy / light), 1-based; otherwise `null`.
- [ ] **AC-11:** `active_job.error` is included when status is `failed`
  (already part of `JobOut`).
- [ ] **AC-12:** `last_activity_at` is the most recent of: the event's
  `updated_at`, the latest related `JobRun.created_at`, and the latest
  `event_tracks.updated_at`.
- [ ] **AC-13:** `GET /events` issues O(1) SQL statements regardless of
  the number of events returned (no per-row queries).
- [ ] **AC-14:** Existing fields on `EventOut` remain backward-compatible
  for any current callers (additive change only).
- [ ] **AC-15:** Existing pytest suite passes; new tests cover the
  aggregations against a seeded fixture with: an event with no jobs, an
  event mid-pipeline with a running job, an event with a failed job,
  and an event with stale builds.

## Edge Cases

- **EC-1:** Event has zero tracks → `matched_count = 0`,
  `tagged_count = 0`, `current_step_index = 0`, `active_job = null`.
- **EC-2:** Event has multiple `failed` jobs and one `running` job →
  `active_job` is the running one (status priority over recency).
- **EC-3:** Event has only a `cancelled` job → `active_job = null`
  (cancelled is not surfaced as "active").
- **EC-4:** A new pipeline step is added later → `total_steps` reflects
  the current `len(PIPELINE_ORDER)`; the frontend must not hardcode 11.
- **EC-5:** A `succeeded` job exists for a step out of canonical order
  (e.g. `apply-tags` succeeded but `match` has no success) →
  `current_step_index` still reflects the highest succeeded step
  (defensive, not blocking).
- **EC-6:** Event has builds where some are stale and some are not →
  `is_stale = true`.
- **EC-7:** `JobOut.params` may contain large blobs — only the fields
  needed by the dashboard are documented; clients must tolerate extra
  fields.
- **EC-8:** Concurrency: another job may transition between the
  aggregation queries and the response is sent → eventual consistency
  is acceptable; the live updates feature (**CRATE-5**) closes the gap.

## Open Questions

- **Q1:** Should `tagged_count` be derived from `apply-tags` job
  summaries, or should `event_tracks` get a `tags_written_at` column?
  **Resolved (Tech Design):** add a `tagged_at` column.
- **Q2:** Cancelled jobs — surface anywhere on the card, or only in the
  Audit Log? Current decision: **not surfaced** on the card.

---

## Tech Design

### Goal in one sentence

Turn `GET /events` into a single round-trip that returns everything the
Events Dashboard card needs, plus a canonical pipeline order that the
backend owns.

### Service Impact Map

```
Backend:  +1 module (pipeline.py), +1 migration (event_tracks.tagged_at),
          extended EventOut schema, rewritten list/get handlers.
Frontend: No changes (CRATE-2 consumes the new payload).
Database: +1 column (event_tracks.tagged_at, nullable timestamptz).
Agent:    No changes.
```

### A) Canonical pipeline ordering

A new module `cratekeeper_api/pipeline.py` exposes:

- `PIPELINE_ORDER` — an ordered list of 11 entries, each carrying:
  `index`, human-readable `label`, optional `job_type` (the JobRun type
  whose success advances this step), and a `derives_progress: bool` flag
  (false for the two manual / library-scoped steps so they don't count
  in per-event derivation).
- `current_step(event_id, db)` → returns `(index, label)` for the event,
  defined as the highest-index entry whose `job_type` has at least one
  `succeeded` `JobRun` for that event; if none, returns `(0, "Fetch")`.
- `total_steps()` → `len(PIPELINE_ORDER)` (= 11).

The 11 entries (in order): Fetch, Enrich, Classify, **Review**, **Scan**,
Match, Analyze, Classify Tags, Apply, Build Event, Build Library.
Review and Scan have `derives_progress=false`. The existing
`PIPELINE_DEPENDENCIES` DAG in
[backend/cratekeeper_api/jobs/dependencies.py](../../backend/cratekeeper_api/jobs/dependencies.py)
stays as the prerequisite check; the new module is the
**user-visible ordering** layer and they must not contradict each other.
A unit test enforces consistency (every `job_type` referenced in the
DAG appears in `PIPELINE_ORDER`).

### B) Schema change

One additive migration:

- `event_tracks.tagged_at TIMESTAMPTZ NULL` — set to `NOW()` per row by
  the `apply-tags` handler whenever `tag_track(t)` returns ok and we are
  not in `dry_run`. `undo-tags` clears it back to `NULL`.

`tagged_count` is then `COUNT(*) WHERE tagged_at IS NOT NULL`.

### C) Aggregated payload

Extend `EventOut` (additive, backward-compatible):

| New field              | Type                | Source |
| ---------------------- | ------------------- | ------ |
| `matched_count`        | int                 | `COUNT(*) WHERE event_tracks.match_status IN ('isrc','exact','fuzzy')` |
| `tagged_count`         | int                 | `COUNT(*) WHERE event_tracks.tagged_at IS NOT NULL` |
| `current_step_index`   | int                 | `pipeline.current_step()` |
| `current_step_label`   | str                 | `pipeline.current_step()` |
| `total_steps`          | int                 | `pipeline.total_steps()` |
| `is_stale`             | bool                | `EXISTS (event_builds WHERE is_stale=true)` |
| `last_activity_at`     | datetime            | `GREATEST(events.updated_at, latest job_runs.created_at, latest event_tracks.updated_at)` |
| `active_job`           | `JobOut \| null`    | latest job whose status ∈ {running, queued, failed}, status-priority then `created_at DESC` |

Plus the existing `JobOut` gains one optional field used only on this
endpoint: `queue_position: int | null` — populated only when status is
`queued`, computed in Python after the SQL fetch using the heavy/light
slot class from the job registry.

`active_job.error` is already part of `JobOut` and surfaces failure
reasons.

### D) SQL strategy (one round-trip)

A single SQL statement powers `GET /events`. Conceptually:

```
SELECT
  events.*,
  matched_counts.value           AS matched_count,
  tagged_counts.value            AS tagged_count,
  current_steps.index            AS current_step_index,
  current_steps.label            AS current_step_label,
  is_stale.value                 AS is_stale,
  last_activity.value            AS last_activity_at,
  active_job.*                   AS active_job_*
FROM events
LEFT JOIN LATERAL (... aggregates ...) matched_counts ON true
LEFT JOIN LATERAL (... aggregates ...) tagged_counts  ON true
LEFT JOIN LATERAL (
  SELECT job_runs.*
  FROM job_runs
  WHERE job_runs.event_id = events.id
    AND job_runs.status IN ('running','queued','failed')
  ORDER BY
    CASE status WHEN 'running' THEN 0 WHEN 'queued' THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1
) active_job ON true
LEFT JOIN LATERAL (
  SELECT MAX(jr2.created_at) FROM job_runs jr2 WHERE jr2.event_id = events.id
) latest_job ON true
LEFT JOIN LATERAL (
  SELECT MAX(et.updated_at) FROM event_tracks et WHERE et.event_id = events.id
) latest_track ON true
LEFT JOIN LATERAL (
  SELECT EXISTS(SELECT 1 FROM event_builds eb WHERE eb.event_id = events.id AND eb.is_stale)
) is_stale ON true
LEFT JOIN LATERAL (... pipeline.current_step inlined ...) current_steps ON true
ORDER BY events.created_at DESC
```

`current_step_index/label` is computed by a CTE that joins
`PIPELINE_ORDER` (built in Python and bound as a `VALUES` clause) with
the per-event set of succeeded `JobRun` types, picking the max
`derives_progress` index. This keeps the helper Python-readable while
still being a single statement.

`GET /events/{id}` reuses the same query with a `WHERE events.id = :id`
filter.

`queue_position` is a small post-pass: load all currently `queued` jobs
once, partition by heavy/light, assign ranks by `created_at`.

### E) API surface

Endpoints unchanged in path & verb; only response shape grows
(additive). Two endpoints touched:

| Endpoint            | Change |
| ------------------- | ------ |
| `GET /events`       | Returns enriched `EventOut[]` |
| `GET /events/{id}`  | Returns enriched `EventOut`   |

Other endpoints (`POST /events`, `PATCH /events/{id}`, etc.) keep
returning the basic `EventOut` shape (the new fields are optional with
sensible defaults, so this stays backward-compatible). The architecture
doc will note that the **enriched** fields are only guaranteed on the
two read endpoints; create/update return the basic shape and the client
should rely on a follow-up GET if it needs the aggregates.

### F) Tech decisions justified

- **Why a column, not a job-summary parse for `tagged_count`** —
  cheap to query, easy to keep correct (handler sets it), and lets
  `undo-tags` flip it back without re-reading job history.
- **Why a separate `pipeline.py` instead of extending
  `dependencies.py`** — `dependencies.py` answers "can I run X now?";
  `pipeline.py` answers "where is this event in the user-visible
  flow?" These are two different questions with different shapes
  (DAG vs. ordered list).
- **Why `LEFT JOIN LATERAL` per aggregate instead of one big GROUP BY**
  — explicit, easy to read, Postgres optimizes each lateral
  efficiently with the existing indexes (`event_tracks.event_id`,
  `job_runs.event_id`).
- **Why compute `queue_position` in Python** — heavy/light is a
  registry property, not a DB column. Keeping it out of the DB avoids
  a sync problem if the registry changes.
- **Why additive on `EventOut` rather than a new `EventCardOut`** —
  the dashboard is the only meaningful caller of the read endpoints;
  splitting the schema doubles maintenance for no caller benefit.

### G) Dependencies

No new Python packages. Uses the existing
`sqlalchemy`, `pydantic`, and Alembic toolchain.

### H) Risks & mitigations

| Risk | Mitigation |
| ---- | ---------- |
| `apply-tags` handler currently doesn't write per-track timestamps | Phase 1 task: extend handler in the same PR as the migration. |
| Existing tests rely on the old `EventOut` shape | New fields are optional with defaults; existing tests stay green. |
| Big query plan regressions on large databases | Add an EXPLAIN-checked smoke test asserting the plan uses the existing indexes; fall back to two queries if needed (covered by the test checkpoint in Phase 2). |
| `pipeline.py` order drifts from `dependencies.py` DAG | Unit test in Phase 1 enforces consistency. |

## Implementation Plan

See [project/plans/CRATE-1-plan.md](../plans/CRATE-1-plan.md).


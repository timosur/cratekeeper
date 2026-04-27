# CRATE-5: Live updates on the Events Dashboard

## Description

Make the Events Dashboard reflect job state changes (progress, status
transitions, new jobs) in near-real-time without the operator having to
refresh. Today the page is fully static after the initial query; any
job that starts, advances, fails, or finishes is invisible until the
user manually refetches.

This feature introduces a **single global Server-Sent Events stream**
on the backend that broadcasts every `job.*` lifecycle event, and a
frontend subscription that updates the events query cache so cards
re-render in place. The topbar's `jobActivity` counter
(`{ running, queued }`) is also driven by this stream.

## Scope

**In scope**
- New backend endpoint `GET /jobs/stream` that broadcasts
  `job.created`, `job.started`, `job.progress`, `job.succeeded`,
  `job.failed`, `job.cancelled`, `job.resumed` events for **all** jobs
  (no event-id filter).
- Each SSE event payload contains at least `job_id`, `event_id`,
  `type`, `status`, `progress_i`, `progress_total`, and the relevant
  timestamp.
- Frontend SSE subscription started while the Events page (or any page
  using the dashboard) is mounted; closed on unmount.
- Reconnect with exponential backoff and `last-event-id` resume.
- The subscription invalidates / patches the `useEvents` cache so
  cards re-render with new `active_job` / step / counts.
- Topbar `jobActivity` counter is computed from the same stream.
- Connection indicator in the topbar reflects the SSE socket state
  (`connected` / `reconnecting` / `disconnected`).

**Out of scope**
- Live updates inside the Event Detail page (it already has per-event
  streams).
- Per-track live updates inside a job (e.g. "track 42 of 124
  classified") — covered by the existing per-job log stream.
- Server-pushed dashboard reorderings or animations.
- Authentication via cookies — the SSE endpoint uses the same
  bearer-token scheme as the rest of the API.

## Dependencies

- **Requires CRATE-1** — the events query exposes the fields that need
  to be patched.
- **Requires CRATE-2** — the events query layer must exist for cache
  invalidation / patching to work.

## Services Affected

- **backend** — `cratekeeper_api/routers/jobs.py`,
  `cratekeeper_api/jobs/sse.py`, `cratekeeper_api/jobs/engine.py`
  (publish hooks if not already in place).
- **frontend** — new `frontend/src/lib/sse/*`,
  `frontend/src/lib/queries/useEvents.ts`, `frontend/src/App.tsx`
  (topbar wiring).

## User Stories

- As an **operator**, I want a card's progress bar to advance in
  real-time while a job runs, so that I can monitor without refreshing.
- As an **operator**, I want a card to switch from "queued" to
  "running" the moment its job starts, so that the dashboard matches
  reality.
- As an **operator**, I want the topbar to show how many jobs are
  running and queued across all events, so that I have a system-wide
  pulse at all times.
- As an **operator**, I want the topbar SSE indicator to tell me when
  live updates have dropped, so that I know to reload before trusting
  the page.
- As an **operator**, I want the page to recover automatically after a
  brief network blip, so that I don't have to reload to get updates
  flowing again.

## Acceptance Criteria

- [ ] **AC-1:** `GET /jobs/stream` is available, requires the bearer
  token, and emits SSE events for every `job.*` state transition that
  the engine publishes today on per-job channels.
- [ ] **AC-2:** Each SSE event has a stable `id` (monotonic integer
  per process) and supports the `Last-Event-ID` header on reconnect to
  replay missed events from a bounded in-memory buffer.
- [ ] **AC-3:** The frontend opens **one** EventSource for the global
  stream while a subscriber is mounted, and closes it on unmount; no
  extra sockets are opened per card.
- [ ] **AC-4:** When a `job.progress` event arrives, the card for the
  associated `event_id` updates its progress bar without a full
  refetch.
- [ ] **AC-5:** When a `job.started` / `job.succeeded` / `job.failed`
  event arrives, the affected event's `active_job` and
  `current_step_*` are updated; if the change crosses a step boundary
  the events query is invalidated to pick up new counts.
- [ ] **AC-6:** The topbar `jobActivity = { running, queued }` is
  recomputed live from the stream and matches `GET /jobs?status=…` on
  every transition.
- [ ] **AC-7:** Topbar `connection.sse` reflects the socket state:
  `connected` immediately after `open`; `reconnecting` while attempting
  to reconnect; `disconnected` after backoff gives up (configurable
  cap, e.g. after 5 attempts).
- [ ] **AC-8:** Reconnect uses exponential backoff (e.g. 1s, 2s, 4s,
  8s, 16s) and resumes from the last received event id.
- [ ] **AC-9:** The stream tolerates >100 events/sec without dropping
  the EventSource (engine publishes are non-blocking).
- [ ] **AC-10:** Existing per-job (`/jobs/{id}/events/progress`) and
  per-event (`/events/{id}/jobs/stream`) SSE endpoints continue to
  work unchanged.
- [ ] **AC-11:** Backend tests cover: subscribe → receive a
  transition; resume with `Last-Event-ID` replays missed events;
  unauthenticated request is rejected.

## Edge Cases

- **EC-1:** Backend restarts → the in-memory event buffer resets;
  client resumes with `Last-Event-ID = N` that no longer exists →
  server starts a fresh sequence and the client triggers a full
  `events` refetch as a safety net.
- **EC-2:** Frontend tab is backgrounded for hours → on focus, the
  client either still has a live socket (preferred) or reconnects and
  refetches the events query to resync.
- **EC-3:** Many simultaneous job events for unrelated events → the
  client batches cache updates per animation frame to avoid thrashing.
- **EC-4:** Same job emits `progress` events very rapidly → progress
  updates are throttled at the UI layer (e.g. 60fps cap), the cache
  always holds the latest value.
- **EC-5:** Bearer token is invalid → SSE connection fails with
  `401`; topbar shows `disconnected` and the events query also fails;
  user is directed to fix the token.
- **EC-6:** A job for an event not currently in the dashboard's
  `events` cache (e.g. created via API directly) → the stream
  invalidates the events query so the new card appears.
- **EC-7:** Browser hits the per-origin EventSource limit (~6) →
  irrelevant: this feature uses exactly one stream.

## Open Questions

- **Q1:** Buffer size for `Last-Event-ID` replay — 1000 events?
  Architect to decide based on worst-case throughput.
- **Q2:** Should the stream also broadcast `event.created` /
  `event.deleted` so newly-created events appear without a refetch?
  Default: **yes**, but treated as an enhancement; AC-6 covers the
  refetch fallback.

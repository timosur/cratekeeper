# CRATE-3: New Event creation flow

## Description

Wire the existing **New Event** modal to the backend so submitting the
form actually creates an event via `POST /events` and, when a Spotify
playlist URL is provided, automatically enqueues the first pipeline
step (`fetch`) so the operator doesn't have to take a second action to
get the event moving.

Currently `handleNewEventSubmit` in
[frontend/src/App.tsx](../../frontend/src/App.tsx) only navigates to a
local slug — no event is persisted.

## Scope

**In scope**
- `POST /events` from the New Event modal with the form values.
- Backend behavior: when `source_playlist_url` is present at creation
  time, the API auto-enqueues a `fetch` job for the new event in the
  same transactional flow.
- On success: navigate to `/events/{id}` of the **server-assigned** id
  (not a client-side guess) and invalidate the events list query so
  the dashboard reflects the new card.
- Surfaced server errors (validation, duplicate slug, integrity) in
  the modal.

**Out of scope**
- Editing an event (separate future feature).
- The card showing live progress of the auto-fetch job
  (covered by **CRATE-5**).
- Resuming a failed auto-fetch (covered by **CRATE-4**).
- Spotify URL parsing / preview ahead of submission.

## Dependencies

- **Requires CRATE-2** — the events list query must exist so it can be
  invalidated on success.

## Services Affected

- **frontend** — `frontend/src/App.tsx`,
  `frontend/src/components/NewEventModal.tsx`,
  `frontend/src/lib/queries/*`.
- **backend** — `cratekeeper_api/routers/events.py` (auto-fetch
  behavior on `POST /events`).

## User Stories

- As an **operator**, I want to type a name and a Spotify playlist URL
  and click Create, so that an event appears on the dashboard ready to
  work on.
- As an **operator**, I want the new event to start fetching its
  playlist automatically, so that I don't have to remember to kick off
  step 1.
- As an **operator**, I want the modal to show the server's error if
  the slug is taken, so that I can pick a different one without
  guessing what went wrong.
- As an **operator**, I want to land on the new event's detail page
  after creation, so that I can immediately watch it work.
- As an **operator**, I want to be able to create an event without a
  playlist URL (and add it later), so that I can scaffold an event
  before I have the wishlist link.

## Acceptance Criteria

- [ ] **AC-1:** Submitting the New Event modal calls `POST /events`
  with `name`, `date`, `source_playlist_url`, and the user-chosen
  `slug` (if any).
- [ ] **AC-2:** On `201 Created`, the modal closes, the events list
  query is invalidated, and the app navigates to
  `/events/{server.id}`.
- [ ] **AC-3:** When `source_playlist_url` is present in the create
  request, the backend enqueues a `fetch` `JobRun` for the new event
  inside the same request handler and includes the resulting `job_id`
  in the response (e.g. `EventOut.active_job` or a new
  `auto_fetch_job_id` field — Architect to choose).
- [ ] **AC-4:** When `source_playlist_url` is omitted, no job is
  enqueued; the event is created in an "empty" state and the response
  has no active job.
- [ ] **AC-5:** On `409 Conflict` (slug already exists), the modal
  remains open and shows the server's `detail` next to the slug field.
- [ ] **AC-6:** On `422` validation errors, the modal shows the
  per-field messages without closing.
- [ ] **AC-7:** On any other error (network, 5xx), the modal shows a
  general error message and keeps the user's input.
- [ ] **AC-8:** While the request is in flight, the submit button
  shows a spinner and is disabled to prevent double-submit.
- [ ] **AC-9:** Backend behavior is covered by a pytest test asserting
  that a create-with-URL produces both an `Event` row and a queued
  `fetch` `JobRun`.
- [ ] **AC-10:** The `audit_log` records the `event.create` action and,
  when applicable, the auto-enqueued `job.submit` action.

## Edge Cases

- **EC-1:** Auto-fetch job creation fails (e.g. engine unreachable)
  after the event is committed → the event still exists; the response
  signals the missed fetch (e.g. `auto_fetch_job_id: null` plus a
  warning); the dashboard should let the user trigger fetch manually.
- **EC-2:** User submits without a playlist URL → event created, no
  job, dashboard card shows "Fetch" as current step with no active
  job.
- **EC-3:** Spotify URL is malformed → backend should accept the
  string as-is at create time (validation happens in the fetch job).
  Validation rules can tighten in a later spec.
- **EC-4:** User clicks Create twice rapidly → only one `POST /events`
  is sent (button disabled while in flight).
- **EC-5:** The user-supplied slug is empty → backend slugifies the
  name (already implemented in
  [routers/events.py](../../backend/cratekeeper_api/routers/events.py)).
- **EC-6:** User cancels the modal while the request is in flight →
  the request is allowed to complete; if it succeeds the toast still
  invalidates the list, but no navigation is forced.
- **EC-7:** The user has no `VITE_API_TOKEN` configured →
  `401 Unauthorized` is shown in the modal as an actionable error.

## Open Questions

- **Q1:** Should the create response embed the full `EventOut` already
  populated with `active_job` (cheaper for the dashboard), or just
  return `{event, auto_fetch_job_id}`? Architect to choose; AC-3 is
  agnostic.
- **Q2:** Toast vs. inline error for "auto-fetch couldn't be enqueued
  but event was created"? Default: **inline warning on the destination
  page** plus a toast.

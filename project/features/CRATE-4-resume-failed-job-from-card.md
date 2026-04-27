# CRATE-4: Resume failed job from a card

## Description

When an event card shows a failed job, the operator should be able to
resume it directly from the dashboard without opening the event detail
page. Today the `onResumeJob` callback in
[frontend/src/pages/EventsPage.tsx](../../frontend/src/pages/EventsPage.tsx)
is a `console.info` stub. The backend already exposes
`POST /jobs/{job_id}/resume` (see
[routers/jobs.py](../../backend/cratekeeper_api/routers/jobs.py)) — this
feature wires the UI to it.

## Scope

**In scope**
- Wire the card's `Resume` button to `POST /jobs/{job_id}/resume`.
- Optimistic UI: show the card transitioning the job to `queued` while
  the request is in flight; rollback on error.
- Invalidate the events list query so the card reflects the new job
  status as soon as the request resolves.
- Toast notifications for success and failure.

**Out of scope**
- Resuming jobs from the event detail page (existing or future spec).
- Cancelling a running job from the card.
- Any backend changes — the resume endpoint already exists and works.
- Live progress of the resumed job (covered by **CRATE-5**).

## Dependencies

- **Requires CRATE-2** — needs the events query in place to invalidate.

## Services Affected

- **frontend** — `frontend/src/pages/EventsPage.tsx`,
  `frontend/src/lib/queries/*`, toast component (existing or new).

## User Stories

- As an **operator**, I want a one-click Resume on a card whose last
  job failed, so that I don't have to navigate into the event detail
  page just to retry.
- As an **operator**, I want the card to immediately reflect that I
  clicked Resume, so that I'm sure the click registered.
- As an **operator**, I want a clear notification if Resume fails (e.g.
  the job is no longer in a resumable state), so that I know to look
  closer.
- As an **operator**, I want the dashboard to refresh after a
  successful Resume, so that I can confirm the job is now queued or
  running.

## Acceptance Criteria

- [ ] **AC-1:** Clicking the Resume action on a card calls
  `POST /jobs/{active_job.id}/resume` with the bearer token.
- [ ] **AC-2:** While the request is in flight, the Resume button
  shows a spinner and is disabled; the rest of the card remains
  clickable.
- [ ] **AC-3:** On `202 Accepted`, the events list query is invalidated
  and a success toast is shown ("Job resumed").
- [ ] **AC-4:** On `409 Conflict` (job no longer resumable), an error
  toast is shown with the server's `detail`.
- [ ] **AC-5:** On any other error (network, 401, 5xx), an error toast
  is shown and the card returns to its previous state.
- [ ] **AC-6:** The Resume action is only rendered when
  `active_job.status` is `failed` or `cancelled` (matches existing
  `canResume` logic in `Dashboard.tsx`).
- [ ] **AC-7:** The Resume click does not navigate into the event
  detail page (event propagation is stopped).
- [ ] **AC-8:** `npm run lint` and `npm run build` pass with no new
  warnings.

## Edge Cases

- **EC-1:** The job transitioned from `failed` to `queued` between the
  list fetch and the click → the backend returns `409`; the user sees
  a "Job is already queued" toast and the list refetches.
- **EC-2:** Network is offline → toast says "Could not reach the API";
  no state change.
- **EC-3:** User clicks Resume rapidly multiple times → only one
  request is sent; subsequent clicks are no-ops while the first is
  in flight.
- **EC-4:** Dashboard auto-refresh (CRATE-5) fires while Resume is
  pending → the optimistic state takes precedence until the request
  resolves.
- **EC-5:** Backend is restarted between the click and the response →
  surfaced as a generic error toast.

## Open Questions

- **Q1:** Should resumes also be available for `failed` library-scoped
  jobs (no `event_id`)? Out of scope here — the dashboard only shows
  event-scoped active jobs.

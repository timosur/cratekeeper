# CRATE-2: Events Dashboard wired to real API

## Description

Replace the hard-coded `sample-data.json` import in the Events Dashboard
with live data from the backend's enriched `GET /events` endpoint
(delivered by **CRATE-1**). Introduce the project's first real API
client, a query layer for caching and refetch control, and the missing
loading / error / empty visual states the page needs in production.

## Scope

**In scope**
- A typed HTTP client that injects the bearer token and base URL from
  Vite environment variables.
- Hand-written response types mirroring the backend's `EventOut` and
  `JobOut`.
- A mapper from the backend payload to the existing `EventCard` UI
  shape (snake_case → camelCase, derived fields).
- A TanStack Query–based hook (`useEvents`) used by `EventsPage`.
- Loading skeleton, error state with retry, refetch-on-focus,
  empty-state already covered by `<Dashboard>`.
- Documentation in `frontend/README.md` of the required env vars.

**Out of scope**
- Live updates / SSE (covered by **CRATE-5**) — refetch cadence is
  manual / focus-based for now.
- The "+ New Event" submission (covered by **CRATE-3**).
- The "Resume" button on a failed job card (covered by **CRATE-4**).

## Dependencies

- **Requires CRATE-1** — the enriched `GET /events` payload.

## Services Affected

- **frontend** — `frontend/src/lib/api/*`, `frontend/src/lib/queries/*`,
  `frontend/src/pages/EventsPage.tsx`, `frontend/package.json`,
  `frontend/.env.example`, `frontend/README.md`.

## User Stories

- As an **operator**, I want the Events page to show my real events
  (not demo data), so that the app reflects the state of my system.
- As an **operator**, I want a clear loading indicator on first paint,
  so that I know the page is fetching and hasn't frozen.
- As an **operator**, I want a clear error message with a retry button
  if the API is unreachable, so that I can recover without a full page
  reload.
- As an **operator**, I want the list to refresh when I switch back to
  the browser tab, so that I'm not looking at stale data after stepping
  away.
- As a **developer**, I want a single typed API client used by all
  pages, so that auth and base URL handling is not duplicated.

## Acceptance Criteria

- [ ] **AC-1:** `EventsPage` no longer imports `sample-data.json`;
  data is fetched from `GET /events` via the new query layer.
- [ ] **AC-2:** A typed `apiFetch` (or equivalent) wrapper exists,
  reads `VITE_API_BASE_URL` (default `http://localhost:8765`) and
  `VITE_API_TOKEN`, and sends `Authorization: Bearer <token>` on every
  request.
- [ ] **AC-3:** A documented `frontend/.env.example` lists
  `VITE_API_BASE_URL` and `VITE_API_TOKEN`.
- [ ] **AC-4:** `useEvents()` is implemented with TanStack Query
  (`@tanstack/react-query`) and exposes `{ data, isLoading, isError,
  error, refetch }` to the page.
- [ ] **AC-5:** A mapper converts the backend `EventOut` payload to the
  existing `EventCard` type without changing the `EventCard` shape; all
  fields the UI consumes are populated.
- [ ] **AC-6:** While `isLoading`, the page renders 8 skeleton cards
  matching the layout of the real cards.
- [ ] **AC-7:** On `isError`, the page renders a recoverable error
  state with the error message and a "Retry" button that calls
  `refetch()`.
- [ ] **AC-8:** When the API returns an empty list, the existing
  empty-state in `<Dashboard>` is shown unchanged.
- [ ] **AC-9:** A `QueryClientProvider` is mounted at the app root
  (in `App.tsx`).
- [ ] **AC-10:** `npm run lint` and `npm run build` pass with no new
  warnings.
- [ ] **AC-11:** The query refetches automatically when the window
  regains focus (TanStack Query default), so manual refresh is
  unnecessary after switching tabs.

## Edge Cases

- **EC-1:** API base URL is unreachable (network error) → error state
  with "Could not reach the API" message and Retry.
- **EC-2:** API returns `401` (missing / wrong token) → error state
  with "Not authorized — check `VITE_API_TOKEN`" and Retry.
- **EC-3:** API returns `5xx` → generic error state with the response
  body's `detail` if present.
- **EC-4:** Backend returns a payload with extra unknown fields → the
  client tolerates them (no schema-strict validation crash).
- **EC-5:** Backend returns `last_activity_at` in a non-ISO format →
  the mapper falls back to `event.updated_at`; never throws on a single
  bad row.
- **EC-6:** `active_job` is `null` for an event → card renders without
  the active-job row, no console warnings.
- **EC-7:** API responds slowly (>2s) → skeleton remains visible; no
  layout shift when real data arrives.
- **EC-8:** User has zero events → empty-state CTA opens the New Event
  modal (existing behavior).

## Open Questions

- **Q1:** Should the bearer token be entered through the Settings page
  and persisted, or stay as a Vite build-time env var? Current
  decision: **build-time env var** for now; Settings-driven token can
  be a separate spec.

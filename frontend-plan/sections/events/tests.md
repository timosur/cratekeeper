# Events — UI Behavior Tests

Framework-agnostic test specs. Translate to your runner of choice (Vitest + Testing Library, Playwright, Cypress, etc).

## User flow tests

### Open an event (success path)

**Setup:** render `<Dashboard events={[evt]} onOpenEvent={fn} />` where `evt = mockEvent({ id: "evt-001", name: "Sarah & Mike's Wedding" })`.

**Steps:**
1. Find the card containing the text "Sarah & Mike's Wedding".
2. Click the card.

**Expected:**
- `onOpenEvent` was called exactly once.
- It was called with `"evt-001"`.

### Resume a failed job — inline action does NOT navigate

**Setup:** render `<Dashboard events={[failedEvt]} onOpenEvent={openFn} onResumeJob={resumeFn} />` where the event has `activeJob: { status: "failed", id: "job-9" }`.

**Steps:**
1. Click the inline `Resume` button on the failed card.

**Expected:**
- `onResumeJob` was called once with `("evt-001", "job-9")`.
- `onOpenEvent` was NOT called.

### Create a new event

**Setup:** render `<Dashboard events={[evt]} onCreateEvent={fn} />`.

**Steps:**
1. Find the `+ New Event` button in the page header.
2. Click it.

**Expected:** `onCreateEvent` was called once.

### Empty state

**Setup:** render `<Dashboard events={[]} onCreateEvent={fn} />`.

**Expected:**
- A centered card with explainer text is visible.
- Exactly one sky `+ Create your first event` CTA is shown.
- No event cards are rendered.

**Steps:**
1. Click the `+ Create your first event` button.

**Expected:** `onCreateEvent` was called once.

## Component interaction tests

### Renders correctly

- Given a list of 6 events, exactly 6 cards render.
- Each card shows: name, event date, slug (mono), playlist URL chip, current step badge, segmented progress bar, `total / matched / tagged` counts, status pills, and last-activity timestamp.

### Status pill colors

- A card whose `activeJob.status === "running"` shows a sky badge.
- A card whose `activeJob.status === "failed"` shows a red badge.
- A card whose `activeJob.status === "queued"` shows a neutral badge.
- A card with `isStale: true` shows an amber stale-build pill.

## Edge cases

- **Long event name** truncates with an ellipsis; the full name is available via `title` attribute.
- **Many events (100+)** renders without layout shifts and scrolls smoothly.
- **Transition empty → populated**: render with `events=[]`, then re-render with one event; the empty state is replaced by the card grid.
- **`activeJob: null`** renders no job badge but the rest of the card still shows the static fields.
- **`currentStepIndex === totalSteps`** (event complete) shows a complete pill (emerald) and no inline Resume action.

## Accessibility checks

- The entire card has an accessible name (e.g. `aria-label` containing the event name).
- The `Resume` button is keyboard-focusable and announces its label.
- Tab order: page header `+ New Event` → first card → first card's `Resume` (if present) → next card → ….
- Hitting Enter on a focused card triggers `onOpenEvent`.

## Sample test data

```ts
import type { EventCard } from "./types";

export const mockEvent = (over: Partial<EventCard> = {}): EventCard => ({
  id: "evt-001",
  name: "Sarah & Mike's Wedding",
  slug: "sarah-and-mike-2026-05",
  eventDate: "2026-05-15",
  playlistUrl: "https://open.spotify.com/playlist/example",
  currentStepIndex: 6,
  currentStepLabel: "Analyze Mood",
  totalSteps: 11,
  trackCounts: { total: 124, matched: 118, tagged: 0 },
  activeJob: null,
  isStale: false,
  lastActivityAt: "2026-04-26T10:30:00Z",
  ...over,
});

export const failedEvent: EventCard = mockEvent({
  id: "evt-002",
  name: "Friday Cocktail Hour",
  activeJob: {
    id: "job-9",
    status: "failed",
    label: "analyze-mood",
    progress: 0.38,
    errorMessage: "ffprobe missing on PATH",
  },
});

export const emptyEvents: EventCard[] = [];
```

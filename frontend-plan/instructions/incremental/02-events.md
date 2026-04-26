# Milestone 02 — Events (Dashboard)

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Mount the Events dashboard at `/` — the operator's home, a card grid of every active event with current pipeline step, track counts, and active-job status. This is the primary entry point and the only way to reach **Event Detail**.

## What users can do

- See every active event at a glance with current step (out of 11), track counts, and active-job badge.
- Spot events that need attention: failed job, stale build, build pending.
- Click anywhere on an event card to navigate to that event's detail screen.
- Click `+ New Event` to create a new event (modal collects name, date, Spotify playlist URL).
- Click the inline `Resume` action on a card whose job has failed/paused, without leaving the page.
- See a centered empty state with a "Create your first event" CTA when no events exist.

## Components provided

| Component   | Path                                           | Description                            |
| ----------- | ---------------------------------------------- | -------------------------------------- |
| `Dashboard` | [sections/events/components/Dashboard.tsx](../../sections/events/components/Dashboard.tsx) | The card grid + page header + empty state |

## Props reference

`DashboardProps` (full definition in [sections/events/types.ts](../../sections/events/types.ts)):

### Data props

| Prop      | Type           | Description                          |
| --------- | -------------- | ------------------------------------ |
| `events`  | `EventCard[]`  | All active events to render          |

### Callback props

| Callback        | Signature                                   | When fired                                                   |
| --------------- | ------------------------------------------- | ------------------------------------------------------------ |
| `onCreateEvent` | `() => void`                                | User clicked `+ New Event` in the page header                |
| `onOpenEvent`   | `(eventId: string) => void`                 | User clicked anywhere on an event card → navigate to detail  |
| `onResumeJob`   | `(eventId, jobId) => void`                  | User clicked the inline `Resume` action on a failed job      |

## Expected user flows

### Flow 1: Open an event
1. User views the dashboard at `/`.
2. User clicks anywhere on an event card.
3. Expected: `onOpenEvent(eventId)` fires; your router navigates to `/events/$id` (or wherever you mount Event Detail).

### Flow 2: Create a new event
1. User clicks `+ New Event` in the page header.
2. Expected: `onCreateEvent()` fires; you open a modal that captures name, date, Spotify playlist URL.
3. On submit, you create the event and navigate to its detail page.

### Flow 3: Resume a failed/paused job
1. User sees a card with a failed-job badge and an inline `Resume` action.
2. User clicks `Resume` (clicks should NOT bubble up to the card click target).
3. Expected: `onResumeJob(eventId, jobId)` fires; your worker resumes the job from its last checkpoint.

### Flow 4: Empty state
1. User loads the dashboard with zero events.
2. Expected: a centered empty-state card with a one-line explainer and a single sky `+ Create your first event` CTA.
3. Clicking the CTA fires `onCreateEvent()`.

## Empty state handling

When `events.length === 0`, the component renders the centered empty state automatically — you do not need to short-circuit.

## Data shape

Pass an array of `EventCard` objects. The shape includes:
- Identity: `id`, `name`, `slug`, `eventDate`, `playlistUrl`
- Pipeline state: `currentStepIndex`, `currentStepLabel`, `totalSteps` (typically 11)
- Track counts: `total`, `matched`, `tagged`
- Activity: `activeJob` (running / queued / failed / null), `isStale`, `lastActivityAt`

See [sections/events/sample-data.json](../../sections/events/sample-data.json) for realistic shapes.

## Testing

UI behavior tests are in [sections/events/tests.md](../../sections/events/tests.md).

## Files to reference

- [sections/events/components/Dashboard.tsx](../../sections/events/components/Dashboard.tsx)
- [sections/events/types.ts](../../sections/events/types.ts)
- [sections/events/sample-data.json](../../sections/events/sample-data.json)
- [sections/events/README.md](../../sections/events/README.md)
- [sections/events/tests.md](../../sections/events/tests.md)

## Done when

- [ ] Route `/` renders `<Dashboard events={...} />`.
- [ ] Card click navigates to Event Detail; the inline `Resume` action does NOT trigger navigation.
- [ ] `+ New Event` modal collects name + date + Spotify URL and creates an event.
- [ ] Failed-job and stale-build pills render with the right colors (red, amber).
- [ ] Empty state appears when there are no events.
- [ ] Loading and error states are handled (skeleton or spinner; user-facing error message on fetch failure).
- [ ] Layout is responsive (1 / 2 / 3 columns) at 640 / 1024 / 1280px breakpoints.
- [ ] Dark mode renders correctly.

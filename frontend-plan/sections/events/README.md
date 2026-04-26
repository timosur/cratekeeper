# Events — Section Overview

## Purpose
The operator's home screen. A card grid of every active event with each event's current pipeline step, track counts, and active-job badge. Optimized for the question "what needs my attention?".

## User flows
1. **Land and survey** — User opens `/`; sees every active event as a card; identifies any that need action (failed job, stale build, build pending) at a glance.
2. **Open an event** — User clicks anywhere on a card → navigates to that event's Event Detail.
3. **Create a new event** — User clicks `+ New Event`; a modal collects name, date, and Spotify playlist URL; on submit, a new card appears and the user lands on the new event's Event Detail.
4. **Resume a failed job** — User sees a card with a failed-job badge and clicks the inline `Resume` action — without leaving the page.
5. **First-time empty state** — When zero events exist, a centered card explains the product in one sentence and offers a single sky `+ Create your first event` CTA.

## Design decisions
- **Sky for the primary CTA only.** `+ New Event` is the single sky call-to-action on the page.
- **Card click target is the entire card.** The inline `Resume` action stops propagation so it never triggers navigation.
- **Card height is uniform.** Every card stacks the same blocks in the same order regardless of state, so the eye can scan a row without re-anchoring.
- **Status colors are semantic.** Sky = running, neutral = queued, red = failed, amber = stale build.
- **Mono for identifiers and counts.** Slugs, playlist URLs, and the `total / matched / tagged` row all render in JetBrains Mono.

## Data shapes

The component expects `events: EventCard[]`. Each card carries:

| Field                | Type                     | Notes                                              |
| -------------------- | ------------------------ | -------------------------------------------------- |
| `id`                 | `string`                 | Stable id; passed back via `onOpenEvent`           |
| `name`               | `string`                 | Display name                                       |
| `slug`               | `string`                 | URL-safe; also the on-disk folder name (mono)      |
| `eventDate`          | `string` (ISO YYYY-MM-DD)|                                                    |
| `playlistUrl`        | `string`                 | Source Spotify playlist URL                        |
| `currentStepIndex`   | `number`                 | 0-indexed                                          |
| `currentStepLabel`   | `string`                 | "Analyze Mood", "Build Library", etc               |
| `totalSteps`         | `number`                 | Typically 11                                       |
| `trackCounts`        | `TrackCounts`            | `{ total, matched, tagged }`                       |
| `activeJob`          | `ActiveJob \| null`      | Current running / queued / recently failed job     |
| `isStale`            | `boolean`                | True when downstream builds need a rebuild         |
| `lastActivityAt`     | `string` (ISO timestamp) | Last state-changing action                         |

Full TypeScript in [types.ts](types.ts).

## Components

| Component   | Description                                           |
| ----------- | ----------------------------------------------------- |
| `Dashboard` | Page header + responsive card grid + empty state     |

## Callback props

| Callback        | Signature                       | When fired                                     |
| --------------- | ------------------------------- | ---------------------------------------------- |
| `onCreateEvent` | `() => void`                    | Click `+ New Event`                            |
| `onOpenEvent`   | `(eventId: string) => void`     | Click anywhere on an event card                |
| `onResumeJob`   | `(eventId, jobId) => void`      | Click inline `Resume` on a failed/paused card  |

## Visual reference

(No screenshot in this export — render the component locally with `sample-data.json` to inspect.)

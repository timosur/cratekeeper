# Audit Log — Section Overview

## Purpose
A read-only, append-only timeline of every state-changing action across the entire system. Used to investigate "what happened to this event?", to verify that destructive operations (overrides, removes, undos) were intentional, and to prove the system did what it said.

## User flows
1. **Live tail** — User opens `/audit`; latest entries stream in via SSE; new rows fade in at the top with a sky pulse.
2. **Filter by event** — User picks an event from the dropdown; list re-renders showing only entries for that event.
3. **Filter by step / action / actor / date range** — Same pattern; multiple filters compose (AND).
4. **Inspect an entry's diff** — User clicks a row → it expands inline to show before / after JSON diff (mono, with sky ↦ red color coding for added/removed lines).
5. **Deep-link from Event Detail** — User clicks "View all activity" in Event Detail → arrives at `/audit?eventId=evt-001` pre-filtered.
6. **Pause live tail** — User clicks `Pause` → list stops auto-scrolling; an indicator shows "Live tail paused — N new entries". Click `Resume` to catch up.

## Design decisions
- **Append-only.** No delete, no edit, no archive. The log is a system-of-record.
- **Virtualized list.** Tens of thousands of rows must scroll smoothly.
- **Mono for everything technical.** Job ids, step ids, ISRCs, file paths, JSON diffs.
- **Color-code action verbs.** sky = run/create, amber = override/skip, red = cancel/remove/undo, neutral = read/inspect.
- **Stable timestamps.** Always shown in ISO 8601 with timezone (mono, tabular-nums) so two entries from the same second sort deterministically.

## Components

| Component  | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| `AuditLog` | Filter bar + virtualized list + expand-row diff view + live-tail toggle |

## Callback props

| Callback              | Signature                                | When fired                              |
| --------------------- | ---------------------------------------- | --------------------------------------- |
| `onChangeFilters`     | `(filters: AuditFilters) => void`        | Any filter input changes (debounced)    |
| `onToggleLiveTail`    | `(enabled: boolean) => void`             | Pause / Resume clicked                  |
| `onExpandEntry`       | `(entryId: string) => void`              | Row clicked / Enter pressed             |
| `onCopyEntry`         | `(entryId: string) => void`              | `c` keyboard shortcut on focused row    |

## Data shapes

The component takes `entries: AuditEntry[]`, `filters: AuditFilters`, `liveTail: { enabled, queuedCount }`, and `filterOptions: { events, steps, actions, actors }`. See [types.ts](types.ts).

## Visual reference
(No screenshot in this export — render the component locally with `sample-data.json` to inspect.)

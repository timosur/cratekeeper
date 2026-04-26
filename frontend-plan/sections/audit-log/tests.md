# Audit Log — UI Behavior Tests

## User flow tests

### Filter by event

**Setup:** render `<AuditLog entries={[entryA, entryB]} filters={{}} onChangeFilters={fn} />`.

**Steps:** open the event dropdown, select event `evt-001`.

**Expected:** `onChangeFilters` was called once with `{ eventId: "evt-001" }`.

### Combine filters

**Setup:** render with `filters: { eventId: "evt-001" }`.

**Steps:**
1. Open the action dropdown, select `override-quality-gate`.
2. Open the actor dropdown, select `operator`.

**Expected:** `onChangeFilters` was called twice; the final call payload is `{ eventId: "evt-001", action: "override-quality-gate", actor: "operator" }`.

### Expand a row diff

**Setup:** render with one entry.

**Steps:** click the row.

**Expected:**
- `onExpandEntry` was called once with the entry id.
- The row expands inline; before/after JSON diff renders (mono).
- Sky highlight on added lines, red highlight on removed lines.

### Pause live tail

**Setup:** render with `liveTail: { enabled: true, queuedCount: 0 }`.

**Steps:** click `Pause`.

**Expected:**
- `onToggleLiveTail` was called once with `false`.
- Indicator updates to "Live tail paused".

### Live tail catches up on resume

**Setup:** render with `liveTail: { enabled: false, queuedCount: 12 }`.

**Expected:** indicator reads "Live tail paused — 12 new entries".

**Steps:** click `Resume`.

**Expected:** `onToggleLiveTail` was called once with `true`.

### Deep-link pre-filter

**Setup:** render with `filters: { eventId: "evt-001" }`.

**Expected:** the event dropdown shows `evt-001` selected on initial render.

## Component interaction tests

- Each entry row shows: timestamp (mono, tabular-nums, ISO with TZ), actor, action verb (color-coded), step id (mono), event name, and a one-line summary.
- Action verbs: `run` and `create` render sky; `override` and `skip` render amber; `cancel`, `remove`, `undo` render red; `read` and `inspect` render neutral.
- New SSE entries fade in at the top with a sky pulse when live tail is enabled.
- Expanded rows show before / after diff with a `Copy diff` button.

## Edge cases

- **No entries match filters:** "No entries match your filters" with a `Clear filters` link.
- **Tens of thousands of entries** scrolls smoothly (virtualized).
- **Duplicate-second timestamps** sort by entry id descending (stable order).
- **Very long JSON diff** is collapsible per side; the row's expand-state is preserved while scrolling.

## Accessibility checks

- The list is `role="list"`. Each entry is `role="listitem"` and focusable.
- Keyboard: ↑ / ↓ moves focus, `Enter` expands, `c` copies the entry.
- Live region (`aria-live="polite"`) announces new entry counts when live tail is enabled.
- Filter bar is a `<form role="search">`.
- Expanded diff section has `aria-expanded="true"` on the row.

## Sample test data

```ts
import type { AuditEntry } from "./types";

export const mockEntry = (over: Partial<AuditEntry> = {}): AuditEntry => ({
  id: "audit-001",
  timestamp: "2026-04-26T10:30:00.124Z",
  actor: "operator",
  action: "run-step",
  stepId: "match",
  eventId: "evt-001",
  eventName: "Sarah & Mike's Wedding",
  jobId: "job-9",
  summary: "Started match step against Master Library + NAS",
  diff: null,
  ...over,
});

export const overrideEntry = mockEntry({
  id: "audit-002",
  action: "override-quality-gate",
  summary: "Quality gate overridden with phrase",
  diff: {
    before: { gate: "blocked", reasons: ["3 missed tracks"] },
    after: { gate: "overridden", phrase: "i-understand-the-risks" },
  },
});
```

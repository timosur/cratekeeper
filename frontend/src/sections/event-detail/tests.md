# Event Detail — UI Behavior Tests

Framework-agnostic test specs.

## User flow tests

### Select a step from the rail

**Setup:** render `<EventDetail event={mockEventDetail()} details={mockDetails()} onSelectStep={fn} />`.

**Steps:** click the rail item labeled "Analyze Mood".

**Expected:**
- `onSelectStep` was called once with `"analyze-mood"`.
- The right-hand panel header now reads "Analyze Mood".

### Run a step

**Setup:** render with `selectedStepId === "match"` and the step's `actionState === "ready"`.

**Steps:** click `Run` on the step panel.

**Expected:** `onRunStep` was called once with `("match", { dryRun: false })`.

### Quality-gate override required

**Setup:** render with the quality banner present (`event.qualityBanner = { variant: "critical", reasons: [...] }`) on the Apply Tags step.

**Steps:**
1. Click `Apply Tags`.

**Expected:** primary button is disabled and a tooltip explains "Resolve quality gate or type override phrase".

**Steps:**
1. Click "Override gate".
2. In the modal, type the displayed override phrase exactly.
3. Click confirm.

**Expected:** `onOverrideQualityGate` was called once with the phrase; the apply button becomes enabled.

### Bulk re-bucket on Review

**Setup:** render the Review step with 8 low-confidence rows; select 5 via row checkboxes.

**Steps:** open the bulk-action menu and choose "Re-bucket → cocktail".

**Expected:** `onBulkRebucket` was called once with `(["t-1","t-2","t-3","t-4","t-5"], "cocktail")`.

### Copy a single Tidal URL

**Setup:** render the Match panel with the Misses tab active and one missed track.

**Steps:** click the row's `Copy Tidal URL` button.

**Expected:** `onCopyTidalUrl` was called once with the track's `tidalUrl`; an inline confirmation reads "Copied".

### Promote-to-library star

**Setup:** render a matched track row whose `localFileExists === true` and `promoted === false`.

**Steps:** click the star.

**Expected:** `onPromoteToLibrary` was called once with the track's id.

**Variant:** if `localFileExists === false`, the star is rendered as `disabled` with a tooltip "File not found on disk". Clicking it does NOT call `onPromoteToLibrary`.

## Component interaction tests

- The 11-step rail renders all steps grouped under the 6 phase labels in correct order.
- The currently-selected step row shows a sky left border accent and `bg-sky-50 dark:bg-sky-950/40`.
- Steps before the selected one have an emerald check icon when complete; future steps render a neutral dot.
- Live job tray appears fixed at the bottom whenever `event.activeJob` is non-null and disappears when null.
- Recent activity rows are clickable and call `onViewAllActivity`.

## Edge cases

- `event.activeJob === null` and no banners → tray and banner area are hidden, body fills space.
- Multiple banners stack in a fixed order: quality gate → stale build → missing masterpieces.
- A step in `actionState: "blocked"` shows a tooltip explaining why and disables its primary action.
- Master Library hits and NAS hits with the same ISRC: only the Library hit is shown; source pill is sky.

## Accessibility checks

- Step rail is a `nav` with `aria-label="Pipeline steps"`. Each step is a button with an accessible name "Step N: <label>".
- Every banner has `role="alert"` and an accessible dismiss button when dismissible.
- Override-phrase modal traps focus and returns focus to the triggering button on close.
- Live job tray's progress is announced via `aria-live="polite"`.

## Sample test data

```ts
import type { EventDetail, EventDetailDetails } from "./types";

export const mockEventDetail = (): EventDetail => ({
  id: "evt-001",
  name: "Sarah & Mike's Wedding",
  slug: "sarah-and-mike-2026-05",
  eventDate: "2026-05-15",
  playlistUrl: "https://open.spotify.com/playlist/example",
  selectedStepId: "match",
  qualityBanner: null,
  staleBanner: null,
  missingMasterpiecesBanner: null,
  steps: [/* 11 step entries */],
  activeJob: null,
  recentActivity: [],
});

export const mockDetails = (): EventDetailDetails => ({
  fetch: { /* ... */ },
  enrich: { /* ... */ },
  classify: { /* ... */ },
  review: { /* ... */ },
  scan: { /* ... */ },
  match: { hits: [], misses: [], summary: { total: 0, matched: 0, missed: 0 } },
  analyzeMood: { /* ... */ },
  classifyTags: { /* ... */ },
  applyTags: { /* ... */ },
  buildEvent: { /* ... */ },
  buildLibrary: { /* ... */ },
});
```

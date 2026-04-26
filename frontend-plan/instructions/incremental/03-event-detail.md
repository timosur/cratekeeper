# Milestone 03 — Event Detail

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

Mount the **Event Detail** working surface at `/events/$id`. This is the operator's main workbench — a master/detail layout with all 11 pipeline steps in a left rail and a focused right panel that swaps per step.

This is the most complex section in the product. Plan time accordingly.

## What users can do

- View an event's identity, top-level health (track counts, quality gate, stale builds, missing masterpieces), and the 11 pipeline steps.
- Click any step in the rail to inspect its panel; the active step is auto-selected on load.
- Run / Pause / Cancel / Resume jobs per step with live progress + SSE log.
- On Review, filter low-confidence tracks and bulk re-bucket selected rows.
- On Match, see a Matched tab (with library/NAS source pills, promote-to-library star, broken-masterpiece warnings) and a Misses tab (with copyable Tidal listen / purchase URLs).
- On Classify Tags, request a pre-flight cost estimate before dispatching to Anthropic.
- On Apply Tags / Build Event / Build Library, run a Dry-run first, then the real action.
- Override a quality-gate failure with a typed confirmation phrase that is logged.
- Undo a destructive Apply Tags run from per-file backups.

## Components provided

| Component     | Path                                                      | Description                              |
| ------------- | --------------------------------------------------------- | ---------------------------------------- |
| `EventDetail` | [sections/event-detail/components/EventDetail.tsx](../../sections/event-detail/components/EventDetail.tsx) | The full master/detail working surface   |

## The 11 pipeline steps

Steps are grouped into 6 phases:

| # | Step           | Phase     |
| - | -------------- | --------- |
| 1 | fetch          | Intake    |
| 2 | enrich         | Intake    |
| 3 | classify       | Classify  |
| 4 | review         | Classify  |
| 5 | scan           | Library   |
| 6 | match          | Library   |
| 7 | analyze-mood   | Analysis  |
| 8 | classify-tags  | Analysis  |
| 9 | apply-tags     | Tagging   |
| 10| build-event    | Build     |
| 11| build-library  | Build     |

`apply-tags`, `build-event`, `build-library`, and the optional `undo-tags` action are **destructive** — they all gate on the quality-gate state.

## Props reference

`EventDetailProps` (full definition in [sections/event-detail/types.ts](../../sections/event-detail/types.ts)):

### Data props

| Prop      | Type                  | Description                                                     |
| --------- | --------------------- | --------------------------------------------------------------- |
| `event`   | `EventDetail`         | Top-level event state + the 11-step rail + recent activity      |
| `details` | `EventDetailDetails`  | Per-step datasets (classify chart, review table, match results, mood rows, tag cost estimate, log lines, quality checks) |

### Callback props (selected)

| Callback                       | When fired                                                      |
| ------------------------------ | --------------------------------------------------------------- |
| `onSelectStep(stepId)`         | User clicked a step in the left rail                            |
| `onRunStep(stepId)`            | User clicked the primary action on the focused step             |
| `onPauseJob(jobId)`            | User clicked Pause in the live job tray                         |
| `onCancelJob(jobId)`           | User clicked Cancel in the live job tray                        |
| `onResumeJob(stepId)`          | User clicked Resume on a failed/cancelled step                  |
| `onDryRunStep(stepId)`         | User clicked Dry-run on apply / build-event / build-library     |
| `onOpenQualityChecks()`        | User clicked `Review checks` in the gate banner                 |
| `onOverrideQualityGate(reason)`| User submitted a typed override of the gate                     |
| `onBulkRebucket(ids, bucket)`  | User bulk re-bucketed selected review tracks                    |
| `onEstimateTagCost()`          | User asked for a fresh Anthropic cost estimate                  |
| `onDispatchTagClassification()`| User dispatched the LLM tag classification job                  |
| `onUndoTags()`                 | User clicked Undo on Apply Tags                                 |
| `onCopyTidalUrl(url)`          | User copied a Tidal listen / purchase URL                       |
| `onOpenLocalFile(filePath)`    | User revealed a matched track's file in the OS file manager     |
| `onOpenSpotify(url)`           | User opened a track on Spotify                                  |
| `onOpenTidal(url)`             | User opened a track on Tidal                                    |
| `onPromoteToLibrary(id, next)` | User toggled the promote-to-library star on a matched track     |
| `onExportMissesTidalUrls(urls)`| User bulk-exported all misses' Tidal URLs to clipboard          |
| `onViewAllActivity()`          | User clicked "View all in Audit Log" in the recent activity footer |

The full list lives in [sections/event-detail/types.ts](../../sections/event-detail/types.ts).

## Expected user flows

### Flow 1: Resume from a failed step
1. User opens an event whose step 7 (analyze-mood) failed at track 47/124.
2. `event.activeStepId = "analyze-mood"`; the rail row shows a red exclamation.
3. User clicks `Resume`.
4. Expected: `onResumeJob("analyze-mood")` fires; your worker resumes from track 47.

### Flow 2: Run the LLM tag job after pre-flight estimate
1. User selects step 8 (classify-tags). Status: idle.
2. User clicks `Run estimate`. Expected: `onEstimateTagCost()` fires; the panel shows estimated tokens + USD.
3. User clicks `Dispatch`. Expected: `onDispatchTagClassification()` fires; the live job tray appears with token-usage tile.

### Flow 3: Override a quality-gate failure
1. User opens an event with `event.qualityGate.status === "fail"`.
2. A red banner reads "N quality checks failing — destructive Build steps blocked".
3. User clicks `Review checks` → `onOpenQualityChecks()` opens a side sheet.
4. User reads the failures, types the typed-confirmation phrase, submits.
5. Expected: `onOverrideQualityGate(reason)` fires; banner disappears; the override is sent to your audit log.

### Flow 4: Promote a matched track to the Master Library
1. User is on the Match panel's Matched tab.
2. User clicks the outline star next to a matched row (with `canPromote: true` and `libraryFilePresence: "n/a"`).
3. Expected: `onPromoteToLibrary(trackId, true)` fires; star renders filled gold; row shows the `library` source pill on next render.

### Flow 5: Export all Tidal misses for purchase
1. User is on the Match panel's Misses tab with N missing tracks.
2. User clicks `Export Tidal URLs`.
3. Expected: `onExportMissesTidalUrls(urls)` fires; URLs are written to clipboard.

## Empty / edge states

- When an event has zero matches, the Match panel shows a neutral empty state.
- When `event.missingMasterpieces.count > 0`, render the red "Missing Masterpieces" banner above the rail.
- When `event.staleBuilds.length > 0`, render the amber stale-build banner with `Rebuild` actions.

## Testing

UI behavior tests are in [sections/event-detail/tests.md](../../sections/event-detail/tests.md).

## Files to reference

- [sections/event-detail/components/EventDetail.tsx](../../sections/event-detail/components/EventDetail.tsx)
- [sections/event-detail/types.ts](../../sections/event-detail/types.ts)
- [sections/event-detail/sample-data.json](../../sections/event-detail/sample-data.json)
- [sections/event-detail/README.md](../../sections/event-detail/README.md)
- [sections/event-detail/tests.md](../../sections/event-detail/tests.md)

## Done when

- [ ] Route `/events/$id` renders `<EventDetail event={...} details={...} />`.
- [ ] Left rail lists 11 steps in 6 phases; the active step is highlighted.
- [ ] Status colors match: sky (running), emerald (succeeded), amber (stale), red (failed).
- [ ] Live job tray shows progress, processed/total units, elapsed time, and a streaming log.
- [ ] All destructive actions (`Apply Tags`, `Build Event`, `Build Library`, `Undo Tags`) gate on the quality state OR an active override.
- [ ] Override modal requires a typed phrase before submitting.
- [ ] Match panel shows source pills (`library` / `NAS`); promote-stars toggle correctly; broken-masterpiece warning glyph appears for `libraryFilePresence === "missing"`.
- [ ] Misses tab exposes per-row Tidal URL copy + bulk export.
- [ ] Recent-activity footer shows the last 5 audit entries with a deep-link to the Audit Log.
- [ ] Dark mode and 1280px+ layout match the spec.

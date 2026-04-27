# Event Detail — Section Overview

## Purpose
The core working surface of Cratekeeper. A two-pane master/detail layout where the operator moves a wedding playlist from "fetched" to a fully tagged event folder on disk.

## User flows
1. **Inspect any step** — Active step is auto-selected on load; clicking a step in the rail swaps the right panel.
2. **Run / pause / cancel / resume** a job from the focused step's panel; live progress, per-unit metrics, and SSE log appear in a fixed bottom tray.
3. **Bulk re-bucket** low-confidence tracks on the Review step.
4. **Copy or bulk-export Tidal listen / purchase URLs** for missed tracks on the Match panel.
5. **Pre-flight cost estimate** before dispatching the LLM tag classification job.
6. **Dry-run before destructive runs** (Apply Tags, Build Event, Build Library).
7. **Override a quality-gate failure** with a typed confirmation phrase that's logged.
8. **Undo a tag-write run** to restore audio files from per-file backups.
9. **Promote a matched track** to the curated Master Library by clicking its star.
10. **Repair a broken masterpiece** when a previously-promoted file has gone missing.

## Design decisions
- **11 steps in 6 phases.** Intake (Fetch, Enrich) → Classify (Classify, Review) → Library (Scan, Match) → Analysis (Analyze Mood, Classify Tags) → Tagging (Apply Tags) → Build (Build Event, Build Library).
- **Destructive actions all gate.** `Apply Tags`, `Build Event`, `Build Library`, and `Undo Tags` require either a clean quality gate or an active typed override.
- **Three banner types** stack at the top (resolved-only-dismissible): quality gate (red), stale build (amber), missing masterpieces (red).
- **Match Source pill is sky for `library`, neutral for `nas`.** When the same ISRC exists in both pools, Master Library always wins.
- **Promote-star is gated on file presence.** No file on disk → star is disabled with a tooltip; broken-link mini icon appears overlaid when a previously-promoted file has gone missing.

## Components

| Component     | Description                                       |
| ------------- | ------------------------------------------------- |
| `EventDetail` | Full master/detail surface (header, banners, rail, panel, recent activity) |

## Callback props

See [types.ts](types.ts) for the full set. Highlights:

| Callback                          | When fired                                          |
| --------------------------------- | --------------------------------------------------- |
| `onSelectStep(stepId)`            | Step clicked in left rail                           |
| `onRunStep / onResumeJob`         | Primary action on a step                            |
| `onPauseJob / onCancelJob`        | Live job tray                                       |
| `onDryRunStep / onUndoTags`       | Apply / Build / Undo dry-run + revert flows         |
| `onOpenQualityChecks / onOverrideQualityGate` | Gate-failure flow                       |
| `onBulkRebucket`                  | Review-step bulk action                             |
| `onEstimateTagCost / onDispatchTagClassification` | Classify-tags two-step flow         |
| `onCopyTidalUrl / onExportMissesTidalUrls` | Misses tab                                |
| `onPromoteToLibrary`              | Star toggle on a matched row                        |
| `onOpenLocalFile / onOpenSpotify / onOpenTidal` | Per-row external actions              |
| `onViewAllActivity`               | Deep-link to filtered Audit Log                     |

## Data shapes

The component takes two props: `event: EventDetail` (top-level state + 11 steps + recent activity) and `details: EventDetailDetails` (per-step datasets). See [types.ts](types.ts).

## Visual reference
(No screenshot in this export — render the component locally with `sample-data.json` to inspect.)

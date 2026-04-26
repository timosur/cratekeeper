# Cratekeeper — One-Shot Implementation Instructions

This document combines all milestones into a single guide for implementing the entire UI in one session. For an incremental, milestone-by-milestone approach, see [instructions/incremental/](incremental/).

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


# Milestone 01 — Application Shell


## Goal

Stand up the **persistent left-sidebar shell** that frames every Cratekeeper view, and wire in the design tokens (colors + typography) the rest of the app depends on.

This milestone produces the chrome only — no section content. After it's done, every subsequent milestone drops its components into the shell's right-column work surface.

## Scope

1. Set up design tokens — Tailwind v4 palette + Google Fonts.
2. Mount the `AppShell` component as the layout wrapper for every route.
3. Wire navigation, the user menu, theme toggle, and the system-status block.

## 1. Design tokens

### Tailwind CSS v4

This project uses **Tailwind v4**. There is **no `tailwind.config.js`** — never reference or create one.

Use Tailwind's built-in palette only. The roles are:

| Role          | Scale     |
| ------------- | --------- |
| **Primary**   | `sky`     |
| **Secondary** | `emerald` |
| **Neutral**   | `neutral` |
| Warning       | `amber`   |
| Danger        | `red`     |

See [../../design-system/tailwind-colors.md](../../design-system/tailwind-colors.md) for the full usage guide.

### Google Fonts

Add to `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
>
```

Body uses **Inter**; identifiers, counts, paths, and timestamps use **JetBrains Mono** with `tabular-nums`. See [../../design-system/fonts.md](../../design-system/fonts.md).

### CSS custom properties (optional)

[../../design-system/tokens.css](../../design-system/tokens.css) provides CSS custom properties for surfaces, density, and dark-mode variables. Importing it into your global stylesheet is optional but recommended.

## 2. Mount the shell

Copy `shell/components/AppShell.tsx` into your codebase (suggested path: `src/shell/`). Wrap your route tree:

```tsx
import { AppShell, type NavigationItem } from "./shell/AppShell";

const navigationItems: NavigationItem[] = [
  { label: "Events",         href: "/",        icon: "event",    isActive: pathname === "/" },
  { label: "Master Library", href: "/library", icon: "library",  isActive: pathname === "/library" },
  { label: "Settings",       href: "/settings",icon: "settings", isActive: pathname === "/settings" },
  { label: "Audit Log",      href: "/audit",   icon: "audit",    isActive: pathname === "/audit" },
];

<AppShell
  navigationItems={navigationItems}
  jobActivity={{ running, queued }}
  connection={{ api, sse }}
  user={{ name, email }}
  version="v1.0.0"
  theme={theme}
  topBarTitle={routeTitle}
  onNavigate={(href) => router.push(href)}
  onNewEvent={() => openNewEventModal()}
  onJobsClick={() => router.push("/jobs")}
  onOpenDataFolder={() => api.openDataFolder()}
  onToggleTheme={toggleTheme}
  onLogout={logout}
>
  {children}
</AppShell>
```

> **Event Detail is not in `navigationItems`.** It's reached by clicking an event card on the dashboard; the shell's top bar will show the event name as the breadcrumb.

## 3. Behavior to wire

| Concern                     | What to do                                                                       |
| --------------------------- | -------------------------------------------------------------------------------- |
| Routing                     | Map each `navigationItems[].href` to a route; `onNavigate(href)` calls `router.push`. |
| Active state                | Set `isActive: true` on the item matching the current route.                     |
| Theme                       | Persist the chosen theme (`localStorage` key `theme`); toggle the `dark` class on `<html>`. |
| Job activity                | Subscribe to a job stream (SSE/WebSocket); pass running + queued counts.         |
| Connection health           | Reflect API + SSE health as `"connected" | "idle" | "disconnected"`.             |
| New Event                   | Open a modal that captures name + date + Spotify URL; on submit, navigate to the new event's detail. |
| Open data folder            | Wire to your local API; e.g. `POST /api/system/open-data-folder`.                |
| Logout                      | Clear session, navigate to login.                                                |

## 4. Responsive behavior

This is a **desktop-first operator tool** designed for ≥ 1280px viewports.

- ≥ 1280px: full sidebar, two-column layout.
- 1024–1279px: sidebar collapses to a 64px icon rail with hover tooltips. User menu becomes an avatar-only button.
- < 1024px: render a "Open on a wider screen" notice. Layout is unsupported by design.

## 5. Visual conventions

- **Sidebar width:** 240px on desktop.
- **Active item:** sky-tinted background (`bg-sky-50 dark:bg-sky-950/40`), 2px sky-600 left border accent, sky-700 text.
- **Top bar:** sticky, 56px tall, with a title slot, breadcrumb, and a slot for per-page actions.
- **Content padding:** `px-8 py-6`, no `max-width` — sections like the audit log benefit from the full viewport.
- **Borders:** 1px neutral borders separate every block (nav groups, top bar, sidebar's right edge).
- **Shadows:** flat surfaces; only the user-menu dropdown gets a subtle elevation shadow.

## Done when

- [ ] Inter and JetBrains Mono are loaded and applied.
- [ ] Tailwind v4 is configured; sky / emerald / neutral are used as documented.
- [ ] `AppShell` wraps every route; navigating between sections updates `isActive` and the top-bar title.
- [ ] `+ New Event` opens the create-event modal.
- [ ] User-menu dropdown toggles theme, opens data folder, logs out.
- [ ] System-status block reflects live job counts and connection health.
- [ ] Dark mode works across every surface.
- [ ] Responsive behavior matches the spec at 1024px and below.

## Files to reference

- [shell/components/AppShell.tsx](../../shell/components/AppShell.tsx) — the component
- [design-system/tailwind-colors.md](../../design-system/tailwind-colors.md) — color usage
- [design-system/fonts.md](../../design-system/fonts.md) — font usage
- [design-system/tokens.css](../../design-system/tokens.css) — optional CSS custom properties

---

# Milestone 02 — Events (Dashboard)


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

---

# Milestone 03 — Event Detail


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

---

# Milestone 04 — Master Library


## Goal

Mount the Master Library page at `/library` — the DJ's curated collection on the local OS disk, with library-wide stats (including on-disk integrity), a per-genre breakdown, and a filterable / paginated track table.

This is **not** an aggregate of every track ever processed. It's the curated keepers — promoted from events or added directly.

## What users can do

- See library overview: total masterpieces, storage, events served, and 4-axis health (tags / artwork / analysis / on-disk).
- See a missing-files banner when any masterpiece's file has gone missing.
- Browse a sortable per-genre table; clicking a row filters the track table below.
- Search tracks by title/artist; multi-select buckets, BPM range, Camelot key, format chips, and origin (Manual / Promoted).
- Reveal a track's file in Finder by clicking the row (disabled when file is missing).
- Add tracks 3 ways: file picker, drag-and-drop overlay, paste a Spotify URL.
- Bulk-promote tracks from a chosen event.
- Trigger a `verify-library` job that stat()s every masterpiece path.
- Remove a present file from the library (file on disk preserved) OR drop a missing entry (when there's nothing on disk to keep).

## Components provided

| Component       | Path                                                            | Description |
| --------------- | --------------------------------------------------------------- | ----------- |
| `MasterLibrary` | [sections/master-library/components/MasterLibrary.tsx](../../sections/master-library/components/MasterLibrary.tsx) | Overview strip + Genres card + Tracks card |

## Props reference

`MasterLibraryProps` (full definition in [sections/master-library/types.ts](../../sections/master-library/types.ts)):

### Data props

| Prop            | Type               | Description                                |
| --------------- | ------------------ | ------------------------------------------ |
| `overview`      | `LibraryOverview`  | Totals + 4-axis health + verify status     |
| `buckets`       | `BucketStat[]`     | Per-genre breakdown rows                   |
| `tracks`        | `LibraryTrack[]`   | A representative slice (component paginates) |
| `filterOptions` | `FilterOptions`    | Distinct values for filter chips           |

### Callback props

| Callback                 | When fired                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| `onSelectBucket(bucketId)` | User clicked a genre row to filter the track table                 |
| `onRevealInFinder(track)` | User clicked a non-missing track row                                |
| `onOpenSourceEvent(eventId)` | User clicked the source event link on a promoted track row       |
| `onAddTrack()`           | User clicked the primary `+ Add track` button                        |
| `onImportFromSpotify()`  | User clicked `Import from Spotify`                                   |
| `onDropAudioFiles(files)` | User dropped audio files onto the page                              |
| `onPromoteFromEvent()`   | User clicked `Promote from event`                                    |
| `onVerifyLibrary()`      | User clicked the `Verify library` button in the Overview strip       |
| `onRemoveFromLibrary(track)` | User confirmed removing a present-on-disk entry                  |
| `onDropMissingEntry(track)` | User confirmed dropping a missing entry                           |

## Expected user flows

### Flow 1: Browse and reveal a file
1. User loads `/library`.
2. User clicks a genre row in the Genres card.
3. Expected: `onSelectBucket(bucketId)` fires; the Tracks card filters to that bucket.
4. User clicks a track row whose `localFilePresence === "present"`.
5. Expected: `onRevealInFinder(track)` fires; your local API opens Finder at that path.

### Flow 2: Add a track via drag-and-drop
1. User drags audio files anywhere on the page.
2. Expected: a full-page sky-tinted overlay with dashed border appears.
3. User drops the files.
4. Expected: `onDropAudioFiles(files)` fires; you intake the files (classify, analyze, add).

### Flow 3: Verify library on demand
1. User clicks `Verify library` in the Overview strip.
2. Expected: `onVerifyLibrary()` fires; `overview.verifyStatus` becomes `"running"`; the button shows a sky spinner with progress text.
3. On completion, the Overview tile updates and any newly-missing files appear with a leading red dot.

### Flow 4: Drop a missing entry
1. User filters to `presence = missing` (or sees a row with a red leading dot).
2. User hovers the row → a red "Drop missing entry" icon appears (broken-link glyph).
3. User clicks it → confirmation modal explains there's nothing on disk to keep.
4. User confirms.
5. Expected: `onDropMissingEntry(track)` fires; the row disappears.

## Empty states

- **Library empty** (zero tracks): centered card with the three add-track CTAs.
- **Filters return zero**: row with "No tracks match the current filters" + Clear-filters link.
- **All missing resolved** (filtered to `missing` and zero remain): "No missing entries. Library is healthy."

## Testing

UI behavior tests are in [sections/master-library/tests.md](../../sections/master-library/tests.md).

## Files to reference

- [sections/master-library/components/MasterLibrary.tsx](../../sections/master-library/components/MasterLibrary.tsx)
- [sections/master-library/types.ts](../../sections/master-library/types.ts)
- [sections/master-library/sample-data.json](../../sections/master-library/sample-data.json)
- [sections/master-library/README.md](../../sections/master-library/README.md)
- [sections/master-library/tests.md](../../sections/master-library/tests.md)

## Done when

- [ ] Route `/library` renders `<MasterLibrary ... />`.
- [ ] Overview strip shows 4 stat tiles + 4-axis health bars; missing-files banner appears when `overview.health.onDisk.missingCount > 0`.
- [ ] Selecting a bucket row filters the Tracks card; row gets a 2px sky left accent.
- [ ] Track table columns sort; presence dot reflects `present` / `missing` / `unknown`.
- [ ] Click on a non-missing row reveals the file in Finder; click is disabled when missing.
- [ ] Drag-and-drop overlay accepts audio files and fires `onDropAudioFiles`.
- [ ] `Verify library` button reflects running state with progress text.
- [ ] Remove vs drop-missing flows are visually distinct and use different glyphs (trash vs broken-link).
- [ ] Pagination works (50 per page); footer shows mono `Page X of Y · N of total results`.
- [ ] Dark mode, ≥1280px desktop layout.

---

# Milestone 05 — Settings


## Goal

Mount Settings at `/settings` — the single place to configure all credentials, paths, and vocabularies that drive the pipeline. This screen exposes sensitive values, so it favors clarity and explicit confirmation over speed.

## Scope

Four categories, each in its own right-panel view, picked from a 200px left sub-nav:

1. **Integrations** — Spotify (wishlist source), Tidal (listening / URL export), Anthropic (API key + model + prompt caching).
2. **Filesystem roots** — Local music NAS, Master library output, Backup directory.
3. **Genre buckets** — Editable, reorderable list of all 18 buckets.
4. **API access** — Bearer token for the local API.

## What users can do

- Connect / re-link / disconnect Spotify, Tidal, and Anthropic.
- Reveal masked secrets temporarily (auto-hides after 10s).
- Rotate the bearer token with a typed confirmation; see the new value once before masking.
- Edit, test reachability of, and save filesystem root paths.
- Drag-to-reorder, inline-rename, add, and delete genre buckets (with usage-count guard).

## Components provided

| Component  | Path                                                | Description                              |
| ---------- | --------------------------------------------------- | ---------------------------------------- |
| `Settings` | [sections/settings/components/Settings.tsx](../../sections/settings/components/Settings.tsx) | The full settings surface (sub-nav + 4 panels) |

## Props reference

The full data + callback shape lives in [sections/settings/types.ts](../../sections/settings/types.ts). Callback summary:

| Callback                          | When fired                                                 |
| --------------------------------- | ---------------------------------------------------------- |
| `onConnectIntegration(service)`   | User clicked Connect / Re-link for Spotify or Tidal        |
| `onDisconnectIntegration(service)`| User confirmed Disconnect (with typed service name)        |
| `onRevealSecret(field)`           | User toggled Reveal on a masked field                      |
| `onRotateAnthropicKey(newKey)`    | User pasted a new Anthropic key and saved                  |
| `onSelectAnthropicModel(model)`   | User picked a model from the dropdown                      |
| `onTogglePromptCaching(enabled)`  | User toggled prompt caching                                |
| `onSaveFilesystemRoot(rootId, path)` | User saved a path edit                                  |
| `onTestFilesystemRoot(rootId)`    | User clicked Test on a filesystem root                     |
| `onAddBucket(name)`               | User added a new genre bucket                              |
| `onRenameBucket(id, name)`        | User inline-renamed a bucket                               |
| `onReorderBuckets(orderedIds)`    | User finished a drag-to-reorder                            |
| `onDeleteBucket(id)`              | User confirmed deleting an unused bucket                   |
| `onRotateBearerToken()`           | User confirmed `ROTATE` and a new token was issued         |
| `onCopyBearerToken()`             | User clicked Copy on the bearer token row                  |

(Confirm against [sections/settings/types.ts](../../sections/settings/types.ts) — that file is the source of truth.)

## Expected user flows

### Flow 1: Re-link Spotify
1. User opens Settings → Integrations → Spotify card shows `Connected · alex@local · refreshed 2h ago`.
2. User clicks `Re-link`.
3. Expected: `onConnectIntegration("spotify")` fires; you open the OAuth flow in a popup; on success the card updates.

### Flow 2: Reveal then auto-hide a secret
1. User clicks the eye icon on the Anthropic API key field.
2. Expected: `onRevealSecret("anthropic.apiKey")` fires; the field reveals with a small countdown timer.
3. After 10s the field re-masks automatically.

### Flow 3: Rotate the bearer token
1. User clicks `Rotate` on the API access row.
2. A confirm dialog requires typing `ROTATE`.
3. User types `ROTATE` and confirms.
4. Expected: `onRotateBearerToken()` fires; the new value is shown once with a Copy button before being masked.

### Flow 4: Rename a genre bucket
1. User double-clicks a bucket name (or clicks the inline edit affordance).
2. User types a new name; presses Enter to save.
3. Expected: `onRenameBucket(id, name)` fires; row shows a brief inline success indicator.

### Flow 5: Delete an in-use bucket
1. User clicks the delete icon on a bucket with `usageCount > 0`.
2. The confirm dialog warns the bucket is currently in use; user must type the bucket name to enable the destructive button.
3. Expected: `onDeleteBucket(id)` fires.

## Sensitive value rules

- All API keys, OAuth refresh tokens, and bearer tokens render masked by default (`•••• •••• •••• abcd`).
- Reveal toggles auto-hide after 10s.
- Rotation flows show the new value once, immediately after generation.
- All saves and rotations show **inline** success/error feedback under the field — never use a toast for credential changes.

## Testing

UI behavior tests are in [sections/settings/tests.md](../../sections/settings/tests.md).

## Files to reference

- [sections/settings/components/Settings.tsx](../../sections/settings/components/Settings.tsx)
- [sections/settings/types.ts](../../sections/settings/types.ts)
- [sections/settings/sample-data.json](../../sections/settings/sample-data.json)
- [sections/settings/README.md](../../sections/settings/README.md)
- [sections/settings/tests.md](../../sections/settings/tests.md)

## Done when

- [ ] Route `/settings` renders `<Settings ... />`; the active sub-nav item is highlighted with a sky left border.
- [ ] All masked fields hide secrets by default and auto-hide on a 10s timer after Reveal.
- [ ] OAuth Connect / Re-link / Disconnect flows behave per the spec; Disconnect requires typing the service name.
- [ ] Filesystem root rows show live Reachable / Unreachable badges + free space + last scanned.
- [ ] Genre buckets can be reordered, renamed, added, and deleted (with usage guard).
- [ ] Bearer-token rotation shows the new value exactly once.
- [ ] Inline save/error feedback appears under the relevant field — no toasts for credentials.
- [ ] Dark mode, ≥1280px desktop layout.

---

# Milestone 06 — Audit Log


## Goal

Mount the Audit Log at `/audit` — the operator's investigation surface. A filterable, append-only timeline of every state-changing action across the system, with structured before/after diffs and override reasons surfaced inline.

The log is **read-only**. There is no inline editing or deletion. Retention/cleanup policy is configured in Settings, not here.

## What users can do

- Filter the timeline by time range, actor, action namespace, target kind, target id, and severity.
- Click a row to expand it inline with the full payload, before → after diff, and override reason (when present).
- Toggle Live tail to watch new entries fade in at the top via SSE.
- Copy a single entry as JSON, copy a target id, or jump to the affected target's detail screen.
- Copy a permalink that encodes the current filter state as a URL.
- Export filtered results as CSV or NDJSON.

## Components provided

| Component  | Path                                                 | Description                                         |
| ---------- | ---------------------------------------------------- | --------------------------------------------------- |
| `AuditLog` | [sections/audit-log/components/AuditLog.tsx](../../sections/audit-log/components/AuditLog.tsx) | Full page: header, filter bar, virtualized timeline |

## Props reference

`AuditLogProps` (full definition in [sections/audit-log/types.ts](../../sections/audit-log/types.ts)).

### Selected callback props

| Callback                  | When fired                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| `onFiltersChange(filters)` | User changed any filter (debounced where appropriate)              |
| `onToggleLiveTail(enabled)` | User flipped the Live tail toggle                                 |
| `onExpandEntry(entryId)`   | User clicked a row to expand                                       |
| `onJumpToTarget(target)`   | User clicked `Jump to target` in the expanded panel                |
| `onCopyAsJson(entry)`      | User copied an entry as JSON                                       |
| `onCopyPermalink()`        | User copied the current filter state as a URL                      |
| `onCopyEntryPermalink(id)` | User copied a permalink to a single entry                          |
| `onExport(format)`         | User exported filtered results (`"csv"` or `"ndjson"`)             |
| `onResetFilters()`         | User clicked Reset                                                 |

The full list lives in [sections/audit-log/types.ts](../../sections/audit-log/types.ts).

## Expected user flows

### Flow 1: Investigate a single event
1. User pastes `evt-001` into the **Target ID** filter.
2. Expected: `onFiltersChange` fires with `targetId: "evt-001"`; the list updates to entries touching that target, newest first.
3. User clicks an entry. Expected: `onExpandEntry(entryId)` fires; the inline panel shows action / actor / target / timestamp on the left and severity / job id / override reason on the right, plus the JSON before → after diff.

### Flow 2: Watch the live tail
1. User toggles `Live tail` ON.
2. Expected: `onToggleLiveTail(true)` fires; new entries fade in at the top with a 600ms sky highlight.
3. If the user is scrolled away from the top, a "+N new" pill appears; clicking it scrolls to top.

### Flow 3: Share a filter state
1. User configures filters (severity = Override, last 24h).
2. User clicks `Copy permalink`.
3. Expected: `onCopyPermalink()` fires; you write the current URL (with encoded filter state) to the clipboard.

### Flow 4: Export filtered results
1. User narrows filters, clicks `Export ▾`, picks `NDJSON`.
2. Expected: `onExport("ndjson")` fires; you stream the export to the user.

## Empty / loading states

- **First load:** 8 skeleton rows matching the row layout.
- **No entries match filters:** centered illustration with "Nothing matches these filters" + Reset filters link.
- **Live tail with no new activity:** quiet footer line "Watching for new entries…" with a slow pulsing sky dot.

## Accessibility

- Rows are keyboard navigable (↑ / ↓), Enter to expand/collapse.
- Pressing `c` while a row is focused copies its target id.
- Screen-reader labels announce action, actor, and target chip text.

## Testing

UI behavior tests are in [sections/audit-log/tests.md](../../sections/audit-log/tests.md).

## Files to reference

- [sections/audit-log/components/AuditLog.tsx](../../sections/audit-log/components/AuditLog.tsx)
- [sections/audit-log/types.ts](../../sections/audit-log/types.ts)
- [sections/audit-log/sample-data.json](../../sections/audit-log/sample-data.json)
- [sections/audit-log/README.md](../../sections/audit-log/README.md)
- [sections/audit-log/tests.md](../../sections/audit-log/tests.md)

## Done when

- [ ] Route `/audit` renders `<AuditLog ... />`.
- [ ] Sticky filter bar with time range, actor, action namespace, target kind, target id, severity.
- [ ] Selected filter chips appear inline below the bar with × to remove; Reset clears all.
- [ ] Each row is fixed-height (~44 px) and keyboard navigable.
- [ ] Override entries get a sky left-border accent and "Override" badge.
- [ ] Expanded panel shows JSON before → after diff (additions emerald, removals red, unchanged keys dimmed and collapsible).
- [ ] Live tail mode auto-prepends new entries with a 600ms sky highlight; "+N new" pill works when scrolled away.
- [ ] Copy permalink, Copy as JSON, and Export (CSV / NDJSON) all wire to the right callbacks.
- [ ] Dark mode renders correctly.

---

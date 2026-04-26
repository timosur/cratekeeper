# Milestone 04 — Master Library

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

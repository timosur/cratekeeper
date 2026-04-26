# Master Library — Section Overview

## Purpose
The curated, hand-vetted collection of canonical audio files on local OS disk. The Master Library is the operator's "trusted pool"; every match against it during an event uses the local masterpiece instead of a NAS file.

## User flows
1. **Browse the collection** — User lands on `/library`; sees overview metrics, genre-bucket breakdown, and a virtualized table of every promoted track.
2. **Promote a single matched track** — Performed in Event Detail (star icon). When user returns to `/library`, the track appears.
3. **Add a track manually** — `+ Add` opens a modal for ISRC, file path, and bucket; on success the row appears at the top.
4. **Verify file presence** — User clicks `Verify all`; rows whose files have been moved/deleted are flagged with a red broken-link icon and a banner appears at the top of the page.
5. **Repair a broken masterpiece** — User clicks the broken-link icon → modal accepts the new file path → on save the row turns clean again.
6. **Remove a masterpiece** — User opens row menu → `Remove` → typed-confirmation modal (the track title) → removal logged.
7. **Filter & search** — Bucket dropdown, genre dropdown, broken-only toggle, free-text search across title/artist/ISRC.

## Design decisions
- **Master Library is local OS disk only.** Never NAS, never cloud. The path column always renders as a mono local path.
- **Verify is explicit.** The system never silently flips a masterpiece to broken; the user always initiates a Verify run, and the timestamp of the last verify is shown.
- **Promotion is one-way per track.** A track is either in the library or not. There is no "draft" state.
- **Remove always confirms.** Typed confirmation prevents accidental loss of carefully-curated files.

## Components

| Component       | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `MasterLibrary` | Page header, overview cards, genre buckets, filter bar, virtualized table |

## Callback props

| Callback                  | Signature                              | When fired                              |
| ------------------------- | -------------------------------------- | --------------------------------------- |
| `onAddTrack`              | `() => void`                           | `+ Add` clicked                         |
| `onVerifyAll`             | `() => void`                           | `Verify all` clicked                    |
| `onRepairTrack`           | `(trackId, newPath) => void`           | Broken-link repair modal confirmed      |
| `onRemoveTrack`           | `(trackId) => void`                    | Removal modal confirmed                 |
| `onChangeFilters`         | `(filters: LibraryFilters) => void`    | Any filter / search input changes       |
| `onOpenLocalFile`         | `(trackId) => void`                    | Row's "Open in Finder" / "Reveal" click |

## Data shapes

The component takes: `overview`, `buckets`, `tracks`, and `filterOptions`. See [types.ts](types.ts) for the full TypeScript.

## Visual reference
(No screenshot in this export — render the component locally with `sample-data.json` to inspect.)

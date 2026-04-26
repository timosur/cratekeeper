# Master Library — UI Behavior Tests

## User flow tests

### Add a track

**Setup:** render `<MasterLibrary {...mockProps} onAddTrack={fn} />`.

**Steps:** click `+ Add` in page header.

**Expected:** `onAddTrack` was called once.

### Verify all

**Setup:** render with `overview.lastVerifiedAt = "2026-04-20T08:00:00Z"`.

**Expected:** the metric card shows "Last verified: Apr 20, 2026, 8:00 AM".

**Steps:** click `Verify all`.

**Expected:** `onVerifyAll` was called once.

### Repair a broken track

**Setup:** render with one row whose `isBroken === true`.

**Steps:**
1. Click the broken-link icon in the row.
2. In the repair modal, enter `/Volumes/Music/repaired.flac`.
3. Click `Save`.

**Expected:** `onRepairTrack` was called once with `(track.id, "/Volumes/Music/repaired.flac")`.

### Remove a track (typed confirmation)

**Setup:** render any row.

**Steps:**
1. Open the row menu and click `Remove`.
2. The modal shows the track title and a text input.
3. Type the exact track title.
4. Click `Remove` (only enabled when the typed text matches).

**Expected:** `onRemoveTrack` was called once with the track id; the modal closes.

### Filter by bucket

**Setup:** render with `tracks` of 3 different buckets.

**Steps:** open bucket dropdown, select "cocktail".

**Expected:** `onChangeFilters` was called with `{ bucket: "cocktail", ... }`.

### Search by ISRC

**Steps:** type `USRC11234567` into the search input.

**Expected:** `onChangeFilters` is fired (debounced) with `{ search: "USRC11234567", ... }`.

## Empty states

- **No tracks at all:** the table shows a centered empty state explaining "Promote tracks from event matches to grow your library." with the `+ Add` button visible.
- **All tracks broken:** the broken-banner is visible and the table renders only broken rows when the broken-only toggle is on.
- **No results after filter:** "No tracks match your filters" with a `Clear filters` link.

## Component interaction tests

- The 4 overview metric cards show correct values.
- The genre-bucket strip shows N pills, one per non-empty bucket.
- Active filters render as removable chips above the table.
- Broken rows show a red broken-link icon next to the file path.
- Each row shows: title, artist, ISRC (mono), file path (mono), bucket pill, genre pill, promoted-at timestamp.

## Edge cases

- **Many tracks (10,000+)** the table virtualizes; scroll position is preserved on filter change.
- **Special characters in title** are rendered safely (no HTML injection).
- **Path with spaces** is fully visible on hover (title attribute) and copyable via the row menu.

## Accessibility checks

- The filter bar is a `<form role="search">`.
- Bucket and genre dropdowns are keyboard-navigable (↑ ↓ Enter Esc).
- The remove-confirmation modal traps focus.
- Virtualized rows expose a stable `aria-rowindex`.

## Sample test data

```ts
import type { LibraryTrack, LibraryOverview, LibraryBucket } from "./types";

export const mockTrack = (over: Partial<LibraryTrack> = {}): LibraryTrack => ({
  id: "lib-001",
  title: "L'Italiano",
  artist: "Toto Cutugno",
  isrc: "ITRC11234567",
  filePath: "/Volumes/Music/master/cocktail/toto-cutugno-litaliano.flac",
  bucket: "cocktail",
  genre: "italian-pop",
  promotedAt: "2026-03-12T14:22:00Z",
  isBroken: false,
  ...over,
});

export const mockProps = {
  overview: {
    totalTracks: 4_217,
    bucketsActive: 7,
    brokenCount: 0,
    lastVerifiedAt: "2026-04-20T08:00:00Z",
  } satisfies LibraryOverview,
  buckets: [{ id: "cocktail", label: "Cocktail Hour", count: 421 }] as LibraryBucket[],
  tracks: [mockTrack()],
  filterOptions: { buckets: [/* ... */], genres: [/* ... */] },
};
```

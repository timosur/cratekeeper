# Data Shapes

These are **UI data contracts** — the shape of the data each component expects to receive as props. They are not a database schema. The implementer decides how to persist, fetch, and reshape backend data into these contracts.

## Entities used across sections

| Entity / type           | Used in                                  | Description                                                                 |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| `EventCard`             | `events`                                 | Compact summary of an event for the dashboard grid                          |
| `EventDetail`           | `event-detail`                           | Full event state including all 11 pipeline steps and gates                  |
| `PipelineStep`          | `event-detail`                           | One of the 11 ordered steps with status, last-run, and active job           |
| `MatchedTrack`          | `event-detail` (Match panel)             | A track resolved to a local file (NAS or Master Library)                    |
| `MissedTrack`           | `event-detail` (Match panel)             | A track with no local match; carries a Tidal listen / purchase URL          |
| `LibraryTrack`          | `master-library`                         | A curated masterpiece on the local OS disk                                  |
| `LibraryOverview`       | `master-library`                         | Library-wide stats and on-disk health                                       |
| `BucketStat`            | `master-library`                         | Per-genre breakdown row                                                     |
| `AuditEntry`            | `audit-log`                              | One entry in the append-only timeline                                       |
| `Setting*` (varied)     | `settings`                               | Integration cards, filesystem rows, bucket rows, bearer-token row           |

## Where to look

- **Per-section TypeScript** lives in `sections/<section-id>/types.ts`. These are the canonical interfaces — copy them into your codebase verbatim.
- **`overview.ts`** in this folder aggregates the data interfaces (not the `*Props` interfaces) for at-a-glance reference.
- **Sample data** lives in `sections/<section-id>/sample-data.json` — drop these into stories or fixtures while you wire up real APIs.

## Notes for implementers

- All components are **props-based**. Never import data inside an exportable component.
- All callbacks are **optional** (`?`). The component should render correctly even when no callbacks are provided (useful for read-only previews).
- `null` is meaningful — for example, `lastVerifiedAt: null` means "never verified yet"; do not coerce it to `""`.
- Timestamps are ISO-8601 strings. Render them through your own date util.
- Counts and identifiers are intended to render in monospace (see [../design-system/fonts.md](../design-system/fonts.md)).

# Milestone 06 — Audit Log

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

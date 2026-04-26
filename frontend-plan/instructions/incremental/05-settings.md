# Milestone 05 — Settings

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

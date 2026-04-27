# Settings — UI Behavior Tests

## User flow tests

### Connect Spotify

**Setup:** render `<Settings settings={{ ...mock, integrations: [{ id: "spotify", status: "disconnected" }, ...] }} onConnectIntegration={fn} />`.

**Steps:** click `Connect` next to Spotify.

**Expected:** `onConnectIntegration` was called once with `"spotify"`.

### Save Anthropic API key — auto-hide after 10s

**Setup:** render with no key set.

**Steps:**
1. Type `sk-ant-test-1234567890abc` into the field.
2. Click `Save`.

**Expected:**
- `onSaveAnthropicKey` was called once with the typed value.
- Inline success message "Saved" is visible.
- The field shows the full value for 10 seconds.

**Steps:** wait 10 seconds.

**Expected:** the field collapses to masked preview `sk-ant-•••••••••••0abc`.

### Add an FS root

**Setup:** open the Filesystem section.

**Steps:**
1. Click `+ Add`.
2. In the modal, fill `label = "NAS Music"`, `path = "/Volumes/NAS/Music"`, `role = "nas-index"`.
3. Click `Add`.

**Expected:** `onAddFsRoot` was called once with `{ label: "NAS Music", path: "/Volumes/NAS/Music", role: "nas-index" }`.

**Failure path:** if `path` does not exist on disk, the modal shows an inline error "Path not found" and does NOT fire the callback.

### Edit a genre bucket

**Setup:** render with a `cocktail` bucket containing `["lounge", "bossa-nova"]`.

**Steps:**
1. Click the bucket.
2. The inline edit panel opens; rename label to `Cocktail Hour`.
3. Add genre `jazz`.
4. Click `Save`.

**Expected:** `onUpdateBucket` was called once with the updated bucket payload.

### Regenerate API token

**Setup:** render with an existing token.

**Steps:**
1. Click `Regenerate`.
2. Confirm in the warning modal ("This will invalidate the current token").
3. The new token is displayed in full with a `Copy` button for 10 seconds, then auto-hides.

**Expected:** `onRegenerateApiToken` was called once.

## Component interaction tests

- All 4 sections are present and collapsible.
- Connected integrations show an emerald "Connected" pill plus the linked account name.
- Disconnected integrations show a neutral "Not connected" pill plus a sky `Connect` button.
- Each FS root row shows label, path (mono), role pill, and a `Remove` action.
- Sensitive value fields render as `type="password"` initially and show a `Show` toggle.

## Edge cases

- **Empty buckets** renders a "No buckets yet — add one to organize tracks for events" empty state with a sky `+ Add Bucket` button.
- **Disconnected required integration:** The Anthropic key field shows an amber warning "Required for tag classification" until set.
- **Long file path** in FS root row truncates with ellipsis; tooltip shows the full path.

## Accessibility checks

- Each section has an `aria-expanded` accordion control.
- All inputs have explicit `<label>` elements.
- The regenerate-token confirmation modal traps focus and returns it to the `Regenerate` button on close.
- The "Show" toggle on sensitive fields is keyboard-focusable and announces "Show / Hide".

## Sample test data

```ts
import type { SettingsState } from "./types";

export const mockSettings: SettingsState = {
  integrations: [
    { id: "spotify", label: "Spotify", status: "connected", linkedAccount: "operator@example.com" },
    { id: "tidal", label: "Tidal", status: "disconnected" },
    { id: "anthropic", label: "Anthropic", status: "connected", apiKeyMasked: "sk-ant-•••••0abc" },
  ],
  fsRoots: [
    { id: "fs-1", label: "NAS Music", path: "/Volumes/NAS/Music", role: "nas-index" },
    { id: "fs-2", label: "Master Library", path: "/Volumes/Music/master", role: "master-library" },
  ],
  buckets: [
    { id: "cocktail", label: "Cocktail Hour", genres: ["lounge", "bossa-nova", "jazz"] },
  ],
  apiToken: { masked: "ck-•••••0xyz", createdAt: "2026-04-01T12:00:00Z" },
};
```

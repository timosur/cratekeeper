# Settings — Section Overview

## Purpose
Configuration for everything operational: external integrations, filesystem roots, user-defined genre buckets, and the API access token. Designed for a single-operator local-first tool.

## User flows
1. **Connect Spotify** — User clicks `Connect`; OAuth window opens; on return, status flips to `Connected` with the linked account.
2. **Connect Tidal** — Same OAuth flow; once connected, Tidal is the secondary listening source and per-track URLs become exportable.
3. **Set Anthropic API key** — User pastes a key; field auto-hides after 10s; inline feedback (success / failure) replaces toast notifications.
4. **Add an FS root** — User clicks `+ Add` in Filesystem section; modal collects label + path + role (NAS index / Master Library); validates path exists.
5. **Edit / remove a genre bucket** — User clicks a bucket → inline edit panel opens → label and member-genre list editable → save updates the bucket.
6. **Rotate API token** — User clicks `Regenerate`; modal warns existing integrations will break; on confirm, new token is shown once with a copy button.

## Design decisions
- **Inline feedback never toasts.** Every save / failure renders next to the field that triggered it; toasts are reserved for app-wide events.
- **Sensitive values auto-hide.** API keys and tokens display fully on save for 10s, then collapse to a masked preview (`sk-ant-•••••••••••abc1`).
- **Sky for "Connect" / primary CTAs only.** Save buttons next to text fields use neutral; unsaved changes show an inline `Unsaved` chip.
- **Categories collapse into accordion-style sections.** The page is dense with options; collapsing keeps cognitive load low.
- **Filesystem roles are explicit.** Every FS root has exactly one role: `nas-index` (where source files live) or `master-library` (curated collection).

## Components

| Component  | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| `Settings` | Page with 4 collapsible sections: Integrations, Filesystem, Genre Buckets, API Access |

## Callback props

| Callback                        | Signature                                          | When fired                                |
| ------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| `onConnectIntegration`          | `(integrationId: string) => void`                  | "Connect" clicked                         |
| `onDisconnectIntegration`       | `(integrationId: string) => void`                  | "Disconnect" clicked                      |
| `onSaveAnthropicKey`            | `(apiKey: string) => void`                         | Save next to API key field                |
| `onAddFsRoot`                   | `(root: NewFsRoot) => void`                        | FS root add modal confirmed               |
| `onRemoveFsRoot`                | `(rootId: string) => void`                         | Remove on an FS root                      |
| `onAddBucket / onUpdateBucket / onRemoveBucket` | bucket CRUD                          | Genre bucket section                      |
| `onRegenerateApiToken`          | `() => void`                                       | API token rotation confirmed              |

## Data shapes

The component takes a single `settings: SettingsState` prop. See [types.ts](types.ts).

## Visual reference
(No screenshot in this export — render the component locally with `sample-data.json` to inspect.)

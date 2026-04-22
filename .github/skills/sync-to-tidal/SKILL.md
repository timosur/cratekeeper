---
name: sync-to-tidal
description: 'Sync a Spotify playlist to Tidal by matching tracks via ISRC codes. Use when: copying a playlist from Spotify to Tidal, mirroring event playlists to the DJ platform, syncing master playlists cross-platform, transferring a wish playlist to Tidal. Requires: spotify and tidal MCP servers connected.'
argument-hint: 'Provide the Spotify playlist URL or ID to sync to Tidal'
---

# Sync Playlist to Tidal

Mirror a Spotify playlist to Tidal by matching tracks using ISRC codes. Creates Tidal playlists for each genre bucket with matched tracks.

## When to Use

- After creating event sub-playlists on Spotify, sync them to Tidal for live DJing
- Syncing [DJ] master playlists to Tidal
- Any time a Spotify playlist needs a Tidal copy

## Required

- **dj-cli** installed (`cd dj-cli && source .venv/bin/activate`)
- **tidal** MCP server — must be connected and authenticated (for checking existing playlists if needed)

## Input

The user provides:
- **Classified JSON** — path to a `.classified.json` file from a prior `dj classify` run
- OR **Spotify playlist** — URL or playlist ID (will be fetched and classified first)

## Procedure

### Step 1: Ensure Classified Data Exists

If the user provides a classified JSON, use it directly.

If the user provides a Spotify playlist URL/ID instead:

```bash
cd dj-cli && source .venv/bin/activate
dj fetch <playlist-url-or-id>
dj classify data/<playlist-name>.json
```

### Step 2: Sync to Tidal

```bash
dj sync-to-tidal data/<playlist-name>.classified.json
```

This will:
- Create a Tidal playlist for each genre bucket
- Match tracks by ISRC code
- Report which tracks matched and which failed

### Step 3: Report Results

Show the summary — how many tracks matched per bucket, which ISRCs failed.

If there are many failed matches, suggest the user check if those tracks are available on Tidal under different versions.

## Quality Checks

- [ ] All tracks with ISRCs were attempted
- [ ] Failed matches are reported with reason
- [ ] Tidal playlist names match the Spotify event naming convention
- [ ] No duplicate tracks added if re-running on the same data

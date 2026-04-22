---
name: sort-playlist-by-genre
description: 'Sort a Spotify wish playlist into genre-based sub-playlists for a DJ event. Use when: preparing a wedding or party set, organizing a messy wish playlist, splitting tracks by genre, creating event-specific sub-playlists from a source playlist. Requires: spotify MCP server connected.'
argument-hint: 'Provide the Spotify playlist URL or ID, event name, and event date'
---

# Sort Playlist by Genre

Split a raw Spotify wish playlist into organized genre-based sub-playlists for a specific event.

## When to Use

- A client sends a Spotify wish playlist for an upcoming event
- You need to organize random tracks into genre buckets for easy DJ navigation
- Preparing sub-playlists for a wedding, corporate party, or themed event

## Required

- **dj-cli** installed (`cd dj-cli && source .venv/bin/activate`)
- **spotify** MCP server — must be connected and authenticated

## Input

The user provides:
- **Spotify playlist** — URL (e.g., `https://open.spotify.com/playlist/...`) or playlist ID
- **Event name** — e.g., "Wedding Schmidt"
- **Event date** — e.g., "2026-06-15"

## Procedure

### Step 1: Fetch & Classify

Run these CLI commands in sequence:

```bash
cd dj-cli && source .venv/bin/activate
dj fetch <playlist-url-or-id>
dj classify data/<playlist-name>.json
```

This fetches all tracks, enriches with artist genres, and classifies into genre buckets. Report the classification summary table to the user.

### Step 2: Review with User

Run:

```bash
dj review data/<playlist-name>.classified.json
```

Show the user any medium/low confidence tracks. Ask: *"Does this look right? Want me to move any tracks between categories?"*

If the user wants changes, edit the `.classified.json` file directly to change `bucket` values on specific tracks.

Wait for user confirmation before proceeding.

### Step 3: Create Sub-Playlists

```bash
dj create-playlists data/<playlist-name>.classified.json --event "<Event Name>" --date "<Event Date>"
```

This creates one Spotify playlist per genre bucket named `{Event Name} — {Bucket Name}`.

### Step 4: Report Results

Show the user a summary of all created playlists with track counts.

## Quality Checks

- [ ] All tracks from the source playlist are accounted for (no tracks lost)
- [ ] No empty playlists created
- [ ] Bucket count is between 4-12 (manageable for DJing)
- [ ] User confirmed the classification before playlists were created

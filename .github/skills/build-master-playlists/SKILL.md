---
name: build-master-playlists
description: 'Add tracks from a Spotify wish playlist or event sub-playlists into cross-event [DJ] master playlists organized by genre. Use when: building a DJ library, adding new event tracks to master genre playlists, maintaining cross-wedding genre collections, populating [DJ] playlists. Requires: spotify MCP server connected.'
argument-hint: 'Provide the Spotify playlist URL or ID containing tracks to add to master playlists'
---

# Build Master Playlists

Add tracks from a source playlist into cross-event **[DJ] master playlists** — one per genre bucket. These master playlists grow over time and serve as the DJ's central library.

## When to Use

- After processing a new event wish playlist
- When you want to add tracks to the central genre library
- When building up master playlists from multiple events
- After running `sort-playlist-by-genre` and wanting to also populate the masters

## Required

- **dj-cli** installed (`cd dj-cli && source .venv/bin/activate`)
- **spotify** MCP server — must be connected and authenticated

## Input

The user provides:
- **Classified JSON** — path to a `.classified.json` file from a prior `dj classify` run
- OR **Spotify playlist(s)** — one or more playlist URLs/IDs (will be fetched and classified first)

## Procedure

### Step 1: Ensure Classified Data Exists

If the user provides a classified JSON, use it directly.

If the user provides a Spotify playlist URL/ID instead:

```bash
cd dj-cli && source .venv/bin/activate
dj fetch <playlist-url-or-id>
dj classify data/<playlist-name>.json
```

### Step 2: Add to Master Playlists

```bash
dj build-masters data/<playlist-name>.classified.json
```

This will:
- Find existing `[DJ] {Bucket Name}` playlists in the user's Spotify library
- Create new `[DJ]` playlists for any missing buckets
- Deduplicate tracks (skip tracks already in the master playlist)
- Add only new tracks

### Step 3: Report Results

Show the summary output from the command — how many new tracks were added, how many duplicates were skipped per master playlist.

## Quality Checks

- [ ] All source tracks classified into exactly one bucket
- [ ] No duplicates added to master playlists
- [ ] Duplicates reported to user
- [ ] New master playlists follow `[DJ] {Name}` convention
- [ ] Bucket count stays manageable (merge small buckets)

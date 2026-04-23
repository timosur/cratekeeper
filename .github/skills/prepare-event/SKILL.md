---
name: prepare-event
description: 'End-to-end pipeline: Spotify wish playlist → classified, mood-analyzed, LLM-tagged local event folder ready for DJing. Use when: preparing a wedding, party, or corporate event from a client wish playlist. Requires: spotify MCP server connected, Docker for essentia audio analysis, NAS mounted at /Volumes/Music.'
argument-hint: 'Provide the Spotify playlist URL, event name, and event date'
---

# Prepare Event

Full pipeline from a Spotify wish playlist to a local event folder with files organized by Genre/, tagged with structured metadata and ready for DJing.

## When to Use

- A client sends a Spotify wish playlist for an upcoming event
- You need to prepare a complete DJ set folder from scratch
- Re-running after the wish playlist has been updated

## Required

- **Python ≥ 3.11** with `cratekeeper-cli` installed locally (`pip install -e ./cratekeeper-cli`)
- **Docker** — needed for audio analysis (essentia + TF models require Linux x86_64)
- **PostgreSQL** — running locally or via Docker; default connection: `postgresql://dj:dj@localhost:5432/djlib` (override with `DATABASE_URL` env var)
- **spotify MCP server** — connected and authenticated
- **NAS mounted** at `/Volumes/Music` (or wherever the music library lives)
- **Anthropic API key** — for LLM tag classification (`ANTHROPIC_API_KEY` env var)

## Path Reference

| Context | data dir | NAS music | Library |
|---------|----------|-----------|---------|
| **Local** | `data/` | `/Volumes/Music` | `~/Music/Library` |
| **Docker** (analysis only) | `/data` | `/music` | `/library` |

## Genre Buckets (18)

Ordered by specificity (first match wins):
Schlager, Drum & Bass, Hardstyle, Melodic Techno, Techno, Minimal / Tech House,
Deep House, Progressive House, Trance, House, EDM / Big Room, Dance / Hands Up,
Hip-Hop / R&B, Latin / Global, Disco / Funk / Soul, Rock, Ballads / Slow, Pop (fallback).

Era (80s, 90s, 2000s, etc.) is NOT a genre — it's derived from release_year and stored as a tag in the comment field.

## Tag System

Structured tags are stored in the ID3 comment field (or FLAC comment) with this format:
```
era:90s; energy:high; function:floorfiller,singalong; crowd:mixed-age; mood:feelgood,euphoric
```

- **energy**: low, mid, high
- **function**: floorfiller, singalong, bridge, reset, closer, opener
- **crowd**: mixed-age, older, younger, family
- **mood**: feelgood, emotional, euphoric, nostalgic, romantic, melancholic, dark, aggressive, uplifting, dreamy, funky, groovy

Tags are assigned by the LLM classifier using audio analysis + metadata as input.

## Input

The user provides:
- **Spotify playlist** — URL (e.g., `https://open.spotify.com/playlist/...`) or playlist ID
- **Event name** — e.g., "Wedding Tim & Lea"
- **Event date** — e.g., "2026-04-22"

## Procedure

Most commands run locally. Audio analysis uses Docker (essentia + TF models require Linux x86_64).

```bash
# Local commands
crate <command> [args]

# Docker (audio analysis only)
docker compose run --rm crate <command> [args]
```

### Step 1: Fetch Tracks from Spotify

```bash
crate fetch "<playlist-url>" --output data/<slug>.json
```

Use a URL-safe slug for the filename (e.g., `hochzeitsmaeusse`). Report the track count to the user.

### Step 2: Enrich with MusicBrainz

```bash
crate enrich data/<slug>.json
```

Queries MusicBrainz for missing genres and original release years via ISRC lookup. Rate-limited at ~1 req/sec.

Report: how many tracks enriched, how many had no tags.

### Step 3: Classify into Genre Buckets

```bash
crate classify data/<slug>.json
```

Creates `data/<slug>.classified.json` with genre buckets and era labels. Show the classification summary table to the user.

### Step 4: Review Classification

```bash
crate review data/<slug>.classified.json
```

Show low confidence tracks. Ask user: *"Does this look right? Want me to move any tracks between categories?"*

If the user wants changes, edit the `.classified.json` directly to change `bucket` values. **Wait for user confirmation before proceeding.**

### Step 5: Scan NAS Library

```bash
crate scan /Volumes/Music
```

Indexes all audio files from the NAS into PostgreSQL. Incremental by default — skips already-indexed files on re-runs.

Use `--full` flag for a complete re-scan. If the DB is already populated and recent, this step can be skipped (ask user).

### Step 6: Match Tracks to Local Files

```bash
crate match data/<slug>.classified.json --tidal-urls
```

Matches Spotify tracks to local files using: ISRC → exact artist+title → fuzzy match (≥85%).

Report the match results table. If many tracks are unmatched, suggest the user check their library.

### Step 7: Analyze Audio (essentia + TF) — Docker required

```bash
docker compose run --rm crate analyze-mood /data/<slug>.classified.json
```

Uses essentia + TensorFlow models to extract:
- **Basic**: BPM, energy (RMS 0-1), danceability, loudness (LUFS), key
- **ML mood classifiers**: happy, party, relaxed, sad, aggressive (0-1 probability each)
- **Arousal/Valence**: 1-9 scale (DEAM model)
- **Voice/Instrumental**: binary classification

Sets preliminary energy classification (low/mid/high) from RMS energy. Show the energy distribution table.

**Important**: This is the only step that requires Docker. The `local_path` values in the JSON use host paths. Docker volume mappings: `/Volumes/Music:/music:ro`, `~/Music/Library:/library`.

### Step 8: Classify Tags via LLM

```bash
crate classify-tags data/<slug>.classified.json
```

Sends tracks (with all audio analysis data) to Anthropic Claude in batches of 15. The LLM assigns:
- energy (low/mid/high) — may override the essentia-based preliminary value
- function tags (floorfiller, singalong, bridge, etc.)
- crowd tags (mixed-age, older, younger, family)
- mood tags (feelgood, euphoric, nostalgic, etc.)
- optional genre re-assignment if the bucket is clearly wrong

Options: `--provider openai`, `--model <name>`, `--batch-size <n>`, `--dry-run`.

Requires `ANTHROPIC_API_KEY` env var (or `OPENAI_API_KEY` for openai provider).

### Step 9: Build Master Library

```bash
crate build-library data/<slug>.classified.json --target ~/Music/Library
```

Copies matched files into `~/Music/Library/Genre/Artist - Title.ext`. Skips files without bucket. Updates `local_path` in the JSON.

### Step 10: Build Event Folder

```bash
crate build-event data/<slug>.classified.json --output ~/Music/Events/<EventName>/
```

Copies files into an event-specific folder with `Genre/` structure. Creates `_missing.txt` for unmatched tracks.

### Step 11: Tag Audio Files

```bash
crate tag data/<slug>.classified.json
```

Writes metadata into ID3/FLAC tags:
- **Genre** (TCON / genre): bucket name
- **BPM** (TBPM / bpm): beats per minute
- **Key** (TKEY / initialkey): musical key
- **Comment** (COMM / comment): structured tags string

### Step 12: Report to User

Summarize:
- Total tracks processed
- Match rate (ISRC / exact / fuzzy / missing)
- Energy distribution
- Library location (`~/Music/Library`)
- Event folder location
- Missing tracks list

## Quick Re-run (Updated Playlist)

If the source playlist was updated:
```bash
crate fetch "<playlist-url>" --output data/<slug>.json
crate enrich data/<slug>.json
crate classify data/<slug>.json
crate match data/<slug>.classified.json --tidal-urls
docker compose run --rm crate analyze-mood /data/<slug>.classified.json
crate classify-tags data/<slug>.classified.json
crate build-library data/<slug>.classified.json --target ~/Music/Library
crate build-event data/<slug>.classified.json --output ~/Music/Events/<EventName>/
crate tag data/<slug>.classified.json
```

The scan step can be skipped if the NAS library hasn't changed.

## Quality Checks

- [ ] All tracks from the source playlist are accounted for
- [ ] Classification reviewed and confirmed by user before proceeding
- [ ] Match rate is reasonable (>50% for a well-stocked library)
- [ ] Audio analysis completed for all matched tracks
- [ ] LLM tags assigned (energy, function, crowd, mood)
- [ ] Files are real copies (not symlinks) in the library and event folders
- [ ] Tags written successfully (genre, BPM, key, comment with structured tags)
- [ ] Missing tracks list provided to user for manual download

# Cratekeeper — Product Overview

## What it is
Cratekeeper is a **local-first, single-operator web app** that turns a Spotify wish playlist into a classified, mood-analyzed, properly tagged, event-ready folder on disk — and accumulates the keepers into a curated **Master Library** on the DJ's Mac.

It runs entirely against a local music NAS, with explicit checkpoints, undo for destructive steps, and a full audit trail. **Spotify** is the source of every event's wish playlist; **Tidal** is used only as a secondary listening / acquisition target via per-track URLs.

## Core problems solved
1. **Set planning needs depth Spotify doesn't expose.** Local Essentia + TF analysis gives every matched track BPM, key, energy, and mood.
2. **Tracks live across catalogs and a local NAS.** Cratekeeper indexes the NAS into Postgres and matches ISRC-first, then exact, then fuzzy.
3. **DJ software needs a clean tagged folder.** Cratekeeper writes ID3/Vorbis/MP4 tags in place and builds per-event folders + a master library by copy or symlink, with `dry_run` diffs.
4. **LLM tagging needs a vocabulary and a budget.** Anthropic Sonnet with a fixed tag vocabulary, prompt caching, and a pre-flight cost preview.
5. **Destructive operations need a safety net.** Byte-exact per-file backups, a one-click undo job, a Quality-Gate panel, and an immutable audit log.

## Sections (the planned product)
1. **Events** — Dashboard. Card grid of every active event with current step, track counts, and active-job status. The primary entry point.
2. **Event Detail** — The 11-step pipeline working surface for a single event (Fetch → Enrich → Classify → Review → Scan → Match → Analyze → Classify Tags → Apply → Build Event → Build Library), with per-step panels, a quality gate, missing-masterpieces tracking, and a live SSE log.
3. **Master Library** — The curated collection on the local OS disk: stats, on-disk integrity, a per-genre breakdown, an add/promote/verify flow, and a filterable track table.
4. **Settings** — Spotify (wishlist source) and Tidal (listening / URL export) OAuth, Anthropic API key + model selector, filesystem roots, bearer token, and the editable genre bucket list.
5. **Audit Log** — Append-only, filterable timeline of every state-changing action, with before/after diffs and override reasons surfaced inline.

> Note: **Event Detail** is reachable from the Events dashboard (clicking a card) and is not a top-level nav item.

## Product entities (shared vocabulary)
- **Track** — a song known to the system; carries Spotify metadata, the resolved local file path on the NAS (when matched), an assigned genre bucket, and library-membership fields (`origin`, `isMasterpiece`, `promotedFromEventId`, presence on local OS disk).
- **MoodAnalysis** — local audio fingerprint (BPM, key, energy, mood probabilities, arousal/valence).
- **TrackTags** — the LLM-assigned structured tags (energy / function / crowd / mood vocabulary).
- **Event** — a single gig being prepared. Owns a slug, a Spotify playlist URL, its position in the 11-step pipeline, and a per-event output folder.
- **EventTrack** — a track's per-event state (match status, classification confidence, review decisions, tag-write status).
- **GenreBucket** — one of 18 editable genre classifications.
- **Job** — a single pipeline step run (or `verify-library` maintenance run); has status, classification (heavy / light), and an SSE stream while running.
- **Checkpoint** — per-unit progress within a Job (per-track, per-batch, or per-file) so jobs can resume.
- **TagBackup** — byte-exact pre-write snapshot, consumed by `undo-tags`.
- **Build** — a materialized folder output (per-event folder or the Master Library).
- **AuditEntry** — append-only record of any state-changing action.
- **Setting** — stored configuration value (credentials, paths, bearer token, bucket order, model + caching toggle).

## Implementation sequence (milestones)
The handoff package is structured to be implemented in this order. Each milestone is a self-contained instruction file in [instructions/incremental/](instructions/incremental/).

1. **Shell** — Design tokens + the persistent left sidebar shell that wraps every section.
2. **Events** — The dashboard card grid; the primary entry point.
3. **Event Detail** — The 11-step pipeline working surface.
4. **Master Library** — Curated collection browse / add / verify.
5. **Settings** — Integrations, filesystem roots, genre buckets, API access.
6. **Audit Log** — Filterable append-only timeline.

## What this handoff is — and isn't
**Is:** finished UI designs (props-based React + Tailwind components), product requirements, user flows, design tokens, sample data, and UI test specs.

**Isn't:** backend architecture, persistence model, business-logic implementation, or infrastructure choices. Those are decisions for the implementer.

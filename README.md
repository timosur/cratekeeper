# Cratekeeper

DJ library management toolkit — classify, analyze, tag, and organize music crates from Spotify wish playlists into event-ready folders with genre sorting, audio analysis, and LLM-powered tagging.

## What It Does

1. **Genre-classified tracks** — sorted into 18 genre buckets (Schlager → Pop fallback)
2. **Audio analysis** — BPM, key, energy, danceability, mood classifiers, arousal/valence via essentia + TensorFlow models
3. **LLM-tagged metadata** — energy level, function tags (floorfiller, singalong, bridge…), crowd fit, mood tags — assigned by Claude/GPT using audio data
4. **Tagged local files** — genre, BPM, key, and structured tags written into ID3/FLAC comment fields
5. **Organized folder structure** — `Genre/Artist - Title.ext` ready for djay PRO or any DJ software
6. **Multi-platform playlists** — sub-playlists on both Spotify and Tidal

## Project Structure

```
cratekeeper/
├── cratekeeper-api/       # FastAPI backend (Python) — orchestrates the full pipeline
│   ├── cratekeeper_api/       # API: routes, services, jobs, integrations
│   ├── cratekeeper/           # Domain engine: classify, analyze, tag, build, sync
│   ├── alembic/               # DB migrations
│   └── pyproject.toml
├── cratekeeper-web/       # React + Vite UI
├── spotify-mcp/           # Spotify MCP server (TypeScript) — credentials source
├── tidal-mcp/             # Tidal MCP server (Python) — credentials source
├── data/                  # Event JSON files
└── docker-compose.yml
```

## Requirements

- **Python ≥ 3.11**
- **Node ≥ 20** (for the web UI)
- **Docker** — for audio analysis (essentia + TF models require Linux x86_64) and Postgres
- **PostgreSQL** — local file index (`postgresql://dj:dj@localhost:5432/djlib`, override with `DATABASE_URL`)
- **NAS / music library** mounted locally (e.g., `/Volumes/Music`)
- **Spotify Developer App** — [create one here](https://developer.spotify.com/dashboard)
- **Tidal account** — HiFi or HiFi Plus
- **Anthropic API key** — for LLM tag classification (`ANTHROPIC_API_KEY` env var)

## Setup

### 1. Install dependencies

```bash
make install      # api (uv) + web (npm)
```

### 2. Start Postgres + run migrations

```bash
make db-up
make migrate
```

### 3. Set up the Spotify MCP credentials

```bash
cd spotify-mcp
npm install
cp spotify-config.example.json spotify-config.json
# Edit spotify-config.json with your clientId and clientSecret
npm run auth    # Opens browser for OAuth
npm run build
```

### 4. Set up the Tidal MCP credentials

```bash
cd tidal-mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python -m tidal_mcp.auth   # Prints a link — open it to log in
```

The API reads `spotify-mcp/spotify-config.json` and `tidal-mcp/tidal-session.json` as a credential source for first-run auth.

### 5. Run API + web

```bash
make dev    # api on :8765 + web on :5173
```

## Pipeline (driven via the API / web UI)

1. **Fetch** — pull tracks from a Spotify wish playlist
2. **Enrich** — fill missing genres / years via MusicBrainz
3. **Classify** — assign each track to one of 18 genre buckets
4. **Scan** — index your local audio library into Postgres
5. **Match** — link Spotify tracks to local files (ISRC → exact → fuzzy)
6. **Analyze** — extract BPM, key, energy, mood (essentia + TF, Docker)
7. **Classify tags** — LLM-assigned energy / function / crowd / mood
8. **Build library** — copy files into the master `Genre/` library
9. **Build event** — copy files into the event's `Genre/` folder
10. **Tag** — write genre, BPM, key, and structured tags into audio file metadata
11. **Sync** — create Spotify sub-playlists and mirror to Tidal

Each step is exposed as a job through the FastAPI backend. Jobs stream progress and logs over SSE; the React UI in `cratekeeper-web/` is the primary control surface.

## Genre Buckets (18)

Tracks are classified into genre buckets in order of specificity (first match wins):

| # | Bucket | Example Tags |
|---|--------|-------------|
| 1 | Schlager | schlager, discofox, volksmusik |
| 2 | Drum & Bass | drum and bass, jungle, liquid dnb |
| 3 | Hardstyle | hardstyle, hardcore, gabber |
| 4 | Melodic Techno | melodic techno, indie dance |
| 5 | Techno | techno, hard techno, industrial techno |
| 6 | Minimal / Tech House | minimal techno, tech house |
| 7 | Deep House | deep house, organic house, tropical house |
| 8 | Progressive House | progressive house, progressive trance |
| 9 | Trance | trance, psytrance, uplifting trance |
| 10 | House | house, electro house, funky house, uk garage |
| 11 | EDM / Big Room | edm, big room, electro |
| 12 | Dance / Hands Up | dance, hands up, eurodance |
| 13 | Hip-Hop / R&B | hip hop, rap, r&b, trap |
| 14 | Latin / Global | reggaeton, latin, salsa, bachata |
| 15 | Disco / Funk / Soul | disco, funk, soul, motown |
| 16 | Rock | rock, indie, alternative, punk |
| 17 | Ballads / Slow | ballad, slow, acoustic, singer-songwriter |
| 18 | Pop | pop, dance pop, europop (fallback) |

Era (80s, 90s, 2000s, Oldschool) is derived from release year and stored as a comment tag, not a genre bucket.

## Tag System

The LLM tag-classification job assigns structured tags based on audio analysis + metadata:

| Tag | Values | Description |
|-----|--------|-------------|
| **energy** | low, mid, high | Energy level for set planning |
| **function** | floorfiller, singalong, bridge, reset, closer, opener | Role in a DJ set |
| **crowd** | mixed-age, older, younger, family | Target audience |
| **mood** | feelgood, emotional, euphoric, nostalgic, romantic, melancholic, dark, aggressive, uplifting, dreamy, funky, groovy | Emotional tone |

Tags are written into the ID3 comment field (MP3) or comment tag (FLAC):
```
era:90s; energy:high; function:floorfiller,singalong; crowd:mixed-age; mood:feelgood,euphoric
```

Additional audio metadata written to tags:
- **Genre** (TCON / genre) — bucket name
- **BPM** (TBPM / bpm) — beats per minute from essentia
- **Key** (TKEY / initialkey) — musical key (e.g., "C minor")

## Audio Analysis (essentia)

The `analyze` job extracts features via Docker (essentia requires Linux x86_64):

**Basic features** (built-in essentia algorithms):
- BPM (RhythmExtractor2013)
- Energy (RMS, normalized 0-1)
- Danceability (0-1)
- Loudness (LUFS)
- Key + scale (KeyExtractor, EDMA profile for electronic music)

**ML features** (essentia-tensorflow, pre-trained models):
- Mood classifiers: happy, party, relaxed, sad, aggressive (0-1 probability each, discogs-effnet)
- Arousal / Valence (1-9 scale, DEAM model via msd-musicnn)
- Voice / Instrumental detection (discogs-effnet)
- ML Danceability (discogs-effnet, more accurate than built-in)

All audio data is stored alongside the event and fed to the LLM for informed tag assignment.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | For tag classification | — | Anthropic API key |
| `OPENAI_API_KEY` | If using OpenAI provider | — | OpenAI API key |
| `DATABASE_URL` | No | `postgresql://dj:dj@localhost:5432/djlib` | PostgreSQL connection |
| `CRATEKEEPER_DB_URL` | No | derived from above | API DB URL (psycopg driver) |
| `CRATEKEEPER_FERNET_KEY` | Yes (prod) | — | Fernet key for the secrets store |
| `CRATEKEEPER_API_TOKEN` | Yes (prod) | — | Bearer token for API auth |
| `CRATEKEEPER_CORS_ORIGINS` | No | — | Comma-separated origins for CORS |
| `ESSENTIA_MODELS_DIR` | No | `/app/models` | Directory for TF model files |

## MCP Servers

The MCP servers are kept as a credential source for the API and as standalone tools for Copilot/Claude Desktop. They are **not** required to run the web app once credentials are seeded.

### Spotify MCP (29 tools)

| Category | Tools |
|----------|-------|
| Search & Discovery | Search tracks/albums/artists/playlists |
| Playlist Management | Create, update, add/remove/reorder tracks |
| Track Analysis | Audio features (BPM, key, energy, danceability), artist genres |
| Playback Control | Play, pause, skip, queue, volume, devices |
| Library | Saved tracks, saved albums, recently played |

### Tidal MCP (19 tools)

| Category | Tools |
|----------|-------|
| Search & Discovery | Search tracks/albums/artists, track/artist details |
| Playlist Management | Create, update, add/remove tracks, add by ISRC, merge |
| Albums | Get album details/tracks, save/remove albums |
| Favorites | Get/add/remove favorite tracks, artists, albums |

## Design Decisions

- **18 genre buckets** — specific enough for electronic sub-genres, broad enough to keep folders manageable
- **Era as tag, not genre** — "Yeah!" by Usher belongs in Hip-Hop/R&B, not "2000s"
- **Flat folder structure** (`Genre/`) — no mood sub-folders; tags in the comment field are searchable in djay PRO
- **LLM for semantic tags** — audio analysis provides objective data, the LLM interprets it contextually (a "sad" ballad vs. a "sad" techno track serve different functions)
- **Batch processing** — LLM classifies 15 tracks at a time for efficiency
- **Docker for essentia only** — essentia + TF require Linux x86_64; everything else runs natively on macOS
- **Master playlist naming** — `[DJ] Genre` pattern for cross-event playlists
- **ISRC-first matching** — most reliable way to match Spotify tracks to local files

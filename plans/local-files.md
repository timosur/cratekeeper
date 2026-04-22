# Plan: Lokale DJ-Bibliothek mit Mood-Klassifizierung

## TL;DR

Umbau des DJ-CLI von Spotify-Playlist-Erstellung auf ein lokales Dateisystem-basiertes System. Zentrale Master-Bibliothek auf NAS (`smb://192.168.1.26/home/Music/Library`) organisiert nach **Genre → Mood → Datei**. Event-Ordner (`~/Music/DJ-Events/`) enthalten nur Symlinks in die Master-Bibliothek. Mood-Erkennung via **essentia** (lokal, open-source Audio-Analyse). Matching von Spotify-Wish-Playlist-Tracks zu lokalen Dateien über mehrstufige Strategie (ISRC, Artist+Title, Fuzzy).

---

## Ordnerstruktur

### Master-Bibliothek (NAS)
```
/Music/Library/
├── House/
│   ├── Chill/
│   │   └── Artist - Title.flac
│   ├── Groovy/
│   ├── Energetic/
│   └── Peak/
├── Techno/
│   ├── Warm-Up/
│   ├── Driving/
│   └── Peak/
├── Rock/
│   ├── Chill/
│   ├── Energetic/
│   └── ...
└── ...
```

### Event-Ordner (Symlinks)
```
~/Music/DJ-Events/
└── Wedding-Tim-Lea-2026-04-22/
    ├── House/
    │   ├── Chill/
    │   │   └── Artist - Title.flac → /Music/Library/House/Chill/Artist - Title.flac
    │   └── Energetic/
    │       └── ...
    ├── Rock/
    └── _missing.txt   ← Tracks die lokal nicht gefunden wurden
```

### Moods (5-6 Kategorien)
- **Chill** — ambient, downtempo, lounge
- **Warm-Up** — leicht groovend, einstimmend
- **Groovy** — mittelenergetisch, tanzbar
- **Energetic** — hochenergetisch, uptempo
- **Peak** — maximale Energie, Drop-heavy
- **Romantic** — emotional, balladesk (optional, event-abhängig)

Mood wird durch essentia Audio-Features bestimmt:
- `energy`, `danceability` → Energielevel
- `bpm` → Tempo-Einordnung
- `valence`/`mood` → emotional vs. euphorisch
- Thresholds pro Genre (Techno "Chill" ≠ Pop "Chill")

---

## Phasen

### Phase 1: Track-Matching Engine
**Ziel:** Spotify-Tracks aus Wish-Playlist zu lokalen Dateien matchen.

1. **NAS-Scanner** — Rekursiv alle Audio-Dateien auf NAS indizieren (Pfad, ID3-Tags: Artist, Title, Album, ISRC, Jahr, Dauer). Cache als JSON/SQLite.
   - Dateien: `dj_cli/local_scanner.py`
   - Dependencies: `mutagen` (liest ID3/FLAC/WAV-Tags)
   - CLI: `dj scan <nas-pfad>` → erzeugt `data/local-library.json`

2. **Multi-Strategie-Matcher** — Matcht Spotify-Tracks gegen lokalen Index:
   - Stufe 1: ISRC exact match (wenn vorhanden)
   - Stufe 2: Artist + Title exact match (normalisiert)
   - Stufe 3: Fuzzy match auf Artist + Title (Levenshtein, threshold >85%)
   - Stufe 4: Unmatched → `_missing.txt`
   - Datei: `dj_cli/matcher.py`
   - Dependencies: `thefuzz` (fuzzy string matching)
   - CLI: `dj match <classified.json> --library data/local-library.json`

**Output:** Classified JSON enriched mit `local_path` pro Track + Missing-Report

### Phase 2: Mood-Analyse via essentia
**Ziel:** Jeden Track in der Master-Bibliothek mit einem Mood taggen.

3. **essentia Mood-Analyzer** — Analysiert lokale Audio-Dateien:
   - Extrahiert: BPM, energy, danceability, valence, spectral features
   - Mappt Features → Mood-Kategorie (genre-abhängige Thresholds)
   - Datei: `dj_cli/mood_analyzer.py`
   - Dependency: `essentia` (oder `essentia-tensorflow` für ML-basierte Mood-Models)
   - CLI: `dj analyze-mood <pfad-oder-library.json>` → enriched Track-Daten mit mood

4. **Mood-Thresholds definieren** — Config-Datei mit genre-spezifischen Schwellwerten:
   - Datei: `dj_cli/mood_config.py`
   - Beispiel: Techno Peak = BPM>138 + energy>0.8; House Chill = BPM<118 + energy<0.4

### Phase 3: Ordnerstruktur & Symlinks
**Ziel:** Master-Bibliothek organisieren und Event-Ordner mit Symlinks bauen.

5. **Master-Bibliothek Builder** — Verschiebt/kopiert Dateien in Genre/Mood-Struktur auf NAS:
   - Datei: `dj_cli/library_builder.py`
   - CLI: `dj build-library --source <scan-ergebnis> --target <nas-library-pfad>`
   - Verschiebt Dateien in `Genre/Mood/Artist - Title.ext`

6. **Event-Ordner mit Symlinks** — Für ein klassifiziertes Event:
   - Datei: `dj_cli/event_builder.py`
   - CLI: `dj build-event <classified.json> --output ~/Music/DJ-Events/<event-name>/`
   - Erstellt Genre/Mood-Ordner mit Symlinks zu Master-Bibliothek
   - Erzeugt `_missing.txt` für nicht-gematchte Tracks

### Phase 4: ID3-Tag-Enrichment
**Ziel:** MP3/FLAC-Tags mit Dekade, Genre-Bucket, Mood ergänzen.

7. **Tag-Writer** — Schreibt/aktualisiert ID3-Tags:
   - Datei: `dj_cli/tag_writer.py`
   - CLI: `dj tag <pfad-oder-library.json>`
   - Setzt: Genre → Bucket-Name, Mood → Mood-Kategorie, Era/Grouping → "2000s", Comment → "classified by dj-cli"
   - Dependencies: `mutagen`

---

## Relevante Dateien

### Bestehend (zu modifizieren)
- `dj_cli/models.py` — Track-Model erweitern: `local_path: Path | None`, `mood: str | None`, `era: str | None`
- `dj_cli/cli.py` — Neue Commands: `scan`, `match`, `analyze-mood`, `build-library`, `build-event`, `tag`
- `pyproject.toml` — Dependencies: `mutagen`, `essentia`, `thefuzz`

### Neu
- `dj_cli/local_scanner.py` — NAS/Ordner-Scanner, ID3-Tag-Leser
- `dj_cli/matcher.py` — Multi-Strategie Track-Matcher
- `dj_cli/mood_analyzer.py` — essentia-basierte Mood-Analyse
- `dj_cli/mood_config.py` — Genre-spezifische Mood-Thresholds
- `dj_cli/library_builder.py` — Master-Bibliothek Ordnerstruktur
- `dj_cli/event_builder.py` — Event-Ordner mit Symlinks
- `dj_cli/tag_writer.py` — ID3-Tag-Writer

---

## Workflow (End-to-End für ein Event)

```
1. dj scan smb://192.168.1.26/home/Music/Library    → data/local-library.json
2. dj fetch <spotify-wish-playlist>                   → data/event.json
3. dj enrich data/event.json                          → MusicBrainz genres
4. dj classify data/event.json                        → data/event.classified.json
5. dj match data/event.classified.json                → matched mit local_path
6. dj analyze-mood data/event.classified.json         → mood pro Track
7. dj build-event data/event.classified.json \
     --output ~/Music/DJ-Events/Wedding-Tim-Lea/      → Symlink-Ordner
8. dj tag data/event.classified.json                  → ID3-Tags aktualisiert
```

---

## Verification

1. `dj scan` auf Test-Ordner mit 10 Dateien → prüfen ob alle Formate (MP3/FLAC/WAV) erkannt werden
2. `dj match` mit bekannten Tracks → ISRC-Match, Artist+Title-Match, Fuzzy-Match jeweils testen
3. `dj analyze-mood` auf Tracks verschiedener Genres → prüfen ob Mood-Zuordnung sinnvoll
4. `dj build-event` → prüfen ob Symlinks gültig sind und auf existierende Dateien zeigen
5. `dj tag` → Tags mit `mutagen` zurücklesen und verifizieren
6. Gesamter Workflow durchspielen mit Hochzeitsmäuse-Playlist

## Entscheidungen

- **essentia** statt Spotify Audio Features → lokal, kein API-Limit, funktioniert offline
- **Symlinks** statt Kopien → spart Speicherplatz, Master bleibt Single Source of Truth
- **Genre/Mood/Datei** Hierarchie → DJ-freundlich, Genre zuerst für Set-Planung
- **Dekade nur in ID3-Tags** (nicht im Dateinamen) → saubere Dateinamen
- **min_votes=2 für MusicBrainz** bleibt bestehen → bewährt sich
- **Fehlende Tracks** → Report-Datei `_missing.txt`, manuell beschaffen

## Offene Punkte

1. **NAS-Mount**: SMB-Share muss gemountet sein. Scanner arbeitet auf gemounteten Pfad (z.B. `/Volumes/home/Music/Library`). Kein SMB-Protokoll direkt.
2. **essentia Installation**: essentia hat C++-Dependencies, kann auf macOS tricky sein. Alternative: `essentia-tensorflow` via pip oder Docker-Container für Analyse.
3. **Master-Bibliothek Initial-Befüllung**: Erste Sortierung der bestehenden Dateien — sollen existierende Dateien verschoben oder kopiert werden? (Empfehlung: verschieben, spart Platz)

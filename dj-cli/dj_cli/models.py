"""Data models for DJ CLI pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any
import json
from pathlib import Path


@dataclass
class Track:
    """A single track with Spotify metadata and classification info."""

    id: str
    name: str
    artists: list[str]
    artist_ids: list[str]
    album: str
    duration_ms: int
    isrc: str | None = None
    release_year: int | None = None
    artist_genres: list[str] = field(default_factory=list)
    bucket: str | None = None
    confidence: str = "high"  # high, medium, low

    def display_name(self) -> str:
        return f'"{self.name}" by {", ".join(self.artists)}'


@dataclass
class EventPlan:
    """Full plan for an event — tracks, classification, created playlists."""

    source_playlist_id: str
    source_playlist_name: str
    tracks: list[Track] = field(default_factory=list)
    event_name: str | None = None
    event_date: str | None = None
    created_playlists: dict[str, str] = field(default_factory=dict)  # bucket -> playlist_id
    tidal_playlists: dict[str, str] = field(default_factory=dict)  # bucket -> tidal_playlist_id

    def save(self, path: Path) -> None:
        data = asdict(self)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    @classmethod
    def load(cls, path: Path) -> EventPlan:
        data = json.loads(path.read_text())
        tracks = [Track(**t) for t in data.pop("tracks", [])]
        return cls(tracks=tracks, **data)

    def bucket_summary(self) -> dict[str, list[Track]]:
        """Group tracks by bucket."""
        buckets: dict[str, list[Track]] = {}
        for track in self.tracks:
            bucket = track.bucket or "Unclassified"
            buckets.setdefault(bucket, []).append(track)
        return dict(sorted(buckets.items(), key=lambda x: -len(x[1])))

"""Rule-based genre classification for tracks."""

from __future__ import annotations

from dj_cli.genre_buckets import FALLBACK_BUCKET, GenreBucket, get_buckets
from dj_cli.models import Track


def classify_track(track: Track, buckets: list[GenreBucket] | None = None) -> tuple[str, str]:
    """Classify a single track into a genre bucket.

    Returns (bucket_name, confidence).
    Confidence: "high" if genre tags match, "medium" if year match, "low" if fallback.
    """
    if buckets is None:
        buckets = get_buckets()

    genres_lower = [g.lower() for g in track.artist_genres]

    # Pass 1: Match genre tags (sorted by priority)
    for bucket in buckets:
        for tag in bucket.genre_tags:
            for genre in genres_lower:
                if tag in genre or genre in tag:
                    return bucket.name, "high"

    # Pass 2: Match by release year (for era buckets)
    if track.release_year:
        for bucket in buckets:
            if bucket.year_range:
                min_year, max_year = bucket.year_range
                if min_year <= track.release_year <= max_year:
                    return bucket.name, "medium"

    # Fallback
    return FALLBACK_BUCKET, "low"


def classify_tracks(tracks: list[Track], buckets: list[GenreBucket] | None = None) -> list[Track]:
    """Classify all tracks and set their bucket + confidence fields.

    Returns the same tracks list (mutated).
    """
    if buckets is None:
        buckets = get_buckets()

    for track in tracks:
        bucket_name, confidence = classify_track(track, buckets)
        track.bucket = bucket_name
        track.confidence = confidence

    return tracks


def consolidate_small_buckets(tracks: list[Track], min_size: int = 3) -> list[Track]:
    """Merge buckets with fewer than min_size tracks into the fallback bucket.

    Returns the same tracks list (mutated).
    """
    # Count tracks per bucket
    counts: dict[str, int] = {}
    for track in tracks:
        bucket = track.bucket or FALLBACK_BUCKET
        counts[bucket] = counts.get(bucket, 0) + 1

    # Find small buckets
    small_buckets = {b for b, count in counts.items() if count < min_size and b != FALLBACK_BUCKET}

    # Merge into fallback
    for track in tracks:
        if track.bucket in small_buckets:
            track.bucket = FALLBACK_BUCKET
            track.confidence = "low"

    return tracks

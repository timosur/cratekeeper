"""LLM-based tag classification for DJ tracks.

Sends batches of tracks (with audio analysis data) to an LLM
to classify energy, function, crowd, and mood tags.
Optionally suggests genre re-assignments.

Supported providers: anthropic (default), openai.
"""

from __future__ import annotations

import json

from cratekeeper.genre_buckets import get_buckets
from cratekeeper.models import Track

# Valid tag values the LLM must pick from
VALID_TAGS = {
    "energy": ["low", "mid", "high"],
    "function": ["floorfiller", "singalong", "bridge", "reset", "closer", "opener"],
    "crowd": ["mixed-age", "older", "younger", "family"],
    "mood_tags": [
        "feelgood", "emotional", "euphoric", "nostalgic",
        "romantic", "melancholic", "dark", "aggressive",
        "uplifting", "dreamy", "funky", "groovy",
    ],
}

BUCKET_NAMES = [b.name for b in get_buckets()]

SYSTEM_PROMPT = f"""\
You are a professional wedding & event DJ assistant. Your job is to classify \
tracks with structured tags based on their metadata and audio analysis.

For each track you MUST return a JSON object with these fields:
- "energy": one of {VALID_TAGS["energy"]}
- "function": list from {VALID_TAGS["function"]} (1-3 values)
- "crowd": list from {VALID_TAGS["crowd"]} (1-2 values)
- "mood_tags": list from {VALID_TAGS["mood_tags"]} (1-3 values)
- "genre_suggestion": null, or a genre name from {BUCKET_NAMES} if you think \
the current bucket is wrong

Rules:
- Use the audio analysis data (BPM, energy, danceability, mood scores, \
arousal/valence) to inform your choices, not just track name/artist.
- "floorfiller" = guaranteed dance track for a wide audience.
- "singalong" = tracks most people know the lyrics to and will sing.
- "bridge" = transitional track between energy levels or genres.
- "reset" = palate cleanser, calm moment.
- "opener" / "closer" = suitable for opening or closing a set segment.
- For crowd: "mixed-age" means works for all ages (20s to 60s), "older" skews \
40+, "younger" skews under 30, "family" is safe for kids present.
- Only suggest a genre_suggestion if the current bucket is clearly wrong.

Return a JSON array with one object per track, in the same order as the input. \
No extra text, just the JSON array."""


def _build_track_payload(track: Track) -> dict:
    """Build a compact representation of a track for the LLM prompt."""
    return {
        "name": track.name,
        "artists": track.artists,
        "album": track.album,
        "year": track.release_year,
        "era": track.era,
        "genres": track.artist_genres[:5],
        "bucket": track.bucket,
        "bpm": track.bpm,
        "key": track.key,
        "danceability": track.danceability,
        "audio_energy": track.audio_energy,
        "audio_mood": track.audio_mood,
        "arousal": track.arousal,
        "valence": track.valence,
    }


def _call_anthropic(messages: list[dict], model: str) -> str:
    """Call Anthropic API and return the text response."""
    import anthropic

    client = anthropic.Anthropic()
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text


def _call_openai(messages: list[dict], model: str) -> str:
    """Call OpenAI API and return the text response."""
    import openai

    client = openai.OpenAI()
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        temperature=0.3,
    )
    return response.choices[0].message.content


def _parse_response(raw: str, batch_size: int) -> list[dict]:
    """Parse LLM response JSON, stripping markdown fences if present."""
    text = raw.strip()
    if text.startswith("```"):
        # Strip ```json ... ```
        lines = text.split("\n")
        text = "\n".join(lines[1:])
        if text.endswith("```"):
            text = text[:-3]
    result = json.loads(text)
    if not isinstance(result, list) or len(result) != batch_size:
        raise ValueError(f"Expected array of {batch_size}, got {type(result).__name__} len={len(result) if isinstance(result, list) else '?'}")
    return result


def _validate_and_apply(track: Track, tags: dict) -> list[str]:
    """Apply validated tags to a track. Returns list of warnings."""
    warnings = []

    # Energy
    energy = tags.get("energy")
    if energy in VALID_TAGS["energy"]:
        track.energy = energy
    else:
        warnings.append(f"invalid energy: {energy}")

    # Function
    funcs = tags.get("function", [])
    track.function = [f for f in funcs if f in VALID_TAGS["function"]]
    if len(track.function) != len(funcs):
        warnings.append(f"filtered invalid functions: {set(funcs) - set(track.function)}")

    # Crowd
    crowd = tags.get("crowd", [])
    track.crowd = [c for c in crowd if c in VALID_TAGS["crowd"]]
    if len(track.crowd) != len(crowd):
        warnings.append(f"filtered invalid crowd: {set(crowd) - set(track.crowd)}")

    # Mood tags
    mood_tags = tags.get("mood_tags", [])
    track.mood_tags = [m for m in mood_tags if m in VALID_TAGS["mood_tags"]]
    if len(track.mood_tags) != len(mood_tags):
        warnings.append(f"filtered invalid mood_tags: {set(mood_tags) - set(track.mood_tags)}")

    # Genre suggestion
    suggestion = tags.get("genre_suggestion")
    if suggestion and suggestion in BUCKET_NAMES and suggestion != track.bucket:
        warnings.append(f"genre re-assignment: {track.bucket} → {suggestion}")
        track.bucket = suggestion

    return warnings


def classify_batch(
    tracks: list[Track],
    provider: str = "anthropic",
    model: str | None = None,
) -> list[list[str]]:
    """Classify a batch of tracks via LLM.

    Returns a list of warning lists (one per track).
    """
    if not model:
        model = "claude-sonnet-4-20250514" if provider == "anthropic" else "gpt-4o"

    payloads = [_build_track_payload(t) for t in tracks]
    user_msg = json.dumps(payloads, ensure_ascii=False)

    if provider == "anthropic":
        raw = _call_anthropic([{"role": "user", "content": user_msg}], model)
    elif provider == "openai":
        raw = _call_openai([{"role": "user", "content": user_msg}], model)
    else:
        raise ValueError(f"Unknown provider: {provider}")

    results = _parse_response(raw, len(tracks))

    all_warnings = []
    for track, tags in zip(tracks, results):
        warnings = _validate_and_apply(track, tags)
        all_warnings.append(warnings)

    return all_warnings


def classify_tracks(
    tracks: list[Track],
    provider: str = "anthropic",
    model: str | None = None,
    batch_size: int = 15,
    progress_callback=None,
) -> tuple[int, int]:
    """Classify all tracks in batches via LLM.

    Returns (success_count, error_count).
    """
    success = 0
    errors = 0

    for start in range(0, len(tracks), batch_size):
        batch = tracks[start : start + batch_size]
        try:
            warnings = classify_batch(batch, provider=provider, model=model)
            for track, warns in zip(batch, warnings):
                success += 1
                if progress_callback:
                    progress_callback(start + success, len(tracks), track, warns)
        except Exception as e:
            errors += len(batch)
            if progress_callback:
                for track in batch:
                    progress_callback(start + errors, len(tracks), track, [f"batch error: {e}"])

    return success, errors

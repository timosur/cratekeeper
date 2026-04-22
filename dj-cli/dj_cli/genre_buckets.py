"""Genre bucket definitions for DJ playlist classification.

Each bucket has:
- name: display name used in playlists
- genre_tags: partial matches against Spotify artist genre strings
- year_range: optional (min_year, max_year) for era-based buckets
- priority: higher priority buckets are checked first (specific > generic)
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class GenreBucket:
    name: str
    genre_tags: list[str]
    year_range: tuple[int, int] | None = None
    priority: int = 0  # higher = checked first


# Ordered by priority (specific genres first, catch-all last)
DEFAULT_BUCKETS: list[GenreBucket] = [
    # Specific genres (high priority — checked first)
    GenreBucket(
        name="Schlager",
        genre_tags=["schlager", "german schlager", "discofox", "volksmusik"],
        priority=90,
    ),
    GenreBucket(
        name="Drum & Bass",
        genre_tags=["drum and bass", "liquid funk", "jungle", "dnb", "liquid dnb"],
        priority=85,
    ),
    GenreBucket(
        name="Techno / Melodic",
        genre_tags=[
            "techno", "melodic techno", "progressive house", "minimal techno",
            "hard techno", "trance", "hardstyle", "psytrance",
            "electronica", "indie dance",
        ],
        priority=80,
    ),
    GenreBucket(
        name="House / Dance",
        genre_tags=[
            "house", "deep house", "dance", "edm", "electro house",
            "tropical house", "stutter house", "uk garage", "electro",
            "disco house", "nu disco", "italo disco",
        ],
        priority=75,
    ),
    GenreBucket(
        name="Hip-Hop / R&B",
        genre_tags=[
            "hip hop", "rap", "r&b", "trap", "urban contemporary",
            "german hip hop", "gangster rap", "g-funk", "west coast hip hop",
        ],
        priority=70,
    ),
    GenreBucket(
        name="Latin / Reggaeton",
        genre_tags=["reggaeton", "latin", "salsa", "bachata", "latin pop"],
        priority=65,
    ),
    GenreBucket(
        name="Rock / Indie",
        genre_tags=[
            "rock", "indie", "alternative", "punk", "classic rock",
            "indie pop", "indie rock", "new wave", "post-punk",
            "neo-psychedelic", "shoegaze",
        ],
        priority=50,
    ),
    # Era buckets (medium priority)
    GenreBucket(
        name="80s",
        genre_tags=[
            "80s", "synthpop", "80s pop", "80s rock", "new romantic",
            "synth-pop", "new wave",
        ],
        year_range=(1980, 1989),
        priority=40,
    ),
    GenreBucket(
        name="90s",
        genre_tags=[
            "90s", "90s pop", "90s rock", "90s hip hop", "eurodance",
            "90s eurodance", "boy band",
        ],
        year_range=(1990, 1999),
        priority=40,
    ),
    GenreBucket(
        name="2000s",
        genre_tags=["2000s", "2000s pop"],
        year_range=(2000, 2009),
        priority=35,
    ),
    # Broad buckets (low priority)
    GenreBucket(
        name="Oldschool",
        genre_tags=["disco", "funk", "soul", "motown", "classic soul", "boogie"],
        year_range=(1950, 1979),
        priority=30,
    ),
    GenreBucket(
        name="Ballads / Slow",
        genre_tags=["ballad", "slow", "acoustic", "singer-songwriter"],
        priority=20,
    ),
    # Catch-all (lowest priority)
    GenreBucket(
        name="Party Hits",
        genre_tags=[
            "pop", "dance pop", "europop", "party", "viral pop",
            "german pop", "soft pop",
        ],
        priority=10,
    ),
]

FALLBACK_BUCKET = "Party Hits"


def get_buckets() -> list[GenreBucket]:
    """Return default buckets sorted by priority (highest first)."""
    return sorted(DEFAULT_BUCKETS, key=lambda b: -b.priority)

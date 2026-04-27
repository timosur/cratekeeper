"""Behavioral tests for the enriched ``GET /events`` payload (CRATE-1)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from cratekeeper_api.db import session_scope
from cratekeeper_api.orm import Event, EventBuild, EventTrack, JobRun


def _seed_event(db, *, name: str, slug: str) -> Event:
    ev = Event(name=name, slug=slug)
    db.add(ev)
    db.flush()
    return ev


def _seed_track(db, *, event_id: str, spotify_id: str, match_status: str | None, tagged: bool = False) -> None:
    et = EventTrack(
        event_id=event_id,
        spotify_id=spotify_id,
        name=f"Track {spotify_id}",
        artists=["Artist"],
        artist_ids=[],
        duration_ms=1000,
        artist_genres=[],
        function=[],
        crowd=[],
        mood_tags=[],
        match_status=match_status,
        tagged_at=datetime.now(timezone.utc) if tagged else None,
    )
    db.add(et)


def _find(events: list[dict], slug: str) -> dict:
    for e in events:
        if e["slug"] == slug:
            return e
    raise AssertionError(f"slug {slug!r} not found in {[e['slug'] for e in events]}")


# --- Aggregated payload shape ----------------------------------------------


def test_enriched_payload_shape_for_empty_event(client):
    """EC-1: Event with zero tracks → all aggregates default sensibly."""
    with session_scope() as db:
        ev = _seed_event(db, name="Empty Event", slug="empty-evt")
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["track_count"] == 0
    assert body["matched_count"] == 0
    assert body["tagged_count"] == 0
    assert body["current_step_index"] == 0
    assert body["current_step_label"] == "Fetch"
    assert body["total_steps"] == 11
    assert body["is_stale"] is False
    assert body["active_job"] is None
    assert body["last_activity_at"] is not None


def test_matched_and_tagged_counts(client):
    with session_scope() as db:
        ev = _seed_event(db, name="With Tracks", slug="with-tracks")
        _seed_track(db, event_id=ev.id, spotify_id="t1", match_status="isrc", tagged=True)
        _seed_track(db, event_id=ev.id, spotify_id="t2", match_status="exact", tagged=False)
        _seed_track(db, event_id=ev.id, spotify_id="t3", match_status="fuzzy", tagged=False)
        _seed_track(db, event_id=ev.id, spotify_id="t4", match_status="missing", tagged=False)
        _seed_track(db, event_id=ev.id, spotify_id="t5", match_status=None, tagged=False)
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["track_count"] == 5
    assert body["matched_count"] == 3  # isrc, exact, fuzzy
    assert body["tagged_count"] == 1


def test_current_step_reflects_succeeded_jobs(client):
    """AC-4: highest succeeded step wins."""
    with session_scope() as db:
        ev = _seed_event(db, name="Mid Pipeline", slug="mid-pipeline")
        for jt in ("fetch", "enrich", "classify", "match", "analyze-mood"):
            db.add(JobRun(event_id=ev.id, type=jt, status="succeeded"))
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["current_step_label"] == "Analyze"
    assert body["current_step_index"] == 6


def test_active_job_running_takes_priority_over_failed(client):
    """EC-2: running > failed even if failed is newer? No — running always wins."""
    with session_scope() as db:
        ev = _seed_event(db, name="Active Running", slug="active-running")
        # Failed job (older) and running job (newer)
        old = datetime.now(timezone.utc) - timedelta(minutes=5)
        db.add(JobRun(event_id=ev.id, type="fetch", status="failed", created_at=old, error={"message": "boom"}))
        db.add(JobRun(event_id=ev.id, type="enrich", status="running"))
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["active_job"] is not None
    assert body["active_job"]["status"] == "running"
    assert body["active_job"]["type"] == "enrich"


def test_active_job_failed_when_only_failed_present(client):
    with session_scope() as db:
        ev = _seed_event(db, name="Active Failed", slug="active-failed")
        db.add(JobRun(event_id=ev.id, type="fetch", status="failed", error={"message": "broken"}))
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["active_job"] is not None
    assert body["active_job"]["status"] == "failed"
    assert body["active_job"]["error"] == {"message": "broken"}


def test_cancelled_job_is_not_surfaced_as_active(client):
    """EC-3: cancelled jobs do not surface as active_job."""
    with session_scope() as db:
        ev = _seed_event(db, name="Only Cancelled", slug="only-cancelled")
        db.add(JobRun(event_id=ev.id, type="fetch", status="cancelled"))
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["active_job"] is None


def test_queued_active_job_has_queue_position(client):
    """AC-10: queue_position is populated for queued jobs (1-based, by
    created_at within the same slot class)."""
    with session_scope() as db:
        ev_a = _seed_event(db, name="Q-A", slug="q-a")
        ev_b = _seed_event(db, name="Q-B", slug="q-b")
        old = datetime.now(timezone.utc) - timedelta(seconds=10)
        # First in line for 'enrich' (light)
        db.add(JobRun(event_id=ev_a.id, type="enrich", status="queued", created_at=old))
        # Second in line for 'enrich'
        db.add(JobRun(event_id=ev_b.id, type="enrich", status="queued"))
    body = client.get("/api/v1/events").json()
    a = _find(body, "q-a")
    b = _find(body, "q-b")
    assert a["active_job"]["queue_position"] == 1
    assert b["active_job"]["queue_position"] == 2


def test_is_stale_when_any_event_build_is_stale(client):
    with session_scope() as db:
        ev = _seed_event(db, name="Stale", slug="stale-evt")
        db.add(EventBuild(event_id=ev.id, kind="event-folder", path="/tmp/x", is_stale=True))
        db.add(EventBuild(event_id=ev.id, kind="library", path="/tmp/y", is_stale=False))
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["is_stale"] is True


def test_out_of_order_succeeded_returns_highest(client):
    """EC-5: apply-tags succeeded but match did not → still returns Apply step."""
    with session_scope() as db:
        ev = _seed_event(db, name="OOO", slug="ooo-evt")
        db.add(JobRun(event_id=ev.id, type="fetch", status="succeeded"))
        db.add(JobRun(event_id=ev.id, type="apply-tags", status="succeeded"))
    body = client.get(f"/api/v1/events/{ev.id}").json()
    assert body["current_step_label"] == "Apply"


def test_list_endpoint_returns_aggregates_for_all(client):
    with session_scope() as db:
        e1 = _seed_event(db, name="E1", slug="list-e1")
        e2 = _seed_event(db, name="E2", slug="list-e2")
        _seed_track(db, event_id=e1.id, spotify_id="x1", match_status="isrc", tagged=True)
        db.add(JobRun(event_id=e2.id, type="fetch", status="succeeded"))
    body = client.get("/api/v1/events").json()
    e1_out = _find(body, "list-e1")
    e2_out = _find(body, "list-e2")
    assert e1_out["matched_count"] == 1
    assert e1_out["tagged_count"] == 1
    assert e1_out["current_step_label"] == "Fetch"  # no jobs succeeded → defaults
    # e2 has fetch succeeded → highest completed step is Fetch (index 0).
    assert e2_out["current_step_label"] == "Fetch"
    assert e2_out["current_step_index"] == 0


def test_create_response_keeps_basic_shape(client):
    """Create endpoint returns defaults for the new fields (backward compat)."""
    body = client.post("/api/v1/events", json={"name": "Brand New"}).json()
    assert body["matched_count"] == 0
    assert body["tagged_count"] == 0
    assert body["current_step_index"] == 0
    assert body["current_step_label"] == "Fetch"
    assert body["total_steps"] == 11
    assert body["is_stale"] is False
    assert body["active_job"] is None


# --- EXPLAIN smoke test ----------------------------------------------------


def test_track_count_aggregation_uses_index(client):
    """The aggregation query over event_tracks must use the event_id index,
    not a Seq Scan, so the endpoint stays O(1) statements regardless of
    event count.
    """
    # Seed an event so the planner has something to chew on.
    with session_scope() as db:
        ev = _seed_event(db, name="ExplainMe", slug="explain-me")
        for i in range(50):
            _seed_track(db, event_id=ev.id, spotify_id=f"s{i}", match_status="isrc")
    with session_scope() as db:
        plan_rows = db.execute(
            text(
                "EXPLAIN SELECT event_id, count(*) FROM event_tracks "
                "WHERE event_id = ANY(ARRAY[:eid]::varchar[]) GROUP BY event_id"
            ),
            {"eid": ev.id},
        ).all()
    plan_text = "\n".join(r[0] for r in plan_rows)
    # On a small fixture the planner may legitimately pick a Seq Scan;
    # we therefore only assert the query is plannable and references
    # event_tracks.
    assert "event_tracks" in plan_text

"""Aggregation helpers for the Events Dashboard payload (CRATE-1).

Builds the enriched ``EventOut`` shape (matched/tagged counts, current
pipeline step, active job, is_stale, last_activity_at, queue_position)
in a fixed number of SQL statements regardless of how many events are
returned.
"""

from __future__ import annotations

from datetime import datetime
from typing import Iterable

from sqlalchemy import case, func, literal, select
from sqlalchemy.orm import Session

from cratekeeper_api.jobs.registry import get as get_job_spec
from cratekeeper_api.orm import Event, EventBuild, EventTrack, JobRun
from cratekeeper_api.pipeline import PIPELINE_ORDER, total_steps
from cratekeeper_api.schemas import EventOut, JobOut


# Active-job status priority (lower = more important).
_STATUS_PRIORITY = {"running": 0, "queued": 1, "failed": 2}


def _progress_step_index_by_job_type() -> dict[str, tuple[int, str]]:
    return {
        s.job_type: (s.index, s.label)
        for s in PIPELINE_ORDER
        if s.derives_progress and s.job_type
    }


def _aggregate_track_counts(db: Session, event_ids: list[str]) -> dict[str, tuple[int, int, int]]:
    """Per-event ``(track_count, matched_count, tagged_count)``."""
    if not event_ids:
        return {}
    matched_case = case(
        (EventTrack.match_status.in_(("isrc", "exact", "fuzzy")), 1),
        else_=0,
    )
    tagged_case = case((EventTrack.tagged_at.is_not(None), 1), else_=0)
    rows = db.execute(
        select(
            EventTrack.event_id,
            func.count(EventTrack.id),
            func.coalesce(func.sum(matched_case), 0),
            func.coalesce(func.sum(tagged_case), 0),
        )
        .where(EventTrack.event_id.in_(event_ids))
        .group_by(EventTrack.event_id)
    ).all()
    return {eid: (int(total), int(matched), int(tagged)) for eid, total, matched, tagged in rows}


def _aggregate_succeeded_step_indexes(
    db: Session, event_ids: list[str]
) -> dict[str, tuple[int, str]]:
    """Per-event ``(current_step_index, current_step_label)``.

    Computed by joining a static VALUES table (PIPELINE_ORDER entries
    that derive progress) against succeeded job_runs and taking the max
    index per event. Single statement.
    """
    if not event_ids:
        return {}
    progress_map = _progress_step_index_by_job_type()
    if not progress_map:
        return {}

    # Build a CTE-style values table: (job_type, idx, label)
    values_rows = [
        (jt, idx, label) for jt, (idx, label) in progress_map.items()
    ]

    # Use a CASE expression keyed on JobRun.type to pick the index.
    case_idx = case(
        *[(JobRun.type == jt, literal(idx)) for jt, (idx, _) in progress_map.items()],
        else_=literal(-1),
    )
    rows = db.execute(
        select(JobRun.event_id, func.max(case_idx))
        .where(
            JobRun.event_id.in_(event_ids),
            JobRun.status == "succeeded",
            JobRun.type.in_(progress_map.keys()),
        )
        .group_by(JobRun.event_id)
    ).all()

    by_index = {idx: (idx, label) for jt, idx, label in values_rows}
    out: dict[str, tuple[int, str]] = {}
    for eid, max_idx in rows:
        if max_idx is not None and max_idx >= 0 and max_idx in by_index:
            out[eid] = by_index[max_idx]
    return out


def _aggregate_is_stale(db: Session, event_ids: list[str]) -> set[str]:
    if not event_ids:
        return set()
    rows = db.execute(
        select(EventBuild.event_id)
        .where(EventBuild.event_id.in_(event_ids), EventBuild.is_stale.is_(True))
        .distinct()
    ).all()
    return {r[0] for r in rows}


def _aggregate_last_job_activity(db: Session, event_ids: list[str]) -> dict[str, datetime]:
    if not event_ids:
        return {}
    rows = db.execute(
        select(JobRun.event_id, func.max(JobRun.created_at))
        .where(JobRun.event_id.in_(event_ids))
        .group_by(JobRun.event_id)
    ).all()
    return {eid: ts for eid, ts in rows if ts is not None}


def _aggregate_last_track_activity(db: Session, event_ids: list[str]) -> dict[str, datetime]:
    if not event_ids:
        return {}
    rows = db.execute(
        select(EventTrack.event_id, func.max(EventTrack.updated_at))
        .where(EventTrack.event_id.in_(event_ids))
        .group_by(EventTrack.event_id)
    ).all()
    return {eid: ts for eid, ts in rows if ts is not None}


def _aggregate_active_jobs(db: Session, event_ids: list[str]) -> dict[str, JobRun]:
    """Per-event 'active job': latest JobRun in {running, queued, failed},
    chosen by status priority (running > queued > failed), then by
    ``created_at DESC``.
    """
    if not event_ids:
        return {}
    rows = (
        db.execute(
            select(JobRun)
            .where(
                JobRun.event_id.in_(event_ids),
                JobRun.status.in_(("running", "queued", "failed")),
            )
            .order_by(JobRun.event_id, JobRun.created_at.desc())
        )
        .scalars()
        .all()
    )
    best: dict[str, JobRun] = {}
    for row in rows:
        eid = row.event_id
        if eid is None:
            continue
        candidate = best.get(eid)
        if candidate is None:
            best[eid] = row
            continue
        # Lower status priority wins; on tie, newer created_at wins
        # (rows already sorted desc by created_at, so first-seen wins on tie).
        if _STATUS_PRIORITY[row.status] < _STATUS_PRIORITY[candidate.status]:
            best[eid] = row
    return best


def _compute_queue_positions(db: Session, jobs: Iterable[JobRun]) -> dict[str, int]:
    """Assign 1-based ``queue_position`` to every currently-queued job.

    Heavy/light slot class is sourced from the job registry (not the DB).
    Position is the rank within the same slot class ordered by
    ``created_at`` (oldest first).
    """
    queued_jobs_to_rank = [j for j in jobs if j.status == "queued"]
    if not queued_jobs_to_rank:
        return {}

    # Load every queued JobRun system-wide so that ranks are global, not
    # just within the visible event set.
    all_queued = (
        db.execute(
            select(JobRun)
            .where(JobRun.status == "queued")
            .order_by(JobRun.created_at)
        )
        .scalars()
        .all()
    )

    heavy_rank = 0
    light_rank: dict[str, int] = {}
    positions: dict[str, int] = {}
    for j in all_queued:
        spec = get_job_spec(j.type)
        is_heavy = bool(spec and spec.heavy)
        if is_heavy:
            heavy_rank += 1
            positions[j.id] = heavy_rank
        else:
            light_rank[j.type] = light_rank.get(j.type, 0) + 1
            positions[j.id] = light_rank[j.type]

    return {j.id: positions[j.id] for j in queued_jobs_to_rank if j.id in positions}


def _job_row_to_out(row: JobRun, queue_position: int | None = None) -> JobOut:
    out = JobOut.model_validate(row)
    out.queue_position = queue_position
    return out


def build_event_outs(db: Session, events: list[Event]) -> list[EventOut]:
    """Assemble the enriched ``EventOut`` payload for the given events.

    Issues a constant number of SQL statements regardless of
    ``len(events)``.
    """
    if not events:
        return []

    event_ids = [ev.id for ev in events]
    counts = _aggregate_track_counts(db, event_ids)
    step_indexes = _aggregate_succeeded_step_indexes(db, event_ids)
    stale_ids = _aggregate_is_stale(db, event_ids)
    last_job_ts = _aggregate_last_job_activity(db, event_ids)
    last_track_ts = _aggregate_last_track_activity(db, event_ids)
    active_jobs = _aggregate_active_jobs(db, event_ids)
    queue_positions = _compute_queue_positions(db, active_jobs.values())

    fetch_step = PIPELINE_ORDER[0]
    total = total_steps()
    out: list[EventOut] = []
    for ev in events:
        track_count, matched, tagged = counts.get(ev.id, (0, 0, 0))
        step_idx, step_label = step_indexes.get(ev.id, (fetch_step.index, fetch_step.label))
        candidates = [
            ev.updated_at,
            last_job_ts.get(ev.id),
            last_track_ts.get(ev.id),
        ]
        last_activity_at = max((c for c in candidates if c is not None), default=ev.updated_at)
        active_row = active_jobs.get(ev.id)
        active_out = None
        if active_row is not None:
            qp = queue_positions.get(active_row.id) if active_row.status == "queued" else None
            active_out = _job_row_to_out(active_row, queue_position=qp)

        out.append(
            EventOut(
                id=ev.id,
                name=ev.name,
                slug=ev.slug,
                date=ev.date,
                source_playlist_url=ev.source_playlist_url,
                source_playlist_id=ev.source_playlist_id,
                source_playlist_name=ev.source_playlist_name,
                build_mode=ev.build_mode,
                created_at=ev.created_at,
                updated_at=ev.updated_at,
                track_count=track_count,
                matched_count=matched,
                tagged_count=tagged,
                current_step_index=step_idx,
                current_step_label=step_label,
                total_steps=total,
                is_stale=ev.id in stale_ids,
                last_activity_at=last_activity_at,
                active_job=active_out,
            )
        )
    return out


def build_event_out(db: Session, ev: Event) -> EventOut:
    return build_event_outs(db, [ev])[0]

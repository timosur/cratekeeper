"""Tests for the user-visible pipeline ordering primitive."""

from __future__ import annotations

from cratekeeper_api.db import session_scope
from cratekeeper_api.jobs.dependencies import PIPELINE_DEPENDENCIES
from cratekeeper_api.orm import Event, JobRun
from cratekeeper_api.pipeline import (
    PIPELINE_ORDER,
    current_step,
    step_by_job_type,
    total_steps,
)


def test_total_steps_is_eleven():
    assert total_steps() == 11


def test_pipeline_order_indexes_are_contiguous():
    for i, step in enumerate(PIPELINE_ORDER):
        assert step.index == i


def test_dependencies_dag_is_a_subset_of_pipeline_order():
    """Every event-scoped job_type in the DAG must appear in PIPELINE_ORDER.

    Library-/global-scoped jobs (refetch, scan-*, build-library, sync-*,
    undo-tags) are intentionally absent from the user-visible pipeline.
    """
    pipeline_job_types = {s.job_type for s in PIPELINE_ORDER if s.job_type}
    dag_job_types: set[str] = set(PIPELINE_DEPENDENCIES.keys())
    for prereqs in PIPELINE_DEPENDENCIES.values():
        dag_job_types.update(prereqs)
    library_scoped = {
        "refetch",
        "scan-incremental",
        "scan-full",
        "build-library",
        "sync-spotify",
        "sync-tidal",
        "undo-tags",
    }
    for jt in dag_job_types - library_scoped:
        assert jt in pipeline_job_types, f"{jt} in DAG but missing from PIPELINE_ORDER"


def test_current_step_no_jobs_returns_fetch():
    with session_scope() as db:
        ev = Event(name="empty", slug="empty-cs")
        db.add(ev)
        db.flush()
        idx, label = current_step(db, ev.id)
    assert (idx, label) == (0, "Fetch")


def test_current_step_returns_highest_succeeded():
    with session_scope() as db:
        ev = Event(name="mid", slug="mid-cs")
        db.add(ev)
        db.flush()
        for jt in ("fetch", "enrich", "classify", "match"):
            db.add(JobRun(event_id=ev.id, type=jt, status="succeeded"))
        db.flush()
        idx, label = current_step(db, ev.id)
    match_step = step_by_job_type("match")
    assert match_step is not None
    assert (idx, label) == (match_step.index, match_step.label)


def test_current_step_defensive_for_out_of_order_success():
    """If `apply-tags` succeeded but `match` did not, we still return the
    highest succeeded step (defensive — the dependency check is enforced
    elsewhere)."""
    with session_scope() as db:
        ev = Event(name="ooo", slug="ooo-cs")
        db.add(ev)
        db.flush()
        db.add(JobRun(event_id=ev.id, type="fetch", status="succeeded"))
        db.add(JobRun(event_id=ev.id, type="apply-tags", status="succeeded"))
        db.flush()
        idx, label = current_step(db, ev.id)
    apply_step = step_by_job_type("apply-tags")
    assert apply_step is not None
    assert (idx, label) == (apply_step.index, apply_step.label)


def test_current_step_ignores_non_succeeded_runs():
    with session_scope() as db:
        ev = Event(name="failing", slug="failing-cs")
        db.add(ev)
        db.flush()
        db.add(JobRun(event_id=ev.id, type="fetch", status="failed"))
        db.add(JobRun(event_id=ev.id, type="enrich", status="running"))
        db.flush()
        idx, label = current_step(db, ev.id)
    assert (idx, label) == (0, "Fetch")

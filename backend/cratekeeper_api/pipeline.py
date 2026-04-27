"""Canonical user-visible pipeline ordering.

This module answers the question **"where is this event in the
user-visible flow?"** — distinct from
:mod:`cratekeeper_api.jobs.dependencies`, which answers **"can I run X
now?"** (a DAG of prerequisites).

The two must remain consistent: every ``job_type`` referenced in
:data:`PIPELINE_DEPENDENCIES` must also appear in
:data:`PIPELINE_ORDER`. A unit test enforces this.

Two of the eleven steps do not map to a job type and exist only for the
operator's mental model:

- **Review** — the manual review of low-confidence classifications,
  performed in the Event Detail UI between ``classify`` and ``match``.
- **Scan** — the library scanner is library-scoped, not event-scoped,
  so it has no per-event success criterion.

Both are tagged ``derives_progress=False`` and are skipped when
deriving an event's current step from its job history.
"""

from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from cratekeeper_api.orm import JobRun


@dataclass(frozen=True)
class PipelineStep:
    """A single user-visible pipeline step."""

    index: int
    label: str
    job_type: str | None
    derives_progress: bool = True


# Canonical order matches the pipeline section in project/PRD.md.
PIPELINE_ORDER: tuple[PipelineStep, ...] = (
    PipelineStep(0, "Fetch", "fetch"),
    PipelineStep(1, "Enrich", "enrich"),
    PipelineStep(2, "Classify", "classify"),
    PipelineStep(3, "Review", None, derives_progress=False),
    PipelineStep(4, "Scan", None, derives_progress=False),
    PipelineStep(5, "Match", "match"),
    PipelineStep(6, "Analyze", "analyze-mood"),
    PipelineStep(7, "Classify Tags", "classify-tags"),
    PipelineStep(8, "Apply", "apply-tags"),
    PipelineStep(9, "Build Event", "build-event"),
    PipelineStep(10, "Build Library", "build-library"),
)


def total_steps() -> int:
    """Return the total number of user-visible pipeline steps (= 11)."""
    return len(PIPELINE_ORDER)


def step_by_job_type(job_type: str) -> PipelineStep | None:
    for step in PIPELINE_ORDER:
        if step.job_type == job_type:
            return step
    return None


def current_step(db: Session, event_id: str) -> tuple[int, str]:
    """Derive the current pipeline step for an event.

    Defined as the ``derives_progress=True`` step with the highest index
    whose ``job_type`` has at least one ``succeeded`` ``JobRun`` for the
    event. When no qualifying job has succeeded yet, returns the first
    step (Fetch).
    """
    progress_job_types = [s.job_type for s in PIPELINE_ORDER if s.derives_progress and s.job_type]
    succeeded_types = set(
        db.execute(
            select(JobRun.type).where(
                JobRun.event_id == event_id,
                JobRun.status == "succeeded",
                JobRun.type.in_(progress_job_types),
            )
        ).scalars()
    )
    best = PIPELINE_ORDER[0]
    for step in PIPELINE_ORDER:
        if step.derives_progress and step.job_type in succeeded_types:
            best = step
    return best.index, best.label

# Feature Specs

Each file in this folder is **one testable, deployable unit** of product
work, identified by a `CRATE-X` ID.

## Format

Use [.github/agents/templates/feature-spec.md](../../.github/agents/templates/feature-spec.md)
as the starting point. Each spec contains:

- **Description** — what the feature does and why it matters.
- **Scope** — the sub-features and surfaces this spec covers.
- **User Stories** — `As a [role], I want [action], so that [benefit].`
- **Acceptance Criteria** — testable conditions, prefixed `AC-N`.
- **Edge Cases** — boundary / error scenarios, prefixed `EC-N`.
- **Dependencies** — other `CRATE-X` features this one builds on.
- **Services Affected** — `frontend`, `backend`, or both.

The Solution Architect appends a **Tech Design** section and creates the
matching `project/plans/CRATE-X-plan.md`. Backend / Frontend Developer
agents implement against the plan.

## File naming

`CRATE-<id>-<kebab-feature-name>.md` — e.g. `CRATE-1-events-list-aggregation-api.md`.

## Tracking

[INDEX.md](INDEX.md) is the source of truth for feature status:

- `Planned` — spec written, not yet designed
- `Designed` — Tech Design + Implementation Plan complete
- `In Progress` — implementation underway
- `Done` — merged and verified
- `Deferred` — spec exists but won't be built soon

Keep [INDEX.md](INDEX.md) and the roadmap table in
[../PRD.md](../PRD.md) in sync.

## Single Responsibility

Never combine in one spec:

- Multiple independent functionalities
- Different services unless tightly coupled
- User-facing + admin-facing flows
- CRUD across different entities

If a feature can be tested or deployed independently, give it its own
spec and link via **Dependencies**.

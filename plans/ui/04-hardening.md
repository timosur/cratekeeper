## Milestone 4 — Phase 4: Hardening, Verification, Rollout

Harden reliability and safety surfaces, run full verification, and package the local deployment.

**Depends on**: Milestones 2 and 3 (both backend + UI need to exist before we harden them).
**Unblocks**: shipping v1.

### Work items

1. **Reliability and safety hardening**:
   - Operation audit log (who did what when, with before/after references).
   - Failure-recovery UI actions built on top of the Milestone 2 resume primitives (retry from checkpoint, skip track, abort + preserve state).
   - Dry-run mode for destructive steps (shows the diff without applying).
   - **Tag-write backup + undo** for [tag_writer.py](../../cratekeeper-cli/cratekeeper/tag_writer.py): per-track original-tags snapshot at write time, with a restore flow. Dry-run is not a safety net for in-place file edits.

2. **Verification and rollout**:
   - Run integration / E2E tests against real and fixture playlists.
   - Package the local deployment profile via docker-compose (backend, worker, db, frontend build).
   - Manual acceptance run on real macOS hardware.

### Acceptance (overall v1 gate)

1. Backend contract tests pass: each workflow endpoint triggers the expected service calls and persists state transitions.
2. Long-job tests pass: SSE progress + log events stream correctly for scan, match, analyze-mood, classify-tags, sync.
3. Integration tests against [data/wedding-test.json](../../data/wedding-test.json) produce the expected bucket summary, matched tracks, tags, and reports.
4. Filesystem safety tests pass: operations cannot write outside configured roots; destructive actions require explicit confirmation.
5. Playlist integration tests pass: Spotify event sub-playlist and master playlist operations; Tidal sync with missing-track handling.
6. **Platform test**: a mood analysis job runs end-to-end on Apple Silicon via the Milestone 1 runtime topology — not just inside the CLI container in isolation.
7. **CLI/web coexistence test**: running `crate scan` while the web app is idle, and a web-app-triggered scan while the CLI is idle, both leave the DB consistent (no drift, no duplicates).
8. **Crash-recovery test**: killing a mood analysis job at ~50% and resuming does not double-process and does not lose work.
9. **Tag-write undo test**: write tags to a test file, restore via the undo flow; file bytes match the pre-write snapshot.
10. **Manual acceptance run**: one real event, from playlist intake to event folder build and playlist sync, on the local macOS setup.

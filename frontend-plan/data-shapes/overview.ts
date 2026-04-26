/**
 * UI Data Contracts — Aggregate Reference
 * ---------------------------------------
 * This file aggregates the data interfaces that components expect, grouped by
 * section. It does NOT include the `*Props` interfaces — those live in each
 * section's `types.ts` alongside the data shapes.
 *
 * Use this file as a quick scan; copy the canonical types from
 * `sections/<section-id>/types.ts` into your codebase.
 */

// =============================================================================
// Events (dashboard)
// =============================================================================
export type {
  JobStatus as EventsJobStatus,
  TrackCounts as EventsTrackCounts,
  ActiveJob as EventsActiveJob,
  EventCard,
} from "../sections/events/types";

// =============================================================================
// Event Detail
// =============================================================================
export type {
  StepStatus,
  StepPhase,
  StepId,
  TrackCounts as EventDetailTrackCounts,
  MissingMasterpieces,
  ActiveJob as EventDetailActiveJob,
  PipelineStep,
  QualityGate,
  QualityCheck,
  StaleBuildKind,
  StaleBuild,
  ActivityEntry,
  EventDetail,
  GenreDistributionEntry,
  ReviewTrack,
  MatchKind,
  MatchSource,
  LibraryFilePresence,
  MatchedTrack,
  MissedTrack,
  MatchResults,
  MoodAnalysisStatus,
  MoodAnalysisRow,
  TagCostEstimate,
  LogLevel,
  JobLogLine,
  EventDetailDetails,
} from "../sections/event-detail/types";

// =============================================================================
// Master Library
// =============================================================================
export type {
  AudioFormat,
  CamelotKey,
  TrackOrigin,
  FilePresence,
  VerifyStatus,
  LibraryOnDiskHealth,
  LibraryHealth,
  LibraryOverview,
  BucketStat,
  LastUsedInEvent,
  LibraryTrack,
  BucketFilterOption,
  OriginFilterOption,
  FilterOptions as MasterLibraryFilterOptions,
} from "../sections/master-library/types";

// =============================================================================
// Settings
// =============================================================================
// (See sections/settings/types.ts for the full set — settings has many
// interrelated row types and is best consumed directly from its types file.)

// =============================================================================
// Audit Log
// =============================================================================
// (See sections/audit-log/types.ts — AuditAction, AuditEntry, FilterOptions.)

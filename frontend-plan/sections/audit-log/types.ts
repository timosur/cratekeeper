// =============================================================================
// UI Data Shapes — Audit Log
// =============================================================================

export type AuditSeverity = "info" | "warning" | "error" | "override";

export type AuditActorKind = "operator" | "system";

export interface AuditActor {
  kind: AuditActorKind;
  /** Display name for operators ("Tim S."); always "system" for system actors. */
  name: string;
}

export type AuditTargetKind = "event" | "track" | "library" | "settings" | "job";

export interface AuditTarget {
  kind: AuditTargetKind;
  id: string;
  /** Human-readable label for display (e.g. event name, track title). */
  label: string;
}

/**
 * Dot-namespaced action identifier. Common namespaces:
 *   job.*       — pipeline job lifecycle (start, complete, fail, cancel, resume)
 *   review.*    — operator decisions in the Review step (rebucket, approve)
 *   library.*   — Master Library mutations (promote, demote, add, remove)
 *   settings.*  — configuration changes (api-key.update, bucket.add, etc.)
 *   gate.*      — quality-gate overrides
 */
export type AuditAction = string;

/**
 * A single before/after JSON payload pair. Either side may be null when the
 * action is purely additive (after only) or destructive (before only).
 */
export interface AuditPayload {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface AuditEntry {
  id: string;
  /** ISO-8601 timestamp the action was recorded. */
  timestamp: string;
  actor: AuditActor;
  action: AuditAction;
  target: AuditTarget;
  /** Job id when the action is part of a pipeline job; null otherwise. */
  jobId: string | null;
  severity: AuditSeverity;
  /** One-line operator-facing summary shown on the collapsed row. */
  summary: string;
  /** Structured payload for the expanded diff view. */
  payload: AuditPayload;
  /** Free-text reason supplied when overriding a quality gate. Required when severity = "override". */
  overrideReason: string | null;
}

// -----------------------------------------------------------------------------
// Filter options shown in the sticky filter bar
// -----------------------------------------------------------------------------

export type TimeRangePreset = "1h" | "24h" | "7d" | "30d" | "custom";

export interface ActionFilterOption {
  /** Fully-qualified action id, e.g. "library.promote". */
  id: AuditAction;
  /** Top-level namespace used to group chips, e.g. "library". */
  namespace: string;
  /** Human label shown in the popover, e.g. "Promote to library". */
  label: string;
  /** Pre-computed count of entries with this action in the current dataset. */
  count: number;
}

export interface ActorFilterOption {
  /** Stable id for the dropdown — operator email/handle, or "system". */
  id: string;
  kind: AuditActorKind;
  name: string;
  count: number;
}

export interface FilterOptions {
  /** Action options grouped by namespace order in this list. */
  actions: ActionFilterOption[];
  /** Distinct actors that appear in the dataset. */
  actors: ActorFilterOption[];
  /** Target kinds present in the dataset, in display order. */
  targetKinds: AuditTargetKind[];
  /** Severities present in the dataset, in display order. */
  severities: AuditSeverity[];
}

// -----------------------------------------------------------------------------
// Aggregate stats shown in the filter summary line
// -----------------------------------------------------------------------------

export interface AuditStats {
  /** Total entries in the underlying log (ignoring filters). */
  totalEntries: number;
  /** Timestamp of the most recent entry, used by the "Live tail" indicator. */
  latestEntryAt: string;
}

// =============================================================================
// Component Props
// =============================================================================

export interface AuditLogProps {
  /** All audit entries available to the page (already sorted newest-first). */
  entries: AuditEntry[];
  /** Choices that populate the filter bar controls. */
  filterOptions: FilterOptions;
  /** Aggregate counts for the filter summary line. */
  stats: AuditStats;
  /** Initial state of the live-tail toggle. */
  initialLiveTail?: boolean;

  /** Called when the user toggles the live-tail switch. */
  onToggleLiveTail?: (next: boolean) => void;
  /** Called when the user clicks "Copy permalink" — receives a URL-encoded filter snapshot. */
  onCopyPermalink?: (url: string) => void;
  /** Called when the user picks an export format from the Export dropdown. */
  onExport?: (format: "csv" | "ndjson") => void;

  /** Called when the user expands a row to view its full detail. */
  onExpandEntry?: (entryId: string) => void;
  /** Called when the user clicks "Jump to target" on a row or expanded entry. */
  onJumpToTarget?: (target: AuditTarget) => void;
  /** Called when the user copies a single entry as JSON. */
  onCopyEntryJson?: (entry: AuditEntry) => void;
  /** Called when the user copies a permalink to a single entry. */
  onCopyEntryPermalink?: (entryId: string) => void;
  /** Called when the user copies a target id from row hover actions. */
  onCopyTargetId?: (targetId: string) => void;
}

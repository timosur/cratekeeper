// Hand-written response types mirroring the backend's Pydantic schemas.
// Keep these in lock-step with `backend/cratekeeper_api/schemas.py`.

export type JobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type JobType =
  | "fetch"
  | "enrich"
  | "classify"
  | "scan-incremental"
  | "scan-full"
  | "match"
  | "analyze-mood"
  | "classify-tags"
  | "apply-tags"
  | "undo-tags"
  | "build-library"
  | "build-event"
  | "sync-spotify"
  | "sync-tidal"
  | "refetch";

export interface JobOut {
  id: string;
  event_id: string | null;
  type: JobType | string;
  status: JobStatus;
  params: Record<string, unknown>;
  summary: Record<string, unknown>;
  error: Record<string, unknown> | null;
  progress_i: number;
  progress_total: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  queue_position: number | null;
}

export interface EventOut {
  id: string;
  name: string;
  slug: string;
  date: string | null;
  source_playlist_url: string | null;
  source_playlist_id: string | null;
  source_playlist_name: string | null;
  build_mode: string;
  created_at: string;
  updated_at: string;
  track_count: number;

  // CRATE-1 aggregated dashboard fields.
  matched_count: number;
  tagged_count: number;
  current_step_index: number;
  current_step_label: string;
  total_steps: number;
  is_stale: boolean;
  last_activity_at: string | null;
  active_job: JobOut | null;
}

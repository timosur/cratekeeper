// =============================================================================
// UI Data Shapes — These define the data the Dashboard expects to receive
// =============================================================================

export type JobStatus = "running" | "queued" | "failed" | "succeeded" | "cancelled";

export interface TrackCounts {
  /** Total tracks in the source playlist */
  total: number;
  /** Tracks matched to a local file */
  matched: number;
  /** Tracks with tags written to disk */
  tagged: number;
}

export interface ActiveJob {
  id: string;
  status: JobStatus;
  /** The pipeline step name, e.g. "analyze-mood", "apply-tags" */
  label: string;
  /** 0..1 when running; null when queued or status is unknown */
  progress: number | null;
  /** Position in the heavy/light queue when status is "queued" */
  queuePosition?: number;
  /** Human-readable error message when status is "failed" */
  errorMessage?: string;
}

export interface EventCard {
  id: string;
  /** Display name shown on the card */
  name: string;
  /** URL-safe slug, also used as the on-disk folder name */
  slug: string;
  /** ISO-8601 date (YYYY-MM-DD) */
  eventDate: string;
  /** Source Spotify playlist URL */
  playlistUrl: string;
  /** Current pipeline step (0-indexed) */
  currentStepIndex: number;
  /** Display label for the current step */
  currentStepLabel: string;
  /** Total number of pipeline steps (typically 11) */
  totalSteps: number;
  trackCounts: TrackCounts;
  /** The currently running, queued, or recently failed job for this event */
  activeJob: ActiveJob | null;
  /** True when downstream builds are out of date relative to applied tags */
  isStale: boolean;
  /** ISO-8601 timestamp of the last state-changing action */
  lastActivityAt: string;
}

// =============================================================================
// Component Props
// =============================================================================

export interface DashboardProps {
  /** All active events to display in the grid */
  events: EventCard[];
  /** Called when the user clicks the "+ New Event" button */
  onCreateEvent?: () => void;
  /** Called when the user clicks anywhere on a card to open the event */
  onOpenEvent?: (id: string) => void;
  /** Called when the user clicks the inline "Resume" action on a failed/paused job */
  onResumeJob?: (eventId: string, jobId: string) => void;
}

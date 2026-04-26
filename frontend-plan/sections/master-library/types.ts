// =============================================================================
// UI Data Shapes — These define the data the components expect to receive
// =============================================================================

export type AudioFormat = "FLAC" | "WAV" | "AIFF" | "MP3";

export type CamelotKey =
  | "1A" | "1B" | "2A" | "2B" | "3A" | "3B"
  | "4A" | "4B" | "5A" | "5B" | "6A" | "6B"
  | "7A" | "7B" | "8A" | "8B" | "9A" | "9B"
  | "10A" | "10B" | "11A" | "11B" | "12A" | "12B";

/** How a track entered the master library. */
export type TrackOrigin = "manual" | "promoted";

/** Whether the audio file currently exists on the local OS disk. */
export type FilePresence = "present" | "missing" | "unknown";

/** State of the `verify-library` background job. */
export type VerifyStatus = "idle" | "running";

/** On-disk integrity breakdown for the whole library. */
export interface LibraryOnDiskHealth {
  /** Tracks whose file was found on disk during the last verify */
  presentCount: number;
  /** Tracks whose file was NOT found on disk during the last verify */
  missingCount: number;
  /** Tracks that have not yet been verified (or stale verification) */
  unknownCount: number;
  /** present / total as a 0–100 percentage */
  percent: number;
}

export interface LibraryHealth {
  /** Percentage of tracks with full Spotify metadata + tags written */
  tagsPercent: number;
  /** Percentage of tracks with embedded artwork */
  artworkPercent: number;
  /** Percentage of tracks with completed mood/BPM/key analysis */
  analysisPercent: number;
  /** Per-track presence on the local OS disk */
  onDisk: LibraryOnDiskHealth;
}

export interface LibraryOverview {
  /** Total number of curated masterpieces in the library */
  totalTracks: number;
  /** Total bytes used on disk by all tracks */
  totalStorageBytes: number;
  /** Number of distinct events these masterpieces have been used in */
  eventsServed: number;
  /** Health coverage percentages (tags / artwork / analysis / on-disk) */
  health: LibraryHealth;
  /** ISO timestamp of the last library refresh */
  lastUpdatedAt: string;
  /** ISO timestamp of the most recent `verify-library` job completion */
  lastVerifiedAt: string;
  /** Current state of the verify-library job */
  verifyStatus: VerifyStatus;
}

export interface BucketStat {
  id: string;
  name: string;
  /** Number of tracks in this bucket */
  trackCount: number;
  /** Total bytes used by tracks in this bucket */
  storageBytes: number;
  /** Share of the total library, 0–100 */
  percentOfLibrary: number;
  /** ISO timestamp of the most recently added track in this bucket; null if empty */
  lastAddedAt: string | null;
}

/** Reference to the most recent event a track was used in, if any. */
export interface LastUsedInEvent {
  eventId: string;
  eventName: string;
  /** ISO timestamp the track was loaded into that event */
  date: string;
}

export interface LibraryTrack {
  id: string;
  /** International Standard Recording Code (used for cross-pool matching) */
  isrc: string;
  title: string;
  artist: string;
  /** The genre bucket this track lives in */
  bucketId: string;
  bucketName: string;
  /** Beats per minute from analysis */
  bpm: number;
  /** Camelot wheel key from analysis */
  key: CamelotKey;

  // ---- Library membership ----
  /** How this track came to be in the library */
  origin: TrackOrigin;
  /** The source event id; only present when origin === "promoted" */
  promotedFromEventId?: string;
  /** Display label for the source event; only present when origin === "promoted" */
  promotedFromEventName?: string;
  /** ISO timestamp this track joined the master library */
  addedToLibraryAt: string;

  // ---- Usage history ----
  /** Number of events this masterpiece has been used in */
  timesUsed: number;
  /** Most recent event the track appeared in; null if never used */
  lastUsedInEvent: LastUsedInEvent | null;

  // ---- File on local OS disk ----
  format: AudioFormat;
  /** Absolute filesystem path to the audio file on the local OS disk */
  filePath: string;
  /** Last known on-disk presence state (from the most recent verify) */
  localFilePresence: FilePresence;
  /** ISO timestamp of the last verify; null if never verified */
  lastVerifiedAt: string | null;
  /** Bytes recorded when the track was added or promoted */
  recordedFileSize: number;
  /**
   * Bytes observed on disk during the last verify.
   * - null when the file is `missing` or has never been verified
   * - when this differs from `recordedFileSize`, the row has size drift
   */
  fileSizeOnDisk: number | null;
}

export interface BucketFilterOption {
  id: string;
  name: string;
  trackCount: number;
}

export interface OriginFilterOption {
  id: TrackOrigin;
  label: string;
  count: number;
}

export interface FilterOptions {
  /** Buckets that may appear as filter chips */
  buckets: BucketFilterOption[];
  /** Origin chips (Manual / Promoted) with library-wide counts */
  origins: OriginFilterOption[];
  /** Camelot keys available in the library */
  keys: CamelotKey[];
  /** File formats present in the library */
  formats: AudioFormat[];
  /** Lower bound for the BPM range slider */
  bpmMin: number;
  /** Upper bound for the BPM range slider */
  bpmMax: number;
}

// =============================================================================
// Component Props
// =============================================================================

export interface MasterLibraryProps {
  /** Library-wide totals and health */
  overview: LibraryOverview;
  /** Per-genre breakdown rows */
  buckets: BucketStat[];
  /** Track rows (a representative slice; pagination is handled in the component) */
  tracks: LibraryTrack[];
  /** Distinct values used to populate the filter bar */
  filterOptions: FilterOptions;

  // ---- Browse / drill ----
  /** Called when the user clicks a genre row to filter the track table */
  onSelectBucket?: (bucketId: string) => void;
  /** Called when the user clicks a track row to reveal it in Finder. Not invoked when the file is missing. */
  onRevealInFinder?: (track: LibraryTrack) => void;
  /** Called when the user clicks the source event link in a promoted track row */
  onOpenSourceEvent?: (eventId: string) => void;

  // ---- Add tracks (3 entry points) ----
  /** Called when the user clicks the primary "+ Add track" button */
  onAddTrack?: () => void;
  /** Called when the user clicks "Import from Spotify" */
  onImportFromSpotify?: () => void;
  /** Called when audio files are dropped onto the page */
  onDropAudioFiles?: (files: File[]) => void;

  // ---- Promote from events ----
  /** Called when the user clicks "Promote from event" to open the bulk promotion view */
  onPromoteFromEvent?: () => void;

  // ---- Verify on-disk integrity ----
  /** Called when the user clicks the "Verify library" button in the Overview strip */
  onVerifyLibrary?: () => void;

  // ---- Remove (two distinct flows by presence state) ----
  /** Confirm removing a present-on-disk entry; the file on disk is preserved */
  onRemoveFromLibrary?: (track: LibraryTrack) => void;
  /** Confirm dropping a missing entry; nothing on disk to preserve */
  onDropMissingEntry?: (track: LibraryTrack) => void;
}

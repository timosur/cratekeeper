// =============================================================================
// UI Data Shapes — Settings
// =============================================================================

export type SettingsCategoryId =
  | "integrations"
  | "filesystem-roots"
  | "buckets"
  | "api-access";

// -----------------------------------------------------------------------------
// Integrations
// -----------------------------------------------------------------------------

export type ServiceId = "spotify" | "tidal";

export type ServiceConnectionStatus = "connected" | "disconnected" | "expired" | "error";

export interface ServiceConnection {
  service: ServiceId;
  status: ServiceConnectionStatus;
  /** Display label for the connected account (e.g. email or handle). Null when not connected. */
  accountLabel: string | null;
  /** OAuth scopes currently granted */
  scopes: string[];
  connectedAt: string | null;
  lastRefreshedAt: string | null;
  expiresAt: string | null;
  /** Set when status === "error" */
  errorMessage?: string;
}

export type AnthropicStatus = "active" | "invalid" | "rate-limited" | "not-configured";

export interface AnthropicModelOption {
  id: string;
  label: string;
  recommended: boolean;
}

export interface LifetimeUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalUsd: number;
  /** ISO-8601 of when the counter started accumulating */
  since: string;
}

export interface AnthropicConfig {
  status: AnthropicStatus;
  /** Last 4 characters of the API key, for visual confirmation only */
  keyMaskedSuffix: string;
  keyLastRotatedAt: string;
  keyValidatedAt: string;
  /** Currently selected model id */
  model: string;
  availableModels: AnthropicModelOption[];
  promptCachingEnabled: boolean;
  lifetimeUsage: LifetimeUsage;
}

export interface IntegrationsSettings {
  spotify: ServiceConnection;
  tidal: ServiceConnection;
  anthropic: AnthropicConfig;
}

// -----------------------------------------------------------------------------
// Filesystem roots
// -----------------------------------------------------------------------------

export type FilesystemRootPurpose = "source" | "library" | "backup";

export interface FilesystemRoot {
  id: string;
  label: string;
  purpose: FilesystemRootPurpose;
  path: string;
  reachable: boolean;
  /** Null when unreachable */
  freeSpaceBytes: number | null;
  totalSpaceBytes: number | null;
  /** Last time this root was scanned by the indexer */
  lastScannedAt: string | null;
  /** Total files indexed in this root; null when unreachable */
  fileCount: number | null;
  /** Set when reachable === false */
  lastError?: string;
}

// -----------------------------------------------------------------------------
// Genre buckets
// -----------------------------------------------------------------------------

export interface GenreBucket {
  id: string;
  name: string;
  /** 1-based ordering used by Classify and the bucket editor */
  order: number;
  /** Number of tracks across all events currently assigned to this bucket */
  trackCount: number;
}

// -----------------------------------------------------------------------------
// API access
// -----------------------------------------------------------------------------

export interface ApiAccess {
  /** Last 4 characters of the bearer token */
  tokenMaskedSuffix: string;
  createdAt: string;
  lastUsedAt: string | null;
  lastUsedClient: string | null;
}

// -----------------------------------------------------------------------------
// Top-level settings payload
// -----------------------------------------------------------------------------

export interface Settings {
  integrations: IntegrationsSettings;
  filesystemRoots: FilesystemRoot[];
  buckets: GenreBucket[];
  apiAccess: ApiAccess;
}

// =============================================================================
// Component Props
// =============================================================================

export interface SettingsProps {
  /** Full settings payload */
  settings: Settings;
  /** Currently focused category in the left sub-nav */
  activeCategoryId?: SettingsCategoryId;

  // ---- Navigation ----
  /** Called when the user picks a category in the left sub-nav */
  onSelectCategory?: (id: SettingsCategoryId) => void;

  // ---- Integrations: Spotify / Tidal ----
  /** Called when the user starts the OAuth connect flow for a service */
  onConnectService?: (service: ServiceId) => void;
  /** Called when the user re-runs OAuth to refresh tokens */
  onRelinkService?: (service: ServiceId) => void;
  /** Called when the user confirms disconnect (after the typed-confirmation dialog) */
  onDisconnectService?: (service: ServiceId) => void;

  // ---- Integrations: Anthropic ----
  /** Called when the user reveals the masked API key value */
  onRevealAnthropicKey?: () => void;
  /** Called when the user submits a rotated API key (paste-to-replace) */
  onRotateAnthropicKey?: (newKey: string) => void;
  /** Called when the user picks a different model from the dropdown */
  onSelectAnthropicModel?: (modelId: string) => void;
  /** Called when the user toggles prompt caching on / off */
  onTogglePromptCaching?: (enabled: boolean) => void;

  // ---- Filesystem roots ----
  /** Called when the user saves an edited path for a root */
  onSaveFilesystemRoot?: (id: string, newPath: string) => void;
  /** Called when the user re-tests a root's reachability without saving */
  onTestFilesystemRoot?: (id: string) => void;

  // ---- Genre buckets ----
  /** Called when the user saves an inline-renamed bucket */
  onRenameBucket?: (id: string, newName: string) => void;
  /** Called when the user reorders the bucket list via drag & drop */
  onReorderBuckets?: (orderedIds: string[]) => void;
  /** Called when the user adds a new empty bucket at the end of the list */
  onAddBucket?: () => void;
  /** Called when the user confirms deletion of a bucket */
  onDeleteBucket?: (id: string) => void;

  // ---- API access ----
  /** Called when the user reveals the masked bearer token */
  onRevealBearerToken?: () => void;
  /** Called when the user copies the bearer token to the clipboard */
  onCopyBearerToken?: () => void;
  /** Called when the user confirms rotating the bearer token (after the typed-confirmation dialog) */
  onRotateBearerToken?: () => void;
}

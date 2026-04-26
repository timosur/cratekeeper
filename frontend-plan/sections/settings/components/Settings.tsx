import { useState } from "react";
import {
  Plug,
  HardDrive,
  Tags,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  GripVertical,
  RotateCw,
  Pencil,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CircleDashed,
  Sparkles,
} from "lucide-react";
import type {
  Settings as SettingsData,
  SettingsCategoryId,
  SettingsProps,
  ServiceConnection,
  ServiceId,
  AnthropicConfig,
  FilesystemRoot,
  GenreBucket,
  ApiAccess,
} from "../types";

// =============================================================================
// Top-level component
// =============================================================================

export function Settings({
  settings,
  activeCategoryId,
  onSelectCategory,
  onConnectService,
  onRelinkService,
  onDisconnectService,
  onRevealAnthropicKey,
  onRotateAnthropicKey,
  onSelectAnthropicModel,
  onTogglePromptCaching,
  onSaveFilesystemRoot,
  onTestFilesystemRoot,
  onRenameBucket,
  onReorderBuckets,
  onAddBucket,
  onDeleteBucket,
  onRevealBearerToken,
  onCopyBearerToken,
  onRotateBearerToken,
}: SettingsProps) {
  const [selected, setSelected] = useState<SettingsCategoryId>(
    activeCategoryId ?? "integrations",
  );

  const handleSelect = (id: SettingsCategoryId) => {
    setSelected(id);
    onSelectCategory?.(id);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[1400px] gap-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <CategoryNav active={selected} onSelect={handleSelect} />

      <main className="min-w-0 flex-1">
        {selected === "integrations" && (
          <IntegrationsPanel
            integrations={settings.integrations}
            onConnectService={onConnectService}
            onRelinkService={onRelinkService}
            onDisconnectService={onDisconnectService}
            onRevealAnthropicKey={onRevealAnthropicKey}
            onRotateAnthropicKey={onRotateAnthropicKey}
            onSelectAnthropicModel={onSelectAnthropicModel}
            onTogglePromptCaching={onTogglePromptCaching}
          />
        )}
        {selected === "filesystem-roots" && (
          <FilesystemRootsPanel
            roots={settings.filesystemRoots}
            onSave={onSaveFilesystemRoot}
            onTest={onTestFilesystemRoot}
          />
        )}
        {selected === "buckets" && (
          <BucketsPanel
            buckets={settings.buckets}
            onRename={onRenameBucket}
            onReorder={onReorderBuckets}
            onAdd={onAddBucket}
            onDelete={onDeleteBucket}
          />
        )}
        {selected === "api-access" && (
          <ApiAccessPanel
            apiAccess={settings.apiAccess}
            onReveal={onRevealBearerToken}
            onCopy={onCopyBearerToken}
            onRotate={onRotateBearerToken}
          />
        )}
      </main>
    </div>
  );
}

// =============================================================================
// Left sub-nav
// =============================================================================

const CATEGORIES: Array<{
  id: SettingsCategoryId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { id: "integrations", label: "Integrations", description: "Spotify, Tidal, Anthropic", icon: Plug },
  { id: "filesystem-roots", label: "Filesystem roots", description: "Source, library, backup paths", icon: HardDrive },
  { id: "buckets", label: "Genre buckets", description: "Classify vocabulary", icon: Tags },
  { id: "api-access", label: "API access", description: "Local bearer token", icon: Key },
];

function CategoryNav({
  active,
  onSelect,
}: {
  active: SettingsCategoryId;
  onSelect: (id: SettingsCategoryId) => void;
}) {
  return (
    <aside className="sticky top-4 h-fit w-[220px] flex-shrink-0 self-start">
      <div className="mb-3 px-2">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
          Credentials, paths, and vocabulary
        </p>
      </div>
      <nav className="rounded-md border border-neutral-200 bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === active;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`group flex w-full items-start gap-2.5 rounded border-l-2 px-2.5 py-2 text-left transition-colors ${
                isActive
                  ? "border-sky-600 bg-sky-50 dark:border-sky-400 dark:bg-sky-950/40"
                  : "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
              }`}
            >
              <Icon
                className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-neutral-500 dark:text-neutral-500"}`}
                strokeWidth={2}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-xs font-medium ${isActive ? "text-sky-700 dark:text-sky-300" : "text-neutral-800 dark:text-neutral-200"}`}
                >
                  {cat.label}
                </span>
                <span className="mt-0.5 block text-[10px] text-neutral-500 dark:text-neutral-500">
                  {cat.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// =============================================================================
// Panel header
// =============================================================================

function PanelHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
      <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
    </header>
  );
}

function Card({
  title,
  trailing,
  children,
}: {
  title?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {(title || trailing) && (
        <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3 dark:border-neutral-800/80">
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {title}
            </h3>
          )}
          {trailing}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

// =============================================================================
// Integrations panel
// =============================================================================

function IntegrationsPanel({
  integrations,
  onConnectService,
  onRelinkService,
  onDisconnectService,
  onRevealAnthropicKey,
  onRotateAnthropicKey,
  onSelectAnthropicModel,
  onTogglePromptCaching,
}: {
  integrations: SettingsData["integrations"];
  onConnectService?: (service: ServiceId) => void;
  onRelinkService?: (service: ServiceId) => void;
  onDisconnectService?: (service: ServiceId) => void;
  onRevealAnthropicKey?: () => void;
  onRotateAnthropicKey?: (newKey: string) => void;
  onSelectAnthropicModel?: (modelId: string) => void;
  onTogglePromptCaching?: (enabled: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader
        title="Integrations"
        description="External services Cratekeeper authenticates against. Re-link refreshes tokens; disconnect revokes them."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ServiceCard
          connection={integrations.spotify}
          onConnect={() => onConnectService?.("spotify")}
          onRelink={() => onRelinkService?.("spotify")}
          onDisconnect={() => onDisconnectService?.("spotify")}
        />
        <ServiceCard
          connection={integrations.tidal}
          onConnect={() => onConnectService?.("tidal")}
          onRelink={() => onRelinkService?.("tidal")}
          onDisconnect={() => onDisconnectService?.("tidal")}
        />
      </div>

      <AnthropicCard
        config={integrations.anthropic}
        onReveal={onRevealAnthropicKey}
        onRotate={onRotateAnthropicKey}
        onSelectModel={onSelectAnthropicModel}
        onTogglePromptCaching={onTogglePromptCaching}
      />
    </div>
  );
}

function ServiceCard({
  connection,
  onConnect,
  onRelink,
  onDisconnect,
}: {
  connection: ServiceConnection;
  onConnect: () => void;
  onRelink: () => void;
  onDisconnect: () => void;
}) {
  const isConnected = connection.status === "connected";
  const label = connection.service === "spotify" ? "Spotify" : "Tidal";
  const accent = connection.service === "spotify" ? "emerald" : "sky";

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md ${
              accent === "emerald"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
            }`}
          >
            <Plug className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {label}
              </h4>
              <StatusDot status={isConnected ? "ok" : "off"} />
            </div>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
              {isConnected ? connection.accountLabel : "Not connected"}
            </p>
          </div>
        </div>
      </div>

      {isConnected && (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-xs dark:border-neutral-800/80">
          <Field label="Connected" value={formatRelative(connection.connectedAt)} mono />
          <Field label="Token refreshed" value={formatRelative(connection.lastRefreshedAt)} mono />
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wider text-neutral-500">Scopes</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {connection.scopes.map((s) => (
                <span
                  key={s}
                  className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  style={mono}
                >
                  {s}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
        {isConnected ? (
          <>
            <DangerButton onClick={onDisconnect}>Disconnect</DangerButton>
            <SecondaryButton onClick={onRelink} icon={<RotateCw className="h-3.5 w-3.5" />}>
              Re-link
            </SecondaryButton>
          </>
        ) : (
          <PrimaryButton onClick={onConnect}>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
            Connect {label}
          </PrimaryButton>
        )}
      </div>
    </Card>
  );
}

function AnthropicCard({
  config,
  onReveal,
  onRotate,
  onSelectModel,
  onTogglePromptCaching,
}: {
  config: AnthropicConfig;
  onReveal?: () => void;
  onRotate?: (newKey: string) => void;
  onSelectModel?: (modelId: string) => void;
  onTogglePromptCaching?: (enabled: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [newKey, setNewKey] = useState("");

  const handleReveal = () => {
    setRevealed(true);
    setSecondsLeft(10);
    onReveal?.();
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setRevealed(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Anthropic
              </h4>
              <StatusDot status={config.status === "active" ? "ok" : "error"} />
            </div>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
              Key validated {formatRelative(config.keyValidatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* API key */}
      <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
        <label className="text-[10px] uppercase tracking-wider text-neutral-500">API key</label>
        {!rotating ? (
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="flex flex-1 items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950"
              style={mono}
            >
              <span className="text-neutral-700 dark:text-neutral-300">
                {revealed
                  ? `sk-ant-api03-...${config.keyMaskedSuffix}`
                  : `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${config.keyMaskedSuffix}`}
              </span>
              <button
                type="button"
                onClick={revealed ? () => setRevealed(false) : handleReveal}
                className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-sky-700 hover:underline dark:text-sky-400"
              >
                {revealed ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    Hide ({secondsLeft}s)
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    Reveal
                  </>
                )}
              </button>
            </div>
            <SecondaryButton onClick={() => setRotating(true)} icon={<RotateCw className="h-3.5 w-3.5" />}>
              Rotate
            </SecondaryButton>
          </div>
        ) : (
          <div className="mt-1.5">
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Paste new API key"
                className="flex-1 rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-sky-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                style={mono}
                autoFocus
              />
              <PrimaryButton
                onClick={() => {
                  if (newKey.trim()) {
                    onRotate?.(newKey.trim());
                    setNewKey("");
                    setRotating(false);
                  }
                }}
                disabled={!newKey.trim()}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Validate & save
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setNewKey("");
                  setRotating(false);
                }}
              >
                Cancel
              </SecondaryButton>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-500">
              The new key will be validated against the Anthropic API before saving.
            </p>
          </div>
        )}
        <p className="mt-1.5 text-[11px] text-neutral-500">
          Last rotated <span style={mono}>{formatRelative(config.keyLastRotatedAt)}</span>
        </p>
      </div>

      {/* Model + caching */}
      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-4 md:grid-cols-2 dark:border-neutral-800/80">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-neutral-500">Model</label>
          <select
            value={config.model}
            onChange={(e) => onSelectModel?.(e.target.value)}
            className="mt-1.5 w-full rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            {config.availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.recommended ? " \u2014 recommended" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-neutral-500">
            Prompt caching
          </label>
          <div className="mt-1.5 flex items-center justify-between rounded border border-neutral-200 px-3 py-1.5 dark:border-neutral-700">
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              {config.promptCachingEnabled ? "Enabled" : "Disabled"}
            </span>
            <Toggle
              checked={config.promptCachingEnabled}
              onChange={(v) => onTogglePromptCaching?.(v)}
            />
          </div>
        </div>
      </div>

      {/* Lifetime usage */}
      <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
          Lifetime usage \u2014 since {formatRelative(config.lifetimeUsage.since)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <UsageMetric label="Input tokens" value={formatNumber(config.lifetimeUsage.totalInputTokens)} />
          <UsageMetric label="Output tokens" value={formatNumber(config.lifetimeUsage.totalOutputTokens)} />
          <UsageMetric
            label="USD spent"
            value={`$${config.lifetimeUsage.totalUsd.toFixed(2)}`}
            accent="emerald"
          />
        </div>
      </div>
    </Card>
  );
}

function UsageMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-neutral-900 dark:text-neutral-100";
  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${valueColor}`} style={mono}>
        {value}
      </div>
    </div>
  );
}

// =============================================================================
// Filesystem roots panel
// =============================================================================

function FilesystemRootsPanel({
  roots,
  onSave,
  onTest,
}: {
  roots: FilesystemRoot[];
  onSave?: (id: string, newPath: string) => void;
  onTest?: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader
        title="Filesystem roots"
        description="Where Cratekeeper reads source files, writes the master library, and stores per-file backups before tag writes."
      />
      <div className="flex flex-col gap-3">
        {roots.map((root) => (
          <FilesystemRootCard
            key={root.id}
            root={root}
            onSave={onSave}
            onTest={() => onTest?.(root.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilesystemRootCard({
  root,
  onSave,
  onTest,
}: {
  root: FilesystemRoot;
  onSave?: (id: string, newPath: string) => void;
  onTest: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(root.path);

  const purposeLabel = {
    source: "Source",
    library: "Library",
    backup: "Backup",
  }[root.purpose];

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {root.label}
            </h4>
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {purposeLabel}
            </span>
            {root.reachable ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                Reachable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-700 dark:bg-red-950/30 dark:text-red-400">
                <XCircle className="h-3 w-3" strokeWidth={2.5} />
                Unreachable
              </span>
            )}
          </div>

          {!editing ? (
            <div
              className="mt-2 truncate rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
              style={mono}
              title={root.path}
            >
              {root.path}
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                style={mono}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSave?.(root.id, draft);
                    setEditing(false);
                  }
                  if (e.key === "Escape") {
                    setDraft(root.path);
                    setEditing(false);
                  }
                }}
              />
              <PrimaryButton
                onClick={() => {
                  onSave?.(root.id, draft);
                  setEditing(false);
                }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                Save
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setDraft(root.path);
                  setEditing(false);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </SecondaryButton>
            </div>
          )}
        </div>

        {!editing && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <SecondaryButton onClick={onTest} icon={<RotateCw className="h-3.5 w-3.5" />}>
              Test
            </SecondaryButton>
            <SecondaryButton onClick={() => setEditing(true)} icon={<Pencil className="h-3.5 w-3.5" />}>
              Edit
            </SecondaryButton>
          </div>
        )}
      </div>

      {/* Health row */}
      {root.reachable ? (
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-xs dark:border-neutral-800/80">
          <Field
            label="Free space"
            value={formatBytes(root.freeSpaceBytes)}
            mono
            accent={
              root.freeSpaceBytes != null && root.totalSpaceBytes
                ? root.freeSpaceBytes / root.totalSpaceBytes < 0.1
                  ? "amber"
                  : "neutral"
                : "neutral"
            }
          />
          <Field label="Indexed files" value={formatNumber(root.fileCount ?? 0)} mono />
          <Field label="Last scanned" value={formatRelative(root.lastScannedAt)} mono />
        </dl>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />
          <span>{root.lastError ?? "Unable to reach this path."}</span>
        </div>
      )}
    </Card>
  );
}

// =============================================================================
// Buckets panel
// =============================================================================

function BucketsPanel({
  buckets,
  onRename,
  onReorder,
  onAdd,
  onDelete,
}: {
  buckets: GenreBucket[];
  onRename?: (id: string, newName: string) => void;
  onReorder?: (orderedIds: string[]) => void;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [order, setOrder] = useState<GenreBucket[]>(buckets);

  // Re-sync if parent buckets change
  if (buckets.length !== order.length) setOrder(buckets);

  return (
    <div className="flex flex-col gap-5">
      <PanelHeader
        title="Genre buckets"
        description="The vocabulary used by Classify. Drag to reorder, click a name to rename, and use Add bucket to extend the list."
      />

      <Card
        title={`${order.length} buckets`}
        trailing={
          <PrimaryButton onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add bucket
          </PrimaryButton>
        }
      >
        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {order.map((bucket) => (
            <BucketRow
              key={bucket.id}
              bucket={bucket}
              isDragging={draggedId === bucket.id}
              onDragStart={() => setDraggedId(bucket.id)}
              onDragOver={(targetId) => {
                if (!draggedId || draggedId === targetId) return;
                const next = [...order];
                const fromIdx = next.findIndex((b) => b.id === draggedId);
                const toIdx = next.findIndex((b) => b.id === targetId);
                if (fromIdx < 0 || toIdx < 0) return;
                const [moved] = next.splice(fromIdx, 1);
                next.splice(toIdx, 0, moved);
                setOrder(next);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                onReorder?.(order.map((b) => b.id));
              }}
              onRename={(name) => onRename?.(bucket.id, name)}
              onDelete={() => onDelete?.(bucket.id)}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BucketRow({
  bucket,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRename,
  onDelete,
}: {
  bucket: GenreBucket;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (targetId: string) => void;
  onDragEnd: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bucket.name);

  const inUse = bucket.trackCount > 0;

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(bucket.id);
      }}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-1 py-1.5 transition-opacity ${
        isDragging ? "opacity-40" : "opacity-100"
      }`}
    >
      <span className="cursor-grab text-neutral-300 hover:text-neutral-500 dark:text-neutral-700 dark:hover:text-neutral-400">
        <GripVertical className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span
        className="w-7 text-right text-[10px] text-neutral-400 dark:text-neutral-600"
        style={mono}
      >
        {bucket.order}
      </span>

      {!editing ? (
        <button
          type="button"
          onClick={() => {
            setDraft(bucket.name);
            setEditing(true);
          }}
          className="flex-1 rounded px-2 py-1 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800/60"
        >
          {bucket.name}
        </button>
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 rounded border border-sky-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none dark:border-sky-700 dark:bg-neutral-950 dark:text-neutral-100"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onRename(draft.trim());
                setEditing(false);
              }
              if (e.key === "Escape") {
                setDraft(bucket.name);
                setEditing(false);
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (draft.trim()) {
                onRename(draft.trim());
                setEditing(false);
              }
            }}
            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(bucket.name);
              setEditing(false);
            }}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <span
        className={`flex w-20 items-center justify-end gap-1 text-xs ${
          inUse ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"
        }`}
        style={mono}
      >
        {inUse ? formatNumber(bucket.trackCount) : "0"}
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
          tracks
        </span>
      </span>
      <button
        type="button"
        onClick={onDelete}
        title={inUse ? `In use by ${bucket.trackCount} tracks \u2014 confirm before delete` : "Delete"}
        className="ml-1 rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:text-neutral-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
    </li>
  );
}

// =============================================================================
// API access panel
// =============================================================================

function ApiAccessPanel({
  apiAccess,
  onReveal,
  onCopy,
  onRotate,
}: {
  apiAccess: ApiAccess;
  onReveal?: () => void;
  onCopy?: () => void;
  onRotate?: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const handleReveal = () => {
    setRevealed(true);
    setSecondsLeft(10);
    onReveal?.();
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setRevealed(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-5">
      <PanelHeader
        title="API access"
        description="Local-only bearer token used by CLI clients and integrations to call the Cratekeeper API."
      />

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Key className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Bearer token
                </h4>
                <StatusDot status="ok" />
              </div>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
                Active since {formatRelative(apiAccess.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500">Token</label>
          <div className="mt-1.5 flex items-center gap-2">
            <div
              className="flex flex-1 items-center justify-between rounded border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950"
              style={mono}
            >
              <span className="text-neutral-700 dark:text-neutral-300">
                {revealed
                  ? `ck_live_p7Hx9aZ2vN4qR8mB5tY1jL6kW3eF...${apiAccess.tokenMaskedSuffix}`
                  : `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${apiAccess.tokenMaskedSuffix}`}
              </span>
              <div className="ml-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={revealed ? () => setRevealed(false) : handleReveal}
                  className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-sky-700 hover:underline dark:text-sky-400"
                >
                  {revealed ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Hide ({secondsLeft}s)
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Reveal
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-sky-700 hover:underline dark:text-sky-400"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-xs dark:border-neutral-800/80">
          <Field label="Last used" value={formatRelative(apiAccess.lastUsedAt)} mono />
          <Field label="Last client" value={apiAccess.lastUsedClient ?? "\u2014"} mono />
        </dl>

        <div className="mt-4 flex items-center justify-end border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
          <DangerButton onClick={onRotate}>
            <RotateCw className="h-3.5 w-3.5" strokeWidth={2.25} />
            Rotate token
          </DangerButton>
        </div>
        <p className="mt-2 text-right text-[11px] text-neutral-500">
          Rotating invalidates the current token. All clients must be re-configured.
        </p>
      </Card>
    </div>
  );
}

// =============================================================================
// Shared atoms
// =============================================================================

function StatusDot({ status }: { status: "ok" | "warn" | "error" | "off" }) {
  const map = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    error: "bg-red-500",
    off: "bg-neutral-300 dark:bg-neutral-700",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${map[status]}`} aria-hidden />;
}

function Field({
  label,
  value,
  mono: useMono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "amber" | "neutral";
}) {
  const valueColor =
    accent === "amber"
      ? "text-amber-700 dark:text-amber-400"
      : "text-neutral-800 dark:text-neutral-200";
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className={`mt-0.5 ${valueColor}`} style={useMono ? mono : undefined}>
        {value}
      </dd>
    </div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  icon,
  children,
}: {
  onClick?: () => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {icon}
      {children}
    </button>
  );
}

function DangerButton({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/30"
    >
      {children}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-sky-600 dark:bg-sky-500" : "bg-neutral-300 dark:bg-neutral-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// =============================================================================
// Helpers
// =============================================================================

const mono: React.CSSProperties = {
  fontFamily: "JetBrains Mono, ui-monospace, monospace",
};

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mo ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "\u2014";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

// Suppress unused-import warning for icons reserved for future variants
void CircleDashed;

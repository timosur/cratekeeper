import { useMemo, useRef, useState } from "react";
import {
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Link as LinkIcon,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type {
  ActionFilterOption,
  ActorFilterOption,
  AuditAction,
  AuditEntry,
  AuditLogProps,
  AuditPayload,
  AuditSeverity,
  AuditTarget,
  AuditTargetKind,
  TimeRangePreset,
} from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

const mono: React.CSSProperties = {
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontVariantNumeric: "tabular-nums",
};

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function formatRelative(iso: string, now: number = Date.now()): string {
  const ts = new Date(iso).getTime();
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

function withinPreset(iso: string, preset: TimeRangePreset, now: number): boolean {
  if (preset === "custom") return true;
  const ts = new Date(iso).getTime();
  const map: Record<Exclude<TimeRangePreset, "custom">, number> = {
    "1h": 1 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return now - ts <= map[preset];
}

const SEVERITY_DOT: Record<AuditSeverity, string> = {
  info: "bg-neutral-400 dark:bg-neutral-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  override: "bg-sky-500",
};

const SEVERITY_LABEL: Record<AuditSeverity, string> = {
  info: "Info",
  warning: "Warning",
  error: "Error",
  override: "Override",
};

const TARGET_KIND_LABEL: Record<AuditTargetKind, string> = {
  event: "Event",
  track: "Track",
  library: "Library",
  settings: "Settings",
  job: "Job",
};

const TIME_PRESETS: { value: TimeRangePreset; label: string }[] = [
  { value: "1h", label: "1h" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "custom", label: "Custom\u2026" },
];

// ─────────────────────────────────────────────────────────────────────────────
// shared atoms
// ─────────────────────────────────────────────────────────────────────────────

function Chip({
  children,
  active = false,
  onClick,
  count,
  leading,
  removable = false,
  onRemove,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  leading?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const base =
    "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300";
  const activeStyle =
    "border-sky-500 dark:border-sky-500 bg-sky-500 text-white shadow-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11.5px] font-medium transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
        active ? activeStyle : base
      }`}
    >
      {leading}
      <span>{children}</span>
      {count !== undefined ? (
        <span
          className={`tabular-nums ${
            active ? "text-white/80" : "text-neutral-500 dark:text-neutral-500"
          }`}
          style={mono}
        >
          {formatNumber(count)}
        </span>
      ) : null}
      {removable ? (
        <span
          role="button"
          aria-label="Remove filter"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm ${
            active
              ? "hover:bg-white/20"
              : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
          }`}
        >
          <X className="w-3 h-3" />
        </span>
      ) : null}
    </button>
  );
}

function SecondaryBtn({
  children,
  onClick,
  icon,
  title,
  active = false,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-[12px] font-medium transition-colors ${
        active
          ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300"
          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-sky-500 hover:bg-sky-600 text-white text-[12px] font-medium transition-colors shadow-sm"
    >
      {icon}
      {children}
    </button>
  );
}

function SeverityDot({ severity }: { severity: AuditSeverity }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[severity]}`}
      aria-hidden="true"
    />
  );
}

function ActorPill({ actor }: { actor: AuditEntry["actor"] }) {
  const isSystem = actor.kind === "system";
  return (
    <span
      className={`inline-flex items-center h-5 px-1.5 rounded text-[10.5px] font-medium ${
        isSystem
          ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300"
          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
      }`}
    >
      {actor.name}
    </span>
  );
}

function TargetChip({ target }: { target: AuditTarget }) {
  return (
    <span className="inline-flex items-center h-5 px-1.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-[10.5px] text-neutral-700 dark:text-neutral-300 max-w-[180px]">
      <span className="text-neutral-500 dark:text-neutral-500 mr-1">
        {target.kind}
      </span>
      <span style={mono} className="truncate">
        {target.id}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// page header
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({
  liveTail,
  onToggleLiveTail,
  onCopyPermalink,
  onExport,
  latestEntryAt,
}: {
  liveTail: boolean;
  onToggleLiveTail: () => void;
  onCopyPermalink?: () => void;
  onExport?: (format: "csv" | "ndjson") => void;
  latestEntryAt: string;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [permalinkCopied, setPermalinkCopied] = useState(false);

  function handlePermalink() {
    onCopyPermalink?.();
    setPermalinkCopied(true);
    setTimeout(() => setPermalinkCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            Audit Log
          </h2>
          <p className="mt-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
            Append-only history of every state-changing action.
            <span
              className="ml-2 text-neutral-400 dark:text-neutral-500"
              style={mono}
            >
              latest {formatRelative(latestEntryAt)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLiveTail}
            className={`inline-flex items-center gap-2 h-8 px-3 rounded-md border text-[12px] font-medium transition-colors ${
              liveTail
                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300"
                : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300"
            }`}
          >
            <span className="relative inline-flex w-2 h-2">
              {liveTail ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-sky-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-sky-500" />
                </>
              ) : (
                <span className="relative inline-flex w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600" />
              )}
            </span>
            Live tail {liveTail ? "on" : "off"}
            {liveTail ? (
              <Pause className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <Play className="w-3.5 h-3.5 ml-0.5" />
            )}
          </button>

          <SecondaryBtn
            onClick={handlePermalink}
            icon={
              permalinkCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <LinkIcon className="w-3.5 h-3.5" />
              )
            }
            title="Copy permalink to current filter state"
          >
            {permalinkCopied ? "Copied" : "Copy permalink"}
          </SecondaryBtn>

          <div className="relative">
            <SecondaryBtn
              onClick={() => setExportOpen((v) => !v)}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </SecondaryBtn>
            {exportOpen ? (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md py-1">
                  {(["csv", "ndjson"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        onExport?.(fmt);
                        setExportOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[12px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      Download as <span style={mono}>.{fmt}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// filter bar
// ─────────────────────────────────────────────────────────────────────────────

interface FilterState {
  timeRange: TimeRangePreset;
  actorId: string | "any";
  actionIds: Set<AuditAction>;
  targetKinds: Set<AuditTargetKind>;
  targetId: string;
  severities: Set<AuditSeverity>;
}

function emptyFilters(severities: AuditSeverity[]): FilterState {
  return {
    timeRange: "30d",
    actorId: "any",
    actionIds: new Set(),
    targetKinds: new Set(),
    targetId: "",
    severities: new Set(severities), // start with all on
  };
}

function filtersActive(f: FilterState, allSeverities: AuditSeverity[]): boolean {
  return (
    f.timeRange !== "30d" ||
    f.actorId !== "any" ||
    f.actionIds.size > 0 ||
    f.targetKinds.size > 0 ||
    f.targetId.trim().length > 0 ||
    f.severities.size !== allSeverities.length
  );
}

function FilterBar({
  filters,
  setFilters,
  filterOptions,
  filteredCount,
  totalCount,
}: {
  filters: FilterState;
  setFilters: (next: FilterState) => void;
  filterOptions: AuditLogProps["filterOptions"];
  filteredCount: number;
  totalCount: number;
}) {
  const [actionPopoverOpen, setActionPopoverOpen] = useState(false);
  const [actorOpen, setActorOpen] = useState(false);

  const selectedActor = useMemo<ActorFilterOption | undefined>(() => {
    if (filters.actorId === "any") return undefined;
    return filterOptions.actors.find((a) => a.id === filters.actorId);
  }, [filters.actorId, filterOptions.actors]);

  const groupedActions = useMemo(() => {
    const groups = new Map<string, ActionFilterOption[]>();
    for (const action of filterOptions.actions) {
      const arr = groups.get(action.namespace) ?? [];
      arr.push(action);
      groups.set(action.namespace, arr);
    }
    return Array.from(groups.entries());
  }, [filterOptions.actions]);

  const isActive = filtersActive(filters, filterOptions.severities);

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  return (
    <div className="sticky top-0 z-10 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 -mx-5 px-5 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Time range segmented */}
        <div className="inline-flex items-center rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-0.5">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setFilters({ ...filters, timeRange: p.value })}
              className={`h-6 px-2 rounded text-[11.5px] font-medium transition-colors ${
                filters.timeRange === p.value
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Actor dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActorOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[11.5px] font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          >
            <span className="text-neutral-500 dark:text-neutral-500">Actor</span>
            <span>{selectedActor ? selectedActor.name : "Anyone"}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {actorOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setActorOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md py-1">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, actorId: "any" });
                    setActorOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                    filters.actorId === "any"
                      ? "text-sky-700 dark:text-sky-300 font-medium"
                      : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <span>Anyone</span>
                  {filters.actorId === "any" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : null}
                </button>
                <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                {filterOptions.actors.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, actorId: a.id });
                      setActorOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                      filters.actorId === a.id
                        ? "text-sky-700 dark:text-sky-300 font-medium"
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          a.kind === "system" ? "bg-sky-500" : "bg-neutral-400"
                        }`}
                      />
                      {a.name}
                    </span>
                    <span
                      className="text-neutral-400 dark:text-neutral-500"
                      style={mono}
                    >
                      {formatNumber(a.count)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Action multi-select */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActionPopoverOpen((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11.5px] font-medium transition-colors ${
              filters.actionIds.size > 0
                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300"
                : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Action</span>
            {filters.actionIds.size > 0 ? (
              <span style={mono}>{filters.actionIds.size}</span>
            ) : null}
            <ChevronDown className="w-3 h-3" />
          </button>
          {actionPopoverOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setActionPopoverOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 w-[300px] max-h-[420px] overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-md py-1">
                {groupedActions.map(([namespace, actions]) => (
                  <div key={namespace}>
                    <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500 font-semibold">
                      {namespace}
                    </div>
                    {actions.map((a) => {
                      const checked = filters.actionIds.has(a.id);
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            setFilters({
                              ...filters,
                              actionIds: toggle(filters.actionIds, a.id),
                            })
                          }
                          className="w-full flex items-center justify-between px-3 py-1.5 text-[11.5px] hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span
                              className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded border ${
                                checked
                                  ? "bg-sky-500 border-sky-500"
                                  : "border-neutral-300 dark:border-neutral-700"
                              }`}
                            >
                              {checked ? (
                                <Check className="w-2.5 h-2.5 text-white" />
                              ) : null}
                            </span>
                            <span
                              className="text-neutral-700 dark:text-neutral-300 truncate"
                              style={mono}
                            >
                              {a.id}
                            </span>
                          </span>
                          <span
                            className="text-neutral-400 dark:text-neutral-500 ml-2"
                            style={mono}
                          >
                            {formatNumber(a.count)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Target kinds */}
        <div className="inline-flex items-center gap-1">
          {filterOptions.targetKinds.map((kind) => (
            <Chip
              key={kind}
              active={filters.targetKinds.has(kind)}
              onClick={() =>
                setFilters({
                  ...filters,
                  targetKinds: toggle(filters.targetKinds, kind),
                })
              }
            >
              {TARGET_KIND_LABEL[kind]}
            </Chip>
          ))}
        </div>

        {/* Target ID */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={filters.targetId}
            onChange={(e) =>
              setFilters({ ...filters, targetId: e.target.value })
            }
            placeholder={`Paste id (evt-… / trk-… / job-…)`}
            className="h-7 pl-6 pr-6 w-[240px] rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[11.5px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:border-sky-500"
            style={mono}
          />
          {filters.targetId ? (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, targetId: "" })}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-4 h-4 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
              aria-label="Clear target id"
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}
        </div>

        {/* Severity chips */}
        <div className="inline-flex items-center gap-1">
          {filterOptions.severities.map((sev) => {
            const checked = filters.severities.has(sev);
            return (
              <button
                key={sev}
                type="button"
                onClick={() =>
                  setFilters({
                    ...filters,
                    severities: toggle(filters.severities, sev),
                  })
                }
                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border text-[11.5px] font-medium transition-colors ${
                  checked
                    ? "border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                    : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-neutral-400 dark:text-neutral-600"
                }`}
              >
                <SeverityDot severity={sev} />
                {SEVERITY_LABEL[sev]}
              </button>
            );
          })}
        </div>

        {/* Reset */}
        {isActive ? (
          <button
            type="button"
            onClick={() => setFilters(emptyFilters(filterOptions.severities))}
            className="inline-flex items-center gap-1 h-7 px-2 text-[11.5px] text-sky-600 dark:text-sky-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        ) : null}

        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span style={mono}>{formatNumber(filteredCount)}</span>
          <span>entries</span>
          <span className="text-neutral-400 dark:text-neutral-600">
            {"\u00b7"}
          </span>
          <span>filtered from</span>
          <span style={mono}>{formatNumber(totalCount)}</span>
        </div>
      </div>

      {/* Selected action chips below the bar */}
      {filters.actionIds.size > 0 ? (
        <div className="flex items-center gap-1.5 flex-wrap mt-2">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-500 mr-1">
            Actions:
          </span>
          {Array.from(filters.actionIds).map((id) => (
            <Chip
              key={id}
              active
              removable
              onRemove={() => {
                const next = new Set(filters.actionIds);
                next.delete(id);
                setFilters({ ...filters, actionIds: next });
              }}
            >
              <span style={mono}>{id}</span>
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON diff
// ─────────────────────────────────────────────────────────────────────────────

type DiffLine =
  | { kind: "add"; key: string; value: string; depth: number }
  | { kind: "del"; key: string; value: string; depth: number }
  | { kind: "same"; key: string; value: string; depth: number }
  | { kind: "collapsed"; count: number };

function stringifyValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v);
}

function diffPayload(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { left: DiffLine[]; right: DiffLine[] } {
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];

  if (!before && !after) return { left, right };

  if (!before && after) {
    for (const [k, v] of Object.entries(after)) {
      left.push({ kind: "same", key: k, value: "\u2014", depth: 0 });
      right.push({ kind: "add", key: k, value: stringifyValue(v), depth: 0 });
    }
    return { left, right };
  }

  if (before && !after) {
    for (const [k, v] of Object.entries(before)) {
      left.push({ kind: "del", key: k, value: stringifyValue(v), depth: 0 });
      right.push({ kind: "same", key: k, value: "\u2014", depth: 0 });
    }
    return { left, right };
  }

  const b = before as Record<string, unknown>;
  const a = after as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));

  // Group unchanged-keys runs to collapse
  let unchangedRun = 0;
  const flush = () => {
    if (unchangedRun >= 4) {
      left.push({ kind: "collapsed", count: unchangedRun });
      right.push({ kind: "collapsed", count: unchangedRun });
    }
    unchangedRun = 0;
  };

  for (const k of keys) {
    const inB = k in b;
    const inA = k in a;
    const sb = inB ? stringifyValue(b[k]) : "";
    const sa = inA ? stringifyValue(a[k]) : "";

    if (inB && inA && sb === sa) {
      unchangedRun++;
      if (unchangedRun < 4) {
        left.push({ kind: "same", key: k, value: sb, depth: 0 });
        right.push({ kind: "same", key: k, value: sa, depth: 0 });
      }
      continue;
    }
    flush();
    if (inB && !inA) {
      left.push({ kind: "del", key: k, value: sb, depth: 0 });
      right.push({ kind: "same", key: k, value: "\u2014", depth: 0 });
    } else if (!inB && inA) {
      left.push({ kind: "same", key: k, value: "\u2014", depth: 0 });
      right.push({ kind: "add", key: k, value: sa, depth: 0 });
    } else {
      left.push({ kind: "del", key: k, value: sb, depth: 0 });
      right.push({ kind: "add", key: k, value: sa, depth: 0 });
    }
  }
  flush();

  return { left, right };
}

function DiffSide({ lines, side }: { lines: DiffLine[]; side: "before" | "after" }) {
  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <div className="px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <span className="text-[10.5px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400">
          {side === "before" ? "Before" : "After"}
        </span>
      </div>
      <div className="p-3">
        {lines.length === 0 ? (
          <div
            className="text-[11.5px] text-neutral-400 dark:text-neutral-600 italic"
            style={mono}
          >
            (empty)
          </div>
        ) : (
          <div className="space-y-0.5" style={mono}>
            {lines.map((l, i) => {
              if (l.kind === "collapsed") {
                return (
                  <div
                    key={i}
                    className="text-[11px] text-neutral-400 dark:text-neutral-600 italic px-2 py-0.5"
                  >
                    {"\u2026 "}
                    {l.count} unchanged keys
                  </div>
                );
              }
              const symbol =
                l.kind === "add" ? "+" : l.kind === "del" ? "\u2212" : " ";
              const colorClass =
                l.kind === "add"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                  : l.kind === "del"
                    ? "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300"
                    : "text-neutral-500 dark:text-neutral-500";
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-2 py-0.5 rounded text-[11.5px] leading-relaxed ${colorClass}`}
                >
                  <span className="w-3 text-center flex-shrink-0 opacity-70">
                    {symbol}
                  </span>
                  <span className="font-semibold flex-shrink-0">{l.key}:</span>
                  <span className="break-all">{l.value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PayloadDiff({ payload }: { payload: AuditPayload }) {
  const { left, right } = useMemo(
    () => diffPayload(payload.before, payload.after),
    [payload],
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <DiffSide lines={left} side="before" />
      <DiffSide lines={right} side="after" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// timeline rows
// ─────────────────────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  expanded,
  onExpand,
  onCopyId,
  onJump,
  onCopyJson,
  onCopyEntryPermalink,
  isFresh,
}: {
  entry: AuditEntry;
  expanded: boolean;
  onExpand: () => void;
  onCopyId: () => void;
  onJump: () => void;
  onCopyJson: () => void;
  onCopyEntryPermalink: () => void;
  isFresh: boolean;
}) {
  const isOverride = entry.severity === "override";

  return (
    <div
      className={`border-b border-neutral-200 dark:border-neutral-800 transition-colors ${
        isOverride ? "border-l-2 border-l-sky-500" : "border-l-2 border-l-transparent"
      } ${isFresh ? "bg-sky-50/60 dark:bg-sky-950/20" : ""}`}
    >
      <button
        type="button"
        onClick={onExpand}
        className="group w-full flex items-center gap-3 px-4 h-11 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 focus:outline-none focus:bg-neutral-50 dark:focus:bg-neutral-900/50"
      >
        <SeverityDot severity={entry.severity} />

        <span
          className="text-[11px] text-neutral-500 dark:text-neutral-500 w-[140px] flex-shrink-0"
          style={mono}
          title={formatAbsolute(entry.timestamp)}
        >
          {formatAbsolute(entry.timestamp).slice(5)}
        </span>

        <div className="flex-shrink-0">
          <ActorPill actor={entry.actor} />
        </div>

        <span
          className="text-[11.5px] text-neutral-700 dark:text-neutral-300 font-medium w-[180px] flex-shrink-0 truncate"
          style={mono}
        >
          {entry.action}
        </span>

        {isOverride ? (
          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-semibold flex-shrink-0">
            <ShieldAlert className="w-3 h-3" />
            OVERRIDE
          </span>
        ) : null}

        <div className="flex-shrink-0">
          <TargetChip target={entry.target} />
        </div>

        <span className="flex-1 min-w-0 text-[12px] text-neutral-600 dark:text-neutral-400 truncate">
          {entry.summary}
        </span>

        {/* Hover quick actions */}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          <span
            role="button"
            title="Copy target id"
            onClick={(e) => {
              e.stopPropagation();
              onCopyId();
            }}
            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
          >
            <Copy className="w-3 h-3" />
          </span>
          <span
            role="button"
            title="Jump to target"
            onClick={(e) => {
              e.stopPropagation();
              onJump();
            }}
            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
          >
            <ExternalLink className="w-3 h-3" />
          </span>
          <span
            role="button"
            title="Copy entry as JSON"
            onClick={(e) => {
              e.stopPropagation();
              onCopyJson();
            }}
            className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
          >
            <span className="text-[9px] font-bold" style={mono}>
              {"{ }"}
            </span>
          </span>
        </span>

        <ChevronRight
          className={`w-4 h-4 text-neutral-400 dark:text-neutral-600 flex-shrink-0 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded ? (
        <ExpandedPanel
          entry={entry}
          onJump={onJump}
          onCopyJson={onCopyJson}
          onCopyEntryPermalink={onCopyEntryPermalink}
        />
      ) : null}
    </div>
  );
}

function ExpandedPanel({
  entry,
  onJump,
  onCopyJson,
  onCopyEntryPermalink,
}: {
  entry: AuditEntry;
  onJump: () => void;
  onCopyJson: () => void;
  onCopyEntryPermalink: () => void;
}) {
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  return (
    <div className="bg-neutral-50/70 dark:bg-neutral-950/50 border-t border-neutral-200 dark:border-neutral-800 px-4 py-4">
      {/* Metadata strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-[11.5px]">
            <span className="text-neutral-500 dark:text-neutral-500">
              Action
            </span>
            <span
              className="text-neutral-800 dark:text-neutral-200"
              style={mono}
            >
              {entry.action}
            </span>
            <span className="text-neutral-500 dark:text-neutral-500">Actor</span>
            <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <ActorPill actor={entry.actor} />
            </span>
            <span className="text-neutral-500 dark:text-neutral-500">
              Target
            </span>
            <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 min-w-0">
              <span className="text-neutral-500 dark:text-neutral-500">
                {entry.target.kind}
              </span>
              <span style={mono} className="truncate">
                {entry.target.id}
              </span>
              <span className="text-neutral-400 dark:text-neutral-600 truncate">
                {"\u2014"} {entry.target.label}
              </span>
            </span>
            <span className="text-neutral-500 dark:text-neutral-500">When</span>
            <span className="text-neutral-800 dark:text-neutral-200">
              <span style={mono}>{formatAbsolute(entry.timestamp)}</span>
              <span className="ml-2 text-neutral-500 dark:text-neutral-500">
                ({formatRelative(entry.timestamp)})
              </span>
            </span>
          </div>
        </div>

        <div
          className={`rounded-md border p-3 ${
            entry.severity === "override"
              ? "border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/20"
              : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          }`}
        >
          <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-[11.5px]">
            <span className="text-neutral-500 dark:text-neutral-500">
              Job ID
            </span>
            <span
              className="text-neutral-800 dark:text-neutral-200"
              style={mono}
            >
              {entry.jobId ?? (
                <span className="text-neutral-400 dark:text-neutral-600">
                  {"\u2014"}
                </span>
              )}
            </span>
            <span className="text-neutral-500 dark:text-neutral-500">
              Severity
            </span>
            <span className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
              <SeverityDot severity={entry.severity} />
              {SEVERITY_LABEL[entry.severity]}
            </span>
            <span className="text-neutral-500 dark:text-neutral-500">
              Entry ID
            </span>
            <span
              className="text-neutral-800 dark:text-neutral-200 truncate"
              style={mono}
              title={entry.id}
            >
              {entry.id}
            </span>
            {entry.overrideReason ? (
              <>
                <span className="text-sky-700 dark:text-sky-400 font-semibold flex items-start gap-1">
                  <ShieldAlert className="w-3 h-3 mt-0.5" />
                  Reason
                </span>
                <span className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  {entry.overrideReason}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Diff */}
      <PayloadDiff payload={entry.payload} />

      {/* Footer actions */}
      <div className="flex items-center gap-2 mt-4">
        <PrimaryBtn onClick={onJump} icon={<ExternalLink className="w-3.5 h-3.5" />}>
          Jump to {entry.target.kind}
        </PrimaryBtn>
        <SecondaryBtn
          onClick={() => {
            onCopyJson();
            setJsonCopied(true);
            setTimeout(() => setJsonCopied(false), 1500);
          }}
          icon={
            jsonCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )
          }
        >
          {jsonCopied ? "Copied" : "Copy as JSON"}
        </SecondaryBtn>
        <SecondaryBtn
          onClick={() => {
            onCopyEntryPermalink();
            setPermalinkCopied(true);
            setTimeout(() => setPermalinkCopied(false), 1500);
          }}
          icon={
            permalinkCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )
          }
        >
          {permalinkCopied ? "Copied" : "Copy permalink"}
        </SecondaryBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// loading + empty
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
      </div>
      <h3 className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-200">
        Nothing matches these filters
      </h3>
      <p className="mt-1 text-[12px] text-neutral-500 dark:text-neutral-400 max-w-sm">
        Try widening the time range or clearing one of the filters above.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-sky-600 dark:text-sky-400 hover:underline"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset filters
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// main component
// ─────────────────────────────────────────────────────────────────────────────

export function AuditLog({
  entries,
  filterOptions,
  stats,
  initialLiveTail = false,
  onToggleLiveTail,
  onCopyPermalink,
  onExport,
  onExpandEntry,
  onJumpToTarget,
  onCopyEntryJson,
  onCopyEntryPermalink,
  onCopyTargetId,
}: AuditLogProps) {
  const [filters, setFilters] = useState<FilterState>(() =>
    emptyFilters(filterOptions.severities),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [liveTail, setLiveTail] = useState(initialLiveTail);
  const now = useRef(Date.now()).current;

  const filtered = useMemo(() => {
    const tid = filters.targetId.trim().toLowerCase();
    return entries.filter((e) => {
      if (!withinPreset(e.timestamp, filters.timeRange, now)) return false;
      if (filters.actorId !== "any") {
        const actor = filterOptions.actors.find((a) => a.id === filters.actorId);
        if (!actor) return false;
        if (e.actor.kind !== actor.kind) return false;
        if (actor.kind !== "system" && e.actor.name !== actor.name) return false;
      }
      if (filters.actionIds.size > 0 && !filters.actionIds.has(e.action))
        return false;
      if (
        filters.targetKinds.size > 0 &&
        !filters.targetKinds.has(e.target.kind)
      )
        return false;
      if (tid && !e.target.id.toLowerCase().includes(tid)) return false;
      if (!filters.severities.has(e.severity)) return false;
      return true;
    });
  }, [entries, filters, filterOptions.actors, now]);

  function handleToggleLiveTail() {
    const next = !liveTail;
    setLiveTail(next);
    onToggleLiveTail?.(next);
  }

  function handleExpand(id: string) {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    if (next) onExpandEntry?.(next);
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-5 space-y-4">
      <PageHeader
        liveTail={liveTail}
        onToggleLiveTail={handleToggleLiveTail}
        onCopyPermalink={() => onCopyPermalink?.(window.location.href)}
        onExport={onExport}
        latestEntryAt={stats.latestEntryAt}
      />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        filteredCount={filtered.length}
        totalCount={stats.totalEntries}
      />

      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            onReset={() => setFilters(emptyFilters(filterOptions.severities))}
          />
        ) : (
          <div>
            {filtered.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onExpand={() => handleExpand(entry.id)}
                onCopyId={() => onCopyTargetId?.(entry.target.id)}
                onJump={() => onJumpToTarget?.(entry.target)}
                onCopyJson={() => onCopyEntryJson?.(entry)}
                onCopyEntryPermalink={() => onCopyEntryPermalink?.(entry.id)}
                isFresh={liveTail && i === 0}
              />
            ))}
          </div>
        )}

        {/* Live tail footer */}
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40">
          {liveTail ? (
            <>
              <span className="relative inline-flex w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-sky-500 opacity-75 animate-ping" />
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-sky-500" />
              </span>
              <span
                className="text-[11px] text-neutral-500 dark:text-neutral-400"
                style={mono}
              >
                Watching for new entries{"\u2026"}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-600">
              Live tail paused. Showing {formatNumber(filtered.length)} entries
              up to {formatRelative(stats.latestEntryAt)}.
            </span>
          )}
        </div>
      </div>

      {/* Footnote */}
      <div className="flex items-center justify-between text-[10.5px] text-neutral-400 dark:text-neutral-600 px-1">
        <span className="inline-flex items-center gap-1.5">
          <Activity className="w-3 h-3" />
          Append-only. Entries cannot be edited or deleted. Retention is
          configured in Settings.
        </span>
        <span className="inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <kbd
              className="px-1 h-4 inline-flex items-center rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[9px] font-semibold text-neutral-600 dark:text-neutral-400"
              style={mono}
            >
              {"\u2191\u2193"}
            </kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd
              className="px-1 h-4 inline-flex items-center rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[9px] font-semibold text-neutral-600 dark:text-neutral-400"
              style={mono}
            >
              Enter
            </kbd>
            expand
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd
              className="px-1 h-4 inline-flex items-center rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[9px] font-semibold text-neutral-600 dark:text-neutral-400"
              style={mono}
            >
              c
            </kbd>
            copy id
          </span>
        </span>
      </div>
    </div>
  );
}

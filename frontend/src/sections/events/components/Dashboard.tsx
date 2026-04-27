import { useMemo } from "react";
import {
  Plus,
  ExternalLink,
  AlertTriangle,
  Loader2,
  RotateCw,
  Clock,
  ListMusic,
} from "lucide-react";
import type {
  DashboardProps,
  EventCard as EventCardData,
  ActiveJob,
} from "../types";

// =============================================================================
// Top-level Dashboard
// =============================================================================

export function Dashboard({
  events,
  onCreateEvent,
  onOpenEvent,
  onResumeJob,
}: DashboardProps) {
  const isEmpty = events.length === 0;

  return (
    <div
      className="mx-auto w-full max-w-[1400px]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="flex items-end justify-between border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Events
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
            {isEmpty
              ? "No events yet."
              : `${events.length} active ${events.length === 1 ? "event" : "events"} \u2014 ${pluralizeAttention(
                  countNeedsAttention(events),
                )}.`}
          </p>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={onCreateEvent}
            className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            New Event
          </button>
        )}
      </header>

      {/* Body */}
      {isEmpty ? (
        <EmptyState onCreateEvent={onCreateEvent} />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={() => onOpenEvent?.(event.id)}
              onResume={() =>
                event.activeJob && onResumeJob?.(event.id, event.activeJob.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Event Card
// =============================================================================

interface EventCardProps {
  event: EventCardData;
  onOpen: () => void;
  onResume: () => void;
}

function EventCard({ event, onOpen, onResume }: EventCardProps) {
  const matchPct = event.trackCounts.total
    ? Math.round((event.trackCounts.matched / event.trackCounts.total) * 100)
    : 0;
  const playlistHost = useMemo(() => safeHost(event.playlistUrl), [event.playlistUrl]);

  const canResume =
    event.activeJob?.status === "failed" || event.activeJob?.status === "cancelled";

  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      className="group relative flex cursor-pointer flex-col rounded-md border border-neutral-200 bg-white transition-all hover:border-neutral-300 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
    >
      {/* Top: name + date */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            {event.name}
          </h2>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500">
            <span>{formatEventDate(event.eventDate)}</span>
            <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span>
            <span
              className="truncate text-[11px] text-neutral-500"
              style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
            >
              {event.slug}
            </span>
          </div>
        </div>
      </div>

      {/* Playlist URL */}
      <a
        href={event.playlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mx-4 mt-2 inline-flex max-w-fit items-center gap-1 rounded text-[11px] text-neutral-500 hover:text-sky-700 dark:text-neutral-500 dark:hover:text-sky-400"
        style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
      >
        <span className="truncate">{playlistHost}</span>
        <ExternalLink className="h-3 w-3 flex-shrink-0" strokeWidth={1.75} />
      </a>

      {/* Step + progress bar */}
      <div className="px-4 pt-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            {event.currentStepLabel}
          </span>
          <span
            className="text-[10px] uppercase tracking-wider text-neutral-500"
            style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
          >
            step {event.currentStepIndex + 1} / {event.totalSteps}
          </span>
        </div>
        <StepProgress
          totalSteps={event.totalSteps}
          currentStepIndex={event.currentStepIndex}
          isStale={event.isStale}
        />
      </div>

      {/* Track counts */}
      <div className="mx-4 mt-4 grid grid-cols-3 divide-x divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-50 text-center dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
        <CountCell label="Total" value={event.trackCounts.total} />
        <CountCell
          label="Matched"
          value={event.trackCounts.matched}
          accent={matchPct >= 95 ? "emerald" : matchPct >= 80 ? "neutral" : "amber"}
        />
        <CountCell
          label="Tagged"
          value={event.trackCounts.tagged}
          accent={event.trackCounts.tagged === event.trackCounts.total ? "emerald" : "neutral"}
        />
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3">
        {event.activeJob && <JobBadge job={event.activeJob} />}
        {!event.activeJob && allDone(event) && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Complete
          </span>
        )}
        {event.isStale && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" strokeWidth={2} />
            Build stale
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800/80">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-500">
          <Clock className="h-3 w-3" strokeWidth={1.75} />
          <span>Updated {formatRelative(event.lastActivityAt)}</span>
        </div>
        {canResume ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onResume();
            }}
            className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
          >
            <RotateCw className="h-3 w-3" strokeWidth={2} />
            Resume
          </button>
        ) : null}
      </div>
    </article>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function StepProgress({
  totalSteps,
  currentStepIndex,
  isStale,
}: {
  totalSteps: number;
  currentStepIndex: number;
  isStale: boolean;
}) {
  return (
    <div className="flex h-1.5 gap-[2px]">
      {Array.from({ length: totalSteps }).map((_, i) => {
        let cls = "bg-neutral-200 dark:bg-neutral-800";
        if (i < currentStepIndex) {
          cls = isStale
            ? "bg-amber-400 dark:bg-amber-500"
            : "bg-emerald-500 dark:bg-emerald-500";
        } else if (i === currentStepIndex) {
          cls = "bg-sky-500 dark:bg-sky-400";
        }
        return (
          <span
            key={i}
            className={`h-full flex-1 rounded-sm transition-colors ${cls}`}
          />
        );
      })}
    </div>
  );
}

function CountCell({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: number;
  accent?: "neutral" | "emerald" | "amber";
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-700 dark:text-amber-400"
        : "text-neutral-900 dark:text-neutral-100";
  return (
    <div className="px-2 py-2">
      <div
        className={`text-sm font-semibold ${valueColor}`}
        style={{ fontFamily: "JetBrains Mono, ui-monospace, monospace" }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
        {label}
      </div>
    </div>
  );
}

function JobBadge({ job }: { job: ActiveJob }) {
  const map: Record<
    ActiveJob["status"],
    { bg: string; border: string; text: string; dot: string; label: string; icon?: React.ReactNode }
  > = {
    running: {
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-sky-200 dark:border-sky-900",
      text: "text-sky-700 dark:text-sky-300",
      dot: "bg-sky-500",
      label: `Running\u2002\u00b7\u2002${job.label}${typeof job.progress === "number" ? `\u2002${Math.round(job.progress * 100)}%` : ""}`,
      icon: <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.25} />,
    },
    queued: {
      bg: "bg-neutral-100 dark:bg-neutral-800/60",
      border: "border-neutral-200 dark:border-neutral-700",
      text: "text-neutral-700 dark:text-neutral-300",
      dot: "bg-neutral-400",
      label: `Queued\u2002\u00b7\u2002${job.label}${job.queuePosition ? `\u2002\u2002#${job.queuePosition}` : ""}`,
    },
    failed: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-900",
      text: "text-red-700 dark:text-red-400",
      dot: "bg-red-500",
      label: `Failed\u2002\u00b7\u2002${job.label}`,
    },
    cancelled: {
      bg: "bg-neutral-100 dark:bg-neutral-800/60",
      border: "border-neutral-200 dark:border-neutral-700",
      text: "text-neutral-700 dark:text-neutral-300",
      dot: "bg-neutral-400",
      label: `Cancelled\u2002\u00b7\u2002${job.label}`,
    },
    succeeded: {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-900",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
      label: `Done\u2002\u00b7\u2002${job.label}`,
    },
  };
  const s = map[job.status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.bg} ${s.border} ${s.text}`}
      title={job.errorMessage ?? undefined}
    >
      {s.icon ?? <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />}
      <span>{s.label}</span>
    </span>
  );
}

function EmptyState({ onCreateEvent }: { onCreateEvent?: () => void }) {
  return (
    <div className="mx-auto mt-20 flex max-w-md flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-600">
        <ListMusic className="h-7 w-7" strokeWidth={1.5} />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        No events yet
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
        Pull a Spotify playlist and turn it into a tagged, sorted event folder ready for your DJ software.
      </p>
      <button
        type="button"
        onClick={onCreateEvent}
        className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Create your first event
      </button>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "") + new URL(url).pathname;
  } catch {
    return url;
  }
}

function formatEventDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string): string {
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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function allDone(event: EventCardData): boolean {
  const c = event.trackCounts;
  return c.total > 0 && c.tagged === c.total;
}

function countNeedsAttention(events: EventCardData[]): number {
  return events.filter(
    (e) => e.isStale || e.activeJob?.status === "failed" || e.activeJob?.status === "cancelled",
  ).length;
}

function pluralizeAttention(n: number): string {
  if (n === 0) return "all healthy";
  if (n === 1) return "1 needs attention";
  return `${n} need attention`;
}

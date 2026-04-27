import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { Dashboard } from "../sections/events/components";
import { useNewEvent } from "../components/NewEventContext";
import { useEvents } from "../lib/queries/useEvents";

export function EventsPage() {
  const navigate = useNavigate();
  const { open: openNewEvent } = useNewEvent();
  const { data, isLoading, isError, error, refetch, isFetching } = useEvents();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <DashboardErrorState
        message={(error as Error | undefined)?.message}
        isRetrying={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <Dashboard
      events={data ?? []}
      onCreateEvent={openNewEvent}
      onOpenEvent={(id) => navigate(`/events/${id}`)}
      onResumeJob={(eventId, jobId) => {
        // Wired to backend job runner in CRATE-4.
        console.info("resume job", { eventId, jobId });
      }}
    />
  );
}

// =============================================================================
// Loading skeleton — 8 placeholder cards mirroring the real layout.
// =============================================================================

function DashboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-[1400px]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      aria-busy="true"
      aria-live="polite"
    >
      <header className="flex items-end justify-between border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div>
          <div className="h-7 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
      </header>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex animate-pulse flex-col rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0 flex-1">
          <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="mt-2 h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
      </div>
      <div className="mx-4 mt-2 h-3 w-32 rounded bg-neutral-100 dark:bg-neutral-900" />
      <div className="px-4 pt-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-2.5 w-16 rounded bg-neutral-100 dark:bg-neutral-900" />
        </div>
        <div className="flex h-1.5 gap-[2px]">
          {Array.from({ length: 11 }).map((_, i) => (
            <span
              key={i}
              className="h-full flex-1 rounded-sm bg-neutral-200 dark:bg-neutral-800"
            />
          ))}
        </div>
      </div>
      <div className="mx-4 mt-4 grid grid-cols-3 divide-x divide-neutral-200 rounded-md border border-neutral-200 bg-neutral-50 text-center dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-2 py-2">
            <div className="mx-auto h-4 w-8 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="mx-auto mt-1.5 h-2 w-10 rounded bg-neutral-100 dark:bg-neutral-900" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <div className="h-4 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800/80">
        <div className="h-3 w-28 rounded bg-neutral-100 dark:bg-neutral-900" />
      </div>
    </div>
  );
}

// =============================================================================
// Error state — recoverable, with Retry button.
// =============================================================================

function DashboardErrorState({
  message,
  isRetrying,
  onRetry,
}: {
  message?: string;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      className="mx-auto w-full max-w-[1400px]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <header className="flex items-end justify-between border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Events
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
            Could not load events.
          </p>
        </div>
      </header>

      <div
        role="alert"
        className="mt-10 flex flex-col items-center rounded-md border border-rose-200 bg-rose-50/60 px-6 py-12 text-center dark:border-rose-900/60 dark:bg-rose-950/30"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <h2 className="mt-4 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Could not load events
        </h2>
        <p className="mt-1 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
          {message ?? "The API is unreachable. Check that the backend is running."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-progress disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
          ) : (
            <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
          )}
          {isRetrying ? "Retrying…" : "Retry"}
        </button>
      </div>
    </div>
  );
}

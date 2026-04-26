import { useMemo, useState } from "react";
import {
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  Play,
  Pause,
  Square,
  RotateCw,
  FileSearch,
  Undo2,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ArrowDownToLine,
  Folder,
  Music2,
  Disc3,
  Download,
  CheckCheck,
  CircleDashed,
  Star,
  Library,
  Wrench,
} from "lucide-react";
import type {
  EventDetailProps,
  PipelineStep,
  StepId,
  StepStatus,
  StepPhase,
  ActiveJob,
  QualityGate,
  ReviewTrack,
  MatchedTrack,
  MissedTrack,
  MoodAnalysisRow,
  TagCostEstimate,
  JobLogLine,
  GenreDistributionEntry,
  ActivityEntry,
  EventDetail as EventDetailData,
  EventDetailDetails,
} from "../types";

// =============================================================================
// Top-level component
// =============================================================================

export function EventDetail({
  event,
  details,
  onSelectStep,
  onRunStep,
  onPauseJob,
  onCancelJob,
  onResumeJob,
  onDryRunStep,
  onOpenQualityChecks,
  onBulkRebucket,
  onEstimateTagCost,
  onDispatchTagClassification,
  onUndoTags,
  onCopyTidalUrl,
  onOpenLocalFile,
  onOpenSpotify,
  onOpenTidal,
  onExportMissesTidalUrls,
  onPromoteToLibrary,
  onViewAllActivity,
  onRepairInLibrary,
}: EventDetailProps & { onRepairInLibrary?: (track: MatchedTrack) => void }) {
  const [selectedStepId, setSelectedStepId] = useState<StepId>(event.activeStepId);
  const activeStep =
    event.steps.find((s) => s.id === selectedStepId) ?? event.steps[0];

  const handleSelectStep = (id: StepId) => {
    setSelectedStepId(id);
    onSelectStep?.(id);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-5"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <EventHeader
        event={event}
        onOpenQualityChecks={onOpenQualityChecks}
        onShowMissingMasterpieces={() => handleSelectStep("match")}
      />

      <div className="flex gap-5">
        <StepRail
          steps={event.steps}
          activeStepId={selectedStepId}
          onSelectStep={handleSelectStep}
        />

        <div className="min-w-0 flex-1">
          <StepPanel
            event={event}
            step={activeStep}
            details={details}
            onRunStep={onRunStep}
            onPauseJob={onPauseJob}
            onCancelJob={onCancelJob}
            onResumeJob={onResumeJob}
            onDryRunStep={onDryRunStep}
            onBulkRebucket={onBulkRebucket}
            onEstimateTagCost={onEstimateTagCost}
            onDispatchTagClassification={onDispatchTagClassification}
            onUndoTags={onUndoTags}
            onCopyTidalUrl={onCopyTidalUrl}
            onOpenLocalFile={onOpenLocalFile}
            onOpenSpotify={onOpenSpotify}
            onOpenTidal={onOpenTidal}
            onExportMissesTidalUrls={onExportMissesTidalUrls}
            onPromoteToLibrary={onPromoteToLibrary}
            onRepairInLibrary={onRepairInLibrary}
          />

          <RecentActivity
            entries={event.recentActivity}
            onViewAllActivity={onViewAllActivity}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Header
// =============================================================================

function EventHeader({
  event,
  onOpenQualityChecks,
  onShowMissingMasterpieces,
}: {
  event: EventDetailData;
  onOpenQualityChecks?: () => void;
  onShowMissingMasterpieces?: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-neutral-200 pb-5 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {event.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-500">
            <span>{formatEventDate(event.eventDate)}</span>
            <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span>
            <span style={mono}>{event.slug}</span>
          </div>
        </div>
        <a
          href={event.playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
        >
          <span>Spotify playlist</span>
          <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
        </a>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 divide-x divide-neutral-200 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950">
        <StatCell label="Total" value={event.trackCounts.total} />
        <StatCell
          label="Matched"
          value={event.trackCounts.matched}
          accent={
            event.trackCounts.total &&
            event.trackCounts.matched / event.trackCounts.total >= 0.95
              ? "emerald"
              : "neutral"
          }
        />
        <StatCell
          label="From Library"
          value={event.trackCounts.fromLibrary}
          icon={<Library className="h-3 w-3" strokeWidth={2.25} />}
          accent="sky"
        />
        <StatCell label="Tagged" value={event.trackCounts.tagged} />
      </div>

      {/* Banners */}
      {event.qualityGate.failingCount > 0 && (
        <Banner
          tone="red"
          icon={<AlertCircle className="h-4 w-4" strokeWidth={2} />}
          title={`${event.qualityGate.failingCount} quality check${event.qualityGate.failingCount === 1 ? "" : "s"} failing`}
          description="Destructive steps are blocked until these are resolved or overridden."
          action={{ label: "Review checks", onClick: onOpenQualityChecks }}
        />
      )}
      {event.qualityGate.failingCount === 0 && event.qualityGate.warningCount > 0 && (
        <Banner
          tone="amber"
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} />}
          title={`${event.qualityGate.warningCount} quality warning${event.qualityGate.warningCount === 1 ? "" : "s"}`}
          description={"Advisory only \u2014 destructive steps are still allowed."}
          action={{ label: "Review checks", onClick: onOpenQualityChecks }}
        />
      )}
      {event.missingMasterpieces.count > 0 && (
        <Banner
          tone="red"
          icon={<AlertCircle className="h-4 w-4" strokeWidth={2} />}
          title={`${event.missingMasterpieces.count} masterpiece${event.missingMasterpieces.count === 1 ? "" : "s"} missing on disk`}
          description={"Promoted Master Library files are gone. Repair them in the Library before destructive Build steps."}
          action={{ label: "Show in Match", onClick: onShowMissingMasterpieces }}
        />
      )}
      {event.staleBuilds.length > 0 && (
        <Banner
          tone="amber"
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={2} />}
          title="Builds out of date"
          description={event.staleBuilds.map((s) => s.reason).join(" \u2014 ")}
          action={{ label: "Rebuild", onClick: () => {} }}
        />
      )}
    </header>
  );
}

function StatCell({
  label,
  value,
  accent = "neutral",
  icon,
}: {
  label: string;
  value: number;
  accent?: "neutral" | "emerald" | "amber" | "sky";
  icon?: React.ReactNode;
}) {
  const valueColor =
    accent === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : accent === "amber"
        ? "text-amber-700 dark:text-amber-400"
        : accent === "sky"
          ? "text-sky-700 dark:text-sky-400"
          : "text-neutral-900 dark:text-neutral-100";
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
        {icon ? <span className={accent === "sky" ? "text-sky-500/70" : ""}>{icon}</span> : null}
        {label}
      </div>
      <div className={`mt-0.5 text-lg font-semibold ${valueColor}`} style={mono}>
        {value}
      </div>
    </div>
  );
}

function Banner({
  tone,
  icon,
  title,
  description,
  action,
}: {
  tone: "red" | "amber";
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void };
}) {
  const styles =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-md border px-4 py-3 ${styles}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5">{icon}</span>
        <div>
          <div className="text-sm font-medium">{title}</div>
          {description && <div className="mt-0.5 text-xs opacity-80">{description}</div>}
        </div>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="flex-shrink-0 rounded-md border border-current/20 bg-white/40 px-2.5 py-1 text-xs font-medium hover:bg-white/70 dark:bg-black/20 dark:hover:bg-black/40"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Step Rail
// =============================================================================

const PHASE_ORDER: StepPhase[] = [
  "Intake",
  "Classify",
  "Library",
  "Analysis",
  "Tagging",
  "Build",
];

function StepRail({
  steps,
  activeStepId,
  onSelectStep,
}: {
  steps: PipelineStep[];
  activeStepId: StepId;
  onSelectStep?: (id: StepId) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<StepPhase, PipelineStep[]>();
    for (const phase of PHASE_ORDER) map.set(phase, []);
    for (const step of steps) map.get(step.phase)?.push(step);
    return map;
  }, [steps]);

  return (
    <aside className="sticky top-4 h-fit w-[260px] flex-shrink-0 self-start rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Pipeline
        </div>
      </div>
      <nav className="px-2 py-2">
        {PHASE_ORDER.map((phase) => {
          const phaseSteps = grouped.get(phase) ?? [];
          if (phaseSteps.length === 0) return null;
          return (
            <div key={phase} className="mb-2 last:mb-0">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-600">
                {phase}
              </div>
              <ul className="space-y-0.5">
                {phaseSteps.map((step) => {
                  const isActive = step.id === activeStepId;
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => onSelectStep?.(step.id)}
                        className={`group flex h-8 w-full items-center gap-2 rounded-md border-l-2 px-2 text-left text-xs transition-colors ${
                          isActive
                            ? "border-sky-600 bg-sky-50 font-medium text-sky-700 dark:border-sky-400 dark:bg-sky-950/40 dark:text-sky-300"
                            : "border-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800/60"
                        }`}
                      >
                        <span
                          className={`w-4 text-right text-[10px] ${isActive ? "text-sky-500 dark:text-sky-400" : "text-neutral-400 dark:text-neutral-600"}`}
                          style={mono}
                        >
                          {step.index}
                        </span>
                        <span className="flex-1 truncate">{step.label}</span>
                        <StepStatusIcon status={step.status} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function StepStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500 dark:text-sky-400" strokeWidth={2.25} />;
    case "succeeded":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />;
    case "stale":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />;
    case "cancelled":
      return <Circle className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" strokeWidth={2} />;
    case "idle":
    default:
      return <Circle className="h-3.5 w-3.5 text-neutral-300 dark:text-neutral-700" strokeWidth={1.5} />;
  }
}

function StepStatusPill({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, { bg: string; text: string; label: string }> = {
    idle: { bg: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400", text: "", label: "Idle" },
    running: {
      bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
      text: "",
      label: "Running",
    },
    succeeded: {
      bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
      text: "",
      label: "Succeeded",
    },
    failed: {
      bg: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
      text: "",
      label: "Failed",
    },
    stale: {
      bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
      text: "",
      label: "Stale",
    },
    cancelled: {
      bg: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
      text: "",
      label: "Cancelled",
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${s.bg}`}
    >
      <StepStatusIcon status={status} />
      {s.label}
    </span>
  );
}

// =============================================================================
// Right panel — step detail
// =============================================================================

interface StepPanelProps {
  event: EventDetailData;
  step: PipelineStep;
  details: EventDetailDetails;
  onRunStep?: (id: StepId) => void;
  onPauseJob?: (id: string) => void;
  onCancelJob?: (id: string) => void;
  onResumeJob?: (id: StepId) => void;
  onDryRunStep?: (id: StepId) => void;
  onBulkRebucket?: (ids: string[], bucket: string) => void;
  onEstimateTagCost?: () => void;
  onDispatchTagClassification?: () => void;
  onUndoTags?: () => void;
  onCopyTidalUrl?: (url: string) => void;
  onOpenLocalFile?: (filePath: string) => void;
  onOpenSpotify?: (url: string) => void;
  onOpenTidal?: (url: string) => void;
  onExportMissesTidalUrls?: (urls: string[]) => void;
  onPromoteToLibrary?: (trackId: string, next: boolean) => void;
  onRepairInLibrary?: (track: MatchedTrack) => void;
}

function StepPanel(props: StepPanelProps) {
  const { event, step, details } = props;
  const isDestructive =
    step.id === "apply-tags" || step.id === "build-event" || step.id === "build-library";
  const gateBlocking = isDestructive && event.qualityGate.failingCount > 0;

  return (
    <section className="rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Step header */}
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
            <span style={mono}>step {step.index} / 11</span>
            <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span>
            <span>{step.phase}</span>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {step.label}
            </h2>
            <StepStatusPill status={step.status} />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
            {step.description}
          </p>
        </div>
        <StepActions step={step} gateBlocking={gateBlocking} {...props} />
      </div>

      {/* Body */}
      <div className="px-6 py-5">{renderStepBody(step, details, props)}</div>

      {/* Live job tray */}
      {step.activeJob && (
        <LiveJobTray
          job={step.activeJob}
          onPause={() => props.onPauseJob?.(step.activeJob!.id)}
          onCancel={() => props.onCancelJob?.(step.activeJob!.id)}
          logLines={details.jobLogLines}
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-3 text-[11px] text-neutral-500 dark:border-neutral-800/80 dark:text-neutral-500">
        <div>
          {step.lastRunAt ? (
            <>
              Last run <span style={mono}>{formatRelative(step.lastRunAt)}</span>
              {step.lastRunDurationMs != null && (
                <>
                  {" "}
                  <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span> took{" "}
                  <span style={mono}>{formatDuration(step.lastRunDurationMs)}</span>
                </>
              )}
            </>
          ) : (
            "Never run"
          )}
        </div>
        <button type="button" className="hover:text-sky-700 dark:hover:text-sky-300">
          View in audit log
        </button>
      </div>
    </section>
  );
}

// -----------------------------------------------------------------------------
// Step actions (right side of step header)
// -----------------------------------------------------------------------------

function StepActions({
  step,
  gateBlocking,
  onRunStep,
  onResumeJob,
  onDryRunStep,
  onUndoTags,
  onEstimateTagCost,
  onDispatchTagClassification,
}: StepPanelProps & { gateBlocking: boolean }) {
  const supportsDryRun =
    step.id === "apply-tags" || step.id === "build-event" || step.id === "build-library";
  const isRunning = step.status === "running";
  const isFailed = step.status === "failed" || step.status === "cancelled";

  if (step.id === "classify-tags") {
    return (
      <div className="flex flex-shrink-0 items-center gap-2">
        <SecondaryButton onClick={onEstimateTagCost} icon={<Sparkles className="h-3.5 w-3.5" />}>
          Re-estimate
        </SecondaryButton>
        <PrimaryButton onClick={onDispatchTagClassification} disabled={gateBlocking}>
          <Play className="h-3.5 w-3.5" strokeWidth={2.25} />
          Dispatch
        </PrimaryButton>
      </div>
    );
  }

  if (step.id === "apply-tags" && step.status === "succeeded") {
    return (
      <div className="flex flex-shrink-0 items-center gap-2">
        <SecondaryButton onClick={onUndoTags} icon={<Undo2 className="h-3.5 w-3.5" />}>
          Undo
        </SecondaryButton>
        <PrimaryButton onClick={() => onRunStep?.(step.id)} disabled={gateBlocking}>
          <RotateCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Re-apply
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {supportsDryRun && (
        <SecondaryButton
          onClick={() => onDryRunStep?.(step.id)}
          icon={<FileSearch className="h-3.5 w-3.5" />}
        >
          Dry run
        </SecondaryButton>
      )}
      {isFailed ? (
        <PrimaryButton onClick={() => onResumeJob?.(step.id)} disabled={gateBlocking && supportsDryRun}>
          <RotateCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          Resume
        </PrimaryButton>
      ) : (
        <PrimaryButton onClick={() => onRunStep?.(step.id)} disabled={isRunning || (gateBlocking && supportsDryRun)}>
          <Play className="h-3.5 w-3.5" strokeWidth={2.25} />
          {isRunning ? "Running\u2026" : "Run"}
        </PrimaryButton>
      )}
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
  children: React.ReactNode;
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

// -----------------------------------------------------------------------------
// Per-step body renderer
// -----------------------------------------------------------------------------

function renderStepBody(
  step: PipelineStep,
  details: EventDetailDetails,
  props: StepPanelProps,
) {
  switch (step.id) {
    case "fetch":
    case "enrich":
    case "scan":
      return <SimpleSummaryBody step={step} />;
    case "classify":
      return <ClassifyBody distribution={details.classifyDistribution} />;
    case "review":
      return <ReviewBody tracks={details.reviewTracks} onBulkRebucket={props.onBulkRebucket} />;
    case "match":
      return (
        <MatchBody
          matched={details.matchResults.matched}
          misses={details.matchResults.misses}
          onCopyTidalUrl={props.onCopyTidalUrl}
          onOpenLocalFile={props.onOpenLocalFile}
          onOpenSpotify={props.onOpenSpotify}
          onOpenTidal={props.onOpenTidal}
          onExportMissesTidalUrls={props.onExportMissesTidalUrls}
          onPromoteToLibrary={props.onPromoteToLibrary}
          onRepairInLibrary={props.onRepairInLibrary}
        />
      );
    case "analyze-mood":
      return <AnalyzeMoodBody rows={details.moodAnalysisRows} job={step.activeJob} />;
    case "classify-tags":
      return <ClassifyTagsBody estimate={details.tagCostEstimate} />;
    case "apply-tags":
    case "build-event":
    case "build-library":
      return <BuildLikeBody step={step} />;
    default:
      return <div className="text-sm text-neutral-500">No content for this step.</div>;
  }
}

function SimpleSummaryBody({ step }: { step: PipelineStep }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Last result
      </div>
      <div className="mt-1 text-base text-neutral-800 dark:text-neutral-200">{step.summary}</div>
    </div>
  );
}

function ClassifyBody({ distribution }: { distribution: GenreDistributionEntry[] }) {
  const max = Math.max(...distribution.map((d) => d.count), 1);
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Bucket distribution
      </div>
      <ul className="space-y-1.5">
        {distribution.map((d) => (
          <li key={d.bucket} className="flex items-center gap-3">
            <span className="w-32 truncate text-sm text-neutral-700 dark:text-neutral-300">{d.bucket}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-sm bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-sm bg-sky-500/80 dark:bg-sky-500/70"
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-neutral-600 dark:text-neutral-400" style={mono}>
              {d.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewBody({
  tracks,
  onBulkRebucket,
}: {
  tracks: ReviewTrack[];
  onBulkRebucket?: (ids: string[], bucket: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState("");
  const allChecked = selected.size === tracks.length && tracks.length > 0;

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold text-neutral-700 dark:text-neutral-300" style={mono}>
            {tracks.length}
          </span>{" "}
          tracks below confidence threshold
        </div>
        <div className="flex items-center gap-2">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          >
            <option value="">{"Re-bucket to\u2026"}</option>
            <option value="House">House</option>
            <option value="Disco">Disco</option>
            <option value="Funk & Soul">Funk & Soul</option>
            <option value="Indie">Indie</option>
            <option value="Downtempo">Downtempo</option>
          </select>
          <SecondaryButton
            onClick={() => target && onBulkRebucket?.(Array.from(selected), target)}
          >
            Apply to {selected.size}
          </SecondaryButton>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 text-left text-[10px] uppercase tracking-wider text-neutral-500 dark:bg-neutral-950 dark:text-neutral-500">
            <tr>
              <th className="w-8 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() =>
                    setSelected(allChecked ? new Set() : new Set(tracks.map((t) => t.id)))
                  }
                />
              </th>
              <th className="px-3 py-2">{"Artist \u2014 Title"}</th>
              <th className="px-3 py-2">Current</th>
              <th className="px-3 py-2">Suggested</th>
              <th className="px-3 py-2 text-right">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {tracks.map((t) => (
              <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggle(t.id)}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="text-neutral-900 dark:text-neutral-100">
                    <span className="font-medium">{t.artist}</span>
                    <span className="text-neutral-400 dark:text-neutral-600">{" \u2014 "}</span>
                    {t.title}
                  </div>
                </td>
                <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400">{t.currentBucket}</td>
                <td className="px-3 py-2 text-sky-700 dark:text-sky-400">{t.suggestedBucket}</td>
                <td className="px-3 py-2 text-right" style={mono}>
                  <span
                    className={
                      t.confidence < 0.45
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-neutral-600 dark:text-neutral-400"
                    }
                  >
                    {t.confidence.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchBody({
  matched,
  misses,
  onCopyTidalUrl,
  onOpenLocalFile,
  onOpenSpotify,
  onOpenTidal,
  onExportMissesTidalUrls,
  onPromoteToLibrary,
  onRepairInLibrary,
}: {
  matched: MatchedTrack[];
  misses: MissedTrack[];
  onCopyTidalUrl?: (url: string) => void;
  onOpenLocalFile?: (filePath: string) => void;
  onOpenSpotify?: (url: string) => void;
  onOpenTidal?: (url: string) => void;
  onExportMissesTidalUrls?: (urls: string[]) => void;
  onPromoteToLibrary?: (trackId: string, next: boolean) => void;
  onRepairInLibrary?: (track: MatchedTrack) => void;
}) {
  const [tab, setTab] = useState<"matched" | "misses">("matched");
  const total = matched.length + misses.length;
  const coverage = total ? Math.round((matched.length / total) * 100) : 0;
  const promotedCount = matched.filter((m) => m.isPromoted).length;
  const brokenCount = matched.filter(
    (m) => m.isPromoted && m.libraryFilePresence === "missing",
  ).length;

  return (
    <div>
      {/* Library coverage summary */}
      <div className="mb-4 flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-emerald-500" strokeWidth={2.25} />
          <span className="text-sm">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100" style={mono}>
              {matched.length}
            </span>{" "}
            <span className="text-neutral-600 dark:text-neutral-400">in library</span>
          </span>
        </div>
        <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span>
        <div className="flex items-center gap-2">
          <CircleDashed className="h-4 w-4 text-amber-500" strokeWidth={2.25} />
          <span className="text-sm">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100" style={mono}>
              {misses.length}
            </span>{" "}
            <span className="text-neutral-600 dark:text-neutral-400">missing locally</span>
          </span>
        </div>
        <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" strokeWidth={2.25} />
          <span className="text-sm">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100" style={mono}>
              {promotedCount}
            </span>{" "}
            <span className="text-neutral-600 dark:text-neutral-400">promoted to library</span>
          </span>
        </div>
        {brokenCount > 0 && (
          <>
            <span className="text-neutral-300 dark:text-neutral-700">{"\u2022"}</span>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" strokeWidth={2.25} />
              <span className="text-sm">
                <span className="font-semibold text-red-700 dark:text-red-400" style={mono}>
                  {brokenCount}
                </span>{" "}
                <span className="text-red-600 dark:text-red-400">broken masterpiece{brokenCount === 1 ? "" : "s"}</span>
              </span>
            </div>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-500" style={mono}>
            {coverage}% coverage
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab strip + bulk export */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-950">
          <TabButton active={tab === "matched"} onClick={() => setTab("matched")}>
            In library <span style={mono}>({matched.length})</span>
          </TabButton>
          <TabButton active={tab === "misses"} onClick={() => setTab("misses")}>
            Missing <span style={mono}>({misses.length})</span>
          </TabButton>
        </div>
        {tab === "misses" && misses.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onExportMissesTidalUrls?.(misses.map((m) => m.tidalPurchaseUrl))
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
            Export {misses.length} Tidal URLs
          </button>
        )}
      </div>

      {tab === "matched" ? (
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 text-left text-[10px] uppercase tracking-wider text-neutral-500 dark:bg-neutral-950 dark:text-neutral-500">
              <tr>
                <th className="w-10 px-2 py-2 text-center" title="Promote to Master Library">{"\u2605"}</th>
                <th className="w-24 px-3 py-2">Library</th>
                <th className="w-20 px-3 py-2">Source</th>
                <th className="px-3 py-2">{"Artist \u2014 Title"}</th>
                <th className="px-3 py-2">ISRC</th>
                <th className="px-3 py-2">Local file</th>
                <th className="px-3 py-2">Match</th>
                <th className="w-32 px-3 py-2 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {matched.map((m) => {
                const broken = m.isPromoted && m.libraryFilePresence === "missing";
                const promoteDisabled = !m.canPromote && !m.isPromoted;
                const starTitle = broken
                  ? "Library file is missing \u2014 Repair in Library"
                  : m.isPromoted
                    ? "Remove from Master Library (file is preserved)"
                    : promoteDisabled
                      ? "Source file is not on disk \u2014 cannot promote"
                      : "Promote to Master Library";
                return (
                <tr
                  key={m.id}
                  className={
                    broken
                      ? "bg-red-50/40 hover:bg-red-50/60 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  }
                >
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      disabled={promoteDisabled}
                      onClick={() => {
                        if (broken) {
                          onRepairInLibrary?.(m);
                          return;
                        }
                        if (promoteDisabled) return;
                        onPromoteToLibrary?.(m.id, !m.isPromoted);
                      }}
                      title={starTitle}
                      aria-label={starTitle}
                      className={
                        broken
                          ? "relative inline-flex h-7 w-7 items-center justify-center rounded text-amber-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          : m.isPromoted
                            ? "inline-flex h-7 w-7 items-center justify-center rounded text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : promoteDisabled
                              ? "inline-flex h-7 w-7 items-center justify-center rounded text-neutral-200 dark:text-neutral-800 cursor-not-allowed"
                              : "inline-flex h-7 w-7 items-center justify-center rounded text-neutral-300 hover:bg-amber-50 hover:text-amber-500 dark:text-neutral-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                      }
                    >
                      <Star
                        className={
                          m.isPromoted
                            ? "h-4 w-4 fill-current"
                            : "h-4 w-4"
                        }
                        strokeWidth={2}
                      />
                      {broken && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-white ring-1 ring-white dark:ring-neutral-900"
                          aria-hidden="true"
                        >
                          <AlertCircle className="h-2.5 w-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <LibraryBadge present />
                  </td>
                  <td className="px-3 py-2">
                    <SourcePill source={m.source} />
                  </td>
                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                    <span className="font-medium">{m.artist}</span>
                    <span className="text-neutral-400 dark:text-neutral-600">{" \u2014 "}</span>
                    {m.title}
                  </td>
                  <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400" style={mono}>
                    {m.isrc}
                  </td>
                  <td className="px-3 py-2 text-neutral-500 dark:text-neutral-500" style={mono}>
                    <button
                      type="button"
                      onClick={() => onOpenLocalFile?.(m.filePath)}
                      title={m.filePath}
                      className="block max-w-md truncate text-left hover:text-sky-700 hover:underline dark:hover:text-sky-400"
                    >
                      {m.filePath}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <MatchBadge kind={m.matchKind} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      {broken && (
                        <button
                          type="button"
                          onClick={() => onRepairInLibrary?.(m)}
                          title="Repair in Master Library"
                          className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
                        >
                          <Wrench className="h-3 w-3" strokeWidth={2.25} />
                          Repair
                        </button>
                      )}
                      <JumpButton
                        label="Reveal in file manager"
                        icon={<Folder className="h-3.5 w-3.5" strokeWidth={2} />}
                        onClick={() => onOpenLocalFile?.(m.filePath)}
                      />
                      <JumpButton
                        label="Open on Spotify"
                        accent="emerald"
                        icon={<Music2 className="h-3.5 w-3.5" strokeWidth={2} />}
                        onClick={() => onOpenSpotify?.(m.spotifyUrl)}
                      />
                      <JumpButton
                        label="Open on Tidal"
                        accent="sky"
                        icon={<Disc3 className="h-3.5 w-3.5" strokeWidth={2} />}
                        onClick={() => onOpenTidal?.(m.tidalUrl)}
                      />
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-xs">
            <thead className="bg-neutral-50 text-left text-[10px] uppercase tracking-wider text-neutral-500 dark:bg-neutral-950 dark:text-neutral-500">
              <tr>
                <th className="w-24 px-3 py-2">Library</th>
                <th className="px-3 py-2">{"Artist \u2014 Title"}</th>
                <th className="px-3 py-2">ISRC</th>
                <th className="w-44 px-3 py-2 text-right">Open</th>
                <th className="w-28 px-3 py-2 text-right">Tidal URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {misses.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="px-3 py-2">
                    <LibraryBadge present={false} />
                  </td>
                  <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                    <span className="font-medium">{m.artist}</span>
                    <span className="text-neutral-400 dark:text-neutral-600">{" \u2014 "}</span>
                    {m.title}
                  </td>
                  <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400" style={mono}>
                    {m.isrc}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <JumpButton
                        label="Open on Spotify"
                        accent="emerald"
                        icon={<Music2 className="h-3.5 w-3.5" strokeWidth={2} />}
                        onClick={() => onOpenSpotify?.(m.spotifyUrl)}
                      />
                      <JumpButton
                        label="Open on Tidal"
                        accent="sky"
                        icon={<Disc3 className="h-3.5 w-3.5" strokeWidth={2} />}
                        onClick={() => onOpenTidal?.(m.tidalPurchaseUrl)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onCopyTidalUrl?.(m.tidalPurchaseUrl)}
                      className="inline-flex items-center gap-1 rounded border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-sky-700 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SourcePill({ source }: { source: MatchedTrack["source"] }) {
  if (source === "library") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
        title="Resolved from the curated Master Library on local disk"
      >
        <Library className="h-3 w-3" strokeWidth={2.5} />
        Library
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
      title="Resolved from the broader NAS Library scan"
    >
      NAS
    </span>
  );
}

function LibraryBadge({ present }: { present: boolean }) {
  if (present) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
        Local
      </span>
    );
  }  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
      <CircleDashed className="h-3 w-3" strokeWidth={2.5} />
      Missing
    </span>
  );
}

function JumpButton({
  label,
  icon,
  onClick,
  accent = "neutral",
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  accent?: "neutral" | "sky" | "emerald";
}) {
  const accentClass =
    accent === "emerald"
      ? "hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400"
      : accent === "sky"
        ? "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:hover:border-sky-800 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
        : "hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`inline-flex h-6 w-6 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 ${accentClass}`}
    >
      {icon}
    </button>
  );
}

function MatchBadge({ kind }: { kind: "isrc" | "exact" | "fuzzy" }) {
  const map = {
    isrc: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    exact: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    fuzzy: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[kind]}`}
    >
      {kind}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1 text-xs transition-colors ${
        active
          ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100"
          : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function AnalyzeMoodBody({
  rows,
  job,
}: {
  rows: MoodAnalysisRow[];
  job?: ActiveJob;
}) {
  return (
    <div>
      {job && (
        <div className="mb-3 grid grid-cols-4 gap-3">
          <Metric label="Processed" value={`${job.processedUnits} / ${job.totalUnits}`} />
          <Metric label="Progress" value={`${Math.round((job.progress ?? 0) * 100)}%`} />
          <Metric label="Elapsed" value={formatDuration(job.elapsedMs)} />
          <Metric
            label="ETA"
            value={job.etaSeconds != null ? `~${formatDuration(job.etaSeconds * 1000)}` : "\u2014"}
          />
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-xs">
          <thead className="bg-neutral-50 text-left text-[10px] uppercase tracking-wider text-neutral-500 dark:bg-neutral-950 dark:text-neutral-500">
            <tr>
              <th className="px-3 py-2">{"Artist \u2014 Title"}</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">BPM</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2 text-right">Energy</th>
              <th className="px-3 py-2 text-right">Valence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 ${r.status === "running" ? "animate-pulse bg-sky-50/40 dark:bg-sky-950/20" : ""}`}
              >
                <td className="px-3 py-2 text-neutral-900 dark:text-neutral-100">
                  <span className="font-medium">{r.artist}</span>
                  <span className="text-neutral-400 dark:text-neutral-600">{" \u2014 "}</span>
                  {r.title}
                </td>
                <td className="px-3 py-2">
                  <MoodStatusPill status={r.status} />
                </td>
                <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300" style={mono}>
                  {r.bpm ?? "\u2014"}
                </td>
                <td className="px-3 py-2 text-neutral-700 dark:text-neutral-300" style={mono}>
                  {r.key ?? "\u2014"}
                </td>
                <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300" style={mono}>
                  {r.energy != null ? r.energy.toFixed(2) : "\u2014"}
                </td>
                <td className="px-3 py-2 text-right text-neutral-700 dark:text-neutral-300" style={mono}>
                  {r.valence != null ? r.valence.toFixed(2) : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MoodStatusPill({ status }: { status: MoodAnalysisRow["status"] }) {
  const map = {
    queued: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    running: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    succeeded: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    failed: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${map[status]}`}
    >
      {status}
    </span>
  );
}

function ClassifyTagsBody({ estimate }: { estimate: TagCostEstimate }) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Pre-flight estimate
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Model" value={estimate.model} mono />
        <Metric label="Tracks" value={estimate.tracks.toString()} mono />
        <Metric label="Input tokens" value={formatNumber(estimate.estimatedInputTokens)} mono />
        <Metric label="Output tokens" value={formatNumber(estimate.estimatedOutputTokens)} mono />
        <Metric label="Estimated cost" value={`$${estimate.estimatedUsd.toFixed(2)}`} mono accent="emerald" />
        <Metric label="Prompt caching" value={estimate.promptCachingEnabled ? "Enabled" : "Disabled"} />
        <Metric label="Estimated at" value={formatRelative(estimate.estimatedAt)} />
      </div>
      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
        Tags will be assigned from the fixed vocabulary: <span style={mono}>energy</span>,{" "}
        <span style={mono}>function</span>, <span style={mono}>crowd</span>,{" "}
        <span style={mono}>mood</span>. Live token usage will appear in the job tray once dispatched.
      </p>
    </div>
  );
}

function BuildLikeBody({ step }: { step: PipelineStep }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Status
      </div>
      <div className="mt-1 text-base text-neutral-800 dark:text-neutral-200">{step.summary}</div>
      <p className="mt-3 text-xs text-neutral-500">
        Use{" "}
        <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Dry run
        </span>{" "}
        to preview the file diff before committing. All file operations are scoped to configured filesystem roots.
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  mono: useMono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: "emerald";
}) {
  const valueColor = accent === "emerald" ? "text-emerald-700 dark:text-emerald-400" : "text-neutral-900 dark:text-neutral-100";
  return (
    <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className={`mt-0.5 text-sm font-semibold ${valueColor}`} style={useMono ? mono : undefined}>
        {value}
      </div>
    </div>
  );
}

// =============================================================================
// Live job tray
// =============================================================================

function LiveJobTray({
  job,
  onPause,
  onCancel,
  logLines,
}: {
  job: ActiveJob;
  onPause: () => void;
  onCancel: () => void;
  logLines: JobLogLine[];
}) {
  const [logsOpen, setLogsOpen] = useState(true);
  const pct = Math.round((job.progress ?? 0) * 100);
  return (
    <div className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="flex flex-1 items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-sky-500 dark:text-sky-400" strokeWidth={2.25} />
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {job.label}{" "}
                <span className="text-neutral-500 dark:text-neutral-500" style={mono}>
                  ({job.processedUnits} / {job.totalUnits})
                </span>
              </span>
              <span className="text-neutral-500" style={mono}>
                {pct}%
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-sky-500 transition-[width] duration-300 dark:bg-sky-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPause}
            className="inline-flex h-7 items-center gap-1 rounded border border-neutral-200 bg-white px-2 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Pause className="h-3 w-3" strokeWidth={2.25} />
            Pause
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-7 items-center gap-1 rounded border border-neutral-200 bg-white px-2 text-[11px] font-medium text-neutral-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Square className="h-3 w-3" strokeWidth={2.25} />
            Cancel
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setLogsOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 border-t border-neutral-200 px-6 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
      >
        {logsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Live log
        <span className="ml-auto inline-flex items-center gap-1 text-neutral-400">
          <ArrowDownToLine className="h-3 w-3" />
          auto-scroll
        </span>
      </button>

      {logsOpen && (
        <div className="max-h-56 overflow-y-auto bg-neutral-900 px-6 py-3 text-[11px] leading-relaxed text-neutral-300 dark:bg-black">
          {logLines.map((line, i) => (
            <div key={i} className="flex gap-3" style={mono}>
              <span className="flex-shrink-0 text-neutral-500">{formatTime(line.ts)}</span>
              <span className={`flex-shrink-0 w-12 ${logLevelClass(line.level)}`}>{line.level}</span>
              <span className="text-neutral-200">{line.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function logLevelClass(level: JobLogLine["level"]): string {
  switch (level) {
    case "warn":
      return "text-amber-400";
    case "error":
      return "text-red-400";
    case "metric":
      return "text-purple-300";
    case "debug":
      return "text-neutral-500";
    case "info":
    default:
      return "text-sky-400";
  }
}

// =============================================================================
// Recent activity footer
// =============================================================================

function RecentActivity({
  entries,
  onViewAllActivity,
}: {
  entries: ActivityEntry[];
  onViewAllActivity?: () => void;
}) {
  return (
    <section className="mt-5 rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Recent activity
        </h3>
        <button
          type="button"
          onClick={onViewAllActivity}
          className="text-xs text-sky-700 hover:underline dark:text-sky-400"
        >
          View all in Audit Log
        </button>
      </div>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-3 px-6 py-2.5 text-xs">
            <span
              className="w-32 flex-shrink-0 text-neutral-500 dark:text-neutral-500"
              style={mono}
            >
              {formatTime(e.timestamp)}
            </span>
            <span
              className="w-16 flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-600"
            >
              {e.actor}
            </span>
            <span
              className="w-44 flex-shrink-0 text-neutral-700 dark:text-neutral-300"
              style={mono}
            >
              {e.action}
            </span>
            <span className="flex-1 text-neutral-600 dark:text-neutral-400">{e.summary}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// =============================================================================
// Helpers
// =============================================================================

const mono: React.CSSProperties = {
  fontFamily: "JetBrains Mono, ui-monospace, monospace",
};

function formatEventDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

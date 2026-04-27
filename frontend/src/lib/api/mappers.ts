// Map the backend's EventOut payload to the existing EventCard UI shape.
// We deliberately avoid changing the UI types — the page works against the
// same shape used by the design-time sample data.

import type { ActiveJob, EventCard } from "../../sections/events/types";
import type { EventOut, JobOut } from "./types";

/**
 * Convert one backend `EventOut` row into the UI's `EventCard` shape.
 * Tolerant of unknown extra fields and missing optional values.
 */
export function eventOutToCard(event: EventOut): EventCard {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    eventDate: event.date ?? "",
    playlistUrl: event.source_playlist_url ?? "",
    currentStepIndex: event.current_step_index,
    currentStepLabel: event.current_step_label,
    totalSteps: event.total_steps,
    trackCounts: {
      total: event.track_count,
      matched: event.matched_count,
      tagged: event.tagged_count,
    },
    activeJob: event.active_job ? jobOutToActiveJob(event.active_job) : null,
    isStale: event.is_stale,
    lastActivityAt: pickLastActivity(event),
  };
}

export function eventOutsToCards(events: EventOut[]): EventCard[] {
  return events.map(eventOutToCard);
}

// ---------------------------------------------------------------------------

function jobOutToActiveJob(job: JobOut): ActiveJob {
  return {
    id: job.id,
    status: job.status,
    label: job.type,
    progress: deriveProgress(job),
    queuePosition: job.queue_position ?? undefined,
    errorMessage: extractErrorMessage(job.error) ?? undefined,
  };
}

function deriveProgress(job: JobOut): number | null {
  if (job.status !== "running") return null;
  if (!job.progress_total || job.progress_total <= 0) return null;
  const ratio = job.progress_i / job.progress_total;
  if (!Number.isFinite(ratio)) return null;
  return Math.max(0, Math.min(1, ratio));
}

function extractErrorMessage(error: Record<string, unknown> | null): string | undefined {
  if (!error) return undefined;
  const message = error["message"];
  if (typeof message === "string" && message.trim()) return message;
  const detail = error["detail"];
  if (typeof detail === "string" && detail.trim()) return detail;
  return undefined;
}

/**
 * Pick the freshest available timestamp for the card's "Updated …" footer.
 * Falls back through last_activity_at → updated_at → created_at, and
 * tolerates malformed values without throwing (EC-5).
 */
function pickLastActivity(event: EventOut): string {
  for (const candidate of [event.last_activity_at, event.updated_at, event.created_at]) {
    if (candidate && isValidIso(candidate)) return candidate;
  }
  return event.created_at ?? "";
}

function isValidIso(value: string): boolean {
  const ms = Date.parse(value);
  return Number.isFinite(ms);
}

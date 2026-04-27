import { apiFetch } from "./client";
import type { EventOut } from "./types";

/** Fetch all events for the dashboard. */
export function fetchEvents(signal?: AbortSignal): Promise<EventOut[]> {
  return apiFetch<EventOut[]>("/api/v1/events", { signal });
}

/** Fetch a single event by id. */
export function fetchEvent(id: string, signal?: AbortSignal): Promise<EventOut> {
  return apiFetch<EventOut>(`/api/v1/events/${encodeURIComponent(id)}`, { signal });
}

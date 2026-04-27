import { useQuery } from "@tanstack/react-query";

import { fetchEvents } from "../api/events";
import { eventOutsToCards } from "../api/mappers";
import type { EventCard } from "../../sections/events/types";

export const eventsQueryKey = ["events"] as const;

/**
 * Fetch the dashboard's event list, mapped to the UI's `EventCard` shape.
 *
 * Defaults to TanStack Query's window-focus refetch behavior so the
 * dashboard refreshes after switching tabs (CRATE-2 AC-11). Live updates
 * via SSE are out of scope here — see CRATE-5.
 */
export function useEvents() {
  return useQuery<EventCard[]>({
    queryKey: eventsQueryKey,
    queryFn: ({ signal }) => fetchEvents(signal).then(eventOutsToCards),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

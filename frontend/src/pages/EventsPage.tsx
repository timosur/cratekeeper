import { useNavigate } from "react-router-dom";

import { Dashboard } from "../sections/events/components";
import type { EventCard } from "../sections/events/types";
import sampleData from "../sections/events/sample-data.json";
import { useNewEvent } from "../components/NewEventContext";

const SAMPLE_EVENTS = (sampleData as { events: EventCard[] }).events;

export function EventsPage() {
  const navigate = useNavigate();
  const { open: openNewEvent } = useNewEvent();

  return (
    <Dashboard
      events={SAMPLE_EVENTS}
      onCreateEvent={openNewEvent}
      onOpenEvent={(id) => navigate(`/events/${id}`)}
      onResumeJob={(eventId, jobId) => {
        // wire to backend job runner once available
        console.info("resume job", { eventId, jobId });
      }}
    />
  );
}

import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";

import { EventDetail } from "../sections/event-detail/components";
import type {
  EventDetail as EventDetailData,
  EventDetailDetails,
  StepId,
} from "../sections/event-detail/types";
import sampleData from "../sections/event-detail/sample-data.json";

const SAMPLE = sampleData as unknown as {
  event: EventDetailData;
  details: EventDetailDetails;
};

export function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const baseEvent = useMemo<EventDetailData>(
    () => ({
      ...SAMPLE.event,
      id: eventId ?? SAMPLE.event.id,
    }),
    [eventId],
  );

  const [activeStepId, setActiveStepId] = useState<StepId>(baseEvent.activeStepId);

  const event = useMemo<EventDetailData>(
    () => ({ ...baseEvent, activeStepId }),
    [baseEvent, activeStepId],
  );

  return (
    <EventDetail
      event={event}
      details={SAMPLE.details}
      onSelectStep={setActiveStepId}
      onRunStep={(id) => console.info("run step", id)}
      onPauseJob={(id) => console.info("pause job", id)}
      onCancelJob={(id) => console.info("cancel job", id)}
      onResumeJob={(id) => console.info("resume step", id)}
      onDryRunStep={(id) => console.info("dry-run step", id)}
      onOpenQualityChecks={() => console.info("open quality checks")}
      onOverrideQualityGate={(reason) => console.info("override gate", reason)}
      onBulkRebucket={(ids, bucket) =>
        console.info("bulk rebucket", { ids, bucket })
      }
      onEstimateTagCost={() => console.info("estimate tag cost")}
      onDispatchTagClassification={() => console.info("dispatch tag classification")}
      onUndoTags={() => console.info("undo tags")}
      onCopyTidalUrl={(url) => {
        navigator.clipboard?.writeText(url).catch(() => {});
      }}
      onOpenLocalFile={(path) => console.info("open local file", path)}
      onOpenSpotify={(url) => window.open(url, "_blank", "noopener,noreferrer")}
      onOpenTidal={(url) => window.open(url, "_blank", "noopener,noreferrer")}
      onPromoteToLibrary={(id, next) =>
        console.info("promote to library", { id, next })
      }
      onExportMissesTidalUrls={(urls) => {
        navigator.clipboard?.writeText(urls.join("\n")).catch(() => {});
      }}
      onViewAllActivity={() => navigate("/audit")}
    />
  );
}

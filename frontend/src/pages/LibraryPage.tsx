import { useNavigate } from "react-router-dom";

import { MasterLibrary } from "../sections/master-library/components";
import type {
  BucketStat,
  FilterOptions,
  LibraryOverview,
  LibraryTrack,
  MasterLibraryProps,
} from "../sections/master-library/types";
import sampleData from "../sections/master-library/sample-data.json";

const SAMPLE = sampleData as unknown as {
  library: LibraryOverview;
  buckets: BucketStat[];
  tracks: LibraryTrack[];
  filterOptions: FilterOptions;
};

export function LibraryPage() {
  const navigate = useNavigate();

  const props: MasterLibraryProps = {
    overview: SAMPLE.library,
    buckets: SAMPLE.buckets,
    tracks: SAMPLE.tracks,
    filterOptions: SAMPLE.filterOptions,
    onSelectBucket: (id) => console.info("select bucket", id),
    onRevealInFinder: (track) => console.info("reveal in finder", track.filePath),
    onOpenSourceEvent: (eventId) => navigate(`/events/${eventId}`),
    onAddTrack: () => console.info("add track"),
    onImportFromSpotify: () => console.info("import from spotify"),
    onDropAudioFiles: (files) =>
      console.info("dropped files", files.map((f) => f.name)),
    onPromoteFromEvent: () => console.info("promote from event"),
    onVerifyLibrary: () => console.info("verify library"),
    onRemoveFromLibrary: (track) => console.info("remove from library", track.id),
    onDropMissingEntry: (track) => console.info("drop missing entry", track.id),
  };

  return <MasterLibrary {...props} />;
}

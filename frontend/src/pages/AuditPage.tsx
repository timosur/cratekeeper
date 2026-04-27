import { useNavigate } from "react-router-dom";

import { AuditLog } from "../sections/audit-log/components";
import type {
  AuditEntry,
  AuditLogProps,
  AuditStats,
  AuditTarget,
  FilterOptions,
} from "../sections/audit-log/types";
import sampleData from "../sections/audit-log/sample-data.json";

const SAMPLE = sampleData as unknown as {
  entries: AuditEntry[];
  filterOptions: FilterOptions;
  stats: AuditStats;
};

function targetHref(target: AuditTarget): string | null {
  switch (target.kind) {
    case "event":
      return `/events/${target.id}`;
    case "track":
    case "library":
      return `/library`;
    case "settings":
      return `/settings`;
    default:
      return null;
  }
}

export function AuditPage() {
  const navigate = useNavigate();

  const props: AuditLogProps = {
    entries: SAMPLE.entries,
    filterOptions: SAMPLE.filterOptions,
    stats: SAMPLE.stats,
    initialLiveTail: false,
    onToggleLiveTail: (next) => console.info("live tail", next),
    onCopyPermalink: (url) => {
      navigator.clipboard?.writeText(url).catch(() => {});
    },
    onExport: (format) => console.info("export", format),
    onExpandEntry: (id) => console.info("expand entry", id),
    onJumpToTarget: (target) => {
      const href = targetHref(target);
      if (href) navigate(href);
    },
    onCopyEntryJson: (entry) => {
      navigator.clipboard?.writeText(JSON.stringify(entry, null, 2)).catch(() => {});
    },
    onCopyEntryPermalink: (id) => {
      const url = `${window.location.origin}/audit?entry=${encodeURIComponent(id)}`;
      navigator.clipboard?.writeText(url).catch(() => {});
    },
    onCopyTargetId: (id) => {
      navigator.clipboard?.writeText(id).catch(() => {});
    },
  };

  return <AuditLog {...props} />;
}

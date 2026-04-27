import { useState } from "react";

import { Settings } from "../sections/settings/components";
import type {
  Settings as SettingsData,
  SettingsCategoryId,
  SettingsProps,
} from "../sections/settings/types";
import sampleData from "../sections/settings/sample-data.json";

const SAMPLE = (sampleData as unknown as { settings: SettingsData }).settings;

export function SettingsPage() {
  const [activeCategoryId, setActiveCategoryId] =
    useState<SettingsCategoryId>("integrations");

  const props: SettingsProps = {
    settings: SAMPLE,
    activeCategoryId,
    onSelectCategory: setActiveCategoryId,
    onConnectService: (s) => console.info("connect", s),
    onRelinkService: (s) => console.info("relink", s),
    onDisconnectService: (s) => console.info("disconnect", s),
    onRevealAnthropicKey: () => console.info("reveal anthropic key"),
    onRotateAnthropicKey: () => console.info("rotate anthropic key"),
    onSelectAnthropicModel: (m) => console.info("select model", m),
    onTogglePromptCaching: (e) => console.info("prompt caching", e),
    onSaveFilesystemRoot: (id, p) => console.info("save root", { id, p }),
    onTestFilesystemRoot: (id) => console.info("test root", id),
    onRenameBucket: (id, name) => console.info("rename bucket", { id, name }),
    onReorderBuckets: (ids) => console.info("reorder buckets", ids),
    onAddBucket: () => console.info("add bucket"),
    onDeleteBucket: (id) => console.info("delete bucket", id),
    onRevealBearerToken: () => console.info("reveal bearer"),
    onCopyBearerToken: () => {
      const suffix = SAMPLE.apiAccess?.tokenMaskedSuffix ?? "";
      navigator.clipboard?.writeText(`••••${suffix}`).catch(() => {});
    },
    onRotateBearerToken: () => console.info("rotate bearer"),
  };

  return <Settings {...props} />;
}

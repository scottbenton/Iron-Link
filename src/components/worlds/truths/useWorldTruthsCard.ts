import { useTranslation } from "react-i18next";

import { useWorldTruthsSummary } from "./useWorldTruthsSummary";

export interface WorldTruthsCardItem {
  truths: true;
  id: "truths";
  subtitle?: string;
}

// The Truths card for a folder grid, or undefined when the world's setting
// has no truths (a blank world).
export function useWorldTruthsCard(
  worldId: string | undefined,
  settingKey: string | null,
): WorldTruthsCardItem | undefined {
  const { t } = useTranslation();
  const { total, chosen, loading } = useWorldTruthsSummary(worldId, settingKey);
  if (!loading && !total) return undefined;
  return {
    truths: true,
    id: "truths",
    subtitle: loading
      ? undefined
      : t("worlds.truths.chosen-count", "{{chosen}} of {{total}} chosen", {
          chosen,
          total,
        }),
  };
}

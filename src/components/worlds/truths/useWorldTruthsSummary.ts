import {
  useListenToWorldTruths,
  useWorldTruthChoices,
} from "stores/worldTruths.store";

import { countChosenTruths } from "lib/worldTruths.lib";

import { useWorldSettingTruths } from "./useWorldSettingTruths";

// The world's truths and how many are chosen, for the Truths card and the
// truths screen's strip. Listens while mounted, unless the setting has no
// truths (a blank world).
export function useWorldTruthsSummary(
  worldId: string | undefined,
  settingKey: string | null,
) {
  const { truths, loading, error } = useWorldSettingTruths(settingKey);
  useListenToWorldTruths(
    loading || (truths?.length ?? 0) > 0 ? worldId : undefined,
  );
  const choices = useWorldTruthChoices(worldId);
  return {
    truths,
    choices,
    loading,
    error,
    total: truths?.length ?? 0,
    chosen: truths ? countChosenTruths(truths, choices) : 0,
  };
}

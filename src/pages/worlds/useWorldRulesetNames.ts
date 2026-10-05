import { useEffect, useState } from "react";

import { allDefaultPackages } from "data/package.config";

import { computeEffectivePlayset } from "lib/effectivePlayset";
import { getWorldSettingPackageIds } from "lib/worldSettingPackageIds";

import { WorldPlaysetsRepository } from "repositories/worldPlaysets.repository";

export function useWorldRulesetNames(
  worldId: string,
  settingKey: string | null,
) {
  const scope = `${worldId}:${settingKey}`;
  const [result, setResult] = useState<{
    scope: string;
    names: string[];
    error: boolean;
    source: "games" | "setting";
  }>();
  useEffect(() => {
    let active = true;
    WorldPlaysetsRepository.getLinkedGamePlaysets(worldId)
      .then((games) => {
        const ids = computeEffectivePlayset(
          games,
          getWorldSettingPackageIds(settingKey),
        ).packageIds;
        const names = [
          ...new Set(ids.map((id) => allDefaultPackages[id]?.name ?? id)),
        ];
        if (active)
          setResult({
            scope,
            names,
            error: false,
            source: games.length ? "games" : "setting",
          });
      })
      .catch(() => {
        if (active)
          setResult({ scope, names: [], error: true, source: "setting" });
      });
    return () => {
      active = false;
    };
  }, [worldId, settingKey, scope]);
  return result?.scope === scope ? result : undefined;
}

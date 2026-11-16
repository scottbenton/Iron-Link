import type { Datasworn } from "@datasworn-community/core";
import { useEffect, useState } from "react";

import { allDefaultPackages } from "data/package.config";

import { loadRulesPackage } from "lib/worldOracleCatalog";
import { getPackageTruths, getWorldTruthsPackageId } from "lib/worldTruths.lib";

export interface WorldSettingTruths {
  // Undefined while loading, or when the setting has no truths package.
  truths: Datasworn.Truth[] | undefined;
  loading: boolean;
  error: boolean;
}

// The truths of a world's setting, from its own rules package. A blank world,
// or a setting whose package this build doesn't have, has none.
export function useWorldSettingTruths(
  settingKey: string | null,
): WorldSettingTruths {
  const packageId = getWorldTruthsPackageId(settingKey);
  const known = !!packageId && !!allDefaultPackages[packageId];
  const [loaded, setLoaded] = useState<{
    packageId: string;
    truths?: Datasworn.Truth[];
    error?: boolean;
  }>();

  useEffect(() => {
    if (!packageId || !known) return;
    let active = true;
    loadRulesPackage(packageId)
      .then((rulesPackage) => {
        if (active)
          setLoaded({ packageId, truths: getPackageTruths(rulesPackage) });
      })
      .catch(() => {
        if (active) setLoaded({ packageId, error: true });
      });
    return () => {
      active = false;
    };
  }, [packageId, known]);

  if (!packageId || !known) return { truths: [], loading: false, error: false };
  const current = loaded?.packageId === packageId ? loaded : undefined;
  return {
    truths: current?.truths,
    loading: !current,
    error: !!current?.error,
  };
}

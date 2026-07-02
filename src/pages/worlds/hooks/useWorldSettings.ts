import { useEffect, useState } from "react";

import { allDefaultPackages, includedExpansions } from "data/package.config";

// A choosable world setting. Datasworn has no settings concept yet (see
// iron-link-parity 02); until the fork-core `settings` field ships, every
// truth-bearing package gets one synthesized setting. Keys are
// package-qualified ("<packageId>/<settingKey>") so real per-package
// settings dictionaries can slot in later without a data migration.
export interface IWorldSetting {
  key: string;
  label: string;
  // The packages a standalone world's playset starts from: the package
  // itself, preceded by its parent ruleset when it is an expansion.
  packageIds: string[];
}

export const SYNTHESIZED_SETTING_KEY = "default";

function getParentRulesetId(packageId: string): string | undefined {
  return Object.entries(includedExpansions).find(
    ([, expansions]) => expansions[packageId] !== undefined,
  )?.[0];
}

export function getWorldSettingPackageIds(settingKey: string): string[] {
  const packageId = settingKey.split("/")[0];
  const parentRulesetId = getParentRulesetId(packageId);
  return parentRulesetId ? [parentRulesetId, packageId] : [packageId];
}

export function getWorldSettingLabel(
  settingKey: string | null,
): string | undefined {
  if (!settingKey) return undefined;
  const packageId = settingKey.split("/")[0];
  return allDefaultPackages[packageId]?.name;
}

export function useWorldSettings(): {
  settings: IWorldSetting[];
  loading: boolean;
} {
  const [settings, setSettings] = useState<IWorldSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all(
      Object.values(allDefaultPackages).map((config) =>
        config
          .load()
          .then((rulesPackage) => ({ config, rulesPackage }))
          .catch((error) => {
            console.error(error);
            return null;
          }),
      ),
    ).then((results) => {
      if (!isMounted) return;

      const loadedSettings: IWorldSetting[] = [];
      results.forEach((result) => {
        if (!result) return;
        const { config, rulesPackage } = result;
        const truths =
          "truths" in rulesPackage ? (rulesPackage.truths ?? {}) : {};
        if (Object.keys(truths).length > 0) {
          loadedSettings.push({
            key: `${config.id}/${SYNTHESIZED_SETTING_KEY}`,
            label: config.name,
            packageIds: getWorldSettingPackageIds(config.id),
          });
        }
      });
      setSettings(loadedSettings);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, loading };
}

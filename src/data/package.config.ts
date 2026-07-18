import { Datasworn } from "@datasworn-community/core";

interface BaseConfig {
  id: string;
  name: string;
  type: "ruleset" | "expansion";
  isHomebrew: boolean;
  licenseInfo?: {
    license: string;
    licenseUrl: string;
    url?: string;
    author: string;
  };
}
export interface IRulesetConfig extends BaseConfig {
  type: "ruleset";
  load: () => Promise<Datasworn.Ruleset>;
}
export interface IExpansionConfig extends BaseConfig {
  type: "expansion";
  load: () => Promise<Datasworn.Expansion>;
}

export type IPackageConfig = IRulesetConfig | IExpansionConfig;

export const ironswornRulesetConfig: IRulesetConfig = {
  id: "classic",
  name: "Ironsworn",
  type: "ruleset",
  load: async () => {
    const ironswornJSON = await import(
      "@datasworn-community/ironsworn-classic/json/classic.json"
    );
    return { ...ironswornJSON, title: "Ironsworn" } as Datasworn.Ruleset;
  },
  isHomebrew: false,
};

export const ironswornDelveConfig: IExpansionConfig = {
  id: "delve",
  name: "Delve",
  type: "expansion",
  load: async () => {
    const ironswornDelveJSON = await import(
      "@datasworn-community/ironsworn-classic-delve/json/delve.json"
    );
    return {
      ...ironswornDelveJSON,
      title: "Delve",
    } as unknown as Datasworn.Expansion;
  },
  isHomebrew: false,
};

export const ironswornLodestarConfig: IExpansionConfig = {
  id: "lodestar",
  name: "Lodestar",
  type: "expansion",
  load: async () => {
    const ironswornLodestarJSON = await import(
      "@datasworn-community/ironsworn-classic-lodestar/json/lodestar.json"
    );
    return {
      ...ironswornLodestarJSON,
      title: "Lodestar",
    } as unknown as Datasworn.Expansion;
  },
  isHomebrew: false,
};

export const starforgedRulesetConfig: IRulesetConfig = {
  id: "starforged",
  name: "Starforged",
  type: "ruleset",
  load: async () => {
    const starforgedJSON = await import(
      "@datasworn-community/starforged/json/starforged.json"
    );
    return {
      ...starforgedJSON,
      title: "Starforged",
    } as unknown as Datasworn.Ruleset;
  },
  isHomebrew: false,
};

export const sunderedIslesConfig: IExpansionConfig = {
  id: "sundered_isles",
  name: "Sundered Isles",
  type: "expansion",
  load: async () => {
    const starforgedDelveJSON = await import(
      "@datasworn-community/sundered-isles/json/sundered_isles.json"
    );
    return {
      ...starforgedDelveJSON,
    } as unknown as Datasworn.Expansion;
  },
  isHomebrew: false,
};

export const starsmithConfig: IExpansionConfig = {
  id: "starsmith",
  name: "Starsmith",
  type: "expansion",
  load: async () => {
    const starsmithJSON = await import(
      "@datasworn-community/starsmith/json/starsmith.json"
    );
    return {
      ...starsmithJSON,
    } as Datasworn.Expansion;
  },
  isHomebrew: true,
  licenseInfo: {
    license: " CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    url: "https://playeveryrole.com/starsmith-products/",
    author: "Eric Bright",
  },
};

export const elegyRulesetConfig: IRulesetConfig = {
  id: "elegy",
  name: "Elegy",
  type: "ruleset",
  load: async () => {
    const elegyJSON = await import(
      "@datasworn-community/elegy/json/elegy.json"
    );
    return {
      ...elegyJSON,
    } as Datasworn.Ruleset;
  },
  isHomebrew: true,
  licenseInfo: {
    license: " CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/deed.en",
    url: "https://miraclem.itch.io/elegy",
    author: "Moro de Oliveira",
  },
};

export const includedRulesets: Record<string, IRulesetConfig> = {
  [ironswornRulesetConfig.id]: ironswornRulesetConfig,
  [starforgedRulesetConfig.id]: starforgedRulesetConfig,
  [elegyRulesetConfig.id]: elegyRulesetConfig,
};

export const includedExpansions: Record<
  string,
  Record<string, IExpansionConfig>
> = {
  [ironswornRulesetConfig.id]: {
    [ironswornDelveConfig.id]: ironswornDelveConfig,
    [ironswornLodestarConfig.id]: ironswornLodestarConfig,
  },
  [starforgedRulesetConfig.id]: {
    [sunderedIslesConfig.id]: sunderedIslesConfig,
    [starsmithConfig.id]: starsmithConfig,
  },
};

export const expansionDependencies: Record<string, Record<string, string[]>> = {
  [ironswornRulesetConfig.id]: {
    [ironswornLodestarConfig.id]: [ironswornDelveConfig.id],
  },
};

export function getExpansionDependencies(
  rulesetId: string,
  expansionId: string,
): string[] {
  return expansionDependencies[rulesetId]?.[expansionId] ?? [];
}

export function getExpansionDependents(
  rulesetId: string,
  expansionId: string,
): string[] {
  return Object.entries(expansionDependencies[rulesetId] ?? {})
    .filter(([, dependencyIds]) => dependencyIds.includes(expansionId))
    .map(([dependentId]) => dependentId);
}

export function enforceExpansionDependencies<
  T extends Record<string, Record<string, boolean>>,
>(expansions: T): T {
  const next = { ...expansions } as T;

  Object.entries(expansionDependencies).forEach(
    ([rulesetId, dependentRules]) => {
      const rulesetExpansions = next[rulesetId];
      if (!rulesetExpansions) return;

      Object.entries(dependentRules).forEach(([dependentId, dependencyIds]) => {
        const isDependentActive = rulesetExpansions[dependentId] ?? false;
        const areDependenciesActive = dependencyIds.every(
          (dependencyId) => rulesetExpansions[dependencyId] ?? false,
        );

        if (isDependentActive && !areDependenciesActive) {
          next[rulesetId] = {
            ...rulesetExpansions,
            [dependentId]: false,
          };
        }
      });
    },
  );

  return next;
}

export const allDefaultPackages: Record<string, IPackageConfig> = {
  ...includedRulesets,
  [ironswornDelveConfig.id]: ironswornDelveConfig,
  [ironswornLodestarConfig.id]: ironswornLodestarConfig,
  [sunderedIslesConfig.id]: sunderedIslesConfig,
  [starsmithConfig.id]: starsmithConfig,
};

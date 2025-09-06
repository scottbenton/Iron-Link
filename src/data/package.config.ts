import { Datasworn } from "@datasworn/core";

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
      "@datasworn/ironsworn-classic/json/classic.json"
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
      "@datasworn/ironsworn-classic-delve/json/delve.json"
    );
    return {
      ...ironswornDelveJSON,
      title: "Delve",
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
      "@datasworn/starforged/json/starforged.json"
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
      "@datasworn/sundered-isles/json/sundered_isles.json"
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
    const starsmithJSON = await import("./third-party-json/starsmith.json");
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
    const elegyJSON = await import("./third-party-json/elegy.json");
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
  },
  [starforgedRulesetConfig.id]: {
    [sunderedIslesConfig.id]: sunderedIslesConfig,
    [starsmithConfig.id]: starsmithConfig,
  },
};

export const allDefaultPackages: Record<string, IPackageConfig> = {
  ...includedRulesets,
  [ironswornDelveConfig.id]: ironswornDelveConfig,
  [sunderedIslesConfig.id]: sunderedIslesConfig,
  [starsmithConfig.id]: starsmithConfig,
};

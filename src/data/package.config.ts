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
    const { classic } = await import("@datasworn-community/ironsworn-classic");
    return { ...classic, title: "Ironsworn" };
  },
  isHomebrew: false,
};

export const ironswornDelveConfig: IExpansionConfig = {
  id: "delve",
  name: "Delve",
  type: "expansion",
  load: async () => {
    const { delve } = await import(
      "@datasworn-community/ironsworn-classic-delve"
    );
    return {
      ...delve,
      title: "Delve",
    };
  },
  isHomebrew: false,
};

export const starforgedRulesetConfig: IRulesetConfig = {
  id: "starforged",
  name: "Starforged",
  type: "ruleset",
  load: async () => {
    const { starforged } = await import("@datasworn-community/starforged");
    return {
      ...starforged,
      title: "Starforged",
    };
  },
  isHomebrew: false,
};

export const sunderedIslesConfig: IExpansionConfig = {
  id: "sundered_isles",
  name: "Sundered Isles",
  type: "expansion",
  load: async () => {
    const { sundered_isles } = await import(
      "@datasworn-community/sundered-isles"
    );
    return { ...sundered_isles };
  },
  isHomebrew: false,
};

export const starsmithConfig: IExpansionConfig = {
  id: "starsmith",
  name: "Starsmith",
  type: "expansion",
  load: async () => {
    const { starsmith } = await import("@datasworn-community/starsmith");
    return { ...starsmith };
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
    const { elegy } = await import("@datasworn-community/elegy");
    return {
      ...elegy,
    };
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

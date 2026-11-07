import { ironLinkAskTheOracleRulesPackage } from "data/askTheOracle";
import {
  elegyRulesetConfig,
  ironswornDelveConfig,
  ironswornGiveawaysConfig,
  ironswornLodestarConfig,
  ironswornRulesetConfig,
  starforgedGiveawaysConfig,
  starforgedRulesetConfig,
  starsmithConfig,
  sunderedIslesConfig,
} from "data/package.config";
import { defaultPlaysets } from "data/playset.config";

import { i18n } from "i18n/config";

import { PlaysetConfig } from "repositories/game.repository";

export type ReferenceSection = "moves" | "oracles" | "assets" | "rules";

export const referenceSections: ReferenceSection[] = [
  "moves",
  "oracles",
  "assets",
  "rules",
];

// An expansion a reader can hide from the lists in one tab. Hiding only
// filters the lists: the content stays loaded, so a shared link to a hidden
// item still opens.
export interface ReferenceSource {
  // The id of the source: the package id, plus the sections it covers when it
  // is scoped (the Starforged assets in the Sundered Isles tab).
  key: string;
  packageId: string;
  label: string;
  defaultVisible: boolean;
  // Sections the source covers. Unset means every section.
  sections?: ReferenceSection[];
  // Sources that must be visible for this one to show (Lodestar needs Delve).
  dependsOn?: string[];
}

export interface ReferenceTab {
  // Each tab's id is the id of its home package, so a list URL like
  // /reference/sundered_isles/moves names the tab and the package alike.
  id: string;
  label: string;
  // Every package the tab loads.
  packageIds: string[];
  // The packages whose items need no source tag in this tab.
  primaryPackageIds: string[];
  playset: PlaysetConfig;
  sources: ReferenceSource[];
}

const starforgedPlayset =
  defaultPlaysets[sunderedIslesConfig.id]?.playsets[0]?.playset ?? {};
const sunderedIslesPlayset =
  defaultPlaysets[sunderedIslesConfig.id]?.playsets[1]?.playset ?? {};

export const referenceTabs: ReferenceTab[] = [
  {
    id: ironswornRulesetConfig.id,
    label: ironswornRulesetConfig.name,
    packageIds: [
      ironswornRulesetConfig.id,
      ironswornDelveConfig.id,
      ironswornLodestarConfig.id,
      ironswornGiveawaysConfig.id,
    ],
    primaryPackageIds: [ironswornRulesetConfig.id],
    playset: {},
    sources: [
      {
        key: ironswornDelveConfig.id,
        packageId: ironswornDelveConfig.id,
        label: ironswornDelveConfig.name,
        defaultVisible: true,
      },
      {
        key: ironswornLodestarConfig.id,
        packageId: ironswornLodestarConfig.id,
        label: ironswornLodestarConfig.name,
        defaultVisible: true,
        dependsOn: [ironswornDelveConfig.id],
      },
      {
        key: ironswornGiveawaysConfig.id,
        packageId: ironswornGiveawaysConfig.id,
        label: i18n.t("reference.sources.giveaway-assets", "Giveaway assets"),
        defaultVisible: true,
      },
    ],
  },
  {
    id: starforgedRulesetConfig.id,
    label: starforgedRulesetConfig.name,
    packageIds: [
      starforgedRulesetConfig.id,
      sunderedIslesConfig.id,
      starforgedGiveawaysConfig.id,
      starsmithConfig.id,
    ],
    primaryPackageIds: [starforgedRulesetConfig.id],
    playset: starforgedPlayset,
    sources: [
      {
        key: `${sunderedIslesConfig.id}:assets`,
        packageId: sunderedIslesConfig.id,
        label: i18n.t(
          "reference.sources.sundered-isles-assets",
          "Sundered Isles assets",
        ),
        defaultVisible: true,
        sections: ["assets"],
      },
      {
        key: starforgedGiveawaysConfig.id,
        packageId: starforgedGiveawaysConfig.id,
        label: i18n.t("reference.sources.giveaway-assets", "Giveaway assets"),
        defaultVisible: true,
      },
      {
        key: starsmithConfig.id,
        packageId: starsmithConfig.id,
        label: starsmithConfig.name,
        defaultVisible: false,
      },
    ],
  },
  {
    id: sunderedIslesConfig.id,
    label: sunderedIslesConfig.name,
    packageIds: [
      starforgedRulesetConfig.id,
      sunderedIslesConfig.id,
      starforgedGiveawaysConfig.id,
      starsmithConfig.id,
    ],
    primaryPackageIds: [sunderedIslesConfig.id],
    playset: sunderedIslesPlayset,
    sources: [
      {
        key: `${starforgedRulesetConfig.id}:assets`,
        packageId: starforgedRulesetConfig.id,
        label: i18n.t(
          "reference.sources.starforged-assets",
          "Starforged assets",
        ),
        defaultVisible: true,
        sections: ["assets"],
      },
      {
        key: starforgedGiveawaysConfig.id,
        packageId: starforgedGiveawaysConfig.id,
        label: i18n.t("reference.sources.giveaway-assets", "Giveaway assets"),
        defaultVisible: false,
      },
      {
        key: starsmithConfig.id,
        packageId: starsmithConfig.id,
        label: starsmithConfig.name,
        defaultVisible: false,
      },
    ],
  },
  {
    id: elegyRulesetConfig.id,
    label: elegyRulesetConfig.name,
    packageIds: [elegyRulesetConfig.id],
    primaryPackageIds: [elegyRulesetConfig.id],
    playset: {},
    sources: [],
  },
];

export const defaultReferenceTabId = starforgedRulesetConfig.id;

export const referenceTabMap: Record<string, ReferenceTab> = Object.fromEntries(
  referenceTabs.map((tab) => [tab.id, tab]),
);

// The tab a link to a package's item opens when the open tab can't show it.
const packageHomeTabs: Record<string, string> = {
  [ironswornRulesetConfig.id]: ironswornRulesetConfig.id,
  [ironswornDelveConfig.id]: ironswornRulesetConfig.id,
  [ironswornLodestarConfig.id]: ironswornRulesetConfig.id,
  [ironswornGiveawaysConfig.id]: ironswornRulesetConfig.id,
  [starforgedRulesetConfig.id]: starforgedRulesetConfig.id,
  [starforgedGiveawaysConfig.id]: starforgedRulesetConfig.id,
  [starsmithConfig.id]: starforgedRulesetConfig.id,
  [sunderedIslesConfig.id]: sunderedIslesConfig.id,
  [elegyRulesetConfig.id]: elegyRulesetConfig.id,
};

export function getHomeTabId(packageId: string): string | undefined {
  return packageHomeTabs[packageId];
}

export function tabLoadsPackage(tabId: string, packageId: string): boolean {
  // Iron Link's Ask the Oracle tables load with every tab.
  if (packageId === ironLinkAskTheOracleRulesPackage._id) {
    return !!referenceTabMap[tabId];
  }
  return referenceTabMap[tabId]?.packageIds.includes(packageId) ?? false;
}

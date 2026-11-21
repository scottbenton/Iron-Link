import { Datasworn } from "@datasworn-community/core";
import elegy from "@datasworn-community/elegy/json/elegy.json";
import feRunners from "@datasworn-community/fe-runners/json/fe_runners.json";
import delve from "@datasworn-community/ironsworn-classic-delve/json/delve.json";
import lodestar from "@datasworn-community/ironsworn-classic-lodestar/json/lodestar.json";
import classic from "@datasworn-community/ironsworn-classic/json/classic.json";
import starforged from "@datasworn-community/starforged/json/starforged.json";
import starsmith from "@datasworn-community/starsmith/json/starsmith.json";
import sunderedIsles from "@datasworn-community/sundered-isles/json/sundered_isles.json";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

// Each ruleset with the expansions that ship for it, loaded together as a
// game would load them, so replaced moves and their tables drop out as they
// do in play.
export const RULESETS = {
  classic: [classic, delve, lodestar],
  starforged: [starforged, sunderedIsles, starsmith, feRunners],
  elegy: [elegy],
} as unknown as Record<RulesetName, Datasworn.RulesPackage[]>;

export type RulesetName = "classic" | "starforged" | "elegy";

/** Loads a ruleset into the Datasworn tree store, as a game does. */
export function loadRules(packages: Datasworn.RulesPackage[]) {
  useDataswornTreeStore
    .getState()
    .setActiveRules(
      Object.fromEntries(packages.map((pkg) => [pkg._id, pkg])),
      {},
    );
}

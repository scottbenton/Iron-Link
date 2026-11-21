/**
 * Datasworn move and oracle collections as nested ReferenceCategory trees,
 * for stories. Story-only, like the rest of `fixtures`.
 *
 * Mirrors the live app's OracleTree: a `tables` collection opens to its
 * oracles, then its sub-collections; a shared-text collection (a planet's
 * Settlements, Derelict Zones) rolls as one oracle, so it is a row, not a
 * category.
 */
import type { Datasworn } from "@datasworn-community/core";

import { starforgedRules } from "./datasworn";
import {
  LooseMoveCategory,
  LooseOracleCollection,
} from "./referenceTreeHelpers";

export { MoveCategoryTree } from "./MoveCategoryTree";
export { OracleCollectionTree } from "./OracleCollectionTree";
export {
  countOracles,
  moveCountLabel,
  oracleCountLabel,
} from "./referenceTreeHelpers";
export type {
  LooseMoveCategory,
  LooseOracleCollection,
  TreeOpenOptions,
} from "./referenceTreeHelpers";

export const starforgedOracleCollections = Object.values(
  starforgedRules.oracles as Record<string, LooseOracleCollection>,
);

export const starforgedMoveCategories = Object.values(
  starforgedRules.moves as Record<string, LooseMoveCategory>,
);

/**
 * No published ruleset nests move categories, but custom content may. This
 * is real Starforged moves regrouped the way a homebrew pack might: one
 * category holding the combat and suffer categories, the suffer moves split
 * again by what they cost.
 */
export const nestedCustomMoves: LooseMoveCategory = (() => {
  const moves = starforgedRules.moves;
  const suffer = moves.suffer.contents as Record<string, Datasworn.AnyMove>;
  const pick = (keys: string[]) =>
    Object.fromEntries(keys.map((key) => [key, suffer[key]]));
  return {
    _id: "custom/moves/fight_and_bleed",
    name: "Fight and Bleed",
    contents: {},
    collections: {
      combat: { ...moves.combat, collections: {} },
      suffer: {
        _id: "custom/moves/fight_and_bleed/suffer",
        name: "Suffer Moves",
        contents: {},
        collections: {
          body: {
            _id: "custom/moves/fight_and_bleed/suffer/body",
            name: "Body and Mind",
            contents: pick(["lose_momentum", "endure_harm", "endure_stress"]),
          },
          ship: {
            _id: "custom/moves/fight_and_bleed/suffer/ship",
            name: "Ship and Crew",
            contents: pick([
              "withstand_damage",
              "companion_takes_a_hit",
              "sacrifice_resources",
            ]),
          },
        },
      },
    },
  };
})();

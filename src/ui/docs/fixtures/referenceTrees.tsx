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

import { MoveListItem } from "../../game/MoveListItem";
import { OracleListItem } from "../../game/OracleListItem";
import { ReferenceCategory } from "../../game/ReferenceCategory";
import { starforgedRules } from "./datasworn";

export interface LooseOracleCollection {
  _id: string;
  name: string;
  oracle_type: string;
  contents?: Record<string, { _id: string; name: string }>;
  collections?: Record<string, LooseOracleCollection>;
}

export interface LooseMoveCategory {
  _id?: string;
  name: string;
  contents: Record<string, Datasworn.AnyMove>;
  collections?: Record<string, LooseMoveCategory>;
}

const isSharedRoll = (collection: LooseOracleCollection) =>
  collection.oracle_type !== "tables";

/** Every oracle a collection rolls, its sub-collections included. */
export function countOracles(collection: LooseOracleCollection): number {
  if (isSharedRoll(collection)) return 1;
  return (
    Object.keys(collection.contents ?? {}).length +
    Object.values(collection.collections ?? {}).reduce(
      (total, child) => total + countOracles(child),
      0,
    )
  );
}

export const oracleCountLabel = (count: number) =>
  count === 1 ? "1 oracle" : `${count} oracles`;
export const moveCountLabel = (count: number) =>
  count === 1 ? "1 move" : `${count} moves`;

export interface TreeOpenOptions {
  /** Every category starts open (true) or closed (false). */
  defaultOpen?: boolean;
  /** Only these collection ids start open; wins over `defaultOpen`. */
  openIds?: ReadonlySet<string>;
}

const startsOpen = (id: string | undefined, options: TreeOpenOptions) =>
  options.openIds ? !!id && options.openIds.has(id) : !!options.defaultOpen;

/** An oracle collection and everything under it. */
export function OracleCollectionTree(
  props: { collection: LooseOracleCollection } & TreeOpenOptions,
) {
  const { collection, ...options } = props;
  return (
    <ReferenceCategory
      title={collection.name}
      count={countOracles(collection)}
      countLabel={oracleCountLabel}
      defaultOpen={startsOpen(collection._id, options)}
    >
      {Object.values(collection.contents ?? {}).map((oracle) => (
        <OracleListItem key={oracle._id} name={oracle.name} onRoll={() => {}} />
      ))}
      {Object.values(collection.collections ?? {}).map((child) =>
        isSharedRoll(child) ? (
          <OracleListItem key={child._id} name={child.name} onRoll={() => {}} />
        ) : (
          <OracleCollectionTree
            key={child._id}
            collection={child}
            {...options}
          />
        ),
      )}
    </ReferenceCategory>
  );
}

/** A move category, with any categories nested in it (custom content). */
export function MoveCategoryTree(
  props: { category: LooseMoveCategory } & TreeOpenOptions,
) {
  const { category, ...options } = props;
  const children = Object.values(category.collections ?? {});
  const count = (c: LooseMoveCategory): number =>
    Object.keys(c.contents).length +
    Object.values(c.collections ?? {}).reduce((n, x) => n + count(x), 0);
  return (
    <ReferenceCategory
      title={category.name}
      count={count(category)}
      countLabel={moveCountLabel}
      defaultOpen={startsOpen(category._id, options)}
    >
      {Object.values(category.contents).map((move) => (
        <MoveListItem key={move._id} move={move} />
      ))}
      {children.map((child) => (
        <MoveCategoryTree
          key={child._id ?? child.name}
          category={child}
          {...options}
        />
      ))}
    </ReferenceCategory>
  );
}

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

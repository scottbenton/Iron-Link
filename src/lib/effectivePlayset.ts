import { Datasworn, IdParser } from "@datasworn/core";
import { Primary } from "@datasworn/core/dist/StringId";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

// The effective playset of a world (iron-link-parity 01-worlds.md):
// derived at read time, persisted nowhere.
//
// - Linked games: the union of the games' playsets. A datasworn `replaces`
//   applies iff the replacing oracle is included in at least one linked
//   game's playset — a game *not having* a package is absence, not a veto;
//   an explicit exclusion in a playset that has the package is an opinion.
// - Standalone worlds: the setting's packages plus the packages referenced
//   by existing bindings, with no exclusions.
//
// Bindings are pinned and concrete ({ packageId, oracleId }); resolution
// applies at most one replacement step on top of the pinned id, and the
// `exact` flag skips replacements entirely.

export interface LinkedGamePlayset {
  rulesets: RulesetConfig;
  expansions: ExpansionConfig;
  playset: PlaysetConfig;
}

export interface EffectivePlayset {
  packageIds: string[];
  isOracleIncluded: (packageId: string, oracleId: string) => boolean;
}

export function getGameActivePackageIds(game: LinkedGamePlayset): string[] {
  const packageIds: string[] = [];
  Object.entries(game.rulesets).forEach(([rulesetId, isActive]) => {
    if (!isActive) return;
    packageIds.push(rulesetId);
    Object.entries(game.expansions[rulesetId] ?? {}).forEach(
      ([expansionId, isExpansionActive]) => {
        if (isExpansionActive) {
          packageIds.push(expansionId);
        }
      },
    );
  });
  return packageIds;
}

export function getPackageIdFromDataswornId(
  dataswornId: string,
): string | undefined {
  return dataswornId.split(":")[1]?.split("/")[0];
}

function getAncestorCollectionIds(oracleId: string): string[] {
  // "oracle_rollable:pkg/a/b/c" -> ["oracle_collection:pkg/a/b",
  //                                 "oracle_collection:pkg/a"]
  const path = oracleId.split(":")[1];
  if (!path) return [];
  const segments = path.split("/");
  const ancestors: string[] = [];
  // Stop before the bare package id — that is not a collection
  for (let length = segments.length - 1; length >= 2; length--) {
    ancestors.push(`oracle_collection:${segments.slice(0, length).join("/")}`);
  }
  return ancestors;
}

function isOracleExcludedByPlayset(
  playset: PlaysetConfig,
  oracleId: string,
): boolean {
  if (playset.excludes?.oracles?.[oracleId]) {
    return true;
  }
  return getAncestorCollectionIds(oracleId).some(
    (collectionId) => playset.excludes?.oracleCategories?.[collectionId],
  );
}

export function computeEffectivePlayset(
  linkedGames: LinkedGamePlayset[],
  standalonePackageIds: string[] = [],
): EffectivePlayset {
  if (linkedGames.length === 0) {
    const packageIds = Array.from(new Set(standalonePackageIds));
    return {
      packageIds,
      isOracleIncluded: (packageId) => packageIds.includes(packageId),
    };
  }

  const gamePackages = linkedGames.map((game) => ({
    game,
    packageIds: getGameActivePackageIds(game),
  }));
  const packageIds = Array.from(
    new Set(gamePackages.flatMap(({ packageIds }) => packageIds)),
  );

  return {
    packageIds,
    isOracleIncluded: (packageId, oracleId) =>
      gamePackages.some(
        ({ game, packageIds }) =>
          packageIds.includes(packageId) &&
          !isOracleExcludedByPlayset(game.playset, oracleId),
      ),
  };
}

// Maps replaced oracle id -> replacing oracle id, considering only packages
// in the effective playset and only replacements whose replacing oracle is
// included in at least one linked playset. When two included oracles replace
// the same id, the lexicographically smallest replacing id wins so every
// client resolves identically.
export function buildOracleReplacementMap(
  tree: Record<string, Datasworn.RulesPackage>,
  effectivePlayset: EffectivePlayset,
): Record<string, string> {
  const replacements: Record<string, string> = {};

  const recordReplacement = (replacedId: string, replacingId: string) => {
    const replacingPackageId = getPackageIdFromDataswornId(replacingId);
    if (
      !replacingPackageId ||
      !effectivePlayset.isOracleIncluded(replacingPackageId, replacingId)
    ) {
      return;
    }
    const existing = replacements[replacedId];
    if (existing === undefined || replacingId < existing) {
      replacements[replacedId] = replacingId;
    }
  };

  const getOracleMatches = (pattern: string) => {
    try {
      return IdParser.getMatches(pattern as Primary, tree);
    } catch (e) {
      console.error(`Failed to resolve datasworn id "${pattern}"`, e);
      return new Map<string, unknown>();
    }
  };

  const walkCollection = (collection: Datasworn.OracleCollection) => {
    Object.values(collection.contents ?? {}).forEach((oracle) => {
      oracle.replaces?.forEach((pattern: string) => {
        getOracleMatches(pattern).forEach((match) => {
          const matched = match as { _id?: string; type?: string };
          if (matched.type === oracle.type && matched._id) {
            recordReplacement(matched._id, oracle._id);
          }
        });
      });
    });

    collection.replaces?.forEach((pattern) => {
      getOracleMatches(pattern).forEach((match) => {
        const matchedCollection = match as Datasworn.OracleCollection;
        if (matchedCollection.type !== collection.type) return;
        // A replacing collection replaces same-keyed oracles member-by-member
        Object.entries(collection.contents ?? {}).forEach(([key, oracle]) => {
          const replacedOracle = matchedCollection.contents?.[key];
          if (replacedOracle) {
            recordReplacement(replacedOracle._id, oracle._id);
          }
        });
      });
    });

    if ("collections" in collection) {
      Object.values(collection.collections ?? {}).forEach(walkCollection);
    }
  };

  effectivePlayset.packageIds.forEach((packageId) => {
    const rulesPackage = tree[packageId];
    if (!rulesPackage) return;
    Object.values(rulesPackage.oracles ?? {}).forEach(walkCollection);
  });

  return replacements;
}

export interface ResolvableOracleBinding {
  oracleId: string;
  resolvedOracleId: string;
  exact?: boolean;
}

export function resolveOracleBinding(
  binding: ResolvableOracleBinding,
  replacementMap: Record<string, string>,
): string {
  if (binding.exact) {
    return binding.oracleId;
  }
  return replacementMap[binding.oracleId] ?? binding.oracleId;
}

export interface BindingDivergence {
  previousOracleId: string;
  nextOracleId: string;
}

// Divergence is a diff against the binding's stored resolvedOracleId; a
// non-null result must be surfaced (preview at the causing action, game-log
// entries for everyone else) — never applied silently.
export function getBindingDivergence(
  binding: ResolvableOracleBinding,
  replacementMap: Record<string, string>,
): BindingDivergence | null {
  const nextOracleId = resolveOracleBinding(binding, replacementMap);
  if (nextOracleId === binding.resolvedOracleId) {
    return null;
  }
  return {
    previousOracleId: binding.resolvedOracleId,
    nextOracleId,
  };
}

import type { Datasworn } from "@datasworn-community/core";

import { allDefaultPackages } from "data/package.config";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import {
  type EffectivePlayset,
  type LinkedGamePlayset,
  buildOracleReplacementCandidates,
  computeEffectivePlayset,
  getBindingDivergence,
  getPackageIdFromDataswornId,
} from "./effectivePlayset";
import { getWorldSettingPackageIds } from "./worldSettingPackageIds";

export interface WorldOracleChoice {
  id: string;
  packageId: string;
  packageName: string;
  label: string;
  oracle: Datasworn.OracleRollable;
}
export interface WorldOracleCatalog {
  tree: Record<string, Datasworn.RulesPackage>;
  effectivePlayset: EffectivePlayset;
  choices: WorldOracleChoice[];
  replacementMap: Record<string, string>;
  collisions: Record<string, string[]>;
  missingPackageIds: string[];
}

const packageLoads = new Map<string, Promise<Datasworn.RulesPackage>>();

/** Independent of the game Datasworn store: package objects are only read. */
async function loadPackage(id: string) {
  let promise = packageLoads.get(id);
  if (!promise) {
    promise = allDefaultPackages[id].load().catch((error) => {
      packageLoads.delete(id);
      throw error;
    });
    packageLoads.set(id, promise);
  }
  return promise;
}

export function getBindingPackageIds(bindings: OracleBinding[]): string[] {
  return [
    ...new Set(
      bindings
        .flatMap((binding) => [
          binding.packageId,
          getPackageIdFromDataswornId(binding.resolvedOracleId),
        ])
        .filter((id): id is string => !!id),
    ),
  ];
}

export function buildWorldOracleCatalog(
  tree: Record<string, Datasworn.RulesPackage>,
  effectivePlayset: EffectivePlayset,
  missingPackageIds: string[] = [],
): WorldOracleCatalog {
  const choices: WorldOracleChoice[] = [];
  for (const [packageId, rulesPackage] of Object.entries(tree)) {
    const walk = (
      collection: Datasworn.OracleCollection,
      parents: string[],
    ) => {
      const path = [...parents, collection.name ?? collection._id];
      for (const oracle of Object.values(collection.contents ?? {})) {
        choices.push({
          id: oracle._id,
          packageId,
          packageName:
            allDefaultPackages[packageId]?.name ??
            rulesPackage.title ??
            packageId,
          label: [...path, oracle.name ?? oracle._id].join(" / "),
          oracle,
        });
      }
      if ("collections" in collection) {
        Object.values(collection.collections ?? {}).forEach((child) =>
          walk(child, path),
        );
      }
    };
    Object.values(rulesPackage.oracles ?? {}).forEach((collection) =>
      walk(collection, []),
    );
  }
  const candidates = buildOracleReplacementCandidates(tree, effectivePlayset);
  return {
    tree,
    effectivePlayset,
    choices: choices.sort(
      (a, b) =>
        a.packageName.localeCompare(b.packageName) ||
        a.label.localeCompare(b.label) ||
        a.id.localeCompare(b.id),
    ),
    replacementMap: Object.fromEntries(
      Object.entries(candidates).map(([id, ids]) => [id, ids[0]]),
    ),
    collisions: Object.fromEntries(
      Object.entries(candidates).filter(([, ids]) => ids.length > 1),
    ),
    missingPackageIds,
  };
}

export async function loadWorldOracleCatalog({
  linkedGames,
  settingKey,
  bindingPackageIds: bindingPackages = [],
  allPackages = false,
}: {
  linkedGames: LinkedGamePlayset[];
  settingKey: string | null;
  // Packages that existing bindings point at; see getBindingPackageIds.
  bindingPackageIds?: string[];
  allPackages?: boolean;
}): Promise<WorldOracleCatalog> {
  const effectivePlayset = computeEffectivePlayset(linkedGames, [
    ...getWorldSettingPackageIds(settingKey),
    ...bindingPackages,
  ]);
  const ids = [
    ...new Set([
      ...effectivePlayset.packageIds,
      ...bindingPackages,
      ...(allPackages ? Object.keys(allDefaultPackages) : []),
    ]),
  ];
  const missingPackageIds = ids.filter((id) => !allDefaultPackages[id]);
  const loaded = await Promise.all(
    ids
      .filter((id) => !!allDefaultPackages[id])
      .map(async (id) => [id, await loadPackage(id)] as const),
  );
  return buildWorldOracleCatalog(
    Object.fromEntries(loaded),
    effectivePlayset,
    missingPackageIds,
  );
}

export function getWorldOracleChoices(
  catalog: WorldOracleCatalog,
  allPackages = false,
  exact = false,
) {
  return catalog.choices.filter(
    (choice) =>
      (allPackages ||
        catalog.effectivePlayset.isOracleIncluded(
          choice.packageId,
          choice.id,
        )) &&
      (exact || !catalog.replacementMap[choice.id]),
  );
}

/** Oracle rolls use this stored target, even while a replacement is pending. */
export function getFrozenWorldOracleBinding(
  binding: OracleBinding,
  catalog: WorldOracleCatalog,
) {
  const choice = catalog.choices.find(
    (candidate) => candidate.id === binding.resolvedOracleId,
  );
  return {
    oracleId: binding.resolvedOracleId,
    oracle: choice?.oracle,
    missing: !choice,
    divergence: getBindingDivergence(binding, catalog.replacementMap),
  };
}

export function pinWorldOracleChoice(
  choice: WorldOracleChoice,
  exact = false,
): OracleBinding {
  return {
    packageId: choice.packageId,
    oracleId: choice.id,
    resolvedOracleId: choice.id,
    ...(exact ? { exact: true } : {}),
  };
}

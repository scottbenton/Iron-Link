import { Datasworn } from "@datasworn-community/core";

import { getOrderedPackageConfigs } from "data/package.config";

export type WorldOption =
  | { kind: "world"; packageId: string; worldId: string; name: string }
  | { kind: "package"; packageId: string; name: string };

// Enumerates the world-picker options across a set of loaded rules
// packages, in the deterministic order defined by package.config.ts
// (rulesets in declaration order, then each ruleset's expansions in
// declaration order; within a package, `worlds` dictionary key order).
//
// A package contributes one "world" option per entry in its `worlds`
// dictionary. A package with no worlds but at least one truth category
// contributes a single "package" option, so a setting that only ships
// truths (no curated world) can still be selected. A package with
// neither is skipped.
export function enumerateWorldOptions(
  packages: Record<string, Datasworn.RulesPackage>,
  displayNames: Record<string, string>,
): WorldOption[] {
  const options: WorldOption[] = [];

  getOrderedPackageConfigs().forEach(({ id: packageId }) => {
    const rulesPackage = packages[packageId];
    if (!rulesPackage) return;

    const worlds = rulesPackage.worlds ?? {};
    const worldEntries = Object.values(worlds);

    if (worldEntries.length > 0) {
      worldEntries.forEach((world) => {
        options.push({
          kind: "world",
          packageId,
          worldId: world._id,
          name: world.name,
        });
      });
      return;
    }

    const truths = rulesPackage.truths ?? {};
    if (Object.keys(truths).length > 0) {
      options.push({
        kind: "package",
        packageId,
        name: displayNames[packageId] ?? packageId,
      });
    }
  });

  return options;
}

// Pre-computed from the registered packages in package.config.ts. The
// creation UI renders this table directly instead of loading every rules
// package (~6MB of JSON combined) just to read four names. The vitest
// suite in `__tests__/worldOptions.test.ts` loads the real packages and
// asserts `enumerateWorldOptions` reproduces this exact table, so this
// stays honest as packages change.
export const worldOptions: WorldOption[] = [
  {
    kind: "world",
    packageId: "classic",
    worldId: "world:classic/ironlands",
    name: "The Ironlands",
  },
  {
    kind: "world",
    packageId: "starforged",
    worldId: "world:starforged/forge",
    name: "The Forge",
  },
  {
    kind: "world",
    packageId: "sundered_isles",
    worldId: "world:sundered_isles/sundered_isles",
    name: "The Sundered Isles",
  },
  {
    kind: "world",
    packageId: "elegy",
    worldId: "world:elegy/santa_maria",
    name: "Santa Maria",
  },
];

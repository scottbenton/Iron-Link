import { Datasworn } from "@datasworn-community/core";

export function parseImpactRules(
  trees: Record<string, Datasworn.RulesPackage>,
): {
  impactCategories: Record<string, Datasworn.ImpactCategory>;
  impacts: Record<string, Datasworn.ImpactRule>;
} {
  let impactCategories: Record<string, Datasworn.ImpactCategory> = {};
  let impacts: Record<string, Datasworn.ImpactRule> = {};

  Object.values(trees).forEach((tree) => {
    impactCategories = { ...impactCategories, ...(tree.rules?.impacts ?? {}) };
    Object.values(tree.rules?.impacts ?? {}).forEach((impactCategory) => {
      impacts = { ...impacts, ...(impactCategory.contents ?? {}) };
    });
  });

  return {
    impactCategories,
    impacts,
  };
}

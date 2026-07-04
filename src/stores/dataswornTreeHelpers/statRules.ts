import { Datasworn } from "@datasworn-community/core";

export function parseStatRules(
  trees: Record<string, Datasworn.RulesPackage>,
): Record<string, Datasworn.StatRule> {
  let stats: Record<string, Datasworn.StatRule> = {};

  Object.values(trees).forEach((tree) => {
    stats = { ...stats, ...(tree.rules?.stats ?? {}) };
  });

  return stats;
}

import { includedExpansions, includedRulesets } from "data/package.config";

/**
 * The names of a game's active rulesets, each followed by its active
 * expansions, in the order the game stores them. Packages this build does
 * not know are left out rather than crashing the list.
 */
export function getGameRulesPackageNames(
  rulesets: Record<string, boolean>,
  expansions: Record<string, Record<string, boolean>>,
): string[] {
  const names: string[] = [];
  Object.entries(rulesets).forEach(([rulesetId, isRulesetActive]) => {
    const ruleset = includedRulesets[rulesetId];
    if (!isRulesetActive || !ruleset) return;
    names.push(ruleset.name);
    Object.entries(expansions[rulesetId] ?? {}).forEach(
      ([expansionId, isExpansionActive]) => {
        const expansion = includedExpansions[rulesetId]?.[expansionId];
        if (isExpansionActive && expansion) names.push(expansion.name);
      },
    );
  });
  return names;
}

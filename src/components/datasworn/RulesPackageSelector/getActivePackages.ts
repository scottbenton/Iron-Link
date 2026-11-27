import { IExpansionConfig, IRulesetConfig } from "data/package.config";

/**
 * The rulesets turned on, and the expansions turned on under them. An
 * expansion of a ruleset that is off is left out, as is an id this build
 * does not know.
 */
export function getActivePackages(
  rulesets: Record<string, IRulesetConfig>,
  expansions: Record<string, Record<string, IExpansionConfig>>,
  activeRulesetConfig: Record<string, boolean>,
  activeExpansionConfig: Record<string, Record<string, boolean>>,
) {
  const activeRulesets: Record<string, IRulesetConfig> = {};
  const activeExpansions: Record<string, IExpansionConfig> = {};

  Object.entries(activeRulesetConfig).forEach(([rulesetId, isActive]) => {
    const ruleset = rulesets[rulesetId];
    if (!isActive || !ruleset) return;
    activeRulesets[rulesetId] = ruleset;
    Object.entries(activeExpansionConfig[rulesetId] ?? {}).forEach(
      ([expansionId, isExpansionActive]) => {
        const expansion = expansions[rulesetId]?.[expansionId];
        if (isExpansionActive && expansion) {
          activeExpansions[expansionId] = expansion;
        }
      },
    );
  });

  return { activeRulesets, activeExpansions };
}

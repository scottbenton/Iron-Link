import { useDataswornTree } from "stores/dataswornTree.store";

import {
  ironswornRulesetConfig,
  starforgedRulesetConfig,
} from "data/package.config";

// Ironsworn calls its impacts debilities; Starforged and the others say
// impacts.
export function useImpactsWording(): "ironsworn" | "starforged" {
  const rulesets = useDataswornTree();
  return rulesets[ironswornRulesetConfig.id] &&
    !rulesets[starforgedRulesetConfig.id]
    ? "ironsworn"
    : "starforged";
}

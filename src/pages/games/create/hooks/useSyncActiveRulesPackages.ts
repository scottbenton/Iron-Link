import { Datasworn } from "@datasworn/core";
import { useMemo } from "react";

import { useUpdateDataswornTree } from "stores/dataswornTree.store";

import {
  defaultBaseRulesets,
  defaultExpansions,
} from "data/datasworn.packages";

import { ExpansionConfig, RulesetConfig } from "repositories/game.repository";

export function useSyncActiveRulesPackages(
  rulesets: RulesetConfig,
  expansions: ExpansionConfig,
) {
  const activeRulesPackages = useMemo(() => {
    const activePackages: Record<string, Datasworn.RulesPackage> = {};

    Object.entries(rulesets ?? {}).forEach(([id, isActive]) => {
      if (isActive) {
        activePackages[id] = defaultBaseRulesets[id];
        Object.entries(expansions?.[id] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive) {
              activePackages[expansionId] = defaultExpansions[id][expansionId];
            }
          },
        );
      }
    });

    return activePackages;
  }, [rulesets, expansions]);

  useUpdateDataswornTree(activeRulesPackages);
}

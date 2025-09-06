import { Datasworn } from "@datasworn/core";
import { useEffect, useState } from "react";

import { useUpdateDataswornTree } from "stores/dataswornTree.store";

import { allDefaultPackages, includedExpansions } from "data/package.config";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

export function useSyncActiveRulesPackages(
  rulesets: RulesetConfig,
  expansions: ExpansionConfig,
  playset: PlaysetConfig,
) {
  const [activeRulesPackages, setActiveRulesPackages] = useState<
    Record<string, Datasworn.RulesPackage>
  >({});

  useEffect(() => {
    const packagePromises: Promise<Datasworn.RulesPackage>[] = [];

    Object.entries(rulesets ?? {}).forEach(([id, isActive]) => {
      if (isActive) {
        packagePromises.push(allDefaultPackages[id].load());
        Object.entries(expansions?.[id] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive && includedExpansions[expansionId]) {
              packagePromises.push(allDefaultPackages[expansionId].load());
            }
          },
        );
      }
    });

    Promise.all(packagePromises).then((packages) => {
      const activePackages: Record<string, Datasworn.RulesPackage> = {};
      packages.forEach((pkg) => {
        activePackages[pkg._id] = pkg;
      });
      setActiveRulesPackages(activePackages);
    });
  }, [rulesets, expansions]);

  useUpdateDataswornTree(activeRulesPackages, playset);
}

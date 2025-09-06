import { Datasworn } from "@datasworn/core";
import { useEffect, useState } from "react";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

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

  const setTree = useDataswornTreeStore((store) => store.setActiveRules);
  const setTreeError = useDataswornTreeStore((store) => store.setRulesError);

  useEffect(() => {
    setTreeError(null);
    const packagePromises: Promise<Datasworn.RulesPackage>[] = [];

    Object.entries(rulesets ?? {}).forEach(([id, isActive]) => {
      if (isActive) {
        packagePromises.push(allDefaultPackages[id].load());
        Object.entries(expansions?.[id] ?? {}).forEach(
          ([expansionId, isExpansionActive]) => {
            if (isExpansionActive && includedExpansions[id]?.[expansionId]) {
              packagePromises.push(allDefaultPackages[expansionId].load());
            }
          },
        );
      }
    });

    Promise.all(packagePromises)
      .then((packages) => {
        const activePackages: Record<string, Datasworn.RulesPackage> = {};
        packages.forEach((pkg) => {
          activePackages[pkg._id] = pkg;
        });
        setActiveRulesPackages(activePackages);
        setTreeError(null);
      })
      .catch(() => {
        setTreeError("Failed to load rules packages");
      });
  }, [rulesets, expansions, setTreeError]);

  useEffect(() => {
    setTree(activeRulesPackages, playset);
  }, [activeRulesPackages, setTree, playset]);
}

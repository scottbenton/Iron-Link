import { Datasworn } from "@datasworn-community/core";
import { useEffect, useState } from "react";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

import { allDefaultPackages } from "data/package.config";

import { referenceTabMap } from "../data/referenceTabs";

export type ReferenceRulesStatus =
  | { state: "loading" }
  | { state: "loaded"; tabId: string }
  | { state: "error" };

// Loads a reference tab's packages into the shared rules store, filtered by
// the tab's playset. Nothing is read from the database.
export function useReferenceRules(tabId: string): ReferenceRulesStatus {
  const setActiveRules = useDataswornTreeStore((store) => store.setActiveRules);
  const [status, setStatus] = useState<ReferenceRulesStatus>({
    state: "loading",
  });

  useEffect(() => {
    const tab = referenceTabMap[tabId];
    if (!tab) {
      setStatus({ state: "error" });
      return;
    }

    let cancelled = false;
    setStatus({ state: "loading" });

    Promise.all(
      tab.packageIds.map((packageId) => allDefaultPackages[packageId].load()),
    )
      .then((packages) => {
        if (cancelled) return;
        const tree: Record<string, Datasworn.RulesPackage> = {};
        packages.forEach((rulesPackage) => {
          tree[rulesPackage._id] = rulesPackage;
        });
        setActiveRules(tree, tab.playset);
        setStatus({ state: "loaded", tabId });
      })
      .catch(() => {
        if (!cancelled) setStatus({ state: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [tabId, setActiveRules]);

  return status;
}

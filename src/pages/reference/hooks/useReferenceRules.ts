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
// the tab's playset. Nothing is read from the database. Changing the packages
// within a tab keeps the tab loaded while the new set comes in.
export function useReferenceRules(
  tabId: string,
  packageIds: string[],
): ReferenceRulesStatus {
  const setActiveRules = useDataswornTreeStore((store) => store.setActiveRules);
  const [status, setStatus] = useState<ReferenceRulesStatus>({
    state: "loading",
  });

  const packageKey = packageIds.join(",");

  useEffect(() => {
    const tab = referenceTabMap[tabId];
    if (!tab) {
      setStatus({ state: "error" });
      return;
    }

    let cancelled = false;
    setStatus((prev) =>
      prev.state === "loaded" && prev.tabId === tabId
        ? prev
        : { state: "loading" },
    );

    Promise.all(
      packageKey
        .split(",")
        .filter((packageId) => !!allDefaultPackages[packageId])
        .map((packageId) => allDefaultPackages[packageId].load()),
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
  }, [tabId, packageKey, setActiveRules]);

  return status;
}

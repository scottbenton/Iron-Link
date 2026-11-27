import { Datasworn } from "@datasworn-community/core";
import { useEffect, useState } from "react";

import { IExpansionConfig, IRulesetConfig } from "data/package.config";

export interface PlaysetPackages {
  loading: boolean;
  error: boolean;
  /** The loaded packages, by id. */
  data: Record<string, Datasworn.RulesPackage>;
}

/** Loads the chosen rulesets and expansions for the playset editor. */
export function usePlaysetPackages(
  rulesets: Record<string, IRulesetConfig>,
  expansions: Record<string, IExpansionConfig>,
): PlaysetPackages {
  const [packages, setPackages] = useState<PlaysetPackages>({
    loading: true,
    error: false,
    data: {},
  });

  useEffect(() => {
    let cancelled = false;
    setPackages((prev) => ({ ...prev, loading: true, error: false }));
    Promise.all([
      ...Object.values(rulesets).map((ruleset) => ruleset.load()),
      ...Object.values(expansions).map((expansion) => expansion.load()),
    ])
      .then((loaded) => {
        if (cancelled) return;
        const data: Record<string, Datasworn.RulesPackage> = {};
        loaded.forEach((pkg) => {
          data[pkg._id] = pkg;
        });
        setPackages({ loading: false, error: false, data });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setPackages({ loading: false, error: true, data: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [rulesets, expansions]);

  return packages;
}

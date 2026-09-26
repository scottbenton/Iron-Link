import { type ReactNode, useEffect, useMemo, useState } from "react";

import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";

import {
  type WorldOracleCatalog,
  loadWorldOracleCatalog,
} from "lib/worldOracleCatalog";

import { WorldTemplatesRepository } from "repositories/worldTemplates.repository";

import type { OracleBinding } from "services/worldFieldDefinitions.service";

import { WorldOracleContext } from "./worldOracleContext";

export function WorldOracleContextProvider({
  worldId,
  children,
}: {
  worldId: string;
  children: ReactNode;
}) {
  const world = useWorldStore((store) => store.world);
  const definitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  const [allPackages, setAllPackages] = useState(false);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    requestKey?: string;
    worldId: string;
    catalog: WorldOracleCatalog | null;
    loading: boolean;
    error?: string;
  }>({ worldId, catalog: null, loading: true });
  const bindings = useMemo(
    () =>
      Object.values(definitions)
        .filter((definition) => definition.worldId === worldId)
        .flatMap((definition) => [
          definition.binding,
          ...definition.configuration.rules.map((rule) => rule.binding),
        ])
        .filter((binding): binding is OracleBinding => !!binding),
    [definitions, worldId],
  );
  // Only package changes require reloading the catalog; label edits do not.
  const bindingKey = JSON.stringify(
    bindings
      .map((binding) => [
        binding.packageId,
        binding.oracleId,
        binding.resolvedOracleId,
        binding.exact,
      ])
      .sort(),
  );
  const settingKey = world?.id === worldId ? world.settingKey : undefined;
  const updatedAt =
    world?.id === worldId ? world.updatedAt.getTime() : undefined;

  const requestKey = JSON.stringify([
    worldId,
    settingKey,
    updatedAt,
    bindingKey,
    allPackages,
    revision,
  ]);

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    if (settingKey === undefined) return;
    let canceled = false;
    setResult((previous) => ({
      worldId,
      requestKey,
      catalog: previous.worldId === worldId ? previous.catalog : null,
      loading: true,
    }));
    const storedBindings: OracleBinding[] = (
      JSON.parse(bindingKey) as [string, string, string, boolean?][]
    ).map(([packageId, oracleId, resolvedOracleId, exact]) => ({
      packageId,
      oracleId,
      resolvedOracleId,
      exact,
    }));
    WorldTemplatesRepository.getLinkedGamePlaysets(worldId)
      .then((linkedGames) =>
        loadWorldOracleCatalog({
          linkedGames,
          settingKey,
          bindings: storedBindings,
          allPackages,
        }),
      )
      .then((catalog) => {
        if (!canceled)
          setResult({ worldId, requestKey, catalog, loading: false });
      })
      .catch((cause) => {
        if (!canceled)
          setResult({
            worldId,
            requestKey,
            catalog: null,
            loading: false,
            error:
              cause instanceof Error
                ? cause.message
                : "Could not load world oracles. Please retry.",
          });
      });
    return () => {
      canceled = true;
    };
  }, [
    worldId,
    settingKey,
    updatedAt,
    bindingKey,
    allPackages,
    revision,
    requestKey,
  ]);

  return (
    <WorldOracleContext.Provider
      value={{
        worldId,
        catalog: result.worldId === worldId ? result.catalog : null,
        loading: result.requestKey !== requestKey || result.loading,
        error: result.requestKey === requestKey ? result.error : undefined,
        allPackages,
        setAllPackages,
        retry: () => setRevision((value) => value + 1),
      }}
    >
      {children}
    </WorldOracleContext.Provider>
  );
}

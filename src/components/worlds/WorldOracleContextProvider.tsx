import type { ReactNode } from "react";

import { useWorldResourcesStore } from "stores/worldResources.store";

import { WorldOracleContext } from "./worldOracleContext";

export function WorldOracleContextProvider({
  worldId,
  children,
}: {
  worldId: string;
  children: ReactNode;
}) {
  const resources = useWorldResourcesStore();
  const matchesWorld = resources.worldId === worldId;
  return (
    <WorldOracleContext.Provider
      value={{
        worldId,
        catalog: matchesWorld ? resources.catalog : null,
        loading: !matchesWorld || resources.loading,
        error: matchesWorld ? resources.error : undefined,
        allPackages: matchesWorld && resources.allPackages,
        setAllPackages: (value) => resources.setAllPackages(worldId, value),
        retry: () => resources.refresh(worldId),
      }}
    >
      {children}
    </WorldOracleContext.Provider>
  );
}

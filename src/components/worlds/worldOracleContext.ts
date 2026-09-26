import { createContext, useContext } from "react";

import type { WorldOracleCatalog } from "lib/worldOracleCatalog";

export interface WorldOracleContextValue {
  worldId: string;
  catalog: WorldOracleCatalog | null;
  loading: boolean;
  error?: string;
  allPackages: boolean;
  setAllPackages: (value: boolean) => void;
  retry: () => void;
}

export const WorldOracleContext = createContext<WorldOracleContextValue | null>(
  null,
);
export function useWorldOracleContext(
  worldId: string,
): WorldOracleContextValue {
  const context = useContext(WorldOracleContext);
  if (!context || context.worldId !== worldId)
    throw new Error("A matching WorldOracleContextProvider is required.");
  return context;
}

import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getOracleRollable(
  oracleRollableId: string,
): Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable | undefined {
  const { oracleAliases, oracleRollableMap } =
    useDataswornTreeStore.getState().oracles;
  return (
    oracleRollableMap[oracleAliases[oracleRollableId] ?? oracleRollableId] ??
    oracleRollableMap[oracleRollableId]
  );
}

export function useOracleRollable(
  oracleRollableId: string | undefined,
): Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable | undefined {
  return useDataswornTreeStore((store) => {
    if (!oracleRollableId) return undefined;
    const resolvedOracleRollableId =
      store.oracles.oracleAliases[oracleRollableId] ?? oracleRollableId;
    return (
      store.oracles.oracleRollableMap[resolvedOracleRollableId] ??
      store.oracles.oracleRollableMap[oracleRollableId]
    );
  });
}

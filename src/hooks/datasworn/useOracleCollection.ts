import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getOracleCollection(
  oracleCollectionId: string,
): Datasworn.OracleCollection | undefined {
  const { oracleCollectionAliases, oracleCollectionMap } =
    useDataswornTreeStore.getState().oracles;
  return (
    oracleCollectionMap[
      oracleCollectionAliases[oracleCollectionId] ?? oracleCollectionId
    ] ?? oracleCollectionMap[oracleCollectionId]
  );
}

export function useOracleCollection(
  oracleCollectionId: string,
): Datasworn.OracleCollection | undefined {
  return useDataswornTreeStore((store) => {
    const resolvedOracleCollectionId =
      store.oracles.oracleCollectionAliases[oracleCollectionId] ??
      oracleCollectionId;
    return (
      store.oracles.oracleCollectionMap[resolvedOracleCollectionId] ??
      store.oracles.oracleCollectionMap[oracleCollectionId]
    );
  });
}

import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getOracleCollection(
  oracleCollectionId: string,
): Datasworn.OracleCollection | undefined {
  return useDataswornTreeStore.getState().oracles.oracleCollectionMap[
    oracleCollectionId
  ];
}

export function useOracleCollection(
  oracleCollectionId: string,
): Datasworn.OracleCollection | undefined {
  return useDataswornTreeStore(
    (store) => store.oracles.oracleCollectionMap[oracleCollectionId],
  );
}

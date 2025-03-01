import { useDataswornTreeStore } from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";

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

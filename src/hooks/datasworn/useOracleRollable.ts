import { Datasworn } from "@datasworn/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getOracleRollable(
  oracleRollableId: string,
): Datasworn.OracleRollable | undefined {
  return useDataswornTreeStore.getState().oracles.oracleRollableMap[
    oracleRollableId
  ];
}

export function useOracleRollable(
  oracleRollableId: string,
): Datasworn.OracleRollable | undefined {
  return useDataswornTreeStore(
    (store) => store.oracles.oracleRollableMap[oracleRollableId],
  );
}

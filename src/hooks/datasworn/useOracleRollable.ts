import { Datasworn } from "@datasworn/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getOracleRollable(
  oracleRollableId: string,
): Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable | undefined {
  return useDataswornTreeStore.getState().oracles.oracleRollableMap[
    oracleRollableId
  ];
}

export function useOracleRollable(
  oracleRollableId: string | undefined,
): Datasworn.OracleRollable | Datasworn.EmbeddedOracleRollable | undefined {
  return useDataswornTreeStore((store) =>
    oracleRollableId
      ? store.oracles.oracleRollableMap[oracleRollableId]
      : undefined,
  );
}

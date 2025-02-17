import { Datasworn } from "@datasworn/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return useDataswornTreeStore.getState().moves.moveMap[moveId];
}

export function useMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return useDataswornTreeStore((store) => store.moves.moveMap[moveId]);
}

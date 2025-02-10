import { Datasworn } from "@datasworn/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getMove(moveId: string): Datasworn.Move | undefined {
  return useDataswornTreeStore.getState().moves.moveMap[moveId];
}

export function useMove(moveId: string): Datasworn.Move | undefined {
  return useDataswornTreeStore((store) => store.moves.moveMap[moveId]);
}

import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  const { moveAliases, moveMap } = useDataswornTreeStore.getState().moves;
  return moveMap[moveAliases[moveId] ?? moveId] ?? moveMap[moveId];
}

export function useMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return useDataswornTreeStore((store) => {
    const resolvedMoveId = store.moves.moveAliases[moveId] ?? moveId;
    return store.moves.moveMap[resolvedMoveId] ?? store.moves.moveMap[moveId];
  });
}

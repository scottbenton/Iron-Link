import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

type MoveTree = ReturnType<typeof useDataswornTreeStore.getState>["moves"];

/** A move by id or by an alias of its id, from the given move tree. */
export function findMove(
  moves: Pick<MoveTree, "moveAliases" | "moveMap">,
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return (
    moves.moveMap[moves.moveAliases[moveId] ?? moveId] ?? moves.moveMap[moveId]
  );
}

export function getMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return findMove(useDataswornTreeStore.getState().moves, moveId);
}

export function useMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return useDataswornTreeStore((store) => findMove(store.moves, moveId));
}

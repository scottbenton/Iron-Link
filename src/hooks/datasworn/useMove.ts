import { useDataswornTreeStore } from "@/stores/dataswornTree.store";
import { Datasworn } from "@datasworn/core";

export function getMove(
  moveId: string,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return useDataswornTreeStore.getState().moves.moveMap[moveId];
}

export function useMove(
  moveId: string | undefined,
): Datasworn.Move | Datasworn.EmbeddedMove | undefined {
  return useDataswornTreeStore((store) =>
    moveId ? store.moves.moveMap[moveId] : undefined,
  );
}

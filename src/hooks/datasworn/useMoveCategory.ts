import { Datasworn } from "@datasworn-community/core";

import { useDataswornTreeStore } from "stores/dataswornTree.store";

export function getMoveCategory(
  moveCategoryId: string,
): Datasworn.MoveCategory | undefined {
  const { moveCategoryAliases, moveCategoryMap } =
    useDataswornTreeStore.getState().moves;
  return (
    moveCategoryMap[moveCategoryAliases[moveCategoryId] ?? moveCategoryId] ??
    moveCategoryMap[moveCategoryId]
  );
}

export function useMoveCategory(
  moveCategoryId: string,
): Datasworn.MoveCategory | undefined {
  return useDataswornTreeStore((store) => {
    const resolvedMoveCategoryId =
      store.moves.moveCategoryAliases[moveCategoryId] ?? moveCategoryId;
    return (
      store.moves.moveCategoryMap[resolvedMoveCategoryId] ??
      store.moves.moveCategoryMap[moveCategoryId]
    );
  });
}

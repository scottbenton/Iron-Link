import { useAppState } from "stores/appState.store";

/** Removes one recent roll by its card id; nothing if it is already gone. */
export function clearRecentRoll(cardId: string) {
  const state = useAppState.getState();
  const index = state.visibleRolls.findIndex(({ roll }) => roll.id === cardId);
  if (index >= 0) state.clearRoll(index);
}

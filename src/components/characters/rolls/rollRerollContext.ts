import { createContext, useContext } from "react";

import { IGameLogRoll } from "services/gameLog.service";

/**
 * Opens the reroll dialog for a recent roll. The dialog lives with the
 * recent rolls host, not with a card, so it outlives the card's host going
 * quiet while the dialog itself is open.
 */
export const RollRerollContext = createContext<
  ((rollId: string, roll: IGameLogRoll) => void) | null
>(null);

export function useOpenRollReroll() {
  return useContext(RollRerollContext);
}

import { createContext, useContext } from "react";

// Bonds belong to characters, so the world shows them only when it is open
// inside a game (a game's Notes tab), with that game's characters and rules.
// The standalone world page provides nothing and shows a note instead.
export interface WorldBondsGame {
  gameId: string;
}

export const WorldBondsGameContext = createContext<WorldBondsGame | null>(null);

export function useWorldBondsGame(): WorldBondsGame | null {
  return useContext(WorldBondsGameContext);
}

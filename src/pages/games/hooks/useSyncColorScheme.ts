import { useEffect } from "react";

import { useSetColorScheme } from "stores/appState.store";
import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";

/**
 * Puts the game page on the character's theme, else the game's. Without
 * either it uses the person's app theme (`useEffectiveColorScheme`).
 */
export function useSyncColorScheme() {
  const characterTheme = useGameCharacter(
    (character) => character?.colorScheme,
  );
  const gameTheme = useGameStore((store) => store.game?.colorScheme);

  const setColorScheme = useSetColorScheme();

  useEffect(() => {
    setColorScheme(characterTheme ?? gameTheme ?? null);
    return () => {
      setColorScheme(null);
    };
  }, [characterTheme, gameTheme, setColorScheme]);
}

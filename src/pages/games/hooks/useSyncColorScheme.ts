import { useEffect } from "react";

import {
  getDefaultColorScheme,
  useSetColorScheme,
} from "stores/appState.store";
import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";

export function useSyncColorScheme() {
  const characterTheme = useGameCharacter(
    (character) => character?.colorScheme,
  );
  const gameTheme = useGameStore((store) => store.game?.colorScheme);

  const setColorScheme = useSetColorScheme();

  useEffect(() => {
    const defaultColorScheme = getDefaultColorScheme();
    setColorScheme(characterTheme ?? gameTheme ?? defaultColorScheme);
    return () => {
      setColorScheme(defaultColorScheme);
    };
  }, [characterTheme, gameTheme, setColorScheme]);
}

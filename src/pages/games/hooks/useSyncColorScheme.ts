import { useEffect } from "react";

import { useSetColorScheme } from "stores/appState.store";
import { useGameStore } from "stores/game.store";
import { useGameCharacter } from "stores/gameCharacters.store";

import { ColorScheme } from "repositories/shared.types";

export function useSyncColorScheme() {
  const characterTheme = useGameCharacter(
    (character) => character?.colorScheme,
  );
  const gameTheme = useGameStore((store) => store.game?.colorScheme);

  const setColorScheme = useSetColorScheme();

  useEffect(() => {
    setColorScheme(characterTheme ?? gameTheme ?? ColorScheme.Default);
    return () => {
      setColorScheme(ColorScheme.Default);
    };
  }, [characterTheme, gameTheme, setColorScheme]);
}

import { ColorScheme } from "@/repositories/shared.types";
import { useSetColorScheme } from "@/stores/appState.store";
import { useGameStore } from "@/stores/game.store";
import { useGameCharacter } from "@/stores/gameCharacters.store";
import { useEffect } from "react";

export function useSyncColorScheme() {
  const characterTheme = useGameCharacter((character) => {
    return character?.colorScheme;
  });
  const gameTheme = useGameStore((store) => store.game?.colorScheme);

  const setColorScheme = useSetColorScheme();

  useEffect(() => {
    setColorScheme(characterTheme ?? gameTheme ?? ColorScheme.Default);
    return () => {
      setColorScheme(ColorScheme.Default);
    };
  }, [characterTheme, gameTheme, setColorScheme]);
}

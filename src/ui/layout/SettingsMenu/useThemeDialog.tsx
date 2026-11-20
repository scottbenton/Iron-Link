import { useState } from "react";

import { ThemeChoice, ThemeDialog, ThemeTarget } from "../../game/ThemeDialog";
import { SettingsScenario } from "./settingsMenuScenarios";

/** Which row the Theme dialog opens on: the narrowest level in view. */
function getInitialThemeRow(scenario: SettingsScenario): ThemeTarget {
  if (scenario.currentCharacterId) {
    return { kind: "character", id: scenario.currentCharacterId };
  }
  return scenario.themeGame ? { kind: "game" } : { kind: "app" };
}

export function useThemeDialog(scenario: SettingsScenario) {
  const [open, setOpen] = useState(false);
  const [characters, setCharacters] = useState(scenario.themeCharacters);
  const [game, setGame] = useState(scenario.themeGame);
  const [appTheme, setAppTheme] = useState<ThemeChoice>(null);
  const dialog = (
    <ThemeDialog
      open={open}
      onClose={() => setOpen(false)}
      characters={characters}
      currentCharacterId={scenario.currentCharacterId}
      game={game}
      appTheme={appTheme}
      initialOpen={getInitialThemeRow(scenario)}
      date={new Date(2026, 10, 18)}
      onSave={(changes) => {
        for (const { target, theme } of changes) {
          if (target.kind === "character") {
            setCharacters((previous) =>
              previous.map((character) =>
                character.id === target.id
                  ? { ...character, theme }
                  : character,
              ),
            );
          } else if (target.kind === "game") {
            setGame((previous) => previous && { ...previous, theme });
          } else {
            setAppTheme(theme);
          }
        }
      }}
    />
  );
  return { openTheme: () => setOpen(true), dialog };
}

/**
 * The settings menus wired up for stories: the Dark Mode toggle keeps its
 * state, Change Theme opens the Theme dialog with the scenario's characters
 * and game, and Delete asks first. Story-only: the SettingsMenu stories and
 * the Examples pages use it; nothing in the app imports it.
 */
import { ReactElement, useState } from "react";

import { ThemeChoice, ThemeDialog, ThemeTarget } from "../../game/ThemeDialog";
import { sampleCharacters } from "../../stories/fixtures/characters";
import {
  CharacterSettingsMenu,
  SettingsMenu,
  SettingsMenuColorMode,
  SettingsMenuProps,
} from "./SettingsMenu";
import { SettingsScenario, guideScenario } from "./settingsMenuScenarios";
import { SettingsMenuAction, SettingsMenuGame } from "./settingsMenuSections";

const [kira] = sampleCharacters;

/** Which row the Theme dialog opens on: the narrowest level in view. */
function getInitialThemeRow(scenario: SettingsScenario): ThemeTarget {
  if (scenario.currentCharacterId) {
    return { kind: "character", id: scenario.currentCharacterId };
  }
  return scenario.themeGame ? { kind: "game" } : { kind: "app" };
}

function useThemeDialog(scenario: SettingsScenario) {
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

export interface DemoSettingsMenuProps
  extends Pick<
    SettingsMenuProps,
    "side" | "align" | "tooltipSide" | "trigger" | "strings"
  > {
  scenario: SettingsScenario;
  /** Other items (Theme opens its dialog here), such as Second Screen. */
  onSelect?: (action: SettingsMenuAction) => void;
  /** Called after a confirmed delete, to show it in the story. */
  onDeleted?: (what: "character" | "game") => void;
}

/** The combined menu over a scenario, as the rail and phone pages use it. */
export function DemoSettingsMenu(props: DemoSettingsMenuProps) {
  const { scenario, onSelect, onDeleted, ...rest } = props;
  const [colorMode, setColorMode] = useState<SettingsMenuColorMode>("light");
  const theme = useThemeDialog(scenario);
  return (
    <>
      <SettingsMenu
        {...rest}
        character={scenario.character}
        game={scenario.game}
        isAdmin={scenario.isAdmin}
        signedIn={scenario.signedIn}
        colorMode={colorMode}
        onColorModeChange={setColorMode}
        onSelect={(action) => {
          if (action === "theme") theme.openTheme();
          onSelect?.(action);
        }}
        onDeleteCharacter={() => onDeleted?.("character")}
        onDeleteGame={() => onDeleted?.("game")}
      />
      {theme.dialog}
    </>
  );
}

export interface DemoCharacterSettingsMenuProps {
  scenario?: SettingsScenario;
  trigger?: ReactElement;
  onSelect?: (action: SettingsMenuAction) => void;
  onDeleted?: () => void;
}

/** The character column's shortcut menu over a scenario (Kira by default). */
export function DemoCharacterSettingsMenu(
  props: DemoCharacterSettingsMenuProps,
) {
  const { scenario = guideScenario, trigger, onSelect, onDeleted } = props;
  const theme = useThemeDialog(scenario);
  const character = scenario.character ?? { name: kira.name, isOwner: true };
  const game: SettingsMenuGame | undefined = scenario.game;
  return (
    <>
      <CharacterSettingsMenu
        character={character}
        game={game}
        trigger={trigger}
        onSelect={(action) => {
          if (action === "theme") theme.openTheme();
          onSelect?.(action);
        }}
        onDeleteCharacter={onDeleted}
      />
      {theme.dialog}
    </>
  );
}

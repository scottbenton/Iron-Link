/**
 * The settings menus wired up for stories: the mode toggle and Dark Mode
 * switch the story's colour mode, Change Theme opens the Theme dialog with
 * the scenario's characters and game, and Delete asks first. Story-only:
 * the SettingsMenu stories and the Examples pages use it; nothing in the app
 * imports it.
 */
import { ReactElement } from "react";

import { sampleCharacters } from "../../docs/fixtures/characters";
import { CharacterSettingsMenu } from "./CharacterSettingsMenu";
import { SettingsScenario, guideScenario } from "./settingsMenuScenarios";
import { SettingsMenuAction, SettingsMenuGame } from "./settingsMenuSections";
import { useThemeDialog } from "./useThemeDialog";

const [kira] = sampleCharacters;

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

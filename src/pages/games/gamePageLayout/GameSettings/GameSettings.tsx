import { useContributeAppSettings } from "components/Layout/AppSettingsMenu/useContributeAppSettings";

import { CharacterMenuDialogs } from "../../characterSheet/components/CharacterSettingsMenu/CharacterMenuDialogs";
import { GameSettingsMenuDialogs } from "../../overviewSheet/gameSettings/GameSettingsMenuDialogs";
import { GameThemeDialog } from "./GameThemeDialog";
import { useGameSettingsContribution } from "./useGameSettingsContribution";

/**
 * Adds the game's and the open character's settings to the app's settings
 * menu, and mounts the dialogs they open, once for the whole game page.
 */
export function GameSettings() {
  useContributeAppSettings(useGameSettingsContribution());

  return (
    <>
      <GameSettingsMenuDialogs />
      <CharacterMenuDialogs />
      <GameThemeDialog />
    </>
  );
}

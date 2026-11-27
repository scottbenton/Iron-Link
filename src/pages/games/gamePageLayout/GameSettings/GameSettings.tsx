import { useContributeAppSettings } from "components/Layout/AppSettingsMenu/useContributeAppSettings";

import { useMenuState } from "stores/menuState";

import { CharacterMenuDialogs } from "../../characterSheet/components/CharacterSettingsMenu/CharacterMenuDialogs";
import { SecondScreenDialog } from "../../characterSheet/components/SecondScreenSection";
import { GameSettingsMenuDialogs } from "../../overviewSheet/gameSettings/GameSettingsMenuDialogs";
import { useGameSettingsContribution } from "./useGameSettingsContribution";

/**
 * Adds the game's and the open character's settings to the app's settings
 * menu, and mounts the dialogs they open, once for the whole game page.
 */
export function GameSettings() {
  useContributeAppSettings(useGameSettingsContribution());
  const secondScreenOpen = useMenuState(
    (state) => state.isSecondScreenDialogOpen,
  );
  const setSecondScreenOpen = useMenuState(
    (state) => state.setIsSecondScreenDialogOpen,
  );

  return (
    <>
      <GameSettingsMenuDialogs />
      <CharacterMenuDialogs />
      <SecondScreenDialog
        open={secondScreenOpen}
        onClose={() => setSecondScreenOpen(false)}
      />
    </>
  );
}

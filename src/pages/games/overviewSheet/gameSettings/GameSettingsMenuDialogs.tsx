import { useMenuState } from "stores/menuState";

import { GameColorSchemeDialog } from "./GameColorSchemeDialog";
import { GameNameDialog } from "./GameNameDialog";
import { GameRulesetChooserDialog } from "./GameRulesetChooserDialog";
import { NotificationSettingsDialog } from "./NotificationSettingsDialog";

export function GameSettingsMenuDialogs() {
  const menuState = useMenuState();

  return (
    <>
      <GameColorSchemeDialog
        open={menuState.isGameThemeDialogOpen}
        onClose={() => menuState.setIsGameThemeDialogOpen(false)}
      />
      <GameNameDialog
        open={menuState.isGameNameDialogOpen}
        onClose={() => menuState.setIsGameNameDialogOpen(false)}
      />
      <GameRulesetChooserDialog
        open={menuState.isRulesetDialogOpen}
        onClose={() => menuState.setIsRulesetDialogOpen(false)}
      />
      <NotificationSettingsDialog
        open={menuState.isNotificationSettingsDialogOpen}
        onClose={() => menuState.setIsNotificationSettingsDialogOpen(false)}
      />
    </>
  );
}

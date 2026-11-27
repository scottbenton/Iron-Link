import { useMenuState } from "stores/menuState";

import { GameNameDialog } from "./GameNameDialog";
import { GameRulesetChooserDialog } from "./GameRulesetChooserDialog";

export function GameSettingsMenuDialogs() {
  const menuState = useMenuState();

  return (
    <>
      <GameNameDialog
        open={menuState.isGameNameDialogOpen}
        onClose={() => menuState.setIsGameNameDialogOpen(false)}
      />
      <GameRulesetChooserDialog
        open={menuState.isRulesetDialogOpen}
        onClose={() => menuState.setIsRulesetDialogOpen(false)}
      />
    </>
  );
}

import { useMenuState } from "@/stores/menuState";

import { GameColorSchemeDialog } from "./dialogs/GameColorSchemeDialog";
import { GameNameDialog } from "./dialogs/GameNameDialog";
import { GameRulesetChooserDialog } from "./dialogs/GameRulesetChooserDialog";

export function GameSettingsMenuDialogs() {
  const state = useMenuState();
  return (
    <>
      <GameNameDialog
        open={state.isGameNameDialogOpen}
        onClose={() => state.setIsGameNameDialogOpen(false)}
      />
      <GameColorSchemeDialog
        open={state.isGameThemeDialogOpen}
        onClose={() => state.setIsGameThemeDialogOpen(false)}
      />
      <GameRulesetChooserDialog
        open={state.isRulesetDialogOpen}
        onClose={() => state.setIsRulesetDialogOpen(false)}
      />
    </>
  );
}

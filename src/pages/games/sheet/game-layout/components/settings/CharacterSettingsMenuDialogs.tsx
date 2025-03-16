import { useMenuState } from "@/stores/menuState";

import { CharacterColorSchemeDialog } from "./dialogs/CharacterColorSchemeDialog";
import { CharacterDetailsDialog } from "./dialogs/CharacterDetailsDialog";
import { CharacterStatsDialog } from "./dialogs/CharacterStatsDialog";

export function CharacterSettingsMenuDialogs() {
  const state = useMenuState();

  return (
    <>
      <CharacterDetailsDialog
        open={state.isCharacterDetailsDialogOpen}
        onClose={() => state.setIsCharacterDetailsDialogOpen(false)}
      />
      <CharacterStatsDialog
        open={state.isCharacterStatsDialogOpen}
        onClose={() => state.setIsCharacterStatsDialogOpen(false)}
      />
      <CharacterColorSchemeDialog
        open={state.isColorSchemeDialogOpen}
        onClose={() => state.setIsColorSchemeDialogOpen(false)}
      />
    </>
  );
}

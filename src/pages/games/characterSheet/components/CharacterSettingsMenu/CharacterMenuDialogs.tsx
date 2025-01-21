import { useMenuState } from "stores/menuState";

import { CharacterDetailsDialog } from "./CharacterDetailsDialog";
import { CharacterStatsDialog } from "./CharacterStatsDialog";
import { ColorSchemeDialog } from "./ColorSchemeDialog";

export function CharacterMenuDialogs() {
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
      <ColorSchemeDialog
        open={state.isColorSchemeDialogOpen}
        onClose={() => state.setIsColorSchemeDialogOpen(false)}
      />
    </>
  );
}

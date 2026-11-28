import { useMenuState } from "stores/menuState";

import { CharacterDetailsDialog } from "./CharacterDetailsDialog";
import { CharacterEditAccessDialog } from "./CharacterEditAccessDialog";
import { CharacterStatsDialog } from "./CharacterStatsDialog";

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
      <CharacterEditAccessDialog
        open={state.isCharacterEditAccessDialogOpen}
        onClose={() => state.setIsCharacterEditAccessDialogOpen(false)}
      />
    </>
  );
}

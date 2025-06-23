import { WorldSelectionPage } from "components/worlds/SelectAWorld";
import { WorldPage } from "components/worlds/WorldPage";

import { useGameStore } from "stores/game.store";

export function WorldNoteView() {
  const loading = useGameStore((store) => store.loading);
  const worldId = useGameStore((store) => store.game?.worldId);

  if (loading) {
    return null;
  }

  if (worldId) {
    return <WorldPage />;
  }

  return <WorldSelectionPage />;
}

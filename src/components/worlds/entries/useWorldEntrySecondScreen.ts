import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { useSecondScreenFeature } from "hooks/advancedFeatures/useSecondScreenFeature";

import { useSecondScreenStore } from "stores/secondScreen.store";

import { ReadPermissions } from "repositories/shared.types";

import type { IWorldEntry } from "services/worldEntries.service";

// Puts an entry on the game's second screen, or takes it off again. Only in
// a game with the second screen turned on, and never for an entry only
// Guides can see: the second screen is for the whole table.
export function useWorldEntrySecondScreen(
  entry: Pick<IWorldEntry, "id" | "worldId" | "readPermissions">,
) {
  const gameId = useGameIdOptional();
  const featureActive = useSecondScreenFeature();
  const shown = useSecondScreenStore(
    (store) =>
      store.settings?.type === "world_entry" &&
      store.settings.entryId === entry.id,
  );
  const updateSettings = useSecondScreenStore(
    (store) => store.updateSecondScreenSettings,
  );
  const available =
    !!gameId &&
    featureActive &&
    entry.readPermissions !== ReadPermissions.OnlyGuides;

  const toggle = () => {
    if (!gameId) return Promise.resolve();
    return updateSettings(
      gameId,
      shown
        ? null
        : { type: "world_entry", worldId: entry.worldId, entryId: entry.id },
    );
  };

  return { available, shown, toggle };
}

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useGameStore } from "stores/game.store";

import { useAdvancedFeatureToggle } from "./advancedFeatures";

export const worldsBetaBannerLocalStorageKey =
  "iron-link-worlds-beta-banner-dismissed";

// Games whose "turn on the Worlds beta" banner this device has dismissed.
// Per device, like the toggle itself.
export const useWorldsBetaBannerDismissals = create<{
  dismissedGameIds: string[];
  dismiss: (gameId: string) => void;
}>()(
  persist(
    (set) => ({
      dismissedGameIds: [],
      dismiss: (gameId) =>
        set((state) =>
          state.dismissedGameIds.includes(gameId)
            ? state
            : { dismissedGameIds: [...state.dismissedGameIds, gameId] },
        ),
    }),
    {
      name: worldsBetaBannerLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Whether to invite the viewer to turn on the Worlds beta: the game has a
// world they cannot see because the toggle is off, and they have not
// dismissed the banner for this game.
export function useShowWorldsBetaBanner(gameId: string | undefined): boolean {
  const worldsEnabled = useAdvancedFeatureToggle("worlds");
  const gameHasWorld = useGameStore((store) => !!store.game?.worldId);
  const dismissed = useWorldsBetaBannerDismissals(
    (state) => !!gameId && state.dismissedGameIds.includes(gameId),
  );

  return !!gameId && gameHasWorld && !worldsEnabled && !dismissed;
}

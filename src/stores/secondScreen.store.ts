import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";
import { useSecondScreenFeature } from "@/hooks/advancedFeatures/useSecondScreenFeature";
import {
  ISecondScreenDisplay,
  SecondScreenService,
} from "@/services/secondScreen.service";
import { useGameId } from "@/hooks/useGameId";

interface SecondScreenStoreState {
  settings: ISecondScreenDisplay;
  areAllCharactersVisible: boolean;
  loading: boolean;
}

interface SecondScreenStoreActions {
  listenToSecondScreenSettings: (gameId: string) => () => void;
  updateSecondScreenSettings: (
    gameId: string,
    settings: ISecondScreenDisplay,
  ) => Promise<void>;
  setAreAllCharactersVisible: (gameId: string, value: boolean) => Promise<void>;
}

export const useSecondScreenStore = createWithEqualityFn<
  SecondScreenStoreState & SecondScreenStoreActions
>()(
  immer((set) => ({
    settings: null,
    areAllCharactersVisible: false,
    loading: true,
    listenToSecondScreenSettings: (gameId: string) => {
      const unsubscribe = SecondScreenService.listenToSecondScreenSettings(
        gameId,
        (settings, areAllCharactersVisible) => {
          set((state) => {
            state.loading = false;
            state.settings = settings;
            state.areAllCharactersVisible = areAllCharactersVisible;
          });
        },
        () => {
          set((state) => {
            state.settings = null;
            state.loading = false;
          });
        },
      );
      return () => {
        set((state) => {
          state.loading = true;
          state.settings = null;
          state.areAllCharactersVisible = false;
          unsubscribe();
        });
      };
    },
    updateSecondScreenSettings: async (gameId, settings) => {
      await SecondScreenService.updateSecondScreenSettings(gameId, settings);
    },
    setAreAllCharactersVisible: async (gameId, value) => {
      await SecondScreenService.updateAreAllCharactersVisible(gameId, value);
    },
  })),
  deepEqual,
);

export function useSyncSecondScreenSettingsIfActive() {
  const gameId = useGameId();
  const active = useSecondScreenFeature();
  const listenToSecondScreenSettings = useSecondScreenStore(
    (state) => state.listenToSecondScreenSettings,
  );
  useEffect(() => {
    if (active) {
      return listenToSecondScreenSettings(gameId);
    }
  }, [active, gameId, listenToSecondScreenSettings]);
}

export function useSyncSecondScreenSettings() {
  const subscribe = useSecondScreenStore(
    (state) => state.listenToSecondScreenSettings,
  );
  const gameId = useGameId();
  useEffect(() => {
    return subscribe(gameId);
  }, [subscribe, gameId]);
}

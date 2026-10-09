import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  type WorldOracleCatalog,
  getBindingPackageIds,
  loadWorldOracleCatalog,
} from "lib/worldOracleCatalog";

import type { OracleBinding } from "services/worldFieldDefinitions.service";
import { WorldPlaysetsService } from "services/worldPlaysets.service";

import { useWorldStore } from "./world.store";
import { useWorldCategoriesStore } from "./worldCategories.store";

interface WorldOraclesStoreState {
  worldId: string;
  // Every oracle the world's field bindings may target, merged across the
  // world's effective playset (and all packages, when asked for).
  catalog: WorldOracleCatalog | null;
  allPackages: boolean;
  // Bumped by retry so the loading hook runs again with the same inputs.
  attempt: number;
  loading: boolean;
  error?: string;
}

interface WorldOraclesStoreActions {
  loadWorldOracles: (
    worldId: string,
    settingKey: string | null,
    bindingPackageIds: string[],
    allPackages: boolean,
  ) => () => void;
  setAllPackages: (allPackages: boolean) => void;
  retry: () => void;
  reset: () => void;
}

const defaultWorldOraclesState: WorldOraclesStoreState = {
  worldId: "",
  catalog: null,
  allPackages: false,
  attempt: 0,
  loading: true,
  error: undefined,
};

export const useWorldOraclesStore = createWithEqualityFn<
  WorldOraclesStoreState & WorldOraclesStoreActions
>()(
  immer((set) => ({
    ...defaultWorldOraclesState,

    loadWorldOracles: (worldId, settingKey, bindingPackageIds, allPackages) => {
      let active = true;
      set((state) => {
        if (state.worldId !== worldId) {
          state.catalog = null;
        }
        state.worldId = worldId;
        state.loading = true;
        state.error = undefined;
      });

      WorldPlaysetsService.getLinkedGamePlaysets(worldId)
        .then((linkedGames) =>
          loadWorldOracleCatalog({
            settingKey,
            linkedGames,
            bindingPackageIds,
            allPackages,
          }),
        )
        .then((catalog) => {
          if (!active) return;
          set((state) => {
            state.catalog = catalog;
            state.loading = false;
          });
          useWorldCategoriesStore
            .getState()
            .applyReplacementMap(worldId, catalog.replacementMap);
        })
        .catch((error) => {
          if (!active) return;
          console.error(error);
          set((state) => {
            state.loading = false;
            state.error =
              "Could not load this world's oracles. Please try again.";
          });
        });

      return () => {
        active = false;
      };
    },

    setAllPackages: (allPackages) => {
      set((state) => {
        state.allPackages = allPackages;
      });
    },
    retry: () => {
      set((state) => {
        state.attempt++;
      });
    },
    reset: () => {
      set((state) => ({ ...state, ...defaultWorldOraclesState }));
    },
  })),
  deepEqual,
);

// Loads the oracles that bindings in this world can target. Mount it where
// the world's configuration is shown or edited; it needs the world and its
// configuration subscriptions to be running.
export function useListenToWorldOracles(worldId: string | undefined) {
  const loadWorldOracles = useWorldOraclesStore(
    (store) => store.loadWorldOracles,
  );
  const resetStore = useWorldOraclesStore((store) => store.reset);
  const allPackages = useWorldOraclesStore((store) => store.allPackages);
  const attempt = useWorldOraclesStore((store) => store.attempt);

  const settingKey = useWorldStore((store) =>
    store.world?.id === worldId ? store.world?.settingKey : undefined,
  );
  // The database bumps the world row whenever a linked game's playset changes
  // or a game is linked or unlinked, so its version marks a stale playset.
  const worldVersion = useWorldStore((store) =>
    store.world?.id === worldId ? store.world?.updatedAt.getTime() : undefined,
  );
  // Bound packages stay loaded even when the playset no longer includes them,
  // so stored bindings can still be shown and repaired.
  const bindingPackageIds = useWorldCategoriesStore((store) =>
    store.worldId === worldId && !store.loading
      ? getBindingPackageIds(
          Object.values(store.storedFieldDefinitions).flatMap((field) =>
            [
              field.binding,
              ...field.configuration.rules.map((rule) => rule.binding),
            ].filter((binding): binding is OracleBinding => !!binding),
          ),
        ).sort()
      : undefined,
  );

  useEffect(() => {
    if (worldId && settingKey !== undefined && bindingPackageIds) {
      return loadWorldOracles(
        worldId,
        settingKey,
        bindingPackageIds,
        allPackages,
      );
    }
  }, [
    worldId,
    settingKey,
    worldVersion,
    bindingPackageIds,
    allPackages,
    attempt,
    loadWorldOracles,
  ]);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [worldId, resetStore]);
}

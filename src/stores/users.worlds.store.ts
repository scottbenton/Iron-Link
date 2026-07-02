import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { IWorld, WorldsService } from "services/worlds.service";

import { useUID } from "./auth.store";

interface UsersWorldsState {
  worlds: Record<string, IWorld>;
  loading: boolean;
  error?: Error;
}

interface UsersWorldsActions {
  loadUsersWorlds: () => Promise<void>;
}

const defaultValues: UsersWorldsState = {
  worlds: {},
  loading: true,
};

export const useUsersWorlds = createWithEqualityFn<
  UsersWorldsState & UsersWorldsActions
>()(
  immer((set) => ({
    ...defaultValues,

    loadUsersWorlds: async () => {
      try {
        const worlds = await WorldsService.getUsersWorlds();
        set((state) => {
          state.loading = false;
          state.worlds = worlds;
          state.error = undefined;
        });
      } catch (e) {
        console.error(e);
        set((state) => {
          state.loading = false;
          state.error =
            e instanceof Error ? e : new Error("Failed to load worlds");
        });
      }
    },
  })),
  deepEqual,
);

export function useLoadUsersWorlds() {
  const loadUsersWorlds = useUsersWorlds((state) => state.loadUsersWorlds);
  const uid = useUID();
  useEffect(() => {
    if (uid) {
      loadUsersWorlds();
    }
  }, [uid, loadUsersWorlds]);
}

import deepEqual from "fast-deep-equal";
import { useEffect, useState } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  ExpansionConfig,
  PlaysetConfig,
  RulesetConfig,
} from "repositories/game.repository";

import { IWorld, WorldsService } from "services/worlds.service";

import { useUID } from "./auth.store";

interface UsersWorldsStoreState {
  worlds: IWorld[];
  loading: boolean;
  error: string | null;
}

interface UsersWorldsStoreActions {
  createWorld: (
    uid: string,
    name: string,
    rulesets: RulesetConfig,
    expansions: ExpansionConfig,
    playset: PlaysetConfig,
    settingsPackageId: string | null,
  ) => Promise<string>;
  getUsersWorlds: (uid: string) => void;
  getUsersWorldsFilteredByRole: (
    uid: string,
    role?: "guide" | "player" | "owner",
  ) => Promise<IWorld[]>;
}

export const useUsersWorlds = createWithEqualityFn<
  UsersWorldsStoreState & UsersWorldsStoreActions
>()(
  immer((set) => ({
    worlds: [],
    loading: false,
    error: null,
    getUsersWorlds: (uid) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      WorldsService.getUsersWorlds(uid)
        .then((worlds) => {
          set((state) => {
            state.worlds = worlds;
            state.loading = false;
          });
        })
        .catch((error) => {
          set((state) => {
            state.error = error.message || "Failed to load worlds.";
            state.loading = false;
          });
        });
    },
    createWorld: async (
      uid: string,
      name: string,
      rulesets: RulesetConfig,
      expansions: ExpansionConfig,
      playset: PlaysetConfig,
      settingsPackageId,
    ): Promise<string> => {
      return WorldsService.createWorld(
        uid,
        name,
        rulesets,
        expansions,
        playset,
        settingsPackageId,
      );
    },
    getUsersWorldsFilteredByRole: async (uid, role) => {
      return WorldsService.getUsersWorlds(uid, role);
    },
  })),
  deepEqual,
);

export function useLoadUsersWorlds() {
  const uid = useUID();

  const getUsersWorlds = useUsersWorlds((store) => store.getUsersWorlds);

  useEffect(() => {
    if (!uid) return;
    getUsersWorlds(uid);
  }, [uid, getUsersWorlds]);
}

export function useUsersWorldsFilteredByRole(
  role: "guide" | "player" | "owner",
): {
  worlds: IWorld[];
  loading: boolean;
  error: string | null;
} {
  const [state, setState] = useState<{
    worlds: IWorld[];
    loading: boolean;
    error: string | null;
  }>({
    worlds: [],
    loading: true,
    error: null,
  });

  const uid = useUID();
  const getUsersWorldsFilteredByRole = useUsersWorlds(
    (store) => store.getUsersWorldsFilteredByRole,
  );

  useEffect(() => {
    if (!uid) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    getUsersWorldsFilteredByRole(uid, role)
      .then((worlds) => {
        setState({ worlds: worlds, loading: false, error: null });
      })
      .catch((error) => {
        setState({
          worlds: [],
          loading: false,
          error: error.message || "Failed to load worlds.",
        });
      });
  }, [uid, role, getUsersWorldsFilteredByRole]);

  return state;
}

import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { WorldPermission } from "repositories/shared.types";

import {
  IWorldPlayer,
  WorldPlayerRole,
  WorldPlayersService,
} from "services/worldPlayers.service";
import { IWorld, WorldsService } from "services/worlds.service";

import { useUID } from "./auth.store";

interface WorldStoreState {
  worldId: string;
  world: IWorld | null;
  worldPlayers: Record<string, IWorldPlayer> | null;

  // Mirrors world_role(): explicit membership roles take precedence over
  // roles derived from linked games; fetched from the database so the
  // client never re-implements the derivation.
  worldPermission: WorldPermission | null;

  loading: boolean;
  error?: string;
  worldDeleted: boolean;
}

interface WorldStoreActions {
  listenToWorld: (worldId: string) => () => void;
  loadWorldPermission: (worldId: string, uid: string | undefined) => void;

  createWorld: (
    name: string,
    description?: string,
    settingKey?: string,
  ) => Promise<string>;
  updateWorldName: (worldId: string, name: string) => Promise<void>;
  updateWorldDescription: (
    worldId: string,
    description: string | null,
  ) => Promise<void>;
  deleteWorld: (worldId: string) => Promise<void>;

  addWorldPlayer: (
    worldId: string,
    userId: string,
    role: WorldPlayerRole,
  ) => Promise<void>;
  updateWorldPlayerRole: (
    worldId: string,
    userId: string,
    role: WorldPlayerRole,
  ) => Promise<void>;
  removeWorldPlayer: (worldId: string, userId: string) => Promise<void>;
}

const defaultWorldStoreState: WorldStoreState = {
  worldId: "",
  world: null,
  worldPlayers: null,
  worldPermission: null,
  loading: true,
  worldDeleted: false,
};

export const useWorldStore = createWithEqualityFn<
  WorldStoreState & WorldStoreActions
>()(
  immer((set) => ({
    ...defaultWorldStoreState,

    listenToWorld: (worldId: string) => {
      set((state) => {
        state.worldId = worldId;
      });

      const worldUnsubscribe = WorldsService.listenToWorld(
        worldId,
        (world) => {
          set((state) => {
            state.world = world;
            state.loading = false;
            state.error = undefined;
          });
        },
        () => {
          set((state) => {
            state.worldDeleted = true;
            state.loading = false;
          });
        },
        (error) => {
          console.error(error);
          set((state) => {
            state.loading = false;
            state.error = "Failed to load world";
          });
        },
      );

      const worldPlayersUnsubscribe = WorldPlayersService.listenToWorldPlayers(
        worldId,
        (changedPlayers, removedPlayerIds, replaceState) => {
          set((state) => {
            if (replaceState) {
              state.worldPlayers = changedPlayers;
            } else {
              state.worldPlayers = {
                ...state.worldPlayers,
                ...changedPlayers,
              };
              removedPlayerIds.forEach((userId) => {
                delete state.worldPlayers?.[userId];
              });
            }
          });
        },
        () => {},
      );

      return () => {
        set((state) => ({
          ...state,
          ...defaultWorldStoreState,
        }));
        worldUnsubscribe();
        worldPlayersUnsubscribe();
      };
    },

    loadWorldPermission: (worldId, uid) => {
      if (!uid) {
        set((state) => {
          state.worldPermission = WorldPermission.None;
        });
        return;
      }
      WorldsService.getWorldPermission(worldId, uid)
        .then((permission) => {
          set((state) => {
            // Ignore stale responses after switching worlds
            if (state.worldId === worldId) {
              state.worldPermission = permission;
            }
          });
        })
        .catch((error) => {
          console.error(error);
          set((state) => {
            if (state.worldId === worldId) {
              state.worldPermission = WorldPermission.None;
            }
          });
        });
    },

    createWorld: (name, description, settingKey) => {
      return WorldsService.createWorld(name, description, settingKey);
    },
    updateWorldName: (worldId, name) => {
      return WorldsService.updateWorldName(worldId, name);
    },
    updateWorldDescription: (worldId, description) => {
      return WorldsService.updateWorldDescription(worldId, description);
    },
    deleteWorld: (worldId) => {
      return WorldsService.deleteWorld(worldId);
    },

    addWorldPlayer: (worldId, userId, role) => {
      return WorldPlayersService.addWorldPlayer(worldId, userId, role);
    },
    updateWorldPlayerRole: (worldId, userId, role) => {
      return WorldPlayersService.updateWorldPlayerRole(worldId, userId, role);
    },
    removeWorldPlayer: (worldId, userId) => {
      return WorldPlayersService.removeWorldPlayer(worldId, userId);
    },
  })),
  deepEqual,
);

export function useListenToWorld(worldId: string | undefined) {
  const uid = useUID();

  const listenToWorld = useWorldStore((state) => state.listenToWorld);
  const loadWorldPermission = useWorldStore(
    (state) => state.loadWorldPermission,
  );
  const worldPlayers = useWorldStore((state) => state.worldPlayers);

  useEffect(() => {
    if (worldId) {
      return listenToWorld(worldId);
    }
  }, [worldId, listenToWorld]);

  // Refresh the derived role whenever membership changes (covers role edits
  // for the current user; game-link changes surface on the next mount).
  useEffect(() => {
    if (worldId) {
      loadWorldPermission(worldId, uid);
    }
  }, [worldId, uid, worldPlayers, loadWorldPermission]);
}

export function useWorldPermission(): WorldPermission {
  return useWorldStore(
    (state) => state.worldPermission ?? WorldPermission.None,
  );
}

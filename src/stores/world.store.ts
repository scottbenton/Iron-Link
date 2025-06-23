import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import {
  IWorld,
  WorldPlayerRole,
  WorldsService,
} from "services/worlds.service";

import { useUID } from "./auth.store";
import { useGameStore } from "./game.store";

interface WorldStoreState {
  world: IWorld | null;
  userRole: WorldPlayerRole | null;
  loading: boolean;
  error: string | null;
}

interface WorldStoreActions {
  listenToWorld: (worldId: string) => () => void;
  listenToWorldPlayerRole: (
    worldId: string,
    gameId: string,
    uid: string,
  ) => () => void;

  // Setters
  setWorldName: (worldId: string, name: string) => Promise<void>;
}

const defaultState: WorldStoreState = {
  world: null,
  loading: false,
  error: null,
  userRole: null,
};

export const useWorldStore = createWithEqualityFn<
  WorldStoreState & WorldStoreActions
>()(
  immer((set) => ({
    ...defaultState,
    listenToWorld: (worldId: string) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });

      const unsubscribe = WorldsService.listenToWorld(
        worldId,
        (world) => {
          set((state) => {
            state.world = world;
            state.loading = false;
            state.error = null;
          });
        },
        (error) => {
          set((state) => {
            state.loading = false;
            state.error = error.message || "Failed to load world.";
          });
        },
      );

      return () => {
        unsubscribe();
        set(defaultState);
      };
    },
    listenToWorldPlayerRole: (worldId, gameId, uid) => {
      const unsubscribe = WorldsService.listenToWorldPlayerRole(
        worldId,
        gameId,
        uid,
        (role) => {
          set((state) => {
            state.userRole = role;
          });
        },
        (error) => {
          console.error("Failed to load user role:", error);
        },
      );
      return unsubscribe;
    },
    setWorldName: async (worldId: string, name: string) => {
      return WorldsService.updateWorldName(worldId, name);
    },
  })),
  deepEqual,
);

export function useListenToGameWorld() {
  const worldId = useGameStore((store) => store.game?.worldId);
  const uid = useUID();
  const gameId = useGameId();
  const listenToWorld = useWorldStore((store) => store.listenToWorld);
  const listenToWorldPlayerRole = useWorldStore(
    (store) => store.listenToWorldPlayerRole,
  );

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    if (worldId) {
      unsubscribes.push(listenToWorld(worldId));
    }
    if (worldId && uid) {
      unsubscribes.push(listenToWorldPlayerRole(worldId, gameId, uid));
    }
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [worldId, listenToWorld, listenToWorldPlayerRole, uid, gameId]);
}

export function useListenToWorld() {
  // TODO - implement
}

export function useWorldPlayerRole(): {
  canView: boolean;
  canEdit: boolean;
  isGuideOrOwner: boolean;
} {
  const userRole = useWorldStore((store) => store.userRole);
  const canView = userRole !== null;
  const canEdit =
    userRole === WorldPlayerRole.Player ||
    userRole === WorldPlayerRole.Owner ||
    userRole === WorldPlayerRole.Guide;
  const isGuideOrOwner =
    userRole === WorldPlayerRole.Guide || userRole === WorldPlayerRole.Owner;

  return { canView, canEdit, isGuideOrOwner };
}

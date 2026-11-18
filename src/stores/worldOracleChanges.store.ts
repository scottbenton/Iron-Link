import deepEqual from "fast-deep-equal";
import { useEffect, useRef } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { getFieldBindingPackageIds } from "lib/worldOracleCatalog";
import { getWorldOracleTargetChanges } from "lib/worldOracleChanges";

import { WorldPermission } from "repositories/shared.types";

import {
  IWorldOracleChange,
  WorldOracleChangesService,
} from "services/worldOracleChanges.service";

import { useWorldStore } from "./world.store";
import { useWorldCategoriesStore } from "./worldCategories.store";
import { useWorldOraclesStore } from "./worldOracles.store";

// Open oracle target changes of the current world, and how far the current
// game has dismissed their banner. Only world editors and Guides read them
// (RLS hands anyone else nothing), since only they can act on them.
interface WorldOracleChangesStoreState {
  worldId: string;
  changes: Record<string, IWorldOracleChange>;
  loading: boolean;
  error?: string;
  // The game whose banner dismissal is loaded, and its dismissal (null when
  // it never dismissed one).
  gameId: string;
  dismissedSeq: number | null;
  dismissalLoading: boolean;
}

interface WorldOracleChangesStoreActions {
  listenToWorldOracleChanges: (worldId: string) => () => void;
  listenToDismissal: (gameId: string, worldId: string) => () => void;
  // Follow the playsets (keep the new oracle) or always roll the old one.
  resolveChange: (changeId: string, keepPrevious: boolean) => Promise<boolean>;
  // Dismisses every change the banner shows in this game.
  dismissChanges: (gameId: string) => Promise<void>;
  reset: () => void;
}

const defaultState: WorldOracleChangesStoreState = {
  worldId: "",
  changes: {},
  loading: true,
  error: undefined,
  gameId: "",
  dismissedSeq: null,
  dismissalLoading: true,
};

export const useWorldOracleChangesStore = createWithEqualityFn<
  WorldOracleChangesStoreState & WorldOracleChangesStoreActions
>()(
  immer((set, get) => ({
    ...defaultState,

    listenToWorldOracleChanges: (worldId) => {
      set((state) => {
        state.worldId = worldId;
        state.changes = {};
        state.loading = true;
        state.error = undefined;
      });
      return WorldOracleChangesService.listenToWorldOracleChanges(
        worldId,
        (changes) => {
          set((state) => {
            if (state.worldId !== worldId) return;
            state.changes = changes;
            state.loading = false;
            state.error = undefined;
          });
        },
        (error) => {
          set((state) => {
            if (state.worldId !== worldId) return;
            state.loading = false;
            state.error = error.message;
          });
        },
      );
    },

    listenToDismissal: (gameId, worldId) => {
      set((state) => {
        state.gameId = gameId;
        state.dismissedSeq = null;
        state.dismissalLoading = true;
      });
      return WorldOracleChangesService.listenToDismissal(
        gameId,
        worldId,
        (seq) => {
          set((state) => {
            if (state.gameId !== gameId) return;
            state.dismissedSeq = seq;
            state.dismissalLoading = false;
          });
        },
        () => {
          set((state) => {
            if (state.gameId !== gameId) return;
            state.dismissalLoading = false;
          });
        },
      );
    },

    resolveChange: (changeId, keepPrevious) => {
      return WorldOracleChangesService.resolveChange(changeId, keepPrevious);
    },

    dismissChanges: async (gameId) => {
      const state = get();
      const changes = getBannerChanges(state, gameId);
      if (!changes.length) return;
      const throughSeq = Math.max(...changes.map((change) => change.seq));
      set((draft) => {
        // Hide the banner at once; the dismissal row confirms it.
        if (draft.gameId === gameId) draft.dismissedSeq = throughSeq;
      });
      try {
        await WorldOracleChangesService.dismissChanges(gameId, throughSeq);
      } catch (error) {
        set((draft) => {
          if (draft.gameId === gameId) draft.dismissedSeq = state.dismissedSeq;
        });
        throw error;
      }
    },

    reset: () => {
      set((state) => ({ ...state, ...defaultState }));
    },
  })),
  deepEqual,
);

// Changes this game hasn't seen: not caused by it (its people chose already)
// and newer than its dismissal. Empty while the dismissal loads, so the
// banner never flashes.
export function getBannerChanges(
  state: Pick<
    WorldOracleChangesStoreState,
    "changes" | "gameId" | "dismissedSeq" | "dismissalLoading"
  >,
  gameId: string,
): IWorldOracleChange[] {
  if (state.gameId !== gameId || state.dismissalLoading) return [];
  return Object.values(state.changes)
    .filter(
      (change) =>
        change.sourceGameId !== gameId &&
        change.seq > (state.dismissedSeq ?? 0),
    )
    .sort((a, b) => a.seq - b.seq);
}

// Changes to flag in World settings, by field. Inside a game, the changes
// that game made are left out: its people chose them in the save dialog.
export function getFlaggedChanges(
  changes: Record<string, IWorldOracleChange>,
  gameId: string | undefined,
): Record<string, IWorldOracleChange[]> {
  const flagged: Record<string, IWorldOracleChange[]> = {};
  Object.values(changes)
    .filter((change) => !gameId || change.sourceGameId !== gameId)
    .sort((a, b) => (a.ruleIndex ?? -1) - (b.ruleIndex ?? -1) || a.seq - b.seq)
    .forEach((change) => {
      (flagged[change.fieldId] ??= []).push(change);
    });
  return flagged;
}

export function useWorldOracleBannerChanges(
  gameId: string | undefined,
): IWorldOracleChange[] {
  return useWorldOracleChangesStore((store) =>
    gameId ? getBannerChanges(store, gameId) : [],
  );
}

export function useWorldOracleFieldChanges(
  fieldId: string,
  gameId: string | undefined,
): IWorldOracleChange[] {
  return useWorldOracleChangesStore(
    (store) => getFlaggedChanges(store.changes, gameId)[fieldId] ?? [],
  );
}

const EDITOR_PERMISSIONS = [
  WorldPermission.Owner,
  WorldPermission.Editor,
  WorldPermission.Guide,
];

function useCanReviewOracleChanges(worldId: string | undefined) {
  return useWorldStore(
    (store) =>
      !!worldId &&
      store.worldId === worldId &&
      !!store.worldPermission &&
      EDITOR_PERMISSIONS.includes(store.worldPermission),
  );
}

// Mount with the world's other listeners (one owner per world): listens to
// the open changes and records moves found on read.
export function useListenToWorldOracleChanges(worldId: string | undefined) {
  const canReview = useCanReviewOracleChanges(worldId);
  const listen = useWorldOracleChangesStore(
    (store) => store.listenToWorldOracleChanges,
  );
  const reset = useWorldOracleChangesStore((store) => store.reset);

  useEffect(() => {
    if (worldId && canReview) {
      return listen(worldId);
    }
  }, [worldId, canReview, listen]);

  useEffect(() => {
    if (!worldId) return;
    return () => {
      reset();
    };
  }, [worldId, reset]);

  useRecordWorldOracleChanges(canReview ? worldId : undefined);
}

// The current game's banner dismissal. Mount inside a game, alongside
// useListenToWorldOracleChanges.
export function useListenToWorldOracleChangeDismissal(
  gameId: string | undefined,
  worldId: string | undefined,
) {
  const canReview = useCanReviewOracleChanges(worldId);
  const listen = useWorldOracleChangesStore((store) => store.listenToDismissal);

  useEffect(() => {
    if (gameId && worldId && canReview) {
      return listen(gameId, worldId);
    }
  }, [gameId, worldId, canReview, listen]);
}

// A world's saved targets can move without anyone choosing: a linked game is
// deleted, or a rules update changes what replaces what. Whoever can review
// changes and reads the world records those moves, so every game sees them.
// It waits until the catalog was built from the configuration in hand, skips
// worlds with packages this build doesn't know (it can't resolve those), and
// tries each set of moves once; the database refuses moves worked out from
// out of date playsets and skips any already made.
function useRecordWorldOracleChanges(worldId: string | undefined) {
  const catalog = useWorldOraclesStore((store) =>
    store.worldId === worldId && !store.loading ? store.catalog : null,
  );
  const linkedGames = useWorldOraclesStore((store) =>
    store.worldId === worldId ? store.linkedGames : null,
  );
  const catalogBindingPackageIds = useWorldOraclesStore((store) =>
    store.worldId === worldId ? store.bindingPackageIds : null,
  );
  const configuration = useWorldCategoriesStore((store) =>
    store.worldId === worldId && !store.loading && !store.error
      ? {
          customized: store.configurationCustomized,
          fields: store.storedFieldDefinitions,
        }
      : null,
  );
  const attempted = useRef(new Set<string>());

  useEffect(() => {
    if (
      !worldId ||
      !catalog ||
      !linkedGames ||
      !configuration?.customized ||
      catalog.missingPackageIds.length
    ) {
      return;
    }
    const fields = Object.values(configuration.fields);
    if (
      !deepEqual(getFieldBindingPackageIds(fields), catalogBindingPackageIds)
    ) {
      return;
    }
    const changes = getWorldOracleTargetChanges(
      worldId,
      true,
      fields,
      catalog.replacementMap,
    );
    if (!changes.length) return;
    const key = JSON.stringify([changes, linkedGames]);
    if (attempted.current.has(key)) return;
    attempted.current.add(key);
    WorldOracleChangesService.recordChanges(
      worldId,
      changes,
      linkedGames,
    ).catch((error) => console.error(error));
  }, [worldId, catalog, linkedGames, catalogBindingPackageIds, configuration]);
}

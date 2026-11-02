import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import {
  WorldMapCell,
  WorldMapCells,
  WorldMapChunk,
  chunkKey,
  chunkOf,
} from "lib/worldMap/chunks";
import { WorldMapGrid, parseCellKey } from "lib/worldMap/grid";

import {
  IWorldMap,
  IWorldMapPin,
  IWorldMapUpdate,
  WorldMapsService,
} from "services/worldMaps.service";

// One entry's map as this window sees it. Painted cells show at once: they
// sit in `pending` until the database has stored them, and win over any
// chunk that arrives meanwhile, since realtime echoes of an earlier save can
// arrive after a later paint.
export interface WorldMapState {
  loading: boolean;
  error?: string;
  map: IWorldMap | null;
  chunks: Record<string, WorldMapChunk>;
  pins: Record<string, IWorldMapPin>;
  pending: Record<string, WorldMapCell | null>;
}

interface WorldMapsStoreState {
  maps: Record<string, WorldMapState>;
}

interface WorldMapsStoreActions {
  listenToWorldMap: (entryId: string) => () => void;
  createMap: (
    worldId: string,
    entryId: string,
    grid: WorldMapGrid,
  ) => Promise<void>;
  updateMap: (entryId: string, update: IWorldMapUpdate) => Promise<void>;
  // Paints (or, with null, erases) cells. Saves after a short pause.
  paint: (entryId: string, cells: Record<string, WorldMapCell | null>) => void;
  flush: (entryId: string) => Promise<void>;
  clearMap: (entryId: string) => Promise<void>;
  setPin: (pin: IWorldMapPin) => Promise<void>;
  removePin: (pinnedEntryId: string, mapEntryId: string) => Promise<void>;
}

export type WorldMapsStore = WorldMapsStoreState & WorldMapsStoreActions;

export const PAINT_SAVE_DELAY_MS = 250;
// The database takes at most 4096 cells a call.
const MAX_CELLS_PER_SAVE = 4096;

const EMPTY_STATE: WorldMapState = {
  loading: true,
  map: null,
  chunks: {},
  pins: {},
  pending: {},
};

const subscriptions: Record<string, { count: number; stop: () => void }> = {};
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const saving: Record<string, Promise<void> | undefined> = {};

export const useWorldMapsStore = createWithEqualityFn<WorldMapsStore>()(
  immer((set, get) => {
    const update = (entryId: string, recipe: (map: WorldMapState) => void) =>
      set((store) => {
        const map = store.maps[entryId];
        if (map) recipe(map);
      });

    // Keeps the newest version of each chunk.
    const applyChunks = (
      map: WorldMapState,
      chunks: WorldMapChunk[],
      replace: boolean,
    ) => {
      if (replace) {
        const next: Record<string, WorldMapChunk> = {};
        chunks.forEach((chunk) => {
          next[chunkKey(chunk)] = chunk;
        });
        map.chunks = next;
        return;
      }
      chunks.forEach((chunk) => {
        const key = chunkKey(chunk);
        const held = map.chunks[key];
        if (!held || held.version < chunk.version) map.chunks[key] = chunk;
      });
    };

    // Drops the cells of a finished save, unless they were painted again
    // since it went out.
    const settle = (
      entryId: string,
      sent: Record<string, WorldMapCell | null>,
      chunks: WorldMapChunk[],
    ) =>
      update(entryId, (state) => {
        applyChunks(state, chunks, false);
        Object.keys(sent).forEach((key) => {
          if (deepEqual(state.pending[key], sent[key]))
            delete state.pending[key];
        });
      });

    const scheduleSave = (entryId: string, delay = PAINT_SAVE_DELAY_MS) => {
      clearTimeout(saveTimers[entryId]);
      saveTimers[entryId] = setTimeout(() => {
        delete saveTimers[entryId];
        get()
          .flush(entryId)
          .catch(() => {});
      }, delay);
    };

    return {
      maps: {},

      listenToWorldMap: (entryId) => {
        const existing = subscriptions[entryId];
        if (existing) {
          existing.count++;
        } else {
          set((store) => {
            store.maps[entryId] = { ...EMPTY_STATE };
          });
          const onError = (error: Error) =>
            update(entryId, (map) => {
              map.loading = false;
              map.error = error.message;
            });
          const stops = [
            WorldMapsService.listenToWorldMap(
              entryId,
              (map) =>
                update(entryId, (state) => {
                  state.loading = false;
                  state.error = undefined;
                  state.map = map;
                }),
              onError,
            ),
            WorldMapsService.listenToWorldMapChunks(
              entryId,
              (chunks, replace) =>
                update(entryId, (state) => applyChunks(state, chunks, replace)),
              onError,
            ),
            WorldMapsService.listenToWorldMapPins(
              entryId,
              (changed, removed, replace) =>
                update(entryId, (state) => {
                  if (replace) state.pins = {};
                  removed.forEach((id) => delete state.pins[id]);
                  changed.forEach((pin) => {
                    state.pins[pin.entryId] = pin;
                  });
                }),
              onError,
            ),
          ];
          subscriptions[entryId] = {
            count: 1,
            stop: () => stops.forEach((stop) => stop()),
          };
        }
        return () => {
          const subscription = subscriptions[entryId];
          if (!subscription) return;
          subscription.count--;
          if (subscription.count > 0) return;
          delete subscriptions[entryId];
          subscription.stop();
          // Unsaved paint is still sent, then the map is forgotten.
          clearTimeout(saveTimers[entryId]);
          delete saveTimers[entryId];
          get()
            .flush(entryId)
            .catch(() => {})
            .finally(() => {
              if (subscriptions[entryId]) return;
              set((store) => {
                delete store.maps[entryId];
              });
            });
        };
      },

      createMap: async (worldId, entryId, grid) => {
        const map = await WorldMapsService.createWorldMap(
          worldId,
          entryId,
          grid,
        );
        update(entryId, (state) => {
          state.map = map;
        });
      },

      updateMap: async (entryId, changes) => {
        // Paint goes first, so a grid change sees the map as it is shown.
        await get().flush(entryId);
        const map = await WorldMapsService.updateWorldMap(entryId, changes);
        update(entryId, (state) => {
          state.map = map;
        });
      },

      paint: (entryId, cells) => {
        if (!get().maps[entryId]) return;
        update(entryId, (state) => {
          Object.entries(cells).forEach(([key, cell]) => {
            state.pending[key] = cell;
          });
        });
        const count = Object.keys(get().maps[entryId]?.pending ?? {}).length;
        scheduleSave(entryId, count >= MAX_CELLS_PER_SAVE ? 0 : undefined);
      },

      flush: async (entryId) => {
        // One save at a time per map; paint added meanwhile waits for it.
        while (saving[entryId]) await saving[entryId];
        clearTimeout(saveTimers[entryId]);
        delete saveTimers[entryId];
        const pending = get().maps[entryId]?.pending ?? {};
        const keys = Object.keys(pending).slice(0, MAX_CELLS_PER_SAVE);
        if (keys.length === 0) return;
        const sent = Object.fromEntries(keys.map((key) => [key, pending[key]]));
        const save = WorldMapsService.paintCells(entryId, sent).then(
          (chunks) => settle(entryId, sent, chunks),
          (error) => {
            // Refused cells go back to what is stored.
            settle(entryId, sent, []);
            throw error;
          },
        );
        saving[entryId] = save
          .catch(() => {})
          .finally(() => {
            delete saving[entryId];
          });
        await save;
        if (Object.keys(get().maps[entryId]?.pending ?? {}).length > 0)
          scheduleSave(entryId);
      },

      clearMap: async (entryId) => {
        clearTimeout(saveTimers[entryId]);
        delete saveTimers[entryId];
        while (saving[entryId]) await saving[entryId];
        update(entryId, (state) => {
          state.pending = {};
        });
        const chunks = await WorldMapsService.clearCells(entryId);
        update(entryId, (state) => applyChunks(state, chunks, false));
      },

      setPin: async (pin) => {
        await WorldMapsService.setPin(pin);
        update(pin.mapEntryId, (state) => {
          state.pins[pin.entryId] = pin;
        });
      },

      removePin: async (pinnedEntryId, mapEntryId) => {
        await WorldMapsService.removePin(pinnedEntryId);
        update(mapEntryId, (state) => {
          delete state.pins[pinnedEntryId];
        });
      },
    };
  }),
  deepEqual,
);

export function useListenToWorldMap(entryId: string | undefined) {
  const listen = useWorldMapsStore((store) => store.listenToWorldMap);
  useEffect(() => {
    if (!entryId) return;
    return listen(entryId);
  }, [entryId, listen]);
}

export function useWorldMapState(entryId: string): WorldMapState {
  return useWorldMapsStore(
    (store) => store.maps[entryId] ?? EMPTY_STATE,
    (a, b) => a === b,
  );
}

// The chunks this window shows: what is stored, with unsaved paint on top.
// A chunk unchanged by pending paint keeps its object, so drawing can cache
// by identity. Chunks without cells are left out.
export function getDisplayedChunks(
  state: Pick<WorldMapState, "chunks" | "pending">,
): WorldMapChunk[] {
  const touched: Record<string, WorldMapCells> = {};
  Object.entries(state.pending).forEach(([key, cell]) => {
    const id = chunkKey(chunkOf(parseCellKey(key)));
    const cells = (touched[id] ??= { ...state.chunks[id]?.cells });
    if (cell) cells[key] = cell;
    else delete cells[key];
  });
  const displayed: Record<string, WorldMapChunk> = { ...state.chunks };
  Object.entries(touched).forEach(([id, cells]) => {
    const [x, y] = id.split(",").map(Number);
    displayed[id] = { x, y, cells, version: state.chunks[id]?.version ?? 0 };
  });
  return Object.values(displayed).filter(
    (chunk) => Object.keys(chunk.cells).length > 0,
  );
}

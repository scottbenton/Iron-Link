import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { Difficulty } from "repositories/tracks.repository";

import {
  IWorldConnectionUpdate,
  IWorldEntryBond,
  IWorldEntryBondKey,
  IWorldEntryConnection,
  WorldEntryBondsService,
  getWorldEntryBondKey,
} from "services/worldEntryBonds.service";

// Bonds as this window sees them, read by entry (the entry page) and by
// character (the character sheet). Both views share one record keyed by
// entry and character, so a change made in one shows in the other at once.
// Connections, which bonds of kind "connection" point at, are read by game.
interface WorldEntryBondsStoreState {
  bonds: Record<string, IWorldEntryBond>;
  connections: Record<string, IWorldEntryConnection>;
  // Keyed "entry:<id>", "character:<id>" or "game:<id>".
  loading: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

interface WorldEntryBondsStoreActions {
  listenToEntryBonds: (entryId: string) => () => void;
  listenToCharacterBonds: (characterId: string) => () => void;
  listenToGameConnections: (gameId: string) => () => void;
  addBond: (key: IWorldEntryBondKey) => Promise<void>;
  addConnection: (key: IWorldEntryBondKey, rank: Difficulty) => Promise<void>;
  shareConnection: (
    key: IWorldEntryBondKey,
    connectionId: string,
  ) => Promise<void>;
  // Shows at once, and goes back if the database refuses it.
  updateConnection: (
    connectionId: string,
    update: IWorldConnectionUpdate,
  ) => Promise<void>;
  // Removes a bond, or takes a character out of its connection.
  removeBond: (key: IWorldEntryBondKey) => Promise<void>;
}

export type WorldEntryBondsStore = WorldEntryBondsStoreState &
  WorldEntryBondsStoreActions;

type Scope = { column: "entryId" | "characterId"; id: string };

const subscriptions: Record<string, { count: number; stop: () => void }> = {};

// Ref-counts one listener per key, so views that need the same data share it.
function retain(key: string, start: () => () => void, onStop: () => void) {
  const existing = subscriptions[key];
  if (existing) existing.count++;
  else subscriptions[key] = { count: 1, stop: start() };
  return () => {
    const subscription = subscriptions[key];
    if (!subscription) return;
    subscription.count--;
    if (subscription.count > 0) return;
    delete subscriptions[key];
    subscription.stop();
    onStop();
  };
}

const scopeKey = (scope: Scope) =>
  `${scope.column === "entryId" ? "entry" : "character"}:${scope.id}`;

export const useWorldEntryBondsStore =
  createWithEqualityFn<WorldEntryBondsStore>()(
    immer((set, get) => {
      const put = (bond: IWorldEntryBond) =>
        set((store) => {
          store.bonds[getWorldEntryBondKey(bond)] = bond;
        });

      const listen = (scope: Scope) => {
        const key = scopeKey(scope);
        return retain(
          key,
          () => {
            set((store) => {
              store.loading[key] = true;
            });
            const onBonds = (
              changed: IWorldEntryBond[],
              removed: IWorldEntryBondKey[],
              replace: boolean,
            ) =>
              set((store) => {
                store.loading[key] = false;
                store.errors[key] = undefined;
                if (replace) {
                  Object.entries(store.bonds).forEach(([bondKey, bond]) => {
                    if (bond[scope.column] === scope.id)
                      delete store.bonds[bondKey];
                  });
                }
                removed.forEach((bond) => {
                  delete store.bonds[getWorldEntryBondKey(bond)];
                });
                changed.forEach((bond) => {
                  store.bonds[getWorldEntryBondKey(bond)] = bond;
                });
              });
            const onError = (error: Error) =>
              set((store) => {
                store.loading[key] = false;
                store.errors[key] = error.message;
              });
            return scope.column === "entryId"
              ? WorldEntryBondsService.listenToEntryBonds(
                  scope.id,
                  onBonds,
                  onError,
                )
              : WorldEntryBondsService.listenToCharacterBonds(
                  scope.id,
                  onBonds,
                  onError,
                );
          },
          () =>
            set((store) => {
              delete store.loading[key];
              delete store.errors[key];
              // Keep bonds another view still listens to.
              Object.entries(store.bonds).forEach(([bondKey, bond]) => {
                if (
                  bond[scope.column] === scope.id &&
                  !subscriptions[`entry:${bond.entryId}`] &&
                  !subscriptions[`character:${bond.characterId}`]
                )
                  delete store.bonds[bondKey];
              });
            }),
        );
      };

      const listenToGameConnections = (gameId: string) => {
        const key = `game:${gameId}`;
        return retain(
          key,
          () => {
            set((store) => {
              store.loading[key] = true;
            });
            return WorldEntryBondsService.listenToGameConnections(
              gameId,
              (changed, removedIds, replace) =>
                set((store) => {
                  store.loading[key] = false;
                  store.errors[key] = undefined;
                  if (replace) {
                    Object.values(store.connections).forEach((connection) => {
                      if (connection.gameId === gameId)
                        delete store.connections[connection.id];
                    });
                  }
                  removedIds.forEach((id) => {
                    delete store.connections[id];
                  });
                  changed.forEach((connection) => {
                    store.connections[connection.id] = connection;
                  });
                }),
              (error) =>
                set((store) => {
                  store.loading[key] = false;
                  store.errors[key] = error.message;
                }),
            );
          },
          () =>
            set((store) => {
              delete store.loading[key];
              delete store.errors[key];
              Object.values(store.connections).forEach((connection) => {
                if (connection.gameId === gameId)
                  delete store.connections[connection.id];
              });
            }),
        );
      };

      return {
        bonds: {},
        connections: {},
        loading: {},
        errors: {},

        listenToEntryBonds: (entryId) =>
          listen({ column: "entryId", id: entryId }),
        listenToCharacterBonds: (characterId) =>
          listen({ column: "characterId", id: characterId }),
        listenToGameConnections,

        addBond: async (key) => {
          put(await WorldEntryBondsService.addBond(key));
        },
        addConnection: async (key, rank) => {
          const { connection, bond } =
            await WorldEntryBondsService.addConnection(key, rank);
          set((store) => {
            store.connections[connection.id] = connection;
            store.bonds[getWorldEntryBondKey(bond)] = bond;
          });
        },
        shareConnection: async (key, connectionId) => {
          put(await WorldEntryBondsService.shareConnection(key, connectionId));
        },
        updateConnection: async (connectionId, update) => {
          const before = get().connections[connectionId];
          if (before)
            set((store) => {
              store.connections[connectionId] = { ...before, ...update };
            });
          try {
            const connection = await WorldEntryBondsService.updateConnection(
              connectionId,
              update,
            );
            set((store) => {
              store.connections[connectionId] = connection;
            });
          } catch (error) {
            if (before)
              set((store) => {
                const current = store.connections[connectionId];
                if (current) {
                  (Object.keys(update) as (keyof IWorldConnectionUpdate)[])
                    .filter((field) => update[field] !== undefined)
                    .forEach((field) => {
                      Object.assign(current, { [field]: before[field] });
                    });
                }
              });
            throw error;
          }
        },
        removeBond: async (key) => {
          await WorldEntryBondsService.removeBond(key);
          set((store) => {
            const bondKey = getWorldEntryBondKey(key);
            const connectionId = store.bonds[bondKey]?.connectionId;
            delete store.bonds[bondKey];
            // The database removes a connection with its last member.
            if (
              connectionId &&
              !Object.values(store.bonds).some(
                (bond) => bond.connectionId === connectionId,
              )
            )
              delete store.connections[connectionId];
          });
        },
      };
    }),
  );

export function useListenToEntryBonds(entryId: string | undefined) {
  const listen = useWorldEntryBondsStore((store) => store.listenToEntryBonds);
  useEffect(() => (entryId ? listen(entryId) : undefined), [entryId, listen]);
}

export function useListenToCharacterBonds(characterId: string | undefined) {
  const listen = useWorldEntryBondsStore(
    (store) => store.listenToCharacterBonds,
  );
  useEffect(
    () => (characterId ? listen(characterId) : undefined),
    [characterId, listen],
  );
}

export function useListenToGameConnections(gameId: string | undefined) {
  const listen = useWorldEntryBondsStore(
    (store) => store.listenToGameConnections,
  );
  useEffect(() => (gameId ? listen(gameId) : undefined), [gameId, listen]);
}

// The game's connections with an entry, oldest first.
export function useEntryConnections(
  gameId: string | undefined,
  entryId: string | undefined,
): IWorldEntryConnection[] {
  return useWorldEntryBondsStore(
    (store) =>
      gameId && entryId
        ? Object.values(store.connections).filter(
            (connection) =>
              connection.gameId === gameId && connection.entryId === entryId,
          )
        : [],
    shallowArrayEqual,
  );
}

export function useWorldEntryConnections(): Record<
  string,
  IWorldEntryConnection
> {
  return useWorldEntryBondsStore((store) => store.connections);
}

const selectBonds = (
  bonds: Record<string, IWorldEntryBond>,
  column: Scope["column"],
  id: string | undefined,
) => (id ? Object.values(bonds).filter((bond) => bond[column] === id) : []);

export function useEntryBonds(entryId: string | undefined): IWorldEntryBond[] {
  return useWorldEntryBondsStore(
    (store) => selectBonds(store.bonds, "entryId", entryId),
    shallowArrayEqual,
  );
}

export function useCharacterBonds(
  characterId: string | undefined,
): IWorldEntryBond[] {
  return useWorldEntryBondsStore(
    (store) => selectBonds(store.bonds, "characterId", characterId),
    shallowArrayEqual,
  );
}

function shallowArrayEqual<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

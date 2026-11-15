import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { Difficulty } from "repositories/tracks.repository";

import {
  IWorldConnectionUpdate,
  IWorldEntryBond,
  IWorldEntryBondKey,
  WorldEntryBondsService,
  getWorldEntryBondKey,
} from "services/worldEntryBonds.service";

// Bonds as this window sees them, read by entry (the entry page) and by
// character (the character sheet). Both views share one record keyed by
// entry and character, so a change made in one shows in the other at once.
interface WorldEntryBondsStoreState {
  bonds: Record<string, IWorldEntryBond>;
  // Keyed "entry:<id>" or "character:<id>".
  loading: Record<string, boolean>;
  errors: Record<string, string | undefined>;
}

interface WorldEntryBondsStoreActions {
  listenToEntryBonds: (entryId: string) => () => void;
  listenToCharacterBonds: (characterId: string) => () => void;
  addBond: (key: IWorldEntryBondKey) => Promise<void>;
  addConnection: (key: IWorldEntryBondKey, rank: Difficulty) => Promise<void>;
  // Shows at once, and goes back if the database refuses it.
  updateConnection: (
    key: IWorldEntryBondKey,
    update: IWorldConnectionUpdate,
  ) => Promise<void>;
  removeBond: (key: IWorldEntryBondKey) => Promise<void>;
}

export type WorldEntryBondsStore = WorldEntryBondsStoreState &
  WorldEntryBondsStoreActions;

type Scope = { column: "entryId" | "characterId"; id: string };

const subscriptions: Record<string, { count: number; stop: () => void }> = {};

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
        const existing = subscriptions[key];
        if (existing) {
          existing.count++;
        } else {
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
          subscriptions[key] = {
            count: 1,
            stop:
              scope.column === "entryId"
                ? WorldEntryBondsService.listenToEntryBonds(
                    scope.id,
                    onBonds,
                    onError,
                  )
                : WorldEntryBondsService.listenToCharacterBonds(
                    scope.id,
                    onBonds,
                    onError,
                  ),
          };
        }
        return () => {
          const subscription = subscriptions[key];
          if (!subscription) return;
          subscription.count--;
          if (subscription.count > 0) return;
          delete subscriptions[key];
          subscription.stop();
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
          });
        };
      };

      return {
        bonds: {},
        loading: {},
        errors: {},

        listenToEntryBonds: (entryId) =>
          listen({ column: "entryId", id: entryId }),
        listenToCharacterBonds: (characterId) =>
          listen({ column: "characterId", id: characterId }),

        addBond: async (key) => {
          put(await WorldEntryBondsService.addBond(key));
        },
        addConnection: async (key, rank) => {
          put(await WorldEntryBondsService.addConnection(key, rank));
        },
        updateConnection: async (key, update) => {
          const bondKey = getWorldEntryBondKey(key);
          const before = get().bonds[bondKey];
          if (before) put({ ...before, ...update });
          try {
            put(await WorldEntryBondsService.updateConnection(key, update));
          } catch (error) {
            if (before)
              set((store) => {
                const current = store.bonds[bondKey];
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
            delete store.bonds[getWorldEntryBondKey(key)];
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

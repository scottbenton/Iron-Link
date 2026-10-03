import deepEqual from "fast-deep-equal";
import { useEffect, useMemo } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { IconDefinition } from "types/Icon.type";
import type { Json } from "types/supabase-generated.type";

import type { WorldFieldConfiguration } from "lib/worldFieldRules";

import type { DefaultWorldFieldBinding } from "repositories/worldConfiguration.repository";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";
import { WorldConfigurationReadService } from "services/worldConfigurationRead.service";
import {
  IWorldFieldDefinition,
  OracleBinding,
  WorldFieldDefinitionsService,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";
import type { IWorld } from "services/worlds.service";

import { useWorldStore } from "./world.store";
import { createWorldConfigurationOrder } from "./worldConfigurationOrder";

interface WorldCategoriesStoreState {
  worldId: string;
  settingKey: string | null;
  configurationCustomized: boolean;
  defaultBindingsReady: boolean;
  configurationLoaded: boolean;
  categories: Record<string, IWorldCategory>;
  // Field definitions are the categories' shape and are always needed with
  // them, so they load per world in the same store rather than a parallel one.
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
  // Unresolved database definitions remain stable while linked playsets load.
  sourceFieldDefinitions: Record<string, IWorldFieldDefinition>;
  loading: boolean;
  error?: string;
}

interface WorldCategoriesStoreActions {
  listenToWorldCategories: (
    world: Pick<IWorld, "id" | "settingKey" | "configurationCustomized">,
  ) => () => void;
  invalidateDefaultBindings: (worldId: string) => void;
  applyDefaultReplacementMap: (
    worldId: string,
    replacementMap: Record<string, string>,
  ) => void;
  reorderCategories: (ids: string[]) => Promise<void>;
  reorderFields: (categoryId: string, ids: string[]) => Promise<void>;

  createCategory: (
    worldId: string,
    category: {
      name: string;
      icon?: IconDefinition;
      sortOrder: number;
      supportsHierarchy?: boolean;
      supportsMap?: boolean;
      supportsBonds?: boolean;
    },
  ) => Promise<string>;
  updateCategory: (
    categoryId: string,
    category: Partial<Omit<IWorldCategory, "id" | "worldId">>,
  ) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  createFieldDefinition: (
    worldId: string,
    categoryId: string,
    definition: {
      id?: string;
      key?: string;
      label: string;
      type: WorldFieldType;
      binding?: OracleBinding | null;
      configuration?: WorldFieldConfiguration;
      gmOnly?: boolean;
      sortOrder: number;
    },
  ) => Promise<string>;
  updateFieldDefinition: (
    definitionId: string,
    definition: Partial<
      Omit<IWorldFieldDefinition, "id" | "worldId" | "categoryId">
    >,
  ) => Promise<void>;
  deleteFieldDefinition: (definitionId: string) => Promise<void>;

  reset: () => void;
}

const defaultWorldCategoriesState: WorldCategoriesStoreState = {
  worldId: "",
  settingKey: null,
  configurationCustomized: false,
  defaultBindingsReady: false,
  configurationLoaded: false,
  categories: {},
  fieldDefinitions: {},
  sourceFieldDefinitions: {},
  loading: true,
  error: undefined,
};

export const useWorldCategoriesStore = createWithEqualityFn<
  WorldCategoriesStoreState & WorldCategoriesStoreActions
>()(
  immer((set, get) => {
    const order = createWorldConfigurationOrder();
    const newCategorySession = (worldId = "") => ({
      worldId,
      observed: new Set<string>(),
      removed: new Set<string>(),
    });
    let categorySession = newCategorySession();
    let configurationSession = 0;
    const overlayOrders = (state: WorldCategoriesStoreState) => {
      state.categories = order.overlay("categories", state.categories);
      for (const categoryId of new Set(
        Object.values(state.fieldDefinitions).map((field) => field.categoryId),
      ))
        state.fieldDefinitions = order.overlay(
          `fields:${categoryId}`,
          state.fieldDefinitions,
        );
    };
    const applyOrders = (
      worldId: string,
      kind: "categories" | "fieldDefinitions",
      orders: Record<string, number>,
    ) =>
      set((state) => {
        if (state.worldId !== worldId) return;
        for (const [id, sortOrder] of Object.entries(orders))
          if (state[kind][id]?.worldId === worldId)
            state[kind][id].sortOrder = sortOrder;
      });
    return {
      ...defaultWorldCategoriesState,

      invalidateDefaultBindings: (worldId) => {
        if (get().worldId === worldId && !get().configurationCustomized)
          set({ defaultBindingsReady: false });
      },

      applyDefaultReplacementMap: (worldId, replacementMap) => {
        const state = get();
        if (
          state.worldId !== worldId ||
          state.configurationCustomized ||
          !state.configurationLoaded
        )
          return;
        const fieldDefinitions = Object.fromEntries(
          Object.entries(state.sourceFieldDefinitions).map(([id, field]) => [
            id,
            resolveDefaultFieldBindings(field, replacementMap),
          ]),
        );
        if (
          !state.defaultBindingsReady ||
          !deepEqual(fieldDefinitions, state.fieldDefinitions)
        ) {
          set((state) => {
            state.fieldDefinitions = fieldDefinitions;
            state.defaultBindingsReady = true;
            overlayOrders(state);
          });
        }
      },

      listenToWorldCategories: (world) => {
        const worldId = world.id;
        const session = ++configurationSession;
        order.reset(worldId);
        if (categorySession.worldId !== worldId)
          categorySession = newCategorySession(worldId);
        const previous = get();
        const materializingDefaults =
          previous.worldId === worldId &&
          !previous.configurationCustomized &&
          world.configurationCustomized;
        set({
          ...defaultWorldCategoriesState,
          ...(materializingDefaults
            ? {
                categories: previous.categories,
                fieldDefinitions: previous.fieldDefinitions,
                sourceFieldDefinitions: previous.sourceFieldDefinitions,
              }
            : {}),
          worldId,
          settingKey: world.settingKey,
          configurationCustomized: world.configurationCustomized,
        });
        if (!world.configurationCustomized) {
          let active = true;
          let customUnsubscribe: (() => void) | undefined;
          WorldConfigurationReadService.getWorldConfiguration(worldId)
            .then((snapshot) => {
              if (
                !active ||
                session !== configurationSession ||
                get().worldId !== worldId
              )
                return;
              if (snapshot.configurationCustomized) {
                customUnsubscribe = get().listenToWorldCategories({
                  ...world,
                  configurationCustomized: true,
                });
                return;
              }
              set((state) => {
                if (state.worldId !== worldId || state.configurationCustomized)
                  return;
                state.categories = snapshot.categories;
                state.fieldDefinitions = snapshot.fieldDefinitions;
                state.sourceFieldDefinitions = snapshot.fieldDefinitions;
                state.configurationLoaded = true;
                state.loading = false;
                overlayOrders(state);
              });
            })
            .catch((cause) => {
              if (
                !active ||
                session !== configurationSession ||
                get().worldId !== worldId
              )
                return;
              set({
                loading: false,
                error:
                  cause instanceof Error
                    ? cause.message
                    : "Could not load world configuration. Please retry.",
              });
            });
          return () => {
            active = false;
            customUnsubscribe?.();
          };
        }
        let active = true;
        let categoriesReady = false;
        let definitionsReady = false;
        let categoriesError: string | undefined;
        let definitionsError: string | undefined;
        const categoriesUnsubscribe =
          WorldCategoriesService.listenToWorldCategories(
            worldId,
            (changedCategories, removedCategoryIds, replaceState) => {
              if (!active || session !== configurationSession) return;
              if (get().worldId !== worldId) return;
              // Remember authoritative absence across same-world first-fork
              // handover: an RPC response may arrive after INSERT + DELETE.
              if (replaceState) {
                for (const id of categorySession.observed) {
                  if (!changedCategories[id]) categorySession.removed.add(id);
                }
              }
              for (const id of Object.keys(changedCategories)) {
                categorySession.observed.add(id);
                categorySession.removed.delete(id);
              }
              removedCategoryIds.forEach((id) =>
                categorySession.removed.add(id),
              );
              order.observe(
                "categories",
                changedCategories,
                removedCategoryIds,
                replaceState,
              );
              categoriesReady ||= !!replaceState;
              categoriesError = undefined;
              set((state) => {
                if (state.worldId !== worldId) return;
                if (replaceState) {
                  state.categories = changedCategories;
                } else {
                  state.categories = {
                    ...state.categories,
                    ...changedCategories,
                  };
                  removedCategoryIds.forEach((categoryId) => {
                    delete state.categories[categoryId];
                  });
                }
                state.categories = order.overlay(
                  "categories",
                  state.categories,
                );
                state.loading =
                  !definitionsError && !(categoriesReady && definitionsReady);
                state.configurationLoaded = categoriesReady && definitionsReady;
                state.error = definitionsError;
              });
            },
            (error) => {
              if (!active || session !== configurationSession) return;
              categoriesError = error.message;
              console.error(error);
              set((state) => {
                if (state.worldId !== worldId) return;
                state.loading = false;
                state.error = error.message;
              });
            },
          );

        const definitionsUnsubscribe =
          WorldFieldDefinitionsService.listenToWorldFieldDefinitions(
            worldId,
            (changedDefinitions, removedDefinitionIds, replaceState) => {
              if (!active || session !== configurationSession) return;
              if (get().worldId !== worldId) return;
              for (const categoryId of new Set(
                [
                  ...Object.values(get().fieldDefinitions),
                  ...Object.values(changedDefinitions),
                ].map((field) => field.categoryId),
              )) {
                order.observe(
                  `fields:${categoryId}`,
                  Object.fromEntries(
                    Object.entries(changedDefinitions).filter(
                      ([, field]) => field.categoryId === categoryId,
                    ),
                  ),
                  removedDefinitionIds,
                  replaceState,
                );
              }
              definitionsReady ||= !!replaceState;
              definitionsError = undefined;
              set((state) => {
                if (state.worldId !== worldId) return;
                state.loading =
                  !categoriesError && !(categoriesReady && definitionsReady);
                state.configurationLoaded = categoriesReady && definitionsReady;
                state.error = categoriesError;
                if (replaceState) {
                  state.fieldDefinitions = changedDefinitions;
                } else {
                  state.fieldDefinitions = {
                    ...state.fieldDefinitions,
                    ...changedDefinitions,
                  };
                  removedDefinitionIds.forEach((definitionId) => {
                    delete state.fieldDefinitions[definitionId];
                  });
                }
                overlayOrders(state);
              });
            },
            (error) => {
              if (!active || session !== configurationSession) return;
              definitionsError = error.message;
              console.error(error);
              set((state) => {
                if (state.worldId !== worldId) return;
                state.loading = false;
                state.error = error.message;
              });
            },
          );

        return () => {
          active = false;
          categoriesUnsubscribe();
          definitionsUnsubscribe();
        };
      },

      createCategory: async (worldId, category) => {
        const session = categorySession;
        const id = await WorldCategoriesService.addWorldCategory(
          worldId,
          category,
          getDefaultBindings(get()),
        );
        // A successful create can resolve before its realtime INSERT. Seed
        // the known definition so navigating to its settings never looks like
        // a missing category; a record already received from the server wins.
        set((state) => {
          if (
            session !== categorySession ||
            state.worldId !== worldId ||
            state.categories[id] ||
            session.removed.has(id)
          )
            return;
          state.categories[id] = {
            id,
            worldId,
            name: category.name,
            icon: category.icon ?? null,
            sortOrder: category.sortOrder,
            supportsHierarchy: category.supportsHierarchy ?? false,
            supportsMap: category.supportsMap ?? false,
            supportsBonds: category.supportsBonds ?? false,
            subtitleFieldDefinitionId: null,
          };
        });
        return id;
      },
      updateCategory: (categoryId, category) => {
        return WorldCategoriesService.updateWorldCategory(
          get().worldId,
          categoryId,
          category,
          getDefaultBindings(get()),
        );
      },
      // Cascades through the category's field definitions, its entries, and
      // their values. Callers must confirm with the entry count first.
      deleteCategory: (categoryId) => {
        return WorldCategoriesService.deleteWorldCategory(
          get().worldId,
          categoryId,
          getDefaultBindings(get()),
        );
      },

      createFieldDefinition: (worldId, categoryId, definition) => {
        return WorldFieldDefinitionsService.addWorldFieldDefinition(
          worldId,
          categoryId,
          definition,
          getDefaultBindings(get()),
        );
      },
      updateFieldDefinition: (definitionId, definition) => {
        return WorldFieldDefinitionsService.updateWorldFieldDefinition(
          get().worldId,
          definitionId,
          definition,
          getDefaultBindings(get()),
        );
      },
      deleteFieldDefinition: (definitionId) => {
        return WorldFieldDefinitionsService.deleteWorldFieldDefinition(
          get().worldId,
          definitionId,
          getDefaultBindings(get()),
        );
      },

      reorderCategories: (ids) => {
        const state = get();
        const bindings = getDefaultBindings(state);
        return order.reorder(
          "categories",
          Object.fromEntries(
            Object.entries(state.categories).filter(
              ([, category]) => category.worldId === state.worldId,
            ),
          ),
          ids,
          () =>
            WorldCategoriesService.reorderCategories(
              state.worldId,
              ids,
              bindings,
            ),
          (orders) => applyOrders(state.worldId, "categories", orders),
          () => {
            if (get().worldId === state.worldId)
              set({
                error:
                  "The saved category order could not be confirmed. Please refresh and try again.",
              });
          },
        );
      },
      reorderFields: (categoryId, ids) => {
        const state = get();
        const bindings = getDefaultBindings(state);
        return order.reorder(
          `fields:${categoryId}`,
          Object.fromEntries(
            Object.entries(state.fieldDefinitions).filter(
              ([, field]) =>
                field.worldId === state.worldId &&
                field.categoryId === categoryId,
            ),
          ),
          ids,
          () =>
            WorldCategoriesService.reorderFields(
              state.worldId,
              categoryId,
              ids,
              bindings,
            ),
          (orders) => applyOrders(state.worldId, "fieldDefinitions", orders),
          () => {
            if (get().worldId === state.worldId)
              set({
                error:
                  "The saved field order could not be confirmed. Please refresh and try again.",
              });
          },
        );
      },

      reset: () => {
        configurationSession++;
        order.reset();
        categorySession = newCategorySession();
        set((store) => ({ ...store, ...defaultWorldCategoriesState }));
      },
    };
  }),
  deepEqual,
);

function getDefaultBindings(
  state: WorldCategoriesStoreState,
): DefaultWorldFieldBinding[] | undefined {
  if (state.configurationCustomized) return undefined;
  if (!state.defaultBindingsReady)
    throw new Error(
      "Wait for this world's oracle configuration to finish loading.",
    );
  return Object.values(state.fieldDefinitions).map((field) => ({
    id: field.id,
    binding: field.binding as unknown as Json,
    rule_bindings: field.configuration.rules.flatMap((rule, index) =>
      rule.binding === undefined
        ? []
        : [
            {
              index,
              binding: rule.binding as unknown as Json,
              conditions: rule.conditions,
            },
          ],
    ),
  }));
}

function resolveDefaultFieldBindings(
  field: IWorldFieldDefinition,
  replacementMap: Record<string, string>,
): IWorldFieldDefinition {
  const resolve = (binding: OracleBinding | null): OracleBinding | null => {
    if (!binding) return null;
    const oracleId = binding.exact
      ? binding.oracleId
      : (replacementMap[binding.oracleId] ?? binding.oracleId);
    return {
      ...binding,
      oracleId,
      resolvedOracleId: oracleId,
      packageId: oracleId.split(":")[1].split("/")[0],
    };
  };
  return {
    ...field,
    binding: resolve(field.binding),
    configuration: {
      ...field.configuration,
      rules: field.configuration.rules.map((rule) => ({
        ...rule,
        ...(rule.binding === undefined
          ? {}
          : { binding: resolve(rule.binding) }),
      })),
    },
  };
}

export function useListenToWorldCategories(worldId: string | undefined) {
  const world = useWorldStore((store) => store.world);
  const settingKey = world?.settingKey;
  const configurationCustomized = world?.configurationCustomized;
  const loadedWorldId = world?.id;
  const listenToWorldCategories = useWorldCategoriesStore(
    (store) => store.listenToWorldCategories,
  );
  const resetStore = useWorldCategoriesStore((store) => store.reset);

  useEffect(() => {
    if (
      worldId &&
      loadedWorldId === worldId &&
      settingKey !== undefined &&
      configurationCustomized !== undefined
    ) {
      return listenToWorldCategories({
        id: worldId,
        settingKey,
        configurationCustomized,
      });
    }
  }, [
    worldId,
    loadedWorldId,
    settingKey,
    configurationCustomized,
    listenToWorldCategories,
  ]);

  useEffect(() => {
    if (!worldId) return;
    return () => {
      resetStore();
    };
  }, [worldId, resetStore]);
}

// Ordered field definitions for one category.
export function useWorldCategoryFieldDefinitions(
  categoryId: string | undefined,
): IWorldFieldDefinition[] {
  const definitions = useWorldCategoriesStore(
    (store) => store.fieldDefinitions,
  );
  return useMemo(
    () =>
      Object.values(definitions)
        .filter((definition) => definition.categoryId === categoryId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    [definitions, categoryId],
  );
}

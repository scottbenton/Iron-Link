import deepEqual from "fast-deep-equal";
import { useEffect, useRef } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { IconDefinition } from "types/Icon.type";
import type { Json } from "types/supabase-generated.type";

import { resolveOracleBinding } from "lib/effectivePlayset";
import type { WorldFieldConfiguration } from "lib/worldFieldRules";

import type {
  DefaultWorldFieldBinding,
  WorldConfigurationSubscription,
} from "repositories/worldConfiguration.repository";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";
import {
  IWorldCategoryCounts,
  IWorldConfiguration,
  WorldConfigurationService,
} from "services/worldConfiguration.service";
import {
  IWorldFieldDefinition,
  OracleBinding,
  WorldFieldDefinitionsService,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";

import { useWorldStore } from "./world.store";

interface WorldCategoriesStoreState {
  worldId: string;
  configurationCustomized: boolean;
  categories: Record<string, IWorldCategory>;
  // Field definitions are the categories' shape and are always needed with
  // them, so they load per world in the same store rather than a parallel one.
  // While the world inherits its defaults, bindings here are resolved against
  // the world's current playset.
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
  // Definitions exactly as stored, before inherited bindings are resolved.
  storedFieldDefinitions: Record<string, IWorldFieldDefinition>;
  // Null until the world's oracles load. An inherited world cannot be edited
  // before then: its first edit pins the bindings resolved with this map.
  replacementMap: Record<string, string> | null;
  defaultBindingsReady: boolean;
  loading: boolean;
  error?: string;
}

interface WorldCategoriesStoreActions {
  listenToWorldConfiguration: (worldId: string) => () => void;
  refreshWorldConfiguration: () => Promise<void>;
  applyReplacementMap: (
    worldId: string,
    replacementMap: Record<string, string>,
  ) => void;

  getCategoryCounts: (categoryId: string) => Promise<IWorldCategoryCounts>;

  createCategory: (category: {
    name: string;
    icon?: IconDefinition;
    sortOrder: number;
    supportsHierarchy?: boolean;
    supportsMap?: boolean;
    supportsBonds?: boolean;
  }) => Promise<string>;
  updateCategory: (
    categoryId: string,
    category: Partial<Omit<IWorldCategory, "id" | "worldId">>,
  ) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  reorderCategories: (categoryIds: string[]) => Promise<void>;

  createFieldDefinition: (
    categoryId: string,
    definition: {
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
      Omit<IWorldFieldDefinition, "id" | "worldId" | "categoryId" | "key">
    >,
  ) => Promise<void>;
  deleteFieldDefinition: (definitionId: string) => Promise<void>;
  reorderFieldDefinitions: (
    categoryId: string,
    definitionIds: string[],
  ) => Promise<void>;

  reset: () => void;
}

const defaultWorldCategoriesState: WorldCategoriesStoreState = {
  worldId: "",
  configurationCustomized: false,
  categories: {},
  fieldDefinitions: {},
  storedFieldDefinitions: {},
  replacementMap: null,
  defaultBindingsReady: false,
  loading: true,
  error: undefined,
};

export const useWorldCategoriesStore = createWithEqualityFn<
  WorldCategoriesStoreState & WorldCategoriesStoreActions
>()(
  immer((set, get) => {
    let subscription: WorldConfigurationSubscription | undefined;

    // Every edit goes through the configuration RPC, which copies inherited
    // defaults into the world first when needed. Waiting for a fresh read
    // means callers see their change as soon as the edit resolves.
    const edit = async <T>(
      mutate: (
        worldId: string,
        defaultBindings: DefaultWorldFieldBinding[] | undefined,
      ) => Promise<T>,
    ): Promise<T> => {
      const state = get();
      const result = await mutate(state.worldId, getDefaultBindings(state));
      await subscription?.refresh();
      return result;
    };

    return {
      ...defaultWorldCategoriesState,

      listenToWorldConfiguration: (worldId) => {
        set((state) => ({
          ...state,
          ...defaultWorldCategoriesState,
          // The oracles load independently; keep a map already resolved for
          // this world when the subscription restarts.
          replacementMap:
            state.worldId === worldId ? state.replacementMap : null,
          worldId,
        }));

        const worldSubscription =
          WorldConfigurationService.listenToWorldConfiguration(
            worldId,
            (configuration) => {
              set((state) => {
                if (state.worldId === worldId) {
                  applyConfiguration(state, configuration);
                }
              });
            },
            (error) => {
              console.error(error);
              set((state) => {
                if (state.worldId === worldId) {
                  state.loading = false;
                  state.error = "Failed to load world configuration";
                }
              });
            },
          );
        subscription = worldSubscription;

        return () => {
          worldSubscription.unsubscribe();
          if (subscription === worldSubscription) {
            subscription = undefined;
          }
        };
      },

      refreshWorldConfiguration: () => {
        return subscription?.refresh() ?? Promise.resolve();
      },

      applyReplacementMap: (worldId, replacementMap) => {
        set((state) => {
          if (state.worldId === worldId) {
            state.replacementMap = replacementMap;
            resolveFieldDefinitions(state);
          }
        });
      },

      getCategoryCounts: (categoryId) => {
        return WorldConfigurationService.getCategoryCounts(
          get().worldId,
          categoryId,
        );
      },

      createCategory: (category) => {
        return edit((worldId, defaultBindings) =>
          WorldCategoriesService.addWorldCategory(
            worldId,
            category,
            defaultBindings,
          ),
        );
      },
      updateCategory: (categoryId, category) => {
        return edit((worldId, defaultBindings) =>
          WorldCategoriesService.updateWorldCategory(
            worldId,
            categoryId,
            category,
            defaultBindings,
          ),
        );
      },
      // Cascades through the category's field definitions. The database
      // rejects deleting a category that still has entries.
      deleteCategory: (categoryId) => {
        return edit((worldId, defaultBindings) =>
          WorldCategoriesService.deleteWorldCategory(
            worldId,
            categoryId,
            defaultBindings,
          ),
        );
      },
      reorderCategories: (categoryIds) => {
        return edit((worldId, defaultBindings) =>
          WorldCategoriesService.reorderWorldCategories(
            worldId,
            categoryIds,
            defaultBindings,
          ),
        );
      },

      createFieldDefinition: (categoryId, definition) => {
        return edit((worldId, defaultBindings) =>
          WorldFieldDefinitionsService.addWorldFieldDefinition(
            worldId,
            categoryId,
            definition,
            defaultBindings,
          ),
        );
      },
      updateFieldDefinition: (definitionId, definition) => {
        return edit((worldId, defaultBindings) =>
          WorldFieldDefinitionsService.updateWorldFieldDefinition(
            worldId,
            definitionId,
            definition,
            defaultBindings,
          ),
        );
      },
      // Cascades to every value row for this definition.
      deleteFieldDefinition: (definitionId) => {
        return edit((worldId, defaultBindings) =>
          WorldFieldDefinitionsService.deleteWorldFieldDefinition(
            worldId,
            definitionId,
            defaultBindings,
          ),
        );
      },
      reorderFieldDefinitions: (categoryId, definitionIds) => {
        return edit((worldId, defaultBindings) =>
          WorldFieldDefinitionsService.reorderWorldFieldDefinitions(
            worldId,
            categoryId,
            definitionIds,
            defaultBindings,
          ),
        );
      },

      reset: () => {
        set((state) => ({ ...state, ...defaultWorldCategoriesState }));
      },
    };
  }),
  deepEqual,
);

// The configuration subscription for a world. Mount it wherever the world
// subscription is owned, so everything below can read the store.
export function useListenToWorldConfiguration(worldId: string | undefined) {
  const listenToWorldConfiguration = useWorldCategoriesStore(
    (store) => store.listenToWorldConfiguration,
  );
  const refreshWorldConfiguration = useWorldCategoriesStore(
    (store) => store.refreshWorldConfiguration,
  );
  const resetStore = useWorldCategoriesStore((store) => store.reset);

  // A setting change replaces inherited defaults without touching any
  // category or field rows, so only the world row announces it.
  const settingKey = useWorldStore((store) =>
    store.world?.id === worldId ? store.world?.settingKey : undefined,
  );

  useEffect(() => {
    if (worldId) {
      return listenToWorldConfiguration(worldId);
    }
  }, [worldId, listenToWorldConfiguration]);

  const previousSettingKey = useRef(settingKey);
  useEffect(() => {
    const previous = previousSettingKey.current;
    previousSettingKey.current = settingKey;
    if (previous !== undefined && settingKey !== undefined) {
      refreshWorldConfiguration().catch(() => {});
    }
  }, [settingKey, refreshWorldConfiguration]);

  useEffect(() => {
    return () => {
      resetStore();
    };
  }, [worldId, resetStore]);
}

function applyConfiguration(
  state: WorldCategoriesStoreState,
  configuration: IWorldConfiguration,
) {
  state.configurationCustomized = configuration.configurationCustomized;
  state.categories = configuration.categories;
  state.storedFieldDefinitions = configuration.fieldDefinitions;
  state.loading = false;
  state.error = undefined;
  resolveFieldDefinitions(state);
}

// Inherited bindings follow the current playset, so they are re-resolved
// whenever it changes. Customized bindings keep their stored roll targets
// until someone deliberately rebinds them.
function resolveFieldDefinitions(state: WorldCategoriesStoreState) {
  state.defaultBindingsReady =
    state.configurationCustomized || state.replacementMap !== null;
  if (state.configurationCustomized || !state.replacementMap) {
    state.fieldDefinitions = state.storedFieldDefinitions;
    return;
  }
  const replacementMap = state.replacementMap;
  const resolve = (binding: OracleBinding | null): OracleBinding | null =>
    binding && {
      ...binding,
      resolvedOracleId: resolveOracleBinding(binding, replacementMap),
    };
  state.fieldDefinitions = Object.fromEntries(
    Object.entries(state.storedFieldDefinitions).map(([id, field]) => [
      id,
      {
        ...field,
        binding: resolve(field.binding),
        configuration: {
          ...field.configuration,
          rules: field.configuration.rules.map((rule) =>
            rule.binding === undefined
              ? rule
              : { ...rule, binding: resolve(rule.binding) },
          ),
        },
      },
    ]),
  );
}

// The first edit of an inherited world pins the bindings as they currently
// resolve. Customized worlds already store theirs.
function getDefaultBindings(
  state: WorldCategoriesStoreState,
): DefaultWorldFieldBinding[] | undefined {
  if (state.configurationCustomized) return undefined;
  if (!state.defaultBindingsReady) {
    throw new Error(
      "Wait for this world's oracles to finish loading, then try again.",
    );
  }
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

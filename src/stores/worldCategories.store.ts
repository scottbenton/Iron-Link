import deepEqual from "fast-deep-equal";
import { useEffect, useMemo } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { IconDefinition } from "types/Icon.type";
import type { Json } from "types/supabase-generated.type";

import { getWorldDefaultConfiguration } from "lib/worldDefaultConfiguration";
import type { WorldFieldConfiguration } from "lib/worldFieldRules";

import type { DefaultWorldFieldBinding } from "repositories/worldConfiguration.repository";

import {
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";
import {
  IWorldFieldDefinition,
  OracleBinding,
  WorldFieldDefinitionsService,
  WorldFieldType,
} from "services/worldFieldDefinitions.service";
import type { IWorld } from "services/worlds.service";

import { useWorldStore } from "./world.store";

interface WorldCategoriesStoreState {
  worldId: string;
  settingKey: string | null;
  configurationCustomized: boolean;
  defaultBindingsReady: boolean;
  categories: Record<string, IWorldCategory>;
  // Field definitions are the categories' shape and are always needed with
  // them, so they load per world in the same store rather than a parallel one.
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
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
  categories: {},
  fieldDefinitions: {},
  loading: true,
  error: undefined,
};

export const useWorldCategoriesStore = createWithEqualityFn<
  WorldCategoriesStoreState & WorldCategoriesStoreActions
>()(
  immer((set, get) => ({
    ...defaultWorldCategoriesState,

    invalidateDefaultBindings: (worldId) => {
      if (get().worldId === worldId && !get().configurationCustomized)
        set({ defaultBindingsReady: false });
    },

    applyDefaultReplacementMap: (worldId, replacementMap) => {
      const state = get();
      if (state.worldId !== worldId || state.configurationCustomized) return;
      const defaults = getWorldDefaultConfiguration(
        worldId,
        state.settingKey,
        replacementMap,
      );
      if (
        !state.defaultBindingsReady ||
        !deepEqual(defaults.fieldDefinitions, state.fieldDefinitions)
      ) {
        set({ ...defaults, defaultBindingsReady: true });
      }
    },

    listenToWorldCategories: (world) => {
      const worldId = world.id;
      set({
        ...defaultWorldCategoriesState,
        worldId,
        settingKey: world.settingKey,
        configurationCustomized: world.configurationCustomized,
      });
      if (!world.configurationCustomized) {
        set({
          ...getWorldDefaultConfiguration(worldId, world.settingKey),
          loading: false,
        });
        return () => {};
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
            if (!active) return;
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
              state.loading =
                !definitionsError && !(categoriesReady && definitionsReady);
              state.error = definitionsError;
            });
          },
          (error) => {
            if (!active) return;
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
            if (!active) return;
            definitionsReady ||= !!replaceState;
            definitionsError = undefined;
            set((state) => {
              if (state.worldId !== worldId) return;
              state.loading =
                !categoriesError && !(categoriesReady && definitionsReady);
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
            });
          },
          (error) => {
            if (!active) return;
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

    createCategory: (worldId, category) => {
      return WorldCategoriesService.addWorldCategory(
        worldId,
        category,
        getDefaultBindings(get()),
      );
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

    reorderCategories: (ids) =>
      WorldCategoriesService.reorderCategories(
        get().worldId,
        ids,
        getDefaultBindings(get()),
      ),
    reorderFields: (categoryId, ids) =>
      WorldCategoriesService.reorderFields(
        get().worldId,
        categoryId,
        ids,
        getDefaultBindings(get()),
      ),

    reset: () => {
      set((store) => ({ ...store, ...defaultWorldCategoriesState }));
    },
  })),
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

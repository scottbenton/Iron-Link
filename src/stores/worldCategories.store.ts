import deepEqual from "fast-deep-equal";
import { useEffect, useMemo } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { IconDefinition } from "types/Icon.type";

import type { WorldFieldConfiguration } from "lib/worldFieldRules";

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

interface WorldCategoriesStoreState {
  worldId: string;
  categories: Record<string, IWorldCategory>;
  // Field definitions are the categories' shape and are always needed with
  // them, so they load per world in the same store rather than a parallel one.
  fieldDefinitions: Record<string, IWorldFieldDefinition>;
  loading: boolean;
  error?: string;
}

interface WorldCategoriesStoreActions {
  listenToWorldCategories: (worldId: string) => () => void;

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
  categories: {},
  fieldDefinitions: {},
  loading: true,
  error: undefined,
};

export const useWorldCategoriesStore = createWithEqualityFn<
  WorldCategoriesStoreState & WorldCategoriesStoreActions
>()(
  immer((set) => ({
    ...defaultWorldCategoriesState,

    listenToWorldCategories: (worldId) => {
      let active = true;
      let categoriesReady = false;
      let definitionsReady = false;
      let categoriesError: string | undefined;
      let definitionsError: string | undefined;
      set((state) => ({ ...state, ...defaultWorldCategoriesState, worldId }));
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
      return WorldCategoriesService.addWorldCategory(worldId, category);
    },
    updateCategory: (categoryId, category) => {
      return WorldCategoriesService.updateWorldCategory(categoryId, category);
    },
    // Cascades through the category's field definitions, its entries, and
    // their values. Callers must confirm with the entry count first.
    deleteCategory: (categoryId) => {
      return WorldCategoriesService.deleteWorldCategory(categoryId);
    },

    createFieldDefinition: (worldId, categoryId, definition) => {
      return WorldFieldDefinitionsService.addWorldFieldDefinition(
        worldId,
        categoryId,
        definition,
      );
    },
    updateFieldDefinition: (definitionId, definition) => {
      return WorldFieldDefinitionsService.updateWorldFieldDefinition(
        definitionId,
        definition,
      );
    },
    deleteFieldDefinition: (definitionId) => {
      return WorldFieldDefinitionsService.deleteWorldFieldDefinition(
        definitionId,
      );
    },

    reset: () => {
      set((store) => ({ ...store, ...defaultWorldCategoriesState }));
    },
  })),
  deepEqual,
);

export function useListenToWorldCategories(worldId: string | undefined) {
  const listenToWorldCategories = useWorldCategoriesStore(
    (store) => store.listenToWorldCategories,
  );
  const resetStore = useWorldCategoriesStore((store) => store.reset);

  useEffect(() => {
    if (worldId) {
      return listenToWorldCategories(worldId);
    }
  }, [worldId, listenToWorldCategories]);

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

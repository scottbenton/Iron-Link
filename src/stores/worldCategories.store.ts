import deepEqual from "fast-deep-equal";
import { useEffect } from "react";
import { immer } from "zustand/middleware/immer";
import { createWithEqualityFn } from "zustand/traditional";

import { IconDefinition } from "types/Icon.type";

import {
  FieldDefinition,
  IWorldCategory,
  WorldCategoriesService,
} from "services/worldCategories.service";

interface WorldCategoriesStoreState {
  categories: Record<string, IWorldCategory>;
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
      fieldDefinitions?: FieldDefinition[];
    },
  ) => Promise<string>;
  updateCategory: (
    categoryId: string,
    category: Partial<Omit<IWorldCategory, "id" | "worldId">>,
  ) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  reset: () => void;
}

const defaultWorldCategoriesState: WorldCategoriesStoreState = {
  categories: {},
  loading: true,
};

export const useWorldCategoriesStore = createWithEqualityFn<
  WorldCategoriesStoreState & WorldCategoriesStoreActions
>()(
  immer((set) => ({
    ...defaultWorldCategoriesState,

    listenToWorldCategories: (worldId) => {
      return WorldCategoriesService.listenToWorldCategories(
        worldId,
        (changedCategories, removedCategoryIds, replaceState) => {
          set((state) => {
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
            state.loading = false;
            state.error = undefined;
          });
        },
        (error) => {
          console.error(error);
          set((state) => {
            state.loading = false;
            state.error = error.message;
          });
        },
      );
    },

    createCategory: (worldId, category) => {
      return WorldCategoriesService.addWorldCategory(worldId, category);
    },
    updateCategory: (categoryId, category) => {
      return WorldCategoriesService.updateWorldCategory(categoryId, category);
    },
    deleteCategory: (categoryId) => {
      return WorldCategoriesService.deleteWorldCategory(categoryId);
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

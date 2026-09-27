import { create } from "zustand";

// Notes tabs unmount inactive views. Retain only the selected category identity,
// scoped to its world; entry data remains in the mounted permission-aware view.
export const useWorldCategoryNavigationStore = create<{
  selectedCategoryIds: Record<string, string>;
  selectCategory: (worldId: string, categoryId?: string) => void;
}>((set) => ({
  selectedCategoryIds: {},
  selectCategory: (worldId, categoryId) =>
    set((state) => {
      const selectedCategoryIds = { ...state.selectedCategoryIds };
      if (categoryId) selectedCategoryIds[worldId] = categoryId;
      else delete selectedCategoryIds[worldId];
      return { selectedCategoryIds };
    }),
}));

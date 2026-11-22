import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { IWorldCategory } from "services/worldCategories.service";

export type WorldEntryLayout = "grid" | "list";

export const worldEntryLayoutLocalStorageKey = "iron-link-world-entry-layouts";

// How this device shows each category's entries, and which branches of a
// nesting category's list are open. Per device, keyed by category id, so
// Locations can be a tree while NPCs stay a grid.
export const useWorldEntryLayoutStore = create<{
  layouts: Record<string, WorldEntryLayout>;
  expanded: Record<string, string[]>;
  setLayout: (categoryId: string, layout: WorldEntryLayout) => void;
  setExpanded: (categoryId: string, entryId: string, open: boolean) => void;
}>()(
  persist(
    (set) => ({
      layouts: {},
      expanded: {},
      setLayout: (categoryId, layout) =>
        set((state) => ({
          layouts: { ...state.layouts, [categoryId]: layout },
        })),
      setExpanded: (categoryId, entryId, open) =>
        set((state) => {
          const current = state.expanded[categoryId] ?? [];
          if (current.includes(entryId) === open) return state;
          return {
            expanded: {
              ...state.expanded,
              [categoryId]: open
                ? [...current, entryId]
                : current.filter((id) => id !== entryId),
            },
          };
        }),
    }),
    {
      name: worldEntryLayoutLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// A category that nests entries opens as a list (its tree) until this device
// picks otherwise; the rest open as a grid of cards.
export function getDefaultWorldEntryLayout(
  category: Pick<IWorldCategory, "supportsHierarchy">,
): WorldEntryLayout {
  return category.supportsHierarchy ? "list" : "grid";
}

export function useWorldEntryLayout(
  category: Pick<IWorldCategory, "id" | "supportsHierarchy">,
): WorldEntryLayout {
  const stored = useWorldEntryLayoutStore(
    (state) => state.layouts[category.id],
  );
  return stored ?? getDefaultWorldEntryLayout(category);
}

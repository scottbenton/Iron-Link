import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  ReferenceSection,
  ReferenceSource,
  ReferenceTab,
} from "../data/referenceTabs";

export const referenceSettingsLocalStorageKey = "iron-link-reference-settings";

// Per device reference settings: the tab used last, each tab's Sources
// filter, and the item last open in each tab's sections, so moving between
// tabs keeps each one's place.
interface ReferenceSettingsState {
  lastTabId: string | undefined;
  sourceVisibility: Record<string, Record<string, boolean>>;
  lastItemIds: Record<string, Partial<Record<ReferenceSection, string>>>;

  setLastTabId: (tabId: string) => void;
  setSourceVisible: (
    tabId: string,
    sourceKey: string,
    visible: boolean,
  ) => void;
  setLastItemId: (
    tabId: string,
    section: ReferenceSection,
    itemId: string | undefined,
  ) => void;
}

export const useReferenceSettings = create<ReferenceSettingsState>()(
  persist(
    (set) => ({
      lastTabId: undefined,
      sourceVisibility: {},
      lastItemIds: {},

      setLastTabId: (tabId) =>
        set((state) =>
          state.lastTabId === tabId ? state : { lastTabId: tabId },
        ),
      setSourceVisible: (tabId, sourceKey, visible) =>
        set((state) => ({
          sourceVisibility: {
            ...state.sourceVisibility,
            [tabId]: {
              ...state.sourceVisibility[tabId],
              [sourceKey]: visible,
            },
          },
        })),
      setLastItemId: (tabId, section, itemId) =>
        set((state) =>
          state.lastItemIds[tabId]?.[section] === itemId
            ? state
            : {
                lastItemIds: {
                  ...state.lastItemIds,
                  [tabId]: { ...state.lastItemIds[tabId], [section]: itemId },
                },
              },
        ),
    }),
    {
      name: referenceSettingsLocalStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastTabId: state.lastTabId,
        sourceVisibility: state.sourceVisibility,
        lastItemIds: state.lastItemIds,
      }),
    },
  ),
);

export function isSourceChecked(
  source: ReferenceSource,
  overrides: Record<string, boolean> | undefined,
): boolean {
  return overrides?.[source.key] ?? source.defaultVisible;
}

// Whether a source shows in the lists: ticked, and so is everything it
// depends on.
export function isSourceShown(
  tab: ReferenceTab,
  source: ReferenceSource,
  overrides: Record<string, boolean> | undefined,
): boolean {
  if (!isSourceChecked(source, overrides)) return false;
  return (source.dependsOn ?? []).every((dependencyKey) => {
    const dependency = tab.sources.find((s) => s.key === dependencyKey);
    return dependency ? isSourceShown(tab, dependency, overrides) : true;
  });
}

// Whether an item from a package shows in a section's list of a tab.
export function isPackageShown(
  tab: ReferenceTab,
  section: ReferenceSection,
  packageId: string | undefined,
  overrides: Record<string, boolean> | undefined,
): boolean {
  if (!packageId) return true;
  const source = tab.sources.find(
    (s) =>
      s.packageId === packageId &&
      (!s.sections || s.sections.includes(section)),
  );
  return source ? isSourceShown(tab, source, overrides) : true;
}

import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";
import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getItemName } from "../FolderView/getFolderName";

// What each open Notes tab is called: a note's title, a folder's name, or
// the world page it shows. The tab strip and the phone's open notes list
// share it.
export function useNoteTabLabels(): (tabId: string) => string {
  const { t } = useTranslation();

  const openTabs = useNotesStore((store) => store.noteTabItems);
  const itemNames = useNotesStore((store) => {
    return Object.fromEntries(
      Object.entries(store.noteTabItems).map(([key, value]) => {
        if (value.type === "world") {
          // Resolved from the world store below - the notes store knows
          // nothing about worlds beyond the tab bookkeeping.
          return [key, null];
        }
        if (value.type === "folder") {
          const folder = store.folderState.folders[value.itemId];
          return [
            key,
            getItemName({
              name: folder?.name,
              isRootPlayerFolder: folder?.isRootPlayerFolder ?? false,
              t,
            }),
          ];
        } else {
          const note = store.noteState.notes[value.itemId];
          if (note) {
            return [key, note.title];
          }
          return [key, t("common.unknown", "Unknown")];
        }
      }),
    );
  });
  const world = useWorldStore((store) => store.world);
  const categories = useWorldCategoriesStore((store) => store.categories);
  // Entries load only while a category or entry tab is showing.
  const entryNames = useWorldEntriesStore((store) =>
    Object.fromEntries(
      Object.values(openTabs).flatMap((item) => {
        const entry =
          item.worldView?.type === "entry"
            ? store.entryState.entries[item.worldView.entryId]
            : undefined;
        return entry?.worldId === item.itemId ? [[entry.id, entry.name]] : [];
      }),
    ),
  );
  const worldTabLabel = (tabId: string) => {
    const item = openTabs[tabId];
    const view = item?.worldView ?? { type: "world" };
    if (view.type === "settings")
      return t("worlds.settings.title", "World settings");
    if (view.type === "entry") {
      return entryNames[view.entryId] ?? t("worlds.entries.unknown", "Entry");
    }
    if ("categoryId" in view) {
      const category = categories[view.categoryId];
      const name =
        category?.worldId === item?.itemId
          ? category.name
          : t("worlds.categories.unknown", "Category");
      return view.type === "category-settings"
        ? t("worlds.categories.settings-named", "{{name}} settings", { name })
        : name;
    }
    return world && world.id === item?.itemId
      ? world.name
      : t("worlds.tab.world", "World");
  };

  return (tabId: string) => itemNames[tabId] ?? worldTabLabel(tabId);
}

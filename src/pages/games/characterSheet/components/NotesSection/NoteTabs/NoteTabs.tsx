import { useTranslation } from "react-i18next";

import { ErrorBoundary } from "components/ErrorBoundary";

import { NoteTabPanel, NoteTabs as NoteTabStrip } from "ui/components/Tabs";
import { EmptyState } from "ui/layout/EmptyState";
import { Flex } from "ui/primitives";

import { notesDestinationKey } from "pages/games/gamePageLayout/hooks/notesDestination";

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";
import { useWorldStore } from "stores/world.store";
import { useWorldCategoriesStore } from "stores/worldCategories.store";
import { useWorldEntriesStore } from "stores/worldEntries.store";

import { getItemName } from "../FolderView/getFolderName";
import { NoteTabContents } from "./NoteTabContents";

export function NoteTabs() {
  const { t } = useTranslation();

  const openTabs = useNotesStore((store) => store.noteTabItems);
  const tabOrder = useNotesStore((store) => store.noteTabOrder);
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
    const view = item.worldView ?? { type: "world" };
    if (view.type === "settings")
      return t("worlds.settings.title", "World settings");
    if (view.type === "truths") return t("worlds.truths.title", "Truths");
    if (view.type === "entry") {
      return entryNames[view.entryId] ?? t("worlds.entries.unknown", "Entry");
    }
    if ("categoryId" in view) {
      const category = categories[view.categoryId];
      const name =
        category?.worldId === item.itemId
          ? category.name
          : t("worlds.categories.unknown", "Category");
      return view.type === "category-settings"
        ? t("worlds.categories.settings-named", "{{name}} settings", { name })
        : name;
    }
    return world?.id === item.itemId
      ? world.name
      : t("worlds.tab.world", "World");
  };

  const activeTab = useNotesStore((store) => store.openTabId);
  const setActiveTab = useNotesStore((store) => store.switchToTab);
  const closeTab = useNotesStore((store) => store.closeTab);
  const openNewTab = useNotesStore((store) => store.openItemTab);

  const uid = useUID();
  const defaultTab = useNotesStore((store) =>
    uid ? getPlayerNotesFolder(uid, store.folderState.folders) : null,
  );
  const rootPlayerFolder = useNotesStore((store) =>
    uid ? getPlayerNotesFolder(uid, store.folderState.folders) : undefined,
  );
  const folders = useNotesStore((store) => store.folderState.folders);

  return (
    <NoteTabStrip
      tabs={tabOrder.map((tabId) => ({
        id: tabId,
        label: itemNames[tabId] ?? worldTabLabel(tabId),
      }))}
      value={activeTab ?? null}
      onValueChange={setActiveTab}
      onClose={closeTab}
      onAdd={
        defaultTab
          ? () =>
              openNewTab({
                type: "folder",
                id: defaultTab.id,
                openInBackground: false,
                replaceCurrent: false,
              })
          : undefined
      }
      aria-label={t("notes.tabs.label", "Open notes")}
      addLabel={t("notes.tabs.new-tab", "Open new tab")}
      closeLabel={(label) =>
        t("notes.tabs.close", "Close {{label}}", { label })
      }
      css={{ height: "100%" }}
    >
      {activeTab && openTabs[activeTab] && (
        <NoteTabPanel key={activeTab} value={activeTab}>
          <Flex flexDirection="column" minHeight="100%">
            {/* Keyed by destination so opening something else in the tab
                clears a crash. A link can name anything, including what
                this person cannot read. */}
            <ErrorBoundary
              key={notesDestinationKey(openTabs[activeTab])}
              fallback={
                <EmptyState
                  title={t("notes.tab-error-title", "Something went wrong")}
                  message={t(
                    "notes.tab-error",
                    "This tab could not be shown. Close it or open something else.",
                  )}
                  css={{ marginBlockStart: "8" }}
                />
              }
            >
              <NoteTabContents
                tabItem={openTabs[activeTab]}
                folderExists={!!folders[openTabs[activeTab].itemId]}
                isRootPlayerFolder={
                  rootPlayerFolder?.id === openTabs[activeTab].itemId
                }
              />
            </ErrorBoundary>
          </Flex>
        </NoteTabPanel>
      )}
    </NoteTabStrip>
  );
}

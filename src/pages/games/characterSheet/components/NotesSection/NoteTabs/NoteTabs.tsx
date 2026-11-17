import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";

import { ErrorBoundary } from "components/ErrorBoundary";
import { EmptyState } from "components/Layout/EmptyState";

import { notesDestinationKey } from "pages/games/gamePageLayout/hooks/notesDestination";

import { useIsMobile } from "hooks/useIsMobile";
import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { FolderView, FolderViewToolbar } from "../FolderView";
import { OpenItemWrapper } from "../Layout";
import { NoteView } from "../NoteView";
import { GameWorldView } from "../WorldView/GameWorldView";
import { MobileNoteTabsHeader } from "./MobileNoteTabsHeader";
import { NoteTab } from "./NoteTab";
import { useNoteTabLabels } from "./useNoteTabLabels";

export function NoteTabs() {
  const { t } = useTranslation();

  const openTabs = useNotesStore((store) => store.noteTabItems);
  const tabOrder = useNotesStore((store) => store.noteTabOrder);
  const getTabLabel = useNoteTabLabels();
  const isMobile = useIsMobile();

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
    <Box height={"100%"} display="flex" flexDirection="column">
      {isMobile ? (
        <MobileNoteTabsHeader getTabLabel={getTabLabel} />
      ) : (
        <Box
          bgcolor="background.default"
          borderColor="divider"
          display="flex"
          flexShrink={0}
        >
          {defaultTab && (
            <Box pl={1} display="flex" alignItems="center">
              <IconButton
                size="small"
                aria-label={t("notes.tabs.new-tab", "Open new tab")}
                onClick={() =>
                  openNewTab({
                    type: "folder",
                    id: defaultTab.id,
                    openInBackground: false,
                    replaceCurrent: false,
                  })
                }
                sx={{
                  mr: 1,
                  [TOUCH_DEVICE_MEDIA_QUERY]: {
                    width: TOUCH_TARGET_SIZE,
                    height: TOUCH_TARGET_SIZE,
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Box>
          )}
          <Tabs
            value={activeTab ?? null}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ minHeight: 0 }}
            variant="scrollable"
            // Do not re-enable the scroller's scrollbar here. MUI hides it by
            // applying a negative margin-bottom equal to the measured scrollbar
            // height; making it visible again leaves that margin in place, which
            // detaches the selection indicator from the tabs by exactly a
            // scrollbar's height and makes one flash in whenever the strip is
            // re-measured. Scroll buttons cover overflow instead.
            scrollButtons="auto"
          >
            {tabOrder.map((tabId) => (
              <NoteTab
                name={getTabLabel(tabId)}
                onClose={() => closeTab(tabId)}
                value={tabId}
                key={tabId}
                id={`note-tab-${tabId}`}
                aria-controls={`note-tabpanel-${tabId}`}
                onAuxClick={(event) => {
                  if (event.button === 1) closeTab(tabId);
                }}
                onMouseDown={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    return false;
                  }
                }}
              />
            ))}
          </Tabs>
        </Box>
      )}
      {tabOrder.map((tabId) => {
        const tabItem = openTabs[tabId];
        if (activeTab !== tabId) {
          return null;
        }
        return (
          <Box
            key={tabId}
            hidden={activeTab !== tabId}
            // Phones show the open note's name above it instead of tabs.
            {...(isMobile
              ? {}
              : {
                  role: "tabpanel",
                  id: `note-tabpanel-${tabId}`,
                  "aria-labelledby": `note-tab-${tabId}`,
                })}
            flexGrow={1}
            display="flex"
            flexDirection={"column"}
            overflow="auto"
          >
            {/* Keyed by destination so opening something else in the tab
                clears a crash. A link can name anything, including what
                this person cannot read. */}
            <ErrorBoundary
              key={notesDestinationKey(tabItem)}
              fallback={
                <EmptyState
                  title={t("notes.tab-error-title", "Something went wrong")}
                  message={t(
                    "notes.tab-error",
                    "This tab could not be shown. Close it or open something else.",
                  )}
                  sx={{ mt: 4 }}
                />
              }
            >
              {tabItem.type === "world" ? (
                <GameWorldView
                  worldId={tabItem.itemId}
                  worldView={tabItem.worldView}
                />
              ) : tabItem.type === "folder" && !folders[tabItem.itemId] ? (
                // Unreadable folders are filtered out, like deleted ones.
                <EmptyState
                  title={t("notes.folder-missing-title", "Folder unavailable")}
                  message={t(
                    "notes.folder-missing",
                    "This folder was deleted, or you do not have access to it.",
                  )}
                  sx={{ mt: 4 }}
                />
              ) : tabItem.type === "folder" ? (
                <>
                  <FolderViewToolbar folderId={tabItem.itemId} />
                  <OpenItemWrapper sx={{ flexGrow: 1 }}>
                    <FolderView folderId={tabItem.itemId} />
                    {rootPlayerFolder?.id === tabItem.itemId && (
                      <FolderView folderId={undefined} />
                    )}
                  </OpenItemWrapper>
                </>
              ) : (
                <NoteView openNoteId={tabItem.itemId} />
              )}
            </ErrorBoundary>
          </Box>
        );
      })}
    </Box>
  );
}

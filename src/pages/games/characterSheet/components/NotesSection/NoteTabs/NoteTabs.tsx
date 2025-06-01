import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";

import { WorldSelectionPage } from "components/worlds/WorldSelectionPage";

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { FolderView, FolderViewToolbar } from "../FolderView";
import { getItemName } from "../FolderView/getFolderName";
import { OpenItemWrapper } from "../Layout";
import { NoteView } from "../NoteView";

export function NoteTabs() {
  const { t } = useTranslation();

  const openTabs = useNotesStore((store) => store.noteTabItems);
  console.debug("NoteTabs openTabs", openTabs);
  const tabOrder = useNotesStore((store) => store.noteTabOrder);
  const itemNames = useNotesStore((store) => {
    return Object.fromEntries(
      Object.entries(store.noteTabItems).map(([key, value]) => {
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

  return (
    <Box height={"100%"} display="flex" flexDirection="column">
      <Box
        bgcolor="background.default"
        // borderBottom={1}
        borderColor="divider"
        display="flex"
        flexShrink={0}
      >
        {defaultTab && (
          <Box pl={1} display="flex" alignItems="center">
            <IconButton
              size="small"
              onClick={() =>
                openNewTab({
                  type: "folder",
                  id: defaultTab.id,
                  openInBackground: false,
                  replaceCurrent: false,
                })
              }
              sx={{ mr: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Box>
        )}
        <Tabs
          value={activeTab ?? null}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            minHeight: 0,
            "& .MuiTabs-scroller.MuiTabs-hideScrollbar.MuiTabs-scrollableX": {
              scrollbarWidth: "thin",
            },
          }}
          variant="scrollable"
          scrollButtons={false}
        >
          {tabOrder.map((tabId) => (
            <Tab
              sx={(theme) => ({
                textTransform: "none",
                "&.Mui-selected": {
                  backgroundColor: "background.paper",
                  "& .close-tab-button": { visibility: "visible" },
                },
                borderRight: 1,
                borderColor:
                  theme.palette.grey[
                    theme.palette.mode === "light" ? 200 : 800
                  ],
                py: 0.5,
                minHeight: 0,
                pr: 0.5,
                "& .close-tab-button": {
                  visibility: "hidden",
                },
                "&:hover .close-tab-button": {
                  visibility: "visible",
                },
              })} // Add border to the left of each tab except the first one
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  {itemNames[tabId]}
                  <IconButton
                    className="close-tab-button"
                    component="span"
                    size="small"
                    role="button"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      closeTab(tabId);
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              }
              value={tabId}
              key={tabId}
              id={`note-tab-${tabId}`}
              aria-controls={`note-tabpanel-${tabId}`}
              onAuxClick={() => closeTab(tabId)}
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
      {tabOrder.map((tabId) => {
        const tabItem = openTabs[tabId];
        if (activeTab !== tabId) {
          return null;
        }
        return (
          <Box
            px={1}
            key={tabId}
            role="tabpanel"
            hidden={activeTab !== tabId}
            id={`note-tabpanel-${tabId}`}
            aria-labelledby={`note-tab-${tabId}`}
            flexGrow={1}
            display="flex"
            flexDirection={"column"}
            overflow="auto"
          >
            {tabItem.type === "folder" && (
              <>
                <FolderViewToolbar folderId={tabItem.itemId} />
                <OpenItemWrapper sx={{ mx: -1, flexGrow: 1 }}>
                  <FolderView
                    isRootFolder={rootPlayerFolder?.id === tabItem.itemId}
                    folderId={tabItem.itemId}
                  />
                </OpenItemWrapper>
              </>
            )}
            {tabItem.type === "note" && (
              <NoteView openNoteId={tabItem.itemId} />
            )}
            {tabItem.type === "world" && (
              <>
                <WorldSelectionPage />
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

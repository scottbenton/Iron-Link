import AddIcon from "@mui/icons-material/Add";
import { Box, IconButton, Tabs } from "@mui/material";

import { WorldSelectionPage } from "components/worlds/SelectAWorld";

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { FolderView, FolderViewToolbar } from "../FolderView";
import { NoteSectionToolbar, OpenItemWrapper } from "../Layout";
import { NoteView } from "../NoteView";
import { NoteTab } from "./NoteTab";

export function NoteTabs() {
  const openTabs = useNotesStore((store) => store.noteTabItems);
  const tabOrder = useNotesStore((store) => store.noteTabOrder);

  const activeTab = useNotesStore((store) => store.openTabId);
  const setActiveTab = useNotesStore((store) => store.switchToTab);
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
            <NoteTab
              key={tabId}
              itemType={openTabs[tabId].type}
              itemId={openTabs[tabId].itemId}
              value={tabId}
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
                <NoteSectionToolbar />
                <WorldSelectionPage />
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";

import { FolderView, FolderViewToolbar } from "../FolderView";
import { getItemName } from "../FolderView/getFolderName";
import { OpenItemWrapper } from "../Layout";
import { NoteView } from "../NoteView";

export function NoteTabs() {
  const { t } = useTranslation();

  const openTabs = useNotesStore((store) => store.noteTabItems);
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

  return (
    <Box>
      <Box
        bgcolor="background.default"
        // borderBottom={1}
        borderColor="divider"
        flexGrow={1}
      >
        <Tabs
          value={activeTab ?? null}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ minHeight: 0 }}
          variant="scrollable"
          scrollButtons="auto"
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
        return (
          <Box
            px={1}
            key={tabId}
            role="tabpanel"
            hidden={activeTab !== tabId}
            id={`note-tabpanel-${tabId}`}
            aria-labelledby={`note-tab-${tabId}`}
          >
            {activeTab === tabId && (
              <Box>
                {tabItem.type === "folder" ? (
                  <>
                    <FolderViewToolbar folderId={tabItem.itemId} />
                    <OpenItemWrapper sx={{ mx: -1, flexGrow: 1 }}>
                      <FolderView folderId={tabItem.itemId} />
                      {/* {isRootPlayerFolder && <FolderView folderId={undefined} />} */}
                    </OpenItemWrapper>
                  </>
                ) : (
                  <NoteView openNoteId={tabItem.itemId} />
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import {
  TOUCH_DEVICE_MEDIA_QUERY,
  TOUCH_TARGET_SIZE,
} from "hooks/useIsTouchDevice";

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { NameItemDialog } from "../FolderView/NameItemDialog";
import { OpenNotesSheet } from "./OpenNotesSheet";

// The most the count box spells out; past it, it reads "99+".
const MAX_SHOWN_COUNT = 99;

export interface MobileNoteTabsHeaderProps {
  getTabLabel: (tabId: string) => string;
}

// Phones have no room for the Notes tab strip, so the open note's name sits
// in a row with a count of how many are open, which lists them in a sheet,
// like a phone browser's tab button.
export function MobileNoteTabsHeader(props: MobileNoteTabsHeaderProps) {
  const { getTabLabel } = props;
  const { t } = useTranslation();

  const gameId = useGameId();
  const uid = useUID();

  const openTabs = useNotesStore((store) => store.noteTabItems);
  const tabOrder = useNotesStore((store) => store.noteTabOrder);
  const activeTab = useNotesStore((store) => store.openTabId);
  const switchToTab = useNotesStore((store) => store.switchToTab);
  const closeTab = useNotesStore((store) => store.closeTab);
  const openItemTab = useNotesStore((store) => store.openItemTab);
  const createNote = useNotesStore((store) => store.createNote);

  const playerFolderId = useNotesStore((store) =>
    uid ? getPlayerNotesFolder(uid, store.folderState.folders)?.id : undefined,
  );
  const nextNoteOrder = useNotesStore((store) => {
    let highestOrder = Number.MIN_VALUE;
    Object.values(store.noteState.notes).forEach((note) => {
      if (note.parentFolderId === playerFolderId && note.order > highestOrder) {
        highestOrder = note.order;
      }
    });
    return highestOrder + 1;
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  // New note waits for the sheet to finish closing before asking for a
  // name, so the name dialog hands focus back to the count box.
  const newNoteRequested = useRef(false);

  const count = tabOrder.length;
  const title = activeTab ? getTabLabel(activeTab) : "";

  const handleCreateNote = (name: string) => {
    if (!uid || !playerFolderId) return;
    createNote(gameId, uid, playerFolderId, name, nextNoteOrder)
      .then((noteId) =>
        openItemTab({ type: "note", id: noteId, replaceCurrent: false }),
      )
      .catch(() => {});
  };

  const handleAllNotes = () => {
    if (!playerFolderId) return;
    setSheetOpen(false);
    const existingTab = tabOrder.find(
      (tabId) =>
        openTabs[tabId]?.type === "folder" &&
        openTabs[tabId]?.itemId === playerFolderId,
    );
    if (existingTab) {
      switchToTab(existingTab);
    } else {
      openItemTab({
        type: "folder",
        id: playerFolderId,
        replaceCurrent: false,
      });
    }
  };

  return (
    <>
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: 52,
          pl: 2,
          pr: 0.75,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography
          component={"p"}
          noWrap
          sx={{ flexGrow: 1, minWidth: 0, fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Tooltip title={t("notes.open-notes.title", "Open notes")}>
          <IconButton
            aria-label={t(
              "notes.open-notes.count-label",
              "Open notes, {{count}}",
              {
                count,
              },
            )}
            aria-haspopup={"dialog"}
            aria-expanded={sheetOpen ? "true" : "false"}
            onClick={() => setSheetOpen(true)}
            sx={{
              flexShrink: 0,
              color: "text.primary",
              [TOUCH_DEVICE_MEDIA_QUERY]: {
                width: TOUCH_TARGET_SIZE,
                height: TOUCH_TARGET_SIZE,
              },
            }}
          >
            <Box
              component={"span"}
              aria-hidden
              sx={{
                minWidth: 24,
                height: 24,
                px: 0.25,
                boxSizing: "border-box",
                border: 2,
                borderColor: "currentColor",
                borderRadius: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {count > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : count}
            </Box>
          </IconButton>
        </Tooltip>
      </Box>
      <OpenNotesSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onExited={() => {
          if (!newNoteRequested.current) return;
          newNoteRequested.current = false;
          setNameDialogOpen(true);
        }}
        tabs={tabOrder.flatMap((tabId) => {
          const item = openTabs[tabId];
          return item
            ? [{ id: tabId, label: getTabLabel(tabId), type: item.type }]
            : [];
        })}
        currentTabId={activeTab}
        onSelectTab={(tabId) => {
          switchToTab(tabId);
          setSheetOpen(false);
        }}
        onCloseTab={closeTab}
        onNewNote={
          playerFolderId
            ? () => {
                newNoteRequested.current = true;
                setSheetOpen(false);
              }
            : undefined
        }
        onAllNotes={playerFolderId ? handleAllNotes : undefined}
      />
      <NameItemDialog
        open={nameDialogOpen}
        onClose={() => setNameDialogOpen(false)}
        onSave={handleCreateNote}
        itemLabel={t("notes.note", "Note")}
        name={""}
      />
    </>
  );
}

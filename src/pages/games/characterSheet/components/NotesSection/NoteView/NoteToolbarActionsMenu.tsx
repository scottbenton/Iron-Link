import MoreIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useConfirm } from "material-ui-confirm";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";

import { NameItemDialog } from "../FolderView/NameItemDialog";
import { MoveDialog } from "../MoveDialog";
import { ShareDialog } from "../ShareDialog";
import { NotePermissions } from "./useNotePermission";

export interface NoteToolbarActionsMenuProps {
  openNoteId: string;
  permissions: NotePermissions;
}

export function NoteToolbarActionsMenu(props: NoteToolbarActionsMenuProps) {
  const { openNoteId, permissions } = props;
  const { t } = useTranslation();

  const setOpenNote = useNotesStore((store) => store.openItemTab);
  const note = useNotesStore((store) => {
    return store.noteState.notes[openNoteId];
  });

  const { gameType } = useGamePermissions();
  const noteName = note.title;

  const parentFolderId = useNotesStore((store) => {
    return store.noteState.notes[openNoteId].parentFolderId;
  });
  const parentFolder = useNotesStore((store) =>
    parentFolderId ? store.folderState.folders[parentFolderId] : undefined,
  );

  const confirm = useConfirm();

  const deleteNote = useNotesStore((store) => store.deleteNote);
  const handleDelete = useCallback(() => {
    confirm({
      title: t("notes.confirm-note-delete-title", "Delete {{noteName}}", {
        noteName,
      }),
      description: t(
        "notes.confirm.note-delete.description",
        "Are you sure you want to delete this note?",
      ),
      confirmationText: t("common.delete", "Delete"),
    })
      .then(() => {
        setOpenNote({ type: "folder", id: parentFolderId });
        deleteNote(openNoteId).catch(() => {});
      })
      .catch(() => {});
  }, [
    confirm,
    deleteNote,
    openNoteId,
    t,
    setOpenNote,
    parentFolderId,
    noteName,
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [openRenameDialog, setOpenRenameDialog] = useState(false);

  const updateNoteName = useNotesStore((store) => store.updateNoteName);
  const renameNote = useCallback(
    (noteName: string) => {
      updateNoteName(openNoteId, noteName).catch(() => {});
    },
    [updateNoteName, openNoteId],
  );

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setIsOpen(true)} ref={buttonRef}>
        <MoreIcon />
      </IconButton>
      <Menu
        open={isOpen}
        onClose={() => setIsOpen(false)}
        anchorEl={buttonRef.current}
      >
        <MenuItem
          onClick={() => {
            setIsOpen(false);
            setOpenRenameDialog(true);
          }}
        >
          {t("note.editor-toolbar.rename-note", "Rename Note")}
        </MenuItem>
        {parentFolder && parentFolderId && (
          <MenuItem
            onClick={() => {
              setIsOpen(false);
              setMoveDialogOpen(true);
            }}
          >
            {t("notes.toolbar.move-folder", "Move Folder")}
          </MenuItem>
        )}
        {parentFolder && parentFolderId && gameType !== GameType.Solo && (
          <MenuItem
            onClick={() => {
              setIsOpen(false);
              setShareDialogOpen(true);
            }}
          >
            {t("note.editor-toolbar.share-note", "Share Note")}
          </MenuItem>
        )}
        {permissions.canDelete && (
          <MenuItem
            onClick={() => {
              setIsOpen(false);
              handleDelete();
            }}
          >
            {t("note.editor-toolbar.delete-note", "Delete Note")}
          </MenuItem>
        )}
      </Menu>
      <NameItemDialog
        open={openRenameDialog}
        onClose={() => setOpenRenameDialog(false)}
        onSave={renameNote}
        itemLabel="Note"
        name={noteName}
      />
      {parentFolderId && (
        <MoveDialog
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
          item={{ type: "note", id: openNoteId, parentFolderId }}
        />
      )}
      <ShareDialog
        item={{
          type: "note",
          id: openNoteId,
        }}
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </>
  );
}

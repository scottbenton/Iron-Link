import MenuIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";

import { MoveDialog } from "../MoveDialog";
import { useDeleteNote } from "../NoteView/useDeleteNote";
import { useNotePermission } from "../NoteView/useNotePermission";
import { ShareDialog } from "../ShareDialog";
import { NameItemDialog } from "./NameItemDialog";

export interface NoteActionMenuProps {
  noteId: string;
}

export function NoteActionMenu(props: NoteActionMenuProps) {
  const { noteId } = props;

  const { t } = useTranslation();

  const { gameType } = useGamePermissions();
  const { canEdit, canDelete, canChangePermissions } =
    useNotePermission(noteId);

  const parentFolderId = useNotesStore(
    (store) => store.noteState.notes[noteId].parentFolderId,
  );
  const noteName = useNotesStore(
    (store) => store.noteState.notes[noteId].title,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuParentRef = useRef<HTMLButtonElement>(null);

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const deleteNote = useDeleteNote();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const updateNoteName = useNotesStore((store) => store.updateNoteName);
  const renameNote = (name: string) => {
    updateNoteName(noteId, name).catch(() => {});
  };

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  if (!canEdit && !canDelete && !canChangePermissions) {
    return null;
  }

  return (
    <>
      <Tooltip title={t("notes.note-menu.open", "Open Note Menu")}>
        <IconButton
          sx={(theme) => ({
            position: "absolute",
            right: theme.spacing(1),
            zIndex: 1,
            top: "50%",
            transform: "translateY(-50%)",
          })}
          ref={menuParentRef}
          onClick={() => setIsMenuOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>
      <Menu
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorEl={menuParentRef.current}
      >
        {canEdit && (
          <MenuItem
            onClick={() => {
              setRenameDialogOpen(true);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.note-menu.rename", "Rename Note")}
          </MenuItem>
        )}
        {canChangePermissions && gameType !== GameType.Solo && (
          <MenuItem
            onClick={() => {
              setShareDialogOpen(true);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.note-menu.share", "Share Note")}
          </MenuItem>
        )}
        {canChangePermissions && (
          <MenuItem
            onClick={() => {
              setIsMoveDialogOpen(true);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.note-menu.move", "Move Note")}
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              deleteNote(noteId);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.note-menu.delete", "Delete Note")}
          </MenuItem>
        )}
      </Menu>
      <MoveDialog
        open={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        item={{ type: "note", id: noteId, parentFolderId: parentFolderId }}
      />
      <NameItemDialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        itemLabel={t("notes.note", "Note")}
        name={noteName ?? ""}
        onSave={renameNote}
      />
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        item={{ type: "note", id: noteId }}
      />
    </>
  );
}

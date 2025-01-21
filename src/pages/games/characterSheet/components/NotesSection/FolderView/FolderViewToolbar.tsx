import FolderIcon from "@mui/icons-material/CreateNewFolder";
import MoveIcon from "@mui/icons-material/DriveFileMove";
import RenameIcon from "@mui/icons-material/DriveFileRenameOutline";
import DocumentIcon from "@mui/icons-material/NoteAdd";
import ShareIcon from "@mui/icons-material/Share";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";

import { NoteToolbar } from "../Layout";
import { MoveDialog } from "../MoveDialog";
import { ShareDialog } from "../ShareDialog";
import { FolderDeleteButton } from "./FolderDeleteButton";
import { NameItemDialog } from "./NameItemDialog";
import { useFolderPermission } from "./useFolderPermissions";

export interface FolderViewToolbarProps {
  folderId: string;
}

export function FolderViewToolbar(props: FolderViewToolbarProps) {
  const { folderId } = props;
  const { t } = useTranslation();

  const { gameType } = useGamePermissions();
  const uid = useUID();
  const gameId = useGameId();

  const folder = useNotesStore((store) => store.folderState.folders[folderId]);
  const parentFolderId = folder?.parentFolderId;

  const parentFolder = useNotesStore((store) =>
    parentFolderId ? store.folderState.folders[parentFolderId] : undefined,
  );

  const nextNoteOrder = useNotesStore((store) => {
    let highestOrder = Number.MIN_VALUE;
    Object.values(store.noteState.notes).forEach((note) => {
      if (note.parentFolderId === folderId) {
        if (note.order > highestOrder) {
          highestOrder = note.order;
        }
      }
    });
    return highestOrder + 1;
  });

  const isImmutableFolder = !folder?.parentFolderId;

  const [nameItemDialogSettings, setNameItemDialogSettings] = useState<{
    open: boolean;
    type: "folder" | "note";
    renamingCurrent?: boolean;
  }>({ open: false, type: "folder" });

  const { canEdit, canDelete } = useFolderPermission(folderId);

  const addFolder = useNotesStore((store) => store.createFolder);
  const addNote = useNotesStore((store) => store.createNote);
  const updateNoteFolderName = useNotesStore((store) => store.updateFolderName);

  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  // Something's gone wrong, lets stop before we break things
  if (!folder) return null;

  const createFolder = (name: string) => {
    if (uid) {
      addFolder(
        uid,
        gameId,
        folderId,
        name,
        1,
        folder.readPermissions,
        folder.editPermissions,
      ).catch(() => {});
    }
  };

  const createNote = (name: string) => {
    if (uid) {
      addNote(gameId, uid, folderId, name, nextNoteOrder).catch(() => {});
    }
  };

  const renameCurrentFolder = (name: string) => {
    updateNoteFolderName(folderId, name).catch(() => {});
  };

  return (
    <NoteToolbar>
      {canEdit && (
        <>
          {!isImmutableFolder && (
            <Tooltip title={t("notes.toolbar.rename-folder", "Rename Folder")}>
              <IconButton
                onClick={() =>
                  setNameItemDialogSettings({
                    open: true,
                    type: "folder",
                    renamingCurrent: true,
                  })
                }
              >
                <RenameIcon />
              </IconButton>
            </Tooltip>
          )}
          {!isImmutableFolder && parentFolder && parentFolderId && (
            <Tooltip title={t("notes.toolbar.move-folder", "Move Folder")}>
              <IconButton onClick={() => setMoveDialogOpen(true)}>
                <MoveIcon />
              </IconButton>
            </Tooltip>
          )}
          {parentFolderId && (
            <MoveDialog
              open={moveDialogOpen}
              onClose={() => setMoveDialogOpen(false)}
              item={{ type: "folder", id: folderId, parentFolderId }}
            />
          )}
          {!isImmutableFolder &&
            parentFolder &&
            parentFolderId &&
            gameType !== GameType.Solo && (
              <Tooltip title={t("notes.toolbar.share-folder", "Share Folder")}>
                <IconButton onClick={() => setShareDialogOpen(true)}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            )}
          <ShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            item={{ type: "folder", id: folderId }}
          />
          {!isImmutableFolder && canDelete && folder.parentFolderId && (
            <FolderDeleteButton folderId={folderId} />
          )}

          <Box flexGrow={1} display="flex" justifyContent="flex-end" gap={1}>
            <Tooltip title={t("notes.toolbar.create-folder", "Create Folder")}>
              <IconButton
                onClick={() =>
                  setNameItemDialogSettings({
                    open: true,
                    type: "folder",
                  })
                }
              >
                <FolderIcon />
              </IconButton>
            </Tooltip>
            <Button
              sx={{ justifySelf: "end" }}
              variant="contained"
              endIcon={<DocumentIcon />}
              onClick={() =>
                setNameItemDialogSettings({
                  open: true,
                  type: "note",
                })
              }
            >
              {t("notes.toolbar.create-note", "Create Note")}
            </Button>
          </Box>
          <NameItemDialog
            open={nameItemDialogSettings.open}
            itemLabel={
              nameItemDialogSettings.type === "folder"
                ? t("notes.folder", "Folder")
                : t("notes.note", "Note")
            }
            name={
              nameItemDialogSettings.renamingCurrent ? (folder.name ?? "") : ""
            }
            onSave={(name) => {
              if (nameItemDialogSettings.renamingCurrent) {
                renameCurrentFolder(name);
              } else if (nameItemDialogSettings.type === "folder") {
                createFolder(name);
              } else {
                createNote(name);
              }
            }}
            onClose={() =>
              setNameItemDialogSettings({
                ...nameItemDialogSettings,
                open: false,
              })
            }
          />
        </>
      )}
    </NoteToolbar>
  );
}

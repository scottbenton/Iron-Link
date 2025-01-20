import MenuIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";

import { MoveDialog } from "../MoveDialog";
import { ShareDialog } from "../ShareDialog";
import { NameItemDialog } from "./NameItemDialog";
import { useDeleteFolder } from "./useDeleteFolder";
import { useFolderPermission } from "./useFolderPermissions";

export interface FolderActionMenuProps {
  folderId: string;
}

export function FolderActionMenu(props: FolderActionMenuProps) {
  const { folderId } = props;

  const { gameType } = useGamePermissions();

  const { t } = useTranslation();

  const { canEdit, canDelete, canChangePermissions } =
    useFolderPermission(folderId);

  const parentFolderId = useNotesStore(
    (store) => store.folderState.folders[folderId].parentFolderId,
  );
  const folderName = useNotesStore(
    (store) => store.folderState.folders[folderId].name,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuParentRef = useRef<HTMLButtonElement>(null);

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const deleteFolder = useDeleteFolder();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const updateNoteFolderName = useNotesStore((store) => store.updateFolderName);
  const renameCurrentFolder = (name: string) => {
    updateNoteFolderName(folderId, name).catch(() => {});
  };

  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  if ((!canEdit && !canDelete && !canChangePermissions) || !parentFolderId) {
    return null;
  }

  return (
    <>
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
            {t("notes.folder-menu.rename", "Rename Folder")}
          </MenuItem>
        )}
        {canChangePermissions && gameType !== GameType.Solo && (
          <MenuItem
            onClick={() => {
              setShareDialogOpen(true);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.folder-menu.share", "Share Folder")}
          </MenuItem>
        )}
        {canChangePermissions && parentFolderId && (
          <MenuItem
            onClick={() => {
              setIsMoveDialogOpen(true);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.folder-menu.move", "Move Folder")}
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              deleteFolder(folderId);
              setIsMenuOpen(false);
            }}
          >
            {t("notes.folder-menu.delete", "Delete Folder")}
          </MenuItem>
        )}
      </Menu>
      {parentFolderId && (
        <MoveDialog
          open={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          item={{
            type: "folder",
            id: folderId,
            parentFolderId: parentFolderId,
          }}
        />
      )}
      <NameItemDialog
        open={renameDialogOpen}
        onClose={() => setRenameDialogOpen(false)}
        itemLabel={t("notes.folder", "Folder")}
        name={folderName ?? ""}
        onSave={renameCurrentFolder}
      />
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        item={{ type: "folder", id: folderId }}
      />
    </>
  );
}

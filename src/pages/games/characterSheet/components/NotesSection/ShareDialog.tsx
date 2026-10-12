import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { PermissionsSelector } from "components/permissions/PermissionsSelector";
import type { PermissionOption } from "components/permissions/permissionCompatibility";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";
import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import { getItemName } from "./FolderView/getFolderName";

export interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  item: {
    type: "folder" | "note";
    id: string;
  };
}

export function ShareDialog(props: ShareDialogProps) {
  const { item, open, onClose } = props;

  const ownerId = useNotesStore((store) => {
    if (item.type === "folder") {
      return store.folderState.folders[item.id]?.creator;
    } else {
      return store.noteState.notes[item.id]?.creator;
    }
  });
  const currentViewPermissions = useNotesStore((store) => {
    if (item.type === "folder") {
      return store.folderState.folders[item.id]?.readPermissions;
    } else {
      return store.noteState.notes[item.id]?.readPermissions;
    }
  });
  const currentEditPermissions = useNotesStore((store) => {
    if (item.type === "folder") {
      return store.folderState.folders[item.id]?.editPermissions;
    } else {
      return store.noteState.notes[item.id]?.editPermissions;
    }
  });

  const parentFolder = useNotesStore((store) => {
    let parentFolderId: string | null;
    if (item.type === "folder") {
      parentFolderId = store.folderState.folders[item.id]?.parentFolderId;
    } else {
      parentFolderId = store.noteState.notes[item.id]?.parentFolderId;
    }
    if (!parentFolderId) {
      return undefined;
    }
    return store.folderState.folders[parentFolderId];
  });

  const { t } = useTranslation();
  const uid = useUID();

  const gameType = useGamePermissions().gameType;

  const { type } = item;

  const [updatedViewPermissions, setUpdatedViewPermissions] = useState(
    currentViewPermissions,
  );
  const [updatedWritePermissions, setUpdatedWritePermissions] = useState(
    currentEditPermissions,
  );

  useEffect(() => {
    if (open) {
      setUpdatedViewPermissions(currentViewPermissions);
      setUpdatedWritePermissions(currentEditPermissions);
    }
  }, [currentViewPermissions, currentEditPermissions, open]);

  // Notes are shared within a game, so the audiences follow its type. Each
  // audience can be offered for viewing and for editing.
  const { readOptions, writeOptions } = useMemo(() => {
    const readOptions: PermissionOption<ReadPermissions>[] = [];
    const writeOptions: PermissionOption<EditPermissions>[] = [];
    const addOption = (
      label: string,
      read: ReadPermissions,
      edit: EditPermissions,
    ) => {
      readOptions.push({ label, value: read });
      writeOptions.push({ label, value: edit });
    };

    if (uid === ownerId) {
      addOption(
        t("notes.share-permissions.only-you", "Only You"),
        ReadPermissions.OnlyAuthor,
        EditPermissions.OnlyAuthor,
      );
      if (gameType === GameType.Guided) {
        addOption(
          t(
            "notes.share-permissions.author-and-guides",
            "You and the Guide(s)",
          ),
          ReadPermissions.GuidesAndAuthor,
          EditPermissions.GuidesAndAuthor,
        );
      }
      if (gameType !== GameType.Solo) {
        addOption(
          t("notes.share-permissions.all-players", "All Players"),
          ReadPermissions.AllPlayers,
          EditPermissions.AllPlayers,
        );
      }
    }
    return { readOptions, writeOptions };
  }, [ownerId, t, uid, gameType]);

  const updateNoteFolderPermissions = useNotesStore(
    (store) => store.updateFolderPermissions,
  );
  const updateNotePermissions = useNotesStore(
    (store) => store.updateNotePermissions,
  );
  const handleShare = () => {
    onClose();

    if (type === "folder") {
      updateNoteFolderPermissions(
        item.id,
        updatedViewPermissions,
        updatedWritePermissions,
      )
        .then(() => {})
        .catch(() => {});
    } else {
      updateNotePermissions(
        item.id,
        updatedViewPermissions,
        updatedWritePermissions,
      )
        .then(() => {})
        .catch(() => {});
    }
  };

  if (!parentFolder) {
    return null;
  }

  const inheritedText = t(
    "notes.share-permissions.inherited",
    "Inherited from {{parentFolderName}}",
    {
      parentFolderName: getItemName({
        name: parentFolder.name,
        t,
        isRootPlayerFolder: parentFolder.isRootPlayerFolder,
      }),
    },
  );

  const title =
    type === "folder"
      ? t("notes.shareFolder", "Share Folder")
      : t("notes.share", "Share Note");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {title}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <PermissionsSelector
          readOptions={readOptions}
          editOptions={writeOptions}
          readPermissions={updatedViewPermissions}
          editPermissions={updatedWritePermissions}
          onChange={({ readPermissions, editPermissions }) => {
            if (readPermissions) setUpdatedViewPermissions(readPermissions);
            if (editPermissions) setUpdatedWritePermissions(editPermissions);
          }}
          readHelperText={
            updatedViewPermissions === parentFolder.readPermissions
              ? inheritedText
              : undefined
          }
          editHelperText={
            updatedWritePermissions === parentFolder.editPermissions
              ? inheritedText
              : undefined
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t("common.cancel", "Cancel")}
        </Button>
        <Button onClick={handleShare} variant="contained">
          {t("common.save-changes", "Save Changes")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

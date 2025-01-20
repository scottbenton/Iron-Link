import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";
import { EditPermissions, ReadPermissions } from "repositories/shared.types";

import { getItemName } from "./FolderView/getFolderName";

interface PermissionOption {
  label: string;
  value: string;
  disabled: boolean;
}

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

  const handleSetViewPermissions = (type: ReadPermissions) => {
    setUpdatedViewPermissions(type);

    // Update write permissions if they are more permissive than the new view permissions
    if (
      isEditPermissionMorePermissiveThanReadPermission(
        type,
        updatedWritePermissions,
      )
    ) {
      setUpdatedWritePermissions(EditPermissions.OnlyAuthor);
    }
  };
  const handleSetEditPermissions = (type: EditPermissions) => {
    setUpdatedWritePermissions(type);
  };

  // We need to ensure that write permissions are restricted to the read permissions
  const readOptions = useMemo<PermissionOption[]>(() => {
    const options: PermissionOption[] = [];

    if (uid === ownerId) {
      options.push({
        label: t("notes.share-permissions.only-you", "Only You"),
        value: ReadPermissions.OnlyAuthor,
        disabled: false,
      });
      if (gameType === GameType.Guided) {
        options.push({
          label: t(
            "notes.share-permissions.author-and-guides",
            "You and the Guide(s)",
          ),
          value: ReadPermissions.GuidesAndAuthor,
          disabled: false,
        });
      }
      if (gameType !== GameType.Solo) {
        options.push({
          label: t("notes.share-permissions.all-players", "All Players"),
          value: ReadPermissions.AllPlayers,
          disabled: false,
        });
      }
    }
    return options;
  }, [ownerId, t, uid, gameType]);
  const writeOptions = useMemo<PermissionOption[]>(() => {
    const options: PermissionOption[] = [];

    if (uid === ownerId) {
      options.push({
        label: t("notes.share-permissions.only-you", "Only You"),
        value: ReadPermissions.OnlyAuthor,
        disabled: false,
      });
      if (gameType === GameType.Guided) {
        options.push({
          label: t(
            "notes.share-permissions.author-and-guides",
            "You and the Guide(s)",
          ),
          value: ReadPermissions.GuidesAndAuthor,
          disabled: updatedViewPermissions === ReadPermissions.OnlyAuthor,
        });
      }
      if (gameType !== GameType.Solo) {
        options.push({
          label: t("notes.share-permissions.all-players", "All Players"),
          value: ReadPermissions.AllPlayers,
          disabled:
            updatedViewPermissions === ReadPermissions.OnlyAuthor ||
            updatedViewPermissions === ReadPermissions.OnlyGuides ||
            updatedViewPermissions === ReadPermissions.GuidesAndAuthor,
        });
      }
    }
    return options;
  }, [ownerId, t, uid, updatedViewPermissions, gameType]);

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
        <Box>
          <FormControl>
            <FormLabel id="read-permissions">
              {t("notes.share-permissions.view", "Who can view?")}
            </FormLabel>
            {updatedViewPermissions === parentFolder.readPermissions && (
              <Typography variant={"body2"} color="text.secondary" mb={1}>
                {t(
                  "notes.share-permissions.inherited",
                  "Inherited from {{parentFolderName}}",
                  {
                    parentFolderName: getItemName({
                      name: parentFolder.name,
                      t,
                      isRootPlayerFolder: parentFolder.isRootPlayerFolder,
                    }),
                  },
                )}
              </Typography>
            )}
            <RadioGroup
              aria-labelledby="read-permissions"
              value={updatedViewPermissions}
              onChange={(_, value) =>
                handleSetViewPermissions(value as ReadPermissions)
              }
            >
              {readOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  disabled={option.disabled}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
        <Box mt={3}>
          <FormControl>
            <FormLabel id="write-permissions">
              {t("notes.share-permissions.write", "Who can edit?")}
            </FormLabel>
            {updatedWritePermissions === parentFolder.editPermissions && (
              <Typography variant={"body2"} color="text.secondary" mb={1}>
                {t(
                  "notes.share-permissions.inherited",
                  "Inherited from {{parentFolderName}}",
                  {
                    parentFolderName: getItemName({
                      name: parentFolder.name,
                      t,
                      isRootPlayerFolder: parentFolder.isRootPlayerFolder,
                    }),
                  },
                )}
              </Typography>
            )}
            <RadioGroup
              aria-labelledby="write-permissions"
              value={updatedWritePermissions}
              onChange={(_, value) =>
                handleSetEditPermissions(value as EditPermissions)
              }
            >
              {writeOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  disabled={option.disabled}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
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

function isEditPermissionMorePermissiveThanReadPermission(
  readPermission: ReadPermissions,
  editPermission: EditPermissions,
) {
  if (editPermission === EditPermissions.AllPlayers) {
    if (
      readPermission !== ReadPermissions.AllPlayers &&
      readPermission !== ReadPermissions.Public
    ) {
      return true;
    }
    return false;
  }
  if (editPermission === EditPermissions.GuidesAndAuthor) {
    if (readPermission === ReadPermissions.OnlyAuthor) {
      return true;
    }
    return false;
  }

  return false;
}

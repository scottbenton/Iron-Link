import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useUID } from "stores/auth.store";
import { GamePermission } from "stores/game.store";
import { useNotesStore } from "stores/notes.store";

import { EditPermissions } from "repositories/shared.types";

import { INoteFolder } from "services/noteFolders.service";

import { getItemName } from "../FolderView/getFolderName";
import { useFolderDescendants } from "../FolderView/useFolderDescendants";
import { MoveTreeItem } from "./MoveTreeItem";

export interface MoveDialogProps {
  open: boolean;
  onClose: () => void;
  item: {
    type: "folder" | "note";
    id: string;
    parentFolderId: string;
  };
}

export function MoveDialog(props: MoveDialogProps) {
  const { open, onClose, item } = props;
  const { type, id, parentFolderId } = item;

  const { t } = useTranslation();

  const [selectedParentFolder, setSelectedParentFolder] = useState<
    string | null
  >(parentFolderId);

  const selectedFolderPermissions = useNotesStore((store) => {
    if (!selectedParentFolder) return null;
    return {
      readPermissions:
        store.folderState.folders[selectedParentFolder]?.readPermissions,
      editPermissions:
        store.folderState.folders[selectedParentFolder]?.editPermissions,
    };
  });
  const currentItemPermissions = useNotesStore((store) => {
    if (type === "folder") {
      return {
        readPermissions: store.folderState.folders[id]?.readPermissions,
        editPermissions: store.folderState.folders[id]?.editPermissions,
      };
    } else {
      return {
        readPermissions: store.noteState.notes[id]?.readPermissions,
        editPermissions: store.noteState.notes[id]?.editPermissions,
      };
    }
  });

  const doPermissionsMatch = useMemo(() => {
    if (!selectedFolderPermissions) return true;

    if (
      selectedFolderPermissions.readPermissions !==
      currentItemPermissions.readPermissions
    ) {
      return false;
    }
    if (
      selectedFolderPermissions.editPermissions !==
      currentItemPermissions.editPermissions
    ) {
      return false;
    }
    return true;
  }, [selectedFolderPermissions, currentItemPermissions]);

  const selectedParentFolderOrder = useNotesStore((store) => {
    let nextOrder = 0;
    Object.values(store.noteState.notes).forEach((note) => {
      if (note.parentFolderId === selectedParentFolder) {
        nextOrder = Math.max(nextOrder, note.order);
      }
    });
    return nextOrder;
  });

  const uid = useUID();
  const campaignId = useGameId();
  const { gamePermission: campaignPermission } = useGamePermissions();

  const descendants = useFolderDescendants(type === "folder" ? id : undefined);
  const [isMoveLoading, setIsMoveLoading] = useState(false);
  const [shouldUpdatePermissions, setShouldUpdatePermissions] = useState(false);

  const isGuide = campaignPermission === GamePermission.Guide;

  const folders = useNotesStore((notes) => notes.folderState.folders);

  const { rootNodes, tree } = getTreeFromFolders(folders, uid, isGuide);

  const moveNote = useNotesStore((store) => store.moveNote);
  const moveFolder = useNotesStore((store) => store.moveFolder);

  const handleMove = useCallback(
    (newParentFolderId: string) => {
      setIsMoveLoading(true);

      let promise: Promise<void>;

      // We can just move the item
      if (type === "note") {
        promise = moveNote(
          id,
          newParentFolderId,
          !doPermissionsMatch && shouldUpdatePermissions,
        );
      } else {
        promise = moveFolder(
          id,
          newParentFolderId,
          !doPermissionsMatch && shouldUpdatePermissions,
        );
      }

      promise
        .catch(() => {})
        .finally(() => {
          setIsMoveLoading(false);
          onClose();
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      type,
      id,
      parentFolderId,
      folders,
      descendants,
      campaignId,
      selectedParentFolderOrder,
      shouldUpdatePermissions,
      doPermissionsMatch,
    ],
  );

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitleWithCloseButton onClose={onClose}>
        {type === "note"
          ? t("notes.moveNote", "Move Note")
          : t("notes.moveFolder", "Move Folder")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Typography>
          {type === "note"
            ? t(
                "notes.moveNoteDescription",
                "Select the folder you want to move this note to. If the permissions of the note do not match the permissions of the folder, you can choose to update the permissions of the note to match the new folder.",
              )
            : t(
                "notes.moveFolderDescription",
                "Select the folder you want to move this folder to. If the permissions in the new parent folder are different, you can choose to update the permissions of the folder to match the new folder.",
              )}
        </Typography>
        <SimpleTreeView
          disableSelection={isMoveLoading}
          sx={{ mt: 2 }}
          selectedItems={selectedParentFolder}
          onSelectedItemsChange={(_, itemId) => setSelectedParentFolder(itemId)}
        >
          {rootNodes.map((folderId) => (
            <TreeItem
              itemId={folderId}
              key={folderId}
              label={getItemName({
                name: folders[folderId].name,
                isRootPlayerFolder: folders[folderId].isRootPlayerFolder,
                t,
              })}
            >
              {tree[folderId]?.map((childId) => (
                <MoveTreeItem
                  key={childId}
                  folderId={childId}
                  folders={folders}
                  tree={tree}
                  currentFolderId={type === "folder" ? id : undefined}
                />
              ))}
            </TreeItem>
          ))}
          {!doPermissionsMatch && (
            <FormControlLabel
              label={t(
                "notes.updatePermissions",
                "Update permissions to match the new folder",
              )}
              checked={shouldUpdatePermissions}
              onChange={(_, checked) => setShouldUpdatePermissions(checked)}
              control={<Checkbox />}
              sx={{ mt: 2 }}
            />
          )}
        </SimpleTreeView>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          disabled={isMoveLoading || !selectedParentFolder}
          variant="contained"
          onClick={() =>
            selectedParentFolder && handleMove(selectedParentFolder)
          }
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function getTreeFromFolders(
  folders: Record<string, INoteFolder>,
  uid: string | undefined,
  isGuide: boolean,
) {
  const rootNodes: string[] = [];
  const tree: Record<string, string[]> = {};
  // Check each folder for permissions
  Object.entries(folders).forEach(([folderId, folder]) => {
    if (
      folder.editPermissions === EditPermissions.GuidesAndAuthor &&
      (!isGuide || folder.creator !== uid)
    ) {
      return;
    } else if (
      folder.editPermissions === EditPermissions.OnlyAuthor &&
      folder.creator !== uid
    ) {
      return;
    } else if (
      folder.editPermissions === EditPermissions.OnlyGuides &&
      !isGuide
    ) {
      return;
    }

    if (folder.parentFolderId && folders[folder.parentFolderId]) {
      if (!tree[folder.parentFolderId]) {
        tree[folder.parentFolderId] = [];
      }
      tree[folder.parentFolderId].push(folderId);
    } else {
      rootNodes.push(folderId);
    }
  });

  return {
    rootNodes,
    tree,
  };
}

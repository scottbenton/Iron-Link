import { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { Checkbox } from "ui/components/Checkbox";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogHeader,
} from "ui/components/Dialog";
import { TreeView, TreeViewItem } from "ui/components/TreeView";
import { Stack } from "ui/primitives";

import { Permissions, useNotesStore } from "stores/notes.store";

import { INoteFolder } from "services/noteFolders.service";

import { getItemName } from "../FolderView/getFolderName";
import { useFolderDescendants } from "../FolderView/useFolderDescendants";

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

  const [selectedParentFolder, setSelectedParentFolder] =
    useState(parentFolderId);

  const selectedFolderPermissions = useNotesStore((store) => ({
    readPermissions:
      store.folderState.folders[selectedParentFolder]?.readPermissions,
    editPermissions:
      store.folderState.folders[selectedParentFolder]?.editPermissions,
  }));
  const currentItemPermissions = useNotesStore((store) => {
    const current =
      type === "folder"
        ? store.folderState.folders[id]
        : store.noteState.notes[id];
    return {
      readPermissions: current?.readPermissions,
      editPermissions: current?.editPermissions,
    };
  });
  const doPermissionsMatch =
    selectedFolderPermissions.readPermissions ===
      currentItemPermissions.readPermissions &&
    selectedFolderPermissions.editPermissions ===
      currentItemPermissions.editPermissions;

  // A folder can't move into itself or anything inside it.
  const descendants = useFolderDescendants(type === "folder" ? id : undefined);
  const [isMoveLoading, setIsMoveLoading] = useState(false);
  const [shouldUpdatePermissions, setShouldUpdatePermissions] = useState(false);

  const folders = useNotesStore((store) => store.folderState.folders);
  const permissions = useNotesStore((store) => store.folderState.permissions);

  const items = useMemo(
    () =>
      getTreeItems(folders, permissions, t, (folderId) =>
        type === "folder"
          ? folderId === id || folderId in descendants.folders
          : false,
      ),
    [folders, permissions, t, type, id, descendants],
  );

  const moveNote = useNotesStore((store) => store.moveNote);
  const moveFolder = useNotesStore((store) => store.moveFolder);

  const handleMove = () => {
    if (isMoveLoading) return;
    setIsMoveLoading(true);
    const updatePermissions = !doPermissionsMatch && shouldUpdatePermissions;
    const move = type === "note" ? moveNote : moveFolder;
    move(id, selectedParentFolder, updatePermissions)
      .catch(() => {})
      .finally(() => {
        setIsMoveLoading(false);
        onClose();
      });
  };

  return (
    <Dialog open={open} onClose={onClose} onSubmit={handleMove}>
      <DialogHeader
        title={
          type === "note"
            ? t("notes.moveNote", "Move Note")
            : t("notes.moveFolder", "Move Folder")
        }
      />
      <DialogBody>
        <Stack gap="4">
          <DialogDescription>
            {type === "note"
              ? t(
                  "notes.moveNoteDescription",
                  "Select the folder you want to move this note to. If the permissions of the note do not match the permissions of the folder, you can choose to update the permissions of the note to match the new folder.",
                )
              : t(
                  "notes.moveFolderDescription",
                  "Select the folder you want to move this folder to. If the permissions in the new parent folder are different, you can choose to update the permissions of the folder to match the new folder.",
                )}
          </DialogDescription>
          <TreeView
            aria-label={t("notes.move-destinations", "Folders")}
            items={items}
            defaultExpandedIds={items.map((rootItem) => rootItem.id)}
            selectedId={selectedParentFolder}
            onSelectedChange={(folderId) => setSelectedParentFolder(folderId)}
            disabled={isMoveLoading}
          />
          {!doPermissionsMatch && (
            <Checkbox
              label={t(
                "notes.updatePermissions",
                "Update permissions to match the new folder",
              )}
              checked={shouldUpdatePermissions}
              onCheckedChange={setShouldUpdatePermissions}
              disabled={isMoveLoading}
            />
          )}
        </Stack>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={isMoveLoading}
          disabled={selectedParentFolder === parentFolderId}
        >
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// The folders this person can edit, as a tree. A folder whose parent they
// can't see starts its own branch; one under a parent they can see but not
// edit is left out with that parent.
function getTreeItems(
  folders: Record<string, INoteFolder>,
  permissions: Record<string, Permissions>,
  t: TFunction,
  isDisabled: (folderId: string) => boolean,
): TreeViewItem[] {
  const children: Record<string, string[]> = {};
  const rootIds: string[] = [];
  Object.entries(folders).forEach(([folderId, folder]) => {
    if (!permissions[folderId]?.canEdit) return;
    const parentId = folder.parentFolderId;
    if (parentId && folders[parentId]) {
      (children[parentId] ??= []).push(folderId);
    } else {
      rootIds.push(folderId);
    }
  });

  const toItem = (folderId: string): TreeViewItem => {
    const folder = folders[folderId];
    const childIds = children[folderId];
    return {
      id: folderId,
      label: getItemName({
        name: folder.name,
        isRootPlayerFolder: folder.isRootPlayerFolder,
        t,
      }),
      disabled: isDisabled(folderId),
      children: childIds?.map(toItem),
    };
  };
  return rootIds.map(toItem);
}

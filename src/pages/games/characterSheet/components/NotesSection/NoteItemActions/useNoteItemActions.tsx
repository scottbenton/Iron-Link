import deepEqual from "fast-deep-equal";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  FolderOpenIcon,
  PencilLineIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "ui/icons";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useNotesStore } from "stores/notes.store";

import { GameType } from "repositories/game.repository";

import { getItemName } from "../FolderView/getFolderName";
import { useDeleteFolder } from "../FolderView/useDeleteFolder";
import { MoveDialog } from "../MoveDialog";
import { useDeleteNote } from "../NoteView/useDeleteNote";
import { ShareDialog } from "../ShareDialog";
import { NameItemDialog } from "./NameItemDialog";

export interface NoteItemRef {
  type: "folder" | "note";
  id: string;
}

export interface NoteItemAction {
  id: "rename" | "share" | "move" | "delete";
  label: string;
  icon: ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

const noPermissions = {
  canEdit: false,
  canDelete: false,
  canChangePermissions: false,
};

/**
 * What can be done to a folder or note (rename, share, move, delete), with
 * the dialogs they open. Each place that offers them (a card's menu, the
 * folder toolbar, the open note's menu) shows the same actions under the
 * same rules: the root folder can't be renamed, moved, shared or deleted,
 * and sharing needs a multiplayer game. Render `dialogs` beside the
 * controls.
 */
export function useNoteItemActions(item: NoteItemRef): {
  actions: NoteItemAction[];
  name: string | undefined;
  dialogs: ReactNode;
} {
  const { type, id } = item;
  const { t } = useTranslation();
  const { gameType } = useGamePermissions();

  const details = useNotesStore((store) => {
    if (type === "folder") {
      const folder = store.folderState.folders[id];
      return {
        name: folder
          ? getItemName({
              name: folder.name,
              isRootPlayerFolder: folder.isRootPlayerFolder,
              t,
            })
          : undefined,
        rawName: folder?.name ?? "",
        parentFolderId: folder?.parentFolderId ?? null,
        permissions: store.folderState.permissions[id] ?? noPermissions,
      };
    }
    const note = store.noteState.notes[id];
    return {
      name: note?.title,
      rawName: note?.title ?? "",
      parentFolderId: note?.parentFolderId ?? null,
      permissions: store.noteState.permissions[id] ?? noPermissions,
    };
  }, deepEqual);
  const { name, rawName, parentFolderId, permissions } = details;
  const parentFolderExists = useNotesStore(
    (store) => !!parentFolderId && !!store.folderState.folders[parentFolderId],
  );

  const updateFolderName = useNotesStore((store) => store.updateFolderName);
  const updateNoteName = useNotesStore((store) => store.updateNoteName);
  const deleteFolder = useDeleteFolder();
  const deleteNote = useDeleteNote();

  const [openDialog, setOpenDialog] = useState<
    "rename" | "share" | "move" | null
  >(null);
  const close = () => setOpenDialog(null);

  const isFolder = type === "folder";
  const actions: NoteItemAction[] = [];
  // A root folder (no parent) is the player's own and stays as it is.
  const isRoot = isFolder && !parentFolderId;

  if (permissions.canEdit && !isRoot) {
    actions.push({
      id: "rename",
      label: isFolder
        ? t("notes.folder-menu.rename", "Rename Folder")
        : t("notes.note-menu.rename", "Rename Note"),
      icon: <PencilLineIcon />,
      onSelect: () => setOpenDialog("rename"),
    });
  }
  if (
    permissions.canChangePermissions &&
    parentFolderExists &&
    gameType !== GameType.Solo
  ) {
    actions.push({
      id: "share",
      label: isFolder
        ? t("notes.folder-menu.share", "Share Folder")
        : t("notes.note-menu.share", "Share Note"),
      icon: <ShareNetworkIcon />,
      onSelect: () => setOpenDialog("share"),
    });
  }
  if (permissions.canChangePermissions && parentFolderId) {
    actions.push({
      id: "move",
      label: isFolder
        ? t("notes.folder-menu.move", "Move Folder")
        : t("notes.note-menu.move", "Move Note"),
      icon: <FolderOpenIcon />,
      onSelect: () => setOpenDialog("move"),
    });
  }
  if (permissions.canDelete && parentFolderId) {
    actions.push({
      id: "delete",
      label: isFolder
        ? t("notes.folder-menu.delete", "Delete Folder")
        : t("notes.note-menu.delete", "Delete Note"),
      icon: <TrashIcon />,
      danger: true,
      onSelect: () => (isFolder ? deleteFolder(id) : deleteNote(id)),
    });
  }

  // Mounted only while open, so each opening starts from the item as it is.
  const dialogs = (
    <>
      {openDialog === "rename" && (
        <NameItemDialog
          open
          onClose={close}
          itemLabel={
            isFolder ? t("notes.folder", "Folder") : t("notes.note", "Note")
          }
          name={rawName}
          onSave={(newName) => {
            (isFolder
              ? updateFolderName(id, newName)
              : updateNoteName(id, newName)
            ).catch(() => {});
          }}
        />
      )}
      {openDialog === "share" && (
        <ShareDialog open onClose={close} item={item} />
      )}
      {openDialog === "move" && parentFolderId && (
        <MoveDialog open onClose={close} item={{ type, id, parentFolderId }} />
      )}
    </>
  );

  return { actions, name, dialogs };
}

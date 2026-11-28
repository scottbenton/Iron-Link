import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FilePlusIcon, FolderPlusIcon } from "ui/icons";
import {
  ActionToolbarButton,
  ActionToolbarIconButton,
} from "ui/layout/ActionToolbar";
import { Box } from "ui/primitives";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useUID } from "stores/auth.store";
import { useNotesStore } from "stores/notes.store";

import { NoteToolbar } from "../Layout";
import { NameItemDialog, useNoteItemActions } from "../NoteItemActions";
import { useFolderPermission } from "./useFolderPermissions";

export interface FolderViewToolbarProps {
  folderId: string;
}

export function FolderViewToolbar(props: FolderViewToolbarProps) {
  const { folderId } = props;
  const { t } = useTranslation();

  const uid = useUID();
  const gameId = useGameId();

  const folder = useNotesStore((store) => store.folderState.folders[folderId]);

  const nextNoteOrder = useNotesStore((store) => {
    // After the folder's last note, or 1 in an empty folder.
    let highestOrder: number | undefined;
    Object.values(store.noteState.notes).forEach((note) => {
      if (
        note.parentFolderId === folderId &&
        (highestOrder === undefined || note.order > highestOrder)
      ) {
        highestOrder = note.order;
      }
    });
    return (highestOrder ?? 0) + 1;
  });

  const { canEdit } = useFolderPermission(folderId);
  const { actions, dialogs } = useNoteItemActions({
    type: "folder",
    id: folderId,
  });

  const addFolder = useNotesStore((store) => store.createFolder);
  const addNote = useNotesStore((store) => store.createNote);

  const [creating, setCreating] = useState<"folder" | "note" | null>(null);

  // Something's gone wrong, lets stop before we break things
  if (!folder) return null;

  const create = (name: string) => {
    if (!uid) return;
    if (creating === "folder") {
      addFolder(
        uid,
        gameId,
        folderId,
        name,
        1,
        folder.readPermissions,
        folder.editPermissions,
      ).catch(() => {});
    } else {
      addNote(gameId, uid, folderId, name, nextNoteOrder).catch(() => {});
    }
  };

  const hasActions = actions.length > 0 || canEdit;

  return (
    <>
      <NoteToolbar label={t("notes.toolbar.folder-actions", "Folder actions")}>
        {hasActions ? (
          <>
            {actions.map((action) => (
              <ActionToolbarIconButton
                key={action.id}
                label={action.label}
                danger={action.danger}
                onClick={action.onSelect}
              >
                {action.icon}
              </ActionToolbarIconButton>
            ))}
            {canEdit && (
              <>
                <Box flex="1" aria-hidden />
                <ActionToolbarIconButton
                  label={t("notes.toolbar.create-folder", "Create Folder")}
                  onClick={() => setCreating("folder")}
                >
                  <FolderPlusIcon />
                </ActionToolbarIconButton>
                <ActionToolbarButton
                  icon={<FilePlusIcon />}
                  onClick={() => setCreating("note")}
                >
                  {t("notes.toolbar.create-note", "Create Note")}
                </ActionToolbarButton>
              </>
            )}
          </>
        ) : undefined}
      </NoteToolbar>
      {dialogs}
      {creating && (
        <NameItemDialog
          open
          itemLabel={
            creating === "folder"
              ? t("notes.folder", "Folder")
              : t("notes.note", "Note")
          }
          name=""
          onSave={create}
          onClose={() => setCreating(null)}
        />
      )}
    </>
  );
}

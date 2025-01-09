import { useConfirm } from "material-ui-confirm";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";

export function useDeleteNote() {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const currentItem = useNotesStore((store) => store.openItem);
  const setOpenItem = useNotesStore((store) => store.setOpenItem);

  const deleteNote = useNotesStore((store) => store.deleteNote);

  const notes = useNotesStore((store) => store.noteState.notes);

  return useCallback(
    (noteId: string) => {
      const note = notes[noteId];
      const parentFolderId = note?.parentFolderId;
      if (parentFolderId) {
        confirm({
          title: t("notes.confirm-note-delete-title", "Delete {{noteName}}", {
            noteName: note.title,
          }),
          description: t(
            "notes.confirm.note-delete.description",
            "Are you sure you want to delete this note?",
          ),
          confirmationText: t("common.delete", "Delete"),
        })
          .then(() => {
            if (currentItem?.type === "note" && currentItem.noteId === noteId) {
              setOpenItem("folder", parentFolderId);
            }
            console.debug("DELETING NOTE");
            deleteNote(noteId).catch(() => {});
          })
          .catch(() => {});
      }
    },
    [notes, confirm, currentItem, deleteNote, t, setOpenItem],
  );
}
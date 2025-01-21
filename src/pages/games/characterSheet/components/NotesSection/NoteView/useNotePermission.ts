import { useNotesStore } from "stores/notes.store";

export interface NotePermissions {
  canChangePermissions: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function useNotePermission(noteId: string): NotePermissions {
  return useNotesStore((store) => {
    return (
      store.noteState.permissions[noteId] ?? {
        canChangePermissions: false,
        canEdit: false,
        canDelete: false,
      }
    );
  });
}

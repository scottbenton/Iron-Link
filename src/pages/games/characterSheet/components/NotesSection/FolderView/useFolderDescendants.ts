import { useNotesStore } from "stores/notes.store";

import { INoteFolder } from "services/noteFolders.service";
import { INote } from "services/notes.service";

export interface FolderDescendants {
  folders: Record<string, INoteFolder>;
  notes: Record<string, INote>;
}

export function useFolderDescendants(
  folderId: string | undefined,
): FolderDescendants {
  return useNotesStore((state) =>
    folderId
      ? state.getFolderDescendants(folderId)
      : {
          folders: {},
          notes: {},
        },
  );
}

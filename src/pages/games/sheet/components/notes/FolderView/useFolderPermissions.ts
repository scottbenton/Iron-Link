import { useNotesStore } from "@/stores/notes.store";

export interface FolderPermissions {
  canChangePermissions: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function useFolderPermission(
  folderId: string | undefined,
): FolderPermissions {
  return useNotesStore((store) => {
    if (!folderId) {
      return {
        canChangePermissions: false,
        canEdit: false,
        canDelete: false,
      };
    }

    return (
      store.folderState.permissions[folderId] ?? {
        canChangePermissions: false,
        canEdit: false,
        canDelete: false,
      }
    );
  });
}

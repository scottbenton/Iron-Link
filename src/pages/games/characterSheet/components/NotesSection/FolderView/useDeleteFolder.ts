import { useConfirm } from "material-ui-confirm";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";

import { getItemName } from "./getFolderName";

export function useDeleteFolder() {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const currentItem = useNotesStore((store) => store.openItem);
  const setOpenItem = useNotesStore((store) => store.setOpenItem);

  const deleteFolder = useNotesStore((store) => store.deleteFolder);

  const folders = useNotesStore((store) => store.folderState.folders);

  return useCallback(
    (folderId: string) => {
      const folder = folders[folderId];
      const parentFolderId = folder?.parentFolderId;
      if (parentFolderId) {
        confirm({
          title: t(
            "notes.confirm-folder-delete-title",
            "Delete {{folderName}}",
            {
              folderName: getItemName({
                name: folder.name,
                isRootPlayerFolder: false,
                t,
              }),
            },
          ),
          description: t(
            "notes.confirm.folder-delete.description",
            "Are you sure you want to delete this folder? This will also delete ALL notes and folders below this one.",
          ),
          confirmationText: t("common.delete", "Delete"),
        })
          .then(() => {
            if (
              currentItem?.type === "folder" &&
              currentItem.folderId === folderId
            ) {
              setOpenItem("folder", parentFolderId);
            }
            deleteFolder(folderId).catch(() => {});
          })
          .catch(() => {});
      }
    },
    [folders, confirm, currentItem, deleteFolder, t, setOpenItem],
  );
}

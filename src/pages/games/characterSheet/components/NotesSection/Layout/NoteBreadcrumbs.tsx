import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useNotesStore } from "stores/notes.store";

import { getItemName } from "../FolderView/getFolderName";

interface BreadcrumbItem {
  type: "folder" | "note";
  isRootPlayerFolder?: boolean;
  id: string;
  name: string;
}

export function NoteBreadcrumbs() {
  const { t } = useTranslation();

  const setOpenItem = useNotesStore((store) => store.setOpenItem);

  const rootPlayerFolderId = useNotesStore(
    (store) =>
      Object.values(store.folderState.folders).find(
        (folder) => folder.isRootPlayerFolder,
      )?.id,
  );

  const breadcrumbItems: BreadcrumbItem[] = useNotesStore((store) => {
    let item = store.openItem;

    const breadcrumbs: BreadcrumbItem[] = [];

    while (item) {
      breadcrumbs.push({
        type: item.type,
        id: item.type === "folder" ? item.folderId : item.noteId,
        name:
          item.type === "folder"
            ? getItemName({
                name: store.folderState.folders[item.folderId]?.name,
                isRootPlayerFolder:
                  store.folderState.folders[item.folderId]
                    ?.isRootPlayerFolder ?? false,
                t,
              })
            : store.noteState.notes[item.noteId]?.title,
      });

      const parentFolderId =
        item.type === "folder"
          ? store.folderState.folders[item.folderId]?.parentFolderId
          : store.noteState.notes[item.noteId]?.parentFolderId;
      const parentFolder = parentFolderId
        ? store.folderState.folders[parentFolderId]
        : undefined;

      if (parentFolderId && !parentFolder && rootPlayerFolderId) {
        item = { type: "folder", folderId: rootPlayerFolderId };
      } else if (parentFolderId && parentFolder) {
        item = { type: "folder", folderId: parentFolderId };
      } else {
        item = undefined;
      }
    }

    return breadcrumbs.reverse();
  });

  if (breadcrumbItems.length > 0) {
    return (
      <>
        <Breadcrumbs>
          {breadcrumbItems.map((item, index) =>
            index === breadcrumbItems.length - 1 ? (
              <Typography key={index}>{item.name}</Typography>
            ) : (
              <Link
                key={index}
                component={"button"}
                onClick={() =>
                  item.type === "folder"
                    ? setOpenItem("folder", item.id)
                    : setOpenItem("note", item.id)
                }
                sx={{ display: "flex" }}
                color="textPrimary"
              >
                {item.name}
              </Link>
            ),
          )}
        </Breadcrumbs>
      </>
    );
  }
  return null;
}

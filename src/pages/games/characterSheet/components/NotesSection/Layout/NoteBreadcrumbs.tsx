import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { NOTES_ID } from "pages/games/gamePageLayout/hooks/useGameKeybinds";

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

  const setOpenItem = useNotesStore((store) => store.openItemTab);

  const rootPlayerFolderId = useNotesStore(
    (store) =>
      Object.values(store.folderState.folders).find(
        (folder) => folder.isRootPlayerFolder,
      )?.id,
  );

  const breadcrumbItems: BreadcrumbItem[] = useNotesStore((store) => {
    let item = store.openTabId
      ? store.noteTabItems[store.openTabId]
      : undefined;

    const breadcrumbs: BreadcrumbItem[] = [];

    while (item) {
      breadcrumbs.push({
        type: item.type,
        id: item.itemId,
        name:
          item.type === "folder"
            ? getItemName({
                name: store.folderState.folders[item.itemId]?.name,
                isRootPlayerFolder:
                  store.folderState.folders[item.itemId]?.isRootPlayerFolder ??
                  false,
                t,
              })
            : store.noteState.notes[item.itemId]?.title,
      });

      const parentFolderId =
        item.type === "folder"
          ? store.folderState.folders[item.itemId]?.parentFolderId
          : store.noteState.notes[item.itemId]?.parentFolderId;
      const parentFolder = parentFolderId
        ? store.folderState.folders[parentFolderId]
        : undefined;

      if (parentFolderId && !parentFolder && rootPlayerFolderId) {
        item = { type: "folder", itemId: rootPlayerFolderId };
      } else if (parentFolderId && parentFolder) {
        item = { type: "folder", itemId: parentFolderId };
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
                id={index === 0 ? NOTES_ID : undefined}
                key={index}
                component={"button"}
                onClick={(event) =>
                  setOpenItem({
                    type: item.type,
                    id: item.id,
                    openInBackground: event.ctrlKey || event.metaKey,
                    replaceCurrent: !(event.ctrlKey || event.metaKey),
                  })
                }
                onAuxClick={() =>
                  setOpenItem({
                    type: item.type,
                    id: item.id,
                    openInBackground: true,
                    replaceCurrent: false,
                  })
                }
                onMouseDown={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    return false;
                  }
                }}
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

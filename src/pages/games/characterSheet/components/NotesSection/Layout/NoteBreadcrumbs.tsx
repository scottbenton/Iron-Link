import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { BreadcrumbTrail } from "components/Layout/BreadcrumbTrail";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";
import { NOTES_ID } from "pages/games/gamePageLayout/hooks/useGameKeybinds";

import { useUID } from "stores/auth.store";
import { getPlayerNotesFolder, useNotesStore } from "stores/notes.store";

import { getItemName } from "../FolderView/getFolderName";

interface BreadcrumbItem {
  type: "folder" | "note";
  isRootPlayerFolder?: boolean;
  id: string;
  name: string;
}

export function NoteBreadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const uid = useUID();

  const setOpenItem = useNotesStore((store) => store.openItemTab);

  const rootPlayerFolderId = useNotesStore((store) =>
    uid ? getPlayerNotesFolder(uid, store.folderState.folders)?.id : undefined,
  );

  const breadcrumbItems: BreadcrumbItem[] = useNotesStore((store) => {
    let item = store.openTabId
      ? store.noteTabItems[store.openTabId]
      : undefined;

    const breadcrumbs: BreadcrumbItem[] = [];

    // The world tab sits outside the notes hierarchy, so it has no trail.
    const visited = new Set<string>();
    while (item && item.type !== "world" && !visited.has(item.itemId)) {
      visited.add(item.itemId);
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

  if (!breadcrumbItems.length) return null;
  return (
    <BreadcrumbTrail
      items={breadcrumbItems.map((item, index) => ({
        key: `${item.type}:${item.id}`,
        label: item.name,
        id: index === 0 ? NOTES_ID : undefined,
        linkProps:
          index === breadcrumbItems.length - 1
            ? undefined
            : getNotesItemLinkProps(
                location.pathname,
                new URLSearchParams(location.search),
                { type: item.type, itemId: item.id },
                (destination, background) =>
                  setOpenItem({
                    type: destination.type,
                    id: destination.itemId,
                    replaceCurrent: !background,
                    openInBackground: background,
                  }),
              ),
      }))}
    />
  );
}

import { Breadcrumbs, Link, Typography } from "@mui/material";

import { NOTES_ID } from "pages/games/gamePageLayout/hooks/useGameKeybinds";

import { NoteItemType, useItemName, useNotesStore } from "stores/notes.store";

interface BreadcrumbItem {
  type: NoteItemType;
  isRootPlayerFolder?: boolean;
  id: string;
}

export function NoteBreadcrumbs() {
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
      });

      const parentFolderId =
        item.type === "folder"
          ? store.folderState.folders[item.itemId]?.parentFolderId
          : store.noteState.notes[item.itemId]?.parentFolderId;
      const parentFolder = parentFolderId
        ? store.folderState.folders[parentFolderId]
        : undefined;

      if (
        rootPlayerFolderId &&
        (item.type === "world" || (parentFolderId && !parentFolder))
      ) {
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
          {breadcrumbItems.map((item, index) => (
            <Item
              key={index}
              item={item}
              index={index}
              isCurrentItem={index === breadcrumbItems.length - 1}
              setOpenItem={setOpenItem}
            />
          ))}
        </Breadcrumbs>
      </>
    );
  }
  return null;
}

function Item(props: {
  item: BreadcrumbItem;
  isCurrentItem?: boolean;
  index: number;
  setOpenItem: (item: {
    type: NoteItemType;
    id: string;
    openInBackground?: boolean;
    replaceCurrent?: boolean;
  }) => void;
}) {
  const { item, index, isCurrentItem, setOpenItem } = props;
  const itemName = useItemName(item.type, item.id);

  if (isCurrentItem) {
    return <Typography>{itemName}</Typography>;
  }

  return (
    <Link
      id={index === 0 ? NOTES_ID : undefined}
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
      {itemName}
    </Link>
  );
}

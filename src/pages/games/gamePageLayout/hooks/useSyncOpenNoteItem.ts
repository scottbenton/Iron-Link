import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { useNotesStore } from "stores/notes.store";

export function useSyncOpenNoteItem() {
  const openItem = useNotesStore((store) => store.openItem);
  const setOpenItem = useNotesStore((store) => store.setOpenItem);

  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state to search params
  useEffect(() => {
    if (openItem) {
      const { type } = openItem;
      setSearchParams({
        "note-type": type,
        "note-id": type === "note" ? openItem.noteId : openItem.folderId,
      });
    } else {
      setSearchParams({});
    }
  }, [openItem, setSearchParams]);

  // Sync search params to state
  useEffect(() => {
    const openItemType = searchParams.get("note-type");
    const openItemId = searchParams.get("note-id");

    if (openItemType && openItemId) {
      setOpenItem(openItemType as "folder" | "note", openItemId);
    }
  }, [searchParams, setOpenItem]);
}

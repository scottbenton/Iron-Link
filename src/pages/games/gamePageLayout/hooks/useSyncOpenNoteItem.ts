import { useEffect } from "react";
import { useSearchParams } from "react-router";

import { IOpenNoteItemType, useNotesStore } from "stores/notes.store";

const openNoteItemTypes: IOpenNoteItemType[] = ["note", "folder", "world"];

// The search param is user-controlled, so it is validated against the union
// rather than coerced. Coercing an unrecognized value to "note" would open a
// note tab pointed at an id that is not a note -- which is what happened to
// world tabs before "world" joined the union.
function isOpenNoteItemType(value: string): value is IOpenNoteItemType {
  return (openNoteItemTypes as string[]).includes(value);
}

export function useSyncOpenNoteItem() {
  const openItem = useNotesStore((store) =>
    store.openTabId ? store.noteTabItems[store.openTabId] : null,
  );
  const setOpenItem = useNotesStore((store) => store.openItemTab);

  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state to search params
  useEffect(() => {
    if (openItem) {
      const { type } = openItem;
      setSearchParams({
        "note-type": type,
        "note-id": openItem.itemId,
      });
    } else {
      setSearchParams({});
    }
  }, [openItem, setSearchParams]);

  // Sync search params to state
  useEffect(() => {
    const openItemType = searchParams.get("note-type");
    const openItemId = searchParams.get("note-id");

    if (openItemType && openItemId && isOpenNoteItemType(openItemType)) {
      setOpenItem({
        type: openItemType,
        id: openItemId,
      });
    }
  }, [searchParams, setOpenItem]);
}

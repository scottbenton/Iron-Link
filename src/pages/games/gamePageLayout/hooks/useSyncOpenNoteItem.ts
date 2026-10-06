import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

import { useNotesStore } from "stores/notes.store";

import {
  getNotesDestinationQuery,
  notesDestinationKey,
  readNotesDestination,
  writeNotesDestination,
} from "./notesDestination";

export function useSyncOpenNoteItem() {
  const openItem = useNotesStore((store) =>
    store.openTabId ? store.noteTabItems[store.openTabId] : null,
  );
  const setOpenItem = useNotesStore((store) => store.openItemTab);
  const switchToTab = useNotesStore((store) => store.switchToTab);
  const [searchParams, setSearchParams] = useSearchParams();
  const previousURL = useRef<string | undefined>(undefined);

  // A changed URL (including Back/Forward) wins. Otherwise an active-tab change
  // writes just our query keys. Recording our own write avoids a feedback loop.
  useEffect(() => {
    const destination = readNotesDestination(searchParams);
    const urlKey = getNotesDestinationQuery(searchParams);
    const first = previousURL.current === undefined;
    const urlChanged = previousURL.current !== urlKey;
    previousURL.current = urlKey;
    if (urlChanged && (!first || searchParams.has("note-type"))) {
      if (
        destination &&
        notesDestinationKey(destination) !== notesDestinationKey(openItem)
      ) {
        setOpenItem({
          type: destination.type,
          id: destination.itemId,
          worldView: destination.worldView,
        });
      } else if (!destination && openItem) {
        switchToTab(null);
      }
      return;
    }
    const next = writeNotesDestination(searchParams, openItem);
    if (next.toString() !== searchParams.toString()) {
      previousURL.current = getNotesDestinationQuery(next);
      setSearchParams(next);
    }
  }, [openItem, searchParams, setSearchParams, setOpenItem, switchToTab]);
}

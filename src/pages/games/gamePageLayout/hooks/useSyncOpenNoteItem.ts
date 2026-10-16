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
  const [searchParams, setSearchParams] = useSearchParams();
  const seenURL = useRef<string | undefined>(undefined);
  const writtenURL = useRef<string | undefined>(undefined);

  // A changed URL (including Back/Forward) that names a destination wins. One
  // that names none, like a link to another character or Back past the first
  // tab we wrote, keeps the open tab and writes it in place of that history
  // entry. Otherwise an active-tab change writes just our query keys. Our own
  // writes land in a later render than the one that made them, and the active
  // tab can change again in between (closing the last tab reopens the default
  // one), so the URL is compared with the one last seen, and a change that is
  // just our write arriving is not navigation.
  useEffect(() => {
    const destination = readNotesDestination(searchParams);
    const urlKey = getNotesDestinationQuery(searchParams);
    const urlChanged =
      seenURL.current === undefined
        ? searchParams.has("note-type")
        : seenURL.current !== urlKey;
    seenURL.current = urlKey;
    const isOwnWrite = urlChanged && writtenURL.current === urlKey;
    if (isOwnWrite) {
      writtenURL.current = undefined;
    }
    const isNavigation = urlChanged && !isOwnWrite;
    if (isNavigation && destination) {
      if (notesDestinationKey(destination) !== notesDestinationKey(openItem)) {
        setOpenItem({
          type: destination.type,
          id: destination.itemId,
          worldView: destination.worldView,
        });
      }
      return;
    }
    const next = writeNotesDestination(searchParams, openItem);
    if (next.toString() !== searchParams.toString()) {
      writtenURL.current = getNotesDestinationQuery(next);
      setSearchParams(next, { replace: isNavigation });
    }
  }, [openItem, searchParams, setSearchParams, setOpenItem]);
}

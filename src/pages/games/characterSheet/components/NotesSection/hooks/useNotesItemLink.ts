import { useCallback } from "react";
import { useLocation } from "react-router";

import type { WorldLinkProps } from "components/worlds/worldNavigation";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";

import { type IOpenNoteItem, useNotesStore } from "stores/notes.store";

export interface NotesItemLinkOptions {
  /** A plain click opens a new tab too, beside the current one. */
  newTab?: boolean;
  /** A background open focuses nothing new when the item is already open. */
  dedupeBackground?: boolean;
}

/**
 * Builds the link props for opening a Notes item: a real link to its
 * address, opened in the current tab, or in a background tab on a modifier
 * or middle click.
 */
export function useNotesItemLink() {
  const location = useLocation();
  const openItemTab = useNotesStore((store) => store.openItemTab);

  return useCallback(
    (item: IOpenNoteItem, options: NotesItemLinkOptions = {}): WorldLinkProps =>
      getNotesItemLinkProps(
        location.pathname,
        new URLSearchParams(location.search),
        item,
        (destination, background) =>
          openItemTab({
            type: destination.type,
            id: destination.itemId,
            worldView: destination.worldView,
            replaceCurrent: !background && !options.newTab,
            openInBackground: background,
            disallowDuplicates: !!options.dedupeBackground && background,
          }),
      ),
    [location.pathname, location.search, openItemTab],
  );
}

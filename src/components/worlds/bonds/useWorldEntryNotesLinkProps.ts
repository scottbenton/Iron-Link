import { useCallback } from "react";
import { useLocation } from "react-router";

import type { NavigationLinkProps } from "components/LinkComponent";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";

import { useNotesStore } from "stores/notes.store";

import { IWorldEntry } from "services/worldEntries.service";

// Link props that open a world entry's page in the game's Notes tab.
export function useWorldEntryNotesLinkProps(
  worldId: string | undefined,
): (entry: IWorldEntry) => NavigationLinkProps | undefined {
  const location = useLocation();
  const openItemTab = useNotesStore((store) => store.openItemTab);
  return useCallback(
    (entry: IWorldEntry) =>
      worldId
        ? getNotesItemLinkProps(
            location.pathname,
            new URLSearchParams(location.search),
            {
              type: "world",
              itemId: worldId,
              worldView: {
                type: "entry",
                categoryId: entry.categoryId,
                entryId: entry.id,
              },
            },
            (item, background) =>
              openItemTab({
                type: item.type,
                id: item.itemId,
                worldView: item.worldView,
                openInBackground: background,
              }),
          )
        : undefined,
    [worldId, location.pathname, location.search, openItemTab],
  );
}

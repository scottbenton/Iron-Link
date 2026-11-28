import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

import { WorldEntryMentionLinksContext } from "components/RichTextEditor/NoteMentionExtension/worldEntryMentionLinks";
import type { WorldView } from "components/worlds/worldNavigation";

import { Progress } from "ui/components/Progress";

import { getNotesItemLinkProps } from "pages/games/gamePageLayout/hooks/notesDestination";

import { useNotesStore } from "stores/notes.store";

import { DefaultNoteChooser } from "./DefaultNoteChooser";
import { NoteTabs } from "./NoteTabs/NoteTabs";
import { useGameWorldId, useListenToGameWorld } from "./hooks/useGameWorld";

export function NotesSection() {
  const { t } = useTranslation();
  // Single owner of the linked world's subscription for everything below.
  useListenToGameWorld();

  const worldId = useGameWorldId();
  const location = useLocation();
  const openItemTab = useNotesStore((store) => store.openItemTab);
  // A world entry mentioned in a note opens in the world's tab, or in a new
  // background tab on a modifier or middle click.
  const getEntryMentionLinkProps = useCallback(
    (view: WorldView) =>
      getNotesItemLinkProps(
        location.pathname,
        new URLSearchParams(location.search),
        { type: "world", itemId: worldId ?? "", worldView: view },
        (item, background) =>
          openItemTab({
            type: item.type,
            id: item.itemId,
            worldView: item.worldView,
            replaceCurrent: !background,
            openInBackground: background,
          }),
      ),
    [location.pathname, location.search, worldId, openItemTab],
  );

  const areBasicNotesLoading = useNotesStore(
    (store) => store.folderState.loading || store.noteState.loading,
  );

  if (areBasicNotesLoading) {
    return <Progress label={t("notes.loading", "Loading notes")} />;
  }

  return (
    <WorldEntryMentionLinksContext.Provider
      value={worldId ? getEntryMentionLinkProps : null}
    >
      <DefaultNoteChooser />
      <NoteTabs />
    </WorldEntryMentionLinksContext.Provider>
  );
}

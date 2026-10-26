import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import type { IWorldEntry } from "services/worldEntries.service";

import { WorldNotesEditor } from "../notes/WorldNotesEditor";

// An entry's collaborative Notes, below its fields, with images stored with
// the entry so they are removed with it.
export function WorldEntryNotes({
  entry,
  canEdit,
  onError,
}: {
  entry: IWorldEntry;
  canEdit: boolean;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const getEntryNotesContent = useWorldEntriesStore(
    (store) => store.getEntryNotesContent,
  );
  const getEntryNotesContentStore = useWorldEntriesStore(
    (store) => store.getEntryNotesContentStore,
  );
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  const { id: entryId, worldId } = entry;

  const load = useCallback(
    () => getEntryNotesContent(entryId).then(({ content }) => content),
    [entryId, getEntryNotesContent],
  );
  const contentStore = useMemo(
    () => getEntryNotesContentStore(entryId),
    [entryId, getEntryNotesContentStore],
  );
  const uploadImage = useCallback(
    (file: File) =>
      uploadEntryImage(worldId, entryId, file).then(({ url }) => url),
    [worldId, entryId, uploadEntryImage],
  );

  return (
    <WorldNotesEditor
      id={entryId}
      heading={t("worlds.entries.notes", "Notes")}
      loadingLabel={t("worlds.entries.notes-loading", "Loading notes")}
      roomPrefix={`world-entry-notes-${worldId}`}
      roomKeySource={{ worldEntryId: entryId }}
      canEdit={canEdit}
      load={load}
      contentStore={contentStore}
      uploadImage={uploadImage}
      loadErrorMessage={t(
        "worlds.entries.notes-load-error",
        "Could not load these notes. Please reopen the entry to try again.",
      )}
      onError={onError}
    />
  );
}

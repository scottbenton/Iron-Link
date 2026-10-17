import { useCallback } from "react";
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
  const updateEntryNotesContent = useWorldEntriesStore(
    (store) => store.updateEntryNotesContent,
  );
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  const { id: entryId, worldId } = entry;

  const load = useCallback(
    () => getEntryNotesContent(entryId).then(({ content }) => content),
    [entryId, getEntryNotesContent],
  );
  const save = useCallback(
    (content: Uint8Array, isBeaconRequest?: boolean) =>
      updateEntryNotesContent(entryId, content, isBeaconRequest),
    [entryId, updateEntryNotesContent],
  );
  const uploadImage = useCallback(
    (file: File) =>
      uploadEntryImage(worldId, entryId, file).then(({ url }) => url),
    [worldId, entryId, uploadEntryImage],
  );

  return (
    <WorldNotesEditor
      id={entryId}
      worldId={worldId}
      roomPrefix={`world-entry-notes-${worldId}`}
      canEdit={canEdit}
      load={load}
      save={save}
      uploadImage={uploadImage}
      loadErrorMessage={t(
        "worlds.entries.notes-load-error",
        "Could not load these notes. Please reopen the entry to try again.",
      )}
      onError={onError}
    />
  );
}

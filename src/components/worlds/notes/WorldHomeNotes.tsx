import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useWorldStore } from "stores/world.store";

import { WorldNotesEditor } from "./WorldNotesEditor";

// The world's own Notes, below the category cards on the world home.
// Everyone who can read the world reads them; owners, editors and Guides
// edit them.
export function WorldHomeNotes({
  worldId,
  canEdit,
  onError,
}: {
  worldId: string;
  canEdit: boolean;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const getWorldNotesContent = useWorldStore(
    (store) => store.getWorldNotesContent,
  );
  const updateWorldNotesContent = useWorldStore(
    (store) => store.updateWorldNotesContent,
  );
  const uploadWorldNotesImage = useWorldStore(
    (store) => store.uploadWorldNotesImage,
  );

  const load = useCallback(
    () => getWorldNotesContent(worldId),
    [worldId, getWorldNotesContent],
  );
  const save = useCallback(
    (content: Uint8Array, isBeaconRequest?: boolean) =>
      updateWorldNotesContent(worldId, content, isBeaconRequest),
    [worldId, updateWorldNotesContent],
  );
  const uploadImage = useCallback(
    (file: File) => uploadWorldNotesImage(worldId, file),
    [worldId, uploadWorldNotesImage],
  );

  return (
    <WorldNotesEditor
      id={worldId}
      worldId={worldId}
      roomPrefix="world-notes"
      canEdit={canEdit}
      load={load}
      save={save}
      uploadImage={uploadImage}
      loadErrorMessage={t(
        "worlds.notes-load-error",
        "Could not load the world's notes. Please reopen the world to try again.",
      )}
      onError={onError}
    />
  );
}

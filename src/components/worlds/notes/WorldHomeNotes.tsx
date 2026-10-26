import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useWorldStore } from "stores/world.store";

import { WorldNotesEditor } from "./WorldNotesEditor";

// The world's Overview (its own Notes document), below the category cards on the world home.
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
  const getWorldNotesContentStore = useWorldStore(
    (store) => store.getWorldNotesContentStore,
  );
  const uploadWorldNotesImage = useWorldStore(
    (store) => store.uploadWorldNotesImage,
  );

  const load = useCallback(
    () => getWorldNotesContent(worldId),
    [worldId, getWorldNotesContent],
  );
  const contentStore = useMemo(
    () => getWorldNotesContentStore(worldId),
    [worldId, getWorldNotesContentStore],
  );
  const uploadImage = useCallback(
    (file: File) => uploadWorldNotesImage(worldId, file),
    [worldId, uploadWorldNotesImage],
  );

  return (
    <WorldNotesEditor
      id={worldId}
      heading={t("worlds.overview", "Overview")}
      loadingLabel={t("worlds.overview-loading", "Loading overview")}
      roomPrefix="world-notes"
      roomKeySource={{ worldId }}
      canEdit={canEdit}
      load={load}
      contentStore={contentStore}
      uploadImage={uploadImage}
      loadErrorMessage={t(
        "worlds.overview-load-error",
        "Could not load the world's overview. Please reopen the world to try again.",
      )}
      onError={onError}
    />
  );
}

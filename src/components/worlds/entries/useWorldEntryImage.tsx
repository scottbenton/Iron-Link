import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

import { IWorldEntry } from "services/worldEntries.service";

// Uploads or removes an entry's portrait. The old file is removed once the
// entry points at the new one. Render `input` wherever the trigger lives.
export function useWorldEntryImage(
  entry: IWorldEntry,
  onError: (cause: unknown) => void,
) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  const deleteEntryImage = useWorldEntriesStore(
    (store) => store.deleteEntryImage,
  );
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);

  const replaceImage = async (filename: string | null) => {
    const previous = entry.imageFilename;
    await updateEntry(entry.id, { imageFilename: filename });
    if (previous) {
      deleteEntryImage(entry.worldId, entry.id, previous).catch(
        () => undefined,
      );
    }
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      onError(
        new Error(
          t(
            "worlds.entries.image-too-large",
            "That image is too large. The largest image you can upload is {{size}}.",
            { size: MAX_FILE_SIZE_LABEL },
          ),
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const { filename } = await uploadEntryImage(
        entry.worldId,
        entry.id,
        file,
      );
      await replaceImage(filename);
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await replaceImage(null);
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(false);
    }
  };

  const input = (
    <input
      ref={inputRef}
      data-testid="world-entry-image-input"
      hidden
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp"
      onChange={(event) => {
        handleFile(event).catch(onError);
      }}
    />
  );

  return {
    busy,
    hasImage: !!entry.imageFilename,
    choose: () => inputRef.current?.click(),
    remove,
    input,
  };
}

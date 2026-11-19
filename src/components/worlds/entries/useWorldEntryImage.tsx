import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import { ImageCrop } from "lib/imageCrop.lib";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

import {
  IWorldEntry,
  WorldEntriesService,
} from "services/worldEntries.service";

import { WorldEntryImageDialog } from "./WorldEntryImageDialog";

const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

// Uploads, crops or removes an entry's portrait. A chosen file opens the
// crop dialog and uploads only when it is saved; the old file is removed once
// the entry points at the new one. Render `input` and `dialog` wherever the
// trigger lives.
export function useWorldEntryImage(
  entry: IWorldEntry,
  onError: (cause: unknown) => void,
) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // The file being cropped before upload, or the stored image being cropped.
  const [cropping, setCropping] = useState<{ file?: File } | null>(null);
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  const deleteEntryImage = useWorldEntriesStore(
    (store) => store.deleteEntryImage,
  );
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);

  const replaceImage = async (
    filename: string | null,
    imageCrop: ImageCrop | null,
  ) => {
    const previous = entry.imageFilename;
    await updateEntry(entry.id, { imageFilename: filename, imageCrop });
    if (previous) {
      deleteEntryImage(entry.worldId, entry.id, previous).catch(
        () => undefined,
      );
    }
  };

  // A dropped file skips the input's accept list, so its type is checked too.
  const takeFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      onError(
        new Error(
          t(
            "worlds.entries.image-wrong-type",
            "That file is not an image you can use. Upload a PNG, JPEG, GIF or WebP image.",
          ),
        ),
      );
      return;
    }
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
    setCropping({ file });
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) takeFile(file);
  };

  const save = async (file: File | undefined, imageCrop: ImageCrop) => {
    setBusy(true);
    try {
      if (file) {
        const { filename } = await uploadEntryImage(
          entry.worldId,
          entry.id,
          file,
        );
        await replaceImage(filename, imageCrop);
      } else {
        await updateEntry(entry.id, { imageCrop });
      }
    } catch (cause) {
      onError(cause);
      throw cause;
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await replaceImage(null, null);
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
      accept={ACCEPTED_IMAGE_TYPES.join(",")}
      onChange={handleFile}
    />
  );

  const croppedImage = !cropping
    ? undefined
    : (cropping.file ??
      (entry.imageFilename
        ? WorldEntriesService.getWorldEntryImageUrl(
            entry.worldId,
            entry.id,
            entry.imageFilename,
          )
        : undefined));
  const dialog = cropping && croppedImage && (
    <WorldEntryImageDialog
      image={croppedImage}
      initialCrop={cropping.file ? null : entry.imageCrop}
      onClose={() => setCropping(null)}
      onSave={(imageCrop) => save(cropping.file, imageCrop)}
    />
  );

  return {
    busy,
    hasImage: !!entry.imageFilename,
    choose: () => inputRef.current?.click(),
    // Starts the same check and crop with a file from elsewhere (a drop).
    takeFile,
    crop: () => setCropping({}),
    dialog,
    remove,
    input,
  };
}

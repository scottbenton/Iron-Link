import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldMapsStore } from "stores/worldMaps.store";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

import { IWorldMap } from "services/worldMaps.service";

// Adds, replaces or removes a map's background image. Render `input`
// anywhere; `choose` opens the file picker.
export function useWorldMapBackgroundUpload(
  map: IWorldMap | null,
  onError: (cause: unknown) => void,
) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const setBackground = useWorldMapsStore((store) => store.setBackground);

  const run = async (file: File | null) => {
    if (!map) return;
    setBusy(true);
    try {
      await setBackground(map, file);
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      onError(
        new Error(
          t(
            "worlds.maps.background.too-large",
            "That image is too large. The largest image you can upload is {{size}}.",
            { size: MAX_FILE_SIZE_LABEL },
          ),
        ),
      );
      return;
    }
    run(file).catch(onError);
  };

  const input = (
    <input
      ref={inputRef}
      data-testid="world-map-background-input"
      hidden
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp"
      onChange={handleFile}
    />
  );

  return {
    input,
    busy,
    choose: () => inputRef.current?.click(),
    remove: () => run(null).catch(onError),
  };
}

import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { ChangeEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

import { IWorldEntry } from "services/worldEntries.service";

// The strip's Image action: upload a portrait for the entry, or remove it.
// The old file is removed once the entry points at the new one.
export function WorldEntryImageAction({
  entry,
  onError,
}: {
  entry: IWorldEntry;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [busy, setBusy] = useState(false);
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  const deleteEntryImage = useWorldEntriesStore(
    (store) => store.deleteEntryImage,
  );
  const updateEntry = useWorldEntriesStore((store) => store.updateEntry);
  const label = t("worlds.entries.image", "Image");

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

  const handleRemove = async () => {
    setAnchor(null);
    setBusy(true);
    try {
      await replaceImage(null);
    } catch (cause) {
      onError(cause);
    } finally {
      setBusy(false);
    }
  };

  const chooseFile = () => {
    setAnchor(null);
    inputRef.current?.click();
  };

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          aria-haspopup={entry.imageFilename ? "menu" : undefined}
          disabled={busy}
          onClick={(event) =>
            entry.imageFilename ? setAnchor(event.currentTarget) : chooseFile()
          }
        >
          <AddPhotoIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        <MenuItem onClick={chooseFile}>
          <ListItemIcon>
            <UploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("worlds.entries.replace-image", "Replace image")}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleRemove()}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("worlds.entries.remove-image", "Remove image")}
          </ListItemText>
        </MenuItem>
      </Menu>
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
    </>
  );
}

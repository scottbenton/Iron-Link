import AddPhotoIcon from "@mui/icons-material/AddPhotoAlternate";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ActionToolbarStrip } from "components/Layout/ActionToolbarStrip";

import { FormattingToolbarItems } from "pages/games/characterSheet/components/NotesSection/NoteView/FormattingToolbarItems";
import { TextTypeDropdown } from "pages/games/characterSheet/components/NotesSection/NoteView/TextTypeDropdown";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

import { IWorldEntry } from "services/worldEntries.service";

// The Notes tab's toolbar for an entry's Notes: the same grey strip, text
// type and formatting, with images stored with the entry so they are removed
// with it. Readers see no toolbar. It pins to the top of the scroller while
// the Notes are on screen, and leaves with them.
export function WorldEntryNotesToolbar({
  editor,
  entry,
  onError,
}: {
  editor: Editor;
  entry: Pick<IWorldEntry, "id" | "worldId">;
  onError: (cause: unknown) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadEntryImage = useWorldEntriesStore(
    (store) => store.uploadEntryImage,
  );
  if (!editor.isEditable) return null;

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
    const { url } = await uploadEntryImage(entry.worldId, entry.id, file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  const imageLabel = t("note.editor-toolbar.upload-image", "Upload Image");
  return (
    <Box
      sx={(theme) => ({
        position: "sticky",
        // Pinned, the strip sits right under the breadcrumbs, where the
        // Notes tab's own strip is; the padding above it scrolls off.
        top: theme.spacing(-1),
        zIndex: 2,
        py: 1,
        bgcolor: "background.paper",
      })}
    >
      <ActionToolbarStrip>
        <TextTypeDropdown editor={editor} />
        <FormattingToolbarItems editor={editor} />
        <Tooltip title={imageLabel} enterDelay={300}>
          <IconButton
            aria-label={imageLabel}
            onClick={() => inputRef.current?.click()}
          >
            <AddPhotoIcon />
          </IconButton>
        </Tooltip>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={(event) => {
            handleFile(event).catch(onError);
          }}
        />
      </ActionToolbarStrip>
    </Box>
  );
}

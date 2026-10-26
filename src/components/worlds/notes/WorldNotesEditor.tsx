import { Alert, Box, Skeleton, Typography } from "@mui/material";
import { Editor as TTEditor } from "@tiptap/react";
import { useEffect, useMemo, useState } from "react";

import { RtcRichTextEditor } from "components/RichTextEditor";

import type { RichTextContentStore } from "services/richTextContent.service";
import type { RoomKeySource } from "services/roomKeys.service";

import { WorldNotesToolbar } from "./WorldNotesToolbar";

export interface WorldNotesEditorProps {
  // The document's id; also names the heading.
  id: string;
  // The section's heading and its loading label.
  heading: string;
  loadingLabel: string;
  // Separates live editing rooms: world Notes and entry Notes never share one.
  roomPrefix: string;
  // Whose key locks the live room.
  roomKeySource: RoomKeySource;
  canEdit: boolean;
  load: () => Promise<Uint8Array>;
  // Where edits are saved, merging with what is stored.
  contentStore: RichTextContentStore;
  uploadImage: (file: File) => Promise<string>;
  loadErrorMessage: string;
  onError: (cause: unknown) => void;
}

// Collaborative Notes for a world or an entry. Edited and saved like a game
// note; people who cannot edit read them with no toolbar, and see nothing at
// all while they are empty.
export function WorldNotesEditor(props: WorldNotesEditorProps) {
  const {
    id,
    heading,
    loadingLabel,
    roomPrefix,
    roomKeySource,
    canEdit,
    load,
    contentStore,
    uploadImage,
    loadErrorMessage,
    onError,
  } = props;
  const [content, setContent] = useState<Uint8Array>();
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setContent(undefined);
    setLoadError(false);
    load()
      .then((loaded) => {
        if (active) setContent(loaded);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [load]);

  // The editor takes a component; keep it stable for this document.
  const Toolbar = useMemo(
    () =>
      function NotesToolbar({ editor }: { editor: TTEditor }) {
        return (
          <WorldNotesToolbar
            editor={editor}
            upload={(file) =>
              uploadImage(file).catch((cause) => {
                onError(cause);
                throw cause;
              })
            }
          />
        );
      },
    [uploadImage, onError],
  );

  if (!canEdit && content && content.length === 0) return null;

  return (
    // Takes the rest of the page, so the whole space below the heading is
    // the text to click into, as in a note in the Notes tab.
    <Box
      component="section"
      aria-labelledby={`${id}-notes`}
      sx={{ flex: "1 0 auto", display: "flex", flexDirection: "column" }}
    >
      <Typography
        id={`${id}-notes`}
        component="h2"
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamilyTitle,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "text.secondary",
          mb: canEdit ? 0 : 1,
        })}
      >
        {heading}
      </Typography>
      {loadError ? (
        <Alert severity="error">{loadErrorMessage}</Alert>
      ) : content ? (
        // Laid out like a note in the Notes tab: the toolbar strip above
        // plain text.
        <Box
          sx={{ flex: "1 0 auto", display: "flex", flexDirection: "column" }}
        >
          <RtcRichTextEditor
            id={id}
            roomPrefix={roomPrefix}
            roomKeySource={roomKeySource}
            initialValue={content}
            contentStore={canEdit ? contentStore : undefined}
            onSaveError={onError}
            Toolbar={Toolbar}
            fill
            minHeight={120}
          />
        </Box>
      ) : (
        <Skeleton
          variant="rounded"
          height={canEdit ? 160 : 48}
          aria-label={loadingLabel}
        />
      )}
    </Box>
  );
}

import { Alert, Box, Skeleton, Typography } from "@mui/material";
import { Editor as TTEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RtcRichTextEditor } from "components/RichTextEditor";

import { WorldNotesToolbar } from "./WorldNotesToolbar";

export interface WorldNotesEditorProps {
  // The document's id; also names the heading.
  id: string;
  worldId: string;
  // Separates live editing rooms: world Notes and entry Notes never share one.
  roomPrefix: string;
  canEdit: boolean;
  load: () => Promise<Uint8Array>;
  save: (content: Uint8Array, isBeaconRequest?: boolean) => Promise<void>;
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
    worldId,
    roomPrefix,
    canEdit,
    load,
    save,
    uploadImage,
    loadErrorMessage,
    onError,
  } = props;
  const { t } = useTranslation();
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

  const handleSave = useCallback(
    (
      _documentId: string,
      document: Uint8Array,
      _text: string,
      isBeaconRequest?: boolean,
    ) => save(document, isBeaconRequest).catch(onError),
    [save, onError],
  );

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
        {t("worlds.entries.notes", "Notes")}
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
            documentPassword={worldId}
            initialValue={content}
            onSave={canEdit ? handleSave : undefined}
            Toolbar={Toolbar}
            fill
            minHeight={120}
          />
        </Box>
      ) : (
        <Skeleton
          variant="rounded"
          height={canEdit ? 160 : 48}
          aria-label={t("worlds.entries.notes-loading", "Loading notes")}
        />
      )}
    </Box>
  );
}

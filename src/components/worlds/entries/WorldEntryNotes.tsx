import { Alert, Box, Skeleton, Typography } from "@mui/material";
import { Editor as TTEditor } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { RtcRichTextEditor } from "components/RichTextEditor";

import { useWorldEntriesStore } from "stores/worldEntries.store";

import type { IWorldEntry } from "services/worldEntries.service";

import { WorldEntryNotesToolbar } from "./WorldEntryNotesToolbar";

// An entry's collaborative Notes, below its fields. Edited and saved like a
// game note; people who cannot edit the entry read it with no toolbar, and
// see nothing at all while it is empty.
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
  const [content, setContent] = useState<Uint8Array>();
  const [loadError, setLoadError] = useState(false);
  const { id: entryId, worldId } = entry;

  useEffect(() => {
    let active = true;
    setContent(undefined);
    setLoadError(false);
    getEntryNotesContent(entryId)
      .then((loaded) => {
        if (active) setContent(loaded.content);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [entryId, getEntryNotesContent]);

  const save = useCallback(
    (
      _documentId: string,
      document: Uint8Array,
      _text: string,
      isBeaconRequest?: boolean,
    ) =>
      updateEntryNotesContent(entryId, document, isBeaconRequest).catch(
        onError,
      ),
    [entryId, updateEntryNotesContent, onError],
  );

  // The editor takes a component; keep it stable for this entry.
  const Toolbar = useMemo(
    () =>
      function EntryNotesToolbar({ editor }: { editor: TTEditor }) {
        return (
          <WorldEntryNotesToolbar
            editor={editor}
            entry={{ id: entryId, worldId }}
            onError={onError}
          />
        );
      },
    [entryId, worldId, onError],
  );

  if (!canEdit && content && content.length === 0) return null;

  return (
    <Box component="section" aria-labelledby={`${entryId}-notes`}>
      <Typography
        id={`${entryId}-notes`}
        component="h2"
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamilyTitle,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "text.secondary",
          mb: 1,
        })}
      >
        {t("worlds.entries.notes", "Notes")}
      </Typography>
      {loadError ? (
        <Alert severity="error">
          {t(
            "worlds.entries.notes-load-error",
            "Could not load these notes. Please reopen the entry to try again.",
          )}
        </Alert>
      ) : content ? (
        // Laid out like a note in the Notes tab: the toolbar strip above
        // plain text, with room to click into while it is empty.
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            "& .ProseMirror": { minHeight: canEdit ? 120 : undefined },
          }}
        >
          <RtcRichTextEditor
            id={entryId}
            roomPrefix={`world-entry-notes-${worldId}`}
            documentPassword={worldId}
            initialValue={content}
            onSave={canEdit ? save : undefined}
            Toolbar={Toolbar}
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

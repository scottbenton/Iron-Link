import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { NOTES_PANE_GUTTER } from "components/Layout/notesPaneGutter";
import { RtcRichTextEditor } from "components/RichTextEditor";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useIsMobile } from "hooks/useIsMobile";

import { useNotesStore } from "stores/notes.store";

import { NoteToolbar } from "../Layout";
import { MobileStickyNoteToolbar } from "./MobileStickyToolbar";
import { NoteViewToolbar } from "./NoteViewToolbar";
import { useNotePermission } from "./useNotePermission";

export interface NoteViewProps {
  openNoteId: string;
}

export function NoteView(props: NoteViewProps) {
  const { openNoteId } = props;
  const { t } = useTranslation();

  const gameId = useGameId();
  const updateNoteContent = useNotesStore((store) => store.updateNoteContent);

  const [noteContent, setNoteContent] = useState<Uint8Array | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const getNoteContent = useNotesStore((store) => store.getNoteContent);
  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(false);
    getNoteContent(openNoteId)
      .then((noteContent) => {
        if (isMounted) {
          setNoteContent(noteContent.content);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [openNoteId, getNoteContent]);

  const notePermissions = useNotePermission(openNoteId);

  const handleSave = useCallback(
    (
      documentId: string,
      notes: Uint8Array,
      noteContentString: string,
      isBeaconRequest?: boolean,
    ) => {
      return updateNoteContent(
        documentId,
        notes,
        noteContentString,
        isBeaconRequest,
      );
    },
    [updateNoteContent],
  );

  const isMobile = useIsMobile();

  if (error) {
    // An unreadable note returns no row, the same as a deleted one.
    return (
      <EmptyState
        message={t(
          "notes.load-error",
          "This note could not be opened. It may have been deleted, or you may not have access to it.",
        )}
      />
    );
  }

  if (!noteContent || loading) {
    return <></>;
  }

  return (
    <>
      <RtcRichTextEditor
        id={openNoteId}
        roomPrefix={`notes-${gameId}-`}
        documentPassword={gameId}
        Toolbar={({ editor }) => (
          <>
            <NoteToolbar>
              {isMobile ? undefined : (
                <>
                  {notePermissions.canEdit ? (
                    <NoteViewToolbar
                      editor={editor}
                      openNoteId={openNoteId}
                      permissions={notePermissions}
                    />
                  ) : undefined}
                </>
              )}
            </NoteToolbar>
            <MobileStickyNoteToolbar
              editor={editor}
              openNoteId={openNoteId}
              permissions={notePermissions}
            />
          </>
        )}
        initialValue={noteContent}
        contentPx={NOTES_PANE_GUTTER}
        onSave={loading || !notePermissions.canEdit ? undefined : handleSave}
      />
    </>
  );
}

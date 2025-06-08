import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "components/Layout/EmptyState";
import { RtcRichTextEditor } from "components/RichTextEditor";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";

import { useIsMobile } from "hooks/useIsMobile";

import { useNotesStore } from "stores/notes.store";

import { NoteSectionToolbar } from "../Layout";
import { MobileStickyNoteToolbar } from "./MobileStickyToolbar";
import { NoteViewToolbar } from "./NoteViewToolbar";
import { useNotePermission } from "./useNotePermission";

export interface NoteViewProps {
  openNoteId: string;
}

export function NoteView(props: NoteViewProps) {
  const { openNoteId } = props;

  const gameId = useGameId();
  const updateNoteContent = useNotesStore((store) => store.updateNoteContent);

  const [noteContent, setNoteContent] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const getNoteContent = useNotesStore((store) => store.getNoteContent);
  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);
    getNoteContent(openNoteId)
      .then((noteContent) => {
        if (isMounted) {
          setNoteContent(noteContent.content);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setError(error);
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
    return <EmptyState message={error} />;
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
            <NoteSectionToolbar>
              {isMobile || !notePermissions.canEdit ? undefined : (
                <NoteViewToolbar
                  editor={editor}
                  openNoteId={openNoteId}
                  permissions={notePermissions}
                />
              )}
            </NoteSectionToolbar>
            <MobileStickyNoteToolbar
              editor={editor}
              openNoteId={openNoteId}
              permissions={notePermissions}
            />
          </>
        )}
        initialValue={noteContent}
        onSave={loading || !notePermissions.canEdit ? undefined : handleSave}
      />
    </>
  );
}

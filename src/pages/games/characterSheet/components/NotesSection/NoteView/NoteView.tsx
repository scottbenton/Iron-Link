import { useEffect, useMemo, useState } from "react";

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

  const gameId = useGameId();
  const getNoteContentStore = useNotesStore(
    (store) => store.getNoteContentStore,
  );

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

  const contentStore = useMemo(
    () => getNoteContentStore(openNoteId),
    [getNoteContentStore, openNoteId],
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
        roomKeySource={{ noteId: openNoteId }}
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
        contentStore={
          loading || !notePermissions.canEdit ? undefined : contentStore
        }
      />
    </>
  );
}

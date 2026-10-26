import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "components/Layout/EmptyState";
import { NOTES_PANE_GUTTER } from "components/Layout/notesPaneGutter";
import {
  RichTextToolbarProps,
  RtcRichTextEditor,
} from "components/RichTextEditor";
import { SecretToolbarItems } from "components/RichTextEditor/secrets/SecretToolbarItems";

import { useGameId } from "pages/games/gamePageLayout/hooks/useGameId";
import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";

import { useIsMobile } from "hooks/useIsMobile";

import { useNotesStore } from "stores/notes.store";

import { NoteToolbar } from "../Layout";
import { MobileStickyNoteToolbar } from "./MobileStickyToolbar";
import { NoteViewToolbar } from "./NoteViewToolbar";
import { getNoteSecretsConfig } from "./noteSecrets";
import { useNotePermission } from "./useNotePermission";

export interface NoteViewProps {
  openNoteId: string;
}

export function NoteView(props: NoteViewProps) {
  const { openNoteId } = props;
  const { t } = useTranslation();

  const gameId = useGameId();
  const getNoteContentStore = useNotesStore(
    (store) => store.getNoteContentStore,
  );

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

  const contentStore = useMemo(
    () => getNoteContentStore(openNoteId),
    [getNoteContentStore, openNoteId],
  );

  const isMobile = useIsMobile();

  const { gameType, gamePermission } = useGamePermissions();
  const readPermissions = useNotesStore(
    (store) => store.noteState.notes[openNoteId]?.readPermissions,
  );
  const secrets = useMemo(
    () =>
      getNoteSecretsConfig({
        gameId,
        noteId: openNoteId,
        gameType,
        gamePermission,
        readPermissions,
      }),
    [gameId, openNoteId, gameType, gamePermission, readPermissions],
  );

  // Stable, so the toolbar isn't remounted while a click is under way.
  const Toolbar = useCallback(
    ({ editor, secrets }: RichTextToolbarProps) => (
      <>
        <NoteToolbar>
          {isMobile ? undefined : (
            <>
              {/* A Guide who can't edit the note may still write its
                  secrets (#254). */}
              {notePermissions.canEdit || secrets?.inSecret ? (
                <NoteViewToolbar
                  editor={editor}
                  openNoteId={openNoteId}
                  permissions={notePermissions}
                  secrets={secrets}
                />
              ) : secrets ? (
                <SecretToolbarItems secrets={secrets} />
              ) : undefined}
            </>
          )}
        </NoteToolbar>
        <MobileStickyNoteToolbar
          editor={editor}
          openNoteId={openNoteId}
          permissions={notePermissions}
          secrets={secrets}
        />
      </>
    ),
    [isMobile, notePermissions, openNoteId],
  );

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
        roomKeySource={{ noteId: openNoteId }}
        secrets={secrets}
        Toolbar={Toolbar}
        initialValue={noteContent}
        contentPx={NOTES_PANE_GUTTER}
        contentStore={
          loading || !notePermissions.canEdit ? undefined : contentStore
        }
      />
    </>
  );
}

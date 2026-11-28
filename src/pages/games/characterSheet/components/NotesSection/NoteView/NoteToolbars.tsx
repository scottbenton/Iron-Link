import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { SecretsToolbarState } from "components/RichTextEditor";

import { useIsMobile } from "ui/hooks/useIsMobile";

import { NoteToolbar } from "../Layout";
import { useNoteItemActions } from "../NoteItemActions";
import { MobileStickyNoteToolbar } from "./MobileStickyToolbar";
import { NoteViewToolbar } from "./NoteViewToolbar";

export interface NoteToolbarsProps {
  openNoteId: string;
  editor: Editor;
  canEdit: boolean;
  secrets?: SecretsToolbarState;
}

// The note's breadcrumbs and toolbar: the full strip on a larger screen, or
// a bar riding on the keyboard on a phone. The actions' dialogs sit outside
// both toolbars, so their fields keep their own arrow keys.
export function NoteToolbars(props: NoteToolbarsProps) {
  const { openNoteId, editor, canEdit, secrets } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { actions, dialogs } = useNoteItemActions({
    type: "note",
    id: openNoteId,
  });
  const showStrip = !isMobile && (canEdit || actions.length > 0);

  return (
    <>
      <NoteToolbar label={t("notes.toolbar.note-label", "Note toolbar")}>
        {showStrip ? (
          <NoteViewToolbar
            editor={editor}
            openNoteId={openNoteId}
            canEdit={canEdit}
            actions={actions}
            secrets={secrets}
          />
        ) : undefined}
      </NoteToolbar>
      {isMobile && (
        <MobileStickyNoteToolbar
          editor={editor}
          openNoteId={openNoteId}
          actions={actions}
          secrets={secrets}
        />
      )}
      {dialogs}
    </>
  );
}

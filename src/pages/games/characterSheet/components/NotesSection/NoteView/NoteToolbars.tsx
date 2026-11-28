import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { SecretsToolbarState } from "components/RichTextEditor";

import { useIsMobile } from "ui/hooks/useIsMobile";
import { Flex } from "ui/primitives";

import { NoteToolbar } from "../Layout";
import { useNoteItemActions } from "../NoteItemActions";
import { MobileStickyNoteToolbar } from "./MobileStickyToolbar";
import { NoteActionsMenu } from "./NoteActionsMenu";
import { NoteViewToolbar } from "./NoteViewToolbar";

export interface NoteToolbarsProps {
  openNoteId: string;
  editor: Editor;
  canEdit: boolean;
  secrets?: SecretsToolbarState;
}

// The note's breadcrumbs and toolbar. On a larger screen the strip holds the
// editing controls and the note's actions; on a phone it holds only the
// actions, and the editing controls ride on the keyboard while editing. The
// actions' dialogs sit outside both toolbars, so their fields keep their own
// arrow keys.
export function NoteToolbars(props: NoteToolbarsProps) {
  const { openNoteId, editor, canEdit, secrets } = props;
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { actions, dialogs } = useNoteItemActions({
    type: "note",
    id: openNoteId,
  });
  const hasActions = actions.length > 0;

  let strip;
  if (!isMobile && (canEdit || hasActions)) {
    strip = (
      <NoteViewToolbar
        editor={editor}
        openNoteId={openNoteId}
        canEdit={canEdit}
        actions={actions}
        secrets={secrets}
      />
    );
  } else if (isMobile && hasActions) {
    strip = (
      <Flex flexGrow={1} justifyContent="flex-end">
        <NoteActionsMenu actions={actions} />
      </Flex>
    );
  }

  return (
    <>
      <NoteToolbar label={t("notes.toolbar.note-label", "Note toolbar")}>
        {strip}
      </NoteToolbar>
      <MobileStickyNoteToolbar
        editor={editor}
        openNoteId={openNoteId}
        canEdit={canEdit}
        secrets={secrets}
      />
      {dialogs}
    </>
  );
}

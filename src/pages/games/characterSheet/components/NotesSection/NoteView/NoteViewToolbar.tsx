import { Editor } from "@tiptap/react";

import { SecretsToolbarState } from "components/RichTextEditor";
import { EditorToolbarControls } from "components/RichTextEditor/toolbar";

import { Box } from "ui/primitives";

import { useNotesStore } from "stores/notes.store";

import { NoteItemAction } from "../NoteItemActions";
import { NoteActionsMenu } from "./NoteActionsMenu";

export interface NoteViewToolbarProps {
  openNoteId: string;
  editor: Editor;
  canEdit: boolean;
  actions: NoteItemAction[];
  secrets?: SecretsToolbarState;
}

// A note's editing controls on a larger screen, with the note's own actions
// at the far end of the strip. Rendered inside the note's ActionToolbar.
export function NoteViewToolbar(props: NoteViewToolbarProps) {
  const { openNoteId, editor, canEdit, actions, secrets } = props;
  const uploadNoteImage = useNotesStore((store) => store.uploadNoteImage);

  return (
    <>
      {canEdit && (
        <EditorToolbarControls
          editor={editor}
          upload={(file) => uploadNoteImage(openNoteId, file)}
          secrets={secrets}
        />
      )}
      <Box flex="1" aria-hidden />
      <NoteActionsMenu actions={actions} />
    </>
  );
}

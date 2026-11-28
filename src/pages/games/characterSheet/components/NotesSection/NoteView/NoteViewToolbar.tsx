import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { SecretsToolbarState } from "components/RichTextEditor";
import { EditorToolbarControls } from "components/RichTextEditor/toolbar";

import { Toolbar } from "ui/components/Toolbar";
import { Flex } from "ui/primitives";

import { useNotesStore } from "stores/notes.store";

import { NoteToolbarActionsMenu } from "./NoteToolbarActionsMenu";
import { NotePermissions } from "./useNotePermission";

export interface NoteToolbarContentProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
  secrets?: SecretsToolbarState;
}

// A note's editing controls on a larger screen, with the note's own actions
// at the far end of the strip.
export function NoteViewToolbar(props: NoteToolbarContentProps) {
  const { openNoteId, editor, permissions, secrets } = props;
  const { t } = useTranslation();
  const uploadNoteImage = useNotesStore((store) => store.uploadNoteImage);

  return (
    <Flex alignItems="center" flexGrow={1} gap="2">
      <Toolbar
        variant="plain"
        aria-label={t("note.editor-toolbar.label", "Formatting")}
        css={{ flexWrap: "nowrap" }}
      >
        <EditorToolbarControls
          editor={editor}
          upload={(file) => uploadNoteImage(openNoteId, file)}
          secrets={secrets}
        />
      </Toolbar>
      <Flex flexGrow={1} justifyContent="flex-end" alignItems="center">
        <NoteToolbarActionsMenu
          openNoteId={openNoteId}
          permissions={permissions}
        />
      </Flex>
    </Flex>
  );
}

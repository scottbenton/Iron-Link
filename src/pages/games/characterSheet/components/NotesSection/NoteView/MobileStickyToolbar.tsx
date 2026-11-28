import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { SecretsToolbarState } from "components/RichTextEditor";
import {
  EditorToolbarControls,
  MobileKeyboardToolbar,
} from "components/RichTextEditor/toolbar";

import { ToolbarButton, ToolbarSeparator } from "ui/components/Toolbar";
import { useIsMobile } from "ui/hooks/useIsMobile";
import { ArrowLeftIcon } from "ui/icons";

import { useNotesStore } from "stores/notes.store";

import { NoteToolbarActionsMenu } from "./NoteToolbarActionsMenu";
import { NotePermissions } from "./useNotePermission";

export interface MobileStickyNoteToolbarProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
  secrets?: SecretsToolbarState;
}

// A note's toolbar on a phone, riding on the keyboard: back to the note's
// folder, the editing controls, then the note's own actions.
export function MobileStickyNoteToolbar(props: MobileStickyNoteToolbarProps) {
  const { openNoteId, editor, permissions, secrets } = props;

  const { t } = useTranslation();

  const parentFolder = useNotesStore((store) => {
    const currentNote = store.noteState.notes[openNoteId];
    if (!currentNote) {
      return undefined;
    }
    return store.folderState.folders[currentNote.parentFolderId];
  });
  const setOpenNoteItem = useNotesStore((store) => store.openItemTab);
  const uploadNoteImage = useNotesStore((store) => store.uploadNoteImage);

  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }
  return (
    <MobileKeyboardToolbar label={t("note.editor-toolbar.label", "Formatting")}>
      <ToolbarButton
        label={t("notes.editor-toolbar.mobile.go-back", "Back to Folder")}
        icon={<ArrowLeftIcon />}
        onClick={() =>
          parentFolder &&
          setOpenNoteItem({ type: "folder", id: parentFolder.id })
        }
      />
      <ToolbarSeparator />
      <EditorToolbarControls
        editor={editor}
        upload={(file) => uploadNoteImage(openNoteId, file)}
        secrets={secrets}
        compact
      />
      <NoteToolbarActionsMenu
        openNoteId={openNoteId}
        permissions={permissions}
      />
    </MobileKeyboardToolbar>
  );
}

import FolderIcon from "@mui/icons-material/ArrowBack";
import { IconButton, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { SecretsToolbarState } from "components/RichTextEditor";

import { useIsMobile } from "hooks/useIsMobile";

import { useNotesStore } from "stores/notes.store";

import { CommonToolbarItems } from "./CommonToolbarItems";
import { MobileKeyboardToolbar } from "./MobileKeyboardToolbar";
import { TextTypeMenu } from "./TextTypeMenu";
import { NotePermissions } from "./useNotePermission";

export interface MobileStickyNoteToolbarProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
  secrets?: SecretsToolbarState;
}

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

  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }
  return (
    <>
      <MobileKeyboardToolbar>
        <Tooltip
          title={t("notes.editor-toolbar.mobile.go-back", "Back to Folder")}
        >
          <IconButton
            onClick={() =>
              parentFolder &&
              setOpenNoteItem({ type: "folder", id: parentFolder.id })
            }
          >
            <FolderIcon />
          </IconButton>
        </Tooltip>
        <TextTypeMenu editor={editor} />
        <CommonToolbarItems
          editor={editor}
          openNoteId={openNoteId}
          permissions={permissions}
          secrets={secrets}
          hideBorders
        />
      </MobileKeyboardToolbar>
    </>
  );
}

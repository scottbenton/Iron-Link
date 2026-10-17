import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";

import { useNotesStore } from "stores/notes.store";

import { FormattingToolbarItems } from "./FormattingToolbarItems";
import { NoteToolbarActionsMenu } from "./NoteToolbarActionsMenu";
import { UploadImageButton } from "./UploadImageButton";
import { NotePermissions } from "./useNotePermission";

export interface CommonToolbarItemsProps {
  editor: Editor;
  openNoteId: string;
  permissions: NotePermissions;
  hideBorders?: boolean;
}

export function CommonToolbarItems(props: CommonToolbarItemsProps) {
  const { editor, openNoteId, permissions, hideBorders } = props;
  const uploadNoteImage = useNotesStore((store) => store.uploadNoteImage);

  return (
    <>
      <FormattingToolbarItems editor={editor} hideBorders={hideBorders} />
      <UploadImageButton
        editor={editor}
        upload={(file) => uploadNoteImage(openNoteId, file)}
      />
      <Box
        flexGrow={1}
        display="flex"
        justifyContent={"flex-end"}
        alignItems="center"
      >
        <NoteToolbarActionsMenu
          openNoteId={openNoteId}
          permissions={permissions}
        />
      </Box>
    </>
  );
}

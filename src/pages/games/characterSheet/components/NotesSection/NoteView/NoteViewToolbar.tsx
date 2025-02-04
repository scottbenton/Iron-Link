import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";

import { CommonToolbarItems } from "./CommonToolbarItems";
import { TextTypeDropdown } from "./TextTypeDropdown";
import { NotePermissions } from "./useNotePermission";

export interface NoteToolbarContentProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
}

export function NoteViewToolbar(props: NoteToolbarContentProps) {
  const { openNoteId, editor, permissions } = props;

  return (
    <>
      <Box display={"flex"} alignItems={"center"} flexGrow={1} gap={1}>
        <TextTypeDropdown editor={editor} />
        <CommonToolbarItems
          editor={editor}
          openNoteId={openNoteId}
          permissions={permissions}
        />
      </Box>
    </>
  );
}

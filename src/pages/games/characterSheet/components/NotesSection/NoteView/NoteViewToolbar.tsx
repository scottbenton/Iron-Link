import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";

import { SecretsToolbarState } from "components/RichTextEditor";

import { CommonToolbarItems } from "./CommonToolbarItems";
import { TextTypeDropdown } from "./TextTypeDropdown";
import { NotePermissions } from "./useNotePermission";

export interface NoteToolbarContentProps {
  openNoteId: string;
  editor: Editor;
  permissions: NotePermissions;
  secrets?: SecretsToolbarState;
}

export function NoteViewToolbar(props: NoteToolbarContentProps) {
  const { openNoteId, editor, permissions, secrets } = props;

  return (
    <>
      <Box display={"flex"} alignItems={"center"} flexGrow={1} gap={1}>
        <TextTypeDropdown editor={editor} />
        <CommonToolbarItems
          editor={editor}
          openNoteId={openNoteId}
          permissions={permissions}
          secrets={secrets}
        />
      </Box>
    </>
  );
}

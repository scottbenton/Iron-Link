import { Box } from "@mui/material";
import { Editor } from "@tiptap/react";

import { SecretsToolbarState } from "components/RichTextEditor";
import { SecretToolbarItems } from "components/RichTextEditor/secrets/SecretToolbarItems";

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
  secrets?: SecretsToolbarState;
}

export function CommonToolbarItems(props: CommonToolbarItemsProps) {
  const { editor, openNoteId, permissions, hideBorders, secrets } = props;
  const uploadNoteImage = useNotesStore((store) => store.uploadNoteImage);

  return (
    <>
      <FormattingToolbarItems editor={editor} hideBorders={hideBorders} />
      <UploadImageButton
        editor={editor}
        upload={(file) =>
          secrets?.inSecret
            ? secrets.uploadImage(file)
            : uploadNoteImage(openNoteId, file)
        }
      />
      {secrets && <SecretToolbarItems secrets={secrets} />}
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

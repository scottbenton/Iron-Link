import { Box, ToggleButtonGroup } from "@mui/material";
import { Editor } from "@tiptap/react";

import { SecretsToolbarState } from "components/RichTextEditor";
import {
  InsertSecretButton,
  MakeSecretButton,
} from "components/RichTextEditor/secrets/SecretToolbarItems";

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
  const sx = hideBorders ? { border: "none" } : undefined;

  return (
    <>
      <FormattingToolbarItems editor={editor} hideBorders={hideBorders} />
      <ToggleButtonGroup>
        <UploadImageButton
          editor={editor}
          upload={(file) =>
            secrets?.inSecret
              ? secrets.uploadImage(file)
              : uploadNoteImage(openNoteId, file)
          }
          sx={sx}
        />
        {secrets?.canInsert && <InsertSecretButton secrets={secrets} sx={sx} />}
        {secrets?.canMakeSecret && (
          <MakeSecretButton secrets={secrets} sx={sx} />
        )}
      </ToggleButtonGroup>
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

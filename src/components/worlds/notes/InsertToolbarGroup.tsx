import { SxProps, Theme, ToggleButtonGroup } from "@mui/material";
import { Editor } from "@tiptap/react";

import type { SecretsToolbarState } from "components/RichTextEditor";
import {
  InsertSecretButton,
  MakeSecretButton,
} from "components/RichTextEditor/secrets/SecretToolbarItems";

import { UploadImageButton } from "pages/games/characterSheet/components/NotesSection/NoteView/UploadImageButton";

const NOTES_IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp";

export interface InsertToolbarGroupProps {
  editor: Editor;
  upload: (file: File) => Promise<string>;
  secrets?: SecretsToolbarState;
  sx?: SxProps<Theme>;
}

// Upload image and the secret buttons, as one group like the formatting
// ones. Upload needs the caret, so readers get only what secrets allow.
export function InsertToolbarGroup(props: InsertToolbarGroupProps) {
  const { editor, upload, secrets, sx } = props;

  if (!editor.isEditable && !secrets?.canInsert) return null;
  return (
    <ToggleButtonGroup>
      {editor.isEditable && (
        <UploadImageButton
          editor={editor}
          upload={upload}
          accept={NOTES_IMAGE_TYPES}
          sx={sx}
        />
      )}
      {secrets?.canInsert && <InsertSecretButton secrets={secrets} sx={sx} />}
      {secrets?.canMakeSecret && <MakeSecretButton secrets={secrets} sx={sx} />}
    </ToggleButtonGroup>
  );
}

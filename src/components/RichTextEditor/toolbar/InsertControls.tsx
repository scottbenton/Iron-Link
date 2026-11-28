import type { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";

import { ToolbarGroup } from "ui/components/Toolbar";

import type { SecretsToolbarState } from "../richTextToolbar";
import {
  InsertSecretButton,
  MakeSecretButton,
} from "../secrets/SecretToolbarItems";
import { UploadImageButton } from "./UploadImageButton";

export interface InsertControlsProps {
  editor: Editor;
  /** Stores an image where the note's owner keeps them; see UploadImageButton. */
  upload: (file: File) => Promise<string>;
  secrets?: SecretsToolbarState;
}

/**
 * Upload image and, for Guides, the secret buttons. Upload needs the
 * caret, so a note being read offers only what secrets allow.
 */
export function InsertControls(props: InsertControlsProps) {
  const { editor, upload, secrets } = props;
  const { t } = useTranslation();

  const canUpload = editor.isEditable;
  if (!canUpload && !secrets?.canInsert && !secrets?.canMakeSecret) {
    return null;
  }
  return (
    <ToolbarGroup aria-label={t("note.editor-toolbar.insert", "Insert")}>
      {canUpload && (
        <UploadImageButton
          editor={editor}
          // An image inside a secret goes to private storage.
          upload={(file) =>
            secrets?.inSecret ? secrets.uploadImage(file) : upload(file)
          }
        />
      )}
      {secrets?.canInsert && <InsertSecretButton secrets={secrets} />}
      {secrets?.canMakeSecret && <MakeSecretButton secrets={secrets} />}
    </ToolbarGroup>
  );
}

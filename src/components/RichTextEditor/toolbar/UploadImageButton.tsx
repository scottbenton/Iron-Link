import type { Editor } from "@tiptap/react";
import { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";

import { ToolbarButton } from "ui/components/Toolbar";
import { ImageSquareIcon } from "ui/icons";

import { useSnackbar } from "providers/SnackbarProvider";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

/** The image types Notes take. */
export const NOTES_IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp";

export interface UploadImageButtonProps {
  editor: Editor;
  /**
   * Stores the image and resolves with its URL. Rejections are the
   * caller's to report.
   */
  upload: (file: File) => Promise<string>;
  accept?: string;
}

/** Picks an image file, stores it and puts it at the caret. */
export function UploadImageButton(props: UploadImageButtonProps) {
  const { editor, upload, accept = NOTES_IMAGE_TYPES } = props;
  const { t } = useTranslation();
  const { error } = useSnackbar();
  const input = useRef<HTMLInputElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    // Cleared, so choosing the same file again still uploads it.
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      error(
        t(
          "note.editor-toolbar.upload-image-too-large",
          "File is too large. The max file size is {{size}}.",
          { size: MAX_FILE_SIZE_LABEL },
        ),
      );
      return;
    }
    upload(file)
      .then((src) => {
        editor.chain().focus().setImage({ src }).run();
      })
      .catch(() => {});
  };

  return (
    <>
      <ToolbarButton
        label={t("note.editor-toolbar.upload-image", "Upload Image")}
        icon={<ImageSquareIcon />}
        onClick={() => input.current?.click()}
      />
      <input
        ref={input}
        hidden
        type="file"
        accept={accept}
        onChange={handleChange}
      />
    </>
  );
}

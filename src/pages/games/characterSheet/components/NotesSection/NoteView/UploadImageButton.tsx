import UploadIcon from "@mui/icons-material/AddPhotoAlternate";
import { SxProps, Theme, ToggleButton, Tooltip } from "@mui/material";
import { Editor } from "@tiptap/react";
import { ChangeEventHandler, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

export interface UploadImageButtonProps {
  editor: Editor;
  // Stores the image and resolves with its URL. Rejections are the caller's
  // to report.
  upload: (file: File) => Promise<string>;
  accept?: string;
  sx?: SxProps<Theme>;
}

export function UploadImageButton(props: UploadImageButtonProps) {
  const { editor, upload, accept = "image/*", sx } = props;

  const { t } = useTranslation();

  const imageInputRef = useRef<HTMLInputElement>(null);

  const { error } = useSnackbar();
  const handleFileInputChange: ChangeEventHandler<HTMLInputElement> = (evt) => {
    const files = evt.currentTarget.files;

    if (files && files.length > 0) {
      if (files[0].size > MAX_FILE_SIZE) {
        error(
          `File is too large. The max file size is ${MAX_FILE_SIZE_LABEL}.`,
        );
        evt.target.value = "";
        return;
      }
      upload(files[0])
        .then((url) => {
          try {
            editor.commands.setImage({ src: url });
          } catch (e) {
            console.error(e);
          }
        })
        .catch(() => {});
      // handle file upload
    }
  };

  return (
    <>
      <Tooltip
        title={t("note.editor-toolbar.upload-image", "Upload Image")}
        enterDelay={300}
      >
        <ToggleButton
          size="small"
          value="upload image"
          // An action, not an on/off state.
          aria-pressed={undefined}
          sx={sx}
          aria-label={t("note.editor-toolbar.upload-image", "Upload Image")}
          onClick={() => {
            if (imageInputRef.current) {
              imageInputRef.current.click();
            }
          }}
        >
          <UploadIcon />
        </ToggleButton>
      </Tooltip>
      <input
        ref={imageInputRef}
        hidden
        accept={accept}
        type="file"
        onChange={handleFileInputChange}
      />
    </>
  );
}

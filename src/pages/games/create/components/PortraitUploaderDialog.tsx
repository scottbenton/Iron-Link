import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ImageCropper } from "components/ImageCropper";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "ui/components/Dialog";
import { toast } from "ui/components/Toast";
import { ImageSquareIcon } from "ui/icons";
import { Stack } from "ui/primitives";

import { DEFAULT_IMAGE_CROP, ImageCrop } from "lib/imageCrop.lib";

import {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LABEL,
} from "repositories/storage.repository";

export interface PortraitUploaderDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (image: File, crop: ImageCrop) => void;
  /** The portrait already chosen, to crop again or replace. */
  initialImage?: File;
  initialCrop?: ImageCrop;
}

// Chooses an image for a new character's portrait and the part of it to
// show. Remount it (a new key) to start from the current portrait again.
export function PortraitUploaderDialog(props: PortraitUploaderDialogProps) {
  const { open, onClose, onUpload, initialImage, initialCrop } = props;
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | undefined>(initialImage);
  const [crop, setCrop] = useState<ImageCrop>(
    initialCrop ?? DEFAULT_IMAGE_CROP,
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!chosen) return;
    if (chosen.size > MAX_FILE_SIZE) {
      toast.error(
        t(
          "character.portrait-upload.too-large",
          "File is too large. The max file size is {{size}}.",
          { size: MAX_FILE_SIZE_LABEL },
        ),
      );
      return;
    }
    setFile(chosen);
    setCrop(DEFAULT_IMAGE_CROP);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    onUpload(file, crop);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} onSubmit={handleSubmit} size="xs">
      <DialogHeader
        title={t("character.portrait-upload.title", "Character Portrait")}
      />
      <DialogBody>
        <Stack gap="4" alignItems="center">
          <input
            ref={inputRef}
            hidden
            accept="image/*"
            type="file"
            onChange={handleFileChange}
          />
          <Button
            startIcon={<ImageSquareIcon />}
            onClick={() => inputRef.current?.click()}
          >
            {file
              ? t("character.portrait-upload.change-image", "Change Image")
              : t("character.portrait-upload.choose-image", "Choose Image")}
          </Button>
          {file && <ImageCropper image={file} crop={crop} onChange={setCrop} />}
        </Stack>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="primary" type="submit" disabled={!file}>
          {t("character.portrait-upload.upload", "Upload")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

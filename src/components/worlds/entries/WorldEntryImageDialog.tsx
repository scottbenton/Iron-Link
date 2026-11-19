import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
} from "@mui/material";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

import { DialogTitleWithCloseButton } from "components/DialogTitleWithCloseButton";
import { ImageCropper } from "components/ImageCropper";

import { getDialogFormSlotProps } from "lib/dialogForm.lib";
import { DEFAULT_IMAGE_CROP, ImageCrop } from "lib/imageCrop.lib";

// Chooses the part of an entry's image its icon shows, for a new upload or
// the stored image. The file itself is never cropped. Mount it to open it.
export function WorldEntryImageDialog({
  image,
  initialCrop,
  onClose,
  onSave,
}: {
  image: File | string;
  initialCrop: ImageCrop | null;
  onClose: () => void;
  // Resolves once saved; rejects (having said why) to keep the dialog open.
  onSave: (crop: ImageCrop) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState(initialCrop ?? DEFAULT_IMAGE_CROP);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave(crop);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      slotProps={getDialogFormSlotProps(handleSubmit)}
    >
      <DialogTitleWithCloseButton onClose={onClose}>
        {t("worlds.entries.crop-image-title", "Crop image")}
      </DialogTitleWithCloseButton>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <ImageCropper image={image} crop={crop} onChange={setCrop} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? t("common.saving", "Saving") : t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

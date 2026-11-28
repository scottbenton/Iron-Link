import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogHeader,
} from "ui/components/Dialog";
import { TextField } from "ui/components/TextField";
import { Stack } from "ui/primitives";

export interface AltTextDialogProps {
  open: boolean;
  altText: string;
  onClose: () => void;
  onSave: (altText: string) => void;
}

/** Edits an image's alt text. Each opening starts from the saved text. */
export function AltTextDialog(props: AltTextDialogProps) {
  const { open, altText, onClose, onSave } = props;
  const { t } = useTranslation();

  const [draft, setDraft] = useState(altText);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(altText);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onSubmit={() => {
        onSave(draft);
        onClose();
      }}
    >
      <DialogHeader title={t("notes.image-node.alt-text", "Alt Text")} />
      <DialogBody>
        <Stack gap="4">
          <DialogDescription>
            {t(
              "notes.image-node.alt-text-description",
              'Alt text is used for screen readers and search engines to better understand the content of your image. For example, "A burly woman with a longsword and tattoos", or "An androgynous scoundrel with a laser pistol"',
            )}
          </DialogDescription>
          <TextField
            label={t("notes.image-node.alt-text", "Alt Text")}
            value={draft}
            onValueChange={setDraft}
          />
        </Stack>
      </DialogBody>
      <DialogActions>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button variant="primary" type="submit">
          {t("common.save", "Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
